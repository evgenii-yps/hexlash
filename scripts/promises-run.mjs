// promises-run.mjs — ДРАЙВЕР РАЗВЕДКИ «ОБЕЩАНИЯ ТЕКСТОВ» (TZ_promises_v1, шаг 1): раскладывает задачи promises-worker.mjs по 4 процессам.
// ЗАПУСК: python3 scripts/promises-wt.py /tmp/pr/wt && OUT=docs/promises/out node scripts/promises-run.mjs
// Зёрна 1–800 двумя блоками по 400 (видна стабильность). Враги — четыре голых ядра. Готовые файлы пропускаются.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const REPO = new URL('..', import.meta.url).pathname;
const WT = process.env.WT || '/tmp/pr/wt';
const OUT = join(REPO, process.env.OUT || 'docs/promises/out');
mkdirSync(OUT, { recursive: true });
const FOES = ['natisk', 'nalet', 'skala', 'zasada'];
const cells = [
  ['natisk', 'a', 1], ['natisk', 'c', 1], ['natisk', 'c', 2], ['natisk', 'c', 3], ['natisk', 'c', 4],
  ['nalet', 'b', 2], ['nalet', 'b', 5], ['zasada', 'a', 2], ['zasada', 'b', 3],
];
const defs = [];
for (const core of ['natisk', 'nalet', 'zasada']) defs.push({ core, mode: 'bare', name: `${core}-bare` });
for (const [core, branch, idx] of cells) defs.push({ core, mode: 'solo', branch, idx, name: `${core}-${branch}${idx}-solo` });
for (const mode of ['axes', 'leans']) defs.push({ core: 'zasada', mode, branch: 'b', idx: 3, name: `zasada-b3-${mode}` });
const jobs = [];
for (const [from, to] of [[1, 400], [401, 800]]) for (const d of defs) jobs.push({ ...d, foes: FOES, seedFrom: from, seedTo: to, out: join(OUT, `${d.name}-s${from}.json`) });
const todo = jobs.filter((j) => !existsSync(j.out));
console.error(`задач ${jobs.length}, осталось ${todo.length}`);
let running = 0, done = 0;
await new Promise((resolve) => {
  const next = () => {
    if (!todo.length && !running) return resolve();
    while (running < 4 && todo.length) {
      const j = todo.shift(); running++;
      const p = spawn('node', ['scripts/promises-worker.mjs', JSON.stringify(j)], { cwd: WT, stdio: ['ignore', 'ignore', 'inherit'] });
      p.on('exit', (code) => { running--; done++; if (code) console.error('!! упала', j.name); console.error(`[${done}/${done + todo.length + running}]`); next(); });
    }
  };
  next();
});
console.error('готово');
