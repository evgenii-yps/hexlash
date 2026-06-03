// Presence layers for the arena — switchable "mood" variants the owner picks
// on preview. Base sharpness/optimization live in ArenaScene + buildArena;
// this module only adds the optional life.
//
//   A "Clean platform" — slow divider breathing only. Static camera.
//   B "Living scene"    — A + sparse monochrome dust + faint hex-cell pulse
//                         near the line (camera drift handled in ArenaScene).
//   C "Energy field"    — A with stronger breathing + a light impulse running
//                         along the line + surface reaction.
//
// Discipline holds across all: one pink accent (#FF066F) on the divider, one
// glow (the divider). Dust + surface texture are monochrome. Everything stops
// under prefers-reduced-motion.
import * as THREE from 'three';
import { makeRadialTexture } from './arenaTextures.js';

const PINK = '#FF066F';

export function createArenaPresence(scene, refs) {
  const { W, D, topY, base } = refs;

  // --- Dust: sparse cool-grey specks drifting in the void (variant B). One
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

  // --- Hex-cell pulse near the divider (variant B). Reuses the arena hex
  //     texture on a narrow centred band; monochrome additive, opacity pulses.
  const pulseGeo = new THREE.PlaneGeometry(W, 1.0);
  const pulseMat = new THREE.MeshBasicMaterial({
    map: refs.hexTexture, // shared — NOT disposed here
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    color: 0x9fb0d0,
    opacity: 0,
  });
  const hexPulse = new THREE.Mesh(pulseGeo, pulseMat);
  hexPulse.rotation.x = -Math.PI / 2;
  hexPulse.position.y = topY + 0.003;
  hexPulse.visible = false;
  scene.add(hexPulse);

  // --- Impulse dot travelling along the line (variant C). Pink additive.
  const impTex = makeRadialTexture('rgba(255,255,255,0.95)', 'rgba(255,6,111,0.7)', 0.35);
  const impMat = new THREE.MeshBasicMaterial({
    map: impTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    opacity: 0,
  });
  const impGeo = new THREE.PlaneGeometry(0.5, 0.5);
  const impulse = new THREE.Mesh(impGeo, impMat);
  impulse.rotation.x = -Math.PI / 2;
  impulse.position.y = topY + 0.03;
  impulse.visible = false;
  scene.add(impulse);

  let variant = 'A';
  let reduced = false;

  const applyVisibility = () => {
    const motion = !reduced;
    dust.visible = variant === 'B' && motion;
    hexPulse.visible = variant === 'B' && motion;
    impulse.visible = variant === 'C' && motion;
  };

  const setVariant = (v) => {
    variant = v;
    applyVisibility();
  };
  const setReducedMotion = (b) => {
    reduced = b;
    applyVisibility();
  };

  // breathing params per variant
  const breath = {
    A: { amp: 0.14, w: (Math.PI * 2) / 6.0 },
    B: { amp: 0.14, w: (Math.PI * 2) / 6.0 },
    C: { amp: 0.32, w: (Math.PI * 2) / 3.8 },
  };

  const update = (t) => {
    // Reduced motion → hold everything at the resting state.
    if (reduced) {
      refs.dividerHalo.material.opacity = base.halo;
      refs.dividerReflection.material.opacity = base.reflection;
      refs.dividerCore.material.opacity = base.core;
      return;
    }

    // --- Divider breathing (all variants).
    const b = breath[variant] || breath.A;
    const f = 1 + b.amp * Math.sin(t * b.w);
    let haloOpacity = base.halo * f;
    refs.dividerReflection.material.opacity = base.reflection * f;
    refs.dividerCore.material.opacity = Math.min(1, 0.9 + 0.1 * f);

    // --- Variant B: drifting dust + pulsing hex cells near the line.
    if (variant === 'B') {
      dust.rotation.y = t * 0.012;
      dust.position.y = Math.sin(t * 0.18) * 0.12;
      hexPulse.material.opacity = 0.04 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.1));
    }

    // --- Variant C: impulse sweeping along the line + surface reaction.
    if (variant === 'C') {
      const cycle = 4.2;
      const travel = 1.3;
      const local = t % cycle;
      if (local < travel) {
        const p = local / travel; // 0 → 1 across the line
        impulse.material.opacity = Math.sin(p * Math.PI);
        impulse.position.x = THREE.MathUtils.lerp(-W / 2 * 1.02, (W / 2) * 1.02, p);
        haloOpacity *= 1 + 0.25 * impulse.material.opacity; // line reacts
      } else {
        impulse.material.opacity = 0;
      }
    }

    refs.dividerHalo.material.opacity = haloOpacity;
  };

  const dispose = () => {
    scene.remove(dust);
    scene.remove(hexPulse);
    scene.remove(impulse);
    dustGeo.dispose();
    dustTex.dispose();
    dustMat.dispose();
    pulseGeo.dispose();
    pulseMat.dispose(); // shared hex map owned by buildArena — not disposed here
    impGeo.dispose();
    impTex.dispose();
    impMat.dispose();
  };

  return { setVariant, setReducedMotion, update, dispose };
}
