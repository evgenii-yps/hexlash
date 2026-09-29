// motion-recon.mjs — ЗАМЕР ПОЗИЦИОННОЙ СОСТАВЛЯЮЩЕЙ БОЯ (TZ_combat_motion_v1).
//
// Только чтение: игровой код не меняет. Один и тот же скрипт запускается «до» и
// «после» правки — числа в таблице «было → стало» сняты одним кодом.
//
// ЗАПУСК:  node scripts/motion-recon.mjs <метка> [раздел ...]   (разделы: occupancy speed bucket klich axes lock contact)
//   метка  — имя папки результата: docs/combat-motion/out/<метка>/ ('before' / 'after')
//   раздел — occupancy | speed | bucket | klich | axes | all   (SEEDS=200 по умолчанию)
//
// РАЗДЕЛЫ
//   occupancy — на что уходит время бойца: клип атаки / другой клип / блок / выдох /
//               свободен (только свободный боец идёт в navigate), распределение
//               выбранных намерений. (Г1, Г2)
//   speed     — средняя скорость и распределение дистанции до цели; 16 упорядоченных
//               пар ядер × SEEDS зёрен, точки выхода как в игре. (Г3 + «до/после»)
//   bucket    — BUCKET: сдвиг винрейта (п.п.), время до первого сближения, скорость
//               в окне действия. Зеркало, стороны чередуются.
//   klich     — сдвиг дистанции от каждого клича в окне действия 5–13 с.
//   lock      — намерение зафиксировано на весь бой (PRESS/STING/BREAK/BREATHE/HOLD/CATCH):
//               меняется ли скорость и дистанция. (Г2)
//   contact   — время до первого сближения и стартовая дистанция. (Г3)
//   axes      — сколько боёв перестали совпадать бит-в-бит при сдвиге осей distance /
//               initiative у ONSLAUGHT на ±10 / ±20.
import { mkdirSync, writeFileSync } from 'node:fs';
import { openHarness, mean, median, quantile } from './lib/bout-harness.mjs';

const LABEL = process.argv[2] || 'run';
const want = new Set(process.argv.slice(3));
const all = want.size === 0 || want.has('all');
const SEEDS = Number(process.env.SEEDS || 200);
const OUT = new URL(`../docs/combat-motion/out/${LABEL}/`, import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const H = await openHarness();
const { duel, CORE_IDS, INSTANT_DT, resolveBehavior, load, strike } = H;
const { CORE_PROFILES } = await load('/src/data/behavior.js');
const { CORES } = await load('/src/data/upgradeData.js');
const { BUFF_BALANCE } = await load('/src/data/buffBalance.js');
const { KLICH_BALANCE, KLICH_IDS } = await load('/src/data/klichBalance.js');
const NAME = Object.fromEntries(CORES.map((c) => [c.id, c.name]));

const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
const pct = (x) => (Number.isFinite(x) ? (100 * x).toFixed(0) + '%' : '—');
const pp = (x) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(1) : '—');
const md = (head, rows) => { const l = (r) => '| ' + r.join(' | ') + ' |'; return [l(head), l(head.map(() => '---')), ...rows.map(l)].join('\n'); };
const emit = (name, text, json) => {
  writeFileSync(OUT + name + '.md', text + '\n');
  writeFileSync(OUT + name + '.json', JSON.stringify(json, null, 1) + '\n');
  console.log(`\n===== ${LABEL}/${name} =====\n` + text);
};
const progress = (s) => process.stderr.write(s + '\n');
const sigOf = (r) => `${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}`;

// Корзины дистанции до цели (ед.). Рабочий радиус удара: рука 1.0+0.45, ноги до 1.5+0.45.
const BINS = [[0, 1.0], [1.0, 1.45], [1.45, 2.0], [2.0, 3.0], [3.0, 99]];
const binName = ([a, b]) => (b >= 99 ? `≥${a}` : `${a}–${b}`);
const binOf = (g) => BINS.findIndex(([a, b]) => g >= a && g < b);

