import * as THREE from 'three';
import { createAtmosphereRenderer } from '@/three/helpers/atmosphereScene.js';
import { makeFighterLowPoly, addArchetypeGlow } from '@/three/helpers/fighterLowPoly.js';
import { archColor } from '@/three/helpers/archetypeColors.js';
import { buildArena, RING_HEIGHT, RING_RADIUS } from './pitArena.js';
import {
  getFighterParts, snapshotParts, returnToIdle,
  applyIdleBob, startAttack, startDefend, startHitReact
} from '@/three/helpers/fighterAnim.js';

// Camera presets — three perspectives onto the same ring
const CAMERA_PRESETS = {
  pit:    { pos: [0, 4.5, 6.5], lookAt: [0, 1.5, 0], fov: 45 },
  side:   { pos: [7.5, 1.8, 0], lookAt: [0, 1.6, 0], fov: 38 },
  cinema: { pos: [3.5, 2.5, 5.5], lookAt: [0, 1.6, 0], fov: 32 },
};

const FIGHTER_LEFT_POS = { x: -1.2, z: 0 };
const FIGHTER_RIGHT_POS = { x:  1.2, z: 0 };

/**
 * Initialize the fight scene: 3D arena with 2 fighters, 3 camera modes,
 * and an event API for triggering attack/defend/hit animations
 * driven by an external state machine (cardFightState).
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} options
 * @param {Object} options.leftFighter — { archetype: string, skin?: string }
 * @param {Object} options.rightFighter — { archetype: string, skin?: string }
 * @returns {Object} controller
 *   .cleanup() — cancel RAF + remove listeners + dispose renderer
 *   .setCameraMode(mode) — 'pit'|'side'|'cinema'
 *   .triggerAction(side, action) — side: 'left'|'right', action: 'attack'|'defend'|'hit'
 *   .renderer, .scene, .camera — for debugging
 */
