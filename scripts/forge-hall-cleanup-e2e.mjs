// forge-hall-cleanup-e2e.mjs — ЗАЛ FORGE ПОСЛЕ УБОРКИ ПРЕДМЕТОВ, В ЖИВОМ БРАУЗЕРЕ.
//
// Приёмка ТЗ «Зал FORGE: убрать ROSTER и FORGE, список — постоянный» (30.09.2026).
// По образцу соседних forge-islands-e2e.mjs / home-roster-e2e.mjs.
//
// ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ:
//   1. в ряду остались ровно три предмета (ASCENSION, TRAINING, SPAR) + безымянная
//      полка; планшета и наковальни в сцене нет;
//   2. просветы между кромками предметов равны, подписи не налезают, крайние не
//      подходят к рамке — на четырёх раскладках; множитель размера напечатан;
//   3. метка выхода бойца не попадает в полосу ряда при составах 1…10;
//   4. список ростера виден при входе и после закрытия меню на четырёх раскладках,
//      при составах 1, 3, 10; пустое место вокруг него нажатия пропускает;
//   5. круг: выбрать → нажать ещё раз → меню → закрыть → список вернулся;
//      занятого повторное нажатие меню не открывает;
//   6. кнопка TRAIN на экране ровно одна во всех состояниях: только список ·
//      список + меню · широкая горизонталь с тремя блоками;
//   7. ПРОГОН ПРОГРЕССА: назначить занятие → дождаться READY → зажечь кристалл;
//      запись игрока в конце выводится в файл — её сравнивают с прогоном на `main`
//      (SAVE_ONLY=1 — только этот раздел, для старого кода).
//
// ⚠️ ЧАСЫ ПОДМЕНЯЮТСЯ (Date.now): срок занятия пишется в запись игрока, и без
//    этого два прогона никогда не совпали бы побайтно. Часы замораживаются прямо
//    перед началом занятия и двигаются вручную.
//
//   BASE=http://127.0.0.1:5199 OUT=/tmp/hall-shots node scripts/forge-hall-cleanup-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:5199';
const OUT = process.env.OUT || '/tmp/hall-shots';
const WAIT = Number(process.env.WAIT || 14000);
const SAVE_ONLY = process.env.SAVE_ONLY === '1';
mkdirSync(OUT, { recursive: true });

const LAYOUTS = process.env.LAYOUTS
  ? process.env.LAYOUTS.split(',').map((x) => x.split('x').map(Number))
  : [[390, 844], [844, 390], [1280, 720], [1920, 1080]];
const CORES = ['natisk', 'skala', 'zasada', 'nalet'];

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

function save(n, { busy = [], picked = null } = {}) {
  const now = Date.now();   // занятой должен быть занят по настоящим часам страницы
  const fighters = [];
  for (let i = 0; i < n; i++) {
    const row = { id: 'f' + i, callsign: 'TEST-' + i, core: CORES[i % 4], createdAt: 1000 + i };
    if (busy.includes(i)) row.tr = now + 58_000;   // потолок восстановления — минута (LESSON_MS): занят весь прогон
    fighters.push(row);
  }
  const roster = { fighters, seeded: true };
  if (picked !== null) roster.picked = 'f' + picked;
  return { v: 1, roster };
}

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const pageErrors = [];
const NOISE = /TUNNEL|CERT_AUTHORITY|Amplitude|Failed to load resource/;

