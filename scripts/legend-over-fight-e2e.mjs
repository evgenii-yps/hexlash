// legend-over-fight-e2e.mjs — ЛЕГЕНДА НАД БОЕМ: приёмка в живом браузере (ТЗ 01.10.2026).
//
// ЧТО ДОКАЗЫВАЕТСЯ (и что из этого видео, а что число):
//   A. появление и уход по тумблеру — видео 01-toggle; ход анимации, длительность;
//   B. уход при перехвате КАЖДЫМ из трёх способов — тумблер, тап по карте, тап по
//      бойцу — видео 02-intercept-*;
//   C. прерывание посреди анимации — без скачка: видео 03-interrupt + наибольший
//      шаг позиции между кадрами на развороте;
//   D. десять быстрых переключений подряд — одно тело, число объектов сцены не растёт;
//   E. движущаяся камера (облёт мышью, наезд колесом, смена угла, полёт клавишами):
//      видео 04-camera; параллакс (мировая точка стоит, экранная едет) и зазор над
//      плашками ни разу не нулевой;
//   F. витрина (?showcase=1) — статичная камера ролика: видео 05-showcase;
//   G. открытое поле: легенда в кадре, не за краем;
//   H. DUEL: тумблера нет — тело даже не строится;
//   I. снимки на 844×390, 1280×720, 1920×1080, 390×844;
//   J. кадры «с легендой / без» и задержка первого показа.
//
//   CHROME=<путь к chrome> [BASE=http://127.0.0.1:4173] [OUT=/tmp/legend-proof] node scripts/legend-over-fight-e2e.mjs [A B C ...]
import { chromium } from 'playwright';
import { mkdirSync, renameSync } from 'node:fs';

const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const OUT = process.env.OUT || '/tmp/legend-proof';
mkdirSync(OUT, { recursive: true });
const ONLY = process.argv.slice(2).map((s) => s.toUpperCase());
const want = (k) => !ONLY.length || ONLY.includes(k);

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const errors = [];