// ── occupancy ────────────────────────────────────────────────────────────────
function sectionOccupancy() {
  const rows = [], json = {};
  for (const core of CORE_IDS) {
    const st = { n: 0, atk: 0, other: 0, block: 0, exh: 0, stag: 0, free: 0, freeSp: 0, freeMov: 0, intent: {} };
    for (const foe of CORE_IDS) for (let s = 1; s <= Math.min(SEEDS, 50); s++) {
      let prevP = null; // на каждый бой заново: иначе прыжок из точки выхода прошлого боя считался бы скоростью
      duel({ seed: s, coreA: core, coreB: foe, onStep: (now, alive) => {
        const me = alive.find((u) => u.sideId === 'player'); if (!me) return;
        const f = me.f; const c = f.getClipInfo(); st.n++;
        const pp0 = f.group.position; const spd = prevP ? Math.hypot(pp0.x - prevP.x, pp0.z - prevP.z) / INSTANT_DT : 0; prevP = { x: pp0.x, z: pp0.z };
        if (c) { if (c.impacts.length) st.atk++; else st.other++; }
        else if (f.isBlocking()) st.block++; else if (f.isStaggered()) st.stag++; else if (f.isExhaling()) st.exh++;
        else { st.free++; st.freeSp += spd; if (spd > 0.15) st.freeMov++; }
        const it = f.getIntention(); st.intent[it] = (st.intent[it] || 0) + 1;
      } });
    }
    json[core] = st;
    const it = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'].map((k) => pct((st.intent[k] || 0) / st.n));
    rows.push([NAME[core], pct(st.atk / st.n), pct(st.other / st.n), pct(st.block / st.n), pct(st.exh / st.n), pct(st.stag / st.n), pct(st.free / st.n), f2(st.freeSp / Math.max(1, st.free)), pct(st.freeMov / Math.max(1, st.free)), ...it]);
    progress(`occupancy ${core}`);
  }
  const text = [
    `Что делает боец в каждом тике боя (каждое ядро против всех четырёх, ${Math.min(SEEDS, 50)} зёрен на пару, точки выхода как в игре). Двигается по намерению (navigate) только «свободный» боец.`, '',
    md(['ядро', 'клип атаки', 'др. клип (урон/уклон/финт)', 'блок', 'выдох', 'сбив', 'СВОБОДЕН', 'скорость свободного, ед./с', 'свободных тиков в движении', 'PRESS', 'STRIKE', 'STING', 'HOLD', 'BREAK', 'BREATHE', 'CATCH'], rows),
  ].join('\n');
  emit('occupancy', text, json);
}

