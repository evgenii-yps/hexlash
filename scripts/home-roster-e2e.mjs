// home-roster-e2e.mjs — РОСТЕР НА ГЛАВНОМ ОСТРОВЕ В ЖИВОМ БРАУЗЕРЕ.
//
// Приёмка ТЗ «Главный остров показывает, чем занят каждый боец» (v2, часть 1, потолок 6).
// По образцу соседних forge-islands-e2e.mjs / gate-soon-e2e.mjs.
//
// ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ:
//   1. сколько тел строится: ровно min(состав, 6), остальные не строятся вовсе;
//   2. КТО попадает в шестёрку: занятые → выбранный → остальные по порядку ростера;
//   3. состав НЕ меняется от поворота раскладки и от времени — только от конца занятия;
//   4. на конце занятия груша исчезает, подпись меняется, остающиеся стоят на своих местах;
//   5. подписи FREE / TRAINING / READY и их взаимная непересекаемость в четырёх раскладках;
//   6. тела держатся в своих пятнах, не налезают друг на друга (мир) и целиком в кадре;
//   7. пивот камеры — центр плиты (0, 1.6, 1.0), стартовый ракурс сохранён;
//   8. «уменьшить движение»: груш нет, подписи есть;
//   9. сейф прогресса игрока до и после открытия острова — тот же (ТЗ 6.8);
//  10. снимки всех раскладок и составов — в OUT.
//
// ⚠️ СОСТАВ ПРОГОНА ЗАДАЁТСЯ ЧЕРЕЗ СЕЙФ (sessionStorage, секция roster), а не через
//    интерфейс: начало занятия живёт на экране зала, а здесь важен остров.
// ⚠️ ПРОБА `window.__homeProbe` живёт только при `?dev=1` (служебный признак, как
//    __forgeProbe в зале). Она отвечает на то, чего не видно глазами: кто где стоит,
//    какие груши висят, сколько стоит кадр. КАРТИНКУ она не подменяет — снимки рядом.
//
//   BASE=http://localhost:4173 OUT=/tmp/home-shots node scripts/home-roster-e2e.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || '/tmp/home-shots';
const WAIT = Number(process.env.WAIT || 16000);
mkdirSync(OUT, { recursive: true });

// LAYOUTS=844x390,1280x720 — прогнать только эти раскладки; ONLY_LAYOUTS=1 — пропустить
// разделы про состав, конец занятия и сейф (быстрый перепрогон после правки вёрстки).
const LAYOUTS = (process.env.LAYOUTS
  ? process.env.LAYOUTS.split(',').map((x) => x.split('x').map(Number))
  : [[390, 844], [844, 390], [1280, 720], [1920, 1080]]);
const ONLY_LAYOUTS = process.env.ONLY_LAYOUTS === '1';
const CORES = ['natisk', 'skala', 'zasada', 'nalet'];

let failed = 0;
const ok = (c, n, d = '') => {
  if (c) console.log(`  ✓ ${n}${d ? '  ' + d : ''}`);
  else { failed += 1; console.log(`  ✗ ${n}${d ? '  ' + d : ''}`); }
};

/** Сейф игрока: n бойцов, занятые (срок через busySec), готовые, выбранный. */
function save(n, { busy = [], busySec = 50, ready = [], picked = null } = {}) {
  const now = Date.now();
  const fighters = [];
  for (let i = 0; i < n; i++) {
    const row = { id: 'f' + i, callsign: 'TEST-' + i, core: CORES[i % 4], createdAt: 1000 + i };
    if (busy.includes(i)) row.tr = now + busySec * 1000;
    if (ready.includes(i)) row.rdy = true;
    fighters.push(row);
  }
  const roster = { fighters, seeded: true };
  if (picked !== null) roster.picked = 'f' + picked;
  return { v: 1, roster };
}

const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const pageErrors = [];
const NOISE = /TUNNEL|CERT_AUTHORITY|Amplitude|Failed to load resource/;

async function open({ w = 390, h = 844, s, wait = WAIT, reduce = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    reducedMotion: reduce ? 'reduce' : 'no-preference',
  });
  await ctx.addInitScript((snap) => {
    if (snap && !sessionStorage.getItem('__seeded')) {
      sessionStorage.setItem('hexlash_progress', JSON.stringify(snap));
      sessionStorage.setItem('__seeded', '1');
    }
  }, s);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => pageErrors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) pageErrors.push(m.text().slice(0, 200)); });
  await p.goto(`${BASE}/play/home?dev=1`, { waitUntil: 'commit', timeout: 60_000 });
  await p.waitForTimeout(wait);
  return { ctx, p };
}
const probe = (p) => p.evaluate(() => window.__homeProbe && window.__homeProbe());
const tags = (p) => p.evaluate(() => [...document.querySelectorAll('.fighter-tag')].map((e) => {
  const r = e.querySelector('.ft-state').getBoundingClientRect();
  return { id: e.dataset.fighter, word: e.querySelector('.ft-state').textContent.trim(),
    shown: e.querySelector('.ft-state').classList.contains('is-shown'),
    box: [r.left, r.top, r.right, r.bottom] };
}));
const ids = (list) => list.map((t) => t.id).sort().join(',');
const hit = (a, b, m = 0) => !(a[2] + m <= b[0] || b[2] + m <= a[0] || a[3] + m <= b[1] || b[3] + m <= a[1]);

