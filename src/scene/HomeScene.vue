<!-- HomeScene — the calm "home" 3D stage. The SAME arena slab + the SAME idle
     fighter as the arena, but WITHOUT the combat rift (no glow, no sparks, no
     opponent, no HUD) and with a fixed 3/4 camera (gentle sway, no orbit).
     Reuses buildArena / buildFighter unmodified — the rift glow is suppressed
     by hiding the rift-glow materials + sparks and never creating the presence
     layer (which is what pulses the rift). A small dark seam-filler occludes the
     void seen through the torn slit so the slab reads as one calm platform.

     Discipline: the ONLY glow on this scene is the fighter's core (one of the
     two allowed glows; the other — the FIGHT button — lives in the 2D layer).
     Decor props are matte. Respects prefers-reduced-motion + tab-hidden pause. -->
<template>
  <div ref="wrap" class="home-scene-wrap">
    <canvas ref="canvasEl" class="home-scene-canvas" />
    <div class="home-scene-vignette" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildArena } from './buildArena.js';
import { makeRadialTexture } from './arenaTextures.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { buildPropSet, buildSnapGrid, buildGhost, disposeGroup } from './homeProps.js';
import { createHomeWanderDirector } from './homeWander.js';
import { setHomeFighterTag, clearHomeFighterTag } from './homeFighterTag.js';
import { buildModePlates, MODE_PLATES } from './modePlates.js';
import { createTransitionFlight, FLIGHT } from './transitionFlight.js';
import { setModePlateTag, setModePlateHover, clearModePlateTags } from './modePlateTags.js';
import {
  PERF_ON, perfFrame, perfFlightStart, perfFlightEnd, setPerfCap, setPlateCost, countTriangles,
} from './perfProbe.js';

const props = defineProps({
  coreHue: { type: String, default: '#FF0069' }, // fighter core colour (per-core hue)
  coreId: { type: String, default: null }, // null = no core picked → default fighter
  placements: { type: Array, default: () => [] }, // [{ kind, u, v }] fixed decor set
  arrange: { type: Boolean, default: false }, // arrange mode → show snap-grid + ghost
  gridCells: { type: Array, default: () => [] }, // [{ u, v, active }]
  ghost: { type: Object, default: null }, // { kind, u, v } | null
  // Which stage of the ONE world the camera is on. The view flips this; the scene
  // FLIES between them (see transitionFlight.js) — except on the very first mount,
  // where a direct /play/mode load must land on the mode framing with no flight.
  stage: { type: String, default: 'home' }, // 'home' | 'select'
});

// arrived('home'|'select') — the camera is on the final framing and the 2D chrome
//   for that stage may come back.
// pick('pve'|'pvp')        — a mode plate was chosen.
const emit = defineEmits(['arrived', 'pick']);

const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, controls, arena, fighter, resizeObserver, clock;
// Pre-load readiness: emit once after the first frame is rendered so the
// bootstrap splash (page-load) and the SPA transition cover can lift on real
// home-scene readiness. Per-mount (script-setup local) so it re-fires on every
// fresh mount, not just the first of the session.
let firstFrameEmitted = false;
let onVisibility;
let director = null;     // home wander director (drives the existing locomotion)
let prevWanderT = 0;     // last frame's elapsed time → per-frame dt for the director
let viewW = 0;           // canvas CSS size — for projecting the fighter head → screen px
let viewH = 0;
let tagNear = false;     // identity-label show flag (hysteresis, set in the loop)
const _tagV = new THREE.Vector3(); // scratch for the world→screen projection
let propGroup = null;
let gridGroup = null;
let ghostGroup = null;
let arenaRefs = null;
let lamps = null;
let dust = null;       // warm drifting dust/haze in the lamp cone (one THREE.Points)
let glow = null;       // soft warm "homely" pool on the slab under the fighter
let backdrop = null;   // world-anchored background dome (dark gradient + faint hex weave)
let lampHaze = null;   // soft warm haze halos at the lamp shades (additive sprites)
let modePlates = null; // the PVE / PVP plates, far down -Z in the SAME world
let flight = null;     // the home ↔ mode camera flight director
let stage = 'home';    // the stage the camera is actually ON (props.stage is the wish)
let modeIdleSince = null; // clock time the mode-stage orbit went idle (auto-return)
let modeReturning = false;
let modeHomePose = null;  // the default mode framing, for the idle auto-return
let reduced = false;
// Initial 3/4 camera placement; OrbitControls derives azimuth/polar/distance
// from this + the target (the fighter) on first update().
const CAM_BASE = new THREE.Vector3(4.6, 5.2, 6.7);

// Identity label "by approach": project a point above the fighter's head to screen
// px every frame, and gate the label's show flag on the camera zoom distance with a
// hysteresis band (two thresholds) so it can't flicker on the edge. The orbit
// corridor is 3.5..12 (default ≈ 8.9); "near" = the player has zoomed in close.
const TAG = {
  headY: 2.05,   // world height above the slab top for the anchor (just above the head)
  nearOn: 5.3,   // camera distance below this → show
  nearOff: 6.5,  // distance above this → hide (gap = hysteresis, no flicker)
};

// Counter fill for the far end of the corridor — see where it is added below.
// Deliberately dim and cold: it exists so nothing reads as a black cut-out when the
// player turns round at the plates, NOT to light a second stage.
const FAR_FILL = {
  color: 0x9fb0cc,
  intensity: 0.75,
  x: -4,
  y: 9,
  zOffset: -10, // sits beyond the plates, shining back up the corridor
};

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

// ─────────────────────── Overhead industrial dish lamps ───────────────────────
// Workshop / gym "dish" lamps hanging from the ceiling: a dark low-poly reflector
// (open cone) on a thin vertical rod, a warm amber bulb inside, and — the point
// this time — a REAL warm PointLight per lamp that actually pools onto the slab +
// fighter, so the scene sits in a lit room instead of floating in black.
//
// Discipline frame: the lamp light is warm, soft and DIM — a gentle amber room
// fill. The fighter core stays the ONLY bright accent and the only cold/pink one:
// warm even fill vs. one sharp cold pink point. The fill must never out-bright or
// recolour the core (the core halo is additive/constant, so light can't tint it;
// just keep light.intensity low). All knobs live in LAMPS — tune on preview in one
// place. Default leans DIM (easier to raise than to rescue the discipline). A few
// lamps in a calm spread over the slab — industrial lighting, NOT a garland.
const LAMPS = {
  ceilingY: 7.3, // Y where the rods attach up top — master drop lever (lower ⇒ whole
  //               fixture (rod+shade+bulb+light) slides down as one unit)
  wire: 1.6, // base rod length (ceiling → shade); per-lamp `drop` adds to it
  shadeRadius: 0.55, // reflector opening radius
  shadeHeight: 0.5, // reflector depth
  shadeColor: 0x161a24, // dark matte outer shell (arena family)
  rodColor: 0x0c0f16, // thin hanger rod
  rodRadius: 0.018,
  bulbRadius: 0.12, // warm glowing element inside the shade
  bulbColor: 0xffb368, // warm amber bulb (emissive dot, NOT pink/white)
  bulbOpacity: 0.95,
  light: {
    color: 0xffb368, // warm amber — matches the bulb
    intensity: 16, // DIM by default — raise on preview if the room is too dark
    distance: 18, // falloff radius
    decay: 2, // physical falloff
  },
  // Calm spread over the slab (±3 X, ±2 Z); `drop` staggers hang height a touch.
  positions: [
    { x: -1.9, z: -0.5, drop: 0.0 },
    { x: 1.9, z: 0.5, drop: 0.7 },
    { x: 0.1, z: -1.5, drop: 0.3 },
    { x: -0.3, z: 1.4, drop: 1.0 },
  ],
  flicker: 0.05, // gentle light-intensity wobble (0 = dead steady)
  flickerSpeed: 1.3,
};

