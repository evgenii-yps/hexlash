// transitionFlight.js — the cinematic flight between the player HOME and the MODE
// plates. There is no second screen any more: FIGHT does not navigate, it flies.
// Home and the two mode plates stand in ONE world a long way apart, and this file
// is the director that moves the camera between them, breathes the fog, and stands
// the HEXLASH sign in the corridor for a beat on the way out.
//
// What it owns (built once, at scene init — never at transition time, so the flight
// can never stall on an asset):
//   · the camera path (two variants — see CONFIG.variant),
//   · the fog envelope (scene.fog distance falloff + colour),
//   · the 3D HEXLASH sign.
//
// FOG DISCIPLINE — the fog is atmosphere, not a curtain, and it is ONE layer: the
// scene's own linear distance falloff and nothing else. It is never a flat CSS film
// over the canvas (that would delaminate the picture), never true volumetrics (way
// too dear for a phone), and — since this pass — never soft billboards either.
//
// Billboards were the third thing tried here and they are gone for good. A billboard
// is a flat picture turned to face the camera: seen head-on it reads as a DISC with
// an edge, its radial gradient reads as a bright core with a halo ringed round it,
// and it slides against the world as the camera moves. That is a sticker on the lens,
// which is precisely what the falloff was rebuilt to stop being. Honest depth with no
// volumetric fakery beats fakery with visible seams, so if the corridor ever needs
// more life it gets it from the DENSITY (see fogBreath), never from added geometry.
//
// SIGN DISCIPLINE — the HEXLASH sign is real extruded geometry standing in the world,
// NOT DOM text, not a sprite. It is MATTE, monochrome, and has no emissive and no
// pink: what shape it has comes from the light catching its bevels. This is the brand
// rule and it does not get rewritten here.
//
// Exports: FLIGHT (the tuning block), createTransitionFlight.
import * as THREE from 'three';
import { FOG_COLOR, LIGHTING, MATERIALS } from '../data/sceneTokens.js';

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
  duration: 3.7,       // seconds, forward flight (owner band 3.4–4.0)
  reverseFactor: 0.5,  // ← BACK runs the same road at half the length
  settle: 0.15,        // a tap mid-flight rides this out to the end pose (no teleport)

  // Shortening repeats was tried and PULLED: it dropped the sign from the second
  // flight onward, which reads as the sign breaking rather than as restraint. The
  // machinery is kept behind this flag in case a final duration brings it back —
  // when on it shortens by `repeatFactor` AND drops the title beat, as before.
  // Against staleness we have the tap-to-skip, which is always there.
  shortenRepeats: false,
  repeatFactor: 0.6,

  // The camera's start is held in SECONDS, not as a share of the duration: a longer
  // flight must not push the opening back with it. FIGHT has to answer at once —
  // any delay there reads as lag, not as cinema. Everything past the start scales
  // with the duration, so a slower flight puts its extra time where it belongs: the
  // middle of the move and the decel into the arrival.
  camStartSec: 0.18,
  easeTail: 3.0,       // how long the decel into the arrival runs (higher = longer)

  // Phase marks, as fractions of `duration`. They OVERLAP on purpose: the move must
  // not read as a sequence of discrete steps.
  fogPeakAt: 0.5,      // where the atmosphere is thickest
  fogPower: 1.5,       // shape of the rise/fall (higher = later, sharper peak)
  signIn: 0.42, signHold: 0.58, // the title beat swells in over this stretch
  // The 2D chrome's own fade is NOT timed here — it rides a CSS transition on the
  // `.is-away` class in HomeView, so the browser owns it and it cannot drift out of
  // step with a stalled frame. Change its length there.

  // ── fog: a DISTANCE FALLOFF, not a curtain ──
  // The curve is LINEAR (near → far), not exponential, and that is the whole trick.
  // The job is asymmetric: leave the picture in front of the player exactly as it
  // was, and still bury the far end so the plates and the sign are not readable from
  // the home. An exponential curve cannot do both — it bites from the first unit, so
  // the only density that buries something 30 units out also murks the fighter at 5.
  // A linear curve has a `near` below which NOTHING is fogged at all (that is the
  // "3–5 units unchanged" half) and a `far` at which everything has BECOME the sky
  // (that is the "sinks into the background" half). Past `far` a fogged object is
  // the fog colour and nothing else, whatever its material — which is why dimming
  // the plate materials alone never hid them: fog is added after the material, so a
  // near-black plate still drew as a DARKER-than-sky cut-out.
  //
  // The curve is also asymmetric BY END, blended on the same presence the plates
  // ride. Standing at the home the far end has to vanish; standing at the plates the
  // home has to survive as a distant silhouette — that is the point of being able to
  // turn round. One curve cannot serve both, so there are two and they cross-fade.
  fogNearHome: 14,     // at the home: nothing inside this is fogged at all
  fogFarHome: 26,      // …and the plates (modeZ = 30) sit PAST it ⇒ they are the sky
  fogNearMode: 16,     // at the plates: the plates and the sign stay clean
  // …and the home. This one is set by the answer to "what is the player allowed to
  // KNOW is over there", not by taste. At 62 the home kept about half its contrast
  // and every part of it was nameable from the plates — the lamps, the fighter, the
  // hex grid, the rim of the slab. It has to read as "something is there and I can't
  // tell what", so the curve is pulled in to just INSIDE the home's own distance
  // (the camera parks ≈38.6 out, the slab spans ≈36–41): the back of it is the sky
  // outright and the front keeps a tenth of itself, which leaves mass without detail.
  // Measured from the parked pose, whole-home contribution: 67 levels at 62, 11 here.
  // Do not push this below ~36 — that is where the mass goes too, and a hole in the
  // world reads worse than a legible home.
  fogFarMode: 39,
  fogNearFlight: 9,    // mid-flight the curve tightens — that IS the atmosphere beat
  fogFarFlight: 34,    // …and opens again on arrival, on the same envelope
  // Keep the fog DARK. The backdrop dome is unlit (fog:false), so a pale fog would
  // make distant objects brighter than the sky behind them — depth read backwards,
  // and the plates would hang in the air like cut-outs. The fog's job is to sink
  // distance into the dark, and the smoke tone is the only colour it is allowed to
  // lean on while doing it. Raise this only if the owner wants a paler night.
  fogTint: 0.1,        // how far the fog colour leans to the smoke tone at peak
  smoke: 0x96a1b0,     // cold dust-grey — never white, never warm
  // The colour the falloff CONVERGES ON, and the one number here that is not free:
  // it has to be the sky the far end is supposed to disappear into. Past `far` a
  // fogged object is this colour and nothing else, so if it differs from the backdrop
  // behind it the object does not vanish — it turns into a flat patch of the wrong
  // hue, which is exactly how the plates stayed legible from the home even while
  // their materials were dimmed to nearly black. Matched by eye to the backdrop's
  // colour. С 12.09.2026 у купола нет градиента вовсе — он весь --void, тот же
  // цвет, что и FOG_COLOR, так что совпадение уже не «подобрано глазом», а
  // выполняется по построению.
  // Тон тумана — общий для всех залов (FOG_COLOR = --void = дальний край купола).
  // Раньше дом стоял в своём чёрном 0x0F0E11, на семь пунктов светлее остальных:
  // передний план уходил в один чёрный, а купол за ним — в другой.
  fogRest: FOG_COLOR,

  // ── the breath ──
  // Removing the billboards left the corridor perfectly still, and perfectly still
  // air is a picture rather than a place. Life comes back as DENSITY, not as things:
  // how far you can see wanders very slowly and very slightly. It must sit on the
  // edge of noticing — if a player can watch this happen it is too strong, and it is
  // the fastest way to end up with a "breathing" screen that reads as a bug.
  // It scales the (far - near) SPAN, so `near` is untouched and the near field stays
  // provably fixed, exactly as the linear curve promises.
  fogBreath: 0.035,    // ± fraction of the span
  fogBreathW: 0.13,    // rad/s ⇒ ~48 s a cycle

  // ── HEXLASH sign ──
  // A FIXED landmark standing in the corridor, not a title card that follows the
  // camera. It is placed once, at scene init, and never moves again: the player can
  // turn round at the plates and find it still standing there with the home behind
  // it, which is the whole reason it is an object and not a caption.
  //
  // The camera passes well ABOVE it on the way out (the arc humps over the corridor),
  // so it can never be flown through and never needs to blink out to get out of the
  // way — it simply swings past and is left behind.
  // WHERE it stands is now set by READABILITY FROM THE HOME, not by the middle of
  // the corridor. The home's own falloff runs 14 → 27, so at the old 0.55 (≈23.7
  // units out) three quarters of the word had already been replaced by the sky: even
  // pure white came out at about a fifth of its brightness — a grey smudge, whatever
  // colour it was painted. Nothing but DISTANCE fixes that, and buying it by
  // thinning the fog is not on the table (it is the same curve that hides the plates
  // from the home, which must keep working). So the sign has walked up the corridor
  // to where the home's own air still lets it through, and grown to hold its size in
  // frame from further away at the other end.
  signAt: 0.30,        // where along the corridor it stands (0 = home, 1 = the plates)
  // HEIGHT is set by the home frame, and there is only one direction it can go. The
  // home camera looks DOWN at the slab (it sits at 5.2 and aims at 1.6), so anything
  // standing up in the corridor rides the top edge of that frame — at 3.4 the word
  // was cut in half by it. Moving the sign further out does not help: the look axis
  // keeps descending with distance, so the angle up to the sign barely changes. It
  // has to come down. And it has to come down FAR enough to clear the top-right
  // chrome (SHOP and the cabinet), which is where the corridor axis lands from the
  // home's off-centre camera — at 2.2 the word ran underneath them and off the right
  // edge. 1.7 sits the whole word below that chrome, still ≈4.5 under the flight's
  // arc, and still above the home's own silhouette when the player turns round.
  signY: 1.7,          // height — clear of the camera's arc, above the plate plane
  signWidth: 5.0,      // real world width. It is an object: ONE size, no rescaling.
  signDepth: 0.17,     // real thickness — the bevels are what catch the light
  // Цвета здесь нет намеренно: настроечный блок сцены держит движение и
  // размеры, а краску — src/data/sceneTokens.js (MATERIALS.sign = --ink).
  signSideBand: 1.6,   // world units either side of the sign's own plane over which
  //                      the two halves hand over — see applySignOpacity
  signOpacity: 1.0,    // at the top of the title beat
  signRest: 0.94,      // …and the rest of the time. A FLOOR, not a fade: the sign is
  //                      a landmark standing in the world and it is meant to be
  //                      findable from BOTH ends of the corridor, so nothing dims it
  //                      but the distance falloff every other object answers to.

  // ── the sign's own cloud ──
  // The word does not hang in clean black: its bottom third is sunk in a low bank of
  // haze that it stands in. This is the sign's OWN cloud and it lives with the sign
  // always — it is not the corridor haze, which is a distance falloff and has no
  // place (see the fog block), and it is not a title-card effect that arrives with
  // the flight. Without it the word floats in the void with nothing under it.
  //
  // NOT A BILLBOARD. The one thing this must never become is a flat picture turned
  // to face the camera: seen head-on that reads as a disc with an edge and it slides
  // against the world when the camera moves. It is a VOLUME — a bank of many small
  // soft grains, each at a real world position, so the parallax is honest from every
  // angle the orbit can reach and there is no single edge to catch.
  //
  // NOT A LIGHT. It is darker than nothing else in the corridor is: a cold grey a
  // shade above the sky, never warm, and its colour is driven off the scene's own
  // ambient + hemisphere (see litReference) so that killing the lights kills it too.
  // Points are unlit by nature and would otherwise survive a lights-off check, which
  // would make the check worthless.
  //
  // A BANK, NOT A BALL. It was first authored as a squashed ellipsoid with the grains
  // packed toward its middle, and on a phone that read as one smear of dirt between
  // two letters in the centre of the word with nothing under either end — the word
  // still hanging in the void, just with a stain on it. A bank has to run the whole
  // length of what it is holding up, so the grains now sit at even density from end
  // to end and the shape only gives way in the last fifth, where it dissolves rather
  // than stops. Everything below is in EM — the sign's own units, cap height 1 — so
  // the bank keeps its proportions whatever size or distance the sign is set to.
  cloudCount: 2000,    // grains at full quality …
  cloudCountLow: 720,  // …and once the frame watchdog has seen this device stall.
  //                      Never zero: a word with no footing reads as a fault.
  cloudGrain: 0.40,    // grain diameter, in cap heights. Big enough that the grains
  //                      merge into haze instead of reading as grit on the letters
  cloudSpread: 0.78,   // half-width, as a share of the word's WIDTH ⇒ the bank runs
  //                      1.56 × the word and carries on past both ends
  cloudFlank: 0.28,    // the outer share of that half-width over which it dissolves
  cloudCore: -0.40,    // where the densest line sits, in cap heights from the middle
  //                      of the letters (their baseline is -0.5) — half way up the
  //                      third that is meant to be swallowed
  cloudUp: 0.56,       // how far the haze reaches ABOVE the core before it is gone.
  //                      Core -0.40 + 0.56 lands on +0.16 — two thirds up the
  //                      letters, which is exactly where it has to have run out. The
  //                      third line is at -0.167, and the bank is still near full
  //                      density there, so the bottom third is the part that sinks
  //                      and the middle third carries the fade
  cloudDown: 0.50,     // …and below it. Longer, and it fades out rather than ending:
  //                      there is no floor under the sign for a bank to rest on
  cloudDepth: 0.55,    // half-depth. The letters are 0.16 deep, so the bank stands
  //                      both in front of them and behind — the feet are wrapped,
  //                      not curtained
  cloudTint: 0x1e1e24, // the densest the bank is ever allowed to be (owner, 13.09)
  cloudAlpha: 0.26,    // one grain's share — the mass comes from overlap, not from
  //                      any single grain being visible on its own
  cloudTurn: 0.010,    // rad/s — a whole turn takes ten minutes. Rigid, so it cannot
  //                      open a seam; off under reduced motion.

  // ── final MODE framing + the orbit it hands over to ──
  // The framing is computed from the plate pair's bounds so it survives an
  // orientation change (portrait re-lays the pair in depth — see MODE_PLATES).
  fit: {
    marginX: 1.6,        // world padding either side of the pair
    marginY: 1.8,        // …and above / below
    depthToScreen: 0.55, // how much of the pair's DEPTH reads as screen height at this pitch
    minDist: 8,
    maxDist: 30,
    pitchDeg: 17,        // camera elevation above the plate plane
    targetLift: 1.0,     // pivot height over the plate tops — the OPENING guess only;
                         // modeFraming then measures and re-centres (see there)
    // Room kept for the caption cards hanging under the pair, and the breathing space
    // around the whole block. Pixels, because that is what the captions live in.
    captionPx: 62,       // caption card height + its gap under the plate silhouette
    edgePx: 18,          // clearance from the frame edge on every side
    // The orbit at the mode stage is FREE all the way round — the plates stand in a
    // world, not on a backdrop, and the player is meant to be able to turn and find
    // the corridor, the sign and the home still behind them. Only the two limits
    // that protect the illusion are kept: you cannot drop under the plates and see
    // their underside, and you cannot back out far enough to reach the sky.
    pitchSpanDeg: 13,    // ± around the default elevation …
    pitchFloorDeg: 4,    // … and never flatter than this above the plate plane
    zoomMin: 0.7,
    zoomMax: 1.6,
    zoomMaxAbs: 20,      // hard ceiling in world units — keeps the dome out of reach
    returnDelay: 5.0,    // idle seconds before the camera drifts back to the default
    //                      framing. Longer than the old 3s: with a full circle to
    //                      look round, three seconds pulls the camera back while the
    //                      player is still looking at something.
    returnLerp: 0.06,    // per-frame ease of that drift (any input cancels it)
  },

  // ── presence: which end of the corridor the camera is standing at ──
  // 0 = at the home, 1 = at the plates. The two ends of the world dim each other out
  // with it, so each stage stays calm without anything being switched off — turning
  // a whole object off would tear a hole in the world the moment the player orbits
  // and looks that way. `hint` is the floor: the far end never vanishes, it just
  // sinks into the distance until it is a suggestion rather than a thing to read.
  presence: {
    // The two ends are NOT symmetric, are not measured the same way, and are not
    // meant to be. Each end answers to its OWN distance, not to a shared "which half
    // of the corridor am I in" mix: a mix cannot say when the plates are close enough
    // to deserve their colour back, only which end is nearer, and those are different
    // questions once the camera is out over the void between them.
    //
    // Far end (the plates and the sign) — driven by distance to the plate pair.
    farOn: 34,         // at or beyond this the far end is only a hint in the dark
    farFull: 14,       // …and at or inside it the plates are fully themselves
    // The plates are small and must not be readable from the home at all. The floor
    // is never zero: switching them off would tear a hole in the world the moment the
    // player orbits at the home and looks this way. The thing that actually HIDES
    // them is the distance falloff (see the fog block) — this only keeps them dark.
    hintFar: 0.05,
    // Home end (the home's own glows) — driven by distance to the home. The home is
    // large and is the player's landmark, so its GEOMETRY is never dimmed: it stays a
    // legible silhouette from the far end. Only its glows go out, so the one pink on
    // screen is always the one the stage in front of the player is entitled to.
    homeOff: 30,       // at or beyond this the home's glows are fully out
    homeOn: 15,        // …and at or inside it they are fully lit
    hintHomeGlow: 0,   // raise if the home should keep a spark of its own from afar
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

// Strip the cap that faces AWAY from the reader, leaving an open shell: readable
// face + walls + bevels. This is what makes the back-to-back pair work.
//
// Depth alone cannot do it. Each half is a closed solid, so it also carries an
// inward cap with the letters the wrong way round — and because the mirrored word's
// letters do not sit exactly on top of the right ones (the glyphs are different
// widths), that cap pokes out past its neighbour wherever they disagree and draws
// there, no matter what the depth buffer says. With the cap gone there is simply
// nothing to leak: from the wrong side each half is hollow, and hollow is culled.
//
// ExtrudeGeometry is non-indexed, so this is a straight walk over the triangles.
function dropBackCap(geo, THREE_) {
  const pos = geo.attributes.position.array;
  const keep = [];
  for (let i = 0; i < pos.length; i += 9) {
    const ux = pos[i + 3] - pos[i]; const uy = pos[i + 4] - pos[i + 1]; const uz = pos[i + 5] - pos[i + 2];
    const vx = pos[i + 6] - pos[i]; const vy = pos[i + 7] - pos[i + 1]; const vz = pos[i + 8] - pos[i + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    if (nz / len > -0.9) for (let k = 0; k < 9; k++) keep.push(pos[i + k]); // keep all but the flat back cap
  }
  const out = new THREE_.BufferGeometry();
  out.setAttribute('position', new THREE_.Float32BufferAttribute(keep, 3));
  out.computeVertexNormals();
  geo.dispose();
  return out;
}

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
// so the caller can place it as one object. MATTE — no emissive, no glow.
//
// READS FROM BOTH SIDES. The sign stands between the home and the plates, so the
// player meets its front on the way out and its back when they turn round at the
// plates — and the back of an extruded word is a mirror image. Turning it to face
// the camera would fix that and destroy the point of it: the moment it swivels it
// stops being a thing in the world and becomes a sticker on the lens.
//
// So it is built as two half-depth copies of the word back to back, the second
// turned 180° about Y. That rotation mirrors the letters AND reverses their order,
// which is exactly what un-mirrors them for a viewer on the far side. The halves
// occupy z ∈ [0, d/2] and z ∈ [-d/2, 0] — adjacent, never coincident, so nothing
// double-blends while the sign fades; together they read as one solid slab whose
// side walls run the full depth.
//
// The catch, and why each half carries its OWN material: HEXLASH is not a palindrome.
// Reversed it is HSALXEH, whose letters fall in different places, so the two halves
// do not share a silhouette and the far one is visible THROUGH the near one's gaps —
// as pale strokes inside and between the letters, the mirrored X sitting across the
// LA being the clearest of them. Depth cannot hide it: there is simply nothing in
// front of those pixels to hide it behind. What does hide it is only ever drawing
// the half that is facing the reader, so the far one is faded out by the side fade
// in applySignOpacity.
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

  const makeMat = () => new THREE.MeshStandardMaterial({
    // MATTE, and the brand white — never a mid grey. Emissive is left at black and
    // blending at normal on purpose: the word must not light itself. Kill every
    // light in the scene and it goes black, which is the test for that.
    ...MATERIALS.sign,
    transparent: true,
    opacity: 0,
    // The sign WRITES DEPTH, unlike the rest of the fading pieces here, and it has
    // to: it is a closed solid, so each half also carries an inward-facing cap with
    // the letters on it the wrong way round. Without depth those caps blend straight
    // through the correct face and the word reads mirrored from both sides. Writing
    // depth lets the near face win, which is simply what a solid object does.
    depthWrite: true,
    // FOGGED. It used to be exempt so opacity alone drove it, and that is exactly
    // why it was still legible from the home: a light grey object 30 units away with
    // nothing dimming it but a small alpha. Distance is supposed to be what hides it,
    // so distance gets to. The cost at the title beat (~13 units) is a few per cent.
    fog: true,
  });
  // ONE MATERIAL PER HALF, not one shared between them. The two halves have to be
  // able to fade independently — see the side fade in applySignOpacity, which is
  // what stops the far half showing through the near one's gaps.
  const matFront = makeMat();
  const matBack = makeMat();

  const half = o.signDepth / 2;
  const geos = [];
  const front = new THREE.Group(); // reads from the home side (+Z)
  const back = new THREE.Group();  // reads from the plates side (-Z)
  back.rotation.y = Math.PI;
  for (const s of shapes) {
    let geo = new THREE.ExtrudeGeometry(s.shape, {
      depth: half, bevelEnabled: true,
      bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 1, curveSegments: 1,
    });
    geo = dropBackCap(geo, THREE); // open shell — see the helper
    geo.translate(s.x - emWidth / 2, -0.5, 0); // centre the word on its own origin
    geos.push(geo);
    front.add(new THREE.Mesh(geo, matFront));
    back.add(new THREE.Mesh(geo, matBack)); // same geometry, mirrored by the group's turn
  }
  group.add(front, back);

  group.visible = false;
  const dispose = () => {
    geos.forEach((g) => g.dispose());
    matFront.dispose();
    matBack.dispose();
  };
  return { group, matFront, matBack, emWidth, dispose };
}

// ─────────────────────── The cloud the sign stands in ───────────────────────
// The word is not a caption floating in clean black — it stands in a low bank of
// haze that swallows the bottom third of its letters. See the cloud block in FLIGHT
// for the discipline; the two things it must never become are a flat card turned to
// the camera and a source of light.
//
// It is built as a VOLUME of small soft grains. Grains are camera-facing by nature,
// but that is not what a billboard is: a billboard is ONE quad standing in for a
// volume, and it betrays itself by having a single silhouette that slides against
// the world. A hundred grains at a hundred real world positions have no shared
// silhouette to catch and parallax correctly from any angle, which is exactly the
// property that was missing last time.
//
// Layout is deterministic (a seeded generator, not Math.random): the bank must be
// the same bank on every load, or the corridor changes shape between sessions.
function mulberry32(a) {
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One grain: a round patch of alpha that fades to nothing well before its own edge.
// The falloff is squared-smoothstep with NO rim and NO bright centre — a radial
// gradient with a hot core is the other half of how the old billboards gave
// themselves away, reading as a core with a halo ringed round it.
function grainTexture(THREE_) {
  const S = 64;
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const g = cv.getContext('2d');
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x + 0.5) / S * 2 - 1;
      const dy = (y + 0.5) / S * 2 - 1;
      const d = Math.min(1, Math.hypot(dx, dy));
      const k = 1 - d;
      const a = k * k * k * (3 - 2 * k); // smooth to zero at the edge, flat-ish inside
      const i = (y * S + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(255 * a);
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE_.CanvasTexture(cv);
  tex.colorSpace = THREE_.SRGBColorSpace;
  return tex;
}

// Build the bank → { group, mat, setCount, setLit, dispose }.
// `capHeight` is the sign's cap height in world units, `width` its world width, and
// the bank is authored around the sign group's own origin so it can be parented to
// it and inherit its placement for free.
function buildSignCloud(o, emWidth) {
  const group = new THREE.Group();
  const tex = grainTexture(THREE);

  // Everything here is in EM: cap height 1, the word `emWidth` wide, letters centred
  // on the origin so their baseline is -0.5. The group is parented to the sign, so
  // the sign's own scale carries all of it into the world at the right size.
  const rx = emWidth * o.cloudSpread;   // half-width of the bank
  const rz = o.cloudDepth;              // half-depth
  const flank = Math.max(1e-3, o.cloudFlank);

  // Ends DISSOLVE, they do not stop: over the last `cloudFlank` of the half-width the
  // bank both thins out (fewer grains survive the roll below) and shrinks in section,
  // so there is no line anywhere for the eye to find.
  const endEnvelope = (ax) => {
    const t = clamp01((1 - ax) / flank);
    return t * t * (3 - 2 * t);
  };

  // Bounded stand-in for a normal: three uniforms, so the tails cannot throw a grain
  // out on its own where it would read as a speck rather than as haze.
  const bell = (rnd) => (rnd() + rnd() + rnd() - 1.5) / 1.5;

  const rnd = mulberry32(0x48584c); // 'HXL'
  const pos = new Float32Array(o.cloudCount * 3);
  for (let i = 0; i < o.cloudCount; i++) {
    // Along the word: EVEN density end to end. This is the whole difference between
    // a bank and the ball this used to be — a ball is densest in the middle and has
    // nothing at the ends, which is exactly how the word came to be standing on one
    // smear of haze in the centre with both ends hanging in the void.
    let x; let env;
    do {
      x = rnd() * 2 - 1;
      env = endEnvelope(Math.abs(x));
    } while (rnd() > env);            // thins the flanks, leaves the body untouched
    const section = 0.58 + 0.42 * env; // …and narrows their section with them

    // Up and down are NOT symmetric. Above the core the haze has to be gone by the
    // time it reaches the top third of the letters — that third must read clean.
    // Below it there is no floor to rest on, so it runs longer and simply fades.
    const u = bell(rnd);
    const y = o.cloudCore + (u >= 0 ? u * o.cloudUp : u * o.cloudDown) * section;

    pos[i * 3] = x * rx;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = bell(rnd) * rz * section;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setDrawRange(0, o.cloudCount);

  const mat = new THREE.PointsMaterial({
    size: o.cloudGrain, // in cap heights — resolved against camera + scale below
    sizeAttenuation: true,
    map: tex,
    color: 0x000000,      // set every frame from the scene's own light — see setLit
    transparent: true,
    opacity: o.cloudAlpha,
    // Writes NO depth, tests against it. That single pair is what sinks the letters:
    // a grain behind a letter fails the test and is dropped, a grain in front of one
    // draws over it, and in the gaps between the letters every grain draws. The word
    // ends up standing IN the bank rather than behind a veil.
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending, // never additive — additive is how haze glows
    fog: true,
  });

  const points = new THREE.Points(geo, mat);
  points.renderOrder = 1; // after the sign, which is what makes the depth test bite
  points.frustumCulled = false; // the bank is wider than its own origin implies
  group.add(points);

  const tint = new THREE.Color(o.cloudTint);
  const _c = new THREE.Color();

  return {
    group,
    mat,
    /** Drop to the cheap layout once the device has shown it cannot keep up. */
    setCount(n) { geo.setDrawRange(0, Math.min(n, o.cloudCount)); },
    /**
     * Grain size, resolved.
     *
     * Two corrections, both needed. `PointsMaterial.size` is NOT a world size: three
     * sizes a point as size · height / (2 · distance) and leaves the field of view
     * out of it, so at this camera a grain came out at 0.38 of what it was asked for
     * — quarter of the area — and the bank read as grit sprinkled over the letters.
     * And the size is NOT scaled by the object's matrix either, so a grain authored
     * in the sign's units has to be carried into the world by hand; without that the
     * grains would stay put while the sign changed size, and the bank would lose its
     * proportions the moment the word was moved or resized.
     */
    setGrainScale(fovDeg, worldPerEm) {
      mat.size = o.cloudGrain * worldPerEm / Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
    },
    /**
     * The bank is LIT, not self-coloured. Points carry no lighting of their own, so
     * the ambient + hemisphere the hall actually has is folded into the colour here.
     * With the lights gone the factor is zero and the bank is black — which is what
     * makes "kill the lights and look" a real test rather than a formality.
     */
    setLit(k) { mat.color.copy(_c.copy(tint).multiplyScalar(k)); },
    dispose() { geo.dispose(); mat.dispose(); tex.dispose(); },
  };
}

// ─────────────────────────── Easing ───────────────────────────
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// Perceived brightness of a light's colour — used to weigh the hall's ambient
// and hemisphere into the one number the sign's cloud is coloured by.
// NB: THREE.Color components are LINEAR, not sRGB — the numbers here are not the
// ones a colour picker shows, and mixing the two spaces is how the sign's bank came
// out nearly black the first time.
const lum = (c) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;

// What "fully lit" means for the sign's cloud: the ambient + hemisphere the halls
// are actually built with. DERIVED from the lighting tokens rather than typed, so it
// cannot drift away from them — a hall lit dimmer gets a dimmer bank, which is what
// being lit means. Computed once, lazily, because it needs THREE.Color.
let _litRef = 0;
function litReference() {
  if (!_litRef) {
    _litRef = LIGHTING.amb.intensity * lum(new THREE.Color(LIGHTING.amb.color))
      + LIGHTING.hemi.intensity * lum(new THREE.Color(LIGHTING.hemi.sky));
  }
  return _litRef;
}
// Slow off the mark, builds, then a LONG decel into the arrival — the tail is what
// makes the camera feel like it has weight rather than snapping to a mark. FLIGHT.
// easeTail sets how long that decel runs, which is where a slower flight is meant to
// spend most of its extra time.
function easeFlight(u, tail) {
  const x = clamp01(u);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, tail) / 2;
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

  // The sign is a FIXED landmark: placed once here and never moved again, so the
  // player can turn round at the plates and find it exactly where they flew past it.
  const sign = buildSign(o);
  const signScale = o.signWidth / sign.emWidth;
  sign.group.scale.setScalar(signScale);
  sign.group.position.set(0, o.signY, -o.modeZ * o.signAt);
  sign.group.rotation.set(0, 0, 0); // front toward the home, back toward the plates
  scene.add(sign.group);

  // The bank the word stands in. PARENTED TO THE SIGN, so it is placed, scaled and
  // fogged by exactly the same numbers and can never drift away from the letters it
  // is supposed to be swallowing. Authored in the sign's own em units (cap height 1,
  // the word `emWidth` wide) because that is the space the sign group is in.
  const cloud = buildSignCloud(o, sign.emWidth);
  cloud.setGrainScale(camera.fov, signScale);
  sign.group.add(cloud.group);

  // The bank is lit by the hall, not by itself. The lights themselves are added at
  // scene build and do not come and go, so the LIST is gathered once; their totals
  // are re-read every frame, which costs a loop over three objects and buys the one
  // thing that matters here — turn the hall's lights down and the bank goes with
  // them. A colour read once at build would survive a lights-off check and make the
  // check worthless, which is exactly what it did on the first pass.
  const skyLights = [];
  scene.traverse((n) => { if (n.isAmbientLight || n.isHemisphereLight) skyLights.push(n); });
  function relight() {
    let lit = 0;
    for (const n of skyLights) {
      if (!n.visible) continue;
      lit += n.intensity * lum(n.isHemisphereLight ? n.color : n.color);
    }
    cloud.setLit(clamp01(lit / litReference()));
  }
  relight();

  // Remember the scene's own resting fog colour so the flight always hands it back
  // exactly. The DISTANCE of the curve is not remembered — it is derived from
  // presence every frame (see applyFog), because where the falloff should start
  // depends on which end of the corridor the camera is standing at.
  const fogBaseColor = new THREE.Color(o.fogRest);
  const smoke = new THREE.Color(o.smoke);
  const _fogC = new THREE.Color();

  let active = false;
  let dir = 'toMode';        // 'toMode' | 'toHome'
  let el = 0;                // elapsed seconds
  let dur = o.duration;
  let withTitle = true;      // does THIS flight carry the title beat?
  let camStartFrac = 0.05;   // FLIGHT.camStartSec expressed against the live duration
  let presence = 0;          // 0 at the home … 1 at the plates (fed by the scene)
  let posCurve = null;
  let lookCurve = null;
  let reverse = false;       // traverse the curve backwards (the way home)
  let onArrive = null;
  let endPose = null;        // cached destination, watched for orientation changes
  let settling = 0;          // >0 while a skip rides out
  let settleFrom = null;
  const _lastLook = new THREE.Vector3(); // the flight's live look point (see currentLook)
  let haveLastLook = false;
  let lastT = 0;             // last scene time seen — keeps the breath continuous
  //                            across the calls that have no clock to hand (play,
  //                            finish, dispose), so it never jumps on a hand-back.
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
    // Mid-corridor look point: the sign itself. It stands on the corridor axis, so
    // aiming the middle of the look path at it composes the title beat on it for
    // free — and the camera's own arc humps well above it, so it passes over, not
    // through.
    const l2 = sign.group.position.clone();

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

  // The falloff has two inputs, and they are independent on purpose:
  //   · `presence` — WHERE the camera is standing, which picks the resting curve
  //     (home curve ⇔ mode curve). This runs whether or not a flight is playing, so
  //     an orbiting player gets the right curve for the end they are at.
  //   · `env`      — the flight's 0…1 atmosphere envelope, which tightens the curve
  //     mid-corridor and lets it back out on arrival.
  // scene.fog is a THREE.Fog (linear). See the fog block in FLIGHT for why.
  function applyFog(env, t) {
    if (!scene.fog) return;
    if (t !== undefined) lastT = t; else t = lastT;
    const restNear = THREE.MathUtils.lerp(o.fogNearHome, o.fogNearMode, presence);
    const restFar = THREE.MathUtils.lerp(o.fogFarHome, o.fogFarMode, presence);
    const near = THREE.MathUtils.lerp(restNear, o.fogNearFlight, env);
    const far = THREE.MathUtils.lerp(restFar, o.fogFarFlight, env);
    // …and the breath. This is the ONLY thing allowed to move in the corridor now
    // that the billboards are gone: the air is alive because how far you can see
    // wanders a little, not because there is anything hanging in it to look at.
    // Off under reduced motion, with the rest of the scene's idle life.
    const b = reduced ? 1 : 1 + Math.sin(t * o.fogBreathW) * o.fogBreath;
    scene.fog.near = near;
    scene.fog.far = near + (far - near) * b;
    _fogC.copy(fogBaseColor).lerp(smoke, o.fogTint * env);
    scene.fog.color.copy(_fogC);
  }

  // Resting fog is the same function with the flight envelope at zero — there is no
  // separate "off" state to drift out of step with the live one.
  function restFog(t) { applyFog(0, t); }

  function finish() {
    active = false;
    settling = 0;
    settleFrom = null;
    haveLastLook = false; // next flight starts from the orbit pivot again
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
   * Every outbound flight carries the title beat — see FLIGHT.shortenRepeats.
   */
  function play(where, opts = {}) {
    onArrive = opts.onArrive || null;
    dir = where === 'home' ? 'toHome' : 'toMode';

    if (reduced) {
      // Reduced motion: no flight at all. The caller covers the swap with a short
      // dim; we just place the camera and report arrival on the next update.
      restFog();
      snapTo(where);
      active = true;
      settling = 0;
      el = 0;
      dur = 0;
      return;
    }

    const short = o.shortenRepeats && flights > 0; // off by default — see the config
    flights += 1;
    // The title beat rides EVERY outbound flight. The way back never carries it: the
    // sign is still there, but as the landmark it is, not as a card being played.
    withTitle = dir === 'toMode' && !short;
    dur = o.duration * (dir === 'toHome' ? o.reverseFactor : 1) * (short ? o.repeatFactor : 1);
    // Hold the opening in real seconds against THIS flight's length, so a slower
    // flight starts just as promptly and spends its extra time further in.
    camStartFrac = Math.min(0.35, o.camStartSec / Math.max(dur, 0.01));

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

  // The sign's opacity, in ONE place. It is a landmark, and a landmark you can only
  // see from one end of the corridor is not one: the word reads from the home AND
  // from the plates, and what makes it far away is the distance falloff, the same
  // one every other object in the corridor answers to. It used to be multiplied by
  // `presence` as well, which drove it to nothing at the home — belt and braces on a
  // decision that has since been reversed. The title beat only ever ADDS: it swells
  // over the landmark on the way out and then leaves it standing.
  function applySignOpacity(titleK) {
    const rest = o.signRest;
    const op = Math.max(rest, o.signOpacity * titleK);
    // WHICH HALF the reader is looking at. The sign faces +Z, so the side is simply
    // which side of its own plane the camera is standing on. Only the facing half is
    // drawn; the other one is faded out, because it is not a mirror of the near one
    // (HEXLASH reversed is HSALXEH) and would otherwise show through the gaps.
    // The changeover is a band, not a switch, because it happens with the sign very
    // nearly edge-on and there must be nothing to catch. It is reached in the flight
    // (the camera passes directly over the sign) and, at the home, only from the far
    // corner of the orbit — fully zoomed out and near horizontal, where the camera
    // can just get past z ≈ -9. At the plates it is out of reach entirely: that orbit
    // comes no nearer than z ≈ -21.6.
    const side = clamp01((camera.position.z - sign.group.position.z) / o.signSideBand * 0.5 + 0.5);
    const k = side * side * (3 - 2 * side);
    sign.matFront.opacity = op * k;
    sign.matBack.opacity = op * (1 - k);
    // The bank shares the sign's fate exactly: they arrive together and leave
    // together, because a bank with no word in it is weather and a word with no bank
    // under it is a caption. `sign.group.visible` covers the cloud too — it is a
    // child of the sign group.
    cloud.mat.opacity = o.cloudAlpha * op;
    sign.group.visible = op > 0.004;
  }

  // The bank turns, very slowly and RIGIDLY — the whole volume as one body, so it
  // cannot open a seam or make a grain pop across the letters. Ten minutes a turn:
  // it is meant to be a place rather than a picture, not something a player can
  // watch happen. Off under reduced motion, with the rest of the scene's idle life.
  let lastFov = camera.fov;
  function spinCloud(t) {
    relight();
    if (camera.fov !== lastFov) { lastFov = camera.fov; cloud.setGrainScale(camera.fov, signScale); }
    if (reduced || t === undefined) return;
    cloud.group.rotation.y = t * o.cloudTurn;
  }

  /**
   * Advance the flight. Call once per frame from the scene loop — including while
   * NOTHING is flying, because the sign and the falloff belong to the world, not to
   * the transition, and still have to answer to where the camera is standing.
   * @param dtRaw seconds since the previous frame (clamped inside — a backgrounded
   *              tab must resume, not jump over the move)
   * @param t     scene elapsed time (drives the density breath)
   * @param mix   0 at the home … 1 at the plates
   * @returns true while the director owns the camera
   */
  function update(dtRaw, t, mix) {
    presence = clamp01(mix ?? presence);
    if (!active) {
      // Standing still: the sign is a landmark and the falloff is the weather. Both
      // are simply where the camera is standing.
      applySignOpacity(0);
      spinCloud(t);
      restFog(t); // the falloff follows the camera down the corridor, flight or no flight
      return false;
    }

    // Reduced motion / zero-length run: the caller covers the swap with a dim.
    if (dur === 0) { finish(); return false; }

    const dt = Math.min(Math.max(dtRaw, 0), o.maxDt);
    spinCloud(t);

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
      applyFog(envelope(clamp01(el / dur), o.fogPeakAt, o.fogPower) * fade, t);
      applySignOpacity(withTitle ? ramp(clamp01(el / dur), o.signIn, o.signHold) * fade : 0);
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
      if (slow >= o.lowFpsFrames) {
        stalled = true;
        // This device has shown it cannot hold the frame. Thin the sign's bank to
        // its cheap layout for the rest of the session — fewer grains, never none:
        // a word left with no footing reads as something broken, not as restraint.
        cloud.setCount(o.cloudCountLow);
        skip();
        return true;
      }
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
      camStartFrac = Math.min(0.35, o.camStartSec / Math.max(dur, 0.01));
      return true;
    }

    const e = easeFlight((u - camStartFrac) / (1 - camStartFrac), o.easeTail);
    const param = reverse ? 1 - e : e;
    camera.position.copy(posCurve.getPointAt(param));
    _lastLook.copy(lookCurve.getPointAt(param));
    haveLastLook = true;
    camera.lookAt(_lastLook);

    const env = envelope(u, o.fogPeakAt, o.fogPower);
    applyFog(env, t);

    applySignOpacity(withTitle ? ramp(u, o.signIn, o.signHold) : 0);

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
    cloud.dispose();
    sign.dispose();
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
