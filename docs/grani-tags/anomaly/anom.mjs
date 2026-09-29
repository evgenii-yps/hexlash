import { openHarness } from './lib/bout-harness.mjs';
import { writeFileSync } from 'node:fs';
const H = await openHarness(); const { duel, CORE_IDS, load } = H;
const { CORE_PROFILES } = await load('/src/data/behavior.js');
const SEEDS = 100;
const coreOf = (r) => CORE_IDS.find((c) => Math.abs(CORE_PROFILES[c].initiative / 100 - r.ini) < 1e-9 && Math.abs(CORE_PROFILES[c].distance / 100 - r.dist) < 1e-9);
const res = {};
for (const a of CORE_IDS) for (const b of CORE_IDS) {
  const st = {}; let bouts = 0, secs = 0;
  for (let s = 1; s <= SEEDS; s++) {
    globalThis.__sw = [];
    const r = duel({ seed: s, coreA: a, coreB: b, swap: s % 2 === 0 });
    bouts++; secs += r.sec;
    for (const e of globalThis.__sw) {
      const c = coreOf(e); if (c !== a) continue; // только решения «моего» бойца a
      const k = e.cur; const o = (st[k] ||= { n: 0, threat: 0, phSwing: 0, either: 0 });
      o.n++; if (e.threat) o.threat++; if (e.phSwing) o.phSwing++; if (e.threat || e.phSwing) o.either++;
    }
  }
  res[`${a}|${b}`] = { st, bouts, secs };
  process.stderr.write(`${a} vs ${b}\n`);
}
writeFileSync(process.argv[2], JSON.stringify(res));
await H.server.close();
