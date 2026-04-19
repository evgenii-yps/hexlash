// Epic 2 — pit-view hub. Step 3.
// Каркас октагональной комнаты + полный свет из прототипа.
// Sources:
//   - lines 5040-5060 (scene/camera/fog setup)
//   - lines 5321-5363 (env: walls + ceiling)
//   - lines 6718-6758 (lighting)
//
// Step 3 notes:
//   - Fog: FogExp2(0x070811, 0.028) — по прототипу (5054). Hot-fix после Шага 3.
//   - FOV: 45° — по прототипу (5056). Hot-fix после Шага 3.
//   - ТЗ lookAt(0, 1, 0), прототип lookAt(0, 1.8, 0). Следуем ТЗ (Шаг 7 заменит на 1.5 через orbit tick).
//   - shadowMap на renderer НЕ включаем (Шаг 3 ТЗ не требует). Тени на Key spotlight выставлены
//     на будущее — начнут рендериться когда renderer.shadowMap.enabled=true будет выставлен.
//   - Пол/стены/потолок здесь временные. Шаг 6 заменит пол на более качественный из arena.js.

import { makeConcreteTexture } from '../materials/concrete.js';
import { makeMetalTexture } from '../materials/metal.js';
import { buildEnvironment } from '../objects/environment.js';
import { buildArena, RING_HEIGHT } from '../objects/arena.js';
import {
  makeFighterLowPoly,
  registerIdleFighter,
  tickIdleAnimations,
  addArchetypeGlow,
} from '../objects/fighterModel.js';
import { buildHeavyBag } from '../objects/heavyBag.js';
import { buildTerminal } from '../objects/terminal.js';

const ROOM_RADIUS = 18;
const ROOM_WALL_HEIGHT = 9;

