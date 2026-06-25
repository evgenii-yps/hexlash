// homeWander.js — the HOME "wander director". Turns the home-stage fighter from a
// static idle pose into a живое присутствие: it strolls the slab on real footwork,
// pauses with varied waiting actions, and notices the camera — all by DRIVING the
// EXISTING locomotion from outside, never a parallel animation system and never an
// edit to the protected combat files.
//
// HOW IT DRIVES THE BODY (the sanctioned external pattern, same as the dev lab):
//   • WALK  — feed a moving "lure" point through buildFighter's getFoePos and turn
//             on the dev gait (fighter.slow() / fighter.fast(), AI OFF). The body's
//             real devGait then APPROACHES the lure with its own переступ / разгон /
//             поворот. The lure is kept a step AHEAD of the fighter (> the body's
//             re-close range) so the body keeps walking toward it instead of
//             circling — the walk traces the lure's winding path.
//   • PAUSE — drop the lure (getFoePos → null) + gait off → the body idles in place.
//             Fire 0–2 waiting micro-actions from the EXISTING move vocabulary
//             (probe jab = punch, shoulder feint = feint, weight slip = dodge) and,
//             while the player is moving the camera, gently turn to face it.
//
// Nothing here adds a joint, a clip, or a combat number. Reduced-motion ⇒ the whole
// director stays inert (foePos always null) → the body just idles, calm.
//
// All feel knobs live in CONFIG — tune on preview in one place.
import * as THREE from 'three';

const CONFIG = {
  // Safe wander zone (the lure's target rectangle, slab-local XZ). Kept inset from
  // the edges and IN FRONT of the torn seam (positive Z) so the fighter never paces
  // onto the crack or off the plate. HomeScene overrides this from the real arena
  // dimensions; these are the fallbacks for a 6×4 slab.
  zone: { xMin: -1.7, xMax: 1.7, zMin: 0.64, zMax: 1.55 },

  initialDelaySec: 1.2,   // calm beat before the first stroll

  // --- WALK ---
  minLegDist: 2.0,        // a new destination is at least this far from the last spot
  //                         (long enough that the fighter visibly travels before the
  //                         lure — which leads by ~leadGap — reaches the end)
  arcMax: 0.9,            // max perpendicular bow of the path (winding, not A→B straight)
  leadGap: 1.6,           // keep the lure this far AHEAD of the fighter. Bigger than the
  //                         body's re-close range (range+HYST ≈ 1.4–1.7) so the body
  //                         keeps APPROACHING = walking, instead of circling the lure.
  //                         ↓ for more curve in the walk (at the cost of some strafe);
  //                         ↑ for straighter, more committed strides. KEY feel knob.
  lureStep: 0.02,         // path-param advance per lead iteration (≤ leadStepMax / frame)
  leadStepMax: 12,        // cap lead iterations per frame (no runaway jump)
  shiverAmp: 0.05,        // tiny perpendicular shiver on the lure → the line breathes
  shiverFreq: 2.3,
  legEndGraceSec: 0.35,   // after the lure reaches the end, coast a beat then pause
  legMaxSec: 16,          // safety: never get stuck on one leg
  fastChance: 0.36,       // a leg is brisk (fast gait) this often, else a calm stroll
  midFlipChance: 0.28,    // chance the gait speed changes once mid-leg (varied pace)

  // --- PAUSE ---
  pauseMinSec: 0.7,
  pauseMaxSec: 2.9,
  // waiting micro-actions per pause: count weights then kind weights
  actionCountW: [[0, 0.26], [1, 0.46], [2, 0.28]],
  actionKindW: [['breathe', 0.40], ['jab', 0.24], ['feint', 0.19], ['slip', 0.17]],
  scanChance: 0.30,       // some pauses are a "turn & look around" instead of a still wait

  // --- camera awareness (during pauses only) ---
  camMoveEps: 0.012,      // azimuth delta (rad/frame) that counts as "player moved the camera"
  attnHoldSec: 2.6,       // keep facing the camera this long after it last moved
  spontaneousLookChance: 0.5, // a pause may look at the camera on its own ("спустя момент")
  faceDamp: 3.0,          // turn-to-camera damping (1/s) — soft, never a snap

  obstacleR: 0.72,        // keep destinations this far from decor props
};

