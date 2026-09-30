// klich-reach-report.mjs — СВОД ПРИЁМКИ КЛИЧА (TZ_klich_v2 + решение по стоп-крану: свой вес у каждого клича) по сырым прогонам docs/klich-reach/out/raw/.
//   node scripts/klich-reach-report.mjs            — свип по кличам, выбор весов, таблицы на двух наборах зёрен, Г3/Г4, теги → out/*.md, out/summary.json
//   PICK_LABEL=final node scripts/klich-reach-report.mjs — метка прогона выбранных весов на зёрнах 201–400 (по умолчанию final)
// Г1: доля группы клича среди решений ПО ОЧКАМ в окне 5–13 с ≥ 60% (не падает, если без клича уже ≥ 60%); Г3: внутри группы доли одного намерения расходятся
// между какими-то двумя ядрами на ≥ 10 п.п.; Г4: медиана длины боёв с кличем ≤ 55 с, а сдвиг медианы допустим, если он в пределах парного 95% интервала;
// >100 с ≤ 0.1%, таймаутов 0.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const REPO = new URL('..', import.meta.url).pathname;
const OUT = REPO + 'docs/klich-reach/out/';
const CORES = ['natisk', 'nalet', 'skala', 'zasada'];
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const KL = ['push', 'fallback', 'hold'];
const KNAME = { push: 'PUSH', fallback: 'FALL BACK', hold: 'HOLD' };
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const GROUPS = { push: ['press', 'strike'], fallback: ['break', 'sting', 'breathe'], hold: ['hold', 'catch'] }; // как в data/klichBalance.js
const GRID = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9];
const CAP = { push: 0.5, fallback: 0.9, hold: 0.5 };
const THR = { reach: 0.60, spread: 10, median: 55, over100: 0.001 };
const PICK_LABEL = process.env.PICK_LABEL || 'final';

const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const pc = (x) => (Number.isFinite(x) ? (100 * x).toFixed(1) + '%' : '—');
const pp = (x) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(1) : '—');
const md = (head, rows) => { const l = (r) => '| ' + r.join(' | ') + ' |'; return [l(head), l(head.map(() => '---')), ...rows.map(l)].join('\n'); };
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
const median = (a) => { const s = [...a].sort((x, y) => x - y); const p = (s.length - 1) / 2; return (s[Math.floor(p)] + s[Math.ceil(p)]) / 2; };
const add7 = (a, b) => a.map((v, i) => v + b[i]);
const readRaw = (name) => { const p = OUT + `raw/${name}.json`; return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };

/** Суммы по четырём врагам для (файл ядра, клич). */
function pool(d, kl) {
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
const inside = (cS, kl) => { const tot = Math.max(1, inGroup(cS, kl)); return Object.fromEntries(GROUPS[kl].map((id) => [id, cS[INTENTS.indexOf(id)] / tot])); };

/** Все (ядро, клич) одного набора: getFile(core, kl) → распарсенный файл. */
function evalSet(getFile) {
  const out = { combos: {}, g1: {}, g3: {} };
  for (const kl of KL) {
    const dist = {}; let all = true;
    for (const core of CORES) {
      const d = getFile(core, kl); if (!d) return null;
      const c = pool(d, kl);
      const after = inGroup(c.k.cS, kl) / Math.max(1, c.k.nS), before = inGroup(c.b.cS, kl) / Math.max(1, c.b.nS);
      const pass = after >= THR.reach && (before < THR.reach || after >= before);
      const dw = c.k.w.map((x, i) => x - c.b.w[i]);
      out.combos[`${core}|${kl}`] = { core, kl, before, after, pass, nS: c.k.nS, needShare: c.k.nN / Math.max(1, c.k.nN + c.k.nS), changed: c.k.actDiff / Math.max(1, c.k.paired), inside: inside(c.k.cS, kl), insideBase: inside(c.b.cS, kl), win: { d: 100 * mean(dw), ci: 196 * sd(dw) / Math.sqrt(dw.length), k: mean(c.k.w), b: mean(c.b.w) }, secK: c.k.sec, secB: c.b.sec, capped: c.k.capped };
      if (!pass) all = false;
      dist[core] = inside(c.k.cS, kl);
    }
    out.g1[kl] = all;
    let best = 0, who = '';
    for (const id of GROUPS[kl]) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const dd = 100 * Math.abs(dist[CORES[i]][id] - dist[CORES[j]][id]); if (dd > best) { best = dd; who = `${id.toUpperCase()}: ${NAME[CORES[i]]} / ${NAME[CORES[j]]}`; } }
    out.g3[kl] = { spread: best, who, pass: best >= THR.spread };
  }
  return out;
}

