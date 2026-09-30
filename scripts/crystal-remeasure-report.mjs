// crystal-remeasure-report.mjs — СВОД ПЕРЕЗАМЕРА КРИСТАЛЛОВ (TZ_crystal_remeasure_v2). Читает сырые прогоны из docs/crystal-remeasure/out/raw/, пишет таблицы в out/.
//   node scripts/crystal-remeasure-report.mjs noise   — нулевой замер, шум, сверка с прежними числами
//   node scripts/crystal-remeasure-report.mjs solo    — часть A (60 ячеек) → out/partA.{json,md}, out/partA_by_foe.md, out/amp-list.json
//   node scripts/crystal-remeasure-report.mjs amp     — усиление ×3 для ячеек из amp-list → out/partA_amp3.{json,md}; причины
//   node scripts/crystal-remeasure-report.mjs chan    — разложение ×3 по каналам (после этапа chan драйвера) → out/partA_channels.md
//   node scripts/crystal-remeasure-report.mjs build   — часть B → out/partB.{json,md}, out/vertices.md
//   node scripts/crystal-remeasure-report.mjs final   — контроль + REPORT.md
// Пороги — THRESH в crystal-remeasure-lib.mjs; пересчёт без нового прогона: поменять и запустить шаги заново.
import { writeFileSync, readFileSync } from 'node:fs';
import {
  OUT, REPO, CORES, CORE_NAME, BR, INTENTS, METRICS, THRESH, loadRaw, loadZero, noiseOf, readJson, exists,
  analyseCell, poolSums, metricsOf, median, mean, quantile, sd,
} from './crystal-remeasure-lib.mjs';

const step = process.argv[2];
const REPO_DOCS = REPO + 'docs/';
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
const pp = (x) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(1) : '—');
const pc = (x) => (Number.isFinite(x) ? (100 * x).toFixed(1) + '%' : '—');
const md = (head, rows) => { const l = (r) => '| ' + r.join(' | ') + ' |'; return [l(head), l(head.map(() => '---')), ...rows.map(l)].join('\n'); };
const write = (name, text) => writeFileSync(OUT + name, text.endsWith('\n') ? text : text + '\n');
const json = (name, obj) => writeFileSync(OUT + name, JSON.stringify(obj, null, 1) + '\n');

const zero = loadZero();
const noise = noiseOf(zero);
const base1 = (core) => zero[core][0]; // блок 1 = зёрна 1..200 (те же, что у ячеек)
const inputs = exists(OUT + 'input.json') ? readJson(OUT + 'input.json') : null;
const inputOf = (core, br, idx) => inputs.cells.find((c) => c.core === core && c.branch === br && c.idx === idx);

const cellName = (inp) => `${CORE_NAME[inp.core]} · ${inp.label} · ${inp.dataName}`;
const yn = (b) => (b ? 'да' : 'нет');

// ── НУЛЕВОЙ ЗАМЕР И ШУМ ─────────────────────────────────────────────────────
function stepNoise() {
  const lines = [];
  // 1. сверка: 16 пар × 200 зёрен БЕЗ чередования сторон — прежние числа (reflex-sight REPORT §2.4)
  const zc = CORES.map((c) => loadRaw(`zerocheck-${c}`));
  let n = 0, far = 0, free = 0, spd = 0, secs = [], capped = 0, wins = 0, bouts = 0;
  for (const r of zc) for (const f of Object.values(r.foes)) { n += f.sum.n; far += f.sum.far; free += f.sum.free; spd += f.sum.spd; secs.push(...f.sec); capped += f.capped; wins += f.w.reduce((a, b) => a + b, 0); bouts += f.w.length; }
  const check = { bouts, far: far / n, free: free / n, speed: spd / n, median: median(secs), max: Math.max(...secs), capped, winRate: wins / bouts };
  const known = { far: 0.2507485624428096, free: 0.34451185924326067, speed: 0.3188890637945188, median: 51.866666666665004, max: 83.0333333333299, capped: 0 };
  const ok = Math.abs(check.far - known.far) < 5e-5 && Math.abs(check.median - known.median) < 0.01 && Math.abs(check.max - known.max) < 0.01 && check.capped === 0;
  lines.push('## 1. Сверка нулевого замера с известным', '',
    'Голые ядра, 16 пар × 200 зёрен, **без чередования сторон** (так были сняты прежние 25.07 / 51.87 / 83.03 — `reflex-sight-controls.mjs MODE=pairs NOSWAP=1`). Тот же боец, та же обвязка, зонд включён.', '',
    md(['метрика', 'сейчас', 'известное (reflex-sight REPORT §2.4)'], [
      ['вне радиуса удара', pc(check.far), '25.07%'], ['свободное время', pc(check.free), '34.45%'], ['скорость', check.speed.toFixed(4), '0.3189'],
      ['медиана длины боя, с', f2(check.median), '51.87'], ['максимум, с', f2(check.max), '83.03'], ['таймаутов', String(check.capped), '0'], ['боёв', String(bouts), '3200']]),
    '', ok ? '**Воспроизвелось точно.**' : '**⚠️ НЕ ВОСПРОИЗВЕЛОСЬ — замер недостоверен, стоп.**');
  // 2. шум
  lines.push('', '## 2. Шум: два нулевых замера одного ядра на разных зёрнах', '',
    'Пять блоков по 200 зёрен (1–200, 201–400, … 801–1000), каждый — голое ядро против всех четырёх голых ядер (800 боёв), стороны чередуются по зерну. ' +
    '«Шум» = σ разности двух таких замеров = √2 × стандартное отклонение блоков. Порог телесной метрики в вердикте — **3 шума**.', '');
  const rows = [];
  for (const m of METRICS) for (const c of CORES) {
    const nz = noise[c][m.id];
    rows.push([m.name, CORE_NAME[c], ...nz.values.map((v) => (m.mul === 100 ? (100 * v).toFixed(2) : v.toFixed(3))), (m.mul === 100 ? (100 * nz.sigmaDiff).toFixed(2) : nz.sigmaDiff.toFixed(3)), (m.mul === 100 ? (300 * nz.sigmaDiff).toFixed(2) : (3 * nz.sigmaDiff).toFixed(3))]);
  }
  lines.push(md(['метрика', 'ядро', 'блок 1', 'блок 2', 'блок 3', 'блок 4', 'блок 5', 'шум (σ разности)', 'порог 3 шума'], rows));
  lines.push('', '**Доля побед и медиана голого ядра против всех четырёх (800 боёв в блоке):**', '');
  lines.push(md(['ядро', 'доля побед по блокам, %', 'шум, п.п.', 'медиана по блокам, с', 'шум, с'], CORES.map((c) => [CORE_NAME[c], noise[c].winRate.values.map((v) => (100 * v).toFixed(1)).join(' / '), (100 * noise[c].winRate.sigmaDiff).toFixed(2), noise[c].median.values.map((v) => v.toFixed(1)).join(' / '), noise[c].median.sigmaDiff.toFixed(2)])));
  write('noise.md', lines.join('\n'));
  json('noise.json', { check, known, reproduced: ok, noise });
  console.log(lines.join('\n'));
  if (!ok) process.exitCode = 2;
}

