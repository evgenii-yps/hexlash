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
import { resolveBehavior } from '../data/behavior.js';
import { KLICH_PROFILES } from '../data/klichProfiles.js';
import { COMBAT_BALANCE } from '../data/combatBalance.js';

function pinkRgba(pink, a) {
  const n = parseInt(pink.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function buildFighter(
  pink = '#FF0069',
  // `pink` is the core colour (per-core hue for the player, canon pink for the
  // opponent). `coreId` is the chosen core; `behavior` is the resolved profile
  // from the data-каркас (src/data/behavior.js) — { axes, effects, conditionals }
  // — which drives how this fighter moves and fights (see the axis → knob seam
  // below). If `behavior` is absent it's resolved from `coreId` (no lit facets),
  // so any caller still gets a core-shaped fighter.
  { side = 'player', coreId = null, behavior = null, maxHp = COMBAT_BALANCE.maxHp, onImpact, onEliminated, getFoePos = null, bounds = { x: 2.5, z: 1.5 }, neutralColor = false } = {},
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
  // NEUTRAL COLOUR (dev A/B stand): a single team-less grey both sides share +
  // the core glow killed, so two builds read by movement manner alone with no
  // colour hint. Applied via setNeutralColor() — toggled live or set at build.
  const SKIN_NEUTRAL = 0x23262e;
  const coreDim = isOpp ? 0.7 : 1.0; // darkens the gem, keeps the hue
  const coreGain = isOpp ? 0.55 : 1.0; // halo brightness — player's is brightest

  // Shared faceted "skin" — same workshop as the plates, a touch lighter so the
  // construct reads against them.
  const skin = new THREE.MeshStandardMaterial({
    color: skinColor,
    flatShading: true,
    roughness: 0.8,
    metalness: 0.18,
    emissive: new THREE.Color(0xff5fa0), // selection-highlight tint (intensity 0 until armed)
    emissiveIntensity: 0,
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

  // NEUTRAL COLOUR toggle (dev only) — grey both sides identically + hide the
  // core gem + halo (the fighter's only glow). Visibility-off survives the
  // per-frame core/halo writes in update(); the rift + arena are untouched (this
  // only touches the fighter). The per-frame opacity/scale writes are harmless
  // no-ops while hidden.
  const setNeutralColor = (b) => {
    skin.color.setHex(b ? SKIN_NEUTRAL : skinColor);
    core.visible = !b;
    halo.visible = !b;
  };

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
  let dodgeRun = null; // active dodge displacement { bx, bz, wx, wz } or null
  const setReducedMotion = (b) => { reduced = b; };

  // --- Selection highlight (interactive, temporary) — the "this fighter is
  //     targetable" signal while a player lever/buff is armed, and a brighter
  //     decaying flash on confirm. Drives the skin's emissive (set up at build,
  //     intensity 0 when idle), so it is NOT a persistent second glow — it
  //     vanishes the moment it's un-highlighted. update() computes the intensity
  //     each frame (pulse under full motion, static under reduced; the confirm
  //     flash is a glow fade only, so it's fine under reduced motion too).
  let highlighted = false;
  let confirmAt = -1; // confirm-flash start time (update clock); -1 = none
  const CONFIRM_DUR = 0.5;
  const setHighlight = (b) => { highlighted = b; };
  const confirmPulse = () => { confirmAt = lastT; };

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
    dur: 1.3, impact: 0.6, dmgMult: COMBAT_BALANCE.moveMult.punch, // single jab — base damage
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
    dur: 2.0, impact: 1.12, dmgMult: COMBAT_BALANCE.moveMult.combo, // one heavy commit — the most painful single hit
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
    dur: 1.45, impacts: [0.32, 0.58], dmgMult: COMBAT_BALANCE.moveMult.doubleEach, // two hits — each uses this mult, EACH stronger than a jab (≈2.7× a punch summed)
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

  // Dodge (visual only) — a sharp readable evade: the whole body slips off-line
  // (group displacement, see DODGE_DIST) while it ducks low behind a tucked
  // guard, holds the slip, then eases back to stance. No impact, no damage — it
  // never gates a hit; the pose blends in/out via the pose layer like any clip.
  const DODGE_DIST = 0.55; // how far the body slips off-line (world units)
  const DODGE_DUR = 0.5; // total evade time (s) — fast but readable
  const DODGE = {
    dur: DODGE_DUR, impact: -1, dodge: true,
    keys: [
      { t: 0.0, v: REST, e: 'out' },
      { t: 0.12, v: { hy: -0.1, tx: 0.05, lsx: 0.5, lex: 1.55, rsx: 0.5, rex: 1.55 }, e: 'out' }, // duck + guard, snap aside
      { t: 0.3, v: { hy: -0.11, tx: 0.04, lsx: 0.55, lex: 1.6, rsx: 0.55, rex: 1.6 }, e: 'io' }, // hold the slip
      { t: DODGE_DUR, v: REST, e: 'io' }, // ease back to stance
    ],
  };
  // Displacement envelope over the dodge clip: quick slip out → hold → ease back.
  // Returns to the start spot, so a dodge never shifts the fight position.
  const dodgeEnv = (u) => {
    if (u < 0.22) return easeOut(u / 0.22);
    if (u < 0.42) return 1;
    return 1 - easeInOut((u - 0.42) / 0.58);
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
  const TRANSITION_DUR = 0.13; // pose cross-fade time on a movement / state change (s)
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

  // --- Behaviour profile → fighter controls. The data-каркас
  //     (src/data/behavior.js) resolves the chosen core's start profile + lit-
  //     facet shifts into 8 levers (0..100, 50 = neutral). THIS block is the
  //     SINGLE seam where those levers meet the movement / AI knobs — tune the
  //     mapping here. A small bounded jitter rides on top so two same-core
  //     fighters never move as a mirror or in lock-step. Axis → knob:
  //       distance   → preferred fighting range (RANGE_NEAR..RANGE_FAR)
  //       initiative → aggression → press-vs-bait tactic odds + press-after-strike
  //       tempo      → decision period + post-strike pause + multi-hit bias
  //       weight     → MOVEMENT MANNER: band speed (×speedMul, wide) + start/plant
  //                    inertia (×accelMul) + attack style (heavy = rare heavy/combo,
  //                    light = frequent singles, via heavy01 + a weight pause term)
  //       stick      → press-after-strike / reluctance to disengage
  //       resilience → incoming damage + stagger/hitch (read LIVE in takeDamage)
  //       counter    → punish-after-being-hit chance
  //       slip       → mid-manoeuvre evade (DODGE) frequency
  //     `behavior.effects` / `.conditionals` are wired but empty this pass
  //     (tagged tricks coded point-by-point later); axes alone drive this seam.
  //     A KLICH (combat call) lays a temporary additive delta over the base axes
  //     (distance / initiative / resilience / stick) — see the klich block below;
  //     the knobs those axes drive (range, aggression, stickEff, resilience) are
  //     re-derived each frame from base + delta, so the base is never mutated.
  const ax = (behavior && behavior.axes) || resolveBehavior(coreId).axes;
  const n01 = (v) => THREE.MathUtils.clamp(v, 0, 100) / 100;
  const lerp = THREE.MathUtils.lerp;
  const jit = (amp) => (Math.random() * 2 - 1) * amp; // ±amp bounded liveliness

  const RANGE_NEAR = 1.0; // distance=0  → just off contact (in-fighter)
  const RANGE_FAR = 2.8; //  distance=100 → spacing fighter; darts in to strike
  const tempo01 = n01(ax.tempo);
  const stick01 = n01(ax.stick);
  const counter01 = n01(ax.counter);
  const slip01 = n01(ax.slip);
  const weight01 = n01(ax.weight);
  // weight as MOVEMENT MANNER (not outcome): a wide speed spread so heavy reads
  // visibly slow + light visibly quick on the grey stand (≈2.3× light-vs-heavy,
  // was a near-flat ±13%). accelMul makes heavy gather/plant with inertia, light
  // snap off the mark — so the weight reads in the start/stop, not only top speed.
  const speedMul = lerp(1.4, 0.6, weight01); // light 1.4 · neutral 1.0 · heavy 0.6
  const accelMul = lerp(1.25, 0.65, weight01); // light snappy · heavy ponderous
  const heavy01 = THREE.MathUtils.clamp(weight01 * 0.7 + tempo01 * 0.3, 0, 1); // weight-led attack style

  // --- Fighter characteristics sheet (strikePower / toughness / mobility). The
  //     foundation the grade system will lay percentage bonuses on (this pass:
  //     base values from COMBAT_BALANCE, no grade boosts yet). strikePower +
  //     toughness are NEW; `mobility` only REFLECTS the existing weight→speed
  //     mapping above (speedMul) as a readable number — it is NOT a second
  //     movement system (the gait still runs off speedMul/accelMul as before).
  //     All balance numbers live in src/data/combatBalance.js (one tuning point).
  //
  //     Grade layer: lit facets on the "hard" branches add a PERCENT to a
  //     characteristic — resolveBehavior summed them into behavior.statBonuses
  //     ({ strikePower, toughness } fractions). Multiply the base by (1 + bonus).
  //     The opponent (random core, no lit facets) sums to 0 → base stats; the
  //     player's bonuses are naturally capped by the RESOURCE pool. Mobility is
  //     NOT graded this pass — it only reflects the weight→speed mapping.
  const B = COMBAT_BALANCE;
  const sb = (behavior && behavior.statBonuses) || { strikePower: 0, toughness: 0 };
  const stats = {
    strikePower: Math.round(B.strikePower * (1 + (sb.strikePower || 0))),
    toughness: Math.round(B.toughness * (1 + (sb.toughness || 0))),
    mobility: Math.round(B.mobilityBase * speedMul),
  };
  // Outgoing strike damage for a clip: сила удара × множитель приёма × джиттер.
  // The defender's toughness softening is applied on its side (takeDamage).
  const strikeDamage = (c) => stats.strikePower * (c.dmgMult || 0) * (1 + jit(B.jitter));
  // Toughness softening — PERCENT mitigation, saturating, never to zero (a weak
  // hit still chips through). Constant per fighter this pass (stats don't change
  // mid-bout yet); incoming damage is multiplied by (1 − toughSoft) in takeDamage.
  const toughSoft = stats.toughness / (stats.toughness + B.toughnessK);
  // resilience → incoming-damage / stagger multipliers are computed LIVE in
  // takeDamage from the effective resilience (base + klich), so a ДЕРЖАТЬ call
  // toughens the fighter for its duration without touching the base.
  const dmgMulFor = (res01) => lerp(1.15, 0.38, res01); // glass takes more · floor 0.38 (was 0.6) so max resilience / ДЕРЖАТЬ at peak ~halves incoming vs a neutral fighter
  const stagMulFor = (res01) => lerp(1.0, 0.15, res01); // tough barely hitches
  // Scale this fighter's movement bands by weight (local objects — safe to
  // mutate per fighter; a touch of jitter keeps two same-weight builds distinct).
  SLOW.speed *= speedMul * (1 + jit(0.05));
  FAST.speed *= speedMul * (1 + jit(0.05));
  SLOW.accel *= accelMul; SLOW.decel *= accelMul; // weighty start / plant
  FAST.accel *= accelMul; FAST.decel *= accelMul;

  // Per-fighter "character" — derived from the profile (+ jitter), so the four
  // cores read differently and no two builds are a mirror: preferred range,
  // aggression, circling sense, decision rhythm, approach arc. `range` +
  // `aggression` are re-derived each frame from the effective (base + klich)
  // distance / initiative — the jitter offsets are captured ONCE so the per-frame
  // refresh keeps each fighter's liveliness stable (no per-frame noise).
  const character = {
    rangeJit: jit(0.12),
    aggrJit: jit(0.08),
    range: 0, // set just below + refreshed each frame from effective distance
    aggression: 0, // set just below + refreshed each frame from effective initiative
    strafeBias: Math.random() < 0.5 ? -1 : 1, // default circling sense (CW / CCW)
    decideMin: Math.max(0.18, lerp(0.55, 0.22, tempo01) + jit(0.05)), // fast tempo → quick decisions
    decideJit: Math.max(0.2, lerp(0.7, 0.3, tempo01) + jit(0.08)),
    approachArc: 0.4 + Math.random() * 0.45, // lateral arc on the way in (rad)
  };
  // Initial (no-klich) range + aggression from the base profile.
  character.range = THREE.MathUtils.clamp(lerp(RANGE_NEAR, RANGE_FAR, n01(ax.distance)) + character.rangeJit, CONTACT_SOFT, FAR - 0.2);
  character.aggression = THREE.MathUtils.clamp(n01(ax.initiative) + character.aggrJit, 0, 1);

  // --- Klich (combat call) temporary axis modifier. A call pushes an attack →
  //     hold → release envelope (from KLICH_PROFILES) onto `activeKlichs`. Each
  //     frame refreshKlich() sums the live envelopes into `klichKd` (additive
  //     delta over the BASE axes for the 4 axes calls touch), re-derives range /
  //     aggression / stickEff, and flags klichActive (for the "effect on" marker);
  //     resilience is read live in takeDamage. Base axes are NEVER mutated, so the
  //     fighter returns to base EXACTLY when the calls expire; stacked / repeated
  //     calls sum and auto-prune (no stick). Runs in reduced motion too (the axis
  //     shift is fight logic, not animation).
  const baseAx = ax;
  const activeKlichs = []; // { ax:{axis:delta}, dur, attack, release, start }
  const klichKd = { distance: 0, initiative: 0, resilience: 0, stick: 0 };
  let stickEff = stick01; // live stick (base + klich), refreshed each frame
  let klichActive = false; // any call currently in effect (visual marker)
  // Envelope over u∈[0,1]: rise (easeOut) over [0,attack], hold, fall (easeInOut)
  // over the last `release`. Small attack + big release = a sharp spike that fades.
  const klichEnv = (u, attack, release) => {
    if (u <= 0 || u >= 1) return 0;
    if (u < attack) return easeOut(u / attack);
    if (u > 1 - release) return 1 - easeInOut((u - (1 - release)) / release);
    return 1;
  };
  const refreshKlich = (t) => {
    klichKd.distance = 0; klichKd.initiative = 0; klichKd.resilience = 0; klichKd.stick = 0;
    klichActive = false;
    for (let i = activeKlichs.length - 1; i >= 0; i--) {
      const k = activeKlichs[i];
      const u = (t - k.start) / k.dur;
      if (u >= 1) { activeKlichs.splice(i, 1); continue; } // expired → prune
      const e = klichEnv(u, k.attack, k.release);
      if (e > 0.001) klichActive = true;
      for (const axis in k.ax) klichKd[axis] = (klichKd[axis] || 0) + k.ax[axis] * e;
    }
    const effDist = THREE.MathUtils.clamp(baseAx.distance + klichKd.distance, 0, 100);
    const effInit = THREE.MathUtils.clamp(baseAx.initiative + klichKd.initiative, 0, 100);
    stickEff = THREE.MathUtils.clamp((baseAx.stick + klichKd.stick) / 100, 0, 1);
    character.range = THREE.MathUtils.clamp(lerp(RANGE_NEAR, RANGE_FAR, effDist / 100) + character.rangeJit, CONTACT_SOFT, FAR - 0.2);
    character.aggression = THREE.MathUtils.clamp(effInit / 100 + character.aggrJit, 0, 1);
  };
  // Apply a klich by id — push its envelope onto the active list (additive, decays
  // + auto-prunes). Stacks sanely with any already-active call. No-op if unknown /
  // not alive. The visual confirm pulse is fired by the caller (confirmPulse()).
  const applyKlich = (id) => {
    if (state !== 'alive') return;
    const p = KLICH_PROFILES[id];
    if (!p) return;
    activeKlichs.push({ ax: { ...p.axes }, dur: p.dur, attack: p.attack, release: p.release, start: lastT });
  };

  const loco = { active: false, type: 'slow' }; // dev SLOW/FAST preview toggle
  // AI manoeuvre state.
  const nav = { mode: 'circle', until: 0, foe: null, approachAngle: 0 };

  // Elimination — dissolve into the fog (~1.4s); core holds and fades last.
  const BG = new THREE.Color(0x070811);
  let skinBase = skin.color.clone(); // re-captured at eliminate() so the dissolve fades from the live (e.g. neutral-grey) skin
  const DISS_DUR = 1.4;
  let state = 'alive'; // alive | dissolving | done
  let diss = 0;
  const ai = { on: false, nextAt: 0 }; // autonomous-behaviour state (dev)

  const play = (c) => {
    if (reduced || clip || state !== 'alive') return; // one one-shot at a time
    loco.active = false; // a throw / struck pose interrupts walking
    clip = { ...c, fired: c.impacts ? c.impacts.map(() => false) : false };
    clipStart = lastT;
    if (c.dodge) {
      // Set up the slip: cancel carried velocity (so it doesn't fight the dodge),
      // capture the base spot and pick a world direction — local right / left, or
      // occasionally straight back (forward is local -Z, so back is +Z).
      move.vx = 0; move.vz = 0;
      const ry = group.rotation.y;
      const r = Math.random();
      const lx = r < 0.45 ? 1 : r < 0.9 ? -1 : 0;
      const lz = r < 0.9 ? 0 : 1;
      dodgeRun = {
        bx: group.position.x,
        bz: group.position.z,
        wx: lx * Math.cos(ry) + lz * Math.sin(ry),
        wz: -lx * Math.sin(ry) + lz * Math.cos(ry),
      };
    } else {
      dodgeRun = null;
    }
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

  // --- Pose blend layer. Every pose-producer (idle / gait / clip) writes a
  //     TARGET pose into `targetP` and tags the active `poseMode`; commitPose()
  //     then drives the live joints toward it. On a mode change it snapshots the
  //     pose it's leaving and cross-fades to the new one over TRANSITION_DUR — so
  //     idle ↔ move ↔ strike never snaps. Within a steady mode the target is
  //     written straight through, so the gait and the strikes keep their full
  //     amplitude (no mush). Channels: hips z/y, torso x/y, each arm
  //     shoulder/elbow, each leg hip/knee.
  const POSE_KEYS = ['hipsZ', 'hipsY', 'torsoX', 'torsoY', 'lsx', 'lex', 'rsx', 'rex', 'lhx', 'lkx', 'rhx', 'rkx'];
  const liveP = { hipsZ: 0, hipsY: hipsBaseY, torsoX: 0, torsoY: 0, lsx: 0, lex: 0, rsx: 0, rex: 0, lhx: 0, lkx: 0, rhx: 0, rkx: 0 };
  const targetP = { ...liveP };
  const blendP = { ...liveP };
  let poseMode = 'idle';
  let blendT = TRANSITION_DUR; // settled (no blend) at start

  // Tag the active producer. A change snapshots the pose we leave + restarts the
  // cross-fade. Gait carries its band in the tag so a SLOW↔FAST switch eases too.
  const setMode = (m) => {
    if (m === poseMode) return;
    for (const k of POSE_KEYS) blendP[k] = liveP[k];
    blendT = 0;
    poseMode = m;
  };

  // Ease the live joints toward this frame's target; cross-fade while blendT runs,
  // then write straight through. Writes every channel each frame.
  const commitPose = (dt) => {
    if (blendT < TRANSITION_DUR) {
      blendT = Math.min(TRANSITION_DUR, blendT + dt);
      const e = easeInOut(blendT / TRANSITION_DUR);
      for (const k of POSE_KEYS) liveP[k] = blendP[k] + (targetP[k] - blendP[k]) * e;
    } else {
      for (const k of POSE_KEYS) liveP[k] = targetP[k];
    }
    hips.position.z = liveP.hipsZ;
    hips.position.y = liveP.hipsY;
    torso.rotation.x = liveP.torsoX;
    torso.rotation.y = liveP.torsoY;
    armL.shoulder.rotation.x = liveP.lsx;
    armL.elbow.rotation.x = liveP.lex;
    armR.shoulder.rotation.x = liveP.rsx;
    armR.elbow.rotation.x = liveP.rex;
    legL.hip.rotation.x = liveP.lhx;
    legL.knee.rotation.x = liveP.lkx;
    legR.hip.rotation.x = liveP.rhx;
    legR.knee.rotation.x = liveP.rkx;
  };

  // Clip pose (one-shot strike / hurt) → target. Upper body from the keyframe;
  // legs neutral (clips don't animate the legs).
  const apply = (v) => {
    targetP.hipsZ = N(v.hz);
    targetP.hipsY = hipsBaseY + N(v.hy);
    targetP.torsoX = N(v.tx);
    targetP.torsoY = N(v.ty);
    targetP.lsx = N(v.lsx);
    targetP.lex = N(v.lex);
    targetP.rsx = N(v.rsx);
    targetP.rex = N(v.rex);
    targetP.lhx = 0; targetP.lkx = 0; targetP.rhx = 0; targetP.rkx = 0;
    setMode('clip');
  };

  // Idle pose → target: settled stance + a faint breathing rise on the hips.
  const idlePose = (bs) => {
    targetP.hipsZ = 0;
    targetP.hipsY = hipsBaseY + bs * 0.012;
    targetP.torsoX = 0; targetP.torsoY = 0;
    targetP.lsx = 0; targetP.lex = 0; targetP.rsx = 0; targetP.rex = 0;
    targetP.lhx = 0; targetP.lkx = 0; targetP.rhx = 0; targetP.rkx = 0;
    setMode('idle');
  };

  // Gait + weight → target. Cadence and amplitude scale with the LIVE speed
  // (mag), so a move visibly winds up as it accelerates and winds down as it
  // brakes — never a fixed glide. `accel` (Δspeed/s) leans the torso: into the
  // start, back on the plant — the construct's weight reads in this lean, not the
  // legs. No translation here; stepLocomotion places the group.
  const animateGait = (dt, band, mag, accel) => {
    const frac = THREE.MathUtils.clamp(mag / band.speed, 0, 1);
    gaitPhase += dt * mag * STRIDE_K; // cadence ∝ live speed
    const p = gaitPhase;
    targetP.lhx = band.swing * frac * Math.sin(p);
    targetP.rhx = band.swing * frac * Math.sin(p + Math.PI);
    targetP.lkx = -band.knee * frac * Math.max(0, Math.sin(p + 0.8));
    targetP.rkx = -band.knee * frac * Math.max(0, Math.sin(p + Math.PI + 0.8));
    targetP.lsx = band.arm * frac * Math.sin(p + Math.PI);
    targetP.rsx = band.arm * frac * Math.sin(p);
    targetP.lex = 0.3;
    targetP.rex = 0.3;
    const accelLean = THREE.MathUtils.clamp(accel * ACCEL_LEAN, -MAX_ACCEL_LEAN, MAX_ACCEL_LEAN);
    targetP.torsoX = band.lean * frac - accelLean; // forward with speed; into start, back on plant
    targetP.torsoY = band.twist * frac * Math.sin(p);
    targetP.hipsZ = 0;
    targetP.hipsY = hipsBaseY - band.bob * frac * (0.5 - 0.5 * Math.cos(2 * p));
    setMode(band === FAST ? 'gait-fast' : 'gait-slow');
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
      // slip → elusive fighters weave aside (a DODGE) instead of a ground tactic.
      if (!clip && slip01 > 0 && Math.random() < slip01 * 0.22) {
        play(DODGE);
        nav.until = t + character.decideMin + Math.random() * character.decideJit;
        return;
      }
      const r = Math.random();
      // INITIATIVE drives press↔bait directly (no fixed circle floor): high
      // initiative drives in (press most decisions), low initiative hangs back
      // and draws the foe in (bait), stick nudges toward press. The remainder
      // circles. This is what makes "lezet v draku vs vyzhidat" read.
      const aggr = character.aggression;
      const pressW = THREE.MathUtils.clamp(0.55 * aggr + 0.15 * stickEff, 0, 0.85);
      const baitW = THREE.MathUtils.clamp(0.5 * (1 - aggr) - 0.15 * stickEff, 0, 0.6);
      if (r < pressW) nav.mode = 'press'; // initiative high → drive in
      else if (r < pressW + baitW) nav.mode = 'bait'; // initiative low → wait / draw in
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
    if (d < engage - RANGE_HYST) {
      // Notably INSIDE preferred range — ease back out toward it (active spacing;
      // makes `distance` read both ways, and an ОТХОД call's distance spike pop
      // as a sharp break: FAST when the gap to give up is large, SLOW for a small
      // adjust). The integrator brakes into `out`, so it settles at the range.
      const out = engage - d;
      const band = out > FAST_DASH ? FAST : SLOW;
      requestMove(-ux, -uz, band, out);
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
    highlighted = false; confirmAt = -1; skin.emissiveIntensity = 0; // selection glow leaves with the fighter
    clip = null;
    dodgeRun = null;
    loco.active = false;
    barTrack.visible = false; // bar leaves with the fighter
    barFill.visible = false;
    if (reduced) { state = 'done'; if (onEliminated) onEliminated(); return; } // no playback
    skin.transparent = true;
    coreMat.transparent = true;
    skinBase = skin.color.clone(); // fade from the live skin (neutral grey stays grey through the dissolve)
    state = 'dissolving';
    diss = 0;
  };

  // Hit resolution: lose HP, recoil (HURT), and OUT at zero. The rift flash +
  // attacker→defender pairing live in ArenaScene (the combat resolver).
  const takeDamage = (dmg) => {
    if (state !== 'alive') return;
    // Reflex dodge (slip): a per-hit chance to FULLY evade — the incoming hit
    // deals 0 damage, doesn't stagger, and the existing DODGE animation plays
    // (best-effort: play() no-ops if a clip is already running / reduced motion,
    // but the hit is negated either way). A body reflex scaled from the slip axis
    // (combatBalance.dodgeChance*), capped BELOW 1 so a bout always finishes. Each
    // incoming impact calls takeDamage on its own, so a DOUBLE / COMBO rolls this
    // per hit. No resource / cooldown yet — fatigue may cap it in a later pass.
    const dodgeChance = B.dodgeChanceMax * Math.pow(slip01, B.dodgeChanceCurve);
    if (dodgeChance > 0 && Math.random() < dodgeChance) {
      play(DODGE); // slip the hit: no HP loss, no rhythm hitch
      return;
    }
    // Effective resilience = base + live klich delta (a ДЕРЖАТЬ call toughens for
    // its duration); refreshKlich keeps klichKd current each frame.
    const res01 = THREE.MathUtils.clamp((baseAx.resilience + klichKd.resilience) / 100, 0, 1);
    // Two distinct mitigations, both apply: resilience is the BEHAVIOUR axis
    // (manner — unchanged this pass), toughness is the NEW defensive STAT
    // (percent softening, never to zero — слабый удар всё равно чуть проходит).
    hp = Math.max(0, hp - dmg * dmgMulFor(res01) * (1 - toughSoft));
    updateBar();
    if (hp <= 0) { eliminate(); return; } // → dissolve; onEliminated raised on completion
    play(HURT); // weighty recoil + core flash
    // Rhythm hitch added on top of the recoil scales with stagger resistance —
    // a tough fighter barely loses its tempo after eating a hit.
    ai.nextAt = Math.max(ai.nextAt, lastT + HURT.dur + (0.4 + Math.random() * 0.6) * stagMulFor(res01));
    // counter → chance to punish straight out of the recoil: press in + strike back fast.
    if (Math.random() < counter01 * 0.7) {
      nav.mode = 'press';
      nav.until = lastT + HURT.dur + 0.3;
      ai.nextAt = lastT + HURT.dur + 0.05;
    }
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
    // Commit a strike only when the foe is actually in reach: cap by STRIKE so a
    // far-spacing fighter steps in to land it instead of whiffing from its range.
    const reach = Math.min(character.range + RANGE_HYST, STRIKE);
    if (Math.hypot(dx, dz) > reach) return false;
    // ATTACK STYLE — weight-led (heavy01): light favours the single PUNCH almost
    // every time; heavy commits the DOUBLE / COMBO. Wider than before so the
    // light-flurry vs heavy-slam read is unmistakable on the grey stand.
    const r = Math.random();
    const punchW = lerp(0.82, 0.12, heavy01); // light → mostly singles · heavy → mostly DOUBLE/COMBO
    const atk = r < punchW ? PUNCH : r < punchW + 0.4 ? DOUBLE : COMBO;
    play(atk);
    // Cadence: tempo sets the base pause; WEIGHT rides on top so heavy lands rare,
    // heavy blows and light strings frequent, light ones (the "rare heavy vs
    // frequent light" read) even at equal tempo.
    const heavyPause = lerp(-0.12, 0.4, weight01); // light shortens · heavy lengthens the gap
    ai.nextAt = t + atk.dur + Math.max(0.06, lerp(0.85, 0.18, tempo01) + heavyPause) + Math.random() * lerp(0.9, 0.3, tempo01);
    // Follow-up after the strike — profile-driven: aggressive / sticky ones press
    // a flurry, the rest circle or bait out. Window starts as the clip ends.
    // (Never just hang motionless in the foe's face.) Initiative-led.
    const pressFollow = THREE.MathUtils.clamp(character.aggression * 0.6 + stickEff * 0.3, 0, 0.95);
    if (Math.random() < pressFollow) {
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
    if (onImpact) onImpact(strikeDamage({ dmgMult: B.moveMult.punch })); // punch-equivalent — static fallback still scales off strikePower
    // Cadence tracks tempo (+ a weight term) so the static fallback still reads
    // fast-light vs slow-heavy, matching the animated path.
    ai.nextAt = t + Math.max(0.1, lerp(1.0, 0.4, tempo01) + lerp(-0.15, 0.45, weight01)) + Math.random() * lerp(0.9, 0.4, tempo01);
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

    // Advance klich envelopes → live additive delta over the base axes + re-derive
    // the affected knobs. Runs in every alive state (incl. reduced motion: the
    // axis shift is fight logic, not animation).
    refreshKlich(t);

    // Selection highlight + confirm flash + a faint "effect active" marker — runs
    // in every alive state (a glow change only, no body motion). Soft pulse while
    // highlighted (static under reduced), a brighter decaying flash on confirm, a
    // faint tint while a klich is active. Intensity 0 when none → no lingering glow.
    {
      let ei = 0;
      if (klichActive) ei = reduced ? 0.13 : 0.1 + 0.06 * (0.5 + 0.5 * Math.sin(t * 3.0)); // effect-on marker
      if (highlighted) ei = reduced ? 0.5 : 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(t * 6.0));
      if (confirmAt >= 0) {
        const cu = (t - confirmAt) / CONFIRM_DUR;
        if (cu >= 1) confirmAt = -1;
        else ei = Math.max(ei, 1.2 * (1 - cu));
      }
      skin.emissiveIntensity = ei;
    }

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
            if (onImpact && foeInStrike()) onImpact(strikeDamage(clip)); // damage (force × move × jitter) only if the foe is in reach
          }
        }
      } else if (!clip.fired && clip.impact >= 0 && ct >= clip.impact) {
        clip.fired = true;
        if (onImpact && foeInStrike()) onImpact(strikeDamage(clip)); // damage (force × move × jitter) only if the foe is in reach
      }
      if (ct < clip.dur) {
        const v = sample(clip.keys, ct);
        apply(v);
        coreBoost = N(v.core);
      } else {
        clip = null;
        dodgeRun = null;
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

    // Cross-fade the live joints toward this frame's target pose so switching
    // idle ↔ move ↔ strike never snaps (steady modes write straight through).
    commitPose(dt);

    // Dodge displacement (visual only): slip the whole body off-line on the
    // dodge envelope and back to the start spot. Runs while a dodge clip plays;
    // never touches HP / hit resolution — the duck-guard pose blends via the
    // pose layer above, this just moves the group.
    if (clip && clip.dodge && dodgeRun) {
      const env = dodgeEnv(THREE.MathUtils.clamp((t - clipStart) / clip.dur, 0, 1));
      group.position.x = THREE.MathUtils.clamp(dodgeRun.bx + dodgeRun.wx * DODGE_DIST * env, -BX, BX);
      group.position.z = THREE.MathUtils.clamp(dodgeRun.bz + dodgeRun.wz * DODGE_DIST * env, -BZ, BZ);
    }

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

  // Apply the neutral-colour option if the fighter is built into the dev A/B
  // stand already in grey mode (kept in sync live via setNeutralColor too).
  if (neutralColor) setNeutralColor(true);

  return {
    group, update, setReducedMotion, setNeutralColor, setHighlight, confirmPulse, applyKlich, dispose,
    approach: () => play(APPROACH),
    punch: () => play(PUNCH),
    combo: () => play(COMBO),
    double: () => play(DOUBLE),
    hurt: () => play(HURT),
    dodge: () => play(DODGE),
    slow: () => toggleLoco('slow'),
    fast: () => toggleLoco('fast'),
    eliminate,
    takeDamage,
    getHp: () => hp,
    maxHp,
    stats, // боевой лист: { strikePower, toughness, mobility }
    setAI,
    toggleAI: () => setAI(!ai.on),
    isAI: () => ai.on,
    joints: { hips, torso, armL, armR, legL, legR },
  };
}