// ── speed: скорость и дистанция, 16 пар × SEEDS ──────────────────────────────
function sectionSpeed() {
  const perCore = {}; const rows = [];
  const tot = { n: 0, sp: 0, movN: 0, bins: BINS.map(() => 0), gap: [] };
  const durs = [];
  for (const a of CORE_IDS) {
    const st = { n: 0, sp: 0, movN: 0, bins: BINS.map(() => 0), gapSum: 0 };
    for (const b of CORE_IDS) for (let s = 1; s <= SEEDS; s++) {
      let prev = null;
      const r = duel({ seed: s, coreA: a, coreB: b, onStep: (now, alive) => {
        const me = alive.find((u) => u.sideId === 'player'), fo = alive.find((u) => u.sideId === 'foe'); if (!me || !fo) return;
        const p = me.f.group.position;
        const sp = prev ? Math.hypot(p.x - prev.x, p.z - prev.z) / INSTANT_DT : 0; prev = { x: p.x, z: p.z };
        const g = p.distanceTo(fo.f.group.position);
        st.n++; st.sp += sp; if (sp > 0.15) st.movN++; st.bins[binOf(g)]++; st.gapSum += g;
      } });
      durs.push(r.sec);
    }
    perCore[a] = st;
    for (let i = 0; i < BINS.length; i++) tot.bins[i] += st.bins[i];
    tot.n += st.n; tot.sp += st.sp; tot.movN += st.movN;
    rows.push([NAME[a], f2(st.sp / st.n), pct(st.movN / st.n), f2(st.gapSum / st.n), ...st.bins.map((x) => pct(x / st.n))]);
    progress(`speed ${a}`);
  }
  rows.push(['**все**', f2(tot.sp / tot.n), pct(tot.movN / tot.n), '', ...tot.bins.map((x) => pct(x / tot.n))]);
  const text = [
    `16 упорядоченных пар × ${SEEDS} зёрен = ${16 * SEEDS} боёв, точки выхода как в игре ((0.45, 1.3) и (−0.65, −1.4)). Строка — бойцы этого ядра (сторона player) против всех четырёх. «Скорость» — средняя за все тики боя, ед./с; «в движении» — доля тиков со скоростью >0.15 ед./с.`, '',
    md(['ядро', 'скорость, ед./с', 'в движении', 'средняя дистанция', ...BINS.map((b) => 'дистанция ' + binName(b))], rows), '',
    `Длительность боя: медиана ${f1(median(durs))} с · p10 ${f1(quantile(durs, 0.1))} · p90 ${f1(quantile(durs, 0.9))} · макс ${f1(Math.max(...durs))} (n=${durs.length}).`,
  ].join('\n');
  emit('speed', text, { perCore, total: tot, dur: { median: median(durs), p10: quantile(durs, 0.1), p90: quantile(durs, 0.9), max: Math.max(...durs) } });
}

// ── зеркальные замеры с рычагом ──────────────────────────────────────────────
// T = сторона с рычагом (sideId 'player'); стороны и порядок чередуются по чётности зерна.
function mirror(core, applyFn) {
  const recs = [], sigs = []; let wins = 0;
  const w = { gap: 0, gapN: 0, sp: 0, secs: 0, far: 0, firstContact: [] };
  for (let s = 1; s <= SEEDS; s++) {
    const swap = s % 2 === 0;
    const lever = applyFn ? applyFn() : null;
    let prev = null, t0 = null;
    const r = duel({ seed: s, coreA: core, coreB: core, swap, onStep: (now, alive) => {
      const me = alive.find((u) => u.sideId === 'player'), fo = alive.find((u) => u.sideId === 'foe'); if (!me || !fo) return;
      if (lever) lever(now, me.f);
      const p = me.f.group.position; const g = p.distanceTo(fo.f.group.position);
      if (t0 === null && g <= 1.45) t0 = now;
      const [a, b] = WINDOW.cur;
      if (now >= a && now < b) {
        w.gap += g; w.gapN++; if (g > 1.8) w.far++;
        if (prev) w.sp += Math.hypot(p.x - prev.x, p.z - prev.z);
        w.secs += INSTANT_DT;
      }
      prev = { x: p.x, z: p.z };
    } });
    if (r.winner === 'player') wins++;
    recs.push(r); sigs.push(sigOf(r)); w.firstContact.push(t0 ?? 999);
  }
  return { wins, n: SEEDS, sigs, med: median(recs.map((r) => r.sec)), gap: w.gap / Math.max(1, w.gapN), far: w.far / Math.max(1, w.gapN), spd: w.sp / Math.max(1e-9, w.secs), t0: median(w.firstContact) };
}
const WINDOW = { cur: [0, 999] };
function baselines() {
  const out = {};
  for (const [key, win] of Object.entries({ bucketFixed: [10, 15], bucketBot: [0, 5], klich: [5, 13] })) {
    WINDOW.cur = win; out[key] = {};
    for (const c of CORE_IDS) out[key][c] = mirror(c, null);
  }
  return out;
}
let BASE = null;
const getBase = () => (BASE ||= baselines());

