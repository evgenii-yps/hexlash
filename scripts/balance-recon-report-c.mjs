// balance-recon-report-c.mjs — СВОД: пункты 11–14 (клич, баффы, заряды). ЗАПУСК: node scripts/balance-recon-report-c.mjs [klich] [buff] [combo] [timing] [replace]
import { CORES, CORE_NAME, md, f1, f2, f3, pct, sgn, mean, sd, median, pairedShift, loadRaw, hasRaw, sumArr, writeSection, bits, DT } from './balance-recon-lib.mjs';
import { openHarness } from './lib/bout-harness.mjs';

const want = new Set(process.argv.slice(2));
const all = want.size === 0;
const N = (c) => CORE_NAME[c];
const SETS = [1, 201];
const ci = (ps) => `${sgn(ps.delta)} [${sgn(ps.delta - 1.96 * ps.se)}…${sgn(ps.delta + 1.96 * ps.se)}]`;
const pairedMean = (a, b) => { const d = []; for (let i = 0; i < a.length; i++) if (a[i] >= 0 && b[i] >= 0) d.push(a[i] - b[i]); const m = mean(d); const se = sd(d) / Math.sqrt(d.length); return { m, se, n: d.length }; };
const cm = (x) => `${sgn(x.m, 2)} ±${f2(1.96 * x.se)}`;
const H = await openHarness();
const { load } = H;
const { KLICH_BALANCE } = await load('/src/data/klichBalance.js');
const { BUFF_BALANCE } = await load('/src/data/buffBalance.js');

