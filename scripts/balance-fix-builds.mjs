// balance-fix-builds.mjs — СБОРКИ ИЗ 7 КРИСТАЛЛОВ (TZ_balance_fix_v2, Ц6): каждая раскладка 5+2, 4+3, 3+3+1, 3+2+2, 5+1+1, 4+2+1 по всем ядрам и порядкам веток
// против поля из четырёх голых ядер ('bare') и против ботов по правилу foeCompose ('bot'), парно к голому ядру.
// ЗАПУСК: node scripts/balance-fix-builds.mjs <тег> [--seeds=1-200,201-400] [--fields=bare,bot] [--cores=natisk,..]
// Копия дерева ставится сама (balance-fix-wt.py) в /tmp/bf/wt-<тег>; результат — docs/balance-fix/out/<тег>/builds.{json,md}.
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const REPO = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const tag = args[0];
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const sets = opt('seeds', '1-200,201-400').split(',').map((r) => r.split('-').map(Number));
const FIELDS = opt('fields', 'bare,bot').split(',');
const CORES = opt('cores', 'natisk,nalet,skala,zasada').split(',');
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const WT = `/tmp/bf/wt-${tag}`;
const OUT = join(REPO, 'docs/balance-fix/out', tag);
mkdirSync(OUT, { recursive: true });
const ovs = args.filter((a) => /^--(cb|bh|ud|kb|bb|it|bt)=/.test(a));
if (!existsSync(join(WT, 'scripts/balance-fix-worker.mjs')) || args.includes('--fresh') || true) {
  const r = spawnSync('python3', [join(REPO, 'scripts/balance-fix-wt.py'), WT, ...ovs], { stdio: 'inherit' });
  if (r.status) process.exit(1);
}
const BR = ['a', 'b', 'c'];
const perms = (n) => { const out = []; const rec = (cur, rest) => { if (cur.length === n) { out.push(cur); return; } for (const x of rest) rec([...cur, x], rest.filter((y) => y !== x)); }; rec([], BR); return out; };
const shapes = opt('shapes', 'seven') === 'branch' ? [[5]] : opt('shapes', 'seven') === 'single' ? [[1]] : [[5, 2], [4, 3], [3, 3, 1], [3, 2, 2], [5, 1, 1], [4, 2, 1]];
const builds = [{ name: 'голое', spec: null }];
for (const sh of shapes) {
  const seen = new Set();
  for (const p of perms(sh.length)) {
    const spec = p.map((br, i) => [br, sh[i]]);
    const key = spec.map(([b, k]) => b + k).sort().join(''); // эквивалентные перестановки равных долей схлопываем
    const canon = [...spec].sort((x, y) => x[0].localeCompare(y[0])).map(([b, k]) => b + k).join('');
    if (seen.has(canon)) continue; seen.add(canon);
    builds.push({ name: spec.map(([b, k]) => b + k).join('+'), spec });
  }
}
const jobs = [];
for (const [from, to] of sets) for (const field of FIELDS) for (const core of CORES) jobs.push({ type: 'spec', core, builds, field, swap: 'alt', seedFrom: from, seedTo: to, out: join(OUT, `raw-${core}-${field}-s${from}.json`) });
await new Promise((resolve) => {
  let next = 0, running = 0;
  const launch = () => {
    while (running < 4 && next < jobs.length) {
      const j = jobs[next++]; running++;
      const p = spawn('node', [join(WT, 'scripts/balance-fix-worker.mjs'), JSON.stringify(j)], { cwd: WT, stdio: ['ignore', 'ignore', 'inherit'] });
      p.on('exit', () => { running--; console.error(`[builds] ${next - running}/${jobs.length}`); if (next >= jobs.length && !running) resolve(); else launch(); });
    }
  };
  launch();
});
// ── свод ──
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const f1 = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const J = {}; const L = [];
for (const field of FIELDS) {
  L.push(`### Сборки по 7 кристаллов против ${field === 'bare' ? 'поля из четырёх голых ядер' : 'ботов (по правилу foeCompose)'}\n`);
  for (const core of CORES) {
    for (const [from] of sets) {
      const raw = JSON.parse(readFileSync(join(OUT, `raw-${core}-${field}-s${from}.json`), 'utf8')).builds;
      const base = raw['голое'];
      const bWr = 100 * mean(base.w);
      const rows = [];
      for (const b of builds.slice(1)) {
        const r = raw[b.name]; const d = r.w.map((x, i) => x - base.w[i]);
        const m = mean(d), sd = Math.sqrt(mean(d.map((x) => (x - m) ** 2)) / Math.max(1, d.length - 1));
        rows.push({ name: b.name, wr: 100 * mean(r.w), delta: 100 * m, se: 100 * sd / Math.sqrt(d.length), sec: r.sec.slice().sort((x, y) => x - y)[Math.floor(r.sec.length / 2)] });
      }
      const wrs = rows.map((r) => r.wr); const best = rows.reduce((a, b) => (b.wr > a.wr ? b : a));
      const others = rows.filter((r) => r !== best);
      const sum = { base: bWr, maxDelta: Math.max(...rows.map((r) => r.delta)), minDelta: Math.min(...rows.map((r) => r.delta)), best: best.name, bestMinusMean: best.wr - mean(others.map((r) => r.wr)), bestMinusMedian: best.wr - others.map((r) => r.wr).sort((a, b) => a - b)[Math.floor(others.length / 2)], spread: Math.max(...wrs) - Math.min(...wrs), worstSig: rows.filter((r) => r.delta + 1.96 * r.se < 0).map((r) => r.name) };
      J[`${field}|${core}|s${from}`] = { sum, rows };
      L.push(`**${NAME[core]}**, зёрна от ${from}: голое ядро ${bWr.toFixed(1)}%; сборки Δ от ${f1(sum.minDelta)} до ${f1(sum.maxDelta)} п.п.; лучшая ${best.name} выше среднего остальных на ${sum.bestMinusMean.toFixed(1)} (выше медианы на ${sum.bestMinusMedian.toFixed(1)}); размах ${sum.spread.toFixed(1)}; значимо хуже голого: ${sum.worstSig.length ? sum.worstSig.join(', ') : 'нет'}`);
    }
  }
  L.push('');
}
writeFileSync(join(OUT, 'builds.json'), JSON.stringify(J));
writeFileSync(join(OUT, 'builds.md'), L.join('\n'));
console.log(L.join('\n'));