// ── свип: по одному клику отдельно ──────────────────────────────────────────
const sweep = {};
for (const w of GRID) sweep[w] = evalSet((core) => readRaw(`w${w}-${core}`));
const perKlichRows = [];
const chosen = {};
const sweepMd = [];
for (const kl of KL) {
  const rows = [];
  for (const w of GRID) {
    const e = sweep[w]; if (!e) continue;
    const cap = w > CAP[kl];
    rows.push([String(w) + (cap ? ' (выше потолка — справка)' : ''), ...CORES.map((c) => { const x = e.combos[`${c}|${kl}`]; return `${pc(x.after)}${x.pass ? '' : ' ✗'}`; }), e.g1[kl] ? 'да' : 'нет', f1(e.g3[kl].spread)]);
    if (!cap && chosen[kl] == null && e.g1[kl]) chosen[kl] = w;
  }
  sweepMd.push(`### ${KNAME[kl]} (потолок ${CAP[kl]})\n\n` + md(['вес', ...CORES.map((c) => NAME[c]), 'Г1 у всех четырёх', 'Г3: макс. расхождение внутри группы, п.п.'], rows));
}
writeFileSync(OUT + 'sweep_perklich.md', 'Свип веса отдельно для каждого клича (окно 5–13 с, зёрна 1–200, 4 врага). В ячейке — доля намерений группы клича среди решений по очкам; ✗ — Г1 не выполнена для этого сочетания.\n\n' + sweepMd.join('\n\n') + '\n');
// Перепроверка на свежих зёрнах подняла вес: KLICH_W=push:0.45 — принудительно взять этот шаг (и метку прогона PICK_LABEL)
if (process.env.KLICH_W) for (const x of process.env.KLICH_W.split(',')) { const [k, v] = x.split(':'); chosen[k] = Number(v); }
console.log('выбранные веса:', chosen);

// ── выбранные веса: два набора зёрен ─────────────────────────────────────────
const fileSet1 = (core, kl) => readRaw(`w${chosen[kl]}-${core}`);
const fileSet2 = (core) => readRaw(`s201-pick-${PICK_LABEL}-${core}`);
const set1 = KL.every((k) => chosen[k] != null) ? evalSet(fileSet1) : null;
const set2 = set1 ? evalSet(fileSet2) : null;

// Г4: парный 95% интервал сдвига медианы (bootstrap по парам «бой с кличем / тот же бой без клича»)
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function g4(set, label) {
  // Кластерный bootstrap: единица — бой без клича (враг × зерно) вместе с его тремя парами с кличем; иначе одна и та же основа повторялась бы трижды и интервал выходил бы уже, чем есть.
  const per = {}; const all = []; let over = 0, capped = 0, n = 0;
  for (const core of CORES) {
    const cs = KL.map((kl) => set.combos[`${core}|${kl}`]);
    const U = cs[0].secB.length;
    const k = cs.flatMap((c) => c.secK), b = cs.flatMap((c) => c.secB);
    for (const c of cs) capped += c.capped;
    const R = rng(12345); const diffs = [];
    for (let it = 0; it < 1000; it++) { const ks = [], bs = []; for (let i = 0; i < U; i++) { const j = Math.floor(R() * U); for (const c of cs) { ks.push(c.secK[j]); bs.push(c.secB[j]); } } diffs.push(median(ks) - median(bs)); }
    diffs.sort((x, y) => x - y);
    const lo = diffs[25], hi = diffs[974];
    per[core] = { median: median(k), base: median(b), shift: median(k) - median(b), lo, hi, inCi: lo <= 0 && hi >= 0 };
    all.push(...k); over += k.filter((x) => x > 100).length; n += k.length;
  }
  const medOk = CORES.every((c) => per[c].median <= THR.median || per[c].inCi);
  return { label, n, median: median(all), over100: over, over100Share: over / n, capped, per, pass: medOk && over / n <= THR.over100 && capped === 0 };
}

