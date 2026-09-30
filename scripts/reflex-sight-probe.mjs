// reflex-sight-probe.mjs — ЗОНД «РЕФЛЕКС ВИДИТ ХАРАКТЕР» (TZ_reflex_sees_character_v1/v2).
//
// ТРЕБУЕТ ПАТЧ `docs/reflex-sight/probe/intentions-probe.patch` (счётчик в chooseIntentionSpinal через
// globalThis.__PROBE). Патч НИКОГДА не коммитится в src/ — применять только в отдельной копии дерева.
//
// ЗАПУСК: SEEDS=200 LABEL=before SECTIONS=blind,foes node scripts/reflex-sight-probe.mjs
//   blind — 4 ядра × 10 сборок (голое, 3× «вразброс 7», 3× «ветка 5», 3× «5+2»), соперник — голое то же ядро.
//           Пишет по каждой (ядро, сборка): ветки решений и «сменилось бы без билда» (all / только оси / только наклоны),
//           доли намерений по времени, винрейт, подписи боёв.
//   foes  — голые ядра против ВСЕХ четырёх (16 пар): доля жёстких нужд по (своё ядро, враг). Разбор «44% у AMBUSH».
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHarness } from './lib/bout-harness.mjs';

const LABEL = process.env.LABEL || 'run';
const SEEDS = Number(process.env.SEEDS || 200);
const SECTIONS = new Set((process.env.SECTIONS || 'blind,foes').split(','));
const OUT = new URL(`../docs/reflex-sight/out/`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const { startProfile } = await load('/src/data/behavior.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
if (process.env.BEND != null && COMBAT_BALANCE.hardNeed) COMBAT_BALANCE.hardNeed.bend = Number(process.env.BEND); // читается при каждом решении
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const B3 = ['a', 'b', 'c'];
const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
const build = (core, counts) => { const fs = []; for (const b of B3) for (let j = 1; j <= (counts[b] || 0); j++) fs.push(facet(core, b, j)); return fs; };
const BUILDS = {
  bare: null,
  s1: { a: 3, b: 2, c: 2 }, s2: { a: 2, b: 3, c: 2 }, s3: { a: 2, b: 2, c: 3 },
  ba: { a: 5 }, bb: { b: 5 }, bc: { c: 5 },
  xab: { a: 5, b: 2 }, xbc: { b: 5, c: 2 }, xca: { c: 5, a: 2 },
};
const norm01 = (core) => Object.fromEntries(Object.entries(startProfile(core)).map(([k, v]) => [k, Math.max(0, Math.min(100, v)) / 100]));
globalThis.__PROBE = { on: true, mode: 'built', key: '', tab: {}, base01: null, log: null, byWho: false, profiles: Object.fromEntries(CORE_IDS.map((c) => [c, norm01(c)])) };
const P = globalThis.__PROBE;
const progress = (s) => process.stderr.write(s + '\n');
const sigOf = (r) => `${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}`;

function run(core, key, behT, foeCore = core, mode = 'built') {
  P.mode = mode; P.key = key; P.base01 = norm01(core);
  const intent = {}; let ticks = 0; const par = [{}, {}], parT = [0, 0]; const wins = []; const sigs = []; let secs = 0;
  for (let s = 1; s <= SEEDS; s++) {
    const r = duel({ seed: s, coreA: core, coreB: foeCore, behA: behT, behB: null, swap: s % 2 === 0, onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
      const it = me.f.getIntention(); intent[it] = (intent[it] || 0) + 1; ticks++; const q = s % 2; par[q][it] = (par[q][it] || 0) + 1; parT[q]++;
    } });
    wins.push(r.winner === 'player' ? 1 : 0); sigs.push(sigOf(r)); secs += r.sec;
  }
  return { tab: P.tab[key] || { total: 0, br: {} }, share: Object.fromEntries(INTENTS.map((k) => [k, (intent[k] || 0) / Math.max(1, ticks)])), shareOdd: Object.fromEntries(INTENTS.map((k) => [k, (par[1][k] || 0) / Math.max(1, parT[1])])), shareEven: Object.fromEntries(INTENTS.map((k) => [k, (par[0][k] || 0) / Math.max(1, parT[0])])), wr: 100 * wins.reduce((a, b) => a + b, 0) / SEEDS, sigs, meanSec: secs / SEEDS };
}

if (SECTIONS.has('blind')) {
  const out = {};
  for (const core of CORE_IDS) for (const [bid, counts] of Object.entries(BUILDS)) {
    const beh = counts ? resolveBehavior(core, build(core, counts)) : null;
    out[`${core}|${bid}`] = run(core, `${core}|${bid}`, beh, core, bid === 'bare' ? 'bare' : 'built');
    progress(`blind ${core} ${bid}`);
  }
  writeFileSync(OUT + `${LABEL}-blind.json`, JSON.stringify({ seeds: SEEDS, out }) + '\n');
}
if (SECTIONS.has('foes')) {
  const out = {};
  for (const a of CORE_IDS) for (const b of CORE_IDS) {
    // mode 'bare': считаются ОБА бойца; ключ по своему ядру не различит, поэтому считаем ключом пары и берём долю по каждому ядру отдельно ниже
    P.byWho = true;
    const r = run(a, `${a}|vs|${b}`, null, b, 'bare'); P.byWho = false;
    r.tabA = P.tab[`${a}|vs|${b}#${a}`] || { total: 0, br: {} }; // решения именно ЯДРА a
    out[`${a}|${b}`] = r;
    progress(`foes ${a} vs ${b}`);
  }
  writeFileSync(OUT + `${LABEL}-foes.json`, JSON.stringify({ seeds: SEEDS, out }) + '\n');
}
await H.server.close();