// ════════ ПУНКТЫ 11 и 12: клич ════════
if (all || want.has('klich')) {
  const MODES = ['none', 'push', 'fallback', 'hold'];
  const agg = {}; // agg[trig][mode][core]
  for (const trig of ['t5', 'hp20']) {
    agg[trig] = {};
    for (const m of MODES) { agg[trig][m] = {}; for (const c of CORES) {
      const a = { w: [], wFired: [], taken: [], dealt: [], secFired: [], died: 0, fired: 0, bouts: 0, win: { n: 0, stam: 0, stamEnd: 0, stamEndN: 0, dist: 0, sp: 0, taken: 0, dealt: 0, swings: 0, blk: 0, free: 0, far: 0 }, decFull: 0, decLowHp: 0, decLowHpPushStrike: 0, actFull: {}, actLowHpFull: {}, actLow: {}, needLow: 0, swingNeed: 0, swingSame: 0, swingDiff: 0, need: 0, hpAtF: [], tF: [] };
      for (const s of SETS) {
        const r = loadRaw(`klichwin-${trig}-${c}-s${s}`).cores[c][m];
        a.w.push(...r.w); a.wFired.push(...r.wFired); a.taken.push(...r.sumWinTaken); a.dealt.push(...r.sumWinDealt); a.secFired.push(...r.secFired);
        for (const k of ['died', 'fired', 'bouts', 'decFull', 'decLowHp', 'decLowHpPushStrike', 'needLow', 'swingNeed', 'swingSame', 'swingDiff', 'need']) a[k] += r[k] || 0;
        for (const k of Object.keys(a.win)) a.win[k] += r.win[k];
        for (const kk of ['actFull', 'actLowHpFull', 'actLow']) for (const [act, n] of Object.entries(r[kk] || {})) a[kk][act] = (a[kk][act] || 0) + n;
        a.hpAtF.push(...r.hpAtF); a.tF.push(...r.tF);
      }
      agg[trig][m][c] = a;
    } }
  }
  const pool = (trig, m) => {
    const p = { w: [], wFired: [], taken: [], dealt: [], fired: 0, bouts: 0, died: 0, win: { n: 0, stam: 0, stamEnd: 0, stamEndN: 0, dist: 0, sp: 0, taken: 0, dealt: 0, swings: 0, blk: 0, free: 0, far: 0 }, decFull: 0, decLowHp: 0, decLowHpPushStrike: 0, actFull: {}, actLowHpFull: {}, actLow: {}, needLow: 0, swingNeed: 0, swingSame: 0, swingDiff: 0, need: 0, hpAtF: [], tF: [] };
    for (const c of CORES) { const a = agg[trig][m][c]; p.w.push(...a.w); p.wFired.push(...a.wFired); p.taken.push(...a.taken); p.dealt.push(...a.dealt); for (const k of ['fired', 'bouts', 'died', 'decFull', 'decLowHp', 'decLowHpPushStrike', 'needLow', 'swingNeed', 'swingSame', 'swingDiff', 'need']) p[k] += a[k]; for (const k of Object.keys(p.win)) p.win[k] += a.win[k]; for (const kk of ['actFull', 'actLowHpFull', 'actLow']) for (const [act, n] of Object.entries(a[kk])) p[kk][act] = (p[kk][act] || 0) + n; p.hpAtF.push(...a.hpAtF); p.tF.push(...a.tF); }
    return p;
  };
  const L = []; const out = {};
  // ── п.11: t5
  L.push('## Пункт 11. Клич: ОТХОД и ВПЕРЁД');
  L.push('');
  L.push('**Ссылка на отчёт клича** (`docs/klich-reach/REPORT.md`, раунд 3, 4 ядра × 5 составов × 200+200 зёрен): ОТХОД снижает долю побед на **1.5…2 п.п.** почти во всех составах (повторилось на обоих наборах), ВПЕРЁД и ДЕРЖАТЬ — в пределах шума; у ONSLAUGHT ВПЕРЁД «почти ничего не меняет» (он и так давит, PRESS ≈ 100%). Длина боя с кличем не меняется.');
  L.push('');
  L.push('**НОВЫЙ ЗАМЕР — что делают запас сил и полученный урон в окне клича.** Клич брошен на бойца-игрока в t = 5 с (как в прошлых замерах), окно 8 с (6 с полной силы + 2 с затухание); голые ядра против 4 голых, 4 ядра × 4 врага × 400 зёрен = 6400 боёв на режим; все режимы на одних и тех же зёрнах (парное сравнение). «Запас сил» — доля от полного, среднее по тикам окна и значение в конце окна.');
  L.push('');
  const base5 = pool('t5', 'none');
  const rows = [];
  out.t5 = {};
  for (const m of MODES) {
    const p = pool('t5', m); const n = p.fired;
    const dW = pairedShift(p.w, base5.w);
    const dT = pairedMean(p.taken, base5.taken), dD = pairedMean(p.dealt, base5.dealt);
    const w = p.win; const b = base5.win;
    const r = { dW, dT, dD, stam: w.stam / w.n, stamEnd: w.stamEnd / Math.max(1, w.stamEndN), taken: w.taken / n, dealt: w.dealt / n, swings: w.swings / n, dist: w.dist / w.n, sp: w.sp / w.n, free: w.free / w.n, blk: w.blk / w.n, far: w.far / w.n };
    out.t5[m] = r;
    rows.push([m === 'none' ? 'без клича' : { push: 'ВПЕРЁД (push)', fallback: 'ОТХОД (fallback)', hold: 'ДЕРЖАТЬ (hold)' }[m], m === 'none' ? f1(100 * mean(p.w)) : `${f1(100 * mean(p.w))} (${ci(dW)})`, pct(r.stam, 1), pct(r.stamEnd, 1), f2(r.taken), m === 'none' ? '—' : cm(dT), f2(r.dealt), m === 'none' ? '—' : cm(dD), f1(r.swings), f2(r.dist), f2(r.sp), pct(r.free, 0), pct(r.far, 0), pct(r.blk, 0)]);
  }
  L.push(md(['режим', 'доля побед, % (сдвиг к «без клича» [95%])', 'запас сил в окне (среднее)', 'запас сил на конец окна', 'получено HP за окно', 'Δ к «без клича» (парно, HP) ', 'нанесено HP за окно', 'Δ (парно, HP)', 'замахов за окно', 'дистанция до врага', 'скорость, ед./с', 'свободное время', 'вне радиуса 1.45', 'в блоке'], rows));
  L.push('');
  // по ядрам для ОТХОДА
  L.push('**ОТХОД по ядрам** (t = 5 с, 1600 боёв на ядро):');
  L.push('');
  const rowsF = CORES.map((c) => {
    const a = agg.t5.fallback[c], b = agg.t5.none[c];
    const dW = pairedShift(a.w, b.w); const dT = pairedMean(a.taken, b.taken); const dD = pairedMean(a.dealt, b.dealt);
    return [N(c), ci(dW), `${pct(a.win.stam / a.win.n, 1)} vs ${pct(b.win.stam / b.win.n, 1)}`, `${pct(a.win.stamEnd / Math.max(1, a.win.stamEndN), 1)} vs ${pct(b.win.stamEnd / Math.max(1, b.win.stamEndN), 1)}`, cm(dT), cm(dD), `${f2(a.win.dist / a.win.n)} vs ${f2(b.win.dist / b.win.n)}`];
  });
  L.push(md(['ядро', 'сдвиг доли побед, п.п. [95%]', 'запас сил в окне: ОТХОД vs без', 'запас на конец окна', 'Δ получено HP', 'Δ нанесено HP', 'дистанция'], rowsF));
  L.push('');
  const fb = out.t5.fallback, nn = out.t5.none;
  L.push(`**Есть ли у ОТХОДА польза сейчас.** За окно ОТХОД даёт: запас сил ${pct(fb.stam, 1)} против ${pct(nn.stam, 1)} (${sgn(100 * (fb.stam - nn.stam), 1)} п.п.), на конец окна ${pct(fb.stamEnd, 1)} против ${pct(nn.stamEnd, 1)}; полученный урон ${cm(fb.dT)} HP за окно (парно; отрицательное = получает меньше); нанесённый ${cm(fb.dD)} HP; дистанция до врага ${f2(fb.dist)} против ${f2(nn.dist)}. Итог на исход: ${ci(fb.dW)} п.п.`);
  L.push('');
  // ── п.12
  L.push('## Пункт 12. Клич против выживания');
  L.push('');
  L.push('**Порядок выбора в коде (подтверждено чтением).** `chooseIntentionSpinal` (`src/data/intentions.js:129`): жёсткая нужда (`hardNeed`) → очки (`spinalScore`); в гибриде с думающей моделью `chooseIntentionModel` (строки 118–124): жёсткая нужда → **свежий ответ модели** → очки. Клич в очках режет выбор до группы только на полной силе (`self.klich.k ≥ 1`, строки 246–253) и **только внутри очков**: нужду не затрагивает; модель о кличе не знает (долг №1 в отчёте клича).');
  L.push('');
  L.push('**Жёсткой нужды по здоровью нет.** В `hardNeed` три нужды — запас сил, ответ на замах, заряд; здоровья (`hp01`) функция не читает вовсе; во всём `intentions.js` `hp01` встречается только в условиях наклонов тегов (`selfHpLow`, `foeHpLow`, `hpDropped` — строки 200–213), то есть в очках, и только у бойца с зажжёнными кристаллами с такими тегами. Голое ядро на 5% здоровья решает так же, как на 100%.');
  L.push('');
  L.push('**НОВЫЙ ЗАМЕР.** Клич брошен в момент, когда здоровье бойца-игрока **впервые упало до 20% и ниже** (а не в фиксированную секунду); окно 8 с; те же зёрна и враги для всех режимов; 4 ядра × 4 врага × 400 зёрен, но клич бросается только в боях, где здоровье дошло до 20% (остальное — игрок выигрывал чисто).');
  L.push('');
  const base20 = pool('hp20', 'none');
  const rows12 = []; out.hp20 = {};
  const firedIdx = base20.wFired.map((x, i) => (x >= 0 ? i : -1)).filter((i) => i >= 0);
  for (const m of MODES) {
    const p = pool('hp20', m);
    const wF = firedIdx.map((i) => p.wFired[i]), bF = firedIdx.map((i) => base20.wFired[i]);
    const dW = pairedShift(wF, bF);
    const dT = pairedMean(p.taken, base20.taken);
    const n = p.fired;
    const low = p.decLowHp;
    const ps = (p.actLow.press || 0) + (p.actLow.strike || 0);
    out.hp20[m] = { fired: n, winFired: 100 * mean(wF), dW, died: p.died / n, decLow: low / n, pressStrikeLow: ps / n, swings: p.win.swings / n, taken: p.win.taken / n, dealt: p.win.dealt / n };
    rows12.push([m === 'none' ? 'без клича' : { push: 'ВПЕРЁД', fallback: 'ОТХОД', hold: 'ДЕРЖАТЬ' }[m], n, `${f1(100 * mean(wF))}${m === 'none' ? '' : ' (' + ci(dW) + ')'}`, pct(p.died / n, 1), f1(low / n), f1(ps / n), pct(ps / Math.max(1, low), 0), f1(p.win.swings / n), f2(p.win.taken / n), m === 'none' ? '—' : cm(dT)]);
  }
  L.push(md(['режим', 'боёв с падением до 20%', 'доля побед в этих боях, % (сдвиг)', 'боец погиб за окно', 'решений в окне при здоровье ≤ 20% (на бой)', '…из них PRESS или STRIKE (на бой)', 'доля PRESS/STRIKE среди них', 'замахов за окно (на бой)', 'получено HP за окно', 'Δ парно, HP'], rows12));
  L.push('');
  const pu = pool('hp20', 'push');
  L.push(`**Сколько раз боец с ≤ 20% здоровья под ВПЕРЁД выполняет ВПЕРЁД и идёт в размен.** На бой (в среднем): решений при здоровье ≤ 20% в окне — ${f1(pu.decLowHp / pu.fired)}; из них PRESS/STRIKE — ${f1(((pu.actLow.press || 0) + (pu.actLow.strike || 0)) / pu.fired)} (${pct(((pu.actLow.press || 0) + (pu.actLow.strike || 0)) / Math.max(1, pu.decLowHp), 0)}); под полной силой клича (k = 1) решений при ≤ 20% — ${f1(Object.values(pu.actLowHpFull).reduce((a, b) => a + b, 0) / pu.fired)}, из них в группе ВПЕРЁД ${f1(pu.decLowHpPushStrike / pu.fired)}. Без клича те же бойцы выбирали PRESS/STRIKE в ${pct((((base20.actLow.press || 0) + (base20.actLow.strike || 0)) / Math.max(1, base20.decLowHp)), 0)} решений; замахов за окно: ${f1(pu.win.swings / pu.fired)} против ${f1(base20.win.swings / base20.fired)}. Погибло за окно: ${pct(pu.died / pu.fired, 1)} против ${pct(base20.died / base20.fired, 1)} без клича.`);
  L.push('');
  L.push(`**Ответ на замах при ВПЕРЁД идёт «как без клича» — ${pu.swingDiff === 0 ? 'ПОДТВЕРЖДЕНО' : 'НЕ подтверждено'}.** В коде: \`swingReply\` ограничивает выбор множеством {CATCH, BREAK, HOLD} (строка 159); группа ВПЕРЁД = {PRESS, STRIKE} с ним не пересекается → \`cut\` пуст → \`pool = only\` (строки 247–251). В замере (режим ВПЕРЁД при t = 5 с и при ≤ 20%, решения с k = 1 и нуждой «замах»): ответ совпал с ответом без клича в ${pu.swingSame} из ${pu.swingNeed} случаев при hp20, а по t5: ${pool('t5', 'push').swingSame} из ${pool('t5', 'push').swingNeed}.`);
  L.push('');
  writeSection('klich', L.join('\n'), out);
}

