// forgeWander.js — the wander director for the FORGE hall (PveScene).
//
// Same sanctioned external pattern as homeWander.js / spaceWander.js (neither of
// which this file touches): every fighter walks on its OWN real footwork, because
// the director only moves a "lure" that buildFighter's getFoePos hands to the
// existing locomotion. No parallel animation system, no edit to the protected
// combat files, no group.position.lerp anywhere — a body that changes place in
// this hall does it with its legs.
//
// TWO JOBS, and the second one is why this is not just a copy of spaceWander:
//
//   1. WANDER — each fighter owns a small personal zone on the hall floor and
//      strolls inside it, pausing with non-translating waiting actions. Zones are
//      laid out by the scene so they never touch, so a wandering body can never
//      walk into a neighbour's place.
//
//   2. ERRANDS — the scene can send a fighter somewhere definite: out to the MARK
//      when he is picked, or back into his zone when he is dropped. An errand is
//      the same walking machinery aimed at one point, so the trip is on foot and
//      the player sees him go. Errands start from wherever the body IS, so a
//      player jabbing at fighter after fighter turns them around mid-step instead
//      of queueing trips.
//
// Reduced motion ⇒ the director stays inert (every foePos null): nobody strolls,
// and the scene places picked fighters instead of walking them.
//
// All feel knobs live in CONFIG — tune on preview in one place.
import * as THREE from 'three';

const CONFIG = {
  // --- desync: ten bodies must not breathe or set off in lock-step ---
  initialDelayMin: 0.4,
  initialDelayMax: 5.0,

  // --- HOW A BODY IS MOVED, and the one rule the whole file turns on ---
  //
  // buildFighter's dev gait (devGait) walks at the lure ONLY while the lure is
  // further away than the fighter's own combat range; once inside it, the body
  // stops approaching and CIRCLES — it is a fighter, and that is what a fighter
  // does at range. A lure dropped on the spot you want him to reach therefore
  // never gets him there: he orbits it for ever (measured, and it is what made the
  // first cut of this hall look broken).
  //
  // So there is exactly ONE movement primitive here, and it never puts the lure
  // near the body: aim the lure WELL BEYOND the destination, let him walk at it,
  // and end the leg the moment the BODY is standing on the destination. He is
  // always approaching, never circling, and he always stops where he was sent.
  leadGap: 1.9,        // how far ahead of the body the lure is kept — must clear the
                       // fighter's combat range with room to spare, or he circles
  safeLead: 1.5,       // hard floor on lure↔body distance, same reason
  overshoot: 2.8,      // how far PAST the destination the lure is aimed
  arrive: 0.30,        // body within this of the destination → the leg is done
  legMaxSec: 20,       // safety: a leg always ends, even if the walk snags
  lureStep: 0.02,
  leadStepMax: 20,
  arcMax: 0.35,        // perpendicular bow of the path → it winds, never A→B straight
  shiverAmp: 0.04,     // tiny sideways shiver on the lure → the line breathes
  shiverFreq: 1.7,

  // --- WANDER: where inside his zone he goes next ---
  minLegDist: 0.40,    // a new spot must be at least this far from the last one
  inset: 0.10,         // destinations are kept this far inside the zone edge, so the
                       // stop (which has `arrive` slack) still lands inside it

  // --- PAUSE between legs: standing, with small NON-translating actions only ---
  pauseMinSec: 1.4,
  pauseMaxSec: 5.5,
  actionCountW: [[0, 0.46], [1, 0.40], [2, 0.14]],
  actionKindW: [['breathe', 0.60], ['jab', 0.22], ['feint', 0.18]],

  // --- THE LEASH — a safety net, not the mechanism ---
  //     Legs end inside the zone by construction, so this should never fire. It is
  //     here because a body carries momentum and can be nudged, and a fighter that
  //     has drifted out of his patch must walk back into it rather than stay out.
  leash: 0.45,

  // --- keeping bodies apart while crossing ---
  agentClearance: 1.45,
};

