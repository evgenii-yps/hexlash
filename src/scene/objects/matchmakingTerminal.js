// Epic 3Bb Step 4 — Matchmaking central terminal.
// Stand (top + pole + base) + CRT body + dynamically-drawn canvas screen.
// Source: prototype hexlash_v24.html lines 10429-10472.
//
// Pattern 3Ba: one object = one module. NOT a parametric variant of the hub
// terminal.js — different size, position, screen pipeline (canvas-texture
// updated by useMatchmakingScreen vs procedural CRT blink).
//
// NOTE: `toneMapped: false` on the screen plane is the SECOND and LAST
// legitimate case in the v2 codebase (first: shopLocker display). Prototype
// parity with line 10469. Do not extend this list (white-list rule, 3A.1).

export function buildMatchmakingTerminal(THREE) {
  const group = new THREE.Group();

  // --- STAND (shared material for top + pole + base) ---
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e26, roughness: 0.85, metalness: 0.2,
  });

  const standTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.08, 1.2),
    standMat,
  );
  standTop.position.y = 0.78;
  standTop.castShadow = true;
  group.add(standTop);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.78, 12),
    standMat,
  );
  pole.position.y = 0.39;
  pole.castShadow = true;
  group.add(pole);

  // Base sits on the floor — no castShadow (would shadow the shadow).
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.06, 0.8),
    standMat,
  );
  base.position.y = 0.03;
  group.add(base);

  // --- CRT BODY (own darker material, not shared with stand) ---
  const crtBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.2, 1.0),
    new THREE.MeshStandardMaterial({
      color: 0x292932, roughness: 0.7, metalness: 0.25,
    }),
  );
  crtBody.position.y = 1.42;
  crtBody.castShadow = true;
  group.add(crtBody);

  // --- SCREEN (canvas texture, updated by useMatchmakingScreen) ---
  // CRT body front face sits at z=+0.5 (body depth 1.0, centered at z=0).
  // Screen at z=0.51 — 0.01 offset avoids z-fighting.
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 512;
  screenCanvas.height = 320;
  const screenCtx = screenCanvas.getContext('2d');

  // Initial dark fill — otherwise a white canvas flashes for one frame
  // before Step 5's refreshScreen runs.
  screenCtx.fillStyle = '#0a0a14';
  screenCtx.fillRect(0, 0, 512, 320);

  const screenTex = new THREE.CanvasTexture(screenCanvas);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.88),
    new THREE.MeshBasicMaterial({
      map: screenTex,
      toneMapped: false,
    }),
  );
  screen.position.set(0, 1.52, 0.51);
  group.add(screen);

  return {
    group,
    screenCanvas,
    screenCtx,
    screenTex,
    screen,
  };
}
