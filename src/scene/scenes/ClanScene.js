// Epic 5 — Sub-Epic 5D Step 2.
// Clan scene scaffold. Static-ish camera (prototype orbit added in tick) framing
// an industrial backdrop + 3 clan flag totems (Step 4). 6th consumer of the 5A
// buildOctagonalRoom helper (after Training / Matchmaking / Create / Profile /
// Ratings), 6th of createDustField (Step 3).
// Source: prototype hexlash_v24.html lines 10860-10998 (CLAN VIEW / openClan).

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';
import { createDustField } from '../objects/dustField.js';

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

  // --- LIGHTING (prototype 10969-10982) ---
  // Ambient + Hemi base fill slightly warmer-bluer than Profile — reads as
  // "the hall where clans gather" rather than a solo podium room.
  scene.add(new THREE.AmbientLight(0x16161e, 0.4));
  scene.add(new THREE.HemisphereLight(0x1c1820, 0x06060c, 0.35));

  // Warm key spot overhead — draws the eye down onto the flag totems (Step 4).
  const keyLight = new THREE.SpotLight(
    0xfff0e8, 1.6, 14, Math.PI * 0.25, 0.7, 1.4,
  );
  keyLight.position.set(0, 7, 2);
  keyLight.target.position.set(0, 2.5, 0);
  scene.add(keyLight, keyLight.target);

  // Rim lights — pink L / gold R — frame the totems from each side. Prototype
  // intensities 0.5 / 0.4 are set here; bump to ~1.0 / ~0.8 is expected as a
  // Step 5 follow-up after user visual verify (lesson #13, 4th precedent).
  const rimL = new THREE.SpotLight(
    0xff066f, 0.5, 14, Math.PI * 0.4, 0.8, 1.6,
  );
  rimL.position.set(-6, 3, 0);
  rimL.target.position.set(0, 1.8, 0);
  scene.add(rimL, rimL.target);

  const rimR = new THREE.SpotLight(
    0xD4A843, 0.4, 14, Math.PI * 0.4, 0.8, 1.6,
  );
  rimR.position.set(6, 3, 0);
  rimR.target.position.set(0, 1.8, 0);
  scene.add(rimR, rimR.target);

  // --- DUST via shared 5A helper (prototype 10957-10963) ---
  // 6th consumer of createDustField (Training / MM / Create / Profile /
  // Ratings / Clan). opacity=0.3 overrides helper default 0.45 — prototype
  // keeps the cloud subtle so the flag totems read clean.
  const dust = createDustField(THREE, {
    count: 60,
    xRadius: 5,
    zRadius: 4,
    yMin: 0.3,
    yMax: 4.3,
    driftSpeed: 0.0018,
    color: 0xffd9c8,
    size: 0.03,
    opacity: 0.3,
  });
  scene.add(dust.group);

  // Flag totems — Step 4.

  // Orbit tick — prototype 10880/scene loop equivalent: gentle camera sway
  // so the static composition breathes. Radius 7.5 matches initial position.
  function tick(t) {
    const a = Math.sin(t * 0.08) * 0.2;
    camera.position.x = Math.sin(a) * 7.5;
    camera.position.z = Math.cos(a) * 7.5;
    camera.position.y = 2.6 + Math.sin(t * 0.2) * 0.05;
    camera.lookAt(0, 2.0, 0);
    dust.tick();
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
