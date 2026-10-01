// balance-recon-static.mjs — СТАТИЧЕСКИЙ РАЗБОР данных кристаллов (TZ_balance_recon_v1, пункты 2, 5, 6, 8, 9). БЕЗ БОЁВ.
// Читает игровые данные (upgradeData / behavior / branchThreshold / combatBalance) и ГОТОВЫЕ данные перезамера docs/crystal-remeasure/out
// (база cad3c631; обе регрессионные суммы на d9327e02 совпали — данные действительны). Пишет docs/balance-recon/out/static.{md,json}.
// ЗАПУСК: node scripts/balance-recon-static.mjs
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { openHarness } from './lib/bout-harness.mjs';
import { CORES, CORE_NAME, BR, BR_NAME, md, f1, f2, f3, pct, sgn, mean, median, pairedShift } from './balance-recon-lib.mjs';

const REPO = new URL('..', import.meta.url).pathname;
const OUT = REPO + 'docs/balance-recon/out/';
const RM = REPO + 'docs/crystal-remeasure/out/';
mkdirSync(OUT, { recursive: true });
const H = await openHarness();
const { load, resolveBehavior } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const { CRYSTAL_TEXTS } = await load('/src/data/crystalTexts.js');
const { CORE_PROFILES, AXIS_IDS } = await load('/src/data/behavior.js');
const { TAG_LEANS, BRANCH_HOME, resolveLeans } = await load('/src/data/branchThreshold.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const GR = COMBAT_BALANCE.grani;
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const label = (core, b, j) => `${CORE_NAME[core]} · ${BR_NAME[b]}/${CRYSTAL_TEXTS[b][j - 1].name} (${b}${j}) · ${CRYSTALS[core].find((x) => x.id === b).faces[j - 1].name}`;
const clamp = (v) => Math.max(0, Math.min(100, v));
const out = {};
const md_ = [];
const P = (s = '') => md_.push(s);

// ── ВЕСА ОСЕЙ В ВЫБОРЕ НАМЕРЕНИЯ (spinalScore, src/data/intentions.js) ──────────────────────────────────────────────
// Перечитано с кода; ось → { намерение: вес при (ось/100) }, для (1 − ось) вес отрицательный. tempo в очках не участвует вовсе.
const SCORE_W = {
  initiative: { press: 0.50, strike: 0.30, catch: -0.20 },
  stick: { press: 0.30, hold: 0.30, break: -0.20 },
  distance: { press: -0.20, sting: 0.45, breathe: 0.10 },
  weight: { strike: 0.35, sting: -0.20 },
  slip: { sting: 0.30, break: 0.50 },
  resilience: { hold: 0.40, catch: 0.25 },
  counter: { catch: 0.45 },
  tempo: {},
};
/** Самое большое изменение очков одного намерения от сдвигов осей (по модулю) и какое. */
function scoreMove(shifts) {
  const d = {};
  for (const [ax, dv] of Object.entries(shifts)) for (const [it, w] of Object.entries(SCORE_W[ax] || {})) d[it] = (d[it] || 0) + w * (dv / 100);
  let best = { it: null, v: 0 };
  for (const [it, v] of Object.entries(d)) if (Math.abs(v) > Math.abs(best.v)) best = { it, v };
  return { byIntent: d, max: best };
}

// ════════ ПУНКТ 2. ПОТОЛОК ШКАЛ ════════
const axisRows = [];
const branchAxes = {}; // core → branch → { start, sumShift, finalSeq, per-axis }
for (const core of CORES) {
  branchAxes[core] = {};
  const start = CORE_PROFILES[core];
  for (const b of BR) {
    const faces = CRYSTALS[core].find((x) => x.id === b).faces;
    const cur = { ...start };
    const sum = {};
    for (const f of faces) for (const s of f.shifts) { sum[s.axis] = (sum[s.axis] || 0) + s.delta; cur[s.axis] = clamp(cur[s.axis] + s.delta); }
    branchAxes[core][b] = {};
    for (const ax of AXIS_IDS) {
      if (!sum[ax]) continue;
      const un = start[ax] + sum[ax];
      const fin = cur[ax];
      const loss = Math.abs(un - fin);
      branchAxes[core][b][ax] = { start: start[ax], sum: sum[ax], unclamped: un, final: fin, loss };
      axisRows.push([CORE_NAME[core], BR_NAME[b], ax, start[ax], sgn(sum[ax], 0), un, fin, loss ? `**${loss}**` : 0]);
    }
  }
}
out.axisCeiling = branchAxes;
P('## Пункт 2. Потолок шкал 0/100: старт, сумма сдвигов грани, потеря');
P('');
P('Сдвиги осей применяются в порядке кристаллов 1…5 с зажимом 0/100 после каждого (как `resolveBehavior`). «Потеря» = |старт + сумма − итог|: сдвиг, записанный в данных и показанный на карточке, но не дошедший до бойца. Таблица по каждой грани в одиночку (полная грань, 5 из 5).');
P('');
P(md(['ядро', 'грань', 'ось', 'старт', 'сумма сдвигов', 'без зажима', 'итог', 'потеря'], axisRows));
P('');
const lossByCore = {};
for (const core of CORES) {
  let tot = 0, n = 0, abs = 0;
  for (const b of BR) for (const v of Object.values(branchAxes[core][b])) { tot += v.loss; if (v.loss) n++; abs += Math.abs(v.sum); }
  lossByCore[core] = { tot, n, abs };
}
P('Сгорает, по ядрам (сумма |потерь| по осям всех трёх полных граней / сумма |всех записанных сдвигов|): ' + CORES.map((c) => `${CORE_NAME[c]} ${lossByCore[c].tot} из ${lossByCore[c].abs} (${pct(lossByCore[c].tot / lossByCore[c].abs, 0)}), осей с потерей: ${lossByCore[c].n}`).join('; ') + '.');
P('');

// Кристаллы, которых не видно внутри полной грани (ось-канал): убираем один кристалл → итоговые оси грани те же?
const invis = [];
const invisAll = [];
for (const core of CORES) for (const b of BR) {
  const faces = CRYSTALS[core].find((x) => x.id === b).faces;
  const run = (skip) => { const c = { ...CORE_PROFILES[core] }; faces.forEach((f, i) => { if (i + 1 === skip) return; for (const s of f.shifts) c[s.axis] = clamp(c[s.axis] + s.delta); }); return c; };
  const full = run(0);
  for (let j = 1; j <= 5; j++) {
    const w = run(j);
    const same = AXIS_IDS.every((a) => w[a] === full[a]);
    const f = faces[j - 1];
    const otherChannels = [];
    if (f.statBonus) otherChannels.push(`рамп ${f.statBonus.stat} +${Math.round(100 * f.statBonus.pct)}%`);
    for (const eb of f.extraBonuses || []) otherChannels.push(`${eb.stat} +${Math.round(100 * eb.pct)}%`);
    for (const t of [...(f.conditionals || []), ...(f.effects || [])]) otherChannels.push(`тег ${t}`);
    const rec = { core, b, j, label: label(core, b, j), axisSame: same, shifts: f.shifts.map((s) => `${s.axis}${sgn(s.delta, 0)}`).join(' '), other: otherChannels };
    invisAll.push(rec);
    if (same) invis.push(rec);
  }
}
out.axisInvisible = invis;
P('### Кристаллы, которых нет в итоговых осях полной грани (убрать — оси те же)');
P('');
P(`Всего ${invis.length} из 60 (по осям; тело и рычаги не смотрим). Перезамер называл 9 кристаллов, «бит в бит 800/800» — ниже проверка по данным.`);
P('');
P(md(['кристалл', 'что двигает', 'других каналов у него'], invis.map((r) => [r.label, r.shifts || '—', r.other.join('; ') || '—'])));
P('');

// ════════ ПУНКТ 6. 41 кристалл не меняет решения ════════
const A = readJson(RM + 'partA.json').cells;
const B = readJson(RM + 'partB.json').cells;
const cellsLow = A.filter((c) => c.decisions.chgAll < 0.05);
out.lowDecisionCount = cellsLow.length;
const rows6 = [];
const chanCount = { 'только тело (tempo или рычаги)': 0, 'оси в очках намерений': 0, 'тег': 0 };
const low6 = [];
for (const c of cellsLow) {
  const inp = c.input;
  const sh = inp.actualShifts || {};
  const sm = scoreMove(sh);
  const hasTag = (inp.tags || []).length > 0;
  const leans = inp.leans || [];
  const axesList = Object.entries(sh).map(([a, v]) => `${a}${sgn(v, 0)}`).join(' ') || '—';
  const inScore = Object.keys(sh).filter((a) => Object.keys(SCORE_W[a] || {}).length);
  const levers = Object.entries(inp.statBonuses || {}).filter(([, v]) => v).map(([k, v]) => `${k}+${Math.round(100 * v)}%`).join(' ') || '—';
  let where;
  if (hasTag && inScore.length) where = 'очки: оси + наклон тега';
  else if (hasTag) where = 'очки: только наклон тега (оси мимо очков)';
  else if (inScore.length) where = 'очки: только оси';
  else where = 'в выбор намерения не входит (tempo/рычаги — только тело)';
  if (!hasTag && !inScore.length) chanCount['только тело (tempo или рычаги)']++;
  else if (!hasTag) chanCount['оси в очках намерений']++;
  else chanCount['тег']++;
  const maxMove = sm.max.it ? `${sm.max.it} ${sgn(sm.max.v, 3)}` : '0';
  const lean = leans.map((l) => `${l.tag}→${l.intention} [${l.when}] +${l.weight}`).join('; ') || '—';
  const d = c.decisions;
  const rec = { label: label(c.core, c.branch, c.idx), axes: axesList, levers, tag: lean, where, maxScoreMove: maxMove, maxScoreMoveAbs: Math.abs(sm.max.v), decisionsChanged: d.chgAll, tagTrue: d.tagTrue, tagFlip: d.tagFlip, win: c.win.delta, outcome: c.outcome };
  low6.push(rec);
  rows6.push([rec.label, axesList, levers, lean, where, maxMove, pct(d.chgAll, 1), d.tagTrue ? pct(d.tagTrue, 0) + ' / ' + pct(d.tagFlip, 1) : '—']);
}
out.low6 = low6;
P('## Пункт 6. 41 кристалл не меняет решения (изменено < 5% решений о выборе намерения)');
P('');
P(`Из перезамера (часть A, 60 ячеек): решений меняют < 5% — **${cellsLow.length}** ячеек (ожидалось 41). Распределение по единственному входному каналу: ${Object.entries(chanCount).map(([k, v]) => `${k}: ${v}`).join('; ')}.`);
P('');
P('Очки намерений (`spinalScore`) читают 7 осей из 8 — **`tempo` не читается вовсе**; сдвиг на Δ пунктов двигает очки намерения на вес×Δ/100. Для сравнения: бонус удержания текущего намерения **0.08**; разрыв между лидером и вторым в рабочих решениях — см. пункт 6а ниже. Столбец «сдвиг очков» — наибольший по модулю сдвиг очков одного намерения от осей этого кристалла (после зажима).');
P('');
P(md(['кристалл', 'оси (факт после зажима)', 'рычаги силы', 'тег (наклон)', 'где участвует в выборе', 'сдвиг очков (макс.)', 'решений изменено', 'условие тега верно / переворот'], rows6));
P('');

// ════════ ПУНКТ 8. ШЕСТЬ ВЕРШИН ПОГЛОЩЕНЫ ════════
const verts = B.filter((c) => c.idx === 5);
const absorbedVerts = verts.filter((c) => c.absorbed);
const rows8 = [];
const out8 = [];
for (const c of absorbedVerts) {
  const { core, branch: b } = c;
  const faces = CRYSTALS[core].find((x) => x.id === b).faces;
  const vf = faces[4];
  // оси: полная грань vs грань без вершины
  const run = (skip) => { const x = { ...CORE_PROFILES[core] }; faces.forEach((f, i) => { if (i + 1 === skip) return; for (const s of f.shifts) x[s.axis] = clamp(x[s.axis] + s.delta); }); return x; };
  const full = run(0), wo = run(5);
  const axisLine = vf.shifts.length ? vf.shifts.map((s) => `${s.axis}${sgn(s.delta, 0)}: без него ${wo[s.axis]} → с ним ${full[s.axis]}${full[s.axis] === wo[s.axis] ? ' (упор)' : ''}`).join('; ') : '—';
  const axisAbsorbed = vf.shifts.length > 0 && vf.shifts.every((s) => full[s.axis] === wo[s.axis]);
  // теги: сравнить с остальными наклонами ветви и резонансом
  const tags = [...(vf.conditionals || []), ...(vf.effects || [])];
  const myLeans = tags.map((t) => TAG_LEANS[t]).filter(Boolean);
  const home = BRANCH_HOME[core][b];
  const sib = [];
  faces.slice(0, 4).forEach((f, i) => { for (const t of [...(f.conditionals || []), ...(f.effects || [])]) if (TAG_LEANS[t]) sib.push({ j: i + 1, tag: t, intent: TAG_LEANS[t][0], when: TAG_LEANS[t][1] }); });
  const tagLine = tags.length ? tags.map((t) => { const l = TAG_LEANS[t]; return `${t}→${l[0]} [${l[1]}] +${l[2] ? GR.vertexLean : GR.tagLean}`; }).join('; ') : '—';
  const sameIntent = myLeans.length ? sib.filter((s) => s.intent === myLeans[0][0]).map((s) => `${b}${s.j} ${s.tag} [${s.when}]`) : [];
  const homeHit = myLeans.length && (home[0] === myLeans[0][0] || home[1] === myLeans[0][0]);
  const levers = [vf.statBonus ? `${vf.statBonus.stat} +${Math.round(100 * vf.statBonus.pct)}%` : null, ...(vf.extraBonuses || []).map((e) => `${e.stat} +${Math.round(100 * e.pct)}%`)].filter(Boolean).join(', ') || '—';
  const solo = c.solo, br = c.inBranch;
  const soloBeh = solo.decisions.chgAll >= 0.05, brBeh = br.decisions.chgAll >= 0.05;
  const what = [];
  if (c.absorbed && solo.outcome && !br.outcome) what.push('ИСХОД');
  if (soloBeh && !brBeh) what.push('РЕШЕНИЯ');
  const cause = [];
  if (axisAbsorbed) cause.push('ось на упоре (итог оси не меняется)');
  if (myLeans.length && homeHit) cause.push(`тег дублирует резонанс ветви (дом ветви: ${home.filter(Boolean).join(' + ')}; +${GR.homeLean}/${GR.homeLeanMinor} «всегда» против +${GR.vertexLean} «по условию»)`);
  if (myLeans.length && !homeHit) cause.push(`резонанс ветви тянет к ДРУГОМУ намерению (дом: ${home.filter(Boolean).join(' + ')} «всегда» +${GR.homeLean}/${GR.homeLeanMinor}) и поднимает его над намерением тега (${myLeans[0][0]}); см. пункт 8 по очкам`);
  if (sameIntent.length) cause.push(`тег перекрыт соседним наклоном к тому же намерению: ${sameIntent.join(', ')}`);
  rows8.push([label(core, b, 5), what.join(' + ') || '—', `${sgn(solo.win.delta)} / ${pct(solo.decisions.chgAll, 1)}`, `${sgn(br.win.delta)} / ${pct(br.decisions.chgAll, 2)}`, axisLine, levers, tagLine, br.decisions.tagTrue ? `${pct(br.decisions.tagTrue, 0)} / ${pct(br.decisions.tagFlip, 2)}` : '—', cause.join('; ') || 'вход не поглощён ни осью, ни тегом: см. текст']);
  out8.push({ label: label(core, b, 5), what, soloShift: solo.win.delta, soloDec: solo.decisions.chgAll, branchShift: br.win.delta, branchDec: br.decisions.chgAll, axisAbsorbed, homeHit, sameIntent, cause });
}
out.absorbedVertices = out8;
P('## Пункт 8. Шесть вершин, поглощённых гранью');
P('');
P('«Поглощена» по правилу перезамера: вершина в одиночку меняет исход (или ≥ 5% решений), а внутри своей полной грани — нет. Колонка «что поглощено» — какая половина флага пропала. Разбор по каналам вершины: оси (есть ли упор в полной грани), рычаги силы (они складываются и не поглощаются), тег (наклон +0.2 «по условию» против наклонов резонанса +0.3/+0.15 «всегда» и теги соседей того же намерения).');
P('');
P(md(['вершина', 'что поглощено', 'в одиночку: сдвиг п.п. / решений', 'в грани: сдвиг п.п. / решений', 'оси', 'рычаги', 'тег (наклон)', 'в грани: условие верно / переворот', 'чем поглощена'], rows8));
P('');

// ════════ ПУНКТ 9. ПОЛНЫЕ ГРАНИ ════════
const rawDir = RM + 'raw/';
const rawJ = (n) => (existsSync(rawDir + n + '.json') ? readJson(rawDir + n + '.json') : null);
const rows9 = [];
const out9 = [];
for (const core of CORES) for (const b of BR) {
  const full = rawJ(`build-${core}-${b}-full`);
  const base = rawJ(`zero-${core}-b1`);
  if (!full || !base) continue;
  const foes = Object.keys(full.foes);
  const wT = foes.flatMap((f) => full.foes[f].w), wB = foes.flatMap((f) => base.foes[f].w);
  const secT = foes.flatMap((f) => full.foes[f].sec);
  const ps = pairedShift(wT, wB);
  const lo = ps.delta - 1.96 * ps.se, hi = ps.delta + 1.96 * ps.se;
  const o = { core, b, name: CRYSTALS[core].find((x) => x.id === b).name, win: 100 * mean(wT), shift: ps.delta, lo, hi, medSec: median(secT), over100: secT.filter((x) => x > 100).length, maxSec: Math.max(...secT) };
  out9.push(o);
  rows9.push([CORE_NAME[core], `${BR_NAME[b]} (${o.name})`, f1(o.win), `${sgn(o.shift)} [${sgn(lo)}…${sgn(hi)}]`, f1(o.medSec), o.over100, f1(o.maxSec)]);
}
out.fullBranches = out9;
P('## Пункт 9. Полные грани (5 из 5) против голых четырёх ядер');
P('');
P('Пересчёт из сырых данных перезамера (`docs/crystal-remeasure/out/raw`, 800 боёв на грань, парный сдвиг к голому ядру на тех же зёрнах).');
P('');
P(md(['ядро', 'грань', 'доля побед, %', 'сдвиг к голому, п.п. [95%]', 'медиана, с', 'дольше 100 с', 'максимум, с'], rows9));
P('');

// ════════ ПУНКТ 5. 17 слабых ════════
const weak = A.filter((c) => c.cause && (c.cause.outcome === 'МАЛЫЙ ВЕС' || c.cause.behavior === 'МАЛЫЙ ВЕС'));
const deaf = A.filter((c) => c.cause && (c.cause.outcome === 'ГЛУХОЙ КАНАЛ' || c.cause.behavior === 'ГЛУХОЙ КАНАЛ'));
const flagsW = A.reduce((n, c) => n + (c.cause ? [c.cause.outcome, c.cause.behavior].filter((x) => x === 'МАЛЫЙ ВЕС').length : 0), 0);
const flagsD = A.reduce((n, c) => n + (c.cause ? [c.cause.outcome, c.cause.behavior].filter((x) => x === 'ГЛУХОЙ КАНАЛ').length : 0), 0);
const sumJson = readJson(RM + 'summary.json');
out.weak = { cells: weak.length, flags: flagsW, deafCells: deaf.length, deafFlags: flagsD, summaryPerFlag: sumJson.perFlag, summaryPerCell: sumJson.perCell };
P('## Пункт 5. 17 слабых кристаллов (при тройной силе эффект появляется)');
P('');
P(`Пересчёт по \`partA.json\` (поле \`cause\`): ячеек с причиной «МАЛЫЙ ВЕС» — **${weak.length}** (флагов ${flagsW}); ячеек с «ГЛУХОЙ КАНАЛ» — **${deaf.length}** (флагов ${flagsD}). Сводка перезамера: флагов МАЛЫЙ ВЕС ${sumJson.perFlag['МАЛЫЙ ВЕС']}, ГЛУХОЙ КАНАЛ ${sumJson.perFlag['ГЛУХОЙ КАНАЛ']}; ячеек только с одной причиной — ${sumJson.perCell['МАЛЫЙ ВЕС']} и ${sumJson.perCell['ГЛУХОЙ КАНАЛ']}, одна смешанная (${sumJson.perCell['смешанный']}). ${weak.length === sumJson.lists['МАЛЫЙ ВЕС'].length ? '**Суммы сошлись.**' : '**Суммы НЕ сошлись.**'}`);
P('');
const byCore = Object.fromEntries(CORES.map((c) => [c, weak.filter((x) => x.core === c).length]));
P('По ядрам: ' + CORES.map((c) => `${CORE_NAME[c]} ${byCore[c]}`).join(', ') + '.');
P('');
P(md(['кристалл', 'что не дотягивает', 'сдвиг ×1 → ×3, п.п.', 'что меняет'], weak.map((c) => [label(c.core, c.branch, c.idx), [c.cause.outcome === 'МАЛЫЙ ВЕС' ? 'ИСХОД' : null, c.cause.behavior === 'МАЛЫЙ ВЕС' ? 'ПОВЕДЕНИЕ' : null].filter(Boolean).join(' + '), `${sgn(c.win.delta)} → ${sgn(c.amp3.win.delta)}`, `${Object.entries(c.input.actualShifts || {}).map(([a, v]) => a + sgn(v, 0)).join(' ')} ${Object.entries(c.input.statBonuses || {}).filter(([, v]) => v).map(([k, v]) => k + '+' + Math.round(100 * v) + '%').join(' ')}`])));
P('');

writeFileSync(OUT + 'static.json', JSON.stringify(out, null, 1) + '\n');
writeFileSync(OUT + 'static.md', md_.join('\n') + '\n');
console.log(md_.join('\n'));
await H.server.close();
