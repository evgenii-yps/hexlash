// transitionFlight.js — the cinematic flight between the player HOME and the MODE
// plates. There is no second screen any more: FIGHT does not navigate, it flies.
// Home and the two mode plates stand in ONE world a long way apart, and this file
// is the director that moves the camera between them, breathes the fog, and stands
// the HEXLASH sign in the corridor for a beat on the way out.
//
// What it owns (built once, at scene init — never at transition time, so the flight
// can never stall on an asset):
//   · the camera path (two variants — see CONFIG.variant),
//   · the fog envelope (scene.fog density + colour),
//   · the drifting haze billboards the camera passes THROUGH,
//   · the 3D HEXLASH sign.
//
// FOG DISCIPLINE — the fog is atmosphere, not a curtain. It never covers the screen
// (peak coverage lands around a quarter to a third), it is never a flat CSS film over
// the canvas (that would delaminate the picture and defeat the whole point), and it
// is never true volumetrics (way too dear for a phone). Two cheap real-3D layers do
// it: the scene's own exponential fog for honest depth, plus a handful of big soft
// billboards at staggered depths so the camera gets parallax as it passes between
// them.
//
// SIGN DISCIPLINE — the HEXLASH sign is real extruded geometry standing in the world,
// NOT DOM text, not a sprite. It is MATTE, monochrome, and has no emissive and no
// pink: the sense of it glowing comes from lit haze around it catching on its bevels.
// This is the brand rule and it does not get rewritten here.
//
// Exports: FLIGHT (the tuning block), createTransitionFlight.
import * as THREE from 'three';
import { makeRadialTexture } from './arenaTextures.js';

