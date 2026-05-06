// Epic 3Bc Step 6 — Archetype glow disc + PointLight factory.
// 1-to-1 port of prototype hexlash_v24.html lines 8950-8983.
//
// Contract: `{ setColor(hex), dispose() }`.
// setColor rebuilds disc + light from scratch each call — canvas texture
// bakes the hex colour, so rebuild is cheaper than mutating 3 gradient
// stops and re-uploading the CanvasTexture. Prototype-parity also.
//
// Parent = podium (passed in). Glow disc sits at local y=0.31 (0.01 above
// the podium disc top plane at y=0.30 — avoids z-fighting with ring).
// Both disc and light are children of podium, so they inherit any podium
// transform. Dispose is idempotent on null refs.

const GLOW_CANVAS_SIZE = 256;
const GLOW_GRADIENT_INNER = 5;
const GLOW_GRADIENT_OUTER = 128;
const GLOW_ALPHA_INNER = 0.85;
const GLOW_ALPHA_MID = 0.35;
const GLOW_ALPHA_OUTER = 0;
const GLOW_MID_STOP = 0.45;

const GLOW_DISC_SIZE = 1.4;
const GLOW_DISC_Y = 0.31;

const GLOW_LIGHT_INTENSITY = 0.55;
const GLOW_LIGHT_DISTANCE = 3.5;
const GLOW_LIGHT_DECAY = 2;
const GLOW_LIGHT_POS = { x: 0, y: 0.5, z: 0 };

export function createArchetypeGlow(THREE, podium) {
  let disc = null;
  let light = null;

  function disposeCurrent() {
    if (disc) {
      podium.remove(disc);
      if (disc.geometry) disc.geometry.dispose();
      if (disc.material) {
        if (disc.material.map) disc.material.map.dispose();
        disc.material.dispose();
      }
      disc = null;
    }
    if (light) {
      podium.remove(light);
      light = null;
    }
  }

  function setColor(hex) {
    // Rebuild both — previous refs freed first so rapid setColor calls
    // (archetype carousel) don't leak canvas textures.
    disposeCurrent();

    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;

    const canvas = document.createElement('canvas');
    canvas.width = GLOW_CANVAS_SIZE;
    canvas.height = GLOW_CANVAS_SIZE;
    const ctx = canvas.getContext('2d');

    const mid = GLOW_CANVAS_SIZE / 2;
    const grad = ctx.createRadialGradient(
      mid, mid, GLOW_GRADIENT_INNER,
      mid, mid, GLOW_GRADIENT_OUTER,
    );
    grad.addColorStop(0, `rgba(${r},${g},${b},${GLOW_ALPHA_INNER})`);
    grad.addColorStop(
      GLOW_MID_STOP, `rgba(${r},${g},${b},${GLOW_ALPHA_MID})`,
    );
    grad.addColorStop(1, `rgba(${r},${g},${b},${GLOW_ALPHA_OUTER})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GLOW_CANVAS_SIZE, GLOW_CANVAS_SIZE);

    const tex = new THREE.CanvasTexture(canvas);

    disc = new THREE.Mesh(
      new THREE.PlaneGeometry(GLOW_DISC_SIZE, GLOW_DISC_SIZE),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = GLOW_DISC_Y;
    podium.add(disc);

    light = new THREE.PointLight(
      hex,
      GLOW_LIGHT_INTENSITY,
      GLOW_LIGHT_DISTANCE,
      GLOW_LIGHT_DECAY,
    );
    light.position.set(GLOW_LIGHT_POS.x, GLOW_LIGHT_POS.y, GLOW_LIGHT_POS.z);
    podium.add(light);
  }

  function dispose() {
    disposeCurrent();
  }

  return { setColor, dispose };
}
