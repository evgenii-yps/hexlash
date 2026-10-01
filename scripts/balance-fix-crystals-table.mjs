// balance-fix-crystals-table.mjs <тег> — сводка по целям Ц2–Ц5 из пересъёма 60 кристаллов (docs/balance-fix/out/<тег>/crystals/partA.json, partB.json).
// Ц2: полная грань +15…+25 п.п. к голому ядру (12). Ц3: кристалл в одиночку ≤ +12 п.п., ни один значимо отрицательный. Ц4: ≥5% решений меняет каждый (60).
// Ц5: в полной грани каждый кристалл что-то меняет (боёв, неотличимых от «без него», нет), вершина жива в грани.
// Значимость — по 95% интервалу из отчёта перезамера (парный сдвиг, 800 боёв на ячейку = 4 врага × 200 зёрен). Повтор на втором наборе зёрен —
// отдельной проверкой (прогон пересъёма идёт на зёрнах 1–200; второй набор — `--seeds2` в balance-fix-crystals.sh).
import { readFileSync, writeFileSync } from 'node:fs';
const tag = process.argv[2];
const dir = new URL(`../docs/balance-fix/out/${tag}/crystals/`, import.meta.url).pathname;
const A = JSON.parse(readFileSync(dir + 'partA.json', 'utf8')).cells;
const B = JSON.parse(readFileSync(dir + 'partB.json', 'utf8')).cells;
const NAME = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const BN = { a: 'BODY', b: 'MIND', c: 'WILL' };
const f1 = (x) => (x >= 0 ? '+' : '') + x.toFixed(1);
const L = [];
const full = B.filter((c) => c.fullVsBare);
L.push('### Ц2. Полная грань против голого своего ядра (цель +15…+25 п.п.)\n', '| ядро | грань | доля побед, % | сдвиг п.п. [95%] | медиана, с | в цели? |', '| --- | --- | --- | --- | --- | --- |');
let c2ok = 0;
for (const c of full) { const w = c.fullVsBare.win; const ok = w.delta >= 15 && w.delta <= 25; if (ok) c2ok++; L.push(`| ${NAME[c.fullVsBare.core]} | ${BN[c.fullVsBare.branch]} | ${w.rate.toFixed(1)} | ${f1(w.delta)} [${f1(w.ciLo)}…${f1(w.ciHi)}] | ${c.fullVsBare.median.cell.toFixed(1)} | ${ok ? 'да' : 'НЕТ'} |`); }
L.push(`\nВ цели: **${c2ok} из 12**.\n`);
const cells = B.filter((c) => c.core);
let c3over = 0, c3neg = 0, c4ok = 0, c5ok = 0, vertOk = 0;
L.push('### Ц3–Ц5. 60 кристаллов\n', '| ядро | кристалл | одиночка Δ п.п. [95%] | решений меняет, % (Ц4 ≥5) | в грани: боёв неотличимых из 800 | в грани: решений меняет, % | жив в грани | замечания |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
const bad = { c3: [], c4: [], c5: [] };
for (const c of cells) {
  const a = A.find((x) => x.core === c.core && x.branch === c.branch && x.idx === c.idx);
  const w = a.win; const dec = a.decisions.chgAll * 100;
  const ib = c.inBranch; const ibDec = ib.decisions.chgAll * 100;
  const notes = [];
  if (w.delta > 12) { notes.push('Ц3: > +12'); c3over++; bad.c3.push(c); }
  if (w.ciHi < 0) { notes.push('Ц3: значимо < 0'); c3neg++; bad.c3.push(c); }
  if (dec >= 5) c4ok++; else { notes.push('Ц4: < 5%'); bad.c4.push(c); }
  if (ib.identical === 0) c5ok++; else { notes.push(`Ц5: неотличимых ${ib.identical}`); bad.c5.push(c); }
  const alive = c.alive && c.alive.branch;
  if (c.idx === 5) { if (alive) vertOk++; else notes.push('вершина мертва в грани'); }
  L.push(`| ${NAME[c.core]} | ${BN[c.branch]}/${c.idx} ${c.dataName} | ${f1(w.delta)} [${f1(w.ciLo)}…${f1(w.ciHi)}] | ${dec.toFixed(1)} | ${ib.identical} | ${ibDec.toFixed(1)} | ${alive ? 'да' : 'нет'} | ${notes.join('; ')} |`);
}
L.push(`\nЦ3: больше +12 — **${c3over}**; значимо отрицательных — **${c3neg}**. Ц4: ≥5% решений — **${c4ok} из 60**. Ц5: нет неотличимых боёв в грани — **${c5ok} из 60**; вершин живых в грани — **${vertOk} из 12**.`);
writeFileSync(dir + 'targets.md', L.join('\n'));
writeFileSync(dir + 'targets.json', JSON.stringify({ c2ok, c3over, c3neg, c4ok, c5ok, vertOk, c4fail: bad.c4.map((c) => `${c.core}:${c.branch}${c.idx}`), c3fail: [...new Set(bad.c3.map((c) => `${c.core}:${c.branch}${c.idx}`))], c5fail: bad.c5.map((c) => `${c.core}:${c.branch}${c.idx}`) }, null, 1));
console.log(L.join('\n'));
