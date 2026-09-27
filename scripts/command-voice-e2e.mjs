// command-voice-e2e.mjs — ГОЛОС ЛЕГЕНДЫ: две строки, разбраковка, отказ сети.
//
// Проверяет приёмку ТЗ «COMMAND часть B, работа 2» в живом браузере, по образцу
// соседнего command-e2e.mjs.
//
// ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ:
//   1. пришла годная реплика — строк ДВЕ: голос сверху, факт снизу;
//   2. верхняя крупнее и ярче нижней (11px/--ink против 10px/--ink-dim);
//   3. реплика негодна, решение годно — остаётся ОДНА строка, как сегодня,
//      и легенда всё равно действует (заряд списан);
//   4. сети нет вовсе — строка работает в служебном виде и НЕ мигает пустотой;
//   5. в портрете 390×844 при самых длинных именах ничего не вылезает за край
//      и реплика не разваливается на три строки.
//
// ⚠️ ОТВЕТ МОДЕЛИ ПОДМЕНЯЕТСЯ НА СЕТЕВОМ УРОВНЕ, А НЕ ЗАГЛУШКОЙ В КОДЕ. Путь
//    клиента при этом настоящий целиком: Vuex-токен, apiClient, срок ожидания,
//    последний заслон по форме в мозге. Заглушка внутри кода проверяла бы
//    заглушку. Живого ключа модели в этой машине нет — настоящие тексты модели
//    и их разбраковка проверяются на бэке (backend/tests/legendCommandService).
//
//   node scripts/command-voice-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/command-voice-shots';
mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

// Браузер берётся готовый — см. ту же оговорку в command-e2e.mjs.
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});

/**
 * Поддельный пропуск. Проверка на клиенте только разбирает и смотрит на срок —
 * подписи она не сверяет, поэтому такого пропуска довольно, чтобы apiClient
 * дошёл до сети, где его и ждёт подмена. Ничего настоящего он не открывает.
 */
