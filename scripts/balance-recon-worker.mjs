// balance-recon-worker.mjs — ОДНА ЗАДАЧА РАЗВЕДКИ БАЛАНСА (TZ_balance_recon_v1). Игровой код не трогает.
// Бой считается мгновенным прогоном (scene/instantBout.js) через общий стенд scripts/lib/bout-harness.mjs: тот же боец, то же поле, те же числа,
// точки выхода как в игре, зерно зажато mulberry32, мозг спинной. Своей арифметики боя здесь нет.
//
// ЗАДАЧА — json в argv[2]: { type, out, ... }. Типы:
//   naked     4×4 голых ядра: исход, длина, телесные метрики игрока (п.3)
//   builds    сборки на 7 кристаллов против двух полей (п.10)
//   need      доля решений, принятых жёсткой нуждой, по видам нужды (п.1)            ← ТРЕБУЕТ зонд need-probe.patch (копия дерева)
//   gap       запас очков вокруг наклона тега (пп.6а, 8)                               ← ТРЕБУЕТ зонд
//   klichwin  клич в окне: силы, урон, решения (пп.11, 12)                             ← ТРЕБУЕТ зонд
//   buff      баффы по схеме бота, по отдельности и вместе с кличем (п.13)
//   combo     клич + бафф на одном бойце одновременно (п.13)
//   timing    схемы использования зарядов: всё сразу / распределить (п.14)
//   replace   второй клич заменяет первый (п.14)                                       ← ТРЕБУЕТ зонд
//   skew      разложение четырёх перекосов по каналам (п.7)
//   negbranch две грани MIND с отрицательным сдвигом: по каналам (п.9)
// Стороны: T — игрок ('player', coreA), foe — 'foe'. Стороны плиты чередуются по зерну (swap = seed чётный), как в перезамере.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openHarness, seedRandom } from './lib/bout-harness.mjs';
import { CORES, INTENTS, mulberry32, BR } from './balance-recon-lib.mjs';

const job = JSON.parse(process.argv[2]);
const H = await openHarness();
const { duel, CORE_IDS, resolveBehavior, load, INSTANT_DT, strike } = H;
const { CRYSTALS } = await load('/src/data/upgradeData.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const { KLICH_BALANCE, KLICH_IDS } = await load('/src/data/klichBalance.js');
const { BUFF_BALANCE, rollDie } = await load('/src/data/buffBalance.js');
const { buildTree } = await load('/src/data/upgradeTree.js');
const { randomLitIds } = await load('/src/data/foeCompose.js');
const CO = COMBAT_BALANCE.collapse;
const P = (globalThis.__BR = { on: false });

// ── сборки ───────────────────────────────────────────────────────────────────
const facetOf = (core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
/** ids вида 'a1' → кристаллы в порядке дерева (ветви a,b,c; шаги по возрастанию) — так их кладёт buildTree. */
function facetsByIds(core, ids) {
  const sorted = [...ids].sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : Number(x.slice(1)) - Number(y.slice(1))));
  return sorted.map((id) => facetOf(core, id[0], Number(id.slice(1))));
}
function idsByCounts(counts) { const ids = []; for (const b of BR) for (let j = 1; j <= (counts[b] || 0); j++) ids.push(b + j); return ids; }
/** spec: null (голое) | { ids } | { counts } [+ axes: переопределение осей] */
function behOf(core, spec) {
  if (!spec) return resolveBehavior(core);
  const ids = spec.ids || (spec.counts ? idsByCounts(spec.counts) : []);
  const beh = resolveBehavior(core, facetsByIds(core, ids));
  if (spec.axes) Object.assign(beh.axes, spec.axes);
  return beh;
}
/** Бот «как в турнире»: число кристаллов N на сторону — равномерно botFacetsMin..botFacetsMax, кристаллы — случайные из 15 (foeCompose.randomLitIds → buildTree). */
function botBehavior(foeCore, seed, fixedN = null) {
  const rnd = mulberry32(seed * 1000003 + CORES.indexOf(foeCore) * 7919 + 17);
  const span = CO.botFacetsMax - CO.botFacetsMin + 1;
  const n = fixedN != null ? fixedN : CO.botFacetsMin + Math.floor(rnd() * span);
  const tree = buildTree(foeCore, randomLitIds(foeCore, n, rnd)) || CRYSTALS[foeCore];
  const lit = [];
  for (const cr of tree) for (const f of cr.faces) if (f.state === 'lit') lit.push(f);
  return { beh: resolveBehavior(foeCore, lit), n: lit.length };
}
const foeBehFor = (field, foe, seed) => {
  if (field === 'bot') return botBehavior(foe, seed).beh;
  if (field === 'bot7') return botBehavior(foe, seed, 7).beh;
  return null; // голое
};

