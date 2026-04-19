// Epic 2 — pit-view hub. Step 12.
// Plinth «+»: create-fighter interactable. Concrete pedestal with a glowing
// pink "+" on top, additive cone of light rising up, floor glow disc, pink
// point light.
//
// Source: prototype 5647-5709 (geometry) + user-spec tick rotation.
//
// Returns { group, shaft }:
//   group — THREE.Group, caller scene.add(s) it
//   shaft — the light cone; caller animates it (shaft.rotation.y = t * 0.05)
//
// PATCH_EPIC2_STEPS_5_8.md — `concreteTex` is the shared `platformTex`
// (repeat 1,1). Do not create a new texture here; reuse the one passed in.

/**
 * Build the create-fighter plinth.
 * @param {import('three')} THREE
 * @param {import('three').Texture} concreteTex — shared platform concrete texture
 * @returns {{ group: import('three').Group, shaft: import('three').Mesh }}
 */
export function buildPlinth(THREE, concreteTex) {
  const group = new THREE.Group();

  // Base pedestal — tapered cylinder with concrete material
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.62, 0.50, 16),
    new THREE.MeshStandardMaterial({
      color: 0x14141c,
      roughness: 0.85,
      metalness: 0.2,
      map: concreteTex,
    }),
  );
  base.position.y = 0.25;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Glowing "+" cross on top — two boxes, emissive pink via MeshBasicMaterial
  const plusMat = new THREE.MeshBasicMaterial({ color: 0xff066f });
  const plusH = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.06, 0.10), plusMat);
  plusH.position.y = 0.55;
  group.add(plusH);
  const plusV = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.50), plusMat);
  plusV.position.y = 0.55;
  group.add(plusV);

  // Rising column of light — additive, semi-transparent cone, apex up
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 3.5, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xff066f,
      transparent: true,
      opacity: 0.10,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  shaft.position.y = 2.25;
  shaft.rotation.x = Math.PI; // point up (apex up)
  group.add(shaft);

  // Floor glow disc — canvas radial gradient, additive
  const discCv = document.createElement('canvas');
  discCv.width = 256;
  discCv.height = 256;
  const dctx = discCv.getContext('2d');
  const grad = dctx.createRadialGradient(128, 128, 5, 128, 128, 128);
  grad.addColorStop(0,    'rgba(255,6,111,0.65)');
  grad.addColorStop(0.45, 'rgba(255,6,111,0.25)');
  grad.addColorStop(1,    'rgba(255,6,111,0)');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 256, 256);

  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(discCv),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.005;
  group.add(disc);

  // Tiny point light to tint the base
  const light = new THREE.PointLight(0xff066f, 0.5, 3.5, 2);
  light.position.set(0, 0.8, 0);
  group.add(light);

  // Place between heavy bag and the ring — "open slot" near the training area
  group.position.set(-5.5, 0, 5.5);
  group.userData.isClickable = true;
  group.userData.id = 'create';

  return { group, shaft };
}
