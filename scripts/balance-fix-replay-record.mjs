// balance-fix-replay-record.mjs — ЗАПИСЬ РЕШЕНИЙ ДЛЯ «ЛАБОРАТОРИИ ПОВТОРА» (TZ_balance_fix_v2). Только в копии дерева с зондом (balance-fix-wt.py).
// Голое ядро (игрок) против голых четырёх ядер, зёрна seedFrom..seedTo, стороны чередуются: на каждом решении бойца-игрока (раз в ~1 с) пишет снимок входа
// chooseIntentionSpinal (оси, состояние, враг, память, бой) и выбранное намерение. Потом balance-fix-replay-lab.mjs гоняет через НАСТОЯЩУЮ функцию выбора любые
// наклоны и сдвиги осей — доля изменённых решений (цель Ц4/Ц5) считается за секунды, без боёв.
// ЗАПУСК (из копии): node scripts/balance-fix-replay-record.mjs <core> <seedFrom> <seedTo> <out.json>
import { writeFileSync } from 'node:fs';
import { openHarness } from './lib/bout-harness.mjs';
const [core, from, to, out] = process.argv.slice(2);
const H = await openHarness();
const { duel, CORE_IDS } = H;
const BF = (globalThis.__BF = { on: false, onDecision: () => {} });
const recs = [];
const r3 = (x) => (typeof x === 'number' ? Math.round(x * 1000) / 1000 : x);
BF.snap = (self, foe, memory, fight, act, kind) => {
  recs.push({
    self: { ax01: Object.fromEntries(Object.entries(self.ax01).map(([k, v]) => [k, r3(v)])), hp01: r3(self.hp01), stamina01: r3(self.stamina01), charge01: r3(self.charge01), range: r3(self.range), current: self.current, hpHist: (self.hpHist || []).map((h) => ({ t: r3(h.t), hp01: r3(h.hp01) })) },
    foe: { has: !!foe.has, dist: r3(foe.dist), inStrike: !!foe.inStrike, reacting: !!foe.reacting, phase: foe.phase, hp01: foe.hp01 == null ? null : r3(foe.hp01), stamina01: foe.stamina01 == null ? null : r3(foe.stamina01) },
    memory: memory.map((e) => ({ t: r3(e.t), type: e.type })),
    fight: { t: r3(fight.t), elapsed: r3(fight.elapsed || 0), escalation01: r3(fight.escalation01 || 0) },
    act, kind,
  });
};
for (const foe of CORE_IDS) for (let s = Number(from); s <= Number(to); s++) duel({ seed: s, coreA: core, coreB: foe, swap: s % 2 === 0 });
writeFileSync(out, JSON.stringify({ core, from, to, n: recs.length, recs }));
console.log('записано', recs.length, 'решений', core);
await H.server.close();
