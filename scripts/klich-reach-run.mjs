// klich-reach-run.mjs — ДРАЙВЕР ПРИЁМКИ КЛИЧА (TZ_klich_v2): раскладывает задачи «вес × ядро» по процессам.
//   WT=/копия/дерева/с/патчем-зонда node scripts/klich-reach-run.mjs <веса через запятую> [--jobs=4]
//   пример: WT=/tmp/wt node scripts/klich-reach-run.mjs 0.1,0.15,0.2,0.3,0.4,0.5
// Готовые задачи (файл есть) пропускаются. Результат — docs/klich-reach/out/raw/w<вес>-<ядро>.json.
import { spawn } from 'node:child_process';
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const WT = process.env.WT;
if (!WT) throw new Error('задайте WT=<копия дерева с патчем зонда>');
const REPO = new URL('..', import.meta.url).pathname;
const RAW = join(REPO, 'docs/klich-reach/out/raw');
const weights = (process.argv[2] || '0.3').split(',').map(Number);
// --seeds=201-400 — другой набор зёрен (файлы получают префикс s<от>-); --pick=push:0.4,fallback:0.8,hold:0.3 — свой вес у каждого клича (тогда первый аргумент — метка прогона)
const SEEDS = ((process.argv.find((a) => a.startsWith('--seeds=')) || '--seeds=1-200').split('=')[1]).split('-').map(Number);
const PICK = (process.argv.find((a) => a.startsWith('--pick=')) || '').split('=')[1];
const pickW = PICK ? Object.fromEntries(PICK.split(',').map((x) => x.split(':')).map(([k, v]) => [k, Number(v)])) : null;
const PRE = SEEDS[0] === 1 ? '' : `s${SEEDS[0]}-`;
const JOBS = Number((process.argv.find((a) => a.startsWith('--jobs=')) || '--jobs=4').split('=')[1]);
const CORES = ['natisk', 'nalet', 'skala', 'zasada'];
copyFileSync(join(REPO, 'scripts/klich-reach-worker.mjs'), join(WT, 'scripts/klich-reach-worker.mjs'));
mkdirSync(RAW, { recursive: true });
const todo = [];
for (const w of weights) for (const core of CORES) {
  const nm = pickW ? `${PRE}pick-${process.argv[2]}-${core}` : `${PRE}w${w}-${core}`;
  const out = join(RAW, nm + '.json');
  if (!existsSync(out)) todo.push({ name: nm, spec: { weight: w, weights: pickW || undefined, core, seedFrom: SEEDS[0], seedTo: SEEDS[1], out } });
}
console.error(`задач осталось ${todo.length}, процессов ${JOBS}`);
let running = 0, done = 0, failed = 0; const t0 = Date.now();
await new Promise((resolve) => {
  const next = () => {
    if (!todo.length && !running) return resolve();
    while (running < JOBS && todo.length) {
      const j = todo.shift(); running++;
      const p = spawn('node', ['scripts/klich-reach-worker.mjs', JSON.stringify(j.spec)], { cwd: WT, stdio: ['ignore', 'ignore', 'inherit'] });
      p.on('exit', (code) => { running--; done++; if (code) { failed++; console.error(`!! ${j.name} упала (${code})`); } console.error(`${done} готово за ${((Date.now() - t0) / 60000).toFixed(1)} мин`); next(); });
    }
  };
  next();
});
if (failed) process.exit(1);
