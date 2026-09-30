// seven-merge.mjs — сводка TZ_resonance_seven_v1: docs/grani-tags/out/seven/{before,after}/*.json + static.md + vertex-flip.json → SEVEN.md
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { openHarness, mean, quantile } from './lib/bout-harness.mjs';
const H = await openHarness(); const { load } = H;
const { CORES } = await load('/src/data/upgradeData.js');
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const { BRANCH_HOME } = await load('/src/data/branchThreshold.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const { FACET_NAMES } = await load('/src/data/crystalTexts.js');
const G = COMBAT_BALANCE.grani;
const D = new URL('../docs/grani-tags/out/seven/', import.meta.url);
const CORE_ORDER = ['natisk', 'nalet', 'skala', 'zasada'];
const NAME = Object.fromEntries(CORES.map((c) => [c.id, c.name]));
const BR = Object.fromEntries(CORE_ORDER.map((c) => [c, Object.fromEntries(CRYSTALS[c].map((b) => [b.id, b.name]))]));
const load1 = (dir) => CORE_ORDER.filter((c) => existsSync(new URL(`${dir}/${c}.json`, D))).map((c) => JSON.parse(readFileSync(new URL(`${dir}/${c}.json`, D), 'utf8')));
const after = load1('after'), before = load1('before');
const rowsOf = (arr) => arr.flatMap((j) => j.rows);
const A = rowsOf(after), B = rowsOf(before);
const PAT = { p331: '3+3+1', p43: '4+3', p52: '5+2', p511: '5+1+1', p322: '3+2+2 («россыпь из 7»)', p222: '2+2+2 (6, без резонанса)' };
const md = (h, r) => ['| ' + h.join(' | ') + ' |', '| ' + h.map(() => '---').join(' | ') + ' |', ...r.map((x) => '| ' + x.join(' | ') + ' |')].join('\n');
const pp = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const pct = (x) => (100 * x).toFixed(1) + '%';
const avg = (rs, f) => mean(rs.map(f));
const cell = (rs) => [pp(avg(rs, (r) => r.wr - r.wrA5)), pp(avg(rs, (r) => r.wr - r.wrS7)), avg(rs, (r) => r.h2hA5).toFixed(0) + '%', avg(rs, (r) => r.h2hS7).toFixed(0) + '%', avg(rs, (r) => r.divA5).toFixed(1), avg(rs, (r) => r.divS7).toFixed(1), pct(avg(rs, (r) => r.far)), pct(avg(rs, (r) => r.free)), avg(rs, (r) => r.med).toFixed(1), Math.max(...rs.map((r) => r.max)).toFixed(1), String(rs.reduce((n, r) => n + r.over100, 0))];
const head = ['узор', 'ядро', 'Δвинрейта набор−ветка из 5, п.п.', 'Δвинрейта набор−россыпь 7, п.п.', 'встреча: набор→ветка 5', 'встреча: набор→россыпь 7', 'расхождение намерений с веткой 5, п.п.', 'с россыпью 7, п.п.', 'вне радиуса', 'свободное', 'медиана, с', 'максимум, с', 'боёв >100 с'];
const T = [];
for (const pn of Object.keys(PAT)) for (const [tag, src] of [['до', B], ['после', A]]) {
  if (tag === 'до' && !['p331', 'p43'].includes(pn)) continue;
  const rows = src.filter((r) => r.pattern === pn); if (!rows.length) continue;
  T.push([`${PAT[pn]} — ${['p331', 'p43'].includes(pn) ? tag : 'после (=до)'}`, 'все ядра', ...cell(rows)]);
  for (const c of CORE_ORDER) { const rc = rows.filter((r) => r.core === c); if (rc.length) T.push(['', NAME[c], ...cell(rc)]); }
}
// сколько боёв разошлось до/после у двух-резонансных узоров
const bits = [];
for (const pn of ['p331', 'p43']) for (const c of CORE_ORDER) {
  const a = A.filter((r) => r.core === c && r.pattern === pn), b = B.filter((r) => r.core === c && r.pattern === pn);
  if (!a.length || !b.length) continue;
  let d = 0, n = 0; for (const ra of a) { const rb = b.find((x) => x.set === ra.set); if (!rb) continue; ra.sigs.forEach((s, i) => { n++; if (s !== rb.sigs[i]) d++; }); }
  bits.push([PAT[pn], NAME[c], `${d} из ${n}`, pct(d / n)]);
}
// пары: доля общего намерения до → после (p331)
const pairRows = [];
for (const c of CORE_ORDER) for (const ra of A.filter((r) => r.core === c && r.pattern === 'p331')) {
  const res = ra.resonance; if (res.length < 2) continue;
  const rb = B.find((x) => x.core === c && x.set === ra.set); if (!rb) continue;
  const [x, y] = res; const hx = BRANCH_HOME[c][x], hy = BRANCH_HOME[c][y];
  const shared = [...new Set([hx[0], hx[1], hy[0], hy[1]].filter(Boolean))].filter((k) => [hx[0], hx[1]].includes(k) && [hy[0], hy[1]].includes(k));
  const a5 = after.flatMap((j) => j.a5).find((z) => z.core === c && z.branch === ra.primary);
  for (const k of shared) pairRows.push([NAME[c], `${x} ${FACET_NAMES[x]} · ${BR[c][x]} + ${y} ${FACET_NAMES[y]} · ${BR[c][y]}`, k.toUpperCase(), pct(rb.share[k]), pct(ra.share[k]), pct(a5.share[k])]);
}
// контрольные на сборках из 7
const seven = A.filter((r) => r.pattern !== 'p222');
const ctl7 = (rs) => ({ far: avg(rs, (r) => r.far), free: avg(rs, (r) => r.free), speed: avg(rs, (r) => r.speed), med: quantile(rs.map((r) => r.med), 0.5), max: Math.max(...rs.map((r) => r.max)), capped: rs.reduce((n, r) => n + r.capped, 0), over100: rs.reduce((n, r) => n + r.over100, 0), n: rs.length });
const extOf = (arr, pats) => { const raw = { n: 0, sp: 0, far: 0, free: 0, secs: [], capped: 0 }; for (const j of arr) for (const [pn, r] of Object.entries(j.ctl.byPattern || {})) { if (pats && !pats.includes(pn)) continue; raw.n += r.n; raw.sp += r.sp; raw.far += r.far; raw.free += r.free; raw.secs.push(...r.secs); raw.capped += r.capped; } return raw.n ? { far: raw.far / raw.n, free: raw.free / raw.n, speed: raw.sp / raw.n, med: quantile(raw.secs, 0.5), max: Math.max(...raw.secs), capped: raw.capped, over100: raw.secs.filter((x) => x > 100).length, n: raw.secs.length } : null; };
const cRow = (n, o) => [n, pct(o.far), pct(o.free), o.speed.toFixed(2), o.med.toFixed(1), o.max.toFixed(1), String(o.capped), String(o.over100), String(o.n)];
const ctlRows = [cRow('7 кр. против ядра без кристаллов (21 набор × 4 ядра; медиана — по наборам)', ctl7(seven))];
const extRows = [];
for (const pn of Object.keys(PAT)) {
  const a = extOf(after, [pn]); if (!a) continue;
  if (['p331', 'p43'].includes(pn) && before.length) { const bb = extOf(before, [pn]); if (bb) extRows.push(cRow(`${PAT[pn]} — ДО`, bb)); extRows.push(cRow(`${PAT[pn]} — ПОСЛЕ`, a)); }
  else extRows.push(cRow(`${PAT[pn]}`, a));
}
extRows.push(cRow('ВСЕ узоры по 7 (без 2+2+2), встречи — ПОСЛЕ', extOf(after, ['p331', 'p43', 'p52', 'p511', 'p322'])));
if (before.length) { const bb = extOf(before, ['p331', 'p43']), aa = extOf(after, ['p331', 'p43']); ctlRows.push(cRow('только 3+3+1 и 4+3, встречи — ДО', bb), cRow('только 3+3+1 и 4+3, встречи — ПОСЛЕ', aa)); }
const vf = existsSync(new URL('vertex-flip.json', D)) ? JSON.parse(readFileSync(new URL('vertex-flip.json', D), 'utf8')) : [];
const FAM = { 'V+Y3+Z3': 'вершина одна + два чужих резонанса (1+3+3)', 'own345+Y3+1': 'своих 3,4,5 (резонанс) + чужой резонанс 3 + 1', 'own5+Y2': 'вся ветка 5 + 2 чужих (5+2)' };
const vfRows = vf.map((r) => [NAME[r.core], `${r.branch} ${FACET_NAMES[r.branch]} · ${BR[r.core][r.branch]}`, r.tag, FAM[r.family], r.resonance.split('').join('+') || '—', `${r.on}`, `${r.flip} (${r.on ? (100 * r.flip / r.on).toFixed(1) : '—'}%)`]);
const text = `# Резонансы при потолке 7 — таблицы (TZ_resonance_seven_v1)

Словарь: ГРАНЬ = ветка (в коде \`crystal\`, a/b/c = BODY/MIND/WILL), КРИСТАЛЛ = шаг ветки (в коде \`face\`, 1…5). Набор «X:n» = шаги 1…n ветки X. 200 зёрен, прогрев, стороны чередуются. Числа черновые: главное ${G.homeLean}, второстепенное ${G.homeLeanMinor}, второй резонанс ×${G.secondResonance}.

**Россыпи из 7 без резонанса не существует** (7 кристаллов по трём веткам ≥ 3 в одной), поэтому «россыпь из 7» = 3+2+2 (один резонанс); набор 2+2+2 (6 кристаллов) — единственный без резонанса. «Ветка из 5» — вся ветка одного ядра (steps 1–5), сравнивается с набором, у которого главная (глубже собранная, при равенстве — старшая по порядку) ветка та же.

## 1. Сравнение узоров с веткой из 5 и россыпью из 7 (до и после правила половины)
«До» = второй резонанс полностью (как было); «после» = ×${G.secondResonance}. Одно- и безрезонансные узоры до правила и после бит в бит одинаковы (доказано перебором в static.md), поэтому для них одна строка.
Δвинрейта — винрейт набора против ядра без кристаллов минус винрейт эталона; встреча — прямой бой набора с эталоном; расхождение намерений — сдвиг долей выбранных намерений, п.п.; вне радиуса, свободное, длина — по боям набора против ядра без кристаллов.

${md(head, T)}

### Сколько боёв поменялось от правила половины (узоры с двумя резонансами)
${md(['узор', 'ядро', 'боёв, не совпавших бит в бит', 'доля'], bits)}

### Пары, складывающие одно намерение: доля намерения в бою до → после (3+3+1 с двумя резонансами)
${md(['ядро', 'пара веток', 'намерение', 'доля ДО', 'доля ПОСЛЕ', 'доля у ветки из 5'], pairRows)}

## 2. Контрольные на сборках из 7 (новая база)
${md(['выборка', 'вне радиуса', 'свободное', 'скорость', 'медиана, с', 'максимум, с', 'таймаутов', 'дольше 100 с', 'боёв'], ctlRows)}

### Расширенная выборка по узорам (встречи набора с веткой из 5 и с россыпью 7)
${md(['узор', 'вне радиуса', 'свободное', 'скорость', 'медиана, с', 'максимум, с', 'таймаутов', 'дольше 100 с', 'боёв'], extRows)}

## 3. Вершины при семи кристаллах: как часто вершина реально меняет выбор
«Вершина включена» — тиков выбора, где условие наклона истинно; «изменила выбор» — тиков, где выбор намерения без этого наклона был бы другим (счётчик в инструментированной копии; в репозитории код не менялся).

${md(['ядро', 'ветка', 'вершина', 'набор', 'резонансы', 'включена', 'изменила выбор'], vfRows)}
`;
writeFileSync(new URL('../docs/grani-tags/SEVEN.md', import.meta.url), text);
console.log('ok', A.length, B.length);
await H.server.close();
