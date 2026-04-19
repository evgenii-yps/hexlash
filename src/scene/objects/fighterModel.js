/**
 * Hexlash v2 · fighterModel
 * ---------------------------------------------------------------
 * Low-poly 3D fighter model + idle animation registry + archetype glow disc.
 * Ported 1-for-1 from prototype `docs/visual-migration/hexlash_v24.html`:
 *   - makeFighterLowPoly      — lines 6051-6414
 *   - registerIdleFighter     — lines 6420-6422
 *   - tickIdleAnimations      — lines 6423-6486
 *   - addArchetypeGlow        — lines 6643-6667 (canvas-gradient disc)
 *
 * See also: docs/visual-migration/HANDOFF_FIGHTER_MODEL.md
 *
 * ---------------------------------------------------------------
 * API
 * ---------------------------------------------------------------
 * makeFighterLowPoly(THREE, variant?)
 *   Returns THREE.Group with EXACTLY 22 direct children in fixed order
 *   (indices 0..21, see contract below). Accessories (belt, tail, wraps)
 *   are appended after index 21 and stored in g.userData.accessories —
 *   they are .visible = false by default.
 *
 * registerIdleFighter(group, phaseOffset)
 *   group — wrapper Group whose children[0] is the fighter (22-part group).
 *   phaseOffset — seconds, used to de-sync multiple fighters.
 *
 * tickIdleAnimations(t)
 *   Call once per frame with elapsed seconds. Applies breathing/sway to
 *   every registered fighter. NOTE: uses entry.base snapshot to SET (not
 *   +=) positions per frame — prevents fist drift over time.
 *
 * unregisterIdleFighter(group)
 *   Removes `group` from the registry. Call in scene.onLeave or cleanup.
 *
 * addArchetypeGlow(fighterGroup, THREE, hexColor)
 *   Adds an emissive floor disc (canvas radial gradient, AdditiveBlending)
 *   under the fighter. Tagged with userData.isArchGlow = true for later
 *   removal. Not counted in the 22-child contract (added to fighterGroup,
 *   not to the inner 22-part group).
 *
 * ---------------------------------------------------------------
 * 22-CHILD CONTRACT (MUST NOT REORDER — idle indexes these)
 * ---------------------------------------------------------------
 *   [0]  head          (SphereGeometry, squashed)
 *   [1]  neck          (CylinderGeometry, visible = false)
 *   [2]  torso         (LatheGeometry, urn shape, scale(1,1,0.60))
 *   [3]  shoulderL     (SphereGeometry)
 *   [4]  shoulderR     (SphereGeometry)
 *   [5]  upperL        (CylinderGeometry, tapered)
 *   [6]  upperR        (CylinderGeometry, tapered)
 *   [7]  elbowL        (SphereGeometry)
 *   [8]  elbowR        (SphereGeometry)
 *   [9]  foreL         (CylinderGeometry, tapered)
 *   [10] foreR         (CylinderGeometry, tapered)
 *   [11] fistL         (SphereGeometry, dark glove 0x2a2d34)
 *   [12] fistR         (SphereGeometry, dark glove 0x2a2d34)
 *   [13] hipJoint      (BoxGeometry, visible = false)
 *   [14] thighL        (CylinderGeometry)
 *   [15] thighR        (CylinderGeometry)
 *   [16] kneeL         (SphereGeometry)
 *   [17] kneeR         (SphereGeometry)
 *   [18] shinL         (CylinderGeometry)
 *   [19] shinR         (CylinderGeometry)
 *   [20] footL         (SphereGeometry, scaled)
 *   [21] footR         (SphereGeometry, scaled)
 *
 * CRITICAL (see HANDOFF_FIGHTER_MODEL.md):
 *   - NEVER change the order of g.add(...) calls — tickIdleAnimations
 *     reaches into children[11], [16] etc. by INDEX.
 *   - torso geometry MUST have .scale(1, 1, 0.60) — without it, back bulges.
 *   - Gloves MUST be dark (0x2a2d34), not archetype colour.
 *   - Use MeshStandardMaterial everywhere. No flatShading: true.
 *   - Idle loop SETS positions from entry.base + offset, never += .
 * ---------------------------------------------------------------
 */

