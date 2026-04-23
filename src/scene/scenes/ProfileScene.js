// Epic 5 — Sub-Epic 5B Step 2.
// Profile scene — Step 1 added camera, Step 2 adds fog + octagonal room via
// the 5A shared helper. Steps 3-4 fill in lighting/shaft/dust and the empty
// podium.
// Source: prototype hexlash_v24.html lines 9335-9379 (sceneProfile fog +
// floor + walls).

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';

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

  // --- FLOOR + WALLS + FOG via shared 5A helper ---
  // Profile uses denser fog (0.045) than Training/Create (0.035) and lighter
  // than Matchmaking (0.06) — prototype 9348. Floor color 0x2c2c34 matches
  // Training/Matchmaking/Create; wall color 0x14141c also shared. Concrete
  // texture repeat(5,5) per prototype 9355-9356. Each scene must own its
  // texture instance — `repeat` is shared state on the Texture object.
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(5, 5);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTex, color: 0x2c2c34, roughness: 0.95, metalness: 0.02,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x14141c, roughness: 0.95,
  });
  buildOctagonalRoom(THREE, scene, {
    R: PR_ROOM_R, H: PR_ROOM_H,
    floorRadius: 20,
    floorMaterial, wallMaterial,
    fogDensity: 0.045,
  });

  function tick(/* t */) {
    // no-op until Step 3 adds dust drift.
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
