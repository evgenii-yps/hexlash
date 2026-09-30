// klich-reach-report.mjs — СВОД ПРИЁМКИ КЛИЧА (TZ_klich_v2 §5–6) по сырым прогонам docs/klich-reach/out/raw/.
//   node scripts/klich-reach-report.mjs            — таблицы по всем весам (out/sweep.md), выбор веса, таблицы выбранного (out/chosen.md), out/summary.json
//   WEIGHT=0.2 node scripts/klich-reach-report.mjs — таблицы для указанного веса
// Г1: доля группы клича среди решений ПО ОЧКАМ в окне ≥ 60% (не падает, если без клича уже ≥ 60%); Г3: внутри группы доли одного намерения расходятся
// между какими-то двумя ядрами на ≥ 10 п.п.; Г4: по всей выборке с кличем медиана ≤ 55 с (BULWARK — не выше своей без клича), >100 с ≤ 0.1%, таймаутов 0.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const REPO = new URL('..', import.meta.url).pathname;
const OUT = REPO + 'docs/klich-reach/out/';
const CORES = ['natisk', 'nalet', 'skala', 'zasada'];
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const KL = ['push', 'fallback', 'hold'];
const KNAME = { push: 'PUSH', fallback: 'FALL BACK', hold: 'HOLD' };
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const GROUPS = { push: ['press', 'strike'], fallback: ['break', 'sting', 'breathe'], hold: ['hold', 'catch'] }; // как в data/klichBalance.js (сверяется ниже)
const WEIGHTS = [0, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]; // выше 0.5 — только справка (ТЗ: значение в коде не выше 0.5)
const MAX_W = 0.5;
const THR = { reach: 0.60, spread: 10, median: 55, over100: 0.001 };

const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const pc = (x) => (Number.isFinite(x) ? (100 * x).toFixed(1) + '%' : '—');
const pp = (x) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(1) : '—');
const md = (head, rows) => { const l = (r) => '| ' + r.join(' | ') + ' |'; return [l(head), l(head.map(() => '---')), ...rows.map(l)].join('\n'); };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
const median = (a) => { const s = [...a].sort((x, y) => x - y); const p = (s.length - 1) / 2; return (s[Math.floor(p)] + s[Math.ceil(p)]) / 2; };

const load = (w, core) => { const p = OUT + `raw/w${w}-${core}.json`; return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
const add7 = (a, b) => a.map((v, i) => v + b[i]);

/** Сводка по (вес, ядро, клич): суммы по четырём врагам. */
function cell(w, core, kl) {
  const d = load(w, core); if (!d) return null;
  const k = { nS: 0, nN: 0, cS: [0, 0, 0, 0, 0, 0, 0], cN: [0, 0, 0, 0, 0, 0, 0], paired: 0, actDiff: 0, w: [], sec: [], capped: 0 };
  const b = { nS: 0, nN: 0, cS: [0, 0, 0, 0, 0, 0, 0], cN: [0, 0, 0, 0, 0, 0, 0], w: [], sec: [], capped: 0 };
  for (const foe of CORES) {
    const r = d.foes[foe], K = r.klich[kl], B = r.base;
    k.nS += K.nS; k.nN += K.nN; k.cS = add7(k.cS, K.cS); k.cN = add7(k.cN, K.cN); k.paired += K.paired; k.actDiff += K.actDiff; k.w.push(...K.w); k.sec.push(...K.sec); k.capped += K.capped;
    b.nS += B.nS; b.nN += B.nN; b.cS = add7(b.cS, B.cS); b.cN = add7(b.cN, B.cN); b.w.push(...B.w); b.sec.push(...B.sec); b.capped += B.capped;
  }
  return { k, b };
}
const inGroup = (cS, kl) => GROUPS[kl].reduce((s, id) => s + cS[INTENTS.indexOf(id)], 0);
const groupShare = (cS, nS, kl) => inGroup(cS, kl) / Math.max(1, nS);
/** Распределение внутри группы (доли намерений группы среди решений группы). */
const inside = (cS, kl) => { const tot = Math.max(1, inGroup(cS, kl)); return Object.fromEntries(GROUPS[kl].map((id) => [id, cS[INTENTS.indexOf(id)] / tot])); };

function evaluate(w) {
  const res = { w, combos: {}, g1: true, g3: {}, g3all: true, g4: null };
  for (const kl of KL) {
    const dist = {};
    for (const core of CORES) {
      const c = cell(w, core, kl); if (!c) return null;
      const after = groupShare(c.k.cS, c.k.nS, kl), before = groupShare(c.b.cS, c.b.nS, kl);
      const pass = after >= THR.reach && (before < THR.reach || after >= before);
      res.combos[`${core}|${kl}`] = { core, kl, before, after, pass, nS: c.k.nS, nN: c.k.nN, needShare: c.k.nN / (c.k.nN + c.k.nS), needShareBase: c.b.nN / (c.b.nN + c.b.nS), changed: c.k.actDiff / Math.max(1, c.k.paired), inside: inside(c.k.cS, kl), insideBase: inside(c.b.cS, kl), cS: c.k.cS };
      if (!pass) res.g1 = false;
      dist[core] = inside(c.k.cS, kl);
    }
    let best = 0, who = '';
    for (const id of GROUPS[kl]) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const d = 100 * Math.abs(dist[CORES[i]][id] - dist[CORES[j]][id]); if (d > best) { best = d; who = `${id}: ${NAME[CORES[i]]} vs ${NAME[CORES[j]]}`; } }
    res.g3[kl] = { spread: best, who, pass: best >= THR.spread };
    if (!res.g3[kl].pass) res.g3all = false;
  }
  // Г4: вся выборка с кличем
  const secs = [], perCore = {};
  let capped = 0;
  for (const core of CORES) { const s = []; for (const kl of KL) { const c = cell(w, core, kl); s.push(...c.k.sec); capped += c.k.capped; } secs.push(...s); const base = cell(w, core, 'push').b.sec; perCore[core] = { median: median(s), base: median(base) }; }
  const over = secs.filter((x) => x > 100).length;
  const medOk = CORES.every((c) => (c === 'skala' ? perCore[c].median <= Math.max(THR.median, perCore[c].base) + 1e-9 : perCore[c].median <= THR.median));
  res.g4 = { median: median(secs), over100: over, over100Share: over / secs.length, capped, perCore, n: secs.length, pass: medOk && over / secs.length <= THR.over100 && capped === 0 };
  return res;
}

