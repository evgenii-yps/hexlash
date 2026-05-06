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
  // Prototype 10879 FogExp2(0x070811, 0.05). Floor 0x20202a + concrete texture
  // repeat(5,5) matches Profile/Training/MM/Create pattern. Walls 0x0e0e18
  // a touch bluer than Profile (0x14141c) — reads as the "clan hall" mood.
  // Each scene owns its texture instance — `repeat` is shared state on the
  // Texture object (see materials/concrete.js note).
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(5, 5);
  const floorMaterial = new THREE.MeshStandardMaterial({
    // 5L Phase 5 tweak 2 — floor color -5% lightness (0x20202a -> 0x1d1d27).
    // Slight darkening, preserves cool tint, reads as deeper "tomb" mood.
    map: floorTex, color: 0x1d1d27, roughness: 0.95, metalness: 0.02,
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

  // --- LIGHTING — port of prototype 10968-10982 (CLAN VIEW). ---
  // Targets / positions / colors VERBATIM from prototype (key → flag mid-
  // height y=2.5; rim×2 — pink L + gold R — for clan identity).
  // Intensities reduced ~50% from prototype to compensate for shared
  // CanvasLayer renderer exposure 2.3 vs prototype's 1.05 (key 1.6→0.8,
  // rim L 0.5→0.25, rim R 0.4→0.2, amb 0.4→0.3, hemi 0.35→0.25).
  //
  // Step 5 fine-tune (FINAL §5.18) — outer flags (PRED -3.5 / ANA +3.5)
  // sat outside the key cone after the initial port: π*0.25 ≈ 22.5° half-
  // angle on ~5m drop = ~2m radius at flag height, missing both outer
  // posts. Adjustments stack on the exposure-2.3 baseline:
  //   key intensity 0.8 → 1.2  (additional ×1.5 boost)
  //   key cone angle π*0.25 → π*0.35  (~62° half-angle, captures all 3 flags)
  //   ambient 0.3 → 0.4  (general fill so silhouettes read off-key-axis)
  // Rim L / Rim R intensities NOT bumped — they were already reading
  // (subtle pink stripe on PRED visible in user verify).
  scene.add(new THREE.AmbientLight(0x16161e, 0.4));
  scene.add(new THREE.HemisphereLight(0x1c1820, 0x06060c, 0.25));

  // Warm key spot — aimed at flag mid-height (y=2.5) per prototype intent.
  // Cone widened to π*0.35 to cover all 3 flag posts (-3.5/0/+3.5).
  const keyLight = new THREE.SpotLight(
    0xfff0e8, 1.2, 14, Math.PI * 0.35, 0.7, 1.4,
  );
  keyLight.position.set(0, 7, 2);
  keyLight.target.position.set(0, 2.5, 0);
  scene.add(keyLight, keyLight.target);

  // Rim L pink — picks out left flag edges + walls.
  // 5L Phase 5 tweak 1 — pink saturation +15% (0xff066f -> 0xff1a7d).
  // (255,6,111) -> (255,26,125): brightness/saturation boost, preserves hue.
  const rimL = new THREE.SpotLight(
    0xff1a7d, 0.25, 14, Math.PI * 0.4, 0.8, 1.6,
  );
  rimL.position.set(-6, 3, 0);
  rimL.target.position.set(0, 1.8, 0);
  scene.add(rimL, rimL.target);

  // Rim R gold — picks out right flag edges + walls. Clan identity = 2 rims.
  const rimR = new THREE.SpotLight(
    0xD4A843, 0.2, 14, Math.PI * 0.4, 0.8, 1.6,
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

  // --- FLAG TOTEMS (prototype 10964-10966) ---
  // 3 clan banners framing the room centre: PRED pink at x=-3.5, IRW gold
  // centre, ANA cyan at x=3.5. Each is a pole + concrete base + canvas-
  // texture cloth with accent stripe + emblem + 3-letter label. Factory
  // lives in src/scene/objects/clanFlag.js per "one object = one module".
  // 5L Phase 5 tweak 3 — save totem refs for sin-wave sway in tick.
  const flagPred = makeClanFlag(THREE, '#ff066f', -3.5, 'PRED');
  const flagIrw  = makeClanFlag(THREE, '#D4A843', 0,    'IRW');
  const flagAna  = makeClanFlag(THREE, '#4dd9ff', 3.5,  'ANA');
  scene.add(flagPred, flagIrw, flagAna);
  const flagTotems = [flagPred, flagIrw, flagAna];

  // Orbit tick — prototype 10880/scene loop equivalent: gentle camera sway
  // so the static composition breathes. Radius 7.5 matches initial position.
  // lookAt y=1.6 matches prototype line 10883 (and initial lookAt above).
  function tick(t) {
    const a = Math.sin(t * 0.08) * 0.2;
    camera.position.x = Math.sin(a) * 7.5;
    camera.position.z = Math.cos(a) * 7.5;
    camera.position.y = 2.6 + Math.sin(t * 0.2) * 0.05;
    camera.lookAt(0, 1.6, 0);
    dust.tick();
    // 5L Phase 5 tweak 3 — flag totem subtle wave (±0.02 rad ≈ ±1.15°).
    // Three totems out of phase (2π/3 offset each) so they don't sway in sync.
    for (let i = 0; i < flagTotems.length; i++) {
      const phaseOffset = i * (Math.PI * 2 / 3);
      flagTotems[i].rotation.z = Math.sin(t * 0.5 + phaseOffset) * 0.02;
    }
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
