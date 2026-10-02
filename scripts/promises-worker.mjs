// promises-worker.mjs — ОДНА ЗАДАЧА РАЗВЕДКИ «ОБЕЩАНИЯ ТЕКСТОВ» (TZ_promises_v1, шаг 1). Только замер: игровой код не меняется.
//
// ТРЕБУЕТ КОПИЮ ДЕРЕВА С ЗОНДОМ (scripts/promises-wt.py): зонд globalThis.__PR.* вставлен в КОПИЮ buildFighter.js, в src/ репозитория его нет.
// Запуск — через scripts/promises-run.mjs. Вручную: node scripts/promises-worker.mjs '<json задачи>'
//
// ЗАДАЧА (json): { core, mode, branch, idx, foes[], seedFrom, seedTo, out }
//   mode 'bare'  — голое ядро (без кристалла)
//        'solo'  — ядро + ровно ОДИН кристалл (branch a|b|c, idx 1..5)
//        'axes'  — то же, но только сдвиги осей кристалла (склонности выбора выключены)
//        'leans' — то же, но только склонности выбора (оси остаются голыми)
//        'full'  — ядро + ВСЯ ветка branch (пять кристаллов; это Ц2)
// ЧТО ПИШЕТ: суммы по боям игрока против каждого врага (голого ядра): запуски ударов, контакты и их урон, финты / «клюнул» / расплата, уворот,
// окна «враг открыт», «остаётся вплотную после обмена», «враг затих», расход сил врага под давлением, доли намерений.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openHarness } from './lib/bout-harness.mjs';

const job = JSON.parse(process.argv[2]);
const H = await openHarness();
const { duel, resolveBehavior, load, INSTANT_DT } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const { startProfile } = await load('/src/data/behavior.js');
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const REACH = 1.9; // «в радиусе удара» — FAR из balance-recon / STRIKE
const CLOSE = 1.6; // «вплотную»
const faceOf = (core, br, idx) => CRYSTALS[core].find((x) => x.id === br).faces[idx - 1];

let behT = null;
if (job.mode === 'full') {
  behT = resolveBehavior(job.core, [1, 2, 3, 4, 5].map((i) => faceOf(job.core, job.branch, i)));
} else if (job.mode !== 'bare') {
  const face = faceOf(job.core, job.branch, job.idx);
  behT = resolveBehavior(job.core, [face]);
  if (job.mode === 'axes') behT = { ...behT, leans: [] };
  if (job.mode === 'leans') behT = { ...behT, axes: resolveBehavior(job.core).axes };
}

let R = null;
globalThis.__PR = {
  contact: (t, c, sd, bonus, fp, rip, chg, pen) => R.contacts.push({ t, dm: c.dmgMult || 0, sd, bonus, fp: !!fp, rip: rip || 0, chg: chg || 0, pen: pen || 0 }),
  launch: (t, atk) => R.launches.push({ t, dur: atk.dur, n: atk.impacts ? atk.impacts.length : (atk.impact >= 0 ? 1 : 0) }),
  feint: (t) => R.feints.push(t),
  bait: (t) => R.baits.push(t),
  payoff: (t) => R.payoffs.push(t),
  dodge: (t, amt) => R.dodges.push({ t, amt }),
};

const sum0 = () => ({
  bouts: 0, w: 0, sec: 0, secFirst: 0, secLast: 0,
  launches: 0, lFirst: 0, lLast: 0, lN: [0, 0, 0, 0], lGapSum: 0, lGapN: 0,
  reachSteps: 0, reachLaunches: 0,
  contacts: 0, sd: 0, sdNorm: 0, bonus: 0, pen: 0,
  ripN: 0, ripBonus: 0, ripSd: 0, ripDN: 0, ripDBonus: 0, ripDSd: 0, fpN: 0, fpBonus: 0, fpPen: 0, fpSd: 0, nfpN: 0, nfpPen: 0, nfpSd: 0, punchN: 0, punchSdNorm: 0,
  feints: 0, baits: 0, payoffs: 0, dodges: 0, dodgeRip: 0,
  foeHits: 0, foeDealt: 0, taken: 0,
  openEntries: 0, openResponded: 0,
  afterSteps: 0, afterClose: 0,
  quietSteps: 0, quietAttack: 0, quietClose: 0, quietLaunch: 0,
  pressSteps: 0, foeRegen: 0, foeStamSum: 0, foeStamN: 0,
  far: 0, free: 0, steps: 0, clipsImp: 0, it: INTENTS.map(() => 0), blkS: 0,
});

