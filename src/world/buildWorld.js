import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createVegetation } from './createVegetation.js';

// Every visible surface in this world is geometry. There are deliberately no
// photographs, image planes, texture maps, or replacement interior scenes.
const C = {
  cream: '#dfcba9', ivory: '#f1dfba', brass: '#977344', brassLight: '#d0a866',
  wood: '#8c5d47', woodLight: '#b77e54', soil: '#b9987b', stone: '#bcb0a1',
  rock: '#908b7c', moss: '#526243', grass: '#718257', darkLeaf: '#304c34',
  leaf: '#65856a', sage: '#9bab7c', flower: '#dca4b7', lilac: '#a68db5',
  peach: '#f0b49f', blue: '#839aa6', ink: '#4d4d57', paper: '#fff3dc',
};

export function createWorld() {
  const group = new THREE.Group();
  group.name = 'A continuously modelled floating world';
  const buckets = new Map();
  const destinationGroups = Object.fromEntries(['research', 'projects', 'creative'].map(id => {
    const island = new THREE.Group();
    island.name = id + ' island'; island.userData.destination = id; group.add(island);
    return [id, island];
  }));
  let currentDestination = null;
  const parent = () => destinationGroups[currentDestination] || group;
  const animated = [];
  const ownedMaterials = [];
  const resources = [];
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const vector = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let seed = 2002;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const color = new THREE.Color();
  const plain = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0.01 });
  const metal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.29, metalness: 0.72 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#a8c8bb', transparent: true, opacity: 0.2, roughness: 0.09, metalness: 0.12, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.12 });
  const cliff = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, metalness: 0 });
  const masonry = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });
  const turf = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const lanternGlass = new THREE.MeshStandardMaterial({ color: '#ffe6b3', emissive: '#ffb953', emissiveIntensity: 0.65, roughness: 0.38 });
  ownedMaterials.push(plain, metal, glass, cliff, masonry, turf, lanternGlass);
  const surfaceNoise = `
    float terrainHash(vec3 p) { p=fract(p*.1031); p+=dot(p,p.yzx+33.33); return fract((p.x+p.y)*p.z); }
    float terrainNoise(vec3 p) {
      vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(mix(terrainHash(i),terrainHash(i+vec3(1,0,0)),f.x),mix(terrainHash(i+vec3(0,1,0)),terrainHash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(terrainHash(i+vec3(0,0,1)),terrainHash(i+vec3(1,0,1)),f.x),mix(terrainHash(i+vec3(0,1,1)),terrainHash(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    float terrainFbm(vec3 p) { return terrainNoise(p)*.57+terrainNoise(p*2.13)*.28+terrainNoise(p*4.51)*.15; }
  `;
  function naturalSurface(material, type) {
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 naturalPosition;');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nnaturalPosition=position;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 naturalPosition;\n' + surfaceNoise);
      const detail = type === 'cliff' ? `
        float mineral=terrainFbm(naturalPosition*1.5);
        float seam=pow(.5+.5*sin(naturalPosition.y*9.0+terrainNoise(naturalPosition*.75)*5.0),9.0);
        diffuseColor.rgb*=.86+mineral*.2-seam*.075;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.23,.115),smoothstep(.63,.84,terrainFbm(naturalPosition*.75))*0.22);
      ` : type === 'turf' ? `
        float grassPatch=terrainFbm(naturalPosition*2.3);
        float grassGrain=terrainNoise(naturalPosition*9.0);
        diffuseColor.rgb*=.84+grassPatch*.25+grassGrain*.06;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.31,.285,.17),smoothstep(.65,.84,terrainNoise(naturalPosition*1.3))*.42);
      ` : `
        float stoneGrain=terrainNoise(naturalPosition*8.0);
        diffuseColor.rgb*=.95+stoneGrain*.055+terrainFbm(naturalPosition*3.0)*.035;
      `;
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + detail);
      const bumpHeight = type === 'cliff' ? 'terrainFbm(naturalPosition*2.8)*.026+terrainNoise(naturalPosition*9.0)*.002' : type === 'turf' ? 'terrainNoise(naturalPosition*8.0)*.004' : 'terrainNoise(naturalPosition*8.0)*.002';
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float rockHeight=${bumpHeight};
        vec3 rockDx=dFdx(-vViewPosition), rockDy=dFdy(-vViewPosition);
        vec3 rockR1=cross(rockDy,normal), rockR2=cross(normal,rockDx);
        float rockDet=dot(rockDx,rockR1);
        normal=normalize(abs(rockDet)*normal-sign(rockDet)*(dFdx(rockHeight)*rockR1+dFdy(rockHeight)*rockR2));
      `);
    };
    material.customProgramCacheKey = () => 'natural-surface-' + type;
  }
  naturalSurface(cliff, 'cliff'); naturalSurface(masonry, 'stone'); naturalSurface(turf, 'turf');

  function bake(geometry, tint, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], material = plain) {
    // Normalize geometry layouts so unrelated primitives can share one draw call.
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    geometry.dispose();
    if (g.getAttribute('uv')) g.deleteAttribute('uv');
    quaternion.setFromEuler(new THREE.Euler(...rotation));
    matrix.compose(vector.set(...position), quaternion, new THREE.Vector3(...scale));
    g.applyMatrix4(matrix);
    color.set(tint);
    const colors = new Float32Array(g.getAttribute('position').count * 3);
    for (let i = 0; i < colors.length; i += 3) { colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b; }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const key = (currentDestination || 'world') + material.uuid;
    if (!buckets.has(key)) buckets.set(key, { material, geometries: [], parent: parent() });
    buckets.get(key).geometries.push(g);
  }
  function box(x, y, z, w, h, d, tint, rotation = [0, 0, 0], material = plain) {
    bake(new THREE.BoxGeometry(w, h, d), tint, [x, y, z], [1, 1, 1], rotation, material);
  }
  function ball(x, y, z, sx, sy, sz, tint, segments = 12) {
    bake(new THREE.SphereGeometry(1, segments, Math.max(8, segments - 4)), tint, [x, y, z], [sx, sy, sz]);
  }
  function cylinder(x, y, z, r1, r2, h, tint, rotation = [0, 0, 0], material = plain, sides = 16) {
    bake(new THREE.CylinderGeometry(r1, r2, h, sides), tint, [x, y, z], [1, 1, 1], rotation, material);
  }
  function beam(a, b, radius, tint, material = plain, sides = 10) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const direction = end.clone().sub(start);
    const q = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    cylinder(...start.add(end).multiplyScalar(0.5).toArray(), radius, radius, direction.length(), tint, [e.x, e.y, e.z], material, sides);
  }
  function tube(points, radius, tint, material = plain, segments = 44) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    bake(new THREE.TubeGeometry(curve, segments, radius, 8, false), tint, [0, 0, 0], [1, 1, 1], [0, 0, 0], material);
  }
  function torus(x, y, z, radius, width, tint, rotation = [Math.PI / 2, 0, 0], material = plain) {
    bake(new THREE.TorusGeometry(radius, width, 8, 48), tint, [x, y, z], [1, 1, 1], rotation, material);
  }

  function column(x, y, z, height, radius = .09) {
    const profile = [[2.15,0],[2.15,.06],[1.75,.08],[1.75,.16],[1.25,.19],[1,.25],[.92,height-.34],[1.25,height-.28],[1.7,height-.22],[1.7,height-.15],[2.15,height-.12],[2.15,height]];
    const points=profile.map(([r,h])=>new THREE.Vector2(r*radius,h));
    bake(new THREE.LatheGeometry(points,24),C.ivory,[x,y,z],[1,1,1],[0,0,0],masonry);
    for (const h of [.19,height-.24,height-.13]) torus(x,y+h,z,radius*(h<1?1.5:1.8),.017,C.brass,[Math.PI/2,0,0],metal);
    for(let k=0;k<10;k++) {
      const t=k/10*Math.PI*2;
      beam([x+Math.cos(t)*radius*.96,y+.35,z+Math.sin(t)*radius*.96],[x+Math.cos(t)*radius*.88,y+height-.4,z+Math.sin(t)*radius*.88],.009,'#c8b28b',masonry,6);
    }
  }

  function framedArch(x, y, z, width, height, angle=0, bars=true) {
    const radius=width/2, spring=height-radius;
    const p=(a,b,c=0)=>[x+a*Math.cos(angle)+c*Math.sin(angle),y+b,z-a*Math.sin(angle)+c*Math.cos(angle)];
    for(const side of [-1,1]) {
      beam(p(side*radius,0),p(side*radius,spring),.032,C.brass,metal);
      beam(p(side*(radius+.06),0),p(side*(radius+.06),spring),.014,C.brassLight,metal,8);
    }
    const curve=[], outer=[];
    for(let i=0;i<=30;i++) {
      const t=i/30*Math.PI;
      curve.push(p(Math.cos(t)*radius,spring+Math.sin(t)*radius));
      outer.push(p(Math.cos(t)*(radius+.06),spring+Math.sin(t)*(radius+.06)));
    }
    tube(curve,.033,C.brass,metal,36); tube(outer,.012,C.brassLight,metal,36);
    beam(p(-radius,spring),p(radius,spring),.025,C.brass,metal);
    if(bars) {
      beam(p(0,0),p(0,height),.02,C.brass,metal);
      beam(p(-radius,spring*.46),p(radius,spring*.46),.025,C.brass,metal);
      for(const a of [.25,.5,.75]) beam(p(0,spring),p(Math.cos(a*Math.PI)*radius,spring+Math.sin(a*Math.PI)*radius),.014,C.brassLight,metal,8);
    }
  }

  function finial(x,y,z,size=.3) {
    const shape=[[.26,0],[.28,.12],[.13,.2],[.12,.35],[.23,.48],[.22,.61],[.12,.76],[.05,.92],[0,1.25]];
    bake(new THREE.LatheGeometry(shape.map(([r,h])=>new THREE.Vector2(r*size,h*size)),20),C.brassLight,[x,y,z],[1,1,1],[0,0,0],metal);
  }

  function lantern(x,y,z,size=.28) {
    box(x,y,z,size*.65,size,size*.65,C.ivory,[0,0,0],lanternGlass);
    for(const dx of [-.39,.39]) for(const dz of [-.39,.39]) beam([x+dx*size,y-size*.55,z+dz*size],[x+dx*size,y+size*.55,z+dz*size],size*.045,C.brass,metal,8);
    box(x,y-size*.55,z,size*.95,size*.12,size*.95,C.brass,[0,0,0],metal);
    bake(new THREE.ConeGeometry(size*.73,size*.42,4),C.brass,[x,y+size*.75,z],[1,1,1],[0,Math.PI/4,0],metal);
    finial(x,y+size*.96,z,size*.65);
  }

  function makeIsland(cx, cy, cz, radius, depth, distant = false) {
    const rings = distant ? 10 : 38, segments = distant ? 28 : 128;
    const positions = [], indices = [], colors = [];
    const phase = cx * .17 + cz * .23;
    const contour = t => 1 + Math.sin(t * 3 + phase) * .075 + Math.cos(t * 7 - .7) * .058 + Math.sin(t * 13 + 1.1) * .023;
    function profile(t, u) {
      const taper = Math.pow(Math.max(.0001, 1 - u), .61);
      const buttress = Math.pow(.5 + .5 * Math.sin(t * 8 + phase), 5) * .22 * Math.sin(u * Math.PI);
      const fracture = Math.sin(t * 29 + Math.floor(u * 15) * 1.9) * .028 + Math.sin(t * 47 - u * 32) * .013;
      const strata = (Math.sin(Math.floor(u * 18) * 2.1) * .025 + Math.cos(u * 86) * .018) * Math.sin(u * Math.PI);
      return radius * (taper * contour(t) + buttress + strata + fracture * Math.sin(u * Math.PI));
    }
    for (let level = 0; level < rings; level++) {
      const u = level / (rings - 1);
      for (let i = 0; i <= segments; i++) {
        const t = (i % segments) / segments * Math.PI * 2;
        const r = profile(t, u);
        const crevice = Math.pow(.5 + .5 * Math.sin(t * 11 + phase), 9);
        const driftX = Math.sin(u * 3.1 + phase) * u * .58, driftZ = Math.cos(u * 2.6 + phase) * u * .38;
        const jagged = (Math.sin(t * 19 + u * 17) * .11 + Math.sin(t * 37 - u * 11) * .045) * Math.sin(u * Math.PI);
        positions.push(cx + Math.cos(t) * r + driftX, cy - u * depth + jagged - Math.sin(t * 3.0 + phase) * .19 * u, cz + Math.sin(t) * r + driftZ);
        color.set(level < 2 ? C.moss : C.rock);
        if (level >= 2) color.lerp(new THREE.Color('#c1b7a1'), (.5 + .5 * Math.sin(t * 4.3 + u * 9)) * .35).lerp(new THREE.Color('#596352'), crevice * .35 + u * .12);
        colors.push(color.r, color.g, color.b);
        if (level < rings - 1 && i < segments) {
          const a = level * (segments + 1) + i, b = a + segments + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    const rock = new THREE.BufferGeometry();
    rock.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    rock.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    rock.setIndex(indices); rock.computeVertexNormals();
    if(distant) {
      const key=(currentDestination||'world')+cliff.uuid;
      if(!buckets.has(key)) buckets.set(key,{material:cliff,geometries:[],parent:parent()});
      buckets.get(key).geometries.push(rock.toNonIndexed()); rock.dispose();
    } else {
      const rockMesh = new THREE.Mesh(rock, cliff);
      rockMesh.name = 'Fractured mineral cliffs with continuous procedural detail';
      rockMesh.castShadow = true; rockMesh.receiveShadow = true;
      parent().add(rockMesh); resources.push(rock);
    }
    const groundPositions = [], groundColors = [], groundIndices = [];
    const groundRings = distant ? 3 : 10;
    for (let ring = 0; ring < groundRings; ring++) for (let i = 0; i <= segments; i++) {
      const t = (i % segments) / segments * Math.PI * 2, f = Math.max(.0001, ring / (groundRings - 1));
      const r = radius * contour(t) * f;
      const uneven = Math.pow(f, 7) * (.06 * Math.sin(t * 15) + .035 * Math.sin(t * 31));
      groundPositions.push(cx + Math.cos(t) * r, cy + .035 + uneven, cz + Math.sin(t) * r);
      color.set(C.grass).lerp(new THREE.Color('#a0a36b'), (.5 + .5 * Math.sin(t * 6.1 + ring * .61)) * .15);
      groundColors.push(color.r, color.g, color.b);
      if (ring < groundRings - 1 && i < segments) {
        const a = ring * (segments + 1) + i, b = a + segments + 1;
        groundIndices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const ground = new THREE.BufferGeometry();
    ground.setAttribute('position', new THREE.Float32BufferAttribute(groundPositions, 3));
    ground.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3));
    ground.setIndex(groundIndices); ground.computeVertexNormals();
    if(distant) {
      const key=(currentDestination||'world')+turf.uuid;
      if(!buckets.has(key)) buckets.set(key,{material:turf,geometries:[],parent:parent()});
      buckets.get(key).geometries.push(ground.toNonIndexed()); ground.dispose();
    } else {
      const groundMesh = new THREE.Mesh(ground, turf); groundMesh.receiveShadow = true;
      parent().add(groundMesh); resources.push(ground);
    }
    // Broken rock faces grow out of the cliff mass, with mineral fracture planes.
    for (let i = 0; i < (distant ? 0 : 15); i++) {
      const t = i / 15 * Math.PI * 2 + .11, u = .15 + rand() * .42;
      const r = profile(t, u) * .91;
      const g = new THREE.IcosahedronGeometry(1, 1);
      const p = g.getAttribute('position');
      for (let j = 0; j < p.count; j++) {
        const px=p.getX(j), py=p.getY(j), pz=p.getZ(j);
        const jitter=1 + .17 * Math.sin(px*13+py*8+pz*17+i);
        p.setXYZ(j,px*jitter,py*(1+.09*Math.sin(px*9)),pz*jitter);
      }
      g.computeVertexNormals();
      bake(g, i % 3 ? '#a49d89' : '#79816a', [cx + Math.cos(t) * r, cy - u * depth, cz + Math.sin(t) * r], [.38 + rand() * .38, .8 + rand() * 1.8, .4 + rand() * .45], [.1, -t, .11 * Math.sin(i)], cliff);
    }
  }

  function pot(x, y, z, size = 0.5) {
    cylinder(x, y + size * 0.42, z, size * 0.42, size * 0.31, size * 0.8, C.peach);
    torus(x, y + size * 0.83, z, size * 0.42, size * 0.05, C.cream);
    for (let i = 0; i < 7; i++) {
      const t = i * 2.4;
      const end = [x + Math.cos(t) * size * 0.6, y + size * (1.1 + rand() * 0.7), z + Math.sin(t) * size * 0.6];
      beam([x, y + size * 0.75, z], end, size * 0.035, C.darkLeaf);
      bake(new THREE.SphereGeometry(1, 10, 6), i % 2 ? C.sage : C.leaf, end, [size * 0.22, size * 0.42, size * 0.1], [0.2, t, 0.4]);
    }
  }
  function bookshelf(cx, base, cz, width = 1.9, height = 3.5, angle = 0) {
    // Local points are rotated as a unit, so side-wall books face into the room.
    function part(x, y, z, w, h, d, tint, tilt = 0) {
      const X = cx + x * Math.cos(angle) + z * Math.sin(angle);
      const Z = cz - x * Math.sin(angle) + z * Math.cos(angle);
      box(X, base + y, Z, w, h, d, tint, [0, angle, tilt]);
    }
    part(0, height / 2, -0.18, width, height, 0.12, C.wood);
    part(-width / 2, height / 2, 0, 0.11, height, 0.5, C.cream);
    part(width / 2, height / 2, 0, 0.11, height, 0.5, C.cream);
    part(0, height + 0.04, 0, width + 0.16, 0.14, 0.58, C.ivory);
    part(0, 0.08, 0, width + 0.16, 0.16, 0.58, C.cream);
    const bookColors = ['#805448','#6c6444','#46646d','#78576b','#d2c4a1','#915d42','#31534b','#a48b65'];
    for (let shelf = 0; shelf < 5; shelf++) {
      const sy = shelf * height / 5 + 0.14;
      part(0, sy, 0.04, width, 0.09, 0.52, C.woodLight);
      let x = -width / 2 + 0.14;
      while (x < width / 2 - 0.15) {
        const bw = 0.09 + rand() * 0.1, bh = height / 5 * (0.53 + rand() * 0.27);
        const bc = bookColors[Math.floor(rand() * bookColors.length)];
        part(x + bw / 2, sy + bh / 2 + 0.05, 0.09, bw, bh, 0.27 + rand() * 0.07, bc);
        part(x + bw / 2, sy + bh * 0.75, 0.265, bw * 0.76, 0.018, 0.012, C.brassLight);
        part(x + bw / 2, sy + bh * 0.22, 0.265, bw * 0.76, 0.016, 0.012, C.brassLight);
        part(x + bw / 2, sy + bh + .047, .08, bw*.78, .012, .24, '#d4c7a7');
        if(rand()>.4) {
          part(x+bw/2,sy+bh*.52,.267,bw*.52,bh*.13,.009,'#c9b58b');
          for(let mark=0;mark<3;mark++) part(x+bw/2,sy+bh*(.49+mark*.03),.274,bw*.33,.006,.004,'#76644e');
        }
        x += bw + 0.025;
      }
    }
  }
  function chair(x, y, z, angle = 0) {
    const p = (a, b, c) => [x + a * Math.cos(angle) + c * Math.sin(angle), y + b, z - a * Math.sin(angle) + c * Math.cos(angle)];
    box(...p(0, 0.65, 0), 0.68, 0.13, 0.72, C.woodLight, [0, angle, 0]);
    box(...p(0, 0.74, 0), 0.57, 0.08, 0.58, C.sage, [0, angle, 0]);
    for (const dx of [-0.25, 0.25]) for (const dz of [-0.25, 0.25]) beam(p(dx, 0, dz), p(dx, dz < 0 ? 1.52 : 0.62, dz), 0.045, C.wood);
    box(...p(0, 1.3, -0.25), 0.57, 0.32, 0.09, C.woodLight, [0, angle, 0]);
  }

  function library(cx, cy, cz) {
    const floor = cy + 0.38, w = 7.2, d = 6.8, spring = floor + 3.9;
    box(cx, floor - 0.2, cz, w + 0.54, 0.24, d + 0.54, C.cream,[0,0,0],masonry);
    box(cx, floor - 0.065, cz, w + 0.68, 0.07, d + 0.68, C.ivory,[0,0,0],masonry);
    box(cx, floor + 0.015, cz, w, 0.045, d, '#d2b595');
    // Thin floor inlays remain sharp at the closest camera distance.
    for (let i = -7; i <= 7; i++) box(cx + i * 0.45, floor + 0.045, cz, 0.018, 0.012, d - 0.18, '#b68d70');
    for (let i = 0; i < 4; i++) {
      const y=floor-.14-i*.07, z=cz+d/2+.19+i*.29;
      box(cx,y,z,3.0+i*.3,.14,.46,i%2?C.ivory:C.cream,[0,0,0],masonry);
      box(cx,y+.063,z+.235,3.03+i*.3,.033,.055,C.ivory,[0,0,0],masonry);
    }
    for (const side of [-1, 1]) {
      box(cx + side * w / 2, floor + 0.55, cz, 0.18, 1.1, d, C.cream,[0,0,0],masonry);
      for(let course=0;course<3;course++) for(let block=0;block<9;block++) {
        const bz=cz-d/2+.38+block*.75+(course%2)*.18;
        if(bz<cz+d/2-.1) box(cx+side*(w/2+.097),floor+.18+course*.3,bz,.012,.012,.71,'#a89373',[0,0,0],masonry);
      }
      box(cx + side * w / 2, floor + 1.15, cz, 0.22, 0.1, d + 0.12, C.brassLight, [0, 0, 0], metal);
      for (let j = 0; j <= 4; j++) {
        const z = cz - d / 2 + j * d / 4;
        column(cx + side * w / 2,floor,z,3.92,.085);
        finial(cx+side*w/2,spring+.03,z,.28);
      }
      for (let j = 0; j < 4; j++) {
        const z=cz-d/2+(j+.5)*d/4;
        box(cx+side*w/2,floor+2.52,z,.025,2.65,d/4-.12,'#ffffff',[0,0,0],glass);
        framedArch(cx+side*(w/2+.03),floor+1.22,z,1.48,2.62,Math.PI/2);
      }
      beam([cx + side * w / 2, spring, cz - d / 2], [cx + side * w / 2, spring, cz + d / 2], 0.075, C.brass, metal);
      beam([cx + side * w / 2, spring+.13, cz - d / 2], [cx + side * w / 2, spring+.13, cz + d / 2], 0.025, C.brassLight, metal);
    }
    // An open arched portal and glazed side lights share the continuous room.
    // The camera crosses the empty central opening, never a replacement image.
    framedArch(cx,floor,cz+d/2+.025,3.28,4.75,0,false);
    for(const side of [-1,1]) {
      column(cx+side*1.7,floor,cz+d/2,3.15,.095);
      framedArch(cx+side*2.66,floor+.12,cz+d/2+.025,1.62,3.65,0,true);
      box(cx+side*2.66,floor+1.73,cz+d/2,1.56,3.2,.02,'#ffffff',[0,0,0],glass);
      lantern(cx+side*2.16,floor+2.5,cz+d/2+.25,.28);
      beam([cx+side*2.16,floor+2.85,cz+d/2],[cx+side*2.16,floor+2.85,cz+d/2+.25],.025,C.brass,metal);
    }
    // Barrel-vault greenhouse: a structural arch every 1.7 metres, with an
    // entirely open front. The camera passes beneath this same physical roof.
    for (let j = 0; j <= 4; j++) {
      const z = cz - d / 2 + j * d / 4;
      const arch = [];
      for (let k = 0; k <= 24; k++) { const t = k / 24 * Math.PI; arch.push([cx + Math.cos(t) * w / 2, spring + Math.sin(t) * 2.35, z]); }
      tube(arch, 0.065, C.brass, metal, 48);
      if (j === 0 || j === 4) tube(arch.map(p => [p[0], p[1] + 0.08, p[2]]), 0.035, C.ivory, plain, 48);
    }
    for (let k = 1; k < 16; k++) {
      const t = k / 16 * Math.PI;
      beam([cx + Math.cos(t) * w / 2, spring + Math.sin(t) * 2.35, cz - d / 2], [cx + Math.cos(t) * w / 2, spring + Math.sin(t) * 2.35, cz + d / 2], 0.035, C.brassLight, metal);
    }
    const roofPos = [], roofIndices = [];
    for (let z = 0; z <= 1; z++) for (let k = 0; k <= 48; k++) {
      const t = k / 48 * Math.PI;
      roofPos.push(cx + Math.cos(t) * w / 2, spring + Math.sin(t) * 2.35, cz - d / 2 + z * d);
      if (z === 0 && k < 48) roofIndices.push(k, k + 49, k + 1, k + 1, k + 49, k + 50);
    }
    const roof = new THREE.BufferGeometry(); roof.setAttribute('position', new THREE.Float32BufferAttribute(roofPos, 3)); roof.setIndex(roofIndices); roof.computeVertexNormals();
    bake(roof, '#ffffff', [0, 0, 0], [1, 1, 1], [0, 0, 0], glass);
    beam([cx, spring + 2.37, cz - d / 2 - 0.2], [cx, spring + 2.37, cz + d / 2 + 0.2], 0.07, C.brass, metal);
    for(let k=0;k<=8;k++) finial(cx,spring+2.37,cz-d/2+k*d/8,k%2?.22:.38);
    for(const side of [-1,1]) {
      beam([cx+side*2.8,spring+.7,cz+.4],[cx+side*2.8,spring-.14,cz+.4],.014,C.brass,metal,8);
      lantern(cx+side*2.8,spring-.42,cz+.4,.25);
    }
    // A back wall of books, with two smaller return shelves inside each side.
    for (const x of [-2.25, 0, 2.25]) bookshelf(cx + x, floor, cz - 3.05, 2.0, 3.45);
    bookshelf(cx - 3.24, floor, cz - 0.8, 1.9, 2.75, Math.PI / 2);
    bookshelf(cx + 3.24, floor, cz - 0.8, 1.9, 2.75, -Math.PI / 2);
    box(cx, floor + 0.07, cz + 0.5, 3.9, 0.025, 3.4, '#b98583');
    for (const dx of [-1.86, 1.86]) box(cx + dx, floor + 0.086, cz + 0.5, 0.045, 0.009, 3.18, C.brassLight);
    for (const dz of [-1.0, 2.0]) box(cx, floor + 0.086, cz + dz, 3.7, 0.009, 0.045, C.brassLight);
    box(cx, floor + 1.2, cz + 0.15, 2.8, 0.17, 1.35, C.woodLight);
    for (const dx of [-1.1, 1.1]) for (const dz of [-0.43, 0.43]) cylinder(cx + dx, floor + 0.56, cz + 0.15 + dz, 0.065, 0.11, 1.13, C.wood);
    // The open book is modelled as pages, spine and a raised center crease.
    box(cx - 0.3, floor + 1.315, cz + 0.22, 0.49, 0.045, 0.63, C.paper, [0, -0.12, 0.08]);
    box(cx + 0.2, floor + 1.315, cz + 0.16, 0.49, 0.045, 0.63, C.paper, [0, -0.12, -0.08]);
    for (let i = 0; i < 5; i++) box(cx - 0.29, floor + 1.343, cz + 0.02 + i * 0.085, 0.3, 0.006, 0.009, '#c1ad8e', [0, -0.12, 0.08]);
    cylinder(cx + 0.9, floor + 1.34, cz + 0.35, 0.13, 0.1, 0.2, C.ivory);
    torus(cx + 1.02, floor + 1.35, cz + 0.35, 0.08, 0.023, C.ivory, [0, Math.PI / 2, 0]);
    // Two small piles, brass reading lamp and globe add readable interior detail.
    for (let i = 0; i < 3; i++) box(cx - 0.95, floor + 1.33 + i * 0.09, cz - 0.17, 0.47, 0.08, 0.4, [C.blue, C.sage, C.peach][i], [0, i * 0.12, 0]);
    cylinder(cx + 0.96, floor + 1.3, cz - 0.3, 0.19, 0.23, 0.07, C.brass, [0, 0, 0], metal);
    beam([cx + 0.96, floor + 1.34, cz - 0.3], [cx + 0.96, floor + 1.91, cz - 0.3], 0.035, C.brass, metal);
    bake(new THREE.SphereGeometry(0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), C.sage, [cx + 0.96, floor + 1.85, cz - 0.3], [1, 0.6, 1]);
    chair(cx - 0.55, floor, cz + 1.45, Math.PI);
    chair(cx + 0.55, floor, cz - 1.0, 0);
    pot(cx - 2.95, floor, cz + 2.65, 0.8); pot(cx + 2.95, floor, cz + 2.65, 0.8);
    pot(cx - 1.78, floor + 3.55, cz - 3, 0.35);
    for (const dx of [-2.75, 2.75]) {
      beam([cx + dx, spring, cz + 1.55], [cx + dx, spring - 0.8, cz + 1.55], 0.018, C.brass, metal);
      cylinder(cx + dx, spring - 0.85, cz + 1.55, 0.2, 0.15, 0.2, C.woodLight);
      pot(cx + dx, spring - 0.77, cz + 1.55, 0.29);
    }
  }

  function observatory(cx, cy, cz) {
    const floor = cy + 0.4, radius = 3.35;
    cylinder(cx, cy + 0.19, cz, radius + 0.25, radius + 0.42, 0.38, C.cream, [0, 0, 0], masonry, 96);
    cylinder(cx, floor-.035, cz, radius+.38, radius+.38,.09,C.ivory,[0,0,0],masonry,96);
    cylinder(cx, floor, cz, radius, radius, 0.12, '#d5baa0', [0, 0, 0], plain, 64);
    torus(cx, floor + 0.09, cz, radius - 0.1, 0.04, C.brass, [Math.PI / 2, 0, 0], metal);
    const spring = floor + 3.4;
    for (let i = 0; i < 16; i++) {
      const t = i / 16 * Math.PI * 2;
      const x = cx + Math.cos(t) * radius, z = cz + Math.sin(t) * radius;
      column(x,floor,z,3.4,.071);
      finial(x,spring+.035,z,.23);
      if (Math.sin(t) < 0.5 || Math.abs(Math.cos(t)) > 0.8) {
        const t2 = (i + 1) / 16 * Math.PI * 2;
        beam([x, floor + 0.95, z], [cx + Math.cos(t2) * radius, floor + 0.95, cz + Math.sin(t2) * radius], 0.06, C.brass, metal);
        box(cx + Math.cos(t + Math.PI / 16) * radius, floor + 0.46, cz + Math.sin(t + Math.PI / 16) * radius, 0.1, 0.9, 1.28, C.cream, [0, -t - Math.PI / 16, 0],masonry);
        const middle=t+Math.PI/16, wx=cx+Math.cos(middle)*radius,wz=cz+Math.sin(middle)*radius, wa=Math.PI/2-middle;
        framedArch(wx,floor+1.02,wz,1.16,2.26,wa);
        box(wx,floor+2.11,wz,1.2,2.28,.018,'#ffffff',[0,wa,0],glass);
      }
      const arc = [];
      for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI / 2; arc.push([cx + Math.cos(t) * Math.cos(a) * radius, spring + Math.sin(a) * 2.85, cz + Math.sin(t) * Math.cos(a) * radius]); }
      tube(arc, 0.048, C.brass, metal, 32);
    }
    for (const a of [0, .1,.24,.4,.55,.7,.85,1,1.15,1.3]) torus(cx, spring + Math.sin(a) * 2.85, cz, Math.cos(a) * radius, a === 0 ? 0.085 : 0.022, C.brass, [Math.PI / 2, 0, 0], metal);
    bake(new THREE.SphereGeometry(radius, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), '#ffffff', [cx, spring, cz], [1, 2.85 / radius, 1], [0, 0, 0], glass);
    cylinder(cx, spring + 2.91, cz, 0.3, 0.44, 0.15, C.brass, [0, 0, 0], metal);
    cylinder(cx, spring + 3.14, cz, 0.06, 0.1, 0.4, C.brass, [0, 0, 0], metal);
    finial(cx,spring+3.3,cz,.65);
    for(let i=0;i<32;i++) {
      const t=i/32*Math.PI*2;
      beam([cx+Math.cos(t)*(radius-.17),floor+.074,cz+Math.sin(t)*(radius-.17)],[cx+Math.cos(t)*(radius-.56),floor+.074,cz+Math.sin(t)*(radius-.56)],.009,C.brassLight,metal,6);
    }
    for(const dx of [-2.42,2.42]) lantern(cx+dx,floor+2.4,cz+2.32,.29);
    // A telescope with a real inclined barrel, mounting cradle and tripod.
    const pivot = new THREE.Vector3(cx + 0.2, floor + 2.2, cz - 0.6);
    const dir = new THREE.Vector3(-0.5, 0.62, -0.61).normalize();
    const a = pivot.clone().addScaledVector(dir, -0.72), b = pivot.clone().addScaledVector(dir, 1.5);
    beam(a.toArray(), b.toArray(), 0.25, C.cream);
    beam(b.clone().addScaledVector(dir, -0.12).toArray(), b.clone().addScaledVector(dir, 0.13).toArray(), 0.29, C.brass, metal, 24);
    beam(b.clone().addScaledVector(dir, 0.132).toArray(), b.clone().addScaledVector(dir, 0.145).toArray(), 0.23, '#54737f', plain, 24);
    beam(a.clone().addScaledVector(dir, -0.25).toArray(), a.toArray(), 0.1, C.ink, metal);
    cylinder(pivot.x, floor + 1.25, pivot.z, 0.11, 0.18, 1.9, C.brass, [0, 0, 0], metal);
    for (let i = 0; i < 3; i++) { const t = i * Math.PI * 2 / 3; beam([pivot.x, floor + 1.3, pivot.z], [pivot.x + Math.cos(t) * 1.2, floor + 0.08, pivot.z + Math.sin(t) * 1.2], 0.07, C.wood); }
    box(cx - 1.55, floor + 0.9, cz + 1.55, 1.35, 0.12, 0.78, C.woodLight);
    for (const dx of [-0.5, 0.5]) for (const dz of [-0.23, 0.23]) beam([cx - 1.55 + dx, floor, cz + 1.55 + dz], [cx - 1.55 + dx, floor + 0.85, cz + 1.55 + dz], 0.04, C.wood);
    box(cx - 1.55, floor + 0.98, cz + 1.55, 0.91, 0.035, 0.58, C.paper, [0, 0.15, 0]);
    for (let i = 0; i < 4; i++) box(cx, cy + 0.3 - i * 0.08, cz + 3.45 + i * 0.25, 2.5 + i * 0.15, 0.16, 0.4, C.cream,[0,0,0],masonry);
    pot(cx + 2.8, floor, cz + 1.0, 0.75);
    torus(cx + 4.0, cy + 1.4, cz + 1.0, 0.73, 0.035, C.brass, [0.15, 0, 0.15], metal);
    torus(cx + 4.0, cy + 1.4, cz + 1.0, 0.73, 0.035, C.brass, [0.15, Math.PI / 2, -0.4], metal);
    cylinder(cx + 4.0, cy + 0.45, cz + 1, 0.1, 0.25, 0.9, C.cream);
  }

  function pavilion(cx, cy, cz) {
    const radius = 2.85, floor = cy + 0.38, top = floor + 3.6;
    cylinder(cx, cy + 0.19, cz, radius + 0.2, radius + 0.4, 0.38, C.cream, [0, 0, 0], masonry, 8);
    cylinder(cx,floor-.035,cz,radius+.3,radius+.3,.09,C.ivory,[0,0,0],masonry,8);
    cylinder(cx, floor, cz, radius, radius, 0.08, '#dfc8ae', [0, 0, 0], masonry, 8);
    for (let i = 0; i < 8; i++) {
      const t = i / 8 * Math.PI * 2 + Math.PI / 8;
      const x = cx + Math.cos(t) * radius, z = cz + Math.sin(t) * radius;
      column(x,floor,z,3.6,.095);
      finial(x,top+.02,z,.31);
      const t2 = (i + 1) / 8 * Math.PI * 2 + Math.PI / 8;
      beam([x, top, z], [cx + Math.cos(t2) * radius, top, cz + Math.sin(t2) * radius], 0.1, C.cream);
      const mid=(t+t2)/2, mx=cx+Math.cos(mid)*radius*.924,mz=cz+Math.sin(mid)*radius*.924;
      framedArch(mx,top-1.16,mz,2.0,1.18,Math.PI/2-mid,false);
      for(let k=0;k<6;k++) {
        const p=k/5, px=x+(cx+Math.cos(t2)*radius-x)*p,pz=z+(cz+Math.sin(t2)*radius-z)*p;
        finial(px,top+.03,pz,.16);
      }
      const roof = [[x, top, z], [cx + Math.cos(t) * 2.2, top + 0.8, cz + Math.sin(t) * 2.2], [cx, top + 1.7, cz]];
      tube(roof, 0.055, C.brass, metal, 24);
    }
    bake(new THREE.ConeGeometry(radius + 0.15, 1.6, 48, 1, true), '#ffffff', [cx, top + 0.8, cz], [1, 1, 1], [0, 0, 0], glass);
    torus(cx, top + 0.15, cz, radius - 0.12, 0.075, C.brass, [Math.PI / 2, 0, 0], metal);
    cylinder(cx, top + 1.88, cz, 0.04, 0.14, 0.45, C.brass, [0, 0, 0], metal);
    finial(cx,top+2.05,cz,.55);
    beam([cx,top+1.4,cz],[cx,top-.65,cz],.015,C.brass,metal);
    lantern(cx,top-.92,cz,.4);
    // An easel and a small landscape painting constructed from coloured shapes.
    const ex = cx - 0.55, ez = cz - 0.45;
    beam([ex - 0.66, floor, ez + 0.25], [ex - 0.15, floor + 2.45, ez - 0.2], 0.065, C.wood);
    beam([ex + 0.66, floor, ez + 0.25], [ex + 0.15, floor + 2.45, ez - 0.2], 0.065, C.wood);
    beam([ex, floor, ez - 0.85], [ex, floor + 2.2, ez - 0.15], 0.055, C.wood);
    box(ex, floor + 1.55, ez + 0.12, 1.55, 1.25, 0.1, C.woodLight, [-0.1, 0, 0]);
    box(ex, floor + 1.55, ez + 0.19, 1.36, 1.07, 0.04, C.blue, [-0.1, 0, 0]);
    box(ex, floor + 1.23, ez + 0.23, 1.34, 0.42, 0.03, C.sage, [-0.1, 0, 0]);
    ball(ex + 0.35, floor + 1.83, ez + 0.22, 0.14, 0.14, 0.03, C.paper);
    box(ex, floor + 0.87, ez + 0.3, 1.8, 0.11, 0.3, C.wood);
    cylinder(cx + 1.32, floor + 0.8, cz + 0.8, 0.68, 0.68, 0.12, C.woodLight, [0, 0, 0], plain, 32);
    cylinder(cx + 1.32, floor + 0.38, cz + 0.8, 0.08, 0.18, 0.76, C.cream);
    for (let i = 0; i < 4; i++) cylinder(cx + 1.0 + i * 0.18, floor + 0.96, cz + 0.8, 0.06, 0.06, 0.2, [C.lilac, C.peach, C.sage, C.blue][i]);
    chair(cx + 1.35, floor, cz + 1.65, Math.PI);
    for (let i = 0; i < 3; i++) box(cx, cy + 0.3 - i * 0.1, cz + 3 + i * 0.25, 2.4 + i * 0.18, 0.2, 0.4, C.cream,[0,0,0],masonry);
    pot(cx + 2.4, floor, cz - 0.5, 0.6);
  }

  function bridge(start, end) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const direction = b.clone().sub(a), side = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    const point = (t, offset = 0, height = 0) => a.clone().lerp(b, t).addScaledVector(side, offset).add(new THREE.Vector3(0, Math.sin(t * Math.PI) * 0.8 + height, 0));
    const angle = Math.atan2(-direction.z, direction.x);
    const count = Math.ceil(direction.length() / 0.32);
    for (let i = 0; i <= count; i++) {
      const p = point(i / count);
      box(p.x, p.y, p.z, 0.29, 0.12, 1.35, i % 3 ? '#d6c3a3' : C.cream, [0, angle, 0]);
      if (i % 3 === 0) for (const s of [-1, 1]) beam(point(i / count, s * 0.67, 0).toArray(), point(i / count, s * 0.67, 0.95).toArray(), 0.04, C.brass, metal);
    }
    for (const s of [-1, 1]) {
      const rail = [], lower = [], arch = [];
      for (let i = 0; i <= 20; i++) { rail.push(point(i / 20, s * 0.67, 0.95).toArray()); lower.push(point(i / 20, s * 0.67, 0.4).toArray()); arch.push(point(i / 20, s * 0.62, -0.35 - Math.sin(i / 20 * Math.PI) * 0.35).toArray()); }
      tube(rail, 0.045, C.brass, metal); tube(lower, 0.025, C.brass, metal); tube(arch, 0.12, C.cream);
    }
  }

  function waterfall(x, y, z, width, length, phase = 0) {
    const bounds={research:[-12,0,6.25],projects:[0,-8,5.65],creative:[13,-1,5.65]}[currentDestination];
    if(bounds) {
      const [cx,cz,radius]=bounds, angle=Math.atan2(z-cz,x-cx), islandPhase=cx*.17+cz*.23;
      const edge=radius*(1+Math.sin(angle*3+islandPhase)*.075+Math.cos(angle*7-.7)*.058+Math.sin(angle*13+1.1)*.023)+.045;
      x=cx+Math.cos(angle)*edge; z=cz+Math.sin(angle)*edge;
    }
    const material = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPhase: { value: phase }, uLength: { value: length } },
      vertexShader: `uniform float uTime; uniform float uPhase; varying vec2 vUv;
        void main() { vUv=uv; vec3 p=position;
          p.x+=sin(uv.y*16.0+uTime*2.1+uPhase)*0.035*uv.y;
          p.z+=sin(uv.y*12.0-uTime*2.8+uPhase)*0.055*uv.y;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `uniform float uTime; uniform float uPhase; varying vec2 vUv;
        void main() {
          float wander=sin(vUv.x*19.0+uPhase)*2.1+sin(vUv.y*9.0-uTime*1.7+uPhase)*.55;
          float strand=pow(.5+.5*sin(vUv.x*73.0+wander),3.0);
          float flow=.5+.5*sin(vUv.y*19.0+uTime*4.2+sin(vUv.x*13.0+uPhase)*3.0+sin(vUv.y*7.0+uTime*1.1));
          float edge=smoothstep(0.0,.17,vUv.x)*smoothstep(0.0,.17,1.0-vUv.x);
          float fade=smoothstep(0.0,.23,vUv.y);
          vec3 water=mix(vec3(.73,.83,.81),vec3(.98,.965,.90),.4+strand*.42+flow*.13);
          gl_FragColor=vec4(water,(.39+strand*.21+flow*.075)*edge*fade);
        }`,
    });
    const geometry = new THREE.PlaneGeometry(width, length, 12, 64);
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y - length / 2, z); parent().add(mesh);
    resources.push(geometry); ownedMaterials.push(material);
    // A slightly rotated second ribbon gives flowing water a visible volume.
    const second = new THREE.Mesh(geometry, material); second.position.copy(mesh.position); second.rotation.y = 0.32; parent().add(second);
    animated.push(time => { material.uniforms.uTime.value = time; });
    // Watercourse leads across the island edge into the same descending stream.
    box(x, y - 0.04, z - 0.45, width * 0.87, 0.035, 1.0, '#d1ded3');
    for (let i = 0; i < 4; i++) ball(x + (rand() - 0.5) * width, y - 0.02, z - 0.3 + rand() * 0.6, width * 0.25, 0.03, 0.16, '#e6ecdc', 8);
    const particlePositions = new Float32Array(70 * 3);
    const speeds = new Float32Array(70), offsets = new Float32Array(70);
    for (let i = 0; i < 70; i++) { particlePositions[i * 3] = x + (rand() - 0.5) * width * 1.2; particlePositions[i * 3 + 1] = y - rand() * length; particlePositions[i * 3 + 2] = z + (rand() - 0.5) * 0.55; speeds[i] = 0.4 + rand() * 0.35; offsets[i] = rand(); }
    const particlesGeo = new THREE.BufferGeometry(); particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: '#fff3dd', size: 0.045, transparent: true, opacity: 0.58, depthWrite: false });
    const points = new THREE.Points(particlesGeo, particleMat); parent().add(points); resources.push(particlesGeo); ownedMaterials.push(particleMat);
    animated.push(time => { const p = particlesGeo.attributes.position.array; for (let i = 0; i < 70; i++) p[i * 3 + 1] = y - ((time * speeds[i] * 0.23 + offsets[i]) % 1) * length; particlesGeo.attributes.position.needsUpdate = true; });
  }

  currentDestination = 'research';
  makeIsland(-12, 0, 0, 6.25, 10.4); library(-12, 0, 0);
  waterfall(-9.0, 0.05, 5.15, 0.95, 11.2, 0.3);
  waterfall(-8.05, -0.1, 4.65, 0.45, 8.8, 1.4);
  currentDestination = 'projects';
  makeIsland(0, 1, -8, 5.65, 9.3); observatory(0, 1, -8);
  waterfall(1.1, 1.02, -2.85, 0.85, 10.3, 2.1);
  waterfall(2.0, 0.8, -2.9, 0.4, 8.1, 3.2);
  currentDestination = 'creative';
  makeIsland(13, 0, -1, 5.65, 9.8); pavilion(13, 0, -1);
  waterfall(14.1, 0.02, 4.2, 1.0, 11.0, 4.8);
  waterfall(15.1, -0.1, 3.9, 0.43, 8.5, 1.8);
  currentDestination = null;
  bridge([-6.55, 0.16, -1.7], [-4.2, 1.15, -4.6]);
  bridge([4.55, 1.15, -5.5], [8.0, 0.15, -2.9]);
  // Smaller distant islands establish depth and scale without image backdrops.
  for (const [x, y, z, r, depth] of [[-24, -5, -21, 2.8, 5.8], [24, 4, -27, 2.7, 5.3], [-4, -10, -25, 2.1, 4.5], [29, -5, -12, 2.3, 4.8]]) {
    makeIsland(x, y, z, r, depth);
    for(let i=0;i<4;i++) {
      const tx=x+Math.cos(i*2.4)*r*.43,tz=z+Math.sin(i*2.4)*r*.43,h=1.3+(i%3)*.55;
      cylinder(tx,y+h/2,tz,.22,.29,h,C.cream,[0,0,0],masonry,12);
      bake(new THREE.ConeGeometry(.34,.85,12), '#647c76', [tx,y+h+.42,tz]);
      finial(tx,y+h+.82,tz,.25);
    }
  }

  // Fine castle silhouettes occupy the far cloud layers. They are deliberately
  // small and lightly modelled, so atmospheric depth keeps the main islands clear.
  for(const [x,y,z,r] of [[-25,-3,-45,2.6],[26,10,-50,2.9],[5,-9,-60,2.3]]) {
    makeIsland(x,y,z,r,r*2.1,true);
    const towers=[[-.72,-.3,2.2],[.65,-.43,2.8],[-.18,.53,1.65],[.12,-.68,3.5]];
    for(const [dx,dz,h] of towers) {
      const tx=x+dx*r*.8,tz=z+dz*r*.8,rad=h>3?.32:.23;
      cylinder(tx,y+h/2,tz,rad,rad*1.18,h,'#c6bda6',[0,0,0],masonry,8);
      cylinder(tx,y+h-.1,tz,rad*1.2,rad*1.2,.14,'#d2c5ab',[0,0,0],masonry,8);
      bake(new THREE.ConeGeometry(rad*1.5,h*.35,8),'#586a6d',[tx,y+h+h*.175,tz]);
      beam([tx,y+h*1.35,tz],[tx,y+h*1.35+.32,tz],.025,C.brass,metal,5);
      if(h>2) box(tx,y+h*.69,tz+rad+.005,.085,.34,.012,'#5b5d58');
    }
    for(const side of [-1,1]) {
      // Separate piers and a raised lintel leave a real open gate through the ruin.
      box(x+side*.47,y+.66,z+r*.42,.4,1.32,.2,'#c1b79d',[0,0,0],masonry);
      box(x+side*.91,y+.8,z,.18,1.6,r*1.02,'#bbb49d',[0,0,0],masonry);
      for(let i=0;i<4;i++) box(x+side*.91,y+1.72,z-r*.44+i*r*.29,.2,.25,.19,'#c9bca4',[0,0,0],masonry);
    }
    box(x,y+1.37,z+r*.42,1.34,.24,.23,'#d0c1a5',[0,0,0],masonry);
    for(let i=0;i<5;i++) box(x-.6+i*.3,y+1.58,z+r*.42,.15,.22,.25,'#c9bca4',[0,0,0],masonry);
  }

  // Merge the static world by material (rather than hundreds of scene objects).
  for (const { material, geometries, parent: meshParent } of buckets.values()) {
    const merged = mergeGeometries(geometries, false);
    for (const g of geometries) g.dispose();
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = material !== glass; mesh.receiveShadow = material !== glass;
    if (material === glass) mesh.renderOrder = 2;
    mesh.name = material === glass ? 'Continuous architectural glazing' : 'Modelled architecture and gardens';
    meshParent.add(mesh); resources.push(merged);
  }

  const vegetation = createVegetation();
  group.add(vegetation.group);

  const destinations = {
    research: { label: new THREE.Vector3(-9.5, 6, 2), position: new THREE.Vector3(-9.5, 6, 2), center: new THREE.Vector3(-12, 2.6, 0), entrance: new THREE.Vector3(-12, 4.8, 10), camera: new THREE.Vector3(-12, 3.2, 3.1), target: new THREE.Vector3(-12, 2.5, -1.2) },
    projects: { label: new THREE.Vector3(0, 9.0, -8), position: new THREE.Vector3(0, 9.0, -8), center: new THREE.Vector3(0, 3.8, -8), entrance: new THREE.Vector3(0, 5.5, 1.5), camera: new THREE.Vector3(0.3, 5.0, -2.0), target: new THREE.Vector3(0, 3.7, -8) },
    creative: { label: new THREE.Vector3(13, 6.9, -1), position: new THREE.Vector3(13, 6.9, -1), center: new THREE.Vector3(13, 2.5, -1), entrance: new THREE.Vector3(13, 4.5, 8.0), camera: new THREE.Vector3(13, 3.5, 4.5), target: new THREE.Vector3(13, 2.5, -1.6) },
  };
  return {
    group,
    destinations,
    update(elapsed, delta, motion = true) {
      if (!motion) return;
      for (const animate of animated) animate(elapsed);
      vegetation.update(elapsed);
    },
    dispose() {
      vegetation.dispose();
      for (const geometry of resources) geometry.dispose();
      for (const material of ownedMaterials) material.dispose();
    },
  };
}
