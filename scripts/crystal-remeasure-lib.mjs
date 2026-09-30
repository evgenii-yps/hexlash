// crystal-remeasure-lib.mjs — общие функции свода перезамера кристаллов (TZ_crystal_remeasure_v2): чтение сырых прогонов, метрики, парные интервалы, флаги.
// Все пороги собраны в THRESH и пересчитываются БЕЗ нового прогона (сырые суммы и по-зёрновые исходы лежат в out/raw/*.json).
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const REPO = new URL('..', import.meta.url).pathname;
export const OUT = join(REPO, 'docs/crystal-remeasure/out/');
export const RAW = OUT + 'raw/';
export const CORES = ['natisk', 'nalet', 'skala', 'zasada'];
export const CORE_NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
export const BR = ['a', 'b', 'c'];
export const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
export const DT = 1 / 60;

/** Пороги вердикта. Черновые — по ТЗ (п.6). */
export const THRESH = {
  ciZ: 1.96,          // 95% интервал для сдвига доли побед (парный)
  foeZ: 2.576,        // 99% — для метки «знак по врагу» (проверок много: 4 врага)
  behShare: 0.05,     // кристалл изменил не меньше 5% решений
  noiseK: 3,          // телесная метрика сдвинулась больше чем на K шумов
  emptyTag: 0.01,     // условие тега истинно меньше чем в 1% решений → входа нет
  skew: 20,           // ПЕРЕКОС: +20 п.п. и больше
  medianWarn: 55,     // отметить ячейки с медианой выше, с
};

export const exists = (p) => existsSync(p);
export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
export const rawPath = (name) => RAW + name + '.json';
export const loadRaw = (name) => (existsSync(rawPath(name)) ? readJson(rawPath(name)) : null);

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const sd = (xs) => { if (xs.length < 2) return NaN; const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
export function quantile(xs, q) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b); const pos = (s.length - 1) * q; const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export const median = (xs) => quantile(xs, 0.5);

/** Сложить суммы нескольких врагов в одни. */
export function poolSums(recs) {
  const out = { n: 0, far: 0, free: 0, dist: 0, distN: 0, spd: 0, clips: 0, swings: 0, hits: 0, dealt: 0, taken: 0, blkT: 0, blkS: 0, readSb: 0, readCt: 0, it: INTENTS.map(() => 0), dec: 0, need: 0, chg: {}, tt: {}, tf: {} };
  for (const r of recs) {
    const s = r.sum;
    for (const k of ['n', 'far', 'free', 'dist', 'distN', 'spd', 'clips', 'swings', 'hits', 'dealt', 'taken', 'blkT', 'blkS', 'readSb', 'readCt', 'dec', 'need']) out[k] += s[k];
    s.it.forEach((v, i) => { out.it[i] += v; });
    for (const k of ['chg', 'tt', 'tf']) for (const [n, v] of Object.entries(s[k])) out[k][n] = (out[k][n] || 0) + v;
  }
  return out;
}

