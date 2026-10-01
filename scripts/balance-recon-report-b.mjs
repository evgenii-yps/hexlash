// balance-recon-report-b.mjs — СВОД: пункты 7 (перекосы по каналам), 9 (отрицательные грани), 6а и 8 (запас очков вокруг тега), 10 (сборки на 7 кристаллов).
// ЗАПУСК: node scripts/balance-recon-report-b.mjs [skew] [negbranch] [gap] [builds]
import { CORES, CORE_NAME, BR, BR_NAME, INTENTS, md, f1, f2, f3, pct, sgn, mean, median, quantile, wilson, pairedShift, loadRaw, hasRaw, sumArr, addInto, writeSection, bits, DT } from './balance-recon-lib.mjs';

const want = new Set(process.argv.slice(2));
const all = want.size === 0;
const N = (c) => CORE_NAME[c];
const SETS = [1, 201];
const ci = (ps) => `${sgn(ps.delta)} [${sgn(ps.delta - 1.96 * ps.se)}…${sgn(ps.delta + 1.96 * ps.se)}]`;
const foesOf = (r) => Object.keys(r);

// ════════ ПУНКТ 7: четыре перекоса по каналам ════════
if (all || want.has('skew')) {
  const data = SETS.map((s) => loadRaw(`skew-s${s}`).cells);
  const names = { 'natisk:a3': 'ONSLAUGHT BODY/GRIND (a3) Unshaken', 'natisk:a5': 'ONSLAUGHT BODY/ANVIL (a5) Breakthrough', 'skala:a5': 'BULWARK BODY/ANVIL (a5) Unbreakable', 'zasada:a5': 'AMBUSH BODY/ANVIL (a5) Perfect Trap' };
  const what = {
    'natisk:a3': 'ось resilience +14 · рамп strikePower +10% · interruptResist +70% · тега нет',
    'natisk:a5': 'ось weight +10 · рамп strikePower +22% · blockPenetration +95% · тег overload_strike→STRIKE [foeHpLow] +0.2',
    'skala:a5': 'ось resilience +8 · рамп toughness +22% · blockMitigation +60% · тег fortress→HOLD [selfHpLow] +0.2',
    'zasada:a5': 'оси counter +8, slip +4 · рычаги dodgeCounter +100%, missCounter +100% · тег perfect_trap→STRIKE [foeHpLow&foeQuiet] +0.2',
  };
  const L = []; const out = {};
  L.push('## Пункт 7. Четыре перекоса: откуда прибавка');
  L.push('');
  L.push('Каждый из четырёх кристаллов в одиночку (ядро + этот кристалл) против 4 голых ядер, 400 зёрен на врага (два набора), разложен на каналы: копия кристалла, где оставлены только перечисленные части — **оси** (сдвиги осей), **рамп** (рост силы удара/прочности по глубине грани), **extra:X** (добавочные рычаги: blockPenetration, blockMitigation, interruptResist, dodgeCounter, missCounter), **тег** (наклон выбора намерения). Сдвиг — парный к голому ядру (тот же враг, то же зерно), п.п. с 95% интервалом; в скобках — повтор на втором наборе.');
  L.push('');
  for (const key of Object.keys(names)) {
    L.push(`### ${names[key]}`); L.push(''); L.push(what[key]); L.push('');
    const rows = []; out[key] = {};
    const variants = Object.keys(data[0][key]).filter((k) => k !== 'bare');
    const tw = (set, v) => bits(data[set][key][v].w);
    for (const v of variants) {
      const per = SETS.map((_, i) => pairedShift(tw(i, v), tw(i, 'bare')));
      const both = pairedShift([...tw(0, v), ...tw(1, v)], [...tw(0, 'bare'), ...tw(1, 'bare')]);
      out[key][v] = { both, per };
      rows.push([v.replace(/\+/g, ' + '), `**${ci(both)}**`, `${sgn(per[0].delta)} / ${sgn(per[1].delta)}`, f1(100 * mean([...tw(0, v), ...tw(1, v)]))]);
    }
    L.push(md(['канал (что оставлено)', 'сдвиг к голому ядру, п.п. [95%]', 'набор 1 / набор 2', 'доля побед, %'], rows)); L.push('');
    // сумма отдельных каналов против полного
    const single = variants.filter((v) => !v.includes('+') && v !== 'extras');
    const sumParts = sumArr(single.map((v) => out[key][v].both.delta));
    const fullKey = variants[variants.length - 1];
    L.push(`Сумма отдельных каналов (${single.join(', ')}): ${sgn(sumParts)} п.п.; полный набор (${fullKey.replace(/\+/g, ' + ')}): ${sgn(out[key][fullKey].both.delta)} п.п.` + (Math.abs(sumParts - out[key][fullKey].both.delta) > 2 * Math.hypot(...single.map((v) => 1.96 * out[key][v].both.se)) ? ' — каналы **усиливают друг друга** (сумма частей заметно меньше целого).' : ' — в пределах шума сумма частей равна целому (каналы складываются).'));
    L.push('');
  }
  writeSection('skew', L.join('\n'), out);
}

