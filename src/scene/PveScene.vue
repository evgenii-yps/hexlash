<!-- PveScene — the FORGE hall, the 3D stage of the club. A self-contained sibling of
     HomeScene.vue (the home is live on prod — this never reuses it by a flag and never
     touches it): the SAME arena slab with the combat rift SUPPRESSED from outside
     (rift-glow opacity 0, sparks off, presence never created, the bright slab outline
     Lines hidden), the SAME warm dim lamp room-fill (no haze halos, no dust on PVE) —
     but here the plate holds the player's ROSTER (buildFighter xN), standing STILL and
     FACING the player in a deterministic formation (an arc up to five, two staggered
     rows beyond), and above the plate centre a trainer-LEGEND floats in a warm amber
     cloud, continuously drifting (legendPresence).

     The camera is frontal and FIXED (no orbit): an overview frame for the hall, and a
     closer work frame it glides to when a fighter is picked — the picked one steps to
     the left and stays lit, the rest sink into shadow. Roster cores are MATTE at rest;
     hover lights exactly one. All of that is driven from OUTSIDE: brightness is written
     onto the core gem / halo reached through joints.torso AFTER fighter.update(), and
     bodies are dimmed through their own per-instance skin material — buildFighter and
     buildArena are only INSTANCED, never edited.

     Discipline: dark room; the legend's warm amber cloud is the ONE glow; roster cores
     are light, not a second accent; NO pink anywhere (the FIGHT pink lives on the home,
     never here); no HP plates; no FIGHT. All tuning knobs are in the CONFIG / CAM / WORK
     / CORE_LIGHT / LEGEND blocks at the top. Respects prefers-reduced-motion + tab pause. -->
<template>
  <div ref="wrap" class="pve-scene-wrap">
    <canvas ref="canvasEl" class="pve-scene-canvas" />
    <div class="pve-scene-vignette" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { buildArena } from './buildArena.js';
import { makeRadialTexture } from './arenaTextures.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createLegendPresence } from './legendPresence.js';
import store from '@/core/state/store.js';

// ───────────────────────────── CONFIG (tune on preview) ─────────────────────────────
const CONFIG = {
  // The plate holds the player's ACTUAL roster (store module `roster`, cap 8), so
  // the number of bodies is data, not a knob. Placement is DETERMINISTIC — the
  // n-th fighter always stands in the n-th spot, so a fighter keeps his place
  // between visits.
  rowBow: 0.55,          // how much the arc ends come forward (0 = straight line)
  rowSpread: 1.15,       // gap between neighbours along the arc
  backRowLift: 2.35,     // how far BACK (−Z) the second row stands when there are 6–8
                         // (kept clear of the slab's central slit, which the bodies must not straddle)
  backRowScale: 0.86,    // and how much smaller it reads (perspective help, not a trick)
  stagger: 0.5,          // sideways offset of the back row → front gaps line up with it
};
// The hall's camera. Frontal and FIXED: no orbit, no auto-rotate — this is a
// workplace, not a viewing platform (owner's call, 24.08). Two framings only.
const CAM = {
  overview: { pos: [0, 3.15, 9.6], look: [0, 1.5, 0] },   // the whole row, head-on
  work:     { pos: [1.5, 2.5, 6.4], look: [1.1, 1.35, 0] }, // closer, shifted so the
                                                            // picked fighter sits LEFT
  moveSec: 0.55,         // how long the framing change takes (ТЗ: about half a second)
};
// Where a picked fighter stands while you work on him, and how the rest sink.
const WORK = {
  spot: [-1.35, 0, 1.5], // left of centre and a step toward the player
  moveSec: 0.5,
  dimSkin: 0.72,         // how far the others' bodies fade toward the room (0..1)
  dimGlow: 0.25,         // …and their floor pools
};
// Core brightness. At rest every core is MATTE — eight lit cores in four colours
// is a Christmas tree. Only the hovered (overview) or picked (work) core lights.
const CORE_LIGHT = {
  rest: 0.14,            // multiplier on the gem colour / halo at rest
  lerp: 7.0,             // 1/s easing toward the target (same shape as the mode plates)
};
// The legend trainer floating over the plate centre.
const LEGEND = {
  height: 2.55,        // plate-top → legend feet (it floats this high above the roster)
  driftSpeed: 0.5,     // Lissajous glide rate (never static)
  driftRadius: 0.7,    // horizontal glide half-extent
  bobAmplitude: 0.18,  // vertical bob
  hazeDensity: 90,     // warm cloud particle count
};
// Locked core palette (RAIDER = the bright tone #FFD930). The legend is amber #FFB21D —
// the single warm anchor, distinct from these cold/varied roster cores.
const CORE_PALETTE = [
  { id: 'natisk', hue: '#FF3344' }, // ONSLAUGHT
  { id: 'nalet', hue: '#FFD930' },  // RAIDER (bright)
  { id: 'skala', hue: '#2ED6B0' },  // BULWARK
  { id: 'zasada', hue: '#9461FF' }, // AMBUSH
];
const LEGEND_HUE = '#FFB21D';

