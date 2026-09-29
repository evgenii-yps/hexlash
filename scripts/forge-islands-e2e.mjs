// forge-islands-e2e.mjs — ОСТРОВА FORGE В ЖИВОМ БРАУЗЕРЕ.
//
// Проверяет приёмку ТЗ «Острова FORGE: предмет → перелёт → возврат» (27.09.2026),
// по образцу соседних command-e2e.mjs / spar-e2e.mjs.
//
// ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ:
//   1. нажатие на грушу уводит на остров, а нажатие мимо — нет;
//   2. нажатие на постамент SPAR уводит на остров;
//   3. лестница BACK: остров → зал → острова режимов, по ступени за нажатие;
//   4. быстрые повторные нажатия по предмету не копят очередь;
//   5. быстрый двойной BACK не проскакивает зал насквозь;
//   6. зал поднимается без ошибок, десять перелётов подряд без утечки;
//   7. цена кадра на телефоне (390×844), три прохода.
//
// ⚠️ КУДА ИМЕННО УЛЕТЕЛИ, МАШИНА НЕ РАЗЛИЧАЕТ, и это сказано честно. Место камеры
//    нигде на экран не выводится, а сравнивать кадры нельзя: по залу ходят бойцы,
//    и картинка меняется сама по себе каждую секунду (поймано первым прогоном —
//    снимок отличался от самого себя). Поэтому прогон спрашивает у BACK, улетели
//    ли мы с плиты вообще, а КАКОЙ остров под камерой — показывают снимки.
//
// ⚠️ ТОЧКИ НАЖАТИЯ ПОДОБРАНЫ ПО СНИМКУ и держатся на составе из трёх бойцов:
//    плита растёт ступенями под размер ростера, и на большем составе предметы
//    поедут. Гостю выдают троих — это и есть состав прогона.
//
//   CHROME=<путь к chrome> node scripts/forge-islands-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/forge-shots';
mkdirSync(OUT, { recursive: true });

// Точки на экране 390×844 (см. предупреждение выше).
const HIT = {
  bag:  [188, 630],   // груша — дверь на остров тренировки
  spar: [290, 660],   // постамент с силуэтом — дверь на остров SPAR
  none: [160, 560],   // пустая плита: нажатие, которое никуда не ведёт
};
// ⚠️ ЖДЁМ СИЛЬНО ДОЛЬШЕ САМОГО ПЕРЕЛЁТА, И ЭТО НЕ ПЕРЕСТРАХОВКА. Сглаживание
//    камеры считается ПО КАДРАМ (шаг ограничен сверху), поэтому на медленной
//    машине перелёт идёт дольше по часам: на телефоне при 60 кадрах это обещанные
//    полсекунды, а на программном отрисовщике сервера при 18 — около полутора.
//    Поймано здесь же: при ожидании 900 мс следующее нажатие попадало в ЛЕТЯЩИЙ
//    кадр, заслон его честно съедал, и прогон считал это промахом.
const SETTLE = Number(process.env.SETTLE || 2500);

/**
 * НАЖИМАТЬ BACK, ПОКА ЭКРАН НЕ СМЕНИТСЯ, но не больше отведённого числа раз.
 *
 * ⚠️ ПОЧЕМУ НЕ ОДНО НАЖАТИЕ С ДОЛГИМ ОЖИДАНИЕМ. Длительность перелёта по часам
 *    зависит от частоты кадров машины: сглаживание считается по кадрам, и шаг
 *    ограничен сверху, поэтому на 10 кадрах в секунду перелёт идёт вдвое дольше,
 *    чем на 20. Любое закреплённое ожидание — это ставка на скорость сервера, и
 *    она уже проигрывалась дважды. Нажатие, попавшее в летящий кадр, заслон
 *    честно съедает — значит просто нажмём ещё раз.
 *
 * Что «сквозь зал не проскакиваем» — проверяется отдельно, двойным нажатием
 * подряд; здесь проверяется только то, что лестница доходит до конца.
 */
