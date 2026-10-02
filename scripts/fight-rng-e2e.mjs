// fight-rng-e2e.mjs — ГЛАЗА: бой в настоящем браузере на телефоне 390×844 (DUEL и RAID).
//
// Проверка к правке «свой источник случайности для боя» (docs/bout-random/REPORT.md). Считает бой не цифрами, а так, как
// его видит игрок: бой идёт и доходит до конца, клич и баффы срабатывают, кубик бросается и показывает грань, ошибок нет.
// Снимает кадры и ВИДЕО (webm) каждого боя.
//
//   npx vite build && npx vite preview --port 4173 &
//   node scripts/fight-rng-e2e.mjs                 (CHROME=/путь/к/chrome — если свой браузер; OUT=папка снимков)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = process.env.OUT || '/tmp/fight-rng-shots';
mkdirSync(OUT, { recursive: true });
const SIZE = { width: 390, height: 844 };

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

async function run(mode) {
  console.log(`\n── ${mode.toUpperCase()} · ${SIZE.width}×${SIZE.height} ──────────────`);
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: OUT, size: SIZE }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // Первый заход заводит стартовый ростер; потом кладём режим, состав и полный набор баффов (как делают соседние e2e).
  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const seeded = await page.evaluate((mode) => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const list = raw?.roster?.fighters || [];
    if (!list.length) return null;
    raw.prefight = { core: list[0].core, squad: [list[0].id], mode, n: 1 };
    raw.buffs = { stock: { towel: 3, bucket: 3, dice: 3 }, kit: ['towel', 'bucket', 'dice'], gifted: true };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
    return { core: list[0].core };
  }, mode);
  ok(!!seeded, 'стартовый ростер завёлся', seeded ? `(ядро ${seeded.core})` : '');
  if (!seeded) { await ctx.close(); return; }

  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.bfo-cards .bc-card', { timeout: 60000 }).catch(() => {});
  const bc = await page.locator('.bfo-cards .bc-card').count();
  ok(bc === 3, 'панель баффов: три карточки', `(${bc})`);
  // Подсказка «поверните телефон» на портрете перекрывает экран до тапа — игрок её закрывает, и мы тоже.
  const hint = page.locator('.rotate-hint');
  if (await hint.count()) { await page.screenshot({ path: `${OUT}/${mode}-0-rotate-hint.png` }); await hint.click(); await page.waitForTimeout(400); }
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/${mode}-1-fight.png` });

  // КЛИЧ: боец выбран заранее, тап по карте кричит ему немедленно.
  const kc = await page.locator('.kc-card').count();
  ok(kc >= 1, 'ряд клича на экране', `(карт ${kc})`);
  if (kc) {
    await page.locator('.kc-card').first().click();
    await page.waitForTimeout(700);
    const kb = await page.locator('.kfo-badge:visible').count();
    ok(kb >= 1, 'клич сработал — над бойцом ВИДИМЫЙ значок клича', `(значков ${kb})`);
    await page.screenshot({ path: `${OUT}/${mode}-2-klich.png` });
  }

  // БАФФЫ: карточки по порядку набора towel · bucket · dice. КУБИК — последняя.
  const cards = page.locator('.bfo-cards .bc-card');
  await cards.nth(2).click();
  await page.waitForTimeout(900);
  const face = await page.locator('.bb-badge:visible .bb-face').first().textContent({ timeout: 4000 }).catch(() => null);
  ok(face && /^[1-6]$/.test(face.trim()), 'КУБИК брошен — на значке выпавшая грань 1…6', `(грань ${face && face.trim()})`);
  await page.screenshot({ path: `${OUT}/${mode}-3-dice.png` });
  await page.waitForTimeout(1500);
  await cards.nth(0).click().catch(() => {});   // TOWEL
  await page.waitForTimeout(600);
  await cards.nth(1).click().catch(() => {});   // BUCKET (на бойца с баффом второй не ляжет — это нормально)
  await page.waitForTimeout(800);
  const badges = await page.locator('.bb-badge:visible').count();
  ok(badges >= 1, 'баффы на бойце — значки видны', `(значков ${badges})`);
  await page.screenshot({ path: `${OUT}/${mode}-4-buffs.png` });

  // Бой доходит до конца (RAID длиннее и может уйти за минуту — ждём до трёх).
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${OUT}/${mode}-5-mid.png` });
  const t0 = Date.now();
  let ended = false;
  while (Date.now() - t0 < 180000) {
    ended = await page.evaluate(() => /VICTORY|DEFEAT|DRAW|WIN|LOSE|RESULT/i.test(document.body.innerText) || !!document.querySelector('[class*="result"], [class*="Result"]'));
    if (ended) break;
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${mode}-6-end.png` });
  ok(ended, 'бой дошёл до конца (экран итога)', `(${Math.round((Date.now() - t0) / 1000)} с ожидания)`);
  ok(errors.length === 0, 'ошибок на странице нет', errors.length ? errors.slice(0, 2).join(' | ') : '');
  const video = await page.video().path().catch(() => null);
  await ctx.close();
  if (video) console.log(`  видео: ${video}`);
}

await run('duel');
await run('raid');
await browser.close();
console.log(failed ? `\nИТОГ: провалено проверок — ${failed}` : '\nИТОГ: всё сошлось ✅');
process.exit(failed ? 1 : 0);
