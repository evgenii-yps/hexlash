// world-diorama-e2e.mjs — приёмка пробы «живой мир» на /dev/world (ТЗ 13.10.2026).
//
//   BASE=http://127.0.0.1:4173 OUT=docs/world-diorama/shots node scripts/world-diorama-e2e.mjs
//
// Что доказывается (всё на настоящем доме, мир подключён снаружи):
//   1. снимки 390×844 и 1280×720 — все слои включены / все выключены;
//   2. ракурсы с наклоном к горизонту: видны звёзды, облака, дальние острова;
//   3. рябь: тап по воде → три кадра подряд; тап по острову и по бойцу ряби НЕ пускает;
//      25 быстрых тапов → одновременно живёт не больше 20 колец;
//   4. «уменьшить движение»: вода и облака стоят, рябь не запускается;
//   5. время кадра: без мира / каждый слой отдельно / все слои (+ 20 колец в воздухе);
//   6. сейф игрока (localStorage / sessionStorage) до и после захода — тот же.
//
// ⚠️ ВРЕМЯ КАДРА СНИМАЕТСЯ В ПРОГРАММНОМ РЕНДЕРЕ (swiftshader, процессор вместо
//    видеокарты). Абсолютные миллисекунды не телефонные: сравнивать можно слои между
//    собой и с «без мира». Реальную цену на телефоне даёт строка КАДР на самой странице
//    (мерит то же самое, с gl.finish(), на железе владельца).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = process.env.OUT || 'docs/world-diorama/shots';
const URL = `${BASE}/dev/world?dev=1`;
mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};
const NOISE = /TUNNEL|CERT_AUTHORITY|Amplitude|Failed to load resource/;
const pageErrors = [];

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

async function open({ w, h, dsf = 1, reduce = false }) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: dsf,
    reducedMotion: reduce ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) pageErrors.push(m.text().slice(0, 200)); });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__worldProbe && window.__worldProbe.world, null, { timeout: 90000 });
  await page.waitForTimeout(4500); // стоит на месте: экран загрузки ушёл, бойцы разошлись по местам
  return { ctx, page };
}

const setLayers = (page, m) => page.evaluate((x) => window.__worldProbe.setLayers(x), m);
const ALL = { sea: true, ripple: true, clouds: true, stars: true, islands: true };
const NONE = { sea: false, ripple: false, clouds: false, stars: false, islands: false };

async function drag(page, w, h, dx, dy) {
  const cx = w / 2, cy = h / 2;
  await page.mouse.move(cx, cy); await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(cx + (dx * i) / 12, cy + (dy * i) / 12);
  await page.mouse.up(); await page.waitForTimeout(2200);
}

// ───────────── 6. сейф до ─────────────
const storage = (page) => page.evaluate(() => JSON.stringify({ l: { ...localStorage }, s: { ...sessionStorage } }));

// ───────────── 1–2. снимки ─────────────
console.log('\n[1–2] снимки');
for (const [w, h, tag] of [[390, 844, 'portrait'], [1280, 720, 'desktop']]) {
  const { ctx, page } = await open({ w, h });
  const before = await storage(page);
  await page.screenshot({ path: `${OUT}/${tag}-all-on.png` });
  await setLayers(page, NONE); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${tag}-all-off.png` });
  await setLayers(page, ALL); await page.waitForTimeout(800);
  ok(true, `${tag}: снимки «все слои» / «все выключены»`);
  if (tag === 'portrait') {
    // наклон к горизонту, поворот, отъезд — видны звёзды, облака, острова
    await drag(page, w, h, 0, -260); await page.screenshot({ path: `${OUT}/portrait-tilt.png` });
    await drag(page, w, h, 160, 0);  await page.screenshot({ path: `${OUT}/portrait-turn.png` });
    await page.mouse.wheel(0, 600); await page.waitForTimeout(2200);
    await page.screenshot({ path: `${OUT}/portrait-zoomout.png` });
    // слои по отдельности в том же ракурсе (для сверки, что именно рисует каждый)
    for (const only of ['sea', 'clouds', 'stars', 'islands']) {
      await setLayers(page, { ...NONE, [only]: true }); await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/portrait-solo-${only}.png` });
    }
  }
  const after = await storage(page);
  // сейф: страница ничего не пишет сверх того, что дом и бутстрап пишут сами при загрузке
  // (сравнение — между началом и концом сеанса на этой странице)
  ok(before === after, `${tag}: хранилище браузера не менялось за сеанс`);
  await ctx.close();
}

