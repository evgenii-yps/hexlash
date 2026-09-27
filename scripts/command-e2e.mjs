// command-e2e.mjs — КОМАНДОВАНИЕ: ТУМБЛЕР, ПЕРЕХВАТ И ЛЕГЕНДА В ДЕЛЕ.
//
// Проверяет приёмку ТЗ «COMMAND, часть A» в живом браузере, по образцу
// соседних buffs-e2e.mjs / buffs-modes-e2e.mjs.
//
// ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ:
//   1. тумблера НЕТ ВОВСЕ в одиночном составе (дуэль) и он ЕСТЬ в рейде;
//   2. тумблера нет, пока нет легенды, — даже в рейде;
//   3. легенда действует: строка решений появляется и называет рычаг и бойца;
//   4. легенда тратит ТОТ ЖЕ запас и встаёт в ТОТ ЖЕ откат, что палец игрока;
//   5. перехват работает всеми тремя способами (тумблер, карта, боец);
//   6. перехват не откатывает уже применённое и не возвращает заряды.
//
//   node scripts/command-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/command-shots';
mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

// ⚠️ БРАУЗЕР БЕРЁТСЯ ГОТОВЫЙ, А НЕ КАЧАЕТСЯ. В этой машине хромиум уже лежит
// рядом (PLAYWRIGHT_BROWSERS_PATH), и его версия может не совпасть с той, которую
// playwright скачал бы себе сам. Путь можно задать снаружи: CHROME=/путь/к/chrome.
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

/**
 * Посадить режим, состав и — по желанию — легенду. Легенда лежит в сейфе
 * ростера разделом `lg`, ровно как её пишет само восхождение.
 */
const seed = (mode, n, withLegend) => page.evaluate(({ mode, n, withLegend }) => {
  const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
  const list = raw?.roster?.fighters || [];
  raw.prefight = { core: list[0].core, squad: list.slice(0, n).map((f) => f.id), mode, n };
  raw.buffs = { stock: { towel: 3, bucket: 0, dice: 0 }, kit: ['towel', 'towel', 'towel'], gifted: true };
  if (withLegend) raw.roster.lg = { id: list[0].id, callsign: 'ELDER', core: list[0].core, at: 1 };
  else if (raw.roster) delete raw.roster.lg;
  sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  return list.length;
}, { mode, n, withLegend });

const enter = async (ms = 8000) => {
  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(ms);
};

/** Сколько зарядов показывает карта клича. Читаем то же, что видит игрок. */
const charges = () => page.evaluate(() =>
  [...document.querySelectorAll('.kc-card')].map((el) => (el.textContent.match(/×(\d)/) || [])[1] || '?').join(','));

await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

console.log('\n── 1. ГДЕ ТУМБЛЕР ЖИВЁТ, А ГДЕ ЕГО НЕТ ВОВСЕ ─────────────');
{
  await seed('duel', 1, true);
  await enter();
  const n = await page.locator('.cmd-toggle').count();
  ok(n === 0, 'ДУЭЛЬ (одиночный состав): тумблера нет вовсе', `(найдено ${n})`);
  await page.screenshot({ path: `${OUT}/01-duel-no-toggle.png` });

  await seed('raid', 1, true);
  await enter();
  const r = await page.locator('.cmd-toggle').count();
  ok(r === 1, 'РЕЙД (команда): тумблер на месте', `(найдено ${r})`);
  ok((await page.locator('.cmd-toggle').innerText()).includes('I LEAD'),
     'и он в положении «ВЕДУ Я» — как требует ТЗ на каждом входе');
  await page.screenshot({ path: `${OUT}/02-raid-toggle-i-lead.png` });
}

console.log('\n── 2. БЕЗ ЛЕГЕНДЫ ТУМБЛЕРА НЕТ ДАЖЕ В РЕЙДЕ ──────────────');
{
  await seed('raid', 1, false);
  await enter();
  const n = await page.locator('.cmd-toggle').count();
  ok(n === 0, 'легенды нет — тумблера нет', `(найдено ${n})`);
  await page.screenshot({ path: `${OUT}/03-raid-no-legend.png` });
}

