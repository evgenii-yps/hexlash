// Epic 2 — pit-view hub. Step 7. CRITICAL — see PATCH_EPIC2_STEPS_5_8.md.
// Orbit camera around the ring + wheel zoom + idle auto-drift.
// Source: prototype 6800-6850 (state + tick) + 7037-7059 (drag handlers).
//
// 5 PATCH правок применены явно:
//   1. Drag формула АБСОЛЮТНАЯ от dragStartAngle:
//      camTarget = dragStartAngle + (dx / window.innerWidth) * π * 0.6
//      (исходный ТЗ имел накопительную: camTarget -= dx * 0.005)
//   2. Listeners mousemove/mouseup на window, не canvas (drag не ломается за границей).
//   3. Zoom lerp = 0.10 (исходный ТЗ — 0.08).
//   4. lookY динамический: 1.6 + heightRatio * 0.6 (исходный ТЗ — фикс 1.5).
//   5. Wheel нормализация: sign(deltaY) * step (step = shift ? 0.5 : 1.4),
//      не e.deltaY * 0.02 (трекпад/мышь дают разные deltaY).
//
// Touch / pinch zoom — НЕ в Эпике 2, отложено на mobile support (Эпик 5).

const ZOOM_DEFAULT = Math.sqrt(11 * 11 + 16 * 16); // ≈ 19.42
const ZOOM_MIN = 7;
const ZOOM_MAX = 32;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function attachOrbit(camera, canvas) {
  // DEBUG Step 7 — listeners diagnostics
  // eslint-disable-next-line no-console
  console.log('[orbit] attach, canvas:', canvas);

  let camAngle = 0;
  let camTarget = 0;
  let zoomDist = ZOOM_DEFAULT;
  let zoomTarget = ZOOM_DEFAULT;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartAngle = 0;
  let dragMoved = false;
  let _tickLogged = false;

  function onMouseDown(e) {
    // eslint-disable-next-line no-console
    console.log('[orbit] mousedown', e.clientX, e.clientY);
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartAngle = camTarget;
    dragMoved = false;
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) > 5) dragMoved = true;
    // PATCH правка #1 — абсолютная от dragStartAngle
    camTarget = dragStartAngle + (dx / window.innerWidth) * Math.PI * 0.6;
  }

  function onMouseUp() {
    // click-detection (dragMoved=false + isDragging=true) — Шаг 17
    isDragging = false;
  }

  function onWheel(e) {
    // eslint-disable-next-line no-console
    console.log('[orbit] wheel', e.deltaY);
    e.preventDefault();
    // PATCH правка #5 — нормализация
    const dir = Math.sign(e.deltaY);
    const step = e.shiftKey ? 0.5 : 1.4;
    zoomTarget = clamp(zoomTarget + dir * step, ZOOM_MIN, ZOOM_MAX);
  }

  canvas.addEventListener('mousedown', onMouseDown);
  // PATCH правка #2 — mousemove/mouseup на window
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function tick(t) {
    // DEBUG Step 7 — log once around t=1s to confirm tick is running
    if (!_tickLogged && t > 1 && t < 1.1) {
      _tickLogged = true;
      // eslint-disable-next-line no-console
      console.log('[orbit] tick running, angle:', camAngle, 'zoom:', zoomDist, 'isDragging:', isDragging);
    }
    // smooth angle lerp
    camAngle += (camTarget - camAngle) * 0.06;
    // idle auto-drift when not dragging
    if (!isDragging) camTarget += Math.sin(t * 0.15) * 0.0008;
    // PATCH правка #3 — zoom lerp 0.10
    zoomDist += (zoomTarget - zoomDist) * 0.10;

    const r = zoomDist;
    camera.position.x = Math.sin(camAngle) * r;
    camera.position.z = Math.cos(camAngle) * r;
    const heightRatio = (r - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
    camera.position.y = 2.2 + heightRatio * 4.5 + Math.sin(camAngle * 2) * 0.3;

    // PATCH правка #4 — lookY динамический
    const lookY = 1.6 + heightRatio * 0.6;
    camera.lookAt(0, lookY, 0);
  }

  function getIsDragging() {
    return isDragging;
  }

  function detach() {
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('wheel', onWheel);
  }

  return { tick, detach, getIsDragging };
}
