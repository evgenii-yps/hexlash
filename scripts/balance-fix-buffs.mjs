// balance-fix-buffs.mjs — БАФФЫ: ВЛИЯНИЕ НА ИСХОД (TZ_balance_fix_v2, Ц8). Парные бои на одном зерне: без баффа и с баффом (по одному предмету на бой,
// брошен в момент at на бойца игрока тем же драйвером, что в игре — scripts/lib/bout-actions.mjs). Игрок — голое ядро, враги — четыре голых ядра.
// Для кубика отдельно каждая грань (1…6), плюс набор из трёх предметов по правилу бота ('bot') и «все сразу» в момент at.
// ЗАПУСК: node scripts/balance-fix-buffs.mjs <тег> [--seeds=1-200] [--at=10] [--cores=..]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';
import { makeActions } from './lib/bout-actions.mjs';

const args = process.argv.slice(2);
const tag = args[0];
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const [from, to] = opt('seeds', '1-200').split('-').map(Number);
const AT = Number(opt('at', '10'));
const CORES_ARG = opt('cores', '').split(',').filter(Boolean);
const OUT = new URL(`../docs/balance-fix/out/${tag}/`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const H = await openHarness();
const { duel, CORE_IDS, load } = H;
const klich = await load('/src/data/klichBalance.js');
const buff = await load('/src/data/buffBalance.js');
const { makeBuffDriver } = makeActions(H, { klich, buff });
const BB = buff.BUFF_BALANCE;
if (process.env.BB_OVERRIDE) { const o = JSON.parse(process.env.BB_OVERRIDE); const deep = (t, u) => { for (const k of Object.keys(u)) { if (u[k] && typeof u[k] === 'object' && !Array.isArray(u[k])) deep(t[k] = t[k] || {}, u[k]); else t[k] = u[k]; } }; deep(BB, o); } // подбор чисел без правки файла
const ONLY = opt('only', '').split(',').filter(Boolean);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const cores = CORES_ARG.length ? CORES_ARG : CORE_IDS;
// варианты: id → { kit, rule, plan?, face? }
const VARIANTS = {
  towel: { kit: ['towel'], rule: 'fixed' },
  bucket: { kit: ['bucket'], rule: 'fixed' },
  dice: { kit: ['dice'], rule: 'fixed' },
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((f) => [`dice#${f}`, { kit: ['dice'], rule: 'fixed', face: f }])),
  'all-at-once': { kit: ['towel', 'bucket', 'dice'], rule: 'script', plan: [{ id: 'towel', at: AT }, { id: 'bucket', at: AT }, { id: 'dice', at: AT }] },
  'spread': { kit: ['towel', 'bucket', 'dice'], rule: 'script', plan: [{ id: 'bucket', at: AT }, { id: 'dice', at: AT + 8 }, { id: 'towel', at: AT + 16 }] },
  'bot-rule': { kit: ['towel', 'bucket', 'dice'], rule: 'bot' },
};
function bout(core, foe, seed, v) {
  const drv = v ? makeBuffDriver({ side: 'player', kit: v.kit, rule: v.rule, fixedAt: AT, plan: v.plan, face: v.face || null }) : null;
  const r = duel({ seed, coreA: core, coreB: foe, swap: seed % 2 === 0, onStep: (now, alive) => { if (drv) drv.step(now, alive); } });
  return r.winner === 'player' ? 1 : 0;
}
const res = {};
for (const core of cores) {
  const base = []; const keys = [];
  for (let s = from; s <= to; s++) for (const foe of CORE_IDS) { const seed = s * 8 + CORE_IDS.indexOf(foe); keys.push([foe, seed]); base.push(bout(core, foe, seed, null)); }
  for (const [name, v] of Object.entries(VARIANTS)) {
    if (ONLY.length && !ONLY.includes(name)) continue;
    const w = keys.map(([foe, seed]) => bout(core, foe, seed, v));
    const d = w.map((x, i) => x - base[i]); const md = mean(d); const sd = Math.sqrt(mean(d.map((x) => (x - md) ** 2)) / (d.length - 1));
    res[`${core}|${name}`] = { core, name, n: d.length, wrBare: 100 * mean(base), wrBuff: 100 * mean(w), delta: 100 * md, ciLo: 100 * (md - 1.96 * sd), ciHi: 100 * (md + 1.96 * sd) };
    console.error(core, name, (100 * md).toFixed(1));
  }
}
writeFileSync(join(OUT, 'buffs.json'), JSON.stringify(res));
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const f1 = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const L = ['| ядро | вариант | победы без/с, % | сдвиг п.п. [95%] |', '| --- | --- | --- | --- |'];
for (const r of Object.values(res)) L.push(`| ${NAME[r.core]} | ${r.name} | ${r.wrBare.toFixed(1)} / ${r.wrBuff.toFixed(1)} | ${f1(r.delta)} [${f1(r.ciLo)}…${f1(r.ciHi)}] |`);
// среднее по ядрам
const names = Object.keys(VARIANTS).filter((n) => !ONLY.length || ONLY.includes(n)); L.push('', '| вариант | среднее по ядрам, п.п. |', '| --- | --- |');
for (const n of names) L.push(`| ${n} | ${f1(mean(cores.map((c) => res[`${c}|${n}`].delta)))} |`);
writeFileSync(join(OUT, 'buffs.md'), L.join('\n'));
console.log(L.join('\n'));
await H.server.close();
