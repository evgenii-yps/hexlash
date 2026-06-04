// Brand favicon generator — renders the Hexlash hex-mark (the inline .hxl-mark
// geometry from index.html: outer hex + inner hex + Y-lash) onto a dark rounded
// tile, monochrome (no pink, no glow, per the logo rules). Pure-JS raster via
// pngjs (no sharp / SVG rasterizer in this env) with 4×4 supersampled AA.
//
// Run: node scripts/gen-favicons.mjs   → writes PNGs into /public.
// favicon.svg is authored by hand (kept full-detail); see /public/favicon.svg.
import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const BG = [0x08, 0x08, 0x0a]; // tile #08080A
const FG = [0xf6, 0xf4, 0xf6]; // mark #F6F4F6
const TILE_R = 9; // corner radius in the 48-unit design space

// Mark geometry in 48-space — the index.html .hxl-mark scaled 0.8 about the
// centre (24,24) so it sits inside the tile with even padding.
const OUTER = [[24, 7.2], [38, 15.2], [38, 32.8], [24, 40.8], [10, 32.8], [10, 15.2]];
const INNER = [[24, 15.2], [31.2, 19.6], [31.2, 28.4], [24, 32.8], [16.8, 28.4], [16.8, 19.6]];
const YLASH = [[[24, 15.2], [24, 24]], [[24, 24], [31.2, 19.6]], [[24, 24], [16.8, 28.4]]];

const edges = (poly) => poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);

function distSeg(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Signed distance to the rounded tile (centred 0..48 box). <0 = inside.
function tileSDF(px, py) {
  const qx = Math.abs(px - 24) - (24 - TILE_R);
  const qy = Math.abs(py - 24) - (24 - TILE_R);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - TILE_R;
}

function render(size, { inner, sw }) {
  const png = new PNG({ width: size, height: size });
  const scale = size / 48;
  const half = sw / 2;
  const segs = [...edges(OUTER), ...(inner ? edges(INNER) : []), ...YLASH];
  const SS = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (px + (sx + 0.5) / SS) / scale;
          const uy = (py + (sy + 0.5) / SS) / scale;
          let md = Infinity;
          for (const s of segs) { const d = distSeg(ux, uy, s[0], s[1]); if (d < md) md = d; }
          let col, al;
          if (md <= half) { col = FG; al = 255; }
          else if (tileSDF(ux, uy) <= 0) { col = BG; al = 255; }
          else { col = [0, 0, 0]; al = 0; }
          r += col[0] * al; g += col[1] * al; b += col[2] * al; a += al;
        }
      }
      const n = SS * SS;
      const idx = (py * size + px) << 2;
      png.data[idx] = a ? Math.round(r / a) : 0;
      png.data[idx + 1] = a ? Math.round(g / a) : 0;
      png.data[idx + 2] = a ? Math.round(b / a) : 0;
      png.data[idx + 3] = Math.round(a / n);
    }
  }
  return png;
}

// size, options. Small sizes drop the inner hex (outer hex + Y-lash only) and
// use a heavier stroke so they don't go muddy at 16px.
const TARGETS = [
  ['favicon-16.png', 16, { inner: false, sw: 4.0 }],
  ['favicon-32.png', 32, { inner: true, sw: 3.0 }],
  ['apple-touch-icon.png', 180, { inner: true, sw: 2.6 }],
  ['icon-192.png', 192, { inner: true, sw: 2.6 }],
  ['icon-512.png', 512, { inner: true, sw: 2.4 }],
];

for (const [name, size, opts] of TARGETS) {
  const png = render(size, opts);
  writeFileSync(join(OUT, name), PNG.sync.write(png));
  console.log(`wrote ${name} (${size}×${size})`);
}
