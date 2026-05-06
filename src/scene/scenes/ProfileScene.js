// Epic 5 — Sub-Epic 5B Step 4.
// Profile scene — Steps 1-3 scaffold / fog / lighting / shaft / disc / dust.
// Step 4 adds the empty podium at centre (no fighter — different from the
// hub or FD podium). After Step 4 the 3D layer is visually complete; HUD
// cards are added in Steps 5-9.
// Source: prototype hexlash_v24.html lines 9335-9458 (sceneProfile).

import { makeConcreteTexture } from '../materials/concrete.js';
import { buildOctagonalRoom } from '../objects/octagonalRoom.js';
import { createDustField } from '../objects/dustField.js';

const PR_ROOM_R = 14;
const PR_ROOM_H = 8;

export function buildProfileScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);

  // Static camera matching prototype 9350-9352. No orbit (user-confirmed:
  // no breath-drift either — sits still for the HUD to read clearly).
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 200);
  camera.position.set(0, 2.6, 8);
  camera.lookAt(0, 1.4, 0);

  // --- FLOOR + WALLS + FOG via shared 5A helper ---
  // Profile uses denser fog (0.045) than Training/Create (0.035) and lighter
  // than Matchmaking (0.06) — prototype 9348. Floor color 0x2c2c34 matches
  // Training/Matchmaking/Create; wall color 0x14141c also shared. Concrete
  // texture repeat(5,5) per prototype 9355-9356. Each scene must own its
  // texture instance — `repeat` is shared state on the Texture object.
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(5, 5);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTex, color: 0x2c2c34, roughness: 0.95, metalness: 0.02,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x14141c, roughness: 0.95,
  });
  buildOctagonalRoom(THREE, scene, {
    R: PR_ROOM_R, H: PR_ROOM_H,
    floorRadius: 20,
    floorMaterial, wallMaterial,
    fogDensity: 0.045,
  });

  // --- LIGHTING (prototype 9427-9442) ---
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.45));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));

  // Warm key spot overhead, casts shadow onto the podium (Step 4).
  // renderer.shadowMap is enabled in CanvasLayer (Epic 2 Step 3 hot-fix).
  const key = new THREE.SpotLight(0xfff0e8, 1.6, 14, Math.PI * 0.28, 0.55, 1.4);
  key.position.set(0, 7.5, 0);
  key.target.position.set(0, 0.5, 0);
  key.castShadow = true;
  key.shadow.mapSize.width = 1024;
  key.shadow.mapSize.height = 1024;
  scene.add(key);
  scene.add(key.target);

  // Pink rim from the left — picks out the edge of the podium + shaft.
  const rim = new THREE.SpotLight(0xff066f, 0.5, 14, Math.PI * 0.4, 0.8, 1.6);
  rim.position.set(-7, 3, 0);
  rim.target.position.set(0, 1, 0);
  scene.add(rim);
  scene.add(rim.target);

  // --- EMPTY PODIUM (prototype 9381-9391) ---
  // Slightly tapered concrete disc at centre. Intentionally empty — no
  // fighter, no hologram. The scene frames the HUD cards rather than a
  // character, matching the "dedicated Profile room" read of the prototype.
  // Separate concrete-texture instance from the floor (both mutate the
  // shared `repeat` field — see materials/concrete.js note). Podium uses
  // the default repeat (1,1) so the stains read at close range.
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.1, 0.20, 32),
    new THREE.MeshStandardMaterial({
      map: makeConcreteTexture(THREE), color: 0x8a8a92,
      roughness: 0.9, metalness: 0.05,
    })
  );
  podium.position.y = 0.10;
  podium.receiveShadow = true;
  podium.castShadow = true;
  scene.add(podium);

  // --- PINK VOLUMETRIC SHAFT (prototype 9393-9403) ---
  // Fake volumetrics via an additive-blended open cone over the podium.
  // Not a real light — purely decorative, ACES tone-maps with everything
  // else (no `toneMapped: false` override).
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 7, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xff066f, transparent: true, opacity: 0.06,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  shaft.position.set(0, 3.5, 0);
  scene.add(shaft);

  // --- PINK FLOOR DISC under the podium (prototype 9405-9425) ---
  // CanvasTexture radial gradient → PlaneGeometry flat on the floor.
  // This is a separate mesh from the podium itself (Step 4) — sits at
  // y=0.005 so it doesn't z-fight with the main floor.
  const discCv = document.createElement('canvas');
  discCv.width = discCv.height = 256;
  const discCtx = discCv.getContext('2d');
  const discGrad = discCtx.createRadialGradient(128, 128, 5, 128, 128, 128);
  discGrad.addColorStop(0, 'rgba(255,6,111,0.6)');
  discGrad.addColorStop(0.5, 'rgba(255,6,111,0.2)');
  discGrad.addColorStop(1, 'rgba(255,6,111,0)');
  discCtx.fillStyle = discGrad;
  discCtx.fillRect(0, 0, 256, 256);
  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(discCv),
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.005;
  scene.add(disc);

  // --- DUST via shared 5A helper (prototype 9444-9458 + drift 9547) ---
  // 70 warm particles, symmetric 10×10 spread, drift 0.002/frame upward,
  // opacity 0.4 overrides default 0.45. Matches prototype 1-to-1.
  // 4th consumer of createDustField (Training/Matchmaking/Create/Profile).
  const dust = createDustField(THREE, {
    count: 70,
    xRadius: 5,
    yMax: 4,
    driftSpeed: 0.002,
    color: 0xffd9c8,
    opacity: 0.4,
  });
  scene.add(dust.group);

  function tick(/* t */) {
    // User-confirmed: no camera orbit or breath-drift — prototype has a
    // slow auto-orbit (9537-9542), v2 keeps it static for readable HUD.
    dust.tick();
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

export { PR_ROOM_R, PR_ROOM_H };
