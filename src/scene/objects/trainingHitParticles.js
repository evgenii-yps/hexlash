// Epic 3Ba Step 7b — Additive spark particles on bag impact.
// Factory: createHitParticles(scene, THREE) → { spawn(point), tick(), dispose() }.
// Source: prototype hexlash_v24.html lines 9841-9876.
//
// Each spawn() creates 6 small additive spheres at the hit point with
// random upward velocity; tick() fades them over ~25 frames and reaps.

const SPARKS_PER_HIT = 6;
const LIFE_DECAY = 0.04; // per tick

export function createHitParticles(scene, THREE) {
  const particles = []; // { mesh, life }

  function spawn(point3d) {
    for (let i = 0; i < SPARKS_PER_HIT; i++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 6),
        new THREE.MeshBasicMaterial({
          color: 0xffd9c8, transparent: true, opacity: 0.85,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }),
      );
      m.position.copy(point3d);
      m.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        Math.random() * 0.04,
        (Math.random() - 0.5) * 0.05,
      );
      scene.add(m);
      particles.push({ mesh: m, life: 1.0 });
    }
  }

  function tick() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.mesh.position.add(p.mesh.userData.vel);
      p.life -= LIFE_DECAY;
      p.mesh.material.opacity = Math.max(0, p.life);
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles.splice(i, 1);
      }
    }
  }

  function dispose() {
    for (const p of particles) {
      scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    particles.length = 0;
  }

  return { spawn, tick, dispose };
}
