import { useEffect, useRef } from 'react';
import { useMotion } from '../motion.js';
import WorldAtmosphere from '../components/WorldAtmosphere.jsx';

const IMAGE_URL = import.meta.env.BASE_URL + 'world/sunset-world-hd.webp';
const DESTINATIONS = {
  research: { focus: [0.35, 0.51], label: [0.31, 0.45] },
  projects: { focus: [0.61, 0.35], label: [0.61, 0.25] },
  creative: { focus: [0.86, 0.39], label: [0.87, 0.31] },
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ease = (value) => value * value * value * (value * (value * 6 - 15) + 10);
const interpolate = (from, to, amount) => ({
  x: from.x + (to.x - from.x) * amount,
  y: from.y + (to.y - from.y) * amount,
  scale: from.scale + (to.scale - from.scale) * amount,
});

// The original illustration is one persistent node. Navigation moves its camera without
// replacing the scene, and the available native pixels bound every close-up.
export default function IllustratedWorld({ section, onTravelState, onProjection, onUnavailable }) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const imageRef = useRef(null);
  const engineRef = useRef(null);
  const motion = useMotion();
  const latest = useRef(null);
  latest.current = { section: section || '', onTravelState, onProjection, onUnavailable, motion };

  useEffect(() => {
    const mount = mountRef.current;
    const camera = cameraRef.current;
    const image = imageRef.current;
    let disposed = false;
    let failed = false;
    let ready = false;
    let decoding = false;
    let layout = null;
    let current = null;
    let flight = null;
    let currentSection = null;
    let wantedSection = latest.current.section;
    let frame = 0;
    let lastProjection = -1;
    let lastTravelEvent = '';
    let loadTimeout = 0;

    camera.style.transformOrigin = '0 0';
    camera.style.transition = 'none';
    camera.style.visibility = 'hidden';
    mount.dataset.imageState = 'loading';

    const reportTravel = (id, state) => {
      mount.dataset.cameraState = state;
      mount.dataset.destination = id || 'world';
      const eventKey = id + ':' + state;
      if (lastTravelEvent !== eventKey) {
        lastTravelEvent = eventKey;
        latest.current.onTravelState?.({ section: id, state });
      }
    };
    const applyTransform = () => {
      if (!layout || !current) return;
      // Resize the image's layout box so the browser samples native pixels at
      // the displayed size, instead of stretching a cached composited layer.
      camera.style.width = layout.imageWidth * current.scale + 'px';
      camera.style.height = layout.imageHeight * current.scale + 'px';
      camera.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      mount.dataset.zoom = current.scale.toFixed(4);
      mount.dataset.zoomLimit = layout.zoomLimit.toFixed(4);
      mount.dataset.pixelBudget = layout.pixelBudget.toFixed(4);
    };
    const projectLabels = () => {
      if (!layout || !current) return;
      const projected = {};
      for (const [id, destination] of Object.entries(DESTINATIONS)) {
        const anchorX = current.x + destination.label[0] * layout.imageWidth * current.scale;
        const labelPadding = Math.min(57, layout.width / 2);
        const x = layout.portrait ? clamp(anchorX, labelPadding, layout.width - labelPadding) : anchorX;
        const y = current.y + destination.label[1] * layout.imageHeight * current.scale;
        projected[id] = { x, y, visible: anchorX > 12 && anchorX < layout.width - 12 && y > 12 && y < layout.height - 12 };
      }
      latest.current.onProjection?.(projected);
    };
    const homeTransform = () => ({
      x: (layout.width - layout.imageWidth) / 2,
      y: (layout.height - layout.imageHeight) / 2,
      scale: 1,
    });
    const targetTransform = (id) => {
      const destination = DESTINATIONS[id];
      if (!destination) return homeTransform();
      const scale = layout.zoomLimit;
      const width = layout.imageWidth * scale;
      const height = layout.imageHeight * scale;
      let x = layout.width * 0.5 - destination.focus[0] * width;
      let y = layout.height * 0.3 - destination.focus[1] * height;
      // Keep image boundaries outside the viewport whenever its pixel budget
      // allows it. A contained portrait composition may retain sky around it.
      if (width >= layout.width) x = clamp(x, layout.width - width, 0);
      if (height >= layout.height) y = clamp(y, layout.height - height, 0);
      return { x, y, scale };
    };
    const arrive = (id) => {
      flight = null;
      currentSection = id;
      reportTravel(id, 'arrived');
      projectLabels();
    };
    const animate = (now) => {
      frame = 0;
      if (disposed || failed || !flight) return;
      const journey = flight;
      const progress = latest.current.motion === 'reduced' ? 1 : clamp((now - journey.started) / journey.duration, 0, 1);
      current = interpolate(journey.from, journey.to, ease(progress));
      applyTransform();
      if (now - lastProjection > 80) { projectLabels(); lastProjection = now; }
      if (progress === 1) arrive(journey.section);
      else frame = requestAnimationFrame(animate);
    };
    const beginTravel = (id, duration = 1600) => {
      if (!ready || !layout || failed || disposed) return;
      cancelAnimationFrame(frame);
      frame = 0;
      const target = targetTransform(id);
      const distance = Math.abs(current.x - target.x) + Math.abs(current.y - target.y) + Math.abs(current.scale - target.scale) * 100;
      if (latest.current.motion === 'reduced' || distance < 0.1) {
        current = target;
        applyTransform();
        arrive(id);
        return;
      }
      flight = { section: id, from: { ...current }, to: target, started: performance.now(), duration };
      reportTravel(id, 'travelling');
      frame = requestAnimationFrame(animate);
    };
    const request = (id) => {
      wantedSection = id;
      if (disposed) return;
      if (failed) { reportTravel(id, 'arrived'); return; }
      if (!ready) { reportTravel(id, 'travelling'); return; }
      if (flight?.section === id) return;
      if (currentSection === id && !flight) { reportTravel(id, 'arrived'); return; }
      beginTravel(id);
    };
    const measure = () => {
      if (!ready || failed || disposed) return;
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const dpr = window.devicePixelRatio || 1;
      if (layout && width === layout.width && height === layout.height && dpr === layout.dpr) return;
      const portrait = width <= 700;
      const fit = portrait
        ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
        : Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const imageWidth = image.naturalWidth * fit;
      const imageHeight = image.naturalHeight * fit;
      const pixelBudget = image.naturalWidth / (imageWidth * dpr);
      const zoomLimit = Math.max(1, Math.min(portrait ? 3 : 2.2, pixelBudget));
      const previousLayout = layout;
      layout = { width, height, imageWidth, imageHeight, dpr, portrait, pixelBudget, zoomLimit };
      mount.dataset.imageFit = portrait ? 'contain' : 'cover';
      if (!current) {
        current = homeTransform();
        applyTransform();
        projectLabels();
      } else if (flight) {
        const remaining = Math.max(160, flight.duration - (performance.now() - flight.started));
        current = {
          x: current.x * width / previousLayout.width,
          y: current.y * height / previousLayout.height,
          scale: Math.min(current.scale, zoomLimit),
        };
        applyTransform();
        beginTravel(wantedSection, remaining);
      } else {
        current = targetTransform(wantedSection);
        applyTransform();
        projectLabels();
      }
    };
    const unavailable = () => {
      if (disposed || failed) return;
      failed = true;
      ready = false;
      flight = null;
      cancelAnimationFrame(frame);
      clearTimeout(loadTimeout);
      camera.style.visibility = 'hidden';
      mount.dataset.imageState = 'unavailable';
      latest.current.onUnavailable?.(true);
      reportTravel(latest.current.section, 'arrived');
    };
    const loaded = async () => {
      if (disposed || failed || ready || decoding || !image.naturalWidth) return;
      decoding = true;
      // Waiting for decoded pixels prevents an empty or low-detail first frame
      // from being reported as a completed entrance on cached/direct links.
      try { await image.decode?.(); } catch { /* A successful load can outlive a cancelled decode. */ }
      if (disposed || failed) return;
      if (!image.naturalWidth || !image.naturalHeight) { unavailable(); return; }
      clearTimeout(loadTimeout);
      ready = true;
      mount.dataset.imageWidth = String(image.naturalWidth);
      mount.dataset.imageHeight = String(image.naturalHeight);
      mount.dataset.imageState = 'ready';
      measure();
      camera.style.visibility = 'visible';
      latest.current.onUnavailable?.(false);
      request(latest.current.section);
    };
    const onMotionChange = () => {
      if (flight && latest.current.motion === 'reduced') {
        cancelAnimationFrame(frame);
        frame = 0;
        const id = flight.section;
        current = { ...flight.to };
        applyTransform();
        arrive(id);
      }
    };
    engineRef.current = { request, onMotionChange };
    image.addEventListener('load', loaded);
    image.addEventListener('error', unavailable);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(mount);
    window.addEventListener('resize', measure);
    loadTimeout = window.setTimeout(unavailable, 20000);
    request(latest.current.section);
    if (image.complete) {
      if (image.naturalWidth) loaded();
      else unavailable();
    }
    return () => {
      disposed = true;
      engineRef.current = null;
      cancelAnimationFrame(frame);
      clearTimeout(loadTimeout);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', unavailable);
    };
  }, []);

  useEffect(() => { engineRef.current?.request(section || ''); }, [section]);
  useEffect(() => { engineRef.current?.onMotionChange(); }, [motion]);

  return <div className="illustrated-world" ref={mountRef}>
    <div className="illustrated-world__camera" ref={cameraRef}>
      <img className="illustrated-world__image" ref={imageRef} src={IMAGE_URL} alt="" aria-hidden="true" decoding="async" fetchpriority="high" draggable={false} />
      <WorldAtmosphere variant="world" />
    </div>
  </div>;
}
