// Facades: warm, varied buildings with lit windows, rooftop clutter, shop
// awnings and glowing original store signs. Instanced meshes keep the draw
// calls low while every block still looks different.
import * as THREE from 'three';
import { PALETTE } from './config.js';
import { blockRects } from './world.js';
import { pick, range } from './random.js';

const SIGN_NAMES = [
  'MANGO & RYE', 'PALMA', 'MARINA', 'SOL BAR', 'NEON', 'TACOS EL SOL',
  'CAFÉ LUNA', 'SURF SHOP', 'HOTEL BRISA', 'LA PLAYA', 'PIER 5', 'DON TOMAS',
];

// A glowing shop sign painted on a canvas at runtime — no image files, no
// network, just the city's own names in neon.
export function makeSignTexture(name, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14121f';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = color; ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 250, 58);
  ctx.fillStyle = color;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name, 128, 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBuildings(scene, rng) {
  const rects = blockRects();
  const group = new THREE.Group();
  scene.add(group);

  const buildingSpots = [];
  for (const r of rects) {
    // The plaza block stays open for the fountain; the docks stay low.
    if (Math.abs(r.x0) < 20 && Math.abs(r.z0) < 20) continue;
    const n = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i += 1) {
      const w = range(rng, 12, 20), d = range(rng, 12, 20);
      const x = range(rng, r.x0 + w / 2 + 1, r.x1 - w / 2 - 1);
      const z = range(rng, r.z0 + d / 2 + 1, r.z1 - d / 2 - 1);
      const h = range(rng, 9, 30);
      buildingSpots.push({ x, z, w, d, h, color: pick(rng, PALETTE.facade) });
    }
  }

  // One instanced mesh for every building box, coloured per instance.
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const boxMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const boxes = new THREE.InstancedMesh(boxGeo, boxMat, buildingSpots.length);
  const m = new THREE.Matrix4(); const q = new THREE.Quaternion();
  const p = new THREE.Vector3(); const s = new THREE.Vector3();
  const col = new THREE.Color();
  buildingSpots.forEach((b, i) => {
    p.set(b.x, b.h / 2, b.z); s.set(b.w, b.h, b.d);
    m.compose(p, q, s); boxes.setMatrixAt(i, m);
    boxes.setColorAt(i, col.set(b.color));
  });
  boxes.castShadow = true; boxes.receiveShadow = true;
  group.add(boxes);

  // Lit windows: one instanced plane, warm or dark per instance, on the
  // street-facing sides of every building.
  const winGeo = new THREE.PlaneGeometry(1.5, 2);
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const winSpots = [];
  for (const b of buildingSpots) {
    const floors = Math.max(2, Math.floor(b.h / 4));
    const cols = Math.max(2, Math.floor(b.w / 3.4));
    for (let f = 0; f < floors; f += 1) {
      for (let c = 0; c < cols; c += 1) {
        const lit = rng() < 0.55;
        const wx = b.x - b.w / 2 + 2 + c * 3.2;
        const wy = 3 + f * 3.6;
        winSpots.push({ x: wx, y: wy, z: b.z + b.d / 2 + 0.06, ry: 0, lit });
        winSpots.push({ x: wx, y: wy, z: b.z - b.d / 2 - 0.06, ry: Math.PI, lit: rng() < 0.5 });
      }
    }
  }
  const wins = new THREE.InstancedMesh(winGeo, winMat, winSpots.length);
  const e = new THREE.Euler();
  winSpots.forEach((w, i) => {
    e.set(0, w.ry, 0); q.setFromEuler(e);
    p.set(w.x, w.y, w.z); s.set(1, 1, 1);
    m.compose(p, q, s); wins.setMatrixAt(i, m);
    wins.setColorAt(i, col.set(w.lit ? 0xffd98a : 0x2e3440));
  });
  group.add(wins);

  // Rooftop clutter: AC boxes, antennae, water tanks.
  const roofGeo = new THREE.BoxGeometry(1.4, 1, 1.4);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x8a8f98 });
  const roofs = new THREE.InstancedMesh(roofGeo, roofMat, buildingSpots.length * 2);
  let ri = 0;
  for (const b of buildingSpots) {
    for (let k = 0; k < 2; k += 1) {
      p.set(b.x + range(rng, -b.w / 4, b.w / 4), b.h + 0.5, b.z + range(rng, -b.d / 4, b.d / 4));
      q.identity(); s.set(1, 1, 1);
      m.compose(p, q, s); roofs.setMatrixAt(ri, m); ri += 1;
    }
  }
  roofs.count = ri;
  group.add(roofs);

  // Shop awnings + glowing signs along the street-facing ground floors.
  const awnGeo = new THREE.BoxGeometry(6, 0.25, 2.4);
  const awnMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const awns = new THREE.InstancedMesh(awnGeo, awnMat, buildingSpots.length);
  let ai = 0;
  for (const b of buildingSpots) {
    if (b.h > 18 || rng() < 0.35) continue;
    p.set(b.x, 3.4, b.z + b.d / 2 + 1.1); q.identity(); s.set(1, 1, 1);
    m.compose(p, q, s); awns.setMatrixAt(ai, m);
    awns.setColorAt(ai, col.set(pick(rng, PALETTE.neon)));
    ai += 1;
  }
  awns.count = ai;
  group.add(awns);

  const signs = [];
  for (let i = 0; i < 12; i += 1) {
    const b = buildingSpots[Math.floor(rng() * buildingSpots.length)];
    const tex = makeSignTexture(SIGN_NAMES[i % SIGN_NAMES.length], '#' + new THREE.Color(pick(rng, PALETTE.neon)).getHexString());
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 1.75),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    sign.position.set(b.x, 5.2, b.z + b.d / 2 + 0.12);
    group.add(sign);
    signs.push(sign);
  }

  return { group, spots: buildingSpots, signs };
}
