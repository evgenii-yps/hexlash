// Epic 3A — project a 3D world anchor to screen pixel coordinates.
// Step 8a: used by FighterDetailScene.tick to pin DOM branch labels on top
// of the column meshes. Source: prototype hexlash_v24.html lines 7989-7998.
//
// The vector is reused across calls (allocation once at module load) — this
// runs for every column every frame.

let _v = null;

/**
 * @param {import('three').Object3D} obj3d
 * @param {number} addY — extra Y offset in world units (e.g. column top)
 * @param {import('three').PerspectiveCamera} camera
 * @param {*} THREE
 * @returns {{ x: number, y: number, visible: boolean }}
 */
export function fdProjectToScreen(obj3d, addY, camera, THREE) {
  if (!_v) _v = new THREE.Vector3();
  obj3d.getWorldPosition(_v);
  _v.y += addY || 0;
  _v.project(camera);
  return {
    x: (_v.x * 0.5 + 0.5) * window.innerWidth,
    y: (-_v.y * 0.5 + 0.5) * window.innerHeight,
    visible: _v.z < 1,
  };
}
