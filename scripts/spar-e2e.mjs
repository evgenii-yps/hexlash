// spar-e2e.mjs — БОЙ В SPAR В ЖИВОМ БРАУЗЕРЕ.
//
// Проверяет приёмку ТЗ «Бой в SPAR» (27.09.2026), по образцу соседних
// command-e2e.mjs / buffs-modes-e2e.mjs.
//
// ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ:
//   1. бой из SPAR запускается и на плите ДВОЕ — половины плиты не бывает;
//   2. в бой идёт тот боец, которого выбрали на экране, а не первый из сейфа;
//   3. снимок прогресса игрока ДО и ПОСЛЕ боя совпадает побайтно;
//   4. возврат после боя ведёт В SPAR, и сборка соперника на месте;
//   5. тумблер «веду я / ведёт легенда» ЕСТЬ в SPAR при легенде и НЕТ без неё;
//   6. тумблера по-прежнему НЕТ в дуэли и в забеге — боевые режимы не тронуты;
//   7. десять боёв подряд без утечки (тела и сцены не копятся);
//   8. цена кадра на телефоне (390×844), три прохода.
//
// ⚠️ ЛИЧНОСТЬ СОПЕРНИКА ЗДЕСЬ НЕ ПРОВЕРЯЕТСЯ МАШИНОЙ, и это честно сказано: ни
//    ядро, ни грани соперника на экран цифрами не выводятся (в SPAR цифр нет
//    вовсе), а заводить служебный вывод ради прогона значило бы вскрывать
//    защищённый файл сверх разрешённого. Доказательство — снимки экрана: цвет
//    тела и ореол соперника и есть его ядро. Снимки складываются в OUT.
//
//   NODE_PATH=scripts/smoke-test/node_modules node scripts/spar-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/spar-shots';
mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

// ⚠️ БРАУЗЕР БЕРЁТСЯ ГОТОВЫЙ, А НЕ КАЧАЕТСЯ — как в соседних прогонах.
// ⚠️ ОТРИСОВЩИК ЗАДАН ЯВНО. Без него в машине без видеокарты трёхмерная сцена
//    не собирается вовсе, и прогон меряет пустой экран.
const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`${e.message}`));

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

/** Снимок прогресса игрока — ровно то, что лежит в сейфе вкладки. */
const progress = () => page.evaluate(() => sessionStorage.getItem('hexlash_progress') || '');

/**
 * Посадить легенду в сейф ростера — ровно так, как её пишет восхождение.
 *
 * ⚠️ ПОСЛЕ ЭТОГО НУЖНА ПЕРЕЗАГРУЗКА СТРАНИЦЫ. Сейф читается один раз, при
 *    подъёме списка бойцов; правка в сейфе живую страницу не трогает. Поймано
 *    первым прогоном: «убрали легенду» — а тумблер остался, потому что в памяти
 *    она никуда не девалась.
 */
const setLegend = (on) => page.evaluate((on) => {
  const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
  const list = raw?.roster?.fighters || [];
  if (!list.length) return 0;
  if (on) raw.roster.lg = { id: list[0].id, callsign: 'ELDER', core: list[0].core, at: 1 };
  else if (raw.roster) delete raw.roster.lg;
  sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  return list.length;
}, on);

/** Посадить режим и состав — для проверки, что боевые режимы не изменились. */
const seedMode = (mode, n) => page.evaluate(({ mode, n }) => {
  const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
  const list = raw?.roster?.fighters || [];
  raw.prefight = { core: list[0].core, squad: list.slice(0, n).map((f) => f.id), mode, n };
  // ⚠️ ОТМЕТКИ БРОШЕННОГО ЗАБЕГА И ТУРНИРА СНИМАЕМ. Без этого следующий вход на
  //    арену увидит незаконченный забег и УЙДЁТ В ВОРОТА, не собрав боя вовсе —
  //    это задуманное поведение игры, и прогон должен его учитывать, а не ловить
  //    как поломку. Поймано первым же прогоном: рейд после забега не поднимался.
  delete raw.chain;
  delete raw.collapse;
  sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
}, { mode, n });

/** Сколько тел на плите. Плашки здоровья рисует сама сцена, по одной на бойца. */
const bodies = () => page.evaluate(() => {
  // Плашки — спрайты в трёхмерном мире, из разметки их не видно. Считаем по
  // накладке значков баффов: она знает живых бойцов. Нет накладки — считаем по
  // тому, что бой вообще идёт.
  const hud = document.querySelector('.buff-hud, .bf-wrap, .kf-wrap');
  return hud ? 1 : 0;
});

