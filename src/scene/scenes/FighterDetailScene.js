// Epic 3A — Fighter Detail scene.
// Step 2: scaffold — floor, walls, podium. No fighter, columns, lights, dust yet.
// Source: prototype hexlash_v24.html lines 7370-7445.
//
// Populated across:
//   - Step 2: scaffold (this file).
//   - Step 3: lighting, dust, light shaft.
//   - Step 4: fighter on podium (setKey).
//   - Step 5: branch columns + floor discs.
//   - Step 6: orbit camera tick.
//   - Step 7: picker for columns.

import { makeConcreteTexture } from '../materials/concrete.js';

const FD_ROOM_R = 14;
const FD_ROOM_H = 8;

export function buildFighterDetailScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);
  scene.fog = new THREE.FogExp2(0x070811, 0.035);

  const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 200);
  camera.position.set(0, 2.4, 7.0);
  camera.lookAt(0, 1.6, 0);

  // --- FLOOR (large, concrete) ---
  // Separate texture instance — repeat.set mutates shared state (see PATCH Step 6).
  const fdFloorTex = makeConcreteTexture(THREE);
  fdFloorTex.repeat.set(5, 5);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({
      map: fdFloorTex, color: 0x2c2c34, roughness: 0.95, metalness: 0.02,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- ROOM walls (octagonal, dim) ---
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x14141c, roughness: 0.95, metalness: 0.0,
  });
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2;
    const a2 = ((i + 1) / 8) * Math.PI * 2;
    const x1 = Math.cos(a1) * FD_ROOM_R, z1 = Math.sin(a1) * FD_ROOM_R;
    const x2 = Math.cos(a2) * FD_ROOM_R, z2 = Math.sin(a2) * FD_ROOM_R;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(wallLen, FD_ROOM_H),
      wallMat
    );
    wall.position.set((x1 + x2) / 2, FD_ROOM_H / 2, (z1 + z2) / 2);
    wall.lookAt(0, FD_ROOM_H / 2, 0);
    scene.add(wall);
  }

  // --- PODIUM (low concrete disc + metal ring) ---
  // Separate concrete texture — not the floor's (different repeat state).
  const fdPodiumTex = makeConcreteTexture(THREE);
  const podium = new THREE.Group();
  const podiumDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.5, 0.30, 32),
    new THREE.MeshStandardMaterial({
      map: fdPodiumTex, color: 0xa8a8b0, roughness: 0.9, metalness: 0.05,
    })
  );
  podiumDisc.position.y = 0.15;
  podiumDisc.receiveShadow = true;
  podiumDisc.castShadow = true;
  podium.add(podiumDisc);

  const podiumRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.42, 0.022, 8, 64),
    new THREE.MeshStandardMaterial({
      color: 0x4a4d58, roughness: 0.4, metalness: 0.85,
    })
  );
  podiumRing.rotation.x = Math.PI / 2;
  podiumRing.position.y = 0.30;
  podium.add(podiumRing);

  podium.position.z = 1.0; // bring fighter forward of future columns
  scene.add(podium);

  function tick(t) {
    // Empty — camera lerp added in Step 6, idle fighter in Step 4,
    // dust drift / emissive pulse in Steps 3/5.
  }

  function setKey(key) {
    // Step 4 will build/swap the fighter here.
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

  return {
    scene,
    camera,
    tick,
    setKey,
    dispose,
    clickableTargets: [],
  };
}

export { FD_ROOM_R, FD_ROOM_H };
