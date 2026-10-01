// balance-fix-bench.mjs — БЫСТРЫЙ ЗАМЕР ГОЛЫХ ЯДЕР (TZ_balance_fix_v2): 4×4, два набора зёрен, метрики боя, доли намерений, виды нужд.
// ЗАПУСК: node scripts/balance-fix-bench.mjs naked <тег> [--seeds=1-200,201-400] [--need=1] [--swap=alt|none]
// Копия дерева с зондом ставится сама (scripts/balance-fix-wt.py) в /tmp/bf/wt-<тег>; результат — docs/balance-fix/out/<тег>/naked.{json,md}.
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const stage = args[0], tag = args[1];
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const sets = opt('seeds', '1-200,201-400').split(',').map((r) => r.split('-').map(Number));
const NEED = opt('need', '1') === '1';
const SWAP = opt('swap', 'alt');
const CORES = ['natisk', 'nalet', 'skala', 'zasada'];
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const WT = `/tmp/bf/wt-${tag}`;
const OUT = join(REPO, 'docs/balance-fix/out', tag);
mkdirSync(OUT, { recursive: true });

if (stage === 'naked') {
  const ovs = args.filter((a) => /^--(cb|bh|ud|kb|bb|it)=/.test(a));
  const r = spawnSync('python3', [join(REPO, 'scripts/balance-fix-wt.py'), WT, ...ovs], { stdio: 'inherit' });
  if (r.status) process.exit(1);
  const jobs = [];
  for (const [from, to] of sets) for (const a of CORES) jobs.push({ type: 'naked', need: NEED, swap: SWAP, seedFrom: from, seedTo: to, pairs: CORES.map((b) => [a, b]), out: join(OUT, `raw-naked-${a}-s${from}.json`) });
  await new Promise((resolve) => {
    let next = 0, running = 0;
    const launch = () => {
      while (running < 4 && next < jobs.length) {
        const j = jobs[next++]; running++;
        const p = spawn('node', [join(WT, 'scripts/balance-fix-worker.mjs'), JSON.stringify(j)], { cwd: WT, stdio: ['ignore', 'ignore', 'inherit'] });
        p.on('exit', () => { running--; if (next >= jobs.length && !running) resolve(); else launch(); });
      }
    };
    launch();
  });
  report();
}
if (stage === 'report') report();

function report() {
  // собрать
  const R = {}; // R[set][a][b] = rec
  for (const [from] of sets) { R[from] = {}; for (const a of CORES) { const d = JSON.parse(readFileSync(join(OUT, `raw-naked-${a}-s${from}.json`), 'utf8')); R[from][a] = d.pairs; } }
  const pct = (x) => (100 * x).toFixed(1);
  const med = (xs) => { const s = [...xs].sort((p, q) => p - q); const m = (s.length - 1) / 2; return (s[Math.floor(m)] + s[Math.ceil(m)]) / 2; };
  const lines = [];
  const summary = {};
  const cellAgg = (a, b, froms) => { const w = [], sec = []; for (const f of froms) { const r = R[f][a][`${a}|${b}`]; w.push(...r.w); sec.push(...r.sec); } return { p: w.reduce((x, y) => x + y, 0) / w.length, med: med(sec), n: w.length, sec }; };
  const groups = [['оба набора', sets.map((s) => s[0])], ...sets.map(([f, t]) => [`набор ${f}–${t}`, [f]])];
  for (const [gname, froms] of groups) {
    lines.push(`**${gname}** (ряд = игрок; доля побед %, медиана с)\n`, '| игрок \\ враг | ' + CORES.map((c) => NAME[c]).join(' | ') + ' | итог против 4 | медиана ряда |', '| --- | --- | --- | --- | --- | --- | --- |');
    for (const a of CORES) {
      const cells = CORES.map((b) => cellAgg(a, b, froms));
      const all = cells.flatMap((c) => c.sec); const win = cells.reduce((s, c) => s + c.p, 0) / 4;
      lines.push(`| ${NAME[a]} | ${cells.map((c) => `${pct(c.p)} (${c.med.toFixed(1)})`).join(' | ')} | **${pct(win)}** | ${med(all).toFixed(1)} |`);
      summary[gname + '|' + a] = { win: win * 100, med: med(all) };
    }
    lines.push('');
  }
  // тело + намерения + нужда: по всем наборам
  lines.push('**Тело, намерения и нужда игрока (ряд = игрок против 4 врагов, все наборы)**\n');
  lines.push('| ядро | вне радиуса | свободное | скорость | замахи не считаны | ' + INTENTS.join(' | ') + ' | нужда всего | запас | замах | заряд | дольше 100 с | таймаутов |', '| --- |' + ' --- |'.repeat(7 + 9));
  const ixs = {};
  const metric = { far: 0, free: 0, n: 0 };
  for (const a of CORES) {
    const S = { n: 0, far: 0, free: 0, sp: 0, it: INTENTS.map(() => 0) }; let dec = 0; const need = { stamina: 0, swing: 0, charge: 0 }; let long = 0, capped = 0, bouts = 0;
    for (const [f] of sets) for (const b of CORES) { const r = R[f][a][`${a}|${b}`]; S.n += r.sums.n; S.far += r.sums.far; S.free += r.sums.free; S.sp += r.sums.sp; r.sums.it.forEach((v, i) => { S.it[i] += v; }); dec += r.dec; for (const k in need) need[k] += r.need[k]; long += r.sec.filter((x) => x > 100).length; capped += r.capped; bouts += r.sec.length; }
    metric.far += S.far; metric.free += S.free; metric.n += S.n;
    const it = S.it.map((v) => v / S.n); ixs[a] = it;
    const nt = need.stamina + need.swing + need.charge;
    lines.push(`| ${NAME[a]} | ${pct(S.far / S.n)}% | ${pct(S.free / S.n)}% | ${(S.sp / S.n).toFixed(2)} | | ${it.map((v) => pct(v)).join(' | ')} | ${dec ? pct(nt / dec) + '%' : '—'} | ${dec ? pct(need.stamina / dec) : '—'} | ${dec ? pct(need.swing / dec) : '—'} | ${dec ? pct(need.charge / dec) : '—'} | ${long} | ${capped} |`);
    summary[a] = { far: S.far / S.n, free: S.free / S.n, need: dec ? nt / dec : null, needSwing: dec ? need.swing / dec : null, long, capped, bouts, it };
  }
  lines.push('');
  // разброс главных намерений между ядрами: средняя попарная полная вариация (TV)
  let tv = 0, c = 0; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { tv += 0.5 * ixs[CORES[i]].reduce((s, v, k) => s + Math.abs(v - ixs[CORES[j]][k]), 0); c++; }
  summary.tv = tv / c;
  lines.push(`Разброс намерений между ядрами (средняя попарная полная вариация): **${(tv / c).toFixed(3)}**; метрики по всем ядрам и боям: вне радиуса ${pct(metric.far / metric.n)}% (порог ≥25), свободное ${pct(metric.free / metric.n)}% (порог ≤35) — при чередовании сторон; точные «нечередованные» цифры — отдельным прогоном (--swap=none).`);
  summary.metric = { far: metric.far / metric.n, free: metric.free / metric.n };
  writeFileSync(join(OUT, 'naked.md'), lines.join('\n'));
  writeFileSync(join(OUT, 'naked.json'), JSON.stringify(summary, null, 1));
  console.log(lines.join('\n'));
}