// ─────────────────────────────── Tuning ───────────────────────────────
export const FLIGHT = {
  // ── shape of the world ──
  modeZ: 30,           // how far down -Z the mode plates stand from the home slab
  modeY: 0,            // ground height of the mode area (home slab base is 0)

  // ── camera path ──
  // 'B' — "взлёт": the camera lifts and pulls back off the home first (the home
  //       stays under us, alive and shrinking), then swings forward to the plates.
  // 'A' — "пролёт": the camera runs forward and down, the home passes beneath it
  //       and off the bottom of frame, and it comes out at the plates.
  // One continuous path either way — never two moves glued together.
  variant: 'B',
  riseB: 3.2,          // B: how far up the opening lift goes
  retreatB: 3.6,       // B: how far back (away from the look point) it pulls
  diveA: 6.5,          // A: how far forward the opening run goes
  dropA: 1.9,          // A: how far down it dips over the slab
  midLift: 1.4,        // hump height over the corridor midpoint (see buildPath)
  approachBack: 6.0,   // how far short of the final pose the approach point sits
  approachLift: 1.8,   // how far above the final pose the approach point sits

  // ── time ──
  duration: 2.5,       // seconds, forward flight (owner band 2.2–2.8)
  reverseFactor: 0.5,  // ← BACK runs the same road at half the length (1.1–1.4s)
  repeatFactor: 0.6,   // 2nd+ flight of the session is shortened (and skips the sign)
  settle: 0.15,        // a tap mid-flight rides this out to the end pose (no teleport)

  // Phase marks, as fractions of `duration`. They OVERLAP on purpose: the move must
  // not read as a sequence of discrete steps.
  camStart: 0.08,      // camera starts moving (the UI fade covers the first beat)
  fogPeakAt: 0.5,      // where the haze is thickest
  fogPower: 1.5,       // shape of the rise/fall (higher = later, sharper peak)
  signIn: 0.44, signHold: 0.56, signOut: 0.68, // sign fade in → hold → out
  // The 2D chrome's own fade is NOT timed here — it rides a CSS transition on the
  // `.is-away` class in HomeView, so the browser owns it and it cannot drift out of
  // step with a stalled frame. Change its length there.

  // ── fog ──
  fogBase: 0.03,       // the home scene's own resting density (matched at init)
  fogPeak: 0.052,      // peak density mid-flight — depth, NOT a whiteout
  // Keep the fog DARK. The backdrop dome is unlit (fog:false), so a pale fog would
  // make distant objects brighter than the sky behind them — depth read backwards,
  // and the plates would hang in the air like cut-outs. The fog's job is to sink
  // distance into the dark; the visible dust is the haze billboards' job, and they
  // carry the smoke tone. Raise this only if the owner wants a paler night.
  fogTint: 0.1,        // how far the fog colour leans to the smoke tone at peak
  smoke: 0x96a1b0,     // cold dust-grey — never white, never warm

  // ── haze billboards ──
  hazeCount: 9,        // big soft puffs staggered down the corridor
  hazeScale: [9, 17],  // world size range
  hazeY: 3.6,          // height the corridor of puffs is centred on
  hazeSpread: 7,       // ±X / ±Y jitter around the corridor line
  hazeOpacity: 0.16,   // per-puff peak — 2–3 overlap ⇒ ~a third of frame at most
  hazeDrift: 0.35,     // slow lateral drift while the flight runs (u/s)

  // ── HEXLASH sign ──
  // The sign stands in the corridor, but WHERE is derived from the path rather than
  // pinned to a world coordinate: the camera covers most of the corridor during the
  // sign's own beat, so a fixed spot is either passed before it has faded in or flown
  // through before it has faded out. Placing it ahead of the camera at the hold —
  // square to the way it is looking — is what makes it read at all, at any variant,
  // from any orbit the player left the home on.
  signClear: 2.5,      // how far short of the sign the camera still is when it fades out
  signMinAhead: 8,     // …but never closer than this (it would fill the lens)
  signEndClear: 4,     // …and never within this of the arrival pose (it would sit on the plates)
  signLift: 0.35,      // nudge up in frame, so an overshoot passes UNDER it
  signWidth: 4.2,      // world width at the default aspect — NOT the whole frame
  signFrameFrac: 0.44, // …and never more than this share of the frame width
  signDepth: 0.17,     // real thickness — the bevels are what catch the light
  signFace: 0x9aa2ad,  // matte cold grey. NO emissive. NO pink. Brand rule.
  signOpacity: 0.95,

  // ── final MODE framing + the orbit corridor it hands over to ──
  // The framing is computed from the plate pair's bounds so it survives an
  // orientation change (portrait re-lays the pair in depth — see MODE_PLATES).
  fit: {
    marginX: 1.6,        // world padding either side of the pair
    marginY: 1.8,        // …and above / below
    depthToScreen: 0.55, // how much of the pair's DEPTH reads as screen height at this pitch
    minDist: 8,
    maxDist: 30,
    pitchDeg: 17,        // camera elevation above the plate plane
    targetLift: 1.0,     // pivot height over the plate tops
    // The resting orbit at the mode stage: a short leash, never under the plates,
    // never far enough to lose them.
    yawDeg: 22,
    pitchSpanDeg: 8,
    zoomMin: 0.9,
    zoomMax: 1.15,
    returnDelay: 3.0,    // idle seconds before the camera drifts back to the default framing
    returnLerp: 0.06,    // per-frame ease of that drift (any input cancels it)
  },

  // ── health ──
  lowFpsDt: 0.05,      // a frame longer than this counts as a stall (20fps)
  lowFpsFrames: 3,     // …this many in a row ⇒ ride the flight out early
  graceSec: 0.3,       // ignore stalls during the opening beat (plates waking up)
  maxDt: 0.05,         // dt clamp — a backgrounded tab resumes, it does not jump
};