// ════════ ПУНКТ 4: три вредящих кристалла — по каналам, на свежих зёрнах ════════
if (all || want.has('harm')) {
  const data = SETS.map((s) => loadRaw(`harm-s${s}`).cells);
  const names = { 'natisk:b2': ['ONSLAUGHT MIND/TIMING (b2) Run-Down', 'stick +8, distance −6; тег chase_strike→PRESS [longFight] +0.12'], 'natisk:b4': ['ONSLAUGHT MIND/ADAPT (b4) Cling', 'stick +10, distance −6; тегов нет'], 'nalet:b1': ['RAIDER MIND/WATCH (b1) Fake-In', 'tempo +4; рычаг feintChance +20% (шанс финта); тегов нет'] };
  const L = []; const out = {};
  L.push('## Пункт 4. Три вредящих кристалла');
  L.push('');
  L.push('Ссылка: перезамер (`docs/crystal-remeasure/REPORT.md` §«Метки»): ВРЕДИТ — ONSLAUGHT Run-Down (−5.3), ONSLAUGHT Cling (−5.0), RAIDER Fake-In (−6.1), каждый с 95% интервалом, не пересекающим ноль. **Проверка в этой разведке:** разложение по каналам и перепроверка на обоих наборах зёрен (набор 1–200 — те же зёрна, что в перезамере; 201–400 — свежие). Оговорка: из 60 ячеек при 95% интервалах около 1–2 «значимо отрицательных» ожидаются от одного шума.');
  L.push('');
  for (const [key, [nm, what]] of Object.entries(names)) {
    L.push(`### ${nm}`); L.push(''); L.push(what); L.push('');
    const variants = Object.keys(data[0][key]).filter((k) => k !== 'bare');
    const tw = (i, v) => bits(data[i][key][v].w);
    const rows = []; out[key] = {};
    for (const v of variants) {
      const both = pairedShift([...tw(0, v), ...tw(1, v)], [...tw(0, 'bare'), ...tw(1, 'bare')]);
      const per = SETS.map((_, i) => pairedShift(tw(i, v), tw(i, 'bare')));
      out[key][v] = { both, per };
      rows.push([v.replace(/\+/g, ' + '), `**${ci(both)}**`, `${sgn(per[0].delta)} [${sgn(per[0].delta - 1.96 * per[0].se)}…${sgn(per[0].delta + 1.96 * per[0].se)}]`, `${sgn(per[1].delta)} [${sgn(per[1].delta - 1.96 * per[1].se)}…${sgn(per[1].delta + 1.96 * per[1].se)}]`]);
    }
    L.push(md(['канал (что оставлено)', 'оба набора, п.п. [95%]', 'набор 1–200', 'набор 201–400 (свежий)'], rows)); L.push('');
  }
  writeSection('harm', L.join('\n'), out);
}

