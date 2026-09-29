// grani-recon.mjs — ЗАМЕР ГРАНЕЙ И ТЕГОВ (TZ_grani_tags_v1).
//
// СЛОВАРЬ. В коде «кристалл» и «грань» перевёрнуты против словаря ТЗ:
//   ГРАНЬ (ТЗ) = ВЕТКА  = в коде `CRYSTALS[core][i]` (id a/b/c; BODY/MIND/WILL в тексте игрока)
//   КРИСТАЛЛ (ТЗ) = ШАГ = в коде `branch.faces[j]` (1..5)
// Теги (conditionals / effects) висят на КРИСТАЛЛАХ (шагах 2–5), а не на ветках.
//
// ЗАПУСК: node scripts/grani-recon.mjs <метка> [раздел ...]   SEEDS=200 по умолчанию
//   g1    — Г1/Г2: есть ли читатель тегов; тегированная ветка против той же ветки без тегов
//   base  — п.2: 3 кристалла одной ветки против 3 вразнобой (глубина сохранена)
//   proof — п.4: то же после починки + сколько боёв перестают совпадать бит в бит
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { openHarness, mean, quantile } from './lib/bout-harness.mjs';

const LABEL = process.argv[2] || 'run';
const want = new Set(process.argv.slice(3));
const all = want.size === 0 || want.has('all');
const SEEDS = Number(process.env.SEEDS || 200);
const OUT = new URL(`../docs/grani-tags/out/${LABEL}/`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load } = H;
const { CRYSTALS, CORES, RESOURCE } = await load('/src/data/upgradeData.js');
const NAME = Object.fromEntries(CORES.map((c) => [c.id, c.name]));
const BR_TEXT = { a: 'BODY', b: 'MIND', c: 'WILL' };
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];

const pct = (x) => (Number.isFinite(x) ? (100 * x).toFixed(1) + '%' : '—');
const pp = (x) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(1) : '—');
const md = (head, rows) => { const l = (r) => '| ' + r.join(' | ') + ' |'; return [l(head), l(head.map(() => '---')), ...rows.map(l)].join('\n'); };
const emit = (name, text, json) => {
  writeFileSync(OUT + name + '.md', text + '\n');
  writeFileSync(OUT + name + '.json', JSON.stringify(json, null, 1) + '\n');
  console.log(`\n===== ${LABEL}/${name} =====\n` + text);
};
const progress = (s) => process.stderr.write(s + '\n');
const sigOf = (r) => `${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}`;

/** Кристалл (шаг) j (1..5) ветки b ядра c — сама запись. */
const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const stripTags = (fs) => fs.map((f) => ({ ...f, conditionals: [], effects: [] }));
const BRANCH_IDS = ['a', 'b', 'c'];
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null; // ONLY=natisk — только эти ядра
const CORES_RUN = () => CORE_IDS.filter((c) => !ONLY || ONLY.has(c));

/** Бой T (собранный набор) против стороны U, SEEDS зёрен, стороны чередуются по чётности зерна.
 *  Возвращает победы T, подписи боёв, доли намерений T. */
function run(core, behT, behU = null, seeds = SEEDS, foeCore = core, ctl = null) {
  const wins = [], sigs = [], intent = {}; let ticks = 0;
  for (let s = 1; s <= seeds; s++) {
    let prev = null; let secBout = 0;
    const r = duel({ seed: s, coreA: core, coreB: foeCore, behA: behT, behB: behU, swap: s % 2 === 0, onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
      const it = me.f.getIntention(); intent[it] = (intent[it] || 0) + 1; ticks++;
      if (!ctl) return;
      const foe = alive.find((u) => u !== me);
      const pm = me.f.group.position;
      if (prev) ctl.sp += Math.hypot(pm.x - prev.x, pm.z - prev.z) / H.INSTANT_DT;
      prev = { x: pm.x, z: pm.z };
      ctl.n++;
      if (foe) { const pf = foe.f.group.position; if (Math.hypot(pm.x - pf.x, pm.z - pf.z) >= 1.45) ctl.far++; }
      const f = me.f;
      if (!f.getClipInfo() && !f.isBlocking() && !f.isStaggered() && !f.isExhaling()) ctl.free++;
    } });
    wins.push(r.winner === 'player' ? 1 : 0); sigs.push(sigOf(r));
    if (ctl) { ctl.secs.push(r.sec); if (r.capped) ctl.capped++; }
  }
  return { wr: mean(wins) * 100, wins: wins.reduce((a, b) => a + b, 0), sigs, share: Object.fromEntries(INTENTS.map((k) => [k, (intent[k] || 0) / Math.max(1, ticks)])) };
}
const diffCount = (a, b) => a.reduce((n, x, i) => n + (x !== b[i] ? 1 : 0), 0);
const l1 = (a, b) => INTENTS.reduce((s, k) => s + Math.abs((a[k] || 0) - (b[k] || 0)), 0) * 50; // п.п. смещённой доли (L1/2)