// ════════ ПУНКТ 13: баффы ════════
const buffAgg = (prefix, keys) => {
  const agg = {};
  for (const c of CORES) for (const s of SETS) {
    const o = loadRaw(`${prefix}-${c}-s${s}`).cores[c];
    for (const [k, r] of Object.entries(o)) {
      const a = agg[k] || (agg[k] = { w: [], sec: [], applied: [], healed: 0, winSums: null, winBouts: 0, perCore: {} });
      a.w.push(...r.w); a.sec.push(...r.sec); a.applied.push(...r.applied); a.healed += r.healed;
      if (r.winSums) { if (!a.winSums) a.winSums = {}; for (const [kk, v] of Object.entries(r.winSums)) { if (Array.isArray(v)) { a.winSums[kk] = a.winSums[kk] || v.map(() => 0); v.forEach((x, i) => { a.winSums[kk][i] += x; }); } else a.winSums[kk] = (a.winSums[kk] || 0) + v; } a.winBouts += r.winBouts || 0; }
      (a.perCore[c] = a.perCore[c] || { w: [], sec: [] }); a.perCore[c].w.push(...r.w); a.perCore[c].sec.push(...r.sec);
    }
  }
  return agg;
};
if (all || want.has('buff')) {
  const A = buffAgg('buff');
  const none = A.none;
  const L = []; const out = {};
  L.push('## Пункт 13. Баффы');
  L.push('');
  L.push('### Что делает каждый бафф (числа, где живёт, сколько длится)');
  L.push('');
  const B = BUFF_BALANCE;
  L.push(md(['бафф', 'что делает в числах', 'сколько длится', 'где числа', 'где механика', 'что делает боец (рычаг)'], [
    ['TOWEL', `лечит ${pct(B.towel.healFracOfMax, 0)} полного здоровья равномерно (${f2(B.towel.healFracOfMax * 100 / B.towel.durationSec)} HP/с при maxHp 100); выход из сбива ×${B.towel.staggerRecoverMul} по времени`, `${B.towel.durationSec} с`, '`src/data/buffBalance.js` `BUFF_BALANCE.towel`', '`src/services/buffs.js` `applyBuff` + `buffTick`', '`heal(frac)`, `shortenStagger(mul)` в `buildFighter.js` (защищён)'],
    ['BUCKET', `множитель скорости ХОДА ×${B.bucket.paceMul} (+30%); частоту ударов не трогает (решение 22.09.2026)`, `${B.bucket.durationSec} с`, '`BUFF_BALANCE.bucket`', '`buffs.js` `applyBuff`', '`setBuffPace(mul)` → `buffPaceMul` в скорости полосы хода (`buildFighter.js:1551`)'],
    ['DICE', 'заряжает следующие N **попавших** ударов множителем урона: грани 1…6 = (1 удар ×1.5), (2 ×1.5), (2 ×2.0), (3 ×2.0), (3 ×2.5), (3 ×3.0 + вспышка); равновероятно', 'пока не истратит заряженные попадания (без таймера)', '`BUFF_BALANCE.dice.faces`, бросок — `rollDie()`', '`buffs.js`; заряды — `src/services/buffStrike.js`; множитель читает `src/scene/boutCore.js:168` (`diceMulFor`)', 'урон умножается снаружи бойца (в обвязке боя)'],
  ]));
  L.push('');
  L.push(`Одновременно на одном бойце — один бафф (правило 2, \`effects.has(unit)\`). Откат карточки ${B.cooldownSec} с на вид, общий на сторону игрока; у бота свой набор (тот же полный, по одному) и пауза между бросками ${B.bot.minGapSec} с.`);
  L.push('');
  L.push('### Как использует бот (`src/services/buffs.js` `tickBot`) и как повторён для игрока');
  L.push('');
  L.push(`Бот каждый кадр (не чаще чем раз в ${B.bot.minGapSec} с, и только если на нём нет баффа) смотрит по порядку: **TOWEL**, если своё здоровье < ${pct(B.bot.towelHpBelow, 0)}; иначе **BUCKET**, если до цели < ${B.bot.bucketNearDist}; иначе **DICE**, если здоровье цели < ${pct(B.bot.diceFoeHpBelow, 0)} или t ≥ ${B.bot.diceLateSec} с. Набор — полный, по одному каждого. Схема повторена в замере для игрока дословно теми же вызовами бойца (\`heal\`, \`shortenStagger\`, \`setBuffPace\`, \`armDiceCharge\`) и теми же числами — «правило бота». Поскольку цель ближе 2.2 уже через 0.4 с, бот в реальности бросает **BUCKET на первой же секунде**, DICE — на 20-й секунде, TOWEL — когда здоровье < 40%.`);
  L.push('');
  // таблица сдвигов
  const order = [['kit-bot', 'весь набор по правилу бота'], ['towel-bot', 'TOWEL по правилу бота'], ['bucket-bot', 'BUCKET по правилу бота'], ['dice-bot', 'DICE по правилу бота'], ['towel-t10', 'TOWEL, бросок на 10-й секунде'], ['bucket-t10', 'BUCKET, бросок на 10-й секунде'], ['dice-t10', 'DICE, бросок на 10-й секунде (случайная грань)'], ['bucket-t0', 'BUCKET с самого начала (0.5 с)'], ['kit-both', 'набор по правилу бота у ОБЕИХ сторон (игрок vs враг с тем же набором)']];
  const rows = [];
  out.shifts = {};
  const tag = (k, r) => { const a = r.applied.filter(Boolean); return a.length; };
  for (const [k, label] of order) {
    const r = A[k]; const dW = pairedShift(r.w, none.w);
    const per = CORES.map((c) => { const d = pairedShift(A[k].perCore[c].w, none.perCore[c].w); return `${N(c).slice(0, 3)} ${sgn(d.delta, 1)}`; }).join(' · ');
    const thrown = r.applied.filter(Boolean).length;
    out.shifts[k] = { dW, thrown };
    const secD = median(r.sec) - median(none.sec);
    rows.push([label, `**${ci(dW)}**`, per, pct(thrown / r.w.length, 0), sgn(secD, 1)]);
  }
  L.push('Сдвиг доли побед игрока (п.п., парный к бою без баффа на тех же зёрнах; 4 ядра × 4 голых врага × 400 зёрен = 6400 боёв на строку; враг без баффов, кроме последней строки):');
  L.push('');
  L.push(md(['схема', 'сдвиг [95%]', 'по ядрам', 'доля боёв с броском', 'Δ медианы боя, с'], rows));
  L.push('');
  // кубик по граням
  const fr = [];
  for (let f = 1; f <= 6; f++) { const r = A[`dice-t10-f${f}`]; const dW = pairedShift(r.w, none.w); fr.push([f, `${B.dice.faces[f].hits} × ${B.dice.faces[f].mul}`, ci(dW)]); }
  L.push('DICE по граням (бросок на 10-й секунде, грань зафиксирована):');
  L.push('');
  L.push(md(['грань', 'попаданий × множитель', 'сдвиг, п.п. [95%]'], fr));
  L.push('');
  // TOWEL
  const tb = A['towel-bot'];
  const tCount = tb.applied.filter((x) => x.includes('towel')).length;
  L.push(`TOWEL по правилу бота: брошен в ${pct(tCount / tb.w.length, 0)} боёв (здоровье < 40% достигается не всегда); средний приток ${f1(tb.healed / Math.max(1, tCount))} HP за бросок (потолок 20 HP); на 10-й секунде здоровье почти полное, поэтому бросок «вслепую» лечит мало — отсюда разница строк «по правилу бота» и «на 10-й секунде».`);
  L.push('');
  // BUCKET
  const bw = A['bucket-t10'].winSums, nw = none.winSums;
  const bn = A['bucket-t10'].winBouts, nn = none.winBouts;
  L.push('### BUCKET: скорость не даёт выигрыша — почему');
  L.push('');
  L.push('Окно 5 с с 10-й секунды, игрок: BUCKET брошен в t = 10 с против того же боя без баффа (те же зёрна); среднее по тикам окна.');
  L.push('');
  const m = (w, n) => ({ sp: w.sp / w.n, dist: w.dist / w.n, far: w.far / w.n, free: w.free / w.n, swings: w.swings / n, taken: w.taken / n, dealt: w.dealt / n });
  const mb = m(bw, bn), mn = m(nw, nn);
  L.push(md(['показатель в окне [10 с, 15 с)', 'без баффа', 'BUCKET', 'разница'], [
    ['скорость хода, ед./с', f3(mn.sp), f3(mb.sp), `${sgn(100 * (mb.sp / mn.sp - 1), 1)}%`],
    ['дистанция до врага', f3(mn.dist), f3(mb.dist), sgn(mb.dist - mn.dist, 3)],
    ['вне радиуса удара (≥ 1.45)', pct(mn.far, 1), pct(mb.far, 1), `${sgn(100 * (mb.far - mn.far), 1)} п.п.`],
    ['свободное время', pct(mn.free, 1), pct(mb.free, 1), `${sgn(100 * (mb.free - mn.free), 1)} п.п.`],
    ['замахов за окно', f2(mn.swings), f2(mb.swings), sgn(mb.swings - mn.swings, 2)],
    ['нанесено HP за окно', f2(mn.dealt), f2(mb.dealt), sgn(mb.dealt - mn.dealt, 2)],
    ['получено HP за окно', f2(mn.taken), f2(mb.taken), sgn(mb.taken - mn.taken, 2)],
  ]));
  L.push('');
  L.push(`**Почему:** ведро ускоряет только ХОД (а частоту ударов нарочно не трогает). Боец идёт, лишь пока не в радиусе удара — «вне радиуса» ${pct(mn.far, 0)} времени, а до врага на плите 5 × 3 ед. (\`PLATFORM\`: width 6 → x ±2.5, outerZ 2 → z ±1.5; выходят на расстоянии 2.9) всего ≈ 1.5 ед. между точкой выхода и радиусом удара. Ускорение на 30% сокращает эти 1–2 с сближения на доли секунды, а дальше ход «не нужен» — идёт обмен ударами, скорость которого ведро не меняет. Гипотеза о плите подтверждается **частично**: плита действительно тесная (максимальный путь сближения 2.9 ед.), но решающий довод — доля времени в движении: бой почти целиком состоит из обмена, а не из ходьбы.`);
  L.push('');
  writeSection('buff', L.join('\n'), out);
}

