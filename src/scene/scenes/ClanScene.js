// Epic 5 — Sub-Epic 5D Step 2.
// Clan scene scaffold. Static-ish camera (prototype orbit added in tick) framing
// an industrial backdrop + 3 clan flag totems (Step 4). 6th consumer of the 5A
// buildOctagonalRoom helper (after Training / Matchmaking / Create / Profile /
// Ratings), 6th of createDustField (Step 3).
// Source: prototype hexlash_v24.html lines 10860-10998 (CLAN VIEW / openClan).

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';
// createDustField import reserved for Step 3.

const CL_ROOM_R = 14;
const CL_ROOM_H = 9;

export function buildClanScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);

  // Camera FOV 42 — prototype-first per Q1 (diverges from Profile FOV 40 /
  // Ratings FOV 44). Prototype line 10881. Orbit tick added below draws
  // sin(t*0.08)*0.2 sway around radius 7.5.
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 200);
  camera.position.set(0, 2.6, 7.5);
  camera.lookAt(0, 1.6, 0);

  // --- FLOOR + WALLS + FOG via shared 5A helper ---
  // Prototype 10879 FogExp2(0x070811, 0.05). Floor 0x20202a + concrete texture
  // repeat(5,5) matches Profile/Training/MM/Create pattern. Walls 0x0e0e18
  // a touch bluer than Profile (0x14141c) — reads as the "clan hall" mood.
  // Each scene owns its texture instance — `repeat` is shared state on the
  // Texture object (see materials/concrete.js note).
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(5, 5);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTex, color: 0x20202a, roughness: 0.95, metalness: 0.02,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x0e0e18, roughness: 0.95,
  });
  buildOctagonalRoom(THREE, scene, {
    R: CL_ROOM_R,
    H: CL_ROOM_H,
    floorRadius: 20,
    floorMaterial,
    wallMaterial,
    wallSegments: 8,
    fogColor: 0x070811,
    fogDensity: 0.05,
    receiveShadow: true,
  });

  // lighting + dust — Step 3. Flag totems — Step 4.

  // Orbit tick — prototype 10880/scene loop equivalent: gentle camera sway
  // so the static composition breathes. Radius 7.5 matches initial position.
  function tick(t) {
    const a = Math.sin(t * 0.08) * 0.2;
    camera.position.x = Math.sin(a) * 7.5;
    camera.position.z = Math.cos(a) * 7.5;
    camera.position.y = 2.6 + Math.sin(t * 0.2) * 0.05;
    camera.lookAt(0, 2.0, 0);
    // dust.tick(t) wired in Step 3.
  }

  function dispose() {
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  return { scene, camera, tick, dispose };
}
