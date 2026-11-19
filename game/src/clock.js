// The game clock: time runs fast enough to watch — one game hour every 60
// real seconds — so a single session crosses golden hour into night. Two
// missions and one side job only open at night (20:00–05:00) and pay +25%,
// which is what makes the cycle a system instead of a skybox.
export const NIGHT_START = 20;
export const NIGHT_END = 5;
export const NIGHT_BONUS = 0.25;
export const HOUR_PER_SECOND = 1 / 60;

export function isNight(hour) {
  return hour >= NIGHT_START || hour < NIGHT_END;
}

export function createClock(startHour) {
  let hour = startHour;
  let day = 1;

  function step(dt) {
    hour += dt * HOUR_PER_SECOND;
    if (hour >= 24) { hour -= 24; day += 1; }
  }

  function jumpToNight() {
    hour = NIGHT_START;
  }

  function fmt() {
    const h = Math.floor(hour), m = Math.round((hour - h) * 60);
    return 'DAY ' + day + ' · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  return {
    step, jumpToNight, fmt, isNight: () => isNight(hour),
    get hour() { return hour; },
    set hour(v) { hour = v; },
    get day() { return day; },
    set day(v) { day = v; },
  };
}
