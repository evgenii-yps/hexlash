// Epic 5 — Sub-Epic 5B Step 1.
// Profile scene stub — Step 1 ships an empty scene with a camera only so the
// route can be wired + registered without dangling imports. Steps 2-4 fill in
// the octagonal room, lighting/shaft/dust, and empty podium.
// Source: prototype hexlash_v24.html lines 9335-9458 (sceneProfile).

const PR_ROOM_R = 14;
const PR_ROOM_H = 8;

export function buildProfileScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);

  // Static camera matching prototype 9350-9352. No orbit (user-confirmed:
  // no breath-drift either — sits still for the HUD to read clearly).
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 200);
  camera.position.set(0, 2.6, 8);
  camera.lookAt(0, 1.4, 0);

  function tick(/* t */) {
    // no-op in stub; Steps 3-4 add dust drift and (optionally) shaft pulse.
  }

  function dispose() {
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      const m = obj.material;
      if (m) {
        const mats = Array.isArray(m) ? m : [m];
        for (const mat of mats) {
          if (mat.map) mat.map.dispose();
          if (mat.dispose) mat.dispose();
        }
      }
    });
  }

  return { scene, camera, tick, dispose };
}

export { PR_ROOM_R, PR_ROOM_H };
