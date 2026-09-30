// crystal-remeasure-worker.mjs — ОДНА ЗАДАЧА ПЕРЕЗАМЕРА КРИСТАЛЛОВ (TZ_crystal_remeasure_v2). Только замер: игровой код не меняется.
//
// ТРЕБУЕТ ПАТЧ `docs/crystal-remeasure/probe/decisions-probe.patch` (счётчик решений в chooseIntentionSpinal через
// globalThis.__PROBE + поле `side` у бойца). Патч живёт ТОЛЬКО в отдельной копии дерева (git worktree), в src/ репозитория не попадает.
// Запуск — через scripts/crystal-remeasure-run.mjs (он ставит копию и гонит задачи параллельно). Вручную:
//   node scripts/crystal-remeasure-worker.mjs '<json задачи>'
//
// ЗАДАЧА (json):
//   kind  'zero'  — голое ядро core против голых foes; зёрна seedFrom..seedTo (noswap=true — без чередования сторон, как «25.07%» прошлых замеров)
//         'solo'  — ядро + ровно ОДИН кристалл (branch a|b|c, idx 1..5), amp = множитель усиления (1 или 3)
//         'build' — ядро + ветка branch, в ней исключён кристалл omit (1..5) или не исключён (omit=null — полная ветка, считает решения по каждому из пяти)
//   core, foes[], seedFrom, seedTo, out (путь .json)
//
// ЧТО ПИШЕТ: на каждого врага — по зёрнам {w, sec, hp, tj} (исход + отпечаток траектории для «бит в бит») и суммы по боям:
//   тело T (вне радиуса 1.45, свободное время, дистанция, скорость, клипы/замахи/попадания, блоки, CATCH, сбив/контра, доли намерений по тикам)
//   решения T (их число, по жёсткой нужде, сколько изменил бы «кристалл убран», условия тегов и переворот выбора тегом).
//
// ОПРЕДЕЛЕНИЯ — те же, что в reflex-sight-controls.mjs / motion-recon.mjs / grani-recon.mjs (тики бойца-игрока, sideId 'player').
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';

const job = JSON.parse(process.argv[2]);
const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load, INSTANT_DT } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const { startProfile, AXIS_IDS } = await load('/src/data/behavior.js');
const { TAG_LEANS } = await load('/src/data/branchThreshold.js');
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const FAR = 1.45; // «вне радиуса удара» — как в reflex-sight-controls.mjs

const n01 = (axes) => Object.fromEntries(AXIS_IDS.map((k) => [k, Math.max(0, Math.min(100, axes[k])) / 100]));
const faceOf = (core, br, idx) => CRYSTALS[core].find((x) => x.id === br).faces[idx - 1];
const tagsOf = (f) => [...(f.conditionals || []), ...(f.effects || [])].filter((t) => TAG_LEANS[t]);
const facesOf = (core, br, idxs) => idxs.map((i) => faceOf(core, br, i));

// УСИЛЕНИЕ ×k — только у ЭТОГО кристалла и только в данных на входе: сдвиги осей, бонусы (рампа силы/прочности и дополнительные), вес наклона тега.
// channel: null — все три канала ×k; 'axes' | 'bonus' | 'lean' — усилен только этот канал, остальные ×1 (разложение «глухого канала»).
function amplified(core, face, k, channel = null) {
  const ka = !channel || channel === 'axes' ? k : 1, kb = !channel || channel === 'bonus' ? k : 1, kl = !channel || channel === 'lean' ? k : 1;
  const f = {
    ...face,
    shifts: (face.shifts || []).map((s) => ({ axis: s.axis, delta: s.delta * ka })),
    statBonus: face.statBonus ? { stat: face.statBonus.stat, pct: face.statBonus.pct * kb } : null,
    extraBonuses: (face.extraBonuses || []).map((e) => ({ stat: e.stat, pct: e.pct * kb })),
  };
  const beh = resolveBehavior(core, [f]);
  beh.leans = (beh.leans || []).map((l) => ({ ...l, w: l.w * kl }));
  return beh;
}

// ── сборка: поведение T, «как будто без кристалла» и подписи ─────────────────
let behT = null;
let cfs = [];
let tagSpecs = [];
if (job.kind === 'zero') {
  behT = null; // голое ядро
} else if (job.kind === 'solo') {
  const face = faceOf(job.core, job.branch, job.idx);
  behT = job.amp && job.amp !== 1 ? amplified(job.core, face, job.amp, job.channel || null) : resolveBehavior(job.core, [face]);
  const base01 = n01(startProfile(job.core));
  cfs = [{ name: 'all', ax01: base01, leans: null }, { name: 'ax', ax01: base01 }, { name: 'ln', leans: null }];
  tagSpecs = tagsOf(face).length ? [{ key: 't', tags: tagsOf(face), flipCf: 'ln' }] : [];
} else if (job.kind === 'build') {
  const all = [1, 2, 3, 4, 5];
  const kept = job.omit ? all.filter((i) => i !== job.omit) : all;
  behT = resolveBehavior(job.core, facesOf(job.core, job.branch, kept));
  if (!job.omit) {
    for (const j of all) {
      const bm = resolveBehavior(job.core, facesOf(job.core, job.branch, all.filter((i) => i !== j)));
      const ax = n01(bm.axes);
      cfs.push({ name: `all:${j}`, ax01: ax, leans: bm.leans }, { name: `ax:${j}`, ax01: ax }, { name: `ln:${j}`, leans: bm.leans });
      const tg = tagsOf(faceOf(job.core, job.branch, j));
      if (tg.length) tagSpecs.push({ key: String(j), tags: tg, flipCf: `ln:${j}` });
    }
  }
} else throw new Error('неизвестный kind ' + job.kind);

