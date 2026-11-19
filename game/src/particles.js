// Particles: one pooled Points cloud for dust, sparks, smoke and explosion
// flashes. No allocation per burst — the pool is fixed at boot.
import * as THREE from 'three';

const MAX = 420;

export function createParticles(scene) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(MAX * 3);
  const col = new Float32Array(MAX * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.95 });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  const parts = [];
  for (let i = 0; i < MAX; i += 1) {
    parts.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0, r: 1, g: 1, b: 1 });
  }
  let cursor = 0;

  function burst(x, y, z, n, color, speed, up) {
    const c = new THREE.Color(color);
    for (let k = 0; k < n; k += 1) {
      const p = parts[cursor];
      cursor = (cursor + 1) % MAX;
      p.x = x; p.y = y; p.z = z;
      const a = Math.random() * Math.PI * 2;
      p.vx = Math.sin(a) * speed * (0.4 + Math.random() * 0.6);
      p.vz = Math.cos(a) * speed * (0.4 + Math.random() * 0.6);
      p.vy = (up ?? 2) * (0.4 + Math.random() * 0.8);
      p.life = 0.5 + Math.random() * 0.5;
      p.r = c.r; p.g = c.g; p.b = c.b;
    }
  }

  function dust(x, z) { burst(x, 0.4, z, 6, 0xcbb59a, 2, 1.2); }
  function sparks(x, y, z) { burst(x, y, z, 10, 0xffe9a8, 6, 3); }
  function smoke(x, y, z) { burst(x, y, z, 8, 0x555560, 1.5, 3.5); }
  function explosion(x, y, z) { burst(x, y, z, 40, 0xff8c42, 9, 5); burst(x, y, z, 20, 0xffd166, 7, 6); }

  function step(dt) {
    for (let i = 0; i < MAX; i += 1) {
      const p = parts[i];
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.vy -= 6 * dt;
        if (p.y < 0.05) { p.y = 0.05; p.vy = 0; }
      } else {
        p.y = -99;
      }
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      col[i * 3] = p.r; col[i * 3 + 1] = p.g; col[i * 3 + 2] = p.b;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  return { burst, dust, sparks, smoke, explosion, step };
}
