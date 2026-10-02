// balance-fix-summary.mjs — СВОДКА ЦЕЛЕЙ Ц1–Ц8 (TZ_balance_fix_v2, REPORT.md §1) ПО ИТОГАМ ПРОГОНОВ balance-fix-*.
// Читает папки docs/balance-fix/out/<тег>* одного дерева и печатает числа по каждой цели; вторым аргументом — второе дерево («стало»).
// Ничего не оценивает «хорошо / плохо» сверх порога цели и ничего не подкручивает.
//
//   node scripts/balance-fix-summary.mjs <корень out было> <тег было> [<корень out стало> <тег стало>]
//   пример: node scripts/balance-fix-summary.mjs /tmp/hx-base/docs/balance-fix/out rngbase docs/balance-fix/out rngnew
// Раскладка тега: <тег>/naked.json, <тег>-ns/naked.json, <тег>/crystals/{partA,partB}.json, <тег>-c2|c6/builds.json, <тег>/klich.json, <тег>/buffs.json.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const CORES = Object.keys(NAME);
const J = (p) => JSON.parse(readFileSync(p, 'utf8'));
const f1 = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

export function summarize(root, tag) {
  const R = {};
  const d = join(root, tag);
  // Ц1 — голые ядра.
  const naked = J(join(d, 'naked.json'));
  R.c1 = { win: Object.fromEntries(CORES.map((c) => [c, naked[`оба набора|${c}`].win])), set1: Object.fromEntries(CORES.map((c) => [c, naked[`набор 1–200|${c}`].win])) };
  if (naked['набор 201–400|natisk']) R.c1.set2 = Object.fromEntries(CORES.map((c) => [c, naked[`набор 201–400|${c}`].win]));
  const secs = []; let capped = 0, over100 = 0;
  for (const f of readdirSync(d).filter((x) => x.startsWith('raw-naked-'))) for (const p of Object.values(J(join(d, f)).pairs)) { for (const s of p.sec) { secs.push(s); if (s > 100) over100 += 1; } capped += p.capped; }
  const ns = existsSync(join(`${d}-ns`, 'naked.json')) ? J(join(`${d}-ns`, 'naked.json')) : null;
  R.ctl = { bouts: secs.length, median: med(secs), over100pct: 100 * over100 / secs.length, capped, far: 100 * (ns || naked).metric.far, free: 100 * (ns || naked).metric.free, farAlt: 100 * naked.metric.far, freeAlt: 100 * naked.metric.free };
  // Ц2 — полные ветви против поля голых, цель +15…+25.
  const c2 = J(join(`${d}-c2`, 'builds.json')); const rows2 = CORES.flatMap((c) => c2[`bare|${c}|s1`].rows.map((r) => r.delta));
  R.c2 = { n: rows2.length, inRange: rows2.filter((x) => x >= 15 && x <= 25).length, min: Math.min(...rows2), max: Math.max(...rows2) };
  // Ц3/Ц4 — 60 кристаллов по одному.
  const A = J(join(d, 'crystals', 'partA.json')).cells;
  R.c3 = { over12: A.filter((c) => c.win.delta > 12).length, sigNeg: A.filter((c) => c.win.ciHi < 0).length, max: Math.max(...A.map((c) => c.win.delta)), min: Math.min(...A.map((c) => c.win.delta)) };
  R.c4 = { n: A.length, ge5: A.filter((c) => c.decisions.chgAll >= 0.05).length };
  // Ц5 — в полной грани каждый кристалл что-то меняет; вершина жива.
  const B = J(join(d, 'crystals', 'partB.json')).cells; const B60 = B.filter((c) => c.idx);
  R.c5 = { n: B60.length, zeroIdentical: B60.filter((c) => c.inBranch.identical === 0).length, halfOrLess: B60.filter((c) => c.inBranch.identical <= c.inBranch.bouts / 2).length, maxIdentical: Math.max(...B60.map((c) => c.inBranch.identical)), vertices: B60.filter((c) => c.idx === 5).length, verticesAlive: B60.filter((c) => c.idx === 5 && c.alive.branch).length };
  // Ц6 — сборки из 7: против поля голых (цель ≤ +30, не хуже голого, лучшая ≤ 10 над остальными); против ботов — для сведения.
  const c6 = J(join(`${d}-c6`, 'builds.json'));
  const S = (f, c) => c6[`${f}|${c}|s1`].sum;
  R.c6 = { bareMax: Math.max(...CORES.map((c) => S('bare', c).maxDelta)), bareMin: Math.min(...CORES.map((c) => S('bare', c).minDelta)), bareBestOverMean: Math.max(...CORES.map((c) => S('bare', c).bestMinusMean)), bareWorstSig: CORES.flatMap((c) => S('bare', c).worstSig).length,
    botMax: Object.fromEntries(CORES.map((c) => [c, S('bot', c).maxDelta])), botBestOverMean: Math.max(...CORES.map((c) => S('bot', c).bestMinusMean)) };
  // Ц7 — клич: значимо вредящих нет; каждый меняет манеру.
  const K = Object.values(J(join(d, 'klich.json')));
  R.c7 = { n: K.length, sigHarm: K.filter((k) => k.ciHi < 0).length, minDelta: Math.min(...K.map((k) => k.delta)), maxDelta: Math.max(...K.map((k) => k.delta)), tvMin: Math.min(...K.map((k) => k.tv)), tvMax: Math.max(...K.map((k) => k.tv)) };
  // Ц8 — баффы по ядрам.
  R.c8 = J(join(d, 'buffs.json'));
  return R;
}

