/**
 * Procedural WebAudio ambient drone for the Pit.
 * Two low-freq oscillators + filtered pink noise.
 */
export function buildAudioEngine() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.0;
  master.connect(ctx.destination);

  const drones = [
    { freq: 48, type: 'sine', gain: 0.55 },
    { freq: 72, type: 'triangle', gain: 0.20 }
  ];
  drones.forEach(d => {
    const osc = ctx.createOscillator();
    osc.type = d.type; osc.frequency.value = d.freq;
    const g = ctx.createGain(); g.gain.value = d.gain;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07 + Math.random() * 0.05;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain); lfoGain.connect(g.gain);
    lfo.start();
    osc.connect(g); g.connect(master);
    osc.start();
  });

  const bufLen = ctx.sampleRate * 2;
  const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufLen; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut * 0.97 + white * 0.03);
    data[i] = lastOut * 3.0;
  }
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuf; noiseSrc.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass'; noiseFilter.frequency.value = 320; noiseFilter.Q.value = 0.5;
  const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.18;
  noiseSrc.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(master);
  noiseSrc.start();

  return { ctx, master };
}

export function setAudioMuted(engine, muted) {
  if (!engine || !engine.master) return;
  const targetGain = muted ? 0.0 : 0.5;
  engine.master.gain.cancelScheduledValues(engine.ctx.currentTime);
  engine.master.gain.linearRampToValueAtTime(targetGain, engine.ctx.currentTime + 0.4);
}

export function destroyAudioEngine(engine) {
  if (!engine || !engine.ctx) return;
  engine.ctx.close().catch(() => {});
}
