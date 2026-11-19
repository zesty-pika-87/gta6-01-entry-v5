// The crew: three named specialists who ride with the player, each with a
// job the HUD card shows and a small bonus the game actually applies.
export const CREW = [
  { id: 'mira', name: 'MIRA', full: 'MIRA KESANG', role: 'DRIVER', perk: 'SWAP PLATES',
    blurb: 'Swaps plates mid-chase: wanted decays faster.', color: '#37e6c8' },
  { id: 'lio', name: 'LIO', full: 'LIO MAR', role: 'MECHANIC', perk: 'QUICK FIX',
    blurb: 'Patches the car on the move: condition drains slower.', color: '#ffd166' },
  { id: 'kiki', name: 'KIKI', full: 'KIKI SOL', role: 'LOOKOUT', perk: 'EYES OUT',
    blurb: 'Spots roadblocks early: dispatch warns you sooner.', color: '#ff5da2' },
];

export function createCrew() {
  const members = CREW.map((c) => ({ ...c, recruited: false }));
  let respect = 0;

  function recruit(id) {
    const m = members.find((x) => x.id === id);
    if (m) m.recruited = true;
  }

  function addRespect(amount) { respect += amount; }

  function active() { return members.filter((m) => m.recruited); }

  function hasPerk(perk) {
    return members.some((m) => m.recruited && m.perk === perk);
  }

  return {
    members, recruit, addRespect, active, hasPerk,
    get respect() { return respect; },
    set respect(v) { respect = v; },
  };
}