// Build the lamps → { group, tick(t)|null, dispose }. reduced ⇒ tick=null (steady
// light, no flicker). Cheap: shared shade/bulb geometry + materials, one PointLight
// per lamp, no shadow maps (pure fill) — fine on mobile.
function buildLamps(opts, reduced) {
  const group = new THREE.Group();
  const shadeGeo = new THREE.ConeGeometry(opts.shadeRadius, opts.shadeHeight, 16, 1, true);
  const bulbGeo = new THREE.SphereGeometry(opts.bulbRadius, 10, 8);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: opts.shadeColor, flatShading: true, roughness: 0.9, metalness: 0.2, side: THREE.DoubleSide,
  });
  const rodMat = new THREE.MeshStandardMaterial({ color: opts.rodColor, roughness: 0.8, metalness: 0.3 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: opts.bulbColor, transparent: true, opacity: opts.bulbOpacity });
  const rodGeos = []; // per-lamp (length varies with drop)
  const lights = []; // { light, base, phase }

  opts.positions.forEach((pos, i) => {
    const shadeTopY = opts.ceilingY - opts.wire - (pos.drop || 0);

    // reflector — cone apex up at shadeTopY, wide opening facing down
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(pos.x, shadeTopY - opts.shadeHeight / 2, pos.z);
    group.add(shade);

    // hanger rod — ceiling → shade apex
    const rodLen = opts.ceilingY - shadeTopY;
    const rodGeo = new THREE.CylinderGeometry(opts.rodRadius, opts.rodRadius, rodLen, 6);
    rodGeos.push(rodGeo);
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(pos.x, shadeTopY + rodLen / 2, pos.z);
    group.add(rod);

    // warm bulb inside the shade
    const bulbY = shadeTopY - opts.shadeHeight * 0.55;
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(pos.x, bulbY, pos.z);
    group.add(bulb);

    // REAL warm light — soft amber pool on the slab + fighter (no shadows = cheap)
    const light = new THREE.PointLight(opts.light.color, opts.light.intensity, opts.light.distance, opts.light.decay);
    light.position.set(pos.x, bulbY - 0.05, pos.z);
    group.add(light);
    lights.push({ light, base: opts.light.intensity, phase: i * 1.7 });
  });

  const tick = reduced ? null : (t) => {
    for (const l of lights) {
      l.light.intensity = l.base * (1 - opts.flicker * 0.5 + opts.flicker * 0.5 * Math.sin(t * opts.flickerSpeed + l.phase));
    }
  };

  const dispose = () => {
    shadeGeo.dispose();
    bulbGeo.dispose();
    shadeMat.dispose();
    rodMat.dispose();
    bulbMat.dispose();
    rodGeos.forEach((g) => g.dispose());
  };

  // bulbMat is handed back so the far-distance glow gate can put the bulbs out
  // once the camera has left the home (see applyHomeGlowGate).
  return { group, tick, bulbMat, dispose };
}

// ─────────────────────────── Atmosphere: dust + under-glow ───────────────────────────
// Two cheap warm touches so the scene breathes instead of floating in vacuum. Both
// live in the SAME warm amber family as the lamps — soft low-intensity FILL, never a
// second accent: the fighter core stays the ONLY bright / pink mark on the screen.
// Tune everything here on preview.

// DUST — one THREE.Points of soft radial sprites drifting up through the lamp cone
// over the slab. Position is a pure function of time (no per-frame accumulation →
// pause/reduced-safe, alloc-free): slow upward rise that wraps, a tiny lateral sway,
// and one gentle global opacity flicker. Density is "lived air", not falling snow.
const DUST = {
  count: 110,          // a single Points object — cheap, fine on mobile (no shadows)
  xRange: 2.6,         // ±X half-extent of the drift box (over the slab)
  zRange: 1.7,         // ±Z half-extent — kept well in front of the camera (z≈6.7)
  yMin: 0.7,           // just above the slab …
  yMax: 3.9,           // … up into the lamp cone (shades hang ~5.7)
  // size in WORLD units (sizeAttenuation on): on-screen px ≈ size·0.5·cssHeight/dist,
  // so the old 0.07 projected to ~3.5px (bright core ~1px) → invisible. 0.16 reads as
  // a soft ~6–13px haze speck across the orbit distance without becoming "snow".
  size: 0.16,
  color: 0xffb368,     // warm amber — the lamp family (matches LAMPS.bulbColor)
  opacity: 0.4,        // additive over the dark scene needs this to register (was 0.2 → sank)
  rise: 0.10,          // upward drift speed (u/s)
  sway: 0.05,          // lateral sway amplitude (u)
  swaySpeed: 0.25,     // sway frequency
  flicker: 0.35,       // opacity flicker depth (fraction of opacity)
  flickerSpeed: 0.55,
};

// GLOW — a soft warm pool on the slab under the fighter ("homely", a counterweight to
// the cold rift). One additive radial sprite lying flat on the plate, gently FOLLOWING
// the wandering fighter (smooth lerp, no clicks). Dim — not a bright puddle, not pink,
// never a second bright focus competing with the core.
const GLOW = {
  radius: 1.9,         // pool half-size on the slab (wide + soft)
  color: 0xffb368,     // warm amber — lamp family
  opacity: 0.3,        // additive, low — a warm wash, not a spotlight
  follow: 0.06,        // lerp toward the fighter per frame (soft; no snap)
  yLift: 0.02,         // sit just above the slab top (no z-fight)
};

