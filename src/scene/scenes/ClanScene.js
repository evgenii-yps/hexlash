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

  // --- LIGHTING (prototype 10969-10982) ---
  // Ambient + Hemi base fill slightly warmer-bluer than Profile — reads as
  // "the hall where clans gather" rather than a solo podium room.
  scene.add(new THREE.AmbientLight(0x16161e, 0.4));
  scene.add(new THREE.HemisphereLight(0x1c1820, 0x06060c, 0.35));

  // Warm key spot overhead — illuminates the floor at origin so the
  // concrete disc + central area read clean. Target y=0.5 matches the
  // 5B Profile precedent (line 54). Earlier value y=2.5 aimed the cone
  // at flag mid-height instead of the floor — Step 5 hot-fix per
  // Step 5 follow-up visual verify.
  const keyLight = new THREE.SpotLight(
    0xfff0e8, 1.6, 14, Math.PI * 0.25, 0.7, 1.4,
  );
  keyLight.position.set(0, 7, 2);
  keyLight.target.position.set(0, 0.5, 0);
  scene.add(keyLight, keyLight.target);

  // Rim lights — pink L / gold R — frame the totems from each side. Prototype
  // intensities 0.5 / 0.4 read as unlit on target hardware against the dark
  // wall/fog combo (fog 0.05 + ACES exposure 2.3 crush dim pixels). Bumped
  // to 1.0 / 0.8 per Step 5 follow-up — 4th precedent of lesson #13 after
  // Training / Matchmaking / Ratings all applied identical retune.
  //
  // Targets bumped from y=1.8 (mid-flag) to y=1 — Step 5 hot-fix. Matches
  // 5B Profile precedent (line 64). Earlier y=1.8 aimed cones into open
  // air between the flags; new y=1 lands rim pools on the far walls.
  const rimL = new THREE.SpotLight(
    0xff066f, 1.0, 14, Math.PI * 0.4, 0.8, 1.6,
  );
  rimL.position.set(-6, 3, 0);
  rimL.target.position.set(0, 1, 0);
  scene.add(rimL, rimL.target);

  const rimR = new THREE.SpotLight(
    0xD4A843, 0.8, 14, Math.PI * 0.4, 0.8, 1.6,
  );
  rimR.position.set(6, 3, 0);
  rimR.target.position.set(0, 1, 0);
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
