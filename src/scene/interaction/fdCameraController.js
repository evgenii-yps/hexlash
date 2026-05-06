// Epic 3A — Fighter Detail drag-to-rotate camera.
// Step 6: mouse drag pans the camera around the podium on a circular track,
// clamped to ±60°. No wheel zoom, no auto-drift, no touch (touch deferred to
// Epic 5, mobile support).
//
// Source: prototype hexlash_v24.html 7593-7654 (handlers), 8008-8015 (tick).
// Mouse-only path extracted; touch handlers skipped.

const CAM_R = 7.0;
const CAM_Y = 2.4;
const LOOK_Y = 1.6;
const ROT_CLAMP = Math.PI / 3; // ≈60°

/**
 * @param {import('three').PerspectiveCamera} camera
 * @param {HTMLCanvasElement} canvas
 * @returns {{ tick: (t?: number) => void, detach: () => void, getIsDragging: () => boolean }}
 */
export function attachFdOrbit(camera, canvas) {
  let rotation = 0;
  let rotTarget = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartRot = 0;
  let dragMoved = false;

  function onMouseDown(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartRot = rotTarget;
    dragMoved = false;
  }

  // mousemove lives on window — drag should survive when the cursor leaves
  // the canvas bounds (same pattern as Epic 2 pit orbit).
  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 5) dragMoved = true;
    const newRot = dragStartRot + (dx / window.innerWidth) * Math.PI * 0.6;
    rotTarget = Math.max(-ROT_CLAMP, Math.min(ROT_CLAMP, newRot));
  }

  function onMouseUp() {
    // Click-vs-drag disambiguation (dragMoved check) is Step 7's job — the
    // picker reads dragMoved from getIsDragging history. Here we only end drag.
    isDragging = false;
  }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // tick accepts t for signature parity with Epic 2 attachOrbit; unused here
  // because FD has no auto-drift (prototype doesn't either).
  function tick(/* t */) {
    rotation += (rotTarget - rotation) * 0.08;
    camera.position.x = Math.sin(rotation) * CAM_R;
    camera.position.z = Math.cos(rotation) * CAM_R;
    camera.position.y = CAM_Y;
    camera.lookAt(0, LOOK_Y, 0);
  }

  function detach() {
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  function getIsDragging() {
    return isDragging;
  }

  return { tick, detach, getIsDragging };
}
