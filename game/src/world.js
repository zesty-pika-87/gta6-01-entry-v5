// Costa Palma itself: the ground, the roads, the sea, the sky and the
// landmarks. The city is a grid of blocks between named roads; the beach and
// the sea run along the west edge, the docks sit south, the neon strip east.
import * as THREE from 'three';
import { CFG, PALETTE } from './config.js';
import { pick, range } from './random.js';

// Road centre lines, one every 42 units from -105 to 105.
export function roadLines() {
  const lines = [];
  for (let i = 0; i < CFG.blocks; i += 1) lines.push(-105 + i * 42);
  return lines;
}

// The rectangles of buildable blocks between the roads.
export function blockRects() {
  const lines = roadLines();
  const rects = [];
  for (let i = 0; i < lines.length - 1; i += 1) {
    for (let j = 0; j < lines.length - 1; j += 1) {
      rects.push({
        x0: lines[i] + 8, x1: lines[i + 1] - 8,
        z0: lines[j] + 8, z1: lines[j + 1] - 8,
      });
    }
  }
  return rects;
}

function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  m.position.set(x, y, z);
  return m;
}

// A gradient sky dome whose colours follow the hour: blue noon, orange dusk,
// purple night. The sun disc hangs low at golden hour.
export function createSky(scene, hour) {
  const geo = new THREE.SphereGeometry(480, 24, 12);
  const top = new THREE.Color(); const mid = new THREE.Color(); const low = new THREE.Color();
  if (hour < 16) { top.set(PALETTE.skyDayTop); mid.set(0x8fc7e8); low.set(PALETTE.skyDayLow); }
  else if (hour < 19.5) { top.set(PALETTE.skyDuskTop); mid.set(PALETTE.skyDuskMid); low.set(PALETTE.skyDuskLow); }
  else { top.set(PALETTE.skyNightTop); mid.set(0x3a2060); low.set(PALETTE.skyNightLow); }
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: top }, mid: { value: mid }, low: { value: low } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 low; void main(){ float h = normalize(vP).y; vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.8, h)) : mix(low, mid, smoothstep(-0.05, 0.25, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  const dome = new THREE.Mesh(geo, mat);
  scene.add(dome);

  // The sun: a glowing disc low over the sea at golden hour, high at noon.
  // It hangs north-west so a chase heading north sees it ahead-left.
  const sunY = hour < 16 ? 150 : hour < 19.5 ? 48 : -20;
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(hour < 16 ? 16 : 34, 32),
    new THREE.MeshBasicMaterial({ color: PALETTE.sun, fog: false }),
  );
  sun.position.set(-240, sunY, -300);
  sun.lookAt(0, sunY, 0);
  scene.add(sun);
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(hour < 16 ? 34 : 70, 32),
    new THREE.MeshBasicMaterial({ color: 0xff9e5e, transparent: true, opacity: 0.35, fog: false }),
  );
  glow.position.set(-242, sunY, -302);
  glow.lookAt(0, sunY, 0);
  scene.add(glow);

  // Thin clouds drifting over the city.
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffe8d6, transparent: true, opacity: 0.85 });
  const clouds = [];
  for (let i = 0; i < 9; i += 1) {
    const g = new THREE.Group();
    for (let j = 0; j < 4; j += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(6 + j * 2.2, 8, 6), cloudMat);
      puff.position.set(j * 7 - 10, (j % 2) * 1.5, (j % 3) * 3 - 3);
      puff.scale.y = 0.45;
      g.add(puff);
    }
    g.position.set(-220 + i * 55, 95 + (i % 3) * 18, -180 + ((i * 67) % 320));
    scene.add(g);
    clouds.push(g);
  }
  return { dome, sun, glow, clouds, setHour(h) {
    const night = h >= 19.5, day = h < 16;
    top.set(night ? PALETTE.skyNightTop : day ? PALETTE.skyDayTop : PALETTE.skyDuskTop);
    mid.set(night ? 0x3a2060 : day ? 0x8fc7e8 : PALETTE.skyDuskMid);
    low.set(night ? PALETTE.skyNightLow : day ? PALETTE.skyDayLow : PALETTE.skyDuskLow);
    mat.uniforms.top.value.copy(top); mat.uniforms.mid.value.copy(mid); mat.uniforms.low.value.copy(low);
    sun.position.y = day ? 150 : night ? -20 : 42;
    glow.position.y = sun.position.y;
    sun.visible = !night; glow.visible = !night;
  } };
}

