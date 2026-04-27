// Epic 5 — Sub-Epic 5E Step 1.
// Shop sub-scene — Step 1 minimal: octagonal room + camera + ambient only.
// Step 2 will add: key+rim spotlights, light shaft, floor disc, concrete podium,
// floating gloved hand, dust field, orbit camera tick.
//
// 7-th consumer of buildOctagonalRoom + (Step 2) createDustField.
// Source: prototype hexlash_v24.html lines 12379-12530 (sceneShop).

import { buildOctagonalRoom } from '../objects/octagonalRoom.js';

export function buildShopScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);

  // Camera FOV 42 — matches Clan (5D), diverges from Profile 40 / Ratings 44.
  // Prototype line 12397.
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 200);
  camera.position.set(0, 2.3, 7);
  camera.lookAt(0, 1.4, 0);

  // 7-th consumer of buildOctagonalRoom (after Training / Matchmaking / Create
  // / Profile / Ratings / Clan).
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e26, roughness: 0.95, metalness: 0.02,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x0e0e18, roughness: 0.95,
  });
  buildOctagonalRoom(THREE, scene, {
    R: 14,
    H: 9,
    floorRadius: 20,
    floorMaterial: floorMat,
    wallMaterial: wallMat,
    wallSegments: 8,
    fogColor: 0x070811,
    fogDensity: 0.05,
    receiveShadow: true,
  });

  // Step 1 minimal ambient — Step 2 will add hemi + key spot + rim spot at
  // intensities ~50% retuned from prototype 1.05 → v2 2.3 exposure (lessons
  // #19-21 absorbed).
  scene.add(new THREE.AmbientLight(0x16161e, 0.30));

  function tick(_t) {
    // Step 2 will fill: orbit camera + hand float + dust drift.
  }

  function dispose() {
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }

  return { scene, camera, tick, dispose };
}
