// Epic 3Ba Step 7a — Training click-to-hit.
// Subscribes to canvas mousedown, raycasts against the bag group, applies
// impulse through bagPhysics and spends 1 energy. If energy < 1, fires the
// onEnergyEmpty callback so the View can trigger its red flash overlay.
//
// Combo / tasks / tap-pop / particles / sound wire in Step 7b (extension).
//
// Source: prototype hexlash_v24.html lines 9762-9800 (tryHit impulse block).
// Touch (touchstart) intentionally omitted — deferred to Epic 5 (mobile).

import { getCanvasRef } from '@/scene/interaction/useCanvasRef.js';
import { trState } from '@/scene/interaction/useTrainingState.js';

export function attachClickToHit(THREE, camera, bag, applyImpulse, onEnergyEmpty) {
  const canvas = getCanvasRef();
  if (!canvas) {
    // Defensive: CanvasLayer publishes the canvas on mount. If the Training
    // View somehow runs before that, return a noop detach so teardown still
    // works. This matches the Epic 3A pattern (see FighterDetailView).
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

    // Impulse toward the hit direction. bag sits at (0,0,0) so hitPoint
    // minus bag.position is effectively the world-space hit vector.
    const hitPoint = hits[0].point;
    localDir.subVectors(hitPoint, bag.position).normalize();
    applyImpulse(localDir);

    // Energy spend.
    trState.energy = Math.max(0, trState.energy - 1);

    // Step 7b will add: combo + tasks + tap-pop + hit particles.
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
