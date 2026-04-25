// Epic 5 — Sub-Epic 5D Step 2.
// Clan scene scaffold. Static-ish camera (prototype orbit added in tick) framing
// an industrial backdrop + 3 clan flag totems (Step 4). 6th consumer of the 5A
// buildOctagonalRoom helper (after Training / Matchmaking / Create / Profile /
// Ratings), 6th of createDustField (Step 3).
// Source: prototype hexlash_v24.html lines 10860-10998 (CLAN VIEW / openClan).

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';
import { createDustField } from '../objects/dustField.js';
import { makeClanFlag } from '../objects/clanFlag.js';

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
  // Prototype 10879 FogExp2(0x070811, 0.05). Concrete texture repeat(5,5)
  // matches Profile/Training/MM/Create pattern.
  //
  // Floor 0x24242e + walls 0x16161e — brightened from prototype 0x20202a /
  // 0x0e0e18 as a Step 5 follow-up after visual verify. Prototype values
  // crush to black against fog 0.05 + ACES exposure 2.3 on target hardware
  // (only dust particles + flag accents read through). Bump keeps the
  // "clan hall" identity (still darker than Profile 0x2c2c34 / 0x14141c)
  // while restoring structural readability. Unplanned divergence — see
  // EPIC5_5D_FINAL_REPORT §5.
  //
  // Each scene owns its texture instance — `repeat` is shared state on the
  // Texture object (see materials/concrete.js note).
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(5, 5);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTex, color: 0x24242e, roughness: 0.95, metalness: 0.02,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x16161e, roughness: 0.95,
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

  // Lighting — Profile clone (Step 5 hot-fix #3, "abandon prototype intent" mode).
  // 4 предыдущих attempts (follow-up + 2 hot-fixes) не дали readability.
  // Replacing с literal copy ProfileScene.js:46-66 lighting block —
  // proven working precedent. Identity-divergence (clan flags + camera tilt)
  // сохраняется; lighting baseline = Profile.
  // Gold rim accent (clan identity) отложен до baseline verify — отдельный
  // mini-commit добавит обратно поверх рабочего baseline.
  // See EPIC5_5D_FINAL_REPORT §5.14 + lesson #16 final-final form.
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.45));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));

  const key = new THREE.SpotLight(0xfff0e8, 1.6, 14, Math.PI * 0.28, 0.55, 1.4);
  key.position.set(0, 7.5, 0);
  key.target.position.set(0, 0.5, 0);
  key.castShadow = true;
  key.shadow.mapSize.width = 1024;
  key.shadow.mapSize.height = 1024;
  scene.add(key);
  scene.add(key.target);

  const rim = new THREE.SpotLight(0xff066f, 0.5, 14, Math.PI * 0.4, 0.8, 1.6);
  rim.position.set(-7, 3, 0);
  rim.target.position.set(0, 1, 0);
  scene.add(rim);
  scene.add(rim.target);

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

  // --- FLAG TOTEMS (prototype 10964-10966) ---
  // 3 clan banners framing the room centre: PRED pink at x=-3.5, IRW gold
  // centre, ANA cyan at x=3.5. Each is a pole + concrete base + canvas-
  // texture cloth with accent stripe + emblem + 3-letter label. Factory
  // lives in src/scene/objects/clanFlag.js per "one object = one module".
  scene.add(makeClanFlag(THREE, '#ff066f', -3.5, 'PRED'));
  scene.add(makeClanFlag(THREE, '#D4A843', 0,    'IRW'));
  scene.add(makeClanFlag(THREE, '#4dd9ff', 3.5,  'ANA'));

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