// ─────────────────────────── The HEXLASH sign ───────────────────────────
// Real letters, hand-authored as outlines in a 1.0-high em box and extruded. The
// project ships no font loader and no typeface JSON, and adding one would mean a
// new async asset on the critical path of a transition — so the seven glyphs of
// HEXLASH live here as geometry. Condensed geometric caps, matching the brand
// display face. Coordinates are [x, y] with y=0 the baseline and y=1 the cap line.
const GLYPHS = {
  H: { w: 0.62, out: [[0, 0], [0.19, 0], [0.19, 0.41], [0.43, 0.41], [0.43, 0], [0.62, 0], [0.62, 1], [0.43, 1], [0.43, 0.59], [0.19, 0.59], [0.19, 1], [0, 1]] },
  E: { w: 0.58, out: [[0, 0], [0.58, 0], [0.58, 0.19], [0.19, 0.19], [0.19, 0.405], [0.52, 0.405], [0.52, 0.595], [0.19, 0.595], [0.19, 0.81], [0.58, 0.81], [0.58, 1], [0, 1]] },
  X: { w: 0.62, out: [[0, 0], [0.22, 0], [0.31, 0.34], [0.4, 0], [0.62, 0], [0.465, 0.5], [0.62, 1], [0.4, 1], [0.31, 0.66], [0.22, 1], [0, 1], [0.155, 0.5]] },
  L: { w: 0.52, out: [[0, 0], [0.52, 0], [0.52, 0.19], [0.19, 0.19], [0.19, 1], [0, 1]] },
  A: {
    w: 0.64,
    out: [[0, 0], [0.185, 0], [0.255, 0.3], [0.385, 0.3], [0.455, 0], [0.64, 0], [0.41, 1], [0.23, 1]],
    holes: [[[0.268, 0.42], [0.372, 0.42], [0.32, 0.8]]],
  },
  S: { w: 0.58, out: [[0, 0], [0.58, 0], [0.58, 0.58], [0.19, 0.58], [0.19, 0.81], [0.58, 0.81], [0.58, 1], [0, 1], [0, 0.42], [0.39, 0.42], [0.39, 0.19], [0, 0.19]] },
};
const SIGN_WORD = 'HEXLASH';
const SIGN_TRACK = 0.085; // letter-spacing, in em

function glyphShape(g) {
  const shape = new THREE.Shape();
  shape.moveTo(g.out[0][0], g.out[0][1]);
  for (let i = 1; i < g.out.length; i++) shape.lineTo(g.out[i][0], g.out[i][1]);
  shape.closePath();
  (g.holes || []).forEach((h) => {
    const path = new THREE.Path();
    path.moveTo(h[0][0], h[0][1]);
    for (let i = 1; i < h.length; i++) path.lineTo(h[i][0], h[i][1]);
    path.closePath();
    shape.holes.push(path);
  });
  return shape;
}

// Build the sign → { group, mat, emWidth, dispose }. Authored around its own centre
// so the caller can place + scale it as one object. MATTE — no emissive, no glow.
function buildSign(o) {
  const group = new THREE.Group();
  const shapes = [];
  let x = 0;
  for (const ch of SIGN_WORD) {
    const g = GLYPHS[ch];
    const s = glyphShape(g);
    s.getPoints(); // touch once so ExtrudeGeometry sees a resolved outline
    shapes.push({ shape: s, x, w: g.w });
    x += g.w + SIGN_TRACK;
  }
  const emWidth = x - SIGN_TRACK;

  const mat = new THREE.MeshStandardMaterial({
    color: o.signFace,
    flatShading: true,
    roughness: 0.62,
    metalness: 0.28,
    transparent: true,
    opacity: 0,
    depthWrite: false, // fades in/out over the corridor — no depth artefacts
    fog: false,        // opacity is the only thing that drives it (see header)
  });

  const geos = [];
  for (const s of shapes) {
    const geo = new THREE.ExtrudeGeometry(s.shape, {
      depth: o.signDepth, bevelEnabled: true,
      bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 1, curveSegments: 1,
    });
    geo.translate(s.x - emWidth / 2, -0.5, -o.signDepth / 2); // centre the word on its own origin
    geos.push(geo);
    group.add(new THREE.Mesh(geo, mat));
  }

  group.visible = false;
  const dispose = () => { geos.forEach((g) => g.dispose()); mat.dispose(); };
  return { group, mat, emWidth, dispose };
}

