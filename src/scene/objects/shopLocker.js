// Epic 2 — pit-view hub. Step 15.
// Shop locker: vending-machine-like cabinet. Metal body + feet + emissive
// canvas display with 2×3 cosmetic item grid + gold trim + top vent +
// floor glow disc + warm point light. Static — no tick animation.
//
// Source: prototype 5910-6014.

/**
 * Build the shop locker.
 * @param {import('three')} THREE
 * @param {import('three').Texture} metalTex — shared metal texture (same as arena posts)
 * @returns {import('three').Group} shop locker, positioned at (-8.5, 0, 3.5)
 */
export function buildShopLocker(THREE, metalTex) {
  const group = new THREE.Group();

  // Cabinet body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 2.2, 0.55),
    new THREE.MeshStandardMaterial({
      color: 0x1e1e28,
      roughness: 0.7,
      metalness: 0.35,
      map: metalTex,
    }),
  );
  body.position.y = 1.1;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Feet — flat base slab
  const feet = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.08, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x10101a, roughness: 0.9 }),
  );
  feet.position.y = 0.04;
  group.add(feet);

  // Display panel — canvas texture with cosmetic item grid
  const dpCv = document.createElement('canvas');
  dpCv.width = 256;
  dpCv.height = 384;
  const ctx = dpCv.getContext('2d');

  // bg + scanlines
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, 256, 384);
  for (let y = 0; y < 384; y += 3) {
    ctx.fillStyle = 'rgba(255,210,98,0.08)';
    ctx.fillRect(0, y, 256, 1);
  }
  // Title + subtitle
  ctx.fillStyle = '#FFD262';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('LOCKER', 80, 50);
  ctx.fillStyle = '#ff066f';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('COSMETICS', 84, 74);

  // 2×3 item grid — outlined rectangles with labels, each slot a different colour
  const slotColors = ['#FFD262', '#4dd9ff', '#A855F7', '#ff066f', '#2ee07f', '#FFA133'];
  const slotLabels = ['SKN', 'GLV', 'BST', 'TTL', 'BNR', 'NFT'];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      const x = 30 + c * 110;
      const y = 100 + r * 90;
      const colour = slotColors[r * 2 + c];
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 90, 70);
      ctx.fillStyle = colour;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(slotLabels[r * 2 + c], x + 32, y + 42);
    }
  }

  // toneMapped: false keeps the canvas emissive — without it r167 tone mapping
  // dims the display.
  const displayTex = new THREE.CanvasTexture(dpCv);
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.88, 1.72),
    new THREE.MeshBasicMaterial({ map: displayTex, toneMapped: false }),
  );
  display.position.set(0, 1.15, 0.291);
  group.add(display);

  // Gold trim — thin box around the display (behind it on Z)
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.78, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0xD4A843, roughness: 0.4, metalness: 0.85,
    }),
  );
  trim.position.set(0, 1.15, 0.28);
  group.add(trim);

  // Top ventilation strip
  const vent = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.05, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x0e0e18, roughness: 0.9 }),
  );
  vent.position.y = 2.15;
  group.add(vent);

  // Floor glow disc — gold radial gradient, additive
  const discCv = document.createElement('canvas');
  discCv.width = 256;
  discCv.height = 256;
  const dctx = discCv.getContext('2d');
  const grad = dctx.createRadialGradient(128, 128, 5, 128, 128, 128);
  grad.addColorStop(0,   'rgba(255,210,98,0.55)');
  grad.addColorStop(0.5, 'rgba(255,210,98,0.18)');
  grad.addColorStop(1,   'rgba(255,210,98,0)');
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

  // Warm gold point light in front of the display
  const light = new THREE.PointLight(0xFFD262, 0.45, 4, 2);
  light.position.set(0, 1.3, 0.6);
  group.add(light);

  // Placed near clanBanner but on the other side — face toward the ring
  group.position.set(-8.5, 0, 3.5);
  group.rotation.y = Math.PI / 5;
  group.userData.isClickable = true;
  group.userData.id = 'shop';

  return group;
}