/** Телесные метрики из сумм. Определения — как в прошлых замерах (тики бойца-игрока, sideId 'player'). */
export const METRICS = [
  { id: 'far', name: 'вне радиуса удара (≥1.45), доля времени', unit: '%', mul: 100 },
  { id: 'free', name: 'свободное время (нет клипа/блока/сбива/выдоха)', unit: '%', mul: 100 },
  { id: 'dist', name: 'средняя дистанция до врага', unit: 'ед.', mul: 1 },
  { id: 'spd', name: 'средняя скорость', unit: 'ед./с', mul: 1 },
  { id: 'swingsPerMin', name: 'ударов (контактов в замахах) в минуту', unit: '/мин', mul: 1 },
  { id: 'hitRate', name: 'доля попаданий (попал / ударов)', unit: '%', mul: 100 },
  { id: 'blkShare', name: 'время в блоке', unit: '%', mul: 100 },
  { id: 'blkPerMin', name: 'подъёмов блока в минуту', unit: '/мин', mul: 1 },
  { id: 'catchShare', name: 'время в намерении CATCH (ловля)', unit: '%', mul: 100 },
  { id: 'readsPerMin', name: 'сбив/контра по чтению в минуту', unit: '/мин', mul: 1 },
];
export function metricsOf(s) {
  const min = (s.n * DT) / 60;
  return {
    far: s.far / s.n, free: s.free / s.n, dist: s.dist / Math.max(1, s.distN), spd: s.spd / s.n,
    swingsPerMin: s.swings / min, hitRate: s.swings ? s.hits / s.swings : 0,
    blkShare: s.blkT / s.n, blkPerMin: s.blkS / min, catchShare: s.it[INTENTS.indexOf('catch')] / s.n,
    readsPerMin: (s.readSb + s.readCt) / min,
  };
}
export const shareOf = (s) => Object.fromEntries(INTENTS.map((k, i) => [k, s.it[i] / Math.max(1, s.n)]));
/** Расхождение долей намерений, п.п. — та же формула, что в grani-recon.mjs: L1/2 от долей времени (по тикам бойца). */
export const l1pp = (a, b) => INTENTS.reduce((x, k) => x + Math.abs((a[k] || 0) - (b[k] || 0)), 0) * 50;

/** Парный сдвиг доли побед по спискам w (1/0) одного порядка зёрен: среднее разностей и её стандартная ошибка, п.п. */
export function pairedShift(wT, wB) {
  const d = wT.map((x, i) => x - wB[i]);
  const m = mean(d);
  const se = sd(d) / Math.sqrt(d.length);
  return { n: d.length, delta: 100 * m, se: 100 * (Number.isFinite(se) ? se : 0), flips: d.filter((x) => x !== 0).length };
}

/** Сколько боёв совпало бит в бит: исход, длина, здоровье победителя и отпечаток траектории. */
export function identicalCount(a, b) {
  let n = 0;
  for (let i = 0; i < a.w.length; i++) if (a.w[i] === b.w[i] && a.sec[i] === b.sec[i] && a.hp[i] === b.hp[i] && a.tj[i] === b.tj[i]) n++;
  return n;
}

/** Нулевые замеры: блоки зёрен 1..5 (по 200) × 4 ядра × 4 врага. */
export function loadZero() {
  const zero = {}; // zero[core][block][foe] = rec
  for (const c of CORES) {
    zero[c] = [];
    for (let b = 1; b <= 5; b++) { const r = loadRaw(`zero-${c}-b${b}`); if (r) zero[c].push(r.foes); }
  }
  return zero;
}

/** Шум телесной метрики: по ядру, стандартное отклонение блоков (каждый блок — 4 врага × 200 зёрен) × √2 = σ разности двух нулевых замеров. */
export function noiseOf(zero) {
  const out = {};
  for (const c of CORES) {
    const perBlock = zero[c].map((foes) => metricsOf(poolSums(Object.values(foes))));
    out[c] = {};
    for (const m of METRICS) {
      const xs = perBlock.map((b) => b[m.id]);
      out[c][m.id] = { sdBlock: sd(xs), sigmaDiff: sd(xs) * Math.SQRT2, blocks: xs.length, values: xs };
    }
    // доля побед 4 врагов (нулевой замер) — тоже шум, для отчёта
    const wr = zero[c].map((foes) => mean(Object.values(foes).flatMap((r) => r.w)));
    out[c].winRate = { sdBlock: sd(wr), sigmaDiff: sd(wr) * Math.SQRT2, values: wr };
    const meds = zero[c].map((foes) => median(Object.values(foes).flatMap((r) => r.sec)));
    out[c].median = { sdBlock: sd(meds), sigmaDiff: sd(meds) * Math.SQRT2, values: meds };
  }
  return out;
}

