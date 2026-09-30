// forge-hall-cleanup-e2e.mjs — ЗАЛ FORGE ПОСЛЕ УБОРКИ ПРЕДМЕТОВ, В ЖИВОМ БРАУЗЕРЕ.
//
// Приёмка ТЗ «Зал FORGE: убрать ROSTER и FORGE, список — постоянный» (30.09.2026).
// По образцу соседних forge-islands-e2e.mjs / home-roster-e2e.mjs.
//
// ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ:
//   1. в ряду остались ровно три предмета (ASCENSION, TRAINING, SPAR), полки нет; планшета и наковальни в сцене нет;
//   2. просветы между кромками предметов равны, подписи не налезают, крайние не
//      подходят к рамке — на четырёх раскладках; множитель размера напечатан;
//   3. метка выхода бойца не попадает в полосу ряда при составах 1…10;
//   4. список ростера виден при входе и после закрытия меню на четырёх раскладках,
//      при составах 1, 3, 10; пустое место вокруг него нажатия пропускает;
//   5. круг: выбрать → нажать ещё раз → меню → закрыть → список вернулся;
//      занятого повторное нажатие меню не открывает;
//   6. кнопка TRAIN на экране ровно одна во всех состояниях: только список ·
//      список + меню · широкая горизонталь с тремя блоками;
//   6b. МЕТКА ВЫБРАННОГО БОЙЦА (добавка 2): левее ряда предметов, тело не закрывает ASCENSION и
//      его подпись, целиком в кадре и на плите, метка вне полосы ряда; на вертикали слева
//      места нет — метка прежняя (числа печатаются); поворот экрана переставляет метку;
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
  await p.waitForFunction(() => typeof window.__forgeProbe === 'function', null, { timeout: 120_000 });
  await p.waitForTimeout(Math.min(wait, 4000));
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
    bar: !!document.querySelector('.fp--list .fp-bar'),
    barBox: document.querySelector('.fp--list .fp-bar') ? rect(document.querySelector('.fp--list .fp-bar')) : null,
    collapse: !!document.querySelector('.fp--list .fp-collapse'),
    scrollBox: document.querySelector('.fp--list .fp-scroll') ? rect(document.querySelector('.fp--list .fp-scroll')) : null,
    trainBox: document.querySelector('.fp--list .fp-train-btn') ? rect(document.querySelector('.fp--list .fp-train-btn')) : null,
    selBox: document.querySelector('.fp--list .fp-row.on') ? rect(document.querySelector('.fp--list .fp-row.on')) : null,
    rows: [...document.querySelectorAll('.fp--list .fp-row')].map((e) => ({ on: e.classList.contains('on'), t: e.textContent.trim() })),
    state: (document.querySelector('.fp-state .v') || {}).textContent || null,
  };
});
// На вертикали список свёрнут в одну строку: перед работой со строками раскрываем.
const ensureRows = async (p) => {
  if (!(await p.locator('.fp--list .fp-row').count()) && (await p.locator('.fp--list .fp-bar-main').count())) {
    await p.locator('.fp--list .fp-bar-main').click(); await p.waitForTimeout(700);
  }
};
const clickRow = async (p, i) => { await ensureRows(p); await p.locator('.fp--list .fp-row').nth(i).click(); await p.waitForTimeout(900); };

