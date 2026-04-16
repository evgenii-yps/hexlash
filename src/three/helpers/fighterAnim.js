import * as THREE from 'three';

/**
 * Get parts of a fighter group built by makeFighterLowPoly.
 * Uses userData.bodyPart tags (added in fighterLowPoly.js v1).
 *
 * @param {THREE.Group} fighterGroup — group returned by makeFighterLowPoly()
 * @returns {Object} { fistL, fistR, foreL, foreR, upperL, upperR, torso, head }
 */
export function getFighterParts(fighterGroup) {
  const parts = {};
  fighterGroup.traverse(obj => {
    if (obj.userData?.bodyPart) {
      parts[obj.userData.bodyPart] = obj;
    }
  });
  return parts;
}

/**
 * Snapshot base position+rotation of given parts so anim can return to idle.
 *
 * @param {Object} parts — output of getFighterParts
 * @returns {Object} { partKey: { pos: Vector3, rot: Euler } }
 */
export function snapshotParts(parts) {
  const snap = {};
  for (const key in parts) {
    const p = parts[key];
    snap[key] = { pos: p.position.clone(), rot: p.rotation.clone() };
  }
  return snap;
}

/**
 * Lerp a fighter back to its idle pose. Call from animation loop
 * for fighters not currently performing an attack/defense.
 * Coefficient 0.15 = ~6 frames to settle from large displacement.
 *
 * @param {Object} parts
 * @param {Object} baseSnap — output of snapshotParts taken at init
 * @param {number} k — lerp factor (default 0.15)
 */
export function returnToIdle(parts, baseSnap, k = 0.15) {
  for (const key in parts) {
    const p = parts[key];
    const base = baseSnap[key];
    if (!base) continue;
    p.position.lerp(base.pos, k);
    p.rotation.x += (base.rot.x - p.rotation.x) * k;
    p.rotation.y += (base.rot.y - p.rotation.y) * k;
    p.rotation.z += (base.rot.z - p.rotation.z) * k;
  }
}

/**
 * Idle bob animation (subtle vertical motion + sway). Apply to fighter container.
 *
 * @param {THREE.Group} container — outer group (positioned at ring level)
 * @param {number} baseY — ring height where container sits idle
 * @param {number} baseRotY — initial rotation.y to sway around
 * @param {number} t — current time in seconds (perf.now / 1000)
 * @param {number} phase — phase offset to desync two fighters (e.g. 0 for left, 1.5 for right)
 */
export function applyIdleBob(container, baseY, baseRotY, t, phase = 0) {
  container.position.y = baseY + Math.sin(t * 1.2 + phase) * 0.015;
  container.rotation.y = baseRotY + Math.sin(t * 0.6 + phase * 1.3) * 0.04;
}

/**
 * Fighter action types.
 */
export const ACTIONS = Object.freeze({
  IDLE: 'idle',
  ATTACK: 'attack',
  DEFEND: 'defend',
  HIT: 'hit',
});

/**
 * Trigger an attack: lunge fist forward + body lean forward.
 * Side: 'L' or 'R' — which fist to throw.
 * Returns a function tick(elapsedMs) → boolean (true if anim is still playing).
 *
 * Total duration: 380ms (140ms thrust + 240ms recovery).
 *
 * @param {Object} parts — getFighterParts(fighterGroup)
 * @param {Object} baseSnap — snapshotParts(parts) taken at init
 * @param {'L'|'R'} side
 * @returns {(ms: number) => boolean}
 */
