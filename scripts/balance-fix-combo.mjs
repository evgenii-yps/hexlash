// balance-fix-combo.mjs — КЛИЧ + БАФФ СКЛАДЫВАЮТСЯ ПРЕДСКАЗУЕМО (TZ_balance_fix_v2, этап Е). Парные бои на одном зерне: без всего, только клич (t=5 с),
// только бафф (t=10 с), оба. Складывание: Δ(оба) против Δклич + Δбафф. Игрок — голое ядро, враги — четыре голых.
// ЗАПУСК: node scripts/balance-fix-combo.mjs <тег> [--seeds=1-200] [--cores=natisk]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';
import { makeActions } from './lib/bout-actions.mjs';
const args = process.argv.slice(2); const tag = args[0];
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const [from, to] = opt('seeds', '1-200').split('-').map(Number);
const CORES_ARG = opt('cores', '').split(',').filter(Boolean);
const OUT = new URL(`../docs/balance-fix/out/${tag}/`, import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const H = await openHarness(); const { duel, CORE_IDS, load } = H;
const klich = await load('/src/data/klichBalance.js'); const buff = await load('/src/data/buffBalance.js');
const { castKlich, makeBuffDriver } = makeActions(H, { klich, buff });
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const cores = CORES_ARG.length ? CORES_ARG : CORE_IDS;
function bout(core, foe, seed, k, b) {
  const drv = b ? makeBuffDriver({ side: 'player', kit: [b], rule: 'fixed', fixedAt: 10 }) : null; let fired = false;
  const r = duel({ seed, coreA: core, coreB: foe, swap: seed % 2 === 0, onStep: (now, alive) => {
    const me = alive.find((u) => u.sideId === 'player'); if (me && k && !fired && now >= 5) { castKlich(me.f, k); fired = true; }
    if (drv) drv.step(now, alive);
  } });
  return r.winner === 'player' ? 1 : 0;
}
const res = [];
for (const core of cores) {
  const keys = []; for (let s = from; s <= to; s++) for (const foe of CORE_IDS) keys.push([foe, s * 8 + CORE_IDS.indexOf(foe)]);
  const run = (k, b) => keys.map(([foe, seed]) => bout(core, foe, seed, k, b));
  const base = run(null, null); const dl = (w) => 100 * mean(w.map((x, i) => x - base[i]));
  const K = {}, Bf = {};
  for (const k of klich.KLICH_IDS) K[k] = dl(run(k, null));
  for (const b of buff.BUFF_IDS) Bf[b] = dl(run(null, b));
  for (const k of klich.KLICH_IDS) for (const b of buff.BUFF_IDS) {
    const joint = dl(run(k, b)); res.push({ core, k, b, dk: K[k], db: Bf[b], joint, sum: K[k] + Bf[b], diff: joint - (K[k] + Bf[b]) });
    console.error(core, k, b, joint.toFixed(1), (K[k] + Bf[b]).toFixed(1));
  }
}
writeFileSync(join(OUT, 'combo.json'), JSON.stringify(res));
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' }; const f1 = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const L = ['| ядро | клич | бафф | Δ клич | Δ бафф | сумма | вместе | вместе − сумма |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
for (const r of res) L.push(`| ${NAME[r.core]} | ${r.k} | ${r.b} | ${f1(r.dk)} | ${f1(r.db)} | ${f1(r.sum)} | ${f1(r.joint)} | ${f1(r.diff)} |`);
L.push('', `Среднее «вместе − сумма» по всем ячейкам: ${f1(mean(res.map((r) => r.diff)))} п.п.; среднее |разность|: ${mean(res.map((r) => Math.abs(r.diff))).toFixed(1)} п.п.`);
writeFileSync(join(OUT, 'combo.md'), L.join('\n')); console.log(L.join('\n'));
await H.server.close();
