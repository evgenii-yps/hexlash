// spar-entry-e2e.mjs — ВХОД НА ЭКРАН SPAR С ОСТРОВА SPAR (ТЗ 29.09.2026): вход — сама плита острова.
//
// ЧТО ДОКАЗЫВАЕТСЯ:
//   1. слова SOON на острове больше нет, предмета на острове тоже нет — вход это плита;
//   2. из зала плита острова НЕ слышит нажатия — ⚠️ ЭТА ПРОВЕРКА СЕГОДНЯ НЕ РАБОТАЕТ:
//      из зала остров за краем кадра, нажать в него нечем, и прогон честно пишет «не проверено»
//   3. нажал постамент в зале → улетел на остров → нажал плиту → /play/spar;
//   4. лестница BACK прежняя: остров → зал → острова режимов;
//   5. вернулся из SPAR в зал — встал на остров, откуда ушёл, и BACK ведёт в зал;
//   6. быстрые повторные нажатия по плите дают один переход и ни одной ошибки;
//   7. нажатие по плите во время перелёта не уводит с экрана;
//   8. десять заходов подряд без ошибок и без роста памяти.
//
// Координаты плиты берутся из служебного зонда сцены (?dev=1 → __forgeProbe),
// а не угадываются по картинке.
//
//   CHROME=<путь к chrome> node scripts/spar-entry-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/spar-entry-shots';
mkdirSync(OUT, { recursive: true });
const SETTLE = Number(process.env.SETTLE || 2500);

let failed = 0;
// НЕ ПРОВЕРЕНО — отдельная строка, не зелёная и не красная. Проверка, которой
// нечем сработать, в «пройдено» не записывается (решение владельца 29.09.2026).
const notChecked = [];
const skip = (n, d = '') => { notChecked.push(n); console.log(`  ○ НЕ ПРОВЕРЕНО: ${n}${d ? '  ' + d : ''}`); };
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: false });
const errors = [];