// ─────────────────────────── Lamp room-fill (home recipe, own copy) ───────────────────────────
const LAMPS = {
  ceilingY: 7.3, wire: 1.6, hangLift: 1.2, shadeRadius: 0.55, shadeHeight: 0.5,
  // hangLift raises the shades/bulbs/light by this much (and shortens the visible rod
  // from below) so the fixtures sit above the fighters / out of frame. Light PARAMS
  // (colour/intensity/distance/decay) are unchanged — only the hang height moves.
  shadeColor: 0x161a24, rodColor: 0x0c0f16, rodRadius: 0.018,
  bulbRadius: 0.12, bulbColor: 0xffb368, bulbOpacity: 0.95,
  light: { color: 0xffb368, intensity: 16, distance: 18, decay: 2 },
  positions: [
    { x: -1.9, z: -0.5, drop: 0.0 },
    { x: 1.9, z: 0.5, drop: 0.7 },
    { x: 0.1, z: -1.5, drop: 0.3 },
    { x: -0.3, z: 1.4, drop: 1.0 },
  ],
  flicker: 0.05, flickerSpeed: 1.3,
};
function buildLamps(opts, reduced) {
  const group = new THREE.Group();
  const shadeGeo = new THREE.ConeGeometry(opts.shadeRadius, opts.shadeHeight, 16, 1, true);
  const bulbGeo = new THREE.SphereGeometry(opts.bulbRadius, 10, 8);
  const shadeMat = new THREE.MeshStandardMaterial({ color: opts.shadeColor, flatShading: true, roughness: 0.9, metalness: 0.2, side: THREE.DoubleSide });
  const rodMat = new THREE.MeshStandardMaterial({ color: opts.rodColor, roughness: 0.8, metalness: 0.3 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: opts.bulbColor, transparent: true, opacity: opts.bulbOpacity });
  const rodGeos = [];
  const lights = [];
  opts.positions.forEach((pos, i) => {
    const shadeTopY = opts.ceilingY - opts.wire - (pos.drop || 0) + (opts.hangLift || 0);
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(pos.x, shadeTopY - opts.shadeHeight / 2, pos.z);
    group.add(shade);
    const rodLen = Math.max(0.05, opts.ceilingY - shadeTopY); // shorter visible rod as the shade rises
    const rodGeo = new THREE.CylinderGeometry(opts.rodRadius, opts.rodRadius, rodLen, 6);
    rodGeos.push(rodGeo);
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(pos.x, shadeTopY + rodLen / 2, pos.z);
    group.add(rod);
    const bulbY = shadeTopY - opts.shadeHeight * 0.55;
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(pos.x, bulbY, pos.z);
    group.add(bulb);
    const light = new THREE.PointLight(opts.light.color, opts.light.intensity, opts.light.distance, opts.light.decay);
    light.position.set(pos.x, bulbY - 0.05, pos.z);
    group.add(light);
    lights.push({ light, base: opts.light.intensity, phase: i * 1.7 });
  });
  const tick = reduced ? null : (t) => {
    for (const l of lights) l.light.intensity = l.base * (1 - opts.flicker * 0.5 + opts.flicker * 0.5 * Math.sin(t * opts.flickerSpeed + l.phase));
  };
  const dispose = () => { shadeGeo.dispose(); bulbGeo.dispose(); shadeMat.dispose(); rodMat.dispose(); bulbMat.dispose(); rodGeos.forEach((g) => g.dispose()); };
  return { group, tick, dispose };
}

