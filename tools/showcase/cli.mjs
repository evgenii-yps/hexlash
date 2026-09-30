#!/usr/bin/env node
// Командная строка рендера ролика.
//
//   node tools/showcase/cli.mjs build                 весь ролик: все планы → кадры → mp4
//   node tools/showcase/cli.mjs plan <id> [опции]     один план (или его диапазон)
//   node tools/showcase/cli.mjs verify <id>           два независимых рендера + сверка кадров
//   node tools/showcase/cli.mjs guard [ref]           снимки игры «до и после»: ref (по умолчанию origin/main) против рабочей копии
//
// Опции: --range a-b (кадры плана)  --size 1280x720  --every 2 (каждый n-й кадр; 2 = черновик 30 кадр/с)
//        --out <папка>
import { parseArgs } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { startServer } from './lib/server.mjs';
import { openSession, warm } from './lib/session.mjs';
import { encode } from './lib/ffmpeg.mjs';
import { plans, FPS } from './plan/trailer.plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { values: o, positionals: [cmd = 'help', planId] } = parseArgs({
  allowPositionals: true,
  options: { range: { type: 'string' }, size: { type: 'string', default: '1280x720' }, every: { type: 'string', default: '1' }, out: { type: 'string' } },
});
const size = o.size.split('x').map(Number);
const every = Number(o.every);
const outRoot = o.out || path.join(HERE, 'out');
const pick = (id) => { const p = plans.find((x) => x.id === id); if (!p) throw new Error('нет плана ' + id + '; есть: ' + plans.map((x) => x.id).join(', ')); return p; };

async function renderPlan(base, plan, dir, { from = 0, to = plan.len } = {}) {
  await warm(base, [plan.route], size);
  console.log(`▶ ${plan.id} [${from}..${to}) ${size.join('×')} каждый ${every}-й кадр`);
  const t0 = Date.now();
  const s = await openSession({ base, plan, size });
  const hashes = await s.run({ outDir: dir, from, to, every, onFrame: (f, n) => { if (f % 30 === 0) process.stdout.write(`  кадр ${f}/${n}\r`); } });
  await s.close();
  console.log(`  готово за ${((Date.now() - t0) / 1000).toFixed(0)} с                `);
  return hashes;
}

import { execFileSync } from 'node:child_process';
import { symlinkSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { REPO } from './lib/server.mjs';

// Контрольные снимки ИГРЫ как она есть (без режиссёра и без скрытия интерфейса).
// Делаются один раз на эталоне (ref) и один раз на рабочей копии; обвязка — одна и
// та же, поэтому расхождение возможно только от изменений в игре.
const GUARD_SCENES = [['home', '/play/home'], ['gate', '/play/gate'], ['forge', '/play/pve']];
const GUARD_LAYOUTS = [[390, 844], [844, 390], [1280, 720], [1920, 1080]];
async function shootAll(root, port) {
  const s = await startServer({ root, port });
  const hashes = {};
  try {
    await warm(s.base, GUARD_SCENES.map((x) => x[1]));
    for (const [id, route] of GUARD_SCENES) for (const lay of GUARD_LAYOUTS) {
      const sess = await openSession({ base: s.base, plan: { route, align: 150, world: { roster: [{ callsign: 'HAWK', core: 'natisk' }, { callsign: 'CINDER', core: 'skala' }, { callsign: 'ASH', core: 'zasada' }] } }, size: lay, log: () => {} });
      await sess.pump(30);
      hashes[`${id}@${lay.join('x')}`] = createHash('md5').update(await sess.snapshot()).digest('hex').slice(0, 12);
      await sess.close();
      process.stdout.write(`  ${id}@${lay.join('x')}\r`);
    }
  } finally { await s.stop(); }
  return hashes;
}
async function guard(ref) {
  const wt = path.join(HERE, '.cache/ref-worktree');
  rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['-C', REPO, 'worktree', 'prune']);
  execFileSync('git', ['-C', REPO, 'worktree', 'add', '--detach', wt, ref], { stdio: 'ignore' });
  symlinkSync(path.join(REPO, 'node_modules'), path.join(wt, 'node_modules'));
  try {
    console.log('▶ эталон', ref, execFileSync('git', ['-C', wt, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim());
    const A = await shootAll(wt, 5198);
    console.log('▶ рабочая копия', execFileSync('git', ['-C', REPO, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim());
    const B = await shootAll(REPO, 5199);
    const keys = Object.keys(A); const bad = keys.filter((k) => A[k] !== B[k]);
    for (const k of keys) console.log(`  ${A[k] === B[k] ? '✓' : '✗'} ${k}  ${A[k]} ${B[k]}`);
    console.log(bad.length ? `✗ разошлись: ${bad.length} из ${keys.length}` : `✓ все ${keys.length} снимков совпали`);
    process.exitCode = bad.length ? 1 : 0;
  } finally {
    rmSync(path.join(wt, 'node_modules'), { force: true });
    execFileSync('git', ['-C', REPO, 'worktree', 'remove', '--force', wt], { stdio: 'ignore' });
  }
}

const srv = cmd === 'guard' ? { base: '', stop: async () => {} } : await startServer();
try {
  if (cmd === 'plan') {
    const plan = pick(planId);
    const [a, b] = o.range ? o.range.split('-').map(Number) : [0, plan.len];
    const dir = path.join(outRoot, plan.id, 'frames');
    await renderPlan(srv.base, plan, dir, { from: a, to: b });
    const out = path.join(outRoot, plan.id, `${plan.id}${o.range ? `_${a}-${b}` : ''}.mp4`);
    encode({ frames: path.join(dir, '%05d.png'), out, fps: FPS / every });
    console.log('  →', out);
  } else if (cmd === 'verify') {
    const plan = pick(planId);
    const h = [];
    for (const tag of ['run-a', 'run-b']) h.push(await renderPlan(srv.base, plan, path.join(outRoot, plan.id, tag), {}));
    const keys = Object.keys(h[0]);
    const bad = keys.filter((k) => h[0][k] !== h[1][k]);
    console.log(bad.length === 0 ? `✓ ${keys.length} кадров совпали побайтно` : `✗ расхождений: ${bad.length} из ${keys.length}, первый кадр ${bad[0]}`);
    process.exitCode = bad.length ? 1 : 0;
  } else if (cmd === 'build') {
    for (const plan of plans) {
      const dir = path.join(outRoot, plan.id, 'frames');
      await renderPlan(srv.base, plan, dir, {});
      encode({ frames: path.join(dir, '%05d.png'), out: path.join(outRoot, plan.id, `${plan.id}.mp4`), fps: FPS / every });
    }
  } else if (cmd === 'guard') {
    await guard(planId || 'origin/main');
  } else {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 10).join('\n'));
  }
} finally { await srv.stop(); }