// ════════ ПУНКТ 9: отрицательные грани MIND ════════
if (all || want.has('negbranch')) {
  const data = SETS.map((s) => loadRaw(`negbranch-s${s}`).cores);
  const L = []; const out = {};
  L.push('## Пункт 9 (гипотеза). Почему MIND у ONSLAUGHT (−2.4) и RAIDER (−4.5) хуже голого ядра');
  L.push('');
  L.push('Полная грань MIND (5 из 5) против 4 голых ядер, 400 зёрен на врага; варианты: **оси** (только сдвиги осей и рамп), **резонанс** (только наклон «родных» намерений ветви, срабатывает при ≥ 3 кристаллах), **теги** (только наклоны тегов), **наклоны** (резонанс + теги без осей), **оси без наклонов**, **полная**.');
  L.push('');
  for (const core of ['natisk', 'nalet']) {
    const key = (k, i) => bits(data[i][core][k].w);
    const bare = [...key('bare', 0), ...key('bare', 1)];
    const rows = []; out[core] = {};
    for (const [k, label] of [['full', 'полная грань'], ['axesOnly', 'только оси (наклонов нет, рычагов нет)'], ['noLeans', 'оси + рычаги, без наклонов'], ['leansOnly', 'только наклоны (резонанс + теги)'], ['resonanceOnly', 'только резонанс ветви'], ['tagsOnly', 'только теги']]) {
      const v = [...key(k, 0), ...key(k, 1)]; const ps = pairedShift(v, bare);
      const per = SETS.map((_, i) => pairedShift(key(k, i), key('bare', i)));
      out[core][k] = { ps, per };
      rows.push([label, `**${ci(ps)}**`, `${sgn(per[0].delta)} / ${sgn(per[1].delta)}`]);
    }
    const sb = addInto({}, data[0][core].bare.sums); addInto(sb, data[1][core].bare.sums);
    const sf = addInto({}, data[0][core].full.sums); addInto(sf, data[1][core].full.sums);
    const share = (s) => INTENTS.map((k, i) => `${k} ${pct(s.it[i] / s.n, 0)}`).join(', ');
    L.push(`### ${N(core)}`); L.push('');
    L.push(md(['что оставлено', 'сдвиг к голому, п.п. [95%]', 'набор 1 / набор 2'], rows)); L.push('');
    L.push(`Намерения (доля тиков игрока): голое — ${share(sb)}; полная грань — ${share(sf)}.`); L.push('');
    out[core].intents = { bare: share(sb), full: share(sf) };
  }
  writeSection('negbranch', L.join('\n'), out);
}