// ── g1 ───────────────────────────────────────────────────────────────────────
function sectionG1() {
  // Г2 (статически): какие из тегов читает хоть один файл вне данных.
  const tags = new Set();
  for (const c of CORE_IDS) for (const br of CRYSTALS[c]) for (const f of br.faces) for (const t of [...f.conditionals, ...f.effects]) tags.add(t);
  const files = [];
  const walk = (d) => { for (const n of readdirSync(d)) { const p = d + '/' + n; if (statSync(p).isDirectory()) walk(p); else if (/\.(js|vue)$/.test(n)) files.push(p); } };
  walk(new URL('../src', import.meta.url).pathname);
  const readers = [];
  for (const p of files) {
    if (p.endsWith('/data/upgradeData.js')) continue;
    // Без комментариев: упоминание в `// …` или `/* … */` — не читатель.
    const txt = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
    for (const t of tags) if (new RegExp(`['"\`]${t}['"\`]`).test(txt)) readers.push(`${p.split('/src/')[1]}: ${t}`);
    if (/\.(effects|conditionals)\b/.test(txt) && !/behavior\.js$|SparScene|behaviorPresets|klich|buffs|transitionFlight/.test(p)) readers.push(`${p.split('/src/')[1]}: .effects/.conditionals`);
  }
  // Г1 (в бою): вся ветка (5 кристаллов) с тегами против той же ветки БЕЗ тегов — бит в бит?
  const rows = [], json = [];
  for (const core of CORE_IDS) for (const b of BRANCH_IDS) {
    const fs = [1, 2, 3, 4, 5].map((j) => facet(core, b, j));
    const tagged = run(core, resolveBehavior(core, fs));
    const plain = run(core, resolveBehavior(core, stripTags(fs)));
    const nTags = fs.reduce((n, f) => n + f.conditionals.length + f.effects.length, 0);
    const diff = diffCount(tagged.sigs, plain.sigs);
    json.push({ core, branch: b, nTags, diff, seeds: SEEDS });
    rows.push([NAME[core], `${b} (${BR_TEXT[b]})`, String(nTags), `${diff}/${SEEDS}`, pp(tagged.wr - plain.wr)]);
    progress(`g1 ${core} ${b}`);
  }
  const total = json.reduce((n, x) => n + x.diff, 0), nn = json.reduce((n, x) => n + x.seeds, 0);
  const text = [
    `**Читатели тегов** (${tags.size} разных тегов, 27 навесок): найдено ${readers.length} упоминаний вне upgradeData.js${readers.length ? ':\n- ' + readers.join('\n- ') : ' — ни один тег ни разу не читается.'}`,
    '', `**Г1 в бою.** Вся ветка (5 кристаллов) с тегами против той же ветки, где теги вырезаны; бой против ядра без кристаллов, зёрна 1..${SEEDS}, стороны чередуются. «Разошлись» — боёв, не совпавших бит в бит.`, '',
    md(['ядро', 'ветка', 'тегов', 'боёв разошлось', 'Δ винрейта, п.п.'], rows),
    '', `**Итого:** ${total} из ${nn} боёв различаются.`,
  ].join('\n');
  emit('g1', text, { readers, json, total, nn });
}

// ── набор кристаллов ─────────────────────────────────────────────────────────
const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
/** «Одна ветка»: шаги 1–3 ветки b. */
const oneBranch = (core, b) => [1, 2, 3].map((j) => facet(core, b, j));
/** «Вразнобой»: шаг j берётся из ветки perm[j-1] — глубина та же (1,2,3), ветки все разные. */
const scatter = (core, perm) => [1, 2, 3].map((j) => facet(core, BRANCH_IDS[perm[j - 1]], j));

/** Сравнение «ветка против вразнобой» для (ядро, ветка). tags:true — с тегами (после починки). */
function compare(core, b, mk = (c, fs) => resolveBehavior(c, fs)) {
  const A = run(core, mk(core, oneBranch(core, b)));
  const Bs = PERMS.map((p) => run(core, mk(core, scatter(core, p))));
  const bWr = mean(Bs.map((x) => x.wr));
  const bShare = Object.fromEntries(INTENTS.map((k) => [k, mean(Bs.map((x) => x.share[k]))]));
  // Прямая встреча: ветка (T) против вразнобой (U), по всем перестановкам.
  const h2h = PERMS.map((p) => run(core, mk(core, oneBranch(core, b)), mk(core, scatter(core, p)))).map((x) => x.wr);
  return { A, Bs, bWr, bShare, h2h: mean(h2h) };
}

