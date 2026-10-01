// balance-fix-cr-quick.mjs — БЫСТРЫЙ СВОД ЧАСТИЧНОГО ПЕРЕЗАМЕРА (TZ_balance_fix_v2): читает то, что лежит в docs/balance-fix/out/<тег>/crystals/raw
// (нулевой блок b1 + solo-* + build-*-full), печатает по каждой готовой ячейке сдвиг доли побед, долю изменённых решений и (для ветвей) сдвиг полной ветви.
// ЗАПУСК: node scripts/balance-fix-cr-quick.mjs <тег> [подстрока ядра: natisk|nalet|skala|zasada] [--set=2]
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CORES, poolSums, analyseCell, METRICS, THRESH } from './crystal-remeasure-lib.mjs';
const tag = process.argv[2]; const coreF = process.argv.find((a, i) => i > 2 && CORES.includes(a));
const SET = Number((process.argv.find((a) => a.startsWith('--set=')) || '--set=1').split('=')[1]);
const SUF = SET > 1 ? `-set${SET}` : '';
const RAW = new URL(`../docs/balance-fix/out/${tag}/crystals/raw/`, import.meta.url).pathname;
const load = (n) => (existsSync(join(RAW, n + '.json')) ? JSON.parse(readFileSync(join(RAW, n + '.json'), 'utf8')) : null);
const NAME = { natisk: 'ONS', nalet: 'RAI', skala: 'BUL', zasada: 'AMB' };
const noise = Object.fromEntries(CORES.map((c) => [c, Object.fromEntries(METRICS.map((m) => [m.id, { sigmaDiff: Infinity }]))]));
const f1 = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const out = []; const sum = { n: 0, over12: 0, neg: 0, dec5: 0 }; const J = {};
for (const core of CORES) {
  if (coreF && core !== coreF) continue;
  const z = load(`zero-${core}-b${SET}`); if (!z) { console.error('нет нулевого блока', core); continue; }
  const base = z.foes;
  for (const br of ['a', 'b', 'c']) {
    const full = load(`build-${core}-${br}-full${SUF}`);
    let fl = '';
    if (full) { const a = analyseCell({ raw: full, base, noise, core, key: 'all:0', tagKey: '0' }); J[`${core}:${br}:full`] = { delta: a.win.delta, ciLo: a.win.ciLo, ciHi: a.win.ciHi, med: a.median.cell }; fl = `ветвь ${f1(a.win.delta)} [${f1(a.win.ciLo)}…${f1(a.win.ciHi)}] мед ${a.median.cell.toFixed(1)}`; }
    out.push(`${NAME[core]} ${br.toUpperCase()}  ${fl}`);
    for (let i = 1; i <= 5; i++) {
      const raw = load(`solo-${core}-${br}${i}${SUF}`); if (!raw) continue;
      const a = analyseCell({ raw, base, noise, core });
      J[`${core}:${br}${i}`] = { delta: a.win.delta, ciLo: a.win.ciLo, ciHi: a.win.ciHi, dec: a.decisions.chgAll }; sum.n++; if (a.win.delta > 12) sum.over12++; if (a.win.ciHi < 0) sum.neg++; if (a.decisions.chgAll >= 0.05) sum.dec5++;
      out.push(`   ${br}${i} Δ${f1(a.win.delta).padStart(6)} [${f1(a.win.ciLo)}…${f1(a.win.ciHi)}] реш ${(100 * a.decisions.chgAll).toFixed(1).padStart(5)}%${a.win.delta > 12 ? '  ▲>12' : ''}${a.win.ciHi < 0 ? '  ▼<0' : ''}${a.decisions.chgAll < 0.05 ? '  ·<5%' : ''}`);
    }
  }
}
import('node:fs').then((fs) => fs.writeFileSync(new URL(`../docs/balance-fix/out/${tag}/crystals/quick${SUF}.json`, import.meta.url).pathname, JSON.stringify(J)));
console.log(out.join('\n')); console.log(`ячеек ${sum.n}: >+12 ${sum.over12}; значимо<0 ${sum.neg}; решений ≥5% ${sum.dec5}`);