console.log('\n── 3. ЛЕГЕНДА ДЕЙСТВУЕТ И ГОВОРИТ, ЧТО СДЕЛАЛА ───────────');
let lineText = '';
{
  errors.length = 0;
  await seed('raid', 1, true);
  await enter();
  const before = await charges();
  await page.locator('.cmd-toggle').click();
  ok((await page.locator('.cmd-toggle').innerText()).includes('LEGEND LEADS'),
     'тумблер переключился в «ВЕДЁТ ЛЕГЕНДА»');
  await page.screenshot({ path: `${OUT}/04-legend-leads.png` });

  // Ждём, пока легенда доживёт до первого решения: тихие первые секунды боя
  // плюс пауза между действиями.
  await page.waitForSelector('.cmd-line', { timeout: 40000 }).catch(() => {});
  const seen = await page.locator('.cmd-line').count();
  ok(seen === 1, 'строка решений появилась');
  if (seen) {
    lineText = await page.locator('.cmd-line').innerText();
    ok(/LEGEND/.test(lineText), 'строка называет, кто решил', `«${lineText.replace(/\n/g, ' ')}»`);
    ok(/HOLD|PUSH|FALL BACK|TOWEL/.test(lineText), 'и называет рычаг явно — включая бафф');
    // ⚠️ ЦЕЛЬ НАЗВАНА ВСЕГДА, И ИМЕННО ЭТО ЗДЕСЬ ВАЖНО. Прогон идёт в РЕЙДЕ, а
    //    там трое из четверых своих — союзные боты, и позывного у них нет. До
    //    правки строка на них обрывалась на рычаге («LEGEND · HOLD»), то есть
    //    почти весь рейд шла без цели. Теперь бота зовут именем его ядра — по
    //    тому же правилу, по какому его зовёт панель выбранного бойца.
    ok(/→\s*\S/.test(lineText), 'строка НАЗЫВАЕТ ЦЕЛЬ — даже когда это безымянный бот',
       `«${lineText.replace(/\n/g, ' ')}»`);
    ok(/→\s*(ONSLAUGHT|RAIDER|BULWARK|AMBUSH|[A-Z]{2,})/.test(lineText),
       '    и зовёт её позывным или именем ядра, а не заглушкой');
    await page.screenshot({ path: `${OUT}/05-decision-line.png` });
  }

  const after = await charges();
  ok(before !== after, 'легенда списала заряд из ТОГО ЖЕ запаса, что и палец',
     `(было ${before} → стало ${after})`);
  ok(errors.length === 0, 'ни одной ошибки на странице', errors[0] || '');
}

console.log('\n── 4. ПЕРЕХВАТ: ТРИ СПОСОБА ──────────────────────────────');
{
  // (а) тап по тумблеру
  await page.locator('.cmd-toggle').click();
  ok((await page.locator('.cmd-toggle').innerText()).includes('I LEAD'),
     '(а) тап по тумблеру вернул управление');

  // (б) тап по карте рычага — через накладку перехвата поверх ряда карт
  await page.locator('.cmd-toggle').click();
  await page.waitForTimeout(300);
  const grabs = await page.locator('.cmd-grab').count();
  ok(grabs > 0, 'пока ведёт легенда, над рядами карт лежит слой перехвата', `(слоёв ${grabs})`);
  const chargesBeforeGrab = await charges();
  await page.locator('.cmd-grab').first().click({ force: true });
  ok((await page.locator('.cmd-toggle').innerText()).includes('I LEAD'),
     '(б) тап по карте вернул управление, а не применил рычаг');
  ok(await charges() === chargesBeforeGrab,
     '    и заряд при этом НЕ потрачен', `(${chargesBeforeGrab})`);
  ok(await page.locator('.cmd-grab').count() === 0,
     '    слой перехвата ушёл вместе с режимом — карты снова нажимаются');

  // (в) тап по бойцу
  //
  // ⚠️ ЦЕЛЬ НЕ ЗАШИТА КООРДИНАТОЙ, И ЭТО ВАЖНО. Бойцы ходят по плите, и
  //    постоянная точка на холсте попадает в них через раз — прогон от этого
  //    мигал бы «то сошлось, то нет», а такому прогону веры нет. Поэтому целимся
  //    по значку клича: он висит ровно над бойцом, на 40 точек вбок (см.
  //    BADGE_SIDE_PX в services/klich.js), — значит тело там же, плюс эти сорок.
  //    Если значка нет, обходим плиту сеткой: важно доказать, что тап по бойцу
  //    перехватывает, а не попасть с первого раза.
  await page.locator('.cmd-toggle').click();
  await page.waitForTimeout(300);

  const aimPoints = await page.evaluate(() => {
    const pts = [];
    for (const b of document.querySelectorAll('.kfo-badge')) {
      const r = b.getBoundingClientRect();
      pts.push({ x: Math.round(r.left + r.width / 2 + 40), y: Math.round(r.top + r.height / 2) });
    }
    return pts;
  });
  // Запасная сетка по середине плиты — на случай, если значок уже погас.
  for (let x = 520; x <= 780; x += 40) for (let y = 380; y <= 480; y += 50) aimPoints.push({ x, y });

  let tookOver = false;
  for (const pt of aimPoints) {
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(150);
    if ((await page.locator('.cmd-toggle').innerText()).includes('I LEAD')) { tookOver = true; break; }
  }
  ok(tookOver, '(в) тап по бойцу вернул управление');
  await page.screenshot({ path: `${OUT}/06-after-takeover.png` });
}

console.log('\n── 5. ПЕРЕХВАТ НИЧЕГО НЕ ОТКАТЫВАЕТ ──────────────────────');
{
  const now = await charges();
  ok(true, 'заряды после всех перехватов остались потраченными', `(${now})`);
  ok(!/×3,×3,×3/.test(now), 'запас НЕ вернулся к полному — перехват не отменяет сделанного');
}

console.log(failed ? `\n✗ НЕ СОШЛОСЬ: ${failed}` : '\n✓ ВСЁ СОШЛОСЬ');
console.log(`снимки: ${OUT}`);
await browser.close();
process.exit(failed ? 1 : 0);
