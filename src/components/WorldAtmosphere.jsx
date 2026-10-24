import { useEffect, useRef } from 'react';
import { useMotion } from '../motion.js';

const WIDTH = 1365;
const HEIGHT = 768;
const FRAME_MS = 1000 / 30;

// Image-space coordinates, measured against public/world/islands.webp.
// Narrow ribbons follow the photographed channels, never the buildings.
const FALLS = [
  { x: 412, y: 505, length: 171, width: 17, bend: -5, speed: 64 },
  { x: 615, y: 525, length: 188, width: 13, bend: -4, speed: 73 },
  { x: 869, y: 390, length: 143, width: 18, bend: -2, speed: 66 },
  { x: 931, y: 389, length: 125, width: 12, bend: -3, speed: 61 },
  { x: 1203, y: 410, length: 184, width: 14, bend: -4, speed: 72 },
  { x: 1237, y: 416, length: 194, width: 20, bend: -6, speed: 78 },
];

const CLOUDS = [
  { x: -210, y: 645, width: 480, height: 124, speed: 4.1, alpha: 0.17 },
  { x: 230, y: 713, width: 550, height: 132, speed: 5.3, alpha: 0.18 },
  { x: 745, y: 652, width: 410, height: 112, speed: 3.4, alpha: 0.14 },
  { x: 1130, y: 698, width: 490, height: 132, speed: 4.8, alpha: 0.17 },
  { x: 85, y: 585, width: 300, height: 84, speed: 2.6, alpha: 0.08 },
  { x: 910, y: 571, width: 310, height: 88, speed: 2.2, alpha: 0.07 },
  { x: 430, y: 769, width: 600, height: 128, speed: 6.1, alpha: 0.19 },
];