const evals = WEIGHTS.map(evaluate).filter(Boolean);
const chosenW = process.env.WEIGHT ? Number(process.env.WEIGHT) : (evals.filter((e) => e.w > 0 && e.w <= MAX_W && e.g1 && e.g3all)[0] || {}).w;

// ── свип ─────────────────────────────────────────────────────────────────────
const sweepRows = evals.map((e) => [String(e.w), `${Object.values(e.combos).filter((c) => c.pass).length} / 12`, e.g1 ? 'да' : 'нет', KL.map((k) => `${KNAME[k]} ${f1(e.g3[k].spread)}`).join(' · '), e.g3all ? 'да' : 'нет', `${f1(e.g4.median)} / ${e.g4.over100} / ${e.g4.capped}`, e.g4.pass ? 'да' : 'нет']);
const sweepMd = md(['вес', 'Г1: сочетаний из 12', 'Г1', 'Г3: макс. расхождение внутри группы, п.п.', 'Г3', 'Г4: медиана с / >100 с / таймаутов', 'Г4'], sweepRows);
const worst = (e) => Object.values(e.combos).filter((c) => !c.pass).map((c) => `${NAME[c.core]} ${KNAME[c.kl]} ${pc(c.after)} (без клича ${pc(c.before)}, нужда ${pc(c.needShare)})`);
const sweepFail = evals.filter((e) => e.w > 0 && !e.g1).map((e) => `- вес ${e.w}: не слышат — ${worst(e).join('; ')}`).join('\n');
writeFileSync(OUT + 'sweep.md', `Свип веса наклона. Окно решений 5–13 с, 200 зёрен × 4 ядра × 4 врага × 3 клича на вес (вес 0 = прежнее поведение: только оси).\n\n${sweepMd}\n\n${sweepFail ? '**Где Г1 не выполнена:**\n' + sweepFail : ''}\n`);