if (!ONLY_LAYOUTS) {
// ───────────────────────── 1–2. состав ─────────────────────────
console.log('\n── сколько тел и кто: портрет 390×844 ──');
for (const n of [1, 3, 6, 10]) {
  const { ctx, p } = await open({ s: save(n) });
  const t = await tags(p);
  const pr = await probe(p);
  ok(t.length === Math.min(n, 6) && pr.bodies.length === Math.min(n, 6),
    `состав ${n}: строится ${Math.min(n, 6)}`, `подписей ${t.length}, тел ${pr.bodies.length}`);
  ok(t.every((x) => x.word === 'FREE'), `состав ${n}: все подписаны FREE`, t.map((x) => x.word).join(' '));
  await p.screenshot({ path: `${OUT}/p-390x844-n${n}.png` });
  await ctx.close();
}

console.log('\n── порядок шестёрки при составе 10 ──');
{
  // занятые 7 и 8 (поздние по ростеру), выбранный 5
  const { ctx, p } = await open({ s: save(10, { busy: [7, 8], picked: 5 }) });
  const t = await tags(p);
  const got = ids(t);
  const want = ['f7', 'f8', 'f5', 'f0', 'f1', 'f2'].sort().join(',');
  ok(got === want, 'занятые → выбранный → остальные по порядку', `ждали ${want}, получили ${got}`);
  ok(t.filter((x) => x.word === 'TRAINING').length === 2, 'два TRAINING', t.map((x) => `${x.id}:${x.word}`).join(' '));
  const pr = await probe(p);
  ok(pr.bags.length === 2, 'груш ровно две', JSON.stringify(pr.bags));
  await p.screenshot({ path: `${OUT}/p-390x844-n10-busy78-pick5.png` });
  await ctx.close();
}
{
  const { ctx, p } = await open({ s: save(10, { picked: 4 }) });
  const got = ids(await tags(p));
  const want = ['f4', 'f0', 'f1', 'f2', 'f3', 'f5'].sort().join(',');
  ok(got === want, 'без занятых: выбранный первым, потом по порядку', `ждали ${want}, получили ${got}`);
  await ctx.close();
}
{
  // восьмой и девятый занимаются, все шесть мест заняты занимающимися
  const { ctx, p } = await open({ s: save(10, { busy: [2, 3, 4, 5, 6, 7], picked: 0 }) });
  const t = await tags(p);
  const got = ids(t);
  const want = ['f2', 'f3', 'f4', 'f5', 'f6', 'f7'].sort().join(',');
  ok(got === want, 'шесть занятых вытесняют всех, включая выбранного', `ждали ${want}, получили ${got}`);
  const pr = await probe(p);
  ok(pr.bags.length === 6, 'груш шесть', JSON.stringify(pr.bags));
  await p.screenshot({ path: `${OUT}/p-390x844-n10-six-training.png` });
  await ctx.close();
}

// ───────────────────────── 3–4. устойчивость и конец занятия ─────────────────────────
console.log('\n── состав не меняется ни от раскладки, ни от времени ──');
{
  const { ctx, p } = await open({ s: save(10, { picked: 5 }) });
  const a = ids(await tags(p));
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(3000);
  const b = ids(await tags(p));
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(3000);
  const c = ids(await tags(p));
  await p.waitForTimeout(8000);
  const d = ids(await tags(p));
  ok(a === b && b === c && c === d, 'поворот туда-обратно и 8 секунд — состав тот же', `${a}`);
  await ctx.close();
}

console.log('\n── конец занятия: груша уходит, состав пересчитывается, остальные стоят на местах ──');
{
  const { ctx, p } = await open({ s: save(10, { busy: [7, 8], busySec: 22 }), wait: 9000 });
  const before = await probe(p);
  const beforeIds = ids(await tags(p));
  ok(before.bags.length === 2, 'до конца: две груши', JSON.stringify(before.bags));
  const slotOf = Object.fromEntries(before.bodies.map((b) => [b.id, b.slot]));
  await p.screenshot({ path: `${OUT}/p-390x844-n10-before-end.png` });
  await p.waitForTimeout(24000);
  const after = await probe(p);
  const t = await tags(p);
  const afterIds = ids(t);
  ok(after.bags.length === 0, 'после конца: груш нет', JSON.stringify(after.bags));
  const ready = t.filter((x) => x.word === 'READY').map((x) => x.id);
  ok(beforeIds !== afterIds || ready.length === 0, 'состав пересчитан на конце занятия', `${beforeIds} → ${afterIds}`);
  ok(!afterIds.includes('f7') && !afterIds.includes('f8'), 'закончившие (f7, f8) не попали в шестёрку: они не первые по ростеру', afterIds);
  const kept = after.bodies.filter((b) => slotOf[b.id] !== undefined);
  ok(kept.length > 0 && kept.every((b) => b.slot === slotOf[b.id]), 'остающиеся не пересажены', kept.map((b) => `${b.id}@${b.slot}`).join(' '));
  await p.screenshot({ path: `${OUT}/p-390x844-n10-after-end.png` });
  await ctx.close();
}
{
  // закончивший, который остаётся в шестёрке (состав 3): подпись READY, стоит смирно, груши нет
  const { ctx, p } = await open({ s: save(3, { busy: [1], busySec: 14 }), wait: 9000 });
  const a = (await tags(p)).find((x) => x.id === 'f1');
  ok(a && a.word === 'TRAINING', 'до конца: TRAINING', a && a.word);
  await p.waitForTimeout(12000);
  const b = (await tags(p)).find((x) => x.id === 'f1');
  ok(b && b.word === 'READY', 'после конца: READY', b && b.word);
  const pr = await probe(p);
  ok(pr.bags.length === 0, 'груши нет');
  await p.screenshot({ path: `${OUT}/p-390x844-n3-ready.png` });
  await ctx.close();
}

console.log('\n── начало занятия на лету (через хранилище) ──');
{
  const { ctx, p } = await open({ s: save(10), wait: 12000 });
  const a = ids(await tags(p));
  const r = await p.evaluate(async () => {
    const { default: store } = await import('/src/core/state/store.js');
    return store.dispatch('roster/assignLesson', 'f9');
  });
  await p.waitForTimeout(6000);
  const pr = await probe(p);
  const b = ids(await tags(p));
  ok(r === null, 'занятие назначено', String(r));
  ok(b !== a && b.includes('f9'), 'на начале занятия f9 вошёл в шестёрку', `${a} → ${b}`);
  ok(pr.bags.length === 1, 'груша появилась', JSON.stringify(pr.bags));
  await p.screenshot({ path: `${OUT}/p-390x844-n10-start.png` });
  await ctx.close();
}

}