globalThis.__PROBE = { on: true, rec: null, cfs, tagSpecs, holds: null };
const P = globalThis.__PROBE;

// ── один бой ─────────────────────────────────────────────────────────────────
function bout(core, foe, seed) {
  const R = { dec: 0, need: 0, chg: {}, tt: {}, tf: {} };
  P.rec = R;
  const m = { n: 0, far: 0, free: 0, dist: 0, distN: 0, spd: 0, clips: 0, swings: 0, hits: 0, dealt: 0, taken: 0, blkT: 0, blkS: 0, readSb: 0, readCt: 0, tj: 0, it: INTENTS.map(() => 0) };
  let prev = null, clipEl = null, wasBlock = false, foeHp = null, meHp = null, prevRead = '';
  const swap = job.noswap ? false : seed % 2 === 0;
  const r = duel({
    seed, coreA: core, coreB: foe, behA: behT, behB: null, swap,
    onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player');
      if (!me) return;
      const f = me.f;
      const fo = alive.find((u) => u !== me);
      const pm = f.group.position;
      if (prev) m.spd += Math.hypot(pm.x - prev.x, pm.z - prev.z) / INSTANT_DT;
      prev = { x: pm.x, z: pm.z };
      m.n++;
      m.tj += (pm.x * 1.3 + pm.z * 0.7) * ((m.n % 89) + 1);
      if (fo) {
        const pf = fo.f.group.position;
        const d = Math.hypot(pm.x - pf.x, pm.z - pf.z);
        if (d >= FAR) m.far++;
        m.dist += d; m.distN++;
        const fh = fo.f.getHp();
        if (foeHp != null && fh < foeHp - 1e-12) { m.hits++; m.dealt += foeHp - fh; }
        foeHp = fh;
      }
      const mh = f.getHp();
      if (meHp != null && mh < meHp - 1e-12) m.taken += meHp - mh;
      meHp = mh;
      const c = f.getClipInfo();
      const blk = f.isBlocking();
      if (!c && !blk && !f.isStaggered() && !f.isExhaling()) m.free++;
      if (c && c.impacts.length) {
        if (clipEl === null || c.elapsed < clipEl - 1e-9) { m.clips++; m.swings += c.impacts.length; }
        clipEl = c.elapsed;
      } else clipEl = null;
      if (blk) m.blkT++;
      if (blk && !wasBlock) m.blkS++;
      wasBlock = blk;
      const ra = f.getReadAction();
      if (ra && ra !== prevRead) { if (ra === 'sbiv') m.readSb++; else m.readCt++; }
      prevRead = ra;
      m.it[INTENTS.indexOf(f.getIntention())]++;
    },
  });
  return { w: r.winner === 'player' ? 1 : 0, sec: r.sec, hp: r.winHp01, capped: r.capped ? 1 : 0, m, R };
}

// ── прогон ───────────────────────────────────────────────────────────────────
const t0 = Date.now();
const out = { job, foes: {} };
for (const foe of job.foes) {
  const rec = { seeds: [], w: [], sec: [], hp: [], tj: [], capped: 0, sum: null };
  const sum = { n: 0, far: 0, free: 0, dist: 0, distN: 0, spd: 0, clips: 0, swings: 0, hits: 0, dealt: 0, taken: 0, blkT: 0, blkS: 0, readSb: 0, readCt: 0, it: INTENTS.map(() => 0), dec: 0, need: 0, chg: {}, tt: {}, tf: {} };
  for (let s = job.seedFrom; s <= job.seedTo; s++) {
    const b = bout(job.core, foe, s);
    rec.seeds.push(s); rec.w.push(b.w); rec.sec.push(b.sec); rec.hp.push(b.hp); rec.tj.push(b.m.tj); rec.capped += b.capped;
    for (const k of ['n', 'far', 'free', 'dist', 'distN', 'spd', 'clips', 'swings', 'hits', 'dealt', 'taken', 'blkT', 'blkS', 'readSb', 'readCt']) sum[k] += b.m[k];
    b.m.it.forEach((v, i) => { sum.it[i] += v; });
    sum.dec += b.R.dec; sum.need += b.R.need;
    for (const k of ['chg', 'tt', 'tf']) for (const [n, v] of Object.entries(b.R[k])) sum[k][n] = (sum[k][n] || 0) + v;
  }
  rec.sum = sum;
  out.foes[foe] = rec;
}
out.ms = Date.now() - t0;
out.bouts = job.foes.length * (job.seedTo - job.seedFrom + 1);
mkdirSync(dirname(job.out), { recursive: true });
writeFileSync(job.out, JSON.stringify(out) + '\n');
await H.server.close();
