// balance-recon-lib.mjs — общие мелочи для скриптов TZ_balance_recon_v1 (разведка баланса). Игровой код не трогает.
//
// СЛОВАРЬ. ГРАНЬ (слова владельца) = ветка BODY / MIND / WILL, в коде `crystal` с id a / b / c.
//         КРИСТАЛЛ = шаг 1…5 внутри грани, в коде `face`. Здесь и в отчёте — слова владельца; в коде — наоборот, не переименовывать.
export const CORES = ['natisk', 'nalet', 'skala', 'zasada'];
export const CORE_NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
export const BR = ['a', 'b', 'c'];
export const BR_NAME = { a: 'BODY', b: 'MIND', c: 'WILL' };
export const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
export const DT = 1 / 60;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const sd = (xs) => { if (xs.length < 2) return NaN; const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
export function quantile(xs, q) {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b); const pos = (s.length - 1) * q; const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export const median = (xs) => quantile(xs, 0.5);

/** Доля побед p из n боёв → 95% интервал Вильсона, в процентах. */
export function wilson(w, n, z = 1.96) {
  if (!n) return { p: NaN, lo: NaN, hi: NaN };
  const p = w / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { p: 100 * p, lo: 100 * (c - h), hi: 100 * (c + h) };
}

/** Парный сдвиг по спискам 1/0 одного порядка зёрен: среднее разностей и её стандартная ошибка, п.п. */
export function pairedShift(wT, wB) {
  const d = wT.map((x, i) => x - wB[i]);
  const m = mean(d);
  const se = sd(d) / Math.sqrt(d.length);
  return { n: d.length, delta: 100 * m, se: 100 * (Number.isFinite(se) ? se : 0), flips: d.filter((x) => x !== 0).length };
}

export const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
export const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
export const f3 = (x) => (Number.isFinite(x) ? x.toFixed(3) : '—');
export const pct = (x, d = 1) => (Number.isFinite(x) ? (100 * x).toFixed(d) + '%' : '—');
export const sgn = (x, d = 1) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(d) : '—');

export function md(head, rows) {
  const l = (r) => '| ' + r.map((c) => String(c).replace(/\|/g, '\\|')).join(' | ') + ' |';
  return [l(head), l(head.map(() => '---')), ...rows.map(l)].join('\n');
}

/** Факты ядра по кристаллу: facet(core, 'a', 3) — кристалл a3. */
export const facetOf = (CRYSTALS, core, b, j) => CRYSTALS[core].find((x) => x.id === b).faces[j - 1];
/** Сборка по счётчикам «с начала ветви»: { a: 5, b: 2 } → кристаллы a1..a5, b1..b2 в порядке ветвей. */
export function buildByCounts(CRYSTALS, core, counts) {
  const fs = [];
  for (const b of BR) for (let j = 1; j <= (counts[b] || 0); j++) fs.push(facetOf(CRYSTALS, core, b, j));
  return fs;
}
/** Подпись кристалла, как в перезамере: «ONSLAUGHT · BODY/ROOT (a1) · Heavy Hit» (BODY/ROOT — текст владельца из crystalTexts; Heavy Hit — имя в данных). */
export function cellLabel(CRYSTALS, CRYSTAL_TEXTS, core, b, j) {
  const br = CRYSTALS[core].find((x) => x.id === b);
  return `${CORE_NAME[core]} · ${BR_NAME[b]}/${CRYSTAL_TEXTS[b][j - 1].name} (${b}${j}) · ${br.faces[j - 1].name}`;
}

// ── чтение сырых данных и запись разделов отчёта ─────────────────────────────
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
export const REPO = new URL('..', import.meta.url).pathname;
export const OUT = REPO + 'docs/balance-recon/out/';
export const RAW = OUT + 'raw/';
mkdirSync(OUT, { recursive: true });
export const rawPath = (n) => RAW + n + '.json';
export const hasRaw = (n) => existsSync(rawPath(n));
export const loadRaw = (n) => JSON.parse(readFileSync(rawPath(n), 'utf8'));
export const sumArr = (xs) => xs.reduce((a, b) => a + b, 0);
export function writeSection(name, text, json) {
  writeFileSync(OUT + name + '.md', text + '\n');
  if (json !== undefined) writeFileSync(OUT + name + '.json', JSON.stringify(json, null, 1) + '\n');
  console.log(`\n===== ${name} =====\n` + text);
}
/** 1/0-строка или массив → массив чисел. */
export const bits = (w) => (typeof w === 'string' ? [...w].map(Number) : w);
/** Сумма по ключам счётчиков (числа и массивы) — в a. */
export function addInto(a, b) { for (const k of Object.keys(b)) { if (Array.isArray(b[k])) { if (!a[k]) a[k] = b[k].map(() => 0); b[k].forEach((v, i) => { a[k][i] += v; }); } else a[k] = (a[k] || 0) + b[k]; } return a; }
/** Парный сдвиг по 4 врагам: списки w одной длины. */
export function pairedFromFoes(T, B, foes) {
  const wT = foes.flatMap((f) => bits(T[f].w)), wB = foes.flatMap((f) => bits(B[f].w));
  const ps = pairedShift(wT, wB);
  return { ...ps, rateT: 100 * mean(wT), rateB: 100 * mean(wB), lo: ps.delta - 1.96 * ps.se, hi: ps.delta + 1.96 * ps.se };
}