// ── телесный счётчик: метрики бойца-игрока по тикам (определения как в reflex-sight-controls.mjs / motion-recon.mjs) ─────
function makeTicker(filter = null) {
  const s = { n: 0, far: 0, free: 0, sp: 0, dist: 0, distN: 0, stam: 0, stamLow: 0, swings: 0, dealt: 0, taken: 0, blk: 0, it: INTENTS.map(() => 0) };
  let prev = null, prevPhase = 'neutral', prevFoe = null, prevMe = null, lastFoe = null, lastMe = null;
  return {
    s,
    step(now, alive) {
      const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
      if (filter && !filter(now)) { prev = { x: me.f.group.position.x, z: me.f.group.position.z }; return; }
      const fo = alive.find((u) => u !== me); const f = me.f; const p = f.group.position;
      s.n++;
      if (prev) s.sp += Math.hypot(p.x - prev.x, p.z - prev.z) / INSTANT_DT;
      prev = { x: p.x, z: p.z };
      if (fo) { const d = Math.hypot(p.x - fo.f.group.position.x, p.z - fo.f.group.position.z); s.dist += d; s.distN++; if (d >= 1.45) s.far++; }
      if (!f.getClipInfo() && !f.isBlocking() && !f.isStaggered() && !f.isExhaling()) s.free++;
      if (f.isBlocking()) s.blk++;
      const st = f.getStamina01(); s.stam += st; if (st < 0.22) s.stamLow++;
      const ph = f.getActionPhase(); if ((ph === 'windup' || ph === 'commit') && !(prevPhase === 'windup' || prevPhase === 'commit')) s.swings++; prevPhase = ph;
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
const zeroSums = () => makeTicker().s;
const swapOf = (seed, mode = 'alt') => (mode === 'none' ? false : seed % 2 === 0);

const t0 = Date.now();
const out = { job, startedAt: new Date().toISOString() };

// ═════════════════════════════════════════════════════════════════════════════
if (job.type === 'naked') {
  // job: { seedFrom, seedTo, swap: 'alt'|'none', pairs?: [[a,b]...] }
  const pairs = job.pairs || CORE_IDS.flatMap((a) => CORE_IDS.map((b) => [a, b]));
  out.pairs = {};
  for (const [a, b] of pairs) {
    const rec = { w: [], sec: [], capped: 0, sums: zeroSums() };
    for (let s = job.seedFrom; s <= job.seedTo; s++) {
      const tk = makeTicker();
      const r = duel({ seed: s, coreA: a, coreB: b, swap: swapOf(s, job.swap), onStep: (now, alive) => tk.step(now, alive) });
      tk.end(r); addSums(rec.sums, tk.s);
      rec.w.push(r.winner === 'player' ? 1 : 0); rec.sec.push(Math.round(r.sec * 1e4) / 1e4); if (r.capped) rec.capped++;
    }
    out.pairs[`${a}|${b}`] = rec;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'builds') {
  // job: { core, builds:[{key, counts|ids}], fields:['bare','bot'], seedFrom, seedTo }
  out.builds = {};
  for (const bd of job.builds) {
    const beh = behOf(job.core, bd.counts || bd.ids ? bd : null);
    out.builds[bd.key] = {};
    for (const field of job.fields) {
      const rec = { foes: {} };
      for (const foe of CORE_IDS) {
        const w = [], sec = [];
        for (let s = job.seedFrom; s <= job.seedTo; s++) {
          const r = duel({ seed: s, coreA: job.core, coreB: foe, behA: beh, behB: foeBehFor(field, foe, s), swap: swapOf(s) });
          w.push(r.winner === 'player' ? 1 : 0); sec.push(Math.round(r.sec * 10) / 10);
        }
        rec.foes[foe] = { w: w.join(''), sec };
      }
      out.builds[bd.key][field] = rec;
    }
    process.stderr.write(`builds ${job.core} ${bd.key} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'need') {
  // job: { cores, seedFrom, seedTo, variants:[{key, axes?}] }
  out.cores = {};
  for (const core of job.cores) {
    out.cores[core] = {};
    for (const v of job.variants) {
      const beh = behOf(core, v.axes ? { axes: v.axes } : null);
      const R = { n: 0, need: 0, kind: { stam: 0, swing: 0, charge: 0 }, actByKind: { stam: {}, swing: {}, charge: {} }, override: { stam: 0, swing: 0, charge: 0 },
        actPlain: {}, actAll: {}, threat: 0, reach: 0, threatReach: 0, swingCond: 0, gateOpen: 0, stamLow: 0, stamSum: 0, chargeCond: 0, w: [], sec: [], bouts: 0, rangeSum: 0, distSum: 0, distN: 0 };
      P.on = true;
      P.onDecision = (c) => {
        const { self, foe, memory, fight, need, kind, act, plain } = c;
        const a = self.ax01;
        R.n++;
        const threat = memory.some((e) => e.type === 'attack' && fight.t - e.t < 1.5);
        const inReach = !!(foe.has && foe.dist < self.range + 0.8);
        if (threat) R.threat++;
        if (inReach) R.reach++;
        if (threat && inReach) R.threatReach++;
        if (a.counter > 0.55) R.gateOpen++;
        if (threat && inReach && a.counter > 0.55) R.swingCond++;
        if (self.stamina01 < 0.22) R.stamLow++;
        R.stamSum += self.stamina01;
        if (self.charge01 >= 0.85 && foe.inStrike) R.chargeCond++;
        R.rangeSum += self.range; if (foe.has) { R.distSum += foe.dist; R.distN++; }
        R.actAll[act] = (R.actAll[act] || 0) + 1;
        if (need) { R.need++; R.kind[kind]++; R.actByKind[kind][act] = (R.actByKind[kind][act] || 0) + 1; if (act !== plain) R.override[kind]++; }
        else R.actPlain[act] = (R.actPlain[act] || 0) + 1;
      };
      for (const foe of CORE_IDS) for (let s = job.seedFrom; s <= job.seedTo; s++) {
        const r = duel({ seed: s, coreA: core, coreB: foe, behA: beh, swap: swapOf(s) });
        R.w.push(r.winner === 'player' ? 1 : 0); R.sec.push(Math.round(r.sec * 1e3) / 1e3); R.bouts++;
      }
      P.on = false; P.onDecision = null;
      out.cores[core][v.key] = R;
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'gap') {
  // job: { cells:[{key, core, ids:[..], tag}], seedFrom, seedTo }
  const order = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
  const argmax = (s) => { let best = order[0]; for (const id of order) if (s[id] > s[best]) best = id; return best; };
  out.cells = {};
  for (const cell of job.cells) {
    const beh = behOf(cell.core, { ids: cell.ids });
    const R = { dec: 0, needDec: 0, on: 0, onNoNeed: 0, isLeader: 0, flip: 0, curIsLean: 0, gaps: [], margins: [], tagIntent: null, w: [], byLeaderWhenNot: {}, shareOfLean: 0 };
    P.on = true;
    P.onDecision = (c) => {
      R.dec++;
      if (c.need) R.needDec++;
      const sc = c.plainScores; if (!sc) return;
      for (const f of sc.fired) {
        if (f.tag !== cell.tag) continue;
        if (!f.on) continue;
        R.on++; R.tagIntent = f.i; R.tagW = f.w;
        if (c.need) continue; // решила жёсткая нужда — наклон не при деле
        R.onNoNeed++;
        const s = sc.s; const lead = argmax(s);
        if (lead === f.i) { R.isLeader++; let sec = -Infinity; for (const id of order) if (id !== lead && s[id] > sec) sec = s[id]; R.margins.push(Math.round((s[lead] - sec) * 1e4) / 1e4); }
        const s2 = { ...s }; s2[f.i] -= f.w; if (argmax(s2) !== lead) R.flip++;
        else if (lead !== f.i) { R.gaps.push(Math.round((s[lead] - s[f.i]) * 1e4) / 1e4); R.byLeaderWhenNot[lead] = (R.byLeaderWhenNot[lead] || 0) + 1; }
        if (c.self.current === f.i) R.curIsLean++;
      }
    };
    for (const foe of CORE_IDS) for (let s = job.seedFrom; s <= job.seedTo; s++) {
      const r = duel({ seed: s, coreA: cell.core, coreB: foe, behA: beh, swap: swapOf(s) });
      R.w.push(r.winner === 'player' ? 1 : 0);
    }
    P.on = false; P.onDecision = null;
    out.cells[cell.key] = R;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'klichwin') {
  // job: { cores, trigger:'t5'|'hp20'|'hp50', modes:['none','push','fallback','hold'], seedFrom, seedTo, win:8, buildSpec? }
  const WIN = job.win || (KLICH_BALANCE.holdSec + KLICH_BALANCE.fadeSec);
  const cast = (f, id) => { f.applyKlich(KLICH_BALANCE.axes[id], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); f.setKlichId(id); };
  out.cores = {};
  for (const core of job.cores) {
    out.cores[core] = {};
    const beh = behOf(core, job.buildSpec || null);
    for (const mode of job.modes) {
      const R = { bouts: 0, fired: 0, w: [], wFired: [], died: 0, dec: 0, decLowHp: 0, actLow: {}, needLow: 0, decLowHpPushStrike: 0, decFull: 0, need: 0, needKinds: { stam: 0, swing: 0, charge: 0 }, actFull: {}, actLowHpFull: {},
        swingNeed: 0, swingSame: 0, swingDiff: 0, win: { n: 0, stam: 0, stamEnd: 0, stamEndN: 0, dist: 0, sp: 0, taken: 0, dealt: 0, swings: 0, blk: 0, free: 0, far: 0 }, tF: [], hpAtF: [], secFired: [], sumWinTaken: [], sumWinDealt: [] };
      for (const foe of CORE_IDS) for (let s = job.seedFrom; s <= job.seedTo; s++) {
        let tF = null, fired = false, endStamDone = false;
        const tk = makeTicker((now) => tF != null && now >= tF && now < tF + WIN);
        P.on = true;
        P.onDecision = (c, fns) => {
          if (tF == null || c.fight.t < tF || c.fight.t >= tF + WIN) return;
          R.dec++;
          const k = c.self.klich;
          const low = c.self.hp01 <= 0.2;
          if (low) { R.decLowHp++; R.actLow[c.act] = (R.actLow[c.act] || 0) + 1; if (c.need) R.needLow++; }
          if (k && k.k >= 1) {
            R.decFull++; R.actFull[c.act] = (R.actFull[c.act] || 0) + 1;
            if (low) { R.actLowHpFull[c.act] = (R.actLowHpFull[c.act] || 0) + 1; if (c.act === 'press' || c.act === 'strike') R.decLowHpPushStrike++; }
            if (c.need) { R.need++; R.needKinds[c.kind]++; }
            if (c.kind === 'swing') { R.swingNeed++; const noK = fns.hardNeed({ ...c.self, klich: null }, c.foe, c.memory, c.fight); if (noK === c.act) R.swingSame++; else R.swingDiff++; }
          }
        };
        const r = duel({ seed: s, coreA: core, coreB: foe, behA: beh, swap: swapOf(s), onStep: (now, alive) => {
          const me = alive.find((u) => u.sideId === 'player');
          if (me && tF == null) {
            const hp01 = me.f.getHp() / me.f.maxHp;
            const go = job.trigger === 't5' ? now >= 5 : job.trigger === 'hp20' ? hp01 <= 0.2 : hp01 <= 0.5;
            if (go) { tF = now; R.tF.push(Math.round(now * 10) / 10); R.hpAtF.push(Math.round(hp01 * 1000) / 1000); if (mode !== 'none') { cast(me.f, mode); } fired = true; }
          }
          tk.step(now, alive);
          if (tF != null && !endStamDone && now >= tF + WIN && me) { R.win.stamEnd += me.f.getStamina01(); R.win.stamEndN++; endStamDone = true; }
        } });
        P.on = false; P.onDecision = null;
        R.bouts++;
        R.w.push(r.winner === 'player' ? 1 : 0);
        if (fired) {
          R.fired++; R.wFired.push(r.winner === 'player' ? 1 : 0); R.secFired.push(Math.round(r.sec * 10) / 10);
          if (r.winner !== 'player' && r.sec < tF + WIN) R.died++;
          const x = tk.s; R.win.n += x.n; R.win.stam += x.stam; R.win.dist += x.dist; R.win.sp += x.sp; R.win.taken += x.taken; R.win.dealt += x.dealt; R.win.swings += x.swings; R.win.blk += x.blk; R.win.free += x.free; R.win.far += x.far;
          R.sumWinTaken.push(Math.round(x.taken * 1e3) / 1e3); R.sumWinDealt.push(Math.round(x.dealt * 1e3) / 1e3);
        } else { R.wFired.push(-1); R.secFired.push(-1); R.sumWinTaken.push(-1); R.sumWinDealt.push(-1); }
      }
      out.cores[core][mode] = R;
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'buff' || job.type === 'combo' || job.type === 'timing') {
  const B = BUFF_BALANCE;
  const cast = (f, id) => { f.applyKlich(KLICH_BALANCE.axes[id], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); f.setKlichId(id); };
  /** Драйвер баффов стороны — те же вызовы бойца и те же числа, что services/buffs.js (applyBuff / buffTick / tickBot). rule: 'bot' | 'fixed' (kit[0] в момент fixedAt) | 'script' (plan:[{at,id}]) */
  function makeBuffDriver({ side = 'player', kit, rule = 'bot', fixedAt = 10, plan = null, face = null }) {
    let items = [...kit], lastThrow = -1e9, eff = null, planIdx = 0;
    const log = []; const d = { log, healed: 0 };
    d.step = (now, alive) => {
      const me = alive.find((u) => u.sideId === side); const other = alive.find((u) => u !== me);
      if (eff && me) {
        const f = me.f;
        if (eff.id === 'towel') {
          d.healed += f.heal(eff.rate * INSTANT_DT);
          const st = f.isStaggered(); if (st && !eff.sh) { f.shortenStagger(B.towel.staggerRecoverMul); eff.sh = true; } if (!st && eff.sh) eff.sh = false;
        }
        if (eff.id === 'dice' && !strike.diceChargeOf(f)) eff = null;
        else if (eff && now >= eff.until) { if (eff.id === 'bucket') f.setBuffPace(1); if (eff.id === 'dice') strike.clearDiceCharge(f); eff = null; }
      }
      if (!me || !other || eff || !items.length) return;
      const f = me.f;
      const hp01 = f.getHp() / f.maxHp, foeHp01 = other.f.getHp() / other.f.maxHp, gap = f.group.position.distanceTo(other.f.group.position);
      let pick = null;
      if (rule === 'bot') {
        if (now - lastThrow < B.bot.minGapSec) return;
        if (items.includes('towel') && hp01 < B.bot.towelHpBelow) pick = 'towel';
        else if (items.includes('bucket') && gap < B.bot.bucketNearDist) pick = 'bucket';
        else if (items.includes('dice') && (foeHp01 < B.bot.diceFoeHpBelow || now >= B.bot.diceLateSec)) pick = 'dice';
      } else if (rule === 'fixed') { if (now >= fixedAt) pick = items[0]; }
      else if (rule === 'script') {
        while (planIdx < plan.length && !items.includes(plan[planIdx].id)) planIdx++;
        if (planIdx < plan.length && now >= plan[planIdx].at) { pick = plan[planIdx].id; planIdx++; }
      }
      if (!pick) return;
      items.splice(items.indexOf(pick), 1); lastThrow = now;
      const rec = { id: pick, t: Math.round(now * 100) / 100, hp01: Math.round(hp01 * 1000) / 1000 };
      if (pick === 'towel') { eff = { id: 'towel', until: now + B.towel.durationSec, rate: B.towel.healFracOfMax / B.towel.durationSec, sh: false }; if (f.isStaggered()) { f.shortenStagger(B.towel.staggerRecoverMul); eff.sh = true; } }
      else if (pick === 'bucket') { f.setBuffPace(B.bucket.paceMul); eff = { id: 'bucket', until: now + B.bucket.durationSec }; }
      else { const fc = face || rollDie(); const row = B.dice.faces[fc]; strike.armDiceCharge(f, row.mul, row.hits); eff = { id: 'dice', until: Infinity }; rec.face = fc; }
      log.push(rec);
    };
    return d;
  }
  const foeField = job.foeField || 'bare';
  const runVariant = (core, v) => {
    const R = { w: [], sec: [], applied: [], healed: 0, winTaken: 0, winSums: zeroSums() };
    const beh = behOf(core, v.buildSpec || null);
    for (const foe of CORE_IDS) for (let s = job.seedFrom; s <= job.seedTo; s++) {
      const drv = v.buff ? makeBuffDriver({ side: 'player', ...v.buff }) : null;
      const drvFoe = v.foeBuff ? makeBuffDriver({ side: 'foe', ...v.foeBuff }) : null;
      const klichPlan = (v.klich || []).map((k) => ({ ...k, done: false }));
      let tB = v.winAt != null ? v.winAt : null; // окно наблюдения: от первого броска, а у варианта без баффа — от заданной секунды
      const tk = makeTicker((now) => tB != null && now >= tB && now < tB + (v.winSec || 5));
      const r = duel({ seed: s, coreA: core, coreB: foe, behA: beh, behB: foeBehFor(foeField, foe, s), swap: swapOf(s), onStep: (now, alive) => {
        const me = alive.find((u) => u.sideId === 'player');
        if (drv) { drv.step(now, alive); if (tB == null && drv.log.length) tB = drv.log[0].t; }
        if (drvFoe) drvFoe.step(now, alive);
        if (me) for (const k of klichPlan) if (!k.done && now >= k.at) { cast(me.f, k.id); k.done = true; }
        tk.step(now, alive);
      } });
      strike.clearAllDiceCharges();
      R.w.push(r.winner === 'player' ? 1 : 0); R.sec.push(Math.round(r.sec * 10) / 10);
      R.applied.push(drv ? drv.log.map((x) => `${x.id}@${x.t}${x.face ? '#' + x.face : ''}`).join(',') : '');
      if (drv) R.healed += drv.healed;
      if ((drv && drv.log.length) || v.winAt != null) { addSums(R.winSums, tk.s); R.winBouts = (R.winBouts || 0) + 1; }
    }
    return R;
  };
  out.cores = {};
  if (job.type === 'buff' || job.type === 'combo') {
    for (const core of job.cores) {
      out.cores[core] = {};
      for (const v of job.variants) out.cores[core][v.key] = runVariant(core, v);
      process.stderr.write(`${job.type} ${core} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
    }
  } else { // timing — те же варианты, но со схемами
    for (const core of job.cores) {
      out.cores[core] = {};
      for (const v of job.variants) out.cores[core][v.key] = runVariant(core, v);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'replace') {
  // Г5-аналог: второй клич через 6 с после первого заменяет первый; и A+B в один момент = только B бит в бит.
  const cast = (f, id) => { f.applyKlich(KLICH_BALANCE.axes[id], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); f.setKlichId(id); };
  const run = (core, foe, seed, plan) => {
    const log = []; P.on = true;
    P.onDecision = (c) => { log.push({ t: Math.round(c.fight.t * 1e3) / 1e3, id: c.self.klich ? c.self.klich.id : null, k: c.self.klich ? c.self.klich.k : 0, act: c.act }); };
    const left = plan.map((p) => ({ ...p, done: false }));
    const r = duel({ seed, coreA: core, coreB: foe, swap: seed % 2 === 0, onStep: (now, alive) => { const me = alive.find((u) => u.sideId === 'player'); if (!me) return; for (const p of left) if (!p.done && now >= p.at) { cast(me.f, p.id); p.done = true; } } });
    P.on = false; P.onDecision = null;
    return { res: `${r.winner}|${r.sec}|${r.winHp01}`, log };
  };
  const rows = []; let okA = 0, okB = 0;
  for (let i = 0; i < job.n; i++) {
    const core = CORE_IDS[i % 4], foe = CORE_IDS[(i + 1) % 4], seed = 11 + i;
    const A = i % 2 ? 'fallback' : 'push', Bk = i % 3 === 0 ? 'hold' : (A === 'push' ? 'fallback' : 'push');
    const a = run(core, foe, seed, [{ at: 5, id: A }, { at: 11, id: Bk }]);
    const before = a.log.filter((d) => d.t > 5 && d.t <= 11), after = a.log.filter((d) => d.t > 11.0 && d.t <= 11 + KLICH_BALANCE.holdSec + 1);
    const cleanA = before.length > 0 && before.every((d) => d.id === A) && after.length > 0 && after.every((d) => d.id === Bk) && Math.abs(after[0].k - 1) < 1e-9;
    const both = run(core, foe, seed, [{ at: 11, id: A }, { at: 11, id: Bk }]);
    const only = run(core, foe, seed, [{ at: 11, id: Bk }]);
    const same = both.res === only.res && JSON.stringify(both.log) === JSON.stringify(only.log);
    if (cleanA) okA++; if (same) okB++;
    rows.push({ i, core, foe, seed, A, B: Bk, before: before.length, after: after.length, cleanA, same });
  }
  out.okA = okA; out.okB = okB; out.n = job.n; out.rows = rows;
}

// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'skew') {
  // job: { cells:[{key, core, id:'a5', channels:[...]}], seedFrom, seedTo }
  // Канал-вариант = копия кристалла, где оставлены только перечисленные части: axes | ramp | extra:<stat> | tag | all
  const clone = (f, keep) => ({
    ...f,
    shifts: keep.includes('axes') ? f.shifts : f.shifts.filter((x) => keep.includes('axis:' + x.axis)),
    statBonus: keep.includes('ramp') ? f.statBonus : null,
    extraBonuses: (f.extraBonuses || []).filter((e) => keep.includes('extra:' + e.stat) || keep.includes('extras')),
    conditionals: keep.includes('tag') ? f.conditionals : [],
    effects: keep.includes('tag') ? f.effects : [],
  });
  out.cells = {};
  for (const cell of job.cells) {
    out.cells[cell.key] = {};
    const f0 = facetOf(cell.core, cell.id[0], Number(cell.id.slice(1)));
    const variants = [{ key: 'bare', keep: null }, ...cell.channels.map((ch) => ({ key: ch.join('+'), keep: ch }))];
    for (const v of variants) {
      const beh = v.keep ? resolveBehavior(cell.core, [clone(f0, v.keep)]) : resolveBehavior(cell.core);
      const w = [], sec = [];
      for (const foe of CORE_IDS) for (let s = job.seedFrom; s <= job.seedTo; s++) {
        const r = duel({ seed: s, coreA: cell.core, coreB: foe, behA: beh, swap: swapOf(s) });
        w.push(r.winner === 'player' ? 1 : 0); sec.push(Math.round(r.sec * 10) / 10);
      }
      out.cells[cell.key][v.key] = { w: w.join(''), sec };
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'negbranch') {
  // job: { cores:['natisk','nalet'], branch:'b', seedFrom, seedTo }
  out.cores = {};
  for (const core of job.cores) {
    out.cores[core] = {};
    const ids = [1, 2, 3, 4, 5].map((j) => job.branch + j);
    const full = () => resolveBehavior(core, facetsByIds(core, ids));
    const mk = {
      bare: () => resolveBehavior(core),
      full,
      noLeans: () => { const b = full(); b.leans = []; b.resonance = {}; return b; },
      axesOnly: () => { const b = full(); b.leans = []; b.resonance = {}; for (const k of Object.keys(b.statBonuses)) b.statBonuses[k] = 0; return b; },
      leansOnly: () => { const b = full(); b.axes = resolveBehavior(core).axes; for (const k of Object.keys(b.statBonuses)) b.statBonuses[k] = 0; return b; },
      resonanceOnly: () => { const b = full(); b.axes = resolveBehavior(core).axes; for (const k of Object.keys(b.statBonuses)) b.statBonuses[k] = 0; b.leans = b.leans.filter((l) => String(l.tag).startsWith('branch:')); return b; },
      tagsOnly: () => { const b = full(); b.axes = resolveBehavior(core).axes; for (const k of Object.keys(b.statBonuses)) b.statBonuses[k] = 0; b.leans = b.leans.filter((l) => !String(l.tag).startsWith('branch:')); b.resonance = {}; return b; },
    };
    for (const [key, fn] of Object.entries(mk)) {
      const beh = fn(); const w = [], sec = []; const tk = zeroSums();
      for (const foe of CORE_IDS) for (let s = job.seedFrom; s <= job.seedTo; s++) {
        const t = makeTicker();
        const r = duel({ seed: s, coreA: core, coreB: foe, behA: beh, swap: swapOf(s), onStep: (now, alive) => t.step(now, alive) });
        t.end(r); addSums(tk, t.s);
        w.push(r.winner === 'player' ? 1 : 0); sec.push(Math.round(r.sec * 10) / 10);
      }
      out.cores[core][key] = { w: w.join(''), sec, sums: tk };
    }
  }
}
// ═════════════════════════════════════════════════════════════════════════════
else if (job.type === 'plate') {
  // Гипотеза «ведро не работает из-за тесной плиты 2.5 × 1.5»: BUCKET с 0.5 с на плитах разного размера; время до первого сближения (дистанция < 1.45).
  // job: { cores, plates:[{key, bounds:{x,z}, posA, posB}], seedFrom, seedTo }
  out.cores = {};
  for (const core of job.cores) {
    out.cores[core] = {};
    for (const pl of job.plates) for (const mode of ['none', 'bucket']) {
      const w = [], sec = [], tc = [], sp = [];
      for (const foe of CORE_IDS) for (let sd = job.seedFrom; sd <= job.seedTo; sd++) {
        const swap = swapOf(sd);
        seedRandom(sd);
        const a = { sideId: 'player', coreId: core, behavior: resolveBehavior(core), side: 'player', pos: swap ? pl.posB : pl.posA };
        const b = { sideId: 'foe', coreId: foe, behavior: resolveBehavior(foe), side: 'opponent', pos: swap ? pl.posA : pl.posB };
        let contact = null, on = false, off = false, dsum = 0, dn = 0, prev = null;
        const r = H.runInstantBout(swap ? [b, a] : [a, b], { bounds: pl.bounds, onStep: (now, alive) => {
          const me = alive.find((u) => u.sideId === 'player'); const fo = alive.find((u) => u !== me); if (!me || !fo) return;
          if (mode === 'bucket' && !on && now >= 0.5) { me.f.setBuffPace(BUFF_BALANCE.bucket.paceMul); on = true; }
          if (mode === 'bucket' && on && !off && now >= 0.5 + BUFF_BALANCE.bucket.durationSec) { me.f.setBuffPace(1); off = true; }
          const d = me.f.group.position.distanceTo(fo.f.group.position);
          if (contact == null && d < 1.45) contact = now;
          if (now < 6) { if (prev) dsum += Math.hypot(me.f.group.position.x - prev.x, me.f.group.position.z - prev.z); prev = { x: me.f.group.position.x, z: me.f.group.position.z }; }
        } });
        w.push(r.winner === 'player' ? 1 : 0); sec.push(Math.round(r.sec * 10) / 10); tc.push(contact == null ? -1 : Math.round(contact * 100) / 100); sp.push(Math.round(dsum * 1000) / 1000);
      }
      out.cores[core][`${pl.key}|${mode}`] = { w: w.join(''), sec, tc, path6: sp };
    }
  }
}
else throw new Error('неизвестный тип задачи: ' + job.type);

out.elapsedSec = (Date.now() - t0) / 1000;
mkdirSync(dirname(job.out), { recursive: true });
writeFileSync(job.out, JSON.stringify(out));
process.stderr.write(`готово ${job.type} ${job.out} ${out.elapsedSec.toFixed(1)}s\n`);
await H.server.close();
