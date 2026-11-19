// Music: a slow coastal synth loop, written note by note — an original
// melody over a warm pad, never a commercial song. The extra percussion layer
// comes in when the wanted level climbs.
const MELODY = [
  523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.0,
  493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 440.0,
];
const BASS = [130.81, 146.83, 164.81, 196.0, 164.81, 146.83, 130.81, 110.0];
const STEP_SECONDS = 0.42;

export function createMusic(audio) {
  let timer = null;
  let step = 0;
  let intensity = 0;

  function playStep() {
    const m = MELODY[step % MELODY.length];
    const b = BASS[Math.floor(step / 2) % BASS.length];
    audio.playNote(m, STEP_SECONDS * 0.9, 'triangle', 0.07);
    if (step % 2 === 0) audio.playNote(b, STEP_SECONDS * 1.8, 'sine', 0.09);
    if (intensity >= 3 && step % 2 === 1) audio.playNote(880, 0.08, 'square', 0.03);
    step += 1;
  }

  function start() {
    if (timer) return;
    timer = window.setInterval(playStep, STEP_SECONDS * 1000);
  }

  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
  }

  function setIntensity(wanted) { intensity = wanted; }

  return { start, stop, setIntensity, playStep };
}
