// balance-recon-run.mjs — ДРАЙВЕР РАЗВЕДКИ БАЛАНСА (TZ_balance_recon_v1): раскладывает этап на задачи и гонит их в CONC процессах.
// Задачи, которым нужен зонд (need / gap / klichwin / replace), идут в отдельной копии дерева (WT) с патчем docs/balance-recon/probe/need-probe.patch;
// остальные — в самом репозитории. Готовые задачи (есть файл) пропускаются — прогон можно продолжать.
//
// ЗАПУСК: WT=/путь/к/копии node scripts/balance-recon-run.mjs <этап> [--seeds=1-200] [--conc=4]
//   этапы: naked need gap klichwin buff combo timing replace skew negbranch builds
// Сырые данные: docs/balance-recon/out/raw/<имя>.json (можно удалять и пересчитывать отчётом).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { CORES, BR } from './balance-recon-lib.mjs';

const REPO = new URL('..', import.meta.url).pathname;
const RAW = join(REPO, 'docs/balance-recon/out/raw/');
mkdirSync(RAW, { recursive: true });
const WT = process.env.WT || null;
const args = process.argv.slice(2);
const stage = args.find((a) => !a.startsWith('--'));
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const CONC = Number(opt('conc', 4));
const sets = opt('seeds', '1-200,201-400').split(',').map((r) => r.split('-').map(Number)); // [[from,to],...]
const only = opt('only', null);

const PROBE_STAGES = new Set(['need', 'gap', 'klichwin', 'replace']);
if (PROBE_STAGES.has(stage) && !WT) throw new Error(`этап ${stage} требует зонд: задайте WT=<копия дерева с need-probe.patch>`);

// ── состав этапов ────────────────────────────────────────────────────────────
const jobs = [];
const add = (name, job) => { if (only && !name.includes(only)) return; jobs.push({ name, job: { ...job, out: join(RAW, name + '.json') } }); };
const setTag = (from) => `s${from}`;