// ─────────────────────────── Haze billboards ───────────────────────────
// Big soft puffs staggered down the corridor between home and the plates. The
// camera passes BETWEEN them, which is where the parallax (and the sense of volume)
// comes from — not from the sprite orientation. Alpha-blended, never additive: this
// is dust, not light. Invisible at rest; the flight drives their opacity.
function buildHaze(o) {
  const group = new THREE.Group();
  const tex = makeRadialTexture('rgba(170,181,198,0.85)', 'rgba(140,151,170,0.16)', 0.42);
  const mat = new THREE.SpriteMaterial({
    map: tex, color: o.smoke, transparent: true, opacity: 0,
    depthWrite: false, fog: false,
  });
  const puffs = [];
  for (let i = 0; i < o.hazeCount; i++) {
    const f = (i + 0.5) / o.hazeCount;                 // 0 (near home) … 1 (near plates)
    const z = THREE.MathUtils.lerp(3.5, -o.modeZ + 9, f);
    const s = new THREE.Sprite(mat);
    const jx = (Math.random() * 2 - 1) * o.hazeSpread;
    const jy = o.hazeY + (Math.random() * 2 - 1) * o.hazeSpread * 0.45;
    s.position.set(jx, jy, z);
    s.scale.setScalar(THREE.MathUtils.lerp(o.hazeScale[0], o.hazeScale[1], Math.random()));
    // Per-puff weight so the field is uneven (an even veil reads as a filter).
    puffs.push({ s, baseX: jx, w: 0.65 + Math.random() * 0.35, ph: Math.random() * Math.PI * 2 });
    group.add(s);
  }
  group.visible = false;

  // `env` is the flight's 0…1 fog envelope. One shared material carries the fade;
  // the unevenness comes from the puffs' own scale/placement and their slow drift,
  // which is what stops the field reading as a flat filter over the lens.
  const set = (env, t) => {
    mat.opacity = o.hazeOpacity * env;
    if (env <= 0.001) return;
    for (const p of puffs) {
      p.s.position.x = p.baseX + Math.sin(t * o.hazeDrift + p.ph) * 1.2 * p.w;
    }
  };
  const dispose = () => { mat.dispose(); tex.dispose(); };
  return { group, set, dispose };
}

// ─────────────────────────── Easing ───────────────────────────
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Slow off the mark, builds, then a LONG decel into the arrival — the tail is what
// makes the camera feel like it has weight rather than snapping to a mark.
function easeFlight(u) {
  const x = clamp01(u);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2.6) / 2;
}
// Rise → hold → fall envelope over [a, b] with the peak at `peak`.
function envelope(u, peak, power) {
  const x = clamp01(u);
  const s = x < peak ? x / peak : (1 - x) / (1 - peak);
  return Math.pow(clamp01(s), 1 / power);
}
// Smooth 0→1 across [a,b].
function ramp(u, a, b) {
  if (b <= a) return u >= b ? 1 : 0;
  const x = clamp01((u - a) / (b - a));
  return x * x * (3 - 2 * x);
}

// ─────────────────────────── The director ───────────────────────────
/**
 * @param {object} deps
 *   scene    — the home scene (fog + the flight's own props are added to it)
 *   camera   — the shared perspective camera (the director drives it directly)
 *   poseFor  — (where:'home'|'mode') => ({ position: Vector3, target: Vector3 })
 *              Live suppliers, so an orientation change mid-flight is picked up.
 *   reduced  — prefers-reduced-motion
 *
 * @returns controller — see the methods at the bottom.
 */
