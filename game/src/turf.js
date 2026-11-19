// Turf war: every district of Costa Palma belongs to a gang — PALMA CREW
// (green, the player's crew), FLINT CREW (red, Dario Flint's gang) or
// NEUTRAL (grey). Jobs, races and takedowns in a district push its control
// toward PALMA; a district under attack flashes TURF WAR until it flips.
export const GANGS = {
  PALMA: { name: 'PALMA', color: '#37e6c8', label: 'PALMA CREW' },
  FLINT: { name: 'FLINT', color: '#ff5d5d', label: 'FLINT CREW' },
  NEUTRAL: { name: 'NEUTRAL', color: '#9aa0aa', label: 'NEUTRAL' },
};

// Starting control, in percent of the district held by its owner.
const START_TURF = {
  'PALMA PLAZA': { owner: 'PALMA', pct: 82, war: false },
  'MARINA ROW': { owner: 'FLINT', pct: 65, war: true },
  'SOLTERRA STRAND': { owner: 'PALMA', pct: 65, war: false },
  'NEON STRIP': { owner: 'NEUTRAL', pct: 50, war: false },
  'OLD TOWN': { owner: 'FLINT', pct: 58, war: false },
  'THE DOCKS': { owner: 'FLINT', pct: 71, war: true },
};

export function createTurf() {
  const districts = {};
  for (const [name, v] of Object.entries(START_TURF)) districts[name] = { ...v };

  function of(name) { return districts[name]; }

  // A job finished in a district pushes it 12 points toward PALMA. At 100
  // the district flips to PALMA; a FLINT district that falls below 40 while
  // contested flips the other way. "Take Turf" jobs push double.
  function shift(name, amount, takeTurf) {
    const d = districts[name];
    if (!d) return;
    const push = takeTurf ? amount * 2 : amount;
    if (d.owner === 'PALMA') d.pct = Math.min(100, d.pct + push);
    else if (d.owner === 'NEUTRAL') { d.pct += push; if (d.pct >= 65) { d.owner = 'PALMA'; d.pct = 65; } }
    else { d.pct -= push; if (d.pct <= 35) { d.owner = 'PALMA'; d.pct = 65; d.war = false; } }
    if (d.owner === 'PALMA' && d.pct >= 100) d.war = false;
  }

  function setWar(name, on) { if (districts[name]) districts[name].war = on; }

  function summary() {
    const names = Object.keys(districts);
    const palma = names.filter((n) => districts[n].owner === 'PALMA').length;
    const total = names.reduce((s, n) => s + (districts[n].owner === 'PALMA' ? districts[n].pct : 0), 0);
    const avg = palma > 0 ? Math.round(total / palma) : 0;
    return { palma, total: names.length, avg, text: 'TURF ' + palma + '/' + names.length + ' districts · ' + avg + '%' };
  }

  function serialize() {
    const out = {};
    for (const [n, d] of Object.entries(districts)) out[n] = { ...d };
    return out;
  }

  function restore(data) {
    if (!data) return;
    for (const [n, d] of Object.entries(data)) if (districts[n]) districts[n] = { ...districts[n], ...d };
  }

  return { districts, of, shift, setWar, summary, serialize, restore };
}
