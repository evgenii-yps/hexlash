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
  // sin(t*0.08)*0.2 sway around radius 7.5. lookAt y=1.4 matches Profile
  // (line 23) for the same downward tilt — earlier y=1.6/2.0 framed the
  // flag mid-height instead of the floor + walls combined view.
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 200);
  camera.position.set(0, 2.6, 7.5);
  camera.lookAt(0, 1.4, 0);

  // --- FLOOR + WALLS + FOG via shared 5A helper ---
  // Prototype 10879 FogExp2(0x070811, 0.05). Concrete texture repeat(5,5)
  // matches Profile/Training/MM/Create pattern.
  //
  // Floor 0x2c2c34 + walls 0x14141c — Step 5 hot-fix #4 reverts Step 5
  // follow-up's "clan-hall mood" tint (0x24242e / 0x16161e) to literal
  // Profile baseline (lines 34/37). After 4 hot-fix iterations, divergences
  // from Profile across multiple dimensions (lighting, materials, camera)
  // were the readability blocker — full Profile parity for floor/walls
  // here, identity preserved only via flag totems + FOV 42 + slight orbit.
  // See EPIC5_5D_FINAL_REPORT §5.15.
  //
  // Each scene owns its texture instance — `repeat` is shared state on the
  // Texture object (see materials/concrete.js note).
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(5, 5);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTex, color: 0x2c2c34, roughness: 0.95, metalness: 0.02,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x14141c, roughness: 0.95,
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

  // --- EMISSIVE ACCENTS (Step 5 hot-fix #5 — H1 fix). ---
  // Diagnostic debug/5d-h1-emissive (commit dd05fbe) confirmed H1: scene
  // rendered dark because camera lookAt(0, 1.4, 0) framed empty air between
  // the 3 flag totems — pixel = scene.background through ACES = [1,1,2,255].
  // 4 prior hot-fix series tuned lighting / materials / camera tilt; all
  // missed the actual cause. Profile reads bright not from lighting but from
  // its emissive shaft + disc + bright concrete podium in centre-frame.
  //
  // Fix: add emissive geometry centred at lookAt point. Stylistically
  // Clan-not-Profile: 3-color floor disc (clan crest motif blend pink/gold/
  // cyan), 3 vertical accent shafts per flag, gold ring focal under IRW.
  // All MeshBasicMaterial + AdditiveBlending — lighting/fog independent.
  // See EPIC5_5D_FINAL_REPORT §5.16 + lessons #19/#20.

  // Centre floor disc — 3-color radial gradient (warm centre / gold / pink fade).
  const cdCv = document.createElement('canvas');
  cdCv.width = cdCv.height = 256;
  const cdCtx = cdCv.getContext('2d');
  const cdGrad = cdCtx.createRadialGradient(128, 128, 5, 128, 128, 128);
  cdGrad.addColorStop(0,    'rgba(255, 230, 210, 0.55)');
  cdGrad.addColorStop(0.35, 'rgba(212, 168, 67, 0.30)');
  cdGrad.addColorStop(0.70, 'rgba(255, 6, 111, 0.15)');
  cdGrad.addColorStop(1,    'rgba(0, 0, 0, 0)');
  cdCtx.fillStyle = cdGrad;
  cdCtx.fillRect(0, 0, 256, 256);
  const centerDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(cdCv),
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }),
  );
  centerDisc.rotation.x = -Math.PI / 2;
  centerDisc.position.y = 0.005;
  scene.add(centerDisc);

  // Three vertical accent shafts — one per flag, color matches flag accent.
  function makeShaft(THREE, accentHex, posX) {
    const shaft = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 6, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: accentHex, transparent: true, opacity: 0.05,
        side: THREE.DoubleSide, depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    shaft.position.set(posX, 3, 0);
    return shaft;
  }
  scene.add(makeShaft(THREE, 0xff066f, -3.5));
  scene.add(makeShaft(THREE, 0xD4A843, 0));
  scene.add(makeShaft(THREE, 0x4dd9ff, 3.5));

  // Gold ring focal under IRW flag — visual anchor at composition centre.
  const ringCv = document.createElement('canvas');
  ringCv.width = ringCv.height = 128;
  const ringCtx = ringCv.getContext('2d');
  ringCtx.strokeStyle = 'rgba(212, 168, 67, 0.9)';
  ringCtx.lineWidth = 6;
  ringCtx.beginPath();
  ringCtx.arc(64, 64, 50, 0, Math.PI * 2);
  ringCtx.stroke();
  const ring = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(ringCv),
      transparent: true, opacity: 0.5,
      depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.006, 0);
  scene.add(ring);

  // Orbit tick — prototype 10880/scene loop equivalent: gentle camera sway
  // so the static composition breathes. Radius 7.5 matches initial position.
  // lookAt y=1.4 matches Profile precedent — Step 5 hot-fix #4 reverts
  // earlier y=2.0 (which framed the flag mid-height instead of floor+walls).
  function tick(t) {
    const a = Math.sin(t * 0.08) * 0.2;
    camera.position.x = Math.sin(a) * 7.5;
    camera.position.z = Math.cos(a) * 7.5;
    camera.position.y = 2.6 + Math.sin(t * 0.2) * 0.05;
    camera.lookAt(0, 1.4, 0);
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