// ─────────────────────────── Ambient dust — REMOVED on PVE ───────────────────────────
// The drifting amber dust (home recipe) was dropped from this scene per design — no
// floating particles on the PVE stage. (HomeScene keeps its own dust untouched.)

// ── Per-fighter under-glow (home GLOW recipe, own copy) — tinted to THE fighter's
//    COLD core hue (NOT amber), so every member stands in a faint pool of its own
//    core light and the legend's amber stays the only warm anchor. ──
const GLOW = { radius: 1.3, opacity: 0.16, follow: 0.08, yLift: 0.02 };
function buildUnderGlow(colorHex, topY) {
  const tex = makeRadialTexture('rgba(255,255,255,0.85)', 'rgba(255,255,255,0.12)', 0.5);
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(colorHex), transparent: true, opacity: GLOW.opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(GLOW.radius * 2, GLOW.radius * 2), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = topY + GLOW.yLift;
  const follow = (pos) => {
    mesh.position.x += (pos.x - mesh.position.x) * GLOW.follow;
    mesh.position.z += (pos.z - mesh.position.z) * GLOW.follow;
  };
  const dispose = () => { mesh.geometry.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, follow, dispose };
}

// ─────────────────────────── Background depth dome (home recipe, own copy) ───────────────────────────
const BACKDROP = {
  radius: 45, centerY: 1.6, texW: 1024, texH: 1024,
  grad: [[0.0, '#060710'], [0.42, '#0a0a12'], [0.62, '#120f0c'], [1.0, '#1b150d']],
  hexCols: 60, hexRGB: '255,186,120', hexMaxAlpha: 0, hexFadeStart: 0.46, hexFadeEnd: 0.62, dither: 0, // hex weave + grain OFF — flat dark gradient (mirrors home fix 222aac4)
};
function strokeHex(ctx, cx, cy, R) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.closePath(); ctx.stroke();
}
function drawHexWeave(ctx, o) {
  const cols = o.hexCols, R = o.texW / (cols * 1.5), vStep = Math.sqrt(3) * R;
  ctx.lineWidth = Math.max(1, R * 0.05); ctx.lineJoin = 'round';
  for (let c = 0; c <= cols; c++) {
    const x = c * 1.5 * R, yOff = (c % 2) * (vStep / 2);
    for (let r = -1; r * vStep + yOff < o.texH + vStep; r++) {
      const y = r * vStep + yOff, v = 1 - y / o.texH;
      let a = 0;
      if (v > o.hexFadeStart) a = o.hexMaxAlpha * Math.min(1, (v - o.hexFadeStart) / (o.hexFadeEnd - o.hexFadeStart));
      if (a <= 0.002) continue;
      ctx.strokeStyle = `rgba(${o.hexRGB},${a.toFixed(3)})`;
      strokeHex(ctx, x, y, R);
    }
  }
}
function buildBackdrop(o, maxAniso) {
  const c = document.createElement('canvas'); c.width = o.texW; c.height = o.texH;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, o.texH);
  for (const [stop, col] of o.grad) g.addColorStop(stop, col);
  ctx.fillStyle = g; ctx.fillRect(0, 0, o.texW, o.texH);
  if (o.dither > 0) {
    const img = ctx.getImageData(0, 0, o.texW, o.texH), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const nz = (Math.random() * 2 - 1) * o.dither; d[i] += nz; d[i + 1] += nz; d[i + 2] += nz; }
    ctx.putImageData(img, 0, 0);
  }
  drawHexWeave(ctx, o);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(4, maxAniso || 1);
  const geo = new THREE.SphereGeometry(o.radius, 48, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, o.centerY, 0); mesh.renderOrder = -10;
  const dispose = () => { geo.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, dispose };
}
// Lamp-haze halos REMOVED on PVE: the floating additive amber sprites that hung
// around each shade are gone — the lamps now read as lit from inside the dish (the
// visible bulb + the PointLight), with no blurry orange blobs in the air.

