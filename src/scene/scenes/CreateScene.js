// Epic 3Bc Step 1 — Create scene stub.
// Factory skeleton; real content lands in Steps 2-6 (scaffold, lighting,
// podium, holo fighter, archetype glow).

export function buildCreateScene(/* THREE, aspect */) {
  // Stub — returns an empty API with no-op callbacks so CreateView can
  // register without runtime errors. Real scene graph lands in Step 2.
  return {
    scene: null,
    camera: null,
    tick(/* t */) {},
    dispose() {},
    setArchetypeColor(/* hex */) {},
    materialize(/* onDone */) {},
    _holoFighter: null,
  };
}
