// Brand asset sync — copies the mark's shipped renders from the design handoff into
// /public under the names the app links to, and rebuilds favicon.ico.
//
// This script COPIES. It does not draw. That distinction is the whole reason it
// exists: its predecessor (gen-favicons.mjs) drew the mark itself from a hand-copied
// set of stroke coordinates, and that copy is exactly how the project ended up
// shipping TWO different marks at once — the app's mark was replaced at some point
// and the generator's coordinates were not, so the browser tab and the game showed
// different logos for months without anyone editing either on purpose. There is no
// second copy of the mark here; the handoff is the only source.
//
// Run: node scripts/sync-brand-icons.mjs
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/design-handoff/hexlash_mark/brand');
const OUT = join(ROOT, 'public');

// ── The mark, for layout ──────────────────────────────────────────────────────
// Transparent, because these land on backgrounds that are nowhere flat #08080A:
// the landing nav, both loading screens, 404, auth. Served from /public rather than
// bundled so index.html's first-paint splash — which cannot reach into the bundle —
// points at the same files as the app does.
const MARKS = [
  'mark-full-512.png',
  'mark-full-256.png',
  'mark-full-128.png',
  'mark-micro-64.png',
  'mark-micro-32.png',
];

mkdirSync(join(OUT, 'brand'), { recursive: true });
for (const name of MARKS) {
  copyFileSync(join(SRC, name), join(OUT, 'brand', name));
  console.log(`copied ${name} -> public/brand/${name}`);
}

// ── Icons and link preview ────────────────────────────────────────────────────
// Tab and app icons take the TILED renders — the mark is nearly white, so a
// transparent version disappears against a light browser chrome or launcher. Each
// size takes the drawing made for it; never one scaled into another.
const COPY = [
  ['favicon-16.png', 'favicon-16.png'],
  ['favicon-32.png', 'favicon-32.png'],
  ['apple-touch-icon-180.png', 'apple-touch-icon.png'],
  ['icon-192.png', 'icon-192.png'],
  ['icon-512.png', 'icon-512.png'],
  ['icon-maskable-512.png', 'icon-maskable-512.png'],
  ['og-image-1200x630.png', 'og-image.png'],
];

for (const [from, to] of COPY) {
  copyFileSync(join(SRC, from), join(OUT, to));
  console.log(`copied ${from} -> public/${to}`);
}

// favicon.ico — 16 + 32 + 48, each from its own render. PNG-in-ICO, which every
// browser still in use reads. There is no favicon.svg: this pack ships no vector,
// and a hand-authored SVG here would be a second copy of the mark — the exact thing
// that caused the two-logo incident. It was deleted with this change.
const parts = [16, 32, 48].map((size) => [size, readFileSync(join(SRC, `favicon-${size}.png`))]);

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);            // reserved
header.writeUInt16LE(1, 2);            // type 1 = icon
header.writeUInt16LE(parts.length, 4);

let offset = 6 + 16 * parts.length;
const dir = [];
for (const [size, png] of parts) {
  const e = Buffer.alloc(16);
  e.writeUInt8(size % 256, 0);         // width  (0 means 256)
  e.writeUInt8(size % 256, 1);         // height
  e.writeUInt8(0, 2);                  // palette colours
  e.writeUInt8(0, 3);                  // reserved
  e.writeUInt16LE(1, 4);               // colour planes
  e.writeUInt16LE(32, 6);              // bits per pixel
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  dir.push(e);
  offset += png.length;
}
writeFileSync(join(OUT, 'favicon.ico'), Buffer.concat([header, ...dir, ...parts.map(([, p]) => p)]));
console.log(`wrote public/favicon.ico (${parts.map(([s]) => s + 'px').join(' + ')})`);