// Ground, roads, sidewalks, beach, sea and street furniture.
export function createGround(scene, rng) {
  const group = new THREE.Group();
  scene.add(group);

  // Sand base under everything, sea to the west.
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700),
    new THREE.MeshLambertMaterial({ color: PALETTE.sand }),
  );
  sand.rotation.x = -Math.PI / 2; sand.position.set(-40, -0.05, 0);
  sand.receiveShadow = true;
  group.add(sand);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 700),
    new THREE.MeshLambertMaterial({ color: PALETTE.sea, transparent: true, opacity: 0.94 }),
  );
  sea.rotation.x = -Math.PI / 2; sea.position.set(-260, 0.02, 0);
  group.add(sea);
  const seaDeep = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 700),
    new THREE.MeshLambertMaterial({ color: PALETTE.seaDeep }),
  );
  seaDeep.rotation.x = -Math.PI / 2; seaDeep.position.set(-420, 0.0, 0);
  group.add(seaDeep);

  // Asphalt: one strip per road, both directions, plus sidewalk borders.
  const roadMat = new THREE.MeshLambertMaterial({ color: PALETTE.asphalt });
  const walkMat = new THREE.MeshLambertMaterial({ color: PALETTE.sidewalk });
  const lines = roadLines();
  for (const c of lines) {
    const ns = new THREE.Mesh(new THREE.PlaneGeometry(12, 260), roadMat);
    ns.rotation.x = -Math.PI / 2; ns.position.set(c, 0.01, 0); ns.receiveShadow = true;
    group.add(ns);
    const ew = new THREE.Mesh(new THREE.PlaneGeometry(260, 12), roadMat);
    ew.rotation.x = -Math.PI / 2; ew.position.set(0, 0.01, c); ew.receiveShadow = true;
    group.add(ew);
    for (const s of [-8.5, 8.5]) {
      const w1 = new THREE.Mesh(new THREE.PlaneGeometry(5, 260), walkMat);
      w1.rotation.x = -Math.PI / 2; w1.position.set(c + s, 0.03, 0);
      group.add(w1);
      const w2 = new THREE.Mesh(new THREE.PlaneGeometry(260, 5), walkMat);
      w2.rotation.x = -Math.PI / 2; w2.position.set(0, 0.03, c + s);
      group.add(w2);
    }
  }

  // Centre dashes and zebra crossings at every intersection.
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  const zebraMat = new THREE.MeshBasicMaterial({ color: 0xf5f0e6 });
  for (const c of lines) {
    for (let t = -120; t <= 120; t += 12) {
      if (Math.abs(t % 42) < 9) continue;
      const d1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 4), dashMat);
      d1.rotation.x = -Math.PI / 2; d1.position.set(c, 0.04, t);
      group.add(d1);
      const d2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.7), dashMat);
      d2.rotation.x = -Math.PI / 2; d2.position.set(t, 0.04, c);
      group.add(d2);
    }
    for (const o of lines) {
      for (let k = -2; k <= 2; k += 1) {
        const z1 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 9), zebraMat);
        z1.rotation.x = -Math.PI / 2; z1.position.set(c + k * 2.2, 0.04, o - 7.5);
        group.add(z1);
        const z2 = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4), zebraMat);
        z2.rotation.x = -Math.PI / 2; z2.position.set(o - 7.5, 0.04, c + k * 2.2);
        group.add(z2);
      }
    }
  }

  // Beach umbrellas + towels along the strand, west of the beach road.
  const umbrellaColors = [0xff5da2, 0xffd166, 0x37e6c8, 0xff8c42, 0x7fb3ff];
  for (let i = 0; i < 14; i += 1) {
    const x = -118 + (i % 2) * 6, z = -110 + i * 16;
    const pole = box(0.25, 2.6, 0.25, 0xffffff, x, 1.3, z);
    group.add(pole);
    const top = new THREE.Mesh(
      new THREE.ConeGeometry(2.6, 1.1, 8),
      new THREE.MeshLambertMaterial({ color: umbrellaColors[i % umbrellaColors.length] }),
    );
    top.position.set(x, 3.1, z);
    group.add(top);
  }

  // Street lamps along the main roads, benches and hydrants for life.
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x2b2b33 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  for (const c of lines) {
    for (let t = -100; t <= 100; t += 40) {
      const pole = box(0.3, 5.4, 0.3, 0x2b2b33, c + 7.2, 2.7, t);
      group.add(pole);
      const arm = box(1.6, 0.25, 0.25, 0x2b2b33, c + 6.4, 5.4, t);
      group.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), bulbMat);
      bulb.position.set(c + 5.6, 5.3, t);
      group.add(bulb);
    }
  }
  return group;
}