// Build the drifting dust → { points, tick(t)|null, dispose }. reduced ⇒ tick=null
// (the cloud holds its initial scattered positions — a static haze, no drift).
function buildDust(opts, reducedMotion) {
  const n = opts.count;
  const positions = new Float32Array(n * 3);
  const baseX = new Float32Array(n);
  const baseZ = new Float32Array(n);
  const baseY = new Float32Array(n); // start offset within the column [0, yRange)
  const phX = new Float32Array(n);
  const phZ = new Float32Array(n);
  const yRange = opts.yMax - opts.yMin;
  for (let i = 0; i < n; i++) {
    baseX[i] = (Math.random() * 2 - 1) * opts.xRange;
    baseZ[i] = (Math.random() * 2 - 1) * opts.zRange;
    baseY[i] = Math.random() * yRange;
    phX[i] = Math.random() * Math.PI * 2;
    phZ[i] = Math.random() * Math.PI * 2;
    positions[i * 3] = baseX[i];
    positions[i * 3 + 1] = opts.yMin + baseY[i];
    positions[i * 3 + 2] = baseZ[i];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const tex = makeRadialTexture('rgba(255,210,150,0.95)', 'rgba(255,180,105,0.22)', 0.3);
  const mat = new THREE.PointsMaterial({
    map: tex, color: opts.color, size: opts.size, sizeAttenuation: true,
    transparent: true, opacity: opts.opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // tiny object, particles move → skip the cull math

  const tick = reducedMotion ? null : (t) => {
    for (let i = 0; i < n; i++) {
      positions[i * 3] = baseX[i] + opts.sway * Math.sin(opts.swaySpeed * t + phX[i]);
      positions[i * 3 + 1] = opts.yMin + ((baseY[i] + opts.rise * t) % yRange); // slow rise, wraps
      positions[i * 3 + 2] = baseZ[i] + opts.sway * Math.cos(opts.swaySpeed * 0.8 * t + phZ[i]);
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = opts.opacity * (1 - opts.flicker * 0.5 + opts.flicker * 0.5 * Math.sin(opts.flickerSpeed * t));
  };

  const dispose = () => { geo.dispose(); mat.dispose(); tex.dispose(); };
  return { points, tick, dispose };
}

// Build the under-fighter glow → { mesh, follow(pos), dispose }. A flat additive
// radial sprite on the slab; follow() eases it toward the fighter each frame.
function buildUnderGlow(opts, topY) {
  const tex = makeRadialTexture('rgba(255,200,140,0.9)', 'rgba(255,175,100,0.2)', 0.45);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, color: opts.color, transparent: true, opacity: opts.opacity,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(opts.radius * 2, opts.radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;        // lie flat on the plate
  mesh.position.y = topY + opts.yLift;   // just above the slab top
  const follow = (pos) => {
    mesh.position.x += (pos.x - mesh.position.x) * opts.follow;
    mesh.position.z += (pos.z - mesh.position.z) * opts.follow;
  };
  const dispose = () => { mesh.geometry.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, follow, dispose };
}

// Warm-amber glow colour with a SUBTLE mix of the fighter's core hue (variant A), so
// the floor "responds" to the fighter without becoming a second bright colour. Amber
// stays dominant (~78–87%). coreHue is the SAME string fed to buildFighter that tints
// the 3D core — read it, never hardcode. The core-tint share is held LOW for warm-red
// / pink hues (ONSLAUGHT) so the pool can't read as a second pink accent.
function warmGlowColor(coreHueStr) {
  const amber = new THREE.Color(0xffb368);
  if (!coreHueStr) return amber;
  const core = new THREE.Color(coreHueStr);
  const hsl = { h: 0, s: 0, l: 0 };
  core.getHSL(hsl);
  const h = hsl.h;                              // 0..1
  const dRed = Math.min(h, 1 - h);             // 0 at red (h≈0/1)
  const dPink = Math.abs(h - 0.93);            // 0 at pink-magenta
  const danger = Math.max(0, 1 - dRed / 0.12, 1 - dPink / 0.08); // ~1 near red/pink
  const blend = THREE.MathUtils.lerp(0.22, 0.13, THREE.MathUtils.clamp(danger, 0, 1));
  return amber.clone().lerp(core, blend);      // amber-dominant, subtle core tint
}

// ───────────────────────── Background depth (dome + lamp haze) ─────────────────────────
// The space above the slab used to read as a flat black hole. Three quiet warm/dark
// layers give it depth WITHOUT a single drop of pink and WITHOUT a new glow source:
//   1. a dark vertical gradient (near-black up top → a warm-dark scene tone lower),
//   2. a barely-there hexagonal weave (our hex language — slab + logo), denser up top
//      and dissolved toward the fighter so it never fights the figure,
//   3. soft warm haze halos at the lamp shades so the lamps read as actually lighting
//      the top of the frame.
// Layers 1+2 live on ONE big background DOME (a sphere, painted into a single canvas
// texture) so they're WORLD-anchored: the camera orbit parallaxes past them as real
// depth (never a floating screen film, no seams / empty edges), and the hex is
// mip-mapped so it can't moiré/shimmer when the camera moves. The dome is unlit
// (MeshBasicMaterial, fog:false) → a controlled backdrop tone, never lit by the lamps.
// All knobs here. Everything is static geometry → reduced-motion safe by construction.

const BACKDROP = {
  // The dome has to enclose BOTH ends of the world now, not just the home: with a
  // full circle to orbit at the plates, every azimuth has to land on sky rather than
  // on the edge of the geometry. So it is centred on the middle of the corridor
  // (see centerZ below) and grown to clear the furthest the camera can get at either
  // end. It is a smooth vertical gradient with no texture detail, so moving and
  // enlarging it costs nothing visually — there is no pattern to stretch or seam.
  radius: 58,            // clears the home orbit and the mode orbit's outer limit
  centerZ: null,         // null ⇒ the corridor midpoint, filled in at build time
  centerY: 1.6,          // equator ≈ eye level (the camera looks at ~1.6) so the gradient centres on view
  texW: 1024,            // longitude (wraps) — kept an integer number of hex columns for a seamless seam
  texH: 1024,            // latitude (the vertical gradient)
  // vertical gradient stops (canvas top = world top = darkest). The shift is packed
  // around the middle band the camera actually sees; poles are rarely in frame.
  grad: [
    [0.00, '#060710'],   // top pole — darkest, ≈ the fog colour (seamless with fogged foreground)
    [0.42, '#0a0a12'],   // upper frame — near-black
    [0.62, '#120f0c'],   // lower-mid — warm-dark transition (lamp family)
    [1.00, '#1b150d'],   // bottom pole — dark warm
  ],
  // hex weave — warm dark amber, VERY faint (quieter than the mockup), faded out toward
  // the fighter (low latitude) so the figure + identity stay clean.
  hexCols: 60,           // hexes around the longitude (even → seamless wrap)
  hexRGB: '255,186,120', // warm amber stroke (alpha appended per row)
  hexMaxAlpha: 0,        // hex weave OFF — flat dark backdrop, no speckled pattern
  hexFadeStart: 0.46,    // v below this (toward the fighter) → no hex
  hexFadeEnd: 0.62,      // v above this → full strength
  dither: 0,             // grain OFF — smooth dark gradient, no per-pixel speckle
};

const HAZE = {
  color: 0xffb368,       // warm amber — the same lamp family as the bulbs / dust / under-glow
  opacity: 0.14,         // low — a soft halo, NOT a bright accent (the core stays brightest)
  scale: 2.6,            // sprite world size (blooms around the ~0.55 shade)
  yOffset: 0.05,         // nudge toward the shade centre
};

// flat-top hexagon outline at (cx,cy) radius R
function strokeHex(ctx, cx, cy, R) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const x = cx + R * Math.cos(a);
    const y = cy + R * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

// Paint the honeycomb across the canvas with a per-row alpha fade (strong up top,
// gone toward the fighter). Seamless horizontally (texW = whole number of 3R periods).
function drawHexWeave(ctx, o) {
  const cols = o.hexCols;
  const R = o.texW / (cols * 1.5);  // flat-top column spacing 1.5R × cols = texW
  const vStep = Math.sqrt(3) * R;
  ctx.lineWidth = Math.max(1, R * 0.05);
  ctx.lineJoin = 'round';
  for (let c = 0; c <= cols; c++) {
    const x = c * 1.5 * R;
    const yOff = (c % 2) * (vStep / 2);
    for (let r = -1; r * vStep + yOff < o.texH + vStep; r++) {
      const y = r * vStep + yOff;
      const v = 1 - y / o.texH; // canvas top (y=0) → v=1 (world top)
      let a = 0;
      if (v > o.hexFadeStart) a = o.hexMaxAlpha * Math.min(1, (v - o.hexFadeStart) / (o.hexFadeEnd - o.hexFadeStart));
      if (a <= 0.002) continue;
      ctx.strokeStyle = `rgba(${o.hexRGB},${a.toFixed(3)})`;
      strokeHex(ctx, x, y, R);
    }
  }
}

// Build the background dome → { mesh, dispose }. One sphere, one canvas texture.
function buildBackdrop(o, maxAniso) {
  const c = document.createElement('canvas');
  c.width = o.texW; c.height = o.texH;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, o.texH);
  for (const [stop, col] of o.grad) g.addColorStop(stop, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, o.texW, o.texH);
  // subtle dither to kill banding in the dark gradient
  if (o.dither > 0) {
    const img = ctx.getImageData(0, 0, o.texW, o.texH);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() * 2 - 1) * o.dither;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }
  drawHexWeave(ctx, o);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;        // longitude wraps seamlessly
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter; // mip-mapped → no hex moiré on movement
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(4, maxAniso || 1);

  const geo = new THREE.SphereGeometry(o.radius, 48, 32);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, side: THREE.BackSide, fog: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, o.centerY, o.centerZ ?? 0);
  mesh.renderOrder = -10; // paint first, behind everything
  const dispose = () => { geo.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, dispose };
}

// Build the lamp-haze halos → { group, dispose }. One additive radial sprite per lamp,
// world-positioned AT the lamp shade so it stays anchored to the lamp under camera
// orbit (sprites auto-billboard). Static (no tick) → reduced-motion safe. Dim warm
// fill, not a new accent.
function buildLampHaze(o, lampOpts) {
  const group = new THREE.Group();
  const tex = makeRadialTexture('rgba(255,205,150,0.9)', 'rgba(255,175,100,0.0)', 0.5);
  const mat = new THREE.SpriteMaterial({
    map: tex, color: o.color, transparent: true, opacity: o.opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  for (const pos of lampOpts.positions) {
    const shadeTopY = lampOpts.ceilingY - lampOpts.wire - (pos.drop || 0);
    const bulbY = shadeTopY - lampOpts.shadeHeight * 0.55;
    const s = new THREE.Sprite(mat);
    s.position.set(pos.x, bulbY + o.yOffset, pos.z);
    s.scale.setScalar(o.scale);
    group.add(s);
  }
  const dispose = () => { tex.dispose(); mat.dispose(); };
  return { group, dispose };
}

// Rebuild the decor / grid / ghost groups from the current props. Cheap — a
// handful of faceted meshes; called on mount + whenever the state changes.
function rebuildProps() {
  if (!scene || !arenaRefs) return;
  if (propGroup) { scene.remove(propGroup); disposeGroup(propGroup); propGroup = null; }
  if (gridGroup) { scene.remove(gridGroup); disposeGroup(gridGroup); gridGroup = null; }
  if (ghostGroup) { scene.remove(ghostGroup); disposeGroup(ghostGroup); ghostGroup = null; }

  propGroup = buildPropSet(props.placements, arenaRefs);
  scene.add(propGroup);

  if (props.arrange) {
    gridGroup = buildSnapGrid(props.gridCells, arenaRefs, props.coreHue);
    scene.add(gridGroup);
    if (props.ghost) {
      ghostGroup = buildGhost(props.ghost.kind, props.ghost, arenaRefs, props.coreHue);
      scene.add(ghostGroup);
    }
  }

  // Hand the placed decor footprints to the wander director so the fighter routes
  // its strolls AROUND props (not through them). Grid/ghost (arrange overlays) are
  // not obstacles. propGroup sits at the origin → child positions are world XZ.
  if (director) {
    const obs = [];
    if (propGroup) propGroup.children.forEach((c) => obs.push({ x: c.position.x, z: c.position.z }));
    director.setObstacles(obs);
  }
}

// --- Lazy camera follow with a dead-zone. The orbit pivot (controls.target) holds
//     still while the fighter wanders the central zone, and only lazily (heavily
//     damped) trails when the fighter drifts past FOLLOW_DEADZONE toward the frame
//     edge — so the fighter never leaves frame, but small steps don't shove the
//     camera. All OrbitControls + clamps are untouched.
const FOLLOW_DEADZONE = 0.75; // pivot holds while the fighter is within this (XZ) of it
const FOLLOW_LERP = 1.3;      // catch-up rate past the dead-zone (1/s) — lazy, not snappy
function followFighter(dt) {
  if (!controls || !fighter || !arena) return;
  const p = fighter.group.position;
  const tx = controls.target.x;
  const tz = controls.target.z;
  const off = Math.hypot(p.x - tx, p.z - tz);
  if (off <= FOLLOW_DEADZONE) return;
  // Pull the pivot toward the fighter, but only the slack past the dead-zone, so it
  // trails the fighter at ~FOLLOW_DEADZONE radius rather than centring on it.
  const desiredX = p.x + (tx - p.x) * (FOLLOW_DEADZONE / off);
  const desiredZ = p.z + (tz - p.z) * (FOLLOW_DEADZONE / off);
  const k = 1 - Math.exp(-FOLLOW_LERP * Math.min(0.05, dt));
  controls.target.x += (desiredX - tx) * k;
  controls.target.z += (desiredZ - tz) * k;
  controls.target.y = arena.refs.topY + 1.1;
}

// ─────────────────────── The MODE stage: framing, orbit, picking ───────────────────────
// Home and the two mode plates are ONE world (see modePlates.js / transitionFlight.js).
// Everything below is the bookkeeping that lets a single camera + a single
// OrbitControls serve both stages: how the mode framing is computed (it has to
// survive an orientation change), how the orbit corridor is swapped, and how the
// plates are hovered / picked.

const HOME_ORBIT = { minDist: 3.5, maxDist: 12, polarMin: 0.3, polarMax: 1.4 };

// The home pose the player left when they pressed FIGHT — the way back lands
// exactly there rather than on some canonical framing.
let homeReturnPose = null;
let coarsePointer = false;
const _ray = new THREE.Raycaster();
const _ptr = new THREE.Vector2();
const _plateV = new THREE.Vector3();
const _modeDesired = new THREE.Vector3();
const _modeOffset = new THREE.Vector3();
let downX = 0; let downY = 0;
let touchArmed = null; // MODE_PLATES.touchTwoStep: the plate lit by the first tap

// The default mode framing. Derived from the plate pair's own bounds, so a portrait
// device (where the pair re-lays itself in depth) gets a framing that still fills the
// screen instead of a thin strip. Returns FRESH vectors — the flight director keeps
// one as its cached destination and compares against a live one to notice a rotation.
function modeFraming() {
  const f = FLIGHT.fit;
  const b = modePlates
    ? modePlates.bounds()
    : { spanX: 10, spanZ: 3, topY: 0.6, emblemTop: 2 };
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const spanX = b.spanX + f.marginX;
  const spanY = b.spanZ * f.depthToScreen + b.emblemTop + f.marginY;
  const dist = THREE.MathUtils.clamp(
    Math.max(spanY / 2 / tanV, spanX / 2 / (camera.aspect * tanV)),
    f.minDist, f.maxDist,
  );
  const pitch = THREE.MathUtils.degToRad(f.pitchDeg);
  const target = new THREE.Vector3(0, FLIGHT.modeY + b.topY + f.targetLift, -FLIGHT.modeZ);
  const position = new THREE.Vector3(
    target.x,
    target.y + dist * Math.sin(pitch),
    target.z + dist * Math.cos(pitch),
  );
  return { position, target };
}

function homeFraming() {
  if (homeReturnPose) {
    return { position: homeReturnPose.position.clone(), target: homeReturnPose.target.clone() };
  }
  const target = new THREE.Vector3(
    fighter ? fighter.group.position.x : 0,
    (arenaRefs ? arenaRefs.topY : 0.5) + 1.1,
    fighter ? fighter.group.position.z : 1,
  );
  return { position: CAM_BASE.clone(), target };
}

function poseFor(where) { return where === 'mode' ? modeFraming() : homeFraming(); }

// Hand the orbit back to the player at the home stage: pivot on the fighter, the
// original wide corridor, no azimuth limit.
function applyHomeOrbit() {
  const pose = homeFraming();
  controls.target.copy(pose.target);
  controls.minDistance = HOME_ORBIT.minDist;
  controls.maxDistance = HOME_ORBIT.maxDist;
  controls.minPolarAngle = HOME_ORBIT.polarMin;
  controls.maxPolarAngle = HOME_ORBIT.polarMax;
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  controls.autoRotate = false; // the intro auto-orbit is a first-visit thing only
}

// …and at the mode stage: a FULL circle around the pair. The plates stand in the
// same world as the home, so the player has to be able to turn round and find the
// corridor, the sign and the home still there behind them — a fenced-in arc would
// have given the game away as a backdrop with two props on it.
//
// Only the two limits that protect the illusion survive: the pitch floor keeps the
// camera above the plate plane (no looking at their underside), and the absolute
// distance ceiling keeps it well inside the backdrop dome (no reaching the sky).
function applyModeOrbit() {
  const f = FLIGHT.fit;
  const pose = modeFraming();
  modeHomePose = { position: pose.position.clone(), target: pose.target.clone() };
  _modeOffset.copy(pose.position).sub(pose.target);
  const base = _modeOffset.length();
  controls.target.copy(pose.target);
  controls.minDistance = base * f.zoomMin;
  controls.maxDistance = Math.min(base * f.zoomMax, f.zoomMaxAbs);
  const basePolar = Math.PI / 2 - THREE.MathUtils.degToRad(f.pitchDeg);
  const span = THREE.MathUtils.degToRad(f.pitchSpanDeg);
  const floor = THREE.MathUtils.degToRad(f.pitchFloorDeg);
  controls.minPolarAngle = Math.max(0.05, basePolar - span);
  controls.maxPolarAngle = Math.min(Math.PI / 2 - floor, basePolar + span);
  controls.minAzimuthAngle = -Infinity; // all the way round
  controls.maxAzimuthAngle = Infinity;
  controls.autoRotate = false;
}

// Idle auto-return at the mode stage: after FLIGHT.fit.returnDelay of no input the
// camera drifts back to the default framing. Any input cancels it (the orbit
// start/end listeners below own the idle stamp).
function modeIdleReturn(t) {
  const f = FLIGHT.fit;
  if (!modeHomePose || modeIdleSince === null) return;
  if (!modeReturning && (t - modeIdleSince) >= f.returnDelay) modeReturning = true;
  if (!modeReturning) return;
  const k = reduced ? 1 : f.returnLerp;
  controls.target.lerp(modeHomePose.target, k);
  _modeDesired.copy(controls.target).add(_modeOffset);
  camera.position.lerp(_modeDesired, k);
  if (controls.target.distanceTo(modeHomePose.target) < 0.01
    && camera.position.distanceTo(modeHomePose.position) < 0.01) {
    modeReturning = false;
    modeIdleSince = null;
  }
}

// ─── presence: which end of the ONE world the camera is standing at ───
// 0 at the home, 1 at the plates. Everything that belongs to one end dims out with
// it: the plates and the sign sink to a hint in the haze while the player is at
// home, and the home's own glows go out once the camera has left it. Nothing is
// switched OFF — the player can orbit either stage a full circle, and a hard cut
// would show as a hole in the world the moment they looked the wrong way.
const _homeCentre = new THREE.Vector3(0, 1.2, 0);
const _modeCentre = new THREE.Vector3(0, 1.2, -FLIGHT.modeZ);
function corridorPresence() {
  const p = FLIGHT.presence;
  const dHome = camera.position.distanceTo(_homeCentre);
  const dMode = camera.position.distanceTo(_modeCentre);
  const mix = dHome / Math.max(dHome + dMode, 1e-4);
  const x = THREE.MathUtils.clamp((mix - p.nearMix) / Math.max(p.farMix - p.nearMix, 1e-4), 0, 1);
  return x * x * (3 - 2 * x); // smoothstep — no step as the camera crosses over
}
// The far end keeps a floor: seen from the home the plates and the sign sink to a
// suggestion in the haze rather than to nothing. The home's own glows do NOT get a
// floor — at the far end they are out, full stop, so the home reads as a silhouette
// and the only pink on the screen stays the one the stage is entitled to.
const farPresence = (k) => FLIGHT.presence.hint + (1 - FLIGHT.presence.hint) * k;

// The home's glows, gated from OUTSIDE the pieces that own them — the same approach
// the combat rift already gets on this stage. Once the camera is out over the void
// the home has to read as a silhouette: still lit, still lived in, still walking
// about, but with no glow of its own in frame. Only the one pink on the screen —
// FIGHT at the home, the hovered plate at the far end — ever survives.
//
// The fighter's core halo is rewritten by buildFighter.update() every frame, so the
// gate is applied AFTER it in the loop; the rest are ours and hold their value.
let homeGlowSprites = [];   // additive sprites inside the fighter (its core halo)
let homeGlowBases = null;   // resting opacities of the pieces we own
function collectHomeGlow() {
  homeGlowSprites = [];
  fighter.group.traverse((o) => {
    if (o.isSprite && o.material && o.material.blending === THREE.AdditiveBlending) {
      homeGlowSprites.push(o.material);
    }
  });
  homeGlowBases = {
    haze: lampHaze ? HAZE.opacity : 0,
    dust: DUST.opacity,
    glow: GLOW.opacity,
    bulb: LAMPS.bulbOpacity,
  };
}
function applyHomeGlowGate(k) {
  if (!homeGlowBases) return;
  for (const m of homeGlowSprites) m.opacity *= k; // after fighter.update() — see above
  if (lampHaze) lampHaze.group.children.forEach((sp) => { sp.material.opacity = homeGlowBases.haze * k; });
  if (dust) dust.points.material.opacity *= k;     // dust.tick rewrites it each frame
  if (glow) glow.mesh.material.opacity = homeGlowBases.glow * k;
  if (lamps?.bulbMat) lamps.bulbMat.opacity = homeGlowBases.bulb * k;
}

// Raycast the pointer against the plates' invisible hit boxes (one per plate, so the
// whole plate — emblem included — is a single affordance).
function pickPlate(clientX, clientY) {
  if (!modePlates || !canvasEl.value) return null;
  const r = canvasEl.value.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  _ptr.x = ((clientX - r.left) / r.width) * 2 - 1;
  _ptr.y = -((clientY - r.top) / r.height) * 2 + 1;
  _ray.setFromCamera(_ptr, camera);
  const hit = _ray.intersectObjects(modePlates.pickables, false)[0];
  return hit ? hit.object.userData.modePlate : null;
}

function setHover(id) {
  if (!modePlates) return;
  modePlates.setHover(id);
  setModePlateHover(id);
  if (canvasEl.value) canvasEl.value.style.cursor = id ? 'pointer' : '';
}

const modeSelectable = () => stage === 'select' && flight && !flight.active;

function onPointerMove(e) {
  if (coarsePointer || !modeSelectable()) return;
  setHover(pickPlate(e.clientX, e.clientY));
}

function onPointerDown(e) {
  downX = e.clientX; downY = e.clientY;
  // A tap ANYWHERE mid-flight rides the camera out to the end pose (see skip()).
  if (flight && flight.active) flight.skip();
}

function onPointerUp(e) {
  if (!modeSelectable()) return;
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return; // that was an orbit drag
  const id = pickPlate(e.clientX, e.clientY);
  if (!id) { if (coarsePointer) { touchArmed = null; setHover(null); } return; }
  if (coarsePointer && MODE_PLATES.touchTwoStep && touchArmed !== id) {
    touchArmed = id; // first tap lights it, second one enters
    setHover(id);
    return;
  }
  setHover(id); // hold the plate lit through the exit
  touchArmed = null;
  emit('pick', id);
}

function onKeyDown() {
  if (flight && flight.active) flight.skip();
}

// The camera has landed. Hand the orbit back, wake the stage's own chrome.
function onFlightArrive(where) {
  if (!controls) return;
  controls.enabled = true;
  if (where === 'select') {
    applyModeOrbit();
    modeIdleSince = clock ? clock.getElapsedTime() : 0;
    modeReturning = false;
  } else {
    applyHomeOrbit();
    modePlates?.setHover(null);
    clearModePlateTags();
    touchArmed = null;
    if (canvasEl.value) canvasEl.value.style.cursor = '';
  }
  controls.update();
  if (PERF_ON) perfFlightEnd(flight?.stalled);
  emit('arrived', where);
}

// Move to a stage. `animated` false = land on it with no flight (a direct
// /play/mode load, or reduced motion, where the caller covers the swap with a dim).
function goStage(next, animated) {
  if (!flight || !controls) return;
  const want = next === 'select' ? 'select' : 'home';
  if (want === stage && !flight.active) return;
  if (want === 'select') {
    homeReturnPose = { position: camera.position.clone(), target: controls.target.clone() };
    modePlates.layout(camera.aspect);
  }
  stage = want;
  controls.enabled = false;
  setHover(null);
  clearModePlateTags();
  touchArmed = null;
  modeIdleSince = null;
  modeReturning = false;
  if (!animated) {
    flight.snapTo(want === 'select' ? 'mode' : 'home');
    onFlightArrive(want);
    return;
  }
  flight.setLookHint(controls.target);
  if (PERF_ON) perfFlightStart();
  flight.play(want === 'select' ? 'mode' : 'home', { onArrive: () => onFlightArrive(want) });
}

onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;
  viewW = w; viewH = h; // canvas CSS size for the head→screen projection

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  coarsePointer = coarse;
  const targetFPS = coarse ? 30 : 60;

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const maxDPR = lowPowerDevice() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070811, 0.03);

  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.copy(CAM_BASE);

  // Lighting — same recipe as the arena (one warm key from top-front + cool fill).
  const key = new THREE.DirectionalLight(0xfff2e8, 2.3);
  key.position.set(4, 10, 6);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x2a3550, 0.5));
  scene.add(new THREE.HemisphereLight(0x44506e, 0x05060c, 0.4));
  // COUNTER FILL, from the far end of the corridor. The key sits over the home and
  // faces down the +Z side of everything, which was fine while that was the only
  // side anyone ever saw. Now the player can orbit the plates a full circle and look
  // back up the corridor — and from there the sign's far face, the plates' near
  // walls and the home's back were all unlit black. This is a dim cold counter-light,
  // not an accent: it puts a readable matte grey on those faces and nothing more.
  const counter = new THREE.DirectionalLight(FAR_FILL.color, FAR_FILL.intensity);
  counter.position.set(FAR_FILL.x, FAR_FILL.y, -FLIGHT.modeZ + FAR_FILL.zOffset);
  scene.add(counter);

  const pink = getComputedStyle(el).getPropertyValue('--hex-primary').trim() || '#FF0069';

  // --- Slab: reuse buildArena UNMODIFIED, then SUPPRESS the combat rift. The
  //     rift glow + sparks live on refs; zeroing the glow materials' opacity and
  //     hiding the sparks removes the light, and never creating arenaPresence
  //     means nothing pulses them back. Result: the same torn slab, no rift glow.
  arena = buildArena(renderer.capabilities.getMaxAnisotropy(), pink);
  arenaRefs = arena.refs;
  arena.refs.riftGlow.forEach((r) => { r.mat.opacity = 0; });
  arena.refs.sparks.points.visible = false;
  scene.add(arena.group);

  // Kill the bright seam contour on the floor: each plate's `rim` is a THREE.Line
  // tracing its full outline INCLUDING the inner torn edge — the jagged bright
  // line across the slab. It isn't part of riftGlow, so suppress it here (home
  // only, external — the combat arena builds its own slab and is untouched). The
  // two rims are the only Lines in the arena group. Result: one calm solid floor.
  arena.group.traverse((o) => { if (o.isLine) o.visible = false; });

  // Dark seam-filler — occludes the void seen straight down the torn slit so the
  // slab reads as one calm platform (the slit + teeth span ~±0.55 in Z).
  const seam = new THREE.Mesh(
    new THREE.PlaneGeometry(arena.refs.W + 0.2, 1.3),
    new THREE.MeshBasicMaterial({ color: 0x0c1018 }),
  );
  seam.rotation.x = -Math.PI / 2;
  seam.position.set(0, arena.refs.topY - 0.06, 0);
  scene.add(seam);

  // Overhead industrial dish lamps — warm DIM amber room fill that actually lights
  // the slab + fighter (see LAMPS knobs up top), so the scene isn't floating in
  // black. The core stays the only bright/cold accent; lower light.intensity if it
  // ever competes.
  lamps = buildLamps(LAMPS, reduced);
  scene.add(lamps.group);

  // Background depth — world-anchored dome (dark gradient + faint hex weave) so the
  // top of the frame reads as tone + texture instead of a black hole, plus soft warm
  // haze at the lamp shades so the lamps read as lighting the space. Both warm/dark,
  // no pink, no new glow; static → reduced-motion safe. (See builders up top.)
  backdrop = buildBackdrop(
    { ...BACKDROP, centerZ: -FLIGHT.modeZ / 2 }, // straddle the whole corridor
    renderer.capabilities.getMaxAnisotropy(),
  );
  scene.add(backdrop.mesh);
  lampHaze = buildLampHaze(HAZE, LAMPS);
  scene.add(lampHaze.group);

  // --- Fighter: ONE idle construct on the slab. No foe (getFoePos → null) → it
  //     idles (buildFighter idlePose path); AI is never enabled. Behaviour is
  //     resolved from the picked core (or core-less default) purely so the build
  //     is core-shaped; it never fights here.
  const behavior = resolveBehavior(props.coreId, []);
  // Cap the home fighter's preferred RANGE to a small, uniform value (display-only —
  // it never fights here). `range` derives from the distance axis; a low value keeps
  // every core close to its wander targets, so the body always WALKS to them and
  // never swings out on a wide orbit (which would carry it onto the occluded seam).
  if (behavior && behavior.axes) behavior.axes.distance = 18;

  // Home wander director — drives the EXISTING locomotion (see homeWander.js). It
  // feeds a moving "lure" through getFoePos so the body strolls on its real footwork,
  // and idles with varied waiting actions between strolls. Reduced-motion ⇒ inert.
  // The wander zone is the central slab IN FRONT of the torn seam (positive Z),
  // inset from the edges; the fighter's own bounds-clamp is the hard safety rail.
  // The lure's zone IS the wander boundary (the body chases the lure, so it stays
  // here). It is kept comfortably INSIDE the body's bounds below, so the body never
  // pins on a wall while reaching the lure — pinning + a lure just past the wall is
  // what tripped the body's contact-separation shove (the teleport). Front of the
  // torn seam (z ≥ 0.8 > the ~0.55 seam band), inset from the edges.
  director = createHomeWanderDirector({
    zone: {
      xMin: -(arena.refs.W / 2 - 1.2),
      xMax: arena.refs.W / 2 - 1.2,
      zMin: 0.9,
      zMax: arena.refs.totalDepth / 2 - 0.6,
    },
  });

  fighter = buildFighter(props.coreHue, {
    side: 'player',
    coreId: props.coreId,
    behavior,
    // Generous rail only: the body clamps its own position to these half-extents so
    // it can never reach the plate edge. The wander zone above is well inside this,
    // so under normal strolling the body never actually touches the rail (no snap).
    bounds: { x: arena.refs.W / 2 - 0.35, z: arena.refs.totalDepth / 2 - 0.3 },
    neutralColor: false,
    getFoePos: () => director.foePos(), // moving lure while strolling, null while idle
  });
  fighter.group.position.set(0, arena.refs.topY, 1.0); // start inside the wander zone (off the seam)
  // Face the core toward the camera (a flattering 3/4 front, since the camera is
  // off-axis). Forward is local -Z; facing dir (dx,dz) ⇒ rotation.y = atan2(-dx,-dz).
  {
    const dx = CAM_BASE.x - fighter.group.position.x;
    const dz = CAM_BASE.z - fighter.group.position.z;
    fighter.group.rotation.y = Math.atan2(-dx, -dz);
  }
  fighter.setReducedMotion(reduced);
  // SUPPRESS the over-head HP plate on the home stage — same external approach as
  // the rift glow above (reach in after build, never touch the combat file). The
  // HP plate is the only Sprite added DIRECTLY to the fighter group (buildFighter
  // attaches hpUI.mesh to group; the core halo is a Sprite nested under torso, so
  // it's untouched). Nothing in fighter.update() re-shows it, so visible=false
  // sticks. In the arena the plate is built/shown as before.
  fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
  scene.add(fighter.group);

  // Wake the wander director onto this fighter + camera. Under reduced-motion it
  // attaches inert (foePos stays null → the body just idles, calm).
  director.attach(fighter, camera, { reduced });

  // Atmosphere — warm drifting dust in the lamp cone + a soft warm pool under the
  // fighter (both in the lamp's amber family, low-intensity fill; the core stays the
  // only bright/pink mark). reduced ⇒ the dust holds still (tick=null); the glow just
  // tracks the (then-idle) fighter, no sudden motion.
  dust = buildDust(DUST, reduced);
  scene.add(dust.points);
  // Glow tinted with a subtle mix of THIS fighter's core hue (props.coreHue = the
  // hue that colours the 3D core); amber stays dominant, opacity unchanged.
  glow = buildUnderGlow({ ...GLOW, color: warmGlowColor(props.coreHue) }, arena.refs.topY);
  glow.mesh.position.set(fighter.group.position.x, arena.refs.topY + GLOW.yLift, fighter.group.position.z);
  scene.add(glow.mesh);

  // Everything the far-distance glow gate touches now exists — cache it once.
  collectHomeGlow();

  // --- Free orbit around the FIGHTER (home only — never added to the combat
  //     scene). Mouse: drag = orbit, wheel = zoom. Touch: one-finger drag =
  //     orbit, pinch = zoom (pan disabled). Soft damping.
  controls = new OrbitControls(camera, renderer.domElement);
  // Orbit pivot = the fighter's chest/core so it stays in focus while turning.
  controls.target.set(fighter.group.position.x, arena.refs.topY + 1.1, fighter.group.position.z);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08; // soft, not snappy
  controls.enablePan = false; // pivot stays locked on the fighter
  controls.rotateSpeed = 0.9;
  controls.zoomSpeed = 0.9;
  // Zoom corridor: near enough not to clip into the fighter, far enough that the
  // slab never gets lost in the void.
  controls.minDistance = 3.5;
  controls.maxDistance = 12;
  // Vertical clamp (the safety rail): top = pleasant high 3/4 (NOT straight
  // overhead); bottom stays comfortably above the slab so the camera can never
  // dip under the plate / see the suppressed seam from below. With the target at
  // chest height (~1.6) and maxPolar 1.4 (~80°), the camera y = target.y +
  // d·cos(polar) ≥ ~1.6 + 0.17·d — always well above the slab top (0.5).
  controls.minPolarAngle = 0.3; // ~17° from vertical
  controls.maxPolarAngle = 1.4; // ~80° — just above horizontal, never under
  // Horizontal: full 360° (no azimuth limit — no underside sideways).
  // Gentle intro auto-orbit that hands control to the player on first interaction.
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.6;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.update();

  // --- The MODE stage. Two smaller plates standing a long way down -Z in the SAME
  //     world (see modePlates.js). They are built HERE, at scene init, and never at
  //     transition time: a fourth heavy stage assembled the moment FIGHT is pressed
  //     would stall the exact beat the flight is supposed to be cinema. They cost a
  //     handful of meshes and start hidden — nothing loads when the camera flies.
  // Timed only under ?perf=1 — the whole "keep them in the home scene vs. build
  // them lazily on FIGHT" decision hangs on this number, so it is worth being able
  // to read it off a real phone (see perfProbe.js). Off, it costs nothing at all.
  const platesT0 = PERF_ON ? performance.now() : 0;
  modePlates = buildModePlates({
    maxAniso: renderer.capabilities.getMaxAnisotropy(),
    homeW: arena.refs.W,
    homeDepth: arena.refs.totalDepth,
    homeHeight: 1,
    reduced,
  });
  const platesMs = PERF_ON ? performance.now() - platesT0 : 0;
  modePlates.group.position.set(0, FLIGHT.modeY, -FLIGHT.modeZ);
  modePlates.layout(w / h);
  scene.add(modePlates.group);
  if (PERF_ON) {
    const tris = countTriangles(modePlates.group);
    setPlateCost(platesMs, tris.drawn, tris.hidden);
    setPerfCap(targetFPS); // the loop is FPS-capped; the readout prints it for context
  }

  // --- The flight director. Owns the camera path, the fog envelope, the haze the
  //     camera passes through and the HEXLASH sign standing in the corridor.
  flight = createTransitionFlight({ scene, camera, poseFor, reduced });
  flight.setLookHint(controls.target);

  // Orbit start/end also stamps the mode stage's idle clock (the auto-return).
  controls.addEventListener('start', () => { modeIdleSince = null; modeReturning = false; });
  controls.addEventListener('end', () => { modeIdleSince = clock ? clock.getElapsedTime() : 0; });

  // Pointer: hover / pick the plates at the mode stage, and skip a running flight.
  const cv = canvasEl.value;
  cv.addEventListener('pointermove', onPointerMove);
  cv.addEventListener('pointerdown', onPointerDown);
  cv.addEventListener('pointerup', onPointerUp);
  window.addEventListener('keydown', onKeyDown);

  // Direct load of /play/mode: land on the mode framing with NO flight (the page-load
  // splash already covered the assembly). Any later change of `stage` flies.
  if (props.stage === 'select') {
    stage = 'select';
    flight.snapTo('mode');
    applyModeOrbit();
    modeIdleSince = 0;
    controls.autoRotate = false;
    controls.update();
  }
  emit('arrived', stage);

  rebuildProps();

  // --- Render loop. FPS-capped; elapsed time drives the idle + the camera sway.
  clock = new THREE.Clock();
  prevWanderT = 0;
  const interval = 1000 / targetFPS;
  let lastFrame = 0;
  const loop = (time) => {
    if (time - lastFrame < interval) return;
    lastFrame = time;
    const t = clock.getElapsedTime();
    const dt = t - prevWanderT;
    prevWanderT = t;

    // The flight owns the camera while it runs, so the orbit is parked. The HOME
    // itself never pauses: the fighter keeps walking, the lamps keep flickering and
    // the dust keeps drifting under us as we pull away — that is the whole point of
    // both stages living in one world.
    // Which end of the corridor are we standing at? Everything that belongs to one
    // end fades with it — see corridorPresence.
    const k = corridorPresence();
    const presence = farPresence(k); // plates / sign / haze
    const flying = flight ? flight.update(dt, t, presence) : false;
    if (!flying) {
      if (stage === 'select') modeIdleReturn(t); // soft drift back to the default framing
      controls.update(); // damping + intro auto-orbit (until first interaction)
    }
    if (!reduced) director?.update(t, dt); // pick targets + feed the lure / idle actions
    fighter?.update(t, camera); // the body walks the lure / idles (its own footwork)
    if (!reduced && stage === 'home' && !flying) followFighter(dt); // lazy dead-zone follow
    lamps?.tick?.(t); // gentle light flicker (null under reduced motion)
    if (!reduced) dust?.tick?.(t); // warm dust drift (null/static under reduced motion)
    glow?.follow(fighter.group.position); // ease the warm pool under the fighter
    // Plates only respond (hover light / emblem life) once the camera has landed —
    // and they cost nothing at all while the home is on screen, where they are hidden.
    modePlates?.update(t, dt, stage === 'select' && !flying, presence);
    // AFTER fighter.update() / dust.tick(), both of which rewrite what this gates.
    applyHomeGlowGate(1 - k);
    if (PERF_ON) perfFrame(dt, flying); // dev readout only — see perfProbe.js

    // Identity label: project the point above the fighter's head to screen px and
    // gate the show flag on zoom proximity (hysteresis). HomeView reads this to
    // anchor + fade the 2D label. Works on touch too (pinch changes the distance).
    if (fighter && stage === 'home' && !flying) {
      const dist = camera.position.distanceTo(controls.target);
      if (!tagNear && dist < TAG.nearOn) tagNear = true;
      else if (tagNear && dist > TAG.nearOff) tagNear = false;
      _tagV.set(fighter.group.position.x, arena.refs.topY + TAG.headY, fighter.group.position.z);
      _tagV.project(camera); // → NDC
      const inFront = _tagV.z < 1; // not behind the camera
      setHomeFighterTag((_tagV.x * 0.5 + 0.5) * viewW, (-_tagV.y * 0.5 + 0.5) * viewH, tagNear && inFront);
    } else if (fighter) {
      setHomeFighterTag(0, 0, false); // the identity label belongs to the home stage only
    }

    // Mode-plate captions: same trick as the identity label — project the caption
    // anchor to canvas px so the 2D text stays sharp over real 3D plates.
    if (modePlates && stage === 'select' && !flying) {
      for (const id of ['pve', 'pvp']) {
        _plateV.copy(modePlates.captionAnchor(id)).project(camera);
        setModePlateTag(
          id,
          (_plateV.x * 0.5 + 0.5) * viewW,
          (-_plateV.y * 0.5 + 0.5) * viewH,
          _plateV.z < 1,
        );
      }
    }

    renderer.render(scene, camera);

    // First frame is on screen — signal readiness once (latch + event) so the
    // pre-load splash / SPA transition cover lift on real home-scene readiness.
    if (!firstFrameEmitted) {
      firstFrameEmitted = true;
      window.__hexHomeReady = true;
      window.dispatchEvent(new Event('hexlash:home-ready'));
    }
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else renderer.setAnimationLoop(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (!cw || !ch) return;
    viewW = cw; viewH = ch; // keep the projection in sync with the canvas size
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
    // An orientation change re-lays the plate pair (side-by-side ↔ stacked in depth)
    // and re-frames it. Mid-flight the director re-aims itself (it watches poseFor),
    // so only the standing case is handled here.
    modePlates?.layout(camera.aspect);
    if (stage === 'select' && flight && !flight.active) {
      flight.snapTo('mode');
      applyModeOrbit();
      controls.update();
    }
  });
  resizeObserver.observe(el);
});

