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
  minLegDist: 1.8,        // a new destination is at least this far from the last spot
  //                         (long enough that the fighter visibly travels before the
  //                         lure — which leads by ~leadGap — reaches the end)
  arcMax: 0.9,            // max perpendicular bow of the path (winding, not A→B straight)
  leadGap: 1.3,           // keep the lure this far AHEAD of the fighter. Bigger than the
  //                         body's re-close range (range+HYST) so the body keeps
  //                         APPROACHING = walking, never circling the lure. The home
  //                         build caps the fighter's range small (HomeScene overrides
  //                         the distance axis), so a modest lead reliably forces a walk.
  //                         ↓ for more curve (risks a brief strafe); ↑ for straighter
  //                         strides. KEY feel knob.
  safeLead: 0.95,         // HARD floor on lure↔body distance (> the body's CONTACT
  //                         0.74) so the body's separation clamp can never shove it.
  lureStep: 0.02,         // path-param advance per lead iteration (≤ leadStepMax / frame)
  leadStepMax: 12,        // cap lead iterations per frame (no runaway jump)
  shiverAmp: 0.05,        // tiny perpendicular shiver on the lure → the line breathes
  shiverFreq: 2.3,
  legMaxSec: 16,          // safety: never get stuck on one leg
  fastChance: 0.36,       // a leg is brisk (fast gait) this often, else a calm stroll
  midFlipChance: 0.28,    // chance the gait speed changes once mid-leg (varied pace)

  // --- PAUSE ---
  pauseMinSec: 0.7,
  pauseMaxSec: 2.9,
  // waiting micro-actions per pause: count weights then kind weights. Only NON-
  // translating moves (the body holds its spot): breathing carries the core pulse,
  // a probe jab, a shoulder feint. A translating slip/dodge is deliberately NOT in
  // the set — in the shallow front-of-seam zone a sidestep could carry the body onto
  // the seam, and every move must stay zone-contained.
  actionCountW: [[0, 0.26], [1, 0.46], [2, 0.28]],
  actionKindW: [['breathe', 0.50], ['jab', 0.28], ['feint', 0.22]],
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
    // Bias the new spot to the OPPOSITE x-half (with a little overlap past centre) so
    // the fighter actually TRAVERSES the slab on long side-to-side legs. The lead gap
    // eats a fixed chunk of every leg, so short central legs barely move — heading to
    // the far side each time makes the walk read as real pacing across the width.
    const toRight = fromX < 0;
    const lo = toRight ? Z.xMin * 0.15 : Z.xMin;
    const hi = toRight ? Z.xMax : Z.xMax * 0.15;
    let best = null;
    let bestD = -1;
    for (let i = 0; i < 18; i++) {
      const x = rand(lo, hi);
      const z = rand(Z.zMin, Z.zMax);
      if (!farFromObstacles(x, z)) continue;
      const d = dist2(x, z, fromX, fromZ);
      if (d >= cfg.minLegDist) return { x, z };  // good enough — take the first far spot
      if (d > bestD) { bestD = d; best = { x, z }; } // else remember the farthest
    }
    return best || { x: -fromX, z: rand(Z.zMin, Z.zMax) }; // degenerate fallback → far side
  }

  function startWalk() {
    const p = fighter.group.position;
    // Start the path from the body's spot CLAMPED into the zone — if the body
    // overshot the zone a hair on the last leg, the new bézier still lives entirely
    // in-zone (so the lure stays in-zone and the body walks back in, never circling
    // an out-of-zone point).
    P0.x = THREE.MathUtils.clamp(p.x, Z.xMin, Z.xMax);
    P0.z = THREE.MathUtils.clamp(p.z, Z.zMin, Z.zMax);
    const dest = pickDestination(p.x, p.z);
    P1.x = dest.x; P1.z = dest.z;
    // Winding control point: midpoint bowed sideways (perpendicular to the leg) by a
    // random signed amount → a soft arc, never a straight line. Clamped STRICTLY
    // inside the zone: with P0/P1/C all in-zone the whole bézier stays in-zone, so
    // the lure is always reachable and the body never pins on a wall (a pinned body
    // with the lure just past the wall would trip the body's contact-separation
    // shove — the teleport this fixes).
    const mx = (P0.x + P1.x) / 2;
    const mz = (P0.z + P1.z) / 2;
    let dx = P1.x - P0.x;
    let dz = P1.z - P0.z;
    const len = Math.hypot(dx, dz) || 1e-4;
    dx /= len; dz /= len;
    const bow = rand(-cfg.arcMax, cfg.arcMax);
    C.x = THREE.MathUtils.clamp(mx + -dz * bow, Z.xMin, Z.xMax);
    C.z = THREE.MathUtils.clamp(mz + dx * bow, Z.zMin, Z.zMax);

    lureT = 0;
    band = Math.random() < cfg.fastChance ? 'fast' : 'slow';
    setLoco(band);
    midFlipAt = Math.random() < cfg.midFlipChance ? rand(0.8, cfg.legMaxSec * 0.5) : -1;
    // Place the lure a full step AHEAD of the body NOW, so the body never reads a
    // stale / too-close lure on the first frame of the leg (that proximity is what
    // tripped the contact shove). Only then mark it live.
    placeLure(P0.x, P0.z);
    lureValid = true;
    phase = 'walk';
    phaseT = 0;
  }

  // Position the lure along the bézier, kept ~leadGap AHEAD of (px,pz), shivered,
  // and ALWAYS clamped inside the zone + held clear of the body. The body navigates
  // toward this point with its own footwork; it is never within the body's contact
  // range, so the body's separation clamp never shoves it (no position jump).
  function placeLure(px, pz) {
    let guard = 0;
    while (lureT < 1) {
      const b = bez(lureT);
      if (dist2(b.x, b.z, px, pz) >= cfg.leadGap) break;
      lureT = Math.min(1, lureT + cfg.lureStep);
      if (++guard >= cfg.leadStepMax) break;
    }
    const b = bez(lureT);
    let dx = P1.x - P0.x, dz = P1.z - P0.z;
    const ln = Math.hypot(dx, dz) || 1e-4; dx /= ln; dz /= ln;
    const sh = Math.sin(nowT * cfg.shiverFreq) * cfg.shiverAmp;
    let lx = THREE.MathUtils.clamp(b.x + -dz * sh, Z.xMin, Z.xMax);
    let lz = THREE.MathUtils.clamp(b.z + dx * sh, Z.zMin, Z.zMax);
    // Hard guarantee: never closer than SAFE_LEAD to the body (> the body's CONTACT
    // 0.74), so the separation clamp can never fire. Push out along body→lure, then
    // re-clamp to the zone.
    const dd = dist2(lx, lz, px, pz);
    if (dd > 1e-3 && dd < cfg.safeLead) {
      lx = THREE.MathUtils.clamp(px + (lx - px) / dd * cfg.safeLead, Z.xMin, Z.xMax);
      lz = THREE.MathUtils.clamp(pz + (lz - pz) / dd * cfg.safeLead, Z.zMin, Z.zMax);
    }
    lure.set(lx, fighter.group.position.y, lz);
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

  // Fire a waiting micro-action through the EXISTING move API. Only NON-translating
  // moves — the body holds its spot (a translating slip/dodge could carry it onto the
  // seam in the shallow zone, so it is intentionally not offered here).
  function runAction(kind) {
    if (!fighter || clipBusy()) return;
    if (kind === 'jab' && fighter.punch) fighter.punch();
    else if (kind === 'feint' && fighter.feint) fighter.feint();
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
      // Lead the lure ahead of the body (in-zone, clear of the body) so the body
      // keeps WALKING toward it on its own footwork — never a position write here.
      placeLure(p.x, p.z);

      // varied pace: one mid-leg gait flip
      if (midFlipAt >= 0 && phaseT >= midFlipAt) {
        band = band === 'slow' ? 'fast' : 'slow';
        setLoco(band);
        midFlipAt = -1;
      }

      // Leg end → pause AS SOON AS the lure has reached the destination and the body
      // has begun to close on it. Cutting here (while still a step away) means the
      // body never falls into a circle around the end point — a circle would swing it
      // out by its range, onto the seam. Always a walk, never an orbit. legMaxSec is
      // the stuck-safety.
      const dLure = dist2(lure.x, lure.z, p.x, p.z);
      if ((lureT >= 1 && dLure < cfg.leadGap - 0.05) || phaseT >= cfg.legMaxSec) startPause();
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
