// promises-table.mjs — свод разведки «обещания текстов» (TZ_promises_v1, шаг 1): признаки с кристаллом и без, по двум половинам зёрен.
// ЗАПУСК: node scripts/promises-table.mjs [папка с сырьём, по умолчанию docs/promises/out]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const DIR = process.argv[2] || 'docs/promises/out';
const DT = 1 / 60;
const FOES = ['natisk', 'nalet', 'skala', 'zasada'];
const load = (name, from) => JSON.parse(readFileSync(join(DIR, `${name}-s${from}.json`), 'utf8')).foes;
function agg(name, froms) {
  const A = {};
  for (const from of froms) { const F = load(name, from); for (const f of FOES) for (const [k, v] of Object.entries(F[f])) {
    if (Array.isArray(v)) { A[k] = A[k] || v.map(() => 0); v.forEach((x, i) => { A[k][i] += x; }); } else A[k] = (A[k] || 0) + v;
  } }
  return A;
}
const I = (S) => ({
  win: 100 * S.w / S.bouts, sec: S.sec / S.bouts,
  launchPer10: 10 * S.launches / S.sec,
  lateRatio: (S.lLast / S.secLast) / (S.lFirst / S.secFirst),
  first10: 10 * S.lFirst / S.secFirst, last10: 10 * S.lLast / S.secLast,
  series: (S.lN[1] + 2 * S.lN[2] + 3 * S.lN[3]) / S.launches, multiShare: 100 * (S.lN[2] + S.lN[3]) / S.launches,
  interval: S.lGapSum / S.lGapN,
  reachThrow10: 10 * S.reachLaunches / (S.reachSteps * DT),
  hitNorm: 100 * S.sdNorm / S.contacts, punchNorm: 100 * S.punchSdNorm / S.punchN, dmgContact: 100 * S.sd / S.contacts,
  dealtPerHit: S.foeDealt / S.foeHits, hitsPerBout: S.foeHits / S.bouts, dealtPerBout: S.foeDealt / S.bouts, takenPerBout: S.taken / S.bouts,
  openResp: 100 * S.openResponded / S.openEntries, openPerBout: S.openEntries / S.bouts,
  afterClose: 100 * S.afterClose / S.afterSteps,
  quietAttack: 100 * S.quietAttack / S.quietSteps, quietClose: 100 * S.quietClose / S.quietSteps, quietLaunch10: 10 * S.quietLaunch / (S.quietSteps * DT), quietPerBout: S.quietSteps * DT / S.bouts,
  foeRegenPerSec: S.foeRegen / (S.pressSteps * DT), foeStam: 100 * S.foeStamSum / S.foeStamN,
  feintPerBout: S.feints / S.bouts, baitRate: 100 * S.baits / S.feints, payoffPerBout: S.payoffs / S.bouts, fpBonus: 100 * S.fpBonus / Math.max(1, S.fpN), fpPen: S.fpPen / Math.max(1, S.fpN), nfpPen: S.nfpPen / S.nfpN, fpPerBout: S.fpN / S.bouts,
  dodgePerBout: S.dodges / S.bouts, ripPerBout: S.ripN / S.bouts, ripBonus: 100 * S.ripBonus / Math.max(1, S.ripN), ripSd: 100 * S.ripSd / Math.max(1, S.ripN),
  far: 100 * S.far / S.steps, free: 100 * S.free / S.steps,
  it: S.it.map((x) => 100 * x / S.steps),
});
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '—');
export function row(label, key, fmt, bare, solo, bareH, soloH, unit = '') {
  const g = (o) => o[key];
  const rel = (b, s) => (Number.isFinite(b) && b !== 0 ? ` (${s / b - 1 >= 0 ? '+' : ''}${(100 * (s / b - 1)).toFixed(0)}%)` : '');
  const h = bareH.map((b, i) => `${fmt(g(b))}→${fmt(g(soloH[i]))}`).join(' / ');
  return `| ${label} | ${fmt(g(bare))}${unit} | ${fmt(g(solo))}${unit}${rel(g(bare), g(solo))} | ${h} |`;
}
const T = (core, solo) => ({ bare: I(agg(`${core}-bare`, [1, 401])), solo: I(agg(solo, [1, 401])), bareH: [1, 401].map((f) => I(agg(`${core}-bare`, [f]))), soloH: [1, 401].map((f) => I(agg(solo, [f]))) });
const out = [];
const block = (title, core, solo, rows) => {
  const t = T(core, solo);
  out.push(`\n#### ${title}\n`, '| признак | без кристалла | с кристаллом | половины зёрен (1–400 / 401–800): без→с |', '| --- | --- | --- | --- |');
  for (const [label, key, fmt, unit] of rows) out.push(row(label, key, fmt, t.bare, t.solo, t.bareH, t.soloH, unit || ''));
  out.push(row('доля побед против поля, %', 'win', f1, t.bare, t.solo, t.bareH, t.soloH));
};
const common = [['длина боя, с', 'sec', f1]];
block('ONSLAUGHT · Heavy Hit (a1)', 'natisk', 'natisk-a1-solo', [
  ['мощность удара, нормированная на ход (strikePower × силы), % от базы', 'hitNorm', f2],
  ['мощность прямого удара (PUNCH), %', 'punchNorm', f2],
  ['урон за контакт (по всем ходам), % maxHP', 'dmgContact', f2],
  ['фактический урон за попавший удар, HP', 'dealtPerHit', f2],
  ['ударов-запусков за 10 с', 'launchPer10', f2], ['пауза между запусками, с', 'interval', f2], ['серии (DOUBLE+COMBO), % запусков', 'multiShare', f1], ...common]);