// ── base / proof ─────────────────────────────────────────────────────────────
function sectionCompare(name, mk, note, ref) {
  const rows = [], json = [];
  for (const core of CORE_IDS) for (const b of BRANCH_IDS) {
    const c = compare(core, b, mk);
    // «Отличие от россыпи по бит-в-бит»: бой ветки (набор A) против боя того же набора в базовой сборке — только в proof.
    const refBits = ref ? diffCount(c.A.sigs, ref(core, b).A.sigs) : null;
    json.push({ core, branch: b, wrA: c.A.wr, wrB: c.bWr, h2h: c.h2h, shareA: c.A.share, shareB: c.bShare, refBits });
    rows.push([NAME[core], `${b} (${BR_TEXT[b]})`, pct(c.A.wr / 100), pct(c.bWr / 100), pp(c.A.wr - c.bWr), pct(c.h2h / 100), pp(l1(c.A.share, c.bShare)).replace('+', '')]);
    progress(`${name} ${core} ${b}`);
  }
  const meanD = mean(json.map((j) => j.wrA - j.wrB));
  const text = [
    note, '',
    md(['ядро', 'ветка (3 кристалла подряд)', 'винрейт «одна ветка»', 'винрейт «вразнобой» (среднее по 6)', 'Δ, п.п.', 'прямая встреча: ветка бьёт вразнобой', 'сдвиг доли намерений, п.п.'], rows),
    '', `**Среднее Δ по 12 веткам:** ${pp(meanD)} п.п. (σ одной ячейки ≈ 3.5, разности ≈ 5).`,
  ].join('\n');
  emit(name, text, json);
  return json;
}

if (all || want.has('g1')) sectionG1();
if (all || want.has('base')) sectionCompare('base', (c, fs) => resolveBehavior(c, fs),
  `Набор «одна ветка» = кристаллы 1–3 ветки; «вразнобой» = кристалл 1, 2, 3 из трёх РАЗНЫХ веток (6 перестановок, глубина сохранена). Каждый — против ядра без кристаллов, ${SEEDS} зёрен, стороны чередуются. Кристаллов в пуле: ${RESOURCE}.`);

// ── proof ────────────────────────────────────────────────────────────────────
// «До» = то же поведение с вырезанными наклонами (leans:null) — бит в бит как до правки. «После» — как есть.
const noLeans = (b) => ({ ...b, leans: null });
function sectionProof() {
  const before = JSON.parse(readFileSync(new URL('../docs/grani-tags/out/before/base.json', import.meta.url), 'utf8'));
  const ctl = { n: 0, sp: 0, far: 0, free: 0, secs: [], capped: 0 };
  const rows = [], json = [];
  for (const core of CORES_RUN()) for (const b of BRANCH_IDS) {
    const setA = oneBranch(core, b);
    const bA = run(core, noLeans(resolveBehavior(core, setA)));
    const A = run(core, resolveBehavior(core, setA), null, SEEDS, core, ctl);
    const bBsig = PERMS.map((p) => run(core, noLeans(resolveBehavior(core, scatter(core, p)))));
    const Bs = PERMS.map((p) => run(core, resolveBehavior(core, scatter(core, p)), null, SEEDS, core, ctl));
    const h2h = mean(PERMS.map((p) => run(core, resolveBehavior(core, setA), resolveBehavior(core, scatter(core, p)), SEEDS, core, ctl).wr));
    const bWr = mean(Bs.map((x) => x.wr));
    const bShare = Object.fromEntries(INTENTS.map((k) => [k, mean(Bs.map((x) => x.share[k]))]));
    const bef = before.find((j) => j.core === core && j.branch === b);
    const dBefore = bef.wrA - bef.wrB, dAfter = A.wr - bWr;
    const bitsA = diffCount(A.sigs, bA.sigs);
    const bitsB = mean(Bs.map((x, i) => diffCount(x.sigs, bBsig[i].sigs)));
    const shiftA = l1(A.share, bA.share); // насколько поменялось распределение намерений самой ветки
    const shiftAB = l1(A.share, bShare); // ветка против вразнобой — после
    const shiftABb = l1(bef.shareA, bef.shareB); // …до
    json.push({ core, branch: b, dBefore, dAfter, h2hBefore: bef.h2h, h2hAfter: h2h, bitsA, bitsB, shiftA, shiftAB, shiftABb, wrA: A.wr, wrB: bWr });
    rows.push([NAME[core], `${b} (${BR_TEXT[b]})`, pp(dBefore), pp(dAfter), pct(bef.h2h / 100), pct(h2h / 100), `${bitsA}/${SEEDS}`, `${bitsB.toFixed(0)}/${SEEDS}`, `${shiftABb.toFixed(1)} → ${shiftAB.toFixed(1)}`]);
    progress(`proof ${core} ${b}`);
  }
  const text = [
    `Набор «одна ветка» = кристаллы 1–3 ветки; «вразнобой» = кристалл 1, 2, 3 из трёх РАЗНЫХ веток (6 перестановок). Против ядра без кристаллов, ${SEEDS} зёрен, стороны чередуются. «До» — те же наборы с вырезанными наклонами (бит в бит как до правки). «Разошлось» — боёв, не совпавших с «до» бит в бит: у набора «ветка» и у «вразнобой» (среднее по 6).`, '',
    md(['ядро', 'ветка', 'Δ ветка−вразнобой ДО, п.п.', 'Δ ПОСЛЕ, п.п.', 'встреча ветка→вразнобой ДО', 'ПОСЛЕ', 'разошлось: ветка', 'разошлось: вразнобой', 'разница намерений ветка/вразнобой ДО → ПОСЛЕ, п.п.'], rows),
    '', `**Среднее Δ по 12 веткам:** ${pp(mean(json.map((j) => j.dBefore)))} → ${pp(mean(json.map((j) => j.dAfter)))} п.п.`,
    `**Среднее разошлось:** ветка ${mean(json.map((j) => j.bitsA)).toFixed(0)}/${SEEDS}, вразнобой ${mean(json.map((j) => j.bitsB)).toFixed(0)}/${SEEDS}.`,
    '', `**Контрольные (бои со сборками «после», ${ctl.secs.length} боёв):** доля боя вне радиуса 1.45 — ${pct(ctl.far / ctl.n)}; свободное время — ${pct(ctl.free / ctl.n)}; скорость — ${(ctl.sp / ctl.n).toFixed(2)} ед./с; длительность: медиана ${quantile(ctl.secs, 0.5).toFixed(1)} с, максимум ${Math.max(...ctl.secs).toFixed(1)} с, таймаутов ${ctl.capped}.`,
  ].join('\n');
  emit('proof', text, { json, ctl: { n: ctl.n, far: ctl.far / ctl.n, free: ctl.free / ctl.n, speed: ctl.sp / ctl.n, med: quantile(ctl.secs, 0.5), max: Math.max(...ctl.secs), capped: ctl.capped } });
}
if (all || want.has('proof')) sectionProof();

