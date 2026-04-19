// Epic 3A — shared reference to the CanvasLayer's <canvas> element.
// CanvasLayer publishes the DOM element on mount; scene views (FD, Fight)
// read it to attach orbit/picker handlers without props drilling or DOM
// queries. One canvas exists per AppV2, so a single module-scoped ref is fine.
//
// Pattern parity: useHoverState.js, useClickState.js from Epic 2.

let _canvas = null;

export function setCanvasRef(el) {
  _canvas = el;
}

export function getCanvasRef() {
  return _canvas;
}