const openHall = async () => {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/play/pve?dev=1`, { waitUntil: 'commit', timeout: 40_000 });
  await p.waitForTimeout(16_000);
  return p;
};
const tap = async (p, [x, y]) => { await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.up(); };
const inHall = (p) => p.url().includes('/play/pve');
/** Где на экране предмет — из зонда сцены, в пикселях. */
const where = (p, key) => p.evaluate((k) => {
  const t = window.__forgeProbe && window.__forgeProbe().taps[k];
  return t ? [Math.round(t.sx * innerWidth), Math.round(t.sy * innerHeight)] : null;
}, key);
const heap = (p) => p.evaluate(() => (performance.memory && performance.memory.usedJSHeapSize) || 0);

console.log('\n── слова SOON на острове нет, предмета на острове нет ──');
{
  const p = await openHall();
  const door = await p.evaluate(() => window.__forgeProbe && window.__forgeProbe().taps.sparGo);
  ok(!!door, 'плита острова — вход: она в списке нажимаемого', door ? `доля кадра ${door.sx}, ${door.sy}` : '');
  // Постамент в зале — вход на остров; на самом острове предмета нет.
  const hallStand = await p.evaluate(() => window.__forgeProbe().taps.spar);
  ok(!!hallStand, 'постамент SPAR в зале на месте');
  await p.close();
}

console.log('\n── из зала плита острова не слышит нажатия ──');
{
  const p = await openHall();
  const pt = await where(p, 'sparGo');
  if (pt && pt[0] > 0 && pt[0] < 390 && pt[1] > 0 && pt[1] < 844) {
    await tap(p, pt);
    await p.waitForTimeout(SETTLE);
    ok(inHall(p), 'нажатие по месту плиты из зала с экрана не уводит', p.url().replace(BASE, '').split('?')[0]);
  } else {
    skip('из зала плита острова не слышит нажатия', `место плиты за краем кадра ${JSON.stringify(pt)} — нажать нечем, защита стоит в коде, но прогон её не касался`);
  }
  await p.close();
}

console.log('\n── зал → остров → плита → экран SPAR ──');
{
  const p = await openHall();
  const stand = await where(p, 'spar');
  await tap(p, stand);
  await p.waitForTimeout(SETTLE);
  ok(inHall(p), 'постамент в зале: улетели на остров, с экрана не ушли');
  const pt = await where(p, 'sparGo');
  ok(!!pt && pt[0] > 0 && pt[0] < 390 && pt[1] > 0 && pt[1] < 844, 'плита острова в кадре', JSON.stringify(pt));
  await p.screenshot({ path: `${OUT}/01-island-door-portrait.png` });
  await tap(p, pt);
  await p.waitForURL(/\/play\/spar/, { timeout: 30_000 }).catch(() => {});
  ok(p.url().includes('/play/spar'), 'нажатие по плите привело на экран SPAR', p.url().replace(BASE, ''));
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `${OUT}/02-spar-screen-portrait.png` });

  console.log('\n── назад из SPAR: в зал, и на тот же остров ──');
  await p.locator('.sp-back, .sp-bar button').first().click().catch(() => {});
  await p.waitForURL(/\/play\/pve/, { timeout: 30_000 }).catch(() => {});
  await p.waitForTimeout(16_000);
  ok(inHall(p), 'из SPAR вернулись в зал', p.url().replace(BASE, ''));
  await p.screenshot({ path: `${OUT}/03-back-to-island.png` });
  const pt2 = await where(p, 'sparGo');
  const onIsland = !!pt2 && Math.abs(pt2[0] - 195) < 150;
  ok(onIsland, 'камера встала на остров SPAR, откуда ушли', JSON.stringify(pt2));
  await p.locator('.pve-back').click();
  await p.waitForTimeout(SETTLE);
  ok(inHall(p), 'BACK с острова вернул В ЗАЛ, а не на режимы');
  await p.locator('.pve-back').click();
  await p.waitForTimeout(1500);
  ok(p.url().includes('/play/mode'), 'следующая ступень BACK — острова режимов', p.url().replace(BASE, ''));
  await p.close();
}

console.log('\n── нажатие по плите во время перелёта не уводит ──');
{
  const p = await openHall();
  const stand = await where(p, 'spar');
  await tap(p, stand);
  // Сразу, пока камера летит: плита ещё не слышит.
  await p.waitForTimeout(150);
  const pt = await where(p, 'sparGo');
  if (pt) await tap(p, pt);
  await p.waitForTimeout(400);
  ok(inHall(p), 'во время перелёта плита не сработала');
  await p.close();
}

console.log('\n── быстрые повторные нажатия по плите ──');
{
  const p = await openHall();
  await tap(p, await where(p, 'spar'));
  await p.waitForTimeout(SETTLE);
  errors.length = 0;
  const pt = await where(p, 'sparGo');
  for (let i = 0; i < 6; i++) { await tap(p, pt); await p.waitForTimeout(60); }
  await p.waitForURL(/\/play\/spar/, { timeout: 30_000 }).catch(() => {});
  await p.waitForTimeout(3000);
  ok(p.url().includes('/play/spar'), 'шесть быстрых нажатий — один переход', p.url().replace(BASE, ''));
  ok(errors.length === 0, 'ни одной ошибки', errors[0] || '');
  await p.close();
}

console.log('\n── десять заходов подряд ──');
{
  const p = await openHall();
  const m0 = await heap(p);
  errors.length = 0;
  let n = 0;
  for (let i = 0; i < 10; i++) {
    await tap(p, await where(p, 'spar'));
    await p.waitForTimeout(SETTLE);
    await tap(p, await where(p, 'sparGo'));
    await p.waitForURL(/\/play\/spar/, { timeout: 30_000 }).catch(() => {});
    if (p.url().includes('/play/spar')) n += 1;
    await p.waitForTimeout(2500);
    await p.goto(`${BASE}/play/pve?dev=1`, { waitUntil: 'commit', timeout: 40_000 });
    await p.waitForTimeout(14_000);
  }
  const m1 = await heap(p);
  ok(n === 10, 'заходы прошли подряд', `${n} из 10`);
  ok(errors.length === 0, 'ни одной ошибки за десять заходов', errors[0] || '');
  ok(!m0 || m1 < m0 * 2, 'память не удвоилась', m0 ? `${(m0 / 1048576).toFixed(0)} → ${(m1 / 1048576).toFixed(0)} МБ` : 'замер недоступен');
  await p.close();
}

console.log(`\nснимки: ${OUT}`);
console.log(failed ? `\nПРОВАЛЕНО проверок: ${failed}` : '\nвсе проверенные пройдены');
if (notChecked.length) console.log(`НЕ ПРОВЕРЕНО (${notChecked.length}): ${notChecked.join('; ')}`);
await browser.close();
process.exit(failed ? 1 : 0);
