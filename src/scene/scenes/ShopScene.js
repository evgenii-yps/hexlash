// Epic 5 — Sub-Epic 5E Step 2.
// Full shop sub-scene: octagonal room + lighting + light shaft + floor disc +
// concrete podium + floating gloved hand + dust + orbit camera tick.
//
// 7-th consumer of buildOctagonalRoom + createDustField (after Training /
// Matchmaking / Create / Profile / Ratings / Clan).
//
// Source: prototype hexlash_v24.html lines 12379-12530 (sceneShop) +
// 12745-12767 (shopTick).
//
// Exposure compensation (lessons #19-21 absorbed): prototype renderer
// toneMappingExposure = 1.05; v2 CanvasLayer = 2.3 (delta ≈ 2.2x). All
// intensities reduced ~50% from prototype + spot cone angles widened ~1.4x
// for off-axis hand readability.

import { buildOctagonalRoom } from '../objects/octagonalRoom.js';
import { createDustField } from '../objects/dustField.js';
import { makeConcreteTexture } from '../materials/concrete.js';

export function buildShopScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);

  // Camera FOV 42 — matches Clan (5D), diverges from Profile 40 / Ratings 44.
  // Prototype line 12398. Initial position duplicated by tick on first frame.
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 200);
  camera.position.set(0, 2.3, 7);
  camera.lookAt(0, 1.4, 0);

  // ---------- ROOM (5A buildOctagonalRoom 7-th consumer) ----------
  // Floor + 8 walls + FogExp2. Prototype 12402-12426.
  // Note: prototype floor uses makeConcreteTexture map + repeat(5,5); helper
  // path drops the texture (color-only). Acceptable per Path A — divergence
  // documented in FINAL §5. Visually equivalent under exposure 2.3 + fog 0.05.
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

  // ---------- LIGHTING ----------
  // Prototype 12482-12492. Intensities ~50% retuned for exposure 2.3 (was
  // 0.45/0.4/1.8/0.6); spot cones widened ~1.4x (was π*0.25 / π*0.4) for
  // off-axis hand readability per lesson #21.
  scene.add(new THREE.AmbientLight(0x16161e, 0.30));
  scene.add(new THREE.HemisphereLight(0x1c1820, 0x06060c, 0.30));

  const keySpot = new THREE.SpotLight(
    0xfff0e8, 1.0, 14, Math.PI * 0.35, 0.65, 1.4,
  );
  keySpot.position.set(0, 7, 1);
  keySpot.target.position.set(0, 1.5, 0);
  keySpot.castShadow = true;
  scene.add(keySpot);
  scene.add(keySpot.target);

  const rimSpot = new THREE.SpotLight(
    0xFFD262, 0.40, 14, Math.PI * 0.45, 0.8, 1.6,
  );
  rimSpot.position.set(-5, 3, 1);
  rimSpot.target.position.set(0, 1.3, 0);
  scene.add(rimSpot);
  scene.add(rimSpot.target);

  // ---------- LIGHT SHAFT (volumetric cone) ----------
  // Prototype 12470-12479. Verbatim — additive blending suffices, no exposure
  // compensation needed (driven by opacity, not light flux).
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 6, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xFFD262,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  shaft.position.set(0, 3.2, 0);
  scene.add(shaft);

  // ---------- FLOOR DISC (warm-gold radial gradient under hand) ----------
  // Prototype 12494-12514. Canvas-based texture, additive plane.
  const discCanvas = document.createElement('canvas');
  discCanvas.width = discCanvas.height = 256;
  const discCtx = discCanvas.getContext('2d');
  const discGrad = discCtx.createRadialGradient(128, 128, 5, 128, 128, 128);
  discGrad.addColorStop(0, 'rgba(255,210,98,0.6)');
  discGrad.addColorStop(0.5, 'rgba(255,210,98,0.2)');
  discGrad.addColorStop(1, 'rgba(255,210,98,0)');
  discCtx.fillStyle = discGrad;
  discCtx.fillRect(0, 0, 256, 256);
  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(discCanvas),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.30;
  scene.add(disc);

  // ---------- PODIUM ----------
  // Prototype 12428-12438. Concrete texture map via shared helper.
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.3, 0.28, 32),
    new THREE.MeshStandardMaterial({
      map: makeConcreteTexture(THREE),
      color: 0x8c8c96,
      roughness: 0.9,
      metalness: 0.05,
    }),
  );
  podium.position.y = 0.14;
  podium.castShadow = true;
  podium.receiveShadow = true;
  scene.add(podium);

  // ---------- FLOATING GLOVED HAND ----------
  // Prototype 12440-12467. Group with main + thumb + wrist strap.
  // Main + thumb share material (warm gold transparent); wrist is darker.
  const hand = new THREE.Group();
  const handMainMat = new THREE.MeshStandardMaterial({
    color: 0xFFD262,
    roughness: 0.5,
    metalness: 0.1,
    transparent: true,
    opacity: 0.6,
  });
  const handMain = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.55, 0.9),
    handMainMat,
  );
  handMain.position.y = 0.35;
  hand.add(handMain);
  const handThumb = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.35),
    handMainMat,
  );
  handThumb.position.set(0.3, 0.25, 0.55);
  hand.add(handThumb);
  const wrist = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.15, 0.92),
    new THREE.MeshStandardMaterial({
      color: 0x222228,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
    }),
  );
  wrist.position.y = -0.02;
  hand.add(wrist);
  hand.position.y = 1.3;
  scene.add(hand);

  // ---------- DUST (5A createDustField 7-th consumer) ----------
  // Prototype 12516-12530 distribution: x±5, z±4, y[0.3, 4.3], drift +0.002,
  // wrap >4 → 0.3. Helper signature uses yMax=4 (not 4.3) — minor visual delta.
  const dustField = createDustField(THREE, {
    count: 60,
    xRadius: 5,
    zRadius: 4,
    yMin: 0.3,
    yMax: 4,
    driftSpeed: 0.002,
    color: 0xffd9c8,
    size: 0.03,
    opacity: 0.3,
  });
  scene.add(dustField.group);

  // ---------- TICK ----------
  // Verbatim port prototype 12745-12767 (orbit + hand + dust). Render itself
  // is driven by sceneRegistry → renderLoop, not in the tick body.
  function tick(t) {
    // orbit camera (period ~63s, radius 7)
    const a = Math.sin(t * 0.1) * 0.25;
    camera.position.x = Math.sin(a) * 7;
    camera.position.z = Math.cos(a) * 7;
    camera.position.y = 2.3 + Math.sin(t * 0.2) * 0.05;
    camera.lookAt(0, 1.4, 0);

    // hand float + rotate
    hand.position.y = 1.3 + Math.sin(t * 1.1) * 0.05;
    hand.rotation.y = Math.sin(t * 0.4) * 0.6;

    // dust drift via 5A helper
    dustField.tick();
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
