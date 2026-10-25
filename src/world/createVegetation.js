import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Small, individually lit leaves keep their silhouette when the camera comes
// close. There are no canopy spheres, image cards, sprites, or foliage maps.
export function createVegetation() {
  const group = new THREE.Group();
  group.name = 'Living island gardens';
  let seed = 7042026;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const between = (a, b) => a + random() * (b - a);
  const choose = values => values[Math.floor(random() * values.length)];
  const greens = ['#284b2d', '#395b32', '#4b6d39', '#638442', '#7e944d', '#9d9e56'];
  const pinks = ['#d66d93', '#e08cab', '#e7a8bb', '#f2bed0', '#f7d3d4', '#d183a6'];
  const flowers = ['#c8b1e6', '#a28ecb', '#d4bce9', '#efb7c5', '#d582a5', '#f7e4b1'];
  const disposable = new Set();
  const wind = { value: 0 };
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  function leafGeometry(round = false) {
    const geometry = new THREE.BufferGeometry();
    // A lifted central vein folds each side into three planes. Rounder petals
    // have a broad tip, while leaves finish with a narrow, pointed tip.
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      -0.29, 0.29, 0.025,
      -0.31, 0.68, 0.012,
      round ? -0.11 : 0, 1, 0.055,
      0.31, 0.68, 0.012,
      0.29, 0.29, 0.025,
      0, 0.48, 0.15,
      ...(round ? [0.11, 1, 0.055] : []),
    ], 3));
    geometry.setIndex(round
      ? [0, 1, 6, 1, 2, 6, 2, 3, 6, 3, 7, 6, 7, 4, 6, 4, 5, 6, 5, 0, 6]
      : [0, 1, 6, 1, 2, 6, 2, 3, 6, 3, 4, 6, 4, 5, 6, 5, 0, 6]);
    geometry.computeVertexNormals();
    disposable.add(geometry);
    return geometry;
  }
  const leaf = leafGeometry();
  const petal = leafGeometry(true);
  const blade = new THREE.BufferGeometry();
  blade.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.055, 0, 0, 0.055, 0, 0, -0.035, 0.48, 0.035,
    0.035, 0.48, 0.035, 0.10, 1, 0.13,
  ], 3));
  blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  blade.computeVertexNormals();
  disposable.add(blade);

  function foliageMaterial(roughness, strength) {
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff', roughness, metalness: 0, side: THREE.DoubleSide,
    });
    material.onBeforeCompile = shader => {
      shader.uniforms.gardenTime = wind;
      shader.vertexShader = 'uniform float gardenTime;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 gardenAnchor = instanceMatrix[3].xyz;
          float gardenBreeze = sin(gardenTime * 0.7 + gardenAnchor.x * 0.68 + gardenAnchor.z * 0.49);
          float gardenFlutter = sin(gardenTime * 1.4 + gardenAnchor.y * 2.7 + gardenAnchor.x * 2.1);
          transformed.x += position.y * (gardenBreeze * ${strength.toFixed(3)} + gardenFlutter * ${(strength * 0.24).toFixed(3)});
          transformed.z += position.y * gardenBreeze * ${(strength * 0.5).toFixed(3)};
        #endif
      `);
    };
    material.customProgramCacheKey = () => 'island-foliage-' + strength;
    disposable.add(material);
    return material;
  }
  const leafMaterial = foliageMaterial(0.88, 0.075);
  const petalMaterial = foliageMaterial(0.94, 0.045);
  const grassMaterial = foliageMaterial(0.95, 0.14);
  const woodMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 });
  disposable.add(woodMaterial);

  function garden(id, cx, cy, cz, radius) {
    const island = new THREE.Group();
    island.name = id + ' detailed garden';
    island.userData.destination = id;
    group.add(island);
    return { id, cx, cy, cz, radius, group: island, leaves: [], petals: [], grass: [], wood: [] };
  }
  const research = garden('research', -12, 0, 0, 6.25);
  const projects = garden('projects', 0, 1, -8, 5.65);
  const creative = garden('creative', 13, 0, -1, 5.65);
  const gardens = [research, projects, creative];

  function add(bucket, point, size, color, rotation, width = 1) {
    bucket.push({ point, size, color, rotation: rotation || [between(-1.2, 1.2), between(0, Math.PI * 2), between(-1.8, 1.8)], width });
  }

  function branch(g, points, radius, color = '#73583f', taper = true) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const geometry = new THREE.TubeGeometry(path, Math.max(4, points.length * 3), radius, 5, false).toNonIndexed();
    if (taper) {
      const positions = geometry.attributes.position;
      const uv = geometry.attributes.uv;
      for (let i = 0; i < positions.count; i++) {
        const t = uv.getX(i);
        const center = path.getPointAt(t);
        const factor = 1 - t * 0.66;
        positions.setXYZ(i,
          center.x + (positions.getX(i) - center.x) * factor,
          center.y + (positions.getY(i) - center.y) * factor,
          center.z + (positions.getZ(i) - center.z) * factor);
      }
      geometry.computeVertexNormals();
    }
    geometry.deleteAttribute('uv');
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    tint.set(color);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = tint.r; colors[i + 1] = tint.g; colors[i + 2] = tint.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.wood.push(geometry);
  }

  function leafCluster(g, x, y, z, spread, count, palette = greens, leafSize = 0.23) {
    for (let j = 0; j < count; j++) {
      const a = between(0, Math.PI * 2);
      const v = between(-1, 1);
      const r = Math.cbrt(random());
      const disc = Math.sqrt(1 - v * v);
      const point = [x + Math.cos(a) * disc * spread[0] * r,
        y + v * spread[1] * r, z + Math.sin(a) * disc * spread[2] * r];
      add(g.leaves, point, leafSize * between(0.62, 1.28), choose(palette),
        [between(-1.5, 1.5), a + between(-1, 1), between(-2.2, 2.2)], between(0.65, 1.2));
    }
  }

  function blossom(g, x, y, z, size, palette = pinks) {
    const orientation = new THREE.Quaternion().setFromEuler(new THREE.Euler(between(-0.7, 0.7), between(0, 6.28), between(-0.7, 0.7)));
    const center = new THREE.Vector3(x, y, z);
    for (let p = 0; p < 5; p++) {
      const angle = p / 5 * Math.PI * 2;
      const radial = new THREE.Vector3(Math.sin(angle) * size * 0.18, 0, Math.cos(angle) * size * 0.18).applyQuaternion(orientation);
      const q = orientation.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.9, angle, 0)));
      const e = new THREE.Euler().setFromQuaternion(q);
      add(g.petals, center.clone().add(radial).toArray(), size, choose(palette), [e.x, e.y, e.z], 1.3);
    }
  }

  function broadTree(g, x, z, height, width, flowering = false) {
    const y = g.cy + 0.08;
    const lean = between(-0.35, 0.35);
    branch(g, [[x, y, z], [x + lean, y + height * 0.30, z - 0.15],
      [x - lean * 0.2, y + height * 0.66, z - 0.1], [x + 0.22, y + height * 0.91, z - 0.18]],
    flowering ? 0.18 : 0.24, '#66503b');
    // Exposed roots and crooked forks prevent the tree reading as a lollipop.
    for (let root = 0; root < 3; root++) {
      const a = root / 3 * 6.28 + 0.5;
      branch(g, [[x + Math.cos(a) * 0.6, y + 0.015, z + Math.sin(a) * 0.6],
        [x + Math.cos(a) * 0.25, y + 0.12, z + Math.sin(a) * 0.25], [x, y + 0.65, z]], 0.065, '#66503b');
    }
    const count = flowering ? 10 : 12;
    for (let b = 0; b < count; b++) {
      const ring = b % 3;
      const a = b * 2.39996 + between(-0.2, 0.2);
      const reach = width * (1 - ring * 0.14) * between(0.76, 1.06);
      const start = [x + lean * 0.2, y + height * (0.4 + ring * 0.12), z - 0.12];
      const end = [x + Math.cos(a) * reach, y + height * (0.66 + ring * 0.12) + between(-0.18, 0.18), z + Math.sin(a) * reach];
      branch(g, [start,
        [x + Math.cos(a) * reach * 0.45, start[1] + height * 0.18, z + Math.sin(a) * reach * 0.40], end],
      flowering ? 0.07 : 0.09, b % 2 ? '#806345' : '#67533e');
      leafCluster(g, ...end, [width * 0.42, flowering ? 0.55 : 0.39, width * 0.35], flowering ? 90 : 290,
        flowering ? ['#485f37', '#647340', '#7f884b'] : greens, flowering ? 0.20 : 0.25);
      if (flowering) {
        for (let f = 0; f < 110; f++) {
          const theta = between(0, Math.PI * 2);
          const distance = Math.sqrt(random());
          blossom(g, end[0] + Math.cos(theta) * width * 0.45 * distance,
            end[1] + between(-0.47, 0.48), end[2] + Math.sin(theta) * width * 0.39 * distance,
            between(0.12, 0.21));
        }
      }
    }
  }

  function cypress(g, x, z, height, width = 0.52) {
    const y = g.cy + 0.06;
    branch(g, [[x, y, z], [x - 0.06, y + height * 0.48, z], [x + 0.07, y + height, z - 0.04]], 0.095, '#63583c');
    for (let i = 0; i < 480; i++) {
      const t = between(0.12, 0.98);
      const a = between(0, Math.PI * 2);
      const envelope = Math.sin(t * Math.PI) ** 0.6 * width * between(0.35, 1);
      add(g.leaves, [x + Math.cos(a) * envelope, y + t * height, z + Math.sin(a) * envelope],
        between(0.20, 0.32), choose(['#284a2e', '#375735', '#476737', '#5c7642', '#7a874c']),
        [Math.cos(a) * 0.2, a, Math.sin(a) * 0.32], 0.46);
    }
  }

  // All trunks stay clear of the three building footprints and the +Z paths.
  broadTree(research, -17.8, -2.3, 5.4, 1.9);
  broadTree(research, -6.3, -2.7, 4.2, 1.35);
  cypress(research, -15.0, -4.45, 5.1, 0.40);
  cypress(research, -8.4, -4.0, 4.2, 0.38);
  cypress(projects, -3.9, -10.6, 6.4, 0.51);
  cypress(projects, -2.8, -12.1, 5.5, 0.43);
  cypress(projects, 3.7, -10.8, 5.4, 0.44);
  cypress(projects, 4.45, -8.9, 4.2, 0.35);
  broadTree(creative, 8.65, -2.3, 5.2, 1.8, true);
  broadTree(creative, 13.6, -5.65, 5.9, 2.2, true);
  broadTree(creative, 17.45, -2.2, 4.6, 1.7, true);

  for (const g of gardens) {
    // Flowering banks follow the lip, leaving a wide walking route in front.
    for (let bank = 0; bank < 18; bank++) {
      const angle = bank / 18 * Math.PI * 2 + 0.12;
      const localX = Math.cos(angle) * (g.radius - 0.5);
      const localZ = Math.sin(angle) * (g.radius - 0.5);
      if (localZ > 2 && Math.abs(localX) < 2.5) continue;
      const x = g.cx + localX, z = g.cz + localZ;
      leafCluster(g, x, g.cy + 0.22, z, [0.77, 0.38, 0.57], 130, greens, 0.23);
      const count = bank % 3 === 0 ? 26 : 18;
      for (let f = 0; f < count; f++) {
        const px = x + between(-0.43, 0.43), pz = z + between(-0.32, 0.32);
        blossom(g, px, g.cy + between(0.27, 0.53), pz, between(0.065, 0.105), flowers);
      }
      for (let tuft = 0; tuft < 9; tuft++) {
        const gx = x + between(-0.55, 0.55), gz = z + between(-0.45, 0.45);
        for (let b = 0; b < 4; b++) {
          add(g.grass, [gx, g.cy + 0.04, gz], between(0.15, 0.38), choose(greens),
            [between(-0.28, 0.28), between(0, Math.PI * 2), between(-0.28, 0.28)]);
        }
      }
    }

    // Ivy strands have thin curving stems and alternating leaves. Each strand
    // hugs the cliff profile instead of falling as an opaque vegetation blob.
    for (let vine = 0; vine < 30; vine++) {
      const angle = vine / 30 * Math.PI * 2 + between(-0.12, 0.12);
      if (Math.sin(angle) > 0.75 && Math.abs(Math.cos(angle)) < 0.22) continue;
      const length = between(1.6, 4.3);
      const points = [];
      for (let p = 0; p < 6; p++) {
        const t = p / 5;
        const radius = g.radius * (1.015 - t * 0.19);
        const offset = Math.sin(t * 5.5 + vine) * 0.12;
        points.push([g.cx + Math.cos(angle) * radius + offset,
          g.cy + 0.05 - t * length,
          g.cz + Math.sin(angle) * radius + offset * 0.5]);
      }
      branch(g, points, 0.012, '#5e7042', false);
      const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
      for (let l = 0; l < 60; l++) {
        const t = l / 60;
        const p = path.getPoint(t);
        const side = l % 2 ? -1 : 1;
        const offset = between(0.06, 0.15) * side;
        p.x += Math.sin(angle) * offset;
        p.z -= Math.cos(angle) * offset;
        add(g.leaves, p.toArray(), between(0.14, 0.24), choose(greens),
          [between(-0.6, 0.6), -angle + Math.PI * 0.5, side * between(1.4, 2.3)], 1.1);
      }
    }
  }

  function instantiate(g, data, geometry, material, name) {
    if (!data.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, data.length);
    mesh.name = name;
    mesh.userData.destination = g.id;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      dummy.position.set(...d.point);
      dummy.rotation.set(...d.rotation);
      dummy.scale.set(d.size * d.width, d.size, d.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tint.set(d.color));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    g.group.add(mesh);
  }
  for (const g of gardens) {
    instantiate(g, g.leaves, leaf, leafMaterial, 'Individual folded leaves');
    instantiate(g, g.petals, petal, petalMaterial, 'Individual flower petals');
    instantiate(g, g.grass, blade, grassMaterial, 'Fine garden grasses');
    if (g.wood.length) {
      const merged = mergeGeometries(g.wood, false);
      g.wood.forEach(geometry => geometry.dispose());
      disposable.add(merged);
      const woody = new THREE.Mesh(merged, woodMaterial);
      woody.name = 'Curving trunks branches and climbing stems';
      woody.userData.destination = g.id;
      woody.castShadow = true;
      woody.receiveShadow = true;
      g.group.add(woody);
    }
  }
  group.userData.foliageInstances = gardens.reduce((sum, g) => sum + g.leaves.length + g.petals.length + g.grass.length, 0);
  return {
    group,
    update(time) { wind.value = time; },
    dispose() {
      group.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
      disposable.forEach(resource => resource.dispose());
    },
  };
}
