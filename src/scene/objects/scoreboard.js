// Epic 2 — pit-view hub. Step 13.
// Scoreboard: ratings/leaderboard plaque on the right wall. Dark backplate +
// golden torus frame + canvas-texture screen with top-5 rows + floor glow
// disc + warm point light. Static (no tick — prototype scoreboard is static).
//
// Source: prototype 5711-5808.

/**
 * Build the ratings scoreboard.
 * @param {import('three')} THREE
 * @returns {import('three').Group} scoreboard positioned on the right wall, facing the ring
 */
export function buildScoreboard(THREE) {
  const group = new THREE.Group();

  // Backplate (dark panel)
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.0, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x14141c, roughness: 0.75, metalness: 0.35,
    }),
  );
  back.castShadow = true;
  group.add(back);

  // Golden torus frame (stretched to an oval)
  const frame = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.02, 6, 32),
    new THREE.MeshStandardMaterial({
      color: 0xD4A843, roughness: 0.35, metalness: 0.85,
    }),
  );
  frame.rotation.z = Math.PI / 2;
  frame.scale.set(1.25, 0.78, 1);
  group.add(frame);

  // Screen face — canvas-rendered leaderboard
  const cv = document.createElement('canvas');
  cv.width = 400;
  cv.height = 250;
  const ctx = cv.getContext('2d');

  // bg
  ctx.fillStyle = '#0b0b14';
  ctx.fillRect(0, 0, 400, 250);
  // scanlines
  for (let y = 0; y < 250; y += 3) {
    ctx.fillStyle = 'rgba(255,210,98,0.10)';
    ctx.fillRect(0, y, 400, 1);
  }
  // Title + subtitle
  ctx.fillStyle = '#D4A843';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('LEADERBOARD', 20, 40);
  ctx.fillStyle = '#8a8a90';
  ctx.font = '11px monospace';
  ctx.fillText('SEASON 1', 20, 58);

  // Rows — rank in medal colour, name white, ELO gold
  const rows = [
    ['#1', 'LordNoctis', '2041'],
    ['#2', 'Kestrel.7',  '1994'],
    ['#3', 'Crowhaven',  '1962'],
    ['#4', 'SablePrey',  '1918'],
    ['#5', 'RuinPact',   '1877'],
  ];
  ctx.font = '14px monospace';
  rows.forEach((r, i) => {
    const y = 100 + i * 28;
    ctx.fillStyle = i === 0 ? '#FFD262'
      : i === 1 ? '#c6c6d0'
      : i === 2 ? '#cd7f32'
      : '#8a8a90';
    ctx.fillText(r[0], 20, y);
    ctx.fillStyle = '#fff';
    ctx.fillText(r[1], 70, y);
    ctx.fillStyle = '#FFD262';
    ctx.fillText(r[2], 320, y);
  });

  const screenTex = new THREE.CanvasTexture(cv);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.88),
    // toneMapped:false preserves the bright leaderboard under ACES.
    new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }),
  );
  screen.position.z = 0.045;
  group.add(screen);

  // Floor glow disc — canvas radial gradient, additive
  const discCv = document.createElement('canvas');
  discCv.width = 256;
  discCv.height = 256;
  const dctx = discCv.getContext('2d');
  const grad = dctx.createRadialGradient(128, 128, 5, 128, 128, 128);
  grad.addColorStop(0,   'rgba(212,168,67,0.55)');
  grad.addColorStop(0.5, 'rgba(212,168,67,0.2)');
  grad.addColorStop(1,   'rgba(212,168,67,0)');
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 256, 256);

  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2),
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
  disc.position.y = -1.4; // below the plaque, on the floor
  group.add(disc);

  // Warm gold point light in front of the plaque
  const light = new THREE.PointLight(0xD4A843, 0.55, 4.5, 2);
  light.position.set(0, 0, 0.8);
  group.add(light);

  // Position on the wall to the right of the terminal, facing the ring centre.
  // lookAt works with local position/rotation; no need to be added to a scene.
  group.position.set(10, 2.2, -5);
  group.lookAt(0, 2.2, 0);
  group.userData.isClickable = true;
  group.userData.id = 'ratings';

  return group;
}