for (const [cell, title] of [['c1', 'Long Combo (c1)'], ['c2', 'No Pause (c2)'], ['c3', 'Late Fire (c3)'], ['c4', 'No Letup (c4)']]) {
  block(`ONSLAUGHT · ${title}`, 'natisk', `natisk-${cell}-solo`, [
    ['запусков ударов за 10 с (весь бой)', 'launchPer10', f2],
    ['… за 10 с в ПЕРВОЙ трети боя', 'first10', f2], ['… за 10 с в ПОСЛЕДНЕЙ трети боя', 'last10', f2], ['последняя / первая треть', 'lateRatio', f2],
    ['ударов в серии (в среднем на запуск)', 'series', f2], ['серии (DOUBLE+COMBO), % запусков', 'multiShare', f1],
    ['пауза между запусками, с', 'interval', f2],
    ['запусков за 10 с, пока враг в радиусе удара', 'reachThrow10', f2],
    ['враг открыт (отдача/сбив): доля, на которую отвечает ударом за 0.6 с, %', 'openResp', f1],
    ['мощность удара (норм.), %', 'hitNorm', f2],
    ['вплотную в 1.5 с после обмена, % времени', 'afterClose', f1],
    ['враг затих ≥ 2 с: боец в ударе, % времени', 'quietAttack', f1], ['… вплотную, % времени', 'quietClose', f1], ['… запусков за 10 с затишья', 'quietLaunch10', f2],
    ['запас сил врага под давлением (вплотную): набор в секунду', 'foeRegenPerSec', f2], ['средний запас сил врага, %', 'foeStam', f1], ...common]);
}
for (const [cell, title] of [['b2', 'Punish Reaction (b2)'], ['b5', 'Setup Combo (b5)']]) {
  block(`RAIDER · ${title}`, 'nalet', `nalet-${cell}-solo`, [
    ['финтов за бой', 'feintPerBout', f2], ['враг «клюнул», % финтов', 'baitRate', f1], ['ударов-расплат за бой', 'fpPerBout', f2],
    ['бонус урона удара-расплаты, %', 'fpBonus', f1], ['пробой гарда у удара-расплаты', 'fpPen', f2], ['пробой гарда у обычного удара', 'nfpPen', f2],
    ['мощность удара (норм.), %', 'hitNorm', f2], ['запусков за 10 с', 'launchPer10', f2], ...common]);
}
block('AMBUSH · Slip Counter (a2)', 'zasada', 'zasada-a2-solo', [
  ['уворотов за бой', 'dodgePerBout', f2], ['ответов после уворота/блока/промаха за бой', 'ripPerBout', f2],
  ['бонус урона такого ответа, %', 'ripBonus', f2], ['урон ответа, % maxHP', 'ripSd', f2], ['мощность удара (норм.), %', 'hitNorm', f2], ['запусков за 10 с', 'launchPer10', f2], ...common]);
for (const [name, title] of [['zasada-b3-solo', 'всё вместе'], ['zasada-b3-axes', 'только сдвиги осей'], ['zasada-b3-leans', 'только склонность выбора']]) {
  block(`AMBUSH · Run 'Em Ragged / LONG GAME (b3) — ${title}`, 'zasada', name, [
    ['вне радиуса удара (≥1.45), % времени', 'far', f1], ['свободное время, %', 'free', f1],
    ['запусков за 10 с', 'launchPer10', f2], ['ударов-попаданий по врагу за бой', 'hitsPerBout', f2],
    ['нанесено HP за бой', 'dealtPerBout', f1], ['получено HP за бой', 'takenPerBout', f1], ['уворотов за бой', 'dodgePerBout', f2],
    ['враг открыт: отвечает ударом, %', 'openResp', f1], ['запас сил врага, %', 'foeStam', f1], ...common]);
}
const names = ['PRESS', 'STRIKE', 'STING', 'HOLD', 'BREAK', 'BREATHE', 'CATCH'];
for (const [core, solo] of [['zasada', 'zasada-b3-solo'], ['zasada', 'zasada-b3-axes'], ['zasada', 'zasada-b3-leans']]) {
  const t = T(core, solo); out.push(`\nнамерения AMBUSH (% времени) без → ${solo}: ` + names.map((n, i) => `${n} ${f1(t.bare.it[i])}→${f1(t.solo.it[i])}`).join(' · '));
}
console.log(out.join('\n'));
