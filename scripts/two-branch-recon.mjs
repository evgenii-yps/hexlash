// two-branch-recon.mjs — ЗАМЕР «ДВЕ ВЕТКИ ДОСТИГЛИ ПОРОГА СРАЗУ» (ТЗ 30.09.2026, работа 2).
//
// ЗАЧЕМ. Механика веток (ветка `claude/grani-tags`, влита 29.09) включает резонанс
// ветки, когда в ней зажжено `combatBalance.grani.threshold` (3) кристаллов. При
// потолке 5 до порога можно было довести только ОДНУ ветку (3 + 2). При потолке 7
// впервые возможно 3 + 3 + 1 — две ветки сразу. Здесь замерено, что тогда бывает.
// Ничего не чинится и не балансируется: это разведка (ТЗ: «замером, не рассуждением»).
//
// СЛОВАРЬ ТЗ: ГРАНЬ = ветка (в коде CRYSTALS[core][i], id a/b/c),
//             КРИСТАЛЛ = шаг ветки (в коде branch.faces[j], 1..5).
//
// ЧТО МЕРЯЕТСЯ, ПО ПОРЯДКУ:
//   1. Статика. resolveLeans(набор 3+3+1) против суммы resolveLeans двух половинок:
//      складываются ли наклоны (оба резонанса присутствуют и ничего не перебивается).
//   2. Динамика. Доли намерений бойца за бой: набор «две ветки» против каждой ветки
//      отдельно и против него же с ВЫРЕЗАННЫМИ наклонами (leans: null) — чем именно
//      наклоны сдвигают выбор.
//   3. Устойчивость. Длительность боёв, таймауты, бои дольше 100 с, NaN в долях.
//
// ЗАПУСК: node scripts/two-branch-recon.mjs [метка]     SEEDS=100 по умолчанию
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHarness, mean, quantile } from './lib/bout-harness.mjs';

