// seven-static.mjs — СТАТИЧЕСКИЕ ПРОВЕРКИ TZ_resonance_seven_v1 (без боёв): третий резонанс, пары веток,
// неизменность наборов из 3 и 5 кристаллов, вершины при семи. Вывод — markdown в stdout.
import { openHarness } from './lib/bout-harness.mjs';
const H = await openHarness(); const { load } = H;
const { CRYSTALS, CORES } = await load('/src/data/upgradeData.js');
const { TAG_LEANS, BRANCH_HOME, resolveLeans } = await load('/src/data/branchThreshold.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const { FACET_NAMES } = await load('/src/data/crystalTexts.js');
const G = COMBAT_BALANCE.grani;
const NAME = Object.fromEntries(CORES.map((c) => [c.id, c.name]));
const CORE_ORDER = ['natisk', 'nalet', 'skala', 'zasada'];
const INT = { press: 'PRESS', strike: 'STRIKE', sting: 'STING', hold: 'HOLD', break: 'BREAK', catch: 'CATCH' };
const md = (h, r) => ['| ' + h.join(' | ') + ' |', '| ' + h.map(() => '---').join(' | ') + ' |', ...r.map((x) => '| ' + x.join(' | ') + ' |')].join('\n');
const combos = (arr, k) => k === 0 ? [[]] : arr.length < k ? [] : [...combos(arr.slice(1), k - 1).map((c) => [arr[0], ...c]), ...combos(arr.slice(1), k)];
const fmt = (x) => String(+x.toFixed(3));
const lines = [];

// 1. Третий резонанс
lines.push('## Третий резонанс при семи кристаллах');
const rowsR = [];
let maxRes = 0;
for (const core of CORE_ORDER) {
  const all = CRYSTALS[core].flatMap((br) => br.faces);
  const dist = {}; let sets = 0;
  for (const c of combos(all, 7)) { sets++; const n = Object.keys(resolveLeans(core, c).resonance).length; dist[n] = (dist[n] || 0) + 1; maxRes = Math.max(maxRes, n); }
  rowsR.push([NAME[core], String(sets), String(dist[0] || 0), String(dist[1] || 0), String(dist[2] || 0), String(dist[3] || 0)]);
}
lines.push(md(['ядро', 'всех наборов по 7 из 15', '0 резонансов', '1 резонанс', '2 резонанса', '3 резонанса'], rowsR));
lines.push(`\nМаксимум резонансов в наборе из 7: **${maxRes}**. Аргумент: порог ${G.threshold} × три ветки = ${G.threshold * 3} кристаллов > 7 → третий резонанс невозможен; перебор всех 6435 наборов на ядро это подтверждает. Более того, набора из 7 БЕЗ единого резонанса не бывает (2+2+2 = 6 < 7).`);

// 2. Неизменность 3 и 5
lines.push('\n## Наборы из 3 и 5 кристаллов не меняются от правила половины');
const rowsU = [];
for (const core of CORE_ORDER) {
  const all = CRYSTALS[core].flatMap((br) => br.faces);
  let same = 0, tot = 0; const save = G.secondResonance;
  for (const k of [3, 5]) for (const c of combos(all, k)) {
    G.secondResonance = 1; const a = JSON.stringify(resolveLeans(core, c).leans.slice().sort((x, y) => (x.tag + x.i).localeCompare(y.tag + y.i)));
    G.secondResonance = 0.5; const b = JSON.stringify(resolveLeans(core, c).leans.slice().sort((x, y) => (x.tag + x.i).localeCompare(y.tag + y.i)));
    tot++; if (a === b) same++;
  }
  G.secondResonance = save;
  rowsU.push([NAME[core], `${same} из ${tot}`]);
}
lines.push(md(['ядро', 'наборов с одинаковыми наклонами до и после'], rowsU));

// 3. Пары
lines.push('\n## Пары веток одного ядра, складывающие одно намерение');
lines.push('Величины: главное намерение резонанса ' + G.homeLean + ', второстепенное ' + G.homeLeanMinor + '. «До» — оба резонанса полностью; «после» — первый полностью, второй ×' + G.secondResonance + '. Первым считается ветка, собранная глубже; при равенстве — та, что выше по порядку (a, b, c). Ниже первая ветка пары — первая по порядку (при 3+3 она и есть первая); если глубже вторая (4+3 наоборот) — роли меняются, сумма считается тем же способом.');
const rowsP = [];
for (const core of CORE_ORDER) {
  const br = CRYSTALS[core];
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const X = br[i], Y = br[j]; const hx = BRANCH_HOME[core][X.id], hy = BRANCH_HOME[core][Y.id];
    const cx = {}, cy = {};
    cx[hx[0]] = G.homeLean; if (hx[1]) cx[hx[1]] = G.homeLeanMinor; cy[hy[0]] = G.homeLean; if (hy[1]) cy[hy[1]] = G.homeLeanMinor;
    for (const k of Object.keys(cx)) if (k in cy) {
      const before = cx[k] + cy[k], after = cx[k] + cy[k] * G.secondResonance, afterSw = cy[k] + cx[k] * G.secondResonance;
      const role = (h, k2) => (h[0] === k2 ? 'главное' : 'второстепенное');
      rowsP.push([NAME[core], `${X.id} ${FACET_NAMES[X.id]} · ${X.name} + ${Y.id} ${FACET_NAMES[Y.id]} · ${Y.name}`, INT[k], `${X.name}: ${role(hx, k)} ${cx[k]}; ${Y.name}: ${role(hy, k)} ${cy[k]}`, fmt(before), `${fmt(after)}${after !== afterSw ? ` (если ${Y.name} первая: ${fmt(afterSw)})` : ''}`]);
    }
  }
}
lines.push(md(['ядро', 'пара веток', 'общее намерение', 'вклады', 'сумма до', 'сумма после'], rowsP));
const pairs = new Set(rowsP.map((r) => r[0] + r[1]));
lines.push(`\nВсего пар веток со сложением: **${pairs.size}** из 12 (по 3 пары на ядро); строк в таблице ${rowsP.length}, потому что у пары может совпасть и главное, и второстепенное намерение. Пары без сложения: BULWARK BREAKER + VICE, AMBUSH TRAP + SHADOW.`);

// 4. Вершины
lines.push('\n## Вершины (шаг 5) при семи кристаллах: столкновение с резонансами');
const rowsV = [];
for (const core of CORE_ORDER) for (const br of CRYSTALS[core]) {
  const f = br.faces[4]; const tag = [...f.conditionals, ...f.effects][0]; const [it, when] = TAG_LEANS[tag];
  const own = BRANCH_HOME[core][br.id];
  const coll = [];
  if (own.includes(it)) coll.push(`своя ветка (${own.map((x) => INT[x]).join('/')})`);
  for (const o of CRYSTALS[core]) if (o.id !== br.id) { const h = BRANCH_HOME[core][o.id]; const hit = h.map((x, idx) => x === it ? `${INT[x]} ${idx === 0 ? 'главное' : 'второстепенное'}` : null).filter(Boolean); if (hit.length) coll.push(`${o.name} (${hit.join(', ')})`); }
  rowsV.push([NAME[core], `${br.id} ${FACET_NAMES[br.id]} · ${br.name}`, tag, `${INT[it]} · ${when}`, coll.length ? coll.join('; ') : '—']);
}
lines.push(md(['ядро', 'ветка', 'вершина', 'наклон · условие', 'то же намерение у резонанса'], rowsV));
console.log(lines.join('\n'));
await H.server.close();