// ════════ ПУНКТЫ 6а и 8: запас очков вокруг тега ════════
if (all || want.has('gap')) {
  const cells = {};
  for (const s of SETS) for (let k = 0; k < 4; k++) {
    if (!hasRaw(`gap-${k}-s${s}`)) continue;
    const o = loadRaw(`gap-${k}-s${s}`);
    for (const [key, v] of Object.entries(o.cells)) {
      const a = cells[key] || (cells[key] = { dec: 0, needDec: 0, on: 0, onNoNeed: 0, isLeader: 0, flip: 0, curIsLean: 0, gaps: [], margins: [], w: [], tagW: v.tagW, tagIntent: v.tagIntent, by: {} });
      for (const k2 of ['dec', 'needDec', 'on', 'onNoNeed', 'isLeader', 'flip', 'curIsLean']) a[k2] += v[k2];
      a.gaps.push(...v.gaps); a.margins.push(...(v.margins || [])); a.w.push(...v.w); a.tagW = v.tagW ?? a.tagW; a.tagIntent = v.tagIntent ?? a.tagIntent;
      for (const [i, n] of Object.entries(v.byLeaderWhenNot)) a.by[i] = (a.by[i] || 0) + n;
    }
  }
  const L = []; const out = { cells: {} };
  const q = (xs, p) => (xs.length ? quantile(xs, p) : NaN);
  const row = (key, label) => {
    const a = cells[key]; if (!a) return null;
    const notLead = a.onNoNeed - a.isLeader;
    const r = {
      dec: a.dec, on: a.on / a.dec, byNeed: (a.on - a.onNoNeed) / Math.max(1, a.on), onNoNeed: a.onNoNeed / a.dec, leader: a.isLeader / Math.max(1, a.onNoNeed), flip: a.flip / a.dec, flipOfOn: a.flip / Math.max(1, a.on),
      gapMed: q(a.gaps, 0.5), gapP10: q(a.gaps, 0.1), gapP90: q(a.gaps, 0.9), marginMed: q(a.margins, 0.5), marginP10: q(a.margins, 0.1), w: a.tagW, intent: a.tagIntent, nGap: a.gaps.length, nMargin: a.margins.length, by: a.by, win: 100 * mean(a.w),
    };
    out.cells[key] = r;
    return r;
  };
  const tagName = { 'natisk:b2': ['ONSLAUGHT MIND/TIMING (b2) Run-Down', 'chase_strike→PRESS [longFight]'], 'natisk:b5': ['ONSLAUGHT MIND/COLD (b5) Lockdown', 'lockdown→HOLD [close]'], 'natisk:c4': ['ONSLAUGHT WILL/HUNGER (c4) No Breather', 'no_breather→PRESS [foeHpLow]'], 'skala:b4': ['BULWARK MIND/ADAPT (b4) Retaliation', 'retaliate_ramp→STRIKE [hpDropped]'], 'skala:b5': ['BULWARK MIND/COLD (b5) Sea Wall', 'counter_trap→CATCH [longFight]'], 'zasada:a3': ['AMBUSH BODY/GRIND (a3) Punish Aggression', 'punish_aggression→CATCH [hpDropped]'], 'zasada:c3': ['AMBUSH WILL/VOW (c3) Hit the Opening', 'vulnerable_strike→STRIKE [foeOpen]'], 'zasada:c5': ['AMBUSH WILL/STILL (c5) Execution', 'execute→STRIKE [foeHpLow]'] };
  L.push('## Пункт 6а. Восемь «тегов-пустышек»: почему условие верно, а выбор не меняется');
  L.push('');
  L.push('Кристалл в одиночку против 4 голых ядер, 400 зёрен на врага. Для каждого решения, где условие тега верно, считаются очки всех намерений (`spinalScore` — после наклонов, накала и бонуса удержания): **уже лидер** — наклонное намерение и без того впереди; **решила нужда** — решение принял жёсткий порог, очки не смотрелись; **запас** — на сколько очков лидер опережает наклонное намерение, когда оно не лидер (чтобы наклон сработал, вес тега должен быть больше запаса); **переворот** — выбор меняется, если наклон убрать.');
  L.push('');
  const rows6 = [];
  for (const [k, [nm, tg]] of Object.entries(tagName)) {
    const [core, id] = k.split(':'); const r = row(`dead:${core}:${id}`); if (!r) continue;
    rows6.push([nm, tg, pct(r.on, 1), pct(r.byNeed, 0), pct(r.leader, 0), `${f2(r.gapP10)} / **${f2(r.gapMed)}** / ${f2(r.gapP90)} (n=${r.nGap})`, f2(r.w), pct(r.flip, 2), pct(r.flipOfOn, 2)]);
  }
  L.push(md(['кристалл', 'тег', 'условие верно (доля решений)', 'из них решила нужда', 'из остальных: наклонное намерение уже лидер', 'запас до лидера, когда не лидер: p10 / медиана / p90', 'вес наклона', 'переворот, % всех решений', 'переворот, % при верном условии'], rows6));
  L.push('');
  L.push('**Гипотеза «прибавка тега меньше бонуса удержания 0.08» — опровергнута в том виде, как сформулирована:** вес обычного тега 0.12 и вершины 0.20, оба больше 0.08. Бонус удержания (0.08 текущему намерению) лишь добавляется к запасу. Настоящих причин три, и у каждой пустышки одна или две из них:');
  L.push('1. **Наклон смотрит туда, куда ядро и так идёт** (наклонное намерение уже лидер): ONSLAUGHT Run-Down, No Breather — PRESS у ONSLAUGHT впереди ≈ 99% времени; сдвигать нечего.');
  L.push('2. **Запас лидера больше веса наклона** (медиана запаса в таблице vs 0.12 / 0.20): Lockdown (HOLD против PRESS), Sea Wall, Punish Aggression, Hit the Opening, Retaliation — очки разных намерений различаются на десятые доли, а тег двигает на 0.12–0.2 (и он не может вытянуть намерение, которое и с наклоном остаётся вторым).');
  L.push('3. **Решение принимает нужда, а не очки** — только у BULWARK и AMBUSH: «ответ на замах» занимает ≈ половину решений (пункт 1) и очки тегов в этих решениях не читаются; столбец «из них решила нужда».');
  L.push('');
  writeSection('gap6a', L.join('\n'), out);

  // пункт 8: вершины — в одиночку и в грани
  const L8 = [];
  L8.push('## Пункт 8 (по очкам). Вершина в одиночку и в своей грани');
  L8.push('');
  L8.push('Те же счётчики, но для шести поглощённых вершин: «в одиночку» (ядро + вершина) и «в грани» (полная грань 5 из 5: резонанс включён). **Перевернул выбор** — доля решений, где без наклона вершины выбор стал бы другим; **запас лидера** — когда наклонное намерение лидер: на сколько оно опережает второе (наклон сработает, только если запас меньше его веса 0.2).');
  L8.push('');
  const vn = { 'natisk:a5': 'ONSLAUGHT BODY/ANVIL (a5) Breakthrough', 'natisk:c5': 'ONSLAUGHT WILL/STILL (c5) Rampage', 'nalet:a5': 'RAIDER BODY/ANVIL (a5) Perfect Prick', 'nalet:c5': 'RAIDER WILL/STILL (c5) Killing Run', 'skala:c5': 'BULWARK WILL/STILL (c5) Clinch', 'zasada:b5': 'AMBUSH MIND/COLD (b5) Phantom' };
  const rows8 = [];
  for (const [k, nm] of Object.entries(vn)) {
    const [core, id] = k.split(':');
    for (const scope of ['solo', 'branch']) {
      const r = row(`${scope}:${core}:${id}`); if (!r) continue;
      rows8.push([nm, scope === 'solo' ? 'в одиночку' : 'в полной грани', r.intent, pct(r.on, 1), pct(r.byNeed, 0), pct(r.leader, 0), `${f2(r.marginP10)} / **${f2(r.marginMed)}** (n=${r.nMargin})`, `${f2(r.gapP10)} / ${f2(r.gapMed)} (n=${r.nGap})`, pct(r.flip, 2)]);
    }
  }
  L8.push(md(['вершина', 'где', 'наклон к', 'условие верно', 'из них решила нужда', 'из остальных: наклонное уже лидер', 'если лидер: запас над вторым p10 / медиана', 'если не лидер: отставание от лидера p10 / медиана', 'переворот, % всех решений'], rows8));
  L8.push('');
  writeSection('gap8', L8.join('\n'), out);
}

