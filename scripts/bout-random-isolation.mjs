// bout-random-isolation.mjs — ДОКАЗАТЕЛЬСТВО «КАРТИНКА НЕ ДВИГАЕТ БОЙ» (на все виды боя).
//
// ЗАЧЕМ. Регрессии боя (fight-regression*.mjs) считают бой БЕЗ сцены: дыма легенды, тумана и прочей отрисовки в них
// нет. Пока боец и картинка брали числа из одного общего Math.random, любая правка вида арены молча сдвигала ход боя в
// игре — а регрессии этого не видели. Здесь «картинка» имитируется шумом: посторонний берёт числа из общего Math.random.
//
// КАК ПРОВЕРЯЕТ. Каждый бой считается чисто и с шумом, исход сверяется до последнего знака.
//   Шум 1 — МЕЖДУ ШАГАМИ боя (то, что делают частицы каждый кадр). Расхождений ДОЛЖНО БЫТЬ 0. Это и есть изоляция.
//   Шум 2 — ПЕРЕД СОЗДАНИЕМ бойцов. Исход МОЖЕТ поменяться и это не ошибка: боец, поле, обход преград и кубик берут
//           своё зерно один раз из общего потока в момент создания (бой в игре каждый раз разный именно поэтому).
//           Меняется зерно → меняется бой. После создания общий поток бой уже не затрагивает. Считается и печатается
//           отдельно, на код выхода не влияет.
// ВИДЫ БОЯ: голые дуэли · сборки · клич · баффы (TOWEL, BUCKET, DICE — случайный бросок и по граням) · RAID 4×3.
//
//   node scripts/bout-random-isolation.mjs        (код выхода 0 — шум между шагами не двигает ни один бой)
import { openHarness, seedRandom } from './lib/bout-harness.mjs';
import { makeActions } from './lib/bout-actions.mjs';