// Shared grayscale palette (from prototype lines 6037-6046).
// All unified at 0x6f7178 — archetype is shown via rim glow, not body colour.
const COL = {
  hoodie:  0x6f7178,
  pants:   0x6f7178,
  skin:    0x6f7178,
  hair:    0x161620,
  sneaker: 0x6f7178,
  gloves:  0x6f7178,
};

// Module-level registry of idle fighters. Pushed on register, spliced on unregister.
const idleFighters = [];

/**
 * Build a stylized low-poly fighter.
 * @param {import('three')} THREE
 * @param {'warden'|'predator'} [variant]
 * @returns {import('three').Group} group with 22 fixed-order children + optional accessories
 */
export function makeFighterLowPoly(THREE, variant) {
  variant = variant || 'warden';

  // Proportion profile — drives every geometry + pose offset below.
  // Keeps the 22-child index contract intact for idle animation.
  const P = (variant === 'predator') ? {
    // Predator: taller, leaner, longer limbs, narrower shoulders
    scaleY:      1.08,
    headW:       0.32,
    headH:       0.34,
    torsoTop:    0.34,
    torsoBot:    0.22,
    torsoH:      0.88,
    shoulderW:   0.26,
    shoulderH:   0.24,
    shoulderD:   0.28,
    shoulderX:   0.36,
    upperArmR:   0.11,
    upperArmH:   0.46,
    foreR:       0.095,
    foreH:       0.42,
    thighR:      0.13,
    thighH:      0.56,
    shinR:       0.095,
    shinH:       0.50,
    footW:       0.22,
    footH:       0.12,
    footD:       0.34,
    torsoLean:  -0.22,
    torsoTurn:   0.22,
    headTilt:    0.14,
    leadArmExt:  0.85,
    stanceWidth: 0.22,
    stanceStagger: 0.22,
  } : {
    // Warden: shorter, bulkier, square stance
    scaleY:      0.96,
    headW:       0.40,
    headH:       0.38,
    torsoTop:    0.48,
    torsoBot:    0.30,
    torsoH:      0.78,
    shoulderW:   0.34,
    shoulderH:   0.30,
    shoulderD:   0.36,
    shoulderX:   0.44,
    upperArmR:   0.16,
    upperArmH:   0.38,
    foreR:       0.13,
    foreH:       0.34,
    thighR:      0.18,
    thighH:      0.46,
    shinR:       0.13,
    shinH:       0.40,
    footW:       0.26,
    footH:       0.15,
    footD:       0.38,
    torsoLean:  -0.08,
    torsoTurn:   0.08,
    headTilt:    0.04,
    leadArmExt:  0.15,
    stanceWidth: 0.18,
    stanceStagger: 0.12,
  };

  // EDITORIAL REFRESH v24 — heavier silhouette.
  // NOTE: idle animation indexes children [0..21] strictly — keep that order.
  // All accessories (hood, belt, wraps, tattoos, heavier gloves) are added
  // after index 21 and tracked in g.userData.accessories.
  const g = new THREE.Group();

  const matBody = new THREE.MeshStandardMaterial({
    color: COL.hoodie, roughness: 0.82, metalness: 0.05,
  });
  const matPants = new THREE.MeshStandardMaterial({
    color: COL.pants, roughness: 0.88, metalness: 0.05,
  });
  const matSneaker = new THREE.MeshStandardMaterial({
    color: COL.sneaker, roughness: 0.7, metalness: 0.05,
  });
  const matSkin = new THREE.MeshStandardMaterial({
    color: COL.skin, roughness: 0.7, metalness: 0.0,
  });
  const matBelt = new THREE.MeshStandardMaterial({
    color: 0xD93A2F, roughness: 0.55, metalness: 0.0,
  });
  const matWrap = new THREE.MeshStandardMaterial({
    color: 0xF1E9D6, roughness: 0.92, metalness: 0.0,
  });

  // ---- HEAD — rounded block (sphere slightly squashed to stay head-shaped)
  const headGeo = new THREE.SphereGeometry(P.headW * 0.55, 16, 12);
  headGeo.scale(1.0, P.headH / (P.headW * 1.1), 0.92);
  const head = new THREE.Mesh(headGeo, matSkin);
  head.position.y = 1.74 * P.scaleY;
  head.castShadow = true;
  g.add(head); // 0

  // ---- NECK — kept for idle animation index stability (invisible)
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.19, 0.12, 6),
    matSkin,
  );
  neck.position.y = 1.52 * P.scaleY;
  g.add(neck); // 1 — hidden below

  // ---- TORSO — urn silhouette: narrow base, swelling up to broad shoulders,
  // slight taper at the neck. Classic amphora / funerary urn curve.
  const torsoPts = [];
  const H = P.torsoH;
  const rBase  = P.torsoBot * 0.55; // tight at hips
  const rFoot  = P.torsoBot * 0.75; // just above the base rim
  const rBelly = P.torsoBot * 1.00; // slight swell
  const rWaist = P.torsoTop * 0.80; // start widening
  const rChest = P.torsoTop * 1.15; // widest at shoulders
  const rShld  = P.torsoTop * 1.05; // slight inward at top shoulders
  const rNeck  = P.torsoTop * 0.40; // taper to neck
  torsoPts.push(new THREE.Vector2(0.001,       0));
  torsoPts.push(new THREE.Vector2(rBase * 0.6, H * 0.02));
  torsoPts.push(new THREE.Vector2(rBase,       H * 0.06));
  torsoPts.push(new THREE.Vector2(rFoot,       H * 0.14));
  torsoPts.push(new THREE.Vector2(rBelly,      H * 0.30));
  torsoPts.push(new THREE.Vector2(rWaist,      H * 0.48));
  torsoPts.push(new THREE.Vector2(rChest,      H * 0.75));
  torsoPts.push(new THREE.Vector2(rShld,       H * 0.88));
  torsoPts.push(new THREE.Vector2(rNeck,       H * 0.97));
  torsoPts.push(new THREE.Vector2(0.001,       H));
  const torsoGeo = new THREE.LatheGeometry(torsoPts, 24);
  torsoGeo.translate(0, -H / 2, 0);
  torsoGeo.scale(1, 1, 0.60); // CRITICAL: flatten front-to-back so shoulders don't bulge behind
  const torso = new THREE.Mesh(torsoGeo, matBody);
  torso.position.y = 1.14 * P.scaleY;
  torso.castShadow = true;
  g.add(torso); // 2

  // ---- SHOULDERS — smaller deltoid caps, tucked into torso
  const shoulderGeo = new THREE.SphereGeometry(P.shoulderW * 0.42, 14, 10);
  const shoulderL = new THREE.Mesh(shoulderGeo, matBody);
  shoulderL.position.set(-P.shoulderX + 0.02, 1.46 * P.scaleY, 0);
  shoulderL.castShadow = true;
  const shoulderR = new THREE.Mesh(shoulderGeo, matBody);
  shoulderR.position.set(P.shoulderX - 0.02, 1.46 * P.scaleY, 0);
  shoulderR.castShadow = true;
  g.add(shoulderL, shoulderR); // 3, 4

  // ---- UPPER ARMS — tapered: thick at shoulder, thinner toward elbow
  const upperArmGeo = new THREE.CylinderGeometry(
    P.upperArmR * 0.82, // top (elbow end) — narrower
    P.upperArmR * 1.05, // bottom (shoulder end) — wider
    P.upperArmH, 16,
  );
  const upperL = new THREE.Mesh(upperArmGeo, matBody);
  upperL.castShadow = true;
  const upperR = new THREE.Mesh(upperArmGeo, matBody);
  upperR.castShadow = true;
  g.add(upperL, upperR); // 5, 6

  // ---- ELBOWS — smaller joints
  const elbowGeo = new THREE.SphereGeometry(P.upperArmR * 0.82, 12, 10);
  const elbowL = new THREE.Mesh(elbowGeo, matBody);
  const elbowR = new THREE.Mesh(elbowGeo, matBody);
  g.add(elbowL, elbowR); // 7, 8

  // ---- FOREARMS — tapered: thick at elbow, thin at wrist
  const forearmGeo = new THREE.CylinderGeometry(
    P.foreR * 0.70, // top (wrist end) — thin
    P.foreR * 1.00, // bottom (elbow end) — thicker
    P.foreH, 16,
  );
  const foreL = new THREE.Mesh(forearmGeo, matBody);
  foreL.castShadow = true;
  const foreR = new THREE.Mesh(forearmGeo, matBody);
  foreR.castShadow = true;
  g.add(foreL, foreR); // 9, 10

  // ---- FISTS / GLOVES — VISIBLE rounded hands at wrist end.
  // CRITICAL: darker than body so they read as separate "gloves", but not
  // screaming neon — subtle character tone, not a traffic cone.
  const matGlove = new THREE.MeshStandardMaterial({
    color: 0x2a2d34, // near-black slate, slightly warmer than body
    roughness: 0.70, metalness: 0.15,
  });
  const fistGeo = new THREE.SphereGeometry(P.foreR * 1.00, 14, 12);
  const fistL = new THREE.Mesh(fistGeo, matGlove);
  fistL.scale.set(1, 1.0, 1.15);
  fistL.castShadow = true;
  const fistR = new THREE.Mesh(fistGeo, matGlove);
  fistR.scale.set(1, 1.0, 1.15);
  fistR.castShadow = true;
  g.add(fistL, fistR); // 11, 12

  // ---- HIP — hidden
  const hipJoint = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.22, 0.34),
    matPants,
  );
  hipJoint.position.y = 0.80 * P.scaleY;
  g.add(hipJoint); // 13

  // ---- THIGHS — rounded
  const thighGeo = new THREE.CylinderGeometry(P.thighR, P.thighR + 0.02, P.thighH, 14);
  const thighL = new THREE.Mesh(thighGeo, matPants);
  thighL.castShadow = true;
  const thighR = new THREE.Mesh(thighGeo, matPants);
  thighR.castShadow = true;
  g.add(thighL, thighR); // 14, 15

  // ---- KNEES — hidden
  const kneeGeo = new THREE.SphereGeometry(P.shinR + 0.01, 10, 8);
  const kneeL = new THREE.Mesh(kneeGeo, matPants);
  const kneeR = new THREE.Mesh(kneeGeo, matPants);
  g.add(kneeL, kneeR); // 16, 17

  // ---- SHINS — rounded
  const shinGeo = new THREE.CylinderGeometry(P.shinR, P.shinR + 0.02, P.shinH, 14);
  const shinL = new THREE.Mesh(shinGeo, matPants);
  shinL.castShadow = true;
  const shinR = new THREE.Mesh(shinGeo, matPants);
  shinR.castShadow = true;
  g.add(shinL, shinR); // 18, 19

  // ---- FEET — rounded boots (capsule-ish via scaled sphere)
  const footGeo = new THREE.SphereGeometry(0.16, 14, 10);
  footGeo.scale(P.footW / 0.32, P.footH / 0.32, P.footD / 0.32);
  const footL = new THREE.Mesh(footGeo, matSneaker);
  footL.castShadow = true;
  const footR = new THREE.Mesh(footGeo, matSneaker);
  footR.castShadow = true;
  g.add(footL, footR); // 20, 21

  // ============ GUARD STANCE (driven by profile P) ============
  // Legs: staggered base, width & stagger from profile
  const sy = P.scaleY;
  const sw = P.stanceWidth;
  const st = P.stanceStagger;
  thighL.position.set(-sw, 0.58 * sy, st * 0.5);
  thighL.rotation.x = -0.10;
  thighR.position.set(sw, 0.58 * sy, -st * 0.5);
  thighR.rotation.x = 0.12;
  kneeL.position.set(-sw, 0.38 * sy, st * 0.7);
  kneeR.position.set(sw, 0.38 * sy, -st * 0.3);
  shinL.position.set(-sw, 0.22 * sy, st);
  shinR.position.set(sw, 0.24 * sy, -st * 0.1);
  footL.position.set(-sw, 0.07, st * 1.2);
  footR.position.set(sw, 0.07, st * 0.1);

  // Torso lean & turn from profile
  torso.rotation.x = P.torsoLean;
  torso.rotation.y = P.torsoTurn;
  torso.position.y = 1.16 * sy;

  // Head: tucked chin, sits on shoulders
  head.rotation.y = P.torsoTurn * 0.8;
  head.rotation.x = P.headTilt;
  head.position.set(0.02, 1.76 * sy, 0.02);

  // LEAD ARM (left) — extension driven by P.leadArmExt
  //   ext=0: folded tight to face (Warden closed guard)
  //   ext=1: almost fully extended forward (Predator reaching jab)
  const ext = P.leadArmExt;
  shoulderL.position.set(-P.shoulderX - 0.04, 1.46 * sy, 0.06 + ext * 0.04);
  // Upper arm rotates from -0.5 (folded up) toward -1.2 (extended forward)
  const upperLAngle = -0.50 - ext * 0.70;
  upperL.rotation.set(upperLAngle, 0, 0.28 - ext * 0.08);
  upperL.position.set(
    -P.shoulderX - 0.06,
    1.46 * sy - Math.cos(upperLAngle) * P.upperArmH * 0.5,
    0.06 + Math.sin(-upperLAngle) * P.upperArmH * 0.5,
  );
  // Forearm continues from upper arm tip
  const upperLTipY = 1.46 * sy - Math.cos(upperLAngle) * P.upperArmH;
  const upperLTipZ = 0.06 + Math.sin(-upperLAngle) * P.upperArmH;
  const foreLAngle = -1.10 + ext * (-0.40); // more horizontal when extended
  foreL.rotation.set(foreLAngle, 0, 0.18);
  foreL.position.set(
    -P.shoulderX - 0.06,
    upperLTipY - Math.cos(foreLAngle) * P.foreH * 0.5,
    upperLTipZ + Math.sin(-foreLAngle) * P.foreH * 0.5,
  );
  elbowL.position.set(-P.shoulderX - 0.06, upperLTipY, upperLTipZ);
  // Fist at tip of forearm (wrist end)
  const foreLTipY = upperLTipY - Math.cos(foreLAngle) * P.foreH;
  const foreLTipZ = upperLTipZ + Math.sin(-foreLAngle) * P.foreH;
  fistL.position.set(-P.shoulderX - 0.06, foreLTipY, foreLTipZ);

  // REAR ARM (right) — always cocked back near face, doesn't change much
  shoulderR.position.set(P.shoulderX + 0.04, 1.46 * sy, -0.02);
  const upperRAngle = -0.45;
  upperR.rotation.set(upperRAngle, 0, -0.28);
  upperR.position.set(
    P.shoulderX + 0.04,
    1.46 * sy - Math.cos(upperRAngle) * P.upperArmH * 0.5,
    Math.sin(-upperRAngle) * P.upperArmH * 0.5 - 0.02,
  );
  const upperRTipY = 1.46 * sy - Math.cos(upperRAngle) * P.upperArmH;
  const upperRTipZ = Math.sin(-upperRAngle) * P.upperArmH - 0.02;
  const foreRAngle = -1.20;
  foreR.rotation.set(foreRAngle, 0, -0.18);
  foreR.position.set(
    P.shoulderX + 0.02,
    upperRTipY - Math.cos(foreRAngle) * P.foreH * 0.5,
    upperRTipZ + Math.sin(-foreRAngle) * P.foreH * 0.5,
  );
  elbowR.position.set(P.shoulderX + 0.02, upperRTipY, upperRTipZ);
  // Fist at tip of forearm (wrist end)
  const foreRTipY = upperRTipY - Math.cos(foreRAngle) * P.foreH;
  const foreRTipZ = upperRTipZ + Math.sin(-foreRAngle) * P.foreH;
  fistR.position.set(P.shoulderX + 0.02, foreRTipY, foreRTipZ);

  // ============ ACCESSORIES (after idx 21 — not touched by idle) ============
  const acc = [];

  // Belt — cylinder band (hidden by default; optional styling)
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.30, 0.06, 8, 1, true),
    matBelt,
  );
  belt.position.set(0, 0.94, 0);
  belt.castShadow = true;
  g.add(belt);
  acc.push(belt);

  // Belt tail — short strip hanging on front-left hip
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.16, 0.018),
    matBelt,
  );
  tail.position.set(-0.22, 0.84, 0.22);
  tail.rotation.z = 0.2;
  tail.castShadow = true;
  g.add(tail);
  acc.push(tail);

  // Wrist wraps — single thin band per wrist, near the fist
  const wrapGeo = new THREE.TorusGeometry(0.095, 0.02, 4, 10);
  const wrapL = new THREE.Mesh(wrapGeo, matWrap);
  wrapL.position.set(-0.36, 1.48, 0.42);
  wrapL.rotation.set(1.0, 0, 0.30);
  g.add(wrapL);
  acc.push(wrapL);
  const wrapR = new THREE.Mesh(wrapGeo, matWrap);
  wrapR.position.set(0.26, 1.60, 0.30);
  wrapR.rotation.set(1.2, 0, -0.30);
  g.add(wrapR);
  acc.push(wrapR);

  // Strip extras — keep a clean rounded silhouette.
  // Hide neck/hip. Fists are now VISIBLE gloves.
  neck.visible = false;      // child index 1
  hipJoint.visible = false;  // child index 13
  for (const a of acc) a.visible = false;

  g.userData.style = 'lowpoly';
  g.userData.accessories = acc;
  return g;
}