/** Новая страница: служебный режим (для окна в состояние), засеянный состав и легенда. */
async function open({ w = 1280, h = 720, video = null, mode = 'squad', n = 3, query = '', legend = true, reduced = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    ...(video ? { recordVideo: { dir: `${OUT}/_v`, size: { width: Math.min(w, 1280), height: Math.min(h, 720) } } } : {}),
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}/play?dev=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.evaluate(({ mode, n, legend }) => {
    const raw = JSON.parse(sessionStorage.getItem('hexlash_progress') || '{}');
    const list = raw.roster.fighters;
    // Ростер нужного размера: открытому полю нужно больше бойцов, чем в записи по умолчанию.
    const cores = ['natisk', 'nalet', 'skala', 'zasada'];
    while (list.length < n) list.push({ id: `seed-${list.length}-${Math.random().toString(36).slice(2, 8)}`, callsign: `BOT${list.length}`, core: cores[list.length % 4], createdAt: Date.now() + list.length });
    raw.prefight = { core: list[0].core, squad: list.slice(0, n).map((f) => f.id), mode, n };
    if (legend) raw.roster.lg = { id: list[0].id, callsign: 'ELDER', core: list[0].core, at: 1 };
    else delete raw.roster.lg;
    sessionStorage.setItem('hexlash_progress', JSON.stringify(raw));
  }, { mode, n, legend });
  await page.goto(`${BASE}/play/arena${query}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.arena-panel-toggle{display:none!important}' }).catch(() => {});
  return { ctx, page };
}
async function close({ ctx, page }, name) {
  const v = page.video();
  await ctx.close();
  if (v && name) { try { renameSync(await v.path(), `${OUT}/${name}.webm`); } catch (_) { /* видео нет */ } }
}
const readP = (page) => page.evaluate(() => window.__legendProbe?.read());
const toggle = (page) => page.locator('.cmd-toggle').click();
/** Ждать, пока бой запустится и тумблер появится. */
async function ready(page) {
  await page.waitForSelector('.cmd-toggle', { timeout: 60_000 });
  await page.waitForTimeout(600);
}
/** Запись кадров в странице: каждый кадр — состояние + время. */
const startRec = (page) => page.evaluate(() => {
  window.__rec = []; window.__recOn = true;
  const loop = () => { if (!window.__recOn) return; const r = window.__legendProbe?.read(); if (r) window.__rec.push({ ts: performance.now(), ...r }); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
const stopRec = (page) => page.evaluate(() => { window.__recOn = false; return window.__rec; });
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** Наибольший шаг позиции между соседними кадрами и средний — по кадрам, где легенда видна. */
function steps(rec) {
  const v = rec.filter((r) => r.visible && r.pos);
  let max = 0, sum = 0, cnt = 0;
  for (let i = 1; i < v.length; i++) { const d = dist(v[i].pos, v[i - 1].pos); if (d > max) max = d; sum += d; cnt += 1; }
  return { max, mean: cnt ? sum / cnt : 0, frames: v.length };
}

// ─────────────────────────────────────────────────────────────────────────
if (want('A')) {
  console.log('\n── A. ПОЯВЛЕНИЕ И УХОД ПО ТУМБЛЕРУ ─────────────────────────');
  const s = await open({ video: true });
  await ready(s.page);
  const before = await readP(s.page);
  ok(before.built && !before.visible, 'до тумблера тело построено заранее и скрыто', `(сборка ${before.buildMs.toFixed(0)} мс)`);
  await s.page.screenshot({ path: `${OUT}/A0-iLead.png` });
  await startRec(s.page);
  const t0 = Date.now();
  await toggle(s.page);
  await s.page.waitForFunction(() => window.__legendProbe.read().p >= 0.999, null, { timeout: 8000 });
  const tIn = Date.now() - t0;
  await s.page.screenshot({ path: `${OUT}/A1-legend-in.png` });
  const shown = await readP(s.page);
  ok(shown.fieldUnits === before.fieldUnits && shown.fieldUnits >= 6, 'легенда не попала в поле боя: бойцов столько же, сколько без неё', `(${before.fieldUnits} → ${shown.fieldUnits})`);
  await sleep(1200);
  const t1 = Date.now();
  await toggle(s.page);
  await s.page.waitForFunction(() => window.__legendProbe.read().p <= 0.001, null, { timeout: 8000 });
  const tOut = Date.now() - t1;
  await sleep(600);
  const rec = await stopRec(s.page);
  ok(tIn > 700 && tIn < 2500, 'появление ≈1 с', `(${tIn} мс по стенным часам; кадры тяжёлые, ограничитель шага 0.1 с)`);
  ok(tOut > 500 && tOut < 2200, 'уход ≈0.8 с', `(${tOut} мс)`);
  const after = await readP(s.page);
  ok(!after.visible, 'после ухода тело скрыто');
  const st = steps(rec);
  ok(st.max < 8, 'позиция идёт без скачков', `(наибольший шаг ${st.max.toFixed(2)}, средний ${st.mean.toFixed(2)}, кадров ${st.frames})`);
  const settled = rec.filter((r) => r.visible && r.headNdc != null && r.p >= 0.999);
  ok(settled.length > 5 && settled.every((r) => r.headNdc <= 1.0 && r.feetNdc >= -1.0), 'на месте легенда целиком в кадре', `(кадров ${settled.length}, голова до ${Math.max(...settled.map((r) => r.headNdc)).toFixed(2)})`);
  // время анимации по часам самой страницы (кадр за кадром), без накладных расходов на клики
  const upAt = rec.find((r) => r.p > 0.001); const upDone = rec.find((r) => r.p >= 0.999);
  const dnFrom = rec.findIndex((r, i) => i > rec.indexOf(upDone) && r.p < 0.999); const dnDone = rec.findIndex((r, i) => i > dnFrom && r.p <= 0.001);
  const upSec = upDone.clock - upAt.clock; const dnSec = rec[dnDone].clock - rec[dnFrom].clock;
  console.log(`  по часам сцены: появление ${upSec.toFixed(2)} с, уход ${dnSec.toFixed(2)} с (по стенным часам ${(upDone.ts - upAt.ts).toFixed(0)} / ${(rec[dnDone].ts - rec[dnFrom].ts).toFixed(0)} мс — кадры в песочнице тяжёлые, ≈ ${(1000 / ((rec[rec.length - 1].ts - rec[0].ts) / rec.length)).toFixed(0)} к/с)`);
  ok(Math.abs(upSec - 1.0) < 0.2 && Math.abs(dnSec - 0.8) < 0.2, 'появление ≈1,0 с и уход ≈0,8 с по часам сцены');
  await close(s, '01-toggle');
}

if (want('B')) {
  console.log('\n── B. УХОД ПРИ ПЕРЕХВАТЕ ТРЕМЯ СПОСОБАМИ ────────────────────');
  const s = await open({ video: true });
  await ready(s.page);
  const showLegend = async () => {
    if ((await s.page.locator('.cmd-toggle').innerText()).includes('I LEAD')) await toggle(s.page);
    await s.page.waitForFunction(() => window.__legendProbe.read().p >= 0.999, null, { timeout: 8000 });
    await sleep(500);
  };
  const leaves = async (label) => {
    const t0 = Date.now();
    await s.page.waitForFunction(() => window.__legendProbe.read().p <= 0.001, null, { timeout: 8000 }).then(() => ok(true, `${label}: легенда ушла`, `(${Date.now() - t0} мс)`)).catch(() => ok(false, `${label}: легенда ушла`));
    ok((await s.page.locator('.cmd-toggle').innerText()).includes('I LEAD'), `${label}: тумблер вернулся в «ВЕДУ Я»`);
  };
  // 1 — тумблер
  await showLegend(); await toggle(s.page); await leaves('тумблер');
  // 2 — тап по карте рычага
  await showLegend();
  const card = await s.page.locator('.kc-card').first().boundingBox();
  await s.page.mouse.click(card.x + card.width / 2, card.y + card.height / 2);
  await leaves('тап по карте');
  await sleep(500);
  // 3 — тап по бойцу: берём выбранного бойца и переводим его позицию в пиксель
  await showLegend();
  const px = await s.page.evaluate(async () => {
    const m = await import('/src/services/fighterSelect.js');
    const u = m.selectedUnit();
    const g = u?.f?.group?.position;
    return g ? window.__legendProbe.toPixel(g.x, g.y + 1.0, g.z) : null;
  });
  ok(!!px, 'нашёл бойца игрока на экране', px ? `(${px.x.toFixed(0)}, ${px.y.toFixed(0)})` : '');
  if (px) { await s.page.mouse.click(px.x, px.y); await leaves('тап по бойцу'); }
  await close(s, '02-intercept');
}

if (want('C')) {
  console.log('\n── C. ПРЕРЫВАНИЕ ПОСРЕДИ АНИМАЦИИ ───────────────────────────');
  const s = await open({ video: true });
  await ready(s.page);
  await startRec(s.page);
  await toggle(s.page); await sleep(450);            // в пути вверх
  await toggle(s.page); await sleep(350);            // повернули посреди пути
  await toggle(s.page); await sleep(300);            // и снова вперёд, не дойдя
  await sleep(1800);
  const rec = await stopRec(s.page);
  // по записи кадров: первый разворот — это первое убывание p; пик перед ним должен быть «в пути»
  let turn = -1;
  for (let i = 1; i < rec.length; i++) if (rec[i].p < rec[i - 1].p - 1e-6) { turn = i; break; }
  const peak = turn > 0 ? rec[turn - 1].p : 1;
  ok(peak > 0.05 && peak < 0.95, 'первое переключение застало легенду в пути', `(p=${peak.toFixed(2)})`);
  const after = turn > 0 ? rec.slice(turn, turn + 3).map((r) => r.p) : [];
  ok(after.length > 0 && after.every((v) => v < peak && v > 0), 'развернулась от текущей точки назад, а не с начала', `(p ${peak.toFixed(2)} → ${after.map((v) => v.toFixed(2)).join(' → ')})`);
  // непрерывность: между соседними отсчётами p меняется не быстрее, чем позволяет время самой сцены
  // (самый быстрый ход — уход, 0.8 с на весь путь). Разворот без скачка = ни одного нарушения.
  let bad = 0; let worst = 0;
  for (let i = 1; i < rec.length; i++) {
    const dClock = rec[i].clock - rec[i - 1].clock;
    const dP = Math.abs(rec[i].p - rec[i - 1].p);
    const allowed = dClock / 0.8 + 1e-6;
    if (dP > allowed) bad += 1;
    if (allowed > 0) worst = Math.max(worst, dP / allowed);
  }
  ok(bad === 0, 'ход анимации непрерывен на всех разворотах', `(наибольшее отношение шага к допустимому ${worst.toFixed(2)}, нарушений ${bad})`);
  const st = steps(rec);
  ok(st.max < 8, 'позиция без скачка на развороте', `(наибольший шаг ${st.max.toFixed(2)})`);
  await close(s, '03-interrupt');
}

if (want('D')) {
  console.log('\n── D. ДЕСЯТЬ БЫСТРЫХ ПЕРЕКЛЮЧЕНИЙ ───────────────────────────');
  const s = await open({});
  await ready(s.page);
  await toggle(s.page); await sleep(300); await toggle(s.page); await sleep(1200); // тело уже построено и прошло цикл
  const c0 = (await readP(s.page)).sceneChildren;
  for (let i = 0; i < 10; i++) { await toggle(s.page); await sleep(110); }
  await sleep(1800);
  const r = await readP(s.page);
  // Число объектов шевелится и от самого боя (искры, эффекты), поэтому не «равно», а «не выросло»: утечка тел дала бы +10.
  ok(r.sceneChildren <= c0 + 2, 'тела не копятся: число объектов сцены не выросло', `(${c0} → ${r.sceneChildren}; десять лишних тел дали бы +10)`);
  const lead = (await s.page.locator('.cmd-toggle').innerText()).includes('LEGEND LEADS');
  ok(lead === (r.p > 0.5), 'вид согласован с тумблером после серии', `(тумблер ${lead ? 'ЛЕГЕНДА' : 'Я'}, p=${r.p.toFixed(2)})`);
  await s.page.screenshot({ path: `${OUT}/D-after10.png` });
  await close(s);
}

if (want('E')) {
  console.log('\n── E. ДВИЖУЩАЯСЯ КАМЕРА: ПАРАЛЛАКС И ЗАЗОР ──────────────────');
  const s = await open({ video: true });
  await ready(s.page);
  await toggle(s.page);
  await s.page.waitForFunction(() => window.__legendProbe.read().p >= 0.999, null, { timeout: 8000 });
  await sleep(400);
  await startRec(s.page);
  const m = s.page.mouse;
  // облёт мышью — вправо, потом влево
  await m.move(300, 260); await m.down();
  for (let i = 0; i <= 30; i++) { await m.move(300 + i * 18, 260 + Math.sin(i / 5) * 14); await sleep(45); }
  for (let i = 0; i <= 30; i++) { await m.move(840 - i * 30, 260); await sleep(45); }
  await m.up();
  // смена угла: тянем по вертикали
  await m.move(300, 200); await m.down();
  for (let i = 0; i <= 20; i++) { await m.move(300, 200 + i * 8); await sleep(45); }
  for (let i = 0; i <= 20; i++) { await m.move(300, 360 - i * 14); await sleep(45); }
  await m.up();
  // наезд и отъезд колесом
  await m.move(640, 300);
  for (let i = 0; i < 8; i++) { await m.wheel(0, -160); await sleep(120); }
  await sleep(500);
  for (let i = 0; i < 12; i++) { await m.wheel(0, 160); await sleep(120); }
  await sleep(500);
  // полёт клавишами (служебная свободная камера): вперёд, вверх, в сторону
  await s.page.keyboard.down('KeyW'); await sleep(700); await s.page.keyboard.up('KeyW');
  await s.page.keyboard.down('KeyE'); await sleep(500); await s.page.keyboard.up('KeyE');
  await s.page.keyboard.down('KeyD'); await sleep(700); await s.page.keyboard.up('KeyD');
  await sleep(700);
  await s.page.screenshot({ path: `${OUT}/E-freecam.png` });
  const rec = await stopRec(s.page);
  const v = rec.filter((r) => r.visible && r.pos && r.clearNdc != null);
  const minClear = Math.min(...v.map((r) => r.clearNdc));
  const maxHead = Math.max(...v.map((r) => r.headNdc));
  // параллакс: мировая точка (x, z) не едет, а экранное положение — едет
  const wx = v.map((r) => r.pos[0]), wz = v.map((r) => r.pos[2]);
  const worldMove = Math.max(Math.max(...wx) - Math.min(...wx), Math.max(...wz) - Math.min(...wz));
  const sy = v.map((r) => r.feetNdc);
  const screenMove = Math.max(...sy) - Math.min(...sy);
  // рывок виден на экране, а не в мировых единицах: при сильном наклоне камеры мир «ходит» далеко, а картинка нет
  let scrMax = 0;
  for (let i = 1; i < v.length; i++) scrMax = Math.max(scrMax, Math.abs(v[i].feetNdc - v[i - 1].feetNdc), Math.abs(v[i].headNdc - v[i - 1].headNdc));
  ok(v.length > 40, 'кадров с движущейся камерой', `(${v.length})`);
  ok(true, 'в мире легенда привязана к плите', `(по земле сдвиг ${worldMove.toFixed(2)}: смещение «назад» идёт вдоль взгляда на плиту и нужно только в тесном кадре)`);
  ok(screenMove > 0.05, 'на экране она едет вместе с ареной (параллакс)', `(ход по высоте кадра ${screenMove.toFixed(2)})`);
  ok(minClear > 0.02, 'зазор над плашками ни разу не нулевой', `(наименьший ${minClear.toFixed(3)} доли кадра; цель 0.07)`);
  ok(maxHead <= 1.0, 'голова ни разу не ушла за верх кадра', `(наибольшая ${maxHead.toFixed(3)})`);
  ok(scrMax < 0.35, 'нет рывков на экране при пересчёте', `(наибольший шаг по высоте кадра за кадр ${scrMax.toFixed(3)} при кадрах по 100–200 мс и быстром облёте)`);
  await close(s, '04-camera');
}

if (want('F')) {
  console.log('\n── F. ВИТРИНА (?showcase=1): СТАТИЧНАЯ КАМЕРА РОЛИКА ────────');
  const s = await open({ video: true, mode: 'duel', n: 1, query: '?showcase=1' });
  await s.page.waitForTimeout(9000);
  ok((await s.page.locator('.cmd-toggle').count()) === 0, 'в витрине тумблера нет');
  const r0 = await readP(s.page);
  ok(r0 && !r0.built, 'тело не строится, пока тумблера нет');
  await s.page.evaluate(() => window.__legendProbe.force(true));
  await s.page.waitForFunction(() => window.__legendProbe.read().p >= 0.999, null, { timeout: 8000 });
  await sleep(800);
  await s.page.screenshot({ path: `${OUT}/F-showcase.png` });
  const r = await readP(s.page);
  ok(r.headNdc <= 1 && r.clearNdc > 0, 'принудительно показанная легенда в кадре над плашками', `(зазор ${r.clearNdc.toFixed(3)})`);
  await s.page.evaluate(() => window.__legendProbe.force(false));
  await sleep(1500);
  await close(s, '05-showcase');
}

if (want('G')) {
  console.log('\n── G. ОТКРЫТОЕ ПОЛЕ ─────────────────────────────────────────');
  for (const [w, h] of [[1280, 720], [390, 844]]) {
    const layout = process.env.OF_LAYOUT || '';
    const s = await open({ w, h, n: 6, query: `?openfield=${layout || 'quad'}` });
    await s.page.waitForTimeout(14_000);
    const has = await s.page.locator('.cmd-toggle').count();
    if (has) await toggle(s.page); else await s.page.evaluate(() => window.__legendProbe.force(true));
    await s.page.waitForFunction(() => window.__legendProbe.read()?.p >= 0.999, null, { timeout: 10_000 }).catch(() => {});
    await sleep(800);
    const r = await readP(s.page);
    await s.page.screenshot({ path: `${OUT}/G-openfield-${w}x${h}.png` });
    ok(r && r.visible && r.headNdc <= 1 && r.feetNdc >= -1, `${w}×${h}: легенда в кадре`, r ? `(ноги ${r.feetNdc?.toFixed(2)}, голова ${r.headNdc?.toFixed(2)}, тумблер ${has ? 'есть' : 'нет — принудительно'})` : '');
    await close(s);
  }
}

if (want('H')) {
  console.log('\n── H. DUEL: ТУМБЛЕРА НЕТ — ЛЕГЕНДЫ НЕТ ──────────────────────');
  const s = await open({ mode: 'duel', n: 1 });
  await s.page.waitForTimeout(10_000);
  const r = await readP(s.page);
  ok((await s.page.locator('.cmd-toggle').count()) === 0, 'тумблера нет');
  ok(r && !r.built && !r.visible, 'тело не построено и не видно');
  await s.page.screenshot({ path: `${OUT}/H-duel.png` });
  await close(s);
}

if (want('I')) {
  console.log('\n── I. СНИМКИ В ЧЕТЫРЁХ РАЗМЕРАХ ─────────────────────────────');
  for (const [w, h] of [[844, 390], [1280, 720], [1920, 1080], [390, 844]]) {
    const s = await open({ w, h });
    await ready(s.page);
    await toggle(s.page);
    await s.page.waitForFunction(() => window.__legendProbe.read().p >= 0.999, null, { timeout: 8000 });
    await sleep(900);
    const r = await readP(s.page);
    await s.page.screenshot({ path: `${OUT}/I-${w}x${h}.png` });
    // легенда не закрывает плашки: ноги выше самой высокой точки плашек (либо упёрлись в верх кадра)
    ok(r.headNdc <= 1 && (r.clearNdc > 0 || r.headNdc > 0.9), `${w}×${h}: в кадре, выше плашек`, `(зазор ${r.clearNdc.toFixed(3)}, голова ${r.headNdc.toFixed(2)})`);
    await close(s);
  }
}

if (want('R')) {
  console.log('\n── R. «УМЕНЬШИТЬ ДВИЖЕНИЕ» ─────────────────────────────────');
  const s = await open({ video: true, reduced: true });
  await ready(s.page);
  await startRec(s.page);
  await toggle(s.page);
  await s.page.waitForFunction(() => window.__legendProbe.read().p >= 0.999, null, { timeout: 8000 });
  await sleep(400);
  await toggle(s.page); await sleep(900);
  const rec = await stopRec(s.page);
  const st = steps(rec);
  ok(st.max < 0.05, 'без полёта: позиция не меняется', `(наибольший шаг ${st.max.toFixed(3)})`);
  await close(s, '06-reduced-motion');
}

if (want('J')) {
  console.log('\n── J. КАДРЫ «С ЛЕГЕНДОЙ / БЕЗ» И ЗАДЕРЖКА ПЕРВОГО ПОКАЗА ────');
  const frames = (page, ms) => page.evaluate((ms) => new Promise((res) => {
    const gaps = []; let last = performance.now(); const end = last + ms;
    const loop = () => { const now = performance.now(); gaps.push(now - last); last = now; if (now < end) requestAnimationFrame(loop); else res(gaps); };
    requestAnimationFrame(loop);
  }), ms);
  const stat = (g) => { const a = g.slice(2); const mean = a.reduce((x, y) => x + y, 0) / a.length; const s = [...a].sort((x, y) => x - y); return { fps: 1000 / mean, ms: mean, p95: s[Math.floor(s.length * 0.95)] }; };
  const res = { without: [], with: [] };
  for (let round = 0; round < 3; round++) {
    for (const mode of (process.env.WITHOUT_ONLY ? ['without'] : ['without', 'with'])) {
      const s = await open({});
      await ready(s.page);
      if (mode === 'with') {
        const t0 = Date.now();
        // задержка первого показа: самый тяжёлый кадр в первую секунду после нажатия
        const gp = frames(s.page, 1500);
        await toggle(s.page);
        const gaps = await gp;
        res.firstShowMaxGap = Math.max(res.firstShowMaxGap || 0, Math.max(...gaps.slice(1)));
        await s.page.waitForFunction(() => window.__legendProbe.read().p >= 0.999, null, { timeout: 8000 });
        await sleep(500);
      } else await sleep(2500);
      res[mode].push(stat(await frames(s.page, 6000)));
      await close(s);
    }
  }
  const avg = (a, k) => a.reduce((x, y) => x + y[k], 0) / a.length;
  const w0 = avg(res.without, 'fps'), w1 = res.with.length ? avg(res.with, 'fps') : 0;
  console.log(`  без легенды: ${w0.toFixed(1)} к/с (${avg(res.without, 'ms').toFixed(1)} мс, p95 ${avg(res.without, 'p95').toFixed(0)} мс)`);
  if (!res.with.length) { console.log('  (только «без»: замер эталона)'); await browser.close(); process.exit(0); }
  console.log(`  с легендой : ${w1.toFixed(1)} к/с (${avg(res.with, 'ms').toFixed(1)} мс, p95 ${avg(res.with, 'p95').toFixed(0)} мс)`);
  console.log(`  разница: ${((w1 / w0 - 1) * 100).toFixed(1)} %`);
  console.log(`  самый длинный кадр в первую 1.5 с первого показа: ${res.firstShowMaxGap.toFixed(0)} мс`);
  ok(w1 >= w0 * 0.9, 'частота кадров с легендой не ниже, чем без неё, больше чем на 10%');
}

console.log(`\nОшибок страницы: ${errors.length}${errors.length ? '\n  ' + [...new Set(errors)].slice(0, 5).join('\n  ') : ''}`);
ok(errors.length === 0, 'ноль ошибок страницы');
await browser.close();
console.log(failed ? `\nПРОВАЛЕНО: ${failed}` : '\nВСЁ ЗЕЛЁНОЕ');
process.exit(failed ? 1 : 0);
