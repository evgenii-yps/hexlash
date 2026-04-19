// Epic 2 — pit-view hub. Step 11.
// CRT terminal: matchmaking interactable. Stand + CRT box + canvas-texture
// screen with scanlines and blinking cursor. Pink screen glow via PointLight.
//
// Source: prototype 5583-5644 (geometry + canvas) + 7271-7282 (blink redraw).
//
// Returns { group, tickScreen(t) }:
//   group       — THREE.Group, caller scene.add(s) it
//   tickScreen  — call once per frame with elapsed seconds to animate cursor

/**
 * Build the CRT terminal interactable.
 * @param {import('three')} THREE
 * @returns {{ group: import('three').Group, tickScreen: (t: number) => void }}
 */
export function buildTerminal(THREE) {
  const group = new THREE.Group();

  // Stand / pedestal
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x141418, roughness: 0.8, metalness: 0.3,
  });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.7), standMat);
  stand.position.y = 0.5;
  stand.castShadow = true;
  group.add(stand);

  // CRT body
  const crtBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.7, 0.85),
    new THREE.MeshStandardMaterial({
      color: 0x18181c, roughness: 0.6, metalness: 0.3,
    }),
  );
  crtBody.position.y = 1.35;
  crtBody.castShadow = true;
  group.add(crtBody);

  // Screen face — canvas texture, emissive pink with scanlines
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 256;
  screenCanvas.height = 256;
  const sctx = screenCanvas.getContext('2d');

  // Initial paint — bg + scanlines + text + cursor block
  sctx.fillStyle = '#1a0612';
  sctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) {
    sctx.fillStyle = 'rgba(255,6,111,0.15)';
    sctx.fillRect(0, y, 256, 1);
  }
  sctx.fillStyle = '#FF066F';
  sctx.font = 'bold 22px monospace';
  sctx.fillText('SEARCHING...', 32, 90);
  sctx.fillStyle = '#ff4488';
  sctx.font = '14px monospace';
  sctx.fillText('OPPONENTS:  3', 32, 130);
  sctx.fillText('RANGE: ±100', 32, 152);
  sctx.fillText('TIME: 00:14', 32, 174);
  sctx.fillStyle = '#FF066F';
  sctx.fillRect(32, 200, 12, 14);

  const screenTex = new THREE.CanvasTexture(screenCanvas);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.55),
    // toneMapped:false preserves the bright CRT readout under ACES.
    new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }),
  );
  screen.position.set(0, 1.35, 0.43);
  group.add(screen);

  // Ambient glow — small pink point light in front of the screen
  const screenGlow = new THREE.PointLight(0xff066f, 0.6, 3.5, 2);
  screenGlow.position.set(0, 1.4, 1.0);
  group.add(screenGlow);

  // Place far right, outside the ring; angled toward the camera
  group.position.set(8, 0, -2.5);
  group.rotation.y = -Math.PI / 4;
  group.userData.isClickable = true;
  group.userData.id = 'matchmaking';

  // Blink state — kept in closure, not on a mesh.
  // Cursor toggles every 0.5s (Math.floor(t*2) changes on each half-second).
  let lastBlink = -1;

  function tickScreen(t) {
    const blinkState = Math.floor(t * 2);
    if (blinkState === lastBlink) return;
    lastBlink = blinkState;
    const cursorOn = blinkState % 2 === 0;
    // Repaint just the cursor cell (cover with bg, then draw if on)
    sctx.fillStyle = '#1a0612';
    sctx.fillRect(28, 195, 18, 22);
    if (cursorOn) {
      sctx.fillStyle = '#FF066F';
      sctx.fillRect(32, 200, 12, 14);
    }
    screenTex.needsUpdate = true;
  }

  return { group, tickScreen };
}