export function initFightScene(canvas, options = {}) {
  const leftSpec  = options.leftFighter  || { archetype: 'warden' };
  const rightSpec = options.rightFighter || { archetype: 'predator' };

  // Renderer + scene + camera
  const { renderer, scene, camera } = createAtmosphereRenderer(canvas);
  scene.fog = new THREE.FogExp2(0x070811, 0.030);

  // Arena (octagon ring with posts/ropes/cage) — reused from pitArena
  scene.add(buildArena());

  // Light shaft over ring (signature pit lighting)
  const shaft = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 8, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff0e8, transparent: true, opacity: 0.05,
      side: THREE.DoubleSide, depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  shaft.position.set(0, 4, 0);
  scene.add(shaft);

  // ── FIGHTERS ──
  const leftContainer = new THREE.Group();
  leftContainer.position.set(FIGHTER_LEFT_POS.x, RING_HEIGHT, FIGHTER_LEFT_POS.z);
  leftContainer.rotation.y = Math.PI / 2; // face right (+X)
  scene.add(leftContainer);
  const leftMesh = makeFighterLowPoly();
  leftContainer.add(leftMesh);
  addArchetypeGlow(leftContainer, archColor(leftSpec.archetype));

  const rightContainer = new THREE.Group();
  rightContainer.position.set(FIGHTER_RIGHT_POS.x, RING_HEIGHT, FIGHTER_RIGHT_POS.z);
  rightContainer.rotation.y = -Math.PI / 2; // face left (-X)
  scene.add(rightContainer);
  const rightMesh = makeFighterLowPoly();
  rightContainer.add(rightMesh);
  addArchetypeGlow(rightContainer, archColor(rightSpec.archetype));

  const leftParts = getFighterParts(leftMesh);
  const rightParts = getFighterParts(rightMesh);
  const leftBase = snapshotParts(leftParts);
  const rightBase = snapshotParts(rightParts);
  const leftBaseRotY = leftContainer.rotation.y;
  const rightBaseRotY = rightContainer.rotation.y;

  // ── LIGHTING ──
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.40));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));

  const key = new THREE.SpotLight(0xfff0e8, 2.4, 24, Math.PI * 0.22, 0.55, 1.4);
  key.position.set(0, 12, 0);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0003;
  scene.add(key, key.target);

  const rimL = new THREE.SpotLight(archColor(leftSpec.archetype), 1.0, 18, Math.PI * 0.4, 0.8, 1.6);
  rimL.position.set(-7, 3.2, -1.5);
  rimL.target.position.set(FIGHTER_LEFT_POS.x, 1.5, 0);
  scene.add(rimL, rimL.target);

  const rimR = new THREE.SpotLight(archColor(rightSpec.archetype), 1.0, 18, Math.PI * 0.4, 0.8, 1.6);
  rimR.position.set(7, 3.2, -1.5);
  rimR.target.position.set(FIGHTER_RIGHT_POS.x, 1.5, 0);
  scene.add(rimR, rimR.target);

  // ── CAMERA ──
  let cameraMode = 'pit';
  let camLerpFactor = 0.08;
  applyCameraPreset(cameraMode, true);

  function applyCameraPreset(mode, immediate = false) {
    const preset = CAMERA_PRESETS[mode] || CAMERA_PRESETS.pit;
    if (immediate) {
      camera.position.set(...preset.pos);
      camera.lookAt(...preset.lookAt);
      camera.fov = preset.fov;
      camera.updateProjectionMatrix();
    }
    cameraMode = mode;
  }

  function setCameraMode(mode) {
    if (!CAMERA_PRESETS[mode]) return;
    cameraMode = mode;
    // FOV change is immediate; pos/lookAt lerped in animation loop
    const preset = CAMERA_PRESETS[mode];
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();
  }

  // ── ANIMATION SYSTEM ──
  // Active anims: array of { side, parts, baseSnap, tick, startedAt }
  const activeAnims = [];

  function triggerAction(side, action) {
    const isLeft = side === 'left';
    const parts = isLeft ? leftParts : rightParts;
    const base = isLeft ? leftBase : rightBase;

    let tickFn = null;
    if (action === 'attack') {
      // Pick fist randomly for variety
      const fistSide = Math.random() < 0.5 ? 'L' : 'R';
      tickFn = startAttack(parts, base, fistSide);
    } else if (action === 'defend') {
      tickFn = startDefend(parts, base);
    } else if (action === 'hit') {
      tickFn = startHitReact(parts, base);
    } else {
      return;
    }
    if (!tickFn) return;
    activeAnims.push({ side, parts, base, tick: tickFn, startedAt: performance.now() });
  }

  // ── RESIZE ──
  const onResize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  // ── RENDER LOOP ──
  const t0 = performance.now();
  let animFrame = null;

  function tick() {
    const now = performance.now();
    const t = (now - t0) / 1000;

    // Camera lerp toward preset position/lookAt
    const preset = CAMERA_PRESETS[cameraMode];
    camera.position.x += (preset.pos[0] - camera.position.x) * camLerpFactor;
    camera.position.y += (preset.pos[1] - camera.position.y) * camLerpFactor;
    camera.position.z += (preset.pos[2] - camera.position.z) * camLerpFactor;
    camera.lookAt(preset.lookAt[0], preset.lookAt[1], preset.lookAt[2]);

    // Run active anims, drop completed
    const partsBusy = { left: false, right: false };
    for (let i = activeAnims.length - 1; i >= 0; i--) {
      const a = activeAnims[i];
      const elapsed = now - a.startedAt;
      const stillRunning = a.tick(elapsed);
      if (!stillRunning) {
        activeAnims.splice(i, 1);
      } else {
        partsBusy[a.side] = true;
      }
    }

    // Idle-settle parts that are not currently in an anim
    if (!partsBusy.left)  returnToIdle(leftParts, leftBase, 0.18);
    if (!partsBusy.right) returnToIdle(rightParts, rightBase, 0.18);

    // Container idle bob (always, gives life)
    applyIdleBob(leftContainer,  RING_HEIGHT, leftBaseRotY,  t, 0);
    applyIdleBob(rightContainer, RING_HEIGHT, rightBaseRotY, t, 1.5);

    // Glow pulse on archetype discs
    [leftContainer, rightContainer].forEach(c => {
      c.children.forEach(ch => {
        if (ch.userData?.isArchGlow && ch.material) {
          ch.material.opacity = 0.85 + Math.sin(t * 1.5) * 0.10;
        }
      });
    });

    renderer.render(scene, camera);
    animFrame = requestAnimationFrame(tick);
  }
  tick();

  // ── CLEANUP ──
  function cleanup() {
    if (animFrame) cancelAnimationFrame(animFrame);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  }

  return {
    cleanup,
    setCameraMode,
    triggerAction,
    renderer, scene, camera,
  };
}
