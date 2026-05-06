// Epic 3Ba Step 9 — Training procedural hit sound (WebAudio).
// Lazy AudioContext on first hit (autoplay policy). Noise burst through
// biquad lowpass with gain envelope; filter cutoff scales with combo
// multiplier so higher combos read brighter.
//
// Source: prototype hexlash_v24.html lines 9878-9918.
//
// NOTE: The `typeof audioState !== 'undefined'` checks are prototype-parity
// — `audioState` doesn't exist in v2 yet, so both guards evaluate false
// and the sound always plays. Epic 5 will introduce a global audio
// infrastructure (shared AudioContext, mute toggle, volume slider) and
// those same lines will start gating without edits.

let hitAudio = null;

function ensureHitAudio() {
  if (hitAudio) return hitAudio;
  // Prefer the shared main audio context if one exists (Epic 5 lane).
  // eslint-disable-next-line no-undef
  if (typeof audioState !== 'undefined' && audioState.ctx) {
    // eslint-disable-next-line no-undef
    hitAudio = { ctx: audioState.ctx };
    return hitAudio;
  }
  // Standalone fallback.
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  hitAudio = { ctx: new Ctx() };
  return hitAudio;
}

export function playHitSound(multiplier) {
  // If main audio is muted (Epic 5), hit sound mutes too.
  // eslint-disable-next-line no-undef
  if (typeof audioState !== 'undefined' && audioState.muted) return;

  const a = ensureHitAudio();
  if (!a) return;
  const ctx = a.ctx;
  if (ctx.state === 'suspended') ctx.resume();

  const t = ctx.currentTime;

  // White noise burst (~120ms buffer).
  const bufLen = Math.floor(ctx.sampleRate * 0.12);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  // Lowpass filter — higher combo → brighter hit.
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 1200 + multiplier * 250;
  filt.Q.value = 1.5;

  // Gain envelope — short attack, exponential decay.
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

  src.connect(filt);
  filt.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.13);
}