if (stage === 'naked') {
  for (const [from, to] of sets) for (const a of CORES) add(`naked-alt-${a}-${setTag(from)}`, { type: 'naked', swap: 'alt', seedFrom: from, seedTo: to, pairs: CORES.map((b) => [a, b]) });
  for (const a of CORES) add(`naked-none-${a}`, { type: 'naked', swap: 'none', seedFrom: 1, seedTo: 200, pairs: CORES.map((b) => [a, b]) });
  for (const a of CORES) add(`naked-occ-${a}`, { type: 'naked', swap: 'none', seedFrom: 1, seedTo: 50, pairs: CORES.map((b) => [a, b]) });
}
if (stage === 'need') {
  const cf = { natisk: { counter: 60 }, nalet: { counter: 60 }, skala: { counter: 50 }, zasada: { counter: 50 } };
  for (const [from, to] of sets) for (const c of CORES) add(`need-${c}-${setTag(from)}`, { type: 'need', cores: [c], seedFrom: from, seedTo: to, variants: [{ key: 'base' }, { key: 'counterCF', axes: cf[c] }] });
}
if (stage === 'gap') {
  // 8 «пустышек тега» в одиночку; 6 поглощённых вершин — в одиночку и внутри полной грани
  const dead = [['natisk', 'b2', 'chase_strike'], ['natisk', 'b5', 'lockdown'], ['natisk', 'c4', 'no_breather'], ['skala', 'b4', 'retaliate_ramp'], ['skala', 'b5', 'counter_trap'], ['zasada', 'a3', 'punish_aggression'], ['zasada', 'c3', 'vulnerable_strike'], ['zasada', 'c5', 'execute']];
  const absorbed = [['natisk', 'a5', 'overload_strike'], ['natisk', 'c5', 'rampage'], ['nalet', 'a5', 'perfect_jab'], ['nalet', 'c5', 'lethal_entry'], ['skala', 'c5', 'clinch'], ['zasada', 'b5', 'phantom']];
  const cells = [];
  for (const [core, id, tag] of dead) cells.push({ key: `dead:${core}:${id}`, core, ids: [id], tag });
  for (const [core, id, tag] of absorbed) {
    cells.push({ key: `solo:${core}:${id}`, core, ids: [id], tag });
    cells.push({ key: `branch:${core}:${id}`, core, ids: [1, 2, 3, 4, 5].map((j) => id[0] + j), tag });
  }
  for (const [from, to] of sets) for (let k = 0; k < 4; k++) add(`gap-${k}-${setTag(from)}`, { type: 'gap', cells: cells.filter((_, i) => i % 4 === k), seedFrom: from, seedTo: to });
}
if (stage === 'klichwin') {
  for (const [from, to] of sets) for (const c of CORES) for (const trig of ['t5', 'hp20']) add(`klichwin-${trig}-${c}-${setTag(from)}`, { type: 'klichwin', cores: [c], trigger: trig, modes: ['none', 'push', 'fallback', 'hold'], seedFrom: from, seedTo: to });
}
if (stage === 'buff') {
  const V = [{ key: 'none', winAt: 10 }, { key: 'kit-bot', buff: { kit: ['towel', 'bucket', 'dice'], rule: 'bot' } }, { key: 'kit-both', buff: { kit: ['towel', 'bucket', 'dice'], rule: 'bot' }, foeBuff: { kit: ['towel', 'bucket', 'dice'], rule: 'bot' } }];
  for (const b of ['towel', 'bucket', 'dice']) { V.push({ key: `${b}-bot`, buff: { kit: [b], rule: 'bot' } }); V.push({ key: `${b}-t10`, buff: { kit: [b], rule: 'fixed', fixedAt: 10 } }); }
  V.push({ key: 'bucket-t0', buff: { kit: ['bucket'], rule: 'fixed', fixedAt: 0.5 } });
  for (let f = 1; f <= 6; f++) V.push({ key: `dice-t10-f${f}`, buff: { kit: ['dice'], rule: 'fixed', fixedAt: 10, face: f } });
  for (const [from, to] of sets) for (const c of CORES) add(`buff-${c}-${setTag(from)}`, { type: 'buff', cores: [c], seedFrom: from, seedTo: to, variants: V });
}
if (stage === 'combo') {
  const V = [{ key: 'none' }];
  const KL = ['push', 'fallback', 'hold'];
  for (const k of KL) V.push({ key: `k-${k}`, klich: [{ at: 5, id: k }] });
  V.push({ key: 'b-bucket5', buff: { kit: ['bucket'], rule: 'fixed', fixedAt: 5 } }, { key: 'b-dice5', buff: { kit: ['dice'], rule: 'fixed', fixedAt: 5 } }, { key: 'b-kitbot', buff: { kit: ['towel', 'bucket', 'dice'], rule: 'bot' } });
  for (const k of KL) {
    V.push({ key: `k-${k}+bucket5`, klich: [{ at: 5, id: k }], buff: { kit: ['bucket'], rule: 'fixed', fixedAt: 5 } });
    V.push({ key: `k-${k}+dice5`, klich: [{ at: 5, id: k }], buff: { kit: ['dice'], rule: 'fixed', fixedAt: 5 } });
    V.push({ key: `k-${k}+kitbot`, klich: [{ at: 5, id: k }], buff: { kit: ['towel', 'bucket', 'dice'], rule: 'bot' } });
  }
  for (const [from, to] of sets) for (const c of CORES) add(`combo-${c}-${setTag(from)}`, { type: 'combo', cores: [c], seedFrom: from, seedTo: to, variants: V });
}
if (stage === 'timing') {
  const cyc = ['push', 'hold', 'fallback'];
  const V = [{ key: 'none' }];
  for (const k of ['push', 'fallback', 'hold']) {
    V.push({ key: `${k}-burst3`, klich: [1, 7, 13].map((at) => ({ at, id: k })) });
    V.push({ key: `${k}-spread3`, klich: [10, 25, 40].map((at) => ({ at, id: k })) });
    V.push({ key: `${k}-one5`, klich: [{ at: 5, id: k }] });
  }
  V.push({ key: 'mix9-every6', klich: Array.from({ length: 9 }, (_, i) => ({ at: 5 + 6 * i, id: cyc[i % 3] })) });
  V.push({ key: 'mix3-every6', klich: Array.from({ length: 3 }, (_, i) => ({ at: 5 + 6 * i, id: cyc[i % 3] })) });
  V.push({ key: 'mix3-spread', klich: [10, 25, 40].map((at, i) => ({ at, id: cyc[i % 3] })) });
  V.push({ key: 'buffs-burst', buff: { kit: ['dice', 'bucket', 'towel'], rule: 'script', plan: [{ id: 'dice', at: 1 }, { id: 'bucket', at: 1 }, { id: 'towel', at: 1 }] } });
  V.push({ key: 'buffs-spread', buff: { kit: ['dice', 'bucket', 'towel'], rule: 'script', plan: [{ id: 'bucket', at: 10 }, { id: 'dice', at: 25 }, { id: 'towel', at: 40 }] } });
  V.push({ key: 'buffs-bot', buff: { kit: ['towel', 'bucket', 'dice'], rule: 'bot' } });
  for (const [from, to] of sets) for (const c of CORES) add(`timing-${c}-${setTag(from)}`, { type: 'timing', cores: [c], seedFrom: from, seedTo: to, variants: V });
}
if (stage === 'replace') add('replace', { type: 'replace', n: 20 });
if (stage === 'skew') {
  const cells = [
    { key: 'natisk:a3', core: 'natisk', id: 'a3', channels: [['axes'], ['ramp'], ['extra:interruptResist'], ['axes', 'ramp'], ['axes', 'ramp', 'extra:interruptResist']] },
    { key: 'natisk:a5', core: 'natisk', id: 'a5', channels: [['axes'], ['ramp'], ['extra:blockPenetration'], ['tag'], ['axes', 'ramp', 'extra:blockPenetration'], ['axes', 'ramp', 'extra:blockPenetration', 'tag']] },
    { key: 'skala:a5', core: 'skala', id: 'a5', channels: [['axes'], ['ramp'], ['extra:blockMitigation'], ['tag'], ['axes', 'ramp', 'extra:blockMitigation'], ['axes', 'ramp', 'extra:blockMitigation', 'tag']] },
    { key: 'zasada:a5', core: 'zasada', id: 'a5', channels: [['axes'], ['extra:dodgeCounter'], ['extra:missCounter'], ['tag'], ['extras'], ['axes', 'extras'], ['axes', 'extras', 'tag']] },
  ];
  for (const [from, to] of sets) add(`skew-${setTag(from)}`, { type: 'skew', cells, seedFrom: from, seedTo: to });
}
if (stage === 'harm') {
  // три вредящих кристалла (п.4): Run-Down (natisk b2), Cling (natisk b4), Fake-In (nalet b1) — по каналам
  const cells = [
    { key: 'natisk:b2', core: 'natisk', id: 'b2', channels: [['axis:stick'], ['axis:distance'], ['axes'], ['tag'], ['axes', 'tag']] },
    { key: 'natisk:b4', core: 'natisk', id: 'b4', channels: [['axis:stick'], ['axis:distance'], ['axes']] },
    { key: 'nalet:b1', core: 'nalet', id: 'b1', channels: [['axes'], ['extra:feintChance'], ['axes', 'extra:feintChance']] },
  ];
  for (const [from, to] of sets) add(`harm-${setTag(from)}`, { type: 'skew', cells, seedFrom: from, seedTo: to });
}
if (stage === 'plate') {
  const plates = [
    { key: 'игровая 5×3 (выход 2.9)', bounds: { x: 2.5, z: 1.5 }, posA: { x: 0.45, z: 1.3 }, posB: { x: -0.65, z: -1.4 } },
    { key: 'большая 12×9 (выход 7.0)', bounds: { x: 6, z: 4.5 }, posA: { x: 0.45, z: 3.5 }, posB: { x: -0.65, z: -3.5 } },
  ];
  for (const [from, to] of sets) for (const c of CORES) add(`plate-${c}-${setTag(from)}`, { type: 'plate', cores: [c], plates, seedFrom: from, seedTo: to });
}
if (stage === 'negbranch') for (const [from, to] of sets) add(`negbranch-${setTag(from)}`, { type: 'negbranch', cores: ['natisk', 'nalet'], branch: 'b', seedFrom: from, seedTo: to });
if (stage === 'builds') {
  // Сборки на 7 кристаллов из трёх граней по 5: «с начала грани», как в игре и в прежних замерах.
  const perms2 = []; for (const x of BR) for (const y of BR) if (x !== y) perms2.push([x, y]);
  const builds = [{ key: 'bare', counts: null }];
  const k = (c) => BR.filter((b) => c[b]).sort((p, q) => c[q] - c[p] || (p < q ? -1 : 1)).map((b) => b + c[b]).join('');
  for (const [x, y] of perms2) builds.push({ key: k({ [x]: 5, [y]: 2 }), counts: { [x]: 5, [y]: 2 } });
  for (const [x, y] of perms2) builds.push({ key: k({ [x]: 4, [y]: 3 }), counts: { [x]: 4, [y]: 3 } });
  for (const z of BR) { const c = {}; for (const b of BR) c[b] = b === z ? 1 : 3; builds.push({ key: k(c), counts: c }); }
  for (const z of BR) { const c = {}; for (const b of BR) c[b] = b === z ? 3 : 2; builds.push({ key: k(c), counts: c }); }
  for (const z of BR) { const c = {}; for (const b of BR) c[b] = b === z ? 5 : 1; builds.push({ key: k(c), counts: c }); }
  for (const [x, y] of perms2) { const z = BR.find((b) => b !== x && b !== y); builds.push({ key: k({ [x]: 4, [y]: 2, [z]: 1 }), counts: { [x]: 4, [y]: 2, [z]: 1 } }); }
  const uniq = new Map(); for (const b of builds) if (!uniq.has(b.key)) uniq.set(b.key, b);
  const list = [...uniq.values()];
  const half = Math.ceil(list.length / 2);
  for (const [from, to] of sets) for (const c of CORES) for (const [hi, chunk] of [list.slice(0, half), list.slice(half)].entries()) add(`builds-${c}-h${hi}-${setTag(from)}`, { type: 'builds', core: c, builds: chunk.some((b) => b.key === 'bare') ? chunk : [list[0], ...chunk], fields: ['bare', 'bot'], seedFrom: from, seedTo: to });
}
if (!jobs.length) { console.error('нет задач для этапа', stage); process.exit(1); }

