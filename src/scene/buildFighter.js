// Builds the first arena fighter — a procedural low-poly humanoid construct in
// the Hexlash material (faceted dark blue-grey "skin", one glowing #FF0069 core
// in the chest). Pure box primitives, flat-shaded — no GLTF / external assets.
//
// The body is a JOINT HIERARCHY so future passes can articulate it:
//   root → hips → torso → { head, core, shoulderL/R → elbowL/R → forearm }
//        → hips → thighL/R (hip pivot) → kneeL/R → shin + foot
// Rotating a pivot group rotates everything below it. This pass: idle only —
// heavy slow breathing + a quiet core pulse. No combat, no walk, no hits.
//
// Returns { group, update, setReducedMotion, dispose }. Caller places group.
import * as THREE from 'three';
import { makeRadialTexture } from './arenaTextures.js';

function pinkRgba(pink, a) {
  const n = parseInt(pink.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function buildFighter(
  pink = '#FF0069',
  { side = 'player', maxHp = 100, onImpact, onEliminated, getFoePos = null, bounds = { x: 2.5, z: 1.5 } } = {},
) {
  const group = new THREE.Group();

  // Side ('player' / 'opponent'). The arena is open — there is no seam barrier;
  // facing and movement are computed toward the opponent's live position, not a
  // fixed half. The body is built facing local -Z (forward); the group's
  // rotation.y is steered toward the foe each frame. Friend/foe read (same
  // #FF0069, no second colour): the opponent gets a darker/cooler body + a muted
  // core. Default facing matches the opposite-side spawn so there's no first-
  // frame flicker before steering takes over.
  const isOpp = side === 'opponent';
  group.rotation.y = isOpp ? Math.PI : 0;
  const skinColor = isOpp ? 0x141b2e : 0x1c2233; // opponent darker + cooler
  const coreDim = isOpp ? 0.7 : 1.0; // darkens the gem, keeps the hue
  const coreGain = isOpp ? 0.55 : 1.0; // halo brightness — player's is brightest

  // Shared faceted "skin" — same workshop as the plates, a touch lighter so the
  // construct reads against them.
  const skin = new THREE.MeshStandardMaterial({
    color: skinColor,
    flatShading: true,
    roughness: 0.8,
    metalness: 0.18,
  });

  // box(parent, w, h, d, x, y, z) → adds a flat-shaded skin box, returns mesh.
  const box = (parent, w, h, d, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skin);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const pivot = (parent, x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  const HIP_Y = 0.93; // hip-joint height above the feet

  // --- Hips (pelvis) — the breathing root of the upper body. Front faces -Z
  //     (toward the rift): toes, chest core all point -Z.
  const hips = pivot(group, 0, HIP_Y, 0);
  box(hips, 0.42, 0.18, 0.26, 0, 0.07, 0); // pelvis

  // --- Torso + head + arms.
  const torso = pivot(hips, 0, 0, 0);
  const chest = box(torso, 0.5, 0.46, 0.3, 0, 0.4, 0); // y 1.10..1.56
  box(torso, 0.16, 0.08, 0.16, 0, 0.66, 0); // neck
  box(torso, 0.26, 0.24, 0.24, 0, 0.8, 0); // head

  const arm = (side) => {
    // shoulder pivot → upper arm hangs down → elbow pivot → forearm
    const shoulder = pivot(torso, side * 0.31, 0.57, 0);
    box(shoulder, 0.16, 0.34, 0.16, 0, -0.17, 0); // upper arm
    const elbow = pivot(shoulder, 0, -0.34, 0);
    box(elbow, 0.14, 0.32, 0.14, 0, -0.16, 0); // forearm
    return { shoulder, elbow };
  };
  const armL = arm(1);
  const armR = arm(-1);

  // --- Legs (hip pivots) → knee pivots → shin + foot. Feet planted, apart.
  const leg = (side) => {
    const hip = pivot(hips, side * 0.16, 0, 0);
    box(hip, 0.2, 0.43, 0.2, 0, -0.215, 0); // thigh (knee at -0.43)
    const knee = pivot(hip, 0, -0.43, 0);
    box(knee, 0.18, 0.41, 0.18, 0, -0.205, 0); // shin (ankle at -0.41)
    box(knee, 0.18, 0.09, 0.26, 0, -0.455, -0.05); // foot (toes toward -Z)
    return { hip, knee };
  };
  const legL = leg(1);
  const legR = leg(-1);

  // --- Core: single faceted #FF0069 gem in the chest front + a soft additive
  //     halo sprite. The fighter's only glow.
  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pink).multiplyScalar(coreDim) });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), coreMat);
  core.position.set(0, 0.4, -0.16); // chest front (-Z)
  torso.add(core);

  const haloTex = makeRadialTexture('rgba(255,235,243,0.95)', pinkRgba(pink, 0.5), 0.4);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.8 * coreGain,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(0.34, 0.34, 0.34);
  halo.position.copy(core.position);
  torso.add(halo);

  // --- Contact shadow under the feet (dark, no pink). Lives on root so it
  //     stays put while the body breathes.
  const shadowTex = makeRadialTexture('rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', 0.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex, transparent: true, depthWrite: false, fog: false, opacity: 0.6,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  group.add(shadow);

  // --- HP bar — thin flat placeholder above the head. Sprites auto-billboard,
  //     so it stays readable as the camera orbits. Dark track + flat fill, NO
  //     glow/emissive/bloom (the only glow on the fighter is the core). Same
  //     treatment for both sides. Drawn on top (depthTest off) so it always reads.
  let hp = maxHp;
  const BAR_W = 0.7;
  const BAR_Y = 2.0;
  const barTrack = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0x0a0c14, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false,
  }));
  barTrack.scale.set(BAR_W, 0.09, 1);
  barTrack.position.set(0, BAR_Y, 0);
  barTrack.renderOrder = 10;
  group.add(barTrack);
  const barFill = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0xc6cfe2, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false,
  }));
  barFill.center.set(0, 0.5); // left-anchored → shrinks from the right
  barFill.scale.set(BAR_W, 0.09, 1);
  barFill.position.set(-BAR_W / 2, BAR_Y, 0);
  barFill.renderOrder = 11;
  group.add(barFill);
  const updateBar = () => { barFill.scale.x = (BAR_W * Math.max(0, hp)) / maxHp; };

  // --- Idle + action system. Idle = heavy breathing (hips settle + chest
  //     expand) + quiet core pulse. Actions (approach / punch / combo) play once
  //     on trigger over the joint pivots, then settle back into idle.
  const hipsBaseY = hips.position.y;
  const wBreath = (Math.PI * 2) / 3.8; // ~3.8s
  const wCore = (Math.PI * 2) / 2.6; // ~2.6s

  let reduced = false;
  let clip = null;
  let clipStart = 0;
  let lastT = 0;
  const setReducedMotion = (b) => { reduced = b; };

  const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const easeOut = (u) => 1 - Math.pow(1 - u, 3);
  const E = { io: easeInOut, out: easeOut };

  // Keyframe value: hips z/y offsets, torso lean (tx) + twist (ty), and each
  // arm's shoulder + elbow angles — left (lsx/lex) and right (rsx/rex). Missing
  // fields are 0, so a clip only lists what it uses. Segment i→i+1 is eased by
  // key[i+1].e.
  const REST = {};
  const N = (x) => x || 0;
  const KEYS = ['hz', 'hy', 'tx', 'ty', 'lsx', 'lex', 'rsx', 'rex', 'core'];
  const lerpV = (a, b, e) => {
    const o = {};
    for (const k of KEYS) o[k] = N(a[k]) + (N(b[k]) - N(a[k])) * e;
    return o;
  };
  const sample = (keys, ct) => {
    if (ct <= keys[0].t) return keys[0].v;
    for (let i = 0; i < keys.length - 1; i++) {
      if (ct <= keys[i + 1].t) {
        const u = (ct - keys[i].t) / (keys[i + 1].t - keys[i].t || 1);
        return lerpV(keys[i].v, keys[i + 1].v, E[keys[i + 1].e](u));
      }
    }
    return keys[keys.length - 1].v;
  };

  // Heavy timing throughout: slow windup → fast snap → weighty return. Forward
  // = -Z in local space, and the group is steered to face the opponent, so a
  // strike extends toward them. The lead punch uses the left arm (lsx/lex); the
  // cross uses the right (rsx/rex).
  const PUNCH = {
    dur: 1.3, impact: 0.6,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.45, v: { hz: 0.02, hy: -0.02, tx: 0.12, lsx: 0.15, lex: 2.0 }, e: 'io' }, // coil / chamber
      { t: 0.6, v: { hz: -0.12, hy: -0.05, tx: -0.18, lsx: 1.5, lex: 0.05 }, e: 'out' }, // snap — extend
      { t: 0.74, v: { hz: -0.08, hy: -0.03, tx: -0.1, lsx: 1.35, lex: 0.16 }, e: 'out' }, // recoil
      { t: 1.3, v: REST, e: 'io' }, // weighty return
    ],
  };
  const APPROACH = {
    dur: 1.5, impact: -1,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.55, v: { hz: -0.35, hy: -0.03, tx: -0.06 }, e: 'out' }, // weighty step in
      { t: 0.9, v: { hz: -0.35, hy: 0, tx: -0.04 }, e: 'io' }, // settle forward
      { t: 1.5, v: REST, e: 'io' }, // step back
    ],
  };
  const COMBO = {
    dur: 2.0, impact: 1.12,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.45, v: { hz: -0.3, hy: -0.03, tx: -0.05 }, e: 'out' }, // approach
      { t: 0.95, v: { hz: -0.28, hy: -0.04, tx: 0.08, lsx: 0.15, lex: 2.0 }, e: 'io' }, // coil
      { t: 1.12, v: { hz: -0.44, hy: -0.07, tx: -0.2, lsx: 1.5, lex: 0.05 }, e: 'out' }, // snap at the opponent
      { t: 1.28, v: { hz: -0.4, hy: -0.05, tx: -0.12, lsx: 1.35, lex: 0.16 }, e: 'out' }, // recoil
      { t: 2.0, v: REST, e: 'io' }, // step back + recover
    ],
  };
  // Double (jab–cross): left then right, OVERLAPPED — the right starts before
  // the left fully recovers. Torso twists (ty) to carry the weight arm to arm;
  // both fists work through shoulder + elbow. Two impacts (one per fist).
  const DOUBLE = {
    dur: 1.45, impacts: [0.32, 0.58],
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.16, v: { hz: -0.06, hy: -0.02, tx: 0.06, ty: -0.06, lsx: 0.2, lex: 1.9 }, e: 'io' }, // L chamber, coil
      { t: 0.32, v: { hz: -0.3, hy: -0.05, tx: -0.12, ty: 0.16, lsx: 1.5, lex: 0.05, rsx: 0.15, rex: 1.0 }, e: 'out' }, // L impact, R loading
      { t: 0.44, v: { hz: -0.28, hy: -0.05, tx: -0.06, ty: 0.06, lsx: 1.0, lex: 0.5, rsx: 0.2, rex: 1.9 }, e: 'io' }, // L recovers, R chambered
      { t: 0.58, v: { hz: -0.38, hy: -0.07, tx: -0.16, ty: -0.18, lsx: 0.5, lex: 0.9, rsx: 1.5, rex: 0.05 }, e: 'out' }, // R impact
      { t: 0.72, v: { hz: -0.34, hy: -0.06, tx: -0.1, ty: -0.12, lsx: 0.25, lex: 0.45, rsx: 1.3, rex: 0.18 }, e: 'out' }, // R recoil
      { t: 1.45, v: REST, e: 'io' }, // weighty return
    ],
  };
  // Hurt — sharp weighty recoil backward (+Z = away from the opponent) + a core
  // flash (bright → dip), then a heavy settle. The receiver's signal; no impact.
  const HURT = {
    dur: 0.95,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.08, v: { hz: 0.18, hy: -0.04, tx: 0.18, core: 1.0 }, e: 'out' }, // snap back, core flares
      { t: 0.2, v: { hz: 0.22, hy: -0.02, tx: 0.13, core: -0.45 }, e: 'out' }, // core dips (proval)
      { t: 0.45, v: { hz: 0.1, hy: -0.01, tx: 0.05, core: 0 }, e: 'io' },
      { t: 0.95, v: REST, e: 'io' }, // heavy return
    ],
  };

  // Locomotion — two WEIGHTED movement bands (no constant glide, no run). Both
  // ramp up from rest (accel), ease to a stop (decel) and carry velocity between
  // frames (inertia). The "weight" is in how the construct sets off and plants,
  // not in the legs:
  //   SLOW — collected low movement: circling, holding & adjusting range.
  //   FAST — a sharp heavy step-in: gather, drive a short burst, plant. Short
  //          and weighty — NOT a sprint across the plate (capped by FAST_DASH).
  // accel/decel in world units/s², speed in units/s; swing/knee/arm/lean/bob/
  // twist shape the gait look at that band (scaled by the live speed).
  const SLOW = { speed: 0.95, accel: 4.0, decel: 6.0, swing: 0.45, knee: 0.7, arm: 0.4, lean: -0.05, bob: 0.03, twist: 0.05 };
  const FAST = { speed: 2.3, accel: 12.0, decel: 10.0, swing: 0.62, knee: 0.95, arm: 0.55, lean: -0.17, bob: 0.05, twist: 0.07 };
  const FAST_DASH = 1.4; // max gap (world units) a FAST step-in commits before it plants
  const STRIDE_K = 7; // gait phase (rad) per world unit travelled → cadence ∝ live speed
  const ACCEL_LEAN = 0.012; // torso lean per unit of accel — weight on the start / the plant
  const MAX_ACCEL_LEAN = 0.22; // cap so a hard start / stop doesn't overrotate
  let gaitPhase = 0;
  let prevMag = 0; // last frame's speed magnitude — drives the accel-lean

  // Plate bounds (half-extents) — the fighter stays on the slab, never walks off
  // the edge. Passed in from the arena; the rift is no longer a barrier, so the
  // whole plate (both sides) is walkable.
  const BX = bounds.x;
  const BZ = bounds.z;

  // Navigation tuning (world units, opponent-relative).
  const RANGE_HYST = 0.25; // band around the engage distance before re-closing
  const CONTACT = 0.85; // hard minimum — bodies never interpenetrate
  const CONTACT_SOFT = 1.05; // soft buffer above CONTACT — ease back here (no grinding)
  const FAR = 3.0; // far edge of the approach band — arc straightens as the gap closes
  const STRIKE = 2.0; // a strike connects only if the foe is within this radius at impact
  const TURN_RATE = 5.0; // facing turn speed (rad/s)

  // Per-fighter "character" — independent rolls at build give each construct its
  // own temperament, so two fighters never move as a mirror or in lock-step:
  // different preferred range, aggression, circling sense, decision rhythm, and
  // approach arc. Live random, rolled once per fighter.
  const character = {
    range: 1.0 + Math.random() * 0.25, // preferred fighting distance — tight, just off contact
    aggression: 0.3 + Math.random() * 0.45, // press-in vs bait-out bias
    strafeBias: Math.random() < 0.5 ? -1 : 1, // default circling sense (CW / CCW)
    decideMin: 0.3 + Math.random() * 0.25, // manoeuvre decision period — min
    decideJit: 0.35 + Math.random() * 0.5, // + jitter
    approachArc: 0.4 + Math.random() * 0.55, // lateral arc on the way in (rad)
  };

  const loco = { active: false, type: 'slow' }; // dev SLOW/FAST preview toggle
  // AI manoeuvre state.
  const nav = { mode: 'circle', until: 0, foe: null, approachAngle: 0 };

  // Elimination — dissolve into the fog (~1.4s); core holds and fades last.
  const BG = new THREE.Color(0x070811);
  const skinBase = skin.color.clone();
  const DISS_DUR = 1.4;
  let state = 'alive'; // alive | dissolving | done
  let diss = 0;
  const ai = { on: false, nextAt: 0 }; // autonomous-behaviour state (dev)

  const play = (c) => {
    if (reduced || clip || state !== 'alive') return; // one one-shot at a time
    loco.active = false; // a throw / struck pose interrupts walking
    clip = { ...c, fired: c.impacts ? c.impacts.map(() => false) : false };
    clipStart = lastT;
  };

  const resetLegs = () => {
    legL.hip.rotation.x = 0; legL.knee.rotation.x = 0;
    legR.hip.rotation.x = 0; legR.knee.rotation.x = 0;
  };
  const resetArms = () => {
    torso.rotation.set(0, 0, 0);
    armL.shoulder.rotation.x = 0;
    armL.elbow.rotation.x = 0;
    armR.shoulder.rotation.x = 0;
    armR.elbow.rotation.x = 0;
  };

  const apply = (v) => {
    hips.position.z = N(v.hz);
    hips.position.y = hipsBaseY + N(v.hy);
    torso.rotation.x = N(v.tx);
    torso.rotation.y = N(v.ty);
    armL.shoulder.rotation.x = N(v.lsx);
    armL.elbow.rotation.x = N(v.lex);
    armR.shoulder.rotation.x = N(v.rsx);
    armR.elbow.rotation.x = N(v.rex);
    resetLegs(); // clips are upper-body only
  };

  const idlePose = (bs) => {
    hips.position.z = 0;
    hips.position.y = hipsBaseY + bs * 0.012; // settle
    resetArms();
    resetLegs();
  };

  // Gait + weight. Cadence and amplitude scale with the LIVE speed (mag), so a
  // move visibly winds up as it accelerates and winds down as it brakes — never
  // a fixed glide. `accel` (Δspeed/s) leans the torso: into the start, back on
  // the plant — the construct's weight reads in this lean, not in the legs. No
  // translation here; stepLocomotion places the group.
  const animateGait = (dt, band, mag, accel) => {
    const frac = THREE.MathUtils.clamp(mag / band.speed, 0, 1);
    gaitPhase += dt * mag * STRIDE_K; // cadence ∝ live speed
    const p = gaitPhase;
    legL.hip.rotation.x = band.swing * frac * Math.sin(p);
    legR.hip.rotation.x = band.swing * frac * Math.sin(p + Math.PI);
    legL.knee.rotation.x = -band.knee * frac * Math.max(0, Math.sin(p + 0.8));
    legR.knee.rotation.x = -band.knee * frac * Math.max(0, Math.sin(p + Math.PI + 0.8));
    armL.shoulder.rotation.x = band.arm * frac * Math.sin(p + Math.PI);
    armR.shoulder.rotation.x = band.arm * frac * Math.sin(p);
    armL.elbow.rotation.x = 0.3;
    armR.elbow.rotation.x = 0.3;
    const accelLean = THREE.MathUtils.clamp(accel * ACCEL_LEAN, -MAX_ACCEL_LEAN, MAX_ACCEL_LEAN);
    torso.rotation.x = band.lean * frac - accelLean; // forward with speed; into start, back on plant
    torso.rotation.y = band.twist * frac * Math.sin(p);
    hips.position.z = 0;
    hips.position.y = hipsBaseY - band.bob * frac * (0.5 - 0.5 * Math.cos(2 * p));
  };

  // Weighted locomotion — a velocity model the AI drives via a per-frame intent
  // (direction + band + distance-to-goal). Velocity ramps toward the band speed
  // (accel) / toward rest (decel) and is carried between frames, so movement has
  // a start, a stop and inertia — never a constant-speed glide.
  const move = { vx: 0, vz: 0 }; // carried world velocity (units/s) → inertia
  const intent = { on: false, dx: 0, dz: 0, band: SLOW, maxDist: Infinity };

  // Request movement this frame: unit direction (dx, dz), a band (SLOW / FAST)
  // and the distance left to the goal (so the integrator can brake into it).
  const requestMove = (dx, dz, band, maxDist = Infinity) => {
    const m = Math.hypot(dx, dz);
    if (m < 1e-6) return;
    intent.on = true;
    intent.dx = dx / m;
    intent.dz = dz / m;
    intent.band = band;
    intent.maxDist = maxDist;
  };

  // Integrate velocity → position once per frame (always — so a stopped move
  // coasts to rest). Near a goal the target speed is scaled down so the fighter
  // eases to a planted stop instead of cutting dead. The plate edge + a hard
  // min-separation from the foe clamp the step, and velocity is re-derived from
  // the real (clamped) move so a wall / contact sheds it cleanly (no grind, no
  // glide-through). `animate` gates the gait look so a clip / idle pose isn't
  // overwritten while residual velocity bleeds off.
  const stepLocomotion = (dt, animate) => {
    const band = intent.band;
    nav.foe = getFoePos && getFoePos(); // live foe for the separation clamp
    let tvx = 0;
    let tvz = 0;
    if (intent.on) {
      let ts = band.speed;
      const cm = Math.hypot(move.vx, move.vz);
      const brakeDist = (cm * cm) / (2 * band.decel) + 0.05; // distance to bleed off at decel
      if (intent.maxDist <= brakeDist) ts = band.speed * THREE.MathUtils.clamp(intent.maxDist / brakeDist, 0, 1);
      tvx = intent.dx * ts;
      tvz = intent.dz * ts;
    }
    // Ramp velocity toward target — accel when speeding up, decel when slowing.
    const tMag = Math.hypot(tvx, tvz);
    const cMag = Math.hypot(move.vx, move.vz);
    const maxDv = (tMag >= cMag ? band.accel : band.decel) * dt;
    const dvx = tvx - move.vx;
    const dvz = tvz - move.vz;
    const dm = Math.hypot(dvx, dvz);
    if (dm <= maxDv || dm < 1e-6) { move.vx = tvx; move.vz = tvz; }
    else { move.vx += (dvx / dm) * maxDv; move.vz += (dvz / dm) * maxDv; }
    // Integrate + clamp to plate and min foe separation; re-derive velocity from
    // the real move so hitting a wall / the foe sheds it (no grind).
    const ox = group.position.x;
    const oz = group.position.z;
    let nx = THREE.MathUtils.clamp(ox + move.vx * dt, -BX, BX);
    let nz = THREE.MathUtils.clamp(oz + move.vz * dt, -BZ, BZ);
    const f = nav.foe;
    if (f) {
      const ex = nx - f.x;
      const ez = nz - f.z;
      const ed = Math.hypot(ex, ez);
      if (ed < CONTACT && ed > 1e-4) {
        nx = THREE.MathUtils.clamp(f.x + (ex / ed) * CONTACT, -BX, BX);
        nz = THREE.MathUtils.clamp(f.z + (ez / ed) * CONTACT, -BZ, BZ);
      }
    }
    group.position.x = nx;
    group.position.z = nz;
    if (dt > 1e-4) { move.vx = (nx - ox) / dt; move.vz = (nz - oz) / dt; }
    const mag = Math.hypot(move.vx, move.vz);
    if (animate && mag > 0.02) {
      const accel = (mag - prevMag) / Math.max(dt, 1e-4);
      animateGait(dt, band, mag, accel);
    }
    prevMag = mag;
    intent.on = false; // consume — the next frame must re-request to keep moving
  };

  // Steer rotation.y toward a world direction (shortest angle, rate-limited).
  // Forward is local -Z, so facing (dirX, dirZ) means rotation.y = atan2(-dirX, -dirZ).
  const faceDir = (dt, dirX, dirZ) => {
    if (dirX * dirX + dirZ * dirZ < 1e-6) return;
    let diff = Math.atan2(-dirX, -dirZ) - group.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // wrap to [-π, π]
    const max = TURN_RATE * dt;
    group.rotation.y += THREE.MathUtils.clamp(diff, -max, max);
  };
  // Face the foe — used in the combat phases (approach / strike / circle).
  const faceFoe = (dt) => {
    const f = getFoePos && getFoePos();
    if (f) faceDir(dt, f.x - group.position.x, f.z - group.position.z);
  };
  const faceInstant = () => {
    const f = getFoePos && getFoePos();
    if (!f) return;
    const dx = f.x - group.position.x;
    const dz = f.z - group.position.z;
    if (dx * dx + dz * dz < 1e-6) return;
    group.rotation.y = Math.atan2(-dx, -dz);
  };

  // Distance gate for a landing blow: a strike connects only if the foe is within
  // STRIKE right now — so a punch lands anywhere on the plate when close enough,
  // and whiffs if the foe slipped out of reach (no contact = no damage).
  const foeInStrike = () => {
    const f = getFoePos && getFoePos();
    if (!f) return false;
    const dx = f.x - group.position.x;
    const dz = f.z - group.position.z;
    return dx * dx + dz * dz <= STRIKE * STRIKE;
  };

  // Manoeuvre at fighting range — character-weighted tactic re-picked on this
  // fighter's own clock (decideMin + jitter), so the two never act in lock-step:
  //   circle — orbit the foe (own circling sense, occasionally reversed)
  //   press  — step in toward contact, force a tight exchange (aggressive)
  //   bait   — ease out to draw the foe in (cautious)
  const maneuver = (t, dt, ux, uz, d) => {
    if (t >= nav.until) {
      const r = Math.random();
      const ag = character.aggression;
      if (r < 0.42) nav.mode = 'circle';
      else if (r < 0.42 + 0.4 * ag) nav.mode = 'press'; // aggressive → press in
      else if (r < 0.9) nav.mode = 'bait';
      else nav.mode = 'circle';
      if (Math.random() < 0.28) character.strafeBias *= -1; // reverse the orbit sometimes
      nav.until = t + character.decideMin + Math.random() * character.decideJit;
    }
    if (nav.mode === 'press') requestMove(ux, uz, FAST, Math.max(0, d - CONTACT_SOFT)); // sharp step-in
    else if (nav.mode === 'bait') requestMove(-ux, -uz, SLOW); // ease out
    else requestMove(character.strafeBias * -uz, character.strafeBias * ux, SLOW); // circle
  };
  const navigate = (t, dt, bs) => {
    const f = getFoePos && getFoePos();
    if (!f) { idlePose(bs); return; } // combat phases need a foe
    const dx = f.x - group.position.x;
    const dz = f.z - group.position.z;
    const d = Math.hypot(dx, dz) || 1e-4;
    const ux = dx / d;
    const uz = dz / d;
    const engage = character.range;

    if (d > engage + RANGE_HYST) {
      // Close in — but not straight down the middle: arc in at a per-approach
      // angle (sign + size from character), straightening as the gap closes.
      if (nav.mode !== 'approach') {
        nav.mode = 'approach';
        nav.approachAngle = (Math.random() < 0.5 ? -1 : 1) * character.approachArc * (0.5 + Math.random() * 0.5);
      }
      const closeFrac = THREE.MathUtils.clamp((d - engage) / (FAR - engage), 0, 1);
      const a = nav.approachAngle * closeFrac;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const gap = d - engage;
      // Collected SLOW traverse from far; a short FAST step-in for the final
      // close (capped by FAST_DASH so it reads as a step-in, not a sprint).
      const band = gap <= FAST_DASH ? FAST : SLOW;
      requestMove(ux * ca - uz * sa, ux * sa + uz * ca, band, gap);
      return;
    }
    if (d < CONTACT_SOFT) {
      // Too tight — ease back to the soft buffer (SLOW; the integrator brakes
      // into it so they settle smoothly, no grind).
      requestMove(-ux, -uz, SLOW, CONTACT_SOFT - d);
      return;
    }
    if (nav.mode === 'approach') nav.until = 0; // just arrived → pick a tactic now
    maneuver(t, dt, ux, uz, d); // fighting band
  };

  // Dev SLOW / FAST preview (AI off): approach the foe at the chosen band, then
  // circle; march in place if there's no foe. Keeps each band inspectable
  // without the full fight running.
  const devGait = (dt) => {
    const band = loco.type === 'fast' ? FAST : SLOW;
    const f = getFoePos && getFoePos();
    if (!f) { animateGait(dt, band, band.speed, 0); return; } // march in place
    faceFoe(dt);
    const dx = f.x - group.position.x;
    const dz = f.z - group.position.z;
    const d = Math.hypot(dx, dz) || 1e-4;
    const ux = dx / d;
    const uz = dz / d;
    if (d > character.range + RANGE_HYST) requestMove(ux, uz, band, d - character.range); // approach
    else requestMove(character.strafeBias * -uz, character.strafeBias * ux, band); // circle at range
  };

  const toggleLoco = (type) => {
    if (reduced || state !== 'alive') return;
    clip = null; // stop any one-shot
    if (loco.active && loco.type === type) { loco.active = false; return; }
    loco.type = type;
    loco.active = true;
  };

  const eliminate = () => {
    if (state !== 'alive') return;
    clip = null;
    loco.active = false;
    barTrack.visible = false; // bar leaves with the fighter
    barFill.visible = false;
    if (reduced) { state = 'done'; if (onEliminated) onEliminated(); return; } // no playback
    skin.transparent = true;
    coreMat.transparent = true;
    state = 'dissolving';
    diss = 0;
  };

  // Hit resolution: lose HP, recoil (HURT), and OUT at zero. The rift flash +
  // attacker→defender pairing live in ArenaScene (the combat resolver).
  const takeDamage = (dmg) => {
    if (state !== 'alive') return;
    hp = Math.max(0, hp - dmg);
    updateBar();
    if (hp <= 0) { eliminate(); return; } // → dissolve; onEliminated raised on completion
    play(HURT); // weighty recoil + core flash
    ai.nextAt = Math.max(ai.nextAt, lastT + HURT.dur + 0.4 + Math.random() * 0.6); // rhythm hitch
  };

  // Autonomous combat (AI): strike only when the foe is within range, on a
  // cadence; the navigation above closes the gap and manoeuvres between strikes.
  // COMBO/PUNCH/DOUBLE are weighted; an incoming hit adds a rhythm hitch (in
  // takeDamage). Live random — no seed. Returns true if a strike started.
  const decideAttack = (t) => {
    if (clip || t < ai.nextAt) return false;
    const f = getFoePos && getFoePos();
    if (!f) return false;
    const dx = f.x - group.position.x;
    const dz = f.z - group.position.z;
    if (Math.hypot(dx, dz) > character.range + RANGE_HYST) return false; // only commit when engaged
    const r = Math.random();
    const atk = r < 0.45 ? PUNCH : r < 0.8 ? DOUBLE : COMBO; // punch / double primary, combo = lunge
    play(atk);
    ai.nextAt = t + atk.dur + 0.3 + Math.random() * 0.8; // pause after the clip
    // Follow-up after the strike — character-driven: aggressive ones press a
    // flurry, cautious ones circle or bait out. The window starts as the clip
    // ends. (Never just hang motionless in the foe's face.)
    if (Math.random() < character.aggression * 0.6) {
      nav.mode = 'press';
      nav.until = t + atk.dur + 0.25 + Math.random() * 0.4;
    } else {
      nav.mode = Math.random() < 0.5 ? 'circle' : 'bait';
      if (nav.mode === 'circle' && Math.random() < 0.5) character.strafeBias *= -1;
      nav.until = t + atk.dur + 0.25 + Math.random() * 0.4;
    }
    return true;
  };
  // Under reduced motion the body holds still; resolve the key moment (the hit
  // lands) on cadence so a fight still progresses without any jitter.
  const reducedAttack = (t) => {
    if (t < ai.nextAt) return;
    if (onImpact) onImpact();
    ai.nextAt = t + 0.7 + Math.random() * 0.8;
  };
  const setAI = (b) => {
    ai.on = b;
    if (b) {
      ai.nextAt = lastT + 0.3 + Math.random() * 0.6;
      nav.until = lastT + Math.random() * character.decideJit; // desync decision phase
      nav.mode = Math.random() < 0.5 ? 'circle' : 'approach';
    }
  };

  const update = (t) => {
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;

    // Elimination — dissolve the body into the fog; core fades last, then remove.
    if (state === 'dissolving') {
      diss += dt / DISS_DUR;
      const k = Math.min(1, diss);
      const bodyK = Math.min(1, k / 0.8); // body melts over the first 0.8
      skin.opacity = 1 - bodyK;
      skin.color.copy(skinBase).lerp(BG, bodyK);
      const coreK = Math.max(0, (k - 0.6) / 0.4); // core holds, then fades last
      coreMat.opacity = 1 - coreK;
      haloMat.opacity = 0.8 * coreGain * (1 - coreK);
      core.scale.setScalar(1 - 0.3 * coreK);
      if (k >= 1) { state = 'done'; if (onEliminated) onEliminated(); }
      return;
    }
    if (state === 'done') return;

    // Reduced motion: hold a static pose, face the foe, and resolve strikes as
    // key moments only — no locomotion, no clip playback (reads without jitter).
    if (reduced) {
      if (ai.on && !clip && state === 'alive') { faceInstant(); reducedAttack(t); }
      hips.position.set(0, hipsBaseY, 0);
      resetArms();
      resetLegs();
      chest.scale.set(1, 1, 1);
      core.scale.setScalar(1);
      haloMat.opacity = 0.8 * coreGain;
      return;
    }

    // Breathing + core pulse run always; core can be boosted by a hurt flash.
    const bs = Math.sin(t * wBreath);
    chest.scale.set(1 + bs * 0.02, 1 + bs * 0.03, 1 + bs * 0.02);
    const cpulse = 0.5 + 0.5 * Math.sin(t * wCore);
    let coreBoost = 0;

    // AI, when free (no clip): turn to face the foe, then decide whether to
    // strike (a strike starts a clip that plays out below this same frame).
    if (ai.on && !clip) { faceFoe(dt); decideAttack(t); }

    if (clip) {
      const ct = t - clipStart;
      if (clip.impacts) {
        for (let i = 0; i < clip.impacts.length; i++) {
          if (!clip.fired[i] && ct >= clip.impacts[i]) {
            clip.fired[i] = true;
            if (onImpact && foeInStrike()) onImpact(); // damage only if the foe is in reach
          }
        }
      } else if (!clip.fired && clip.impact >= 0 && ct >= clip.impact) {
        clip.fired = true;
        if (onImpact && foeInStrike()) onImpact(); // damage only if the foe is in reach
      }
      if (ct < clip.dur) {
        const v = sample(clip.keys, ct);
        apply(v);
        coreBoost = N(v.core);
      } else {
        clip = null;
        idlePose(bs);
      }
    } else if (ai.on) {
      navigate(t, dt, bs); // navigate toward / around the foe (sets the move intent)
    } else if (loco.active) {
      devGait(dt); // dev SLOW/FAST preview (sets the move intent)
    } else {
      idlePose(bs);
    }

    // Integrate weighted locomotion every frame: a clip / idle frame sets no
    // intent, so carried velocity coasts to rest (inertia) without the gait
    // overwriting the clip / idle pose. A locomotion frame animates the gait.
    stepLocomotion(dt, !clip && (ai.on || loco.active));

    core.scale.setScalar(1 + cpulse * 0.22 + coreBoost * 0.5);
    haloMat.opacity = THREE.MathUtils.clamp((0.55 + 0.4 * cpulse + coreBoost * 0.6) * coreGain, 0.05, 1.6);
  };

  const dispose = () => {
    const geos = new Set();
    const mats = new Set();
    const maps = new Set();
    group.traverse((obj) => {
      if (obj.geometry) geos.add(obj.geometry);
      if (obj.material) {
        mats.add(obj.material);
        if (obj.material.map) maps.add(obj.material.map);
      }
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    maps.forEach((m) => m.dispose());
  };

  // --- Scale down to read alongside the arena (and leave room for a full team
  //     on the half later). Origin is at the feet, so this keeps them planted —
  //     the placement y in ArenaScene needs no change. ~1.84 → ~1.34 tall.
  group.scale.setScalar(0.73);

  return {
    group, update, setReducedMotion, dispose,
    approach: () => play(APPROACH),
    punch: () => play(PUNCH),
    combo: () => play(COMBO),
    double: () => play(DOUBLE),
    hurt: () => play(HURT),
    slow: () => toggleLoco('slow'),
    fast: () => toggleLoco('fast'),
    eliminate,
    takeDamage,
    getHp: () => hp,
    maxHp,
    setAI,
    toggleAI: () => setAI(!ai.on),
    isAI: () => ai.on,
    joints: { hips, torso, armL, armR, legL, legR },
  };
}