const summary = { chosen, pickLabel: PICK_LABEL };
if (set1) {
  const tbl = (set, title, seeds) => {
    const t1 = [], t2 = [];
    for (const core of CORES) for (const kl of KL) {
      const c = set.combos[`${core}|${kl}`];
      const pick = (o) => GROUPS[kl].map((id) => `${id} ${pc(o[id])}`).join(', ');
      t1.push([NAME[core], KNAME[kl], String(chosen[kl]), pc(c.before), pc(c.after), c.pass ? 'да' : 'НЕТ', pick(c.inside), pc(c.needShare), pc(c.changed)]);
      t2.push([NAME[core], KNAME[kl], `${pp(c.win.d)} ± ${f1(c.win.ci)}`, pc(c.win.b), pc(c.win.k)]);
    }
    return `### ${title} (зёрна ${seeds})\n\n` + md(['ядро', 'клич', 'вес', 'группа без клича', 'группа с кличем', 'Г1 ≥ 60%', 'выбор внутри группы', 'решений съела жёсткая нужда', 'решений изменил клич'], t1) + '\n\n**Сдвиг доли побед от клича (парно к бою без клича, п.п. ± 95%)**\n\n' + md(['ядро', 'клич', 'сдвиг', 'доля побед без клича', 'доля побед с кличем'], t2);
  };
  const g3t = (set) => md(['клич', 'макс. расхождение внутри группы, п.п.', 'где', 'Г3'], KL.map((k) => [KNAME[k], f1(set.g3[k].spread), set.g3[k].who, set.g3[k].pass ? 'да' : 'НЕТ']));
  const insideT = (set) => { const rows = []; for (const kl of KL) for (const id of GROUPS[kl]) rows.push([KNAME[kl], id.toUpperCase(), ...CORES.map((c) => pc(set.combos[`${c}|${kl}`].inside[id]))]); return md(['клич', 'намерение', ...CORES.map((c) => NAME[c])], rows); };
  const g4a = g4(set1, 'зёрна 1–200'), g4b = set2 ? g4(set2, 'зёрна 201–400') : null;
  const g4t = (g) => md(['ядро', 'медиана без клича, с', 'медиана с кличем, с', 'сдвиг, с', '95% парный интервал сдвига', 'в интервале'], CORES.map((c) => [NAME[c], f1(g.per[c].base), f1(g.per[c].median), (g.per[c].shift >= 0 ? '+' : '') + g.per[c].shift.toFixed(2), `[${g.per[c].lo.toFixed(2)}; ${g.per[c].hi.toFixed(2)}]`, g.per[c].inCi ? 'да' : 'нет'])) + `\n\nВыборка ${g.n} боёв: медиана ${f1(g.median)} с, дольше 100 с — ${g.over100}, таймаутов ${g.capped} → Г4 ${g.pass ? 'выполнена' : 'НЕ выполнена'}.`;
  writeFileSync(OUT + 'final_set1.md', tbl(set1, 'Итоговые веса', '1–200') + '\n\n**Г3 (выбор внутри группы — доли по ядрам)**\n\n' + insideT(set1) + '\n\n' + g3t(set1) + '\n\n**Г4**\n\n' + g4t(g4a) + '\n');
  if (set2) writeFileSync(OUT + 'final_set2.md', tbl(set2, 'Итоговые веса, свежие зёрна', '201–400') + '\n\n**Г3 (выбор внутри группы — доли по ядрам)**\n\n' + insideT(set2) + '\n\n' + g3t(set2) + '\n\n**Г4**\n\n' + g4t(g4b) + '\n');
  if (set2) {
    const rows = [];
    for (const core of CORES) for (const kl of KL) {
      const a = set1.combos[`${core}|${kl}`], b = set2.combos[`${core}|${kl}`];
      const pick = (o) => GROUPS[kl].map((id) => `${id} ${pc(o[id])}`).join(', ');
      rows.push([NAME[core], KNAME[kl], String(chosen[kl]), pc(a.before), pc(a.after), pc(b.after), b.pass && a.pass ? 'да' : 'НЕТ', pick(a.inside), pick(b.inside), pc(a.needShare), `${pp(a.win.d)} ± ${f1(a.win.ci)}`, `${pp(b.win.d)} ± ${f1(b.win.ci)}`]);
    }
    writeFileSync(OUT + 'combined.md', md(['ядро', 'клич', 'вес', 'группа без клича (1–200)', 'группа с кличем, зёрна 1–200', 'группа с кличем, зёрна 201–400', 'Г1 на обоих', 'выбор внутри группы, 1–200', 'выбор внутри группы, 201–400', 'решений съела жёсткая нужда', 'сдвиг доли побед, 1–200 (п.п. ± 95%)', 'сдвиг доли побед, 201–400'], rows) + '\n');
  }
  summary.set1 = { g1: set1.g1, g3: set1.g3, g4: g4a }; if (set2) summary.set2 = { g1: set2.g1, g3: set2.g3, g4: g4b };
  summary.changed = {};
  for (const [nm, set] of [['set1', set1], ['set2', set2]]) if (set) summary.changed[nm] = Object.fromEntries(Object.entries(set.combos).map(([k, v]) => [k, v.changed]));
  // сравнение с прежними замерами: прежний стенд (враг — следующее ядро по кругу), зёрна 1–200
  const ring = (w) => Object.fromEntries(CORES.map((core, i) => { const foe = CORES[(i + 1) % 4]; const d = readRaw(`w${w(core)}-${core}`); let ch = 0, n = 0; for (const kl of KL) { const p = d.foes[foe].klich[kl]; ch += p.actDiff; n += p.paired; } return [core, ch / n]; }));
  summary.ring = { before: ring(() => 0) };
}
writeFileSync(OUT + 'summary.json', JSON.stringify(summary, null, 1) + '\n');
console.log(JSON.stringify(summary, (k, v) => (k === 'per' || k === 'secK' || k === 'secB' ? undefined : v)).slice(0, 1500));

