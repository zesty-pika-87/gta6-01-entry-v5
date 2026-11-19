// Combat: fists, gunfire, thugs who fight back, pickups and the busted /
// wasted screens. Hits land by range + facing, so it reads fair on screen.
import * as THREE from 'three';
import { CFG } from './config.js';
import { buildPersonMesh } from './pedestrians.js';
import { pick, range } from './random.js';

export function createCombat(scene, rng) {
  const thugs = [];
  const pickups = [];
  const tracers = [];

  function spawnThug(x, z, armed) {
    const mesh = buildPersonMesh(pick(rng, [0x3a3a42, 0x5a2a2a, 0x2a3a2a]), 0x1c2733);
    mesh.position.set(x, 0, z);
    scene.add(mesh);
    // A small red HP bar floating over the thug's head.
    const barBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x222222 }),
    );
    barBg.position.y = 2.3;
    mesh.add(barBg);
    const barFg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xff4444 }),
    );
    barFg.position.set(0, 2.3, 0.02);
    mesh.add(barFg);
    const t = { mesh, barFg, x, z, angle: rng() * Math.PI * 2, hp: CFG.thugHp, maxHp: CFG.thugHp, armed, cool: 0 };
    thugs.push(t);
    return t;
  }

  function spawnPickup(kind, x, z) {
    const color = kind === 'health' ? 0x37e6c8 : kind === 'ammo' ? 0xffd166 : 0x7CFC00;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.5 }),
    );
    mesh.position.set(x, 0.6, z);
    scene.add(mesh);
    const p = { mesh, kind, x, z, bob: rng() * 6 };
    pickups.push(p);
    return p;
  }

  function fireTracer(from, to) {
    const dir = new THREE.Vector3(to.x - from.x, 0.6, to.z - from.z);
    const len = dir.length();
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, len),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
    );
    mesh.position.set((from.x + to.x) / 2, 1.2, (from.z + to.z) / 2);
    mesh.lookAt(to.x, 1.2, to.z);
    scene.add(mesh);
    tracers.push({ mesh, life: 0.12 });
  }

  // A punch: the nearest thug inside range and in front of the player.
  function punch(playerPos, playerAngle) {
    let best = null, bd = CFG.punchRange;
    for (const t of thugs) {
      const dx = t.x - playerPos.x, dz = t.z - playerPos.z;
      const d = Math.hypot(dx, dz);
      if (d > bd) continue;
      const facing = Math.sin(playerAngle) * dx + Math.cos(playerAngle) * dz;
      if (facing < 0) continue;
      bd = d; best = t;
    }
    if (!best) return null;
    best.hp -= CFG.punchDamage;
    return best;
  }

  // A shot: the nearest thug inside range and roughly in the aim cone.
  function shoot(playerPos, playerAngle, weapon) {
    let best = null, bd = CFG.pistolRange;
    for (const t of thugs) {
      const dx = t.x - playerPos.x, dz = t.z - playerPos.z;
      const d = Math.hypot(dx, dz);
      if (d > bd) continue;
      const aim = Math.sin(playerAngle) * dx + Math.cos(playerAngle) * dz;
      if (aim < d * 0.86) continue;
      bd = d; best = t;
    }
    if (best) {
      best.hp -= weapon.damage;
      fireTracer(playerPos, best);
    } else {
      const far = { x: playerPos.x + Math.sin(playerAngle) * 30, z: playerPos.z + Math.cos(playerAngle) * 30 };
      fireTracer(playerPos, far);
    }
    return best;
  }

  function step(dt, playerPos, playerAngle, onThugDown) {
    for (let i = thugs.length - 1; i >= 0; i -= 1) {
      const t = thugs[i];
      t.barFg.scale.x = Math.max(0.01, t.hp / t.maxHp);
      t.barFg.position.x = -(1.3 - 1.3 * (t.hp / t.maxHp)) / 2;
      if (t.hp <= 0) {
        scene.remove(t.mesh);
        thugs.splice(i, 1);
        spawnPickup(pick(rng, ['health', 'ammo', 'cash']), t.x + range(rng, -1, 1), t.z + range(rng, -1, 1));
        if (onThugDown) onThugDown(t);
        continue;
      }
      // Thugs close in and swing; armed ones shoot from range.
      const dx = playerPos.x - t.x, dz = playerPos.z - t.z;
      const d = Math.hypot(dx, dz);
      t.cool -= dt;
      if (d > 2) {
        t.angle = Math.atan2(dx, dz);
        const sp = t.armed ? 2.6 : 3.2;
        t.x += Math.sin(t.angle) * sp * dt;
        t.z += Math.cos(t.angle) * sp * dt;
      } else if (t.cool <= 0) {
        t.cool = 1.1;
        t.attacking = true;
      }
      t.mesh.position.set(t.x, 0, t.z);
      t.mesh.rotation.y = t.angle;
    }
    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const p = pickups[i];
      p.bob += dt * 3;
      p.mesh.position.y = 0.6 + Math.sin(p.bob) * 0.15;
      p.mesh.rotation.y += dt * 2;
      const d = Math.hypot(p.x - playerPos.x, p.z - playerPos.z);
      if (d < 1.6) {
        scene.remove(p.mesh);
        pickups.splice(i, 1);
        if (p.onTake) p.onTake(p);
      }
    }
    for (let i = tracers.length - 1; i >= 0; i -= 1) {
      const tr = tracers[i];
      tr.life -= dt;
      if (tr.life <= 0) { scene.remove(tr.mesh); tracers.splice(i, 1); }
    }
  }

  return { thugs, pickups, spawnThug, spawnPickup, punch, shoot, step };
}