function bout(core, foe, seed, S) {
  R = { contacts: [], launches: [], feints: [], baits: [], payoffs: [], dodges: [] };
  const swap = seed % 2 === 0;
  let foeHp = null, meHp = null, prevFoePhaseOpen = false, openAt = -1, openDone = true, foeLastAtk = -99, prevFoeStam = null;
  let lastEnd = -99, nLaunchSeen = 0, wasBlock = false;
  const r = duel({
    seed, coreA: core, coreB: foe, behA: behT, behB: null, swap,
    onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player');
      if (!me) return;
      const f = me.f, fo = alive.find((u) => u !== me);
      S.steps++;
      const pm = f.group.position;
      let d = 99;
      if (fo) {
        const pf = fo.f.group.position;
        d = Math.hypot(pm.x - pf.x, pm.z - pf.z);
        if (d >= 1.45) S.far++;
        const fh = fo.f.getHp();
        if (foeHp != null && fh < foeHp - 1e-12) { S.foeHits++; S.foeDealt += foeHp - fh; }
        foeHp = fh;
        // враг открыт (отдача / сбив) — отвечает ли игрок ударом за 0.6 с
        const ph = fo.f.getActionPhase();
        const open = ph === 'recovery' || ph === 'stagger';
        if (open && !prevFoePhaseOpen) { S.openEntries++; openAt = now; openDone = false; }
        prevFoePhaseOpen = open;
        if (!openDone && R.launches.length && R.launches[R.launches.length - 1].t >= openAt && R.launches[R.launches.length - 1].t <= openAt + 0.6) { S.openResponded++; openDone = true; }
        if (!openDone && now > openAt + 0.6) openDone = true;
        // «враг затих»: не бил дольше 2 с
        const fc = fo.f.getClipInfo();
        if (fc && fc.impacts.length) foeLastAtk = now;
        const quiet = now >= 2 && now - foeLastAtk >= 2.0;
        const myc = f.getClipInfo();
        if (quiet) { S.quietSteps++; if (myc && myc.impacts.length) S.quietAttack++; if (d <= CLOSE) S.quietClose++; }
        // расход сил врага под давлением
        const fs = fo.f.getStamina();
        if (prevFoeStam != null && d <= CLOSE) { S.pressSteps++; if (fs > prevFoeStam) S.foeRegen += fs - prevFoeStam; }
        prevFoeStam = fs;
        S.foeStamSum += fo.f.getStamina01 ? fo.f.getStamina01() : 0; S.foeStamN++;
      }
      const mh = f.getHp();
      if (meHp != null && mh < meHp - 1e-12) S.taken += meHp - mh;
      meHp = mh;
      if (d <= REACH) S.reachSteps++;
      // новые запуски ударов
      while (nLaunchSeen < R.launches.length) {
        const L = R.launches[nLaunchSeen++];
        if (d <= REACH) S.reachLaunches++;
        if (now >= 2 && now - foeLastAtk >= 2.0) S.quietLaunch++;
        lastEnd = L.t + L.dur;
      }
      // «остаётся вплотную после обмена»: 1.5 с после конца удара
      if (now - lastEnd >= 0 && now - lastEnd < 1.5) { S.afterSteps++; if (d <= CLOSE) S.afterClose++; }
      const blk = f.isBlocking(); if (blk && !wasBlock) S.blkS++; wasBlock = blk;
      const ci = f.getClipInfo(); if (!ci && !blk && !f.isStaggered() && !f.isExhaling()) S.free++;
      S.it[INTENTS.indexOf(f.getIntention())]++;
    },
  });
  S.bouts++; S.w += r.winner === 'player' ? 1 : 0; S.sec += r.sec; S.secFirst += r.sec / 3; S.secLast += r.sec / 3;
  // запуски: треть боя
  const t1 = r.sec / 3, t2 = 2 * r.sec / 3;
  let prevT = null;
  for (const L of R.launches) {
    S.launches++; S.lN[Math.min(3, L.n)]++;
    if (L.t < t1) S.lFirst++; else if (L.t >= t2) S.lLast++;
    if (prevT != null && L.t - prevT < 6) { S.lGapSum += L.t - prevT; S.lGapN++; }
    prevT = L.t;
  }
  const dm = job.dmPunch;
  for (const c of R.contacts) {
    S.contacts++; S.sd += c.sd * (1 + c.bonus); S.sdNorm += c.dm ? c.sd / c.dm : 0; S.bonus += c.bonus; S.pen += c.pen;
    if (c.dm && Math.abs(c.dm - dm) < 1e-9) { S.punchN++; S.punchSdNorm += c.sd / c.dm; }
    if (c.rip) { S.ripN++; S.ripBonus += c.rip; S.ripSd += c.sd * (1 + c.bonus); }
    // ответ именно после УВОРОТА (окно 1.5 с, бонус = дарёный уворотом sb.dodgeCounter) — отдельно от ответов на промах врага / блок
    if (c.rip && R.dodges.some((d) => d.amt > 0 && c.t >= d.t && c.t <= d.t + 1.6 && Math.abs(c.rip - d.amt) < 1e-9)) { S.ripDN++; S.ripDBonus += c.rip; S.ripDSd += c.sd * (1 + c.bonus); }
    if (c.fp) { S.fpN++; S.fpBonus += c.bonus; S.fpPen += c.pen; S.fpSd += c.sd * (1 + c.bonus); }
    else { S.nfpN++; S.nfpPen += c.pen; S.nfpSd += c.sd * (1 + c.bonus); }
  }
  S.feints += R.feints.length; S.baits += R.baits.length; S.payoffs += R.payoffs.length; S.dodges += R.dodges.length;
  S.dodgeRip += R.dodges.filter((x) => x.amt > 0).length;
}

const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
job.dmPunch = COMBAT_BALANCE.moveMult.punch;
const out = { job, foes: {} };
const t0 = Date.now();
for (const foe of job.foes) {
  const S = sum0();
  for (let s = job.seedFrom; s <= job.seedTo; s++) bout(job.core, foe, s, S);
  out.foes[foe] = S;
}
out.ms = Date.now() - t0;
mkdirSync(dirname(job.out), { recursive: true });
writeFileSync(job.out, JSON.stringify(out) + '\n');
await H.server.close();
