<!-- SpaceScene — the "Space" 3D preview stage (visual only: no combat, no server,
     no match). A self-contained sibling of PveScene.vue (which it copies the RECIPE
     from and never reuses by a flag / never edits): the SAME family arena hex
     material + flat-dark backdrop dome + RTS camera rig + first-frame ready signal —
     but here the floor is ONE uniform HEX FIELD from edge to edge (no central arena
     plate, no lamp fixtures; a soft diffuse fill lights it evenly),
     a ROSTER of 14 club fighters roams the whole field on their own footwork
     (spaceWander), and ONE of them is marked as the LEADER by the scene's single
     glow — a pink beacon (--hex-primary).

     Discipline: calm dark room; each body glows ITS core colour as intrinsic
     light/rim (buildFighter); the LEADER's pink beacon is the ONE glow / the ONE
     pink on the screen; no HP plates; no FIGHT. All tuning knobs are in the CONFIG
     blocks at the top. Respects prefers-reduced-motion + tab pause. buildFighter /
     presence helpers / textures are only INSTANCED / CALLED, never edited. -->
<template>
  <div ref="wrap" class="space-scene-wrap">
    <canvas ref="canvasEl" class="space-scene-canvas" />
    <div class="space-scene-vignette" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeRadialTexture, makeHexGridTexture } from './arenaTextures.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createSpaceWanderDirector } from './spaceWander.js';

// ───────────────────────────── CONFIG (tune on preview) ─────────────────────────────
// The big hex field — a large flat arena that reads as "огромная арена", not a bigger
// plate. Base tone + hex lattice are the arena family; it fades into fog / the dome.
const FIELD = {
  size: 46,          // side length of the hex field plane (units) — far bigger than the slab
  repeat: 18,        // hex-texture tiling across the field (lattice density)
  baseColor: 0x0d1120,  // dark blue-grey floor (arena family)
  lineOpacity: 0.5,  // hex lattice line strength
  y: 0.5,            // field SURFACE height — the ground the fighters/leader stand on
};
// Roster placement across the field (spread wide, apart, off the very centre).
const CONFIG = {
  rosterCount: 14,      // SPACE_ROSTER_COUNT — fighters on the field (range 12–16)
  roamHalf: 15,         // fighters roam within ±this of centre (walkable field half-extent)
  spawnRadiusMax: 13,   // spawn annulus outer radius
  spawnRadiusMin: 3.4,  // spawn annulus inner radius → nobody starts on the dead centre
  minSeparation: 2.6,   // min XZ distance between any two members on placement
  zoneHalf: 6.6,        // personal wander-rect half-extent — BIG + overlapping → range wide
};
// The LEADER beacon — the scene's single glow, pink (--hex-primary). Marks member 0.
const LEADER = {
  index: 0,             // deterministic — no leader swap in a preview
  discRadius: 2.0,      // pink pool under the leader's feet
  discOpacity: 0.5,
  columnRadius: 0.7,    // soft light column rising from the leader
  columnHeight: 4.4,
  columnOpacity: 0.11,
  followLerp: 0.09,     // marker eases toward the roving leader
  pulse: 0.16,          // gentle opacity breathing (reduced-motion → off)
  pulseSpeed: 1.3,
};
// Camera — free orbit like PVE/Home, but pulled back + a touch higher so the whole
// field reads. (CAM_BASE distance + zoom corridor here.)
// RTS observer camera: the tilt is FIXED (no rotation, no looking under the field);
// LMB-drag / one-finger swipe PANS the field, wheel / pinch DOLLIES within a corridor,
// and the pan target is clamped to the field bounds so it never drifts into the void.
const CAM = {
  fov: 44,
  tiltDeg: 58,       // fixed camera tilt from vertical (polar angle) — over-the-shoulder overview
  headingDeg: 30,    // fixed azimuth (which side the observer sits) — never changes (rotation off)
  dist: 34,          // initial dolly distance (inside the zoom corridor) — starts near "whole field"
  zoomMin: 12,       // dolly-in limit — close enough to read individual fighters
  zoomMax: 46,       // dolly-out limit — whole field in view
  targetLift: 1.0,   // pan-plane height above the field top (target.y is held here)
  panMargin: 3,      // target may pan this far past the field half-extent (small overshoot)
  damping: 0.08,
};
// Locked core palette (task snapshot): ONSLAUGHT / RAIDER / BULWARK / AMBUSH. These
// live on the BODIES as core light/rim (buildFighter) — never a second accent glow.
const CORE_PALETTE = [
  { id: 'natisk', hue: '#FF3344' }, // ONSLAUGHT
  { id: 'nalet', hue: '#FFA526' },  // RAIDER
  { id: 'skala', hue: '#2ED6B0' },  // BULWARK
  { id: 'zasada', hue: '#9461FF' }, // AMBUSH
];

