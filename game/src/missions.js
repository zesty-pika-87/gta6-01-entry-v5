// The eight story jobs of Costa Palma. Each one names its giver, its
// objective line, where it happens, what it pays and how hot it gets.
export const MISSIONS = [
  {
    id: 0, name: 'FIRST KEY', giver: 'nadia', pay: 350, wanted: 0,
    objective: 'Steal any car on the street, drive it to Palma Plaza',
    next: 'Meet Nadia at the plaza fountain',
    target: { x: 0, z: 0, label: 'PALMA PLAZA' },
    dialog: 'First key, first rule: the city belongs to whoever takes it. Go take a car.',
  },
  {
    id: 1, name: "THE BROKER'S ERRAND", giver: 'silas', pay: 500, wanted: 1,
    objective: 'Pick up the package at the harbour, deliver it to the garage',
    next: 'Stay clean — patrols are watching the harbour road',
    target: { x: -60, z: -60, label: 'HARBOUR' },
    dialog: 'Package at the harbour, garage at the plaza. Keep it clean and the money is yours.',
  },
  {
    id: 2, name: "OLD TOMAS'S DEBT", giver: 'tomas', pay: 650, wanted: 1,
    objective: 'Face 3 of Flint\'s collectors at the docks, bring the debt home',
    next: 'Fists first — the collectors swing before they talk',
    target: { x: -10, z: 80, label: 'THE DOCKS' },
    dialog: 'Flint\'s collectors are at the docks. My debt, my hands — but I\'ll take yours. Bring the money home.',
  },
  {
    id: 3, name: 'HOT WHEELS', giver: 'lena', pay: 800, wanted: 2,
    objective: 'Steal the red Comet racing the beach road, bring it to the garage',
    next: 'The owner will chase you — lose him on the strand',
    target: { x: 40, z: -70, label: 'SOLTERRA STRAND' },
    dialog: 'That red Comet is mine by right of speed. Take it off the beach road and bring it to the garage.',
  },
  {
    id: 4, name: 'DOCKSIDE DOUBLE-CROSS', giver: 'silas', pay: 950, wanted: 2,
    objective: 'Survive the ambush at the marina — 4 armed thugs — then escape',
    next: 'Use the containers as cover, then run',
    target: { x: -60, z: -60, label: 'MARINA ROW' },
    dialog: 'It was a setup, kid. Four of Flint\'s boys in the marina. Shoot straight and run faster.',
  },
  {
    id: 5, name: 'NEON RUN', giver: 'lena', pay: 1100, wanted: 1, nightOnly: true,
    objective: 'Win the street race on the neon strip — 6 checkpoints, 3 rivals',
    next: 'First across the line takes the purse',
    target: { x: 55, z: 35, label: 'NEON STRIP' },
    dialog: 'Six checkpoints, three rivals, one winner. Neon Run starts when you say go.',
  },
  {
    id: 6, name: 'STORM WARNING', giver: 'nadia', pay: 1400, wanted: 3,
    objective: 'Break through the roadblock in the rain — reach the garage',
    next: 'Roadblock ahead — do not stop for anyone',
    target: { x: 0, z: 0, label: 'GARAGE' },
    dialog: 'Flint called in every cruiser in Costa Palma. Roadblocks on the roads, rain on the way. Get to the garage — and do not stop for anyone.',
  },
  {
    id: 7, name: 'THE PALMA JOB', giver: 'nadia', pay: 2500, wanted: 4, nightOnly: true,
    objective: 'Grab the safe from Flint\'s marina warehouse, outrun the 4★ manhunt',
    next: 'Helicopter overhead — break line of sight at the garage',
    target: { x: -60, z: -60, label: 'MARINA WAREHOUSE' },
    dialog: 'The Palma Job is tonight. You, me, Lena and Silas. No mistakes, no witnesses.',
  },
];

export function createMissions() {
  let index = 0;
  let stage = 1;
  const stages = [2, 2, 3, 3, 4, 6, 5, 5];
  let timer = 0;
  let done = [];

  function current() { return MISSIONS[Math.min(index, MISSIONS.length - 1)]; }
  function stageTotal() { return stages[index]; }
  function isComplete() { return index >= MISSIONS.length; }

  function startMission(i) {
    index = i; stage = 1;
    timer = 90 + i * 30;
  }

  function advanceStage() {
    stage += 1;
    if (stage > stageTotal()) {
      done = [...done, index];
      const pay = current().pay;
      index += 1;
      stage = 1;
      if (index < MISSIONS.length) timer = 90 + index * 30;
      return { completed: true, pay };
    }
    return { completed: false, pay: 0 };
  }

  function fail() { stage = 1; timer = 90 + index * 30; }

  return {
    current, stageTotal, isComplete, startMission, advanceStage, fail,
    get index() { return index; },
    get stage() { return stage; },
    get timer() { return timer; },
    set timer(v) { timer = v; },
    get done() { return done; },
    set done(v) { done = v; },
  };
}
