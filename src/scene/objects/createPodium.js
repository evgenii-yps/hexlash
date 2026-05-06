// Epic 3Bc Step 4 — Create podium.
// Disc (concrete-textured cylinder) + metal ring at the rim.
// 1-to-1 port of prototype hexlash_v24.html lines 8912-8930.
//
// Pattern parity with 3Ba trainingBag / 3Bb matchmakingTerminal — separate
// module, NOT a variant of hub plinth.js. Hub plinth is a glass plate with
// a "+" glow; Create podium is a solid disc + torus ring, different enough
// that cloning beats extension.
//
// Deviations from handoff §ТЗ Step 4 (prototype parity, rule 0.3.4):
// - Disc segments: TZ said 48, prototype uses 32.
// - Disc material: TZ said { 0x1a1a22, roughness 0.7, metalness 0.3 };
//   prototype uses concrete texture map + 0xa8a8b0 tint + roughness 0.9 +
//   metalness 0.05. Prototype wins — Create podium is concrete-textured,
//   not a metal dark plate.

import { makeConcreteTexture } from '../materials/concrete.js';

const POD_DISC_RADIUS_TOP = 1.4;
const POD_DISC_RADIUS_BOT = 1.5;
const POD_DISC_HEIGHT = 0.30;
const POD_DISC_SEGMENTS = 32;
const POD_DISC_COLOR = 0xa8a8b0;
const POD_DISC_ROUGHNESS = 0.9;
const POD_DISC_METALNESS = 0.05;
const POD_DISC_Y = 0.15;

const POD_RING_RADIUS = 1.42;
const POD_RING_TUBE = 0.022;
const POD_RING_RAD_SEGS = 8;
const POD_RING_TUB_SEGS = 64;
const POD_RING_COLOR = 0x4a4d58;
const POD_RING_ROUGHNESS = 0.4;
const POD_RING_METALNESS = 0.85;
const POD_RING_Y = 0.30;

export function createPodium(THREE) {
  const group = new THREE.Group();

  // Disc — concrete-textured cylinder, top radius smaller than bottom
  // (slight trapezoidal taper). castShadow + receiveShadow: casts onto
  // floor (key spot overhead), receives from hologram fighter once added
  // in Step 5.
  const discTex = makeConcreteTexture(THREE);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(
      POD_DISC_RADIUS_TOP, POD_DISC_RADIUS_BOT,
      POD_DISC_HEIGHT, POD_DISC_SEGMENTS,
    ),
    new THREE.MeshStandardMaterial({
      map: discTex,
      color: POD_DISC_COLOR,
      roughness: POD_DISC_ROUGHNESS,
      metalness: POD_DISC_METALNESS,
    }),
  );
  disc.position.y = POD_DISC_Y;
  disc.castShadow = true;
  disc.receiveShadow = true;
  group.add(disc);

  // Ring — thin brushed-metal torus around the rim, sitting on top of the
  // disc. No shadow settings (prototype 8924-8930 leaves defaults).
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      POD_RING_RADIUS, POD_RING_TUBE,
      POD_RING_RAD_SEGS, POD_RING_TUB_SEGS,
    ),
    new THREE.MeshStandardMaterial({
      color: POD_RING_COLOR,
      roughness: POD_RING_ROUGHNESS,
      metalness: POD_RING_METALNESS,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = POD_RING_Y;
  group.add(ring);

  return group;
}
