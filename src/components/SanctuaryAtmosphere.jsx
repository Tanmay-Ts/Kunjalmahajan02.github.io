import { useEffect, useRef } from 'react';
import { useMotion } from '../motion.js';

const WIDTH = 1672;
const HEIGHT = 941;
const FRAME_MS = 1000 / 30;

// Coordinates belong to the actual sanctuary illustration. The narrow masks
// stay inside its existing water, including the large conservatory waterfall.
const FALLS = [
  { x: 439, y: 307, length: 118, width: 13, bend: -8, speed: 55, strands: 4 },
  { x: 741, y: 258, length: 104, width: 15, bend: -1, speed: 60, strands: 4 },
  { x: 587, y: 499, length: 77, width: 11, bend: -1, speed: 54, strands: 4 },
  { x: 1263, y: 666, length: 275, width: 86, bend: -11, speed: 94, strands: 11 },
  { x: 1326, y: 663, length: 145, width: 7, bend: -6, speed: 81, strands: 3 },
];

const CLOUDS = [
  { x: -240, y: 744, width: 430, height: 130, speed: 3.0, alpha: .11 },
  { x: 195, y: 863, width: 520, height: 144, speed: 4.2, alpha: .13 },
  { x: 610, y: 718, width: 390, height: 108, speed: 2.7, alpha: .08 },
  { x: -180, y: 555, width: 350, height: 98, speed: 1.8, alpha: .055 },
  { x: 420, y: 921, width: 550, height: 126, speed: 4.8, alpha: .13 },
];

function createMist() {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 144;
  const context = canvas.getContext('2d');
  if (!context) return null;
  for (const [x, y, radius] of [[62,88,61],[119,68,64],[177,76,68],[238,90,58],[156,105,64]]) {
    const gradient = context.createRadialGradient(x,y,0,x,y,radius);
    gradient.addColorStop(0,'rgba(255,234,219,.4)');
    gradient.addColorStop(.35,'rgba(249,225,221,.25)');
    gradient.addColorStop(.75,'rgba(232,213,231,.07)');
    gradient.addColorStop(1,'rgba(232,213,231,0)');
    context.fillStyle=gradient;
    context.fillRect(0,0,320,144);
  }
  return canvas;
}

const centreAt = (fall,t) => fall.x + fall.bend*t*t;
const widthAt = (fall,t) => fall.width * (.86 + Math.sin(t*Math.PI)*.12) * Math.min(1,(1-t)*7);

function prepareFalls(context) {
  return FALLS.map((fall,index) => {
    const mask = new Path2D();
    for(let side=0;side<2;side++) for(let step=0;step<=32;step++) {
      const t=side?1-step/32:step/32;
      const x=centreAt(fall,t)+(side?1:-1)*widthAt(fall,t)/2;
      const y=fall.y+t*fall.length;
      if(side===0&&step===0) mask.moveTo(x,y); else mask.lineTo(x,y);
    }
    mask.closePath();
    const light=context.createLinearGradient(0,fall.y,0,fall.y+fall.length);
    light.addColorStop(0,'rgba(255,252,240,0)');
    light.addColorStop(.1,'rgba(255,252,240,.7)');
    light.addColorStop(.68,'rgba(243,249,255,.6)');
    light.addColorStop(1,'rgba(243,249,255,0)');
    const shade=context.createLinearGradient(0,fall.y,0,fall.y+fall.length);
    shade.addColorStop(0,'rgba(125,150,176,0)');
    shade.addColorStop(.14,'rgba(125,150,176,.16)');
    shade.addColorStop(.72,'rgba(125,150,176,.13)');
    shade.addColorStop(1,'rgba(125,150,176,0)');
    return {...fall,mask,light,shade,phase:index*1.71};
  });
}

function drawWater(context,falls,time) {
  context.lineCap='round';
  for(const fall of falls) {
    context.save();
    context.clip(fall.mask);
    for(let strand=0;strand<fall.strands;strand++) {
      const lane=(strand+.5)/fall.strands-.5;
      context.beginPath();
      for(let step=0;step<=36;step++) {
        const t=step/36;
        const ripple=Math.sin(t*19-time*2.4+strand*1.7+fall.phase)*.65;
        const x=centreAt(fall,t)+lane*fall.width*.87+ripple;
        const y=fall.y+t*fall.length;
        if(step===0) context.moveTo(x,y); else context.lineTo(x,y);
      }
      context.setLineDash([]);
      context.globalAlpha=.6;
      context.strokeStyle=fall.shade;
      context.lineWidth=fall.width>40?1.7:1.05;
      context.stroke();
      context.strokeStyle=fall.light;
      context.lineWidth=fall.width>40?1.2:.75;
      context.setLineDash([24+strand*2,17,8,21]);
      context.lineDashOffset=-time*fall.speed-strand*19;
      context.globalAlpha=.29+Math.sin(time*1.2+strand)*.065;
      context.stroke();
    }
    context.restore();
  }
}

