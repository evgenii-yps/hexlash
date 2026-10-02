// promises-trial-table.mjs — свод пробной прикидки чисел (TZ_promises_v1, шаг 1): пробные правки в КОПИИ дерева (/tmp), не в игре.
// ЗАПУСК: node scripts/promises-trial-table.mjs   (читает docs/promises/out — «без/с как сейчас» — и docs/promises/out-trial — «с пробной правкой»)
import { readFileSync } from 'node:fs';
const FOES = ['natisk', 'nalet', 'skala', 'zasada'];
const DT = 1 / 60;
const rd = (dir, name, from) => JSON.parse(readFileSync(`docs/promises/${dir}/${name}-s${from}.json`, 'utf8')).foes;
function agg(dir, name, froms) { const A = {}; for (const f of froms) { const F = rd(dir, name, f); for (const k of FOES) for (const [a, v] of Object.entries(F[k])) { if (Array.isArray(v)) { A[a] = A[a] || v.map(() => 0); v.forEach((x, i) => { A[a][i] += x; }); } else A[a] = (A[a] || 0) + v; } } return A; }
const m = (S) => ({ win: 100 * S.w / S.bouts, punch: 100 * S.punchSdNorm / S.punchN, hit: 100 * S.sdNorm / S.contacts, ripB: 100 * S.ripBonus / Math.max(1, S.ripN), ripSd: 100 * S.ripSd / Math.max(1, S.ripN), ripN: S.ripN / S.bouts, dodge: S.dodges / S.bouts, dealt: S.foeDealt / S.bouts, taken: S.taken / S.bouts, it: S.it.map((x) => 100 * x / S.steps), sec: S.sec / S.bouts });
const f = (x, d = 1) => (x >= 0 ? '' : '') + x.toFixed(d);
const names = ['PRESS', 'STRIKE', 'STING', 'HOLD', 'BREAK', 'BREATHE', 'CATCH'];
const rows = [['natisk', 'natisk-a1-solo', 'Heavy Hit +7% к силе удара'], ['zasada', 'zasada-a2-solo', 'Slip Counter: ответ после уворота +3% → +35%'], ['zasada', 'zasada-b3-solo', "Run 'Em Ragged: наклон к STING 0.40 → 0.12 (оси без изменений)"]];
for (const [core, cell, title] of rows) {
  const bare = m(agg('out', `${core}-bare`, [1, 401])), now = m(agg('out', cell, [1, 401])), tri = m(agg('out-trial', cell, [1, 401]));
  const h = (d) => [1, 401].map((x) => f(m(agg(d, cell, [x])).win - m(agg('out', `${core}-bare`, [x])).win)).join(' / ');
  console.log(`\n**${title}**`);
  console.log(`- исход к голому ядру, п.п.: сейчас ${f(now.win - bare.win)} (половины ${[1, 401].map((x) => f(m(agg('out', cell, [x])).win - m(agg('out', `${core}-bare`, [x])).win)).join(' / ')}) → с пробой ${f(tri.win - bare.win)} (половины ${h('out-trial')})`);
  console.log(`- мощность удара (норм.), % maxHP: без ${f(bare.punch, 2)} · сейчас ${f(now.punch, 2)} · проба ${f(tri.punch, 2)} (прямой удар)`);
  if (cell.includes('a2')) console.log(`- ответ после уворота: бонус ${f(now.ripB)}% → ${f(tri.ripB)}%; урон ответа ${f(now.ripSd, 2)} → ${f(tri.ripSd, 2)} % maxHP; ответов за бой ${f(now.ripN, 2)} → ${f(tri.ripN, 2)}; уворотов ${f(now.dodge, 2)} → ${f(tri.dodge, 2)}`);
  if (cell.includes('b3')) console.log(`- намерения (%): ${names.map((n, i) => `${n} ${f(bare.it[i])}→${f(now.it[i])}→${f(tri.it[i])}`).join(' · ')}  (без → сейчас → проба)`);
  console.log(`- нанесено / получено HP за бой: ${f(now.dealt)} / ${f(now.taken)} → ${f(tri.dealt)} / ${f(tri.taken)}`);
}
