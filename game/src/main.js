// Costa Palma — boot and the one loop. Input is read every frame, the world
// advances in fixed 1/60 s steps, the renderer paints what is there and the
// HUD shows the same state the systems write. The game moves between title,
// play, board, victory and busted screens.
//
// ?seed=N fixes the city. ?shot=cover|street|board|victory (with &seed=N)
// stages that scene instead of running the loop and sets window.__shotReady.
import * as THREE from 'three';
import { CFG, PALETTE } from './config.js';
import { createRandom, pick, range } from './random.js';
import { createInput, ACT_ENTER, ACT_PUNCH, ACT_SHOOT, ACT_HORN, ACT_PAUSE, ACT_BOARD, ACT_MAP, ACT_CONFIRM, ACT_RADIO, ACT_TAXI, ACT_VIG } from './input.js';
import { createRender } from './render.js';
import { createSky, createGround, createPalms, createLandmarks, roadLines } from './world.js';
import { createBuildings } from './buildings.js';
import { createTraffic } from './traffic.js';
import { createPedestrians, buildPersonMesh } from './pedestrians.js';
import { createPolice } from './police.js';
import { createCombat } from './combat.js';
import { createVehicles, CAR_MODELS } from './vehicles.js';
import { createMissions, MISSIONS } from './missions.js';
import { createWeapons } from './weapons.js';
import { createCrew } from './crew.js';
import { createParticles } from './particles.js';
import { createFeel } from './feel.js';
import { createAudio } from './audio.js';
import { createMusic } from './music.js';
import { createHud } from './hud.js';
import { loadSave, writeSave } from './save.js';
import { CHARACTERS, rankIndexFor } from './story.js';
import { createTurf } from './turf.js';
import { createSideJobs } from './sidejobs.js';
import { createClock, isNight, NIGHT_BONUS } from './clock.js';
import { DISTRICTS } from './config.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 7;
const rng = createRandom(seed);

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const saved = loadSave();

// ---- renderer, sky, city ----
const render = createRender(canvas, CFG.goldenHour);
const scene = render.scene;
const sky = createSky(scene, CFG.goldenHour);
createGround(scene, rng);
createBuildings(scene, rng);
createPalms(scene, rng);
const landmarks = createLandmarks(scene, rng);

// ---- systems ----
const traffic = createTraffic(scene, rng, CFG.trafficCount);
const peds = createPedestrians(scene, rng, CFG.pedCount);
const police = createPolice(scene, rng);
const combat = createCombat(scene, rng);
const vehicles = createVehicles(scene, rng);
const missions = createMissions();
const weapons = createWeapons();
const crew = createCrew();
const turf = createTurf();
const sideJobs = createSideJobs();
const clock = createClock(CFG.goldenHour);
if (saved.turf) turf.restore(saved.turf);
sideJobs.setStats({ taxiDone: saved.taxiDone || 0, vigDone: saved.vigDone || 0, faresEarned: saved.faresEarned || 0 });
const particles = createParticles(scene);
const feel = createFeel(render.camera);
const audio = createAudio();
const music = createMusic(audio);
const hud = createHud();

// ---- the shared game state the HUD reads ----
const G = {
  missions, weapons, crew, turf, sideJobs,
  money: saved.money, hp: 78, armor: 55, rp: saved.rp, rankIndex: rankIndexFor(saved.rp),
  wanted: 0, chain: 0, chainTimer: 0, hour: CFG.goldenHour, radio: saved.radio || 0,
  clockFmt: 'DAY 1 · 18:42', elapsed: 0,
  player: { x: 0, z: 14, angle: Math.PI, speed: 0 },
  playerCar: null, playerSpeed: 0,
  policeUnits: [], heliActive: false, roadblockActive: false,
  missionTarget: { x: 0, z: 0 },
  traffic: traffic.cars, police: [],
  medallions: saved.medallions.length, garage: saved.garage,
  stats: { carsStolen: saved.carsStolen, copsEscaped: saved.copsEscaped, distanceKm: saved.distanceKm, takenOut: saved.takenOut, bestChain: saved.bestChain, totalEarned: saved.totalEarned },
  screen: 'title',
};

// Player mesh on foot.
const playerMesh = buildPersonMesh(0x37e6c8, 0x2b2b33);
playerMesh.position.set(G.player.x, 0, G.player.z);
scene.add(playerMesh);