// ============ IDLE ANIMATION (continuous breathing / sway) ============
// Applied per-frame to all fighter groups. Each fighter gets a phase offset
// so they don't sway in sync.
//
// CRITICAL: this loop SETS positions (= base + offset), never accumulates (+=).
// Accumulating would drift fists upward over ~20s. See HANDOFF_FIGHTER_MODEL.md.

/**
 * Register a fighter wrapper for per-frame idle animation.
 * @param {import('three').Group} group — wrapper whose children[0] is the fighter
 * @param {number} [phaseOffset] — seconds, de-syncs multiple fighters
 */
export function registerIdleFighter(group, phaseOffset) {
  idleFighters.push({ group, phase: phaseOffset || 0 });
}

/**
 * Unregister a previously registered fighter. No-op if not found.
 * @param {import('three').Group} group
 */
export function unregisterIdleFighter(group) {
  const i = idleFighters.findIndex((e) => e.group === group);
  if (i >= 0) idleFighters.splice(i, 1);
}

/**
 * Advance idle animation for all registered fighters.
 * Call once per render frame with elapsed seconds.
 * @param {number} t — elapsed seconds (e.g. clock.getElapsedTime())
 */
export function tickIdleAnimations(t) {
  for (const entry of idleFighters) {
    const g = entry.group;
    const inner = g.children[0]; // the makeFighterLowPoly group
    if (!inner || !inner.children || inner.children.length < 22) continue;
    const p = entry.phase;

    // Snapshot base positions of fists/forearms/shoulders/knees once, so we can
    // set-not-accumulate each frame (otherwise += drifts fists into the air).
    if (!entry.base) {
      entry.base = {
        fistL_pos:   inner.children[11].position.clone(),
        fistR_pos:   inner.children[12].position.clone(),
        foreL_rotX:  inner.children[9].rotation.x,
        foreR_rotX:  inner.children[10].rotation.x,
        shoulderL_y: inner.children[3].position.y,
        shoulderR_y: inner.children[4].position.y,
        kneeL_y:     inner.children[16].position.y,
        kneeR_y:     inner.children[17].position.y,
      };
    }
    const base = entry.base;

    // Breathing: slight torso scale Y oscillation
    const breathe = Math.sin(t * 2.2 + p) * 0.008;
    inner.children[2].scale.y = 1 + breathe; // torso

    // Weight shift: whole body sways side to side
    const sway = Math.sin(t * 1.4 + p) * 0.015;
    inner.position.x = sway;

    // Bobbing: slight vertical bounce
    const bob = Math.sin(t * 2.8 + p) * 0.008;
    inner.position.y = bob;

    // Head micro-turn
    const headTurn = Math.sin(t * 0.8 + p * 1.3) * 0.06;
    inner.children[0].rotation.y = 0.10 + headTurn; // base + idle

    // Fists micro-movement (guard sway) — SET from base, don't accumulate
    const fistSway = Math.sin(t * 1.8 + p) * 0.02;
    const fistBob  = Math.sin(t * 2.5 + p + 0.5) * 0.015;
    inner.children[11].position.y = base.fistL_pos.y + fistBob;
    inner.children[11].position.x = base.fistL_pos.x + fistSway;
    inner.children[11].position.z = base.fistL_pos.z;
    inner.children[12].position.y = base.fistR_pos.y + fistBob * 0.8;
    inner.children[12].position.x = base.fistR_pos.x - fistSway * 0.7;
    inner.children[12].position.z = base.fistR_pos.z;

    // Forearms follow fists slightly — SET from base
    inner.children[9].rotation.x  = base.foreL_rotX + fistBob * 0.3;
    inner.children[10].rotation.x = base.foreR_rotX + fistBob * 0.25;

    // Shoulder micro-shift
    const shoulderRoll = Math.sin(t * 1.1 + p + 1.0) * 0.01;
    inner.children[3].position.y = base.shoulderL_y + shoulderRoll;
    inner.children[4].position.y = base.shoulderR_y - shoulderRoll;

    // Knee bend (weight shift)
    const kneeBend = Math.sin(t * 1.4 + p) * 0.02;
    inner.children[16].position.y = base.kneeL_y + kneeBend;
    inner.children[17].position.y = base.kneeR_y - kneeBend;
  }
}

// ============ ARCHETYPE GLOW (floor disc under fighter) ============
// Canvas radial-gradient disc, AdditiveBlending. Not part of the 22-child
// contract — added to the outer fighter wrapper group, not the inner fighter.

/**
 * Add an emissive floor disc tinted with the archetype colour under the fighter.
 * @param {import('three').Group} fighterGroup — outer wrapper (container)
 * @param {import('three').THREE|*} THREE
 * @param {number} hexColor — 0xRRGGBB
 */
export function addArchetypeGlow(fighterGroup, THREE, hexColor) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 5, 128, 128, 128);
  const r  = (hexColor >> 16) & 255;
  const gn = (hexColor >> 8) & 255;
  const b  = hexColor & 255;
  grad.addColorStop(0,    `rgba(${r},${gn},${b},0.7)`);
  grad.addColorStop(0.35, `rgba(${r},${gn},${b},0.3)`);
  grad.addColorStop(1,    `rgba(${r},${gn},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const discMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  // Disc sized to a fighter's footprint, not half the ring
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.01;
  disc.userData.isArchGlow = true;
  fighterGroup.add(disc);
}
