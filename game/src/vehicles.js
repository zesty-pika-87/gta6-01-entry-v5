// Vehicles: the low-poly cars of Costa Palma, built from boxes, and the
// driving model — steal any car, drive it, park it in the garage.
import * as THREE from 'three';
import { CFG, PALETTE } from './config.js';
import { pick } from './random.js';

export const CAR_MODELS = [
  { name: 'COMET', kind: 'sport', top: 46 },
  { name: 'VIREO GT', kind: 'sport', top: 44 },
  { name: 'RUKAN PELO GT', kind: 'sport', top: 45 },
  { name: 'CALYX SPRINT GT', kind: 'sedan', top: 40 },
  { name: 'TAXI SOL', kind: 'taxi', top: 36 },
  { name: 'MARINA VAN', kind: 'van', top: 32 },
  { name: 'PALMA SEDAN', kind: 'sedan', top: 38 },
];

function box(w, h, d, color, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// Build one car group: body, cabin, wheels, lights. `police` adds the light
// bar and the white-and-black cruiser paint; `taxi` adds the roof sign.
export function buildCarMesh(model, colorHex, opts = {}) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: opts.police ? 0xf2f2f2 : colorHex });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1c2733 });
  const body = box(2, 0.75, 4.4, 0, 0, 0.55, 0, bodyMat);
  g.add(body);
  const cabin = box(1.7, 0.65, 2.2, 0, 0, 1.15, -0.2, darkMat);
  g.add(cabin);
  if (opts.police) {
    g.add(box(2.02, 0.3, 1.4, 0, 0, 0.5, 1.2, new THREE.MeshLambertMaterial({ color: 0x1c2733 })));
  }
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x14141a });
  for (const [x, z] of [[-0.95, 1.5], [0.95, 1.5], [-0.95, -1.5], [0.95, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.42, z);
    g.add(w);
  }
  // Headlights + taillights.
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
  for (const x of [-0.7, 0.7]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.1), headMat);
    h.position.set(x, 0.55, 2.22); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.1), tailMat);
    t.position.set(x, 0.55, -2.22); g.add(t);
  }
  let lightBar = null;
  if (opts.police) {
    lightBar = new THREE.Group();
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.4), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    red.position.set(-0.4, 1.62, -0.2);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.4), new THREE.MeshBasicMaterial({ color: 0x2266ff }));
    blue.position.set(0.4, 1.62, -0.2);
    lightBar.add(red); lightBar.add(blue);
    lightBar.userData = { red, blue };
    g.add(lightBar);
  }
  if (opts.taxi) {
    const sign = box(0.9, 0.3, 0.5, 0, 0, 1.6, -0.2, new THREE.MeshBasicMaterial({ color: 0xffd166 }));
    g.add(sign);
  }
  g.userData.lightBar = lightBar;
  return g;
}

export function createVehicles(scene, rng) {
  const cars = [];

  function spawnCar(model, x, z, angle, opts = {}) {
    const mesh = buildCarMesh(model, opts.color ?? pick(rng, PALETTE.car), opts);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = angle;
    scene.add(mesh);
    const car = {
      mesh, model, x, z, angle, speed: 0,
      condition: 100, stolen: false, isPlayer: false,
      top: model.top ?? 38, kind: model.kind ?? 'sedan',
    };
    cars.push(car);
    return car;
  }

  function nearestCar(x, z, maxDist) {
    let best = null, bd = maxDist;
    for (const c of cars) {
      if (c.isPlayer) continue;
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  // Simple arcade drive: accelerate, brake, reverse, steer harder at speed.
  function drive(car, forward, steer, dt) {
    const accel = forward > 0 ? CFG.carAccel : forward < 0 ? CFG.carBrake : 0;
    car.speed += accel * forward * dt;
    if (forward === 0) car.speed *= Math.pow(0.4, dt);
    if (forward < 0 && car.speed < 0) car.speed = Math.max(car.speed, -CFG.carReverse);
    car.speed = Math.min(car.speed, car.top);
    if (Math.abs(car.speed) > 0.5) {
      car.angle += steer * CFG.carTurn * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 12);
    }
    car.x += Math.sin(car.angle) * car.speed * dt;
    car.z += Math.cos(car.angle) * car.speed * dt;
    // Keep the car inside the city.
    car.x = Math.max(-124, Math.min(124, car.x));
    car.z = Math.max(-124, Math.min(124, car.z));
    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.angle;
  }

  return { cars, spawnCar, nearestCar, drive };
}