// ════════ ВЕДРО × РАЗМЕР ПЛИТЫ ════════
if (all || want.has('plate')) {
  const agg = {};
  for (const c of CORES) for (const sd of SETS) {
    const o = loadRaw(`plate-${c}-s${sd}`).cores[c];
    for (const [k, r] of Object.entries(o)) { const a = agg[k] || (agg[k] = { w: [], tc: [], sec: [], path: [] }); a.w.push(...bits(r.w)); a.tc.push(...r.tc); a.sec.push(...r.sec); a.path.push(...r.path6); }
  }
  const L = []; const out = {};
  L.push('### Гипотеза о плите проверена прямо: ведро на тесной и на большой плите');
  L.push('');
  L.push('BUCKET включён с 0.5 с на 5 с (как в игре), 4 ядра × 4 врага × 400 зёрен = 6400 боёв на строку; «игровая» плита — 5 × 3 (границы ±2.5 × ±1.5, выход на расстоянии 2.9, как на арене), «большая» — 12 × 9 (границы ±6 × ±4.5, выход на расстоянии 7.0). Время до первого сближения — первый тик, когда дистанция до врага < 1.45. Сдвиг доли побед — парный к бою без ведра на той же плите.');
  L.push('');
  const rows = [];
  for (const pk of [...new Set(Object.keys(agg).map((k) => k.split('|')[0]))]) {
    const n = agg[`${pk}|none`], b = agg[`${pk}|bucket`];
    const tcN = mean(n.tc.filter((x) => x >= 0)), tcB = mean(b.tc.filter((x) => x >= 0));
    const dT = pairedMean(b.tc, n.tc);
    const dW = pairedShift(b.w, n.w);
    out[pk] = { tcN, tcB, dT, dW };
    rows.push([pk, f2(tcN) + ' с', f2(tcB) + ' с', `${sgn(dT.m, 2)} с ±${f2(1.96 * dT.se)}`, f2(mean(n.path)), f2(mean(b.path)), `**${ci(dW)}**`]);
  }
  L.push(md(['плита', 'до сближения без ведра', 'с ведром', 'Δ (парно)', 'путь за 6 с без ведра, ед.', 'с ведром', 'сдвиг доли побед, п.п. [95%]'], rows));
  L.push('');
  writeSection('plate', L.join('\n'), out);
}

