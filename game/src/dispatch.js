// Police dispatch: the named units the HUD lists, with a role, a live
// distance in metres and a status line. The names here are the same units the
// police system spawns, so the panel never lies about who is chasing you.
export const UNIT_NAMES = [
  'PIER 5', 'TIDE 37', 'TIDE 2', 'TIDE 6', 'TIDE 14',
  'CORAL-48', 'CORAL-85', 'MARLIN-3', 'GULL 8', 'BASTION 3', 'MAKO 6',
];

export const UNIT_ROLES = ['PURSUIT', 'RAMMING', 'FLANKING', 'ROADBLOCK', 'SPOTLIGHT', 'FIRING'];

export function roleColor(role) {
  switch (role) {
    case 'RAMMING': return '#ff5d5d';
    case 'SPOTLIGHT': return '#7fb3ff';
    case 'ROADBLOCK': return '#ffd166';
    case 'FIRING': return '#ff8c42';
    case 'FLANKING': return '#37e6c8';
    default: return '#c8ccd4';
  }
}

// Build the dispatch rows the HUD renders: one row per live police unit,
// sorted nearest first, with the helicopter always listed as AIR ONE.
export function buildDispatchRows(policeUnits, heliActive, playerPos) {
  const rows = [];
  for (const u of policeUnits) {
    const dx = u.x - playerPos.x, dz = u.z - playerPos.z;
    rows.push({
      name: u.name, role: u.role,
      dist: Math.round(Math.hypot(dx, dz)),
      status: u.dist < 12 ? 'IN SIGHT' : u.dist < 40 ? 'CLOSING IN' : 'RESPONDING',
    });
  }
  if (heliActive) {
    rows.unshift({ name: 'AIR ONE', role: 'SPOTLIGHT', dist: 36, status: 'IN SIGHT' });
  }
  rows.sort((a, b) => a.dist - b.dist);
  return rows;
}