/**
 * Разбор одной ячейки (solo или build) против нулевого замера. raw — файл задачи; base[foe] — нулевой замер того же ядра на тех же зёрнах (блок 1).
 * key — ключ счётчиков решений ('all'/'ax'/'ln' для solo; 'all:j'… для build), tagKey — ключ условия тега ('t' или 'j').
 */
export function analyseCell({ raw, base, noise, core, key = '', tagKey = 't', thresh = THRESH, baseSums = null }) {
  const foes = Object.keys(raw.foes);
  const recs = foes.map((f) => raw.foes[f]);
  const sum = poolSums(recs);
  const bsum = baseSums || poolSums(foes.map((f) => base[f]));
  const wT = foes.flatMap((f) => raw.foes[f].w), wB = foes.flatMap((f) => base[f].w);
  const secT = foes.flatMap((f) => raw.foes[f].sec), secB = foes.flatMap((f) => base[f].sec);
  const all = pairedShift(wT, wB);
  const ciLo = all.delta - thresh.ciZ * all.se, ciHi = all.delta + thresh.ciZ * all.se;
  const outcome = all.se > 0 ? (ciLo > 0 || ciHi < 0) : all.delta !== 0;
  const perFoe = {};
  let ident = 0, total = 0;
  for (const f of foes) {
    const p = pairedShift(raw.foes[f].w, base[f].w);
    const id = identicalCount(raw.foes[f], base[f]);
    ident += id; total += raw.foes[f].w.length;
    perFoe[f] = { ...p, sigCi99: p.se > 0 ? Math.abs(p.delta) > thresh.foeZ * p.se : p.delta !== 0, identical: id, n: raw.foes[f].w.length, chg: raw.foes[f].sum.dec ? (raw.foes[f].sum.chg['all' + (key ? ':' + key : '')] || 0) / raw.foes[f].sum.dec : 0 };
  }
  // поведение
  const mT = metricsOf(sum), mB = metricsOf(bsum);
  const metricShift = {};
  const bodyHits = [];
  for (const m of METRICS) {
    const d = mT[m.id] - mB[m.id];
    const nz = noise[core][m.id].sigmaDiff;
    metricShift[m.id] = { cell: mT[m.id], base: mB[m.id], delta: d, noise: nz, ratio: nz > 0 ? d / nz : (d === 0 ? 0 : Infinity) };
    if (Math.abs(d) > thresh.noiseK * nz) bodyHits.push(m.id);
  }
  const sT = shareOf(sum), sB = shareOf(bsum);
  const cfName = (b) => (key ? `${b}:${key}` : b);
  const dec = sum.dec;
  const chgAll = dec ? (sum.chg[cfName('all')] || 0) / dec : 0;
  const chgAx = dec ? (sum.chg[cfName('ax')] || 0) / dec : 0;
  const chgLn = dec ? (sum.chg[cfName('ln')] || 0) / dec : 0;
  const tagTrue = dec ? (sum.tt[tagKey] || 0) / dec : 0;
  const tagFlip = dec ? (sum.tf[tagKey] || 0) / dec : 0;
  const behByDecision = chgAll >= thresh.behShare;
  const behavior = behByDecision || bodyHits.length > 0;
  return {
    bouts: total, win: { rate: 100 * mean(wT), base: 100 * mean(wB), ...all, ciLo, ciHi }, outcome,
    median: { cell: median(secT), base: median(secB), delta: median(secT) - median(secB) },
    identical: ident, perFoe,
    decisions: { n: dec, need: dec ? sum.need / dec : 0, chgAll, chgAx, chgLn, tagTrue, tagFlip, tagFlipOfTrue: tagTrue ? tagFlip / tagTrue : 0 },
    intents: { cell: sT, base: sB, l1pp: l1pp(sT, sB) },
    metrics: metricShift, bodyHits, behByDecision, behavior,
    sample: { median: median(secT), over100: secT.filter((x) => x > 100).length, capped: recs.reduce((a, r) => a + r.capped, 0), max: Math.max(...secT) },
  };
}