// ───────────────────────── 5–7. четыре раскладки ─────────────────────────
console.log('\n── четыре раскладки × составы ──');
for (const [w, h] of LAYOUTS) {
  for (const [n, opts, tag] of [[1, {}, 'n1'], [3, {}, 'n3'], [6, {}, 'n6'], [10, { busy: [0, 1, 2, 3, 4, 5], picked: 6 }, 'n10-train'], [6, { busy: [0, 1, 2, 3, 4, 5] }, 'n6-train']]) {
    const { ctx, p } = await open({ w, h, s: save(n, opts), wait: Math.max(10000, WAIT - 4000) });
    const t = await tags(p);
    const pr = await probe(p);
    const want = Math.min(n, 6);
    const name = `${w}×${h} ${tag}`;
    ok(pr.bodies.length === want, `${name}: тел ${want}`, `${pr.bodies.length}`);
    // тело целиком в кадре (по проекции), подписи в кадре и не пересекаются
    const inFrame = pr.bodies.every((b) => b.left >= 0 && b.right <= w && b.head[1] >= 0 && b.feet[1] <= h);
    ok(inFrame, `${name}: все тела целиком в кадре`);
    const labelsIn = t.every((x) => x.box[0] >= 0 && x.box[2] <= w && x.box[1] >= 0 && x.box[3] <= h);
    ok(labelsIn, `${name}: все подписи в кадре`);
    let overlap = 0;
    for (let i = 0; i < t.length; i++) for (let j = 0; j < i; j++) if (hit(t[i].box, t[j].box, 1)) overlap += 1;
    ok(overlap === 0, `${name}: подписи не налезают друг на друга`, overlap ? `пар: ${overlap}` : '');
    // мир: расстояние между телами
    let minD = Infinity;
    for (let i = 0; i < pr.bodies.length; i++) for (let j = 0; j < i; j++) {
      minD = Math.min(minD, Math.hypot(pr.bodies[i].x - pr.bodies[j].x, pr.bodies[i].z - pr.bodies[j].z));
    }
    ok(pr.bodies.length < 2 || minD >= 0.78, `${name}: тела не налезают (мир)`, `мин. расстояние ${minD.toFixed(2)} м`);
    // пятно блуждания: свободный — не дальше 0.15 м за кромкой своего пятна; занимающийся
    // мгновенно может быть дальше (уход, удар ногой смещают тело до возврата на место —
    // см. DRIFT в HomeScene), но не дальше 0.35 м
    const inZone = pr.bodies.every((b) => {
      const tol = b.state === 'busy' ? 0.35 : 0.15;
      return Math.abs(b.x - b.zone.x) <= b.zone.hx + tol && Math.abs(b.z - b.zone.z) <= b.zone.hz + tol;
    });
    ok(inZone, `${name}: тела в своих пятнах`);
    ok(pr.target[0] === 0 && pr.target[2] === 1 && Math.abs(pr.target[1] - 1.6) < 1e-6, `${name}: пивот камеры — центр плиты`, JSON.stringify(pr.target));
    if (tag === 'n10-train' || tag === 'n6-train') ok(pr.bags.length === 6, `${name}: груш шесть`, JSON.stringify(pr.bags));
    await p.screenshot({ path: `${OUT}/l-${w}x${h}-${tag}.png` });
    await ctx.close();
  }
}