function drawMist(context,sprite,time) {
  if(!sprite) return;
  // Preserve the detailed conservatory and foreground garden. Drifting mist
  // occupies the open cloud valley on the left of the actual illustration.
  context.save();
  context.beginPath();
  context.rect(0,450,1060,HEIGHT-450);
  context.clip();
  for(let i=0;i<CLOUDS.length;i++) {
    const cloud=CLOUDS[i], travel=1060+cloud.width;
    const x=((cloud.x+cloud.width+time*cloud.speed)%travel)-cloud.width;
    context.globalAlpha=cloud.alpha;
    context.drawImage(sprite,x,cloud.y+Math.sin(time*.12+i)*5-cloud.height/2,cloud.width,cloud.height);
  }
  context.restore();
  for(let i=0;i<FALLS.length;i++) {
    const fall=FALLS[i], wide=fall.width>40;
    const width=wide?120:44;
    context.globalAlpha=wide?.12:.08;
    context.drawImage(sprite,fall.x+fall.bend-width/2+Math.sin(time*.25+i)*3,fall.y+fall.length-(wide?45:17),width,wide?62:24);
  }
  context.globalAlpha=1;
}

export default function SanctuaryAtmosphere({ active=true }) {
  const canvasRef=useRef(null);
  const motion=useMotion();

  useEffect(() => {
    const canvas=canvasRef.current;
    if(!canvas) return undefined;
    const context=canvas.getContext('2d');
    if(!context) return undefined;
    context.clearRect(0,0,canvas.width,canvas.height);
    if(!active||motion==='reduced') return undefined;
    const mist=createMist();
    let falls=[], frame=0, lastFrame=null, elapsed=0, alive=true, hasSize=false;

    const draw=() => {
      context.setTransform(1,0,0,1,0,0);
      context.clearRect(0,0,canvas.width,canvas.height);
      context.setTransform(canvas.width/WIDTH,0,0,canvas.height/HEIGHT,0,0);
      drawWater(context,falls,elapsed);
      drawMist(context,mist,elapsed);
    };
    const resize=(width=canvas.clientWidth,height=canvas.clientHeight) => {
      if(!width||!height) { hasSize=false; return; }
      const resolution=Math.min(window.devicePixelRatio||1,2,4096/width,2304/height);
      const nextWidth=Math.max(1,Math.round(width*resolution)),nextHeight=Math.max(1,Math.round(height*resolution));
      if(canvas.width!==nextWidth||canvas.height!==nextHeight||!hasSize) {
        canvas.width=nextWidth;canvas.height=nextHeight;
        context.setTransform(canvas.width/WIDTH,0,0,canvas.height/HEIGHT,0,0);
        falls=prepareFalls(context);hasSize=true;draw();
      }
    };
    const tick=now => {
      if(!alive||document.hidden) return;
      frame=requestAnimationFrame(tick);
      if(lastFrame===null) lastFrame=now;
      const delta=now-lastFrame;
      if(delta<FRAME_MS) return;
      elapsed+=Math.min(delta-(delta%FRAME_MS),100)/1000;
      lastFrame=now-(delta%FRAME_MS);
      if(hasSize) draw();
    };
    const visibility=() => {
      cancelAnimationFrame(frame);lastFrame=null;
      if(!document.hidden&&alive) frame=requestAnimationFrame(tick);
    };
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(entries => {
      const {width,height}=entries[0].contentRect;resize(width,height);
    });
    observer?.observe(canvas);
    const onResize=() => resize();
    window.addEventListener('resize',onResize);
    document.addEventListener('visibilitychange',visibility);
    resize();visibility();
    return () => {
      alive=false;cancelAnimationFrame(frame);observer?.disconnect();
      window.removeEventListener('resize',onResize);
      document.removeEventListener('visibilitychange',visibility);
      context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,canvas.width,canvas.height);
    };
  },[active,motion]);

  return <canvas ref={canvasRef} className="world-atmosphere-canvas world-atmosphere-canvas--world sanctuary-atmosphere-canvas" aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',display:'block'}} />;
}