// ── таблицы выбранного веса ──────────────────────────────────────────────────
let chosenMd = '';
const summary = { chosenWeight: chosenW, sweep: evals.map((e) => ({ w: e.w, g1: e.g1, g3: e.g3all, g4: e.g4.pass, combosPass: Object.values(e.combos).filter((c) => c.pass).length })) };
if (chosenW != null) {
  const e = evals.find((x) => x.w === chosenW), e0 = evals.find((x) => x.w === 0);
  const t1 = [];
  for (const core of CORES) for (const kl of KL) {
    const c = e.combos[`${core}|${kl}`], c0 = e0.combos[`${core}|${kl}`];
    const pick = (o) => GROUPS[kl].map((id) => `${id} ${pc(o.inside[id])}`).join(', ');
    t1.push([NAME[core], KNAME[kl], pc(c.before), pc(c0.after), pc(c.after), c.pass ? 'да' : 'НЕТ', pick(c), pick({ inside: c.insideBase }), pc(c.needShare), pc(c0.changed), pc(c.changed)]);
  }
  // сдвиг доли побед
  const t2 = [];
  for (const core of CORES) for (const kl of KL) {
    const c = cell(chosenW, core, kl), d = c.k.w.map((x, i) => x - c.b.w[i]);
    const m = mean(d) * 100, se = sd(d) / Math.sqrt(d.length) * 100;
    const c0 = cell(0, core, kl), d0 = c0.k.w.map((x, i) => x - c0.b.w[i]);
    t2.push([NAME[core], KNAME[kl], pp(mean(d0) * 100), `${pp(m)} ± ${f1(1.96 * se)}`, pc(c.b.w.reduce((a, b) => a + b, 0) / c.b.w.length), pc(c.k.w.reduce((a, b) => a + b, 0) / c.k.w.length)]);
    summary[`win|${core}|${kl}`] = { before: mean(d0) * 100, after: m, ci: 1.96 * se };
  }
  // общая доля изменённых решений (сравнение с 26.09 / 30.09)
  const tot = (w) => { let ch = 0, n = 0; for (const core of CORES) for (const kl of KL) { const c = cell(w, core, kl); ch += c.k.actDiff; n += c.k.paired; } return ch / n; };
  const perCore = (w) => Object.fromEntries(CORES.map((core) => { let ch = 0, n = 0; for (const kl of KL) { const c = cell(w, core, kl); ch += c.k.actDiff; n += c.k.paired; } return [core, ch / n]; }));
  summary.changedAll = { before: tot(0), after: tot(chosenW) }; summary.changedCore = { before: perCore(0), after: perCore(chosenW) };
  // прежний стенд (26.09 / 30.09): один враг — следующее ядро по кругу. Считаем тот же срез из новых данных, чтобы числа были сравнимы.
  const ring = (w) => Object.fromEntries(CORES.map((core, i) => { const foe = CORES[(i + 1) % 4]; const d = load(w, core); let ch = 0, n = 0; for (const kl of KL) { ch += d.foes[foe].klich[kl].actDiff; n += d.foes[foe].klich[kl].paired; } return [core, ch / n]; }));
  summary.ring = { before: ring(0), after: ring(chosenW) };
  const ringTot = (w) => mean(Object.values(ring(w)));
  const t3 = [['все решения окна (12 сочетаний), четыре врага', pc(tot(0)), pc(tot(chosenW)), '—'], ['то же на прежнем стенде (враг — следующее ядро по кругу)', pc(ringTot(0)), pc(ringTot(chosenW)), '10.7% (30.09)'], ...CORES.map((c) => [`${NAME[c]} (четыре врага)`, pc(summary.changedCore.before[c]), pc(summary.changedCore.after[c]), '—']), ...CORES.map((c) => [`${NAME[c]} (прежний стенд: враг — следующее ядро)`, pc(summary.ring.before[c]), pc(summary.ring.after[c]), c === 'natisk' ? '≈ 0 (30.09)' : c === 'zasada' ? '≤ 4% (30.09)' : c === 'nalet' ? 'ВПЕРЁД до 37% (30.09)' : '—'])];
  // Г3 подробно
  const t4 = [];
  for (const kl of KL) for (const id of GROUPS[kl]) t4.push([KNAME[kl], id.toUpperCase(), ...CORES.map((core) => pc(e.combos[`${core}|${kl}`].inside[id]))]);
  // Г4 подробно
  const t5 = CORES.map((c) => [NAME[c], f1(e.g4.perCore[c].base), f1(e.g4.perCore[c].median)]);
  chosenMd = [
    `### Г1 и таблица «ядро × клич», вес ${chosenW}`, '', `«До» — прежнее поведение (вес 0, только оси); «после» — вес ${chosenW}. Доля — намерений группы клича среди решений по очкам окна 5–13 с (пул по четырём врагам × 200 зёрен).`, '',
    md(['ядро', 'клич', 'группа без клича', 'группа с кличем ДО правки', `группа с кличем ПОСЛЕ (вес ${chosenW})`, 'Г1 ≥ 60%', 'внутри группы ПОСЛЕ', 'внутри группы без клича', 'решений съела жёсткая нужда (с кличем)', 'решений изменил клич ДО', 'решений изменил клич ПОСЛЕ'], t1), '',
    '### Г3. Как ядра исполняют клич — доли намерений внутри группы (решения по очкам)', '', md(['клич', 'намерение', ...CORES.map((c) => NAME[c])], t4), '',
    '### Сдвиг доли побед от каждого клича (парно к бою без клича, п.п.)', '', md(['ядро', 'клич', 'ДО правки', `ПОСЛЕ (вес ${chosenW}) ± 95%`, 'доля побед без клича', 'доля побед с кличем'], t2), '',
    '### Доля решений окна, где клич изменил выбор, и сравнение с прежними замерами', '', md(['срез', 'до правки (вес 0)', `после (вес ${chosenW})`, 'прежний замер'], t3), '',
    `### Г4. Длина боёв с кличем (вся выборка: ${e.g4.n} боёв)`, '', `Медиана ${f1(e.g4.median)} с; боёв дольше 100 с: ${e.g4.over100} (${(100 * e.g4.over100Share).toFixed(3)}%); таймаутов ${e.g4.capped}.`, '', md(['ядро', 'медиана без клича, с', 'медиана с кличем, с'], t5), '',
  ].join('\n');
  writeFileSync(OUT + `chosen_w${chosenW}.md`, chosenMd);
  summary.g4 = e.g4; summary.g1 = e.g1; summary.g3 = e.g3;
}
writeFileSync(OUT + 'summary.json', JSON.stringify(summary, null, 1) + '\n');
console.log(sweepMd); console.log('выбранный вес:', chosenW);
