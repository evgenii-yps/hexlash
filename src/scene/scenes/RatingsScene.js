// Epic 5 — Sub-Epic 5C Step 2.
// Ratings scene scaffold. Static camera framing a distant octagonal ring
// silhouette (added Step 4). Steps 3-4 layer lighting + shaft + dust + ring
// on top. 5th consumer of buildOctagonalRoom helper (after Training / MM /
// Create / Profile).
// Source: prototype hexlash_v24.html lines 10060-10200 (sceneRatings).

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';

const RA_ROOM_R = 16;
const RA_ROOM_H = 9;

export function buildRatingsScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);

  // Static camera matching prototype 10063-10067. No orbit, no breath-drift
  // (5B ProfileScene parity — readable HUD beats a moving backdrop). Sits
  // slightly back (z=9) to frame the distant ring silhouette added Step 4.
  const camera = new THREE.PerspectiveCamera(44, aspect, 0.1, 200);
  camera.position.set(0, 3, 9);
  camera.lookAt(0, 1.6, 0);

  // --- FLOOR + WALLS + FOG via shared 5A helper ---
  // Darker than Profile (0x1c1c24 floor / 0x0e0e16 walls) — reads as the
  // hush of a leaderboard hall rather than the living Profile room.
  // fogDensity 0.055 sits between Training/Create (0.035) and MM (0.06).
  // Concrete texture repeat(5,5) matches Profile/Training/MM/Create.
  // Each scene must own its texture instance — `repeat` is shared state on
  // the Texture object (see materials/concrete.js note).
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(5, 5);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTex, color: 0x1c1c24, roughness: 0.95, metalness: 0.02,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x0e0e16, roughness: 0.95,
  });
  buildOctagonalRoom(THREE, scene, {
    R: RA_ROOM_R, H: RA_ROOM_H,
    floorRadius: 22,
    floorMaterial, wallMaterial,
    fogDensity: 0.055,
  });

  // --- LIGHTING (Step 3) ---
  // --- VOLUMETRIC SHAFT (Step 3) ---
  // --- DUST via 5A helper (Step 3) ---
  // --- RING SILHOUETTE + 8 POSTS (Step 4) ---

  function tick(/* t */) {
    // TODO Step 3: dust drift tick.
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

export { RA_ROOM_R, RA_ROOM_H };