export function buildPitScene(THREE, aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070811);
  scene.fog = new THREE.FogExp2(0x070811, 0.028);

  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(11, 5.5, 16);
  camera.lookAt(0, 1, 0);

  // --- LIGHTING ---
  scene.add(new THREE.AmbientLight(0x1a1a28, 0.35));
  scene.add(new THREE.HemisphereLight(0x2a2638, 0x0a0a12, 0.4));

  const key = new THREE.SpotLight(0xfff0e8, 2.4, 28, Math.PI * 0.22, 0.55, 1.4);
  key.position.set(0, 12, 0);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.width = 1024;
  key.shadow.mapSize.height = 1024;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  key.shadow.bias = -0.0003;
  scene.add(key);
  scene.add(key.target);

  const rimL = new THREE.SpotLight(0xff066f, 1.1, 22, Math.PI * 0.4, 0.8, 1.6);
  rimL.position.set(-9, 3.5, -2);
  rimL.target.position.set(0, 1.5, 0);
  scene.add(rimL);
  scene.add(rimL.target);

  const rimR = new THREE.SpotLight(0x4dd9ff, 0.6, 22, Math.PI * 0.45, 0.9, 1.6);
  rimR.position.set(9, 3.0, 2);
  rimR.target.position.set(0, 1.5, 0);
  scene.add(rimR);
  scene.add(rimR.target);

  const fill = new THREE.PointLight(0x202838, 0.6, 18, 2);
  fill.position.set(0, 2, 8);
  scene.add(fill);

  // --- CONCRETE TEXTURES ---
  // PATCH_EPIC2_STEPS_5_8.md: two SEPARATE textures, NOT one with .repeat changed.
  // platformTex stays as `concreteTex` (returned to caller for plinth/clanBanner reuse).
  const platformTex = makeConcreteTexture(THREE);
  platformTex.repeat.set(1, 1);
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(6, 6);
  const concreteTex = platformTex; // alias for downstream consumers (plinth, clanBanner)

  // --- METAL TEXTURE (arena posts; reused by shopLocker in Step 15) ---
  const metalTex = makeMetalTexture(THREE);

  // --- OCTAGONAL WALLS ---
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x18181f,
    roughness: 0.95,
    metalness: 0.0,
  });
  const roomSides = 8;
  for (let i = 0; i < roomSides; i++) {
    const a1 = (i / roomSides) * Math.PI * 2;
    const a2 = ((i + 1) / roomSides) * Math.PI * 2;
    const x1 = Math.cos(a1) * ROOM_RADIUS;
    const z1 = Math.sin(a1) * ROOM_RADIUS;
    const x2 = Math.cos(a2) * ROOM_RADIUS;
    const z2 = Math.sin(a2) * ROOM_RADIUS;
    const wallLen = Math.hypot(x2 - x1, z2 - z1);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(wallLen, ROOM_WALL_HEIGHT),
      wallMat,
    );
    wall.position.set((x1 + x2) / 2, ROOM_WALL_HEIGHT / 2, (z1 + z2) / 2);
    wall.lookAt(0, ROOM_WALL_HEIGHT / 2, 0);
    wall.receiveShadow = true;
    scene.add(wall);
  }

  // --- CEILING ---
  const ceiling = new THREE.Mesh(
    new THREE.CircleGeometry(ROOM_RADIUS + 2, 32),
    new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM_WALL_HEIGHT;
  scene.add(ceiling);

  // --- ARENA (octagonal ring: platform + outer floor + posts + ropes + cage) ---
  const { arena } = buildArena(scene, THREE, { platformTex, floorTex, metalTex });

  // --- ENVIRONMENT (beams + lamps + drain grate + crowd + ground fog) ---
  const { crowdGroup, dustGeom } = buildEnvironment(scene, THREE);

  // --- FIGHTERS (two containers in the ring, facing each other) ---
  // Source: prototype lines 6673-6713. Added to `arena` group (not scene) for clean
  // dispose ordering, matching prototype 6682/6687.
  //
  // Child order within each container (contract for idle + future hover):
  //   [0] inner fighter group (22 parts, from makeFighterLowPoly)
  //   [1] archetype glow disc (added by addArchetypeGlow, userData.isArchGlow=true)
  // registerIdleFighter reads container.children[0] — must be fighter, not disc.
  //
  // isClickable / id — pre-seeded now for Steps 16 (raycaster) and 17 (clicks).
  const ARCHETYPE_COLORS = { warden: 0xD4A843, predator: 0xFF066F };

  const wardenBaseRotY = Math.atan2(1.8 - (-1.8), -0.6 - 0.6);
  const predatorBaseRotY = Math.atan2(-1.8 - 1.8, 0.6 - (-0.6));

  const wardenContainer = new THREE.Group();
  wardenContainer.position.set(-1.8, RING_HEIGHT, 0.6);
  wardenContainer.rotation.y = wardenBaseRotY;
  wardenContainer.userData.isClickable = true;
  wardenContainer.userData.id = 'warden';
  arena.add(wardenContainer);

  const predatorContainer = new THREE.Group();
  predatorContainer.position.set(1.8, RING_HEIGHT, -0.6);
  predatorContainer.rotation.y = predatorBaseRotY;
  predatorContainer.userData.isClickable = true;
  predatorContainer.userData.id = 'predator';
  arena.add(predatorContainer);

  wardenContainer.add(makeFighterLowPoly(THREE, 'warden'));
  addArchetypeGlow(wardenContainer, THREE, ARCHETYPE_COLORS.warden);
  registerIdleFighter(wardenContainer, 0);

  predatorContainer.add(makeFighterLowPoly(THREE, 'predator'));
  addArchetypeGlow(predatorContainer, THREE, ARCHETYPE_COLORS.predator);
  registerIdleFighter(predatorContainer, 2.1); // phase offset — de-sync the two

  // --- HEAVY BAG (training interactable, far left) ---
  // Source: prototype 5526-5581 (geometry + dedicated spotlight).
  const heavyBag = buildHeavyBag(THREE);
  scene.add(heavyBag);

  const bagLight = new THREE.SpotLight(0xfff5e8, 1.0, 7, Math.PI * 0.35, 0.6, 1.2);
  bagLight.position.set(-8, 5.5, 3);
  bagLight.target.position.set(-8, 1.5, 3);
  scene.add(bagLight);
  scene.add(bagLight.target);

  // --- TERMINAL (matchmaking interactable, far right) ---
  // Source: prototype 5583-5644. tickScreen redraws the blinking cursor.
  const terminal = buildTerminal(THREE);
  scene.add(terminal.group);

  // tick — Шаг 5: crowd breathing, dust drift, rim pulse.
  // Source: prototype 7240-7250 (dust drift + rim pulse) + TZ Step 5 (crowd breathing formula).
  // PATCH_EPIC2_STEPS_5_8.md — dust reset to 0.3 once it crosses 7.5.
  function tick(t) {
    // Crowd breathing — TZ Step 5 explicit formula.
    if (crowdGroup) {
      const figs = crowdGroup.children;
      for (let i = 0; i < figs.length; i++) {
        figs[i].position.y = Math.sin(t * 0.8 + i * 0.37) * 0.025;
        figs[i].rotation.z = Math.sin(t * 0.5 + i * 0.37 * 1.3) * 0.02;
      }
    }

    // Ground fog drift (PATCH spec).
    if (dustGeom) {
      const positions = dustGeom.attributes.position.array;
      const count = positions.length / 3;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += 0.003 + Math.sin(t + i) * 0.001;
        if (positions[i * 3 + 1] > 7.5) positions[i * 3 + 1] = 0.3;
      }
      dustGeom.attributes.position.needsUpdate = true;
    }

    // Pink rim subtle pulse.
    rimL.intensity = 1.0 + Math.sin(t * 1.1) * 0.15;

    // Idle animations for both fighters (inner sway/breathing/fist bob).
    tickIdleAnimations(t);

    // Outer container bob + subtle rotation — prototype 7231-7235.
    // Without this, the fighters' silhouettes stand rigid even while their
    // limbs animate. This adds a whole-body bounce and micro-rotation.
    wardenContainer.position.y = RING_HEIGHT + Math.sin(t * 1.2) * 0.015;
    predatorContainer.position.y = RING_HEIGHT + Math.sin(t * 1.2 + 1.5) * 0.015;
    wardenContainer.rotation.y = wardenBaseRotY + Math.sin(t * 0.6) * 0.04;
    predatorContainer.rotation.y = predatorBaseRotY + Math.sin(t * 0.6 + 2) * 0.04;

    // Heavy bag idle sway — prototype 7267-7269.
    heavyBag.rotation.x = Math.sin(t * 0.7) * 0.025;
    heavyBag.rotation.z = Math.cos(t * 0.55) * 0.018;

    // Terminal CRT cursor blink — prototype 7271-7282.
    terminal.tickScreen(t);
  }

  return {
    scene,
    camera,
    tick,
    rimL,
    concreteTex,
    metalTex,
    roomHeight: ROOM_WALL_HEIGHT,
    roomRadius: ROOM_RADIUS,
    clickableTargets: [],
  };
}

export { ROOM_RADIUS, ROOM_WALL_HEIGHT };
