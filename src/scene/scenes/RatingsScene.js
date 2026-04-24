// Epic 5 — Sub-Epic 5C Step 2.
// Ratings scene scaffold. Static camera framing a distant octagonal ring
// silhouette (added Step 4). Steps 3-4 layer lighting + shaft + dust + ring
// on top. 5th consumer of buildOctagonalRoom helper (after Training / MM /
// Create / Profile).
// Source: prototype hexlash_v24.html lines 10060-10200 (sceneRatings).

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';
import { createDustField } from '../objects/dustField.js';

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

  // --- LIGHTING (prototype 10142-10158) ---
  // Ambient + Hemi base fill — keeps the distant ring silhouette legible
  // without blowing out the fog. Tints slightly cooler than Profile.
  scene.add(new THREE.AmbientLight(0x14141c, 0.4));
  scene.add(new THREE.HemisphereLight(0x1c1820, 0x06060c, 0.3));

  // Warm key spot centred over the ring position (z=-3) — draws the eye
  // deep into the frame rather than on empty foreground. Target y=0.5 sits
  // at the ring platform top so shadow sets under the posts (Step 4).
  const raKey = new THREE.SpotLight(0xfff0e0, 1.4, 16, Math.PI * 0.25, 0.7, 1.4);
  raKey.position.set(0, 7, -3);
  raKey.target.position.set(0, 0.5, -3);
  scene.add(raKey);
  scene.add(raKey.target);

  // Pink rim from the left — the one allowed pink accent per the Neon
  // Discipline rule (one pink accent per screen; HUD your-row is the other
  // but that sits in DOM, not 3D). Targets the same deep-frame point.
  const raRim = new THREE.SpotLight(0xff066f, 0.6, 14, Math.PI * 0.4, 0.8, 1.6);
  raRim.position.set(-6, 3, 0);
  raRim.target.position.set(0, 1.5, -3);
  scene.add(raRim);
  scene.add(raRim.target);

  // Gold rim from the right — balances the pink rim; mirrors Matchmaking
  // and FD lighting rigs for visual rhythm across v2.
  const raRimR = new THREE.SpotLight(0xD4A843, 0.45, 14, Math.PI * 0.4, 0.8, 1.6);
  raRimR.position.set(6, 3, 0);
  raRimR.target.position.set(0, 1.5, -3);
  scene.add(raRimR);
  scene.add(raRimR.target);

  // --- VOLUMETRIC SHAFT (prototype 10160-10170) ---
  // Fake volumetrics via an additive open cone over the ring position.
  // Decorative only — not a real light. Wider base (radius 2.0) and
  // softer opacity (0.045) than Profile's shaft (1.4 / 0.06) because the
  // ring sits back and needs a bigger cone to feel ambient.
  const raShaft = new THREE.Mesh(
    new THREE.ConeGeometry(2.0, 6, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff0e0, transparent: true, opacity: 0.045,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  raShaft.position.set(0, 3.5, -3);
  scene.add(raShaft);

  // --- DUST via shared 5A helper (prototype 10173-10186) ---
  // 5th consumer of createDustField (Training / MM / Create / Profile / Ratings).
  // Asymmetric bounds — xRadius=6 wider than zRadius=5 to follow the room
  // shape. zOffset=-2 shifts the cloud toward the ring (visual weight where
  // the key spot reads). yInitSpread=3.7 explicit matches the default
  // (yMax-yMin) but kept for readability alongside other named params.
  const raDust = createDustField(THREE, {
    count: 60,
    xRadius: 6,
    zRadius: 5,
    xOffset: 0,
    zOffset: -2,
    yMin: 0.3,
    yMax: 4,
    yInitSpread: 3.7,
    driftSpeed: 0.002,
    color: 0xffd9c8,
    opacity: 0.3,
    size: 0.03,
  });
  scene.add(raDust.group);

  // --- RING SILHOUETTE + 8 POSTS (Step 4) ---

  function tick(/* t */) {
    raDust.tick();
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