// ── roster layout — DETERMINISTIC, so a fighter keeps his place between visits.
//    ≤5: one shallow arc, ends a step closer to the player.
//    6–8: two rows, the back one lifted, smaller and offset by half a gap so the
//    back bodies land in the FRONT row's gaps instead of behind its shoulders. ──
function layoutRoster(count) {
  if (count <= 0) return [];

  // One row: `t` runs −1…+1 across it, x spreads by it, and z bows by t² so the
  // ENDS stand a touch closer to the player (+Z is toward the camera) — the row
  // reads as a shallow arc facing you, not as a straight parade line.
  const row = (n, offsetX, z0, scale) => {
    const spots = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      spots.push({
        x: (t * CONFIG.rowSpread * (n - 1)) / 2 + offsetX,
        z: z0 + CONFIG.rowBow * t * t,
        scale,
      });
    }
    return spots;
  };

  if (count <= 5) return row(count, 0, 1.0, 1);

  // 6–8: split front/back, back row further away, smaller, and offset by half a
  // gap so its bodies show through the front row's gaps.
  const front = Math.ceil(count / 2);
  return [
    ...row(front, 0, 1.0, 1),
    ...row(count - front, CONFIG.stagger, 1.0 - CONFIG.backRowLift, CONFIG.backRowScale),
  ];
}

// ── Reaching INTO a fighter from outside (the sanctioned pattern — the combat
//    file itself is never edited). buildFighter exposes its joints, and the core
//    gem + halo hang on the torso, so they can be found and driven from here.
//
//    One condition, and it is the whole trick: the fighter's own update() writes
//    the halo's opacity every frame, so these brightnesses must be applied AFTER
//    fighter.update() in the same frame. The gem's COLOUR and the body material
//    are not touched per frame (only by the dev grey toggle and the death
//    dissolve, neither of which happens in this hall), so those hold on their own.
function coreParts(fighter) {
  const torso = fighter.joints && fighter.joints.torso;
  if (!torso) return null;
  let gem = null, halo = null;
  for (const o of torso.children) {
    if (!halo && o.isSprite) halo = o;
    else if (!gem && o.isMesh && o.geometry && o.geometry.type === 'OctahedronGeometry') gem = o;
  }
  if (!gem && !halo) return null;
  return { gem, halo, gemBase: gem ? gem.material.color.clone() : null };
}

// The body material: one MeshStandardMaterial per fighter (buildFighter makes it
// per call), shared by all of THAT body's boxes — exactly the handle needed to
// sink one fighter into the dark without touching the others.
function skinOf(fighter) {
  let mat = null;
  fighter.group.traverse((o) => {
    if (!mat && o.isMesh && o.material && o.material.isMeshStandardMaterial) mat = o.material;
  });
  return mat ? { mat, base: mat.color.clone() } : null;
}

// Set (or ease toward) one of the two framings. `snap` places the camera at once
// — used on build and whenever motion is reduced.
function applyCamera(frame, snap) {
  camPosTo.set(frame.pos[0], frame.pos[1], frame.pos[2]);
  camLookTo.set(frame.look[0], frame.look[1], frame.look[2]);
  if (snap) {
    camPos.copy(camPosTo); camLook.copy(camLookTo);
    if (camera) { camera.position.copy(camPos); camera.lookAt(camLook); }
  }
}

