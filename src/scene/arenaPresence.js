// Presence layers for the arena — switchable "mood" variants the owner picks
// on preview. Base look/optimization live in ArenaScene + buildArena; this
// module only adds the optional life.
//
//   A "Clean platform" — static (just the lit slabs + depth). Manual orbit only.
//   B "Living scene"    — sparse monochrome dust + faint hex-cell pulse flanking
//                         the gap (idle camera drift handled in ArenaScene).
//   C "Energy field"    — same ambient life as B for now; its rift-glow energy
//                         (stronger pulse + sparks) lands in TORN-RIFT pass 3,
//                         when the gap gets its glow.
//
// Discipline: monochrome dust + surface micro-texture only. No pink lives in
// the scene during passes 1–2 (the rift glow returns in pass 3). Everything
// here stops under prefers-reduced-motion.
import * as THREE from 'three';
import { makeRadialTexture } from './arenaTextures.js';

export function createArenaPresence(scene, refs) {
  const { W, gapHalf, topY } = refs;

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

  // --- Hex-cell pulse flanking the gap (B/C). Two narrow bands on the plate
  //     tops either side of the chasm; monochrome additive, opacity pulses.
  //     Reuses the arena hex texture (shared — NOT disposed here).
  const makePulseBand = (z) => {
    const geo = new THREE.PlaneGeometry(W, 0.5);
    const mat = new THREE.MeshBasicMaterial({
      map: refs.hexTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      color: 0x9fb0d0,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(geo, mat);
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
    const live = variant !== 'A' && !reduced;
    dust.visible = live;
    pulseNear.visible = live;
    pulseFar.visible = live;
  };

  const setVariant = (v) => { variant = v; applyVisibility(); };
  const setReducedMotion = (b) => { reduced = b; applyVisibility(); };

  const update = (t) => {
    if (reduced || variant === 'A') return;

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
    // shared hex map owned by buildArena — dispose only the materials/geos here
    pulseNear.geometry.dispose();
    pulseNear.material.dispose();
    pulseFar.geometry.dispose();
    pulseFar.material.dispose();
  };

  return { setVariant, setReducedMotion, update, dispose };
}
