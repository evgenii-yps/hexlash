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
import { INTENTIONS, INTENTION_SET, INTENTION_TICK_SEC, intentionProfile, chooseIntention } from '../data/intentions.js';
import { motionFor } from '../data/intentionMotion.js';
import { COMBAT_BALANCE, readDelaySec, readMissChance, readFalseChance, readWindupReactChance, readOpenReactChance } from '../data/combatBalance.js';
import { createHpIndicator } from './hpIndicator.js';

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
  // `brain` selects the intention-picker strategy ('spinal' = the deterministic
  // function in data/intentions.js, the default + always-on safety net; 'model' =
  // the hybrid that wakes a Claude call on fight BREAKS, spinal between them).
  // `getFightContext` (optional, like getFoePos) supplies the shared fight context
  // (escalation phase, …). `portrait` is the fighter's character in WORDS (core
  // manner + lit-facet phrases) — sent to the model, never raw axis numbers.
  // `requestModelIntention(payload) → Promise<{intention,read}|null>` is the
  // injected async call to the backend (kept out of this scene module so it never
  // imports the HTTP client / store). `getFoeStamina` / `getFoeHp01` (optional)
  // let the break detector + word memory observe the foe's wind / health.
  // `getFoePhase` (optional, like getFoeReacting) → the foe's CURRENT action phase
  // string ('windup' | 'commit' | 'recovery' | 'stagger' | 'neutral'); the reading
  // subsystem noises it by this fighter's counter (читать-навык) before acting.
  { side = 'player', coreId = null, behavior = null, maxHp = COMBAT_BALANCE.maxHp, onImpact, onMiss, onBlock, onAttackStart, onFeint, onInterrupt, onChargeRelease, onEliminated, getFoePos = null, getFoeReacting = null, getFightContext = null, getFoeStamina = null, getFoeHp01 = null, getFoePhase = null, bounds = { x: 2.5, z: 1.5 }, neutralColor = false, brain = 'spinal', portrait = [], requestModelIntention = null } = {},
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
  const head = box(torso, 0.26, 0.24, 0.24, 0, 0.8, 0); // head

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

  // --- Contact spark — a SHORT additive flash at the point a blow lands on THIS
  //     body (shown when struck). Transient (≈0.18s, fades to nothing) so it's a hit
  //     marker, NOT a second persistent glow. White core → transparent (pinkish edge)
  //     so it reads on any zone. Billboarded + faded in update.
  const sparkTex = makeRadialTexture('rgba(255,255,255,0.95)', pinkRgba(pink, 0), 0.32);
  const sparkMat = new THREE.MeshBasicMaterial({
    map: sparkTex, transparent: true, depthWrite: false, fog: false,
    blending: THREE.AdditiveBlending, opacity: 0,
  });
  const spark = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), sparkMat);
  spark.visible = false;
  group.add(spark);
  let sparkUntil = -1; // loop time the spark fades out (−1 = idle)
  const FLASH_DUR = COMBAT_BALANCE.hitFlashSec;
  const _sparkQ = new THREE.Quaternion(); // scratch — billboard the spark vs the group's facing
  // Show the spark at a WORLD contact point (converted into the group's local space).
  // Skipped under reduced motion (no animation there → no spark).
  const showHitFlash = (worldPoint) => {
    if (reduced || !worldPoint) return;
    group.updateWorldMatrix(true, false);
    spark.position.copy(group.worldToLocal(worldPoint.clone()));
    spark.visible = true;
    sparkUntil = lastT + FLASH_DUR;
  };

  // --- Over-head HP indicator (built in scene/hpIndicator.js). Percent readout
  //     (round(hp/maxHp*100)) + a 10-segment discrete bar + YOU/FOE tag, on a matte
  //     billboard. Player vs enemy by BRIGHTNESS only (different fill colour, not
  //     opacity). No glow/bloom. Redrawn ONLY when the rounded percent changes;
  //     billboard()'d each frame for a constant on-screen size. maxHp is read from
  //     state — the indicator works at any pool size.
  let hp = maxHp;
  const hpUI = createHpIndicator(side);
  group.add(hpUI.mesh);
  let lastPct = -1;
  let deadAt = -1; // set when HP hits 0 → plate held DEAD_HOLD_S, then hidden in update()
  const DEAD_HOLD_S = 1.0;
  // Redraw ONLY on a change of the rounded percent (not per frame / per raw-HP tick).
  const updateBar = () => {
    const pct = Math.round((Math.max(0, hp) / maxHp) * 100);
    if (pct === lastPct) return;
    lastPct = pct;
    hpUI.render(pct);
  };
  updateBar(); // initial draw (100)

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

  const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const easeOut = (u) => 1 - Math.pow(1 - u, 3);
  const E = { io: easeInOut, out: easeOut };

  // Keyframe value: hips z/y offsets, torso lean (tx) + twist (ty), each arm's
  // shoulder + elbow angles — left (lsx/lex) / right (rsx/rex) — and each leg's
  // hip + knee angles — left (lhx/lkx) / right (rhx/rkx), used by the kick clips.
  // Missing fields are 0, so a clip only lists what it uses (arm clips omit the
  // legs → 0). Segment i→i+1 is eased by key[i+1].e.
  const REST = {};
  const N = (x) => x || 0;
  const KEYS = ['hz', 'hy', 'tx', 'ty', 'lsx', 'lex', 'rsx', 'rex', 'lhx', 'lkx', 'rhx', 'rkx', 'core'];
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
    dur: 1.3, impact: 0.6, windup: 0.6, dmgMult: COMBAT_BALANCE.moveMult.punch, // single jab — base damage
    reach: COMBAT_BALANCE.strikeReach.punch, limb: 'armL', weight: COMBAT_BALANCE.moveWeight.punch,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.45, v: { hz: 0.02, hy: -0.02, tx: 0.12, lsx: 0.15, lex: 2.0 }, e: 'io' }, // coil / chamber
      { t: 0.6, v: { hz: -0.12, hy: -0.05, tx: -0.18, lsx: 1.5, lex: 0.05 }, e: 'out' }, // snap — extend
      { t: 0.74, v: { hz: -0.08, hy: -0.03, tx: -0.1, lsx: 1.35, lex: 0.16 }, e: 'out' }, // recoil
      { t: 1.3, v: REST, e: 'io' }, // weighty return
    ],
  };
  // INTERCEPT — a fast straight (right arm) used ONLY by the read-driven сбив: a
  // quick chamber → early snap (impact 0.2s, vs PUNCH's 0.6s) → quick return. The
  // short impact is what lets a REACTIVE strike land inside the foe's early-windup
  // vuln window (windup × interruptWindowFrac ≈ 0.3s) — a normal PUNCH is far too
  // slow to catch it after reading. So only a SHARP reader (small perception delay,
  // high counter) lands the сбив in time; a slow read arrives during the foe's
  // recovery (a normal trade) — the «иногда осознанно сбивает, растёт с counter»
  // behaviour falls out of the timing. Punch-equivalent damage; tagged windup so it
  // is itself briefly interruptible (fair). Plays under reduced motion like any clip.
  const INTERCEPT = {
    dur: 0.55, impact: 0.2, windup: 0.2, dmgMult: COMBAT_BALANCE.moveMult.punch,
    keys: [
      { t: 0.0, v: REST, e: 'out' },
      { t: 0.12, v: { hz: -0.04, hy: -0.02, tx: -0.06, rsx: 0.4, rex: 1.6 }, e: 'out' }, // quick chamber
      { t: 0.2, v: { hz: -0.14, hy: -0.05, tx: -0.16, rsx: 1.5, rex: 0.05 }, e: 'out' }, // snap — fast extend (impact)
      { t: 0.34, v: { hz: -0.06, hy: -0.02, tx: -0.08, rsx: 1.3, rex: 0.2 }, e: 'out' }, // recoil
      { t: 0.55, v: REST, e: 'io' }, // quick return to stance
    ],
  };
  // FEINT — a fake: the SAME opening coil/chamber as PUNCH (so the foe reads a
  // real threat) but it BREAKS OFF instead of extending — pull the fist back, quick
  // return to stance. No impact (impact: -1 → resolveImpact never runs), no contact,
  // no damage. Shorter than a full punch. `feint: true` tags the clip. Plays under
  // reduced motion like any clip (no jitter).
  const FEINT = {
    dur: 0.75, impact: -1, windup: 0.46, feint: true,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.32, v: { hz: 0.02, hy: -0.02, tx: 0.12, lsx: 0.15, lex: 2.0 }, e: 'io' }, // coil / chamber — IDENTICAL read to PUNCH's threat
      { t: 0.46, v: { hz: 0.05, hy: -0.01, tx: 0.05, lsx: 0.5, lex: 1.2 }, e: 'out' }, // break off — pull back instead of snapping out
      { t: 0.75, v: REST, e: 'io' }, // quick return to stance
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
    dur: 2.0, impact: 1.12, windup: 1.12, dmgMult: COMBAT_BALANCE.moveMult.combo, // one heavy commit — the most painful single hit
    reach: COMBAT_BALANCE.strikeReach.combo, limb: 'armL', weight: COMBAT_BALANCE.moveWeight.combo,
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
    dur: 1.45, impacts: [0.32, 0.58], windup: 0.32, dmgMult: COMBAT_BALANCE.moveMult.doubleEach, // two hits — each uses this mult, EACH stronger than a jab (≈2.7× a punch summed)
    reach: COMBAT_BALANCE.strikeReach.double, limbs: ['armL', 'armR'], weight: COMBAT_BALANCE.moveWeight.double, // L jab then R cross — tip per impact

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

  // STAGGER — interrupt reaction («сбили»): one short readable jolt — knocked off
  // balance, thrown off-rhythm, quick recovery. No impact, no `windup` (it can't
  // itself be interrupted). Length = staggerDurationSec so the clip covers the
  // lock. Plays via the same pose/clip layer (smooth in/out); reduced motion shows
  // a static jolt pose (see update()).
  const STAGGER = (() => {
    const d = COMBAT_BALANCE.staggerDurationSec;
    return {
      dur: d,
      keys: [
        { t: 0.0, v: REST, e: 'out' },
        { t: d * 0.16, v: { hz: 0.16, hy: -0.04, tx: 0.16, core: 0.5 }, e: 'out' }, // jolt back + core flicker
        { t: d * 0.5, v: { hz: 0.07, hy: -0.02, tx: 0.06, core: -0.2 }, e: 'io' }, // off-rhythm
        { t: d, v: REST, e: 'io' }, // recover to stance
      ],
    };
  })();

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

  // --- KICKS (straight, forward — RIGHT leg). Driven on the EXISTING hip + knee
  //     joints only (no pelvis twist / new axes — side / spinning kicks are deferred
  //     as expensive). Same clip mechanic + damage path as the punches (dmgMult →
  //     resolveImpact). Sign on the right leg: rhx > 0 raises the thigh forward/up
  //     (toward −Z, the foe); rkx < 0 flexes the knee (shin folded), rkx → 0 extends
  //     the shin. Phases замах → контакт → возврат read in ~0.5s. These are TRIGGERS
  //     only (f.frontKick / f.teep / f.knee) — NOT wired into the autonomous picker.
  //
  // FRONT KICK — chamber the knee up, snap the shin straight out, retract.
  const FRONT_KICK = {
    dur: 0.55, impact: 0.28, windup: 0.28, dmgMult: COMBAT_BALANCE.moveMult.frontKick,
    reach: COMBAT_BALANCE.strikeReach.frontKick, limb: 'legR', weight: COMBAT_BALANCE.moveWeight.frontKick,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.16, v: { hz: 0.05, hy: -0.02, tx: 0.12, rhx: 1.0, rkx: -1.6 }, e: 'io' }, // chamber — knee up, shin folded
      { t: 0.28, v: { hz: 0.08, hy: -0.03, tx: 0.16, rhx: 1.15, rkx: -0.1 }, e: 'out' }, // snap — shin extends forward (impact)
      { t: 0.4, v: { hz: 0.06, hy: -0.02, tx: 0.1, rhx: 1.0, rkx: -0.5 }, e: 'out' }, // recoil — shin re-bends
      { t: 0.55, v: REST, e: 'io' }, // leg down, weighty return
    ],
  };
  // TEEP (push kick) — lower chamber, drive the sole straight forward (a shove),
  // hold the push a beat, retract. Flatter, less snap than the front kick.
  const TEEP = {
    dur: 0.5, impact: 0.26, windup: 0.26, dmgMult: COMBAT_BALANCE.moveMult.teep,
    reach: COMBAT_BALANCE.strikeReach.teep, limb: 'legR', weight: COMBAT_BALANCE.moveWeight.teep,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.14, v: { hz: 0.06, hy: -0.02, tx: 0.1, rhx: 0.7, rkx: -1.3 }, e: 'io' }, // chamber lower — push prep
      { t: 0.26, v: { hz: 0.12, hy: -0.03, tx: 0.18, rhx: 0.95, rkx: -0.05 }, e: 'out' }, // thrust — drive the foot forward (impact)
      { t: 0.34, v: { hz: 0.12, hy: -0.03, tx: 0.18, rhx: 0.98, rkx: 0.0 }, e: 'io' }, // hold the push (the shove)
      { t: 0.5, v: REST, e: 'io' }, // retract
    ],
  };
  // KNEE — drive the knee up-forward; the KNEE leads, the shin stays folded.
  const KNEE = {
    dur: 0.45, impact: 0.22, windup: 0.22, dmgMult: COMBAT_BALANCE.moveMult.knee,
    reach: COMBAT_BALANCE.strikeReach.knee, limb: 'legR', weight: COMBAT_BALANCE.moveWeight.knee,
    keys: [
      { t: 0.0, v: REST, e: 'io' },
      { t: 0.12, v: { hz: 0.04, hy: -0.02, tx: 0.1, rhx: 0.5, rkx: -1.4 }, e: 'io' }, // load — slight lift, shin tucked
      { t: 0.22, v: { hz: 0.1, hy: -0.04, tx: 0.2, rhx: 1.35, rkx: -1.7 }, e: 'out' }, // drive knee up-forward (impact)
      { t: 0.32, v: { hz: 0.07, hy: -0.03, tx: 0.13, rhx: 1.0, rkx: -1.5 }, e: 'out' }, // recoil
      { t: 0.45, v: REST, e: 'io' }, // leg down
    ],
  };

  // --- BEING-HIT zone reactions (defender). SHORT recoils picked by the struck zone
  //     — they DON'T lock the loop (no `windup`, brief; the ai.nextAt hitch in
  //     takeDamage paces the next move). A strong hit also shoves the body back a step
  //     (reactRun, applied in update). Light hit = the clip alone (короткий вздрог).
  // HEAD — the head whips back (torso pitches back, hips give).
  const REACT_HEAD = {
    dur: 0.42, impact: -1,
    keys: [
      { t: 0.0, v: REST, e: 'out' },
      { t: 0.07, v: { hz: 0.14, hy: -0.03, tx: 0.26, core: 0.7 }, e: 'out' }, // snap back
      { t: 0.18, v: { hz: 0.1, hy: -0.02, tx: 0.14, core: 0 }, e: 'io' },
      { t: 0.42, v: REST, e: 'io' }, // recover
    ],
  };
  // BODY — осадило: the hips cave back + sink, torso folds then settles.
  const REACT_BODY = {
    dur: 0.45, impact: -1,
    keys: [
      { t: 0.0, v: REST, e: 'out' },
      { t: 0.08, v: { hz: 0.16, hy: -0.07, tx: -0.06, core: 0.6 }, e: 'out' }, // caves in, sinks
      { t: 0.2, v: { hz: 0.12, hy: -0.04, tx: 0.04, core: 0 }, e: 'io' },
      { t: 0.45, v: REST, e: 'io' },
    ],
  };
  // FOREARM — подбито/прикрылся: the guard is knocked up + in, little hip give.
  const REACT_GUARD = {
    dur: 0.5, impact: -1,
    keys: [
      { t: 0.0, v: REST, e: 'out' },
      { t: 0.07, v: { hz: 0.05, tx: 0.05, lsx: 0.5, lex: 1.7, rsx: 0.5, rex: 1.7, core: 0.4 }, e: 'out' }, // guard jolts up
      { t: 0.22, v: { hz: 0.03, tx: 0.03, lsx: 0.4, lex: 1.5, rsx: 0.4, rex: 1.5 }, e: 'io' },
      { t: 0.5, v: REST, e: 'io' },
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
  const SLOW = { speed: 0.92, accel: 3.0, decel: 4.0, swing: 0.5, knee: 0.78, arm: 0.4, lean: -0.05, bob: 0.035, twist: 0.05 };
  const FAST = { speed: 2.0, accel: 8.0, decel: 6.5, swing: 0.66, knee: 1.0, arm: 0.55, lean: -0.16, bob: 0.055, twist: 0.07 };
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
  const CONTACT = 0.74; // hard minimum — bodies never interpenetrate (closer in-fighting)
  const CONTACT_SOFT = 0.9; // soft buffer above CONTACT — ease back here (no grinding)
  const FAR = 1.9; // far edge of the approach band — arc straightens as the gap closes (tighter neutral spacing)
  const STRIKE = 1.7; // legacy coarse radius (per-move reach gates the actual contact now)
  const TURN_RATE = 3.5; // facing turn speed (rad/s) — deliberate доворот, no snap

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
  //     The intention layer lays a temporary additive delta over the base axes
  //     (distance / initiative / tempo / stick) — see the intention block below;
  //     the knobs those axes drive (range, aggression, stickEff, effTempo01) are
  //     re-derived each frame from base + delta, so the base is never mutated.
  const ax = (behavior && behavior.axes) || resolveBehavior(coreId).axes;
  const n01 = (v) => THREE.MathUtils.clamp(v, 0, 100) / 100;
  const lerp = THREE.MathUtils.lerp;
  const jit = (amp) => (Math.random() * 2 - 1) * amp; // ±amp bounded liveliness

  const RANGE_NEAR = 0.82; // distance=0  → in-fighter, almost on contact (circles + strikes from here)
  const RANGE_FAR = 1.45; //  distance=100 → spacing fighter (lowered again — closer neutral, steps in to strike)
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
    // ТОЧНОСТЬ — shared base; `sb.accuracy` is the seam a future "sharper on
    // entry" facet hooks (no facet moves it yet → undefined → base). Drives the
    // attacker's per-impact miss chance (missChance below).
    accuracy: Math.round(B.accuracy * (1 + (sb.accuracy || 0))),
    // BLOCK — defender's block STRENGTH (fraction cut while in stance) + the
    // attacker's block PIERCE. Shared bases; `sb.*` are the seams future facets
    // hook (a block strengthener / ТАРАН-2 pierce) — none wired yet. Strength is
    // multiplicative (a facet raises it); pierce is additive (base 0, so a facet
    // can lift it off zero).
    blockMitigation: B.blockMitigation * (1 + (sb.blockMitigation || 0)),
    blockPenetration: B.blockPenetration + (sb.blockPenetration || 0),
    // CHARGE — per-fighter seams under the future HUNT / STING grains (ОХОТА:
    // «копит в маневрировании»; ЖАЛО: «дольше ждёт — сильнее», «пробивает любую
    // защиту»). Shared bases; `sb.*` undefined → base. Capacity, accrual rate, and
    // both release ceilings are tunable per fighter. None wired to grains yet.
    chargeMax: B.chargeMax * (1 + (sb.chargeMax || 0)),
    chargeGainPerSec: B.chargeGainPerSec * (1 + (sb.chargeGain || 0)),
    chargePowerBonusMax: B.chargePowerBonusMax * (1 + (sb.chargePower || 0)),
    chargePenetrationBonusMax: B.chargePenetrationBonusMax * (1 + (sb.chargePen || 0)),
  };
  // ТАРАН-3 «почти не сбивается» — interrupt-resistance SEAM (new this pass). The
  // early-windup interrupt mechanic is unchanged; this only scales the LENGTH of
  // this fighter's vulnerable window: sb.interruptResist 0 → full window (base),
  // 1 → no window (uninterruptible). Fed by a ram facet via statBonuses; every
  // other fighter sums 0 → base. Read in play() where the window is set.
  const interruptVulnFrac = B.interruptWindowFrac * (1 - THREE.MathUtils.clamp(sb.interruptResist || 0, 0, 1));
  // --- Stamina (запас сил) — spent on actions, recovered at rest; low stamina
  //     SMOOTHLY weakens + slows attacks (a curve, not a hard lockout). Starts
  //     full. Read externally (getStamina* in the return) — the seam ТЕНЬ-3 «враг
  //     выматывается, гоняясь» reads a foe's stamina (chasing already drains it,
  //     see the move cost in stepLocomotion; the facet later amplifies). SEAM: a
  //     future «копит заряд» (ОХОТА/ЖАЛО) charge stat hooks alongside this — NOT
  //     built. SEAM: fatigue could later also cut dodge / block — left UNWIRED
  //     (see takeDamage) so the fight isn't penalised on every axis at once. All
  //     numbers in combatBalance.js.
  const staminaMax = B.staminaMax;
  let stamina = staminaMax; // start full
  const stamina01 = () => stamina / staminaMax;
  // БАСТИОН-3 «дыхание» — per-fighter stamina-regen rate (sb.staminaRegen, base 0):
  // a bulwark recovers its wind faster in the rest/stance lulls. «Дыхание» = stamina,
  // NOT HP. Only a bastion facet raises it; everyone else → shared base rate.
  const staminaRegenRate = B.staminaRegenPerSec * (1 + (sb.staminaRegen || 0));
  // Power: full → ×1, empty → floor. Cadence: full → ×1 pause, empty → ×stretchMax
  // (реже бьёт). Both smooth over the curve; floors keep a spent fighter weak-but-
  // active so the bout still finishes (escalation closes any drag).
  const staminaPowerMul = () => B.staminaPowerFloor + (1 - B.staminaPowerFloor) * Math.pow(stamina01(), B.staminaPenaltyCurve);
  const staminaCadenceMul = () => 1 + (B.staminaCadenceStretchMax - 1) * Math.pow(1 - stamina01(), B.staminaPenaltyCurve);
  const attackStaminaCost = (atk) => (atk === COMBO ? B.staminaCostCombo : atk === DOUBLE ? B.staminaCostDouble : B.staminaCostPunch);

  // Outgoing strike damage as a FRACTION of the TARGET's max HP (NOT an absolute),
  // so HP scaling never rebalances the fight: damageFracBase (neutral punch share)
  // × this fighter's strikePower vs base (so the grade % bonuses read) × move mult
  // × УСТАЛОСТЬ × джиттер (low stamina weakens the hit, evaluated at impact time).
  // The defender multiplies by ITS OWN maxHp and softens by toughness / block /
  // dodge on its side (takeDamage).
  const strikeDamage = (c) => B.damageFracBase * (stats.strikePower / B.strikePower) * (c.dmgMult || 0) * staminaPowerMul() * (1 + jit(B.jitter));
  // Toughness softening — PERCENT mitigation, saturating, never to zero (a weak
  // hit still chips through). Constant per fighter this pass (stats don't change
  // mid-bout yet); incoming damage is multiplied by (1 − toughSoft) in takeDamage.
  const toughSoft = stats.toughness / (stats.toughness + B.toughnessK);
  // Accuracy → per-impact MISS chance (the ATTACKER's own fault, rolled BEFORE
  // the defender's dodge and independent of it). High accuracy → almost never
  // misses, low → misses more; clamped [floor, cap] so a sloppy fighter still
  // lands enough (the bout always finishes). Constant per fighter (accuracy
  // doesn't change mid-bout); rolled per impact, so DOUBLE / COMBO rolls each hit.
  const missChance = THREE.MathUtils.clamp(
    B.missChanceBase + ((B.accuracyMid - stats.accuracy) / 100) * B.accuracyMissSwing,
    B.missChanceFloor, B.missChanceCap,
  );
  const rollMiss = () => Math.random() < missChance;
  // resilience → incoming-damage / stagger multipliers, derived in takeDamage
  // from the fighter's resilience axis (manner — constant this pass).
  const dmgMulFor = (res01) => lerp(1.15, 0.38, res01); // glass takes more · floor 0.38 (was 0.6) so max resilience at peak ~halves incoming vs a neutral fighter
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
  // `aggression` are re-derived each frame from the effective (base + intention)
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
  // Initial range + aggression from the base profile (refreshed each frame).
  character.range = THREE.MathUtils.clamp(lerp(RANGE_NEAR, RANGE_FAR, n01(ax.distance)) + character.rangeJit, CONTACT_SOFT, FAR - 0.2);
  character.aggression = THREE.MathUtils.clamp(n01(ax.initiative) + character.aggrJit, 0, 1);

  // --- Effective-axis layer. The fighter's BASE axes are never mutated; the
  //     intention layer (below) lays an additive delta over them, and each frame
  //     refreshAxes() composes base + intention delta into the knobs the body
  //     reads — range / aggression / stickEff / effTempo01. Keeping the base
  //     untouched means the fighter returns to its temperament EXACTLY when an
  //     intention's delta clears. Runs in reduced motion too (the axis shift is
  //     fight logic, not animation).
  const baseAx = ax;
  let stickEff = stick01; // live stick (base + intention delta), refreshed each frame
  const refreshAxes = () => {
    // накал (stalemate safeguard): a GLOBAL forward + aggression pull, rising with
    // escalation01 (0..1, time WITHOUT a clean exchange — see combatBalance escalate*),
    // laid on top of base + intention the SAME way the temperament is. 0 in normal,
    // actively-trading play; at full накал it drags BOTH fighters into the clash that
    // the picker (escalation01 → PRESS / STRIKE bias) has already chosen.
    const fc = getFightContext && getFightContext();
    const esc01 = (fc && fc.escalation01) || 0;
    const escFwd = B.escalateForwardMax * esc01; // distance ↓ → closer range
    const escAggr = B.escalateAggroMax * esc01; // aggression ↑
    // Effective axes = BASE + INTENTION delta (distance / initiative / stick /
    // tempo) + накал pull. Composing here means range / aggression / stick / cadence
    // are the single derived knobs the body reads; the base axes stay untouched.
    const effDist = THREE.MathUtils.clamp(baseAx.distance + intentionDelta.distance - escFwd, 0, 100);
    const effInit = THREE.MathUtils.clamp(baseAx.initiative + intentionDelta.initiative, 0, 100);
    stickEff = THREE.MathUtils.clamp((baseAx.stick + intentionDelta.stick) / 100, 0, 1);
    effTempo01 = THREE.MathUtils.clamp((baseAx.tempo + intentionDelta.tempo) / 100, 0, 1);
    character.range = THREE.MathUtils.clamp(lerp(RANGE_NEAR, RANGE_FAR, effDist / 100) + character.rangeJit, CONTACT_SOFT, FAR - 0.2);
    character.aggression = THREE.MathUtils.clamp(effInit / 100 + escAggr + character.aggrJit, 0, 1);
  };

  // --- Intention layer (the "spinal cord", future-model seam). Once every
  //     INTENTION_TICK_SEC the fighter picks ONE of 7 intentions via the single
  //     seam chooseIntention(self, foe, memory, fight, brain); the body works in
  //     that mode until the next pick (held between ticks). An intention is a MODE,
  //     expressed as an additive delta over the BASE axes (distance / initiative /
  //     tempo / stick) composed in refreshAxes, PLUS
  //     attack / guard / charge flags the existing reflexes read (decideAttack,
  //     noteIncomingAttack, decideRelease). The body executes the mode with the
  //     SAME sb.* mechanics and never learns WHY it was chosen — swap brain to
  //     'model' and only chooseIntention changes. The spinal cord is deterministic
  //     (no random), so replay is stable.
  const intentionDelta = { distance: 0, initiative: 0, tempo: 0, stick: 0 };
  const intentionFlags = { attack: 'free', guard: 0, charge: 'free' };
  let intentionId = INTENTIONS.HOLD;
  let intentionNextAt = 0; // loop time the next pick fires (INTENTION_TICK_SEC apart)
  let effTempo01 = tempo01; // base tempo + intention delta (refreshed in refreshAxes), read by the strike cadence
  // DEV: lock the fighter to one intention to inspect its signature in isolation.
  // When set, the picker (spinal/model + hard needs) is bypassed entirely — the
  // body executes EXACTLY this intention. null = off (normal picking).
  let intentionLock = null;
  // Short ring of OBSERVED foe events (attack / miss), newest last — the memory
  // the picker reads. The model leans on it; the spinal cord uses it lightly.
  const FOE_MEMORY_MAX = 8;
  const foeMemory = [];
  const rememberFoe = (type) => {
    foeMemory.push({ t: lastT, type });
    if (foeMemory.length > FOE_MEMORY_MAX) foeMemory.shift();
  };
  // Apply a chosen intention → its body-mode delta + flags. refreshAxes folds the
  // delta into range / aggression / stick / tempo each frame; the flags are read
  // by the strike / guard / charge reflexes.
  const applyIntention = (id) => {
    intentionId = id;
    const p = intentionProfile(id);
    const a = p.axes || {};
    intentionDelta.distance = a.distance || 0;
    intentionDelta.initiative = a.initiative || 0;
    intentionDelta.tempo = a.tempo || 0;
    intentionDelta.stick = a.stick || 0;
    intentionFlags.attack = p.attack || 'free';
    intentionFlags.guard = p.guard || 0;
    intentionFlags.charge = p.charge || 'free';
  };
  applyIntention(intentionId); // start neutral (HOLD); the first tick re-picks
  // DEV: lock to one intention (id) or release (null). Locked → applied at once and
  // held; tickIntention + the model brain skip while locked, so the body shows that
  // one signature in isolation with no picker / hard-need interference.
  const setIntentionLock = (id) => { intentionLock = id || null; if (intentionLock) applyIntention(intentionLock); };
  // ~1/sec pick: snapshot self / foe / memory / fight, route through the brain
  // seam, apply the result (null → keep the current mode). Gated to ai.on by the
  // caller. Reads BASE axes for the temperament gravity (not the eff values — that
  // would feed the choice back on itself); the deltas it lays affect the BODY.
  const tickIntention = (t) => {
    if (intentionLock) { intentionNextAt = t + INTENTION_TICK_SEC; return; } // DEV lock → never re-pick (already applied)
    if (t < intentionNextAt) return;
    intentionNextAt = t + INTENTION_TICK_SEC;
    const f = getFoePos && getFoePos();
    const dist = f ? Math.hypot(f.x - group.position.x, f.z - group.position.z) : Infinity;
    const self = {
      ax01: {
        distance: n01(baseAx.distance), initiative: n01(baseAx.initiative),
        tempo: tempo01, weight: weight01, stick: stick01,
        resilience: n01(baseAx.resilience), counter: counter01, slip: slip01,
      },
      hp01: hp / maxHp,
      stamina01: stamina01(),
      charge01: charge / stats.chargeMax,
      blocking,
      staggered: lastT < staggerUntil,
      range: character.range,
      current: intentionId,
      // Last valid model answer (model brain) — held until the next break replaces
      // it, expires via MODEL_ANSWER_TTL as a backstop. null under spinal / before
      // the first answer; chooseIntentionModel reads it (hard needs still win).
      model: lastModelAnswer ? { intention: lastModelAnswer.intention, read: lastModelAnswer.read, fresh: (lastT - lastModelAnswer.at) < MODEL_ANSWER_TTL } : null,
    };
    const foe = {
      has: !!f,
      dist,
      inStrike: dist <= STRIKE,
      reacting: !!(getFoeReacting && getFoeReacting()),
      phase: perceivedPhase, // PERCEIVED foe action phase (noised read, not ground truth) — picker leans CATCH on a read
    };
    const fc = getFightContext && getFightContext();
    const fight = { t, escalation: (fc && fc.escalation) || 1, escalation01: (fc && fc.escalation01) || 0 };
    const picked = chooseIntention(self, foe, foeMemory, fight, brain);
    if (picked) applyIntention(picked); // model may return null → keep the held mode (no freeze)
  };

  // --- Model brain (hybrid). Under brain='model' the body wakes a Claude call on
  //     fight BREAKS, not every tick — between breaks it lives on the spinal cord,
  //     and the spinal HARD NEEDS fire instantly regardless of the model (see
  //     chooseIntentionModel). A break fires an ASYNC request; while it's in flight
  //     the fighter holds its current intention. When a valid answer lands it's
  //     cached (lastModelAnswer) and the next tick applies it; an invalid / late /
  //     errored answer is ignored → stay on spinal. Cooldown + per-bout ceiling are
  //     the wallet guard. NONE of this runs under brain='spinal' (zero requests).
  const MODEL_COOLDOWN_SEC = 3; // min gap between model wakes (anti-chatter at a threshold)
  const MODEL_MAX_REQUESTS = 12; // hard ceiling of model calls per bout (wallet safety)
  const MODEL_ANSWER_TTL = 10; // s — a held answer expires as a backstop if breaks stop firing
  const HP_BREAK_FRAC = 0.30; // first dip below 30% HP → a break
  const STAM_BREAK_FRAC = 0.30; // wind collapse below 30% → a break
  let lastModelAnswer = null; // { intention, read, at } — read by the self snapshot
  let modelReqSeq = 0; // bumped per request + on reset; a resolving request whose seq is stale is ignored
  let modelPending = false; // a request is in flight (no overlap)
  let modelCooldownUntil = 0; // loop time the next wake is allowed
  let modelRequestsThisBout = 0; // count this bout (vs MODEL_MAX_REQUESTS)
  // Break-edge tracking (one-shots + transients).
  let modelBoutStarted = false; // bout-start break fired once
  let selfHpBroke = false; let foeHpBroke = false; // HP-dip one-shots
  let selfStamBroke = false; let foeStamBroke = false; // wind-collapse one-shots
  let foeApproaching = null; // latched foe-manner state (true=closing, false=opening); flip → break
  let foeCloseEMA = 0; // smoothed foe approach signal (sign-based, deadbanded)
  let foeLastDist = null; // previous foe distance (for the manner trend)
  let modelWarned = false; // one-time guard so a broken endpoint logs ONCE, not per frame
  // Any model-brain failure (sync or async) funnels here: log once, then the
  // fighter silently stays on the spinal cord. Never rethrows — the fight frame
  // and the route must survive any model/endpoint outcome.
  const warnModelOnce = (e) => {
    if (modelWarned) return;
    modelWarned = true;
    try { console.warn('[arena] model brain unavailable — staying on spinal cord', e); } catch (_) { /* noop */ }
  };

  // Word helpers — the model gets the situation in WORDS, never raw axis numbers.
  const hpWord = (f01) => (f01 == null ? 'unknown' : f01 > 0.66 ? 'healthy' : f01 > 0.30 ? 'hurt' : 'near death');
  const stamWord = (s01) => (s01 == null ? 'unknown' : s01 > 0.6 ? 'fresh' : s01 > 0.3 ? 'winded' : 'spent');
  const chargeWord = (c01) => (c01 >= 0.85 ? 'loaded' : c01 > 0.15 ? 'building' : 'none');
  const rangeWord = (dist) => {
    if (dist == null || !isFinite(dist)) return 'out of sight';
    if (dist <= STRIKE * 0.7) return 'in close';
    if (dist <= character.range + RANGE_HYST) return 'at fighting range';
    return 'out of reach';
  };
  const mannerWord = () => (foeApproaching === true ? 'pressing in' : foeApproaching === false ? 'backing off' : 'holding range');
  const phaseWord = (fc) => {
    const esc = (fc && fc.escalation) || 1;
    const el = (fc && fc.elapsed) || 0;
    if (esc > 1.05) return 'dragging long (sudden death)';
    if (el < 8) return 'opening';
    if (el < 25) return 'mid-fight';
    return 'endgame';
  };
  // Recent foe behaviour → words (the picker's memory; the model leans on it).
  const memoryWords = (t, foeStam01) => {
    const out = [];
    const recent = foeMemory.filter((e) => t - e.t < 6);
    const atk = recent.filter((e) => e.type === 'attack').length;
    const miss = recent.filter((e) => e.type === 'miss').length;
    if (atk >= 4) out.push('the foe has been attacking relentlessly');
    else if (atk >= 1) out.push('the foe landed a few strikes');
    if (miss >= 2) out.push('the foe has been missing / whiffing');
    if (foeApproaching === true) out.push('the foe keeps pressing forward');
    else if (foeApproaching === false) out.push('the foe keeps backing off');
    if (foeStam01 != null && foeStam01 < 0.3) out.push('the foe looks winded');
    return out;
  };

  // Build the WORD payload posted to the backend (no raw axes / numbers).
  const buildModelPayload = (trigger) => {
    const f = getFoePos && getFoePos();
    const dist = f ? Math.hypot(f.x - group.position.x, f.z - group.position.z) : Infinity;
    const foeStam01 = getFoeStamina ? getFoeStamina() : null;
    const foeHp01 = getFoeHp01 ? getFoeHp01() : null;
    const fc = getFightContext && getFightContext();
    return {
      portrait, // character in words (static — core manner + lit-facet phrases)
      self: {
        hp: hpWord(hp / maxHp),
        stamina: stamWord(stamina01()),
        charge: chargeWord(charge / stats.chargeMax),
        stance: blocking ? 'guarding' : 'open',
        current: (intentionId || '').toUpperCase(),
      },
      foe: {
        range: rangeWord(dist),
        manner: mannerWord(),
        guard: getFoeReacting && getFoeReacting() ? 'guarding / evading' : 'open',
        hp: hpWord(foeHp01),
        stamina: stamWord(foeStam01),
      },
      memory: memoryWords(lastT, foeStam01),
      phase: phaseWord(fc),
      trigger,
    };
  };

  // Fire the async model request for a break (guarded by cooldown + ceiling +
  // no-overlap upstream). A stale / late / errored / invalid answer is ignored;
  // a valid one is cached and applied by the next tick.
  const fireModelRequest = (t, trigger) => {
    modelPending = true;
    modelRequestsThisBout += 1;
    modelCooldownUntil = t + MODEL_COOLDOWN_SEC;
    const seq = ++modelReqSeq;
    let payload;
    try { payload = buildModelPayload(trigger); } catch (e) { modelPending = false; warnModelOnce(e); return; }
    // requestModelIntention is called INSIDE the promise chain, so even a
    // synchronous throw from the injected fn becomes a rejection routed to .catch.
    // Every outcome — resolve with junk, reject, throw — ends on the spinal cord;
    // nothing here can crash the frame or change the route.
    Promise.resolve()
      .then(() => requestModelIntention(payload))
      .then((res) => {
        modelPending = false;
        if (seq !== modelReqSeq || state !== 'alive') return; // superseded (reset/late) or dead → drop
        const id = res && typeof res.intention === 'string' ? res.intention.toLowerCase() : null;
        if (id && INTENTION_SET.has(id)) lastModelAnswer = { intention: id, read: (res.read || ''), at: lastT };
        // invalid / empty / junk answer → keep spinal (don't cache), no crash
      })
      .catch((e) => { modelPending = false; warnModelOnce(e); }); // timeout / 503 / 4xx-5xx / network / bad JSON → stay on spinal
  };

  // Break detector — runs each alive frame under brain='model'. Returns the
  // trigger word for the strongest fresh break, or null. Edge-tracks one-shots
  // (bout start, HP dip, wind collapse) and transients (foe manner flip).
  const detectBreak = (t, dt) => {
    // (1) bout start — one request to open.
    if (!modelBoutStarted) { modelBoutStarted = true; return 'the bout has begun'; }
    const f = getFoePos && getFoePos();
    const dist = f ? Math.hypot(f.x - group.position.x, f.z - group.position.z) : Infinity;
    // (4) foe manner flip (closing ↔ backing off) — smoothed + deadbanded so a
    //     wobble at range doesn't burn requests.
    if (f && foeLastDist != null && dt > 1e-4) {
      foeCloseEMA = foeCloseEMA * 0.9 + Math.sign(foeLastDist - dist) * 0.1; // +closing / −opening
    }
    if (f) foeLastDist = dist;
    let mannerFlip = null;
    if (foeCloseEMA > 0.25 && foeApproaching !== true) { mannerFlip = foeApproaching === null ? null : 'the foe switched to pressing in'; foeApproaching = true; }
    else if (foeCloseEMA < -0.25 && foeApproaching !== false) { mannerFlip = foeApproaching === null ? null : 'the foe switched to backing off'; foeApproaching = false; }
    // (2) first HP dip below threshold (self or foe).
    if (!selfHpBroke && hp / maxHp < HP_BREAK_FRAC) { selfHpBroke = true; return 'your health just dropped low'; }
    const foeHp01 = getFoeHp01 ? getFoeHp01() : null;
    if (!foeHpBroke && foeHp01 != null && foeHp01 < HP_BREAK_FRAC) { foeHpBroke = true; return "the foe's health just dropped low"; }
    // (3) wind collapse below threshold (self or foe).
    if (!selfStamBroke && stamina01() < STAM_BREAK_FRAC) { selfStamBroke = true; return 'your wind just gave out'; }
    const foeStam01 = getFoeStamina ? getFoeStamina() : null;
    if (!foeStamBroke && foeStam01 != null && foeStam01 < STAM_BREAK_FRAC) { foeStamBroke = true; return 'the foe just ran out of wind'; }
    if (mannerFlip) return mannerFlip;
    return null;
  };

  // Per-frame model tick: detect a break, and if one fires (and we're allowed),
  // wake the model. Gated to brain='model' + an injected request fn by the caller.
  // Wrapped whole so a throw ANYWHERE on the model path (break detection, payload
  // build, firing) can never crash the fight frame — it degrades to spinal.
  const tickModelBrain = (t, dt) => {
    try {
      const trigger = detectBreak(t, dt);
      if (!trigger) return;
      if (modelPending || t < modelCooldownUntil || modelRequestsThisBout >= MODEL_MAX_REQUESTS) return; // wallet / anti-chatter guards
      fireModelRequest(t, trigger);
    } catch (e) {
      warnModelOnce(e); // any model-brain error → swallow, stay on spinal, never crash the frame
    }
  };

  const loco = { active: false, type: 'slow' }; // dev SLOW/FAST preview toggle
  // AI manoeuvre state.
  const nav = { mode: 'circle', until: 0, foe: null, approachAngle: 0, reaimAt: 0 };

  // --- Block stance (defensive guard) — a real body ability, independent of the
  //     reflex that decides to raise it (below). `blocking` is the live state;
  //     while it's true a LANDED hit is softened in takeDamage. `blockUntil` auto-
  //     drops a reflex stance after its hold; Infinity = held until released (the
  //     dev toggle). Entering / leaving only flips the pose producer (blockPose),
  //     so the existing cross-fade eases the guard in / out.
  let blocking = false;
  let blockUntil = 0; // loop time the reflex stance ends (Infinity = manual hold)
  const enterBlock = (holdSec = Infinity) => {
    if (state !== 'alive') return;
    blocking = true;
    blockUntil = holdSec === Infinity ? Infinity : lastT + holdSec;
  };
  const exitBlock = () => { blocking = false; blockUntil = 0; };
  const setBlock = (b) => { if (b) enterBlock(Infinity); else exitBlock(); }; // dev toggle — manual hold

  // --- Feint (обманный удар) — a real ability (the FEINT clip + bait/advantage
  //     windows + payoff), built clean; the DECISION to feint is the throwaway
  //     reflex below (decideFeint, TEMPORARY). `feintActive` is readable (the seam
  //     future ФИНТ-branch grains hook — recognisability only, NOT wired). The
  //     windows: after a feint we watch feintBaitUntil for the foe to react; if it
  //     bites, feintAdvUntil opens; a real strike launched in it sets
  //     feintPayoffActive, which boosts that strike's block-pierce + damage in
  //     resolveImpact. Numbers in combatBalance.js.
  let feintActive = false; // a feint is in play (readable — ФИНТ-branch seam)
  let feintBaitUntil = 0; // window watching for the foe's reaction (loop time)
  let feintBaited = false; // foe took the bait
  let feintAdvUntil = 0; // advantage window for the punisher (loop time)
  let feintPayoffActive = false; // the current real-attack clip carries the payoff
  // Riposte window — one source-agnostic answer-back. A defensive WIN arms it and
  // stores the bonus; the fighter's next strike inside the window hits harder, then
  // consumes it. Three triggers feed the SAME window: a block (ВОЛНОЛОМ sb.blockCounter,
  // заход 3), a dodge (КАПКАН/ТЕНЬ sb.dodgeCounter), a foe whiff (КАПКАН sb.missCounter).
  // The reactive activation of the dormant dodge / onMiss hooks — self-contained here.
  let riposteUntil = 0; // loop time the riposte bonus is available (0 = none)
  let riposteBonus = 0; // damage bonus stored when the window was armed
  const armRiposte = (amt) => { if (amt) { riposteUntil = lastT + B.riposteWindowSec; riposteBonus = amt; } }; // arm from any trigger

  // --- Interrupt / stagger (сбив замаха). `windupVulnUntil` (set in play) marks
  //     this fighter interruptible while in the EARLY part of its own attack
  //     windup; a landed hit during it срывает the attack (staggerInterrupt).
  //     `staggerUntil` locks the fighter (no attack / move) after a stagger.
  //     Readable via isStaggered() (seam for future grains — recognisability only).
  let windupVulnUntil = 0; // loop time the early-windup vuln window ends (0 = not vuln)
  let staggerUntil = 0; // loop time the stagger lock ends

  // --- Charge (заряд) — built by patience, spent on one empowered strike. `charge`
  //     0..stats.chargeMax (start empty). A released strike captures its boost into
  //     chargeShotPower / chargeShotPen at launch (charge already spent) and
  //     resolveImpact applies them at contact; cleared when the clip ends. Readable
  //     via getCharge* (HUNT/STING seam).
  let charge = 0;
  let chargeShotPower = 0; // damage bonus carried by the current released strike
  let chargeShotPen = 0; // block-pierce carried by the current released strike

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
    if (lunge) lunge.active = false; // any clip (strike launched, OR hurt / stagger / dodge interrupting) ends a step-in
    clip = { ...c, fired: c.impacts ? c.impacts.map(() => false) : false };
    clipStart = lastT;
    // Early-windup vulnerability: an attack / feint can be interrupted from its
    // start through interruptWindowFrac of its windup (always before contact).
    // Non-attack clips (HURT/DODGE/STAGGER/APPROACH) carry no `windup` → not vuln.
    // interruptVulnFrac folds in this fighter's interrupt-resistance (ТАРАН-3):
    // base window × (1 − sb.interruptResist), so a ram shrinks / closes it.
    windupVulnUntil = c.windup ? clipStart + c.windup * interruptVulnFrac : 0;
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

  // Clip pose (one-shot strike / hurt / kick) → target. Upper body AND legs from
  // the keyframe — arm clips omit the leg fields (→ 0, unchanged), kick clips drive
  // hip + knee (lhx/lkx/rhx/rkx). The next producer (idle / stance / gait) resets
  // the legs on the cross-fade out, so a kick returns cleanly to stance.
  const apply = (v) => {
    targetP.hipsZ = N(v.hz);
    targetP.hipsY = hipsBaseY + N(v.hy);
    targetP.torsoX = N(v.tx);
    targetP.torsoY = N(v.ty);
    targetP.lsx = N(v.lsx);
    targetP.lex = N(v.lex);
    targetP.rsx = N(v.rsx);
    targetP.rex = N(v.rex);
    targetP.lhx = N(v.lhx); targetP.lkx = N(v.lkx); targetP.rhx = N(v.rhx); targetP.rkx = N(v.rkx);
    setMode('clip');
  };

  // --- Micro-life overlay (сдержанная жизнь в planted-стойке). A LOW-amplitude
  //     secondary layer ADDED on top of a held idle / intention-stance target: a
  //     slow weight shift (loaded-leg knee softens + hip follows + torso settles
  //     toward it), a slow fwd/back body sway, and a fuller breath (hips / torso /
  //     shoulders). Sits BELOW the intention silhouette — amplitudes are well under
  //     the stance deltas (combatBalance.microLife), so HOLD/CATCH/BREATHE stay
  //     three distinct sharp reads. Called ONLY from the planted producers
  //     (idlePose / intentionStance) — never from clips (apply) / gather / gait /
  //     block, and never under reduced motion (that path returns before these run).
  //     `manner` = the active intention's { amp, rate } (livelier press, quieter
  //     catch, sluggish breathe); null → neutral. Pure maths over lastT.
  const ML = B.microLife;
  const microLife = (manner) => {
    const amp = ML.cap * (manner ? manner.amp : 1);
    if (amp <= 0) return; // cap 0 (or off) → столб, no overlay
    const rate = manner ? manner.rate : 1;
    const t = lastT;
    const br = Math.sin(t * wBreath * rate); // breath phase
    const sh = Math.sin(t * ((Math.PI * 2) / ML.shiftPeriodSec) * rate); // weight shift L↔R
    const sw = Math.sin(t * ((Math.PI * 2) / ML.swayPeriodSec) * rate); // slow fwd/back sway
    // Fuller breath — hips rise, torso pitches, shoulders lift on the inhale.
    targetP.hipsY += ML.breathHipY * amp * br;
    targetP.torsoX += ML.breathTorsoX * amp * br;
    const inh = Math.max(0, br);
    targetP.lsx += ML.breathShoulder * amp * inh;
    targetP.rsx += ML.breathShoulder * amp * inh;
    // Weight shift — the loaded leg's knee softens (anti-phase), the hip follows,
    // and the torso settles a touch toward the weighted side. Slow → переминание.
    targetP.lkx += -ML.kneeFlex * amp * (0.5 + 0.5 * sh);
    targetP.rkx += -ML.kneeFlex * amp * (0.5 - 0.5 * sh);
    targetP.lhx += ML.hipFollow * amp * sh * 0.5;
    targetP.rhx += -ML.hipFollow * amp * sh * 0.5;
    targetP.torsoY += ML.twist * amp * sh;
    // Slow body sway (fwd/back) — gentle settle, never a bounce.
    targetP.hipsZ += ML.swayHipZ * amp * sw;
  };

  // Idle pose → target: settled stance + a faint breathing rise on the hips.
  const idlePose = (bs) => {
    targetP.hipsZ = 0;
    targetP.hipsY = hipsBaseY + bs * 0.012;
    targetP.torsoX = 0; targetP.torsoY = 0;
    targetP.lsx = 0; targetP.lex = 0; targetP.rsx = 0; targetP.rex = 0;
    targetP.lhx = 0; targetP.lkx = 0; targetP.rhx = 0; targetP.rkx = 0;
    microLife(null); // сдержанная жизнь over the held idle (neutral manner)
    setMode('idle');
  };

  // Block stance → target: a held guard — forearms up toward the foe, torso
  // slightly closed, a faint breath. A light idle-level pose (NOT a new heavy
  // clip); the pose layer cross-fades it in / out like any other mode.
  const BLOCK_SHX = 0.55; // shoulder raise for the guard
  const BLOCK_EHX = 1.7; // elbow bend — forearms up in front
  const BLOCK_TORSO = 0.08; // slight close-up of the torso
  const blockPose = (bs) => {
    targetP.hipsZ = 0;
    targetP.hipsY = hipsBaseY + bs * 0.008;
    targetP.torsoX = BLOCK_TORSO; targetP.torsoY = 0;
    targetP.lsx = BLOCK_SHX; targetP.lex = BLOCK_EHX;
    targetP.rsx = BLOCK_SHX; targetP.rex = BLOCK_EHX;
    targetP.lhx = 0; targetP.lkx = 0; targetP.rhx = 0; targetP.rkx = 0;
    setMode('block');
  };

  // Intention STANCE → target: the PLANTED silhouette of the active intention
  // (lean / crouch / guard / knee bend from intentionMotion.js). Set ONLY on
  // planted frames (navigate / maneuver call it when NOT requesting a move), so the
  // gait cleanly overrides it while walking and there's no per-frame setMode churn.
  // Per-intention mode name → the pose layer cross-fades (≈0.13s) on an intention
  // change, which reads as a quick, deliberate shift (not a slow morph). Plays
  // through the same layer as idle/block; reduced motion never reaches it.
  const intentionStance = (bs) => {
    const s = motionFor(intentionId).stance || {};
    targetP.hipsZ = s.lean || 0;
    targetP.hipsY = hipsBaseY + (s.crouch || 0) + bs * 0.008;
    targetP.torsoX = s.torso || 0; targetP.torsoY = 0;
    targetP.lsx = s.sh || 0; targetP.lex = s.el || 0;
    targetP.rsx = s.sh || 0; targetP.rex = s.el || 0;
    const kn = s.knee || 0; // coiled crouch — bend hip + knee (CATCH)
    targetP.lhx = kn * 0.4; targetP.lkx = -kn;
    targetP.rhx = kn * 0.4; targetP.rkx = -kn;
    microLife(ML.byIntention[intentionId]); // сдержанная жизнь scaled by the intention's manner (below the silhouette)
    setMode('stance-' + intentionId);
  };

  // Gather (улов) → target: a brief coiled LOAD just before a read-driven контра
  // lunge — weight sinks back, knees bend deep, guard mid, chest loaded toward the
  // foe. Distinct from the CATCH stance (deeper sink) so the cross-fade reads as
  // "собрался → выпад": the pose layer eases into this over ~0.13s, holds for
  // read.gatherSec, then the strike clip fires — a visible MOMENT, not a silent
  // exchange. Own mode name so the layer cross-fades cleanly. Reduced motion never
  // reaches it (the read subsystem only runs in full motion).
  const gatherPose = (bs) => {
    targetP.hipsZ = 0.1; // weight back — loading the spring
    targetP.hipsY = hipsBaseY - 0.14 + bs * 0.006; // sink (coil)
    targetP.torsoX = -0.1; targetP.torsoY = 0; // chest dips toward the foe
    targetP.lsx = 0.5; targetP.lex = 1.5; // guard mid-high
    targetP.rsx = 0.5; targetP.rex = 1.5;
    targetP.lhx = 0.32; targetP.lkx = -0.8; // knees bent — coiled to spring
    targetP.rhx = 0.32; targetP.rkx = -0.8;
    setMode('gather');
  };

  // Gait + weight → target. Cadence and amplitude scale with the LIVE speed
  // (mag), so a move visibly winds up as it accelerates and winds down as it
  // brakes — never a fixed glide. `accel` (Δspeed/s) leans the torso: into the
  // start, back on the plant — the construct's weight reads in this lean, not the
  // legs. No translation here; stepLocomotion places the group.
  const animateGait = (dt, band, mag, accel) => {
    const fw = B.footwork;
    const raw = THREE.MathUtils.clamp(mag / band.speed, 0, 1);
    // Floor the amplitude while moving so even a slow circle reads as a deliberate
    // STEP (foot off the ground), never a flat slide. The floor RAMPS in over the
    // first bit of speed so the step eases up from rest (no amplitude pop on start).
    const moving = THREE.MathUtils.clamp(mag / 0.3, 0, 1);
    const frac = Math.max(raw, fw.minStepFrac * moving);
    gaitPhase += dt * mag * STRIDE_K; // cadence ∝ live speed (faster = more frequent + wider)
    const p = gaitPhase;
    const sL = Math.sin(p);
    const sR = Math.sin(p + Math.PI);
    // Thigh swing (hip): legs alternate fwd/back.
    targetP.lhx = band.swing * frac * sL;
    targetP.rhx = band.swing * frac * sR;
    // Knee LIFT on the swing leg → the foot clearly leaves the ground at mid-swing
    // then extends to plant (gated to each leg's forward half). kneeLift exaggerates
    // the flex so it reads as a step, not a glide.
    targetP.lkx = -band.knee * fw.kneeLift * frac * Math.max(0, Math.sin(p + 0.6));
    targetP.rkx = -band.knee * fw.kneeLift * frac * Math.max(0, Math.sin(p + Math.PI + 0.6));
    // Contralateral arm swing.
    targetP.lsx = band.arm * frac * sR;
    targetP.rsx = band.arm * frac * sL;
    targetP.lex = 0.3;
    targetP.rex = 0.3;
    const accelLean = THREE.MathUtils.clamp(accel * ACCEL_LEAN, -MAX_ACCEL_LEAN, MAX_ACCEL_LEAN);
    targetP.torsoX = band.lean * frac - accelLean; // forward with speed; into the start, back on the plant
    targetP.torsoY = band.twist * frac * sL;
    targetP.hipsZ = 0;
    // Weighty vertical bob — the body rises onto the planted leg each step.
    targetP.hipsY = hipsBaseY - band.bob * frac * (0.5 - 0.5 * Math.cos(2 * p));
    setMode(band === FAST ? 'gait-fast' : 'gait-slow');
  };

  // Weighted locomotion — a velocity model the AI drives via a per-frame intent
  // (direction + band + distance-to-goal). Velocity ramps toward the band speed
  // (accel) / toward rest (decel) and is carried between frames, so movement has
  // a start, a stop and inertia — never a constant-speed glide.
  const move = { vx: 0, vz: 0 }; // carried world velocity (units/s) → inertia
  const intent = { on: false, dx: 0, dz: 0, band: SLOW, maxDist: Infinity };
  // Per-intention band-speed scale (the active intention's MANNER: BREATHE slow,
  // STING/BREAK fast). Set by navigate each frame, applied in stepLocomotion;
  // reset to 1 by the dev gait so the SLOW/FAST preview is unscaled.
  let moveScale = 1;

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
      const bspeed = band.speed * moveScale; // intention manner (slow / fast) rides on the band speed
      let ts = bspeed;
      const cm = Math.hypot(move.vx, move.vz);
      const brakeDist = (cm * cm) / (2 * band.decel) + 0.05; // distance to bleed off at decel
      if (intent.maxDist <= brakeDist) ts = bspeed * THREE.MathUtils.clamp(intent.maxDist / brakeDist, 0, 1);
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

  // Stamina tick (called once per alive frame, after stepLocomotion so prevMag is
  // this frame's speed). Moving DRAINS (∝ speed fraction — chasing costs sils,
  // ТЕНЬ-3 seam); standing/collected with NO clip RECOVERS (so idle + a block
  // stance regen; attacking / hurt / dodge clips neither). Attack costs are
  // charged separately at strike start (decideAttack / reducedAttack).
  const tickStamina = (dt) => {
    if (prevMag > 0.05) stamina -= B.staminaMoveDrainPerSec * THREE.MathUtils.clamp(prevMag / FAST.speed, 0, 1) * dt;
    else if (!clip) stamina += staminaRegenRate * dt; // rest/stance → recover (БАСТИОН-3 «дыхание» seam)
    stamina = THREE.MathUtils.clamp(stamina, 0, staminaMax);
  };

  // Charge tick (once per alive frame). Builds only in PATIENT play — no clip
  // (not attacking) AND the foe held at/beyond chargePatientDist (spacing, not
  // jammed in close). While actively attacking (an attack/feint clip) it doesn't
  // grow and can slowly drain (chargeDecayPerSec, default 0). Spent at release
  // (decideAttack / reducedAttack). Distinct from stamina (built by waiting, not
  // by resting).
  const tickCharge = (dt) => {
    const f = getFoePos && getFoePos();
    const d = f ? Math.hypot(f.x - group.position.x, f.z - group.position.z) : -1;
    if (f && !clip && d >= B.chargePatientDist) charge += stats.chargeGainPerSec * dt; // patient spacing → accumulate
    else if (clip && clip.windup) charge -= B.chargeDecayPerSec * dt; // actively attacking → optional drain (seam)
    charge = THREE.MathUtils.clamp(charge, 0, stats.chargeMax);
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
  // Per-move reach gate: foe centre within `r` (world units) of this fighter — the
  // move's own reach + slop, so a short jab whiffs at a distance a kick would land.
  const foeWithin = (r) => {
    const f = getFoePos && getFoePos();
    if (!f) return false;
    const dx = f.x - group.position.x;
    const dz = f.z - group.position.z;
    return dx * dx + dz * dz <= r * r;
  };

  // --- Contact geometry (GENERAL — covers arms now, legs the same way). The tip of
  //     a striking limb in WORLD space at the contact frame, and the nearest body
  //     ZONE of THIS fighter to a world point (head / body / forearm). The attacker
  //     reads its own limb tip (the contact point); the defender reads which of its
  //     own zones that point is nearest — so the flash + reaction land on the right
  //     spot regardless of which limb threw the blow.
  const LIMB_TIP = {
    armL: { node: armL.elbow, off: [0, -0.34, 0] },
    armR: { node: armR.elbow, off: [0, -0.34, 0] },
    legL: { node: legL.knee, off: [0, -0.5, -0.05] },
    legR: { node: legR.knee, off: [0, -0.5, -0.05] },
  };
  const _tipV = new THREE.Vector3();
  const limbTipWorld = (limbId) => {
    const e = LIMB_TIP[limbId];
    if (!e) return null;
    e.node.updateWorldMatrix(true, false);
    return e.node.localToWorld(_tipV.set(e.off[0], e.off[1], e.off[2])).clone();
  };
  const _zoneV = new THREE.Vector3();
  // Zone candidates: head, body (chest), and each forearm (mid-shaft — sits in front
  // when the guard is up, so a blocked blow reads as 'forearm'). Nearest wins.
  const ZONE_NODES = [
    { zone: 'head', node: head, off: [0, 0, 0] },
    { zone: 'body', node: chest, off: [0, 0, 0] },
    { zone: 'forearm', node: armL.elbow, off: [0, -0.2, 0] },
    { zone: 'forearm', node: armR.elbow, off: [0, -0.2, 0] },
  ];
  const nearestZoneTo = (worldPoint) => {
    if (!worldPoint) return 'body';
    let best = 'body';
    let bestD = Infinity;
    for (const z of ZONE_NODES) {
      z.node.updateWorldMatrix(true, false);
      _zoneV.set(z.off[0], z.off[1], z.off[2]);
      z.node.localToWorld(_zoneV);
      const d = _zoneV.distanceToSquared(worldPoint);
      if (d < bestD) { bestD = d; best = z.zone; }
    }
    return best;
  };

  // Resolve ONE landed impact (called per impact of the active clip). Three
  // distinct outcomes per impact, in order:
  //   1. range gate — foe out of STRIKE reach → the fist never arrived (no event).
  //   2. MISS — the ATTACKER rolls its own accuracy (rollMiss) and goes wide:
  //      a SEPARATE branch — no onImpact, so no damage / stagger / core-flash
  //      (the flash is tied to real contact); the strike anim still plays. Fires
  //      onMiss — the seam a future "punish the foe's whiff" facet hooks (the
  //      counter itself is NOT wired yet, the event is just made recognisable).
  //   3. CONTACT — handed to the foe via onImpact; the foe then rolls its OWN
  //      dodge (slip) in takeDamage → dodge or damage.
  // So across the system one impact resolves: MISS → else DODGE → else HIT.
  const resolveImpact = (c, idx = 0) => {
    if (!foeWithin((c.reach || STRIKE) + B.reachHitTol)) return; // out of THIS move's reach — whiff, NOT an accuracy miss
    if (rollMiss()) { if (onMiss) onMiss(); return; } // MISS — attacker wide, no contact
    if (!onImpact) return;
    // Bonuses on this hit, both via the SAME channels (no new pierce system):
    //   feint payoff — a real strike after a bought feint (feintPayoffActive)
    //   charge release — an empowered strike (chargeShot*)
    // Block-pierce = max of base / feint / charge; damage bonus = их сумма. Both
    // stack if a strike is somehow both. ФИНТ-2/-5 «расплата»: sb.feintPayoff
    // (base 0) scales BOTH the pierce and the damage of the post-feint punish.
    const fpMul = 1 + (sb.feintPayoff || 0);
    const pen = Math.max(stats.blockPenetration, feintPayoffActive ? B.feintPenetrationBonus * fpMul : 0, chargeShotPen);
    // Riposte: a strike inside the armed window (from a block / dodge / foe whiff)
    // hits harder, then consumes it — one answer per defensive win.
    let riposte = 0;
    if (riposteUntil && lastT < riposteUntil) { riposte = riposteBonus; riposteUntil = 0; riposteBonus = 0; }
    const dmgBonus = (feintPayoffActive ? B.feintDamageBonus * fpMul : 0) + chargeShotPower + riposte;
    // ВОЛНОЛОМ-2/5 «наказывает прерванную атаку»: this fighter's interrupt reward
    // (sb.interruptBonus) rides ALONG to the foe — applied there ONLY if the hit
    // actually catches a windup (the foe owns that check). base 0 → no extra.
    // Contact point = the striking limb's tip in world space (per-impact limb for a
    // jab–cross), + the move's weight → the foe places the spark / zone reaction.
    const limbId = c.limbs ? (c.limbs[idx] || c.limbs[0]) : (c.limb || 'armL');
    const contactPoint = limbTipWorld(limbId);
    onImpact(strikeDamage(c) * (1 + dmgBonus), pen, sb.interruptBonus || 0, contactPoint, c.weight || 0); // contact → foe resolves dodge / block / damage + flash + reaction
  };

  // Manoeuvre at fighting range — now INTENTION-led (the active intention's motion
  // style decides the manner; character only tints speed/jitter). Each branch either
  // requests a move (gait shows) OR plants and sets the intention stance (so the
  // planted silhouette reads). `bs` = breathing phase for the stance.
  //   press   — relentless step-in toward contact, never circles.
  //   sting   — bounce OUT (the strike darts back in to poke) → jerky in/out.
  //   plant   — HOLD digs in / body-presses (brace forward); CATCH gives a sliver
  //             of ground if crowded (brace back); otherwise plant + stance.
  //   strike  — hold loaded at strike range (the heavy clip + sag does the work).
  //   retreat — at range BREAK/BREATHE settle into their stance (alert vs sunk).
  // At preferred range the fighter does CONTINUOUS FOOTWORK — it circles the foe and
  // holds spacing on real stepping legs, never a dead plant (so two builds keep
  // moving, drift under angles, and never lock face-to-face). The blend of a
  // tangential (circling) and a radial (hold-range) vector sets the move DIRECTION
  // (requestMove normalizes); manner tints it: press bores in (тight circle, FAST),
  // sting circles wider + springs spacing, plant/retreat amble gently. The intention
  // CHOICE + its strike cadence are untouched — this only fills the gaps between blows.
  const maneuver = (t, dt, ux, uz, d, bs) => {
    const m = motionFor(intentionId);
    const fw = B.footwork;
    // Slip-dodge weave only for the mobile, non-committing styles (an elusive
    // character still flickers aside) — never while committing a strike.
    if (m.style !== 'plant' && m.style !== 'strike' && !clip && slip01 > 0 && Math.random() < slip01 * 0.18) {
      play(DODGE);
      nav.until = t + character.decideMin + Math.random() * character.decideJit;
      return;
    }
    // Re-aim the circle periodically — occasionally flip the sense (CW↔CCW) so the
    // footwork keeps repositioning instead of tracing one perfect orbit.
    if (t >= nav.reaimAt) {
      nav.reaimAt = t + fw.reaimMin + Math.random() * fw.reaimJit;
      if (Math.random() < fw.flipChance) character.strafeBias *= -1;
    }
    const tanx = -uz * character.strafeBias; // tangential (circling) unit ⟂ the foe line
    const tanz = ux * character.strafeBias;
    // PRESS — bore toward contact with only a slight lateral cut (manner: never circles).
    if (m.style === 'press') {
      requestMove(ux + tanx * 0.3, uz + tanz * 0.3, FAST, Math.max(0, d - CONTACT_SOFT));
      return;
    }
    // STING — spring OUT to spacing AND drift laterally (a wide arc); darts back in
    // to poke via decideAttack.
    if (m.style === 'sting') {
      requestMove(-ux * 0.85 + tanx * 0.65, -uz * 0.85 + tanz * 0.65, FAST);
      return;
    }
    // PLANT / STRIKE / RETREAT — a gentle continuous circle that holds spacing (a
    // light amble, never a freeze). Direction = circle + radial range-hold; the
    // manner speed (moveScale) keeps HOLD/BREATHE slow vs BREAK sharp.
    moveScale *= fw.circleSlowMul;
    const radSign = THREE.MathUtils.clamp((d - character.range) / 0.4, -1, 1); // + too far → in · − too close → out
    let braceBias = 0;
    if (m.brace === 'back') braceBias = -0.18; // CATCH keeps a sliver back
    else if (m.brace === 'forward') braceBias = 0.18; // HOLD presses forward
    const vx = tanx * fw.circleSpeed + ux * (fw.rangeKeep * radSign + braceBias);
    const vz = tanz * fw.circleSpeed + uz * (fw.rangeKeep * radSign + braceBias);
    requestMove(vx, vz, SLOW); // direction = circle + range-hold; speed = SLOW × moveScale (manner)
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
    const m = motionFor(intentionId);
    moveScale = m.speedMul || 1; // intention MANNER: BREATHE slow, STING/BREAK fast

    if (d > engage + RANGE_HYST) {
      // Close toward preferred range. PRESS cuts the angle (drives straight in);
      // others arc. (BREAK/BREATHE sit at a high range, so they rarely land here.)
      if (nav.mode !== 'approach') {
        nav.mode = 'approach';
        nav.approachAngle = (Math.random() < 0.5 ? -1 : 1) * character.approachArc * (0.5 + Math.random() * 0.5);
      }
      const closeFrac = THREE.MathUtils.clamp((d - engage) / (FAR - engage), 0, 1);
      const a = nav.approachAngle * closeFrac * (m.style === 'press' ? 0.25 : 1); // PRESS straightens the line (cuts off the retreat)
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const gap = d - engage;
      // PRESS chases FAST; plant intentions amble in SLOW; others step in fast on a
      // short gap. Speed manner rides on top via moveScale.
      const band = (m.style === 'press' || (m.style !== 'plant' && gap <= FAST_DASH)) ? FAST : SLOW;
      requestMove(ux * ca - uz * sa, ux * sa + uz * ca, band, gap);
      return;
    }
    if (d < CONTACT_SOFT) {
      // Too tight — ease back to the soft buffer (never interpenetrate).
      requestMove(-ux, -uz, SLOW, CONTACT_SOFT - d);
      return;
    }
    if (d < engage - RANGE_HYST) {
      // Inside preferred range → give ground. BREAK/BREATHE live here; the SPEED
      // (moveScale: BREAK sharp, BREATHE slow) + facing (faceFoe always) + the
      // settle stance at range separate them. STING also bounces out here.
      const out = engage - d;
      const band = out > FAST_DASH ? FAST : SLOW;
      requestMove(-ux, -uz, band, out);
      return;
    }
    if (nav.mode === 'approach') nav.until = 0; // just arrived → manner now
    maneuver(t, dt, ux, uz, d, bs); // at preferred range — intention manner + stance
  };

  // Dev SLOW / FAST preview (AI off): approach the foe at the chosen band, then
  // circle; march in place if there's no foe. Keeps each band inspectable
  // without the full fight running.
  const devGait = (dt) => {
    moveScale = 1; // dev preview ignores the intention speed manner
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
    dodgeRun = null;
    reactRun.active = false; // knock-back step leaves with the fighter
    if (lunge) lunge.active = false; // pending step-in leaves with the fighter
    spark.visible = false; sparkUntil = -1; // contact spark off
    loco.active = false;
    feintActive = false; feintPayoffActive = false; feintBaitUntil = 0; feintAdvUntil = 0; feintBaited = false; // feint state leaves with the fighter
    riposteUntil = 0; riposteBonus = 0; // riposte window leaves with the fighter
    windupVulnUntil = 0; staggerUntil = 0; // interrupt/stagger state leaves with the fighter
    gatherUntil = 0; readPendingAt = -1; readPendingPhase = null; perceivedPhase = 'neutral'; truePhaseSeen = 'neutral'; // read/gather state leaves with the fighter
    charge = 0; chargeShotPower = 0; chargeShotPen = 0; // charge state leaves with the fighter
    modelReqSeq += 1; lastModelAnswer = null; // any in-flight model request resolves into a dead fighter → ignored
    deadAt = lastT; // DEAD: updateBar already drew 0% — hold the plate, update() hides it after DEAD_HOLD_S
    if (reduced) { state = 'done'; if (onEliminated) onEliminated(); return; } // no playback (plate leaves with the group)
    skin.transparent = true;
    coreMat.transparent = true;
    skinBase = skin.color.clone(); // fade from the live skin (neutral grey stays grey through the dissolve)
    state = 'dissolving';
    diss = 0;
  };

  // Interrupt (сбив): срывает this fighter's in-progress attack — cancel the clip
  // + drop its pending impacts (so a DOUBLE/COMBO остаток never lands), play the
  // STAGGER reaction, and lock attack/move for staggerDurationSec. Called from
  // takeDamage when a landed hit catches us in our early windup.
  const staggerInterrupt = () => {
    clip = null; dodgeRun = null; // drop the interrupted attack + its pending impacts
    windupVulnUntil = 0;
    feintPayoffActive = false; chargeShotPower = 0; chargeShotPen = 0; // an interrupted strike loses any feint / charge boost
    staggerUntil = lastT + B.staggerDurationSec; // lock: no attack / move
    ai.nextAt = Math.max(ai.nextAt, staggerUntil); // don't strike until recovered
    nav.until = staggerUntil; // hold the current tactic through the lock
    play(STAGGER); // reaction clip (no-op under reduced; the lock + static pose still read)
  };

  // --- Knock-back step (reactRun): a STRONG hit shoves the defender back a step
  //     (отшат шагом) over the reaction clip — a real foot displacement (away from
  //     the attacker), permanent (no return), so it also opens distance after the
  //     trade. Applied in update (like the dodge displacement). Light hits skip it.
  const reactRun = { active: false, sx: 0, sz: 0, dx: 0, dz: 0, start: 0, dur: 0.28 };
  const beginReactStep = () => {
    const f = getFoePos && getFoePos();
    if (!f) return;
    let bx = group.position.x - f.x;
    let bz = group.position.z - f.z;
    const m = Math.hypot(bx, bz) || 1e-4;
    reactRun.active = true;
    reactRun.start = lastT;
    reactRun.sx = group.position.x; reactRun.sz = group.position.z;
    reactRun.dx = (bx / m) * B.reactStepDist; reactRun.dz = (bz / m) * B.reactStepDist;
  };
  // Play the zone reaction + show the contact spark; a strong hit adds the step back.
  const playReaction = (zone, strong, contactPoint) => {
    const rclip = zone === 'head' ? REACT_HEAD : zone === 'forearm' ? REACT_GUARD : REACT_BODY;
    play(rclip);
    showHitFlash(contactPoint);
    if (strong) beginReactStep();
    return rclip;
  };

  // Hit resolution: lose HP, a short zone reaction, and OUT at zero. The rift flash +
  // attacker→defender pairing live in ArenaScene (the combat resolver).
  // Returns the HP actually LOST (>0 only when a hit landed and reduced HP) — the
  // stalemate safeguard reads it (ArenaScene noteExchange) to detect a CLEAN exchange:
  // a dodge / block-to-near-nothing returns 0, so pure evasion doesn't reset накал.
  const takeDamage = (dmg, attackerPen = 0, attackerInterruptBonus = 0, contactPoint = null, weight = 0) => {
    if (state !== 'alive') return 0;
    // SEAM (NOT wired): a future fatigue pass could scale the dodge chance + the
    // block strength below by stamina (a spent fighter slips / guards worse) —
    // left unwired on purpose so the fight isn't penalised on every axis at once.
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
      armRiposte(sb.dodgeCounter || 0); // КАПКАН-2/5 · ТЕНЬ-4 — a slipped hit opens the counter window
      return 0; // fully evaded → no exchange (накал keeps building on pure dodging)
    }
    // The hit LANDED (past miss + dodge). INTERRUPT: are we caught in the EARLY
    // windup of our OWN attack right now? If so this landed hit срывает it (handled
    // below, after the damage applies). Only the early-swing window (windupVulnUntil)
    // counts — a hit during our late swing / recoil is a normal exchange.
    const interrupted = !!(clip && clip.windup && lastT < windupVulnUntil);
    // Resilience from the fighter's base axis (manner — constant this pass).
    const res01 = THREE.MathUtils.clamp(baseAx.resilience / 100, 0, 1);
    // Block: a LANDED hit (got past miss + dodge) into a raised guard is SOFTENED
    // — ~half, never to zero (stays penetrable; that's what separates it from a
    // dodge). Cut = block STRENGTH × (1 − attacker PIERCE), clamped < 1 so it
    // never zeroes. A successful block is a DISTINCT branch + onBlock event (the
    // seam a future "answer after a block" facet hooks; no counter wired yet).
    // attackerPen is plumbed from the attacker's stats (base 0 = no pierce yet).
    let blockMul = 1;
    if (blocking) {
      const cut = THREE.MathUtils.clamp(stats.blockMitigation * (1 - attackerPen), 0, 0.9);
      blockMul = 1 - cut;
      if (onBlock) onBlock(); // recognisable successful-block event
      armRiposte(sb.blockCounter || 0); // ВОЛНОЛОМ-1/5 — a block opens the riposte window
    }
    // Two distinct mitigations, both apply: resilience is the BEHAVIOUR axis
    // (manner — unchanged this pass), toughness is the NEW defensive STAT
    // (percent softening, never to zero — слабый удар всё равно чуть проходит).
    // An interrupting hit carries the global interruptDamageBonus PLUS the
    // attacker's own seam (ВОЛНОЛОМ-2/5 sb.interruptBonus, passed via onImpact).
    const interruptMul = interrupted ? 1 + B.interruptDamageBonus + attackerInterruptBonus : 1;
    // `dmg` is a FRACTION of THIS fighter's max HP (the attacker computed it as a
    // share, not an absolute — see strikeDamage). Multiply by maxHp here so HP
    // scaling never rebalances: a bigger pool = proportionally bigger numbers, same
    // hits to a kill. Then soften by resilience / toughness / block (all
    // multiplicative ratios, independent of the HP scale).
    const before = hp;
    hp = Math.max(0, hp - dmg * maxHp * dmgMulFor(res01) * (1 - toughSoft) * blockMul * interruptMul);
    const lost = before - hp; // real HP dealt → a clean exchange (resets накал if > 0)
    updateBar();
    if (hp <= 0) { eliminate(); return lost; } // → dissolve; onEliminated raised on completion
    if (interrupted) {
      showHitFlash(contactPoint); // the срыв still landed on the body — mark the touch
      staggerInterrupt(); // срыв: cancel our attack + pending impacts, play STAGGER, lock
      if (onInterrupt) onInterrupt(); // recognisable interrupt event (seam; no grain wired)
      return lost; // staggered instead of the normal recoil
    }
    // Zone reaction (by where the blow landed) + contact spark; a strong (heavy) hit
    // shoves the body back a step. Short — the ai.nextAt hitch below paces the next
    // move, the body is NOT locked out (loop never hangs).
    const zone = nearestZoneTo(contactPoint);
    const strong = weight >= B.reactStrongWeight;
    const rclip = playReaction(zone, strong, contactPoint);
    // Rhythm hitch on top of the recoil scales with stagger resistance — a tough
    // fighter barely loses its tempo after eating a hit.
    ai.nextAt = Math.max(ai.nextAt, lastT + rclip.dur + (0.4 + Math.random() * 0.6) * stagMulFor(res01));
    // counter → chance to punish straight out of the recoil: press in + strike back fast.
    if (Math.random() < counter01 * 0.7) {
      nav.mode = 'press';
      nav.until = lastT + HURT.dur + 0.3;
      ai.nextAt = lastT + HURT.dur + 0.05;
    }
    return lost; // HP dealt this hit → the stalemate safeguard's clean-exchange signal
  };

  // --- TEMPORARY reflex: "decide to raise the guard" (spinal cord until the
  //     model supplies a real «brace» intent). The DECISION lives HERE and ONLY
  //     here — the stance (blockPose), the mitigation (takeDamage) and the onBlock
  //     event are the real ability and must stay untouched when this is swapped
  //     out: the model will call enterBlock() directly and retire this function.
  //     Trigger: the foe commits an in-range attack (routed by ArenaScene from the
  //     attacker's onAttackStart → this fighter's noteIncomingAttack). Tendency
  //     grows from resilience + stick (resilience-led so a high-stick presser
  //     isn't a turtle); the current intention's guard flag biases it on top.
  const noteIncomingAttack = () => {
    rememberFoe('attack'); // observed foe event → the intention memory (the picker reads it)
    if (state !== 'alive' || blocking) return; // already guarding → keep the stance
    const resLive = THREE.MathUtils.clamp(baseAx.resilience / 100, 0, 1);
    const stickLive = stickEff; // base + intention delta, refreshed each frame in refreshAxes
    // intentionFlags.guard biases the raise tendency by the current MODE (CATCH /
    // HOLD lean high, PRESS / STRIKE low); clamped so a bout still finishes.
    const tend = THREE.MathUtils.clamp(
      B.blockTendencyBase + resLive * B.blockTendencyResWeight + stickLive * B.blockTendencyStickWeight + intentionFlags.guard,
      0, B.blockTendencyMax,
    );
    if (Math.random() < tend) enterBlock(B.blockHoldSec); // raise the guard for this exchange
  };

  // КАПКАН-4 «наказывает промах врага» — the foe's whiff opens this fighter's
  // counter window (sb.missCounter). Routed by ArenaScene from the missing
  // attacker's onMiss → this fighter's noteFoeMissed (mirror of noteIncomingAttack).
  // The dormant onMiss hook activated reactively; only a trap facet arms a counter.
  const noteFoeMissed = () => { rememberFoe('miss'); if (state === 'alive') armRiposte(sb.missCounter || 0); };

  // --- Feint ABILITY (built clean — clip + threat signal + bait window). Throws
  //     the FEINT clip, spends a little stamina, and fires the SAME onAttackStart
  //     as a real strike so the foe's reflex (noteIncomingAttack / its own dodge)
  //     bites on the bluff — REUSES the existing route, no new foe-side logic. Opens
  //     the bait window; update() watches the foe + opens the advantage window if it
  //     reacts. Used by the dev trigger and by the TEMPORARY decision below; the
  //     future model's «deceive» intent will call THIS directly. Schedules a SHORT
  //     follow gap so the punisher can land inside the advantage window.
  const doFeint = (t) => {
    if (state !== 'alive' || clip) return; // can't feint mid-clip
    play(FEINT);
    stamina = THREE.MathUtils.clamp(stamina - B.feintStaminaCost, 0, staminaMax); // honest price of the bluff
    feintActive = true;
    feintBaited = false;
    feintAdvUntil = 0;
    feintBaitUntil = t + B.feintBaitWindowSec; // watch for the foe's reaction
    if (onFeint) onFeint(); // readable feint event (ФИНТ-branch seam)
    if (onAttackStart) onAttackStart(); // SAME threat signal as a real attack → the bluff
    // Short follow so a real punish can land inside the advantage window.
    ai.nextAt = t + FEINT.dur + Math.max(0.05, lerp(0.3, 0.1, tempo01)) * staminaCadenceMul();
  };
  // --- TEMPORARY reflex: "decide to feint instead of a real strike" (spinal cord
  //     until the model supplies a real «deceive» intent — it will replace ONLY
  //     this, calling doFeint() directly, leaving the clip / windows / payoff
  //     untouched). Isolated here like noteIncomingAttack. Chance = base + light
  //     counter weight (feint ≈ «ловлю на реакции»). Never feints when a punish is
  //     already available (an open advantage window → throw the real strike).
  const decideFeint = (t) => {
    if (feintAdvUntil) return false; // advantage open → don't feint, punish instead
    // ФИНТ-1 «ложный заход» — feint-frequency SEAM (sb.feintChance, base 0): adds
    // to the reflex chance, still capped by feintChanceMax. Only a feint facet
    // raises it; everyone else → base counter-led rate.
    const chance = THREE.MathUtils.clamp(B.feintChanceBase + counter01 * B.feintChanceCounterWeight + (sb.feintChance || 0), 0, B.feintChanceMax);
    if (Math.random() < chance) { doFeint(t); return true; }
    return false;
  };
  // --- TEMPORARY reflex: "decide to release the charge" — fire the empowered
  //     strike when the charge is near-full and the foe is in reach (the caller
  //     checks reach before this). Isolated like decideFeint; the future model's
  //     «release» intent replaces ONLY this, leaving accumulation + the empowered
  //     strike untouched. Returns whether THIS attack should spend the charge.
  // Intention gates the release: STING / BREATHE ('build') save the charge; STRIKE
  // ('spend') fires what it has loaded; everything else uses the default threshold.
  const decideRelease = () => {
    if (intentionFlags.charge === 'build') return false;
    if (intentionFlags.charge === 'spend') return charge > 0;
    return charge / stats.chargeMax >= B.chargeReleaseThreshold;
  };

  // Launch a chosen strike clip + its bookkeeping: spend stamina, (maybe) release
  // charge, arm a feint-payoff if a bait window is open, signal the foe, set the
  // post-strike cadence + follow-up nav. Shared by decideAttack (normal initiation)
  // and tryReadReaction (the conscious сбив / контра — which fires even under an
  // attack:'none' mode like CATCH, since a read punish is not normal initiation).
  const launchStrike = (t, atk) => {
    play(atk);
    stamina = THREE.MathUtils.clamp(stamina - attackStaminaCost(atk), 0, staminaMax); // spend силы on the strike (jab cheap, combo dear) — never gates the attack
    // CHARGE release (TEMPORARY decideRelease — near-full + foe in reach): empower
    // this strike ∝ the charge level (captured into chargeShot* for resolveImpact),
    // then SPEND it. Normal (un-released) attacks leave the charge untouched.
    if (decideRelease() && charge > 0) {
      const c01 = charge / stats.chargeMax;
      chargeShotPower = c01 * stats.chargePowerBonusMax;
      chargeShotPen = c01 * stats.chargePenetrationBonusMax;
      charge = Math.max(0, charge - stats.chargeMax * B.chargeReleaseFraction); // spend (full by default)
      if (onChargeRelease) onChargeRelease();
    }
    // Feint payoff: a real strike inside the advantage window punishes the bought
    // bluff — arm + consume the window (one-shot). resolveImpact reads the flag.
    if (feintBaited && feintAdvUntil && t < feintAdvUntil) { feintPayoffActive = true; feintAdvUntil = 0; feintBaited = false; }
    if (onAttackStart) onAttackStart(); // tell the foe an in-range attack is incoming (→ its block reflex)
    // Cadence: tempo sets the base pause; WEIGHT rides on top so heavy lands rare,
    // heavy blows and light strings frequent, light ones (the "rare heavy vs
    // frequent light" read) even at equal tempo. LOW STAMINA stretches the pause
    // (×staminaCadenceMul) → a tired fighter strikes less often.
    const heavyPause = lerp(-0.12, 0.4, weight01); // light shortens · heavy lengthens the gap
    const pause = (Math.max(0.06, lerp(0.85, 0.18, effTempo01) + heavyPause) + Math.random() * lerp(0.9, 0.3, effTempo01)) * staminaCadenceMul(); // effTempo01 = base tempo + intention delta (STRIKE quickens, STING eases)
    ai.nextAt = t + atk.dur + pause;
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
  };

  // --- Reading the foe's action phase (ЧТЕНИЕ — навык, не данность). The foe
  //     reports its TRUE phase via getActionPhase; this fighter does NOT act on it
  //     raw. updateRead() keeps a PERCEIVED phase that lags by readDelaySec and
  //     sometimes misses a transition (readMissChance) — both scaled by counter01
  //     (low → slow/blind, high → fast/sharp, never perfect). tryReadReaction()
  //     converts a good read into a conscious move: a perceived WINDUP in reach →
  //     a fast сбив (the landed jab interrupts the foe's windup via takeDamage); a
  //     perceived OPENING (recovery / stagger) in reach → a контра — a brief
  //     visible coil (gatherPose) then a lunge. CATCH/HOLD boost the read (the
  //     waiter pounces hardest), so CATCH converts a held wait into a strike. A
  //     rare ложное чтение (readFalseChance) makes it lunge at nothing. All numbers
  //     in combatBalance.read. Full motion only (reduced never reaches the AI tick).
  let truePhaseSeen = 'neutral'; // last TRUE foe phase observed (edge-tracking)
  let perceivedPhase = 'neutral'; // what THIS fighter currently BELIEVES the foe is doing (noised)
  let readPendingPhase = null; // a perceived-phase update waiting out the perception delay
  let readPendingAt = -1; // loop time the pending update lands (-1 = none)
  let readReactUntil = 0; // cooldown — next conscious read-reaction allowed (anti-spam)
  let gatherUntil = 0; // coil "tell" window before a контра lunge (0 = none)
  let lastReadAction = ''; // dev readout: 'sbiv' | 'contra' | 'contra?' (phantom)
  let lastReadActionAt = -1; // loop time of the last read-reaction (readout freshness)
  const updateRead = (t) => {
    const truePhase = getFoePhase ? getFoePhase() : 'neutral';
    if (truePhase !== truePhaseSeen) {
      truePhaseSeen = truePhase;
      const delay = readDelaySec(counter01) * (0.75 + Math.random() * 0.5); // jittered latency
      const missed = Math.random() < readMissChance(counter01); // failed to register this transition
      readPendingAt = t + delay;
      readPendingPhase = missed ? null : truePhase; // null = miss → perception stays stale (didn't see it)
    }
    if (readPendingAt >= 0 && t >= readPendingAt) {
      if (readPendingPhase != null) perceivedPhase = readPendingPhase;
      readPendingAt = -1; readPendingPhase = null;
    }
  };
  // Convert a read into a conscious сбив / контра. Returns true if it committed a
  // strike or opened a gather (caller then skips decideAttack this frame). Gated by
  // cooldown, reach, and a counter-scaled chance (CATCH/HOLD boosted). NOT gated by
  // intentionFlags.attack — that's the point: CATCH (attack:'none') can pounce here.
  const tryReadReaction = (t) => {
    if (t < readReactUntil) return false;
    const f = getFoePos && getFoePos();
    if (!f) return false;
    const c = counter01;
    const boost = intentionId === INTENTIONS.CATCH ? B.read.catchBoost : intentionId === INTENTIONS.HOLD ? B.read.holdBoost : 1;
    let phase = perceivedPhase;
    let phantom = false;
    // ложное чтение — believe in an opening that isn't there (rare; worse at low counter).
    if (phase === 'neutral' && Math.random() < readFalseChance(c) * boost) { phase = 'recovery'; phantom = true; }
    const dist = Math.hypot(f.x - group.position.x, f.z - group.position.z);
    if (phase === 'windup') {
      if (dist > STRIKE) return false; // must be in reach to land inside the foe's vuln window
      if (Math.random() > readWindupReactChance(c) * boost) return false;
      readReactUntil = t + B.read.reactCooldownSec;
      lastReadAction = 'sbiv'; lastReadActionAt = t;
      launchStrike(t, INTERCEPT); // fast intercept jab → catch the windup in time (→ staggerInterrupt in the foe)
      return true;
    }
    if (phase === 'recovery' || phase === 'stagger') {
      const reach = Math.min(character.range + RANGE_HYST, STRIKE);
      if (dist > reach) return false; // open but out of reach — let nav close in normally
      if (Math.random() > readOpenReactChance(c) * boost) return false;
      readReactUntil = t + B.read.reactCooldownSec;
      gatherUntil = t + B.read.gatherSec; // visible coil → the lunge fires on expiry (in update)
      lastReadAction = phantom ? 'contra?' : 'contra'; lastReadActionAt = t;
      return true;
    }
    return false;
  };

  // This fighter's OWN current action phase, reported to a reading foe (via the
  // foe's getFoePhase). 'windup' = early, interruptible swing (the сбив target);
  // 'commit' = past the vuln window, about to land (don't dive in); 'recovery' =
  // past the last impact, open; 'stagger' = interrupt-locked, wide open; 'neutral'
  // = nothing committed. Pure read of existing state — no cost, safe in reduced
  // motion (where no attack clips run → mostly neutral / stagger).
  const getActionPhase = () => {
    if (state !== 'alive') return 'neutral';
    if (lastT < staggerUntil) return 'stagger';
    if (clip && clip.windup) {
      if (lastT < windupVulnUntil) return 'windup';
      const ct = lastT - clipStart;
      const lastImpactT = clip.impacts ? clip.impacts[clip.impacts.length - 1] : clip.impact;
      if (typeof lastImpactT === 'number' && lastImpactT >= 0 && ct >= lastImpactT) return 'recovery';
      return 'commit';
    }
    return 'neutral';
  };

  // --- Step-in-under-the-strike (lunge). When the fighter commits to a move but the
  //     foe sits beyond that move's reach, it first closes with a WEIGHTED step (not a
  //     dash) to just inside reach, THEN strikes — so the limb actually lands on the
  //     body, not the air. After the clip, navigate gives ground back to neutral (the
  //     foe is now inside preferred range) → the "step out after" falls out for free.
  //     General: works for any move that carries a `reach` (arms now, kicks the same).
  const lunge = { active: false, atk: null, until: 0 };
  const beginLunge = (atk, t) => { lunge.active = true; lunge.atk = atk; lunge.until = t + B.lungeTimeoutSec; };
  const stepInForStrike = (t, dt) => {
    const f = getFoePos && getFoePos();
    if (!f || !lunge.atk) { lunge.active = false; return; }
    const dx = f.x - group.position.x;
    const dz = f.z - group.position.z;
    const d = Math.hypot(dx, dz) || 1e-4;
    const reach = lunge.atk.reach || character.range;
    if (d <= reach + 0.04) { const atk = lunge.atk; lunge.active = false; launchStrike(t, atk); return; } // arrived → strike
    if (t >= lunge.until) { // timed out (foe ran) → strike if barely in, else abort to navigate
      const atk = lunge.atk; lunge.active = false;
      if (d <= reach + B.reachHitTol) launchStrike(t, atk);
      else ai.nextAt = Math.max(ai.nextAt, t + 0.25); // brief pause so it re-spaces, not re-lunges every frame
      return;
    }
    requestMove(dx / d, dz / d, SLOW, Math.max(0, d - (reach - B.reachOverlap))); // weighted step in to just past reach (overlap → the limb sinks into the body)
  };

  // Autonomous combat (AI): pick a move, then either strike now (in reach) or step in
  // under it (lunge). The navigation closes to neutral spacing between strikes.
  // COMBO/PUNCH/DOUBLE are weighted; an incoming hit adds a rhythm hitch (in
  // takeDamage). Live random — no seed. Returns true if a strike / step-in started.
  const decideAttack = (t) => {
    if (clip || t < ai.nextAt || lunge.active) return false;
    if (intentionFlags.attack === 'none') return false; // this mode doesn't initiate (BREATHE / BREAK / CATCH) — it spaces / waits / guards instead
    const f = getFoePos && getFoePos();
    if (!f) return false;
    const dx = f.x - group.position.x;
    const dz = f.z - group.position.z;
    const d = Math.hypot(dx, dz);
    // ATTACK STYLE — the intention MODE leads, weight is the fallback. STING
    // ('light') throws quick singles; STRIKE ('heavy') commits the DOUBLE / COMBO
    // series; PRESS / HOLD ('free') use the fighter's own weight-led mix (heavy01:
    // light favours the single PUNCH, heavy commits the bigger moves).
    let atk;
    if (intentionFlags.attack === 'light') atk = PUNCH; // жалить — quick pokes
    else if (intentionFlags.attack === 'heavy') atk = Math.random() < 0.5 ? DOUBLE : COMBO; // рубить — heavy series
    else {
      const r = Math.random();
      const punchW = lerp(0.82, 0.12, heavy01); // light → mostly singles · heavy → mostly DOUBLE/COMBO
      atk = r < punchW ? PUNCH : r < punchW + 0.4 ? DOUBLE : COMBO;
    }
    const reach = atk.reach || character.range;
    if (d > reach + B.reachStepMax) return false; // too far even to step in → navigate closes neutral spacing first
    if (d <= reach + B.reachHitTol) {
      if (decideFeint(t)) return true; // TEMPORARY: sometimes a feint instead (only when in range to be read)
      launchStrike(t, atk); // already in reach → strike now
      return true;
    }
    beginLunge(atk, t); // close the gap with a weighted step, then strike
    return true;
  };
  // Under reduced motion the body holds still; resolve the key moment (the hit
  // lands) on cadence so a fight still progresses without any jitter.
  const reducedAttack = (t) => {
    if (t < ai.nextAt) return;
    if (intentionFlags.attack === 'none') return; // non-initiating mode (BREATHE / BREAK / CATCH) — no strike under reduced either
    // CHARGE release under reduced (same threshold decision): empower + spend.
    let pen = stats.blockPenetration; let chgBonus = 0;
    if (decideRelease() && charge > 0) {
      const c01 = charge / stats.chargeMax;
      chgBonus = c01 * stats.chargePowerBonusMax;
      pen = Math.max(pen, c01 * stats.chargePenetrationBonusMax);
      charge = Math.max(0, charge - stats.chargeMax * B.chargeReleaseFraction);
      if (onChargeRelease) onChargeRelease();
    }
    // Static fallback still rolls the attacker's miss first (no dodge anim under
    // reduced motion, but the MISS / HIT split holds so accuracy reads here too;
    // the defender's dodge still applies on contact in takeDamage).
    if (rollMiss()) { if (onMiss) onMiss(); } // MISS — attacker wide, no contact
    else if (onImpact) onImpact(strikeDamage({ dmgMult: B.moveMult.punch }) * (1 + chgBonus), pen); // punch-equivalent (strikeDamage already folds in stamina power penalty)
    stamina = THREE.MathUtils.clamp(stamina - B.staminaCostPunch, 0, staminaMax); // spend силы (punch-equivalent)
    // Cadence tracks tempo (+ a weight term), stretched by LOW STAMINA, so the
    // static fallback reads fast-light vs slow-heavy AND tires like the animated path.
    ai.nextAt = t + (Math.max(0.1, lerp(1.0, 0.4, effTempo01) + lerp(-0.15, 0.45, weight01)) + Math.random() * lerp(0.9, 0.4, effTempo01)) * staminaCadenceMul(); // effTempo01 folds in the intention's tempo bias
  };
  const setAI = (b) => {
    ai.on = b;
    if (b) {
      ai.nextAt = lastT + 0.3 + Math.random() * 0.6;
      nav.until = lastT + Math.random() * character.decideJit; // desync decision phase
      nav.mode = Math.random() < 0.5 ? 'circle' : 'approach';
      applyIntention(INTENTIONS.HOLD); // start neutral; the first tick re-picks
      // Deterministic intention desync (opponent picks half a tick out of phase)
      // so the two never re-pick in lock-step — no random, replay stays stable.
      intentionNextAt = lastT + (isOpp ? INTENTION_TICK_SEC * 0.5 : 0);
      foeMemory.length = 0; // fresh bout — forget the foe's earlier events
      // Fresh bout — clear the read perception + any pending gather/cooldown.
      perceivedPhase = 'neutral'; truePhaseSeen = 'neutral'; readPendingAt = -1; readPendingPhase = null;
      gatherUntil = 0; readReactUntil = 0; lastReadAction = ''; lastReadActionAt = -1;
      // Reset the model brain for the new bout: drop the held answer, clear the
      // break edges + cooldown + count, and bump the seq so any in-flight request
      // from the previous bout is ignored when it resolves.
      lastModelAnswer = null; modelReqSeq += 1; modelCooldownUntil = 0; modelRequestsThisBout = 0;
      modelBoutStarted = false;
      selfHpBroke = false; foeHpBroke = false; selfStamBroke = false; foeStamBroke = false;
      foeApproaching = null; foeCloseEMA = 0; foeLastDist = null;
    } else {
      lunge.active = false; // dropping AI cancels any pending step-in
    }
  };

  const update = (t, cam) => {
    const dt = Math.min(0.05, Math.max(0, t - lastT));
    lastT = t;
    hpUI.billboard(cam, group.scale.x); // face camera + constant on-screen size
    if (deadAt >= 0 && hpUI.mesh.visible && t - deadAt >= DEAD_HOLD_S) hpUI.mesh.visible = false; // DEAD: held 1s, then removed

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

    // Model brain (hybrid): per-frame break detector wakes a Claude call on fight
    // breaks. Only under brain='model' + an injected request fn — spinal default
    // makes zero requests. Runs before the tick so a just-cached answer can apply.
    if (ai.on && brain === 'model' && requestModelIntention && !intentionLock) tickModelBrain(t, dt);
    // Intention pick (~1/sec) BEFORE the axis re-derive, so a fresh mode shifts
    // range / aggression / stick / tempo on the same frame. Gated to autonomous
    // play (ai.on); runs in reduced motion too (it's fight logic, not animation).
    if (ai.on) tickIntention(t);
    // Compose the intention delta → effective axes + re-derive the affected
    // knobs. Runs in every alive state (incl. reduced motion: the axis shift is
    // fight logic, not animation).
    refreshAxes();

    // Reflex block stance auto-drops after its hold; a dev/manual hold (Infinity)
    // stays until toggled off. The stance pose itself is rendered below (or static
    // under reduced motion).
    if (blocking && blockUntil !== Infinity && t >= blockUntil) exitBlock();

    // Feint windows: after a feint, watch if the foe bites (blocks / dodges) inside
    // the bait window → open the advantage window; otherwise the feint just cost
    // stamina. The advantage window lapses on its own if no punish is thrown. Runs
    // in every alive state (the windows are fight logic, not animation).
    if (feintBaitUntil) {
      if (getFoeReacting && getFoeReacting()) { feintBaited = true; feintBaitUntil = 0; feintAdvUntil = t + B.feintAdvantageWindowSec; }
      else if (t > feintBaitUntil) feintBaitUntil = 0; // bait expired — bluff wasted
    }
    if (feintAdvUntil && t > feintAdvUntil) { feintAdvUntil = 0; feintBaited = false; } // advantage lapsed

    // Reduced motion: hold a static pose, face the foe, and resolve strikes as
    // key moments only — no locomotion, no clip playback (reads without jitter).
    if (reduced) {
      if (ai.on && !clip && state === 'alive') { faceInstant(); if (!blocking) reducedAttack(t); }
      stamina = THREE.MathUtils.clamp(stamina + staminaRegenRate * dt, 0, staminaMax); // no locomotion under reduced → recover (attack cost charged in reducedAttack; БАСТИОН-3 seam)
      tickCharge(dt); // charge builds under reduced too (numeric)
      hips.position.set(0, hipsBaseY, 0);
      if (blocking) {
        // static guard (no breath / jitter): forearms up, torso slightly closed
        torso.rotation.set(BLOCK_TORSO, 0, 0);
        armL.shoulder.rotation.x = BLOCK_SHX; armL.elbow.rotation.x = BLOCK_EHX;
        armR.shoulder.rotation.x = BLOCK_SHX; armR.elbow.rotation.x = BLOCK_EHX;
      } else if (lastT < staggerUntil) {
        // static jolt — knocked off balance, off-rhythm (no tremor)
        torso.rotation.set(0.16, 0, 0);
        armL.shoulder.rotation.x = 0; armL.elbow.rotation.x = 0;
        armR.shoulder.rotation.x = 0; armR.elbow.rotation.x = 0;
      } else {
        resetArms();
      }
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

    // Reading the foe (full motion only — reduced returns above). Advance the
    // perceived foe phase every alive frame (even mid-clip / block, so perception
    // keeps tracking), then resolve a pending контра coil: when the gather beat
    // elapses, the lunge fires (a fast PUNCH into the read opening). `gathering`
    // holds the body in the coil pose + suppresses nav / decideAttack until it lands.
    let gathering = false;
    if (ai.on && state === 'alive') {
      updateRead(t);
      if (gatherUntil > 0 && lastT >= gatherUntil) {
        gatherUntil = 0;
        if (!clip && !blocking && lastT >= staggerUntil) launchStrike(lastT, PUNCH); // the выпад after the coil
      }
      gathering = gatherUntil > 0 && lastT < gatherUntil;
    }

    // AI, when free (no clip + not gathering): turn to face the foe, then read the
    // foe → a conscious сбив / контра (tryReadReaction); only if no read fires does
    // it fall through to normal cadence attacking (decideAttack). A strike starts a
    // clip that plays out below this same frame. While in a block stance OR
    // staggered (interrupt lock) the fighter does NOT attack.
    if (ai.on && !clip && !gathering) {
      faceFoe(dt);
      if (!blocking && lastT >= staggerUntil && !lunge.active) { if (!tryReadReaction(t)) decideAttack(t); } // mid step-in: the lunge owns the decision
    }

    if (clip) {
      const ct = t - clipStart;
      if (clip.impacts) {
        for (let i = 0; i < clip.impacts.length; i++) {
          if (!clip.fired[i] && ct >= clip.impacts[i]) {
            clip.fired[i] = true;
            resolveImpact(clip, i); // per-impact limb (jab then cross) → range gate → miss → (foe) dodge → damage
          }
        }
      } else if (!clip.fired && clip.impact >= 0 && ct >= clip.impact) {
        clip.fired = true;
        resolveImpact(clip, 0); // range gate → attacker miss → (foe) dodge → damage
      }
      if (ct < clip.dur) {
        const v = sample(clip.keys, ct);
        apply(v);
        coreBoost = N(v.core);
      } else {
        if (clip.feint) feintActive = false; // the fake finished — clear the readable flag
        feintPayoffActive = false; // a payoff strike (or any clip) finished → consume the boost
        chargeShotPower = 0; chargeShotPen = 0; // a released strike finished → consume the charge boost
        windupVulnUntil = 0; // attack clip ended → no longer interruptible
        clip = null;
        dodgeRun = null;
        idlePose(bs);
      }
    } else if (blocking) {
      blockPose(bs); // hold the guard + plant (no nav / gait while blocking)
    } else if (lastT < staggerUntil) {
      idlePose(bs); // staggered (interrupt lock past the STAGGER clip) — plant, no nav
    } else if (gathering) {
      gatherPose(bs); // coiled "собрался" tell before the контра lunge — plant, no nav
    } else if (ai.on) {
      if (lunge.active) stepInForStrike(t, dt); // step in under the chosen strike, then launch it
      else navigate(t, dt, bs); // navigate toward / around the foe (sets the move intent)
    } else if (loco.active) {
      devGait(dt); // dev SLOW/FAST preview (sets the move intent)
    } else {
      idlePose(bs);
    }

    // Integrate weighted locomotion every frame: a clip / idle / gather frame sets
    // no intent, so carried velocity coasts to rest (inertia) without the gait
    // overwriting the clip / idle / block / coil pose. A locomotion frame animates the gait.
    stepLocomotion(dt, !clip && !blocking && !gathering && lastT >= staggerUntil && (ai.on || loco.active));

    // Stamina: drain on movement (prevMag set just above) / recover when collected.
    tickStamina(dt);
    // Charge: build in patient spacing (no clip + foe held at distance).
    tickCharge(dt);

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

    // Knock-back step (strong-hit отшат) — ease the whole body back over the reaction
    // and HOLD it (a real step, opens distance after the trade). Runs after the gait
    // integrate so it owns the position while it lasts.
    if (reactRun.active) {
      const u = THREE.MathUtils.clamp((t - reactRun.start) / reactRun.dur, 0, 1);
      const e = easeOut(u);
      group.position.x = THREE.MathUtils.clamp(reactRun.sx + reactRun.dx * e, -BX, BX);
      group.position.z = THREE.MathUtils.clamp(reactRun.sz + reactRun.dz * e, -BZ, BZ);
      if (u >= 1) reactRun.active = false;
    }

    // Contact spark — fade out + face the camera while it lasts (transient hit mark).
    if (spark.visible) {
      if (t >= sparkUntil) { spark.visible = false; sparkMat.opacity = 0; }
      else {
        sparkMat.opacity = THREE.MathUtils.clamp((sparkUntil - t) / FLASH_DUR, 0, 1);
        group.getWorldQuaternion(_sparkQ).invert();
        spark.quaternion.copy(_sparkQ).multiply(cam.quaternion); // billboard despite the group's facing
      }
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
    group, update, setReducedMotion, setNeutralColor, dispose,
    approach: () => play(APPROACH),
    punch: () => play(PUNCH),
    combo: () => play(COMBO),
    double: () => play(DOUBLE),
    frontKick: () => play(FRONT_KICK), // straight front snap kick (right leg) — trigger only
    teep: () => play(TEEP),            // push kick / толчковый (right leg) — trigger only
    knee: () => play(KNEE),            // knee strike up-forward (right leg) — trigger only
    hurt: () => play(HURT),
    dodge: () => play(DODGE),
    slow: () => toggleLoco('slow'),
    fast: () => toggleLoco('fast'),
    noteIncomingAttack, // foe-attack notification → block reflex (routed by ArenaScene)
    noteFoeMissed, // foe-whiff notification → КАПКАН counter window (routed by ArenaScene)
    setBlock, // dev / manual block toggle (true = hold stance, false = drop)
    toggleBlock: () => setBlock(!blocking),
    isBlocking: () => blocking,
    isDodging: () => !!(clip && clip.dodge), // mid-dodge (read by the foe's feint bait check)
    feint: () => doFeint(lastT), // dev / model entry — throw a feint now
    isFeinting: () => feintActive, // readable feint state (ФИНТ-branch seam)
    stagger: () => play(STAGGER), // dev — play the interrupt reaction clip
    isStaggered: () => lastT < staggerUntil, // readable interrupt-lock state (seam)
    getCharge: () => charge, // заряд (readable — HUNT/STING seam + dev readout)
    getChargeMax: () => stats.chargeMax,
    getCharge01: () => charge / stats.chargeMax,
    fillCharge: () => { charge = stats.chargeMax; }, // dev — top up to full
    discharge: () => { // dev — throw an empowered strike now (bypasses reach/cadence to inspect)
      if (clip || state !== 'alive' || charge <= 0) return;
      play(PUNCH);
      const c01 = charge / stats.chargeMax;
      chargeShotPower = c01 * stats.chargePowerBonusMax;
      chargeShotPen = c01 * stats.chargePenetrationBonusMax;
      charge = Math.max(0, charge - stats.chargeMax * B.chargeReleaseFraction);
      if (onChargeRelease) onChargeRelease();
      if (onAttackStart) onAttackStart();
    },
    getStamina: () => stamina, // запас сил (readable — ТЕНЬ-3 seam + dev readout)
    getStaminaMax: () => staminaMax,
    getStamina01: () => stamina01(),
    getActionPhase, // OWN action phase ('windup'|'commit'|'recovery'|'stagger'|'neutral') — a reading foe wires this into its getFoePhase
    // READ-ONLY snapshot of the currently-playing one-shot clip (null if none) —
    // pure read, changes nothing. The dev lab uses it for the time bar / frame
    // counter / contact markers: { dur, elapsed (s since clip start), impacts
    // (contact times s), windup (s), feint }. impacts is [] for clips with no
    // contact (HURT / DODGE / STAGGER / APPROACH / FEINT).
    getClipInfo: () => {
      if (!clip) return null;
      const impacts = clip.impacts
        ? clip.impacts.slice()
        : (typeof clip.impact === 'number' && clip.impact >= 0 ? [clip.impact] : []);
      return { dur: clip.dur, elapsed: Math.max(0, lastT - clipStart), impacts, windup: clip.windup || 0, feint: !!clip.feint };
    },
    getReadPhase: () => perceivedPhase, // what THIS fighter currently believes the foe is doing (noised read — dev readout)
    getReadAction: () => (lastReadActionAt >= 0 && lastT - lastReadActionAt < 1.0 ? lastReadAction : ''), // last сбив/контра, fresh ~1s (dev readout)
    getIntention: () => intentionId, // current intention id (readable — dev readout + model seam)
    setIntentionLock, // DEV: lock to one intention (id) or release (null) — inspect a signature in isolation
    setBrain: (b) => { brain = b; }, // swap the intention-picker strategy ('spinal' | 'model')
    getBrain: () => brain,
    getModelRead: () => (lastModelAnswer ? lastModelAnswer.read : ''), // last model "read" phrase (dev readout)
    getModelRequestCount: () => modelRequestsThisBout, // model wakes this bout (dev counter — confirm 5–10, not 80)
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
