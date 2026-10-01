// balance-fix-worker.mjs — ОДНА ЗАДАЧА ЗАМЕРА БАЛАНСА (TZ_balance_fix_v2). Только замер; запускается в копии дерева с зондом (balance-fix-wt.py)
// или в самом репозитории (тогда виды нужд не считаются). Бой — мгновенный (scene/instantBout.js) через scripts/lib/bout-harness.mjs.
// ЗАДАЧА — json в argv[2]: { type, out, ... }
//   naked   { pairs:[[a,b]..], seedFrom, seedTo, swap:'alt'|'none' } — голые ядра; исходы, длины, телесные метрики игрока, виды нужд
//   spec    { core, spec, foes:[..], foeField:'bare'|'bot', seedFrom, seedTo } — ядро со сборкой (spec = {counts}|{ids}|null) против врагов; парный к голому
// Стороны: 'player' (coreA) и 'foe'. Стороны плиты чередуются по зерну: swap = зерно чётное (как в перезамерах).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';

const job = JSON.parse(process.argv[2]);
const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load, INSTANT_DT } = H;
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const FAR = 1.45;
const KINDS = ['stamina', 'swing', 'charge'];
const BF = (globalThis.__BF = { on: false, onDecision: () => {} });

function makeTicker() {
  const s = { n: 0, far: 0, free: 0, sp: 0, dist: 0, dealt: 0, taken: 0, blk: 0, stamLow: 0, it: INTENTS.map(() => 0) };
  let prev = null, prevFoe = null, prevMe = null, lastFoe = null, lastMe = null;
  return {
    s,
    step(now, alive) {
      const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
      const fo = alive.find((u) => u !== me); const f = me.f; const p = f.group.position;
      s.n++;
      if (prev) s.sp += Math.hypot(p.x - prev.x, p.z - prev.z) / INSTANT_DT;
      prev = { x: p.x, z: p.z };
      if (fo) { const d = Math.hypot(p.x - fo.f.group.position.x, p.z - fo.f.group.position.z); s.dist += d; if (d >= FAR) s.far++; }
      if (!f.getClipInfo() && !f.isBlocking() && !f.isStaggered() && !f.isExhaling()) s.free++;
      if (f.isBlocking()) s.blk++;
      if (f.getStamina01() < 0.22) s.stamLow++;
      const my = f.getHp(), fh = fo ? fo.f.getHp() : null;
      if (prevFoe != null && fh != null && fh < prevFoe) s.dealt += prevFoe - fh;
      if (prevMe != null && my < prevMe) s.taken += prevMe - my;
      prevFoe = fh; prevMe = my; if (fh != null) lastFoe = fh; lastMe = my;
      const ii = INTENTS.indexOf(f.getIntention()); if (ii >= 0) s.it[ii]++;
    },
    end(r) { if (r.winner === 'player' && lastFoe != null) s.dealt += lastFoe; else if (r.winner !== 'player' && lastMe != null) s.taken += lastMe; },
  };
}
const addSums = (a, b) => { for (const k of Object.keys(b)) { if (Array.isArray(b[k])) b[k].forEach((v, i) => { a[k][i] += v; }); else a[k] += b[k]; } return a; };
const zero = () => makeTicker().s;
const swapOf = (seed, mode = 'alt') => (mode === 'none' ? false : seed % 2 === 0);

const out = { job, startedAt: new Date().toISOString() };
const t0 = Date.now();
if (job.type === 'naked') {
  out.pairs = {};
  for (const [a, b] of job.pairs || CORE_IDS.flatMap((x) => CORE_IDS.map((y) => [x, y]))) {
    const rec = { w: [], sec: [], capped: 0, sums: zero(), dec: 0, need: { stamina: 0, swing: 0, charge: 0 }, needAct: {} };
    BF.on = !!job.need;
    BF.onDecision = (kind, act) => { rec.dec++; if (kind) { rec.need[kind]++; const k = kind + '>' + act; rec.needAct[k] = (rec.needAct[k] || 0) + 1; } };
    for (let s = job.seedFrom; s <= job.seedTo; s++) {
      const tk = makeTicker();
      const r = duel({ seed: s, coreA: a, coreB: b, swap: swapOf(s, job.swap), onStep: (now, alive) => tk.step(now, alive) });
      tk.end(r); addSums(rec.sums, tk.s);
      rec.w.push(r.winner === 'player' ? 1 : 0); rec.sec.push(Math.round(r.sec * 1e4) / 1e4); if (r.capped) rec.capped++;
    }
    BF.on = false;
    out.pairs[`${a}|${b}`] = rec;
  }
}
if (job.type === 'spec') {
  // spec { core, builds:[{name, spec:[[ветка, сколько]..]}|{name, spec:null}], field:'bare'|'bot', seedFrom, seedTo }
  // Сборка зажигает кристаллы ветки СНИЗУ ВВЕРХ (1..k). 'bare' — четыре голых ядра (в т.ч. своё); 'bot' — бот по правилу foeCompose (ядро и число N случайны).
  const { CRYSTALS } = await load('/src/data/upgradeData.js');
  const { composeFoe } = await load('/src/data/foeCompose.js');
  const mulberry = (a) => () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const facesOf = (core, spec) => (spec || []).flatMap(([br, k]) => CRYSTALS[core].find((x) => x.id === br).faces.slice(0, k));
  out.builds = {};
  const foeFor = (seed) => {
    if (job.field === 'bare') return null;
    const rnd = mulberry(seed * 7919 + 13);
    const n = Math.floor(rnd() * 8); // N равномерно 0…7
    const f = composeFoe({ litCount: n, rnd });
    return { coreId: f.coreId, behavior: f.behavior, n };
  };
  for (const b of job.builds) {
    const beh = b.spec ? resolveBehavior(job.core, facesOf(job.core, b.spec)) : null;
    const rec = { w: [], sec: [], capped: 0, foes: [] };
    for (let sd = job.seedFrom; sd <= job.seedTo; sd++) {
      const foeList = job.field === 'bare' ? CORE_IDS : [null];
      for (let fi = 0; fi < foeList.length; fi++) {
        const seed = sd * 8 + fi; // независимые зёрна по врагам
        const bot = foeFor(sd);
        const coreB = bot ? bot.coreId : foeList[fi];
        const r = duel({ seed, coreA: job.core, coreB, behA: beh, behB: bot ? bot.behavior : null, swap: swapOf(sd, job.swap) });
        rec.w.push(r.winner === 'player' ? 1 : 0); rec.sec.push(Math.round(r.sec * 1e4) / 1e4); if (r.capped) rec.capped++;
        rec.foes.push(coreB);
      }
    }
    out.builds[b.name] = rec;
  }
}
out.elapsedSec = (Date.now() - t0) / 1000;
mkdirSync(dirname(job.out), { recursive: true });
writeFileSync(job.out, JSON.stringify(out));
console.log('готово', job.type, job.out, out.elapsedSec.toFixed(1) + 's');
await H.server.close();