// ─────────────────────────── Lighting — soft diffuse fill (no lamp fixtures) ───────────────────────────
// The hanging lamp meshes AND their point lights are gone. The field is lit evenly by
// a warm key + a warm hemisphere + ambient, tuned so it reads across its WHOLE area
// (no dark edges, no bright central pool) and never darkens vs the old lamp lighting.
// Warm dim tone (the old lamp family), no shadows (mobile). Created inline in onMounted.
const LIGHT = {
  key:  { color: 0xfff2e8, intensity: 2.6, pos: [4, 16, 6] }, // gentle warm key for a little volume — no shadows
  hemi: { sky: 0x7a6650, ground: 0x0c0e16, intensity: 1.25 }, // warm sky / dark ground — even spread (was the lamp warmth)
  amb:  { color: 0x463f3a, intensity: 0.9 },                  // warm-neutral ambient floor fill
};

// ─────────────────────────── The uniform hex field (own build, arena tone) ───────────────────────────
// A dark base plane + a tiled hex-lattice overlay (makeHexGridTexture, the same
// generator the arena plate uses) — ONE solid grid across the whole area (centre
// included: no plate, no hole). Fog + the dome carry it into the distance.
function buildHexField(groundY, maxAniso) {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: FIELD.baseColor, roughness: 0.95, metalness: 0.1 });
  const base = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.size, FIELD.size), baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = groundY - 0.04;
  group.add(base);

  const hexTex = makeHexGridTexture(maxAniso);
  hexTex.repeat.set(FIELD.repeat, FIELD.repeat);
  const lineMat = new THREE.MeshBasicMaterial({ map: hexTex, transparent: true, opacity: FIELD.lineOpacity, depthWrite: false });
  const lines = new THREE.Mesh(new THREE.PlaneGeometry(FIELD.size, FIELD.size), lineMat);
  lines.rotation.x = -Math.PI / 2;
  lines.position.y = groundY - 0.02;
  group.add(lines);

  const dispose = () => { baseMat.dispose(); base.geometry.dispose(); lineMat.dispose(); lines.geometry.dispose(); hexTex.dispose(); };
  return { group, dispose };
}

// ─────────────────────────── Background depth dome (PVE recipe, own copy) ───────────────────────────
// Flat dark gradient (hex weave + grain OFF), sized to surround the whole field.
const BACKDROP = {
  radius: 72, centerY: 6, texW: 1024, texH: 1024,
  grad: [[0.0, '#060710'], [0.42, '#0a0a12'], [0.62, '#120f0c'], [1.0, '#1b150d']],
};
function buildBackdrop(o) {
  const c = document.createElement('canvas'); c.width = o.texW; c.height = o.texH;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, o.texH);
  for (const [stop, col] of o.grad) g.addColorStop(stop, col);
  ctx.fillStyle = g; ctx.fillRect(0, 0, o.texW, o.texH);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(o.radius, 48, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, o.centerY, 0); mesh.renderOrder = -10;
  const dispose = () => { geo.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, dispose };
}

