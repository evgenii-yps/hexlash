// crystal-counter-pairs.mjs — пары «до / после» и счёт розовых пикселей во вспышке.
// Читает снимки из crystal-counter-shots.mjs; PNG разбирает сам браузер (canvas) —
// лишних библиотек в проекте нет. Запуск: node scripts/crystal-counter-pairs.mjs
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = createRequire(process.env.PW_ROOT || '/opt/node22/lib/node_modules/')('playwright');
const DIR = process.env.DIR || 'docs/crystal-counter/shots';
const OUT = process.env.OUT || 'docs/crystal-counter/pairs';
mkdirSync(OUT, { recursive: true });
const b64 = (f) => readFileSync(`${DIR}/${f}`).toString('base64');
const names = readdirSync(DIR).filter((f) => f.startsWith('after-') && f.endsWith('.png') && !f.includes('-6-flash'));
const flash = readdirSync(DIR).filter((f) => f.startsWith('after-m-6-flash') && f.endsWith('.png'));

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent('<canvas id=c></canvas>');

// Пара: слева «до», справа «после». Для снимков без «до» (другие ядра) — одиночный кадр.
const pairs = {};
for (const a of names) {
  const bname = a.replace('after-', 'before-');
  const hasBefore = readdirSync(DIR).includes(bname);
  const data = await page.evaluate(async ({ a64, b64 }) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const A = await load(a64); const B = b64 ? await load(b64) : null;
    const pad = 16; const top = 28;
    const c = document.getElementById('c');
    c.width = A.width * (B ? 2 : 1) + pad * (B ? 3 : 2); c.height = A.height + top + pad;
    const g = c.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#ddd'; g.font = '16px monospace';
    let x = pad;
    if (B) { g.fillText('ДО', x, 20); g.drawImage(B, x, top); x += B.width + pad; }
    g.fillText('ПОСЛЕ', x, 20); g.drawImage(A, x, top);
    return c.toDataURL('image/png').split(',')[1];
  }, { a64: b64(a), b64: hasBefore ? b64(bname) : null });
  const out = `${OUT}/${a.replace('after-', 'pair-')}`;
  writeFileSync(out, Buffer.from(data, 'base64'));
  pairs[a] = hasBefore;
}

// Розовые пиксели: расстояние до #FF0069 в RGB не больше 60.
const PINK = [255, 0, 105];
const lines = [];
for (const f of flash) {
  const n = await page.evaluate(async ({ s, PINK }) => {
    const i = await new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + s; });
    const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
    const g = c.getContext('2d'); g.drawImage(i, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data; let k = 0;
    for (let p = 0; p < d.length; p += 4) if (Math.hypot(d[p] - PINK[0], d[p + 1] - PINK[1], d[p + 2] - PINK[2]) <= 60) k++;
    return k;
  }, { s: b64(f), PINK });
  lines.push(`${f}: розовых пикселей ${n}`);
}
writeFileSync(`${OUT}/pink-count.txt`, lines.join('\n') + '\n');
console.log(lines.join('\n'));
console.log(`пар: ${Object.values(pairs).filter(Boolean).length}, одиночных: ${Object.values(pairs).filter((v) => !v).length}`);
await browser.close();
