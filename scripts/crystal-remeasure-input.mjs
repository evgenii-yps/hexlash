// crystal-remeasure-input.mjs — ВХОД КАЖДОГО КРИСТАЛЛА (часть A1 TZ_crystal_remeasure_v2). Статика + живой боец, без боёв.
//   запись в данных: сдвиги осей, рампа силы/прочности, добавочные бонусы, теги;
//   факт после зажима: ось до/после, «на упоре» (факт меньше записи);
//   живой боец: buildFighter().stats кристалл против голого ядра (то, что видно в показателях);
//   рычаги, которых нет в показателях (feintChance, dodgeCounter, …) — по имени, плюс «читает ли их хоть одно место в src/»;
//   тег: намерение · условие · вес (TAG_LEANS × combatBalance.grani);
//   ×3: какие оси при усилении упираются в зажим.
// Пишет docs/crystal-remeasure/out/input.json. Игровой код не меняет.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { openHarness } from './lib/bout-harness.mjs';

const OUT = new URL('../docs/crystal-remeasure/out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const H = await openHarness();
const { load, resolveBehavior, CORE_IDS } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const { startProfile, AXIS_IDS } = await load('/src/data/behavior.js');
const { TAG_LEANS } = await load('/src/data/branchThreshold.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const { FACET_NAMES, CRYSTAL_TEXTS } = await load('/src/data/crystalTexts.js');
const { buildFighter } = await load('/src/scene/buildFighter.js');
const G = COMBAT_BALANCE.grani;

function stats(core, beh) {
  const f = buildFighter('#FF0069', { coreId: core, behavior: beh, brain: 'spinal', portrait: [] });
  const s = { ...f.stats, maxHp: f.maxHp };
  try { f.dispose(); } catch (_) { /* тело уже разобрано */ }
  return s;
}

// Кто в src/ читает рычаг sb.<имя> (вне данных): число упоминаний `sb.имя` / `statBonuses.имя` в файлах боя.
const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { const p = d + '/' + n; if (statSync(p).isDirectory()) walk(p); else if (/\.(js|vue)$/.test(n)) files.push(p); } };
walk(new URL('../src', import.meta.url).pathname);
const readers = {};
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
for (const p of files) {
  if (/\/data\/(upgradeData|behavior)\.js$/.test(p)) continue;
  const txt = stripComments(readFileSync(p, 'utf8'));
  for (const m of txt.matchAll(/\bsb\.([A-Za-z]+)\b/g)) (readers[m[1]] = readers[m[1]] || new Set()).add(p.split('/src/')[1]);
}
const readersOut = Object.fromEntries(Object.entries(readers).map(([k, v]) => [k, [...v]]));

const cells = [];
for (const core of CORE_IDS) {
  const base = startProfile(core);
  const baseStats = stats(core, resolveBehavior(core));
  for (const br of ['a', 'b', 'c']) for (let i = 1; i <= 5; i++) {
    const face = CRYSTALS[core].find((x) => x.id === br).faces[i - 1];
    const beh = resolveBehavior(core, [face]);
    const axes = {};
    for (const k of AXIS_IDS) if (beh.axes[k] !== base[k]) axes[k] = beh.axes[k] - base[k];
    const recorded = {};
    for (const s of face.shifts || []) recorded[s.axis] = (recorded[s.axis] || 0) + s.delta;
    const onStop = Object.keys(recorded).filter((k) => Math.abs((axes[k] || 0)) < Math.abs(recorded[k]));
    // ×3
    const b3 = resolveBehavior(core, [{ ...face, shifts: (face.shifts || []).map((s) => ({ axis: s.axis, delta: s.delta * 3 })) }]);
    const clamp3 = Object.keys(recorded).filter((k) => b3.axes[k] === 0 || b3.axes[k] === 100).filter((k) => Math.abs(b3.axes[k] - base[k]) < Math.abs(recorded[k] * 3));
    // показатели живого бойца
    const st = stats(core, beh);
    const dStats = {};
    for (const k of Object.keys(st)) if (st[k] !== baseStats[k]) dStats[k] = { from: baseStats[k], to: st[k] };
    // рычаги
    const bonuses = {};
    for (const [k, v] of Object.entries(beh.statBonuses)) if (v) bonuses[k] = v;
    const invisible = Object.keys(bonuses).filter((k) => !(k in { strikePower: 1, toughness: 1, accuracy: 1, blockMitigation: 1, blockPenetration: 1, chargeMax: 1, chargeGain: 1, chargePower: 1, chargePen: 1 }));
    // оси ветви без этого кристалла (4 из 5): где стоят те оси, что он двигает — если на 0/100, внутри ветви его сдвиг съеден зажимом
    const others = CRYSTALS[core].find((x) => x.id === br).faces.filter((_, j) => j !== i - 1);
    const wb = resolveBehavior(core, others).axes;
    const branchAxesWithout = Object.fromEntries(Object.keys(recorded).map((k) => [k, wb[k]]));
    const tags = [...(face.conditionals || []), ...(face.effects || [])];
    const leans = tags.filter((t) => TAG_LEANS[t]).map((t) => ({ tag: t, intention: TAG_LEANS[t][0], when: TAG_LEANS[t][1], vertex: !!TAG_LEANS[t][2], weight: TAG_LEANS[t][2] ? G.vertexLean : G.tagLean }));
    cells.push({
      core, branch: br, idx: i, label: `${FACET_NAMES[br]}/${CRYSTAL_TEXTS[br][i - 1].name} (${br}${i})`, dataName: face.name,
      recordedShifts: recorded, actualShifts: axes, onStop, clampAt3: clamp3, branchAxesWithout,
      statBonuses: bonuses, invisibleLevers: invisible, dStats,
      tags, leans, deadTags: tags.filter((t) => !TAG_LEANS[t]),
      hasInput: Object.keys(axes).length > 0 || Object.keys(bonuses).length > 0 || leans.length > 0,
    });
  }
}
writeFileSync(OUT + 'input.json', JSON.stringify({ base: 'cad3c631', grani: G, readers: readersOut, cells }, null, 1) + '\n');
console.log(`ячеек: ${cells.length}; без входа: ${cells.filter((c) => !c.hasInput).length}`);
console.log('читатели рычагов sb.*:', Object.fromEntries(Object.entries(readersOut).map(([k, v]) => [k, v.length])));
await H.server.close();
