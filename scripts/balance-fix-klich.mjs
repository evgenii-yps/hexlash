// balance-fix-klich.mjs — КЛИЧ: ВЛИЯНИЕ НА ИСХОД И НА МАНЕРУ (TZ_balance_fix_v2, Ц7). Парные бои на одном зерне: без клича и с кличем (push/fallback/hold),
// брошенным на бойца игрока в момент cast. Игрок — голое ядро (а также 'build' — полная ветвь a, если задано), враги — четыре голых ядра.
// Исход: сдвиг доли побед (95%). Манера (окно cast…cast+holdSec): средняя дистанция до врага, доля времени в атакующих клипах, доля решений внутри группы клича,
// доля боёв, где траектория отличается бит в бит (по средней дистанции в окне).
// ЗАПУСК: node scripts/balance-fix-klich.mjs <тег> [--seeds=1-200] [--cast=5] [--cores=natisk,nalet,skala,zasada]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';
import { makeActions } from './lib/bout-actions.mjs';

const args = process.argv.slice(2);
const tag = args[0];
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const [from, to] = opt('seeds', '1-200').split('-').map(Number);
const IDS = (opt('ids', '') || '').split(',').filter(Boolean);
const CAST = Number(opt('cast', '5'));
const CORES_ARG = opt('cores', '').split(',').filter(Boolean);
const OUT = new URL(`../docs/balance-fix/out/${tag}/`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const H = await openHarness();
const { duel, CORE_IDS, load } = H;
const klich = await load('/src/data/klichBalance.js');
const buff = await load('/src/data/buffBalance.js');
const { castKlich } = makeActions(H, { klich, buff });
const KB = klich.KLICH_BALANCE;
if (process.env.KB_OVERRIDE) { const o = JSON.parse(process.env.KB_OVERRIDE); for (const k of Object.keys(o)) { if (typeof o[k] === 'object') for (const j of Object.keys(o[k])) KB[k][j] = { ...(KB[k][j] || {}), ...o[k][j] }; else KB[k] = o[k]; } } // подбор чисел без правки файла
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const cores = CORES_ARG.length ? CORES_ARG : CORE_IDS;

function bout(core, foe, seed, id, gid = id) {
  const m = { n: 0, dist: 0, atk: 0, sw: 0, grp: 0, dec: 0, dealt: 0, taken: 0, it: [0, 0, 0, 0, 0, 0, 0] };
  let fh0 = null, mh0 = null;
  let fired = false, lastInt = null;
  const r = duel({ seed, coreA: core, coreB: foe, swap: seed % 2 === 0, onStep: (now, alive) => {
    const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
    const fo = alive.find((u) => u !== me); const f = me.f;
    if (id && !fired && now >= CAST) { castKlich(f, id); fired = true; }
    if (now >= CAST && now < CAST + KB.holdSec && fo) {
      m.n++; m.dist += f.group.position.distanceTo(fo.f.group.position);
      const c = f.getClipInfo(); if (c) m.atk++;
      if (c && c.impacts.length && c.elapsed <= H.INSTANT_DT * 1.5) m.sw++;
      if (fo) { const fh = fo.f.getHp(), mh = f.getHp(); if (fh0 != null && fh < fh0) m.dealt += fh0 - fh; if (mh0 != null && mh < mh0) m.taken += mh0 - mh; fh0 = fh; mh0 = mh; }
      const it = f.getIntention();
      if (it !== lastInt) { m.dec++; lastInt = it; }
      if (gid && KB.groups[gid].includes(it)) m.grp++;
      const ii = INTENTS.indexOf(it); if (ii >= 0) m.it[ii]++;
    }
  } });
  return { w: r.winner === 'player' ? 1 : 0, sec: r.sec, m };
}
const res = {};
for (const core of cores) {
  for (const id of klich.KLICH_IDS.filter((x) => !IDS.length || IDS.includes(x))) {
    const rows = [];
    for (let s = from; s <= to; s++) for (const foe of CORE_IDS) {
      const seed = s * 8 + CORE_IDS.indexOf(foe);
      const a = bout(core, foe, seed, null, id), b = bout(core, foe, seed, id, id);
      rows.push({ a, b });
    }
    const pool = (k) => { const t = [0, 0, 0, 0, 0, 0, 0]; for (const r of rows) r[k].m.it.forEach((v, i) => { t[i] += v; }); const n = t.reduce((a, b) => a + b, 0) || 1; return t.map((v) => v / n); };
    const pa = pool('a'), pb = pool('b'); const tv = 100 * 0.5 * pa.reduce((s, v, i) => s + Math.abs(v - pb[i]), 0);
    const d = rows.map((r) => r.b.w - r.a.w);
    const md = mean(d), sd = Math.sqrt(mean(d.map((x) => (x - md) ** 2)) / (d.length - 1));
    const win = (r, k) => r[k].w;
    const dist = (r) => (r.m.n ? r.m.dist / r.m.n : NaN);
    const atk = (r) => (r.m.n ? r.m.atk / r.m.n : NaN);
    const sw = (r) => r.m.sw; const dealt = (r) => r.m.dealt; const taken = (r) => r.m.taken;
    const grp = (r) => (r.m.n ? r.m.grp / r.m.n : NaN);
    const ok = rows.filter((r) => r.a.m.n > 20 && r.b.m.n > 20);
    res[`${core}|${id}`] = {
      core, id, n: rows.length,
      wrBare: 100 * mean(rows.map((r) => win(r, 'a'))), wrKlich: 100 * mean(rows.map((r) => win(r, 'b'))), delta: 100 * md, ciLo: 100 * (md - 1.96 * sd), ciHi: 100 * (md + 1.96 * sd),
      dDist: mean(ok.map((r) => dist(r.b) - dist(r.a))), dAtk: 100 * mean(ok.map((r) => atk(r.b) - atk(r.a))), dSw: mean(ok.map((r) => sw(r.b) - sw(r.a))), swBase: mean(ok.map((r) => sw(r.a))), dDealt: mean(ok.map((r) => dealt(r.b) - dealt(r.a))), dTaken: mean(ok.map((r) => taken(r.b) - taken(r.a))), dGrp: 100 * mean(ok.map((r) => grp(r.b) - grp(r.a))),
      tv, itA: pa.map((v) => Math.round(100 * v)), itB: pb.map((v) => Math.round(100 * v)),
      bitDiff: 100 * ok.filter((r) => Math.abs(dist(r.b) - dist(r.a)) > 1e-9).length / ok.length,
    };
    console.error(core, id, res[`${core}|${id}`].delta.toFixed(1));
  }
}
writeFileSync(join(OUT, 'klich.json'), JSON.stringify(res));
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const L = ['| ядро | клич | победы без/с, % | сдвиг п.п. [95%] | Δ дистанция | Δ замахов за окно (было) | Δ нанесено HP | Δ получено HP | Δ доля решений в группе клича, п.п. | сдвиг распределения намерений, п.п. (TV) | боёв с другой манерой, % |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
const f1 = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
for (const r of Object.values(res)) L.push(`| ${NAME[r.core]} | ${r.id} | ${r.wrBare.toFixed(1)} / ${r.wrKlich.toFixed(1)} | ${f1(r.delta)} [${f1(r.ciLo)}…${f1(r.ciHi)}] | ${f1(r.dDist)} | ${f1(r.dSw)} (${r.swBase.toFixed(1)}) | ${f1(r.dDealt)} | ${f1(r.dTaken)} | ${f1(r.dGrp)} | ${r.tv.toFixed(0)} | ${r.bitDiff.toFixed(0)} |`);
writeFileSync(join(OUT, 'klich.md'), L.join('\n'));
console.log(L.join('\n'));
await H.server.close();