if (!ONLY_LAYOUTS) {
// ───────────────────────── занимающийся не уплывает ─────────────────────────
console.log('\n── занимающийся стоит на своём месте всё занятие ──');
{
  const { ctx, p } = await open({ s: save(6, { busy: [0, 1, 2, 3, 4, 5], busySec: 58 }), wait: 3000 });
  const mx = {};
  let swing = 0;
  for (let i = 0; i < 40; i++) {
    const pr = await probe(p);
    for (const b of pr.bodies) mx[b.slot] = Math.max(mx[b.slot] || 0, Math.hypot(b.x - b.zone.x, b.z - b.zone.z));
    for (const t of pr.bagTilt || []) swing = Math.max(swing, t.tilt);
    await p.waitForTimeout(1200);
  }
  const worst = Math.max(...Object.values(mx));
  ok(worst <= 0.35, 'за 48 секунд занятия никто не ушёл от центра своего пятна дальше 0.35 м',
    `макс. ${worst.toFixed(2)} м: ${JSON.stringify(Object.fromEntries(Object.entries(mx).map(([k, v]) => [k, +v.toFixed(2)])))}`);
  ok(swing > 0.02, 'груши качаются от ударов', `макс. наклон ${swing.toFixed(3)}`);
  await ctx.close();
}

// ───────────────────────── 8. уменьшить движение ─────────────────────────
console.log('\n── «уменьшить движение»: груш нет, подписи есть ──');
{
  const { ctx, p } = await open({ s: save(6, { busy: [0, 1] }), reduce: true, wait: 12000 });
  const t = await tags(p);
  const pr = await probe(p);
  ok(t.length === 6, 'шесть подписей', `${t.length}`);
  ok(t.filter((x) => x.word === 'TRAINING').length === 2, 'TRAINING подписан, хотя двигаться нечем');
  ok(pr.bags.length === 0, 'груш нет (бить некому)', JSON.stringify(pr.bags));
  await p.screenshot({ path: `${OUT}/reduced-390x844-n6.png` });
  await ctx.close();
}

// ───────────────────────── 9. сейф прогресса ─────────────────────────
console.log('\n── сейф прогресса до и после открытия острова (ТЗ 6.8) ──');
for (const [label, s] of [['свободные и готовые', save(10, { ready: [2, 3], picked: 4 })], ['пустой ростер-тройка', save(3)]]) {
  const { ctx, p } = await open({ s, wait: 14000 });
  const snap = await p.evaluate(() => sessionStorage.getItem('hexlash_progress'));
  const seeded = JSON.stringify(s);
  // после открытия сейф либо остался ровно как положили, либо совпал по смыслу (id, ядра, выбранный, готовые)
  const same = snap === seeded || (() => {
    const a = JSON.parse(snap).roster; const b = s.roster;
    return JSON.stringify(a.fighters) === JSON.stringify(b.fighters) && a.picked === b.picked && a.seeded === b.seeded;
  })();
  ok(same, `${label}: сейф не изменился`, same ? '' : snap.slice(0, 120));
  await ctx.close();
}

}

ok(pageErrors.length === 0, 'на страницах ни одной ошибки', pageErrors[0] || '');
await browser.close();
console.log(failed ? `\n${failed} проверок не прошло` : '\nвсе проверки прошли');
process.exit(failed ? 1 : 0);
