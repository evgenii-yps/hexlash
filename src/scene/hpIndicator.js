// Over-head HP indicator — a matte billboard plate (Hexlash HP-indicator handoff).
//   • Numeral = PERCENT of HP remaining: round(hp/maxHp*100). The main load,
//     top row, right-aligned. ABOVE the bar, not inside it.
//   • Side tag YOU / FOE, top row left-aligned — a text backup of the
//     player/enemy split (colour-blind safety).
//   • Bar = 10 discrete 10% segments. Filled = accent, empty = channel #1D1A1F.
//     Segments empty RIGHT→LEFT in 10% steps (no smooth drain inside a segment).
//     1px gutters between segments + a 1px hairline frame around the bar.
//   • States (derived from the percent):
//       FULL 100→61 / MID 60→31 — same logic, NO colour change.
//       CRIT ≤20 (and >0) — a left notch: 2px-ish vertical stroke in the fill
//         colour, taller than the bar, flush left. No blink/pulse/glow.
//       DEAD 0 — all segments empty, frame stays, numeral "0" readable. The
//         caller holds the plate ~1s then removes it (no KO text — separate FX).
//   • Player vs enemy differ by BRIGHTNESS ONLY — a different fill COLOUR
//     (#FF0069 / #7A0033) + bone/ash numeral, NEVER opacity over one colour.
//   • Matte: no glow/bloom (toneMapped:false, fog:false, depthTest:false),
//     renderOrder above the arena (under a future FX overlay). Billboard via a
//     Sprite — world-space auto-facing, robust even though the fighter group
//     yaws to face the foe each frame (a raw PlaneGeometry child would tilt).
//     Bottom-centre pivot (center=(0.5,0)) anchors it at a point over the head.
//
// render(pct) is the SEPARATE draw function — the caller redraws ONLY when the
// rounded percent changes (never per frame / per raw-HP tick). billboard(cam,
// parentScaleX) holds a near-constant on-screen size. All knobs in HP_UI / VARIANTS.
import * as THREE from 'three';

// --- Tunable knobs (one place). The canvas is the design plate; the world size
//     is set per frame by billboard() to hold a constant on-screen size.
const HP_UI = {
  canvasW: 256, canvasH: 64, // CanvasTexture resolution (handoff target)
  padX: 8, // inner side margin (canvas px)
  barH: 14, barBottomGap: 6, // bar height + gap from the canvas bottom
  segGutter: 1, // gap between the 10 segments
  rowGap: 7, // gap between the numeral row and the bar
  numeralPx: 38, // Saira Condensed 900 numeral size (canvas px) — the main load
  tagPx: 15, // JetBrains Mono side-tag size (canvas px)
  tagTrackEm: 0.22, // side-tag letter-spacing (.22em)
  critPct: 20, // ≤ this (and > 0) → CRIT notch
  notchW: 3, notchOverhang: 4, // notch width + how far it juts above/below the frame
  // World sizing (constant on-screen): worldH = clamp(viewH*screenH, min, max).
  screenH: 0.03, // plate world HEIGHT as a fraction of the viewport height
  minWorldH: 0.2, // clamp floor (close camera)
  maxWorldH: 0.4, // clamp ceiling (far camera)
  anchorY: 2.05, // bottom-pivot height above the fighter origin (×group scale) — over the head
};

// Player vs enemy: different fill COLOUR (not opacity) + bone/ash numeral & tag.
const VARIANTS = {
  player: { fill: '#FF0069', empty: '#1D1A1F', stroke: 'rgba(255,255,255,0.10)', numeral: '#F6F4F6', tag: 'YOU', tagColor: '#F6F4F6' },
  enemy: { fill: '#7A0033', empty: '#1D1A1F', stroke: 'rgba(255,255,255,0.05)', numeral: '#7E7A82', tag: 'FOE', tagColor: '#7E7A82' },
};