const fakeJwt = () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ exp: Math.floor(Date.now() / 1000) + 3600 })}.`;
};

/**
 * Один прогон боя в рейде с легендой.
 * @param {object} o
 *   o.answer   — что «ответит модель», либо 'offline' (сеть отвалилась вовсе)
 *   o.callsign — позывной легенды
 *   o.size     — окно
 */
async function run({ answer, callsign = 'ELDER', size = { width: 1280, height: 800 }, shot }) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((tok) => { try { localStorage.setItem('jwtToken', tok); } catch (_) { /* noop */ } }, fakeJwt());

  let calls = 0;
  await page.route('**/v1/ai/legend-command', async (route) => {
    calls += 1;
    if (answer === 'offline') return route.abort('failed');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer) });
  });

  await page.goto(`${BASE}/play`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(({ callsign }) => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const list = raw?.roster?.fighters || [];
    raw.prefight = { core: list[0].core, squad: [list[0].id], mode: 'raid', n: 1 };
    raw.buffs = { stock: { towel: 3, bucket: 0, dice: 0 }, kit: ['towel', 'towel', 'towel'], gifted: true };
    raw.roster.lg = { id: list[0].id, callsign, core: list[0].core, at: 1 };
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  }, { callsign });

  await page.goto(`${BASE}/play/arena`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);
  const hasToggle = await page.locator('.cmd-toggle').count();
  if (hasToggle) await page.locator('.cmd-toggle').click();
  await page.waitForSelector('.cmd-line', { timeout: 45000 }).catch(() => {});

  const seen = await page.evaluate(() => {
    const box = document.querySelector('.cmd-line');
    if (!box) return null;
    const grab = (sel) => {
      const el = box.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        text: el.innerText.replace(/\n/g, ' ').trim(),
        size: cs.fontSize, color: cs.color,
        left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height),
      };
    };
    const r = box.getBoundingClientRect();
    return {
      reply: grab('.cmd-reply'),
      fact: grab('.cmd-fact'),
      box: { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) },
      win: window.innerWidth,
    };
  });
  if (shot) {
    await page.screenshot({ path: `${OUT}/${shot}.png` });
    await page.locator('.cmd-line').screenshot({ path: `${OUT}/${shot}-line.png` }).catch(() => {});
  }
  const charges = await page.evaluate(() =>
    [...document.querySelectorAll('.kc-card')].map((el) => (el.textContent.match(/×(\d)/) || [])[1] || '?').join(','));
  await ctx.close();
  return { seen, calls, errors, charges, hasToggle };
}

// ── 1. ГОДНАЯ РЕПЛИКА — ДВЕ СТРОКИ ────────────────────────────────────────
console.log('\n── 1. ПРИШЛА РЕПЛИКА: ГОЛОС СВЕРХУ, ФАКТ СНИЗУ ───────────');
{
  const r = await run({
    answer: { lever: 'hold', target: 1, line: 'HOLD THE LINE. HE BREAKS.', lineWhy: '' },
    shot: '01-two-lines',
  });
  ok(r.calls > 0, 'модель спрошена', `(обращений ${r.calls})`);
  ok(!!r.seen && !!r.seen.reply, 'верхняя строка — голос легенды', r.seen?.reply?.text ? `«${r.seen.reply.text}»` : '');
  ok(!!r.seen && !!r.seen.fact, 'нижняя строка — рычаг и цель', r.seen?.fact?.text ? `«${r.seen.fact.text}»` : '');
  if (r.seen?.reply && r.seen?.fact) {
    ok(/^ELDER:/.test(r.seen.reply.text), '    имя легенды ушло наверх, к её словам');
    ok(!/ELDER/.test(r.seen.fact.text), '    и внизу уже не повторяется');
    ok(r.seen.reply.size === '11px' && r.seen.fact.size === '10px',
       'нижняя МЕЛЬЧЕ верхней', `(${r.seen.reply.size} / ${r.seen.fact.size})`);
    ok(r.seen.reply.color !== r.seen.fact.color,
       '    и ТУСКЛЕЕ', `(${r.seen.reply.color} / ${r.seen.fact.color})`);
  }
  ok(r.errors.length === 0, 'ни одной ошибки на странице', r.errors[0] || '');
}

// ── 2. РЕПЛИКА НЕГОДНА, РЕШЕНИЕ ГОДНО ────────────────────────────────────
console.log('\n── 2. РЕПЛИКА ВЫБРОШЕНА — ОСТАЁТСЯ ОДНА СТРОКА ───────────');
{
  // Бэк такую реплику и не пропустил бы (не латиница), но клиент обязан
  // выстоять и против пустой: доказываем, что молчание не ломает строку.
  const r = await run({
    answer: { lever: 'hold', target: 1, line: '', lineWhy: 'not_latin' },
    shot: '02-fact-only',
  });
  ok(!!r.seen && !r.seen.reply, 'голоса нет — верхней строки не существует');
  ok(!!r.seen && !!r.seen.fact, 'служебная строка на месте', r.seen?.fact?.text ? `«${r.seen.fact.text}»` : '');
  ok(!!r.seen?.fact && /^ELDER/.test(r.seen.fact.text), '    и имя легенды вернулось к ней — в точности как сегодня');
  ok(r.charges !== '3,3,3', 'легенда ВСЁ РАВНО действовала — заряд списан', `(${r.charges})`);
  ok(r.errors.length === 0, 'ни одной ошибки на странице', r.errors[0] || '');
}

// ── 3. СЕТИ НЕТ ВОВСЕ ────────────────────────────────────────────────────
console.log('\n── 3. БОЙ БЕЗ СЕТИ ───────────────────────────────────────');
{
  const r = await run({ answer: 'offline', shot: '03-offline' });
  ok(r.calls > 0, 'мозг пытался спросить и получил отказ', `(попыток ${r.calls})`);
  ok(!!r.seen, 'строка решений ЕСТЬ — пустотой не мигает');
  ok(!!r.seen && !r.seen.reply, '    голоса нет, и это честно: сказать нечем');
  ok(!!r.seen?.fact && /^ELDER/.test(r.seen.fact.text), '    служебный вид, как до части B',
     r.seen?.fact?.text ? `«${r.seen.fact.text}»` : '');
  ok(r.charges !== '3,3,3', '    легенда работает по табличке порогов', `(${r.charges})`);
  ok(r.errors.length === 0, 'ни одной ошибки на странице', r.errors[0] || '');
}

// ── 4. ПОРТРЕТ 390×844, САМЫЕ ДЛИННЫЕ ИМЕНА ──────────────────────────────
console.log('\n── 4. ПОРТРЕТ 390×844: САМОЕ ДЛИННОЕ ИЗ ВОЗМОЖНОГО ───────');
{
  // WOLFRAM — самый длинный позывной из списка; реплика ровно в потолок 28.
  const r = await run({
    answer: { lever: 'hold', target: 1, line: 'HOLD. HE IS ALREADY GONE.', lineWhy: '' },
    callsign: 'WOLFRAM',
    size: { width: 390, height: 844 },
    shot: '04-portrait-worst',
  });
  ok(r.hasToggle === 1, 'в портрете тумблер на месте');
  if (r.seen) {
    ok(r.seen.box.left >= 0, 'блок не вылезает за левый край', `(левый край ${r.seen.box.left})`);
    ok(r.seen.box.right <= r.seen.win, 'блок не вылезает за правый край',
       `(правый ${r.seen.box.right} при ширине ${r.seen.win})`);
    ok(r.seen.box.w > 242, '    и стал шире прежних 242 точек', `(${r.seen.box.w}px)`);
    if (r.seen.reply) {
      const lines = Math.round(r.seen.reply.h / 13);
      ok(lines <= 2, 'реплика укладывается максимум в две строки', `(высота ${r.seen.reply.h}px ≈ ${lines})`);
      ok(/^WOLFRAM:/.test(r.seen.reply.text), '    длинное имя не обрезано', `«${r.seen.reply.text}»`);
    } else ok(false, 'реплика показана');
    ok(!!r.seen.fact, 'расшифровка на месте', r.seen.fact ? `«${r.seen.fact.text}»` : '');
  } else ok(false, 'строка решений появилась');
  ok(r.errors.length === 0, 'ни одной ошибки на странице', r.errors[0] || '');
}

await browser.close();
console.log(failed ? `\n✗ ПРОВАЛОВ: ${failed}` : '\n✓ ВСЁ СОШЛОСЬ');
console.log(`снимки: ${OUT}`);
process.exit(failed ? 1 : 0);