const LABEL = process.argv[2] || 'two-branch';
const SEEDS = Number(process.env.SEEDS || 100);
const OUT = new URL('../docs/grani-tags/out/' + LABEL + '/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load } = H;
const { CRYSTALS, CORES, RESOURCE } = await load('/src/data/upgradeData.js');
const { resolveLeans } = await load('/src/data/branchThreshold.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const NAME = Object.fromEntries(CORES.map((c) => [c.id, c.name]));
const BR = { a: 'BODY', b: 'MIND', c: 'WILL' };
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const pct = (x) => (Number.isFinite(x) ? (100 * x).toFixed(1) : '—');
const progress = (s) => process.stderr.write(s + '\n');
const md = (head, rows) => { const l = (r) => '| ' + r.join(' | ') + ' |'; return [l(head), l(head.map(() => '---')), ...rows.map(l)].join('\n'); };

const face = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const noLeans = (b) => ({ ...b, leans: null });

/** Бой набора против ядра без кристаллов: доли намерений, длительности. */
function run(core, beh) {
  const intent = {}; let ticks = 0; const secs = []; let capped = 0; let wins = 0;
  for (let s = 1; s <= SEEDS; s++) {
    const r = duel({ seed: s, coreA: core, coreB: core, behA: beh, behB: null, swap: s % 2 === 0, onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
      const it = me.f.getIntention(); intent[it] = (intent[it] || 0) + 1; ticks += 1;
    } });
    secs.push(r.sec); if (r.capped) capped += 1; if (r.winner === 'player') wins += 1;
  }
  const share = Object.fromEntries(INTENTS.map((k) => [k, (intent[k] || 0) / Math.max(1, ticks)]));
  return { share, secs, capped, wr: wins / SEEDS };
}
const l1 = (a, b) => INTENTS.reduce((s, k) => s + Math.abs((a[k] || 0) - (b[k] || 0)), 0) * 50; // п.п. смещённой доли

/** Суммарный вес наклонов по (намерение | условие) — для сверки «сумма половинок». */
function leanSig(leans) {
  const m = {};
  for (const l of leans) { const k = `${l.i}|${l.when}`; m[k] = +((m[k] || 0) + l.w).toFixed(6); }
  return m;
}
const sameSig = (x, y) => JSON.stringify(Object.entries(x).sort()) === JSON.stringify(Object.entries(y).sort());

// Два семейства наборов: «нижние» шаги 1–3 (теги 2–3, без вершины) и «верхние» шаги 3–5 (с вершиной).
const FAMILIES = { low: [1, 2, 3], high: [3, 4, 5] };
const PAIRS = [['a', 'b', 'c'], ['a', 'c', 'b'], ['b', 'c', 'a']]; // две ветки на пороге + одиночка из третьей

const rows = []; const stat = []; const json = [];
let allAdditive = true; let nanSeen = false;
for (const core of CORE_IDS) for (const [fam, steps] of Object.entries(FAMILIES)) for (const [x, y, z] of PAIRS) {
  const half = (b) => steps.map((j) => face(core, b, j));
  const single = [face(core, z, fam === 'low' ? 1 : 5)];
  const setX = half(x), setY = half(y);
  const both = [...setX, ...setY, ...single];
  if (both.length !== 7 || 7 > RESOURCE) throw new Error('набор не 3+3+1 или потолок ниже 7');

  // 1 · статика
  const rBoth = resolveLeans(core, both);
  const rX = resolveLeans(core, [...setX, ...single]);
  const rY = resolveLeans(core, [...setY]);
  const resKeys = Object.keys(rBoth.resonance).sort().join('+');
  const sumParts = leanSig([...rX.leans, ...rY.leans]);
  const additive = sameSig(leanSig(rBoth.leans), sumParts);
  allAdditive = allAdditive && additive && resKeys === [x, y].sort().join('+');

  // 2 · динамика
  const behBoth = resolveBehavior(core, both);
  const A = run(core, resolveBehavior(core, [...setX, ...single]));
  const B = run(core, resolveBehavior(core, setY));
  const AB = run(core, behBoth);
  const ABn = run(core, noLeans(behBoth));

  // 3 · устойчивость
  const secs = AB.secs;
  const bad = Object.values(AB.share).some((v) => !Number.isFinite(v));
  nanSeen = nanSeen || bad;
  const top = (s) => INTENTS.map((k) => [k, s[k]]).sort((p, q) => q[1] - p[1]).slice(0, 2).map(([k, v]) => `${k} ${pct(v)}`).join(', ');

  json.push({ core, fam, x, y, z, resonance: rBoth.resonance, additive, leans: rBoth.leans.length, share: { A: A.share, B: B.share, AB: AB.share, ABn: ABn.share }, wr: { A: A.wr, B: B.wr, AB: AB.wr, ABn: ABn.wr }, med: quantile(secs, 0.5), max: Math.max(...secs), capped: AB.capped, over100: secs.filter((s) => s > 100).length });
  rows.push([NAME[core], fam, `${x}${BR[x][0]} + ${y}${BR[y][0]} + ${z}${BR[z][0]}`, resKeys, additive ? 'да' : 'НЕТ',
    top(A.share), top(B.share), top(AB.share), top(ABn.share),
    l1(AB.share, ABn.share).toFixed(1), l1(AB.share, A.share).toFixed(1), l1(AB.share, B.share).toFixed(1)]);
  stat.push({ med: quantile(secs, 0.5), max: Math.max(...secs), capped: AB.capped, over100: secs.filter((s) => s > 100).length });
  progress(`${NAME[core]} ${fam} ${x}+${y}+${z}`);
}

const g = COMBAT_BALANCE.grani;
const text = [
  `Порог ветки: ${g.threshold} кристалла · homeLean ${g.homeLean} · homeLeanMinor ${g.homeLeanMinor} · tagLean ${g.tagLean} · vertexLean ${g.vertexLean} · потолок бойца ${RESOURCE}. Бой набора против ядра без кристаллов, ${SEEDS} зёрен на набор, стороны чередуются. Наборов: ${rows.length} (4 ядра × 2 семейства × 3 пары веток), всего ${rows.length * 4 * SEEDS} боёв.`,
  '',
  '**Столбцы:** «резонансы» — какие ветки включили резонанс · «сложились» — наклоны набора 3+3+1 равны сумме наклонов двух половинок · «топ-2 намерения» — две самые частые доли за бой у: одной ветки (X + одиночка) / другой (Y) / обеих / обеих с ВЫРЕЗАННЫМИ наклонами · «сдвиг от наклонов» — насколько наклоны обеих веток сдвинули распределение намерений против него же без наклонов, п.п. · «от X» / «от Y» — насколько набор из двух веток отличается от каждой одиночки, п.п.',
  '',
  md(['ядро', 'набор', 'ветки', 'резонансы', 'сложились', 'X: топ-2', 'Y: топ-2', 'обе: топ-2', 'обе без наклонов: топ-2', 'сдвиг от наклонов', 'от X', 'от Y'], rows),
  '',
  `**Складываются ли наклоны:** ${allAdditive ? 'да, во всех наборах — оба резонанса на месте, ничего не перебито и не потеряно' : 'НЕТ, есть наборы, где не сходится (см. «сложились»)'}.`,
  `**Устойчивость (набор «обе ветки», ${rows.length * SEEDS} боёв):** медиана длительности ${quantile(stat.map((s) => s.med), 0.5).toFixed(1)} с · максимум ${Math.max(...stat.map((s) => s.max)).toFixed(1)} с · таймаутов ${stat.reduce((n, s) => n + s.capped, 0)} · боёв дольше 100 с: ${stat.reduce((n, s) => n + s.over100, 0)} · NaN в долях намерений: ${nanSeen ? 'ЕСТЬ' : 'нет'}.`,
].join('\n');

writeFileSync(OUT + 'two-branch.md', text + '\n');
writeFileSync(OUT + 'two-branch.json', JSON.stringify({ SEEDS, RESOURCE, grani: g, json }, null, 1) + '\n');
console.log(text);
await H.server.close();
