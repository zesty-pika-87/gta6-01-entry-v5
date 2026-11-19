// The police: cruisers that chase and PIT, a roadblock at 3 stars, a
// helicopter with a searchlight at 4, and foot officers who chase on foot.
// The dispatch panel reads exactly these units.
import * as THREE from 'three';
import { CFG } from './config.js';
import { UNIT_NAMES, UNIT_ROLES } from './dispatch.js';
import { buildCarMesh } from './vehicles.js';
import { buildPersonMesh } from './pedestrians.js';
import { pick } from './random.js';

export function createPolice(scene, rng) {
  const cruisers = [];
  const foot = [];
  let heli = null;
  let roadblock = null;
  let flash = 0;

  function spawnCruiser(name, role, x, z) {
    const mesh = buildCarMesh({ name: 'CRUISER', kind: 'police', top: CFG.policeTop }, 0xf2f2f2, { police: true });
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    const u = { name, role, mesh, x, z, angle: 0, speed: 0, dist: 999 };
    cruisers.push(u);
    return u;
  }

  function spawnFoot(x, z) {
    const mesh = buildPersonMesh(0x1c2733, 0x1c2733);
    // A police cap instead of hair: dark blue band.
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    const o = { mesh, x, z, angle: 0, speed: 3.4 };
    foot.push(o);
    return o;
  }

  function ensureWanted(wanted, playerPos) {
    const want = wanted >= 1 ? Math.min(2 + wanted, 6) : 0;
    while (cruisers.length < want) {
      const a = rng() * Math.PI * 2;
      // Round-robin roles: the dispatch panel always shows a varied unit list.
      const role = UNIT_ROLES[cruisers.length % UNIT_ROLES.length];
      spawnCruiser(
        UNIT_NAMES[cruisers.length % UNIT_NAMES.length], role,
        playerPos.x + Math.sin(a) * 55, playerPos.z + Math.cos(a) * 55,
      );
    }
    while (cruisers.length > want) {
      const u = cruisers.pop();
      scene.remove(u.mesh);
    }
    if (wanted >= CFG.roadblockAt && !roadblock) {
      roadblock = { x: playerPos.x + 40, z: playerPos.z + 10, meshes: [] };
      for (const off of [-4, 4]) {
        const m = buildCarMesh({ name: 'CRUISER', kind: 'police', top: 0 }, 0xf2f2f2, { police: true });
        m.position.set(roadblock.x + off, 0, roadblock.z);
        m.rotation.y = Math.PI / 2;
        scene.add(m);
        roadblock.meshes.push(m);
      }
    }
    if (wanted < CFG.roadblockAt && roadblock) {
      for (const m of roadblock.meshes) scene.remove(m);
      roadblock = null;
    }
    if (wanted >= CFG.heliAt && !heli) {
      heli = buildHeli(scene);
    }
    if (wanted < CFG.heliAt && heli) {
      scene.remove(heli.group);
      heli = null;
    }
    if (wanted >= 2 && foot.length < 2) spawnFoot(playerPos.x + 8, playerPos.z + 6);
    if (wanted < 2 && foot.length > 0) {
      for (const o of foot) scene.remove(o.mesh);
      foot.length = 0;
    }
  }

  function buildHeli(sceneRef) {
    const group = new THREE.Group();
    group.scale.setScalar(1.25);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x51708c });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 5.2), bodyMat);
    group.add(body);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.6), new THREE.MeshLambertMaterial({ color: 0x9fd8ef }));
    glass.position.set(0, 0.1, 2.2); group.add(glass);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 5), bodyMat);
    tail.position.set(0, 0.3, -4.6); group.add(tail);
    const rotor = new THREE.Group();
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0x14141a });
    for (const a of [0, Math.PI / 2]) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(11, 0.12, 0.5), bladeMat);
      blade.rotation.y = a;
      rotor.add(blade);
    }
    rotor.position.y = 1.1;
    group.add(rotor);
    // Searchlight cone + the bright circle it paints on the street.
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(6, 20, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }),
    );
    cone.position.y = -10;
    group.add(cone);
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(6, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = -19.9;
    group.add(pool);
    sceneRef.add(group);
    return { group, rotor, cone, pool, x: 0, y: 20, z: 0, angle: 0 };
  }

  function step(dt, playerPos, wanted, time) {
    flash += dt;
    ensureWanted(wanted, playerPos);
    for (const u of cruisers) {
      const dx = playerPos.x - u.x, dz = playerPos.z - u.z;
      const dist = Math.hypot(dx, dz);
      u.dist = dist;
      const wantAngle = Math.atan2(dx, dz);
      let diff = wantAngle - u.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      u.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
      u.speed += (Math.min(CFG.policeTop, 12 + dist * 0.4) - u.speed) * Math.min(1, dt * 0.8);
      // PIT: a cruiser that catches up shoves sideways.
      if (dist < 5) u.speed = Math.min(u.speed, 10);
      u.x += Math.sin(u.angle) * u.speed * dt;
      u.z += Math.cos(u.angle) * u.speed * dt;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = u.angle;
      // Flashing light bar.
      const bar = u.mesh.userData.lightBar;
      if (bar) {
        const on = Math.floor(flash * 6) % 2 === 0;
        bar.userData.red.material.color.setHex(on ? 0xff2222 : 0x551111);
        bar.userData.blue.material.color.setHex(on ? 0x112255 : 0x2266ff);
      }
    }
    for (const o of foot) {
      const dx = playerPos.x - o.x, dz = playerPos.z - o.z;
      const d = Math.hypot(dx, dz);
      if (d > 1.6) {
        o.angle = Math.atan2(dx, dz);
        o.x += Math.sin(o.angle) * o.speed * dt;
        o.z += Math.cos(o.angle) * o.speed * dt;
      }
      o.mesh.position.set(o.x, 0, o.z);
      o.mesh.rotation.y = o.angle;
    }
    if (heli) {
      heli.angle += dt * 0.25;
      heli.x = playerPos.x + Math.sin(heli.angle) * 14;
      heli.z = playerPos.z + Math.cos(heli.angle) * 14;
      heli.group.position.set(heli.x, 20, heli.z);
      heli.group.rotation.y = Math.atan2(playerPos.x - heli.x, playerPos.z - heli.z);
      heli.rotor.rotation.y += dt * 22;
      // Aim the searchlight cone at the player: the cone's base (-y) points
      // from the helicopter toward the street below the player.
      const toPlayer = new THREE.Vector3(playerPos.x - heli.x, -20, playerPos.z - heli.z).normalize();
      heli.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), toPlayer);
      heli.pool.position.set(playerPos.x - heli.x, -19.9, playerPos.z - heli.z);
    }
    if (roadblock) {
      for (const m of roadblock.meshes) {
        const bar = m.userData.lightBar;
        if (bar) {
          const on = Math.floor(flash * 6) % 2 === 0;
          bar.userData.red.material.color.setHex(on ? 0xff2222 : 0x551111);
          bar.userData.blue.material.color.setHex(on ? 0x112255 : 0x2266ff);
        }
      }
    }
  }

  return {
    cruisers, foot, ensureWanted, step,
    get heli() { return heli; },
    get roadblock() { return roadblock; },
  };
}
