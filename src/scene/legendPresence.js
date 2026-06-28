// legendPresence.js — the PVE trainer-legend's drift + its warm "cloud". The legend
// BODY is a normal buildFighter construct (amber core, idle only) built by PveScene;
// this module gives it (1) a continuous, never-static drift over a bounded patch of
// air above the plate (a Lissajous glide + a gentle vertical bob), and (2) the warm
// halo that marks it as the scene's single warm anchor: a LOCAL amber haze (the home
// DUST pattern, denser + warmer, bound to the legend) plus a barely-there faceted hex
// nimbus (wireframe via EdgesGeometry/LineSegments).
//
// PveScene adds `group` (haze + nimbus) to the scene, calls `tick(t)` each frame, and
// reads `position` to place the legend body's feet — so body + cloud move as one. No
// edit to any protected file; pure instancing + a position function of time (so it is
// alloc-free and pause / reduced-motion safe). reduced ⇒ it holds at base (no drift).
//
// Knobs come in via opts from PveScene's LEGEND CONFIG block
// (height / driftSpeed / driftRadius / bobAmplitude / hazeDensity).
import * as THREE from 'three';
import { makeRadialTexture } from './arenaTextures.js';

const DEFAULTS = {
  baseX: 0, baseZ: 0,
  baseY: 3.1,            // world Y of the legend's FEET anchor (plate top + LEGEND.height)
  torsoLift: 1.05,       // cloud centre above the feet anchor (≈ torso/chest height)
  driftSpeed: 0.5,       // Lissajous rate
  driftRadius: 0.7,      // horizontal glide half-extent (X); Z uses 0.7× of it
  bobAmplitude: 0.18,    // vertical bob
  hazeDensity: 90,       // local haze particle count
  hazeRadius: 0.95,      // haze ellipsoid half-width (X/Z)
  hazeHeight: 1.5,       // haze ellipsoid half-height (Y)
  hazeColor: 0xffce85,   // warm amber haze (a touch lighter than the lamp family)
  hazeSize: 0.13,
  hazeOpacity: 0.34,     // additive, low — a soft warm presence, not a flare
  haloColor: 0xffb21d,   // legend amber — the single warm anchor hue
  haloRadius: 0.62,      // faceted hex nimbus radius (around the head)
  haloY: 1.95,           // nimbus height above the feet anchor (just over the head)
  haloOpacity: 0.16,     // very low — "еле заметный"
  haloSpin: 0.18,        // slow nimbus rotation (rad/s)
  reduced: false,
};

export function createLegendPresence(opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const group = new THREE.Group();
  const position = new THREE.Vector3(o.baseX, o.baseY, o.baseZ); // legend FEET anchor

  // ── local warm haze (the home DUST recipe, bound to the legend, denser/warmer) ──
  const n = o.hazeDensity;
  const pos = new Float32Array(n * 3);
  const bx = new Float32Array(n), by = new Float32Array(n), bz = new Float32Array(n);
  const ph = new Float32Array(n), sp = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    // scatter in an upright ellipsoid around the torso (rejection-free polar sample)
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
    bx[i] = rr * Math.cos(a) * o.hazeRadius * (0.5 + Math.random() * 0.5);
    bz[i] = rr * Math.sin(a) * o.hazeRadius * (0.5 + Math.random() * 0.5);
    by[i] = u * o.hazeHeight * (0.5 + Math.random() * 0.5);
    ph[i] = Math.random() * Math.PI * 2;
    sp[i] = 0.5 + Math.random() * 0.8;        // per-particle swirl speed
    pos[i * 3] = bx[i]; pos[i * 3 + 1] = by[i]; pos[i * 3 + 2] = bz[i];
  }
  const hazeGeo = new THREE.BufferGeometry();
  hazeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const hazeTex = makeRadialTexture('rgba(255,224,168,0.95)', 'rgba(255,206,133,0.0)', 0.4);
  const hazeMat = new THREE.PointsMaterial({
    map: hazeTex, color: o.hazeColor, size: o.hazeSize, sizeAttenuation: true,
    transparent: true, opacity: o.hazeOpacity, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const haze = new THREE.Points(hazeGeo, hazeMat);
  haze.frustumCulled = false;
  haze.position.y = o.torsoLift; // centre the cloud on the torso within the group
  group.add(haze);

  // ── faceted hex nimbus (wireframe; very low opacity amber) ──
  const haloSrc = new THREE.CylinderGeometry(o.haloRadius, o.haloRadius, 0.06, 6, 1);
  const haloEdges = new THREE.EdgesGeometry(haloSrc);
  haloSrc.dispose();
  const haloMat = new THREE.LineBasicMaterial({
    color: o.haloColor, transparent: true, opacity: o.haloOpacity, depthWrite: false, fog: false,
  });
  const halo = new THREE.LineSegments(haloEdges, haloMat);
  halo.position.y = o.haloY;
  group.add(halo);

  group.position.set(position.x, position.y + o.torsoLift, position.z);

  // ── drift + cloud animation. position = a pure function of time (alloc-free,
  //    pause-safe). reduced ⇒ hold at base (no drift, no bob, no swirl, no spin). ──
  function tick(t) {
    if (!o.reduced) {
      const dx = o.driftRadius * Math.sin(o.driftSpeed * t);
      const dz = o.driftRadius * 0.7 * Math.sin(o.driftSpeed * 1.37 * t + 1.1); // incommensurate → never repeats
      const dy = o.bobAmplitude * Math.sin(o.driftSpeed * 0.8 * t + 0.6);
      position.set(o.baseX + dx, o.baseY + dy, o.baseZ + dz);
      group.position.set(position.x, position.y + o.torsoLift, position.z);

      for (let i = 0; i < n; i++) {
        const s = sp[i];
        pos[i * 3] = bx[i] + 0.06 * Math.sin(s * t + ph[i]);
        pos[i * 3 + 1] = by[i] + 0.05 * Math.sin(s * 0.7 * t + ph[i] * 1.3);
        pos[i * 3 + 2] = bz[i] + 0.06 * Math.cos(s * 0.85 * t + ph[i]);
      }
      hazeGeo.attributes.position.needsUpdate = true;
      halo.rotation.y = o.haloSpin * t;
    }
  }

  function dispose() {
    hazeGeo.dispose(); hazeMat.dispose(); hazeTex.dispose();
    haloEdges.dispose(); haloMat.dispose();
  }

  return { group, position, tick, dispose };
}