// ── запуск ───────────────────────────────────────────────────────────────────
const cwd = PROBE_STAGES.has(stage) ? WT : REPO;
if (cwd === WT) { for (const f of ['balance-recon-worker.mjs', 'balance-recon-lib.mjs']) copyFileSync(join(REPO, 'scripts', f), join(WT, 'scripts', f)); }
const worker = join(cwd, 'scripts/balance-recon-worker.mjs');
const todo = jobs.filter((j) => !existsSync(j.job.out));
console.error(`этап ${stage}: задач ${jobs.length}, к запуску ${todo.length}, процессов ${CONC}, cwd=${cwd}`);
let next = 0, running = 0, failed = 0;
await new Promise((resolve) => {
  const pump = () => {
    while (running < CONC && next < todo.length) {
      const j = todo[next++]; running++;
      const p = spawn('node', [worker, JSON.stringify(j.job)], { cwd, stdio: ['ignore', 'ignore', 'pipe'] });
      let err = '';
      p.stderr.on('data', (d) => { err += d; });
      p.on('close', (code) => { running--; if (code !== 0) { failed++; console.error(`ОШИБКА ${j.name} (код ${code})\n${err.slice(-1500)}`); } else console.error(`[${next - running}/${todo.length}] ${j.name} готово`); if (next >= todo.length && running === 0) resolve(); else pump(); });
    }
    if (!todo.length) resolve();
  };
  pump();
});
console.error(failed ? `этап ${stage}: ошибок ${failed}` : `этап ${stage}: всё готово`);
process.exit(failed ? 1 : 0);