// ── tiny helpers ──────────────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
function wpick(weighted) {
  let s = 0;
  for (const [, w] of weighted) s += w;
  let r = Math.random() * s;
  for (const [v, w] of weighted) { if ((r -= w) <= 0) return v; }
  return weighted[weighted.length - 1][0];
}
// shortest signed angle a−b into (−π, π]
function angDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createHomeWanderDirector(opts = {}) {
  const cfg = { ...CONFIG, ...opts, zone: { ...CONFIG.zone, ...(opts.zone || {}) } };
  const Z = cfg.zone;

  let fighter = null;
  let camera = null;
  let active = false;          // attached AND not reduced-motion
  let obstacles = [];          // [{ x, z }] decor footprints to skip when picking spots

  // lure (virtual foe the body navigates toward); null-gate via lureValid
  const lure = new THREE.Vector3();
  let lureValid = false;

  // gait tracking (mirrors buildFighter's loco toggle semantics)
  let locoType = null;         // null | 'slow' | 'fast'

  // phase machine
  let phase = 'init';          // 'init' | 'walk' | 'pause'
  let phaseT = 0;              // seconds elapsed in the current phase

  // walk leg
  const P0 = { x: 0, z: 0 };
  const C = { x: 0, z: 0 };
  const P1 = { x: 0, z: 0 };
  let lureT = 0;
  let legEndAt = -1;           // wall time the coast-out ends (−1 = not yet reached end)
  let band = 'slow';
  let midFlipAt = -1;          // phaseT at which to flip the gait once (−1 = none)

  // pause
  let pauseDur = 1;
  let actions = [];            // [{ t, kind, fired }]
  let attnUntil = 0;           // wall time until which we keep facing the camera
  let lastCamAz = null;

  let nowT = 0;                // last wall time handed to update()

  // ── gait control via the body's public toggles ────────────────────────────────
  // toggleLoco(type): same type while active → OFF; otherwise set type + ON. So to
  // reach any target we just call the method for (target ?? current).
  function setLoco(target) {
    if (!fighter || target === locoType) return;
    const which = (target || locoType) === 'slow' ? fighter.slow : fighter.fast;
    if (which) which();
    locoType = target;
  }

  function clipBusy() {
    return !!(fighter && fighter.getClipInfo && fighter.getClipInfo());
  }

  // ── destination / path sampling ───────────────────────────────────────────────
  function farFromObstacles(x, z) {
    for (const o of obstacles) if (dist2(x, z, o.x, o.z) < cfg.obstacleR) return false;
    return true;
  }
  function pickDestination(fromX, fromZ) {
    let best = null;
    let bestD = -1;
    for (let i = 0; i < 14; i++) {
      const x = rand(Z.xMin, Z.xMax);
      const z = rand(Z.zMin, Z.zMax);
      if (!farFromObstacles(x, z)) continue;
      const d = dist2(x, z, fromX, fromZ);
      if (d >= cfg.minLegDist) return { x, z };  // good enough — take the first far spot
      if (d > bestD) { bestD = d; best = { x, z }; } // remember the farthest as fallback
    }
    return best || { x: fromX, z: Z.zMin }; // degenerate fallback
  }

  function startWalk() {
    const p = fighter.group.position;
    P0.x = p.x; P0.z = p.z;
    const dest = pickDestination(p.x, p.z);
    P1.x = dest.x; P1.z = dest.z;
    // Winding control point: midpoint bowed sideways (perpendicular to the leg) by a
    // random signed amount → a soft arc, never a straight line. Clamp into a loose
    // zone so the bow doesn't fling the path off-plate.
    const mx = (P0.x + P1.x) / 2;
    const mz = (P0.z + P1.z) / 2;
    let dx = P1.x - P0.x;
    let dz = P1.z - P0.z;
    const len = Math.hypot(dx, dz) || 1e-4;
    dx /= len; dz /= len;
    const bow = rand(-cfg.arcMax, cfg.arcMax);
    C.x = THREE.MathUtils.clamp(mx + -dz * bow, Z.xMin - 0.4, Z.xMax + 0.4);
    C.z = THREE.MathUtils.clamp(mz + dx * bow, Z.zMin - 0.3, Z.zMax + 0.3);

    lureT = 0;
    lureValid = true;
    legEndAt = -1;
    band = Math.random() < cfg.fastChance ? 'fast' : 'slow';
    setLoco(band);
    midFlipAt = Math.random() < cfg.midFlipChance ? rand(0.8, cfg.legMaxSec * 0.5) : -1;
    phase = 'walk';
    phaseT = 0;
  }

  function startPause() {
    setLoco(null);
    lureValid = false;
    pauseDur = rand(cfg.pauseMinSec, cfg.pauseMaxSec);
    actions = [];
    const isScan = Math.random() < cfg.scanChance;
    if (!isScan) {
      const n = wpick(cfg.actionCountW);
      for (let i = 0; i < n; i++) {
        actions.push({ t: rand(0.15, Math.max(0.2, pauseDur - 0.2)), kind: wpick(cfg.actionKindW), fired: false });
      }
    }
    // A scan pause (or a coin-flip on any pause) looks at the camera on its own.
    if (isScan || Math.random() < cfg.spontaneousLookChance) attnUntil = nowT + rand(1.2, cfg.attnHoldSec);
    phase = 'pause';
    phaseT = 0;
  }

  function bez(t) {
    const u = 1 - t;
    const a = u * u, b = 2 * u * t, c = t * t;
    return { x: a * P0.x + b * C.x + c * P1.x, z: a * P0.z + b * C.z + c * P1.z };
  }

  // Fire a waiting micro-action through the EXISTING move API (no new motion).
  function runAction(kind) {
    if (!fighter || clipBusy()) return;
    if (kind === 'jab' && fighter.punch) fighter.punch();
    else if (kind === 'feint' && fighter.feint) fighter.feint();
    else if (kind === 'slip' && fighter.dodge) fighter.dodge();
    // 'breathe' → nothing: the body's own idle breath + core pulse carries it
  }

  // ── camera awareness ──────────────────────────────────────────────────────────
  function camAzimuth() {
    const p = fighter.group.position;
    return Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
  }
  function faceCameraYaw() {
    const p = fighter.group.position;
    const dx = camera.position.x - p.x;
    const dz = camera.position.z - p.z;
    return Math.atan2(-dx, -dz); // forward is local −Z (matches HomeScene's init facing)
  }

  // ── public ────────────────────────────────────────────────────────────────────
  function attach(f, cam, { reduced = false } = {}) {
    fighter = f;
    camera = cam;
    active = !reduced;
    phase = 'init';
    phaseT = 0;
    lureValid = false;
    locoType = null;
  }
  function setObstacles(list) { obstacles = Array.isArray(list) ? list : []; }
  function foePos() { return lureValid ? lure : null; } // wire into buildFighter getFoePos

  function update(t, dt) {
    nowT = t;
    if (!active || !fighter || !camera) return;
    const d = Math.min(0.05, Math.max(0, dt) || 0);
    phaseT += d;

    // Track the player moving the camera (refreshes "attention" so an idle fighter
    // keeps facing while the orbit turns, then releases).
    const az = camAzimuth();
    if (lastCamAz !== null && Math.abs(angDiff(az, lastCamAz)) > cfg.camMoveEps) {
      attnUntil = Math.max(attnUntil, t + cfg.attnHoldSec);
    }
    lastCamAz = az;

    if (phase === 'init') {
      if (phaseT >= cfg.initialDelaySec) startWalk();
      return;
    }

    if (phase === 'walk') {
      const p = fighter.group.position;
      // Keep the lure a step AHEAD of the fighter so the body keeps APPROACHING
      // (walking) instead of dropping into a circle once it gets close.
      let guard = 0;
      while (lureT < 1) {
        const pt = bez(lureT);
        if (dist2(pt.x, pt.z, p.x, p.z) >= cfg.leadGap) break;
        lureT = Math.min(1, lureT + cfg.lureStep);
        if (++guard >= cfg.leadStepMax) break;
      }
      const pt = bez(lureT);
      // tiny perpendicular shiver so the lead point isn't a dead-straight pull
      let dx = P1.x - P0.x, dz = P1.z - P0.z;
      const ln = Math.hypot(dx, dz) || 1e-4; dx /= ln; dz /= ln;
      const sh = Math.sin(t * cfg.shiverFreq) * cfg.shiverAmp;
      lure.set(pt.x + -dz * sh, fighter.group.position.y, pt.z + dx * sh);

      // varied pace: one mid-leg gait flip
      if (midFlipAt >= 0 && phaseT >= midFlipAt) {
        band = band === 'slow' ? 'fast' : 'slow';
        setLoco(band);
        midFlipAt = -1;
      }

      // leg end: the lure reached the destination → coast a short beat, then pause
      // (cut to idle BEFORE the body closes into a circle around the end point)
      if (lureT >= 1 && legEndAt < 0) legEndAt = t + cfg.legEndGraceSec;
      if ((legEndAt >= 0 && t >= legEndAt) || phaseT >= cfg.legMaxSec) startPause();
      return;
    }

    // phase === 'pause'
    for (const a of actions) {
      if (!a.fired && phaseT >= a.t && !clipBusy()) { runAction(a.kind); a.fired = true; }
    }
    // notice the camera: gently turn the core/body toward it while attention holds
    // (and never fight a playing clip)
    if (t < attnUntil && !clipBusy()) {
      const desired = faceCameraYaw();
      const k = 1 - Math.exp(-cfg.faceDamp * d);
      fighter.group.rotation.y += angDiff(desired, fighter.group.rotation.y) * k;
    }
    if (phaseT >= pauseDur && !clipBusy()) startWalk();
  }

  function dispose() {
    if (fighter && locoType) setLoco(null);
    fighter = null;
    camera = null;
    active = false;
  }

  return { attach, update, foePos, setObstacles, dispose };
}
