// The weapon rack: five slots the HUD draws, with ammo, locked states and
// the damage the combat system reads. Slots unlock as the story advances.
export const WEAPONS = [
  { id: 'fists', key: '1', name: 'FISTS', ammo: Infinity, reserve: Infinity, damage: 34, locked: false },
  { id: 'p9', key: '2', name: 'P9', ammo: 12, reserve: 84, damage: 26, locked: false },
  { id: 'smg', key: '3', name: 'SMG', ammo: 30, reserve: 90, damage: 18, locked: false },
  { id: 'ar9', key: '4', name: 'AR-9', ammo: 24, reserve: 48, damage: 30, locked: true, unlockMission: 4 },
  { id: 'rpg', key: '5', name: 'RPG', ammo: 1, reserve: 2, damage: 120, locked: true, unlockMission: 7 },
];

export function createWeapons() {
  const slots = WEAPONS.map((w) => ({ ...w }));
  let selected = 1; // P9 by default once the player has it.

  function unlockFor(missionsDone) {
    for (const s of slots) {
      if (s.locked && s.unlockMission !== undefined && missionsDone >= s.unlockMission) s.locked = false;
    }
  }

  function current() { return slots[selected]; }

  function select(index) {
    if (index >= 0 && index < slots.length && !slots[index].locked) selected = index;
  }

  function cycle() {
    for (let i = 1; i <= slots.length; i += 1) {
      const n = (selected + i) % slots.length;
      if (!slots[n].locked) { selected = n; return; }
    }
  }

  function spendAmmo() {
    const w = slots[selected];
    if (w.ammo === Infinity) return true;
    if (w.ammo <= 0) return false;
    w.ammo -= 1;
    return true;
  }

  function reload() {
    const w = slots[selected];
    if (w.ammo === Infinity || w.reserve <= 0) return;
    const mag = w.id === 'p9' ? 12 : w.id === 'smg' ? 30 : w.id === 'ar9' ? 24 : 1;
    const need = mag - w.ammo;
    const take = Math.min(need, w.reserve);
    w.ammo += take;
    w.reserve -= take;
  }

  function addAmmo(id, amount) {
    const w = slots.find((s) => s.id === id);
    if (w && w.reserve !== Infinity) w.reserve += amount;
  }

  return { slots, unlockFor, current, select, cycle, spendAmmo, reload, addAmmo,
    get selected() { return selected; } };
}