// Rest → lit for one body's core, and normal → sunk into the dark for its skin.
// Called every frame AFTER fighter.update() (see coreParts).
const _lightC = new THREE.Color();
function applyFighterLight(r) {
  const glow = CORE_LIGHT.rest + (1 - CORE_LIGHT.rest) * r.lit;
  if (r.parts) {
    if (r.parts.gem && r.parts.gemBase) {
      r.parts.gem.material.color.copy(r.parts.gemBase).multiplyScalar(glow);
    }
    if (r.parts.halo) r.parts.halo.material.opacity *= glow;
  }
  if (r.skin) {
    r.skin.mat.color.copy(r.skin.base).lerp(_lightC.setHex(0x0b0d14), WORK.dimSkin * r.dim);
  }
  if (r.glow && r.glow.mesh && r.glow.mesh.material) {
    const m = r.glow.mesh.material;
    if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
    m.opacity = m.userData.baseOpacity * (1 - (1 - WORK.dimGlow) * r.dim) * (0.55 + 0.45 * r.lit);
  }
}

const _target = new THREE.Vector3();

// Point a body at (x, z). The model faces −Z at rotation 0 (see buildFighter).
function faceTowards(group, x, z) {
  group.rotation.y = Math.atan2(-(x - group.position.x), -(z - group.position.z));
}

// ─────────────────────────────────── scene plumbing ───────────────────────────────────
// hover  — a body is under the pointer (or was just tapped): { id, callsign, x, y }, or null
// pick   — this fighter was chosen
// exit   — a tap landed on empty space while a fighter was picked
const emit = defineEmits(['hover', 'pick', 'exit']);

const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, arena, resizeObserver, clock;
// Pre-load readiness: emit once after the first frame is rendered so the
// bootstrap splash (page-load) and the SPA transition cover can lift on real
// pve-scene readiness. Per-mount (script-setup local) so it re-fires on every
// fresh mount, not just the first of the session.
let firstFrameEmitted = false;
let onVisibility;
let onPointerMove = null, onPointerDown = null, onPointerUp = null;
let hoveredId = null;        // whose core is lit in the overview
let selectedId = null;       // whose card + tree are open (null = overview)
const camPos = new THREE.Vector3();      // where the camera IS
const camLook = new THREE.Vector3();     // and what it looks at
const camPosTo = new THREE.Vector3();    // where it is going
const camLookTo = new THREE.Vector3();
let prevT = 0;
let reduced = false;
let lamps = null, backdrop = null;
let legend = null, legendPresence = null;
// [{ id, callsign, fighter, glow, home, scale, parts, skin, lit, dim }]
const roster = [];

const CAM_BASE = new THREE.Vector3(5.4, 6.1, 8.4);

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