// ════════ ПУНКТ 10: сборки на 7 кристаллов ════════
if (all || want.has('builds')) {
  const FIELDS = ['bare', 'bot'];
  const D = {}; // D[core][set][field][key] = foes
  for (const core of CORES) { D[core] = {}; for (const s of SETS) { D[core][s] = { bare: {}, bot: {} }; for (const h of [0, 1]) { if (!hasRaw(`builds-${core}-h${h}-s${s}`)) continue; const o = loadRaw(`builds-${core}-h${h}-s${s}`); for (const [key, byField] of Object.entries(o.builds)) for (const f of FIELDS) D[core][s][f][key] = byField[f].foes; } } }
  const SUM = [];
  const pattern = (key) => key.replace(/[abc]/g, '').split('').join('+') || '0';
  const L = []; const out = {};
  L.push('## Пункт 10. Сборки на 7 кристаллов');
  L.push('');
  L.push('**В коде (подтверждено чтением).** Условий зажигания нет: `buildTree(coreId, lit)` (`src/data/upgradeTree.js`) зажигает кристалл, если он `open`, укладывается в пул `RESOURCE = 7` (`src/data/upgradeData.js:14`, одно значение на проект; до 30.09.2026 было 5) и в предел ветви `limit = 5`. Порядок шагов внутри грани не проверяется — зажечь можно любой набор. Потолок **7 из 15**. Резонанс ветви включается порогом `COMBAT_BALANCE.grani.threshold = 3` (`combatBalance.js:290`): ≥ 3 зажжённых кристалла **одной** грани → наклон «родных» намерений ветви (`branchThreshold.js` BRANCH_HOME: главное +0.3, второстепенное +0.15, условие «всегда»). Ниже порога ветвь вклада не даёт, а три отдельных кристалла разных граней порога не набирают.');
  L.push('');
  L.push('**«Россыпь из 7 без порога» невозможна:** три грани × максимум 2 кристалла без порога = 6 < 7 (принцип Дирихле) — при 7 кристаллах хотя бы одна грань набирает 3. Ближайшее к «россыпи» — 3+2+2 (порог набирает ровно одна грань); оно измерено. Сверх списка ТЗ измерены ещё 5+1+1 и 4+2+1.');
  L.push('');
  L.push('**Как боты собирают кристаллы сейчас** (`src/services/collapseRun.js` `buildBotSide` → `src/data/foeCompose.js` `composeFoe` / `randomLitIds`): число зажжённых кристаллов N тянется **одно на сторону** равномерно от `COMBAT_BALANCE.collapse.botFacetsMin = 0` до `botFacetsMax = 7` (`combatBalance.js`; потолок ботов задан отдельно от `RESOURCE` игрока, намеренно); сами кристаллы — N **случайных из 15** (Фишер–Йейтс по всему списку, потом `buildTree`), без учёта граней и порядка. Получаются в среднем 3.5 кристалла, равновероятно 0…7; порог резонанса (3 в одной грани) набирается случайно. В рейде охрана и босс идут без кристаллов вовсе (`composeRaid`), союзники получают столько же, сколько у игрока. Этот способ воспроизведён в замере как поле «боты» (для каждой пары «ядро врага × зерно» сборка одна и та же у всех измеряемых сборок — сравнение парное).');
  L.push('');
  for (const core of CORES) {
    out[core] = {};
    for (const field of FIELDS) {
      const keys = Object.keys(D[core][1][field]);
      if (!keys.length) continue;
      const wins = {}; const perSet = {};
      for (const key of keys) {
        const w = SETS.map((s) => CORES.flatMap((f) => bits(D[core][s][field][key][f].w)));
        perSet[key] = w;
        wins[key] = mean([...w[0], ...w[1]]) * 100;
      }
      const baseW = SETS.map((_, i) => perSet.bare[i]);
      const ranked = keys.filter((k) => k !== 'bare').sort((a, b) => wins[b] - wins[a]);
      const rows = ranked.map((k, idx) => {
        const ps = pairedShift([...perSet[k][0], ...perSet[k][1]], [...baseW[0], ...baseW[1]]);
        const p0 = pairedShift(perSet[k][0], baseW[0]), p1 = pairedShift(perSet[k][1], baseW[1]);
        const secs = SETS.flatMap((s) => CORES.flatMap((f) => D[core][s][field][k][f].sec));
        return { k, pat: pattern(k), win: wins[k], d: ps, d0: p0, d1: p1, med: median(secs), rank0: 0, rank1: 0 };
      });
      // ранги по каждому набору
      for (const [i, s] of SETS.entries()) {
        const order = [...ranked].sort((a, b) => mean(perSet[b][i]) - mean(perSet[a][i]));
        rows.forEach((r) => { r[i ? 'rank1' : 'rank0'] = order.indexOf(r.k) + 1; });
      }
      const best = rows[0], second = rows[1];
      const gap = pairedShift([...perSet[best.k][0], ...perSet[best.k][1]], [...perSet[second.k][0], ...perSet[second.k][1]]);
      const gapSets = SETS.map((_, i) => pairedShift(perSet[best.k][i], perSet[second.k][i]));
      const restMean = mean(rows.slice(1).map((r) => r.win));
      out[core][field] = { rows, best: best.k, gap, gapSets, bareWin: wins.bare, restMean };
      L.push(`### ${N(core)} — поле «${field === 'bare' ? '4 голых ядра' : '4 ядра со сборками ботов'}»`);
      L.push('');
      L.push(`Голое ядро против этого поля: **${f1(wins.bare)}%**. 27 сборок на 7 кристаллов, 1600 боёв на сборку (4 врага × 400 зёрен); сдвиг — парный к голому ядру; ранг — по каждому набору зёрен отдельно (1–200 / 201–400).`);
      L.push('');
      L.push(md(['#', 'сборка (число кристаллов по граням)', 'рисунок', 'доля побед, %', 'сдвиг к голому, п.п. [95%]', 'набор 1 / набор 2', 'ранг 1 / 2', 'медиана боя, с'], rows.map((r, i) => [i + 1, r.k, r.pat, f1(r.win), ci(r.d), `${sgn(r.d0.delta)} / ${sgn(r.d1.delta)}`, `${r.rank0} / ${r.rank1}`, f1(r.med)])));
      L.push('');
      L.push(`**Лучшая: ${best.k}** (${f1(best.win)}%). Отрыв от второй (${second.k}, ${f1(second.win)}%): ${ci(gap)}; на наборах ${sgn(gapSets[0].delta)} / ${sgn(gapSets[1].delta)}. Среднее по остальным 26: ${f1(restMean)}% (отрыв лучшей ${sgn(best.win - restMean)} п.п.).`);
      L.push('');
      // по рисункам
      const byPat = {};
      for (const r of rows) (byPat[r.pat] = byPat[r.pat] || []).push(r);
      L.push('По рисункам (среднее сдвига к голому по сборкам рисунка): ' + Object.entries(byPat).sort((a, b) => mean(b[1].map((r) => r.d.delta)) - mean(a[1].map((r) => r.d.delta))).map(([p, rs]) => `${p}: ${sgn(mean(rs.map((r) => r.d.delta)))} (${rs.length} сб.)`).join('; ') + '.');
      L.push('');
      // среднее по сборкам с k кристаллами в грани
      const cnt = (key, b) => { const m = key.match(new RegExp(b + '(\\d)')); return m ? Number(m[1]) : 0; };
      const brRows = BR.map((b) => [BR_NAME[b], ...[0, 1, 2, 3, 4, 5].map((k) => { const rs = rows.filter((r) => cnt(r.k, b) === k); return rs.length ? `${f1(mean(rs.map((r) => r.win)))} (${rs.length})` : '—'; })]);
      L.push('Среднее число побед, %, по сборкам, где в грани ровно k кристаллов (в скобках — сколько таких сборок из 27):');
      L.push('');
      L.push(md(['грань', 'k = 0', 'k = 1', 'k = 2', 'k = 3', 'k = 4', 'k = 5'], brRows));
      L.push('');
      // лидеры, неотличимые от лучшей
      const bestW = [...perSet[best.k][0], ...perSet[best.k][1]];
      const tie = rows.filter((r) => { const d = pairedShift(bestW, [...perSet[r.k][0], ...perSet[r.k][1]]); return d.delta - 1.96 * d.se <= 0; });
      SUM.push({ core, field, best: best.k, bestWin: best.win, bare: wins.bare, second: second.k, secondWin: second.win, gap, gapSets, tie: tie.map((r) => r.k), worst: rows[rows.length - 1].k, worstWin: rows[rows.length - 1].win, worstD: rows[rows.length - 1].d, top3: rows.slice(0, 3).map((r) => `${r.k} ${f1(r.win)}`), restMean });
    }
  }
  const LS = [];
  LS.push('| ядро | поле | голое ядро, % | лучшая сборка (число кристаллов по граням) | её доля побед, % | вторая | отрыв от второй, п.п. [95%] (набор 1 / набор 2) | неотличимы от лучшей (95%) | худшая сборка: доля побед, % (сдвиг к голому) |');
  LS.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of SUM) LS.push(`| ${N(r.core)} | ${r.field === 'bare' ? 'голые ядра' : 'боты со сборками'} | ${f1(r.bare)} | **${r.best}** | ${f1(r.bestWin)} | ${r.second} (${f1(r.secondWin)}) | ${ci(r.gap)} (${sgn(r.gapSets[0].delta)} / ${sgn(r.gapSets[1].delta)}) | ${r.tie.length}: ${r.tie.slice(0, 6).join(', ')}${r.tie.length > 6 ? '…' : ''} | ${r.worst}: ${f1(r.worstWin)} (${sgn(r.worstD.delta)}) |`);
  writeSection('builds_summary', LS.join('\n'), SUM);
  writeSection('builds', L.join('\n'), out);
}
