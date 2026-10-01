// crystal-remeasure-run.mjs — ДРАЙВЕР ПЕРЕЗАМЕРА КРИСТАЛЛОВ (TZ_crystal_remeasure_v2): раскладывает задачи по процессам и ждёт.
//
// ЗАПУСК:  WT=/путь/к/копии node scripts/crystal-remeasure-run.mjs <этап> [--jobs=4]
//   WT   — копия дерева с применённым патчем зонда (см. docs/crystal-remeasure/probe/README.md). Скрипты копируются туда сами.
//   этап — zerocheck  16 пар голых ядер × 200 зёрен БЕЗ чередования сторон (сверка с прежними «25.07% / 51.87 с / 83.03 с»)
//          zero       голые ядра × 4 врага, 5 блоков по 200 зёрен (1–1000): нулевой замер и шум
//          solo       часть A: 60 ячеек × 4 врага × 200 зёрен (кристалл в одиночку)
//          amp        усиление ×3 для ячеек из out/amp-list.json (их составляет crystal-remeasure-report.mjs solo)
//          chan       разложение ×3 по каналам (оси / рычаги / наклон) для ячеек из out/chan-list.json
//          build      часть B: 12 полных ветвей + 60 «ветвь без одного» × 4 врага × 200 зёрен
// Уже готовые задачи (файл есть) пропускаются — прогон можно прерывать и продолжать.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const WT = process.env.WT;
if (!WT) throw new Error('задайте WT=<копия дерева с патчем зонда>');
const REPO = new URL('..', import.meta.url).pathname;
const RAW = join(REPO, process.env.CR_OUT || 'docs/crystal-remeasure/out', 'raw'); // CR_OUT — своя папка (TZ_balance_fix_v2)
const stage = process.argv[2];
const JOBS = Number((process.argv.find((a) => a.startsWith('--jobs=')) || '--jobs=4').split('=')[1]);
const SEEDS = 200;
const CORES = ['natisk', 'nalet', 'skala', 'zasada'];
const BR = ['a', 'b', 'c'];

for (const f of ['crystal-remeasure-worker.mjs']) copyFileSync(join(REPO, 'scripts', f), join(WT, 'scripts', f));
mkdirSync(RAW, { recursive: true });

const jobs = [];
const add = (name, spec) => jobs.push({ name, spec: { ...spec, foes: spec.foes || CORES, out: join(RAW, name + '.json') } });
if (stage === 'zerocheck') for (const core of CORES) add(`zerocheck-${core}`, { kind: 'zero', core, seedFrom: 1, seedTo: SEEDS, noswap: true });
if (stage === 'zero') for (const core of CORES) for (let b = 0; b < 5; b++) add(`zero-${core}-b${b + 1}`, { kind: 'zero', core, seedFrom: 200 * b + 1, seedTo: 200 * (b + 1) });
if (stage === 'solo') for (const core of CORES) for (const br of BR) for (let i = 1; i <= 5; i++) add(`solo-${core}-${br}${i}`, { kind: 'solo', core, branch: br, idx: i, amp: 1, seedFrom: 1, seedTo: SEEDS });
if (stage === 'amp') {
  const list = JSON.parse(readFileSync(join(REPO, 'docs/crystal-remeasure/out/amp-list.json'), 'utf8'));
  for (const c of list) add(`amp3-${c.core}-${c.branch}${c.idx}`, { kind: 'solo', core: c.core, branch: c.branch, idx: c.idx, amp: 3, seedFrom: 1, seedTo: SEEDS });
}
if (stage === 'chan') { // разложение ×3 по каналам — для ячеек из out/chan-list.json (их составляет crystal-remeasure-report.mjs amp)
  const list = JSON.parse(readFileSync(join(REPO, 'docs/crystal-remeasure/out/chan-list.json'), 'utf8'));
  for (const c of list) for (const ch of c.channels) add(`chan3-${ch}-${c.core}-${c.branch}${c.idx}`, { kind: 'solo', core: c.core, branch: c.branch, idx: c.idx, amp: 3, channel: ch, seedFrom: 1, seedTo: SEEDS });
}
if (stage === 'build') {
  for (const core of CORES) for (const br of BR) {
    add(`build-${core}-${br}-full`, { kind: 'build', core, branch: br, omit: null, seedFrom: 1, seedTo: SEEDS });
    for (let j = 1; j <= 5; j++) add(`build-${core}-${br}-no${j}`, { kind: 'build', core, branch: br, omit: j, seedFrom: 1, seedTo: SEEDS });
  }
}
if (!jobs.length) throw new Error('нет задач для этапа ' + stage);

const todo = jobs.filter((j) => !existsSync(j.spec.out));
console.error(`[${stage}] задач ${jobs.length}, осталось ${todo.length}, процессов ${JOBS}`);
let running = 0, done = 0, failed = 0;
const t0 = Date.now();
await new Promise((resolve) => {
  const next = () => {
    if (!todo.length && !running) return resolve();
    while (running < JOBS && todo.length) {
      const j = todo.shift();
      running++;
      const p = spawn('node', ['scripts/crystal-remeasure-worker.mjs', JSON.stringify(j.spec)], { cwd: WT, stdio: ['ignore', 'ignore', 'inherit'] });
      p.on('exit', (code) => {
        running--; done++;
        if (code) { failed++; console.error(`!! ${j.name} упала (код ${code})`); }
        if (done % 5 === 0 || !todo.length) console.error(`[${stage}] ${done}/${done + todo.length + running} за ${((Date.now() - t0) / 60000).toFixed(1)} мин`);
        next();
      });
    }
  };
  next();
});
console.error(`[${stage}] готово: ${done} задач, упало ${failed}, ${((Date.now() - t0) / 60000).toFixed(1)} мин`);
if (failed) process.exit(1);