const H = await openHarness();
const { server, duel, CORE_IDS, load, resolveBehavior, runInstantBout, strike } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const klich = await load('/src/data/klichBalance.js');
const buff = await load('/src/data/buffBalance.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const { composeRaid, composeFoe } = await load('/src/data/foeCompose.js');
const { collapseSpawnPos } = await load('/src/data/collapseLayouts.js');
const { createRng } = await load('/src/scene/boutRandom.js');
const { castKlich, makeBuffDriver } = makeActions(H, { klich, buff });

const SEEDS = [1, 7, 12345];
const BETWEEN = [1, 3, 17];  // чисел за шаг боя (и ещё 0..2 сверху — разное по шагам)
const BEFORE = [5, 100];     // чисел до создания бойцов

/** Шум между шагами: n чисел за шаг, плюс 0..2 по кругу. */
const burner = (n) => { let k = 0; return () => { k += 1; for (let i = 0; i < n + (k % 3); i++) Math.random(); }; };
const burnNow = (n) => { for (let i = 0; i < n; i++) Math.random(); };
const fmt = (r) => `winner=${r.winner} sec=${r.sec.toFixed(4)} winHp=${r.winHp01.toFixed(6)}`;

// ── виды боя: каждый case принимает { between, before } и возвращает строку-исход ─────────────────────────────────
const kinds = [];
const kind = (name, cases) => kinds.push({ name, cases });

// 1. Голые дуэли.
{
  const cases = [];
  for (const seed of SEEDS) for (const a of CORE_IDS) for (const b of CORE_IDS) {
    cases.push(({ between, before }) => fmt(duel({ seed, coreA: a, coreB: b, swap: seed === 7, onStep: between ? burner(between) : null, preBurn: before })));
  }
  kind('голые дуэли', cases);
}

// 2. Сборки (как fight-regression-builds.mjs).
{
  const facet = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
  const build = (core, counts) => { const fs = []; for (const b of ['a', 'b', 'c']) for (let j = 1; j <= (counts[b] || 0); j++) fs.push(facet(core, b, j)); return fs; };
  const BUILDS = { s1: { a: 3, b: 2, c: 2 }, ba: { a: 5 }, xab: { a: 5, b: 2 } };
  const cases = [];
  for (const seed of SEEDS) for (const core of CORE_IDS) for (const counts of Object.values(BUILDS)) {
    cases.push(({ between, before }) => fmt(duel({ seed, coreA: core, coreB: core, behA: resolveBehavior(core, build(core, counts)), swap: seed === 7, onStep: between ? burner(between) : null, preBurn: before })));
  }
  kind('сборки', cases);
}

// 3. Клич (как fight-regression-klich.mjs).
{
  const cases = [];
  const plans = [...klich.KLICH_IDS.map((id) => [{ id, at: 5 }]), [{ id: 'push', at: 5 }, { id: 'fallback', at: 11 }]];
  for (const seed of SEEDS) for (const core of CORE_IDS) for (const plan of plans) {
    cases.push(({ between, before }) => {
      const left = plan.map((p) => ({ ...p, done: false })); const burn = between ? burner(between) : null;
      return fmt(duel({ seed, coreA: core, coreB: core, swap: seed === 7, preBurn: before, onStep: (now, alive) => {
        if (burn) burn();
        const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
        for (const p of left) if (!p.done && now >= p.at) { castKlich(me.f, p.id); p.done = true; }
      } }));
    });
  }
  kind('клич', cases);
}

// 4. Баффы. DICE — и по зафиксированным граням, и со СЛУЧАЙНЫМ броском (генератор броска засеян от зерна боя).
{
  const specs = [
    { label: 'towel', spec: { kit: ['towel'], rule: 'fixed', fixedAt: 10 } },
    { label: 'bucket', spec: { kit: ['bucket'], rule: 'fixed', fixedAt: 10 } },
    ...[1, 2, 3, 4, 5, 6].map((face) => ({ label: `dice#${face}`, spec: { kit: ['dice'], rule: 'fixed', fixedAt: 10, face } })),
    { label: 'dice-бросок', spec: { kit: ['dice'], rule: 'fixed', fixedAt: 10, roll: true } },
    { label: 'dice-бросок-2', spec: { kit: ['dice'], rule: 'fixed', fixedAt: 6, roll: true } },
    { label: 'набор-бот-бросок', spec: { kit: ['towel', 'bucket', 'dice'], rule: 'bot', roll: true } },
  ];
  const cases = [];
  for (const seed of SEEDS) for (const core of CORE_IDS) for (const { spec } of specs) {
    cases.push(({ between, before }) => {
      const { roll, ...rest } = spec;
      const drv = makeBuffDriver({ side: 'player', ...rest, rollRng: roll ? createRng(seed * 977 + core.length) : null });
      const burn = between ? burner(between) : null;
      const r = duel({ seed, coreA: core, coreB: core, swap: seed === 7, preBurn: before, onStep: (now, alive) => { if (burn) burn(); drv.step(now, alive); } });
      return `${fmt(r)} thrown=[${drv.log.map((x) => `${x.id}@${x.t}${x.face ? '#' + x.face : ''}`).join(',')}]`;
    });
  }
  kind('баффы (в т.ч. DICE)', cases);
}

// 5. RAID: игрок + 3 союзника против босса + 2 охраны (как в замере balance-recon.mjs, раздел raid).
// Состав собирается от СВОЕГО засеянного генератора — чтобы он был одинаков в обоих прогонах и не зависел от шума.
{
  const R = COMBAT_BALANCE.raid;
  const cases = [];
  for (const seed of [1, 2, 3, 4]) for (const lit of [0, 3]) {
    cases.push(({ between, before }) => {
      const rnd = createRng(seed * 131 + lit);
      const raid = composeRaid({ litCount: lit, rnd });
      const player = composeFoe({ litCount: lit, takenNames: [], rnd });
      const mk = (f, sideId, side, k, isSideA, extra = {}) => ({ sideId, coreId: f.coreId, behavior: f.behavior, side, pos: collapseSpawnPos(4, isSideA, k), ...extra });
      const specs = [
        mk(player, 'player', 'player', 0, true),
        ...raid.allies.map((f, k) => mk(f, 'player', 'player', k + 1, true)),
        mk(raid.boss, 'foe', 'opponent', 0, false, { isBoss: true }),
        ...raid.guards.map((f, k) => mk(f, 'foe', 'opponent', k + 1, false)),
      ];
      seedRandom(seed);
      burnNow(before);
      const r = runInstantBout(specs, { escalateStartSec: R.escalateStartSec, ...(between ? { onStep: burner(between) } : {}) });
      strike.clearAllDiceCharges();
      return `winner=${r.winner} sec=${r.sec.toFixed(4)} units=${r.units.map((u) => u.hp.toFixed(5)).join(',')}`;
    });
  }
  kind('RAID 4×3', cases);
}

// ── прогон ────────────────────────────────────────────────────────────────────────────────────────────────────────
let badBetween = 0;
const rows = [];
for (const { name, cases } of kinds) {
  let nBetween = 0, dBetween = 0, nBefore = 0, dBefore = 0; const shown = [];
  for (const run of cases) {
    const clean = run({ between: 0, before: 0 });
    for (const b of BETWEEN) {
      nBetween += 1;
      const noisy = run({ between: b, before: 0 });
      if (noisy !== clean) { dBetween += 1; if (shown.length < 3) shown.push(`РАСХОЖДЕНИЕ «${name}» шум между шагами=${b}\n   чисто:   ${clean}\n   с шумом: ${noisy}`); }
    }
    for (const b of BEFORE) {
      nBefore += 1;
      if (run({ between: 0, before: b }) !== clean) dBefore += 1;
    }
  }
  badBetween += dBetween;
  rows.push({ name, bouts: cases.length, nBetween, dBetween, nBefore, dBefore });
  for (const l of shown) console.log(l);
}

const pad = (v, w) => String(v).padEnd(w);
console.log('\n' + pad('вид боя', 24) + pad('боёв', 7) + pad('шум между шагами: прогонов / разошлись', 42) + 'шум перед созданием: прогонов / изменились');
for (const r of rows) console.log(pad(r.name, 24) + pad(r.bouts, 7) + pad(`${r.nBetween} / ${r.dBetween}`, 42) + `${r.nBefore} / ${r.dBefore}`);
console.log(`\nИТОГ: между шагами разошлись ${badBetween} — ${badBetween === 0 ? 'картинка бой не двигает ✅' : 'картинка ДВИГАЕТ бой ❌'}`);
console.log('Шум перед созданием меняет исход по замыслу: зерно бойца/поля/кубика берётся из общего потока один раз при создании.');
await server.close();
process.exit(badBetween === 0 ? 0 : 1);
