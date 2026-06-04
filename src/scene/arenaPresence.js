// Presence layers for the arena — switchable "mood" variants the owner picks
// on preview. Base look/optimization live in ArenaScene + buildArena; this
// module drives the rift-glow pulse + the optional extra life.
//
//   A "Clean platform" — restrained whole-rift breathing. Manual orbit only.
//   B "Living scene"    — A's breathing + sparse monochrome dust + faint
//                         hex-cell pulse flanking the gap (idle camera drift in
//                         ArenaScene).
//   C "Energy field"    — more pronounced whole-rift breathing (its accent).
//
// The rift glow (core + halo + walls + contour + sparks, built in buildArena)
// pulses AS ONE — no beam runs along the line. Sparks rise from the chasm.
// Discipline: one pink (#FF0069 from --hex-primary), one glow (the rift); dust
// is monochrome. Under prefers-reduced-motion the glow holds static at its lit
// peak and all motion (pulse / sparks / dust / drift) stops.
import * as THREE from 'three';
import { makeRadialTexture } from './arenaTextures.js';

export function createArenaPresence(scene, refs) {
  const { W, gapHalf, topY, riftGlow, sparks } = refs;
  const sparkPosAttr = sparks.points.geometry.attributes.position;

  // --- Dust: sparse cool-grey specks drifting in the void (B/C). One
  //     THREE.Points draw call. Monochrome, normal blend, very faint.
  const dustCount = 70;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 18;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 9 + 1;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustTex = makeRadialTexture('rgba(190,200,220,0.9)', 'rgba(170,182,205,0.3)', 0.35);
  const dustMat = new THREE.PointsMaterial({
    size: 0.05,
    map: dustTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.visible = false;
  scene.add(dust);

  // --- Hex-cell pulse flanking the gap (B/C). Monochrome additive bands on the
  //     plate tops either side of the chasm. Reuses the arena hex texture.
  const makePulseBand = (z) => {
    const mat = new THREE.MeshBasicMaterial({
      map: refs.hexTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      color: 0x9fb0d0,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.5), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, topY + 0.003, z);
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  };
  const pulseNear = makePulseBand(gapHalf + 0.28);
  const pulseFar = makePulseBand(-(gapHalf + 0.28));

  let variant = 'A';
  let reduced = false;

  const applyVisibility = () => {
    const ambient = variant !== 'A' && !reduced;
    dust.visible = ambient;
    pulseNear.visible = ambient;
    pulseFar.visible = ambient;
    sparks.points.visible = !reduced; // sparks belong to the rift (all moods)
  };

  const setVariant = (v) => { variant = v; applyVisibility(); };
  const setReducedMotion = (b) => { reduced = b; applyVisibility(); };

  // Whole-rift breathing — slow, ~1 ↔ low. A restrained, C pronounced.
  const breath = {
    A: { c: 0.91, a: 0.09, w: (Math.PI * 2) / 5.0 },
    B: { c: 0.89, a: 0.11, w: (Math.PI * 2) / 4.5 },
    C: { c: 0.83, a: 0.17, w: (Math.PI * 2) / 3.8 },
  };

  const update = (t) => {
    // Rift pulse — one factor for the whole glow (no running beam).
    const b = breath[variant] || breath.A;
    const f = reduced ? 1 : b.c + b.a * Math.sin(t * b.w);
    for (let i = 0; i < riftGlow.length; i++) riftGlow[i].mat.opacity = riftGlow[i].base * f;

    if (reduced) return; // static lit state, no sparks/dust/pulse motion

    // Sparks rising out of the chasm (deterministic, wrap at the top).
    for (let i = 0; i < sparks.count; i++) {
      const y = sparks.yMin + ((t * sparks.sSpeed[i] + sparks.sPhase[i]) % sparks.span);
      sparks.position[i * 3 + 1] = y;
    }
    sparkPosAttr.needsUpdate = true;

    if (variant === 'A') return;

    // Ambient life (B/C): dust drift + hex-cell pulse near the gap.
    dust.rotation.y = t * 0.012;
    dust.position.y = Math.sin(t * 0.18) * 0.12;
    const p = 0.04 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.1));
    pulseNear.material.opacity = p;
    pulseFar.material.opacity = p;
  };

  const dispose = () => {
    scene.remove(dust);
    scene.remove(pulseNear);
    scene.remove(pulseFar);
    dustGeo.dispose();
    dustTex.dispose();
    dustMat.dispose();
    // shared hex map owned by buildArena — dispose only materials/geos here
    pulseNear.geometry.dispose();
    pulseNear.material.dispose();
    pulseFar.geometry.dispose();
    pulseFar.material.dispose();
  };

  return { setVariant, setReducedMotion, update, dispose };
}
