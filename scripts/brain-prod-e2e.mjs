// brain-prod-e2e.mjs — МОДЕЛЬ НА ПРОДЕ: кому она достаётся, а кому нет.
//
// Проверяет приёмку ТЗ «COMMAND часть B, работа 3» в живом браузере, по образцу
// соседних command-e2e.mjs / command-voice-e2e.mjs.
//
// ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ:
//   1. в бою на двоих бойцы думают моделью БЕЗ служебных признаков — умолчание;
//   2. где тел больше двух, бойцы остаются на рефлексах, и это не обойти
//      служебной кнопкой: правило состава сильнее;
//   3. в режиме показа (дека для инвесторов) мозг — рефлексы, ноль обращений;
//   4. служебная кнопка BRAIN не сломалась: она по-прежнему переключает, просто
//      теперь ВНИЗ, от модели к рефлексам;
//   5. сервер молчит — бой идёт, ошибок на странице нет, игрок не замечает.
//
// ⚠️ ОТВЕТ МОДЕЛИ ПОДМЕНЯЕТСЯ НА СЕТЕВОМ УРОВНЕ, а не заглушкой в коде: путь
//    клиента настоящий целиком. Живого ключа в этой машине нет.
//
// ⚠️ ПОДДЕЛЬНЫЙ ПРОПУСК ОБЯЗАТЕЛЕН. Без него дверь в сеть отказывает ещё на
//    клиенте, и прогон мерил бы не мозг, а отсутствие входа в игру. Проверка на
//    клиенте только разбирает пропуск и смотрит на срок — подписи не сверяет.
//
//   node scripts/brain-prod-e2e.mjs
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:4173';

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});

const fakeJwt = () => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b({ alg: 'none', typ: 'JWT' })}.${b({ exp: Math.floor(Date.now() / 1000) + 3600 })}.`;
};

/**
 * Один бой. Считает обращения к модели по каждой ручке отдельно.
 * @param {object} o
 *   o.mode     — режим боя
 *   o.query    — что дописать к адресу арены (?dev=1, ?showcase=1, …)
 *   o.pressDev — нажать служебную кнопку BRAIN в середине боя
 *   o.offline  — ручка модели не отвечает вовсе
 *   o.seconds  — сколько смотреть
 */
async function bout({ mode = 'duel', query = '', pressDev = false, offline = false, seconds = 45 }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((t) => { try { localStorage.setItem('jwtToken', t); } catch (_) { /* noop */ } }, fakeJwt());

  let fighters = 0; let legend = 0;
  await page.route('**/v1/ai/fighter-intention', async (r) => {
    fighters += 1;
    if (offline) return r.abort('failed');
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ intention: 'press', read: 'closing him down' }) });
  });
  await page.route('**/v1/ai/legend-command', async (r) => {
    legend += 1;
    if (offline) return r.abort('failed');
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lever: 'hold', target: 1, line: 'HOLD.', lineWhy: '' }) });
  });

  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.evaluate((m) => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const list = raw?.roster?.fighters || [];
    raw.prefight = { core: list[0].core, squad: [list[0].id], mode: m, n: 1 };
    raw.buffs = { stock: { towel: 3, bucket: 0, dice: 0 }, kit: ['towel', 'towel', 'towel'], gifted: true };
    raw.roster.lg = { id: list[0].id, callsign: 'ELDER', core: list[0].core, at: 1 };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  }, mode);

  await page.goto(`${BASE}/play/arena${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Кнопка BRAIN лежит ПОД рядами карт рычагов, поэтому зовём её напрямую:
  // здесь важна не досягаемость пальцем, а то, что обработчик работает.
  let brainLabel = '';
  if (pressDev) {
    await page.evaluate(() => document.querySelector('.arena-panel-toggle')?.click());
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /BRAIN/.test(b.textContent || ''));
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);
    brainLabel = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /BRAIN/.test(b.textContent || ''));
      return btn ? btn.textContent.trim() : 'кнопки нет';
    });
    await page.evaluate(() => document.querySelector('.arena-panel-toggle')?.click());
  }

  const t = page.locator('.cmd-toggle');
  if (await t.count()) await t.click({ force: true });

  await page.waitForTimeout(seconds * 1000);
  const alive = await page.evaluate(() => document.querySelectorAll('canvas').length > 0);
  await ctx.close();
  return { fighters, legend, errors, brainLabel, alive };
}

