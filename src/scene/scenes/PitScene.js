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
import { buildEnvironment } from '../objects/environment.js';

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

  // --- CONCRETE TEXTURES (reused by floor + env + arena later) ---
  const concreteTex = makeConcreteTexture(THREE);
  concreteTex.repeat.set(1, 1);

  // --- TEMPORARY FLOOR (Step 6 заменит из arena.js) ---
  const floorTex = makeConcreteTexture(THREE);
  floorTex.repeat.set(6, 6);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({
      map: floorTex,
      color: 0x2c2c34,
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

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

  // --- ENVIRONMENT (beams + lamps + drain grate) ---
  const env = buildEnvironment(scene, THREE);

  // tick — пустой в Шаге 3. Шаг 5 добавит crowd breathing / dust drift / rim pulse.
  function tick(_t) {
    // filled in later steps
  }

  return {
    scene,
    camera,
    tick,
    rimL,
    concreteTex,
    roomHeight: ROOM_WALL_HEIGHT,
    roomRadius: ROOM_RADIUS,
    clickableTargets: [],
    env,
  };
}

export { ROOM_RADIUS, ROOM_WALL_HEIGHT };