// ───────────────────────── 7. ПРОГОН ПРОГРЕССА ─────────────────────────
async function progressRun(label, [W, H] = [1280, 720]) {
  const port = H > W;
  console.log(`\n── прогон прогресса ${W}×${H}: назначить → READY → зажечь кристалл (${label}) ──`);
  // Горизонталь: путь один и тот же на старом коде и на новом (нажатие по телу).
  // Вертикаль (новый код): занятие назначается кнопкой TRAIN свёрнутого списка.
  const { ctx, p } = await open({ w: W, h: H, s: save(3, { picked: 0 }), clock: true });
  const pr = await probe(p);
  let u;
  if (!port) {
    await p.mouse.click(pr.taps.f0.sx * W, pr.taps.f0.sy * H);
    await p.waitForTimeout(1500);
    u = await ui(p);
    ok(u.stats, 'нажатие по телу открыло статы', JSON.stringify({ stats: u.stats, tree: u.tree, train: u.train }));
  }
  await p.evaluate(() => { window.__T = 1_700_000_000_000; window.__frozen = true; });
  await p.locator(port ? '.fp--list .fp-bar .fp-train-btn' : '.fp--stats .fp-train-btn').click();
  await p.waitForTimeout(1500);
  const busy = await p.evaluate(() => JSON.parse(sessionStorage.getItem('hexlash_progress')).roster.fighters[0].tr);
  ok(!!busy, 'занятие начато (срок записан)', String(busy));
  await p.evaluate(() => { window.__T += 61_000; });
  await p.waitForTimeout(2500);
  let word = null;
  for (let i = 0; i < 6 && !/ready/i.test(word || ''); i++) {
    await p.waitForTimeout(1500);
    word = await p.evaluate(() => ((document.querySelector('.fp--list .fp-bar-main .st') || document.querySelector('.fp-state .v') || {}).textContent || '').trim());
  }
  ok(/ready/i.test(word || ''), 'состояние бойца — READY', String(word));
  // Начало занятия закрывает меню (PveView.onTrain): открываем его заново нажатием по телу.
  const pr2 = await probe(p);
  await p.mouse.click(pr2.taps.f0.sx * W, pr2.taps.f0.sy * H);
  await p.waitForTimeout(1500);
  u = await ui(p);
  ok(u.stats, 'меню открыто заново после занятия', JSON.stringify({ stats: u.stats, tree: u.tree }));
  if (port) {
    // стоя грани — вторым шагом, строкой в статах
    await p.locator('.fp--stats .fp-to-tree').click();
    await p.waitForTimeout(1200);
    u = await ui(p);
    ok(u.tree, 'карточка граней открыта (вторым шагом)');
  }
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
  ok(/lit/.test(snap || ''), 'грань зажжена (в записи есть lit)');
  writeFileSync(`${OUT}/progress-${label}.json`, JSON.stringify(JSON.parse(snap), null, 1));
  await p.screenshot({ path: `${OUT}/progress-${label}.png` });
  await ctx.close();
}