// Palms: layered fronds on tall trunks, lining the beach road and the plaza.
export function createPalms(scene, rng) {
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.45, 7, 7);
  const trunkMat = new THREE.MeshLambertMaterial({ color: PALETTE.palmTrunk });
  const frondGeo = new THREE.PlaneGeometry(0.9, 4.6);
  const frondMat = new THREE.MeshLambertMaterial({ color: PALETTE.palmLeaf, side: THREE.DoubleSide });
  const frondMat2 = new THREE.MeshLambertMaterial({ color: PALETTE.palmLeaf2, side: THREE.DoubleSide });
  const positions = [];
  for (let z = -110; z <= 110; z += 14) {
    positions.push([-112, z + range(rng, -2, 2)]);
    positions.push([-96, z + 7 + range(rng, -2, 2)]);
  }
  for (let x = -60; x <= 60; x += 18) positions.push([x, -14 + range(rng, -2, 2)]);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, positions.length);
  const fronds = new THREE.InstancedMesh(frondGeo, frondMat, positions.length * 8);
  const fronds2 = new THREE.InstancedMesh(frondGeo, frondMat2, positions.length * 4);
  const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const e = new THREE.Euler();
  const s = new THREE.Vector3(1, 1, 1); const p = new THREE.Vector3();
  let fi = 0, f2 = 0;
  positions.forEach(([x, z], i) => {
    const h = range(rng, 0.85, 1.3);
    p.set(x, 3.5 * h, z); q.identity(); s.set(1, h, 1);
    m.compose(p, q, s); trunks.setMatrixAt(i, m);
    for (let f = 0; f < 8; f += 1) {
      const ang = (f / 8) * Math.PI * 2 + range(rng, -0.2, 0.2);
      e.set(-0.9 - range(rng, 0, 0.35), ang, 0, 'YXZ');
      q.setFromEuler(e);
      p.set(x + Math.sin(ang) * 1.6, 6.6 * h, z + Math.cos(ang) * 1.6);
      s.set(1, 1, 1);
      m.compose(p, q, s);
      fronds.setMatrixAt(fi, m); fi += 1;
      if (f % 2 === 0) {
        e.set(-0.5, ang + 0.4, 0, 'YXZ'); q.setFromEuler(e);
        p.set(x + Math.sin(ang) * 1.1, 7.1 * h, z + Math.cos(ang) * 1.1);
        m.compose(p, q, s);
        fronds2.setMatrixAt(f2, m); f2 += 1;
      }
    }
  });
  trunks.castShadow = true;
  scene.add(trunks); scene.add(fronds); scene.add(fronds2);
  return { trunks, fronds, fronds2, count: positions.length };
}

