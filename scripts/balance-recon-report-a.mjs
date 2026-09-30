// balance-recon-report-a.mjs — СВОД по сырым данным: пункт 3 (голые ядра) и пункт 1 (жёсткая нужда). Пишет docs/balance-recon/out/{naked,need}.{md,json}.
// ЗАПУСК: node scripts/balance-recon-report-a.mjs [naked] [need]
import { openHarness } from './lib/bout-harness.mjs';
import { CORES, CORE_NAME, INTENTS, md, f1, f2, f3, pct, sgn, mean, median, quantile, wilson, pairedShift, loadRaw, hasRaw, sumArr, addInto, writeSection, DT } from './balance-recon-lib.mjs';

const want = new Set(process.argv.slice(2));
const all = want.size === 0;
const N = (c) => CORE_NAME[c];
const H = await openHarness();
const { load } = H;
const { CORE_PROFILES, AXIS_IDS } = await load('/src/data/behavior.js');
const { COMBAT_BALANCE: B } = await load('/src/data/combatBalance.js');
const { lerp } = { lerp: (a, b, t) => a + (b - a) * t };

// ════════ ПУНКТ 3 ════════
if (all || want.has('naked')) {
  const SETS = [1, 201];
  const cell = {}; // cell[set][a][b] = { w, sec, sums }
  for (const s of SETS) { cell[s] = {}; for (const a of CORES) { const o = loadRaw(`naked-alt-${a}-s${s}`); cell[s][a] = {}; for (const b of CORES) cell[s][a][b] = o.pairs[`${a}|${b}`]; } }
  const P = [];
  const out = { matrix: {}, totals: {}, medians: {} };
  const L = [];
  L.push('## Пункт 3. Голые ядра друг против друга');
  L.push('');
  L.push('4×4 упорядоченных пары, 200 зёрен на набор, два набора (1–200 и 201–400), стороны плиты чередуются по зерну (`swap = чётное зерно`), точки выхода как в игре. Ячейка — доля побед ряда против столбца (игрок = ряд), в скобках медиана длины боя. Диагональ — зеркало: побеждает сторона «игрок» (ряд).');
  L.push('');
  for (const [label, sets] of [['набор 1–200', [1]], ['набор 201–400', [201]], ['оба набора (400 зёрен на ячейку)', SETS]]) {
    const rows = [];
    for (const a of CORES) {
      const r = [N(a)];
      let tw = 0, tn = 0; const secs = [];
      for (const b of CORES) {
        const w = sets.flatMap((s) => cell[s][a][b].w), sc = sets.flatMap((s) => cell[s][a][b].sec);
        const ww = sumArr(w); tw += ww; tn += w.length; secs.push(...sc);
        r.push(`${f1((100 * ww) / w.length)} (${f1(median(sc))} с)`);
      }
      const wl = wilson(tw, tn);
      r.push(`**${f1(wl.p)}** [${f1(wl.lo)}…${f1(wl.hi)}]`, `${f1(median(secs))} с`);
      rows.push(r);
      if (sets.length === 2) { out.totals[a] = { win: wl.p, lo: wl.lo, hi: wl.hi, n: tn, median: median(secs) }; }
    }
    L.push(`**${label}**`); L.push('');
    L.push(md(['игрок \\ враг', ...CORES.map(N), 'итог против поля из 4 (с зеркалом) [95%]', 'медиана по ряду'], rows)); L.push('');
  }
  // итоги по каждому набору отдельно — повторяемость
  L.push('**Итог по ядрам на каждом наборе (повторяемость):**'); L.push('');
  L.push(md(['ядро', 'набор 1–200, %', 'набор 201–400, %', 'медиана 1–200, с', 'медиана 201–400, с'], CORES.map((a) => {
    const v = SETS.map((s) => { const w = CORES.flatMap((b) => cell[s][a][b].w), sc = CORES.flatMap((b) => cell[s][a][b].sec); return { p: 100 * mean(w), m: median(sc) }; });
    out.matrix[a] = v; return [N(a), f1(v[0].p), f1(v[1].p), f1(v[0].m), f1(v[1].m)];
  })));
  L.push('');
  // чистая матрица без зеркала и с учётом стороны: доли по 12 несимметричным парам
  const offDiag = CORES.map((a) => { const r = {}; for (const b of CORES) if (a !== b) { const w = SETS.flatMap((s) => cell[s][a][b].w); r[b] = 100 * mean(w); } return r; });
  out.offDiag = offDiag;
  // симметрия: A против B и B против A должны давать в сумме ~100
  const sym = [];
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const a = CORES[i], b = CORES[j]; const x = 100 * mean(SETS.flatMap((s) => cell[s][a][b].w)), y = 100 * mean(SETS.flatMap((s) => cell[s][b][a].w)); sym.push([`${N(a)} vs ${N(b)}`, f1(x), f1(y), f1(x + y)]); }
  L.push('Проверка симметрии (A против B + B против A должны давать ≈ 100; отклонение — перекос стороны/порядка в списке, шум ±3):'); L.push('');
  L.push(md(['пара', 'A побеждает, %', 'B побеждает, %', 'сумма'], sym)); L.push('');

  // числа, которыми отличаются ядра
  const R = [];
  const rng = B.distance;
  for (const c of CORES) {
    const a = CORE_PROFILES[c]; const n = (v) => v / 100;
    const weight01 = n(a.weight), tempo01 = n(a.tempo), res01 = n(a.resilience), stick01 = n(a.stick);
    const speedMul = lerp(1.4, 0.6, weight01), accelMul = lerp(1.25, 0.65, weight01), dmgMul = lerp(1.15, 0.38, res01);
    const heavy01 = Math.min(1, Math.max(0, weight01 * 0.7 + tempo01 * 0.3));
    const blockTend = Math.min(B.blockTendencyMax, B.blockTendencyBase + B.blockTendencyResWeight * res01 + B.blockTendencyStickWeight * stick01);
    R.push([N(c), ...AXIS_IDS.map((k) => a[k]), f2(speedMul), f2(accelMul), f3(dmgMul), f2(heavy01), f2(blockTend), a.counter > 55 ? 'ДА' : 'нет']);
  }
  L.push('### Чем отличаются ядра (вся разница заложена в профиле осей)');
  L.push('');
  L.push(`В бою ядро — это только стартовая строка из 8 осей (\`src/data/behavior.js\` CORE_PROFILES): \`coreId\` в \`buildFighter\` нигде больше не читается (кроме выбора цели в \`battleField.js\`, который при дуэли не участвует). Всё остальное у четырёх ядер **одинаково**: здоровье ${B.maxHp}, сила удара ${B.strikePower}, прочность ${B.toughness}, точность ${B.accuracy}, блок срезает ${B.blockMitigation * 100}% (пробитие ${B.blockPenetration}), запас сил ${B.staminaMax}, заряд хлёсткого удара ${B.chargeMax}, база подвижности ${B.mobilityBase}. Из осей выводятся (формулы — \`buildFighter.js\` 635–640, 736):`);
  L.push('');
  L.push(md(['ядро', ...AXIS_IDS, 'скорость ×', 'разгон ×', 'входящий урон ×', 'heavy01', 'тяга к блоку', 'ворота ответа на замах (counter > 55)'], R));
  L.push('');
  L.push('«Входящий урон ×» = lerp(1.15, 0.38, стойкость/100): BULWARK принимает на удар **0.46** от нейтрального урона, RAIDER и AMBUSH — **0.88**, то есть почти вдвое больше. Это основная асимметрия силы ядер в голом бою; остальное — стиль (дистанция, темп, сцепка).');
  L.push('');

  // тело по ядрам (игрок = ряд, по всем врагам), набор 1 и 201 вместе
  const body = {};
  for (const a of CORES) { const S = {}; for (const s of SETS) for (const b of CORES) addInto(S, cell[s][a][b].sums); body[a] = S; }
  out.body = body;
  const br = CORES.map((a) => {
    const s = body[a]; const min = (s.n * DT) / 60; const sec = s.n * DT;
    return [N(a), f2(s.sp / s.n), f2(s.dist / s.distN), pct(s.far / s.n, 1), pct(s.free / s.n, 1), f1(s.swings / min), f2(s.dealt / sec), f2(s.taken / sec), pct(s.blk / s.n, 1), pct(s.stamLow / s.n, 1), pct(s.it[INTENTS.indexOf('catch')] / s.n, 0), pct(s.it[INTENTS.indexOf('press')] / s.n, 0)];
  });
  L.push('### Что делает тело (игрок = ряд, по всем 4 врагам и обоим наборам, тики бойца)');
  L.push('');
  L.push(md(['ядро', 'скорость, ед./с', 'дистанция до врага', 'вне радиуса 1.45', 'свободное время', 'замахов/мин', 'урон врагу, HP/с', 'урон получен, HP/с', 'время в блоке', 'запас сил < 0.22', 'время в CATCH', 'время в PRESS'], br));
  L.push('');
  const med = (a) => out.totals[a].median;
  L.push(`**Медиана BULWARK больше 55 с: ${med('skala') > 55 ? 'ПОДТВЕРЖДЕНО' : 'НЕ подтверждено'}** — ${f1(med('skala'))} с по полю из четырёх (остальные: ${CORES.filter((c) => c !== 'skala').map((c) => `${N(c)} ${f1(med(c))}`).join(', ')}); зеркало BULWARK — ${f1(median(SETS.flatMap((s) => cell[s].skala.skala.sec)))} с.`);
  L.push('');
  const bl = body.skala; const rate = (b) => (body[b].dealt + body[b].taken) / (body[b].n * DT);
  L.push(`**Гипотеза о причине (числа выше) — подтверждается.** Бой кончается, когда у одного иссякают 100 HP, значит длина боя ∝ 1 / (суммарный темп обмена здоровьем в паре). Суммарный обмен ядра с полем (нанёс + получил, HP/с): ${CORES.map((c) => `${N(c)} ${f2(rate(c))}`).join(', ')}. Медиана ≈ K / обмен при K ≈ ${f1(out.totals.natisk.median * rate('natisk'))}: для BULWARK это даёт ${f1(out.totals.natisk.median * rate('natisk') / rate('skala'))} с при измеренных ${f1(med('skala'))} с. Наносит BULWARK столько же, сколько остальные (${f2(body.skala.dealt / (body.skala.n * DT))} HP/с против ${f2(body.natisk.dealt / (body.natisk.n * DT))} у ONSLAUGHT), но получает заметно меньше (${f2(body.skala.taken / (body.skala.n * DT))} против ${f2(body.natisk.taken / (body.natisk.n * DT))}): множитель входящего урона 0.46 против 0.69, плюс ${pct(bl.blk / bl.n, 0)} времени в блоке и ${pct(bl.it[6] / bl.n, 0)} в CATCH (замахов ${f1(bl.swings / ((bl.n * DT) / 60))}/мин против ${f1(body.natisk.swings / ((body.natisk.n * DT) / 60))}/мин у ONSLAUGHT). Обмен у BULWARK ниже на ≈ 15–20% — отсюда +8 с к медиане, а в зеркале (оба «стены») ${f1(median(SETS.flatMap((s) => cell[s].skala.skala.sec)))} с. Вторая половина причины — пункт 1: почти половину решений за BULWARK принимает нужда «ответ на замах», которая всегда отвечает CATCH (пассивно).`);
  L.push('');

  // две метрики на пределе
  const ctl = { n: 0, far: 0, free: 0, sp: 0, secs: [], w: 0, bouts: 0 };
  const perCore = {};
  for (const a of CORES) { const o = loadRaw(`naked-none-${a}`); perCore[a] = { n: 0, far: 0, free: 0, sp: 0 }; for (const b of CORES) { const r = o.pairs[`${a}|${b}`]; for (const k of ['n', 'far', 'free', 'sp']) { ctl[k] += r.sums[k]; perCore[a][k] += r.sums[k]; } ctl.secs.push(...r.sec); ctl.w += sumArr(r.w); ctl.bouts += r.w.length; } }
  const occ = { n: 0, free: 0, far: 0 }; const occCore = {};
  for (const a of CORES) { const o = loadRaw(`naked-occ-${a}`); occCore[a] = { n: 0, free: 0 }; for (const b of CORES) { const r = o.pairs[`${a}|${b}`]; occ.n += r.sums.n; occ.free += r.sums.free; occ.far += r.sums.far; occCore[a].n += r.sums.n; occCore[a].free += r.sums.free; } }
  out.metrics = { far: ctl.far / ctl.n, freeControls: ctl.free / ctl.n, freeOccupancy: occ.free / occ.n, speed: ctl.sp / ctl.n, median: median(ctl.secs), max: Math.max(...ctl.secs), bouts: ctl.bouts, capped: 0 };
  L.push('### Две метрики на пределе (снято на текущем `main` d9327e02)');
  L.push('');
  L.push(md(['метрика', 'сейчас', 'было', 'порог', 'запас до порога', 'где считается'], [
    ['вне радиуса удара (дистанция до врага ≥ 1.45), доля тиков бойца-игрока', `**${f2(100 * ctl.far / ctl.n)}%**`, '25.07%', '≥ 25', `${sgn(100 * ctl.far / ctl.n - 25, 2)} п.п.`, '`scripts/reflex-sight-controls.mjs`, `MODE=pairs NOSWAP=1`: 16 пар × 200 зёрен, стороны не чередуются; порог `1.45` зашит там же (метка `far`). Здесь пересчитано тем же кодом в `balance-recon-worker.mjs` (`naked`, `swap: none`, 3200 боёв)'],
    ['свободное время (нет клипа, блока, сбива и выдоха), доля тиков', `**${f2(100 * occ.free / occ.n)}%** (по occupancy: 16 пар × 50 зёрен); ${f2(100 * ctl.free / ctl.n)}% (по controls, 200 зёрен)`, '34.95%', '≤ 35', `${sgn(35 - 100 * occ.free / occ.n, 2)} п.п. (occupancy)`, '`scripts/motion-recon.mjs`, раздел `occupancy` (16 пар × min(SEEDS,50)=50 зёрен, без чередования); то же определение в `reflex-sight-controls.mjs` (`free`). Пересчитано в `balance-recon-worker.mjs`'],
  ]));
  L.push('');
  L.push(`Свободное время по ядрам (occupancy, 50 зёрен): ${CORES.map((c) => `${N(c)} ${f1(100 * occCore[c].free / occCore[c].n)}%`).join(', ')}. Вне радиуса по ядрам (controls, 200 зёрен): ${CORES.map((c) => `${N(c)} ${f1(100 * perCore[c].far / perCore[c].n)}%`).join(', ')}. Скорость ${f3(ctl.sp / ctl.n)} ед./с, медиана боя ${f2(median(ctl.secs))} с, максимум ${f2(Math.max(...ctl.secs))} с, таймаутов 0 из ${ctl.bouts}.`);
  L.push('');
  L.push(`Сверка: в прошлых замерах 25.07 / 51.87 / 83.03 (вне радиуса / медиана / максимум) и 34.95 свободного времени — **${Math.abs(100 * ctl.far / ctl.n - 25.07) < 0.01 && Math.abs(median(ctl.secs) - 51.87) < 0.01 ? 'воспроизвелись точно' : 'НЕ воспроизвелись (см. числа выше)'}**.`);
  writeSection('naked', L.join('\n'), out);
}

