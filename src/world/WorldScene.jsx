import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorld } from './buildWorld.js';
import { createAtmosphere } from './createAtmosphere.js';
import { go } from '../router.js';
import { useMotion } from '../motion.js';

const HOME = new THREE.Vector3(9, 13, 36);
const HOME_TARGET = new THREE.Vector3(-3, -1, -3);
const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);

// One renderer and one world survive every route. Travel moves the perspective
// camera through that geometry; it never scales or replaces a painted scene.
export default function WorldScene({ section, onTravelState, onProjection, onUnavailable }) {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const motion = useMotion();
  const latest = useRef({ section: section || '', onTravelState, onProjection, onUnavailable, motion });
  latest.current = { section: section || '', onTravelState, onProjection, onUnavailable, motion };

  useEffect(() => {
    const mount = mountRef.current;
    let renderer;
    let world;
    let atmosphere;
    let controls;
    let observer;
    let disposed = false;
    let failed = false;
    const cleanups = [];
    const scene = new THREE.Scene();
    const unavailable = () => {
      if (disposed || failed) return;
      failed = true;
      renderer?.setAnimationLoop(null);
      latest.current.onUnavailable?.(true);
      latest.current.onTravelState?.({ section: latest.current.section, state: 'arrived' });
    };
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // Architecture and the sun are stationary; reuse their shadow map while
      // the camera, water, and clouds move instead of redrawing it every frame.
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.setAttribute('aria-label', 'Interactive floating islands. Drag to look around, or select an island to enter.');
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.className = 'world-scene__canvas';
      mount.appendChild(renderer.domElement);

      scene.fog = new THREE.Fog('#d8b6ca', 50, 135);
      atmosphere = createAtmosphere();
      scene.add(atmosphere.group);
      scene.add(new THREE.HemisphereLight('#ffe9d5', '#71658e', 1.35));
      const sunlight = new THREE.DirectionalLight('#ffd09b', 3.1);
      sunlight.position.set(-22, 35, 15);
      sunlight.castShadow = true;
      sunlight.shadow.mapSize.set(2048, 2048);
      Object.assign(sunlight.shadow.camera, { left: -34, right: 34, top: 26, bottom: -26, near: 1, far: 100 });
      sunlight.shadow.bias = -0.0003;
      sunlight.shadow.normalBias = 0.04;
      scene.add(sunlight);
      const fill = new THREE.DirectionalLight('#b6bcff', 0.7);
      fill.position.set(20, 10, -24);
      scene.add(fill);
      const libraryLight = new THREE.PointLight('#ffd59c', 22, 13, 2);
      libraryLight.position.set(-12, 4.9, -0.4);
      scene.add(libraryLight);

      const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 500);
      camera.position.copy(HOME);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(HOME_TARGET);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.rotateSpeed = 0.45;
      controls.zoomSpeed = 0.65;
      controls.maxPolarAngle = Math.PI * 0.47;
      controls.minPolarAngle = Math.PI * 0.18;
      world = createWorld();
      scene.add(world.group);

      let width = 1;
      let height = 1;
      let currentSection = '';
      let flight = null;
      let elapsed = 0;
      let previousTime = null;
      let labelTime = -1;
      let renderTime = -Infinity;
      let dirty = true;
      let framing = 0;
      let previousProjection = '';
      const frameCamera = (amount) => {
        framing = amount;
        // Leave the destination visible above the reading drawer without
        // cutting away to another scene or moving any of the buildings.
        camera.setViewOffset(width, height, 0, height * amount, width, height);
        camera.updateProjectionMatrix();
      };
      const destinationFor = (id) => world.destinations[id];
      const homePosition = () => {
        const position = HOME.clone();
        // Portrait views pull back, preserving all three islands in one world.
        if (width < height) position.multiplyScalar(Math.min(2.6, height / width * 1.34));
        return position;
      };
      const projectLabels = () => {
        const labels = {};
        for (const [id, destination] of Object.entries(world.destinations)) {
          const point = (destination.label || destination.position).clone().project(camera);
          const projectedX = (point.x * 0.5 + 0.5) * width;
          labels[id] = { x: Math.round(THREE.MathUtils.clamp(projectedX, width < 700 ? 57 : 90, width - (width < 700 ? 57 : 90)) * 10) / 10, y: Math.round((-point.y * 0.5 + 0.5) * height * 10) / 10, visible: Math.abs(point.x) < 1.05 && Math.abs(point.y) < 0.96 && point.z < 1 };
        }
        const projection = JSON.stringify(labels);
        if (projection !== previousProjection) {
          latest.current.onProjection?.(labels);
          previousProjection = projection;
        }
      };
      const configureControls = (id) => {
        const destination = destinationFor(id);
        controls.minDistance = destination ? 3.5 : 28;
        controls.maxDistance = destination ? 17 : Math.max(78, homePosition().length() * 1.25);
        controls.minAzimuthAngle = destination ? -0.48 : -0.75;
        controls.maxAzimuthAngle = destination ? 0.48 : 0.85;
        controls.minPolarAngle = destination ? 0.95 : Math.PI * 0.18;
        controls.maxPolarAngle = destination ? 1.68 : Math.PI * 0.47;
      };
      const arrive = (id) => {
        currentSection = id;
        flight = null;
        configureControls(id);
        controls.enabled = true;
        controls.update();
        mount.dataset.cameraState = 'arrived';
        mount.dataset.destination = id || 'world';
        latest.current.onTravelState?.({ section: id, state: 'arrived' });
        projectLabels();
        dirty = true;
      };
      const travel = (id) => {
        if (failed) { latest.current.onTravelState?.({ section: id, state: 'arrived' }); return; }
        if (id === currentSection && !flight) {
          latest.current.onTravelState?.({ section: id, state: 'arrived' });
          return;
        }
        const destination = destinationFor(id);
        const end = destination ? destination.camera.clone() : homePosition();
        const target = destination ? destination.target.clone() : HOME_TARGET.clone();
        const endFraming = id ? 0.2 : 0;
        const endFov = id === 'research' ? 65 : destination ? 56 : 39;
        controls.enabled = false;
        controls.enableDamping = false;
        // Flush any inertial drag before capturing the actual camera position.
        controls.update();
        controls.enableDamping = true;
        const start = camera.position.clone();
        const startTarget = controls.target.clone();
        if (latest.current.motion === 'reduced' || start.distanceTo(end) < 0.02) {
          camera.position.copy(end);
          controls.target.copy(target);
          camera.lookAt(target);
          camera.fov = endFov;
          frameCamera(endFraming);
          arrive(id);
          return;
        }
        const path = [start];
        if (destination) {
          const entrance = destination.entrance?.clone() || end.clone().add(new THREE.Vector3(0, 2.5, 10));
          // Rise above the bridge first when moving between inhabited islands.
          if (start.distanceTo(end) > 18) path.push(new THREE.Vector3((start.x + entrance.x) * 0.5, Math.max(11, start.y * 0.75), Math.max(entrance.z + 5, 17)));
          path.push(entrance, end);
        } else {
          path.push(start.clone().lerp(end, 0.4).add(new THREE.Vector3(0, 3, 3)), end);
        }
        flight = { id, startAt: performance.now(), duration: destination ? 2700 : 2100, path: new THREE.CatmullRomCurve3(path, false, 'centripetal'), fromTarget: startTarget, target, fromFraming: framing, endFraming, fromFov: camera.fov, endFov };
        mount.dataset.cameraState = 'travelling';
        latest.current.onTravelState?.({ section: id, state: 'travelling' });
        dirty = true;
      };
      const resize = () => {
        width = Math.max(1, mount.clientWidth);
        height = Math.max(1, mount.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        const portraitDistance = Math.max(0, homePosition().length() - HOME.length());
        scene.fog.near = 50 + portraitDistance;
        scene.fog.far = 135 + portraitDistance;
        frameCamera(framing);
        if (!currentSection && !flight) {
          camera.position.copy(homePosition());
          controls.target.copy(HOME_TARGET);
          configureControls('');
          controls.update();
        }
        dirty = true;
        projectLabels();
      };
      observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();
      const onControlsChange = () => { dirty = true; };
      controls.addEventListener('change', onControlsChange);
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      // Pick each island as one volume instead of raycasting twenty thousand
      // individual leaves on every pointer movement.
      const pickVolumes = Object.entries(world.destinations).map(([id, destination]) => ({
        id, sphere: new THREE.Sphere(new THREE.Vector3(destination.center.x, destination.center.y - 3, destination.center.z), id === 'research' ? 8.3 : 7.7),
      }));
      const hitPoint = new THREE.Vector3();
      let pointerStart;
      const activePointers = new Set();
      const hitIsland = (event) => {
        const bounds = renderer.domElement.getBoundingClientRect();
        pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        let nearest = Infinity;
        let chosen = null;
        for (const { id, sphere } of pickVolumes) {
          if (raycaster.ray.intersectSphere(sphere, hitPoint)) {
            const distance = camera.position.distanceToSquared(hitPoint);
            if (distance < nearest) { nearest = distance; chosen = id; }
          }
        }
        return chosen;
      };
      const onDown = (event) => {
        activePointers.add(event.pointerId);
        pointerStart = activePointers.size === 1 && event.isPrimary ? { x: event.clientX, y: event.clientY } : null;
      };
      const onUp = (event) => {
        activePointers.delete(event.pointerId);
        if (activePointers.size || !event.isPrimary || !pointerStart || currentSection || flight || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) { pointerStart = null; return; }
        const id = hitIsland(event);
        if (id) go(id);
        pointerStart = null;
      };
      const onCancel = (event) => { activePointers.delete(event.pointerId); pointerStart = null; };
      const onMove = (event) => {
        if (currentSection || flight || event.buttons) return;
        renderer.domElement.style.cursor = hitIsland(event) ? 'pointer' : 'grab';
      };
      const onContextLost = (event) => { event.preventDefault(); unavailable(); };
      for (const [event, fn] of [['pointerdown', onDown], ['pointerup', onUp], ['pointercancel', onCancel], ['pointermove', onMove], ['webglcontextlost', onContextLost]]) {
        renderer.domElement.addEventListener(event, fn);
        cleanups.push(() => renderer.domElement.removeEventListener(event, fn));
      }
      renderer.setAnimationLoop((now) => {
        if (disposed || failed || document.hidden) { previousTime = null; return; }
        const delta = previousTime === null ? 0 : Math.min((now - previousTime) / 1000, 0.06);
        previousTime = now;
        const animated = latest.current.motion !== 'reduced';
        if (animated) elapsed += delta;
        if (flight) {
          // A frame timestamp can precede a route event in that same frame.
          // CatmullRomCurve3 expects a closed [0, 1] domain, including then.
          const progress = animated ? THREE.MathUtils.clamp((now - flight.startAt) / flight.duration, 0, 1) : 1;
          const amount = ease(progress);
          camera.position.copy(flight.path.getPoint(amount));
          controls.target.lerpVectors(flight.fromTarget, flight.target, amount);
          camera.lookAt(controls.target);
          camera.fov = THREE.MathUtils.lerp(flight.fromFov, flight.endFov, amount);
          frameCamera(THREE.MathUtils.lerp(flight.fromFraming, flight.endFraming, amount));
          dirty = true;
          if (progress === 1) arrive(flight.id);
        } else controls.update();
        if (dirty || (animated && now - renderTime >= 1000 / 30)) {
          world.update?.(elapsed, delta, animated);
          atmosphere.update(elapsed);
          renderer.render(scene, camera);
          renderTime = now;
          dirty = false;
          if (!currentSection && now - labelTime > 60) { projectLabels(); labelTime = now; }
        }
      });
      engineRef.current = { travel, invalidate: () => { dirty = true; } };
      latest.current.onUnavailable?.(false);
      travel(latest.current.section);
    } catch (error) {
      console.warn('The interactive world is unavailable; portfolio navigation remains available.', error.message);
      unavailable();
    }
    return () => {
      disposed = true;
      engineRef.current = null;
      renderer?.setAnimationLoop(null);
      observer?.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      controls?.dispose();
      world?.dispose?.();
      atmosphere?.dispose?.();
      const geometries = new Set();
      const materials = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) engineRef.current.travel(section || '');
    else latest.current.onTravelState?.({ section: section || '', state: 'arrived' });
  }, [section]);
  useEffect(() => { engineRef.current?.invalidate(); }, [motion]);
  return <div className="world-scene" ref={mountRef} />;
}