function sectionBucket() {
  const base = getBase();
  const rows = [], json = {};
  for (const [rule, key, win] of [['fixed t=10 с', 'bucketFixed', [10, 15]], ['правило бота (цель ближе 2.2)', 'bucketBot', [0, 5]]]) {
    WINDOW.cur = win;
    let W = 0, N = 0, gapB = [], gapT = [], spdB = [], spdT = [], t0B = [], t0T = [], farB = [], farT = [], chg = 0, nn = 0;
    const per = {};
    for (const c of CORE_IDS) {
      const t = mirror(c, () => {
        let fired = false, until = 0;
        return (now, f) => {
          if (!fired) {
            const go = rule.startsWith('fixed') ? now >= 10 : true; // 'бот': цель ближе 2.2 — срабатывает, как только сошлись (проверяется ниже по дистанции)
            if (go) { f.setBuffPace(BUFF_BALANCE.bucket.paceMul); fired = true; until = now + BUFF_BALANCE.bucket.durationSec; }
          } else if (until && now >= until) { f.setBuffPace(1); until = 0; }
        };
      });
      const b = base[key][c];
      per[c] = { dWr: 100 * (t.wins - b.wins) / SEEDS, dGap: t.gap - b.gap, dSpd: t.spd - b.spd, dT0: t.t0 - b.t0 };
      W += t.wins; N += t.n; W -= 0;
      gapB.push(b.gap); gapT.push(t.gap); spdB.push(b.spd); spdT.push(t.spd); t0B.push(b.t0); t0T.push(t.t0); farB.push(b.far); farT.push(t.far);
      chg += t.sigs.filter((x, i) => x !== b.sigs[i]).length; nn += t.n;
      json[rule + '/' + c] = { t, b };
      progress(`bucket ${rule} ${c}`);
    }
    const baseWins = CORE_IDS.reduce((a, c) => a + base[key][c].wins, 0);
    rows.push([rule, `${W}/${N}`, `${baseWins}/${N}`, pp(100 * (W - baseWins) / N), ...CORE_IDS.map((c) => pp(per[c].dWr)),
      `${f2(mean(spdB))} → ${f2(mean(spdT))}`, `${f2(mean(gapB))} → ${f2(mean(gapT))}`, `${pct(mean(farB))} → ${pct(mean(farT))}`, `${f2(median(t0B))} → ${f2(median(t0T))}`, `${chg}/${nn}`]);
  }
  const sigma = Math.sqrt(0.25 / (SEEDS * 4)) * 100;
  const text = [
    `Зеркальный бой, ${SEEDS} зёрен × 4 ядра = ${SEEDS * 4} боёв на строку; T — сторона с BUCKET (paceMul ×${BUFF_BALANCE.bucket.paceMul}, ${BUFF_BALANCE.bucket.durationSec} с), стороны чередуются. Δ — разность двух замеров: σ ≈ ${(Math.SQRT2 * sigma).toFixed(1)} п.п., 95% интервал ±${(1.96 * Math.SQRT2 * sigma).toFixed(0)} п.п. (на ядро ±${(1.96 * Math.SQRT2 * Math.sqrt(0.25 / SEEDS) * 100).toFixed(0)}).`,
    'Окно скорости/дистанции: фикс. — 10–15 с; «бот» — первые 5 с (бафф вешается в первый же тик: цель дальше 2.2 стартует ближе к 2.9, поэтому применяется сразу, как в игре, когда сближение начинается).', '',
    md(['правило', 'победы T', 'победы без баффа', 'Δ винрейта, п.п.', ...CORE_IDS.map((c) => `Δ п.п. ${NAME[c]}`), 'скорость в окне, ед./с (без → с)', 'дистанция в окне (без → с)', 'дистанция >1.8 в окне', 'время до первого сближения ≤1.45, с (мед.)', 'боёв не бит-в-бит'], rows),
  ].join('\n');
  emit('bucket', text, json);
}

