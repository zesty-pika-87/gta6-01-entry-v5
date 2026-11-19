// The four screenshot scenes behind ?shot=cover|street|board|victory. Each one
// stages the real game — real systems, real HUD, real positions — from a
// fixed seed, so the same seed always gives the same frame. Nothing here is
// pasted on top of the picture: the camera, the traffic, the police and the
// panels are all the game itself.
import * as THREE from 'three';
import { buildPersonMesh } from './pedestrians.js';

// Aim a helicopter's searchlight cone at the player on the street below.
function aimCone(heli, player) {
  const toPlayer = new THREE.Vector3(player.x - heli.x, -20, player.z - heli.z).normalize();
  heli.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), toPlayer);
  heli.pool.position.set(player.x - heli.x, -19.9, player.z - heli.z);
}

function setHour(ctx, hour) {
  ctx.G.hour = hour;
  ctx.render.setHour(hour);
  ctx.sky.setHour(hour);
  if (ctx.clock) { ctx.clock.hour = hour; ctx.G.clockFmt = ctx.clock.fmt(); }
}

function placeTraffic(ctx, spots) {
  ctx.traffic.cars.forEach((c, i) => {
    const s = spots[i % spots.length];
    c.x = s[0]; c.z = s[1]; c.angle = s[2]; c.speed = s[3] || 10;
    c.mesh.position.set(c.x, 0, c.z);
    c.mesh.rotation.y = c.angle;
  });
}

function placePeds(ctx, spots) {
  ctx.peds.peds.forEach((p, i) => {
    const s = spots[i % spots.length];
    p.x = s[0]; p.z = s[1]; p.angle = s[2] || 0;
    p.mesh.position.set(p.x, 0, p.z);
    p.mesh.rotation.y = p.angle;
  });
}

function armPolice(ctx, wanted) {
  ctx.G.wanted = wanted;
  ctx.police.step(0.1, ctx.G.player, wanted, 0);
  refreshPolice(ctx);
  ctx.G.heliActive = !!ctx.police.heli;
  ctx.G.roadblockActive = !!ctx.police.roadblock;
}

// Rebuild the dispatch rows from the cruisers' CURRENT positions — after the
// staging moves them, the distances must follow.
function refreshPolice(ctx) {
  ctx.G.policeUnits = ctx.police.cruisers.map((u) => ({
    x: u.x, z: u.z, name: u.name, role: u.role,
    dist: Math.round(Math.hypot(u.x - ctx.G.player.x, u.z - ctx.G.player.z)),
  }));
  ctx.G.police = ctx.G.policeUnits;
}