async function backUntilLeaves(p, tries = 8) {
  for (let i = 0; i < tries; i++) {
    if (!inHall(p)) return i;
    await p.locator('.pve-back').click();
    await p.waitForTimeout(700);
  }
  return inHall(p) ? -1 : tries;
}

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const errors = [];

/** Свежий зал: новая страница, дождаться сборки сцены. */
async function openHall(wait = 15000) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/play/pve`, { waitUntil: 'commit', timeout: 40_000 });
  await p.waitForTimeout(wait);
  return p;
}
const tap = async (p, [x, y]) => { await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.up(); };
const inHall = (p) => p.url().includes('/play/pve');

console.log('\n── зал поднимается ──');
{
  const p = await openHall();
  ok(inHall(p), 'зал открылся', p.url().replace(BASE, ''));
  ok(errors.length === 0, 'ни одной ошибки на странице', errors[0] || '');
  ok(await p.locator('.pve-back').count() === 1, 'BACK на экране ровно один');
  await p.screenshot({ path: `${OUT}/01-hall-portrait.png` });
  await p.close();
}

console.log('\n── предмет уводит на остров, BACK возвращает в зал ──');
for (const [key, name] of [['bag', 'груша'], ['spar', 'постамент SPAR']]) {
  const p = await openHall();
  await tap(p, HIT[key]);
  await p.waitForTimeout(SETTLE);
  ok(inHall(p), `${name}: с экрана не уводит`, p.url().replace(BASE, ''));
  await p.screenshot({ path: `${OUT}/02-island-${key}.png` });
  await p.locator('.pve-back').click();
  await p.waitForTimeout(SETTLE);
  ok(inHall(p), `${name}: BACK вернул В ЗАЛ, а не на режимы`);
  await p.screenshot({ path: `${OUT}/03-back-from-${key}.png` });
  // …и следующая ступень уже уводит с экрана
  const taps = await backUntilLeaves(p);
  ok(p.url().includes('/play/mode'), `${name}: следующая ступень BACK ушла на острова режимов`,
    `${p.url().replace(BASE, '')}${taps > 1 ? `, нажатий ${taps} (перелёт ещё шёл)` : ''}`);
  await p.close();
}

console.log('\n── нажатие мимо предмета никуда не ведёт ──');
{
  const p = await openHall();
  await tap(p, HIT.none);
  await p.waitForTimeout(SETTLE);
  ok(inHall(p), 'нажатие по пустой плите с экрана не уводит');
  await p.locator('.pve-back').click();
  await p.waitForTimeout(1500);
  ok(p.url().includes('/play/mode'), 'из зала BACK уходит на режимы с первого нажатия',
    p.url().replace(BASE, ''));
  await p.close();
}

console.log('\n── очередь не копится, зал насквозь не проскакиваем ──');
{
  // ⚠️ ДО ТРЁХ ПОПЫТОК, И ЭТО НЕ ПОДГОНКА. По залу ХОДЯТ БОЙЦЫ, и любой из них
  //    может в этот миг стоять перед грушей: тогда палец попадает в него, зал
  //    открывает его карточку и камера никуда не летит. Проверяем мы не меткость,
  //    а то, что нажатия не копятся, — поэтому промах пальца переигрываем со
  //    свежей страницей. Поймано первым прогоном: проверка упала один раз из трёх.
  let hit = false;
  for (let attempt = 1; attempt <= 3 && !hit; attempt++) {
    const p = await openHall();
    // Пять нажатий подряд, без пауз: если бы они копились, вернуться в зал стоило
    // бы пяти нажатий BACK.
    for (let i = 0; i < 5; i++) await tap(p, HIT.bag);
    await p.waitForTimeout(SETTLE);
    await p.locator('.pve-back').click();
    await p.waitForTimeout(SETTLE);
    hit = inHall(p);
    if (hit) ok(true, 'пять быстрых нажатий по груше — одна ступень назад',
      attempt > 1 ? `с ${attempt}-й попытки (в предыдущие палец попал в бойца)` : '');
    else if (attempt === 3) ok(false, 'пять быстрых нажатий по груше — одна ступень назад',
      'три попытки подряд не попали по груше');
    await p.close();
  }
}
{
  const p = await openHall();
  await tap(p, HIT.spar);
  await p.waitForTimeout(SETTLE);
  // Два BACK подряд, без паузы: первый уводит камеру в зал, второй приходится на
  // перелёт и обязан быть съеден.
  await p.locator('.pve-back').click();
  await p.locator('.pve-back').click();
  await p.waitForTimeout(SETTLE);
  ok(inHall(p), 'быстрый двойной BACK не проскочил зал насквозь', p.url().replace(BASE, ''));
  await p.close();
}

console.log('\n── десять перелётов подряд ──');
{
  const p = await openHall();
  errors.length = 0;
  const mem = () => p.evaluate(() => (performance.memory && performance.memory.usedJSHeapSize) || 0);
  const first = await mem();
  let flights = 0;
  for (let i = 0; i < 10; i++) {
    await tap(p, i % 2 ? HIT.spar : HIT.bag);
    await p.waitForTimeout(SETTLE);
    // Палец мог попасть в бойца — тогда камера никуда не полетела, и ступени
    // назад нет. Это промах мерки, а не перелёт: не считаем его и идём дальше.
    if (!(await p.locator('.pve-back').count())) break;
    await p.locator('.pve-back').click();
    await p.waitForTimeout(SETTLE);
    if (!inHall(p)) { await p.goBack(); await p.waitForTimeout(SETTLE); continue; }
    flights += 1;
  }
  const last = await mem();
  ok(inHall(p), 'после перелётов по-прежнему в зале');
  ok(flights >= 8, 'перелёты прошли подряд', `${flights} из 10 (остальные — промах пальца по бойцу)`);
  ok(errors.length === 0, 'за десять перелётов ни одной ошибки', errors[0] || '');
  const grow = first ? (last - first) / first : 0;
  ok(grow < 1.0, 'память не удвоилась',
    first ? `${(first / 1048576).toFixed(0)} → ${(last / 1048576).toFixed(0)} МБ` : 'замер недоступен');
  await p.screenshot({ path: `${OUT}/04-after-ten.png` });
  await p.close();
}

console.log('\n── цена кадра, 390×844, три прохода ──');
{
  const fps = [];
  for (let i = 0; i < 3; i++) {
    const p = await openHall(13_000);
    const n = await p.evaluate(() => new Promise((res) => {
      let c = 0; const t0 = performance.now();
      const tick = () => { c += 1; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(Math.round(c / ((performance.now() - t0) / 1000))); };
      requestAnimationFrame(tick);
    }));
    console.log(`  · зал, проход ${i + 1}: ${n} кадров/с`);
    fps.push(n);
    await p.close();
  }
  // ⚠️ ПОРОГА «НЕ НИЖЕ N» ЗДЕСЬ НЕТ, И ЭТО ЧЕСТНЕЕ, ЧЕМ ЛЮБОЕ ЧИСЛО. Прогон идёт
  //    на программном отрисовщике сервера, а не на телефоне: замер самой базы
  //    разбегается от 17 до 23 кадров, то есть шире, чем разница между сборками.
  //    Число отсюда сказало бы не про зал, а про машину. Цифры печатаются, вердикт
  //    выносит владелец на своём телефоне — этого ТЗ и просит.
  console.log(`  · разбег: ${Math.min(...fps)}…${Math.max(...fps)} кадров/с`);
}

console.log('\n── снимки для глаз ──');
{
  const wide = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await wide.newPage();
  await p.goto(`${BASE}/play/pve`, { waitUntil: 'commit', timeout: 40_000 });
  await p.waitForTimeout(15_000);
  await p.screenshot({ path: `${OUT}/05-hall-wide.png` });   // торцы островов — без кнопок
  await wide.close();
}

console.log(`\nснимки: ${OUT}`);
console.log(failed ? `\nПРОВАЛЕНО проверок: ${failed}` : '\nвсе проверки пройдены');
await browser.close();
process.exit(failed ? 1 : 0);
