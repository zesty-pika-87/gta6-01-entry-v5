// Procedural sound: every effect is synthesized in WebAudio — engine hum
// that follows speed, two-tone police siren, gunshots, punches, horns,
// pickups and explosions. No audio files, no network.
export function createAudio() {
  let ctx = null;
  let engineOsc = null; let engineGain = null;
  let sirenOsc = null; let sirenGain = null;
  let started = false;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      started = true;
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur);
  }

  function noise(dur, vol, lowpass) {
    if (!ensure()) return;
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = lowpass || 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter); filter.connect(g); g.connect(ctx.destination);
    src.start(t);
  }

  function startEngine() {
    if (!ensure() || engineOsc) return;
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 60;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0.0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420;
    engineOsc.connect(filter); filter.connect(engineGain); engineGain.connect(ctx.destination);
    engineOsc.start();
  }

  function setEngine(speed, driving) {
    if (!engineOsc) return;
    engineOsc.frequency.value = 55 + Math.abs(speed) * 3.2;
    engineGain.gain.value = driving ? 0.05 + Math.abs(speed) * 0.0012 : 0.0;
  }

  function startSiren() {
    if (!ensure() || sirenOsc) return;
    sirenOsc = ctx.createOscillator();
    sirenOsc.type = 'triangle';
    sirenOsc.frequency.value = 720;
    sirenGain = ctx.createGain();
    sirenGain.gain.value = 0.035;
    sirenOsc.connect(sirenGain); sirenGain.connect(ctx.destination);
    sirenOsc.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain); lfoGain.connect(sirenOsc.frequency);
    lfo.start();
    sirenOsc._lfo = lfo;
  }

  function stopSiren() {
    if (!sirenOsc) return;
    try { sirenOsc._lfo.stop(); sirenOsc.stop(); } catch { /* already stopped */ }
    sirenOsc = null;
  }

  return {
    ensure, startEngine, setEngine, startSiren, stopSiren,
    playNote(freq, dur, type, vol) { tone(freq, dur, type, vol); },
    shoot() { noise(0.14, 0.4, 2400); tone(180, 0.08, 'square', 0.2, 60); },
    punch() { noise(0.09, 0.3, 700); },
    horn() { tone(370, 0.35, 'sawtooth', 0.16); tone(466, 0.35, 'sawtooth', 0.12); },
    pickup() { tone(660, 0.1, 'sine', 0.2); tone(990, 0.16, 'sine', 0.2); },
    coin() { tone(880, 0.08, 'sine', 0.18); tone(1320, 0.14, 'sine', 0.18); },
    crash() { noise(0.35, 0.5, 900); },
    explosion() { noise(0.7, 0.6, 500); tone(70, 0.5, 'sine', 0.4, 30); },
    mission() { tone(523, 0.12, 'sine', 0.2); tone(659, 0.12, 'sine', 0.2); tone(784, 0.25, 'sine', 0.22); },
    get ready() { return started; },
  };
}
