// v2 Migration — реестр 3D-сцен для единого Three.js renderer.
// Каждая сцена регистрируется один раз, активная переключается по смене роута.
// Тип записи: { scene, camera, onEnter?, onLeave?, tick? }

const scenes = new Map();
let activeId = null;

export function registerScene(id, entry) {
  scenes.set(id, entry);
}

export function activateScene(id) {
  const prev = scenes.get(activeId);
  if (prev?.onLeave) prev.onLeave();
  activeId = id;
  const next = scenes.get(id);
  if (next?.onEnter) next.onEnter();
}

export function getActiveScene() {
  return scenes.get(activeId) ?? null;
}

export function tickAll(t) {
  const active = scenes.get(activeId);
  if (active?.tick) active.tick(t);
}
