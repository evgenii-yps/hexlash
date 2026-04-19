// Epic 2 — pit-view hub. Step 14.
// Clan banner: vertical cloth banner on a pole with a concrete base.
// Source: prototype 5810-5907. Static — no tick animation.
//
// PATCH_EPIC2_STEPS_5_8.md — `concreteTex` is the shared `platformTex`
// (repeat 1,1). Do not create a new texture here; reuse the one passed in.

/**
 * Build the clan banner.
 * @param {import('three')} THREE
 * @param {import('three').Texture} concreteTex — shared platform concrete texture
 * @returns {import('three').Group} clan banner, positioned at (-7, 0, 4.5)
 */
export function buildClanBanner(THREE, concreteTex) {
  const group = new THREE.Group();

  // Pole — thin grey cylinder
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.8, 12),
    new THREE.MeshStandardMaterial({
      color: 0x3a3a42, roughness: 0.55, metalness: 0.7,
    }),
  );
  pole.position.y = 1.4;
  pole.castShadow = true;
  group.add(pole);

  // Concrete base at the foot of the pole
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.14, 12),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a22,
      roughness: 0.85,
      metalness: 0.25,
      map: concreteTex,
    }),
  );
  base.position.y = 0.07;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Top cap — small gold sphere at the pole tip
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 8),
    new THREE.MeshStandardMaterial({
      color: 0xD4A843, roughness: 0.35, metalness: 0.85,
    }),
  );
  cap.position.y = 2.82;
  group.add(cap);

  // Banner cloth — vertical canvas texture
  const clothCv = document.createElement('canvas');
  clothCv.width = 128;
  clothCv.height = 256;
  const cctx = clothCv.getContext('2d');

  // Dark burgundy base
  cctx.fillStyle = '#2a0914';
  cctx.fillRect(0, 0, 128, 256);
  // Pink accent stripe
  cctx.fillStyle = '#ff066f';
  cctx.fillRect(0, 90, 128, 24);
  // Gold emblem circle outline
  cctx.strokeStyle = '#D4A843';
  cctx.lineWidth = 3;
  cctx.beginPath();
  cctx.arc(64, 160, 28, 0, Math.PI * 2);
  cctx.stroke();
  // "CLAN" label at the top
  cctx.fillStyle = '#D4A843';
  cctx.font = 'bold 16px monospace';
  cctx.fillText('CLAN', 38, 40);
  // Subtle grain — 200 semi-transparent black pixels
  for (let i = 0; i < 200; i++) {
    cctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
    cctx.fillRect(Math.random() * 128, Math.random() * 256, 2, 2);
  }

  const clothTex = new THREE.CanvasTexture(clothCv);
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 1.4),
    new THREE.MeshStandardMaterial({
      map: clothTex,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );
  cloth.position.set(0.36, 1.9, 0);
  cloth.castShadow = true;
  group.add(cloth);

  // Floor glow disc — canvas radial gradient, additive
  const discCv = document.createElement('canvas');
  discCv.width = 256;
  discCv.height = 256;
  const dctx = discCv.getContext('2d');
  const grad = dctx.createRadialGradient(128, 128, 5, 128, 128, 128);
  grad.addColorStop(0,   'rgba(255,6,111,0.55)');
  grad.addColorStop(0.5, 'rgba(255,6,111,0.2)');
  grad.addColorStop(1,   'rgba(255,6,111,0)');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 256, 256);

  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.8),
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

  // Small pink point light near the base
  const light = new THREE.PointLight(0xff066f, 0.4, 4, 2);
  light.position.set(0, 0.6, 0);
  group.add(light);

  // Beside the new-fighter plinth — creates a "social area" corner
  group.position.set(-7, 0, 4.5);
  group.userData.isClickable = true;
  group.userData.id = 'clan';

  return group;
}