// Parked cars the player can steal, plus the red Comet for the beach road.
for (let i = 0; i < 6; i += 1) {
  const road = pick(rng, roadLines());
  const along = range(rng, -100, 100);
  const vertical = rng() < 0.5;
  vehicles.spawnCar(
    pick(rng, CAR_MODELS),
    vertical ? road + (rng() < 0.5 ? -3 : 3) : along,
    vertical ? along : road + (rng() < 0.5 ? -3 : 3),
    vertical ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
  );
}
const comet = vehicles.spawnCar(CAR_MODELS[0], -18, -30, Math.PI, { color: 0xe63946 });

// Sun Medallions: twelve gold pickups hidden around the city.
const medallionMeshes = [];
for (let i = 0; i < CFG.medallions; i += 1) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16),
    new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.6 }),
  );
  const x = range(rng, -110, 110), z = range(rng, -110, 110);
  m.position.set(x, 0.9, z);
  m.rotation.x = Math.PI / 2;
  scene.add(m);
  medallionMeshes.push({ mesh: m, x, z, taken: saved.medallions.includes(i), id: i });
  if (saved.medallions.includes(i)) m.visible = false;
}

// Mission target marker: a gold pillar of light the player drives toward.
const marker = new THREE.Mesh(
  new THREE.CylinderGeometry(1.6, 1.6, 40, 12, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
);
marker.position.set(0, 20, 0);
scene.add(marker);

let screen = 'title';
let wantedTimer = 0;
let punchCool = 0;
let shootCool = 0;
let saveTimer = 0;
let elapsed = 0;
let lastCrimeAt = -99;
let thugsSpawnedFor = -1;
let hudTick = 0;
let taxiPickup = null;
let taxiDrop = null;
let vigTarget = null;

function districtPos(name) {
  const d = DISTRICTS.find((x) => x.name === name);
  return d ? { x: d.x, z: d.z } : { x: 0, z: 0 };
}

function announce(msg) { statusEl.textContent = msg; }

function missionTargetFor() {
  const m = missions.current();
  if (!m) return { x: 0, z: 0 };
  // Odd stages go to the job site, even stages bring the player home.
  return missions.stage % 2 === 1 ? m.target : { x: 0, z: 0, label: 'GARAGE' };
}

function raiseWanted(n, why) {
  G.wanted = Math.min(CFG.wantedMax, G.wanted + n);
  lastCrimeAt = elapsed;
  if (G.wanted >= 1) audio.startSiren();
  if (why) hud.showToast(why, 1500);
}

function addChain(n) {
  G.chain += n;
  G.chainTimer = CFG.chainWindow;
  if (G.chain > G.stats.bestChain) G.stats.bestChain = G.chain;
}

function startMission(i) {
  const m0 = MISSIONS[i];
  // NIGHT ONLY missions (F3): if the sun is still up, time jumps to nightfall.
  if (m0 && m0.nightOnly && !isNight(clock.hour)) {
    clock.jumpToNight();
    G.hour = clock.hour;
    hud.showToast('NIGHTFALL · 20:00 — THE JOB IS ON · PAY +25%', 2600);
  }
  missions.startMission(i);
  const m = missions.current();
  hud.setDialog(m.giver, m.dialog);
  hud.showToast('MISSION ' + (i + 1) + ' · ' + m.name, 2200);
  announce('Mission ' + (i + 1) + ': ' + m.name);
  thugsSpawnedFor = -1;
  if (i === 2) {
    for (let k = 0; k < 3; k += 1) combat.spawnThug(-10 + k * 4, 76 + k * 3, false);
    thugsSpawnedFor = i;
  }
  if (i === 4) {
    for (let k = 0; k < 4; k += 1) combat.spawnThug(-64 + k * 4, -56 + (k % 2) * 6, true);
    thugsSpawnedFor = i;
  }
}

function completeStage() {
  const doneIndex = missions.index;
  const doneMission = MISSIONS[doneIndex];
  const res = missions.advanceStage();
  if (res.completed) {
    // Night bonus (F3): night jobs pay +25%.
    const night = isNight(clock.hour);
    const pay = night ? Math.round(res.pay * (1 + NIGHT_BONUS)) : res.pay;
    // Turf (F1): finishing a job pushes its district toward PALMA.
    const label = doneMission ? doneMission.target.label : 'PALMA PLAZA';
    const districtName = label === 'GARAGE' ? 'PALMA PLAZA'
      : label === 'HARBOUR' || label === 'MARINA ROW' || label === 'MARINA WAREHOUSE' ? 'MARINA ROW'
      : label === 'THE DOCKS' ? 'THE DOCKS'
      : label === 'SOLTERRA STRAND' ? 'SOLTERRA STRAND'
      : label === 'NEON STRIP' ? 'NEON STRIP' : 'PALMA PLAZA';
    turf.shift(districtName, 12, doneIndex === 4);
    G.money += pay;
    G.stats.totalEarned += pay;
    G.rp += 150;
    G.rankIndex = rankIndexFor(G.rp);
    audio.mission();
    hud.showToast('JOB DONE · +$' + pay + (night ? ' · NIGHT BONUS +25%' : ''), 2400);
    weapons.unlockFor(missions.done.length);
    if (missions.index === 1) crew.recruit('mira');
    if (missions.index === 3) crew.recruit('lio');
    if (missions.index === 5) crew.recruit('kiki');
    hud.buildCrew(crew);
    if (missions.isComplete()) {
      showVictory();
      return;
    }
    startMission(missions.index);
  }
}

function showVictory() {
  screen = 'victory';
  G.screen = 'victory';
  hud.fillVictory(G);
  document.getElementById('victory-screen').classList.add('show');
  writeSaveNow();
  announce('Victory. Costa Palma is yours.');
}

function showBusted(wasted) {
  screen = 'busted';
  G.screen = 'busted';
  G.money = Math.max(0, G.money - 200);
  document.querySelector('#busted-screen h1').textContent = wasted ? 'WASTED' : 'BUSTED';
  document.getElementById('busted-screen').classList.add('show');
  audio.stopSiren();
  writeSaveNow();
}

function writeSaveNow() {
  writeSave({
    money: G.money, missionsDone: missions.done,
    medallions: medallionMeshes.filter((m) => m.taken).map((m) => m.id),
    garage: G.garage, bestChain: G.stats.bestChain, totalEarned: G.stats.totalEarned,
    carsStolen: G.stats.carsStolen, copsEscaped: G.stats.copsEscaped,
    distanceKm: G.stats.distanceKm, takenOut: G.stats.takenOut,
    rank: G.rankIndex, rp: G.rp, radio: G.radio,
    turf: turf.serialize(),
    taxiDone: sideJobs.taxiDone, vigDone: sideJobs.vigDone, faresEarned: sideJobs.faresEarned,
  });
}

function enterCar(car) {
  G.playerCar = car;
  car.isPlayer = true;
  car.stolen = true;
  G.stats.carsStolen += 1;
  G.stats.distanceKm += 0.1;
  playerMesh.visible = false;
  if (!G.garage.includes(car.model.name)) G.garage.push(car.model.name);
  raiseWanted(1, 'VEHICLE STOLEN · +1★');
  addChain(1);
  audio.startEngine();
  hud.showToast('VEHICLE STOLEN · ' + car.model.name, 1800);
}

function exitCar() {
  const car = G.playerCar;
  if (!car) return;
  G.playerCar = null;
  car.isPlayer = false;
  G.player.x = car.x + Math.cos(car.angle) * 2.5;
  G.player.z = car.z - Math.sin(car.angle) * 2.5;
  G.player.angle = car.angle;
  playerMesh.visible = true;
  playerMesh.position.set(G.player.x, 0, G.player.z);
}

function step(dt) {
  elapsed += dt;
  G.elapsed = elapsed;
  // Day-night cycle (F3): the clock runs, the sky follows it.
  clock.step(dt);
  G.hour = clock.hour;
  G.clockFmt = clock.fmt();
  const bucket = Math.floor(clock.hour * 2);
  if (bucket !== step._bucket) {
    step._bucket = bucket;
    render.setHour(clock.hour);
    sky.setHour(clock.hour);
  }
  const input = G.input;
  const actions = input.takeActions();

  // ---- menus ----
  if (screen === 'title') {
    if (actions & ACT_CONFIRM) startGame(false);
    return;
  }
  if (actions & ACT_BOARD || actions & ACT_MAP) {
    if (screen === 'play') {
      screen = 'board'; G.screen = 'board';
      hud.fillBoard(G);
      document.getElementById('board-screen').classList.add('show');
    } else if (screen === 'board') {
      screen = 'play'; G.screen = 'play';
      document.getElementById('board-screen').classList.remove('show');
    }
    return;
  }
  if (actions & ACT_PAUSE) {
    if (screen === 'play') {
      screen = 'board'; G.screen = 'board';
      hud.fillBoard(G);
      document.getElementById('board-screen').classList.add('show');
    } else if (screen === 'board') {
      screen = 'play'; G.screen = 'play';
      document.getElementById('board-screen').classList.remove('show');
    }
    return;
  }
  if (screen !== 'play') return;

  if (actions & ACT_RADIO) {
    G.radio = (G.radio + 1) % 4;
    hud.showToast('♪ ' + ['LUMEN FM 98.6', 'RADIO NARANJA 99.1', 'CELESTE 98.1', 'SOL 101.9'][G.radio], 1200);
  }
  if (actions & ACT_HORN && G.playerCar) {
    audio.horn();
    particles.smoke(G.playerCar.x, 1, G.playerCar.z);
  }
  // Side jobs (F2): T takes a taxi fare, V starts a vigilante hunt.
  if (actions & ACT_TAXI && sideJobs.offerAvailable('taxi')) {
    const t = sideJobs.acceptTaxi(sideJobs.taxiDone);
    taxiPickup = districtPos(t.job.from);
    taxiDrop = districtPos(t.job.to);
    hud.showToast('TAXI FARE · ' + t.job.passenger + ' waiting at ' + t.job.from, 2200);
    audio.pickup();
  }
  if (actions & ACT_VIG && sideJobs.offerAvailable('vigilante')) {
    const v = sideJobs.acceptVigilante(sideJobs.vigDone);
    vigTarget = vehicles.spawnCar(CAR_MODELS[6], G.player.x + 18, G.player.z - 24, Math.PI, { color: 0x22223b });
    hud.showToast('VIGILANTE TARGET · ' + v.target.name + ' · TAKE DOWN', 2200);
  }

  // ---- movement ----
  const fwd = input.forward();
  const steer = input.steer();
  const wasInCar = !!G.playerCar;
  if (G.playerCar) {
    const car = G.playerCar;
    vehicles.drive(car, fwd, steer, dt);
    G.player.x = car.x; G.player.z = car.z; G.player.angle = car.angle;
    G.playerSpeed = car.speed;
    G.stats.distanceKm += Math.abs(car.speed) * dt / 1000;
    audio.setEngine(car.speed, true);
    if (Math.abs(steer) > 0.6 && Math.abs(car.speed) > 18) {
      particles.dust(car.x - Math.sin(car.angle) * 2, car.z - Math.cos(car.angle) * 2);
      if (Math.random() < dt * 0.5) hud.showToast('DRIFT x3', 900);
    }
    // Near miss: threading traffic at speed pays.
    for (const t of traffic.cars) {
      const d = Math.hypot(t.x - car.x, t.z - car.z);
      if (d < 3.2 && d > 2.2 && Math.abs(car.speed) > 20 && !t.nearMissed) {
        t.nearMissed = true;
        G.money += 50;
        addChain(1);
        hud.showToast('NEAR MISS +$50', 1200);
        audio.coin();
      }
      if (d > 6) t.nearMissed = false;
      // Crash into traffic.
      if (d < 2.6 && Math.abs(car.speed) > 6) {
        car.speed *= 0.4;
        car.condition = Math.max(0, car.condition - 6);
        feel.addShake(0.7);
        audio.crash();
        particles.sparks(car.x, 1, car.z);
        raiseWanted(1, '');
        addChain(1);
      }
    }
    // Medallions from the car.
    for (const m of medallionMeshes) {
      if (!m.taken && Math.hypot(m.x - car.x, m.z - car.z) < 3) {
        m.taken = true; m.mesh.visible = false;
        G.medallions += 1; G.money += 100;
        hud.showToast('SUN MEDALLION ' + G.medallions + '/12 · +$100', 1600);
        audio.coin();
      }
    }
  } else {
    const speed = input.running() ? CFG.runSpeed : CFG.walkSpeed;
    G.player.angle += steer * CFG.playerTurn * dt * 0.4;
    const mx = Math.sin(G.player.angle) * fwd * speed;
    const mz = Math.cos(G.player.angle) * fwd * speed;
    G.player.x += mx * dt;
    G.player.z += mz * dt;
    G.player.x = Math.max(-124, Math.min(124, G.player.x));
    G.player.z = Math.max(-124, Math.min(124, G.player.z));
    G.playerSpeed = Math.abs(fwd) * speed;
    playerMesh.position.set(G.player.x, 0, G.player.z);
    playerMesh.rotation.y = G.player.angle;
    const swing = Math.sin(elapsed * 10) * 0.5 * Math.abs(fwd);
    playerMesh.userData.legL.rotation.x = swing;
    playerMesh.userData.legR.rotation.x = -swing;
    audio.setEngine(0, false);
    if (actions & ACT_ENTER) {
      const car = vehicles.nearestCar(G.player.x, G.player.z, 4.5);
      if (car) enterCar(car);
    }
    for (const m of medallionMeshes) {
      if (!m.taken && Math.hypot(m.x - G.player.x, m.z - G.player.z) < 2) {
        m.taken = true; m.mesh.visible = false;
        G.medallions += 1; G.money += 100;
        hud.showToast('SUN MEDALLION ' + G.medallions + '/12 · +$100', 1600);
        audio.coin();
      }
    }
  }
  // Exit only counts when the player was already driving when the step
  // began — the same E press that steals a car must not exit it again.
  if (wasInCar && G.playerCar && (actions & ACT_ENTER)) exitCar();

  // ---- combat ----
  punchCool -= dt; shootCool -= dt;
  if ((actions & ACT_PUNCH) && punchCool <= 0) {
    punchCool = CFG.punchCooldown;
    audio.punch();
    const hit = combat.punch(G.player, G.player.angle);
    if (hit) {
      feel.addHitStop(60);
      feel.addShake(0.3);
      particles.sparks(hit.x, 1.4, hit.z);
      raiseWanted(1, '');
      addChain(1);
    }
  }
  if ((actions & ACT_SHOOT) && shootCool <= 0 && !G.playerCar) {
    const w = weapons.current();
    if (weapons.spendAmmo()) {
      shootCool = w.id === 'smg' ? 0.12 : 0.3;
      audio.shoot();
      const hit = combat.shoot(G.player, G.player.angle, w);
      if (hit) {
        particles.sparks(hit.x, 1.4, hit.z);
        raiseWanted(1, '');
        addChain(1);
      }
      if (w.ammo === 0) weapons.reload();
    }
  }
  combat.step(dt, G.player, G.player.angle, (t) => {
    G.stats.takenOut += 1;
    G.money += 40;
    G.rp += 20;
    G.rankIndex = rankIndexFor(G.rp);
    addChain(1);
    audio.coin();
  });
  for (const pk of combat.pickups) {
    pk.onTake = (p) => {
      if (p.kind === 'health') { G.hp = Math.min(100, G.hp + 25); hud.showToast('HEALTH +25', 1200); }
      else if (p.kind === 'ammo') { weapons.addAmmo('p9', 24); weapons.addAmmo('smg', 30); hud.showToast('AMMO +24', 1200); }
      else { G.money += 60; hud.showToast('CASH +$60', 1200); }
      audio.pickup();
    };
  }

  // ---- side jobs tick (F2) ----
  if (sideJobs.tickOffers(dt)) {
    hud.showToast(sideJobs.offerAvailable('taxi') ? 'TAXI FARE AVAILABLE — press T' : 'VIGILANTE TARGET SPOTTED — press V', 2200);
  }
  const sjEvent = sideJobs.step(dt, G.player, taxiPickup, taxiDrop);
  if (sjEvent && sjEvent.pickedUp) {
    hud.showToast('PASSENGER ABOARD · meter running', 1800);
    audio.pickup();
  }
  if (sjEvent && sjEvent.delivered) {
    const d = sjEvent.delivered;
    G.money += d.total;
    G.stats.totalEarned += d.total;
    turf.shift(d.job.to, 4, false);
    hud.showToast('FARE $' + d.total.toFixed(2) + (d.tip ? ' · TIP +$' + d.tip : '') + ' · THANK YOU', 2200);
    audio.coin();
  }
  if (sjEvent && sjEvent.failed) {
    hud.showToast('FARE LOST — the passenger walked away', 2000);
  }
  // Vigilante target drives away; ram it at speed to take it down.
  if (vigTarget && sideJobs.vigilante) {
    vigTarget.x += Math.sin(vigTarget.angle) * 12 * dt;
    vigTarget.z += Math.cos(vigTarget.angle) * 12 * dt;
    vigTarget.mesh.position.set(vigTarget.x, 0, vigTarget.z);
    if (G.playerCar && Math.hypot(vigTarget.x - G.playerCar.x, vigTarget.z - G.playerCar.z) < 3.5 && Math.abs(G.playerCar.speed) > 10) {
      const done = sideJobs.completeVigilante();
      G.money += done.target.reward;
      G.stats.totalEarned += done.target.reward;
      turf.shift('NEON STRIP', 6, false);
      particles.explosion(vigTarget.x, 1, vigTarget.z);
      audio.explosion();
      feel.addShake(0.8);
      hud.showToast('TAKE DOWN · ' + done.target.name + ' · +$' + done.target.reward, 2400);
      vigTarget.mesh.visible = false;
      vigTarget = null;
    }
  }

  // ---- traffic, pedestrians, police ----
  const obstacles = [{ x: G.player.x, z: G.player.z }];
  if (G.playerCar) obstacles.push({ x: G.playerCar.x, z: G.playerCar.z });
  for (const u of police.cruisers) obstacles.push({ x: u.x, z: u.z });
  traffic.step(dt, obstacles);
  peds.step(dt, G.player, G.wanted);
  police.step(dt, G.player, G.wanted, elapsed);
  G.policeUnits = police.cruisers.map((u) => ({ x: u.x, z: u.z, name: u.name, role: u.role, dist: u.dist }));
  G.police = G.policeUnits;
  G.heliActive = !!police.heli;
  G.roadblockActive = !!police.roadblock;

  // Police contact hurts; foot officers chase on foot.
  for (const u of police.cruisers) {
    if (Math.hypot(u.x - G.player.x, u.z - G.player.z) < 3) {
      G.hp -= 8 * dt;
      feel.addShake(0.2);
    }
  }
  for (const o of police.foot) {
    if (Math.hypot(o.x - G.player.x, o.z - G.player.z) < 1.8) {
      G.hp -= 10 * dt;
      feel.addShake(0.3);
    }
  }
  if (G.wanted >= 1) audio.startSiren();

  // Wanted decays when the player stays clean and unseen.
  wantedTimer += dt;
  if (G.wanted > 0 && elapsed - lastCrimeAt > CFG.wantedDecay) {
    const near = police.cruisers.some((u) => u.dist < 25);
    if (!near) {
      G.wanted -= 1;
      lastCrimeAt = elapsed;
      if (G.wanted === 0) {
        audio.stopSiren();
        G.stats.copsEscaped += 1;
        hud.showToast('YOU LOST THEM · HEAT GONE', 2000);
      }
    }
  }

  // CHAIN timer.
  if (G.chainTimer > 0) {
    G.chainTimer -= dt;
    if (G.chainTimer <= 0 && G.chain >= 3) {
      const bonus = G.chain * CFG.chainBonus;
      G.money += bonus;
      hud.showToast('CHAIN BANKED +$' + bonus, 1800);
      G.chain = 0;
    } else if (G.chainTimer <= 0) G.chain = 0;
  }

  // Mission progress: reach the stage target.
  const target = missionTargetFor();
  G.missionTarget = target;
  marker.position.set(target.x, 20, target.z);
  const mdist = Math.hypot(target.x - G.player.x, target.z - G.player.z);
  if (mdist < 9 && missions.index < 8) {
    if (missions.index === 0 && missions.stage === 1 && !G.playerCar) {
      // First Key stage 1 needs a car first.
    } else {
      completeStage();
    }
  }
  missions.timer -= dt;
  if (missions.timer <= 0) {
    missions.fail();
    hud.showToast('MISSION FAILED — TRY AGAIN', 2200);
    hud.setDialog(missions.current().giver, missions.current().dialog);
  }

  // Health.
  if (G.hp <= 0) {
    showBusted(G.wanted > 0);
    return;
  }
  if (G.hp < 100) G.hp = Math.min(100, G.hp + 0.4 * dt);

  // Particles, music, autosave.
  particles.step(dt);
  music.setIntensity(G.wanted);
  saveTimer += dt;
  if (saveTimer > 12) { saveTimer = 0; writeSaveNow(); }

  // Camera + HUD.
  const focus = G.playerCar || G.player;
  const focusAngle = G.player.angle;
  feel.update(dt, focus, focusAngle, G.playerCar ? G.playerCar.speed : G.playerSpeed, !!G.playerCar);
  render.followTarget(new THREE.Vector3(G.player.x, 0, G.player.z));
  hudTick += 1;
  if (hudTick % 3 === 0) hud.update(G);
}

function startGame(fresh) {
  document.getElementById('title-screen').classList.remove('show');
  document.getElementById('board-screen').classList.remove('show');
  document.getElementById('victory-screen').classList.remove('show');
  document.getElementById('busted-screen').classList.remove('show');
  if (fresh) {
    G.money = CFG.startMoney; G.hp = 100; G.armor = 0; G.rp = 0; G.rankIndex = 0;
    G.wanted = 0; G.chain = 0;
    G.stats = { carsStolen: 0, copsEscaped: 0, distanceKm: 0, takenOut: 0, bestChain: 0, totalEarned: 0 };
    G.medallions = 0;
    missions.done = [];
  } else if (saved.missionsDone.length > 0) {
    missions.done = [...saved.missionsDone];
  }
  screen = 'play';
  G.screen = 'play';
  hud.buildWeapons(weapons);
  hud.buildCrew(crew);
  crew.recruit('mira');
  hud.buildCrew(crew);
  startMission(missions.done.length);
  audio.ensure();
  audio.startEngine();
  music.start();
  announce('Playing. Mission ' + (missions.index + 1) + ': ' + missions.current().name);
  feel.snap(G.player, G.player.angle, false);
}

function runGame() {
  const input = createInput(canvas);
  G.input = input;
  // Debug handle for live play-testing (read-only state inspection).
  window.__game = { G, vehicles, playerMesh };
  let last = performance.now();
  let accumulator = 0;

  document.getElementById('btn-new').addEventListener('click', () => startGame(true));
  document.getElementById('btn-continue').addEventListener('click', () => startGame(false));
  document.getElementById('btn-resume').addEventListener('click', () => {
    screen = 'play'; G.screen = 'play';
    document.getElementById('board-screen').classList.remove('show');
  });
  document.getElementById('btn-save').addEventListener('click', () => { writeSaveNow(); hud.showToast('GAME SAVED', 1500); });
  document.getElementById('btn-again').addEventListener('click', () => startGame(true));
  document.getElementById('btn-cruise').addEventListener('click', () => {
    document.getElementById('victory-screen').classList.remove('show');
    screen = 'play'; G.screen = 'play';
  });
  document.getElementById('btn-busted').addEventListener('click', () => {
    document.getElementById('busted-screen').classList.remove('show');
    G.hp = 100; G.wanted = 0; audio.stopSiren();
    screen = 'play'; G.screen = 'play';
  });
  const saveInfo = saved.missionsDone.length > 0 || saved.money > 250
    ? 'Save found: ' + saved.missionsDone.length + '/8 missions, $' + saved.money + '.'
    : 'No save yet — a fresh start on the coast.';
  document.getElementById('title-save').textContent = saveInfo;

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    while (accumulator >= STEP) {
      step(STEP);
      accumulator -= STEP;
    }
    render.renderer.render(scene, render.camera);
  }
  announce('Costa Palma. Press Enter or click New Game to start.');
  requestAnimationFrame(frame);
}

if (shot) {
  // Screenshot mode: stage the scene deterministically, paint, signal ready.
  document.getElementById('title-screen').classList.remove('show');
  const input = createInput(canvas);
  G.input = input;
  hud.buildWeapons(weapons);
  hud.buildCrew(crew);
  crew.recruit('mira'); crew.recruit('lio'); crew.recruit('kiki');
  hud.buildCrew(crew);
  stageShot(shot, { G, scene, render, sky, traffic, peds, police, combat, vehicles, missions, weapons, crew, particles, feel, hud, comet, playerMesh, marker, medallionMeshes, turf, sideJobs, clock });
  window.__debugScene = scene;
  window.__debugCamera = render.camera;
  hud.update(G);
  let painted = 0;
  function paint() {
    render.renderer.render(scene, render.camera);
    painted += 1;
    if (painted < 3) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
} else {
  runGame();
}