// The view flips `stage`; the scene FLIES between the home and the mode plates.
// Under reduced motion the flight director places the camera instead of moving it
// (the caller covers that swap with a short dim — see HomeView).
watch(() => props.stage, (next) => goStage(next, true));

// State changes (empty ↔ lived ↔ arrange, ghost moves) → rebuild decor.
watch(
  () => [props.placements, props.arrange, props.gridCells, props.ghost],
  () => rebuildProps(),
  { deep: true },
);

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (renderer) renderer.setAnimationLoop(null);
  window.removeEventListener('keydown', onKeyDown);
  if (canvasEl.value) {
    canvasEl.value.removeEventListener('pointermove', onPointerMove);
    canvasEl.value.removeEventListener('pointerdown', onPointerDown);
    canvasEl.value.removeEventListener('pointerup', onPointerUp);
  }
  clearHomeFighterTag(); // hide the identity label when the stage unmounts
  clearModePlateTags();
  if (director) director.dispose();
  if (controls) controls.dispose();
  if (propGroup) { scene.remove(propGroup); disposeGroup(propGroup); }
  if (gridGroup) { scene.remove(gridGroup); disposeGroup(gridGroup); }
  if (ghostGroup) { scene.remove(ghostGroup); disposeGroup(ghostGroup); }
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); }
  if (backdrop) { scene.remove(backdrop.mesh); backdrop.dispose(); }
  if (lampHaze) { scene.remove(lampHaze.group); lampHaze.dispose(); }
  if (flight) flight.dispose(); // also hands the scene fog back to its resting value
  if (modePlates) { scene.remove(modePlates.group); modePlates.dispose(); }
  if (dust) { scene.remove(dust.points); dust.dispose(); }
  if (glow) { scene.remove(glow.mesh); glow.dispose(); }
  if (fighter) fighter.dispose();
  if (arena) arena.dispose();
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.home-scene-wrap {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 70% 60% at 50% 44%,
    #0d0f1c 0%,
    #07080f 55%,
    #030308 100%
  );
}
.home-scene-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.home-scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 78% 78% at 50% 50%,
    transparent 56%,
    rgba(3, 3, 8, 0.55) 100%
  );
}
</style>
