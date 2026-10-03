// balance-final-video.mjs — ВИДЕО ДЛЯ ГЛАЗ ВЛАДЕЛЬЦА (TZ_balance_final_v1, шаг 3): бой в настоящем браузере на телефоне 390×844.
//
// Пишет по одному webm на каждое из четырёх ядер (DUEL) и один целый RAID. В каждом бою игрок по расписанию кричит ВПЕРЁД (PUSH), потом
// ДЕРЖАТЬ (HOLD), бросает ВЕДРО (BUCKET) и КУБИК (DICE); моменты бросков пишутся в timecodes.json — под видео в отчёте стоят эти отметки.
// Игровой код не трогается: скрипт только нажимает те же карточки, что нажимает игрок.
//
//   npx vite build && npx vite preview --port 4173 &
//   PW=/путь/к/playwright/index.mjs CHROME=/путь/к/chrome node scripts/balance-final-video.mjs
//   (OUT=папка, ONLY=onslaught,raider — только эти записи; LIT — какие грани зажечь бойцу: '{"natisk":{"c":[1,2,3]},"nalet":{"b":[2,5]}}')
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';

const { chromium } = await import(process.env.PW || 'playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = process.env.OUT || '/tmp/balance-final-video';
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const LIT = process.env.LIT ? JSON.parse(process.env.LIT) : null;
mkdirSync(OUT, { recursive: true });
const SIZE = { width: 390, height: 844 };
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const timecodes = {};
let failed = 0;
const ok = (c, n, d = '') => { if (!c) failed += 1; console.log(`  ${c ? '✓' : '✗'} ${n}${d ? '  ' + d : ''}`); };

async function run(label, mode, core) {
  if (ONLY.length && !ONLY.includes(label)) return;
  console.log(`\n── ${label} · ${mode.toUpperCase()} · ${core ? NAME[core] : '—'} · ${SIZE.width}×${SIZE.height} ──`);
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: OUT, size: SIZE }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const t00 = Date.now();
  const at = () => +((Date.now() - t00) / 1000).toFixed(1);
  const marks = [];
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const seeded = await page.evaluate(({ mode, core, lit }) => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const list = raw?.roster?.fighters || [];
    if (!list.length) return null;
    if (core) list[0].core = core;
    if (lit && lit[core]) list[0].lit = lit[core]; // зажечь грани бойцу (LIT='{"natisk":{"c":[1,2,3]}}') — иначе в бою голое ядро
    raw.prefight = { core: list[0].core, squad: [list[0].id], mode, n: 1 };
    raw.buffs = { stock: { towel: 3, bucket: 3, dice: 3 }, kit: ['towel', 'bucket', 'dice'], gifted: true };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
    return { core: list[0].core };
  }, { mode, core, lit: LIT });
  ok(!!seeded, 'стартовый ростер завёлся', seeded ? `(ядро ${seeded.core})` : '');
  if (!seeded) { await ctx.close(); return; }

  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.bfo-cards .bc-card', { timeout: 60000 }).catch(() => {});
  const hint = page.locator('.rotate-hint');
  if (await hint.count()) { await hint.click(); await page.waitForTimeout(400); }
  marks.push({ t: at(), what: 'бой начался (экран боя на виду)' });
  await page.waitForTimeout(4000);

  const kc = page.locator('.kc-card');
  const cards = page.locator('.bfo-cards .bc-card');
  // порядок рядов — как в данных: клич push · fallback · hold; баффы towel · bucket · dice.
  const act = async (loc, i, what, waitMs) => {
    const n = await loc.count();
    if (n > i) { await loc.nth(i).click().catch(() => {}); marks.push({ t: at(), what }); }
    await page.waitForTimeout(waitMs);
  };
  await act(cards, 1, 'ВЕДРО брошено (BUCKET) — 5 с реагирует на замахи: смотреть уворот и ответ', 7000);
  await act(kc, 0, 'ВПЕРЁД (PUSH) — боец жмёт в размен', 8000);
  await act(kc, 2, 'ДЕРЖАТЬ (HOLD) — боец врастает, ждёт и отвечает', 6000);
  await act(cards, 2, 'КУБИК брошен (DICE) — на значке выпавшая грань', 5000);
  await act(cards, 0, 'ПОЛОТЕНЦЕ (TOWEL) — восстановление', 2000);

  const t0 = Date.now();
  let ended = false;
  while (Date.now() - t0 < 180000) {
    ended = await page.evaluate(() => /VICTORY|DEFEAT|DRAW|WIN|LOSE|RESULT/i.test(document.body.innerText) || !!document.querySelector('[class*="result"], [class*="Result"]'));
    if (ended) break;
    await page.waitForTimeout(1500);
  }
  marks.push({ t: at(), what: ended ? 'экран итога' : 'итог не дождались' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${label}-end.png` });
  ok(ended, 'бой дошёл до конца', `(${at()} с от начала записи)`);
  ok(errors.length === 0, 'ошибок на странице нет', errors.length ? errors.slice(0, 2).join(' | ') : '');
  const video = await page.video().path().catch(() => null);
  await ctx.close();
  if (video) {
    const dest = `${OUT}/${label}-390x844.webm`;
    try { renameSync(video, dest); } catch (_) { /* оставляем как есть */ }
    timecodes[label] = { mode, core: seeded.core, file: `${label}-390x844.webm`, marks };
  }
}

await run('onslaught', 'duel', 'natisk');
await run('raider', 'duel', 'nalet');
await run('bulwark', 'duel', 'skala');
await run('ambush', 'duel', 'zasada');
await run('raid', 'raid', 'natisk');
await browser.close();
writeFileSync(`${OUT}/timecodes.json`, JSON.stringify(timecodes, null, 1));
console.log(failed ? `\nИТОГ: провалено проверок — ${failed}` : '\nИТОГ: всё сошлось ✅');
process.exit(failed ? 1 : 0);