// ════════ КЛИЧ + БАФФ ════════
if (all || want.has('combo')) {
  const A = buffAgg('combo');
  const none = A.none;
  const L = []; const out = {};
  L.push('## Пункт 13 (продолжение). Клич и бафф одновременно на одном бойце');
  L.push('');
  L.push('**В коде — независимые слои, которые не мешают друг другу.** Клич (`applyKlich` / `setKlichId`) пишет только во внутреннюю дельту осей `klichDelta` и в `klichId` (читает выбор намерения); бафф — в `buffPaceMul` (BUCKET), `hp` (`heal`, TOWEL), `staggerUntil` (TOWEL) и в Map зарядов `buffStrike` (DICE) — ни одно поле не пересекается. Единственная точка встречи — скорость хода: ось `distance`/`initiative` решает КУДА идти, а `buffPaceMul` множит, КАК БЫСТРО (то есть складываются как «направление × скорость»). «Один бафф на бойце» не блокирует клич, а клич заменяет клич (пункт 14), но не бафф.');
  L.push('');
  L.push('Замер: клич в t = 5 с и бафф в t = 5 с (BUCKET / DICE) на одном бойце; 4 ядра × 4 врага × 400 зёрен = 6400 боёв на строку, парно к бою без всего. Проверка аддитивности: сдвиг пары ≈ сумма сдвигов по отдельности?');
  L.push('');
  const d = (k) => pairedShift(A[k].w, none.w);
  const rows = []; out.rows = {};
  for (const kl of ['push', 'fallback', 'hold']) for (const [bk, bl] of [['bucket5', 'BUCKET'], ['dice5', 'DICE'], ['kitbot', 'набор бота']]) {
    const key = `k-${kl}+${bk}`; const single = bk === 'kitbot' ? 'b-kitbot' : `b-${bk}`;
    const both = d(key), k1 = d(`k-${kl}`), b1 = d(single);
    const sum = k1.delta + b1.delta; const se = Math.hypot(k1.se, b1.se, both.se);
    out.rows[key] = { both, k1, b1 };
    rows.push([`${{ push: 'ВПЕРЁД', fallback: 'ОТХОД', hold: 'ДЕРЖАТЬ' }[kl]} + ${bl}`, ci(k1), ci(b1), `**${ci(both)}**`, sgn(sum), Math.abs(both.delta - sum) > 1.96 * se ? 'НЕ аддитивно' : 'аддитивно (в шуме)']);
  }
  L.push(md(['пара', 'клич один', 'бафф один', 'вместе', 'сумма по отдельности', 'вывод'], rows));
  L.push('');
  L.push(`Исключений нет: все задачи завершились без ошибок (наложение клича и баффа на одного бойца ничего не ломает). Максимальная длина боя в этих прогонах — ${f1(Math.max(...Object.values(A).flatMap((r) => r.sec)))} с, далеко от потолка 240 с.`);
  writeSection('combo', L.join('\n'), out);
}

