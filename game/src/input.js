// Keyboard input for Costa Palma. Held keys steer and drive; one-shot
// presses (enter car, punch, shoot, horn, menus) queue as flags and are taken
// exactly once by the loop, so a press between frames is never lost or double
// counted. Mouse click starts the game from the title screen.
export const ACT_ENTER = 1;
export const ACT_PUNCH = 2;
export const ACT_SHOOT = 4;
export const ACT_HORN = 8;
export const ACT_PAUSE = 16;
export const ACT_BOARD = 32;
export const ACT_MAP = 64;
export const ACT_CONFIRM = 128;
export const ACT_RADIO = 256;
export const ACT_TAXI = 512;
export const ACT_VIG = 1024;

const UP = new Set(['KeyW', 'ArrowUp']);
const DOWN = new Set(['KeyS', 'ArrowDown']);
const LEFT = new Set(['KeyA', 'ArrowLeft']);
const RIGHT = new Set(['KeyD', 'ArrowRight']);

export function createInput(target) {
  const held = new Set();
  let actions = 0;
  let lastKey = '';

  function press(code) {
    if (code === 'KeyE') actions |= ACT_ENTER;
    else if (code === 'KeyF') actions |= ACT_PUNCH;
    else if (code === 'Space') actions |= ACT_SHOOT;
    else if (code === 'KeyH') actions |= ACT_HORN;
    else if (code === 'KeyP' || code === 'Escape') actions |= ACT_PAUSE;
    else if (code === 'Tab') actions |= ACT_BOARD;
    else if (code === 'KeyM') actions |= ACT_MAP;
    else if (code === 'Enter') actions |= ACT_CONFIRM;
    else if (code === 'KeyR') actions |= ACT_RADIO;
    else if (code === 'KeyT') actions |= ACT_TAXI;
    else if (code === 'KeyV') actions |= ACT_VIG;
  }

  window.addEventListener('keydown', (event) => {
    lastKey = event.code;
    if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) || RIGHT.has(event.code)) {
      held.add(event.code);
      event.preventDefault();
    } else if (!event.repeat) {
      press(event.code);
      if (event.code === 'Space' || event.code === 'Tab') event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => { held.delete(event.code); });
  window.addEventListener('blur', () => { held.clear(); });
  target.addEventListener('pointerdown', () => { actions |= ACT_CONFIRM; });

  function axis(upSet, downSet) {
    let v = 0;
    for (const c of upSet) if (held.has(c)) v += 1;
    for (const c of downSet) if (held.has(c)) v -= 1;
    return v;
  }

  return {
    forward() { return axis(UP, DOWN); },
    steer() { return axis(RIGHT, LEFT); },
    running() { return held.has('ShiftLeft') || held.has('ShiftRight'); },
    takeActions() { const t = actions; actions = 0; return t; },
    lastKey() { return lastKey; },
  };
}