async function open({ w = 390, h = 844, s, wait = WAIT, clock = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(({ snap, clock }) => {
    if (snap && !sessionStorage.getItem('__seeded')) {
      sessionStorage.setItem('hexlash_progress', JSON.stringify(snap));
      sessionStorage.setItem('__seeded', '1');
    }
    if (clock) {
      const real = Date.now.bind(Date);
      window.__frozen = false; window.__T = 0;
      Date.now = () => (window.__frozen ? window.__T : real());
    }
  }, { snap: s, clock });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => pageErrors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) pageErrors.push(m.text().slice(0, 200)); });
  await p.goto(`${BASE}/play/pve?dev=1`, { waitUntil: 'commit', timeout: 60_000 });
  await p.waitForTimeout(wait);
  return { ctx, p };
}
const probe = (p) => p.evaluate(() => window.__forgeProbe && window.__forgeProbe());
/** Что видно из панелей на экране: списки, статы, карточка граней, кнопки TRAIN. */
const ui = (p) => p.evaluate(() => {
  const vis = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const rect = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
  const list = document.querySelector('.fp--list');
  const stats = document.querySelector('.fp--stats');
  const tree = [...document.querySelectorAll('.fp')].find((e) => !e.classList.contains('fp--list') && !e.classList.contains('fp--stats'));
  return {
    list: !!list, listBox: list ? rect(list.querySelector('.fp-card')) : null,
    beside: !!list && list.classList.contains('is-beside'),
    stats: !!stats, tree: !!tree,
    overlay: !!document.querySelector('.fco'),
    train: [...document.querySelectorAll('.fp-train-btn')].filter(vis).length,
    rows: [...document.querySelectorAll('.fp--list .fp-row')].map((e) => ({ on: e.classList.contains('on'), t: e.textContent.trim() })),
    state: (document.querySelector('.fp-state .v') || {}).textContent || null,
  };
});
const clickRow = async (p, i) => { await p.locator('.fp--list .fp-row').nth(i).click(); await p.waitForTimeout(900); };

// ───────────────────────── 7. ПРОГОН ПРОГРЕССА ─────────────────────────
async function progressRun(label) {
  console.log(`\n── прогон прогресса: назначить → READY → зажечь кристалл (${label}) ──`);
  // 1280×720: обе панели меню стоят рядом, список прячется — путь один и тот же
  // на старом коде и на новом (нажатие по телу).
  const { ctx, p } = await open({ w: 1280, h: 720, s: save(3, { picked: 0 }), clock: true });
  const pr = await probe(p);
  const t = pr.taps.f0;
  await p.mouse.click(t.sx * 1280, t.sy * 720);
  await p.waitForTimeout(1500);
  let u = await ui(p);
  ok(u.stats, 'нажатие по телу открыло статы', JSON.stringify({ stats: u.stats, tree: u.tree, train: u.train }));
  await p.evaluate(() => { window.__T = 1_700_000_000_000; window.__frozen = true; });
  await p.locator('.fp--stats .fp-train-btn').click();
  await p.waitForTimeout(1500);
  const busy = await p.evaluate(() => JSON.parse(sessionStorage.getItem('hexlash_progress')).roster.fighters[0].tr);
  ok(!!busy, 'занятие начато (срок записан)', String(busy));
  await p.evaluate(() => { window.__T += 61_000; });
  await p.waitForTimeout(2500);
  // Занятие кончилось — READY. Если часы зала не успели тикнуть, спросим ещё раз.
  let word = null;
  for (let i = 0; i < 6 && word !== 'READY'; i++) {
    await p.waitForTimeout(1500);
    word = (await ui(p)).state;
  }
  ok(/ready/i.test(word || ''), 'состояние бойца — READY', String(word));
  // Начало занятия закрывает меню (PveView.onTrain): открываем его заново нажатием по телу.
  const pr2 = await probe(p);
  await p.mouse.click(pr2.taps.f0.sx * 1280, pr2.taps.f0.sy * 720);
  await p.waitForTimeout(1500);
  u = await ui(p);
  ok(u.stats && u.tree, 'меню открыто заново после занятия', JSON.stringify({ stats: u.stats, tree: u.tree }));
  // разворот ядра: по нажатию на фигуру в карточке граней
  await p.locator('.fc-stage').first().click({ force: true });
  await p.waitForTimeout(1200);
  u = await ui(p);
  ok(u.overlay, 'разворот ядра открыт');
  await p.locator('.fco .fc-facet__key').first().focus();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
  await p.locator('.fco .fc-cryst__key').first().focus();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(500);
  await p.locator('.fco .fc-light').click();
  await p.waitForTimeout(800);
  const snap = await p.evaluate(() => sessionStorage.getItem('hexlash_progress'));
  const lit = /"lit"|state":"lit|lit/.test(snap || '');
  ok(lit, 'грань зажжена (в записи есть lit)');
  writeFileSync(`${OUT}/progress-${label}.json`, JSON.stringify(JSON.parse(snap), null, 1));
  await p.screenshot({ path: `${OUT}/progress-${label}.png` });
  await ctx.close();
}

if (SAVE_ONLY) {
  await progressRun(process.env.LABEL || 'run');
  await browser.close();
  console.log(failed ? `\nПРОВАЛОВ: ${failed}` : '\nВсё сошлось.');
  process.exit(failed ? 1 : 0);
}

