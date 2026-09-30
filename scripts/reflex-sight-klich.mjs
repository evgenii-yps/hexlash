// reflex-sight-klich.mjs — ЗОНД КЛИЧА (TZ_reflex_sees_character_v2, долг 2): доходит ли клич до выбора намерения.
// Парные бои на одном зерне: без клича и с кличем, брошенным на игрока при t ≥ 5 с (как в замере 26.09, scripts/motion-recon.mjs).
// Сравниваются РЕШЕНИЯ игрока в окне 5–13 с: что видел выбор (оси, range), и что он выбрал.
// ТРЕБУЕТ патч зонда (globalThis.__PROBE.log). ЗАПУСК: SEEDS=200 LABEL=x node scripts/reflex-sight-klich.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHarness } from './lib/bout-harness.mjs';

const LABEL = process.env.LABEL || 'run';
const SEEDS = Number(process.env.SEEDS || 200);
const OUT = new URL('../docs/reflex-sight/out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const H = await openHarness();
const { duel, CORE_IDS, load } = H;
const { KLICH_BALANCE, KLICH_IDS } = await load('/src/data/klichBalance.js');
const { startProfile } = await load('/src/data/behavior.js');
const norm01 = (core) => Object.fromEntries(Object.entries(startProfile(core)).map(([k, v]) => [k, Math.max(0, Math.min(100, v)) / 100]));
globalThis.__PROBE = { on: true, mode: 'x', key: 'k', tab: {}, base01: null, log: null, byWho: false, profiles: null };
const P = globalThis.__PROBE;
const AX = ['distance', 'initiative', 'tempo', 'weight', 'stick', 'resilience', 'counter', 'slip'];
const progress = (s) => process.stderr.write(s + '\n');

function bout(core, foe, seed, klich) {
  P.log = [];
  let fired = false;
  duel({ seed, coreA: core, coreB: foe, swap: seed % 2 === 0, onStep: (now, alive) => {
    if (klich && !fired && now >= 5) { const me = alive.find((u) => u.sideId === 'player'); if (me) { me.f.applyKlich(KLICH_BALANCE.axes[klich], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); fired = true; } }
  } });
  const mine = norm01(core);
  const same = (x) => AX.every((k) => Math.abs(x.ax[k] - mine[k]) < 1e-9);
  return P.log.filter(same); // решения игрока (профиль ядра узнаётся по осям; враг — другое ядро)
}

const out = {};
for (const core of CORE_IDS) {
  const foe = CORE_IDS[(CORE_IDS.indexOf(core) + 1) % CORE_IDS.length];
  for (const id of KLICH_IDS) {
    let n = 0, actDiff = 0, axDiff = 0, rangeDiff = 0, first = 0, firstAct = 0, firstRange = 0, dRangeSum = 0, dRangeMax = 0;
    for (let s = 1; s <= SEEDS; s++) {
      const base = bout(core, foe, s, null);
      const kl = bout(core, foe, s, id);
      const B = base.filter((d) => d.t > 5 && d.t <= 13), K = kl.filter((d) => d.t > 5 && d.t <= 13);
      const byT = new Map(B.map((d) => [d.t.toFixed(4), d]));
      let firstDone = false;
      for (const d of K) {
        const b = byT.get(d.t.toFixed(4)); if (!b) continue;
        n++;
        const ad = AX.some((k) => Math.abs(d.ax[k] - b.ax[k]) > 1e-12); if (ad) axDiff++;
        const rd = Math.abs(d.range - b.range) > 1e-12; if (rd) { rangeDiff++; dRangeSum += Math.abs(d.range - b.range); dRangeMax = Math.max(dRangeMax, Math.abs(d.range - b.range)); }
        if (d.act !== b.act) actDiff++;
        if (!firstDone) { firstDone = true; first++; if (d.act !== b.act) firstAct++; if (rd) firstRange++; }
      }
    }
    out[`${core}|${id}`] = { n, axDiff, rangeDiff, actDiff, meanDRange: rangeDiff ? dRangeSum / rangeDiff : 0, maxDRange: dRangeMax, first, firstAct, firstRange };
    progress(`klich ${core} ${id}`);
  }
}
writeFileSync(OUT + `${LABEL}-klich.json`, JSON.stringify({ seeds: SEEDS, out }, null, 1) + '\n');
await H.server.close();