onMounted(() => {
  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const targetFPS = coarse ? 30 : 60;

  renderer = new THREE.WebGLRenderer({ canvas: canvasEl.value, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const maxDPR = lowPowerDevice() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070811, 0.03);

  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.copy(CAM_BASE);

  // Lighting — same recipe as the arena/home (one warm key + cool fill).
  const key = new THREE.DirectionalLight(0xfff2e8, 2.3);
  key.position.set(4, 10, 6);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x2a3550, 0.5));
  scene.add(new THREE.HemisphereLight(0x44506e, 0x05060c, 0.4));

  const pink = getComputedStyle(el).getPropertyValue('--hex-primary').trim() || '#FF0069';

  // --- Slab: instance buildArena UNMODIFIED, then suppress the combat rift exactly
  //     as the home does (external only): zero the rift-glow opacities, hide the
  //     sparks, never build arenaPresence, and hide the bright slab-outline Lines. ---
  arena = buildArena(renderer.capabilities.getMaxAnisotropy(), pink);
  arena.refs.riftGlow.forEach((r) => { r.mat.opacity = 0; });
  arena.refs.sparks.points.visible = false;
  arena.group.traverse((o) => { if (o.isLine) o.visible = false; });
  scene.add(arena.group);
  const topY = arena.refs.topY;

  // Dark seam-filler over the torn slit so the slab reads as one calm platform.
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(arena.refs.W + 0.2, 1.3), new THREE.MeshBasicMaterial({ color: 0x0c1018 }));
  seam.rotation.x = -Math.PI / 2;
  seam.position.set(0, topY - 0.06, 0);
  scene.add(seam);

  // Atmosphere / depth — warm dim lamp room-fill + a background dome (warm/dark FILL,
  // no pink, no new accent). PVE drops the home's lamp-haze halos and drifting dust.
  lamps = buildLamps(LAMPS, reduced); scene.add(lamps.group);
  backdrop = buildBackdrop(BACKDROP, renderer.capabilities.getMaxAnisotropy()); scene.add(backdrop.mesh);

  // --- Roster: the player's OWN fighters, one body each, standing in a row and
  //     FACING THE PLAYER. They do not walk: this is a hall, not a yard, so the
  //     wander director is gone and the bodies just live on the spot (breath,
  //     weight shifts — what buildFighter already does on its own).
  //     The record carries only a core id; the hue comes from this scene's own
  //     palette (RAIDER brightened for this dark room), so the hall's look is
  //     unchanged. Read once at build time — the roster is edited in the shop,
  //     on another route, so arriving here always rebuilds the scene. ---
  const members = store.getters['roster/fighters'] || [];
  const spots = layoutRoster(members.length);
  spots.forEach((p, i) => {
    const m = members[i];
    const core = CORE_PALETTE.find((c) => c.id === m.core) || CORE_PALETTE[0];
    const behavior = resolveBehavior(core.id, []);

    const fighter = buildFighter(core.hue, {
      side: 'player',
      coreId: core.id,
      behavior,
      bounds: { x: arena.refs.W / 2 - 0.35, z: arena.refs.totalDepth / 2 - 0.3 },
      neutralColor: false,
      getFoePos: () => null,           // nobody to walk toward: they stand
    });
    fighter.group.position.set(p.x, topY, p.z);
    fighter.group.scale.setScalar(p.scale);
    fighter.setReducedMotion(reduced);
    // SUPPRESS the over-head HP plate (the only Sprite added DIRECTLY to the
    // group) — same external approach as the home.
    fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
    scene.add(fighter.group);

    const glow = buildUnderGlow(core.hue, topY);
    glow.mesh.position.set(p.x, topY + GLOW.yLift, p.z);
    scene.add(glow.mesh);

    roster.push({
      id: m.id,
      callsign: m.callsign,
      fighter,
      glow,
      home: new THREE.Vector3(p.x, topY, p.z),
      scale: p.scale,
      parts: coreParts(fighter),       // gem + halo, for the rest/lit brightness
      skin: skinOf(fighter),           // this body's own material (per-instance)
      lit: 0,                          // eased 0…1 core brightness
      dim: 0,                          // eased 0…1 "sunk into the dark"
    });
  });
  // Everyone faces the player. Aim at the overview camera spot rather than
  // straight ahead, so the arc ends turn slightly inward and the row reads as
  // gathered rather than as a firing line.
  for (const r of roster) faceTowards(r.fighter.group, CAM.overview.pos[0], CAM.overview.pos[2]);

  // --- Legend: a buildFighter body with the amber core, idle only (NEVER added to
  //     the wander), floating LEGEND.height over the plate centre, drifting forever
  //     inside its warm cloud (legendPresence). ---
  const legendBehavior = resolveBehavior(null, []);
  legend = buildFighter(LEGEND_HUE, { side: 'player', coreId: null, behavior: legendBehavior, bounds: { x: 1, z: 1 }, neutralColor: false, getFoePos: () => null });
  legend.setReducedMotion(reduced);
  legend.group.children.forEach((o) => { if (o.isSprite) o.visible = false; }); // no HP plate
  scene.add(legend.group);
  legendPresence = createLegendPresence({
    baseX: 0, baseZ: 0, floorY: topY,
    driftSpeed: LEGEND.driftSpeed, driftRadius: LEGEND.driftRadius,
    bobAmplitude: LEGEND.bobAmplitude, hazeDensity: LEGEND.hazeDensity,
    ORBIT: { highAboveTop: LEGEND.height }, // feet height at the high/centre phase = LEGEND.height
    reduced,
  });
  legend.group.position.copy(legendPresence.position);
  scene.add(legendPresence.group);
  scene.add(legendPresence.trail); // world-space descent smoke wisps

  // --- Camera: FIXED and frontal. No orbit, no auto-rotate (owner's call): the
  //     hall is a workplace. Two framings — the whole row, and closer-in with the
  //     picked fighter on the left — eased toward, never cut to. ---
  applyCamera(CAM.overview, true);

  // --- Pointer: hover lights ONE core and names it; a tap picks that fighter.
  //     Same shape as the mode islands (one hovered at a time, eased `lit`), but
  //     the light lives on the fighter, so it is driven in the loop below. ---
  const _ray = new THREE.Raycaster();
  const _ptr = new THREE.Vector2();
  let downAt = null;

  function pickAt(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    _ptr.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _ptr.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    _ray.setFromCamera(_ptr, camera);
    const hit = _ray.intersectObjects(roster.map((r) => r.fighter.group), true)[0];
    if (!hit) return null;
    let o = hit.object;
    while (o && !roster.some((r) => r.fighter.group === o)) o = o.parent;
    return o ? roster.find((r) => r.fighter.group === o) : null;
  }

  // Screen position of a body's head — where its callsign hangs.
  const _v = new THREE.Vector3();
  function tagPos(entry) {
    const rect = renderer.domElement.getBoundingClientRect();
    _v.copy(entry.fighter.group.position);
    _v.y += 2.0 * entry.scale;
    _v.project(camera);
    return { x: rect.left + (_v.x * 0.5 + 0.5) * rect.width, y: rect.top + (-_v.y * 0.5 + 0.5) * rect.height };
  }

  function emitHover(entry) {
    hoveredId = entry ? entry.id : null;
    if (!entry) { emit('hover', null); return; }
    const p = tagPos(entry);
    emit('hover', { id: entry.id, callsign: entry.callsign, x: p.x, y: p.y });
  }

  onPointerMove = (e) => {
    if (selectedId || e.pointerType === 'touch') return;   // no hover while working / on touch
    emitHover(pickAt(e.clientX, e.clientY));
  };
  onPointerDown = (e) => { downAt = { x: e.clientX, y: e.clientY, entry: pickAt(e.clientX, e.clientY) }; };
  onPointerUp = (e) => {
    const d = downAt; downAt = null;
    if (!d) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;   // a drag, not a tap
    if (d.entry) {
      // Touch has no hover, so light the core for a beat BEFORE the framing
      // changes — the finger has to see what it hit.
      emitHover(d.entry);
      emit('pick', d.entry.id);
    } else if (selectedId) {
      emit('exit');                                                  // tap on empty space
    }
  };
  const canvas = renderer.domElement;
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  // --- Render loop. FPS-capped; elapsed time drives wander + idle + drift. ---
  clock = new THREE.Clock();
  prevT = 0;
  const interval = 1000 / targetFPS;
  let lastFrame = 0;
  const _camDir = new THREE.Vector3();
  const loop = (time) => {
    // While a fighter's card and tree are open, the hall is a backdrop: one body
    // idling behind two opaque panels. Half the frames are plenty there, and the
    // panels are what actually costs on a phone.
    const iv = selectedId ? Math.max(interval, 1000 / 30) : interval;
    if (time - lastFrame < iv) return;
    lastFrame = time;
    const t = clock.getElapsedTime();
    const dt = t - prevT;
    prevT = t;

    // Camera eases toward the current framing (snap when motion is reduced).
    const camK = reduced ? 1 : 1 - Math.exp(-(1 / (CAM.moveSec * 0.36)) * Math.min(0.05, dt));
    camPos.lerp(camPosTo, camK);
    camLook.lerp(camLookTo, camK);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    const bodyK = reduced ? 1 : 1 - Math.exp(-(1 / (WORK.moveSec * 0.36)) * Math.min(0.05, dt));
    const glowK = reduced ? 1 : 1 - Math.exp(-CORE_LIGHT.lerp * Math.min(0.05, dt));

    for (const r of roster) {
      // Where this body belongs right now: its place in the row, or the work spot.
      const picked = r.id === selectedId;
      _target.copy(r.home);
      if (picked) _target.set(WORK.spot[0], r.home.y, WORK.spot[2]);
      r.fighter.group.position.lerp(_target, bodyK);

      r.fighter.update(t, camera);
      r.glow.follow(r.fighter.group.position);

      // …and only NOW the brightnesses, because update() rewrites the halo.
      const litTarget = selectedId ? (picked ? 1 : 0) : (r.id === hoveredId ? 1 : 0);
      const dimTarget = selectedId && !picked ? 1 : 0;
      r.lit += (litTarget - r.lit) * glowK;
      r.dim += (dimTarget - r.dim) * bodyK;
      applyFighterLight(r);
    }

    // Legend: idle body, ride the drift, and slowly face the camera (presiding).
    legend?.update(t, camera);
    if (legendPresence) {
      legendPresence.tick(t, dt);
      legend.group.position.copy(legendPresence.position);
      if (!reduced) {
        _camDir.set(camera.position.x - legend.group.position.x, 0, camera.position.z - legend.group.position.z);
        const desired = Math.atan2(-_camDir.x, -_camDir.z);
        let d = (desired - legend.group.rotation.y) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
        legend.group.rotation.y += d * (1 - Math.exp(-1.5 * Math.min(0.05, dt)));
      }
    }

    lamps?.tick?.(t);

    renderer.render(scene, camera);

    // First frame is on screen — signal readiness once (latch + event) so the
    // pre-load splash / SPA transition cover lift on real pve-scene readiness.
    if (!firstFrameEmitted) {
      firstFrameEmitted = true;
      window.__hexPveReady = true;
      window.dispatchEvent(new Event('hexlash:pve-ready'));
    }
  };
  renderer.setAnimationLoop(loop);

  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else renderer.setAnimationLoop(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  });
  resizeObserver.observe(el);
});