if (SAVE_ONLY) {
  await progressRun(process.env.LABEL || 'run', process.env.SIZE ? process.env.SIZE.split('x').map(Number) : [1280, 720]);
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
  const keys = Object.keys(pr.box);
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
if (!TAIL && process.env.SKIP_MARK !== '1') {
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
    const port = h > w;
    let u = await ui(p);
    ok(u.list && u.listBox && u.listBox[0] >= 0 && u.listBox[2] <= w, `${tag}: список виден при входе`, JSON.stringify(u.listBox));
    if (port) ok(u.bar && u.rows.length === 0, `${tag}: на вертикали свёрнут в одну строку`, JSON.stringify(u.barBox));
    else ok(u.rows.length === n, `${tag}: строк ${n}`, String(u.rows.length));
    ok(u.train === 1, `${tag}: только список — TRAIN ровно одна`, `кнопок ${u.train}`);
    // Лёжа список выглядит как в 17ba4777: рамка карточки та же (числа сняты с того коммита).
    const BEFORE = { '844x390 n=10': [544, 48, 828, 342], '1280x720 n=1': [840, 180, 1264, 541], '1280x720 n=3': [840, 132, 1264, 589],
      '1280x720 n=10': [840, 48, 1264, 672], '1920x1080 n=3': [1480, 312, 1904, 769], '1920x1080 n=10': [1480, 144, 1904, 937] };
    const was = BEFORE[`${w}x${h} n=${n}`];
    if (was && !port) ok(JSON.stringify(u.listBox) === JSON.stringify(was), `${tag}: рамка списка не изменилась относительно 17ba4777`, `${JSON.stringify(u.listBox)} против ${JSON.stringify(was)}`);
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

// ───────────────────────── ВЕРТИКАЛЬ: список и ряд предметов ─────────────────────────
// Дополнение к ТЗ (30.09.2026): полоса списка не заходит на полосу ряда предметов ни при
// каком составе; по ASCENSION, TRAINING и SPAR можно нажать; выбранный виден без прокрутки,
// TRAIN видна при любом положении прокрутки.
if (!TAIL && LAYOUTS.some(([w]) => w === 390)) {
console.log('\n── вертикаль 390×844: полосы не пересекаются, предметы нажимаются ──');
const [W, H] = [390, 844];
for (const n of [1, 3, 4, 5, 7, 8, 10]) {
  const tag = `${W}×${H} n=${n}`;
  const { ctx, p } = await open({ w: W, h: H, s: save(n) });
  const pr = await probe(p);
  const labBot = Math.max(...['ascension', 'bags', 'spar'].map((k) => pr.box[k].label.b * H));
  const rowTop = Math.min(...['ascension', 'bags', 'spar'].map((k) => pr.box[k].t * H));
  let u = await ui(p);
  const barTop = u.barBox ? u.barBox[1] : null;
  console.log(`    полоса ряда y ${rowTop.toFixed(0)}…${labBot.toFixed(0)}; свёрнутый список y ${u.barBox ? u.barBox[1] + '…' + u.barBox[3] : '—'}`);
  const WAS = { 1: 751.9, 3: 751.9, 4: 751.9, 5: 749.6, 7: 749.6, 8: 748.1, 10: 748.1 };   // низ подписей на 9bc59176
  ok(Math.abs(labBot - WAS[n]) < 0.2 && JSON.stringify(u.barBox) === JSON.stringify([0, 756, 390, 800]), `${tag}: строка списка и зазор те же, что на 9bc59176`, `низ подписей ${labBot.toFixed(1)} (было ${WAS[n]}), строка ${JSON.stringify(u.barBox)}`);
  ok(u.bar && barTop >= labBot, `${tag}: свёрнутый список не заходит на полосу ряда`, `верх списка ${barTop}, низ подписей ${labBot.toFixed(1)}, зазор ${(barTop - labBot).toFixed(1)}`);
  ok(u.train === 1, `${tag}: TRAIN ровно одна (в свёрнутой строке)`, `кнопок ${u.train}`);
  await p.screenshot({ path: `${OUT}/vert-compact-n${n}.png` });
  if (n === 10 || n === 3) {
    // развёрнутый: выбранный виден без прокрутки, TRAIN приколота
    await p.locator('.fp--list .fp-bar-main').click(); await p.waitForTimeout(800);
    u = await ui(p);
    const inside = (a, b) => a && b && a[1] >= b[1] - 1 && a[3] <= b[3] + 1;
    ok(u.collapse && u.rows.length === n, `${tag}: развёрнут, есть кнопка «свернуть»`, `строк ${u.rows.length}`);
    ok(inside(u.selBox, u.scrollBox), `${tag}: выбранный боец виден без прокрутки`, `строка ${JSON.stringify(u.selBox)} в прокрутке ${JSON.stringify(u.scrollBox)}`);
    ok(u.train === 1, `${tag}: развёрнут — TRAIN ровно одна`, `кнопок ${u.train}`);
    await p.screenshot({ path: `${OUT}/vert-expanded-n${n}.png` });
    await p.evaluate(() => { const e = document.querySelector('.fp--list .fp-scroll'); e.scrollTop = e.scrollHeight; });
    await p.waitForTimeout(400);
    u = await ui(p);
    ok(inside(u.trainBox, u.scrollBox), `${tag}: TRAIN видна и после прокрутки до конца`, `кнопка ${JSON.stringify(u.trainBox)} в прокрутке ${JSON.stringify(u.scrollBox)}`);
    await p.screenshot({ path: `${OUT}/vert-expanded-scrolled-n${n}.png` });
    await p.locator('.fp--list .fp-collapse').click(); await p.waitForTimeout(600);
    u = await ui(p);
    ok(u.bar, `${tag}: нажатие по «выбран» свернуло список обратно`);
  }
  await ctx.close();
}
// Нажатия по предметам сквозь свёрнутый список: на трёх составах.
const camOf = async (p) => JSON.stringify((await probe(p)).cam.pos);
for (const n of [1, 3, 10]) {
  for (const key of ['ascension', 'bags', 'spar']) {
    const tag = `${W}×${H} n=${n} ${key}`;
    const { ctx, p } = await open({ w: W, h: H, s: save(n) });
    const pr = await probe(p);
    const t = pr.taps[key];
    const before = await camOf(p);
    await p.mouse.click(Math.round(t.sx * W), Math.round(t.sy * H));
    await p.waitForTimeout(key === 'ascension' ? 4000 : 3500);
    if (key === 'ascension') {
      ok(new URL(p.url()).pathname === '/play/ascension', `${tag}: нажатие попало в предмет, ушли на ASCENSION`, p.url());
    } else {
      const after = await p.evaluate(() => window.__forgeProbe && JSON.stringify(window.__forgeProbe().cam.pos));
      ok(after && after !== before, `${tag}: нажатие попало в предмет, камера улетела на остров`, `${before} → ${after}`);
    }
    await p.screenshot({ path: `${OUT}/vert-tap-${key}-n${n}.png` });
    await ctx.close();
  }
}
}

// ───────────────────────── МЕТКА ВЫБРАННОГО БОЙЦА (добавка 2) ─────────────────────────
// Боец на метке — тот, чьё тело нельзя мерить по «сохранённой позе»: ждём, пока он дойдёт.
const inter = (a, c) => !(a.r <= c.l || c.r <= a.l || a.b <= c.t || c.b <= a.t);
async function onMarkProbe(p) {
  let pr = null, cur = null;
  for (let i = 0; i < 45; i++) {
    await p.waitForTimeout(1000);
    pr = await probe(p);
    cur = pr.bodies.find((x) => Math.hypot(x.x - pr.mark.x, x.z - pr.mark.z) < 0.2);
    if (cur) break;
  }
  return { pr, cur };
}
if (!TAIL) {
console.log('\n── метка бойца: левее ряда, тело не закрывает ASCENSION и подпись ──');
for (const [w, h] of LAYOUTS) {
  const port = h > w;
  for (const n of [1, 3, 10]) {
    const tag = `${w}×${h} n=${n}`;
    const { ctx, p } = await open({ w, h, s: save(n) });
    const { pr, cur } = await onMarkProbe(p);
    ok(!!cur, `${tag}: выбранный боец дошёл до метки`, JSON.stringify(pr.mark));
    if (!cur) { await ctx.close(); continue; }
    const asc = pr.box.ascension;
    const hitAsc = inter(cur, asc) || inter(cur, asc.own) || inter(cur, asc.label);
    const info = `тело x ${(cur.l * w).toFixed(0)}…${(cur.r * w).toFixed(0)} px, ASCENSION с подписью x ${(asc.l * w).toFixed(0)}…${(asc.r * w).toFixed(0)} px, зазор ${((asc.l - cur.r) * w).toFixed(0)} px`;
    if (port) {
      // Слева места нет: метка остаётся прежней (условие отката). Числа — в отчёт.
      ok(pr.markLeftUsed === false, `${tag}: слева места нет — метка прежняя`, info);
      console.log(`    вертикаль n=${n}: перекрытие с ASCENSION ${hitAsc ? 'ЕСТЬ' : 'нет'} (прежнее место метки); ${info}`);
    } else {
      ok(pr.markLeftUsed === true, `${tag}: метка левее ряда`, JSON.stringify(pr.mark));
      ok(!hitAsc, `${tag}: тело не закрывает ASCENSION и подпись`, info);
    }
    ok(pr.mark.z < pr.band.zMin, `${tag}: метка вне полосы ряда`, `z ${pr.mark.z} < ${pr.band.zMin}`);
    ok(cur.l >= 0 && cur.r <= 1 && cur.t >= 0 && cur.b <= 1, `${tag}: боец целиком в кадре`, JSON.stringify([cur.l, cur.r, cur.t, cur.b]));
    ok(cur.x - 0.4 + pr.slab.width / 2 >= 0.3, `${tag}: не за левым ребром плиты`, `запас ${(cur.x - 0.4 + pr.slab.width / 2).toFixed(2)} м`);
    await p.waitForTimeout(4000);
    await p.screenshot({ path: `${OUT}/mark-${w}x${h}-n${n}.png` });
    await ctx.close();
  }
}
// Поворот экрана: вертикаль → горизонталь → вертикаль. Метка переставляется, боец идёт на неё.
{
  const { ctx, p } = await open({ w: 390, h: 844, s: save(3) });
  let { pr, cur } = await onMarkProbe(p);
  ok(pr.markLeftUsed === false, 'поворот: в вертикали метка прежняя', JSON.stringify(pr.mark));
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(1500);
  ({ pr, cur } = await onMarkProbe(p));
  ok(pr.markLeftUsed === true && !!cur, 'поворот: в горизонтали метка левее, боец дошёл', JSON.stringify(pr.mark));
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(1500);
  ({ pr, cur } = await onMarkProbe(p));
  ok(pr.markLeftUsed === false && !!cur, 'поворот: обратно в вертикали метка прежняя, боец дошёл', JSON.stringify(pr.mark));
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