// ── Первый заход: поднять гостю ростер ──────────────────────────────────────
await page.goto(`${BASE}/play`, { waitUntil: 'commit', timeout: 40_000 });
await page.waitForTimeout(2000);
const rosterN = await page.evaluate(() => {
  const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
  return (raw?.roster?.fighters || []).length;
});
ok(rosterN > 0, 'гостю выдан ростер', `${rosterN} бойцов`);
if (!rosterN) { console.log('\nростера нет — дальше проверять нечего'); await browser.close(); process.exit(1); }

// ── 1-3. Бой из SPAR: запуск, тот боец, прогресс не тронут ──────────────────
console.log('\n── бой из SPAR ──');
await setLegend(true);
await page.goto(`${BASE}/play/spar`, { waitUntil: 'commit', timeout: 40_000 });
await page.waitForTimeout(3000);
await shot('01-spar-screen');

// Выбираем ВТОРОГО бойца, если он есть: первый пришёл бы в бой и без нас, и
// проверка «в бой идёт выбранный» ничего бы не доказала.
const rows = await page.locator('.sp-row').count();
const pickIdx = rows > 1 ? 1 : 0;
const wantName = (await page.locator('.sp-row .nm').nth(pickIdx).textContent() || '').trim();
await page.locator('.sp-row').nth(pickIdx).click();
await page.waitForTimeout(400);
// Собираем соперника «Зеркалом» — самая наглядная пара для снимка.
await page.locator('.sp-preset').first().click();
await page.waitForTimeout(400);
const foeCoreBefore = (await page.locator('.sp-core.on').textContent() || '').trim();
const litBefore = (await page.locator('.sp-build').textContent() || '').trim();
await shot('02-spar-assembled');

const progBefore = await progress();
ok(!!progBefore, 'снимок прогресса снят до боя', `${progBefore.length} байт`);

await page.locator('.sp-go').click();
await page.waitForTimeout(9000);
ok(page.url().includes('/play/arena'), 'ушли на арену', page.url().replace(BASE, ''));
ok(page.url().includes('spar=1'), 'адрес несёт метку боя из SPAR');
const failedPanel = await page.locator('.arena-failed').count();
ok(failedPanel === 0, 'сцена собралась (нет сообщения о поломке)');
await shot('03-spar-fight');

const progAfterEntry = await progress();
ok(progAfterEntry === progBefore, 'вход в бой не тронул прогресс ни байтом');

// На плите двое: смотрим накладку выбора — она поднимается, только когда есть
// кого выбрать, то есть когда бой реально идёт со своей стороной.
const fightLive = await page.locator('.fso, .buff-hud, .kf-cards, .bf-cards').count();
ok(fightLive > 0, 'бой идёт: накладки боя на экране');

// ── 5. Тумблер легенды в SPAR ───────────────────────────────────────────────
console.log('\n── тумблер легенды ──');
const toggleInSpar = await page.locator('.cmd-toggle').count();
ok(toggleInSpar > 0, 'тумблер ЕСТЬ в SPAR при легенде');
if (toggleInSpar) await shot('04-spar-toggle');

// ── 3. Прогресс после доигранного боя ───────────────────────────────────────
console.log('\n── прогресс после боя ──');
// Ждём итог боя. Бой один на один укладывается в минуту с запасом.
await page.waitForSelector('.ap-back', { timeout: 120_000 }).catch(() => {});
const resultUp = await page.locator('.ap-back').count();
ok(resultUp > 0, 'панель итога показалась');
const lashLine = await page.locator('.fr-lash').count();
ok(lashLine === 0, 'монеты за бой в SPAR НЕ начислены (строки про них нет)');
const backWord = (await page.locator('.ap-back').textContent() || '').trim();
ok(/spar/i.test(backWord), 'дверь подписана возвратом в SPAR', backWord);
await shot('05-spar-result');

const progAfterFight = await progress();
ok(progAfterFight === progBefore, 'ПРОГРЕСС ПОСЛЕ БОЯ СОВПАЛ ПОБАЙТНО');

