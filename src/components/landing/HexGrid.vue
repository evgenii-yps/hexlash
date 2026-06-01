<template>
  <canvas ref="canvasRef" class="hexgrid-canvas"></canvas>
</template>

<script setup>
// HexGrid.vue — animated honeycomb background canvas, ported 1:1 from the
// design reference (hexlash_latest/hexgrid.jsx). Pure-canvas, dpr-aware,
// mouse-reactive. The only addition vs the reference: prefers-reduced-motion
// pauses the rAF loop after painting one static frame (landing acceptance
// criterion — the reference left the canvas running).
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  accent: { type: Array, default: () => [255, 0, 105] },
  intensity: { type: Number, default: 7 },
  shape: { type: String, default: 'shard' },
  paused: { type: Boolean, default: false },
});

const canvasRef = ref(null);
let cleanup = null;

onMounted(() => {
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');

  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // state mirror (reference used a ref object updated each render)
  const stateRef = {
    accent: props.accent,
    intensity: props.intensity,
    shape: props.shape,
    paused: props.paused || reduceMotion,
  };

  let raf,
    W = 0,
    H = 0,
    dpr = 1;
  let cells = [];
  let particles = [];
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
  let t0 = performance.now();

  // hex geometry (flat-top)
  function buildCells() {
    cells = [];
    const s = Math.max(108, W / 9); // center→vertex
    const hStep = s * 1.5; // column spacing
    const vStep = Math.sqrt(3) * s; // row spacing
    const cols = Math.ceil(W / hStep) + 2;
    const rows = Math.ceil(H / vStep) + 2;
    for (let c = -1; c < cols; c++) {
      for (let r = -1; r < rows; r++) {
        const cx = c * hStep;
        const cy = r * vStep + (c % 2 ? vStep / 2 : 0);
        cells.push({
          cx,
          cy,
          seed: Math.random(),
          phase: Math.random() * Math.PI * 2,
          flip: (c + r) % 2 === 0, // triangle orientation
          spin: (Math.random() - 0.5) * 0.4,
          active: Math.random() < 0.06,
        });
      }
    }
    cells.s = s;
  }

  function buildParticles() {
    const n = Math.round(14 + stateRef.intensity * 3);
    particles = [];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.6,
        vy: 0.12 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.18,
        a: 0.1 + Math.random() * 0.4,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    const newW = canvas.clientWidth;
    const newH = canvas.clientHeight;
    // Skip no-op resizes. Mobile browsers fire `resize` on every scroll as the
    // URL bar shows/hides; with the background pinned to 100lvh the canvas client
    // size doesn't actually change, so re-running resize here (which reseeds
    // cells + particles) is exactly what made the background visibly jump while
    // scrolling. Only rebuild on a real size change (genuine resize / rotate).
    if (canvas.width && newW === W && newH === H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = newW;
    H = newH;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildCells();
    buildParticles();
    if (!mouse.active) {
      mouse.x = W * 0.5;
      mouse.y = H * 0.45;
      mouse.tx = mouse.x;
      mouse.ty = mouse.y;
    }
  }

  // draw one cell glyph centered at (cx,cy) with circumradius s.
  // shape ∈ "hex" | "shard" | "triangle" | "ring"
  function cellPath(cx, cy, s, shape, cell) {
    ctx.beginPath();
    if (shape === 'ring') {
      ctx.arc(cx, cy, s * 0.74, 0, Math.PI * 2);
      return;
    }
    let sides, rot, scale;
    if (shape === 'shard') {
      sides = 4;
      rot = -Math.PI / 2;
      scale = 0.96;
    } else if (shape === 'triangle') {
      sides = 3;
      rot = cell && cell.flip ? -Math.PI / 2 : Math.PI / 2;
      scale = 1.05;
    } else {
      sides = 6;
      rot = 0;
      scale = 1;
    }
    const rad = s * scale;
    for (let i = 0; i < sides; i++) {
      const ang = rot + ((Math.PI * 2) / sides) * i;
      const x = cx + rad * Math.cos(ang);
      const y = cy + rad * Math.sin(ang);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function frame(now) {
    const { accent: ac, intensity: inten, shape: shp, paused: isPaused } = stateRef;
    const t = (now - t0) / 1000;
    const I = inten / 10; // 0..1
    const [ar, ag, ab] = ac;
    const s = cells.s;

    // ease mouse toward target (idle drift when inactive)
    if (!mouse.active) {
      mouse.tx = W * 0.5 + Math.cos(t * 0.25) * W * 0.22;
      mouse.ty = H * 0.45 + Math.sin(t * 0.32) * H * 0.16;
    }
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;

    ctx.clearRect(0, 0, W, H);

    // diagonal sweep position (loops across the canvas)
    const sweepPeriod = 7.5;
    const sweepX = ((t % sweepPeriod) / sweepPeriod) * (W + H) - H;
    const sweepHalf = 220 + I * 160;

    const spotR = 300 + I * 140;

    ctx.lineWidth = 1.1;
    ctx.lineJoin = 'round';

    for (let k = 0; k < cells.length; k++) {
      const cell = cells[k];
      const dx = cell.cx - mouse.x;
      const dy = cell.cy - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const spot = Math.max(0, 1 - dist / spotR);

      const proj = cell.cx + cell.cy;
      const sweepD = Math.abs(proj - (sweepX + H));
      const sweep = Math.max(0, 1 - sweepD / sweepHalf) * (0.5 + I * 0.5);

      const pulse = cell.active
        ? (0.5 + 0.5 * Math.sin(t * 1.6 + cell.phase)) * (0.4 + I * 0.6)
        : 0;

      const base = 0.09 + cell.seed * 0.06;
      let alpha = base + spot * 0.55 + sweep * 0.4 + pulse * 0.5;
      alpha = Math.min(0.92, alpha);

      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${alpha})`;
      cellPath(cell.cx, cell.cy, s, shp, cell);
      ctx.stroke();

      const lit = spot * 0.6 + sweep * 0.5 + pulse * 0.5;
      if (lit > 0.45) {
        ctx.fillStyle = `rgba(${ar},${ag},${ab},${(lit - 0.45) * 0.12})`;
        ctx.fill();
      }
    }

    // mouse glow puddle
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, spotR * 0.9);
    g.addColorStop(0, `rgba(${ar},${ag},${ab},${0.1 + I * 0.08})`);
    g.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // particles
    for (const p of particles) {
      p.y -= p.vy * (0.6 + I);
      p.x += p.vx;
      p.tw += 0.04;
      if (p.y < -8) {
        p.y = H + 8;
        p.x = Math.random() * W;
      }
      if (p.x < -8) p.x = W + 8;
      if (p.x > W + 8) p.x = -8;
      const tw = (0.5 + 0.5 * Math.sin(p.tw)) * p.a * (0.5 + I);
      ctx.fillStyle = `rgba(${ar},${ag},${ab},${tw})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    if (!isPaused) raf = requestAnimationFrame(frame);
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.tx = e.clientX - rect.left;
    mouse.ty = e.clientY - rect.top;
    mouse.active = true;
  }
  function onLeave() {
    mouse.active = false;
  }

  resize();
  frame(performance.now()); // paint one frame immediately
  if (!stateRef.paused) raf = requestAnimationFrame(frame);
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerleave', onLeave);

  cleanup = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerleave', onLeave);
  };
});

onBeforeUnmount(() => {
  if (cleanup) cleanup();
});
</script>

<style scoped>
/* Canvas positioning (was .lp .hexgrid-canvas in landing.css; moved here so the
   component is self-contained and usable outside the .lp root, e.g. auth). */
.hexgrid-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>