// ── 1. ДУЭЛЬ БЕЗ ПРИЗНАКОВ: МОДЕЛЬ ПО УМОЛЧАНИЮ ──────────────────────────
console.log('\n── 1. ДУЭЛЬ НА ЧИСТОМ АДРЕСЕ ─────────────────────────────');
{
  const r = await bout({ mode: 'duel' });
  ok(r.fighters > 0, 'бойцы думают моделью БЕЗ служебных признаков', `(обращений ${r.fighters})`);
  ok(r.fighters <= 24, '    и не превышают потолок 24 на бой', `(${r.fighters})`);
  ok(r.legend === 0, '    легенды в паре нет — тумблера не существует', `(${r.legend})`);
  ok(r.errors.length === 0, 'ни одной ошибки на странице', r.errors[0] || '');
}

// ── 2. СОСТАВ ПОЛЯ СИЛЬНЕЕ КНОПКИ ────────────────────────────────────────
console.log('\n── 2. РЕЙД: ТЕЛА НА РЕФЛЕКСАХ, И КНОПКОЙ ЭТО НЕ ОБОЙТИ ───');
{
  const r = await bout({ mode: 'raid', query: '?dev=1', pressDev: true });
  ok(r.fighters === 0, 'бойцы НЕ обратились к модели ни разу', `(${r.fighters})`);
  ok(r.legend > 0, '    а легенда — обратилась: она исключение', `(${r.legend})`);
  ok(r.legend <= 5, '    и в свой потолок 5 уложилась', `(${r.legend})`);
  ok(r.errors.length === 0, 'ни одной ошибки на странице', r.errors[0] || '');
}

// ── 3. ДЕКА ДЛЯ ИНВЕСТОРОВ ───────────────────────────────────────────────
console.log('\n── 3. РЕЖИМ ПОКАЗА: НОЛЬ ОБРАЩЕНИЙ ──────────────────────');
{
  const r = await bout({ mode: 'duel', query: '?showcase=1' });
  ok(r.fighters === 0, 'дека не потратила ни одного обращения', `(${r.fighters})`);
  ok(r.legend === 0, '    и легенда тоже молчит', `(${r.legend})`);
  ok(r.alive, '    при этом бой на деке идёт');
  ok(r.errors.length === 0, 'ни одной ошибки на странице', r.errors[0] || '');
}

// ── 4. СЛУЖЕБНАЯ КНОПКА НЕ СЛОМАЛАСЬ ─────────────────────────────────────
console.log('\n── 4. КНОПКА BRAIN ПЕРЕКЛЮЧАЕТ, ТЕПЕРЬ ВНИЗ ──────────────');
{
  const r = await bout({ mode: 'duel', query: '?dev=1', pressDev: true, seconds: 30 });
  ok(/SPINAL/.test(r.brainLabel), 'кнопка увела мозг в рефлексы', `«${r.brainLabel}»`);
  ok(r.errors.length === 0, 'ни одной ошибки на странице', r.errors[0] || '');
}

// ── 5. СЕРВЕР МОЛЧИТ ─────────────────────────────────────────────────────
console.log('\n── 5. СЕРВЕР МОДЕЛИ НЕ ОТВЕЧАЕТ ──────────────────────────');
{
  const r = await bout({ mode: 'duel', offline: true });
  ok(r.fighters > 0, 'бойцы пытались спросить', `(попыток ${r.fighters})`);
  ok(r.alive, '    бой всё равно идёт — игрок ничего не замечает');
  ok(r.errors.length === 0, '    и ни одной ошибки на странице', r.errors[0] || '');
}

await browser.close();
console.log(failed ? `\n✗ ПРОВАЛОВ: ${failed}` : '\n✓ ВСЁ СОШЛОСЬ');
process.exit(failed ? 1 : 0);
