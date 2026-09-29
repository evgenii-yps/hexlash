import { openHarness } from './lib/bout-harness.mjs';
const H = await openHarness(); const { duel, CORE_IDS, load } = H;
const { CORE_PROFILES } = await load('/src/data/behavior.js');
const coreOf = (r) => CORE_IDS.find((c) => Math.abs(CORE_PROFILES[c].initiative / 100 - r.ini) < 1e-9 && Math.abs(CORE_PROFILES[c].distance / 100 - r.dist) < 1e-9);
const out = {};
for (const a of CORE_IDS) {
  const st = { ticks: 0, byNeed: {}, threatTicks: 0, threatScore: 0 };
  for (let s = 1; s <= 100; s++) {
    globalThis.__hn = [];
    duel({ seed: s, coreA: a, coreB: 'nalet', swap: s % 2 === 0 });   // враг — один и тот же (RAIDER), меняется только «свой»
    for (const e of globalThis.__hn) { if (coreOf(e) !== a) continue; st.ticks++; st.byNeed[e.hn] = (st.byNeed[e.hn] || 0) + 1; if (e.threat) { st.threatTicks++; if (e.hn === 'score') st.threatScore++; } }
  }
  out[a] = st;
}
for (const a of CORE_IDS) { const o = out[a]; console.log(a.padEnd(7), 'ticks', o.ticks, JSON.stringify(Object.fromEntries(Object.entries(o.byNeed).map(([k, v]) => [k, (100 * v / o.ticks).toFixed(1) + '%']))), '| тиков с угрозой', o.threatTicks, 'из них дошло до очков (лейнов)', o.threatScore); }
await H.server.close();