// ── What the hall drives from outside ──────────────────────────────────────
// select(id) — frame in on this fighter (unknown id → back to the overview, which
//              is what happens if he was deleted in another tab while open).
// exitWork()  — back to the row.
function select(id) {
  const entry = roster.find((r) => r.id === id);
  if (!entry) { exitWork(); return; }
  selectedId = id;
  hoveredId = null;
  applyCamera(CAM.work, reduced);
  faceTowards(entry.fighter.group, CAM.work.pos[0], CAM.work.pos[2]);
}
function exitWork() {
  const prev = roster.find((r) => r.id === selectedId);
  selectedId = null;
  applyCamera(CAM.overview, reduced);
  if (prev) faceTowards(prev.fighter.group, CAM.overview.pos[0], CAM.overview.pos[2]);
}
defineExpose({ select, exitWork });

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (renderer) renderer.setAnimationLoop(null);
  if (renderer) {
    const c = renderer.domElement;
    if (onPointerMove) c.removeEventListener('pointermove', onPointerMove);
    if (onPointerDown) c.removeEventListener('pointerdown', onPointerDown);
    if (onPointerUp) c.removeEventListener('pointerup', onPointerUp);
  }
  for (const r of roster) {
    if (r.glow) { scene.remove(r.glow.mesh); r.glow.dispose(); }
    if (r.fighter) r.fighter.dispose();
  }
  roster.length = 0;
  if (legendPresence) { scene.remove(legendPresence.group); scene.remove(legendPresence.trail); legendPresence.dispose(); }
  if (legend) legend.dispose();
  if (lamps) { scene.remove(lamps.group); lamps.dispose(); }
  if (backdrop) { scene.remove(backdrop.mesh); backdrop.dispose(); }
  if (arena) arena.dispose();
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.pve-scene-wrap {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 44%, #0d0f1c 0%, #07080f 55%, #030308 100%);
}
.pve-scene-canvas { display: block; width: 100%; height: 100%; }
.pve-scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 78% 78% at 50% 50%, transparent 56%, rgba(3, 3, 8, 0.55) 100%);
}
</style>
