// bot-facets-cap-recon.mjs — ЗАМЕР «ПОТОЛОК ЗАЖЖЁННЫХ КРИСТАЛЛОВ У БОТОВ» (ТЗ 30.09.2026).
//
// ЗАЧЕМ. Игроку потолок подняли с 5 до 7 (`RESOURCE`), ботам — `collapse.botFacetsMax` —
// остался 5. Здесь меряется, что меняется в бою, когда боту тоже 7. Ничего не
// балансируется: это замер «до» и «после» (ТЗ §2, §4).
//
// СЛОВАРЬ ТЗ: ГРАНЬ = ветка, КРИСТАЛЛ = шаг ветки. В коде наоборот; тут «кристаллов» —
// в смысле владельца (зажжённых шагов).
//
// ЧТО МЕРЯЕТСЯ. Дуэль 1×1 из настоящих точек выхода. Игрок — случайная сборка из T
// зажжённых кристаллов на каждом из четырёх ядер (T = 7 и T = 5: второе отделяет эффект
// лимита игрока от эффекта потолка ботов). Соперник собран НАСТОЯЩИМ сборщиком
// `buildBotSide` (тот же, что у COLLAPSE и HUNT): ядро случайное, число кристаллов
// тянется равновероятно из [botFacetsMin .. botFacetsMax] ИЗ КОНФИГА. Значит один и тот
// же скрипт прогоняется до и после правки числа — свой сборщик здесь не заведён.
//
// ⚠️ ОГРАНИЧЕНИЕ: дуэль 1×1, а турнир — команды на плите. Командной арифметики тут нет.
//
// ЗАПУСК: node scripts/bot-facets-cap-recon.mjs <метка>     SEEDS=400 по умолчанию
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHarness, seedRandom, mean, quantile } from './lib/bout-harness.mjs';

const LABEL = process.argv[2] || 'run';
const SEEDS = Number(process.env.SEEDS || 400);
const OUT = new URL('../docs/bot-facets-cap/out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load } = H;
const { buildTree, countLit } = await load('/src/data/upgradeTree.js');
const { randomLitIds } = await load('/src/data/foeCompose.js');
const { buildBotSide } = await load('/src/services/collapseRun.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const { CORES, RESOURCE } = await load('/src/data/upgradeData.js');
const NAME = Object.fromEntries(CORES.map((c) => [c.id, c.name]));
const CO = COMBAT_BALANCE.collapse;
const progress = (s) => process.stderr.write(s + '\n');

function playerBehavior(core, tier, seed) {
  seedRandom(seed * 7919 + tier);
  const tree = buildTree(core, randomLitIds(core, tier, Math.random));
  const lit = [];
  for (const cr of tree) for (const f of cr.faces) if (f.state === 'lit') lit.push(f);
  return { behavior: resolveBehavior(core, lit), lit: countLit(tree) };
}

const result = { label: LABEL, seeds: SEEDS, botFacetsMin: CO.botFacetsMin, botFacetsMax: CO.botFacetsMax, RESOURCE, sets: [] };
for (const tier of [7, 5]) {
  for (const core of CORE_IDS) {
    let wins = 0; let capped = 0; const secs = []; const byLit = {};
    for (let s = 1; s <= SEEDS; s++) {
      const me = playerBehavior(core, tier, s);
      seedRandom(s * 104729 + 13);
      const side = buildBotSide(1, 1, [], Math.random);
      const bot = side.roster[0];
      const r = duel({ seed: s, coreA: core, coreB: bot.coreId, behA: me.behavior, behB: bot.behavior, swap: s % 2 === 0 });
      const won = r.winner === 'player';
      if (won) wins += 1;
      if (r.capped) capped += 1;
      secs.push(r.sec);
      const b = (byLit[side.facets] = byLit[side.facets] || { n: 0, w: 0 });
      b.n += 1; if (won) b.w += 1;
      if (me.lit !== tier) throw new Error(`у игрока зажжено ${me.lit}, ждали ${tier}`);
    }
    result.sets.push({
      playerTier: tier, core, name: NAME[core], n: SEEDS, wins, winRate: wins / SEEDS,
      meanSec: mean(secs), medianSec: quantile(secs, 0.5), p90Sec: quantile(secs, 0.9), capped,
      byBotLit: Object.fromEntries(Object.entries(byLit).map(([k, v]) => [k, { n: v.n, winRate: v.w / v.n }])),
    });
    progress(`${LABEL} T=${tier} ${NAME[core]}: ${(100 * wins / SEEDS).toFixed(1)}%  ${mean(secs).toFixed(1)}с`);
  }
}
writeFileSync(OUT + `bot-cap-${LABEL}.json`, JSON.stringify(result, null, 2));
await H.server.close();
console.log(`готово: bot-cap-${LABEL}.json (botFacetsMax=${CO.botFacetsMax}, seeds=${SEEDS})`);
