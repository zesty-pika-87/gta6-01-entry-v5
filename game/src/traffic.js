// Traffic: AI cars that cruise the road grid, turn at intersections and
// swerve when something blocks their lane. They are the city breathing.
import * as THREE from 'three';
import { CFG } from './config.js';
import { roadLines } from './world.js';
import { buildCarMesh, CAR_MODELS } from './vehicles.js';
import { pick, range } from './random.js';

export function createTraffic(scene, rng, count) {
  const lines = roadLines();
  const cars = [];

  function randomLane() {
    const road = pick(rng, lines);
    const along = range(rng, -110, 110);
    const vertical = rng() < 0.5;
    const side = rng() < 0.5 ? -3 : 3;
    return vertical
      ? { x: road + side, z: along, angle: side < 0 ? 0 : Math.PI }
      : { x: along, z: road + side, angle: side < 0 ? Math.PI / 2 : -Math.PI / 2 };
  }

  for (let i = 0; i < count; i += 1) {
    const lane = randomLane();
    const model = pick(rng, CAR_MODELS);
    const mesh = buildCarMesh(model, pick(rng, [0xe63946, 0xf4a261, 0x2a9d8f, 0x457b9d, 0xf1fa8c, 0xffffff, 0xff6d9d]), {
      taxi: model.kind === 'taxi',
    });
    mesh.position.set(lane.x, 0, lane.z);
    mesh.rotation.y = lane.angle;
    scene.add(mesh);
    cars.push({
      mesh, model, x: lane.x, z: lane.z, angle: lane.angle,
      speed: range(rng, 8, 15), vertical: Math.abs(Math.sin(lane.angle)) < 0.5,
      road: lane.x, targetSpeed: range(rng, 9, 16), swerve: 0,
    });
  }

  // One step: follow the lane, slow for the car ahead, turn at the grid edge.
  function step(dt, obstacles) {
    for (const c of cars) {
      let slow = false;
      for (const o of obstacles) {
        const dx = o.x - c.x, dz = o.z - c.z;
        const d = Math.hypot(dx, dz);
        if (d < 7 && d > 0.1) {
          const ahead = Math.sin(c.angle) * dx + Math.cos(c.angle) * dz;
          if (ahead > 0) { slow = true; c.swerve = dx * Math.cos(c.angle) - dz * Math.sin(c.angle) > 0 ? -1 : 1; }
        }
      }
      const target = slow ? 0 : c.targetSpeed;
      c.speed += (target - c.speed) * Math.min(1, dt * 1.5);
      c.x += Math.sin(c.angle) * c.speed * dt;
      c.z += Math.cos(c.angle) * c.speed * dt;
      if (c.swerve !== 0) {
        c.x += Math.cos(c.angle) * c.swerve * 2 * dt;
        c.z -= Math.sin(c.angle) * c.swerve * 2 * dt;
        c.swerve *= Math.pow(0.2, dt);
        if (Math.abs(c.swerve) < 0.05) c.swerve = 0;
      }
      // Turn around at the city edge and pick a new road.
      if (c.x > 118 || c.x < -118 || c.z > 118 || c.z < -118) {
        const lane = randomLane();
        c.x = lane.x; c.z = lane.z; c.angle = lane.angle;
      }
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.y = c.angle;
    }
  }

  return { cars, step };
}