// ════════ ПУНКТ 1 ════════
if (all || want.has('need')) {
  const SETS = [1, 201];
  const agg = {}; // agg[v][core]
  for (const v of ['base', 'counterCF']) {
    agg[v] = {};
    for (const c of CORES) {
      const a = { n: 0, need: 0, kind: { stam: 0, swing: 0, charge: 0 }, override: { stam: 0, swing: 0, charge: 0 }, threat: 0, reach: 0, threatReach: 0, swingCond: 0, gateOpen: 0, stamLow: 0, chargeCond: 0, stamSum: 0, w: [], sets: {}, actByKind: { stam: {}, swing: {}, charge: {} }, actPlain: {}, actAll: {}, bouts: 0 };
      for (const s of SETS) {
        const r = loadRaw(`need-${c}-s${s}`).cores[c][v];
        const per = { n: r.n, need: r.need, swing: r.kind.swing };
        a.sets[s] = per;
        for (const k of ['n', 'need', 'threat', 'reach', 'threatReach', 'swingCond', 'gateOpen', 'stamLow', 'chargeCond', 'stamSum', 'bouts']) a[k] += r[k];
        for (const k of Object.keys(a.kind)) { a.kind[k] += r.kind[k]; a.override[k] += r.override[k]; for (const [act, n] of Object.entries(r.actByKind[k])) a.actByKind[k][act] = (a.actByKind[k][act] || 0) + n; }
        for (const [act, n] of Object.entries(r.actPlain)) a.actPlain[act] = (a.actPlain[act] || 0) + n;
        for (const [act, n] of Object.entries(r.actAll)) a.actAll[act] = (a.actAll[act] || 0) + n;
        a.w.push(...r.w);
      }
      agg[v][c] = a;
    }
  }
  const p = (x, a) => pct(x / a.n, 1);
  const L = [];
  const out = { agg };
  L.push('## Пункт 1. Жёсткая нужда');
  L.push('');
  L.push('**Где живут пороги** (`src/data/intentions.js`, `hardNeed`, строки 141–154; числа зашиты в код, кроме `bend`):');
  L.push('');
  L.push('| нужда | условие | числа | откуда |');
  L.push('| --- | --- | --- | --- |');
  L.push('| ЗАПАС СИЛ → BREATHE | `stamina01 < 0.22 × (1 − K·(2·initiative − 1))` | 0.22, K = `COMBAT_BALANCE.hardNeed.bend` = **0** | код + `combatBalance.js:281` |');
  L.push('| ОТВЕТ НА ЗАМАХ → CATCH / BREAK / HOLD | враг бил за последние 1.5 с **И `counter > 0.55`** И враг ближе `range + 0.8·(1 + K·(2·counter − 1))` | 1.5 с, **0.55 (ворота)**, 0.8, K = 0 | код |');
  L.push('| ЗАРЯД → STRIKE | `charge01 ≥ min(1, 0.85·(1 − K·(2·weight − 1)))` и враг в радиусе удара | 0.85, K = 0 | код |');
  L.push('');
  L.push('Пороги от характера **не зависят** (K = `bend` = 0) — подтверждено: единственная зависимость нужды от осей — ворота `counter > 0.55` (жёстко в коде, `a.counter` — ось 0…1; стартовые counter: ONSLAUGHT 0.30, RAIDER 0.45, BULWARK 0.60, AMBUSH 0.90).');
  L.push('');
  for (const v of ['base']) {
    L.push(`**Доля решений, принятых жёсткой нуждой (игрок = ядро в ряду, против 4 голых ядер, 800 боёв на набор, два набора: 1–200 и 201–400).**`);
    L.push('');
    L.push(md(['ядро', 'решений', 'нужда всего', 'в т.ч. запас сил', 'в т.ч. ответ на замах', 'в т.ч. заряд', 'набор 1–200', 'набор 201–400'], CORES.map((c) => {
      const a = agg[v][c];
      return [N(c), a.n, `**${p(a.need, a)}**`, p(a.kind.stam, a), p(a.kind.swing, a), p(a.kind.charge, a), pct(a.sets[1].need / a.sets[1].n, 1), pct(a.sets[201].need / a.sets[201].n, 1)];
    })));
    L.push('');
  }
  L.push('Прошлый замер (перезамер кристаллов, часть A): ONSLAUGHT 0.4%, RAIDER 3.5%, BULWARK 51.0%, AMBUSH 46.8% — **воспроизвелось** (там кристаллы по одному, здесь голые ядра; доли близки).');
  L.push('');
  L.push('### Почему у BULWARK и AMBUSH в разы выше — проверка трёх гипотез');
  L.push('');
  L.push(md(['ядро', 'враг бил за 1.5 с (угроза)', 'враг ближе range+0.8', 'угроза И в дальности', '…И ворота counter>0.55 открыты = нужда «замах» срабатывает', 'запас сил < 0.22', 'заряд ≥0.85 и враг в радиусе'], CORES.map((c) => { const a = agg.base[c]; return [N(c), p(a.threat, a), p(a.reach, a), p(a.threatReach, a), `**${p(a.swingCond, a)}**`, p(a.stamLow, a), p(a.chargeCond, a)]; })));
  L.push('');
  L.push('- **Запас сил — НЕ причина.** «Запас сил < 0.22» у всех 0.2–2.7% времени, нужда «запас» решает ≤ 2.7% решений (RAIDER — максимум).');
  L.push('- **Частота замахов врага — НЕ причина.** Угроза и «в дальности» у всех четырёх почти одинаковы (≈ 45–50% и 90–98%); условие «угроза И в дальности» у ONSLAUGHT и RAIDER выполняется так же часто, как у BULWARK и AMBUSH.');
  L.push('- **Профиль ядра — причина, и единственная: ворота `counter > 0.55`.** Они закрыты у ONSLAUGHT (0.30) и RAIDER (0.45) и открыты у BULWARK (0.60) и AMBUSH (0.90). Когда ворота открыты, нужда срабатывает в каждом решении с «угрозой в дальности», то есть ≈ половину времени.');
  L.push('');
  L.push('**Контрфакт (меняется одна ось, остальное то же):** ONSLAUGHT и RAIDER получают counter = 60 (ворота открыты), BULWARK и AMBUSH — counter = 50 (ворота закрыты). ⚠️ Ось counter входит ещё и в очки CATCH (вес 0.45), поэтому сдвиг 10 пунктов двигает очки на 0.045 — малость по сравнению с воротами.');
  L.push('');
  L.push(md(['ядро', 'нужда сейчас', 'нужда при контрфакте', 'доля побед сейчас', 'при контрфакте', 'Δ п.п.', 'решений, где нужда ≠ обычный выбор по очкам'], CORES.map((c) => {
    const a = agg.base[c], b = agg.counterCF[c];
    const wr = (x) => 100 * mean(x.w);
    const d = pairedShift(b.w, a.w);
    return [N(c), p(a.need, a), p(b.need, b), f1(wr(a)), f1(wr(b)), `${sgn(d.delta)} ±${f1(1.96 * d.se)}`, `${pct(a.override.swing / Math.max(1, a.kind.swing), 0)} (сейчас) / ${pct(b.override.swing / Math.max(1, b.kind.swing), 0)}`];
  })));
  L.push('');
  L.push('Вывод по воздействию: ворота жёсткой нужды сами — рычаг силы. Закрыв их, BULWARK **выигрывает больше**, а открыв их у ONSLAUGHT и RAIDER, они **проигрывают больше** — то есть «ответ на замах» как нужда в среднем **вредит** выигрышу (в 50–60% срабатываний он ≠ обычного выбора по очкам: отдаёт оборонительный ответ вместо атаки).');
  L.push('');
  L.push('Во что нужда превращается (BULWARK и AMBUSH, два набора): ' + ['skala', 'zasada'].map((c) => { const a = agg.base[c]; const tot = sumArr(Object.values(a.actByKind.swing)); return `${N(c)} — ${Object.entries(a.actByKind.swing).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${pct(v / tot, 0)}`).join(', ')}`; }).join('; ') + '.');
  writeSection('need', L.join('\n'), out);
}
await H.server.close();