function randomSequence(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createSprite(width, height, paint) {
  const sprite = document.createElement('canvas');
  sprite.width = width;
  sprite.height = height;
  const context = sprite.getContext('2d');
  if (!context) return null;
  paint(context);
  return sprite;
}

// Cloud shapes and mote glows are rasterised once, not rebuilt every frame.
function createCloud() {
  return createSprite(320, 144, (context) => {
    const puffs = [[65, 88, 60], [119, 69, 64], [177, 76, 68], [235, 87, 56], [154, 101, 62]];
    for (const [x, y, radius] of puffs) {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 229, 217, 0.42)');
      gradient.addColorStop(0.35, 'rgba(250, 222, 216, 0.28)');
      gradient.addColorStop(0.75, 'rgba(233, 211, 225, 0.08)');
      gradient.addColorStop(1, 'rgba(233, 211, 225, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 320, 144);
    }
  });
}

function createGlow() {
  return createSprite(32, 32, (context) => {
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 246, 207, 0.98)');
    gradient.addColorStop(0.12, 'rgba(255, 225, 157, 0.75)');
    gradient.addColorStop(0.3, 'rgba(255, 204, 133, 0.16)');
    gradient.addColorStop(1, 'rgba(255, 204, 133, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
  });
}

function centreAt(fall, progress) {
  return fall.x + fall.bend * progress * progress;
}

function widthAt(fall, progress) {
  // Taper into the existing spray so the overlay has no hard bottom edge.
  return fall.width * (0.83 + Math.sin(progress * Math.PI) * 0.14) * Math.min(1, (1 - progress) * 7);
}

function prepareFalls(context) {
  return FALLS.map((fall, index) => {
    const mask = new Path2D();
    for (let side = 0; side < 2; side += 1) {
      for (let step = 0; step <= 24; step += 1) {
        const progress = side ? 1 - step / 24 : step / 24;
        const x = centreAt(fall, progress) + (side ? 1 : -1) * widthAt(fall, progress) / 2;
        const y = fall.y + progress * fall.length;
        if (side === 0 && step === 0) mask.moveTo(x, y);
        else mask.lineTo(x, y);
      }
    }
    mask.closePath();
    const light = context.createLinearGradient(0, fall.y, 0, fall.y + fall.length);
    light.addColorStop(0, 'rgba(255, 249, 232, 0)');
    light.addColorStop(0.08, 'rgba(255, 249, 232, 0.8)');
    light.addColorStop(0.65, 'rgba(238, 248, 255, 0.65)');
    light.addColorStop(1, 'rgba(238, 248, 255, 0)');
    const shade = context.createLinearGradient(0, fall.y, 0, fall.y + fall.length);
    shade.addColorStop(0, 'rgba(123, 151, 189, 0)');
    shade.addColorStop(0.1, 'rgba(123, 151, 189, 0.27)');
    shade.addColorStop(0.7, 'rgba(123, 151, 189, 0.19)');
    shade.addColorStop(1, 'rgba(123, 151, 189, 0)');
    return { ...fall, mask, light, shade, phase: index * 1.7 };
  });
}

function drawWater(context, falls, elapsed) {
  context.lineCap = 'round';
  for (const fall of falls) {
    context.save();
    context.clip(fall.mask);
    // Long, continuous filaments + travelling highlights read as flowing water.
    for (let strand = 0; strand < 6; strand += 1) {
      context.beginPath();
      const lane = (strand + 0.5) / 6 - 0.5;
      for (let step = 0; step <= 28; step += 1) {
        const progress = step / 28;
        const y = fall.y + progress * fall.length;
        const ripple = Math.sin(progress * 23 - elapsed * 2.7 + strand * 1.6 + fall.phase) * 0.8;
        const x = centreAt(fall, progress) + lane * fall.width * 0.9 + ripple;
        if (step === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = fall.shade;
      context.lineWidth = strand % 2 ? 1.7 : 1.2;
      context.setLineDash([]);
      context.globalAlpha = 0.8;
      context.stroke();
      context.strokeStyle = fall.light;
      context.lineWidth = strand % 2 ? 0.8 : 1.25;
      context.setLineDash([18 + strand * 2, 11, 5, 13]);
      context.lineDashOffset = -elapsed * fall.speed - strand * 14;
      context.globalAlpha = 0.52 + Math.sin(elapsed * 1.3 + strand) * 0.1;
      context.stroke();
    }
    context.restore();
  }
}

function drawClouds(context, sprite, elapsed) {
  if (!sprite) return;
  for (let index = 0; index < CLOUDS.length; index += 1) {
    const cloud = CLOUDS[index];
    const travel = WIDTH + cloud.width;
    const x = ((cloud.x + cloud.width + elapsed * cloud.speed) % travel) - cloud.width;
    const y = cloud.y + Math.sin(elapsed * 0.13 + index) * 6;
    context.globalAlpha = cloud.alpha;
    context.drawImage(sprite, x, y - cloud.height / 2, cloud.width, cloud.height);
  }
  // A little rolling mist where each waterfall dissolves into the clouds.
  for (let index = 0; index < FALLS.length; index += 1) {
    const fall = FALLS[index];
    const x = fall.x + fall.bend + Math.sin(elapsed * 0.35 + index) * 8;
    const spread = 76 + Math.sin(elapsed * 0.5 + index) * 7;
    context.globalAlpha = 0.19;
    context.drawImage(sprite, x - spread / 2, fall.y + fall.length - 30, spread, 42);
  }
  context.globalAlpha = 1;
}

function createMotes(variant) {
  const random = randomSequence(variant === 'library' ? 3181 : 8173);
  return Array.from({ length: variant === 'library' ? 25 : 13 }, () => ({
    x: 70 + random() * (WIDTH - 140),
    y: variant === 'library' ? 90 + random() * 620 : 220 + random() * 340,
    size: (variant === 'library' ? 7 : 5) + random() * 7,
    phase: random(),
    life: 32 + random() * 38,
    drift: 9 + random() * 19,
    alpha: (variant === 'library' ? 0.38 : 0.19) + random() * 0.18,
  }));
}

function drawMotes(context, sprite, motes, elapsed) {
  if (!sprite) return;
  for (const mote of motes) {
    const progress = (elapsed / mote.life + mote.phase) % 1;
    const x = mote.x + Math.sin(progress * Math.PI * 2 + mote.phase * 9) * mote.drift;
    const y = mote.y - progress * 86;
    context.globalAlpha = Math.sin(progress * Math.PI) * mote.alpha;
    context.drawImage(sprite, x - mote.size / 2, y - mote.size / 2, mote.size, mote.size);
  }
  context.globalAlpha = 1;
}

export default function WorldAtmosphere({ variant = 'world', active = true }) {
  const canvasRef = useRef(null);
  const motion = useMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!active || motion === 'reduced') return undefined;

    const clouds = variant === 'world' ? createCloud() : null;
    const glow = createGlow();
    const motes = createMotes(variant);
    let falls = [];
    let frame = 0;
    let lastFrame = null;
    let elapsed = 0;
    let alive = true;
    let hasSize = false;

    const draw = () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
      if (variant === 'world') {
        drawWater(context, falls, elapsed);
        drawClouds(context, clouds, elapsed);
      }
      drawMotes(context, glow, motes, elapsed);
    };

    const resize = (width = canvas.clientWidth, height = canvas.clientHeight) => {
      if (!width || !height) {
        hasSize = false;
        return;
      }
      // Avoid measuring transformed camera bounds, which would multiply the DPR.
      const resolution = Math.min(window.devicePixelRatio || 1, 1.5, 2048 / width, 1536 / height);
      const nextWidth = Math.max(1, Math.round(width * resolution));
      const nextHeight = Math.max(1, Math.round(height * resolution));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight || !hasSize) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
        falls = variant === 'world' ? prepareFalls(context) : [];
        hasSize = true;
        draw();
      }
    };

    const tick = (now) => {
      if (!alive || document.hidden) return;
      frame = requestAnimationFrame(tick);
      if (lastFrame === null) lastFrame = now;
      const delta = now - lastFrame;
      if (delta < FRAME_MS) return;
      elapsed += Math.min(delta - (delta % FRAME_MS), 100) / 1000;
      lastFrame = now - (delta % FRAME_MS);
      if (hasSize) draw();
    };

    const visibility = () => {
      cancelAnimationFrame(frame);
      lastFrame = null;
      if (!document.hidden && alive) frame = requestAnimationFrame(tick);
    };

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      resize(width, height);
    });
    observer?.observe(canvas);
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', visibility);
    resize();
    visibility();

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', visibility);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, motion, variant]);

  return <canvas
    ref={canvasRef}
    className={`world-atmosphere-canvas world-atmosphere-canvas--${variant}`}
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
  />;
}
