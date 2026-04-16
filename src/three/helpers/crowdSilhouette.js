import * as THREE from 'three';

export function makeCrowdFigure(x, z, scale) {
  const crowd = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.85
  });
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28 * scale, 0.32 * scale, 1.4 * scale, 8),
    mat
  );
  body.position.y = 0.7 * scale;
  crowd.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18 * scale, 10, 8),
    mat
  );
  head.position.y = 1.55 * scale;
  crowd.add(head);
  crowd.position.set(x, 0, z);
  crowd.lookAt(0, 0.7 * scale, 0);
  return crowd;
}
