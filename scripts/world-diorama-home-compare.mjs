// world-diorama-home-compare.mjs — подтверждение «живой дом не изменился» (ТЗ 13.10.2026, п.5).
// Снимает настоящий /play/home с одним и тем же сейфом на ДВУХ сборках: до (main) и после (ветка).
//   BEFORE=http://127.0.0.1:4180 AFTER=http://127.0.0.1:4181 OUT=docs/world-diorama/home node scripts/world-diorama-home-compare.mjs
// Дом живой (бойцы ходят), поэтому сверка идёт не побайтно, а по тому, что объективно должно
// совпасть: те же тела на тех же местах, тот же состав и подписи, те же вызовы отрисовки / треугольники.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BEFORE = process.env.BEFORE, AFTER = process.env.AFTER;
const OUT = process.env.OUT || 'docs/world-diorama/home';
mkdirSync(OUT, { recursive: true });
const CORES = ['natisk', 'skala', 'zasada', 'nalet'];
const now = Date.now();
const snap = { v: 1, roster: { fighters: Array.from({ length: 6 }, (_, i) => ({
  id: 'f' + i, callsign: 'TEST-' + i, core: CORES[i % 4], createdAt: 1000 + i, ...([1, 4].includes(i) ? { tr: now + 3600_000 } : {}),
})), seeded: true, picked: 'f0' } };

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
async function shoot(base, tag, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.getItem('__seeded')) { sessionStorage.setItem('hexlash_progress', JSON.stringify(s)); sessionStorage.setItem('__seeded', '1'); }
  }, snap);
  const p = await ctx.newPage();
  await p.goto(`${base}/play/home?dev=1`, { waitUntil: 'commit', timeout: 60000 });
  await p.waitForFunction(() => window.__homeProbe && window.__homeProbe(), null, { timeout: 90000 });
  await p.waitForTimeout(9000);
  await p.screenshot({ path: `${OUT}/${tag}-${w}x${h}.png` });
  const pr = await p.evaluate(() => { const r = window.__homeProbe(); return { bodies: r.bodies.map((b) => ({ slot: b.slot, id: b.id, state: b.state, bag: b.bag })), bags: r.bags, calls: r.calls, tris: r.tris, geometries: r.geometries, textures: r.textures }; });
  await ctx.close();
  return pr;
}
let bad = 0;
for (const [w, h] of [[390, 844], [1280, 720]]) {
  const a = await shoot(BEFORE, 'before', w, h);
  const b = await shoot(AFTER, 'after', w, h);
  const same = JSON.stringify(a.bodies) === JSON.stringify(b.bodies) && JSON.stringify(a.bags) === JSON.stringify(b.bags);
  const drawSame = a.calls === b.calls && a.tris === b.tris && a.geometries === b.geometries && a.textures === b.textures;
  console.log(`${w}x${h}: состав/места/груши ${same ? 'совпали' : 'РАЗОШЛИСЬ'}; вызовы ${a.calls}→${b.calls}, треугольники ${a.tris}→${b.tris}, геометрий ${a.geometries}→${b.geometries}, текстур ${a.textures}→${b.textures} ${drawSame ? '(те же)' : '(РАЗНЫЕ)'}`);
  if (!same || !drawSame) bad++;
}
await browser.close();
process.exit(bad ? 1 : 0);
