// klich-order-report.mjs — СВОД приёмки «приказ внутри группы» по сырым данным docs/klich-reach/out/order/raw (копия дерева не нужна).
//   node scripts/klich-order-report.mjs [набор=1|201]   → out/order/set<от>.md и summary<от>.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const REPO = new URL('..', import.meta.url).pathname;
const OUT = join(REPO, 'docs/klich-reach/out/order');
const FROM = process.argv[2] || '1';
const CORES = ['natisk', 'nalet', 'skala', 'zasada'], COMPS = ['bare', 'a', 'b', 'c', 's'], KL = ['push', 'fallback', 'hold'];
const CN = { natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH' };
const KN = { push: 'ВПЕРЁД', fallback: 'ОТХОД', hold: 'ДЕРЖАТЬ' };
const CPN = { bare: 'голое', a: 'ветвь A', b: 'ветвь B', c: 'ветвь C', s: 'россыпь 2+2+1' };
const INTENTS = ['press', 'strike', 'sting', 'hold', 'break', 'breathe', 'catch'];
const GROUPS = { push: ['press', 'strike'], fallback: ['break', 'sting', 'breathe'], hold: ['hold', 'catch'] };
const D = {};
for (const c of CORES) { const f = join(OUT, `raw/s${FROM}-${c}.json`); if (!existsSync(f)) throw new Error('нет ' + f); D[c] = JSON.parse(readFileSync(f, 'utf8')); }
const pc = (x, d = 1) => (100 * x).toFixed(d) + '%';
const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => sum(a) / a.length;
const med = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
let rs = 12345; const rnd = () => { rs = (rs + 0x6D2B79F5) >>> 0; let t = rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const z7 = () => INTENTS.map(() => 0);
const addv = (a, b) => a.map((x, i) => x + b[i]);
const foesOf = (core, comp) => Object.values(D[core].comps[comp].foes);
// сводка решений по (набор ядер, состав, клич)
function agg(cores, comps, kl) {
  const r = { n: 0, nS: 0, nN: 0, cS: z7(), cN: z7(), cNK: z7(), over: 0, overTag: 0, tagDec: 0 };
  for (const c of cores) for (const cp of comps) for (const F of foesOf(c, cp)) { const R = F.klich[kl]; for (const k of ['n', 'nS', 'nN', 'over', 'overTag', 'tagDec']) r[k] += R[k]; r.cS = addv(r.cS, R.cS); r.cN = addv(r.cN, R.cN); r.cNK = addv(r.cNK, R.cNK); }
  return r;
}
const inGrp = (v, kl) => sum(GROUPS[kl].map((i) => v[INTENTS.indexOf(i)]));
// пары боёв: кластер = (ядро, враг, зерно); в нём бой без клича и бой с каждым кличем
function clusters(cores, comp, kls) {
  const cl = [];
  for (const c of cores) for (const F of foesOf(c, comp)) for (let i = 0; i < F.base.w.length; i++) cl.push({ bw: F.base.w[i], bs: F.base.sec[i], kw: kls.map((k) => F.klich[k].w[i]), ks: kls.map((k) => F.klich[k].sec[i]) });
  return cl;
}
function pairedStats(cl) {
  const allBase = cl.map((x) => x.bs), allK = cl.flatMap((x) => x.ks);
  const shift = med(allK) - med(allBase);
  const dw = (idx) => cl.map((x) => x.kw.reduce((a, b) => a + b, 0) / x.kw.length - x.bw);
  const dws = dw(); const dwm = mean(dws); const dwse = Math.sqrt(dws.reduce((a, b) => a + (b - dwm) ** 2, 0) / (dws.length - 1) / dws.length);
  const B = 400, sh = [];
  for (let b = 0; b < B; b++) { const bs = [], ks = []; for (let i = 0; i < cl.length; i++) { const x = cl[(rnd() * cl.length) | 0]; bs.push(x.bs); for (const s of x.ks) ks.push(s); } sh.push(med(ks) - med(bs)); }
  sh.sort((a, b) => a - b);
  return { medBase: med(allBase), medK: med(allK), shift, lo: sh[(B * 0.025) | 0], hi: sh[(B * 0.975) | 0], winShift: dwm, winLo: dwm - 1.96 * dwse, winHi: dwm + 1.96 * dwse, n: cl.length,
    over100K: allK.filter((x) => x > 100).length / allK.length, over100B: allBase.filter((x) => x > 100).length / allBase.length,
    toK: sum(cl.map((x) => x.ks.filter((s) => s >= 179.9).length)) };
}
let md = `# Приёмка «приказ внутри группы» — набор зёрен ${FROM}–${Number(FROM) + 199}\n\n`;
const sum_ = { set: FROM };
// ─── Г1
md += `## Г1 — доля решений из группы клича (полная сила, окно 5–13 с)\n\n«по очкам» — только решения, принятые по очкам (гейт: 100%). «по всем» — включая жёсткую нужду (показ, не гейт).\n\n| состав | клич | ядро | решений | по очкам в группе | по всем в группе |\n|---|---|---|---|---|---|\n`;
let g1min = 1; const g1rows = [];
for (const cp of COMPS) for (const kl of KL) for (const c of CORES) {
  const r = agg([c], [cp], kl); const a = r.nS ? inGrp(r.cS, kl) / r.nS : NaN, b = r.n ? (inGrp(r.cS, kl) + inGrp(r.cN, kl)) / r.n : NaN;
  if (a < g1min) g1min = a; g1rows.push({ cp, kl, c, n: r.n, a, b });
  md += `| ${CPN[cp]} | ${KN[kl]} | ${CN[c]} | ${r.n} | ${pc(a)} | ${pc(b)} |\n`;
}
md += `\n**минимум «по очкам» по 60 сочетаниям: ${pc(g1min, 2)}**\n\n### Г1 — свод по составу × клич (4 ядра вместе)\n\n| состав | клич | решений | жёсткая нужда | по очкам | по всем |\n|---|---|---|---|---|---|\n`;
for (const cp of COMPS) for (const kl of KL) { const r = agg(CORES, [cp], kl); md += `| ${CPN[cp]} | ${KN[kl]} | ${r.n} | ${pc(r.nN / r.n)} | ${pc(inGrp(r.cS, kl) / r.nS)} | ${pc((inGrp(r.cS, kl) + inGrp(r.cN, kl)) / r.n)} |\n`; }
sum_.g1min = g1min;
// ─── Г3
md += `\n## Г3 — характер: внутри группы распределение различается между ядрами\n\nДоля каждого намерения среди решений группы (по очкам, полная сила). «Разброс» — наибольшая разница между ядрами по одному намерению (п.п.) и пара ядер.\n`;
const g3 = {};
function g3block(title, comps) {
  md += `\n### ${title}\n\n| клич | намерение | ${CORES.map((c) => CN[c]).join(' | ')} | разброс | пара |\n|---|---|---|---|---|---|\n`;
  for (const kl of KL) {
    const per = CORES.map((c) => { const r = agg([c], comps, kl); const t = inGrp(r.cS, kl); return GROUPS[kl].map((i) => (t ? r.cS[INTENTS.indexOf(i)] / t : NaN)); });
    let bestSp = 0, bestPair = '';
    GROUPS[kl].forEach((it, j) => {
      const col = per.map((p) => p[j]); const mx = Math.max(...col), mn = Math.min(...col); const sp = (mx - mn) * 100;
      if (sp > bestSp) { bestSp = sp; bestPair = `${CN[CORES[col.indexOf(mx)]]} / ${CN[CORES[col.indexOf(mn)]]}`; }
      md += `| ${KN[kl]} | ${it.toUpperCase()} | ${col.map((x) => pc(x)).join(' | ')} | ${sp.toFixed(1)} | ${sp >= 10 ? '' : '<10'} |\n`;
    });
    g3[`${title}|${kl}`] = { spread: bestSp, pair: bestPair };
    md += `| | **макс. разброс** | | | | | **${bestSp.toFixed(1)} п.п.** | ${bestPair} |\n`;
  }
}
g3block('голые ядра', ['bare']);
g3block('собранные (A, B, C, россыпь вместе)', ['a', 'b', 'c', 's']);
for (const cp of ['a', 'b', 'c', 's']) g3block(`собранные: ${CPN[cp]}`, [cp]);
sum_.g3 = g3;
// ─── группа, которую выбирает каждый состав
md += `\n## Какое намерение группы выбирает состав (4 ядра вместе, по очкам)\n\n| состав | клич | ${GROUPS.push.concat(GROUPS.fallback, GROUPS.hold).filter((x, i, a) => a.indexOf(x) === i).length ? '' : ''}намерения группы (доля) |\n|---|---|---|\n`;
for (const cp of COMPS) for (const kl of KL) { const r = agg(CORES, [cp], kl); const t = inGrp(r.cS, kl); md += `| ${CPN[cp]} | ${KN[kl]} | ${GROUPS[kl].map((i) => `${i.toUpperCase()} ${pc(r.cS[INTENTS.indexOf(i)] / t)}`).join(' · ')} |\n`; }
// ─── перекрытие тегов
md += `\n## Сколько решений окна клич перекрыл (показ, не чинить)\n\n«изменил выбор» — решения по очкам, где действующий клич дал другое намерение, чем то же решение без клича (теги и резонанс на месте). «из них там, где теги вообще меняли выбор» — тот же счёт среди решений, где выбор тегов отличался от выбора без тегов (наклоны граней реально что-то решали).\n\n| состав | клич | по очкам | клич изменил выбор | доля | решений, где теги меняли выбор | клич перекрыл выбор тегов | доля |\n|---|---|---|---|---|---|---|---|\n`;
for (const cp of COMPS) for (const kl of KL) { const r = agg(CORES, [cp], kl); md += `| ${CPN[cp]} | ${KN[kl]} | ${r.nS} | ${r.over} | ${pc(r.over / r.nS)} | ${r.tagDec} | ${r.overTag} | ${r.tagDec ? pc(r.overTag / r.tagDec) : '—'} |\n`; }
// ─── Г4 и сдвиг побед
md += `\n## Г4 — длина боя и сдвиг доли побед\n\nМедиана — по всем боям с кличем состава (4 ядра × 4 врага × ${'200'} зерна × 3 клича) против боёв без клича на тех же зёрнах. Интервал — парный 95% (бутстреп по кластерам «ядро × враг × зерно»). Сдвиг побед — среднее по трём кличам, п.п.\n\n| состав | медиана без клича, с | медиана с кличем, с | сдвиг, с | интервал сдвига | >100 с без / с | таймауты с кличем | сдвиг побед, п.п. | интервал |\n|---|---|---|---|---|---|---|---|---|\n`;
const g4 = {};
for (const cp of COMPS) { const st = pairedStats(clusters(CORES, cp, KL)); g4[cp] = st;
  md += `| ${CPN[cp]} | ${st.medBase.toFixed(1)} | ${st.medK.toFixed(1)} | ${st.shift >= 0 ? '+' : ''}${st.shift.toFixed(2)} | [${st.lo.toFixed(2)}; ${st.hi.toFixed(2)}] | ${pc(st.over100B)} / ${pc(st.over100K)} | ${st.toK} | ${(st.winShift * 100).toFixed(2)} | [${(st.winLo * 100).toFixed(2)}; ${(st.winHi * 100).toFixed(2)}] |\n`; }
md += `\n### Г4 по каждому кличу (4 ядра вместе)\n\n| состав | клич | медиана без, с | с кличем, с | сдвиг, с | интервал | сдвиг побед, п.п. | интервал | >100 с с кличем | таймауты |\n|---|---|---|---|---|---|---|---|---|---|\n`;
const g4k = {}; let stopMedian = [];
for (const cp of COMPS) for (const kl of KL) { const st = pairedStats(clusters(CORES, cp, [kl])); g4k[`${cp}|${kl}`] = st;
  if (st.lo > 0) stopMedian.push(`${CPN[cp]} × ${KN[kl]}`);
  md += `| ${CPN[cp]} | ${KN[kl]} | ${st.medBase.toFixed(1)} | ${st.medK.toFixed(1)} | ${st.shift >= 0 ? '+' : ''}${st.shift.toFixed(2)} | [${st.lo.toFixed(2)}; ${st.hi.toFixed(2)}] | ${(st.winShift * 100).toFixed(2)} | [${(st.winLo * 100).toFixed(2)}; ${(st.winHi * 100).toFixed(2)}] | ${pc(st.over100K)} | ${st.toK} |\n`; }
md += `\n### Сдвиг побед по каждому сочетанию «состав × клич × ядро» (п.п., без интервала; единица — 200 зёрен × 4 врага)\n\n| состав | клич | ${CORES.map((c) => CN[c]).join(' | ')} |\n|---|---|---|---|---|---|\n`;
const wcell = {};
for (const cp of COMPS) for (const kl of KL) { const cells = CORES.map((c) => { const cl = clusters([c], cp, [kl]); const d = mean(cl.map((x) => x.kw[0] - x.bw)) * 100; wcell[`${cp}|${kl}|${c}`] = d; return (d >= 0 ? '+' : '') + d.toFixed(1); }); md += `| ${CPN[cp]} | ${KN[kl]} | ${cells.join(' | ')} |\n`; }
md += `\n### Г4 по каждому ядру (все составы и клича вместе) — медиана длины боя\n\n| ядро | состав | без клича | с кличем | сдвиг | интервал |\n|---|---|---|---|---|---|\n`;
const g4c = {};
for (const c of CORES) for (const cp of COMPS) { const st = pairedStats(clusters([c], cp, KL)); g4c[`${c}|${cp}`] = st; if (st.lo > 0) stopMedian.push(`${CN[c]} · ${CPN[cp]}`);
  md += `| ${CN[c]} | ${CPN[cp]} | ${st.medBase.toFixed(1)} | ${st.medK.toFixed(1)} | ${st.shift >= 0 ? '+' : ''}${st.shift.toFixed(2)} | [${st.lo.toFixed(2)}; ${st.hi.toFixed(2)}] |\n`; }
md += `\n**Медиана с кличем выше, чем без, за пределом интервала (стоп-кран):** ${stopMedian.length ? stopMedian.join('; ') : 'нет'}\n`;
sum_.g4 = g4; sum_.g4k = g4k; sum_.g4c = g4c; sum_.stopMedian = stopMedian; sum_.wcell = wcell;
writeFileSync(join(OUT, `set${FROM}.md`), md);
writeFileSync(join(OUT, `summary${FROM}.json`), JSON.stringify(sum_, null, 1) + '\n');
console.log(md.split('\n').filter((l) => /минимум|Медиана с кличем выше|макс\. разброс/.test(l)).join('\n'));
