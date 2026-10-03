// promises-g2-table.mjs — свод признаков группы 2 (Long Combo, No Pause, Late Fire, Punish Reaction, Setup Combo): исход к голому ядру и признаки по ячейкам.
// ЗАПУСК: node scripts/promises-g2-table.mjs <папка с сырьём> <папка с bare> <начала половин, напр. 1,801>
import { readFileSync, readdirSync } from 'node:fs';
const DIR = process.argv[2];
const BARE = process.argv[3] || DIR;
const HALVES = (process.argv[4] || '1,801').split(',').map(Number);
const FOES = ['natisk', 'nalet', 'skala', 'zasada'];
const DT = 1 / 60;
const rd = (d, name, from) => JSON.parse(readFileSync(`${d}/${name}-s${from}.json`, 'utf8')).foes;
function agg(d, name, froms) { const A = {}; for (const f of froms) { const F = rd(d, name, f); for (const k of FOES) for (const [a, v] of Object.entries(F[k])) { if (Array.isArray(v)) { A[a] = A[a] || v.map(() => 0); v.forEach((x, i) => { A[a][i] += x; }); } else A[a] = (A[a] || 0) + v; } } return A; }
const m = (S) => ({
  win: 100 * S.w / S.bouts, sec: S.sec / S.bouts,
  launch10: 10 * S.launches / S.sec, first10: 10 * S.lFirst / S.secFirst, last10: 10 * S.lLast / S.secLast,
  lateRatio: (S.lLast / S.secLast) / (S.lFirst / S.secFirst),
  series: 100 * (S.lN[2] + S.lN[3]) / S.launches, reach10: 10 * S.reachLaunches / (S.reachSteps * DT),
  openResp: 100 * S.openResponded / S.openEntries,
  feint: S.feints / S.bouts, bait: 100 * S.baits / Math.max(1, S.feints), fpPer: S.fpN / S.bouts, fpBonus: 100 * S.fpBonus / Math.max(1, S.fpN), fpPen: S.fpPen / Math.max(1, S.fpN), nfpPen: S.nfpPen / Math.max(1, S.nfpN),
  hitNorm: 100 * S.sdNorm / S.contacts, dealt: S.foeDealt / S.bouts, taken: S.taken / S.bouts,
  far: 100 * S.far / S.steps, free: 100 * S.free / S.steps,
});
const cells = [...new Set(readdirSync(DIR).filter((f) => new RegExp(`-s${HALVES[0]}\\.json$`).test(f) && !f.includes('bare')).map((f) => f.replace(new RegExp(`-s${HALVES[0]}\\.json$`), '')))].sort();
const f1 = (x) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(1) : '—');
const f = (x, n = 2) => (Number.isFinite(x) ? x.toFixed(n) : '—');
console.log('| ячейка | исход к голому, п.п. | половины | серии % | в радиусе зап./10с | ответ на открытие % | зап./10с | 1-я/посл. треть | отношение | финтов/бой, клюнул % | расплат/бой | бонус расплаты % | пробой расплаты / обычного | вне радиуса / свободно % | длина боя с |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const c of cells) {
  const core = c.split('-')[0];
  const b = m(agg(BARE, `${core}-bare`, HALVES)), s = m(agg(DIR, c, HALVES));
  const h = HALVES.map((x) => f1(m(agg(DIR, c, [x])).win - m(agg(BARE, `${core}-bare`, [x])).win)).join(' / ');
  console.log(`| ${c} | **${f1(s.win - b.win)}** | ${h} | ${f(b.series, 1)}→${f(s.series, 1)} | ${f(b.reach10)}→${f(s.reach10)} | ${f(b.openResp, 1)}→${f(s.openResp, 1)} | ${f(b.launch10)}→${f(s.launch10)} | ${f(b.first10)}→${f(s.first10)} / ${f(b.last10)}→${f(s.last10)} | ${f(b.lateRatio)}→${f(s.lateRatio)} | ${f(b.feint)}→${f(s.feint)}, ${f(b.bait, 0)}→${f(s.bait, 0)} | ${f(b.fpPer)}→${f(s.fpPer)} | ${f(s.fpBonus, 0)} | ${f(s.fpPen)} / ${f(s.nfpPen)} | ${f(b.far, 1)}→${f(s.far, 1)} / ${f(b.free, 1)}→${f(s.free, 1)} | ${f(b.sec, 1)}→${f(s.sec, 1)} |`);
}