function sectionKlich() {
  const base = getBase(); WINDOW.cur = [5, 13];
  const rows = [], json = {};
  for (const id of KLICH_IDS) {
    const per = {}; let cnt = 0;
    const dGap = [], dFar = [], dSpd = [], gB = [], gT = [], fB = [], fT = []; let chg = 0, nn = 0, dW = 0, N = 0;
    for (const c of CORE_IDS) {
      const t = mirror(c, () => { let fired = false; return (now, f) => { if (!fired && now >= 5) { f.applyKlich(KLICH_BALANCE.axes[id], KLICH_BALANCE.holdSec, KLICH_BALANCE.fadeSec); fired = true; } }; });
      const b = base.klich[c];
      per[c] = { dGap: t.gap - b.gap, dFar: t.far - b.far };
      dGap.push(t.gap - b.gap); dFar.push(t.far - b.far); dSpd.push(t.spd - b.spd);
      gB.push(b.gap); gT.push(t.gap); fB.push(b.far); fT.push(t.far);
      chg += t.sigs.filter((x, i) => x !== b.sigs[i]).length; nn += t.n; dW += t.wins - b.wins; N += t.n;
      json[id + '/' + c] = { t, b };
      progress(`klich ${id} ${c}`);
    }
    rows.push([id.toUpperCase(), ...CORE_IDS.map((c) => `${per[c].dGap >= 0 ? '+' : ''}${f2(per[c].dGap)}`), `${f2(mean(gB))} → ${f2(mean(gT))}`, `${pct(mean(fB))} → ${pct(mean(fT))}`, pp(100 * dW / N), `${chg}/${nn}`]);
  }
  const text = [
    `Зеркальный бой, ${SEEDS} зёрен на ядро; клич применяется к T один раз в t=5 с (держится ${KLICH_BALANCE.holdSec}+${KLICH_BALANCE.fadeSec} с), окно наблюдения 5–13 с. Дистанция — средняя между бойцами в окне, ед.; в ячейке по ядрам — сдвиг «с кличем − без».`, '',
    md(['клич', ...CORE_IDS.map((c) => `Δ дистанции ${NAME[c]}`), 'дистанция (без → с), все ядра', 'доля тиков дистанция >1.8', 'Δ винрейта, п.п.', 'боёв не бит-в-бит'], rows),
  ].join('\n');
  emit('klich', text, json);
}

function sectionAxes() {
  const core = 'natisk'; const rows = [], json = [];
  const baseSigs = []; for (let s = 1; s <= SEEDS; s++) baseSigs.push(sigOf(duel({ seed: s, coreA: core, coreB: core, swap: s % 2 === 0 })));
  for (const ax of ['distance', 'initiative']) {
    const start = CORE_PROFILES[core][ax]; const cells = [];
    for (const d of [-20, -10, 10, 20]) {
      const val = Math.max(0, Math.min(100, start + d)); let diff = 0;
      for (let s = 1; s <= SEEDS; s++) {
        const beh = resolveBehavior(core, []); beh.axes[ax] = val;
        if (sigOf(duel({ seed: s, coreA: core, coreB: core, behA: beh, swap: s % 2 === 0 })) !== baseSigs[s - 1]) diff++;
      }
      cells.push(`${diff}/${SEEDS}`); json.push({ ax, d, diff });
    }
    rows.push([ax, String(start), ...cells]);
    progress(`axes ${ax}`);
  }
  const text = [
    `ONSLAUGHT, зеркало, ${SEEDS} зёрен. Сколько боёв перестали совпадать с нулевым БИТ В БИТ, когда ось сдвинута от стартового значения. 0 = бой к оси нечувствителен.`, '',
    md(['ось', 'старт', '−20', '−10', '+10', '+20'], rows),
  ].join('\n');
  emit('axes', text, json);
}

