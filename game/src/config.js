// Costa Palma tuning: every number the game balances on lives here, so one
// read tells you how fast, how rich and how hot the city feels.
export const CFG = {
  // City grid: blocks of `block` size, roads `road` wide, `blocks` per side.
  block: 30, road: 12, blocks: 6,
  // Player on foot.
  walkSpeed: 7.5, runSpeed: 11, playerTurn: 9,
  // Driving.
  carAccel: 26, carBrake: 42, carReverse: 12, carMax: 46, carTurn: 2.1,
  // Wanted + police.
  wantedMax: 5, wantedDecay: 14, heliAt: 4, roadblockAt: 3,
  policeTop: 34, policeAccel: 20,
  // Combat.
  punchRange: 2.4, punchDamage: 34, punchCooldown: 0.45,
  pistolRange: 55, pistolDamage: 26, pistolMag: 12, pistolReserve: 84,
  smgMag: 30, smgReserve: 90, thugHp: 70,
  // Economy + progression.
  startMoney: 250, chainWindow: 6, chainBonus: 25,
  ranks: ['ROOKIE', 'HUSTLER', 'STREET BOSS', 'KINGPIN', 'LEGEND OF THE COAST'],
  rankRp: [0, 300, 900, 2000, 3600],
  // World dressing.
  trafficCount: 10, pedCount: 26, medallions: 12,
  goldenHour: 18.7, noonHour: 13.2, nightHour: 21.5,
};

// Warm coastal palette: sun-baked facades, teal sea, orange dusk.
export const PALETTE = {
  sand: 0xe8c98f, sea: 0x2fa8b8, seaDeep: 0x1d7f96,
  asphalt: 0x4a4a55, sidewalk: 0xcbb59a,
  facade: [0xff9e5e, 0xffc46b, 0xff7d6b, 0xf7e6c4, 0xffb3a0, 0xffe08a, 0xf28c8c, 0x8fd3c7],
  neon: [0xff5da2, 0x37e6c8, 0xffd166, 0x7fb3ff, 0xff8c42],
  car: [0xe63946, 0xf4a261, 0x2a9d8f, 0x457b9d, 0xf1fa8c, 0xffffff, 0x22223b, 0xff6d9d],
  palmTrunk: 0x8a5a33, palmLeaf: 0x3f9e4d, palmLeaf2: 0x57b25e,
  skyDuskTop: 0x7b5ea7, skyDuskMid: 0xff8c5a, skyDuskLow: 0xffc46b,
  skyDayTop: 0x3f8fd2, skyDayLow: 0xbfe8ff,
  skyNightTop: 0x1b1440, skyNightLow: 0x5b2a6e,
  sun: 0xffd166,
};

// Radio stations the player flips through while driving. Each has a DJ and
// a line of chatter that rotates, so the radio feels like a person, not a label.
export const RADIO = [
  { name: 'LUMEN FM 98.6', track: 'NEON TIDELINE', dj: 'DJ MARLA', chatter: ['macet di jembatan, hindari causeway...', 'malam ini hujan rintik di marina...', 'Flint cari Comet merah, hati-hati...'] },
  { name: 'RADIO NARANJA 99.1', track: 'AREPA LIGHTS', dj: 'DJ SOL', chatter: ['ombak tinggi di strand sore ini...', 'balap liar di neon strip, polisi siaga...'] },
  { name: 'CELESTE 98.1', track: 'VELA ROJA', dj: 'DJ LUNA', chatter: ['pasar malam Old Town ramai malam ini...', 'angin kencang, payung pantai beterbangan...'] },
  { name: 'SOL 101.9', track: 'MARINA SUNSET', dj: 'DJ BRISA', chatter: ['ferry ke pulau telat 20 menit...', 'matahari tenggelam pukul 18:52, jangan lewatkan...'] },
];

// District names the HUD shows as the player crosses the map.
export const DISTRICTS = [
  { name: 'MARINA ROW', x: -60, z: -60, blurb: 'Boats, bait and bad deals' },
  { name: 'SOLTERRA STRAND', x: 40, z: -70, blurb: 'Sand, surf and sunsets' },
  { name: 'NEON STRIP', x: 55, z: 35, blurb: 'Lights that never sleep' },
  { name: 'OLD TOWN', x: -55, z: 45, blurb: 'Plaza, fountain, old debts' },
  { name: 'THE DOCKS', x: -10, z: 80, blurb: 'Containers and cranes' },
  { name: 'PALMA PLAZA', x: 0, z: 0, blurb: 'Heart of Costa Palma' },
];

export function districtAt(x, z) {
  let best = DISTRICTS[5], bd = Infinity;
  for (const d of DISTRICTS) {
    const dd = (d.x - x) * (d.x - x) + (d.z - z) * (d.z - z);
    if (dd < bd) { bd = dd; best = d; }
  }
  return best;
}