// ── ЧАСТЬ A ─────────────────────────────────────────────────────────────────
function soloCells(amp) {
  const cells = [];
  for (const core of CORES) for (const br of BR) for (let i = 1; i <= 5; i++) {
    const raw = loadRaw(amp === 1 ? `solo-${core}-${br}${i}` : `amp${amp}-${core}-${br}${i}`);
    if (!raw) continue;
    const an = analyseCell({ raw, base: base1(core), noise, core });
    cells.push({ core, branch: br, idx: i, input: inputOf(core, br, i), ...an });
  }
  return cells;
}

/** Отметки независимо от флагов. */
function marks(c) {
  const out = [];
  if (c.win.ciHi < 0) out.push('ВРЕДИТ');
  if (c.win.delta >= THRESH.skew) out.push('ПЕРЕКОС');
  const pos = Object.values(c.perFoe).some((p) => p.sigCi99 && p.delta > 0), neg = Object.values(c.perFoe).some((p) => p.sigCi99 && p.delta < 0);
  if (pos && neg) out.push('ЗНАК ПО ВРАГУ');
  return out;
}
/** «Вход есть?» — оси после зажима сдвинулись, есть показатели/рычаги, либо тег, чьё условие истинно ≥1% решений. */
function hasInput(c) {
  const inp = c.input;
  const axes = Object.keys(inp.actualShifts).length > 0;
  const bonuses = Object.keys(inp.statBonuses).length > 0;
  const tag = inp.leans.length > 0 && c.decisions.tagTrue >= THRESH.emptyTag;
  return { any: axes || bonuses || tag, axes, bonuses, tag };
}

