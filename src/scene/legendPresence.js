// legendPresence.js — the PVE trainer-legend's flight + its warm "cloud" + its island.
// The legend BODY is a normal buildFighter construct (amber core, idle only) built by
// PveScene; this module gives it everything that marks it as the scene's single warm
// anchor and keeps it READABLE as a separate figure that never mixes with the walking
// roster:
//   1. a faceted floating PEDESTAL right under its feet (a dark blue-grey low-poly
//      island in the slab/fighter family, with a faint amber contact-glow on top) —
//      the legend always stands on it and never touches the floor;
//   2. a big slow ORBIT cycle: it periodically descends from the high centre toward
//      the roster's head level (never the floor) AND swings out to circle the arena
//      over the rim, then climbs back to the centre — with the old Lissajous glide +
//      bob kept as a small layer ON TOP;
//   3. a LOCAL warm amber haze bound to it (the home DUST pattern, denser), which
//      thickens as it sinks;
//   4. a short warm SMOKE trail that streams from under the pedestal while it descends
//      (intensity ∝ descent speed), softly fading — the same warm anchor, not a 2nd
//      accent.
//
// PveScene adds `group` (pedestal + haze, moving) AND `trail` (a world-space Points)
// to the scene, calls `tick(t, dt)` each frame, and reads `position` (the feet anchor)
// to place the legend body — so body + island + cloud move as one. Pure instancing,
// alloc-free, pause / reduced-motion safe (reduced ⇒ it holds at the high centre).
// buildArena / buildFighter are never touched here.
//
// All knobs live in DEFAULTS below (PEDESTAL / ORBIT / SMOKE + haze + drift). floorY
// (the plate top) comes in from PveScene; heights are expressed ABOVE that.
import * as THREE from 'three';
import { makeRadialTexture } from './arenaTextures.js';

const DEFAULTS = {
  baseX: 0, baseZ: 0,          // orbit centre (XZ) over the plate
  floorY: 0.5,                 // plate top (PveScene passes arena.refs.topY)
  torsoLift: 1.05,             // haze centre above the feet anchor (≈ torso height)

  // small glide layer kept ON TOP of the big orbit (the old Lissajous + bob, scaled down)
  driftSpeed: 0.5,
  driftRadius: 0.7,
  bobAmplitude: 0.18,

  // ── PEDESTAL — the faceted floating island under the legend's feet ──
  PEDESTAL: {
    size: 0.92,       // footprint radius of the hex island
    thickness: 0.22,  // slab thickness
    glow: 0.55,       // amber contact-glow strength on top (0..1)
    gap: 0.04,        // tiny gap between the feet and the pedestal top
  },

  // ── ORBIT — the big slow descend-to-rim / climb-to-centre cycle ──
  ORBIT: {
    highAboveTop: 2.55,  // feet THIS high above the plate top at the high/centre phase
    // feet THIS high at the low phase — roster head/torso level, NOT the floor. Kept a
    // touch above the roster heads (~2.3 world) so the island clears them while it
    // sweeps the rim; lower it (with radiusRim) for a deeper dive if the preview wants.
    lowAboveTop: 1.5,
    minClearance: 0.7,   // pedestal BOTTOM never closer than this to the plate top (floor safety)
    radiusCenter: 0.35,  // orbit radius at the high phase (near centre)
    radiusRim: 2.2,      // orbit radius at the low phase (out over the rim/periphery — the sparse edge)
    cycleSpeed: 0.12,    // descend/climb cycle rate (slow)
    azSpeed: 0.2,        // azimuthal sweep rate (circles the arena)
  },

  // ── SMOKE — the warm descent trail (world space, softly fading) ──
  SMOKE: {
    amount: 44,       // particle pool size
    length: 1.15,     // particle lifetime (s) — how long the wisp persists
    fade: 1.0,        // fade exponent (1 = linear; >1 = lingers then drops)
    rise: -0.32,      // vertical velocity (negative = sinks; a downward wisp)
    spread: 0.14,     // lateral scatter velocity
    size: 0.15,
    opacity: 0.30,    // peak per-particle opacity — low, warm, never a 2nd accent
    emitPerSec: 30,   // emission rate at full descent speed
    refDown: 0.45,    // descent speed (u/s) that counts as "full" intensity
  },

  // ── local warm haze bound to the legend (home DUST recipe, denser/warmer) ──
  hazeDensity: 90,
  hazeRadius: 0.95,
  hazeHeight: 1.5,
  hazeColor: 0xffce85,
  hazeSize: 0.13,
  hazeOpacity: 0.34,
  hazeDescentBoost: 0.7, // haze opacity grows by up to this fraction while sinking

  reduced: false,
};

