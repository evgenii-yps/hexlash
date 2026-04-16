import * as THREE from 'three';
import { makeConcreteTexture, makeMetalTexture } from '@/three/helpers/textures.js';

const RING_RADIUS = 4.2;
const RING_HEIGHT = 0.6;
const POST_HEIGHT = 2.4;
const ROPE_HEIGHTS = [0.55, 1.15, 1.75];

export { RING_RADIUS, RING_HEIGHT };

export function buildArena() {
  const arena = new THREE.Group();

  const sides = 8;
  const vertices = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + Math.PI / sides;
    vertices.push(new THREE.Vector2(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS));
  }

  // Platform
  const platformShape = new THREE.Shape();
  vertices.forEach((v, i) => {
    i === 0 ? platformShape.moveTo(v.x, v.y) : platformShape.lineTo(v.x, v.y);
  });
  platformShape.closePath();
  const platformGeom = new THREE.ExtrudeGeometry(platformShape, {
    depth: RING_HEIGHT, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2
  });
  platformGeom.rotateX(-Math.PI / 2);
  const concreteTex = makeConcreteTexture();
  concreteTex.repeat.set(1, 1);
  const platform = new THREE.Mesh(platformGeom, new THREE.MeshStandardMaterial({
    map: concreteTex, color: 0xb8b8c0, roughness: 0.92, metalness: 0.05
  }));
  platform.receiveShadow = true;
  arena.add(platform);

  // Outer floor
  const floorTex = makeConcreteTexture();
  floorTex.repeat.set(6, 6);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(20, 64),
    new THREE.MeshStandardMaterial({ map: floorTex, color: 0x2c2c34, roughness: 0.95, metalness: 0.02 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  arena.add(floor);

  // Posts
  const metalTex = makeMetalTexture();
  const postMat = new THREE.MeshStandardMaterial({ map: metalTex, color: 0x4a4d58, roughness: 0.4, metalness: 0.85 });
  vertices.forEach(v => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, POST_HEIGHT, 16), postMat);
    post.position.set(v.x, RING_HEIGHT + POST_HEIGHT / 2, v.y);
    post.castShadow = true;
    arena.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), postMat);
    cap.position.set(v.x, RING_HEIGHT + POST_HEIGHT, v.y);
    cap.castShadow = true;
    arena.add(cap);
  });

  // Ropes
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.6, metalness: 0.3 });
  for (let i = 0; i < sides; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % sides];
    const dx = b.x - a.x, dz = b.y - a.y;
    const len = Math.sqrt(dx * dx + dz * dz);
    ROPE_HEIGHTS.forEach(h => {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 8), ropeMat);
      rope.position.set((a.x + b.x) / 2, RING_HEIGHT + h, (a.y + b.y) / 2);
      rope.lookAt(b.x, RING_HEIGHT + h, b.y);
      rope.rotateX(Math.PI / 2);
      arena.add(rope);
    });
  }

  // Cage bars
  const cageBarMat = new THREE.MeshStandardMaterial({ color: 0x3a3d48, roughness: 0.55, metalness: 0.6 });
  for (let i = 0; i < sides; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % sides];
    const dx = b.x - a.x, dz = b.y - a.y;
    const len = Math.sqrt(dx * dx + dz * dz);
    const midX = (a.x + b.x) / 2, midZ = (a.y + b.y) / 2;
    const cageTopY = RING_HEIGHT + POST_HEIGHT - 0.05;
    const cageBotY = RING_HEIGHT + ROPE_HEIGHTS[ROPE_HEIGHTS.length - 1] + 0.15;
    for (let h = 0; h < 4; h++) {
      const y = cageBotY + (cageTopY - cageBotY) * (h / 3);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 6), cageBarMat);
      bar.position.set(midX, y, midZ);
      bar.lookAt(b.x, y, b.y);
      bar.rotateX(Math.PI / 2);
      arena.add(bar);
    }
    const vertCount = Math.max(2, Math.round(len / 0.32));
    for (let v = 1; v < vertCount; v++) {
      const tt = v / vertCount;
      const vbar = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, cageTopY - cageBotY, 6), cageBarMat);
      vbar.position.set(a.x + dx * tt, (cageTopY + cageBotY) / 2, a.y + dz * tt);
      arena.add(vbar);
    }
  }

  return arena;
}