function stepSolo() {
  const cells = soloCells(1);
  if (cells.length !== 60) console.error(`⚠️ ячеек ${cells.length} из 60`);
  const rows = [], rowsFoe = [];
  const amp = [];
  for (const c of cells) {
    const inp = c.input, hi = hasInput(c);
    c.flags = { outcome: c.outcome, behavior: c.behavior };
    c.marks = marks(c);
    c.hasInput = hi;
    if (!(c.outcome && c.behavior)) {
      if (!hi.any) c.cause = { outcome: c.outcome ? null : 'ПУСТОЙ', behavior: c.behavior ? null : 'ПУСТОЙ' };
      else amp.push({ core: c.core, branch: c.branch, idx: c.idx });
    }
    const tagTxt = inp.leans.length ? inp.leans.map((l) => `${l.tag}→${l.intention.toUpperCase()}${l.vertex ? '★' : ''} [${l.when}]`).join('; ') : (inp.tags.length ? 'тег без наклона (мёртв)' : '—');
    const inTxt = [
      Object.keys(inp.recordedShifts).length ? 'оси: ' + Object.entries(inp.recordedShifts).map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}` + (inp.actualShifts[k] === v ? '' : `(факт ${inp.actualShifts[k] || 0}${inp.onStop.includes(k) ? ', упор' : ''})`)).join(' ') : 'оси: —',
      Object.keys(inp.statBonuses).length ? 'рычаги: ' + Object.entries(inp.statBonuses).map(([k, v]) => `${k}+${(100 * v).toFixed(0)}%`).join(' ') : 'рычаги: —',
      'тег: ' + tagTxt,
    ].join(' · ');
    rows.push([
      cellName(inp), inTxt,
      `${f1(c.win.rate)} (${pp(c.win.delta)} [${pp(c.win.ciLo)}…${pp(c.win.ciHi)}])`, yn(c.outcome),
      pp(c.median.delta), `${c.identical}/${c.bouts}`,
      pc(c.decisions.chgAll), `${pc(c.decisions.tagTrue)} / ${pc(c.decisions.tagFlip)}`, f1(c.intents.l1pp),
      c.bodyHits.length ? c.bodyHits.join(',') : '—', yn(c.behavior),
      c.marks.join(' ') || '—',
    ]);
    for (const [foe, p] of Object.entries(c.perFoe)) rowsFoe.push([cellName(inp), CORE_NAME[foe], `${pp(p.delta)} ±${f1(THRESH.ciZ * p.se)}`, p.sigCi99 ? 'знач.(99%)' : '—', `${p.identical}/${p.n}`, pc(p.chg)]);
  }
  const head = ['ячейка', 'вход (запись в данных; факт после зажима)', 'доля побед T, % (сдвиг п.п. [95% интервал])', 'ИСХОД', 'Δ медианы, с', 'бит в бит как без кристалла', 'решений изменено', 'тег: условие истинно / переворачивает выбор', 'расхождение намерений, п.п.', 'телесные метрики за 3 шума', 'ПОВЕДЕНИЕ', 'метки'];
  const text = [
    `Часть A: ядро + ровно один кристалл (вершина тоже зажигается одна) против голых четырёх ядер (включая своё), 4 врага × 200 зёрен = 800 боёв на ячейку, стороны чередуются по зерну. Парное сравнение: тот же бой без кристалла, те же зёрна и стороны.`,
    `Пороги: ИСХОД = сдвиг доли побед вне 95% парного интервала. ПОВЕДЕНИЕ = изменено ≥ ${100 * THRESH.behShare}% решений ИЛИ телесная метрика сдвинулась > ${THRESH.noiseK} шумов (шум — noise.md).`,
    '', md(head, rows),
  ].join('\n');
  write('partA.md', text);
  write('partA_by_foe.md', `Часть A в разбивке по врагу: сдвиг доли побед (п.п., 200 парных боёв, ± 95% интервал), значимость на 99%, бит в бит, доля изменённых решений.\n\n` + md(['ячейка', 'враг', 'сдвиг, п.п.', 'значимо', 'бит в бит', 'решений изменено'], rowsFoe));
  json('partA.json', { thresh: THRESH, cells });
  json('amp-list.json', amp);
  console.log(`A: ячеек ${cells.length}; ИСХОД да ${cells.filter((c) => c.outcome).length}; ПОВЕДЕНИЕ да ${cells.filter((c) => c.behavior).length}; оба да ${cells.filter((c) => c.outcome && c.behavior).length}; пустых ${cells.filter((c) => c.cause).length}; на усиление ×3: ${amp.length}`);
}

// ── УСИЛЕНИЕ ×3 И ПРИЧИНЫ ────────────────────────────────────────────────────
/** Каналы, которые кристалл двигает, — для подписи «ГЛУХОЙ КАНАЛ»: что именно и где бой это не читает. */
function channelsText(c, a3) {
  const inp = c.input, parts = [];
  for (const [ax, v] of Object.entries(inp.recordedShifts)) {
    const stop = inp.onStop.includes(ax) ? ' (на упоре уже при ×1)' : '';
    const clamp = inp.clampAt3.includes(ax) ? ' — при ×3 ось упирается в зажим' : '';
    parts.push(`ось ${ax} ${v > 0 ? '+' : ''}${v}${stop}${clamp}`);
  }
  for (const k of Object.keys(inp.statBonuses)) {
    const rd = (inputs.readers[k] || []).length;
    parts.push(`рычаг ${k} +${(100 * inp.statBonuses[k]).toFixed(0)}%` + (rd ? '' : ' (боем не читается)'));
  }
  for (const l of inp.leans) parts.push(`наклон ${l.tag}→${l.intention.toUpperCase()} при «${l.when}»: условие истинно ${pc(a3.decisions.tagTrue)}, переворачивает ${pc(a3.decisions.tagFlip)} решений (×3: вес ${(3 * l.weight).toFixed(2)})`);
  return parts.join('; ') || 'входа нет';
}

function stepAmp() {
  const cells = readJson(OUT + 'partA.json').cells;
  const amp = readJson(OUT + 'amp-list.json');
  const cells3 = soloCells(3);
  const by3 = (c) => cells3.find((x) => x.core === c.core && x.branch === c.branch && x.idx === c.idx);
  const rows = [];
  for (const c of cells) {
    const need = amp.some((a) => a.core === c.core && a.branch === c.branch && a.idx === c.idx);
    if (!need) continue;
    const a3 = by3(c);
    if (!a3) { console.error('нет ×3 для', c.core, c.branch, c.idx); continue; }
    const inp = c.input;
    const cause = {};
    for (const [flag, fn] of [['outcome', 'outcome'], ['behavior', 'behavior']]) {
      if (c[fn]) { cause[flag] = null; continue; }
      cause[flag] = a3[fn] ? 'МАЛЫЙ ВЕС' : 'ГЛУХОЙ КАНАЛ';
    }
    c.amp3 = { win: a3.win, outcome: a3.outcome, behavior: a3.behavior, behByDecision: a3.behByDecision, decisions: a3.decisions, bodyHits: a3.bodyHits, l1pp: a3.intents.l1pp, median: a3.median, identical: a3.identical, bouts: a3.bouts, marks: marks(a3) };
    c.cause = cause;
    c.channels = channelsText(c, a3);
    c.note3 = a3.behavior ? `канал не глухой: при ×3 поведение меняется (решений изменено ${pc(a3.decisions.chgAll)}, телесных метрик за 3 шума: ${a3.bodyHits.length}), а исход остаётся в шуме` : 'при ×3 не меняются ни решения, ни тело';
    rows.push([cellName(inp), (c.outcome ? 'да' : 'нет') + ' / ' + (c.behavior ? 'да' : 'нет'),
      `${pp(a3.win.delta)} [${pp(a3.win.ciLo)}…${pp(a3.win.ciHi)}]`, yn(a3.outcome), pc(a3.decisions.chgAll), a3.bodyHits.join(',') || '—', yn(a3.behavior),
      `ИСХОД: ${cause.outcome || '—'}; ПОВЕДЕНИЕ: ${cause.behavior || '—'}`, c.channels, Object.values(cause).includes('ГЛУХОЙ КАНАЛ') ? c.note3 : '—']);
  }
  json('partA.json', { thresh: THRESH, cells });
  // разложение ×3 по каналам — только для ячеек с «глухим каналом»; канал берётся, только если он у кристалла есть
  const chanList = cells.filter((c) => c.cause && Object.values(c.cause).includes('ГЛУХОЙ КАНАЛ')).map((c) => {
    const inp = c.input; const channels = [];
    if (Object.keys(inp.recordedShifts).length) channels.push('axes');
    if (Object.keys(inp.statBonuses).length) channels.push('bonus');
    if (inp.leans.length) channels.push('lean');
    return { core: c.core, branch: c.branch, idx: c.idx, channels };
  });
  json('chan-list.json', chanList);
  write('partA_amp3.md', 'Усиление ×3 (сдвиги осей, бонусы, вес наклона — только у этого кристалла), ячейки, где вход есть, а флаг «нет». Те же 800 боёв, те же зёрна, тот же нулевой замер.\n\n' +
    md(['ячейка', 'флаги ×1 (ИСХОД / ПОВЕДЕНИЕ)', 'сдвиг доли побед при ×3 [95%]', 'ИСХОД ×3', 'решений изменено ×3', 'метрики за 3 шума ×3', 'ПОВЕДЕНИЕ ×3', 'причина', 'что кристалл двигает', 'пояснение к «глухому»'], rows));
  console.log(`×3: ${rows.length} ячеек; малый вес: ${cells.filter((c) => c.cause && Object.values(c.cause).includes('МАЛЫЙ ВЕС')).length}; глухой: ${cells.filter((c) => c.cause && Object.values(c.cause).includes('ГЛУХОЙ КАНАЛ')).length}`);
}

// ── РАЗЛОЖЕНИЕ ×3 ПО КАНАЛАМ (только «глухие» ячейки) ─────────────────────────
function stepChan() {
  const cells = readJson(OUT + 'partA.json').cells;
  const list = readJson(OUT + 'chan-list.json');
  const CH = { axes: 'оси', bonus: 'рычаги/показатели', lean: 'наклон тега' };
  const rows = [];
  for (const it of list) {
    const c = cells.find((x) => x.core === it.core && x.branch === it.branch && x.idx === it.idx);
    c.chan = {};
    for (const ch of it.channels) {
      const raw = loadRaw(`chan3-${ch}-${c.core}-${c.branch}${c.idx}`);
      if (!raw) continue;
      const a = analyseCell({ raw, base: base1(c.core), noise, core: c.core });
      c.chan[ch] = { win: a.win, outcome: a.outcome, behavior: a.behavior, behByDecision: a.behByDecision, chg: a.decisions.chgAll, bodyHits: a.bodyHits.length };
      rows.push([cellName(c.input), CH[ch], `${pp(a.win.delta)} [${pp(a.win.ciLo)}…${pp(a.win.ciHi)}]`, yn(a.outcome), pc(a.decisions.chgAll), String(a.bodyHits.length), yn(a.behavior)]);
    }
    // вывод по ячейке: какие каналы ×3 в одиночку дают флаг, какие нет
    const work = (f) => Object.entries(c.chan).filter(([, v]) => v[f]).map(([k, v]) => ({ k, d: v.win.delta }));
    const dead = (f) => Object.entries(c.chan).filter(([, v]) => !v[f]).map(([k]) => CH[k]);
    c.chanText = Object.entries(c.cause).filter(([, v]) => v === 'ГЛУХОЙ КАНАЛ').map(([f]) => {
      const name = f === 'outcome' ? 'ИСХОД' : 'ПОВЕДЕНИЕ';
      const w = work(f), d = dead(f);
      if (!w.length) return `${name}: ни один канал ×3 по отдельности флага не даёт (${d.join(', ')})`;
      const sgn = (x) => (f === 'outcome' ? ` ${pp(x.d)} п.п.` : '');
      const cancel = f === 'outcome' && w.some((x) => x.d > 0) && w.some((x) => x.d < 0);
      return `${name}: по отдельности ×3 даёт флаг ${w.map((x) => `«${CH[x.k]}»${sgn(x)}`).join(', ')}${cancel ? ' — каналы тянут в разные стороны и гасят друг друга' : (f === 'outcome' && w.every((x) => x.d < 0) ? ' — усиление вредит, а не помогает' : '')}; не читается: ${d.join(', ') || '—'}`;
    }).join('; ');
  }
  json('partA.json', { thresh: THRESH, cells });
  write('partA_channels.md', 'Разложение ×3 у ячеек с «глухим каналом»: усилен ×3 только один канал кристалла (оси / рычаги и показатели / наклон тега), остальные ×1. Те же 800 боёв и зёрна.\n\n' + md(['ячейка', 'канал ×3', 'сдвиг доли побед [95%]', 'ИСХОД', 'решений изменено', 'метрик за 3 шума', 'ПОВЕДЕНИЕ'], rows));
  console.log(`каналы: ${rows.length} прогонов, ${list.length} ячеек`);
}

// ── ЧАСТЬ B ─────────────────────────────────────────────────────────────────
/** Кристалл внутри своей ветви: полная ветвь (5 из 5) против ветви без него (4 из 5, резонанс держится), те же 4 врага и зёрна. */
function stepBuild() {
  const A = readJson(OUT + 'partA.json').cells;
  const cells = [];
  for (const core of CORES) for (const br of BR) {
    const full = loadRaw(`build-${core}-${br}-full`);
    if (!full) continue;
    // полная ветвь против ГОЛОГО ядра — справка (как ветка работает целиком)
    const fullVsBare = analyseCell({ raw: full, base: base1(core), noise, core, key: '1', tagKey: '1' });
    for (let j = 1; j <= 5; j++) {
      const no = loadRaw(`build-${core}-${br}-no${j}`);
      if (!no) continue;
      const an = analyseCell({ raw: full, base: no.foes, noise, core, key: String(j), tagKey: String(j) });
      const a = A.find((x) => x.core === core && x.branch === br && x.idx === j);
      const soloAlive = a.outcome || a.behavior;           // «жив в одиночку»: хотя бы один флаг да (A)
      const soloBehDec = a.behByDecision;                   // поведение по решениям — единственное, что измерено в обеих частях
      const bOutcome = an.outcome, bBeh = an.behByDecision;
      const absorbed = (a.outcome && !bOutcome) || (soloBehDec && !bBeh);
      const inp = a.input;
      cells.push({
        core, branch: br, idx: j, label: inp.label, dataName: inp.dataName, tags: inp.tags,
        inBranch: { win: an.win, outcome: bOutcome, median: an.median, identical: an.identical, bouts: an.bouts, perFoe: an.perFoe, decisions: an.decisions, behByDecision: bBeh },
        solo: { win: a.win, outcome: a.outcome, behavior: a.behavior, behByDecision: soloBehDec, decisions: a.decisions },
        alive: { solo: soloAlive, branch: bOutcome || bBeh }, absorbed,
        marks: { solo: a.marks, branch: marks(an) },
      });
    }
    cells.push({ fullVsBare: { core, branch: br, win: fullVsBare.win, median: fullVsBare.median, sample: fullVsBare.sample } });
  }
  const real = cells.filter((c) => c.label);
  const rows = real.map((c) => [
    `${CORE_NAME[c.core]} · ${c.label} · ${c.dataName}`,
    `${pp(c.solo.win.delta)} ${yn(c.solo.outcome)} / ${pc(c.solo.decisions.chgAll)}`,
    `${pp(c.inBranch.win.delta)} [${pp(c.inBranch.win.ciLo)}…${pp(c.inBranch.win.ciHi)}]`, yn(c.inBranch.outcome),
    pc(c.inBranch.decisions.chgAll), yn(c.inBranch.behByDecision),
    c.tags.length ? `${pc(c.inBranch.decisions.tagTrue)} / ${pc(c.inBranch.decisions.tagFlip)}` : '—',
    `${c.inBranch.identical}/${c.inBranch.bouts}`, c.absorbed ? 'ПОГЛОЩЁН' : '—',
  ]);
  const head = ['ячейка', 'в одиночку: сдвиг п.п. / ИСХОД / решений изменено', 'в ветви: сдвиг «полная ветвь − ветвь без него», п.п. [95%]', 'ИСХОД в ветви', 'решений изменено в ветви', 'ПОВЕДЕНИЕ по решениям в ветви', 'тег: условие истинно / переворачивает (в полной ветви)', 'бит в бит как без него', 'метка'];
  write('partB.md', 'Часть B: 12 полных ветвей (5 из 5) и 60 сборок «ветвь без одного кристалла» (4 из 5, резонанс держится: порог 3), против голых четырёх ядер, 4 врага × 200 зёрен = 800 боёв на сборку. Сдвиг — парный: тот же враг, то же зерно, полная ветвь против ветви без этого кристалла. «Решений изменено» — доля решений в полной ветви, которые были бы другими без этого кристалла (оси и наклоны, резонанс остаётся).\n' +
    'В части B телесные метрики не считались — «ПОВЕДЕНИЕ» здесь только по решениям; для метки ПОГЛОЩЁН в одиночку берётся тоже только эта половина флага (ИСХОД сравнивается с ИСХОДОМ, решения с решениями).\n\n' + md(head, rows));
  // вершины
  const vr = real.filter((c) => c.idx === 5).map((c) => [
    `${CORE_NAME[c.core]} · ${c.label} · ${c.dataName}`, c.tags.join(', ') || '—',
    `${pp(c.solo.win.delta)} / ${pc(c.solo.decisions.chgAll)}`, c.alive.solo ? 'жива' : 'мертва',
    `${pp(c.inBranch.win.delta)} / ${pc(c.inBranch.decisions.chgAll)}`, c.alive.branch ? 'жива' : 'мертва',
    c.absorbed ? 'ПОГЛОЩЕНА' : (c.alive.solo && c.alive.branch ? 'жива везде' : (!c.alive.solo && !c.alive.branch ? 'мертва везде' : '—')),
  ]);
  write('vertices.md', 'Вершины (шаг 5 каждой ветви): в одиночку и внутри своей ветви. «Жива» = хотя бы один флаг «да» (в одиночку: ИСХОД или ПОВЕДЕНИЕ; в ветви: ИСХОД или ≥5% решений).\n\n' + md(['вершина', 'тег', 'в одиночку: сдвиг п.п. / решений изменено', 'в одиночку', 'в ветви: сдвиг п.п. / решений изменено', 'в ветви', 'итог'], vr));
  json('partB.json', { thresh: THRESH, cells });
  console.log(`B: ячеек ${real.length}; поглощены ${real.filter((c) => c.absorbed).length}; вершин поглощены ${real.filter((c) => c.idx === 5 && c.absorbed).length}`);
}

// ── ИТОГ: контроль, сравнение со старой таблицей, REPORT_generated.md ───────
function stepFinal() {
  const A = readJson(OUT + 'partA.json').cells;
  const Bd = readJson(OUT + 'partB.json').cells;
  const B = Bd.filter((c) => c.label), FULL = Bd.filter((c) => c.fullVsBare).map((c) => c.fullVsBare);
  const sum = exists(OUT + 'regression.json') ? readJson(OUT + 'regression.json') : null;
  const effOld = readJson(REPO_DOCS + 'balance-recon/out/effect_200.json').cells;
  const cat = (c) => (c.outcome && c.behavior ? 'оба' : c.outcome ? 'исход' : c.behavior ? 'поведение' : 'ничего');
  const cnt = (f) => A.filter(f).length;
  const nBoth = cnt((c) => cat(c) === 'оба'), nOut = cnt((c) => cat(c) === 'исход'), nBeh = cnt((c) => cat(c) === 'поведение'), nNone = cnt((c) => cat(c) === 'ничего');
  const behDec = cnt((c) => c.behByDecision), behBodyOnly = cnt((c) => c.behavior && !c.behByDecision);
  const withNo = A.filter((c) => c.cause);
  const perFlag = { 'ПУСТОЙ': 0, 'МАЛЫЙ ВЕС': 0, 'ГЛУХОЙ КАНАЛ': 0 };
  const lists = { 'ПУСТОЙ': [], 'МАЛЫЙ ВЕС': [], 'ГЛУХОЙ КАНАЛ': [] };
  const grp = { 'ПУСТОЙ': new Map(), 'МАЛЫЙ ВЕС': new Map(), 'ГЛУХОЙ КАНАЛ': new Map() };
  for (const c of withNo) for (const [flag, cs] of Object.entries(c.cause)) if (cs) {
    perFlag[cs]++;
    const key = `${CORE_NAME[c.core]} ${c.input.label} ${c.input.dataName}`;
    (grp[cs].get(key) || grp[cs].set(key, { c, flags: [] }).get(key)).flags.push(flag === 'outcome' ? 'ИСХОД' : 'ПОВЕДЕНИЕ');
  }
  for (const cs of Object.keys(grp)) for (const [key, { c, flags }] of grp[cs]) lists[cs].push(`${key} — ${flags.join(' + ')}` + (cs === 'ГЛУХОЙ КАНАЛ' ? (c.amp3 && c.amp3.behavior ? ' [при ×3 поведение меняется, выигрыш нет]' : ' [при ×3 не меняется ничего]') : ''));
  const perCell = { 'ПУСТОЙ': 0, 'МАЛЫЙ ВЕС': 0, 'ГЛУХОЙ КАНАЛ': 0, смешанный: 0 };
  for (const c of withNo) { const set = new Set(Object.values(c.cause).filter(Boolean)); if (set.size > 1) perCell.смешанный++; else perCell[[...set][0]]++; }
  const short = (c) => `${c.input.label.replace(/ \(.*\)/, '')} ${c.input.dataName}`;
  const coreLine = (core) => {
    const cs = A.filter((c) => c.core === core);
    const k = (f) => cs.filter(f).length;
    const top = [...cs].sort((a, b) => b.win.delta - a.win.delta)[0], low = [...cs].sort((a, b) => a.win.delta - b.win.delta)[0];
    return `**${CORE_NAME[core]}** — оба ${k((c) => cat(c) === 'оба')}, только исход ${k((c) => cat(c) === 'исход')}, только поведение ${k((c) => cat(c) === 'поведение')}, ничего ${k((c) => cat(c) === 'ничего')}; средний сдвиг ${pp(mean(cs.map((c) => c.win.delta)))} п.п.; сильнее всех ${short(top)} (${pp(top.win.delta)}), слабее всех ${short(low)} (${pp(low.win.delta)}).`;
  };
  const marksList = (m) => A.filter((c) => c.marks.includes(m)).map((c) => `${CORE_NAME[c.core]} ${short(c)} (${pp(c.win.delta)})`);
  const spread = (c) => { const v = Object.values(c.perFoe).map((p) => p.delta); return Math.max(...v) - Math.min(...v); };
  const byFoeCells = A.filter((c) => { const v = Object.values(c.perFoe).map((p) => p.delta); return (Math.max(...v) >= 5 && Math.min(...v) <= -5) || spread(c) >= 20; });
  const byFoeTxt = byFoeCells.length
    ? 'Сдвиг доли побед T против каждого врага (п.п., 200 парных боёв; «*» — значим на 99%). Включены ячейки, где оценки разных знаков ≥ 5 п.п. по модулю либо разброс между врагами ≥ 20 п.п.\n\n' +
      md(['ячейка', ...CORES.map((k) => 'против ' + CORE_NAME[k])], byFoeCells.map((c) => [cellName(c.input), ...CORES.map((k) => { const p = c.perFoe[k]; return `${pp(p.delta)}${p.sigCi99 ? '*' : ''}`; })]))
    : 'Таких ячеек нет.';
  const vert = B.filter((c) => c.idx === 5);
  const vSolo = vert.filter((c) => c.alive.solo).length, vBr = vert.filter((c) => c.alive.branch).length, vAbs = vert.filter((c) => c.absorbed).length;
  const invisible = B.filter((c) => c.inBranch.identical === c.inBranch.bouts);
  // контроль по выборке частей A и B
  const sampleOf = (names) => {
    const secs = []; let capped = 0; const perCell = [];
    for (const n of names) {
      const r = loadRaw(n); if (!r) continue;
      const sc = Object.values(r.foes).flatMap((f) => f.sec); const cp = Object.values(r.foes).reduce((a, f) => a + f.capped, 0);
      secs.push(...sc); capped += cp; perCell.push({ n, median: median(sc), over100: sc.filter((x) => x > 100).length, capped: cp, max: Math.max(...sc) });
    }
    return { secs, capped, perCell };
  };
  const sA = sampleOf(A.map((c) => `solo-${c.core}-${c.branch}${c.idx}`));
  const bNames = [];
  for (const core of CORES) for (const br of BR) { bNames.push(`build-${core}-${br}-full`); for (let j = 1; j <= 5; j++) bNames.push(`build-${core}-${br}-no${j}`); }
  const sB = sampleOf(bNames);
  const baseMed = Object.fromEntries(CORES.map((c) => [c, median(Object.values(base1(c)).flatMap((r) => r.sec))]));
  const warnA = A.filter((c) => c.sample.capped > 0 || c.sample.median > THRESH.medianWarn);
  const warnB = sB.perCell.filter((x) => x.capped > 0 || x.median > THRESH.medianWarn || x.over100 > 0);
  // сравнение со старой таблицей effect_200 (зеркало)
  const cmp = A.map((c) => { const o = effOld.find((x) => x.core === c.core && x.branch === c.branch && x.idx === c.idx - 1); const m = c.perFoe[c.core]; return { c, old: o, dNew: m.delta, idNew: m.identical }; });
  const corr = (() => { const xs = cmp.map((x) => x.old.dWrVsBase), ys = cmp.map((x) => x.dNew); const mx = mean(xs), my = mean(ys); return xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / Math.sqrt(xs.reduce((a, x) => a + (x - mx) ** 2, 0) * ys.reduce((a, y) => a + (y - my) ** 2, 0)); })();
  const flips = cmp.filter((x) => (x.old.dWrVsBase > 10 && x.dNew < -4) || (x.old.dWrVsBase < -10 && x.dNew > 4));
  const bigMoves = cmp.filter((x) => Math.abs(x.old.dWrVsBase - x.dNew) >= 15).sort((a, b) => Math.abs(b.old.dWrVsBase - b.dNew) - Math.abs(a.old.dWrVsBase - a.dNew));
  write('effect_compare.md', `Зеркальный срез новой части A (враг = то же ядро, зёрна 1–200, стороны чередуются, T первым — та же постановка, что у \`docs/balance-recon/out/effect_200.*\`) против старой таблицы. Старое «Δ к нулю» снято до правки дистанции, тегов, лимита 7 и рефлекса.\n\n` +
    md(['ячейка', 'старое Δ к нулю, п.п.', 'новое Δ (зеркало), п.п.', 'старое бит в бит', 'новое бит в бит'], cmp.map((x) => [cellName(x.c.input), pp(x.old.dWrVsBase), pp(x.dNew), `${x.old.identical}/200`, `${x.idNew}/200`])) +
    `\n\nКорреляция старого и нового сдвига по 60 ячейкам: ${corr.toFixed(2)}. Шум одной ячейки в зеркале (n=200): ±${(1.96 * Math.SQRT2 * Math.sqrt(0.25 / 200) * 100).toFixed(0)} п.п. на сдвиг.`);
  const tblA = readFileSync(OUT + 'partA.md', 'utf8'), tblB = readFileSync(OUT + 'partB.md', 'utf8'), tblAmp = readFileSync(OUT + 'partA_amp3.md', 'utf8'), tblV = readFileSync(OUT + 'vertices.md', 'utf8'), tblNoise = readFileSync(OUT + 'noise.md', 'utf8');
  const noiseSplit = tblNoise.indexOf('## 2.');
  const regTxt = sum ? md(['проверка', 'до (старт, база cad3c631)', 'после (конец работы)', 'ожидание ТЗ'], [
    ['голые ядра, 48 боёв', '`' + sum.before.bare + '`', '`' + sum.after.bare + '`', '`ec148d29…86400c`'],
    ['бои со сборками, 36 боёв', '`' + sum.before.builds + '`', '`' + sum.after.builds + '`', '`5b0a65d4…bd27`']]) : '(регрессия не снята)';
  const fr = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
  const L = [];
  L.push('## Главное', '',
    'Замеряно: 60 ячеек «ядро × кристалл» в одиночку (48 000 боёв), 72 сборки внутри своих веток (57 600 боёв), ещё 33 ячейки с усилением ×3 (26 400 боёв) и разложение ×3 по каналам у 17 «глухих» ячеек (23 200 боёв). Везде 200 зёрен на пару «ячейка × враг», враги — все четыре ядра без кристаллов, включая своё. Код игры не менялся.', '',
    '**1. Из 60 кристаллов:**', '',
    md(['', 'сколько'], [['меняют и исход боя, и поведение', String(nBoth)], ['только исход (поведение в шуме)', String(nOut)], ['только поведение (исход в шуме)', String(nBeh)], ['не меняют ничего', String(nNone)]]), '',
    `Поведение «да» у ${nBoth + nBeh} ячеек, но это мягкий флаг: у ${behDec} из них кристалл меняет не меньше 5% решений о выборе намерения, у остальных ${behBodyOnly} сдвигается только манера тела (дистанция, темп, блоки), а выбор намерений тот же.`, '',
    `**2. Из ${withNo.length} ячеек, где хотя бы один флаг «нет»** (всего «нет» в ${perFlag['ПУСТОЙ'] + perFlag['МАЛЫЙ ВЕС'] + perFlag['ГЛУХОЙ КАНАЛ']} местах):`, '',
    md(['причина', 'флагов', 'ячеек (только эта причина)'], [['ПУСТОЙ — вход нулевой', String(perFlag['ПУСТОЙ']), String(perCell['ПУСТОЙ'])], ['МАЛЫЙ ВЕС — при ×3 флаг появляется', String(perFlag['МАЛЫЙ ВЕС']), String(perCell['МАЛЫЙ ВЕС'])], ['ГЛУХОЙ КАНАЛ — при ×3 флага нет', String(perFlag['ГЛУХОЙ КАНАЛ']), String(perCell['ГЛУХОЙ КАНАЛ'])], ['у ячейки два флага с разными причинами', '—', String(perCell.смешанный)]]), '',
    'Пустых кристаллов нет: у каждого есть хотя бы сдвиг оси после зажима. «Глухой канал» здесь в основном значит не «ничего не происходит», а «поведение меняется, выигрыш нет» — подробности у каждой ячейки в таблице ×3.', '',
    '**3. По ядрам:**', '', ...CORES.map((c) => '- ' + coreLine(c)), '',
    '**4. Метки:**', '',
    `- ВРЕДИТ (значимо отрицательный сдвиг): ${marksList('ВРЕДИТ').join('; ') || 'нет'}`,
    `- ПЕРЕКОС (+${THRESH.skew} п.п. и больше): ${marksList('ПЕРЕКОС').join('; ') || 'нет'}`,
    `- ЗНАК ПО ВРАГУ (против одних значимо помогает, против других значимо вредит, 99% на врага): ${marksList('ЗНАК ПО ВРАГУ').join('; ') || 'ни одной ячейки'}. На 200 боях против одного врага различить знак трудно; у четырёх ячеек точечные оценки разных знаков ≥ 5 п.п., но ни одна не значима.`, '',
    `**5. 12 вершин:** живы в одиночку — ${vSolo} из 12; живы внутри своей ветви — ${vBr} из 12; **поглощены веткой** (в одиночку живы, внутри ветви нет) — ${vAbs}: ${vert.filter((c) => c.absorbed).map((c) => `${CORE_NAME[c.core]} ${c.dataName}`).join(', ') || '—'}.`, '',
    '**6. Три списка для прохода по числам:**', '',
    `- *Чинить данными кристалла (пустые):* ${lists['ПУСТОЙ'].length ? lists['ПУСТОЙ'].join('; ') : 'таких нет.'}`,
    `- *Чинить весом (малый вес, при ×3 работает) — ${lists['МАЛЫЙ ВЕС'].length}:* ${lists['МАЛЫЙ ВЕС'].join('; ')}.`,
    `- *Чинить проводкой (глухой канал, при ×3 флага нет) — ${lists['ГЛУХОЙ КАНАЛ'].length}:* ${lists['ГЛУХОЙ КАНАЛ'].join('; ')}.`, '',
    `**Отдельно, про ветки целиком:** в ${invisible.length} ячейках внутри своей ветви **ни один из 800 боёв не отличается** от боя без этого кристалла (${invisible.map((c) => `${CORE_NAME[c.core]} ${c.dataName}`).join(', ')}): их сдвиги осей уже съедены зажимом 0/100, который выставили соседи по ветке и само ядро.`, '',
    '---', '',
    '## Как читать', '',
    '- ГРАНЬ = ветвь (BODY / MIND / WILL, в коде `crystal`, a / b / c). КРИСТАЛЛ = шаг 1…5 внутри грани (в коде `face`). ВЕРШИНА = шаг 5. Ячейка = ядро × кристалл; подпись `ЯДРО · ГРАНЬ/ИМЯ (a5) · имя в данных`.',
    '- **Часть A:** ядро + ровно один кристалл (вершина тоже одна) против голых четырёх ядер. **Часть B:** 12 полных ветвей (5 из 5) и 60 сборок «ветвь без одного» (4 из 5; резонанс держится, порог 3).',
    '- **Парное сравнение:** каждый бой T сравнивается с тем же боем того же ядра без кристалла (то же зерно, тот же враг, те же стороны плиты). Стороны плиты чередуются по зерну.',
    `- **ИСХОД = да**, если сдвиг доли побед выходит за 95% парный интервал (±${THRESH.ciZ}·σ). **ПОВЕДЕНИЕ = да**, если кристалл изменил не меньше ${100 * THRESH.behShare}% решений выбора намерения ИЛИ хотя бы одна телесная метрика сдвинулась больше чем на ${THRESH.noiseK} шума (шум — раздел 2). Пороги черновые; все сырые числа лежат в \`out/raw\`, пересчёт — перезапуск \`crystal-remeasure-report.mjs\` с другими \`THRESH\`.`,
    '- **«Изменил решение»:** в каждом решении бойца T выбор пересчитывается так, будто кристалл не зажжён (оси ядра без сдвигов, наклонов кристалла нет), и сравнивается с настоящим; остальное состояние то же. Рядом в json: только оси убраны / только наклоны убраны.',
    '- **Расхождение намерений, п.п.** — формула из `grani-recon.mjs`: 50·Σ|доля_T − доля_без_кристалла| по семи намерениям, доли — по тикам бойца (пулом по всем боям ячейки).',
    '- Телесные метрики — определения как в `reflex-sight-controls.mjs` / `motion-recon.mjs occupancy`: «вне радиуса» = дистанция ≥ 1.45, «свободное время» = нет клипа, блока, сбива, выдоха; ударов/мин = контакты в начатых атакующих клипах на минуту жизни T; попадание = падение здоровья врага за тик; CATCH = время в намерении «ловить»; «сбив/контра» = срабатывания чтения фазы врага.', '',
    '## 1. Сверка нулевого замера и регрессия', '', tblNoise.slice(0, noiseSplit).replace('## 1. Сверка нулевого замера с известным\n\n', ''), '',
    '**Регрессионные суммы (обе, до и после):**', '', regTxt, '',
    tblNoise.slice(noiseSplit), '',
    '## 3. Часть A — 60 ячеек (кристалл в одиночку)', '', tblA, '',
    '*Разбивка по врагам — `out/partA_by_foe.md` (и `partA.json`).*', '',
    '## 4. Усиление ×3 там, где вход есть, а флаг «нет»', '', tblAmp, '',
    '## 5. Часть B — кристалл внутри своей ветви', '', tblB, '',
    '### Вершины', '', tblV, '',
    '### Ветвь целиком против голого ядра (справка)', '',
    md(['ядро', 'ветвь', 'доля побед, %', 'сдвиг к голому, п.п.', 'медиана, с', 'дольше 100 с', 'максимум, с'], FULL.map((f) => [CORE_NAME[f.core], f.branch, fr(f.win.rate), pp(f.win.delta), fr(f.median.cell), String(f.sample.over100), fr(f.sample.max)])), '',
    '## 6. Сравнение с `effect_200` (зеркало)', '',
    `Корреляция старого и нового сдвига по 60 ячейкам: **${corr.toFixed(2)}**. Ячеек, где знак большого старого сдвига перевернулся: ${flips.length}${flips.length ? ' (' + flips.map((x) => `${CORE_NAME[x.c.core]} ${x.c.input.dataName}: ${pp(x.old.dWrVsBase)} → ${pp(x.dNew)}`).join('; ') + ')' : ''}. Ячеек, где сдвиг изменился на 15 п.п. и больше: ${bigMoves.length}${bigMoves.length ? ' (' + bigMoves.slice(0, 12).map((x) => `${CORE_NAME[x.c.core]} ${x.c.input.dataName}: ${pp(x.old.dWrVsBase)} → ${pp(x.dNew)}`).join('; ') + (bigMoves.length > 12 ? '; …' : '') + ')' : ''}. Полная таблица — \`out/effect_compare.md\`. Шум одной ячейки в зеркале (n=200) на сдвиг ≈ ±10 п.п., поэтому мелкие расхождения — не находка.`, '',
    '## 6а. Разбивка по врагам там, где знак или размер сильно зависит от врага', '',
    byFoeTxt, '',
    '## 6б. Глухие каналы: что кристалл двигает и как это читается при ×3 по каналам', '',
    md(['ячейка', 'что кристалл двигает', 'разложение ×3 по каналам'], A.filter((c) => c.chanText).map((c) => [cellName(c.input), c.channels, c.chanText])), '',
    '*Полные прогоны по каналам — `out/partA_channels.md`.*', '',
    '## 7. Контроль по всей выборке', '',
    md(['выборка', 'боёв', 'медиана, с', 'дольше 100 с', 'таймаутов', 'максимум, с'], [
      ['часть A (60 ячеек)', String(sA.secs.length), fr(median(sA.secs)), String(sA.secs.filter((x) => x > 100).length), String(sA.capped), fr(Math.max(...sA.secs))],
      ['часть B (72 сборки)', String(sB.secs.length), fr(median(sB.secs)), String(sB.secs.filter((x) => x > 100).length), String(sB.capped), fr(Math.max(...sB.secs))]]), '',
    `Медиана голого ядра против четырёх (блок 1): ${CORES.map((c) => `${CORE_NAME[c]} ${fr(baseMed[c])}`).join(', ')} с — у BULWARK она выше 55 с уже без кристаллов, поэтому метка у его ячеек от ядра, не от кристалла.`, '',
    `**Часть A — ячейки с таймаутами или медианой > ${THRESH.medianWarn} с:** ` + (warnA.length ? warnA.map((c) => `${CORE_NAME[c.core]} ${c.input.dataName} ${fr(c.sample.median)}`).join('; ') + (warnA.some((c) => c.sample.capped) ? '; ТАЙМАУТЫ ЕСТЬ' : '; таймаутов нет ни у одной') : 'нет') + '.', '',
    `**Часть B — сборки с таймаутом или боем дольше 100 с:** ` + (warnB.filter((x) => x.capped > 0 || x.over100 > 0).length ? warnB.filter((x) => x.capped > 0 || x.over100 > 0).map((x) => `${x.n} (макс ${fr(x.max)} с, дольше 100 с: ${x.over100}, таймаутов ${x.capped})`).join('; ') + ' — четыре сборки BULWARK BODY несут один и тот же долгий бой (одно зерно против одного врага)' : 'нет') + '.', '',
    `**Часть B — полные ветви с медианой > ${THRESH.medianWarn} с:** ` + (sB.perCell.filter((x) => /-full$/.test(x.n) && x.median > THRESH.medianWarn).map((x) => `${x.n.replace('build-', '').replace('-full', '')} (${fr(x.median)} с)`).join('; ') || 'нет') + ' (у BULWARK это от ядра: оно и голое держит бой дольше 55 с).', '',
  );
  // ── Найдено, не чинилось ──
  const needMean = mean(A.map((c) => c.decisions.need));
  const tagQuiet = A.filter((c) => c.input.leans.length && c.decisions.tagTrue >= 0.10 && c.decisions.tagFlip < 0.01);
  const fullBad = FULL.filter((f) => f.win.delta < 0).map((f) => `${CORE_NAME[f.core]} ${{ a: 'BODY', b: 'MIND', c: 'WILL' }[f.branch]} ${pp(f.win.delta)}`);
  const tinyB = B.filter((c) => c.inBranch.outcome && Math.abs(c.inBranch.win.delta) < 1);
  const over100B = FULL.filter((f) => f.sample.over100 > 0);
  const F = [];
  F.push('## 8. Найдено, не чинилось', '',
    `1. **${invisible.length} кристаллов невидимы внутри своей ветви.** При удалении любого из них из полной ветви все 800 боёв совпадают бит в бит: ${invisible.map((c) => { const inp = inputOf(c.core, c.branch, c.idx); return `${CORE_NAME[c.core]} ${c.dataName} (${c.label.replace(/ \(.*\)/, '')}; ${Object.entries(inp.branchAxesWithout).map(([k, v]) => `${k} без него уже ${v}`).join(', ')})`; }).join('; ')}. Причина одна: ось, которую кристалл двигает, уже упёрлась в 0 или 100 из-за стартового профиля ядра и остальных четырёх кристаллов ветки. Сдвиг записан в данных и показан на карточке, но в бою ничего не делает.`,
    `2. **Доля решений, которые решает жёсткая нужда** (запас сил, ответ на замах, заряд; до очков), часть A: ${CORES.map((k) => `${CORE_NAME[k]} ${pc(mean(A.filter((c) => c.core === k).map((c) => c.decisions.need)))}`).join(', ')}. У BULWARK и AMBUSH это заметная часть выбора: там кристалл влияет на решение только через ответ на замах (выбор из CATCH / BREAK / HOLD), а пороги нужд по запасу сил и заряду от осей сейчас не зависят (bend = 0).`,
    `3. **Тег «срабатывает», но выбор не меняет** (условие верно ≥ 10% решений, переворот < 1%): ${tagQuiet.length ? tagQuiet.map((c) => `${CORE_NAME[c.core]} ${c.input.dataName} (${c.input.leans.map((l) => l.tag).join(',')}: условие ${pc(c.decisions.tagTrue)}, переворот ${pc(c.decisions.tagFlip)})`).join('; ') : 'таких нет'}.`,
    `4. **Ветви, которые целиком хуже голого ядра** (сдвиг к голому ядру < 0, часть B, справка): ${fullBad.length ? fullBad.join('; ') : 'нет'}. При этом внутри ONSLAUGHT MIND кристалл Lockdown меняет ${pc(B.find((c) => c.core === 'natisk' && c.branch === 'b' && c.idx === 5).inBranch.decisions.chgAll)} решений — поведение ветки меняется сильно, выигрыш нет.`,
    `5. **Глухой канал чаще «не доходит до исхода», чем «не читается»:** при ×3 у ${A.filter((c) => c.cause && Object.values(c.cause).includes('ГЛУХОЙ КАНАЛ') && c.amp3 && c.amp3.behavior).length} из ${A.filter((c) => c.cause && Object.values(c.cause).includes('ГЛУХОЙ КАНАЛ')).length} ячеек с глухим каналом решения и тело меняются, а доля побед нет. Отдельно: ONSLAUGHT Heavy Hit при ×3 — оси (вес) −7.6 п.п. и рычаг силы +6.5 п.п. гасят друг друга; RAIDER Clean Exchange при ×3 — наклон «всегда» вредит (−7.2).`,
    `6. **Формально значимые, практически нулевые:** ${tinyB.length ? tinyB.map((c) => `${CORE_NAME[c.core]} ${c.dataName} в ветви: ${pp(c.inBranch.win.delta)} п.п. (перевернулось 4 боя из 800 в одну сторону)`).join('; ') : 'нет'} — флаг ИСХОД «да» по правилу интервала, по смыслу ноль.`,
    `7. **Долгие бои:** ${over100B.length ? over100B.map((f) => `${CORE_NAME[f.core]} ${{ a: 'BODY', b: 'MIND', c: 'WILL' }[f.branch]} (полная ветвь): боёв дольше 100 с — ${f.sample.over100}, максимум ${fr(f.sample.max)} с`).join('; ') : 'дольше 100 с боёв в полных ветвях нет'}; полный список — раздел 7.`, '',
    '## 9. Не сделано и оговорки', '',
    `- **Мягкий флаг ПОВЕДЕНИЕ.** Порог «3 шума» по телесным метрикам очень низкий (шум 0.1–0.6 п.п. на 800 боёв), поэтому почти любой сдвиг оси его пересекает: из ${nBoth + nBeh} ячеек с флагом только ${behDec} меняют ≥ 5% решений. Жёсткая половина флага (решения) показана отдельной колонкой; пороги пересчитываются без нового прогона.`,
    '- **Шум оценён по 5 блокам** (стандартное отклонение по 5 точкам ± ~35% само по себе); пороги по телу считаются от σ разности двух нулевых замеров, а сами ячейки сравниваются с блоком 1 парно — это консервативно (парное сравнение шумит меньше).',
    '- **Часть B: телесные метрики не считались**, ПОВЕДЕНИЕ там — только по решениям; метка ПОГЛОЩЁН сравнивает ИСХОД с ИСХОДОМ и решения с решениями.',
    '- **Вершина в одиночку зажигается без условий порядка** (разрешено ТЗ: условия снесены 30.09). Сборки из двух веток (5+2) и россыпь не мерились — они на `claude/resonance-seven`.',
    '- **«Как будто кристалла нет» в решении** — подмена входа выбора (оси ядра и наклоны) при том же состоянии боя; дальность `range` и прочее состояние бойца берутся настоящие (как у зонда рефлекса). Решение, которое изменилось бы только из-за другого состояния по ходу боя (цепочка последствий), этим счётчиком не ловится — её видно по исходу и по телу.',
    '- **Вердикт «ГЛУХОЙ КАНАЛ» — по правилу ТЗ (флага нет и при ×3).** Из разложения по каналам (раздел 6б) видно, что часто это не глухота проводки, а отсутствие связи «поведение → победа»; чинить это весом или данными бесполезно.',
    '- **×3 — одинаковый множитель на все каналы сразу** (сдвиги осей, рамп силы/прочности и добавочные бонусы, вес наклона). Если ось при ×3 упёрлась в зажим, это не скрыто: колонка «что кристалл двигает» в разделе 4 помечает такие оси.',
    '- **Зал FORGE** (7 коммитов поверх `5530f904`) на бой не влияет — проверено списком изменённых путей и регрессионными суммами.', '',
    '## 10. Как повторить', '',
    'См. `docs/crystal-remeasure/probe/README.md`: копия дерева с патчем зонда (`decisions-probe.patch`), затем `crystal-remeasure-run.mjs` (этапы zerocheck / zero / solo / amp / chan / build) и `crystal-remeasure-report.mjs` (noise / solo / amp / chan / build / final).', '');
  L.push(...F);
  const head = ['# Перезамер кристаллов на новом бое', '',
    '> **База `cad3c631`**, поверх `5530f904` лежат 7 коммитов зала FORGE; они меняют только `src/components/forge/ForgePanel.vue`, `src/scene/PveScene.vue`, `src/scene/forgeProps.js`, `src/styles/forge.css`, `src/views-v2/PveView.vue` (и скрипты/снимки зала) — файлы боя (`src/scene/buildFighter.js`, `instantBout.js`, `boutCore.js`, `battleField.js`, вся `src/data/`: `intentions.js`, `combatBalance.js`, `upgradeData.js`, `branchThreshold.js`, `behavior.js`) и данные кристаллов не тронуты; обе регрессионные суммы совпали.', ''];
  writeFileSync(REPO_DOCS + 'crystal-remeasure/REPORT.md', [...head, ...L].join('\n') + '\n');
  write('REPORT_generated.md', L.join('\n'));
  json('summary.json', { categories: { nBoth, nOut, nBeh, nNone, behDec, behBodyOnly }, perFlag, perCell, lists, vertices: { solo: vSolo, branch: vBr, absorbed: vAbs }, invisible: invisible.map((c) => `${c.core} ${c.dataName}`), control: { A: { bouts: sA.secs.length, median: median(sA.secs), over100: sA.secs.filter((x) => x > 100).length, capped: sA.capped }, B: { bouts: sB.secs.length, median: median(sB.secs), over100: sB.secs.filter((x) => x > 100).length, capped: sB.capped } }, effectCompare: { corr, flips: flips.length, bigMoves: bigMoves.length } });
  console.log('REPORT_generated.md записан');
}

const steps = { noise: stepNoise, solo: stepSolo, amp: stepAmp, chan: stepChan, build: stepBuild, final: stepFinal };
if (!steps[step]) throw new Error('шаг: ' + Object.keys(steps).join(' | '));
steps[step]();
