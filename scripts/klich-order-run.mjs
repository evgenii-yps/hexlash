// klich-order-run.mjs — ДРАЙВЕР приёмки «приказ внутри группы». WT=/копия/с/патчем node scripts/klich-order-run.mjs [--seeds=1-200] [--jobs=4]
// Результат — docs/klich-reach/out/order/raw/s<от>-<ядро>.json
import { spawn } from 'node:child_process';
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const WT = process.env.WT; if (!WT) throw new Error('задайте WT=<копия дерева с патчем зонда>');
const REPO = new URL('..', import.meta.url).pathname;
const RAW = join(REPO, 'docs/klich-reach/out/order/raw');
const SEEDS = ((process.argv.find((a) => a.startsWith('--seeds=')) || '--seeds=1-200').split('=')[1]).split('-').map(Number);
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1];
const JOBS = Number((process.argv.find((a) => a.startsWith('--jobs=')) || '--jobs=4').split('=')[1]);
copyFileSync(join(REPO, 'scripts/klich-order-worker.mjs'), join(WT, 'scripts/klich-order-worker.mjs'));
mkdirSync(RAW, { recursive: true });
const todo = [];
for (const core of ['natisk', 'nalet', 'skala', 'zasada']) { const out = join(RAW, `${ONLY ? ONLY + '-' : ''}s${SEEDS[0]}-${core}.json`); if (!existsSync(out)) todo.push({ name: core, spec: { only: ONLY ? ONLY.split(',') : undefined, core, seedFrom: SEEDS[0], seedTo: SEEDS[1], out } }); }
let running = 0, failed = 0; const t0 = Date.now();
await new Promise((resolve) => {
  const next = () => {
    if (!todo.length && !running) return resolve();
    while (running < JOBS && todo.length) {
      const j = todo.shift(); running++;
      const p = spawn('node', ['scripts/klich-order-worker.mjs', JSON.stringify(j.spec)], { cwd: WT, stdio: ['ignore', 'ignore', 'inherit'] });
      p.on('exit', (c) => { running--; if (c) { failed++; console.error(`!! ${j.name} упала (${c})`); } console.error(`${j.name} готово за ${((Date.now() - t0) / 60000).toFixed(1)} мин`); next(); });
    }
  };
  next();
});
process.exit(failed ? 1 : 0);