// ───────────── 3. рябь ─────────────
console.log('\n[3] рябь по тапу');
{
  const { ctx, page } = await open({ w: 390, h: 844 });
  await setLayers(page, ALL);
  const WATER = [60, 790];   // нижний левый угол: вода под островом
  const ISLAND = [200, 640]; // плита
  const FIGHTER = [292, 470]; // боец справа
  const count = () => page.evaluate(() => window.__worldProbe.world.rippleCount);
  const last = () => page.evaluate(() => ({ ...window.__worldProbe.world.lastTap }));

  await page.mouse.click(...ISLAND); await page.waitForTimeout(200);
  ok((await count()) === 0, 'тап по острову ряби не пускает', JSON.stringify(await last()));
  await page.mouse.click(...FIGHTER); await page.waitForTimeout(200);
  ok((await count()) === 0, 'тап по бойцу ряби не пускает', JSON.stringify(await last()));

  await page.mouse.click(...WATER);
  const t0 = Date.now();
  await page.waitForTimeout(150);
  ok((await count()) === 1, 'тап по воде пускает кольцо', JSON.stringify(await last()));
  // три кадра подряд
  const shots = [[0.4, 'a'], [1.6, 'b'], [3.2, 'c']];
  for (const [at, tag] of shots) {
    const wait = at * 1000 - (Date.now() - t0);
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `${OUT}/ripple-${tag}.png` });
  }
  // затухание за ~5–6 с
  await page.waitForTimeout(3000);
  ok((await count()) === 0, 'через ~6 с кольцо погасло и вытеснено из списка');

  // перетаскивание (поворот камеры) ряби не даёт
  await page.mouse.move(60, 790); await page.mouse.down(); await page.mouse.move(120, 790, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(200);
  ok((await count()) === 0, 'поворот камеры пальцем не даёт ряби');

  // потолок 20
  for (let i = 0; i < 25; i++) { await page.mouse.click(40 + (i % 5) * 20, 740 + Math.floor(i / 5) * 18); await page.waitForTimeout(40); }
  const n = await count();
  ok(n <= 20 && n >= 15, `25 быстрых тапов → колец одновременно ${n} (потолок 20)`);

  // слой «рябь» выключен — рябь не пускается
  await page.waitForTimeout(6500);
  await setLayers(page, { ...ALL, ripple: false });
  await page.mouse.click(...WATER); await page.waitForTimeout(200);
  ok((await count()) === 0, 'переключатель РЯБЬ выключен → кольцо не пускается');
  await ctx.close();
}

// ───────────── 4. уменьшенное движение ─────────────
console.log('\n[4] prefers-reduced-motion');
{
  const { ctx, page } = await open({ w: 390, h: 844, reduce: true });
  await setLayers(page, { ...NONE, sea: true, clouds: true }); await page.waitForTimeout(1000);
  const crop = { x: 0, y: 700, width: 390, height: 144 }; // нижний край — только вода
  const a = await page.screenshot({ clip: crop });
  await page.waitForTimeout(2500);
  const b = await page.screenshot({ clip: crop });
  ok(Buffer.compare(a, b) === 0, 'вода стоит (два кадра с разницей 2.5 с побайтно равны)');
  await setLayers(page, ALL);
  await page.mouse.click(60, 790); await page.waitForTimeout(200);
  ok((await page.evaluate(() => window.__worldProbe.world.rippleCount)) === 0, 'рябь по тапу не запускается');
  await ctx.close();
}

// ───────────── 5. время кадра ─────────────
console.log('\n[5] время кадра (программный рендер — сравнивать слои между собой)');
const COSTS = [];
for (const dsf of [1, 2]) {
  const { ctx, page } = await open({ w: 390, h: 844, dsf });
  const N = dsf === 1 ? 120 : 60;
  const rows = [
    ['без мира', NONE],
    ['только море', { ...NONE, sea: true }],
    ['только облака', { ...NONE, clouds: true }],
    ['только звёзды', { ...NONE, stars: true }],
    ['только острова', { ...NONE, islands: true }],
    ['все слои', ALL],
  ];
  // повторяем «без мира» в конце: дрейф самого дома (бойцы ходят) виден по разнице двух строк
  rows.push(['без мира (повтор)', NONE]);
  for (const [name, m] of rows) {
    await setLayers(page, m); await page.waitForTimeout(1200);
    const r = await page.evaluate((n) => window.__worldProbe.measure(n), N);
    COSTS.push({ dsf, name, ...r });
    console.log(`  dpr${dsf}  ${name.padEnd(20)} медиана ${String(r.median).padStart(6)} мс  p90 ${String(r.p90).padStart(6)}  интервал ${r.interval}`);
  }
  // все слои + 20 колец в воздухе
  await setLayers(page, ALL);
  await page.evaluate(() => { const w = window.__worldProbe.world; for (let i = 0; i < 20; i++) w.rippleAt(-8 + i * 0.7, 6 + (i % 4)); });
  const r = await page.evaluate((n) => window.__worldProbe.measure(n), Math.min(N, 40));
  COSTS.push({ dsf, name: 'все слои + 20 колец', ...r });
  console.log(`  dpr${dsf}  ${'все слои + 20 колец'.padEnd(20)} медиана ${String(r.median).padStart(6)} мс  p90 ${String(r.p90).padStart(6)}`);
  const stats = await page.evaluate(() => window.__worldProbe.world.stats());
  COSTS.push({ dsf, name: 'треугольники', ...stats });
  await ctx.close();
}
writeFileSync(`${OUT}/frame-costs.json`, JSON.stringify(COSTS, null, 2));

ok(pageErrors.length === 0, 'ошибок страницы нет', pageErrors.slice(0, 3).join(' | '));
await browser.close();
console.log(failed ? `\nПРОВАЛОВ: ${failed}` : '\nВСЁ СОШЛОСЬ');
process.exit(failed ? 1 : 0);
