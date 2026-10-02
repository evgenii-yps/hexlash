// promises-g1-table.mjs — свод стенда подбора группы 1: исход к голому ядру (п.п., две половины зёрен) и признаки по ячейкам папки.
// ЗАПУСК: node scripts/promises-g1-table.mjs <папка с сырьём> [папка с bare, по умолчанию та же]
import { readFileSync, readdirSync } from 'node:fs';
const DIR = process.argv[2];
const BARE = process.argv[3] || DIR;
const FOES = ['natisk', 'nalet', 'skala', 'zasada'];
const rd = (d, name, from) => JSON.parse(readFileSync(`${d}/${name}-s${from}.json`, 'utf8')).foes;
function agg(d, name, froms) { const A = {}; for (const f of froms) { const F = rd(d, name, f); for (const k of FOES) for (const [a, v] of Object.entries(F[k])) { if (Array.isArray(v)) { A[a] = A[a] || v.map(() => 0); v.forEach((x, i) => { A[a][i] += x; }); } else A[a] = (A[a] || 0) + v; } } return A; }
const DT = 1 / 60;
const m = (S) => ({ win: 100 * S.w / S.bouts, punch: 100 * S.punchSdNorm / S.punchN, hit: 100 * S.sdNorm / S.contacts, ripB: 100 * S.ripBonus / Math.max(1, S.ripN), ripSd: 100 * S.ripSd / Math.max(1, S.ripN), ripN: S.ripN / S.bouts, dodge: S.dodges / S.bouts, dealt: S.foeDealt / S.bouts, taken: S.taken / S.bouts, sting: 100 * S.it[2] / S.steps, catch: 100 * S.it[6] / S.steps, launch10: 10 * S.launches / S.sec, far: 100 * S.far / S.steps, free: 100 * S.free / S.steps, sec: S.sec / S.bouts, mobSteps: S.steps });
const cells = [...new Set(readdirSync(DIR).filter((f) => /-s1\.json$/.test(f) && !f.includes('bare')).map((f) => f.replace(/-s1\.json$/, '')))].sort();
const f1 = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
console.log('| ячейка | исход к голому, п.п. (800 зёрен × 4) | половины 1–400 / 401–800 | удар (прямой), % maxHP | ответ после уворота: бонус% / урон% | уворотов за бой | STING / CATCH % | запусков за 10 с | нанесено / получено HP |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const c of cells) {
  const core = c.split('-')[0];
  const b = m(agg(BARE, `${core}-bare`, [1, 401])), s = m(agg(DIR, c, [1, 401]));
  const h = [1, 401].map((x) => f1(m(agg(DIR, c, [x])).win - m(agg(BARE, `${core}-bare`, [x])).win)).join(' / ');
  console.log(`| ${c} | **${f1(s.win - b.win)}** | ${h} | ${b.punch.toFixed(2)}→${s.punch.toFixed(2)} | ${s.ripN > 0 ? `${s.ripB.toFixed(0)} / ${s.ripSd.toFixed(1)}` : '—'} | ${b.dodge.toFixed(2)}→${s.dodge.toFixed(2)} | ${b.sting.toFixed(1)}→${s.sting.toFixed(1)} / ${b.catch.toFixed(1)}→${s.catch.toFixed(1)} | ${b.launch10.toFixed(2)}→${s.launch10.toFixed(2)} | ${s.dealt.toFixed(1)} / ${s.taken.toFixed(1)} |`);
}
