// Epic 3Ba Step 7a/7b — Training click-to-hit.
// Subscribes to canvas mousedown, raycasts against the bag group, applies
// impulse through bagPhysics, spends energy, and (7b) grows combo, updates
// daily tasks, spawns +N floating numbers + 3D hit particles.
//
// Sound wiring in Step 9 (useHitSound).
// Touch (touchstart) intentionally omitted — deferred to Epic 5 (mobile).
//
// Source: prototype 9762-9828 (tryHit), 9830-9839 (spawnTapPop).

import { getCanvasRef } from '@/scene/interaction/useCanvasRef.js';
import {
  trState,
  multiplierForCombo,
} from '@/scene/interaction/useTrainingState.js';

const COMBO_WINDOW_MS = 700;      // repeat within 700ms grows combo
const COMBO_SHOW_MS = 800;        // combo indicator life after last hit
const TAP_POP_LIFE_MS = 950;      // DOM element removal
const CRIT_MULT_THRESHOLD = 3;    // multiplier ≥ this → .crit styling

function spawnTapPop(x, y, value, crit) {
  // Attach to .app-v2 so the .app-v2 scoped CSS matches. Falls back to body
  // if somehow the root isn't mounted (shouldn't happen on /v2/training).
  const host = document.querySelector('.app-v2') || document.body;
  const el = document.createElement('div');
  el.className = 'tap-pop' + (crit ? ' crit' : '');
  el.textContent = '+' + value;
  el.style.left = x + 'px';
  el.style.top = (y - 10) + 'px';
  host.appendChild(el);
  setTimeout(() => el.remove(), TAP_POP_LIFE_MS);
}

export function attachClickToHit(
  THREE, camera, bag, applyImpulse, onEnergyEmpty, spawnHitParticles,
) {
  const canvas = getCanvasRef();
  if (!canvas) {
    // eslint-disable-next-line no-console
    console.warn('[useClickToHit] canvas not ready; click-to-hit disabled');
    return { detach: () => {} };
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const localDir = new THREE.Vector3();

  function tryHit(clientX, clientY) {
    if (!trState.active) return;
    if (trState.energy < 1) {
      if (onEnergyEmpty) onEnergyEmpty();
      return;
    }

    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(bag, true);
    if (!hits.length) return;

    const hitPoint = hits[0].point;
    const now = performance.now();

    // --- Combo (Step 7b, prototype 9787-9791) ---
    const dt = now - trState.lastHitAt;
    trState.lastHitAt = now;
    if (dt < COMBO_WINDOW_MS) trState.comboCount += 1;
    else trState.comboCount = 1;
    trState.multiplier = multiplierForCombo(trState.comboCount);
    trState.comboTimerExpiresAt = now + COMBO_SHOW_MS;
    trState.comboVisible = trState.multiplier > 1;

    // --- Impulse (Step 7a, prototype 9793-9800) ---
    localDir.subVectors(hitPoint, bag.position).normalize();
    applyImpulse(localDir);

    // --- Gain + tasks (Step 7b, prototype 9802-9818) ---
    const gain = 1 * trState.multiplier;
    trState.tapsEarned += gain;
    trState.energy = Math.max(0, trState.energy - 1);

    trState.taskHits += 1;
    if (!trState.taskHitsDone && trState.taskHits >= trState.taskHitsGoal) {
      trState.taskHitsDone = true;
    }
    if (trState.multiplier >= CRIT_MULT_THRESHOLD && !trState.taskCombosDone) {
      trState.taskCombos += 1;
      if (trState.taskCombos >= trState.taskCombosGoal) {
        trState.taskCombosDone = true;
      }
    }

    // --- Visuals (Step 7b) ---
    spawnTapPop(clientX, clientY, gain, trState.multiplier >= CRIT_MULT_THRESHOLD);
    if (spawnHitParticles) spawnHitParticles(hitPoint);

    // Step 9 will add: playHitSound(trState.multiplier).
  }

  function onMouseDown(e) {
    tryHit(e.clientX, e.clientY);
  }

  canvas.addEventListener('mousedown', onMouseDown);

  return {
    detach() {
      canvas.removeEventListener('mousedown', onMouseDown);
    },
  };
}
