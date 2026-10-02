// bout-random-measure-table.mjs — ТАБЛИЦА «БЫЛО / СТАЛО / ПОРОГ» по метрикам боя (Ц1) из двух прогонов balance-fix-bench.
//
//   node scripts/bout-random-measure-table.mjs <папка_было> <папка_стало>
//   папка — docs/balance-fix/out/<тег> (в ней naked.json, raw-naked-*.json; рядом <тег>-ns — прогон без чередования сторон).
// Ничего не подкручивает и не оценивает «хорошо/плохо» сверх порога: только считает и отмечает пересечение порога.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [A, B] = process.argv.slice(2);
if (!A || !B) { console.error('нужны две папки: было, стало'); process.exit(1); }
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const CORES = Object.keys(NAME);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

function load(dir) {
  const naked = JSON.parse(readFileSync(join(dir, 'naked.json'), 'utf8'));
  const nsDir = `${dir}-ns`;
  const ns = existsSync(join(nsDir, 'naked.json')) ? JSON.parse(readFileSync(join(nsDir, 'naked.json'), 'utf8')) : null;
  // Длины и исходы боёв — из сырых файлов (оба набора зёрен, стороны чередуются).
  const secs = []; let capped = 0, over100 = 0, bouts = 0;
  for (const f of readdirSync(dir).filter((x) => x.startsWith('raw-naked-'))) {
    const raw = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const p of Object.values(raw.pairs)) { for (const s of p.sec) { secs.push(s); bouts += 1; if (s > 100) over100 += 1; } capped += p.capped; }
  }
  return { naked, ns, med: median(secs), capped, over100, bouts };
}
const was = load(A), now = load(B);

const f1 = (x) => x.toFixed(1);
const f2 = (x) => x.toFixed(2);
const mark = (ok) => (ok ? '' : ' ⚠️ ПЕРЕСЕКЛА ПОРОГ');
const rows = [];
const row = (name, a, b, thr, ok) => rows.push(`| ${name} | ${a} | ${b} | ${thr} | ${ok ? 'в пороге' : '**вне порога**'} |`);

// Доли побед ядер: «итог против 4», оба набора зёрен (200 + 200), стороны чередуются.
for (const c of CORES) {
  const a = was.naked[`оба набора|${c}`].win, b = now.naked[`оба набора|${c}`].win;
  row(`доля побед ${NAME[c]}, %`, f1(a), f1(b), '47–49', b >= 47 && b <= 49);
}
// Вне радиуса / свободное время — «нечередованный» прогон (как в прежних замерах 25.07 / 34.95), 16 пар × 200 зёрен.
// metric.far / metric.free — уже доли [0, 1] по всем ядрам и боям.
const mv = (r, k) => 100 * (r.ns ? r.ns.metric : r.naked.metric)[k];
row('вне радиуса удара, % (без чередования сторон)', f2(mv(was, 'far')), f2(mv(now, 'far')), '≥ 25', mv(now, 'far') >= 25);
row('свободное время, % (без чередования сторон)', f2(mv(was, 'free')), f2(mv(now, 'free')), '≤ 35', mv(now, 'free') <= 35);
if (was.ns) {
  const mm = (r, k) => 100 * r.naked.metric[k];
  row('вне радиуса удара, % (стороны чередуются)', f2(mm(was, 'far')), f2(mm(now, 'far')), '≥ 25', mm(now, 'far') >= 25);
  row('свободное время, % (стороны чередуются)', f2(mm(was, 'free')), f2(mm(now, 'free')), '≤ 35', mm(now, 'free') <= 35);
}
row(`медиана длины боя, с (все ${now.bouts} боёв)`, f2(was.med), f2(now.med), '≤ 55', now.med <= 55);
row('доля боёв дольше 100 с, %', f2(100 * was.over100 / was.bouts), f2(100 * now.over100 / now.bouts), '≤ 0.1', 100 * now.over100 / now.bouts <= 0.1);
row('таймаутов (боёв, дошедших до потолка 240 с)', String(was.capped), String(now.capped), '0', now.capped === 0);

console.log(`боёв в замере: было ${was.bouts}, стало ${now.bouts}`);
console.log('| метрика | было (92ff8c27) | стало (ветка) | порог | |\n| --- | --- | --- | --- | --- |');
console.log(rows.join('\n'));
