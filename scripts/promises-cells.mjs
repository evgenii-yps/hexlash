// promises-cells.mjs — БЫСТРЫЙ СТЕНД ПОДБОРА (TZ_promises_v1): гонит ячейки promises-worker.mjs по 4 процессам.
// ЗАПУСК: WT=/tmp/pr/wtX OUT=docs/promises/out-g1/<тег> node scripts/promises-cells.mjs natisk:solo:a:1 natisk:full:a zasada:bare ...
// Ячейка = ядро:режим[:ветка[:номер]]; зёрна 1–800 двумя блоками по 400, враги — четыре голых ядра. Готовые файлы пропускаются.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const REPO = new URL('..', import.meta.url).pathname;
const WT = process.env.WT || '/tmp/pr/wt';
const OUT = join(REPO, process.env.OUT || 'docs/promises/out-g1/tmp');
const SEEDS = (process.env.SEEDS || '1-400,401-800').split(',').map((r) => r.split('-').map(Number));
mkdirSync(OUT, { recursive: true });
const FOES = ['natisk', 'nalet', 'skala', 'zasada'];
const jobs = [];
for (const spec of process.argv.slice(2)) {
  const [core, mode, branch, idx] = spec.split(':');
  if (mode === 'set') { // core:set:b5+c2 — набор граней из разных веток
    const faces = branch.split('+').map((x) => [x[0], Number(x.slice(1))]);
    for (const [from, to] of SEEDS) jobs.push({ core, mode, faces, foes: FOES, seedFrom: from, seedTo: to, out: join(OUT, `${core}-${branch}-set-s${from}.json`) });
    continue;
  }
  const name = [core, branch ? branch + (idx || '') : '', mode].filter(Boolean).join('-');
  for (const [from, to] of SEEDS) jobs.push({ core, mode, branch, idx: idx ? Number(idx) : undefined, foes: FOES, seedFrom: from, seedTo: to, out: join(OUT, `${name}-s${from}.json`) });
}
const todo = jobs.filter((j) => !existsSync(j.out));
let running = 0;
await new Promise((resolve) => {
  const next = () => {
    if (!todo.length && !running) return resolve();
    while (running < 4 && todo.length) {
      const j = todo.shift(); running++;
      spawn('node', ['scripts/promises-worker.mjs', JSON.stringify(j)], { cwd: WT, stdio: ['ignore', 'ignore', 'inherit'] }).on('exit', () => { running--; next(); });
    }
  };
  next();
});
console.error('готово', OUT);