// ── controls ─────────────────────────────────────────────────────────────────
// Контрольные метрики боя на сборках (наборы «ветка» и 6 «вразнобой») — с наклонами и без, одним кодом.
function sectionControls() {
  const mk = () => ({ n: 0, sp: 0, far: 0, free: 0, secs: [], capped: 0 });
  const acc = { before: mk(), after: mk() }; const longs = [];
  for (const core of CORES_RUN()) for (const b of BRANCH_IDS) {
    const sets = [oneBranch(core, b), ...PERMS.map((p) => scatter(core, p))];
    sets.forEach((fs, i) => {
      run(core, noLeans(resolveBehavior(core, fs)), null, SEEDS, core, acc.before);
      const c = mk(); run(core, resolveBehavior(core, fs), null, SEEDS, core, c);
      for (const k of ['n', 'sp', 'far', 'free', 'capped']) acc.after[k] += c[k];
      acc.after.secs.push(...c.secs);
      c.secs.forEach((x, k) => { if (x > 100) longs.push(`${NAME[core]} ${b} ${i ? 'вразнобой#' + i : 'ветка'} зерно ${k + 1}: ${x.toFixed(1)} с`); });
    });
    progress(`controls ${core} ${b}`);
  }
  const line = (a) => [pct(a.far / a.n), pct(a.free / a.n), (a.sp / a.n).toFixed(2), quantile(a.secs, 0.5).toFixed(1), Math.max(...a.secs).toFixed(1), String(a.capped), String(a.secs.filter((x) => x > 100).length)];
  const text = [
    `Сборки: по каждой из ${CORES_RUN().length * 3} веток набор «ветка» + 6 «вразнобой», ${SEEDS} зёрен, против ядра без кристаллов. ДО = наклоны вырезаны.`, '',
    md(['', 'вне радиуса 1.45', 'свободное время', 'скорость, ед./с', 'медиана, с', 'максимум, с', 'таймаутов', 'дольше 100 с'], [['ДО', ...line(acc.before)], ['ПОСЛЕ', ...line(acc.after)]]),
    '', longs.length ? '**Бои дольше 100 с (после):**\n- ' + longs.join('\n- ') : '**Боёв дольше 100 с после правки нет.**',
  ].join('\n');
  emit('controls', text, { before: { ...acc.before, secs: undefined, max: Math.max(...acc.before.secs) }, after: { ...acc.after, secs: undefined, max: Math.max(...acc.after.secs) }, longs });
}
if (all || want.has('controls')) sectionControls();
await H.server.close();