// Landmarks: ferris wheel on the strand, dock crane + containers, plaza fountain,
// and the night-market stalls of Old Town.
export function createLandmarks(scene, rng) {
  const group = new THREE.Group();
  scene.add(group);

  // Ferris wheel "La Rueda" over the beach.
  const wheel = new THREE.Group();
  wheel.position.set(-88, 0, 84);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(11, 0.5, 8, 24),
    new THREE.MeshLambertMaterial({ color: 0xff5da2 }),
  );
  rim.position.y = 15; wheel.add(rim);
  for (let i = 0; i < 8; i += 1) {
    const spoke = box(0.4, 21, 0.4, 0x37e6c8, 0, 15, 0);
    spoke.rotation.z = (i / 8) * Math.PI;
    wheel.add(spoke);
    const cab = box(1.6, 1.6, 1.6, pick(rng, PALETTE.neon), Math.sin((i / 8) * Math.PI * 2) * 11, 15 + Math.cos((i / 8) * Math.PI * 2) * 11, 0);
    wheel.add(cab);
  }
  wheel.add(box(1, 15, 1, 0x8a5a33, -4, 7.5, 0));
  wheel.add(box(1, 15, 1, 0x8a5a33, 4, 7.5, 0));
  group.add(wheel);

  // Dock crane + stacked containers at the south docks.
  const crane = new THREE.Group();
  crane.position.set(-30, 0, 100);
  crane.add(box(2, 26, 2, 0xffd166, 0, 13, 0));
  crane.add(box(18, 2, 2, 0xff8c42, 4, 25, 0));
  crane.add(box(2, 4, 2, 0x2b2b33, 10, 22, 0));
  group.add(crane);
  const contColors = [0xe63946, 0x2a9d8f, 0xf4a261, 0x457b9d, 0xffd166];
  for (let i = 0; i < 10; i += 1) {
    const c = box(7, 2.6, 2.6, contColors[i % contColors.length], -52 + (i % 5) * 8, 1.3 + Math.floor(i / 5) * 2.7, 96 + (i % 2) * 4);
    group.add(c);
  }

  // Plaza fountain: round basin, water disc, centre column.
  const basin = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 6.4, 1, 20),
    new THREE.MeshLambertMaterial({ color: 0xd8c9a8 }),
  );
  basin.position.set(0, 0.5, 0); group.add(basin);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(5.4, 20),
    new THREE.MeshLambertMaterial({ color: 0x4fc3e8 }),
  );
  water.rotation.x = -Math.PI / 2; water.position.set(0, 1.05, 0); group.add(water);
  group.add(box(1, 3.4, 1, 0xd8c9a8, 0, 2.4, 0));

  // Night-market stalls: striped awnings over crates, ringing the plaza
  // fountain so the market stays open ground, never inside a building block.
  const stallColors = [0xff5da2, 0xffd166, 0x37e6c8, 0xff8c42];
  const stalls = [];
  const stallSpots = [[13, 0], [9, 10], [-9, 10], [-13, 0], [-9, -10], [9, -10], [0, 14], [0, -14]];
  for (let i = 0; i < stallSpots.length; i += 1) {
    const [x, z] = stallSpots[i];
    const stall = new THREE.Group();
    stall.position.set(x, 0, z);
    stall.rotation.y = Math.atan2(-x, -z);
    stall.add(box(5, 0.3, 3, stallColors[i % stallColors.length], 0, 2.6, 0));
    stall.add(box(0.25, 2.6, 0.25, 0x8a5a33, -2.3, 1.3, -1.3));
    stall.add(box(0.25, 2.6, 0.25, 0x8a5a33, 2.3, 1.3, -1.3));
    stall.add(box(0.25, 2.6, 0.25, 0x8a5a33, -2.3, 1.3, 1.3));
    stall.add(box(0.25, 2.6, 0.25, 0x8a5a33, 2.3, 1.3, 1.3));
    stall.add(box(4.6, 1, 2.6, 0x9c6b3f, 0, 0.5, 0));
    // Goods on the counter: fruit crates in bright colours.
    for (let g = 0; g < 3; g += 1) {
      stall.add(box(1, 0.6, 1, pick(rng, [0xff6b6b, 0xffd166, 0x57b25e, 0xff8c42]), -1.5 + g * 1.5, 1.3, 0));
    }
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
    );
    lamp.position.set(0, 2.3, 0);
    stall.add(lamp);
    group.add(stall);
    stalls.push(stall);
  }
  return { group, wheel, stalls };
}
