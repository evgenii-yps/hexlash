// reflex-sight-report.mjs — сводка зонда «рефлекс видит характер»: таблицы «до / после» из двух прогонов reflex-sight-probe.mjs.
// ЗАПУСК: node scripts/reflex-sight-report.mjs <меткаДо> <меткаПосле|-> > таблицы.md
import { readFileSync, existsSync } from 'node:fs';
const D = new URL('../docs/reflex-sight/out/', import.meta.url).pathname;
const [A, B] = [process.argv[2] || 'before', process.argv[3] || '-'];
const load = (l) => (l !== '-' && existsSync(D + `${l}-blind.json`)) ? JSON.parse(readFileSync(D + `${l}-blind.json`, 'utf8')).out : null;
const CORES = [['natisk', 'ONSLAUGHT'], ['nalet', 'RAIDER'], ['skala', 'BULWARK'], ['zasada', 'AMBUSH']];
const SETS = { 'вразброс 7': ['s1', 's2', 's3'], 'ветка 5': ['ba', 'bb', 'bc'], '5+2': ['xab', 'xbc', 'xca'] };
const ALL = Object.values(SETS).flat();
const INT = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const f1 = (x) => (100 * x).toFixed(1);
const l1 = (a, b) => INT.reduce((s, k) => s + Math.abs((a[k] || 0) - (b[k] || 0)), 0) * 50; // п.п.

/** Слить ветки решений набора сборок. */
function pool(d, core, ids) {
  let total = 0, hard = 0, sc = 0, scAll = 0, scAx = 0, scLn = 0; const br = {};
  for (const id of ids) {
    const t = d[`${core}|${id}`].tab; total += t.total;
    for (const [b, r] of Object.entries(t.br)) {
      br[b] = (br[b] || 0) + r.n;
      if (b === 'score') { sc += r.n; scAll += r.all; scAx += r.ax; scLn += r.ln; } else hard += r.n;
    }
  }
  // «не зависит от билда» = жёсткие нужды (не меняются) + очки, не сменившиеся без билда. Жёсткие тоже могут меняться после правки — считаем по каждой ветке.
  let same = 0;
  for (const id of ids) for (const [b, r] of Object.entries(d[`${core}|${id}`].tab.br)) same += r.n - r.all;
  return { total, hard: hard / total, score: sc / total, same: same / total, scoreChg: sc ? scAll / sc : 0, scoreAx: sc ? scAx / sc : 0, scoreLn: sc ? scLn / sc : 0, br };
}
function diverge(d, core) {
  const ids = ALL;
  let s = 0, n = 0;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { s += l1(d[`${core}|${ids[i]}`].share, d[`${core}|${ids[j]}`].share); n++; }
  let noise = 0; for (const id of ids) noise += l1(d[`${core}|${id}`].shareOdd, d[`${core}|${id}`].shareEven);
  // расхождение сборки с голым ядром
  let vsBare = 0; for (const id of ids) vsBare += l1(d[`${core}|${id}`].share, d[`${core}|bare`].share);
  return { between: s / n, noise: noise / ids.length, vsBare: vsBare / ids.length };
}
const dA = load(A), dB = load(B);
const out = [];
const row = (cells) => out.push('| ' + cells.join(' | ') + ' |');
const head = (c) => { row(c); row(c.map(() => '---')); };

out.push('### Доля выборов, НЕ зависящих от билда (жёсткие нужды + очки, не сменившиеся без билда), % — до → после', '');
head(['ядро', ...Object.keys(SETS)]);
for (const [c, n] of CORES) row([n, ...Object.values(SETS).map((ids) => dB ? `${f1(pool(dA, c, ids).same)} → ${f1(pool(dB, c, ids).same)}` : f1(pool(dA, c, ids).same))]);
out.push('', '### Жёсткие нужды: доля всех выборов, % — до → после', '');
head(['ядро', ...Object.keys(SETS)]);
for (const [c, n] of CORES) row([n, ...Object.values(SETS).map((ids) => dB ? `${f1(pool(dA, c, ids).hard)} → ${f1(pool(dB, c, ids).hard)}` : f1(pool(dA, c, ids).hard))]);
out.push('', '### Расхождение сборок внутри ядра (п.п. смещённой доли намерений, L1/2): между разными сборками / сборка против голого ядра / шум (нечётные против чётных зёрен одной сборки)', '');
head(['ядро', 'между сборками', 'сборка ↔ голое', 'шум', 'между / шум']);
for (const [c, n] of CORES) {
  const a = diverge(dA, c), b = dB ? diverge(dB, c) : null;
  row([n, b ? `${a.between.toFixed(1)} → ${b.between.toFixed(1)}` : a.between.toFixed(1), b ? `${a.vsBare.toFixed(1)} → ${b.vsBare.toFixed(1)}` : a.vsBare.toFixed(1), b ? `${a.noise.toFixed(1)} → ${b.noise.toFixed(1)}` : a.noise.toFixed(1), b ? `${(a.between / a.noise).toFixed(1)} → ${(b.between / b.noise).toFixed(1)}` : (a.between / a.noise).toFixed(1)]);
}
out.push('', '### Ветки решений (все 9 сборок вместе), доля выборов, %', '');
for (const [lab, d] of [['до', dA], ['после', dB]]) {
  if (!d) continue;
  out.push(`**${lab}**`, ''); head(['ядро', 'ветка', 'доля', 'меняется без билда']);
  for (const [c, n] of CORES) {
    const t = { total: 0, br: {} };
    for (const id of ALL) { const x = d[`${c}|${id}`].tab; t.total += x.total; for (const [b, r] of Object.entries(x.br)) { const q = (t.br[b] = t.br[b] || { n: 0, all: 0 }); q.n += r.n; q.all += r.all; } }
    for (const [b, r] of Object.entries(t.br).sort((x, y) => y[1].n - x[1].n)) row([n, b, f1(r.n / t.total), f1(r.all / r.n) + '%']);
  }
  out.push('');
}
console.log(out.join('\n'));