// ════════ ПУНКТ 14 ════════
if (all || want.has('timing')) {
  const A = buffAgg('timing');
  const none = A.none;
  const L = []; const out = {};
  L.push('## Пункт 14. Заряды и перезарядка');
  L.push('');
  L.push('**Где живут числа:**');
  L.push('');
  L.push(md(['что', 'значение', 'где'], [
    ['зарядов клича', `${KLICH_BALANCE.chargesPerKlich} на каждый из 3 кличей (всего 9), на бой; запас, не восстанавливается`, '`src/data/klichBalance.js` `chargesPerKlich`'],
    ['пауза после клича', `${KLICH_BALANCE.cooldownSec} с, **на каждый клич отдельно**, общая на сторону игрока (не на бойца); не перезарядка запаса`, '`klichBalance.js` `cooldownSec`; `src/services/klich.js` `coolUntil[id]`'],
    ['длительность клича', `${KLICH_BALANCE.holdSec} с полной силы + ${KLICH_BALANCE.fadeSec} с затухания`, '`klichBalance.js` `holdSec`, `fadeSec`; `buildFighter.js` `tickKlich`'],
    ['пауза после баффа', `${BUFF_BALANCE.cooldownSec} с, на каждый вид отдельно, общая на сторону игрока`, '`src/data/buffBalance.js` `cooldownSec`; `src/services/buffs.js` `coolUntil[id]`'],
    ['зарядов баффа', 'по одному на вид за бой (набор = список `BUFF_IDS`: TOWEL, BUCKET, DICE); числа нет нарочно', '`buffBalance.js` `BUFF_IDS`; `buffs.js` `buffStartFight`'],
    ['один бафф на бойце', 'пока действует, второй не бросить', '`buffs.js` `applyBuff` (`effects.has(unit)`)'],
  ]));
  L.push('');
  L.push('**Второй клич заменяет первый, а не складывается — подтверждено** (см. раздел «замена» ниже): `applyKlich` (`buildFighter.js:850`) **присваивает** (`klichPeak.* = axes.*`, `klichUntil = lastT + hold + fade`, `klichId = null` до следующего `setKlichId`), а не прибавляет.');
  L.push('');
  // сколько зарядов бой успевает
  const L2 = [];
  const secs = none.sec;
  const at = (i) => 5 + 6 * i;
  const pr = (t) => secs.filter((s) => s > t).length / secs.length;
  L.push('### Сколько зарядов бой успевает использовать');
  L.push('');
  L.push(`Длины боёв в этом замере (голое ядро игрока, 6400 боёв): медиана ${f1(median(secs))} с, 10% дольше ${f1(secs.slice().sort((a, b) => a - b)[Math.floor(secs.length * 0.9)])} с, максимум ${f1(Math.max(...secs))} с. Клич можно бросать не раньше, чем через ${KLICH_BALANCE.cooldownSec} с после предыдущего **того же вида**, то есть серия из k применений одного клича занимает ≥ ${KLICH_BALANCE.cooldownSec}·(k−1) с. Если бросать первый в t = 5 с и каждый следующий сразу, как кончится откат (кличи по кругу), k-е применение приходится на t = 5 + 6·(k−1) с:`);
  L.push('');
  L.push(md(['применение №', 'момент, с', 'доля боёв, которые ещё идут'], [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => [k, at(k - 1), pct(pr(at(k - 1)), 0)])));
  L.push('');
  L.push(`То есть **3 заряда одного клича** бой успевает использовать всегда (3-е — в ${at(2)} с), **9 зарядов** (все три клича по разу…по три) — лишь в ${pct(pr(at(8)), 0)} боёв, и то лишь при непрерывном броске без пропусков; при этом каждое следующее применение **заменяет** предыдущее, так что до конца боя хватает покрытия, а не добавочной силы. Баффы: всего 3 броска на бой (по одному на вид), один на бойце одновременно; в замере по правилу бота в среднем ${f2(mean(A['buffs-bot'].applied.map((x) => (x ? x.split(',').length : 0))))} броска на бой.`);
  L.push('');
  // burst vs spread
  L.push('### Выгоднее ли бросить всё в первые секунды или распределить по бою');
  L.push('');
  const rows = []; out.shifts = {};
  const labels = { 'push-one5': 'ВПЕРЁД ×1, 5 с', 'push-burst3': 'ВПЕРЁД ×3 подряд, 1 / 7 / 13 с', 'push-spread3': 'ВПЕРЁД ×3 по бою, 10 / 25 / 40 с', 'fallback-one5': 'ОТХОД ×1, 5 с', 'fallback-burst3': 'ОТХОД ×3 подряд, 1 / 7 / 13 с', 'fallback-spread3': 'ОТХОД ×3 по бою, 10 / 25 / 40 с', 'hold-one5': 'ДЕРЖАТЬ ×1, 5 с', 'hold-burst3': 'ДЕРЖАТЬ ×3 подряд, 1 / 7 / 13 с', 'hold-spread3': 'ДЕРЖАТЬ ×3 по бою, 10 / 25 / 40 с', 'mix3-every6': 'по кругу ×3 (ВПЕРЁД, ДЕРЖАТЬ, ОТХОД), 5 / 11 / 17 с', 'mix3-spread': 'по кругу ×3 по бою, 10 / 25 / 40 с', 'mix9-every6': 'по кругу ×9 каждые 6 с с 5-й секунды', 'buffs-burst': 'баффы сразу: DICE, затем BUCKET, затем TOWEL подряд с 1 с', 'buffs-spread': 'баффы по бою: BUCKET 10 с, DICE 25 с, TOWEL 40 с', 'buffs-bot': 'баффы по правилу бота' };
  for (const [k, lab] of Object.entries(labels)) {
    const r = A[k]; const dW = pairedShift(r.w, none.w); out.shifts[k] = dW;
    const used = r.applied.length ? mean(r.applied.map((x) => (x ? x.split(',').length : 0))) : 0;
    rows.push([lab, `**${ci(dW)}**`, k.startsWith('buffs') ? f2(used) : '—']);
  }
  L.push('Парный сдвиг доли побед к бою без клича/баффа (6400 боёв на строку: 4 ядра × 4 врага × 400 зёрен):');
  L.push('');
  L.push(md(['схема', 'сдвиг, п.п. [95%]', 'баффов брошено на бой'], rows));
  L.push('');
  const cmp = (a, b) => pairedShift(A[a].w, A[b].w);
  L.push('Прямое сравнение «сразу» против «по бою» (парно): ' + [['push-burst3', 'push-spread3', 'ВПЕРЁД'], ['fallback-burst3', 'fallback-spread3', 'ОТХОД'], ['hold-burst3', 'hold-spread3', 'ДЕРЖАТЬ'], ['buffs-burst', 'buffs-spread', 'баффы']].map(([a, b, n]) => `${n}: сразу − по бою = ${ci(cmp(a, b))}`).join('; ') + '.');
  L.push('');
  writeSection('timing', L.join('\n'), out);
}

// ════════ ЗАМЕНА КЛИЧА ════════
if (all || want.has('replace')) {
  const r = loadRaw('replace');
  const L = [];
  L.push('### Замена клича (аналог приёмки Г5 прошлого отчёта)');
  L.push('');
  L.push(`Зонд-журнал решений, 20 боёв: клич A в t = 5 с, клич B в t = 11 с (через откат 6 с): в журнале после замены стоит только B (id и сила 1 на первом решении), A — никогда — **${r.okA}/${r.n}**. Клич A и B в один и тот же момент против одного B — **бой бит в бит тот же, что с одним B** (оси и группа A после замены не действуют) — **${r.okB}/${r.n}**.`);
  writeSection('replace', L.join('\n'), r);
}
await H.server.close();