// ─────────────────────────── Leader beacon — the scene's SINGLE glow (pink) ───────────────────────────
// A pink pool disc under the feet + a soft rising light column, both additive, both
// riding the roving leader. This is the ONE glow / the ONE pink on the screen; every
// other body carries only its own core light/rim (no added glow). Presence-effect
// family (discs / additive shafts), built here — the shared presence helpers are only
// referenced as a technique, never edited.
function buildLeaderMarker(pinkHex, groundY) {
  const group = new THREE.Group();
  const color = new THREE.Color(pinkHex);

  const discTex = makeRadialTexture('rgba(255,255,255,0.92)', 'rgba(255,255,255,0.12)', 0.5);
  const discMat = new THREE.MeshBasicMaterial({ map: discTex, color, transparent: true, opacity: LEADER.discOpacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(LEADER.discRadius * 2, LEADER.discRadius * 2), discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = groundY + 0.03;
  group.add(disc);

  // soft light column: an open cone, wide at the feet, tapering up — additive, low
  // opacity, fog off. Reads as a beacon of light standing on the leader.
  const colGeo = new THREE.ConeGeometry(LEADER.columnRadius, LEADER.columnHeight, 24, 1, true);
  const colMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: LEADER.columnOpacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const column = new THREE.Mesh(colGeo, colMat);
  column.position.y = groundY + LEADER.columnHeight / 2;
  group.add(column);

  const follow = (pos) => {
    group.position.x += (pos.x - group.position.x) * LEADER.followLerp;
    group.position.z += (pos.z - group.position.z) * LEADER.followLerp;
  };
  const tick = (t, reduced) => {
    const k = reduced ? 1 : 1 + LEADER.pulse * Math.sin(t * LEADER.pulseSpeed);
    discMat.opacity = LEADER.discOpacity * k;
    colMat.opacity = LEADER.columnOpacity * k;
  };
  const dispose = () => { disc.geometry.dispose(); discMat.dispose(); discTex.dispose(); colGeo.dispose(); colMat.dispose(); };
  return { group, follow, tick, dispose };
}

// ── roster placement: rejection-sample N spawns in an annulus (off the dead centre),
//    each ≥ minSeparation apart. Relaxed top-up if the strict pass falls short. ──
function placeRoster() {
  const pts = [];
  let tries = 0;
  while (pts.length < CONFIG.rosterCount && tries < 900) {
    tries++;
    const a = Math.random() * Math.PI * 2;
    const r = CONFIG.spawnRadiusMin + Math.random() * (CONFIG.spawnRadiusMax - CONFIG.spawnRadiusMin);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (pts.some((p) => Math.hypot(p.x - x, p.z - z) < CONFIG.minSeparation)) continue;
    pts.push({ x, z });
  }
  while (pts.length < CONFIG.rosterCount) {
    const a = (pts.length / CONFIG.rosterCount) * Math.PI * 2;
    const r = CONFIG.spawnRadiusMin + Math.random() * (CONFIG.spawnRadiusMax - CONFIG.spawnRadiusMin);
    pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
  }
  return pts;
}

// ─────────────────────────────────── scene plumbing ───────────────────────────────────
const wrap = ref(null);
const canvasEl = ref(null);

let renderer, scene, camera, controls, resizeObserver, clock;
// Pre-load readiness: emit once after the first frame renders so the bootstrap
// splash + the SPA transition cover lift on real space-scene readiness. Per-mount
// (script-setup local) so it re-fires on every fresh mount.
let firstFrameEmitted = false;
let onVisibility;
let director = null;
let prevT = 0;
let reduced = false;
let backdrop = null, field = null, leaderMarker = null;
let panTargetY = 0; // held pan-plane height for the RTS camera target
const roster = []; // [{ fighter }]

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
  scene.fog = new THREE.FogExp2(0x070811, 0.019); // lighter than PVE → the big field reads, edges fade

  camera = new THREE.PerspectiveCamera(CAM.fov, w / h, 0.1, 200);
  // camera.position is set with the controls below, at a FIXED RTS offset from the
  // pan target (fixed tilt + heading + initial distance).

  // Lighting — soft diffuse fill (no lamp fixtures): warm key + warm hemisphere +
  // ambient, tuned so the field stays as bright as before across its WHOLE area.
  const key = new THREE.DirectionalLight(LIGHT.key.color, LIGHT.key.intensity);
  key.position.set(LIGHT.key.pos[0], LIGHT.key.pos[1], LIGHT.key.pos[2]);
  scene.add(key);
  scene.add(new THREE.AmbientLight(LIGHT.amb.color, LIGHT.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHT.hemi.sky, LIGHT.hemi.ground, LIGHT.hemi.intensity));

  const pink = getComputedStyle(el).getPropertyValue('--hex-primary').trim() || '#FF0069';

  // --- The floor is ONE uniform hex field from edge to edge — no central arena plate,
  //     no seam. The fighters + leader stand on it; its surface height is FIELD.y. ---
  const groundY = FIELD.y;
  field = buildHexField(groundY, renderer.capabilities.getMaxAnisotropy()); scene.add(field.group);
  backdrop = buildBackdrop(BACKDROP); scene.add(backdrop.mesh);

  // --- Roster: 14 fighters, core colour cycled, spread across the whole field.
  //     Each idles + walks via the spaceWander director on a BIG personal zone. ---
  const pts = placeRoster();
  const agents = []; // { fighter, zone } for the director
  pts.forEach((p, i) => {
    const core = CORE_PALETTE[i % CORE_PALETTE.length];
    const behavior = resolveBehavior(core.id, []);
    if (behavior && behavior.axes) behavior.axes.distance = 18; // small range → always WALKS to the lure

    // personal wander rect — big + overlapping (range wide), clamped to the field
    const zone = {
      xMin: THREE.MathUtils.clamp(p.x - CONFIG.zoneHalf, -CONFIG.roamHalf, CONFIG.roamHalf),
      xMax: THREE.MathUtils.clamp(p.x + CONFIG.zoneHalf, -CONFIG.roamHalf, CONFIG.roamHalf),
      zMin: THREE.MathUtils.clamp(p.z - CONFIG.zoneHalf, -CONFIG.roamHalf, CONFIG.roamHalf),
      zMax: THREE.MathUtils.clamp(p.z + CONFIG.zoneHalf, -CONFIG.roamHalf, CONFIG.roamHalf),
    };

    const idx = i; // capture for the per-agent getFoePos closure
    const fighter = buildFighter(core.hue, {
      side: 'player',
      coreId: core.id,
      behavior,
      bounds: { x: CONFIG.roamHalf, z: CONFIG.roamHalf },
      neutralColor: false, // keep the core colour on the body (light/rim)
      getFoePos: () => director.foePos(idx),
    });
    fighter.group.position.set(p.x, groundY, p.z);
    fighter.group.rotation.y = Math.atan2(p.x, p.z); // face the field centre initially
    fighter.setReducedMotion(reduced);
    // SUPPRESS the over-head HP plate (the only Sprite added DIRECTLY to the group),
    // same external approach as PVE/Home — no HP plates in this preview.
    fighter.group.children.forEach((o) => { if (o.isSprite) o.visible = false; });
    scene.add(fighter.group);

    roster.push({ fighter });
    agents.push({ fighter, zone });
  });

  // Roster wander — drives the EXISTING locomotion per member (see spaceWander.js).
  director = createSpaceWanderDirector();
  director.attach(agents, camera, { reduced });

  // --- Leader beacon: mark member LEADER.index with the scene's single pink glow. ---
  const leader = roster[LEADER.index]?.fighter || null;
  if (leader) {
    leaderMarker = buildLeaderMarker(pink, groundY);
    leaderMarker.group.position.set(leader.group.position.x, 0, leader.group.position.z);
    scene.add(leaderMarker.group);
  }

  // --- Orbit around the FIELD CENTRE (stable pivot — never follows anyone). Pulled
  //     back + a touch higher so the whole field reads. ---
  // --- RTS observer camera: pan the field (no rotation), dolly within a corridor,
  //     tilt locked. The camera sits at a FIXED spherical offset from the target
  //     (fixed tilt + heading); panning slides the target across the ground plane,
  //     dolly moves along the view ray so the tilt is preserved automatically. ---
  const camPhi = THREE.MathUtils.degToRad(CAM.tiltDeg);   // polar angle from +Y (the fixed tilt)
  const camTheta = THREE.MathUtils.degToRad(CAM.headingDeg);
  panTargetY = groundY + CAM.targetLift;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, panTargetY, 0);
  // place the camera at the fixed overview offset (heading/tilt/initial distance)
  const camOffset = new THREE.Vector3().setFromSphericalCoords(CAM.dist, camPhi, camTheta);
  camera.position.copy(controls.target).add(camOffset);

  controls.enableDamping = true;
  controls.dampingFactor = CAM.damping;
  controls.enableRotate = false;                 // no orbit around the point
  controls.enablePan = true;                     // drag pans the field instead
  controls.screenSpacePanning = false;           // pan along the ground plane (not the screen plane)
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.9;
  controls.minDistance = CAM.zoomMin;
  controls.maxDistance = CAM.zoomMax;
  // lock the tilt as insurance — even though rotation is off, pin polar min=max so the
  // angle can never be nudged (no looking under the field).
  controls.minPolarAngle = camPhi;
  controls.maxPolarAngle = camPhi;
  // LMB / one-finger = PAN; wheel / middle / two-finger = DOLLY (pinch also pans).
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.update();

  // Pan clamp — OrbitControls has no built-in pan bounds, so pin the target into a
  // rectangle sized by the field (half-extent + margin). We shift the CAMERA by the
  // same correction so the fixed offset (tilt + distance) is preserved, and hold
  // target.y on the pan plane. Called each frame after controls.update().
  const panBound = FIELD.size / 2 + CAM.panMargin;
  const clampPan = () => {
    const tx = THREE.MathUtils.clamp(controls.target.x, -panBound, panBound);
    const tz = THREE.MathUtils.clamp(controls.target.z, -panBound, panBound);
    if (tx !== controls.target.x) { camera.position.x += tx - controls.target.x; controls.target.x = tx; }
    if (tz !== controls.target.z) { camera.position.z += tz - controls.target.z; controls.target.z = tz; }
    if (controls.target.y !== panTargetY) { camera.position.y += panTargetY - controls.target.y; controls.target.y = panTargetY; }
  };

  // --- Render loop. FPS-capped; elapsed time drives wander + idle + beacon. ---
  clock = new THREE.Clock();
  prevT = 0;
  const interval = 1000 / targetFPS;
  let lastFrame = 0;
  const loop = (time) => {
    if (time - lastFrame < interval) return;
    lastFrame = time;
    const t = clock.getElapsedTime();
    const dt = t - prevT;
    prevT = t;

    controls.update();
    clampPan(); // keep the pan target inside the field (OrbitControls has no pan bounds)
    if (!reduced) director?.update(t, dt);
    for (const r of roster) r.fighter.update(t, camera);

    // Leader beacon rides the roving leader + gently breathes.
    if (leaderMarker && leader) {
      leaderMarker.follow(leader.group.position);
      leaderMarker.tick(t, reduced);
    }

    renderer.render(scene, camera);

    // First frame is on screen — signal readiness once (latch + event) so the
    // pre-load splash / SPA transition cover lift on real space-scene readiness.
    if (!firstFrameEmitted) {
      firstFrameEmitted = true;
      window.__hexSpaceReady = true;
      window.dispatchEvent(new Event('hexlash:space-ready'));
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

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  if (renderer) renderer.setAnimationLoop(null);
  if (director) director.dispose();
  if (controls) controls.dispose();
  if (leaderMarker) { scene.remove(leaderMarker.group); leaderMarker.dispose(); }
  for (const r of roster) { if (r.fighter) r.fighter.dispose(); }
  roster.length = 0;
  if (field) { scene.remove(field.group); field.dispose(); }
  if (backdrop) { scene.remove(backdrop.mesh); backdrop.dispose(); }
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.space-scene-wrap {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 44%, #0d0f1c 0%, #07080f 55%, #030308 100%);
}
.space-scene-canvas { display: block; width: 100%; height: 100%; }
.space-scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 80% 80% at 50% 50%, transparent 54%, rgba(3, 3, 8, 0.6) 100%);
}
</style>