const TAIL = process.env.ONLY_TAIL === '1';
// ───────────────────────── 1–2. РЯД ─────────────────────────
if (!TAIL) console.log('\n── ряд предметов: три предмета, равные просветы ──');
for (const [w, h] of (TAIL ? [] : LAYOUTS)) {
  const { ctx, p } = await open({ w, h, s: save(3) });
  const pr = await probe(p);
  const keys = Object.keys(pr.box).filter((k) => k !== 'shelf');
  ok(keys.sort().join() === 'ascension,bags,spar', `${w}×${h}: в ряду ASCENSION, TRAINING, SPAR`, keys.join());
  ok(!pr.box.roster && !pr.box.upgrade && !pr.taps.roster && !pr.taps.upgrade, `${w}×${h}: планшета и наковальни в сцене нет`);
  const bx = ['ascension', 'bags', 'spar'].map((k) => ({ k, ...pr.box[k] })).sort((a, b) => a.l - b.l);
  const gapsFull = [], gapsOwn = [];
  for (let i = 1; i < bx.length; i++) {
    gapsFull.push(+((bx[i].l - bx[i - 1].r) * w).toFixed(1));
    gapsOwn.push(+((bx[i].own.l - bx[i - 1].own.r) * w).toFixed(1));
  }
  console.log(`    множитель размера ×${pr.rowScale} (прежде ×0.748); просветы между кромками с подписью ${gapsFull} px, без подписи ${gapsOwn} px`);
  const spread = Math.max(...gapsFull) / Math.max(1e-9, Math.min(...gapsFull));
  ok(gapsFull.every((g) => g > 8) && spread < 1.6, `${w}×${h}: просветы (с подписью) положительные и ровные`, `разброс ×${spread.toFixed(2)}`);
  const ownSpread = Math.max(...gapsOwn) / Math.max(1e-9, Math.min(...gapsOwn));
  ok(ownSpread < 1.35, `${w}×${h}: просветы между самими предметами ровные`, `разброс ×${ownSpread.toFixed(2)}`);
  const edgeL = Math.min(...bx.map((b) => b.l)), edgeR = Math.max(...bx.map((b) => b.r));
  ok(edgeL > 0.02 && edgeR < 0.98, `${w}×${h}: крайние не подходят к рамке`, `слева ${(edgeL * 100).toFixed(1)}%, справа ${((1 - edgeR) * 100).toFixed(1)}%`);
  const lab = ['ascension', 'bags', 'spar'].map((k) => ({ k, ...pr.words[k] })).filter((x) => x.inkL != null).sort((a, b) => a.inkL - b.inkL);
  let overlap = false;
  for (let i = 1; i < lab.length; i++) if (lab[i].inkL <= lab[i - 1].inkR) overlap = true;
  ok(!overlap, `${w}×${h}: подписи не налезают`, lab.map((x) => `${x.k}[${(x.inkL * w).toFixed(0)}…${(x.inkR * w).toFixed(0)}]`).join(' '));
  await p.screenshot({ path: `${OUT}/row-${w}x${h}.png` });
  await ctx.close();
}

// ───────────────────────── 3. МЕТКА ─────────────────────────
console.log('\n── метка выхода бойца не в полосе ряда, составы 1…10 ──');
if (!TAIL) {
  const bad = [];
  for (let n = 1; n <= 10; n++) {
    const { ctx, p } = await open({ w: 390, h: 844, s: save(n), wait: 9000 });
    const pr = await probe(p);
    // метка стоит ЗА рядом: её z меньше дальней кромки полосы
    if (!(pr.mark && pr.mark.z < pr.band.zMin)) bad.push(`n${n}: метка z=${pr.mark && pr.mark.z}, полоса ${pr.band.zMin}…${pr.band.zMax}`);
    await ctx.close();
  }
  ok(bad.length === 0, 'метка вне полосы ряда при всех составах 1…10', bad.join(' | '));
}