// ── клич против наклонов граней (теги кристаллов + резонанс ветки) ───────────
{
  const rows = [], tot = { n: 0, A: 0, B: 0, C: 0, D: 0 }; const perKl = Object.fromEntries(KL.map((k) => [k, { n: 0, A: 0, B: 0, C: 0, D: 0 }]));
  let have = true;
  for (const core of CORES) {
    const d = readRaw(`tags-${core}`); if (!d) { have = false; continue; }
    for (const kl of KL) {
      const s = { n: 0, A: 0, B: 0, C: 0, D: 0 };
      for (const b of Object.values(d.builds)) for (const k of Object.keys(s)) s[k] += b[kl][k];
      for (const k of Object.keys(s)) { tot[k] += s[k]; perKl[kl][k] += s[k]; }
      rows.push([NAME[core], KNAME[kl], String(s.n), pc(s.A / s.n), pc(s.B / Math.max(1, s.A)), pc(s.B / s.n), pc(s.D / s.n)]);
    }
  }
  if (have) {
    for (const kl of KL) { const s = perKl[kl]; rows.push(['все ядра', KNAME[kl], String(s.n), pc(s.A / s.n), pc(s.B / Math.max(1, s.A)), pc(s.B / s.n), pc(s.D / s.n)]); }
    rows.push(['все ядра', 'все кличи', String(tot.n), pc(tot.A / tot.n), pc(tot.B / Math.max(1, tot.A)), pc(tot.B / tot.n), pc(tot.D / tot.n)]);
    writeFileSync(OUT + 'tags.md', 'Клич против наклонов граней. Боец игрока — ядро + сборка (три полные ветви a/b/c и «вразброс 7» 3+2+2), враги — четыре голых ядра, 200 зёрен, окно 5–13 с, итоговые веса клича. «Наклоны граней» = наклоны тегов кристаллов + резонанс ветки (то, что читает spinalScore через `leans`).\n' +
      '«Теги меняли выбор» — доля решений, где без клича наклоны граней отличали выбор от выбора без них. «Клич перевернул» — из этих решений те, где клич выбор изменил (то есть наклон тега был переиграл кличем). «Клич изменил решение» — общая доля решений окна, которые клич изменил.\n\n' +
      md(['ядро', 'клич', 'решений окна', 'теги меняли выбор', 'из них клич перевернул', 'от всех решений', 'клич изменил решение (все)'], rows) + '\n');
    summary.tags = { total: { ...tot, flipShare: tot.A / tot.n, overturnedOfFlips: tot.B / Math.max(1, tot.A) }, perKlich: Object.fromEntries(KL.map((k) => [k, { ...perKl[k], flipShare: perKl[k].A / perKl[k].n, overturnedOfFlips: perKl[k].B / Math.max(1, perKl[k].A) }])) };
    writeFileSync(OUT + 'summary.json', JSON.stringify(summary, null, 1) + '\n');
  }
}