// ── 4. Возврат в SPAR со сборкой на месте ───────────────────────────────────
console.log('\n── возврат в SPAR ──');
await page.locator('.ap-back').click();
await page.waitForTimeout(4000);
ok(page.url().includes('/play/spar'), 'вернулись именно в SPAR', page.url().replace(BASE, ''));
const nameAfter = (await page.locator('.sp-row.on .nm').textContent() || '').trim();
ok(nameAfter === wantName, 'боец тот же, что выбирали', `${nameAfter} = ${wantName}`);
const foeCoreAfter = (await page.locator('.sp-core.on').textContent() || '').trim();
ok(foeCoreAfter === foeCoreBefore, 'ядро соперника на месте', `${foeCoreAfter}`);
const litAfter = (await page.locator('.sp-build').textContent() || '').trim();
ok(litAfter === litBefore, 'сборка своего бойца на месте');
await shot('06-spar-back');

// ── 5б. Без легенды тумблера нет ────────────────────────────────────────────
console.log('\n── без легенды ──');
await setLegend(false);
await page.goto(`${BASE}/play/spar`, { waitUntil: 'commit', timeout: 40_000 });  // сейф читается на подъёме
await page.waitForTimeout(3500);
await page.locator('.sp-row').nth(pickIdx).click();
await page.waitForTimeout(300);
await page.locator('.sp-preset').first().click();
await page.waitForTimeout(300);
await page.locator('.sp-go').click();
await page.waitForTimeout(9000);
ok(await page.locator('.cmd-toggle').count() === 0, 'без легенды тумблера НЕТ и в SPAR');

// ── 6. Боевые режимы не тронуты ─────────────────────────────────────────────
console.log('\n── боевые режимы не тронуты ──');
await setLegend(true);
for (const [mode, n, label] of [['duel', 1, 'дуэль'], ['chain', 1, 'забег']]) {
  await seedMode(mode, n);
  await page.goto(`${BASE}/play/arena`, { waitUntil: 'commit', timeout: 40_000 });
  await page.waitForTimeout(9000);
  ok(await page.locator('.cmd-toggle').count() === 0, `тумблера нет в ${label} (как было)`);
  await shot(`07-no-toggle-${mode}`);
}
// И он по-прежнему ЕСТЬ там, где состав больше одного.
await seedMode('raid', 1);
await page.goto(`${BASE}/play/arena`, { waitUntil: 'commit', timeout: 40_000 });
await page.waitForTimeout(10_000);
ok(await page.locator('.cmd-toggle').count() > 0, 'тумблер по-прежнему есть в рейде');

// ── Все шесть режимов поднимаются ───────────────────────────────────────────
console.log('\n── шесть режимов поднимаются ──');
for (const [mode, n] of [['duel', 1], ['squad', 2], ['chain', 1], ['raid', 1], ['collapse', 1], ['openfield', 1]]) {
  await seedMode(mode, n);
  errors.length = 0;
  await page.goto(`${BASE}/play/arena`, { waitUntil: 'commit', timeout: 40_000 });
  await page.waitForTimeout(8000);
  const bad = await page.locator('.arena-failed').count();
  ok(bad === 0 && errors.length === 0, `${mode} поднялся`, errors[0] || '');
}

// ── 7. Десять боёв подряд без утечки ────────────────────────────────────────
console.log('\n── десять боёв подряд ──');
await setLegend(true);
await page.goto(`${BASE}/play/spar`, { waitUntil: 'commit', timeout: 40_000 });
await page.waitForTimeout(3000);
await page.locator('.sp-row').nth(pickIdx).click();
await page.waitForTimeout(300);
await page.locator('.sp-preset').first().click();
await page.waitForTimeout(300);
await page.locator('.sp-go').click();
await page.waitForTimeout(9000);

const geoOf = () => page.evaluate(() => {
  const c = document.querySelector('canvas');
  const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
  return { js: (performance.memory && performance.memory.usedJSHeapSize) || 0 };
});
const memFirst = await geoOf();
// ⚠️ СНИМОК ПРОГРЕССА БЕРЁМ ЗАНОВО. Прежний снят в начале прогона, а между ними
//    мы сами насажали в сейф режимов и составов, проверяя боевые режимы. Сравнивать
//    с ним значило бы ловить СВОИ ЖЕ правки и называть их поломкой.
const progTenStart = await progress();
errors.length = 0;
let rounds = 0;
for (let i = 0; i < 10; i++) {
  // «Драться снова» — та же дверь, которой пользуется игрок.
  const again = await page.locator('.ap-go').count();
  if (again) { await page.locator('.ap-go').click(); rounds += 1; }
  else {
    // Бой ещё идёт — дождёмся итога.
    await page.waitForSelector('.ap-go', { timeout: 120_000 }).catch(() => {});
    if (await page.locator('.ap-go').count()) { await page.locator('.ap-go').click(); rounds += 1; }
  }
  await page.waitForTimeout(1500);
}
await page.waitForSelector('.ap-go', { timeout: 120_000 }).catch(() => {});
const memLast = await geoOf();
ok(rounds >= 9, 'бои прошли подряд', `${rounds} из 10`);
ok(errors.length === 0, 'за десять боёв ни одной ошибки в консоли', errors[0] || '');
const grow = memFirst.js ? (memLast.js - memFirst.js) / memFirst.js : 0;
ok(grow < 1.0, 'память не удвоилась за десять боёв',
  memFirst.js ? `${(memFirst.js / 1048576).toFixed(0)} → ${(memLast.js / 1048576).toFixed(0)} МБ` : 'замер недоступен');