// ───────────────────────── 4–6. СПИСОК, КРУГ, TRAIN ─────────────────────────
console.log('\n── постоянный список, круг открытия меню, кнопка TRAIN ──');
for (const [w, h] of (TAIL ? [] : LAYOUTS)) {
  const wide = w >= 1440 && w > h;
  for (const n of [1, 3, 10]) {
    const tag = `${w}×${h} n=${n}`;
    const { ctx, p } = await open({ w, h, s: save(n) });
    let u = await ui(p);
    ok(u.list && u.listBox && u.listBox[0] >= 0 && u.listBox[2] <= w, `${tag}: список виден при входе`, JSON.stringify(u.listBox));
    ok(u.rows.length === n, `${tag}: строк ${n}`, String(u.rows.length));
    ok(u.train === 1, `${tag}: только список — TRAIN ровно одна`, `кнопок ${u.train}`);
    await p.screenshot({ path: `${OUT}/list-${w}x${h}-n${n}.png` });

    if (n === 3) {
      // пустое место вокруг списка нажатий не перехватывает: точка у верхнего края,
      // на высоте, где карточка не стоит
      const hitTag = await p.evaluate(([x, y]) => (document.elementFromPoint(x, y) || {}).tagName, [Math.round(w * 0.9), 8]);
      ok(hitTag === 'CANVAS', `${tag}: пустое место у списка отдаёт нажатие сцене`, String(hitTag));

      // круг. Выбран нулевой (зал открывается с выбранным старшим). Первое нажатие
      // по СЛЕДУЮЩЕЙ строке — выбор без меню.
      await clickRow(p, 1);
      u = await ui(p);
      ok(!u.stats && !u.tree && u.rows[1].on, `${tag}: первое нажатие по строке — только выбор`, JSON.stringify(u.rows.map((r) => r.on)));
      await clickRow(p, 1);
      u = await ui(p);
      ok(u.stats, `${tag}: повторное нажатие открыло меню бойца`, JSON.stringify({ stats: u.stats, tree: u.tree, list: u.list, beside: u.beside }));
      ok(u.train === 1, `${tag}: список + меню — TRAIN ровно одна`, `кнопок ${u.train}`);
      if (wide) ok(u.list && u.beside && u.tree, `${tag}: три блока рядом (статы, карточка, список)`);
      else ok(!u.list, `${tag}: пока меню открыто, список скрыт`);
      await p.screenshot({ path: `${OUT}/menu-${w}x${h}.png` });
      await p.keyboard.press('Escape');
      await p.waitForTimeout(1200);
      u = await ui(p);
      ok(!u.stats && !u.tree && u.list, `${tag}: меню закрыто (Esc), список вернулся`, JSON.stringify({ list: u.list, box: u.listBox }));
      ok(u.train === 1, `${tag}: после закрытия меню TRAIN ровно одна (выбор снят — она погашена)`, `кнопок ${u.train}`);
      await p.screenshot({ path: `${OUT}/closed-${w}x${h}.png` });
      // возврат через нажатие мимо блока: открыть тем же кругом и закрыть тапом
      await clickRow(p, 0); await clickRow(p, 0);
      u = await ui(p);
      if (u.stats) {
        await p.mouse.click(Math.round(w * 0.5), Math.round(h * 0.18));
        await p.waitForTimeout(1200);
        u = await ui(p);
        ok(!u.stats && u.list, `${tag}: нажатие мимо блока закрыло меню, список вернулся`);
      } else ok(false, `${tag}: круг открытия для второго закрытия не открылся`);
    }
    await ctx.close();
  }
}

// занятой: повторное нажатие по его строке меню НЕ открывает
console.log('\n── занятой боец ──');
for (const [w, h] of [[390, 844], [844, 390]]) {
  const { ctx, p } = await open({ w, h, s: save(3, { busy: [1] }) });
  const before = await probe(p);
  await clickRow(p, 1);
  await clickRow(p, 1);
  const u = await ui(p);
  const after = await probe(p);
  ok(!u.stats && !u.tree, `${w}×${h}: по строке занятого меню не открылось`, JSON.stringify({ stats: u.stats, tree: u.tree }));
  const moved = JSON.stringify(before.cam.pos) !== JSON.stringify(after.cam.pos);
  ok(moved, `${w}×${h}: камера ушла к грушам`, JSON.stringify(after.cam.pos));
  await ctx.close();
}

await progressRun('new');

await browser.close();
console.log('\nошибки страницы:', pageErrors.length ? pageErrors.slice(0, 8) : 'нет');
ok(pageErrors.length === 0, 'страница без ошибок');
console.log(failed ? `\nПРОВАЛОВ: ${failed}` : '\nВсё сошлось.');
process.exit(failed ? 1 : 0);
