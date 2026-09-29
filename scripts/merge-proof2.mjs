// merge-proof2.mjs — сводка TZ_tags_semantics_v2: частоты тегов до/после и ветки до/после.
// Вход: <old lean-hits.json> <new lean-hits.json> ; docs/grani-tags/out/{v1,v2}/proof2.json ; before/base.json.
// Выход: docs/grani-tags/TAGS_V2.md
import { readFileSync, writeFileSync } from 'node:fs';
import { openHarness } from './lib/bout-harness.mjs';
const [oldF, newF] = process.argv.slice(2);
const H = await openHarness(); const { load } = H;
const { CRYSTALS, CORES } = await load('/src/data/upgradeData.js');
const { TAG_LEANS, BRANCH_HOME } = await load('/src/data/branchThreshold.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const { CRYSTAL_TEXTS, FACET_NAMES } = await load('/src/data/crystalTexts.js');
const G = COMBAT_BALANCE.grani;
const rd = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const oldH = rd(oldF.startsWith('/') ? 'file://' + oldF : oldF), newH = rd(newF.startsWith('/') ? 'file://' + newF : newF);
const v1 = rd('../docs/grani-tags/out/v1/proof2.json'), v2 = rd('../docs/grani-tags/out/v2/proof2.json'), base = rd('../docs/grani-tags/out/before/base.json');
const NAME = Object.fromEntries(CORES.map((c) => [c.id, c.name]));
const INT = { press: 'PRESS', strike: 'STRIKE', sting: 'STING', hold: 'HOLD', break: 'BREAK', catch: 'CATCH' };
const WHEN = { always: 'всегда', close: 'враг в радиусе удара', far: 'враг далеко', foeOpen: 'враг открыт (восстановление/сбив)', foeSwing: 'враг замахивается или бил ≤1.5 с', charged: 'заряд ≥ 0.5', selfHpLow: `своё HP < ${G.selfHpLow * 100}%`, foeHpLow: `HP врага < ${G.foeHpLow * 100}%`, selfWindLow: `свои силы < ${G.selfWindLow * 100}%`, foeWindLow: `силы врага < ${G.foeWindLow * 100}%`, longFight: `бой дольше ${G.longFightSec} с`, foeQuiet: `враг не бил > ${G.foeQuietSec} с`, hpDropped: `своё HP упало ≥${G.hpDropFrac * 100}% за ${G.hpDropWindSec} с` };
const esc = (s) => String(s).replace(/\|/g, '\\|');
const md = (h, r) => ['| ' + h.join(' | ') + ' |', '| ' + h.map(() => '---').join(' | ') + ' |', ...r.map((x) => '| ' + x.map(esc).join(' | ') + ' |')].join('\n');
const pc = (o) => (o && o.evals ? (100 * o.on / o.evals).toFixed(1) : '—');
const pct = (x) => (100 * x).toFixed(1) + '%';
const pp = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const oldTags = (core, br, mode) => Object.entries(oldH[`${core}|${br}|${mode}`]).filter(([k]) => !k.startsWith('branch:'));
const rows = [];
for (const core of ['natisk', 'nalet', 'skala', 'zasada']) for (const br of CRYSTALS[core]) {
  let idx = 0;
  br.faces.forEach((f, i) => {
    for (const tag of [...f.conditionals, ...f.effects]) {
      const [intent, when, vertex] = TAG_LEANS[tag];
      const o0 = oldTags(core, br.id, 'vs_zero')[idx], o1 = oldTags(core, br.id, 'vs_same')[idx]; idx++;
      const oldKey = o0[0].split('|'); // tag|intent|when
      const n0 = newH[`${core}|${br.id}|vs_zero`][`${tag}|${intent}|${when}`], n1 = newH[`${core}|${br.id}|vs_same`][`${tag}|${intent}|${when}`];
      rows.push([tag + (oldKey[0] !== tag ? ` (было ${oldKey[0]})` : ''), `${INT[intent]} +${vertex ? G.vertexLean : G.tagLean}${vertex ? ' (вершина)' : ''}`, WHEN[when], NAME[core], `${br.id} ${FACET_NAMES[br.id]} · ${br.name}`, `${i + 1}${vertex ? ' ★' : ''}`, `${INT[oldKey[1]]} · ${WHEN[oldKey[2]] || oldKey[2]}`, `${pc(o0[1])} / ${pc(o1[1])}`, `${pc(n0)} / ${pc(n1)}`]);
    }
  });
}
// ветки
const brRows = [], bsum = { d3b: [], d3v1: [], d3v2: [], d5v1: [], d5v2: [], bits: [] };
const INTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const l1 = (a, b) => INTS.reduce((s, k) => s + Math.abs((a[k] || 0) - (b[k] || 0)), 0) * 50;
for (const r2 of v2.json) {
  const r1 = v1.json.find((x) => x.core === r2.core && x.branch === r2.branch), bs = base.find((x) => x.core === r2.core && x.branch === r2.branch);
  const d3b = bs.wrA - bs.wrB, d3v1 = r1.wrA3 - r1.wrB3, d3v2 = r2.wrA3 - r2.wrB3, d5v1 = r1.wrA5 - r1.wrB5, d5v2 = r2.wrA5 - r2.wrB5;
  const bits3 = r2.sigsA3.reduce((n, x, i) => n + (x !== r1.sigsA3[i] ? 1 : 0), 0), bits5 = r2.sigsA5.reduce((n, x, i) => n + (x !== r1.sigsA5[i] ? 1 : 0), 0);
  bsum.d3b.push(d3b); bsum.d3v1.push(d3v1); bsum.d3v2.push(d3v2); bsum.d5v1.push(d5v1); bsum.d5v2.push(d5v2); bsum.bits.push([bits3, bits5]);
  brRows.push([NAME[r2.core], `${r2.branch} ${FACET_NAMES[r2.branch]}`, `${pp(d3b)} → ${pp(d3v1)} → ${pp(d3v2)}`, `${bs.h2h.toFixed(0)}% → ${r1.h2h3.toFixed(0)}% → ${r2.h2h3.toFixed(0)}%`, `${l1(bs.shareA, bs.shareB).toFixed(1)} → ${r1.div3.toFixed(1)} → ${r2.div3.toFixed(1)}`, `${pp(d5v1)} → ${pp(d5v2)}`, `${r1.h2h5.toFixed(0)}% → ${r2.h2h5.toFixed(0)}%`, `${r1.div5.toFixed(1)} → ${r2.div5.toFixed(1)}`, `${bits3} / ${bits5}`]);
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const c = (o) => [pct(o.far), pct(o.free), o.speed.toFixed(2), o.med.toFixed(1), o.max.toFixed(1), String(o.capped), String(o.over100), String(o.n)];
const text = `# Теги v2 — таблицы доказательства (TZ_tags_semantics_v2)

Словарь: ГРАНЬ = ветка (в коде \`crystal\`, a/b/c = BODY/MIND/WILL), КРИСТАЛЛ = шаг ветки (в коде \`face\`, 1…5; ★ = вершина). 200 зёрен, прогрев, стороны чередуются. Числа черновые.

## 1. Теги: наклон → условие → частота срабатывания «до / после» (два режима)
Частота — доля решений о выборе намерения, где условие истинно, при полной ветке из 5 кристаллов. Формат «против ядра без кристаллов / против такой же сборки». «До» = SVERKA (main = 1ea3cef9).

${md(['тег', 'наклон', 'условие ПОСЛЕ', 'ядро', 'ветка (грань)', 'шаг (кристалл)', 'было: наклон · условие', 'частота ДО', 'частота ПОСЛЕ'], rows)}

## 2. Ветки: сдвиг винрейта и расхождение намерений против россыпи
Стрелки: без наклонов → v1 (main) → v2 (эта работа). «Ветка против вразнобой» — Δ винрейта (ветка − россыпь, против ядра без кристаллов), п.п.; «встреча» — винрейт ветки против россыпи напрямую; «расхождение» — сдвиг доли намерений ветка/россыпь, п.п.
3 кристалла = шаги 1–3 ветки против 3 из разных веток. 5 кристаллов = вся ветка против глубины по кругу из трёх веток (2+2+1; без наклонов для 5 не считалось).
«Разошлось бит в бит v2 против v1» — боёв из 200, где набор «ветка» дерётся иначе, чем при v1 (3 / 5 кристаллов).

${md(['ядро', 'ветка', 'Δ винрейта, 3 кр.: без → v1 → v2', 'встреча, 3 кр.', 'расхождение намерений, 3 кр.', 'Δ винрейта, 5 кр.: v1 → v2', 'встреча, 5 кр.', 'расхождение намерений, 5 кр.', 'разошлось бит в бит v2/v1 (3 / 5 кр.)'], brRows)}

Средние по 12 веткам: Δ 3 кр. ${pp(mean(bsum.d3b))} → ${pp(mean(bsum.d3v1))} → ${pp(mean(bsum.d3v2))}; Δ 5 кр. ${pp(mean(bsum.d5v1))} → ${pp(mean(bsum.d5v2))}; расхождение бит в бит (3 кр.) ${mean(bsum.bits.map((x) => x[0])).toFixed(0)}/200, (5 кр.) ${mean(bsum.bits.map((x) => x[1])).toFixed(0)}/200.

## 3. Контрольные на сборках (против ядра без кристаллов и встречи «ветка против россыпи»)
${md(['код · набор', 'вне радиуса 1.45', 'свободное время', 'скорость', 'медиана, с', 'максимум, с', 'таймаутов', 'дольше 100 с', 'боёв'], [['v1 · 3 кр.', ...c(v1.ctl.s3)], ['v2 · 3 кр.', ...c(v2.ctl.s3)], ['v1 · 5 кр.', ...c(v1.ctl.s5)], ['v2 · 5 кр.', ...c(v2.ctl.s5)]])}
`;
writeFileSync(new URL('../docs/grani-tags/TAGS_V2.md', import.meta.url), text);
console.log('written');
await H.server.close();
