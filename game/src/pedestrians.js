// Pedestrians: the crowd on the sidewalks. They stroll, vary in clothes and
// pace, and some cross at the zebra stripes. A few run when a chase passes.
import * as THREE from 'three';
import { roadLines } from './world.js';
import { pick, range } from './random.js';

const SHIRTS = [0xff6b6b, 0xffd166, 0x37e6c8, 0x7fb3ff, 0xff8c42, 0xf7e6c4, 0xff5da2, 0x9b7ede];
const PANTS = [0x2b2b33, 0x457b9d, 0x5a4a3a, 0x3a3a42, 0x6b4a8a];

export function buildPersonMesh(shirt, pants) {
  const g = new THREE.Group();
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirt });
  const pantsMat = new THREE.MeshLambertMaterial({ color: pants });
  const skinMat = new THREE.MeshLambertMaterial({ color: 0xe8b98a });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.75, 0.36), shirtMat);
  torso.position.y = 1.15; torso.castShadow = true;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), skinMat);
  head.position.y = 1.72; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), new THREE.MeshLambertMaterial({ color: 0x2b2018 }));
  hair.position.y = 1.78; hair.scale.set(1, 0.7, 1); g.add(hair);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.24), pantsMat);
  legL.position.set(-0.16, 0.38, 0); g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.16; g.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.18), shirtMat);
  armL.position.set(-0.42, 1.2, 0); g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.42; g.add(armR);
  g.userData = { legL, legR, armL, armR };
  return g;
}

export function createPedestrians(scene, rng, count) {
  const lines = roadLines();
  const peds = [];

  function randomWalk() {
    const road = pick(rng, lines);
    const along = range(rng, -110, 110);
    const side = pick(rng, [-8.5, 8.5]);
    const vertical = rng() < 0.5;
    return vertical
      ? { x: road + side, z: along, angle: rng() < 0.5 ? 0 : Math.PI }
      : { x: along, z: road + side, angle: rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2 };
  }

  for (let i = 0; i < count; i += 1) {
    const w = randomWalk();
    const mesh = buildPersonMesh(pick(rng, SHIRTS), pick(rng, PANTS));
    mesh.position.set(w.x, 0, w.z);
    mesh.rotation.y = w.angle;
    scene.add(mesh);
    peds.push({
      mesh, x: w.x, z: w.z, angle: w.angle,
      speed: range(rng, 0.9, 1.8), phase: rng() * Math.PI * 2,
      crossing: rng() < 0.25, panic: 0,
    });
  }

  function step(dt, playerPos, wanted) {
    for (const p of peds) {
      // A chase nearby makes the nearest pedestrians run for the sidewalk.
      const pd = Math.hypot(p.x - playerPos.x, p.z - playerPos.z);
      if (wanted >= 3 && pd < 12) p.panic = 2;
      const speed = p.panic > 0 ? 4.5 : p.speed;
      if (p.panic > 0) p.panic -= dt;
      p.x += Math.sin(p.angle) * speed * dt;
      p.z += Math.cos(p.angle) * speed * dt;
      p.phase += dt * speed * 4;
      const swing = Math.sin(p.phase) * 0.45;
      p.mesh.userData.legL.rotation.x = swing;
      p.mesh.userData.legR.rotation.x = -swing;
      p.mesh.userData.armL.rotation.x = -swing * 0.7;
      p.mesh.userData.armR.rotation.x = swing * 0.7;
      if (p.x > 120 || p.x < -120 || p.z > 120 || p.z < -120) {
        const w = randomWalk();
        p.x = w.x; p.z = w.z; p.angle = w.angle;
      }
      p.mesh.position.set(p.x, 0, p.z);
      p.mesh.rotation.y = p.angle;
    }
  }

  return { peds, step };
}