export function createHpIndicator(side = 'player') {
  const v = side === 'player' ? VARIANTS.player : VARIANTS.enemy;
  const W = HP_UI.canvasW, H = HP_UI.canvasH;
  const aspect = W / H;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter; // smooth at this small on-screen size (nearest would shimmer)
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false, // always reads over the arena
    depthWrite: false,
    toneMapped: false, // excluded from tone-map / bloom — matte, no glow
    fog: false,
  });
  const mesh = new THREE.Sprite(mat);
  mesh.center.set(0.5, 0); // bottom-centre pivot — anchors at a point over the head
  mesh.position.set(0, HP_UI.anchorY, 0);
  mesh.renderOrder = 30; // above the arena, under a (future) FX overlay
  mesh.scale.set(HP_UI.minWorldH * aspect, HP_UI.minWorldH, 1); // sane until first billboard()

  // Bar geometry in canvas px.
  const barX = HP_UI.padX;
  const barW = W - HP_UI.padX * 2;
  const barBottom = H - HP_UI.barBottomGap;
  const barTop = barBottom - HP_UI.barH;
  const seg = (barW - HP_UI.segGutter * 9) / 10; // 10 segments, 9 gutters

  let lastP = -1;
  // render(pct) — pct is an integer percent 0..100; the state is derived from it.
  const render = (pct) => {
    const p = Math.max(0, Math.min(100, Math.round(pct)));
    lastP = p;
    const filled = Math.max(0, Math.min(10, Math.ceil(p / 10))); // segments light right→left
    ctx.clearRect(0, 0, W, H);
    // --- Bar: 10 discrete segments (filled = accent, empty = channel #1D1A1F).
    for (let i = 0; i < 10; i++) {
      const x = barX + i * (seg + HP_UI.segGutter);
      ctx.fillStyle = i < filled ? v.fill : v.empty;
      ctx.fillRect(x, barTop, seg, HP_UI.barH);
    }
    // --- CRIT notch (≤20% and still alive) — a flush-left vertical stroke in the
    //     fill colour, taller than the bar. No blink, no pulse, no glow.
    if (p > 0 && p <= HP_UI.critPct) {
      ctx.fillStyle = v.fill;
      ctx.fillRect(barX, barTop - HP_UI.notchOverhang, HP_UI.notchW, HP_UI.barH + HP_UI.notchOverhang * 2);
    }
    // --- Hairline frame around the bar (matte).
    ctx.strokeStyle = v.stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX + 0.5, barTop + 0.5, barW - 1, HP_UI.barH - 1);
    // --- Numeral (percent) — Saira Condensed 900, right-aligned, ABOVE the bar.
    const baseline = barTop - HP_UI.rowGap;
    ctx.fillStyle = v.numeral;
    ctx.font = `900 ${HP_UI.numeralPx}px "Saira Condensed", "Arial Narrow", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.fillText(String(p), W - HP_UI.padX, baseline);
    // --- Side tag YOU / FOE — JetBrains Mono, left-aligned, tracked.
    ctx.fillStyle = v.tagColor;
    ctx.font = `700 ${HP_UI.tagPx}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'left';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${HP_UI.tagTrackEm * HP_UI.tagPx}px`;
    ctx.fillText(v.tag, HP_UI.padX, baseline);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    tex.needsUpdate = true;
  };

  // The bundled fonts load with display=swap, so the first paint may use the
  // fallback — redraw the current value once they're ready (best-effort).
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { if (lastP >= 0) render(lastP); }).catch(() => {});
  }

  // billboard(cam, parentScaleX) — hold a near-constant on-screen size. The Sprite
  // already faces the camera in world space; this only re-scales for distance.
  // Divide by the fighter group's scale so the on-screen size is independent of it.
  const _wp = new THREE.Vector3();
  const billboard = (cam, parentScaleX = 1) => {
    if (!cam || !cam.isPerspectiveCamera || !mesh.visible) return;
    mesh.getWorldPosition(_wp);
    const dist = cam.position.distanceTo(_wp);
    const viewH = 2 * dist * Math.tan((cam.fov * Math.PI / 180) / 2); // world height the viewport spans at dist
    const worldH = THREE.MathUtils.clamp(viewH * HP_UI.screenH, HP_UI.minWorldH, HP_UI.maxWorldH);
    const local = worldH / (parentScaleX || 1);
    mesh.scale.set(local * aspect, local, 1);
  };

  return { mesh, render, billboard };
}
