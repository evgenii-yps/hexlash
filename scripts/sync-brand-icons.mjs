// Brand icon sync — copies the mark's shipped icon renders from the design handoff
// into /public under the filenames the app links to, and rebuilds favicon.ico.
//
// This REPLACES the old gen-favicons.mjs, which drew the mark itself from a
// hand-copied set of stroke coordinates. That copy is exactly how the project
// ended up shipping TWO different marks at once: the app's mark was replaced at
// some point and the generator's coordinates were not, so the browser tab and the
// game showed different logos for months without anyone editing either on purpose.
// There is no second copy of the geometry here — the handoff is the only source.
//
// Run: node scripts/sync-brand-icons.mjs
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/design-handoff/hexlash_mark/assets');
const OUT = join(ROOT, 'public');

// Tab and app icons all use the TILED renders: the mark is #F6F4F6, so a
// transparent version disappears against a light browser chrome or launcher.
// Each size takes the drawing made for it — 16 is the micro drawing (redrawn on a
// 16x16 pixel grid), 32 and up are compact/full. Never one scaled into another.
const COPY = [
  ['mark-16-tile.png', 'favicon-16.png'],
  ['mark-32-tile.png', 'favicon-32.png'],
  ['mark-180-tile.png', 'apple-touch-icon.png'],
  ['mark-192-tile.png', 'icon-192.png'],
  ['mark-512-tile.png', 'icon-512.png'],
  ['icon-maskable-512.png', 'icon-maskable-512.png'],
];

for (const [from, to] of COPY) {
  copyFileSync(join(SRC, from), join(OUT, to));
  console.log(`copied ${from} -> public/${to}`);
}

// favicon.ico — 16px (micro drawing) + 32px (compact). PNG-in-ICO, which every
// browser still in use reads, and which keeps each size on its own drawing.
const parts = [
  [16, readFileSync(join(SRC, 'mark-16-tile.png'))],
  [32, readFileSync(join(SRC, 'mark-32-tile.png'))],
];
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

// favicon.svg is authored by hand (tile + the compact drawing) — see the file.