export function startAttack(parts, baseSnap, side = 'R') {
  const THRUST_MS = 140;
  const RECOVER_MS = 240;
  const TOTAL = THRUST_MS + RECOVER_MS;

  const fistKey = side === 'L' ? 'fistL' : 'fistR';
  const foreKey = side === 'L' ? 'foreL' : 'foreR';
  const upperKey = side === 'L' ? 'upperL' : 'upperR';
  const fist = parts[fistKey];
  const fore = parts[foreKey];
  const upper = parts[upperKey];
  const torso = parts.torso;
  if (!fist || !fore || !upper || !torso) return () => false;

  const fistBase = baseSnap[fistKey];
  const foreBase = baseSnap[foreKey];
  const upperBase = baseSnap[upperKey];
  const torsoBase = baseSnap.torso;

  // Forward direction = +Z in fighter local space (faces forward)
  const fistTarget = fistBase.pos.clone().add(new THREE.Vector3(0, -0.05, 0.55));
  const foreTarget = foreBase.pos.clone().add(new THREE.Vector3(0, -0.02, 0.30));
  const upperRotXTarget = upperBase.rot.x - 0.4;
  const torsoZ = 0.10; // body lean forward

  return function tick(ms) {
    if (ms >= TOTAL) {
      // Snap back to base (returnToIdle in main loop will smooth)
      return false;
    }
    let t;
    if (ms < THRUST_MS) {
      // Thrust phase: fast ease-out
      t = ms / THRUST_MS;
      t = 1 - Math.pow(1 - t, 2);
    } else {
      // Recovery phase: slower ease-in back to base
      t = 1 - (ms - THRUST_MS) / RECOVER_MS;
      t = Math.pow(t, 2);
    }
    fist.position.lerpVectors(fistBase.pos, fistTarget, t);
    fore.position.lerpVectors(foreBase.pos, foreTarget, t);
    upper.rotation.x = upperBase.rot.x + (upperRotXTarget - upperBase.rot.x) * t;
    torso.position.z = torsoBase.pos.z + torsoZ * t;
    return true;
  };
}

/**
 * Trigger a defense: pull fists tight to face + body lean back.
 * Total duration: 600ms (200ms in, 200ms hold, 200ms out).
 *
 * @returns {(ms: number) => boolean}
 */
export function startDefend(parts, baseSnap) {
  const IN_MS = 200;
  const HOLD_MS = 200;
  const OUT_MS = 200;
  const TOTAL = IN_MS + HOLD_MS + OUT_MS;

  const fistL = parts.fistL, fistR = parts.fistR;
  const foreL = parts.foreL, foreR = parts.foreR;
  const torso = parts.torso;
  if (!fistL || !fistR || !torso) return () => false;

  const fistLBase = baseSnap.fistL, fistRBase = baseSnap.fistR;
  const foreLBase = baseSnap.foreL, foreRBase = baseSnap.foreR;
  const torsoBase = baseSnap.torso;

  // Pull fists toward face center, upward
  const fistLTarget = fistLBase.pos.clone().add(new THREE.Vector3(0.10, 0.10, -0.10));
  const fistRTarget = fistRBase.pos.clone().add(new THREE.Vector3(-0.10, 0.10, -0.10));
  const foreLTarget = foreLBase.pos.clone().add(new THREE.Vector3(0.05, 0.05, -0.05));
  const foreRTarget = foreRBase.pos.clone().add(new THREE.Vector3(-0.05, 0.05, -0.05));
  const torsoZ = -0.08; // lean back

  return function tick(ms) {
    if (ms >= TOTAL) return false;
    let t;
    if (ms < IN_MS) {
      t = ms / IN_MS;
    } else if (ms < IN_MS + HOLD_MS) {
      t = 1.0;
    } else {
      t = 1 - (ms - IN_MS - HOLD_MS) / OUT_MS;
    }
    fistL.position.lerpVectors(fistLBase.pos, fistLTarget, t);
    fistR.position.lerpVectors(fistRBase.pos, fistRTarget, t);
    foreL.position.lerpVectors(foreLBase.pos, foreLTarget, t);
    foreR.position.lerpVectors(foreRBase.pos, foreRTarget, t);
    torso.position.z = torsoBase.pos.z + torsoZ * t;
    return true;
  };
}

/**
 * Hit reaction: head snap + body recoil backward. Triggered when fighter takes damage.
 * Total duration: 320ms.
 *
 * @returns {(ms: number) => boolean}
 */
export function startHitReact(parts, baseSnap) {
  const TOTAL = 320;
  const head = parts.head;
  const torso = parts.torso;
  if (!head || !torso) return () => false;

  const headBase = baseSnap.head;
  const torsoBase = baseSnap.torso;

  return function tick(ms) {
    if (ms >= TOTAL) return false;
    const t = ms / TOTAL;
    // Head snap: fast peak at 0.2, decay to 0
    const peakHead = Math.sin(Math.PI * Math.min(t / 0.3, 1)) * (1 - t * 0.5);
    head.rotation.x = headBase.rot.x - 0.3 * peakHead;
    head.rotation.z = headBase.rot.z + 0.15 * peakHead;
    // Torso recoil: brief Z-back
    const peakTorso = Math.sin(Math.PI * Math.min(t / 0.4, 1)) * (1 - t);
    torso.position.z = torsoBase.pos.z - 0.12 * peakTorso;
    return true;
  };
}
