// The people of Costa Palma: who they are, what they say, and the rank
// ladder the player climbs. All names are original to this city.
export const CHARACTERS = {
  nadia: {
    name: 'NADIA CRUZ', role: 'Fixer · your contact', color: '#ffd166',
    lines: [
      'Flint called in every cruiser in Costa Palma. Roadblocks on the roads, rain on the way. Get to the garage — and do not stop for anyone.',
      'First key, first rule: the city belongs to whoever takes it. Go take a car.',
      'The Palma Job is tonight. You, me, Lena and Silas. No mistakes, no witnesses.',
    ],
  },
  silas: {
    name: 'SILAS THE BROKER', role: 'Broker · harbour deals', color: '#7fb3ff',
    lines: [
      'Package at the harbour, garage at the plaza. Keep it clean and the money is yours.',
      'It was a setup, kid. Four of Flint\'s boys in the marina. Shoot straight and run faster.',
    ],
  },
  tomas: {
    name: 'OLD TOMAS', role: 'Plaza elder · owes nobody', color: '#f7e6c4',
    lines: ['Flint\'s collectors are at the docks. My debt, my hands — but I\'ll take yours. Bring the money home.'],
  },
  lena: {
    name: 'LENA MAR', role: 'Racer · beach road queen', color: '#ff5da2',
    lines: [
      'That red Comet is mine by right of speed. Take it off the beach road and bring it to the garage.',
      'Six checkpoints, three rivals, one winner. Neon Run starts when you say go.',
    ],
  },
  dario: {
    name: 'DARIO FLINT', role: 'Antagonist · owns the docks', color: '#ff6b6b',
    lines: ['Costa Palma is mine, every crate and every cop. You are a tourist with a stolen car.'],
  },
  dee: {
    name: 'UNCLE DEE', role: 'Fixer · bay patrol watcher', color: '#37e6c8',
    lines: ['Every cruiser in the bay and Air One want that coral Vireo. Forty seconds on the parade, then you vanish.'],
  },
};

// Rank ladder: RP thresholds and the title the HUD shows at each rung.
export const RANKS = [
  { name: 'ROOKIE', rp: 0, title: 'NEW BLOOD' },
  { name: 'HUSTLER', rp: 300, title: 'STREET SMART' },
  { name: 'STREET BOSS', rp: 900, title: 'SHOT CALLER' },
  { name: 'KINGPIN', rp: 2000, title: 'FIXER' },
  { name: 'LEGEND OF THE COAST', rp: 3600, title: 'LEGEND' },
];

export function rankFor(rp) {
  let rank = RANKS[0];
  for (const r of RANKS) if (rp >= r.rp) rank = r;
  return rank;
}

export function rankIndexFor(rp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i += 1) if (rp >= RANKS[i].rp) idx = i;
  return idx;
}