// ── lock: намерение зафиксировано на весь бой ────────────────────────────────
function sectionLock() {
  const N = Math.min(SEEDS, 50); const rows = [], json = {};
  for (const lock of [null, 'press', 'sting', 'break', 'breathe', 'hold', 'catch']) {
    const row = [lock ? lock.toUpperCase() : 'без замка'];
    for (const core of ['natisk', 'skala']) {
      const st = { n: 0, sp: 0, gap: 0, far: 0, free: 0, atk: 0, read: 0 };
      for (let s = 1; s <= N; s++) {
        let locked = false, prev = null;
        duel({ seed: s, coreA: core, coreB: 'nalet', onStep: (now, alive) => {
          const me = alive.find((u) => u.sideId === 'player'), fo = alive.find((u) => u.sideId === 'foe'); if (!me || !fo) return;
          if (!locked && lock) { me.f.setIntentionLock(lock); locked = true; }
          const f = me.f, p = f.group.position; const sp = prev ? Math.hypot(p.x - prev.x, p.z - prev.z) / INSTANT_DT : 0; prev = { x: p.x, z: p.z };
          const g = p.distanceTo(fo.f.group.position); st.n++; st.sp += sp; st.gap += g; if (g > 1.8) st.far++;
          const c = f.getClipInfo(); if (c && c.impacts.length) st.atk++;
          if (!c && !f.isBlocking() && !f.isExhaling() && !f.isStaggered()) st.free++;
          if (f.getReadAction()) st.read++;
        } });
      }
      json[(lock || 'none') + '/' + core] = st;
      row.push(`${f2(st.sp / st.n)} · ${f2(st.gap / st.n)} · ${pct(st.far / st.n)}`, `${pct(st.atk / st.n)} · ${pct(st.free / st.n)} · ${pct(st.read / st.n)}`);
    }
    rows.push(row); progress(`lock ${lock}`);
  }
  const text = [
    `Игрок ONSLAUGHT или BULWARK против свободного RAIDER, ${N} зёрен; у игрока намерение зафиксировано (`+'`setIntentionLock`'+`) с первого тика. Столбцы: скорость ед./с · средняя дистанция · доля тиков дистанция >1.8 / клип атаки · свободен · «сработала реакция сбив/контра».`, '',
    md(['замок', 'ONSLAUGHT: скорость · дистанция · >1.8', 'ONSLAUGHT: атака · свободен · чтение', 'BULWARK: скорость · дистанция · >1.8', 'BULWARK: атака · свободен · чтение'], rows),
  ].join('\n');
  emit('lock', text, json);
}

// ── contact: время до первого сближения ──────────────────────────────────────
function sectionContact() {
  const rows = [], json = {};
  for (const core of CORE_IDS) {
    const ts = [];
    for (const foe of CORE_IDS) for (let s = 1; s <= Math.min(SEEDS, 50); s++) {
      let t0 = null;
      duel({ seed: s, coreA: core, coreB: foe, onStep: (now, alive) => {
        if (t0 !== null) return;
        const a = alive.find((u) => u.sideId === 'player'), b = alive.find((u) => u.sideId === 'foe');
        if (a && b && a.f.group.position.distanceTo(b.f.group.position) <= 1.45) t0 = now;
      } });
      ts.push(t0 ?? 999);
    }
    json[core] = ts; rows.push([NAME[core], f2(median(ts)), f2(quantile(ts, 0.1)), f2(quantile(ts, 0.9))]);
  }
  const g0 = Math.hypot(0.45 + 0.65, 1.3 + 1.4);
  const text = [`Стартовая дистанция дуэли ${g0.toFixed(2)} ед. (точки как в игре). Время, когда дистанция впервые ≤1.45 (радиус руки 1.0 + допуск 0.45), с.`, '', md(['ядро', 'мед.', 'p10', 'p90'], rows)].join('\n');
  emit('contact', text, json);
}

const S = { lock: sectionLock, contact: sectionContact, occupancy: sectionOccupancy, speed: sectionSpeed, bucket: sectionBucket, klich: sectionKlich, axes: sectionAxes };
for (const [k, fn] of Object.entries(S)) if (all || want.has(k)) { const t0 = Date.now(); fn(); progress(`[${k}] ${(Date.now() - t0) / 1000}s`); }
await H.server.close();