export function stageShot(name, ctx) {
  const { G, hud } = ctx;

  if (name === 'cover') {
    // Golden-hour chase, mission 7, four stars, helicopter overhead.
    setHour(ctx, 18.7);
    ctx.missions.startMission(6);
    ctx.missions.advanceStage(); ctx.missions.advanceStage(); ctx.missions.advanceStage();
    ctx.missions.timer = 107;
    G.money = 3240; G.hp = 78; G.armor = 55; G.rp = 2290; G.rankIndex = 3;
    G.chain = 9; G.chainTimer = 5;
    const car = ctx.comet;
    car.x = -105; car.z = -40; car.angle = Math.PI; car.speed = 24; car.condition = 84;
    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.angle;
    G.playerCar = car;
    car.isPlayer = true;
    G.player.x = car.x; G.player.z = car.z; G.player.angle = car.angle;
    ctx.playerMesh.visible = false;
    // Turf (F1): Marina Row flies PALMA colours in this shot — the chip reads it.
    const mr = ctx.turf.of('MARINA ROW');
    mr.owner = 'PALMA'; mr.pct = 65; mr.war = false;
    // Beach road: sea and sun open to the west, palms lining both sides.
    placeTraffic(ctx, [
      [-107, -50, Math.PI, 14], [-103, -58, Math.PI, 12], [-108, -85, Math.PI, 11],
      [-102, -25, 0, 9], [-63, -52, 0, 9], [-63, -20, Math.PI, 10],
      [-21, -60, 0, 11], [-105, -8, Math.PI, 13], [-66, -96, Math.PI, 15], [21, -40, 0, 10],
    ]);
    placePeds(ctx, [
      [-113, -30, 0], [-97, -48, Math.PI], [-113, -52, 0], [-97, -28, Math.PI],
      [-113, -14, 0], [-97, -62, Math.PI], [-113, -70, 0], [-97, -10, Math.PI],
    ]);
    armPolice(ctx, 4);
    // Cruisers flanking both sides, one hard on the bumper.
    const c = ctx.police.cruisers;
    if (c[0]) { c[0].x = -109; c[0].z = -28; c[0].angle = Math.PI; }
    if (c[1]) { c[1].x = -101; c[1].z = -32; c[1].angle = Math.PI; }
    if (c[2]) { c[2].x = -105; c[2].z = -24; c[2].angle = Math.PI; }
    if (c[3]) { c[3].x = -108; c[3].z = -62; c[3].angle = Math.PI; }
    for (const u of c) { u.mesh.position.set(u.x, 0, u.z); u.mesh.rotation.y = u.angle; u.dist = Math.hypot(u.x - G.player.x, u.z - G.player.z); }
    refreshPolice(ctx);
    // Helicopter big in the sky ahead-left, searchlight cone on the street.
    if (ctx.police.heli) {
      const h = ctx.police.heli;
      h.x = -95; h.z = -95;
      h.group.position.set(h.x, 18, h.z);
      h.group.rotation.y = Math.atan2(G.player.x - h.x, G.player.z - h.z);
      aimCone(h, G.player);
    }
    // Roadblock across the road ahead, close enough to read as a barrier.
    if (ctx.police.roadblock) {
      const rb = ctx.police.roadblock;
      rb.x = -105; rb.z = -64;
      rb.meshes[0]?.position.set(-110, 0, -64);
      rb.meshes[1]?.position.set(-100, 0, -64);
    }
    ctx.marker.position.set(0, 20, 0);
    G.missionTarget = { x: 0, z: 0 };
    hud.setDialog('nadia', 'Flint called in every cruiser in Costa Palma. Roadblocks on the roads, rain on the way. Get to the garage — and do not stop for anyone.');
    ctx.feel.snap(G.player, G.player.angle, true);
    ctx.feel.update(0.016, G.player, G.player.angle, 24, true);
  } else if (name === 'street') {
    // Night market on foot (F3 NIGHT ONLY mission + F2 taxi fare running):
    // stalls, crowd, thugs, a tracer in the air, fare meter on the HUD.
    setHour(ctx, 21.5);
    ctx.missions.startMission(7);
    ctx.missions.advanceStage();
    ctx.missions.timer = 107;
    // Taxi fare live on the HUD: ROSA rides, meter at $12.50, tip +$5.
    ctx.sideJobs.acceptTaxi(0);
    ctx.sideJobs.taxi.timer = 72;
    G.money = 7270; G.hp = 95; G.armor = 27; G.rp = 1675; G.rankIndex = 2;
    G.chain = 0; G.chainTimer = 0;
    // On foot at the plaza night market: fountain, stalls ringing it, crowd.
    G.player.x = 0; G.player.z = 18; G.player.angle = Math.PI;
    ctx.playerMesh.position.set(G.player.x, 0, G.player.z);
    ctx.playerMesh.rotation.y = G.player.angle;
    placePeds(ctx, [
      [-10, 6, 0.5], [10, 8, -0.4], [-12, -6, 1.2], [12, -8, 2.1],
      [-6, 12, -1.1], [8, 12, 0.2], [-14, 2, 1.6], [14, 4, -0.8],
      [-4, -12, 2.6], [6, -12, 0.9], [0, 10, -1.8], [-16, -10, 1.0],
      [16, 10, 0.0], [-8, -14, 2.0], [4, 14, -2.4], [16, -12, 0.6],
    ]);
    placeTraffic(ctx, [
      [-21, 8, Math.PI, 8], [21, -6, Math.PI, 10], [-21, -30, 0, 9],
      [21, 28, 0, 7], [-63, 10, Math.PI, 9], [63, -12, Math.PI, 11],
    ]);
    // Three armed thugs between the stalls, one already down on the tiles.
    ctx.combat.spawnThug(6, 8, true);
    ctx.combat.spawnThug(-7, 10, true);
    ctx.combat.spawnThug(10, -6, false);
    const down = buildPersonMesh(0x5a2a2a, 0x1c2733);
    down.position.set(4, 0.4, 2);
    down.rotation.set(Math.PI / 2, 0, 0.6);
    ctx.scene.add(down);
    armPolice(ctx, 2);
    const c = ctx.police.cruisers;
    if (c[0]) { c[0].x = -24; c[0].z = 30; c[0].angle = Math.PI / 2; c[0].mesh.position.set(-24, 0, 30); }
    if (c[1]) { c[1].x = 24; c[1].z = 28; c[1].angle = -Math.PI / 2; c[1].mesh.position.set(24, 0, 28); }
    refreshPolice(ctx);
    ctx.combat.shoot(G.player, G.player.angle, ctx.weapons.current());
    ctx.marker.position.set(-60, 20, -60);
    G.missionTarget = { x: -60, z: -60 };
    hud.setDialog('nadia', 'The Palma Job is tonight. You, me, Lena and Silas. No mistakes, no witnesses.');
    hud.showToast('IN SIGHT · 2 UNITS RESPONDING', 2000);
    ctx.feel.snap(G.player, G.player.angle, false);
    ctx.feel.update(0.016, G.player, G.player.angle, 0, false);
  } else if (name === 'board') {
    // The enriched map + mission board, city dimmed behind it. Turf (F1)
    // stands at 4/6 districts, 68% — Marina Row and the Neon Strip flipped.
    setHour(ctx, 18.7);
    ctx.missions.done = [0, 1, 2, 3, 4];
    ctx.missions.startMission(5);
    ctx.missions.timer = 150;
    const tMr = ctx.turf.of('MARINA ROW'); tMr.owner = 'PALMA'; tMr.pct = 65; tMr.war = false;
    const tNs = ctx.turf.of('NEON STRIP'); tNs.owner = 'PALMA'; tNs.pct = 60; tNs.war = false;
    ctx.sideJobs.setStats({ taxiDone: 2, vigDone: 1, faresEarned: 86.5 });
    G.money = 18450; G.hp = 88; G.armor = 62; G.rp = 2100; G.rankIndex = 3;
    G.stats.carsStolen = 41; G.stats.copsEscaped = 12; G.stats.distanceKm = 48.2;
    G.stats.takenOut = 23; G.stats.bestChain = 9; G.stats.totalEarned = 8250;
    G.medallions = 5;
    G.player.x = 0; G.player.z = 14; G.player.angle = Math.PI;
    ctx.playerMesh.position.set(G.player.x, 0, G.player.z);
    ctx.playerMesh.rotation.y = G.player.angle;
    placeTraffic(ctx, [
      [-21, -10, Math.PI, 10], [21, 6, 0, 9], [-63, 20, Math.PI, 11],
      [21, -30, Math.PI, 8], [-21, 40, 0, 10], [63, -14, 0, 12],
    ]);
    placePeds(ctx, [
      [-8, 8, 0], [8, -6, Math.PI], [-8, -14, 0], [10, 20, Math.PI],
      [-28, 10, 0], [28, -10, Math.PI], [-14, 28, 0], [14, -24, Math.PI],
    ]);
    armPolice(ctx, 0);
    hud.fillBoard(G);
    document.getElementById('board-screen').classList.add('show');
    ctx.feel.snap(G.player, G.player.angle, false);
    ctx.feel.update(0.016, G.player, G.player.angle, 0, false);
  } else if (name === 'victory') {
    // The coast is yours: full stats over a bright noon city. Turf (F1) is
    // 6/6 PALMA, side jobs (F2) closed out.
    setHour(ctx, 13.2);
    ctx.missions.done = [0, 1, 2, 3, 4, 5, 6, 7];
    for (const d of Object.values(ctx.turf.districts)) { d.owner = 'PALMA'; d.pct = 100; d.war = false; }
    ctx.sideJobs.setStats({ taxiDone: 3, vigDone: 2, faresEarned: 1240 });
    G.money = 86250; G.hp = 100; G.armor = 100; G.rp = 3600; G.rankIndex = 4;
    G.stats.carsStolen = 41; G.stats.copsEscaped = 12; G.stats.distanceKm = 48.2;
    G.stats.takenOut = 23; G.stats.bestChain = 12; G.stats.totalEarned = 86000;
    G.medallions = 12;
    G.garage.push('COMET', 'VIREO GT', 'RUKAN PELO GT', 'CALYX SPRINT GT');
    G.player.x = 0; G.player.z = 14; G.player.angle = Math.PI;
    ctx.playerMesh.position.set(G.player.x, 0, G.player.z);
    ctx.playerMesh.rotation.y = G.player.angle;
    placeTraffic(ctx, [
      [-21, -10, Math.PI, 10], [21, 6, 0, 9], [-63, 20, Math.PI, 11],
      [21, -30, Math.PI, 8], [-21, 40, 0, 10], [63, -14, 0, 12],
    ]);
    placePeds(ctx, [
      [-8, 8, 0], [8, -6, Math.PI], [-8, -14, 0], [10, 20, Math.PI],
      [-28, 10, 0], [28, -10, Math.PI], [-14, 28, 0], [14, -24, Math.PI],
    ]);
    armPolice(ctx, 0);
    hud.fillVictory(G);
    document.getElementById('victory-screen').classList.add('show');
    ctx.feel.snap(G.player, G.player.angle, false);
    ctx.feel.update(0.016, G.player, G.player.angle, 0, false);
  } else {
    // Unknown shot name: fall back to the cover.
    stageShot('cover', ctx);
  }
}