const [rootA, tagA, rootB, tagB] = process.argv.slice(2);
if (rootA && tagA && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const A = summarize(rootA, tagA), B = rootB ? summarize(rootB, tagB) : null;
  const row = (name, a, b, thr) => console.log(`| ${name} | ${a} | ${b ?? '—'} | ${thr} |`);
  console.log('| цель | было | стало | порог |\n| --- | --- | --- | --- |');
  for (const c of CORES) row(`Ц1 доля побед ${NAME[c]} (оба набора), %`, A.c1.win[c].toFixed(1), B && B.c1.win[c].toFixed(1), '45–55 (цель владельца 47–49)');
  row('Ц1 медиана длины, с', A.ctl.median.toFixed(2), B && B.ctl.median.toFixed(2), '≤ 55');
  row('контроль: боёв дольше 100 с, %', A.ctl.over100pct.toFixed(2), B && B.ctl.over100pct.toFixed(2), '≤ 0.1');
  row('контроль: таймаутов', A.ctl.capped, B && B.ctl.capped, '0');
  row('контроль: вне радиуса удара, % (без чередования)', A.ctl.far.toFixed(2), B && B.ctl.far.toFixed(2), '≥ 25');
  row('контроль: свободное время, % (без чередования)', A.ctl.free.toFixed(2), B && B.ctl.free.toFixed(2), '≤ 35');
  const s2 = (r) => `${r.c2.inRange}/${r.c2.n} (${f1(r.c2.min)}…${f1(r.c2.max)})`;
  row('Ц2 полные ветви в +15…+25 (200 зёрен)', s2(A), B && s2(B), '12 из 12');
  const s3 = (r) => `больше +12: ${r.c3.over12}; значимо <0: ${r.c3.sigNeg} (max ${f1(r.c3.max)}, min ${f1(r.c3.min)})`;
  row('Ц3 кристалл в одиночку', s3(A), B && s3(B), '≤ +12, значимо <0 нет');
  const s4 = (r) => `${r.c4.ge5} из ${r.c4.n}`;
  row('Ц4 кристаллов, меняющих ≥ 5% решений', s4(A), B && s4(B), '60 из 60');
  const s5 = (r) => `≤ половины боёв без отличия: ${r.c5.halfOrLess}/${r.c5.n}; 0 без отличия: ${r.c5.zeroIdentical}; вершин живых ${r.c5.verticesAlive}/${r.c5.vertices}`;
  row('Ц5 кристалл в грани что-то меняет', s5(A), B && s5(B), 'половина или меньше; вершины живы');
  const s6 = (r) => `max ${f1(r.c6.bareMax)}, min ${f1(r.c6.bareMin)}, лучшая над средним ≤ ${f1(r.c6.bareBestOverMean)}, хуже голого: ${r.c6.bareWorstSig}`;
  row('Ц6 сборки из 7 против поля голых', s6(A), B && s6(B), 'max ≤ +30; не хуже голого; лучшая ≤ +10');
  const s6b = (r) => CORES.map((c) => `${NAME[c][0]}${NAME[c][1]} ${f1(r.c6.botMax[c])}`).join(' · ');
  row('Ц6 (для сведения) сильнейшая сборка против ботов', s6b(A), B && s6b(B), 'без порога (решение 02.10: потолка нет)');
  const s7 = (r) => `значимо вредящих: ${r.c7.sigHarm}/${r.c7.n}; сдвиг ${f1(r.c7.minDelta)}…${f1(r.c7.maxDelta)}; манера TV ${r.c7.tvMin.toFixed(0)}…${r.c7.tvMax.toFixed(0)}`;
  row('Ц7 клич', s7(A), B && s7(B), 'значимо вредящих нет; манера меняется');
  console.log('\nЦ8 — по ядрам (сдвиг п.п., 200 зёрен × 4 врага):');
  console.log('| вариант | ' + CORES.map((c) => `${NAME[c]} было / стало`).join(' | ') + ' |\n| --- | --- | --- | --- | --- |');
  for (const v of Object.keys(A.c8).filter((k) => k.startsWith('natisk|')).map((k) => k.split('|')[1])) console.log(`| ${v} | ` + CORES.map((c) => `${f1(A.c8[`${c}|${v}`].delta)} / ${B ? f1(B.c8[`${c}|${v}`].delta) : '—'}`).join(' | ') + ' |');
}
