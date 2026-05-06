// Epic 2 — pit-view hub. Step 16.
// Raycaster factory. Converts client coords → picked target from the set of
// registered clickable groups. Walks up the parent chain so a mesh hit inside
// a group resolves to the group itself (containers registered in PitScene).
//
// Source: prototype 6854-6873 (pickAt).

/**
 * @param {import('three').PerspectiveCamera} camera
 * @param {Array<import('three').Object3D>} targets — array of clickable roots
 * @param {import('three')} THREE
 * @returns {{ pickAt: (clientX: number, clientY: number) => import('three').Object3D | null }}
 */
export function createPicker(camera, targets, THREE) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function pickAt(clientX, clientY) {
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(targets, true);
    if (intersects.length === 0) return null;
    // Walk up from the hit mesh until we reach one of the registered targets.
    let obj = intersects[0].object;
    while (obj && !targets.includes(obj)) obj = obj.parent;
    return obj || null;
  }

  return { pickAt };
}
