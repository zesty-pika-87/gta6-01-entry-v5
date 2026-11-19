// Save and load: money, missions, garage, medals and career stats live in
// localStorage under one key, so a visit tomorrow continues where today ended.
export const SAVE_KEY = 'costa-palma.save.v5';

export function defaultSave() {
  return {
    money: 250, missionsDone: [], medallions: [], garage: [],
    bestChain: 0, totalEarned: 0, carsStolen: 0, copsEscaped: 0,
    distanceKm: 0, takenOut: 0, rank: 0, rp: 0, radio: 0,
    turf: null, taxiDone: 0, vigDone: 0, faresEarned: 0,
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw);
    return { ...defaultSave(), ...data };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Private windows refuse storage: the run still works, it just forgets.
  }
}

export function clearSave() {
  try { window.localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