const lerp = (a, b, s) => a + (b - a) * s;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function createLegendPresence(opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const PED = { ...DEFAULTS.PEDESTAL, ...(opts.PEDESTAL || {}) };
  const ORB = { ...DEFAULTS.ORBIT, ...(opts.ORBIT || {}) };
  const SMK = { ...DEFAULTS.SMOKE, ...(opts.SMOKE || {}) };

  const group = new THREE.Group();                       // pedestal + haze, rides with the legend
  const position = new THREE.Vector3(o.baseX, o.floorY + ORB.highAboveTop, o.baseZ); // FEET anchor

  // ── faceted floating pedestal (the legend's island) ──
  const pedGeo = new THREE.CylinderGeometry(PED.size, PED.size * 0.88, PED.thickness, 6, 1);
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x1b2433, flatShading: true, roughness: 0.92, metalness: 0.12 });
  const pedestal = new THREE.Mesh(pedGeo, pedMat);
  pedestal.position.y = -(PED.gap + PED.thickness / 2); // top sits just under the feet
  group.add(pedestal);
  // faint amber facet edges → reads as "огранённый"
  const pedEdges = new THREE.EdgesGeometry(pedGeo);
  const pedEdgeMat = new THREE.LineBasicMaterial({ color: 0xffb21d, transparent: true, opacity: 0.18, depthWrite: false, fog: false });
  const pedLines = new THREE.LineSegments(pedEdges, pedEdgeMat);
  pedLines.position.copy(pedestal.position);
  group.add(pedLines);
  // amber contact-glow disc lying on the pedestal top (so it reads as "her island")
  const glowTex = makeRadialTexture('rgba(255,205,140,0.95)', 'rgba(255,178,90,0.0)', 0.5);
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffb21d, transparent: true, opacity: PED.glow * 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const glowDisc = new THREE.Mesh(new THREE.PlaneGeometry(PED.size * 2.1, PED.size * 2.1), glowMat);
  glowDisc.rotation.x = -Math.PI / 2;
  glowDisc.position.y = -PED.gap + 0.012;
  group.add(glowDisc);

  // ── local warm haze (bound to the legend) ──
  const n = o.hazeDensity;
  const hpos = new Float32Array(n * 3);
  const bx = new Float32Array(n), by = new Float32Array(n), bz = new Float32Array(n);
  const ph = new Float32Array(n), sp = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
    bx[i] = rr * Math.cos(a) * o.hazeRadius * (0.5 + Math.random() * 0.5);
    bz[i] = rr * Math.sin(a) * o.hazeRadius * (0.5 + Math.random() * 0.5);
    by[i] = u * o.hazeHeight * (0.5 + Math.random() * 0.5);
    ph[i] = Math.random() * Math.PI * 2;
    sp[i] = 0.5 + Math.random() * 0.8;
    hpos[i * 3] = bx[i]; hpos[i * 3 + 1] = by[i]; hpos[i * 3 + 2] = bz[i];
  }
  const hazeGeo = new THREE.BufferGeometry();
  hazeGeo.setAttribute('position', new THREE.BufferAttribute(hpos, 3));
  const hazeTex = makeRadialTexture('rgba(255,224,168,0.95)', 'rgba(255,206,133,0.0)', 0.4);
  const hazeMat = new THREE.PointsMaterial({ map: hazeTex, color: o.hazeColor, size: o.hazeSize, sizeAttenuation: true, transparent: true, opacity: o.hazeOpacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const haze = new THREE.Points(hazeGeo, hazeMat);
  haze.frustumCulled = false;
  haze.position.y = o.torsoLift;
  group.add(haze);

  group.position.copy(position); // group origin = the feet anchor (pedestal/haze offset locally)

  // ── descent smoke trail — a SEPARATE world-space Points so wisps stay where born
  //    and lag behind the climbing/orbiting legend. Per-particle fade via vertex
  //    colour × additive blending (no shader). ──
  const m = SMK.amount;
  const tpos = new Float32Array(m * 3);
  const tcol = new Float32Array(m * 3);
  const tage = new Float32Array(m).fill(SMK.length + 1); // all dead
  const tvx = new Float32Array(m), tvy = new Float32Array(m), tvz = new Float32Array(m);
  const tbri = new Float32Array(m);
  const amber = new THREE.Color(o.hazeColor);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
  trailGeo.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
  const trailTex = makeRadialTexture('rgba(255,214,150,0.95)', 'rgba(255,184,110,0.0)', 0.45);
  const trailMat = new THREE.PointsMaterial({ map: trailTex, size: SMK.size, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending });
  const trail = new THREE.Points(trailGeo, trailMat);
  trail.frustumCulled = false;
  let writeIdx = 0, emitAcc = 0;

  let prevFeetY = position.y;

  function tick(t, dt) {
    const d = Math.min(0.05, Math.max(0, dt) || 0);

    if (!o.reduced) {
      // big orbit cycle: s = 0 (high/centre) … 1 (low/rim), smooth + slightly aperiodic
      const phase = ORB.cycleSpeed * t;
      let s = 0.5 - 0.5 * Math.cos(phase);
      s = clamp01(s + 0.06 * Math.sin(phase * 0.37 + 0.5));
      const radius = lerp(ORB.radiusCenter, ORB.radiusRim, s);
      const az = ORB.azSpeed * t;
      let fx = o.baseX + radius * Math.cos(az);
      let fz = o.baseZ + radius * Math.sin(az);
      let fy = o.floorY + lerp(ORB.highAboveTop, ORB.lowAboveTop, s);
      // small Lissajous + bob layer on top of the big move
      fx += o.driftRadius * 0.25 * Math.sin(o.driftSpeed * t);
      fz += o.driftRadius * 0.25 * 0.7 * Math.sin(o.driftSpeed * 1.37 * t + 1.1);
      fy += o.bobAmplitude * Math.sin(o.driftSpeed * 0.8 * t + 0.6);
      // never let the pedestal bottom dip below the clearance over the plate
      const minFeet = o.floorY + ORB.minClearance + PED.thickness + PED.gap;
      if (fy < minFeet) fy = minFeet;

      position.set(fx, fy, fz);
      group.position.copy(position);

      // descent intensity (only when sinking)
      const vy = (fy - prevFeetY) / (d || 1e-3);
      prevFeetY = fy;
      const descent = clamp01(-vy / SMK.refDown);

      // haze swirl + thicken as it sinks
      for (let i = 0; i < n; i++) {
        const k = sp[i];
        hpos[i * 3] = bx[i] + 0.06 * Math.sin(k * t + ph[i]);
        hpos[i * 3 + 1] = by[i] + 0.05 * Math.sin(k * 0.7 * t + ph[i] * 1.3);
        hpos[i * 3 + 2] = bz[i] + 0.06 * Math.cos(k * 0.85 * t + ph[i]);
      }
      hazeGeo.attributes.position.needsUpdate = true;
      hazeMat.opacity = o.hazeOpacity * (1 + o.hazeDescentBoost * descent);

      // emit smoke from under the pedestal at a rate ∝ descent speed
      const pedBottomY = fy - PED.gap - PED.thickness;
      emitAcc += SMK.emitPerSec * descent * d;
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const i = writeIdx; writeIdx = (writeIdx + 1) % m;
        tpos[i * 3] = fx + (Math.random() * 2 - 1) * 0.1;
        tpos[i * 3 + 1] = pedBottomY;
        tpos[i * 3 + 2] = fz + (Math.random() * 2 - 1) * 0.1;
        tvx[i] = (Math.random() * 2 - 1) * SMK.spread;
        tvy[i] = SMK.rise + (Math.random() * 2 - 1) * 0.05;
        tvz[i] = (Math.random() * 2 - 1) * SMK.spread;
        tage[i] = 0;
        tbri[i] = 0.45 + 0.55 * descent;
      }
    } else {
      prevFeetY = position.y;
    }

    // age + advance the smoke wisps; bake per-particle fade into the vertex colour
    for (let i = 0; i < m; i++) {
      if (tage[i] >= SMK.length) { tcol[i * 3] = tcol[i * 3 + 1] = tcol[i * 3 + 2] = 0; continue; }
      tage[i] += d;
      tpos[i * 3] += tvx[i] * d;
      tpos[i * 3 + 1] += tvy[i] * d;
      tpos[i * 3 + 2] += tvz[i] * d;
      const life = Math.pow(Math.max(0, 1 - tage[i] / SMK.length), SMK.fade);
      const k = life * SMK.opacity * tbri[i];
      tcol[i * 3] = amber.r * k; tcol[i * 3 + 1] = amber.g * k; tcol[i * 3 + 2] = amber.b * k;
    }
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.color.needsUpdate = true;
  }

  function dispose() {
    pedGeo.dispose(); pedMat.dispose(); pedEdges.dispose(); pedEdgeMat.dispose();
    glowTex.dispose(); glowMat.dispose(); glowDisc.geometry.dispose();
    hazeGeo.dispose(); hazeMat.dispose(); hazeTex.dispose();
    trailGeo.dispose(); trailMat.dispose(); trailTex.dispose();
  }

  return { group, trail, position, tick, dispose };
}