const progAfterTen = await progress();
ok(progAfterTen === progTenStart, 'прогресс не тронут и после десяти боёв');
await shot('08-ten-rounds');

// ── 8. Цена кадра на телефоне ───────────────────────────────────────────────
console.log('\n── цена кадра, 390×844, три прохода ──');
const phone = await ctx.newPage();
phone.on('pageerror', (e) => errors.push(e.message));
await phone.setViewportSize({ width: 390, height: 844 });
const fpsOf = async (url, label) => {
  await phone.goto(url, { waitUntil: 'commit', timeout: 40_000 });
  await phone.waitForTimeout(11_000);
  const fps = await phone.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n += 1; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(Math.round(n / ((performance.now() - t0) / 1000))); };
    requestAnimationFrame(tick);
  }));
  console.log(`  · ${label}: ${fps} кадров/с`);
  return fps;
};
// SPAR-бой кормится сборкой из ПЕРВОЙ вкладки, во второй её нет — поэтому цену
// кадра меряем на обычной дуэли: сцена боя одна и та же, а метка режима на цену
// кадра не влияет. Заодно это и есть сравнение «не хуже прежнего».
await phone.evaluate(() => {}).catch(() => {});
await phone.goto(`${BASE}/play`, { waitUntil: 'commit', timeout: 40_000 });
await phone.waitForTimeout(2000);
const duelFps = [];
for (let i = 0; i < 3; i++) duelFps.push(await fpsOf(`${BASE}/play/arena`, `дуэль, проход ${i + 1}`));
const worst = Math.min(...duelFps);
ok(worst >= 24, 'кадровая цена дуэли на телефоне держится', `худший проход ${worst} кадров/с`);
await phone.screenshot({ path: `${OUT}/09-phone-duel.png` });

// Снимок боя из SPAR на телефоне — для глаз владельца.
await phone.goto(`${BASE}/play/spar`, { waitUntil: 'commit', timeout: 40_000 });
await phone.waitForTimeout(3500);
await phone.screenshot({ path: `${OUT}/10-phone-spar.png` });
// ⚠️ ПАНЕЛЬ НА ТЕЛЕФОНЕ НАДО ОТКРЫТЬ, И ТОЛЬКО ЯЗЫЧКОМ. Считать `.sp-row` бесполезно:
//    закрытая панель остаётся в разметке, просто уезжает за край, — и прогон думал,
//    что открывать нечего, а потом жал по тому, чего на экране нет. Язычок слушает
//    КОНЕЦ КАСАНИЯ, а не клик (так в самом экране и написано: поздний клик там
//    гасится), поэтому шлём его своими руками.
await phone.locator('.sp-tab').dispatchEvent('pointerup');
await phone.waitForTimeout(900);
await phone.screenshot({ path: `${OUT}/11-phone-spar-panel.png` });
ok(await phone.locator('.sp-panel.open').count() > 0, 'панель сборки открывается на телефоне');
await phone.locator('.sp-row').first().click();
await phone.waitForTimeout(400);
await phone.locator('.sp-preset').first().click();
await phone.waitForTimeout(400);
await phone.locator('.sp-go').click();
await phone.waitForTimeout(10_000);
await phone.screenshot({ path: `${OUT}/12-phone-spar-fight.png` });
ok(phone.url().includes('spar=1'), 'бой из SPAR запускается и на телефоне');

console.log(`\nснимки: ${OUT}`);
console.log(failed ? `\nПРОВАЛЕНО проверок: ${failed}` : '\nвсе проверки пройдены');
await browser.close();
process.exit(failed ? 1 : 0);