const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
function wpick(weighted) {
  let s = 0;
  for (const [, w] of weighted) s += w;
  let r = Math.random() * s;
  for (const [v, w] of weighted) { if ((r -= w) <= 0) return v; }
  return weighted[weighted.length - 1][0];
}

export function createForgeWanderDirector(opts = {}) {
  const cfg = { ...CONFIG, ...opts };

  let active = false;   // attached AND not reduced-motion
  let nowT = 0;

  // One self-contained agent per roster member.
  //   phase: 'init' | 'walk' | 'pause'        ← wandering in the zone
  //          'errand'                          ← walking to a definite point
  //          'hold'                            ← standing on that point
  const agents = [];

  function makeAgent(fighter, zone) {
    return {
      fighter,
      Z: zone,                 // personal zone rect { xMin, xMax, zMin, zMax }
      locoType: null,
      phase: 'init',
      phaseT: 0,
      initDelay: rand(cfg.initialDelayMin, cfg.initialDelayMax),
      lure: new THREE.Vector3(),
      lureValid: false,
      P0: { x: 0, z: 0 }, C: { x: 0, z: 0 }, P1: { x: 0, z: 0 },
      lureT: 0,
      pauseDur: 1,
      actions: [],
      after: 'pause',          // what to do on arrival: 'pause' | 'hold'
      target: { x: 0, z: 0 },
    };
  }

  // ── gait, through the body's own public toggles (they TOGGLE, so track state) ──
  function setLoco(a, target) {
    if (!a.fighter || target === a.locoType) return;
    const which = (target || a.locoType) === 'slow' ? a.fighter.slow : a.fighter.fast;
    if (which) which();
    a.locoType = target;
  }
  const clipBusy = (a) => !!(a.fighter && a.fighter.getClipInfo && a.fighter.getClipInfo());

  // Every OTHER body's current XZ, so a stroll never routes onto someone.
  function othersClear(self, x, z) {
    for (const o of agents) {
      if (o === self || !o.fighter) continue;
      const p = o.fighter.group.position;
      if (dist2(x, z, p.x, p.z) < cfg.agentClearance) return false;
    }
    return true;
  }

  // Has this body left its zone by more than the leash allows?
  function strayed(a) {
    const p = a.fighter.group.position;
    const L = cfg.leash;
    return p.x < a.Z.xMin - L || p.x > a.Z.xMax + L || p.z < a.Z.zMin - L || p.z > a.Z.zMax + L;
  }

  function pickDestination(a, fromX, fromZ) {
    const Z = a.Z;
    let best = null, bestD = -1;
    for (let i = 0; i < 20; i++) {
      const x = rand(Z.xMin, Z.xMax);
      const z = rand(Z.zMin, Z.zMax);
      if (!othersClear(a, x, z)) continue;
      const d = dist2(x, z, fromX, fromZ);
      if (d >= cfg.minLegDist) return { x, z };
      if (d > bestD) { bestD = d; best = { x, z }; }
    }
    return best || { x: (Z.xMin + Z.xMax) / 2, z: (Z.zMin + Z.zMax) / 2 };
  }

  function bez(a, t) {
    const u = 1 - t, k0 = u * u, k1 = 2 * u * t, k2 = t * t;
    return { x: k0 * a.P0.x + k1 * a.C.x + k2 * a.P1.x, z: k0 * a.P0.z + k1 * a.C.z + k2 * a.P1.z };
  }

  // THE movement primitive. Walk this body to (x, z) and then do `after`
  // ('pause' → stroll on inside the zone; 'hold' → stand there; 'wander' → resume
  // strolling). The lure is aimed `overshoot` PAST the destination so the body is
  // always in its approach gait, never in its circle-at-range one.
  function goTo(a, x, z, after) {
    const p = a.fighter.group.position;
    a.target.x = x; a.target.z = z;
    a.after = after;

    let ux = x - p.x, uz = z - p.z;
    const len = Math.hypot(ux, uz);
    if (len > 1e-3) { ux /= len; uz /= len; } else { ux = 0; uz = 1; }

    a.P0.x = p.x; a.P0.z = p.z;
    a.P1.x = x + ux * cfg.overshoot;
    a.P1.z = z + uz * cfg.overshoot;
    const bow = rand(-cfg.arcMax, cfg.arcMax);
    a.C.x = (a.P0.x + a.P1.x) / 2 + -uz * bow;
    a.C.z = (a.P0.z + a.P1.z) / 2 + ux * bow;
    a.lureT = 0;

    setLoco(a, after === 'hold' ? 'fast' : 'slow');   // an errand is brisk, a stroll is not
    placeLure(a, p.x, p.z);
    a.lureValid = true;
    a.phase = 'walk';
    a.phaseT = 0;
  }

  // The lure sits `leadGap` AHEAD of the body along the leg, shivered, and never
  // nearer than `safeLead` — both of which exist to keep it outside the fighter's
  // combat range. It is NOT clamped to the zone: it is a phantom the body walks at,
  // and what keeps the body inside its patch is where the leg ENDS, not where the
  // lure is.
  function placeLure(a, px, pz) {
    let guard = 0;
    while (a.lureT < 1) {
      const b = bez(a, a.lureT);
      if (dist2(b.x, b.z, px, pz) >= cfg.leadGap) break;
      a.lureT = Math.min(1, a.lureT + cfg.lureStep);
      if (++guard >= cfg.leadStepMax) break;
    }
    const b = bez(a, a.lureT);
    let ux = a.P1.x - a.P0.x, uz = a.P1.z - a.P0.z;
    const ln = Math.hypot(ux, uz) || 1e-4; ux /= ln; uz /= ln;
    const sh = Math.sin(nowT * cfg.shiverFreq) * cfg.shiverAmp;
    let lx = b.x + -uz * sh;
    let lz = b.z + ux * sh;
    const dd = dist2(lx, lz, px, pz);
    if (dd > 1e-3 && dd < cfg.safeLead) {
      lx = px + (lx - px) / dd * cfg.safeLead;
      lz = pz + (lz - pz) / dd * cfg.safeLead;
    }
    a.lure.set(lx, a.fighter.group.position.y, lz);
  }

  // Somewhere else inside his own zone, kept clear of the others and off the edge.
  function pickDestination(a) {
    const Z = a.Z, i = cfg.inset;
    const p = a.fighter.group.position;
    const xMin = Math.min(Z.xMin + i, Z.xMax - i), xMax = Math.max(Z.xMin + i, Z.xMax - i);
    const zMin = Z.zMin + i, zMax = Z.zMax - i;
    let best = null, bestD = -1;
    for (let k = 0; k < 20; k++) {
      const x = rand(xMin, xMax);
      const z = rand(zMin, zMax);
      if (!othersClear(a, x, z)) continue;
      const d = dist2(x, z, p.x, p.z);
      if (d >= cfg.minLegDist) return { x, z };
      if (d > bestD) { bestD = d; best = { x, z }; }
    }
    return best || { x: (xMin + xMax) / 2, z: (zMin + zMax) / 2 };
  }

  function startWalk(a) {
    const d = pickDestination(a);
    goTo(a, d.x, d.z, 'pause');
  }

  function startPause(a) {
    setLoco(a, null);
    a.lureValid = false;
    a.pauseDur = rand(cfg.pauseMinSec, cfg.pauseMaxSec);
    a.actions = [];
    const n = wpick(cfg.actionCountW);
    for (let i = 0; i < n; i++) {
      a.actions.push({ t: rand(0.2, Math.max(0.3, a.pauseDur - 0.3)), kind: wpick(cfg.actionKindW), fired: false });
    }
    a.phase = 'pause';
    a.phaseT = 0;
  }

  function stand(a) {
    setLoco(a, null);
    a.lureValid = false;
    a.phase = 'hold';
    a.phaseT = 0;
  }

  // Has this body left its zone by more than the leash allows?
  function strayed(a) {
    const p = a.fighter.group.position;
    const L = cfg.leash;
    return p.x < a.Z.xMin - L || p.x > a.Z.xMax + L || p.z < a.Z.zMin - L || p.z > a.Z.zMax + L;
  }

  function runAction(a, kind) {
    if (!a.fighter || clipBusy(a)) return;
    if (kind === 'jab' && a.fighter.punch) a.fighter.punch();
    else if (kind === 'feint' && a.fighter.feint) a.fighter.feint();
    // 'breathe' → nothing: the body's own idle breath carries it
  }

  function updateAgent(a, d) {
    a.phaseT += d;

    if (a.phase === 'init') {
      if (a.phaseT >= a.initDelay) startWalk(a);
      return;
    }

    if (a.phase === 'hold') return;   // standing on the mark: the body idles on its own

    if (a.phase === 'walk') {
      const p = a.fighter.group.position;
      placeLure(a, p.x, p.z);
      const arrived = dist2(p.x, p.z, a.target.x, a.target.z) <= cfg.arrive;
      if (arrived || a.phaseT >= cfg.legMaxSec) {
        if (a.after === 'hold') stand(a);
        else startPause(a);
      }
      return;
    }

    // phase === 'pause' — standing in his own zone between strolls
    if (strayed(a)) {   // nudged out of his patch: walk back in, do not stand outside it
      goTo(a, (a.Z.xMin + a.Z.xMax) / 2, (a.Z.zMin + a.Z.zMax) / 2, 'pause');
      return;
    }
    for (const act of a.actions) {
      if (!act.fired && a.phaseT >= act.t && !clipBusy(a)) { runAction(a, act.kind); act.fired = true; }
    }
    if (a.phaseT >= a.pauseDur && !clipBusy(a)) startWalk(a);
  }

  // ── public ──────────────────────────────────────────────────────────────────
  function attach(list, { reduced = false } = {}) {
    agents.length = 0;
    for (const { fighter, zone } of list) agents.push(makeAgent(fighter, zone));
    active = !reduced;
  }

  /** Move an agent's zone (the screen changed shape → the row re-packed). */
  function setZone(i, zone) {
    const a = agents[i];
    if (!a) return;
    a.Z = zone;
    if (a.phase === 'walk' || a.phase === 'pause') { a.phase = 'pause'; a.phaseT = 0; a.pauseDur = 0.1; }
  }

  /** Walk out to a definite point and stand there. */
  function sendTo(i, x, z) {
    const a = agents[i];
    if (!a || !active) return;
    goTo(a, x, z, 'hold');
  }

  /** Walk back into the personal zone and resume strolling. */
  function sendHome(i) {
    const a = agents[i];
    if (!a || !active) return;
    goTo(a, (a.Z.xMin + a.Z.xMax) / 2, (a.Z.zMin + a.Z.zMax) / 2, 'pause');
  }

  /** Drop whatever he is doing and stand still where he is. */
  function halt(i) {
    const a = agents[i];
    if (!a) return;
    stand(a);
  }

  /** True while the body is under its own power going somewhere. */
  const isWalking = (i) => {
    const a = agents[i];
    return !!a && a.phase === 'walk';
  };
  /** True when the body is standing (so the scene may turn it toward the camera). */
  const isStill = (i) => {
    const a = agents[i];
    return !!a && (a.phase === 'pause' || a.phase === 'hold' || a.phase === 'init');
  };

  const foePos = (i) => {
    const a = agents[i];
    return a && a.lureValid ? a.lure : null;   // wire into buildFighter getFoePos
  };

  function update(t, dt) {
    nowT = t;
    if (!active) return;
    const d = Math.min(0.05, Math.max(0, dt) || 0);
    for (const a of agents) if (a.fighter) updateAgent(a, d);
  }

  function dispose() {
    for (const a of agents) { if (a.fighter && a.locoType) setLoco(a, null); }
    agents.length = 0;
    active = false;
  }

  return { attach, update, foePos, setZone, sendTo, sendHome, halt, isWalking, isStill, dispose };
}
