<!-- SpaceScene — the "Space" 3D preview stage (visual only: no combat, no server,
     no match). A self-contained sibling of PveScene.vue (which it copies the RECIPE
     from and never reuses by a flag / never edits): the SAME family arena hex
     material + flat-dark backdrop dome + RTS camera rig + first-frame ready signal —
     but here the floor is ONE uniform HEX FIELD from edge to edge (no central arena
     plate, no lamp fixtures; a soft diffuse fill lights it evenly),
     a ROSTER of 14 club fighters roams the whole field on their own footwork
     (spaceWander), and ONE of them is marked as the LEADER by the scene's single
     glow — a pink beacon (--pink).

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
import { buildBackdrop } from './hallBackdrop.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeRadialTexture, makeHexGridTexture } from './arenaTextures.js';
import { buildFighter } from './buildFighter.js';
import { resolveBehavior } from '@/data/behavior.js';
import { createSpaceWanderDirector } from './spaceWander.js';
import { beginSceneLoad } from '@/services/sceneLoading.js';
import { CORE_HUE, FOG_COLOR, FOG, FOV, CAMERA, leaderHue } from '@/data/sceneTokens.js';

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
// The LEADER beacon — the scene's single glow, pink (--pink). Marks member 0.
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
// Camera — free orbit around the field (rotate / dolly / pan) with a soft AUTO-RETURN
// to a fixed HOME framing after the input goes idle. HOME = the initial view: the
// spherical offset (tiltDeg / headingDeg / dist) from the field-centre target. Polar
// clamps keep it from flipping over the top or dipping under the field; the pan is
// still clamped to the field bounds (clampPan).
const CAM = {
  fov: 44,
  tiltDeg: 58,        // HOME tilt from vertical (the resting overview angle)
  headingDeg: 30,     // HOME azimuth (which side the camera rests)
  dist: 34,           // HOME dolly distance (inside the zoom corridor)
  zoomMin: 12,        // dolly-in limit — close enough to read individual fighters
  zoomMax: 46,        // dolly-out limit — whole field in view
  targetLift: 1.0,    // pan-plane height above the field top (target.y is held here)
  panMargin: 3,       // target may pan this far past the field half-extent (small overshoot)
  damping: 0.08,      // orbit damping (smooth manual motion)
  polarMin: 0.18,     // ~10° from vertical — top clamp (no flipping over the top)
  polarMax: 1.48,     // ~85° — bottom clamp (never look under the field)
  returnDelay: 2.0,   // idle seconds after input ends before the camera drifts home
  returnLerp: 0.05,   // per-frame ease toward home — soft ~1–1.5s glide, no snap
};
// Locked core palette (task snapshot): ONSLAUGHT / RAIDER / BULWARK / AMBUSH. These
// live on the BODIES as core light/rim (buildFighter) — never a second accent glow.
const CORE_PALETTE = [
  { id: 'natisk', hue: CORE_HUE.natisk }, // ONSLAUGHT
  { id: 'nalet',  hue: CORE_HUE.nalet  }, // RAIDER
  { id: 'skala',  hue: CORE_HUE.skala  }, // BULWARK
  { id: 'zasada', hue: CORE_HUE.zasada }, // AMBUSH
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
// Loading-screen handle — see services/sceneLoading.js. The field lifts the screen
// on its declared stages plus three settled frames, not on the first frame drawn.
let load = null;
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
  // Build stages, in the order they happen below.
  load = beginSceneLoad(['renderer', 'field', 'roster', 'beacon']);

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
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG.space.density); // легче — большое поле должно читаться

  camera = new THREE.PerspectiveCamera(FOV.space, w / h, CAMERA.near, CAMERA.far.space);
  // camera.position is set with the controls below, at a FIXED RTS offset from the
  // pan target (fixed tilt + heading + initial distance).

  // Lighting — soft diffuse fill (no lamp fixtures): warm key + warm hemisphere +
  // ambient, tuned so the field stays as bright as before across its WHOLE area.
  const key = new THREE.DirectionalLight(LIGHT.key.color, LIGHT.key.intensity);
  key.position.set(LIGHT.key.pos[0], LIGHT.key.pos[1], LIGHT.key.pos[2]);
  scene.add(key);
  scene.add(new THREE.AmbientLight(LIGHT.amb.color, LIGHT.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHT.hemi.sky, LIGHT.hemi.ground, LIGHT.hemi.intensity));
  load.stage('renderer');

  // Розовый читается из токенов одним путём — через leaderHue(). Раньше здесь
  // стояло собственное чтение с запасным значением, а запасное значение и есть
  // второе объявление (Правка 1.3 §1).
  const pink = leaderHue();

  // --- The floor is ONE uniform hex field from edge to edge — no central arena plate,
  //     no seam. The fighters + leader stand on it; its surface height is FIELD.y. ---
  const groundY = FIELD.y;
  field = buildHexField(groundY, renderer.capabilities.getMaxAnisotropy()); scene.add(field.group);
  backdrop = buildBackdrop({ radius: 72, centerY: 6 }, renderer.capabilities.getMaxAnisotropy());
  scene.add(backdrop.mesh);
  load.stage('field');

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

  load.stage('roster');

  // --- Leader beacon: mark member LEADER.index with the scene's single pink glow. ---
  const leader = roster[LEADER.index]?.fighter || null;
  if (leader) {
    leaderMarker = buildLeaderMarker(pink, groundY);
    leaderMarker.group.position.set(leader.group.position.x, 0, leader.group.position.z);
    scene.add(leaderMarker.group);
  }

  // --- Free orbit around the field (rotate / dolly / pan) with a soft AUTO-RETURN to
  //     a fixed HOME framing after the input goes idle. The camera sits at the HOME
  //     spherical offset (tilt + heading + dist) from the field-centre target; the
  //     user may orbit/zoom/pan freely, then it eases back home; any new input
  //     cancels the return so it never fights the user's hands. ---
  const camPhi = THREE.MathUtils.degToRad(CAM.tiltDeg);   // HOME polar angle from +Y
  const camTheta = THREE.MathUtils.degToRad(CAM.headingDeg);
  panTargetY = groundY + CAM.targetLift;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, panTargetY, 0);
  // place the camera at the fixed HOME offset (heading / tilt / initial distance)
  const camOffset = new THREE.Vector3().setFromSphericalCoords(CAM.dist, camPhi, camTheta);
  camera.position.copy(controls.target).add(camOffset);

  controls.enableDamping = true;
  controls.dampingFactor = CAM.damping;
  controls.enableRotate = true;                  // free orbit restored
  controls.enablePan = true;                     // pan kept (RMB / two-finger), still field-clamped
  controls.screenSpacePanning = false;           // pan along the ground plane (works with clampPan)
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.9;
  controls.rotateSpeed = 0.9;
  controls.minDistance = CAM.zoomMin;
  controls.maxDistance = CAM.zoomMax;
  // safe polar clamps — can't flip over the top or dip under the field
  controls.minPolarAngle = CAM.polarMin;
  controls.maxPolarAngle = CAM.polarMax;
  // familiar Home/PVE input: LMB / one-finger = ROTATE, wheel / middle = DOLLY,
  // RMB / two-finger = PAN (pinch = DOLLY_PAN).
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.update();

  // HOME framing (the resting view = exactly the initial one) — fixed, never recomputed.
  const homeTarget = controls.target.clone();
  const homeOffset = camera.position.clone().sub(controls.target);
  const homeCamPos = homeTarget.clone().add(homeOffset); // resting camera position (for the settle test)

  // Auto-return state. On input 'start' → interacting (cancel any return); on 'end' →
  // stamp the idle time. After CAM.returnDelay idle the loop eases target + camera home.
  let userInteracting = false;
  let returning = false;
  let idleSince = null;   // clock time (s) the input went idle; null while interacting / done
  let nowT = 0;           // latest loop time — read by the input handlers below
  controls.addEventListener('start', () => { userInteracting = true; returning = false; idleSince = null; });
  controls.addEventListener('end', () => { userInteracting = false; idleSince = nowT; });
  const _homeDesired = new THREE.Vector3();
  const RETURN_EPS = 0.01;

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

  load.stage('beacon');

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
    nowT = t;

    // Auto-return: after the input has been idle for CAM.returnDelay, ease the target
    // + camera back to HOME. Runs BEFORE controls.update()/clampPan. Any new input
    // sets userInteracting (via 'start') and cancels it immediately.
    if (!userInteracting) {
      if (!returning && idleSince !== null && (t - idleSince) >= CAM.returnDelay) returning = true;
      if (returning) {
        const k = reduced ? 1 : CAM.returnLerp; // reduced-motion → snap home (no glide)
        controls.target.lerp(homeTarget, k);
        _homeDesired.copy(controls.target).add(homeOffset);
        camera.position.lerp(_homeDesired, k);
        // settle only when BOTH are home — a rotate-only move leaves the target home
        // while the camera still needs to glide, so the camera check is what gates it.
        if (controls.target.distanceTo(homeTarget) < RETURN_EPS && camera.position.distanceTo(homeCamPos) < RETURN_EPS) { returning = false; idleSince = null; }
      }
    }

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

    // One settled frame toward readiness — counted only once every stage above is
    // in, and reset by any re-fit (see the resize observer).
    load.frame();
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
    // We just moved the picture under ourselves — start the settled-frame count
    // again, or the screen could lift on a frame that is about to change.
    load?.unsettle();
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  load?.dispose();   // left mid-load → drop the screen and the wait with us
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
  background: var(--scene-backdrop);
}
.space-scene-canvas { display: block; width: 100%; height: 100%; }
.space-scene-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--scene-vignette);
}
</style>
