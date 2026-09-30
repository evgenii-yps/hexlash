// forge-scale-pairs.mjs — пары «до / после» и лист «все 15 кристаллов» (ТЗ 30.09.2026, v3).
// «До» — кадры base-* (состояние ветки 9cb310b8), «после» — after3-*. PNG разбирает браузер.
//   node scripts/forge-scale-pairs.mjs
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = createRequire(process.env.PW_ROOT || '/opt/node22/lib/node_modules/')('playwright');
const DIR = 'docs/forge-type-scale/shots', OUT = 'docs/forge-type-scale/pairs';
mkdirSync(OUT, { recursive: true });
const files = readdirSync(DIR);
const b64 = (f) => readFileSync(`${DIR}/${f}`).toString('base64');
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent('<canvas id=c></canvas>');
const save = (name, data) => writeFileSync(`${OUT}/${name}`, Buffer.from(data, 'base64'));

// Пары: есть base-X и after3-X.
for (const a of files.filter((f) => f.startsWith('after3-') && !f.includes('-7-all-') && f.endsWith('.png'))) {
  const base = a.replace('after3-', 'base-');
  const has = files.includes(base);
  const data = await page.evaluate(async ({ A, B }) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const a = await load(A); const b = B ? await load(B) : null; const pad = 16, top = 28;
    const c = document.getElementById('c'); c.width = a.width * (b ? 2 : 1) + pad * (b ? 3 : 2); c.height = a.height + top + pad;
    const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#ddd'; g.font = '16px monospace';
    let x = pad; if (b) { g.fillText('ДО (9cb310b8)', x, 20); g.drawImage(b, x, top); x += b.width + pad; }
    g.fillText('ПОСЛЕ', x, 20); g.drawImage(a, x, top); return c.toDataURL('image/png').split(',')[1];
  }, { A: b64(a), B: has ? b64(base) : null });
  save(a.replace('after3-', 'pair-'), data);
}

// Лист всех 15: сетка 5×3 (колонка — кристалл шага 1..5, ряд — грань), кадры целиком, уменьшенные.
for (const tag of ['m', 'l']) {
  const names = [...'abc'].flatMap((f) => [0, 1, 2, 3, 4].map((c) => `after3-${tag}-7-all-${f}${c}.png`)).filter((n) => files.includes(n));
  if (!names.length) continue;
  const data = await page.evaluate(async ({ imgs, tag }) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const im = await Promise.all(imgs.map(load));
    const cols = 5, sc = tag === 'm' ? 0.5 : 0.42; const w = Math.round(im[0].width * sc), h = Math.round(im[0].height * sc), pad = 8;
    const c = document.getElementById('c'); c.width = cols * (w + pad) + pad; c.height = Math.ceil(im.length / cols) * (h + pad) + pad;
    const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
    im.forEach((i, k) => g.drawImage(i, pad + (k % cols) * (w + pad), pad + Math.floor(k / cols) * (h + pad), w, h));
    return c.toDataURL('image/png').split(',')[1];
  }, { imgs: names.map(b64), tag });
  save(`sheet-${tag}-all15.png`, data);
}
await browser.close();
