// Epic 3A — Fight animation system.
// Step 12: playMove queue + applyAnim (6 types) + tickAnims.
// Pure logic, no Three.js import — consumes cached part refs + base snapshots
// from FightScene.js. Source: prototype hexlash_v24.html 8295-8387.
//
// anim = { side: 'left'|'right', type: 'jab'|'cross'|'hook'|'block'|'dodge'|'hit',
//          start: ms, duration: ms }

export const MOVE_TYPES = ['jab', 'cross', 'hook', 'block', 'dodge', 'hit'];

/**
 * Create an animation system bound to a fixed pair of fighters.
 * @param {object} leftParts  — { head, torso, foreL, foreR, fistL, fistR }
 * @param {object} rightParts
 * @param {object} leftBase   — snapshot with { pos, rot } per part key
 * @param {object} rightBase
 */
export function createAnimationSystem(leftParts, rightParts, leftBase, rightBase) {
  const ftAnims = [];

  function playMove(side, type) {
    const dur = (type === 'block' || type === 'dodge') ? 400 : 500;
    ftAnims.push({ side, type, start: performance.now(), duration: dur });
  }

  // t in [0,1]. easeInOut for sustained poses (block), sin(π·t) for impact (punch/hit).
  function applyAnim(parts, base, anim, t) {
    const e = (t < 0.5) ? (2 * t * t) : (-1 + (4 - 2 * t) * t);
    const punchOut = Math.sin(t * Math.PI);

    // Reset to base before adding anim offsets — prevents drift across frames.
    for (const k in parts) {
      const p = parts[k];
      const b = base[k];
      if (!p || !b) continue;
      p.position.copy(b.pos);
      p.rotation.copy(b.rot);
    }

    if (anim.type === 'jab') {
      const arm = parts.foreR;
      const fist = parts.fistR;
      if (arm)  arm.rotation.x  = base.foreR.rot.x + punchOut * -0.6;
      if (fist) fist.position.z = base.fistR.pos.z + punchOut *  0.45;
    } else if (anim.type === 'cross') {
      const arm = parts.foreL;
      const fist = parts.fistL;
      if (arm)  arm.rotation.x  = base.foreL.rot.x + punchOut * -0.7;
      if (fist) fist.position.z = base.fistL.pos.z + punchOut *  0.55;
      if (parts.torso) parts.torso.rotation.y = base.torso.rot.y + punchOut * 0.3;
      if (parts.head)  parts.head.rotation.y  = base.head.rot.y  + punchOut * 0.15;
    } else if (anim.type === 'hook') {
      const arm = parts.foreR;
      const fist = parts.fistR;
      if (arm)  arm.rotation.z  = base.foreR.rot.z + punchOut * -0.8;
      if (fist) fist.position.x = base.fistR.pos.x + punchOut * -0.30;
      if (fist) fist.position.z = base.fistR.pos.z + punchOut *  0.30;
      if (parts.torso) parts.torso.rotation.y = base.torso.rot.y - punchOut * 0.2;
    } else if (anim.type === 'block') {
      const lift = e;
      if (parts.fistL) parts.fistL.position.y = base.fistL.pos.y + lift * 0.10;
      if (parts.fistR) parts.fistR.position.y = base.fistR.pos.y + lift * 0.10;
      if (parts.foreL) parts.foreL.rotation.x = base.foreL.rot.x - lift * 0.4;
      if (parts.foreR) parts.foreR.rotation.x = base.foreR.rot.x - lift * 0.4;
    } else if (anim.type === 'dodge') {
      const tilt = punchOut;
      if (parts.torso) parts.torso.rotation.x = base.torso.rot.x - tilt * 0.18;
      if (parts.head)  parts.head.position.z  = base.head.pos.z  - tilt * 0.18;
    } else if (anim.type === 'hit') {
      const recoil = punchOut;
      if (parts.torso) parts.torso.position.z = base.torso.pos.z - recoil * 0.12;
      if (parts.head)  parts.head.rotation.z  = base.head.rot.z  + recoil * 0.18;
    }
  }

  function tickAnims() {
    const now = performance.now();

    // Idle fallback — when the queue is empty, snap both fighters back to base
    // so the next tickIdleAnimations pass reads clean transforms.
    if (ftAnims.length === 0) {
      for (const k in leftParts) {
        if (leftParts[k] && leftBase[k]) {
          leftParts[k].position.copy(leftBase[k].pos);
          leftParts[k].rotation.copy(leftBase[k].rot);
        }
      }
      for (const k in rightParts) {
        if (rightParts[k] && rightBase[k]) {
          rightParts[k].position.copy(rightBase[k].pos);
          rightParts[k].rotation.copy(rightBase[k].rot);
        }
      }
      return;
    }

    // Iterate backwards — splice is safe against the shrinking queue.
    for (let i = ftAnims.length - 1; i >= 0; i--) {
      const a = ftAnims[i];
      const t = (now - a.start) / a.duration;
      if (t >= 1) {
        ftAnims.splice(i, 1);
        continue;
      }
      const parts = (a.side === 'left') ? leftParts : rightParts;
      const base  = (a.side === 'left') ? leftBase  : rightBase;
      applyAnim(parts, base, a, t);
    }
  }

  function getAnims() {
    return ftAnims;
  }

  return { playMove, tickAnims, getAnims };
}
