// buffs-modes-e2e.mjs — ОСТАЛЬНЫЕ РЕЖИМЫ, ГРАНИ КУБИКА, БОТ И ЦЕНА КАДРА.
//
// Соседний buffs-e2e.mjs проверяет сам поток баффов в дуэли. Здесь — то, что
// вокруг: что пять других режимов не сломались, что все шесть граней кубика
// доезжают до значка, что бот бросает свои и что кадр не подешевел.
//
//   node scripts/buffs-modes-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/buffs-shots';
mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const seed = (mode, n) => page.evaluate(({ mode, n }) => {
  const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
  const list = raw?.roster?.fighters || [];
  raw.prefight = { core: list[0].core, squad: list.slice(0, n).map((f) => f.id), mode, n };
  sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  return list.length;
}, { mode, n });

await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

console.log('\n── ПЯТЬ ОСТАЛЬНЫХ РЕЖИМОВ: НИЧЕГО НЕ СЛОМАЛОСЬ ───────────');
for (const [mode, n] of [['duel', 1], ['squad', 2], ['chain', 1], ['raid', 1], ['collapse', 1], ['openfield', 1]]) {
  errors.length = 0;
  await seed(mode, n);
  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(7000);
  const canvas = await page.locator('canvas').count();
  const failedPanel = await page.locator('.arena-failed').count();
  ok(canvas === 1 && failedPanel === 0 && errors.length === 0,
     `режим ${mode.toUpperCase()} собрался и идёт`,
     errors.length ? `(ошибки: ${errors[0]})` : '');
}

console.log('\n── ВСЕ ШЕСТЬ ГРАНЕЙ КУБИКА ───────────────────────────────');
{
  // Бросаем кубик по разу на каждую грань. Запас на это надо пополнить: в бою
  // их всего три, а граней шесть.
  for (let face = 1; face <= 6; face++) {
    await page.evaluate(() => {
      const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
      raw.buffs = { stock: { towel: 0, bucket: 0, dice: 3 }, kit: ['dice', 'dice', 'dice'], gifted: true };
      const list = raw?.roster?.fighters || [];
      raw.prefight = { core: list[0].core, squad: [list[0].id], mode: 'duel', n: 1 };
      sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
    });
    await page.goto(`${BASE}/play/arena?dev=1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.bfo-cards .bc-card', { timeout: 30000 });
    await page.waitForTimeout(800);
    await page.locator('.bfo-dev-btn').nth(face - 1).click();       // служебная грань
    await page.locator('.bfo-cards .bc-card').first().click();      // карточка DICE
    await page.waitForTimeout(400);
    const mk = await page.locator('.bfo-mark').first().boundingBox();
    if (mk) await page.mouse.click(mk.x + mk.width / 2, mk.y + mk.height / 2);
    await page.waitForTimeout(700);
    const shown = await page.locator('.bb-badge:visible .bb-face').first().textContent().catch(() => null);
    ok(shown === String(face), `грань ${face} доехала до значка`, `(видно «${shown}»)`);
    if (face === 6) await page.screenshot({ path: `${OUT}/dice-face-6.png` });
  }
}

console.log('\n── БОТ БРОСАЕТ СВОИ ──────────────────────────────────────');
{
  await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    raw.buffs = { stock: { towel: 0, bucket: 0, dice: 0 }, kit: [null, null, null], gifted: true };
    const list = raw?.roster?.fighters || [];
    raw.prefight = { core: list[0].core, squad: [list[0].id], mode: 'duel', n: 1 };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  });
  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  // Игрок без баффов вовсе — всё, что появится над бойцами, бросил бот.
  let seen = 0;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(1000);
    const n = await page.locator('.bb-badge.is-foe:visible').count();
    if (n > 0) { seen += 1; if (seen === 1) await page.screenshot({ path: `${OUT}/bot-badge.png` }); }
    if (seen >= 2) break;
  }
  ok(seen >= 1, 'над бойцом соперника появился значок — бот бросил свой',
     `(поймано ${seen} раз)`);
}

console.log('\n── ЦЕНА КАДРА ────────────────────────────────────────────');
{
  const measure = async () => page.evaluate(() => new Promise((resolve) => {
    let n = 0;
    const t0 = performance.now();
    const tick = () => { n += 1; if (performance.now() - t0 < 5000) requestAnimationFrame(tick); else resolve(n / ((performance.now() - t0) / 1000)); };
    requestAnimationFrame(tick);
  }));
  await page.evaluate(() => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    raw.buffs = { stock: { towel: 3, bucket: 3, dice: 3 }, kit: ['towel', 'bucket', 'dice'], gifted: true };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  });
  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.bfo-cards .bc-card', { timeout: 30000 });
  await page.waitForTimeout(2500);
  const plain = await measure();
  await page.locator('.bfo-cards .bc-card').first().click();
  await page.waitForTimeout(300);
  const mk = await page.locator('.bfo-mark').first().boundingBox();
  if (mk) await page.mouse.click(mk.x + mk.width / 2, mk.y + mk.height / 2);
  const withBuff = await measure();
  ok(withBuff > plain * 0.85, 'с баффом кадр не подешевел',
     `(${plain.toFixed(1)} → ${withBuff.toFixed(1)} кадров в секунду)`);
  console.log('  ⚠️ считано в контейнере без видеокарты — число ориентировочное.'
    + ' Настоящий замер — владелец на телефоне.');
}

await browser.close();
console.log(`\nСнимки: ${OUT}`);
console.log(failed === 0 ? '✓ ВСЁ СОШЛОСЬ' : `✗ НЕ СОШЛОСЬ: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
