// spaceWander.js — the "big-field wander director" for the Space preview stage.
// Same sanctioned external pattern as homeWander.js (which it must
// NOT touch), but tuned for a LARGER roster (12–16) roaming a much bigger hex
// field: every fighter strolls on its OWN real footwork, pauses with small waiting
// actions, and they keep well clear of one another — all by DRIVING the EXISTING
// locomotion from outside (a moving "lure" through buildFighter's getFoePos + the
// dev gait), never a parallel animation system and never an edit to the protected
// combat files.
//
// Each agent gets a PERSONAL wander rectangle (computed by SpaceScene from its
// spawn) — here the rects are BIG and overlapping so members range across most of
// the field, while a strong inter-fighter clearance keeps them from clumping (in
// particular they never pile into the centre). Independent initial delays + phase
// machines make the field read as a living crowd, not a synchronised drill.
// Reduced-motion ⇒ the whole director stays inert (every foePos null) → the bodies
// just idle, calm.
//
// All feel knobs live in CONFIG — tune on preview in one place.
import * as THREE from 'three';

const CONFIG = {
  // desync — 14 members each wait a different beat before the first stroll, and
  // never in lock-step thereafter (independent phase machines + randomised pauses).
  initialDelayMin: 0.3,
  initialDelayMax: 3.6,

  // --- WALK (big field → longer legs, wider winding than the PVE plate) ---
  minLegDist: 2.2,     // a new destination is at least this far from the last spot
  arcMax: 1.4,         // max perpendicular bow of the path (winding, not A→B straight)
  leadGap: 1.8,        // keep the lure this far AHEAD of the body so it WALKS, not circles
  safeLead: 1.0,       // hard floor on lure↔body distance (> the body's contact range)
  lureStep: 0.02,      // path-param advance per lead iteration
  leadStepMax: 16,     // cap lead iterations per frame
  shiverAmp: 0.06,     // tiny perpendicular shiver on the lure → the line breathes
  shiverFreq: 2.0,
  legMaxSec: 18,       // safety: never get stuck on one leg
  fastChance: 0.34,    // a leg is brisk this often, else a calm stroll
  midFlipChance: 0.26, // chance the gait speed changes once mid-leg (varied pace)

  // --- PAUSE ---
  pauseMinSec: 0.8,
  pauseMaxSec: 4.0,
  // waiting micro-actions: only NON-translating moves (the body holds its spot) —
  // breathing carries the core pulse, a probe jab, a shoulder feint.
  actionCountW: [[0, 0.32], [1, 0.46], [2, 0.22]],
  actionKindW: [['breathe', 0.54], ['jab', 0.26], ['feint', 0.20]],

  // --- keeping members apart (the inter-fighter distance knob) — bigger here so 14
  //     bodies on a wide field never route into the same spot or clump in the middle ---
  agentClearance: 2.4,
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

export function createSpaceWanderDirector(opts = {}) {
  const cfg = { ...CONFIG, ...opts };

  let camera = null;
  let active = false;     // attached AND not reduced-motion
  let nowT = 0;

  // one self-contained agent per roster member. Each owns a personal zone, a phase
  // machine, a bézier leg and a lure.
  const agents = []; // [{ fighter, Z, phase, phaseT, lure, lureValid, ... }]

  function makeAgent(fighter, zone) {
    return {
      fighter,
      Z: zone,                         // personal wander rect { xMin,xMax,zMin,zMax }
      locoType: null,                  // null | 'slow' | 'fast'
      phase: 'init',
      phaseT: 0,
      initDelay: rand(cfg.initialDelayMin, cfg.initialDelayMax),
      lure: new THREE.Vector3(),
      lureValid: false,
      P0: { x: 0, z: 0 }, C: { x: 0, z: 0 }, P1: { x: 0, z: 0 },
      lureT: 0, band: 'slow', midFlipAt: -1,
      pauseDur: 1, actions: [],
    };
  }

  // ── gait control via the body's public toggles (mirrors buildFighter semantics) ──
  function setLoco(a, target) {
    if (!a.fighter || target === a.locoType) return;
    const which = (target || a.locoType) === 'slow' ? a.fighter.slow : a.fighter.fast;
    if (which) which();
    a.locoType = target;
  }
  function clipBusy(a) {
    return !!(a.fighter && a.fighter.getClipInfo && a.fighter.getClipInfo());
  }

  // every OTHER agent's current XZ — fed as dynamic obstacles so a member never
  // routes a destination / leads a lure onto a field-mate.
  function othersClear(self, x, z) {
    for (const o of agents) {
      if (o === self || !o.fighter) continue;
      const p = o.fighter.group.position;
      if (dist2(x, z, p.x, p.z) < cfg.agentClearance) return false;
    }
    return true;
  }

  function pickDestination(a, fromX, fromZ) {
    const Z = a.Z;
    let best = null, bestD = -1;
    for (let i = 0; i < 24; i++) {
      const x = rand(Z.xMin, Z.xMax);
      const z = rand(Z.zMin, Z.zMax);
      if (!othersClear(a, x, z)) continue;
      const d = dist2(x, z, fromX, fromZ);
      if (d >= cfg.minLegDist) return { x, z };  // first far-enough, field-mate-clear spot
      if (d > bestD) { bestD = d; best = { x, z }; }
    }
    return best || { x: THREE.MathUtils.clamp(-fromX, Z.xMin, Z.xMax), z: rand(Z.zMin, Z.zMax) };
  }

  function bez(a, t) {
    const u = 1 - t, k0 = u * u, k1 = 2 * u * t, k2 = t * t;
    return { x: k0 * a.P0.x + k1 * a.C.x + k2 * a.P1.x, z: k0 * a.P0.z + k1 * a.C.z + k2 * a.P1.z };
  }

  function startWalk(a) {
    const Z = a.Z;
    const p = a.fighter.group.position;
    a.P0.x = THREE.MathUtils.clamp(p.x, Z.xMin, Z.xMax);
    a.P0.z = THREE.MathUtils.clamp(p.z, Z.zMin, Z.zMax);
    const dest = pickDestination(a, p.x, p.z);
    a.P1.x = dest.x; a.P1.z = dest.z;
    const mx = (a.P0.x + a.P1.x) / 2, mz = (a.P0.z + a.P1.z) / 2;
    let dx = a.P1.x - a.P0.x, dz = a.P1.z - a.P0.z;
    const len = Math.hypot(dx, dz) || 1e-4; dx /= len; dz /= len;
    const bow = rand(-cfg.arcMax, cfg.arcMax);
    a.C.x = THREE.MathUtils.clamp(mx + -dz * bow, Z.xMin, Z.xMax);
    a.C.z = THREE.MathUtils.clamp(mz + dx * bow, Z.zMin, Z.zMax);
    a.lureT = 0;
    a.band = Math.random() < cfg.fastChance ? 'fast' : 'slow';
    setLoco(a, a.band);
    a.midFlipAt = Math.random() < cfg.midFlipChance ? rand(0.8, cfg.legMaxSec * 0.5) : -1;
    placeLure(a, a.P0.x, a.P0.z);
    a.lureValid = true;
    a.phase = 'walk';
    a.phaseT = 0;
  }

  // Lure ~leadGap AHEAD of (px,pz) along the bézier, shivered, clamped in-zone, held
  // clear of the body. The body navigates toward it on its own footwork; never within
  // its contact range, so the separation clamp never fires.
  function placeLure(a, px, pz) {
    const Z = a.Z;
    let guard = 0;
    while (a.lureT < 1) {
      const b = bez(a, a.lureT);
      if (dist2(b.x, b.z, px, pz) >= cfg.leadGap) break;
      a.lureT = Math.min(1, a.lureT + cfg.lureStep);
      if (++guard >= cfg.leadStepMax) break;
    }
    const b = bez(a, a.lureT);
    let dx = a.P1.x - a.P0.x, dz = a.P1.z - a.P0.z;
    const ln = Math.hypot(dx, dz) || 1e-4; dx /= ln; dz /= ln;
    const sh = Math.sin(nowT * cfg.shiverFreq) * cfg.shiverAmp;
    let lx = THREE.MathUtils.clamp(b.x + -dz * sh, Z.xMin, Z.xMax);
    let lz = THREE.MathUtils.clamp(b.z + dx * sh, Z.zMin, Z.zMax);
    const dd = dist2(lx, lz, px, pz);
    if (dd > 1e-3 && dd < cfg.safeLead) {
      lx = THREE.MathUtils.clamp(px + (lx - px) / dd * cfg.safeLead, Z.xMin, Z.xMax);
      lz = THREE.MathUtils.clamp(pz + (lz - pz) / dd * cfg.safeLead, Z.zMin, Z.zMax);
    }
    a.lure.set(lx, a.fighter.group.position.y, lz);
  }

  function startPause(a) {
    setLoco(a, null);
    a.lureValid = false;
    a.pauseDur = rand(cfg.pauseMinSec, cfg.pauseMaxSec);
    a.actions = [];
    const n = wpick(cfg.actionCountW);
    for (let i = 0; i < n; i++) {
      a.actions.push({ t: rand(0.15, Math.max(0.2, a.pauseDur - 0.2)), kind: wpick(cfg.actionKindW), fired: false });
    }
    a.phase = 'pause';
    a.phaseT = 0;
  }

  function runAction(a, kind) {
    if (!a.fighter || clipBusy(a)) return;
    if (kind === 'jab' && a.fighter.punch) a.fighter.punch();
    else if (kind === 'feint' && a.fighter.feint) a.fighter.feint();
    // 'breathe' → nothing: the body's own idle breath + core pulse carries it
  }

  function updateAgent(a, d) {
    a.phaseT += d;
    if (a.phase === 'init') {
      if (a.phaseT >= a.initDelay) startWalk(a);
      return;
    }
    if (a.phase === 'walk') {
      const p = a.fighter.group.position;
      placeLure(a, p.x, p.z);
      if (a.midFlipAt >= 0 && a.phaseT >= a.midFlipAt) {
        a.band = a.band === 'slow' ? 'fast' : 'slow';
        setLoco(a, a.band);
        a.midFlipAt = -1;
      }
      const dLure = dist2(a.lure.x, a.lure.z, p.x, p.z);
      if ((a.lureT >= 1 && dLure < cfg.leadGap - 0.05) || a.phaseT >= cfg.legMaxSec) startPause(a);
      return;
    }
    // phase === 'pause'
    for (const act of a.actions) {
      if (!act.fired && a.phaseT >= act.t && !clipBusy(a)) { runAction(a, act.kind); act.fired = true; }
    }
    if (a.phaseT >= a.pauseDur && !clipBusy(a)) startWalk(a);
  }

  // ── public ────────────────────────────────────────────────────────────────────
  function attach(list, cam, { reduced = false } = {}) {
    agents.length = 0;
    for (const { fighter, zone } of list) agents.push(makeAgent(fighter, zone));
    camera = cam;
    active = !reduced;
  }
  function foePos(index) {
    const a = agents[index];
    return a && a.lureValid ? a.lure : null; // wire into buildFighter getFoePos per agent
  }
  function update(t, dt) {
    nowT = t;
    if (!active) return;
    const d = Math.min(0.05, Math.max(0, dt) || 0);
    for (const a of agents) if (a.fighter) updateAgent(a, d);
  }
  function dispose() {
    for (const a of agents) { if (a.fighter && a.locoType) setLoco(a, null); }
    agents.length = 0;
    camera = null;
    active = false;
  }

  return { attach, update, foePos, dispose };
}