export function createTransitionFlight(deps) {
  const o = FLIGHT;
  const { scene, camera, poseFor } = deps;
  const reduced = !!deps.reduced;

  const sign = buildSign(o);
  scene.add(sign.group); // placed per flight — see placeSign()

  const haze = buildHaze(o);
  scene.add(haze.group);

  // Remember the scene's own resting fog so the flight always hands it back exactly.
  const fogBaseDensity = scene.fog?.density ?? o.fogBase;
  const fogBaseColor = scene.fog ? scene.fog.color.clone() : new THREE.Color(0x070811);
  const smoke = new THREE.Color(o.smoke);
  const _fogC = new THREE.Color();

  let active = false;
  let dir = 'toMode';        // 'toMode' | 'toHome'
  let el = 0;                // elapsed seconds
  let dur = o.duration;
  let withSign = true;
  let posCurve = null;
  let lookCurve = null;
  let reverse = false;       // traverse the curve backwards (the way home)
  let onArrive = null;
  let endPose = null;        // cached destination, watched for orientation changes
  let settling = 0;          // >0 while a skip rides out
  let settleFrom = null;
  const _lastLook = new THREE.Vector3(); // the flight's live look point (see currentLook)
  let haveLastLook = false;
  let slow = 0;              // consecutive stalled frames
  let stalled = false;       // …and whether they actually cut a flight short (dev readout)
  let flights = 0;           // how many this session (2nd+ runs shortened)
  const _look = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const _tmp = new THREE.Vector3();

  // Build the two curves for a HOME → MODE run. The way back reuses the same pair
  // traversed backwards, so both directions ride literally the same road.
  function buildPath(from, to) {
    const up = new THREE.Vector3(0, 1, 0);
    const viewH = _tmp.copy(from.target).sub(from.position);
    viewH.y = 0;
    if (viewH.lengthSq() < 1e-6) viewH.set(0, 0, -1);
    viewH.normalize();

    let p1; let l1;
    if (o.variant === 'A') {
      // «пролёт» — forward and down; the home passes under the camera.
      p1 = from.position.clone().addScaledVector(viewH, o.diveA).addScaledVector(up, -o.dropA);
      p1.y = Math.max(p1.y, 1.6);
      l1 = from.target.clone().addScaledVector(viewH, 4).addScaledVector(up, -0.6);
    } else {
      // «взлёт» — up and back off the home first; the home stays under us, alive.
      p1 = from.position.clone().addScaledVector(up, o.riseB).addScaledVector(viewH, -o.retreatB);
      l1 = from.target.clone();
    }

    const midZ = THREE.MathUtils.lerp(from.position.z, to.position.z, 0.42);
    // A hump BETWEEN the two heights, not a height stacked on top of the opening
    // lift: stacking sends the camera up like a rocket and leaves the corridor
    // hanging along the top edge of a mostly empty frame.
    const midY = THREE.MathUtils.lerp(p1.y, to.position.y, 0.5) + o.midLift;
    const p2 = new THREE.Vector3(THREE.MathUtils.lerp(p1.x, to.position.x, 0.6), midY, midZ);
    // Mid-corridor look point: already aimed down the corridor, not yet locked on the
    // plates — this is the stretch the sign stands in.
    const l2 = new THREE.Vector3(
      THREE.MathUtils.lerp(from.target.x, to.target.x, 0.5),
      THREE.MathUtils.lerp(from.target.y, to.target.y, 0.5) + 2.8,
      THREE.MathUtils.lerp(from.target.z, to.target.z, 0.55),
    );

    const back = _p.copy(to.position).sub(to.target);
    back.y = 0;
    if (back.lengthSq() < 1e-6) back.set(0, 0, 1);
    back.normalize();
    const p3 = to.position.clone().addScaledVector(back, o.approachBack).addScaledVector(up, o.approachLift);

    posCurve = new THREE.CatmullRomCurve3(
      [from.position.clone(), p1, p2, p3, to.position.clone()], false, 'catmullrom', 0.4,
    );
    lookCurve = new THREE.CatmullRomCurve3(
      [from.target.clone(), l1, l2, to.target.clone(), to.target.clone()], false, 'catmullrom', 0.4,
    );
    // Both curves are read with getPointAt (ARC LENGTH), never getPoint: the control
    // points are far from evenly spaced, so the raw parameter would sprint the long
    // leg and crawl the short one — the easing below has to be the only thing shaping
    // the speed. The length table is built once, here, not during the flight.
    posCurve.arcLengthDivisions = 240;
    lookCurve.arcLengthDivisions = 240;
    posCurve.updateArcLengths();
    lookCurve.updateArcLengths();
  }

  // Stand the sign in the corridor for its beat: dead ahead of where the camera will
  // be looking at the hold, and scaled so it fills its share of THIS frame (a portrait
  // phone gets a smaller sign, not a clipped one).
  //
  // How far ahead is COMPUTED, not tuned: the camera covers real ground during the
  // sign's own beat, so a hand-picked distance is either flown through before the
  // fade-out finishes, or pushed out past the plates where they occlude it. Taking the
  // distance the camera actually travels between the hold and the fade-out, plus a
  // clearance — and clamping it short of the arrival pose — makes it land right at any
  // duration, easing or path variant the owner tries.
  const _signAt = new THREE.Vector3();
  const _signOutAt = new THREE.Vector3();
  const _signDir = new THREE.Vector3();
  function placeSign() {
    if (!withSign || !posCurve) { sign.group.visible = false; return; }
    const param = (mark) => {
      const e = easeFlight((mark - o.camStart) / (1 - o.camStart));
      return reverse ? 1 - e : e;
    };
    _signAt.copy(posCurve.getPointAt(param(o.signHold)));
    _signOutAt.copy(posCurve.getPointAt(param(o.signOut)));
    _signDir.copy(lookCurve.getPointAt(param(o.signHold))).sub(_signAt);
    if (_signDir.lengthSq() < 1e-6) _signDir.set(0, 0, -1);
    _signDir.normalize();

    const travelled = _signAt.distanceTo(_signOutAt);
    const toEnd = endPose ? _signAt.distanceTo(endPose.position) : travelled + o.signClear + o.signEndClear;
    const ahead = THREE.MathUtils.clamp(
      travelled + o.signClear,
      o.signMinAhead,
      Math.max(o.signMinAhead, toEnd - o.signEndClear),
    );

    sign.group.position.copy(_signAt).addScaledVector(_signDir, ahead);
    sign.group.position.y += o.signLift;

    const d = Math.max(0.5, ahead);
    const frameW = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    const w = Math.min(o.signWidth, frameW * o.signFrameFrac);
    sign.group.scale.setScalar(w / sign.emWidth);
    // Upright and square-on to the camera — a sign standing in a room, never a
    // billboard tilting to follow the lens.
    sign.group.rotation.set(0, Math.atan2(_signAt.x - sign.group.position.x, _signAt.z - sign.group.position.z), 0);
    sign.group.visible = true;
    sign.mat.opacity = 0;
  }

  function applyFog(env) {
    if (!scene.fog) return;
    scene.fog.density = THREE.MathUtils.lerp(fogBaseDensity, o.fogPeak, env);
    _fogC.copy(fogBaseColor).lerp(smoke, o.fogTint * env);
    scene.fog.color.copy(_fogC);
  }

  function restFog() {
    if (!scene.fog) return;
    scene.fog.density = fogBaseDensity;
    scene.fog.color.copy(fogBaseColor);
  }

  function hideProps() {
    sign.group.visible = false;
    sign.mat.opacity = 0;
    haze.group.visible = false;
    haze.set(0, 0);
  }

  function finish() {
    active = false;
    settling = 0;
    settleFrom = null;
    haveLastLook = false; // next flight starts from the orbit pivot again
    hideProps();
    restFog();
    const cb = onArrive;
    onArrive = null;
    if (cb) cb(dir);
  }

  // Put the camera exactly on a pose (no motion). Used for a direct URL load, for
  // reduced motion, and as the landing of a skip.
  function snapTo(where) {
    const pose = poseFor(where);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
  }

  /**
   * Fly. `where` is the destination ('mode' | 'home').
   * opts.onArrive(dir) fires once the camera is on the final pose.
   * The 2nd+ flight of a session is shortened and drops the sign — the player is
   * going to see this transition hundreds of times.
   */
  function play(where, opts = {}) {
    onArrive = opts.onArrive || null;
    dir = where === 'home' ? 'toHome' : 'toMode';

    if (reduced) {
      // Reduced motion: no flight at all. The caller covers the swap with a short
      // dim; we just place the camera and report arrival on the next update.
      hideProps();
      restFog();
      snapTo(where);
      active = true;
      settling = 0;
      el = 0;
      dur = 0;
      return;
    }

    const repeat = flights > 0;
    flights += 1;
    withSign = dir === 'toMode' && !repeat; // the way back never carries the sign
    dur = o.duration * (dir === 'toHome' ? o.reverseFactor : 1) * (repeat ? o.repeatFactor : 1);

    const here = { position: camera.position.clone(), target: currentLook() };
    if (dir === 'toMode') {
      reverse = false;
      endPose = poseFor('mode');
      buildPath(here, endPose);
    } else {
      // The way home rides the same road backwards: build the outbound path from the
      // home pose to where we are standing now, then traverse it in reverse.
      reverse = true;
      endPose = poseFor('home');
      buildPath(endPose, here);
    }

    placeSign();
    haze.group.visible = true;
    el = 0;
    slow = 0;
    stalled = false;
    active = true;
    settling = 0;
    settleFrom = null;
  }

  // The camera's current look point. While the orbit owns the camera this is the
  // orbit pivot the scene hands us (so a flight starts from exactly where the player
  // left it, with no snap on the first frame); while the flight owns the camera the
  // pivot is stale, so the live path look point wins.
  let lookHint = null;
  function setLookHint(v) { lookHint = v; }
  function currentLook() {
    if (active && haveLastLook) return _lastLook.clone();
    if (lookHint) return lookHint.clone();
    return _look.copy(camera.position).addScaledVector(
      camera.getWorldDirection(_tmp), 8,
    ).clone();
  }

  /** A tap anywhere mid-flight: ride out to the end pose. Never a teleport. */
  function skip() {
    if (!active || settling > 0 || dur === 0) return;
    settleFrom = { position: camera.position.clone(), target: currentLook() };
    settling = 0.0001; // >0 marks "settling"; the update advances it
  }

  /**
   * Advance the flight. Call once per frame from the scene loop.
   * @param dtRaw seconds since the previous frame (clamped inside — a backgrounded
   *              tab must resume, not jump over the move)
   * @param t     scene elapsed time (drives the haze drift)
   * @returns true while the director owns the camera
   */
  function update(dtRaw, t) {
    if (!active) return false;

    // Reduced motion / zero-length run: the caller covers the swap with a dim.
    if (dur === 0) { finish(); return false; }

    const dt = Math.min(Math.max(dtRaw, 0), o.maxDt);

    // ── riding out a skip ──
    if (settling > 0) {
      settling += dt;
      const k = clamp01(settling / o.settle);
      const s = k * k * (3 - 2 * k);
      const dest = endPose || poseFor(dir === 'toMode' ? 'mode' : 'home');
      camera.position.lerpVectors(settleFrom.position, dest.position, s);
      _lastLook.lerpVectors(settleFrom.target, dest.target, s);
      camera.lookAt(_lastLook);
      const fade = 1 - s;
      applyFog(envelope(clamp01(el / dur), o.fogPeakAt, o.fogPower) * fade);
      haze.set(envelope(clamp01(el / dur), o.fogPeakAt, o.fogPower) * fade, t);
      if (withSign) sign.mat.opacity *= fade;
      if (k >= 1) finish();
      return true;
    }

    el += dt;
    const u = clamp01(el / dur);

    // ── health watchdog ──
    // The flight is driven by the clock, not by frames, so a stall never stretches
    // it — but on a device that is genuinely choking, a stuttering 2.5s of cinema is
    // worse than arriving. Three stalled frames in a row (after the opening beat,
    // where the plates are still waking up) ride it out.
    if (el > o.graceSec) {
      slow = dtRaw > o.lowFpsDt ? slow + 1 : 0;
      if (slow >= o.lowFpsFrames) { stalled = true; skip(); return true; }
    }

    // ── orientation change mid-flight ──
    // The destination framing is aspect-dependent; if the device rotated, re-aim at
    // the new pose from wherever we are, in whatever time is left. Position and look
    // both start from the current values, so there is no seam.
    const live = poseFor(dir === 'toMode' ? 'mode' : 'home');
    if (endPose && live.position.distanceTo(endPose.position) > 0.05) {
      const remain = Math.max(0.35, dur - el);
      buildPath({ position: camera.position.clone(), target: currentLook() }, live);
      reverse = false;
      endPose = live;
      dur = remain;
      el = 0;
      if (withSign) placeSign();
      return true;
    }

    const e = easeFlight((u - o.camStart) / (1 - o.camStart));
    const param = reverse ? 1 - e : e;
    camera.position.copy(posCurve.getPointAt(param));
    _lastLook.copy(lookCurve.getPointAt(param));
    haveLastLook = true;
    camera.lookAt(_lastLook);

    const env = envelope(u, o.fogPeakAt, o.fogPower);
    applyFog(env);
    haze.set(env, t);

    if (withSign) {
      const inK = ramp(u, o.signIn, o.signHold);
      const outK = 1 - ramp(u, o.signHold, o.signOut);
      sign.mat.opacity = o.signOpacity * inK * outK;
      if (sign.mat.opacity <= 0.002 && u > o.signOut) sign.group.visible = false;
    }

    if (u >= 1) {
      const dest = endPose || live;
      camera.position.copy(dest.position);
      camera.lookAt(dest.target);
      finish();
      return false;
    }
    return true;
  }

  function dispose() {
    restFog();
    scene.remove(sign.group);
    scene.remove(haze.group);
    sign.dispose();
    haze.dispose();
  }

  return {
    play, skip, update, snapTo, dispose, setLookHint,
    /** Reset the session counter (used when the scene remounts). */
    resetSession() { flights = 0; },
    get active() { return active; },
    /** Did the low-FPS watchdog ride the last flight out early? (dev readout) */
    get stalled() { return stalled; },
    get direction() { return dir; },
    get progress() { return dur > 0 ? clamp01(el / dur) : 1; },
  };
}
