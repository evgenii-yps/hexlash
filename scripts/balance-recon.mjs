// balance-recon.mjs — БАТЧ-ЗАМЕР БАЛАНСА. Только чтение: игровую логику не трогает.
//
// ЧЕМ СЧИТАЕТСЯ. Мгновенным боем (scene/instantBout.js) — тот же боец
// (buildFighter), то же поле боя, те же числа (combatBalance / buffBalance /
// klichBalance / upgradeData). Без рендера, шаг 1/60 с, мозг спинной. Своей
// арифметики боя здесь нет: скрипт только собирает пары, зажимает зерно
// случайности, вешает баффы/кличи через ТЕ ЖЕ рычаги бойца и считает статистику.
//
// ЗЕРНА. Math.random подменяется генератором mulberry32 (как в
// scripts/fight-regression.mjs). Бой N с зерном S повторяется бит в бит.
//   · разделы cores / crystals / levers: зёрна 1..SEEDS (по умолчанию 50)
//   · раздел raid: зёрна 1..RAID_SEEDS (по умолчанию 20)
//
// ЗАПУСК:
//   node scripts/balance-recon.mjs [раздел ...]      разделы: axes inventory metrics det cores bias table effect levers raid | all
//   SEEDS=200 node scripts/balance-recon.mjs effect
// Результат: docs/balance-recon/out/<раздел>.md и .json (+ в консоль).
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { openHarness, seedRandom, GAME_DUEL_POS } from './lib/bout-harness.mjs';

const SEEDS = Number(process.env.SEEDS || 50);
const RAID_SEEDS = Number(process.env.RAID_SEEDS || 20);
const OUT = new URL('../docs/balance-recon/out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

// Общий стенд (scripts/lib/bout-harness.mjs): заглушка холста, зерно, прогрев и
// дуэль из НАСТОЯЩИХ точек выхода арены. Своего прелюдия здесь больше нет — прежний
// ставил бойцов на (∓1.2, 0), а в игре они стоят по глубине плиты, 2.9 ед. друг от друга.
const H = await openHarness();
const { server, load, duel, runInstantBout, INSTANT_DT, resolveBehavior, strike } = H;
const { buildFighter } = await load('/src/scene/buildFighter.js');
const { AXIS_IDS, CORE_PROFILES } = await load('/src/data/behavior.js');
const { CORES, CRYSTALS } = await load('/src/data/upgradeData.js');
const { buildTree } = await load('/src/data/upgradeTree.js');
const { CRYSTAL_TEXTS, FACET_NAMES } = await load('/src/data/crystalTexts.js');
const { BUFF_BALANCE, rollDie } = await load('/src/data/buffBalance.js');
const { KLICH_BALANCE, KLICH_IDS } = await load('/src/data/klichBalance.js');
const { COMBAT_BALANCE } = await load('/src/data/combatBalance.js');
const { composeRaid, composeFoe } = await load('/src/data/foeCompose.js');
const { collapseSpawnPos } = await load('/src/data/collapseLayouts.js');

const CORE_IDS = CORES.map((c) => c.id);
const CORE_NAME = Object.fromEntries(CORES.map((c) => [c.id, c.name]));
const BRANCH_IDS = ['a', 'b', 'c'];

// ── статистика ──────────────────────────────────────────────────────────────
const sorted = (xs) => [...xs].sort((a, b) => a - b);
function quantile(xs, q) {
  if (!xs.length) return NaN;
  const s = sorted(xs);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
const median = (xs) => quantile(xs, 0.5);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const f0 = (x) => (Number.isFinite(x) ? String(Math.round(x)) : '—');
const pp = (x) => (Number.isFinite(x) ? (x >= 0 ? '+' : '') + x.toFixed(1) : '—');
const signed = (x) => (x > 0 ? '+' + x : x < 0 ? '−' + Math.abs(x) : '0');

const md = (head, rows) => {
  const line = (r) => '| ' + r.join(' | ') + ' |';
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n');
};
const emit = (name, mdText, json) => {
  writeFileSync(OUT + name + '.md', mdText + '\n');
  if (json !== undefined) writeFileSync(OUT + name + '.json', JSON.stringify(json, null, 1) + '\n');
  console.log(`\n===== ${name} =====\n` + mdText);
};
const progress = (s) => process.stderr.write(s + '\n');

// ── один бой один на один ────────────────────────────────────────────────────
// Стороны и точки — из общего стенда: 'player' (0.45, 1.3), 'foe' (−0.65, −1.4), как в
// ArenaScene. swap меняет порядок в списке и точки местами — убирает перекос стороны.
const POS_L = GAME_DUEL_POS.player;
const POS_R = GAME_DUEL_POS.foe;

// ── РАЗДЕЛ det: детерминизм харнесса ────────────────────────────────────────
function sectionDet() {
  const run = () => {
    const lines = [];
    for (const a of CORE_IDS) for (const b of CORE_IDS) for (const seed of [1, 2, 3]) {
      const r = duel({ seed, coreA: a, coreB: b });
      lines.push(`${a}|${b}|${seed}|${r.winner}|${r.sec.toFixed(6)}|${r.winHp01.toFixed(9)}`);
    }
    return createHash('sha256').update(lines.join('\n')).digest('hex');
  };
  const h1 = run(), h2 = run();
  const text = [
    '48 боёв (16 пар × зёрна 1,2,3) посчитаны дважды подряд.',
    '', '- прогон 1: `' + h1 + '`', '- прогон 2: `' + h2 + '`',
    '', h1 === h2 ? '**Совпало бит в бит — харнесс детерминирован.**' : '**⚠️ НЕ СОВПАЛО — замеры недостоверны.**',
  ].join('\n');
  emit('det', text, { h1, h2, equal: h1 === h2 });
  if (h1 !== h2) throw new Error('harness is not deterministic');
}

// ── РАЗДЕЛ cores: 16 пар × SEEDS ─────────────────────────────────────────────
function sectionCores() {
  const rows = [], json = [];
  for (const a of CORE_IDS) for (const b of CORE_IDS) {
    const rs = [];
    for (let s = 1; s <= SEEDS; s++) rs.push(duel({ seed: s, coreA: a, coreB: b }));
    const secs = rs.map((r) => r.sec);
    const wins = rs.filter((r) => r.winner === 'player').length;
    const draws = rs.filter((r) => r.winner !== 'player' && r.winner !== 'foe').length;
    const hpW = mean(rs.map((r) => r.winHp01 * 100));
    const capped = rs.filter((r) => r.capped).length;
    const over100 = rs.filter((r) => r.sec > 100).length;
    json.push({ a, b, n: rs.length, median: median(secs), p10: quantile(secs, 0.1), p90: quantile(secs, 0.9), max: Math.max(...secs), wins, draws, hpWinnerPct: hpW, capped, over100 });
    rows.push([
      `${CORE_NAME[a]} ${a === b ? '(зеркало)' : ''}`.trim(), CORE_NAME[b],
      f1(median(secs)), f1(quantile(secs, 0.1)), f1(quantile(secs, 0.9)), f1(Math.max(...secs)),
      `${wins}/${rs.length}` + (draws ? ` (+${draws} ничьих)` : ''), f0((100 * wins) / rs.length) + '%',
      f0(hpW) + '%', String(capped), String(over100),
    ]);
    progress(`cores ${a} vs ${b}`);
  }
  const head = ['A (слева, player)', 'B (справа, foe)', 'мед. с', 'p10 с', 'p90 с', 'макс. с', 'победы A', 'винрейт A', 'HP победителя (ср.)', 'упёрлись в таймаут (240 с)', 'дольше 100 с'];
  // Сводка по ядру: средний винрейт против трёх ДРУГИХ ядер (без зеркал), обе стороны.
  const agg = CORE_IDS.map((c) => {
    let w = 0, n = 0;
    for (const j of json) {
      if (j.a === j.b) continue;
      if (j.a === c) { w += j.wins; n += j.n; }
      if (j.b === c) { w += j.n - j.wins - j.draws; n += j.n; }
    }
    return [CORE_NAME[c], `${w}/${n}`, f1((100 * w) / n) + '%'];
  });
  // Матрица без перекоса порядка: (A,B) и (B,A) усредняются — A в одной паре идёт
  // первым в списке бойцов, в другой вторым (см. раздел bias).
  const at = (a, b) => json.find((j) => j.a === a && j.b === b);
  const matrix = CORE_IDS.map((a) => [CORE_NAME[a], ...CORE_IDS.map((b) => {
    if (a === b) return '—';
    const w = at(a, b).wins + (at(b, a).n - at(b, a).wins - at(b, a).draws);
    return `${f0((100 * w) / (at(a, b).n + at(b, a).n))}%`;
  })]);
  const mirrors = json.filter((j) => j.a === j.b).map((j) => `${CORE_NAME[j.a]}: победы «слева» ${j.wins}/${j.n}`).join(' · ');
  const text = [
    `Пары: 16 упорядоченных (A слева, B справа), зёрна 1..${SEEDS}. Начальные позиции — как в игре: (0.45, 1.3) и (−0.65, −1.4). Ядра без зажжённых кристаллов.`,
    '', md(head, rows),
    '', '**Сводный винрейт ядра против трёх других (обе стороны плиты, без зеркал):**', '',
    md(['ядро', 'победы', 'винрейт'], agg),
    '', '**Матрица винрейта «строка бьёт столбец», обе стороны и оба порядка усреднены (100 боёв на ячейку):**', '',
    md(['', ...CORE_IDS.map((c) => CORE_NAME[c])], matrix),
    '', '**Перекос в зеркалах (должно быть ≈50%):** ' + mirrors + '. Разбор перекоса (порядок в списке против точки выхода) — раздел bias.',
  ].join('\n');
  emit('cores', text, json);
}

// ── РАЗДЕЛ bias: откуда перекос «слева» ─────────────────────────────────────
// Зеркала в разделе cores дают ~38% слева. Развести две возможные причины: ПОРЯДОК
// бойцов в списке (кто обновляется в кадре первым) и ТОЧКА выхода (слева/справа).
function sectionBias() {
  const N = 100;
  const rows = [], all = { first: 0, left: 0, n: 0 };
  for (const core of CORE_IDS) {
    const cell = {};
    for (const order of [0, 1]) for (const right of [0, 1]) {
      let w = 0;
      for (let seed = 1; seed <= N; seed++) {
        seedRandom(seed);
        const a = { sideId: 'player', coreId: core, behavior: resolveBehavior(core), side: 'player', pos: right ? POS_R : POS_L };
        const b = { sideId: 'foe', coreId: core, behavior: resolveBehavior(core), side: 'opponent', pos: right ? POS_L : POS_R };
        const r = runInstantBout(order ? [b, a] : [a, b]);
        strike.clearAllDiceCharges();
        if (r.winner === 'player') w += 1;
      }
      cell[`${order}${right}`] = w;
    }
    // w[order][right] = победы 'player' из N. order=0 — player первым в списке; right=1 — player справа.
    const w = (o, r) => cell[`${o}${r}`];
    const firstWins = w(0, 0) + w(0, 1) + (N - w(1, 0)) + (N - w(1, 1)); // победы того, кто ПЕРВЫМ в списке
    const leftWins = w(0, 0) + w(1, 0) + (N - w(0, 1)) + (N - w(1, 1));  // победы того, кто СЛЕВА
    all.first += firstWins; all.left += leftWins; all.n += 4 * N;
    rows.push([CORE_NAME[core], `${firstWins}/${4 * N}`, f1(100 * firstWins / (4 * N)) + '%', `${leftWins}/${4 * N}`, f1(100 * leftWins / (4 * N)) + '%']);
    progress(`bias ${core}`);
  }
  const text = [
    `Зеркальные бои (одно ядро с обеих сторон), ${N} зёрен на каждую из 4 комбинаций «кто первым в списке × кто слева», 4 ядра = ${all.n} боёв. Считаются победы того, кто ПЕРВЫМ в списке бойцов (обновляется в кадре раньше), и того, кто СЛЕВА.`,
    '', md(['ядро', 'победы «первого в списке»', 'винрейт «первого»', 'победы «слева»', 'винрейт «слева»'], rows),
    '', `**Итого (${all.n} боёв):** «первый в списке» выигрывает ${f1(100 * all.first / all.n)}%, «слева» выигрывает ${f1(100 * all.left / all.n)}%. Честно — 50%; σ ≈ ${(Math.sqrt(0.25 / all.n) * 100).toFixed(1)} п.п.`,
  ].join('\n');
  emit('bias', text, { firstWinPct: 100 * all.first / all.n, leftWinPct: 100 * all.left / all.n, rows });
}

// ── РАЗДЕЛ table: ядро × кристалл → фактическая дельта (4.1, 4.2) ─────────────
// «Кристалл» здесь — словарь ТЗ: один из 5 шагов внутри грани (BODY/MIND/WILL).
// В коде это `face` внутри `branch` (a|b|c), см. upgradeData.js. Показываемый
// игроку текст — crystalTexts.js (общий на все 4 ядра); механика — upgradeData.js
// (своя у каждого ядра).
function fighterStats(coreId, litFaces) {
  const behavior = resolveBehavior(coreId, litFaces);
  const f = buildFighter('#FF0069', { coreId, behavior, brain: 'spinal', portrait: [] });
  const out = { ...f.stats, maxHp: f.maxHp };
  try { f.dispose(); } catch (_) { /* тело уже разобрано */ }
  return { stats: out, axes: behavior.axes, statBonuses: behavior.statBonuses };
}
const faceOf = (coreId, br, i) => CRYSTALS[coreId].find((c) => c.id === br).faces[i];

// Что кристалл ОБЕЩАЕТ ИГРОКУ по тексту, по осям темперамента. Это МОЁ ЧТЕНИЕ
// строк effect/character из crystalTexts.js — правится здесь, одним местом. Пусто
// ({}) = текст описывает механику, для которой в движке нет ни оси, ни рычага
// (память боя, обучение, «злость» и т.п.). Знак: + ось растёт, − падает.
const CLAIMS = {
  'a0': { resilience: +1, stick: +1, distance: -1 },          // ROOT: не отступает под давлением
  'a1': { weight: +1, initiative: +1 },                       // DRIVE: вес в ударе; открывает размен первым
  'a2': { resilience: +1, stick: +1 },                        // GRIND: не выдыхается, терпит, остаётся в размене
  'a3': { initiative: +1, counter: +1 },                      // BREAK: ловит момент и проламывает; жаден до финиша
  'a4': { resilience: +1, counter: +1 },                      // ANVIL: принимает и возвращает; спокоен под давлением
  'b0': { counter: +1, initiative: -1 },                      // WATCH: читает раньше; входит позже
  'b1': { tempo: -1, counter: +1 },                           // TIMING: попадает в паузы; меньше слепых ударов
  'b2': { tempo: -1 },                                        // FEINT: обманывает; теряет темп
  'b3': {},                                                   // ADAPT: не повторяет провальное (память боя)
  'b4': { resilience: +1 },                                   // COLD: не сбивается с плана
  'c0': {},                                                   // HOLD: быстрее восстанавливается между обменами (дыхание)
  'c1': {},                                                   // SPITE: чем хуже, тем опаснее (условие по здоровью)
  'c2': {},                                                   // VOW: держит приказ (командование)
  'c3': {},                                                   // HUNGER: учится внутри боя (память)
  'c4': { tempo: -1 },                                        // STILL: замедляется в решающий миг; живость падает
};
// Какие «бонусные» рычаги видны в f.stats (остальные живут только в данных).
const STAT_SEAMS = ['strikePower', 'toughness', 'accuracy', 'blockMitigation', 'blockPenetration', 'chargeMax', 'chargeGainPerSec', 'chargePowerBonusMax', 'chargePenetrationBonusMax'];

// ПРОВЕРКА ПРОВОДКИ РЫЧАГОВ. Кристалл, у которого рычаг никуда не подключён, в бою не
// делает ничего — и это видно точно: при том же зерне бой совпадает с нулевым БИТ В
// БИТ. Для каждого рычага-бонуса ставим заведомо большое значение (+100%) и сравниваем
// бои с нулевыми: 4 ядра × 20 зёрен, зеркало. Отличается хоть один бой — рычаг живой.
function seamWiring() {
  const N = 20, out = {};
  const sig = (behFor, core, seed) => {
    const r = duel({ seed, coreA: core, coreB: core, behA: behFor });
    return `${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}`;
  };
  const seams = new Set();
  for (const c of CORE_IDS) for (const cr of CRYSTALS[c]) for (const f of cr.faces) {
    if (f.statBonus) seams.add(f.statBonus.stat);
    for (const eb of f.extraBonuses || []) seams.add(eb.stat);
  }
  for (const key of seams) {
    let diff = 0, total = 0;
    for (const core of CORE_IDS) for (let seed = 1; seed <= N; seed++) {
      const base = sig(null, core, seed);
      const beh = resolveBehavior(core, []);
      beh.statBonuses[key] = (beh.statBonuses[key] || 0) + 1.0;
      const t = sig(beh, core, seed);
      total += 1; if (t !== base) diff += 1;
    }
    out[key] = { diff, total, wired: diff > 0 };
  }
  // Теги (conditionals / effects) — заявлены «мёртвыми». Проверка тем же способом:
  // вешаем бойцу ВСЕ теги сразу.
  const tags = new Set();
  for (const c of CORE_IDS) for (const cr of CRYSTALS[c]) for (const f of cr.faces) for (const t of [...(f.conditionals || []), ...(f.effects || [])]) tags.add(t);
  let diff = 0, total = 0;
  for (const core of CORE_IDS) for (let seed = 1; seed <= N; seed++) {
    const base = sig(null, core, seed);
    const beh = resolveBehavior(core, []);
    beh.conditionals = [...tags]; beh.effects = [...tags];
    total += 1; if (sig(beh, core, seed) !== base) diff += 1;
  }
  out['(теги: все ' + tags.size + ' сразу)'] = { diff, total, wired: diff > 0 };
  return out;
}

function sectionTable() {
  const wiring = seamWiring();
  const seamLabel = (k) => (wiring[k] && !wiring[k].wired ? `${k} ✗ЛОЖЬ` : k);
  const cells = [];
  const base = {};
  for (const c of CORE_IDS) base[c] = fighterStats(c, []);
  for (const coreId of CORE_IDS) {
    for (const br of BRANCH_IDS) {
      for (let i = 0; i < 5; i++) {
        const face = faceOf(coreId, br, i);
        const alone = fighterStats(coreId, [face]);
        // Предельный вклад: грани 0..i-1 той же грани уже горят (насыщение осей).
        const chainPrev = CRYSTALS[coreId].find((c) => c.id === br).faces.slice(0, i);
        const prev = fighterStats(coreId, chainPrev);
        const withThis = fighterStats(coreId, [...chainPrev, face]);
        const dAxes = {}, dAxesMarg = {}, dStats = {};
        for (const ax of AXIS_IDS) {
          const d = alone.axes[ax] - base[coreId].axes[ax];
          if (d) dAxes[ax] = d;
          const dm = withThis.axes[ax] - prev.axes[ax];
          if (dm) dAxesMarg[ax] = dm;
        }
        for (const k of [...STAT_SEAMS, 'mobility']) {
          const d = +(alone.stats[k] - base[coreId].stats[k]).toFixed(4);
          if (d) dStats[k] = d;
        }
        const declaredShifts = (face.shifts || []).map((s) => `${s.axis}${signed(s.delta)}`);
        const bonuses = [];
        if (face.statBonus) bonuses.push(`${seamLabel(face.statBonus.stat)} +${Math.round(face.statBonus.pct * 100)}%`);
        for (const eb of face.extraBonuses || []) bonuses.push(`${seamLabel(eb.stat)} +${Math.round(eb.pct * 100)}%`);
        const liveSeam = (face.statBonus ? [face.statBonus.stat] : []).concat((face.extraBonuses || []).map((e) => e.stat)).some((k) => wiring[k] && wiring[k].wired);
        const tags = [...(face.conditionals || []), ...(face.effects || [])];
        const text = CRYSTAL_TEXTS[br][i];
        const claim = CLAIMS[br + i];
        // Сверка обещанного с фактом. Только по осям, которые текст называет.
        const claimAxes = Object.keys(claim);
        let verdict;
        if (!claimAxes.length) verdict = 'НЕТ ОСИ: текст про механику, которой у оси нет';
        else {
          const hit = claimAxes.filter((ax) => dAxes[ax] && Math.sign(dAxes[ax]) === claim[ax]);
          const opp = claimAxes.filter((ax) => dAxes[ax] && Math.sign(dAxes[ax]) === -claim[ax]);
          const none = claimAxes.filter((ax) => !dAxes[ax]);
          if (hit.length === claimAxes.length) verdict = 'совпало';
          else if (hit.length && !opp.length) verdict = 'частично';
          else if (opp.length && !hit.length) verdict = 'ПРОТИВОПОЛОЖНО (' + opp.join(',') + ')';
          else if (hit.length && opp.length) verdict = 'смешано (' + hit.join(',') + ' верно; ' + opp.join(',') + ' наоборот)';
          else verdict = 'не совпало (оси ' + none.join(',') + ' не двигаются)';
        }
        cells.push({
          core: coreId, branch: br, idx: i, facet: FACET_NAMES[br], crystal: text.name,
          dataName: face.name, declaredShifts, bonuses, liveSeam, tags, dAxes, dAxesMarg, dStats,
          effectText: text.effect, characterText: text.character, verdict,
        });
      }
    }
  }
  // 4.2: нулевые / почти нулевые.
  //   Порог «почти нуля»: сумма |Δ осей| ≤ 6 в изоляции И нет ни одного ЖИВОГО рычага-бонуса.
  const magnitude = (c) => Object.values(c.dAxes).reduce((a, v) => a + Math.abs(v), 0);
  const nearZero = cells.filter((c) => magnitude(c) <= 6 && !c.liveSeam);
  const zeroAxisMarg = cells.filter((c) => Object.keys(c.dAxesMarg).length === 0 && !c.liveSeam);
  const satur = cells.filter((c) => c.declaredShifts.length && Object.keys(c.dAxesMarg).length < c.declaredShifts.length);
  const deadOnly = cells.filter((c) => c.bonuses.length && !c.liveSeam);

  const axShort = { distance: 'dist', initiative: 'init', tempo: 'tempo', weight: 'wt', stick: 'stick', resilience: 'res', counter: 'ctr', slip: 'slip' };
  const fmtAx = (d) => Object.entries(d).map(([k, v]) => `${axShort[k]}${signed(v)}`).join(' ') || '—';
  const fmtSt = (d) => Object.entries(d).map(([k, v]) => `${k.replace('Bonus', '').replace('PerSec', '/с')} ${v > 0 ? '+' : ''}${v}`).join(', ') || '—';
  const rows = cells.map((c) => [
    CORE_NAME[c.core], `${c.facet}/${c.crystal} (${c.branch}${c.idx + 1})`, c.dataName,
    fmtAx(c.dAxes), c.bonuses.join(', ') || '—', fmtSt(c.dStats), c.tags.length ? c.tags.join(', ') : '—',
    c.characterText, c.verdict,
  ]);
  const head = ['ядро', 'грань/кристалл', 'имя в данных', 'Δ осей (факт, от старта ядра)', 'бонусы (% к рычагу)', 'Δ stats у бойца (замер)', 'теги (мертвы)', 'CHARACTER, что видит игрок', 'текст vs механика'];
  const verdictCount = {};
  const vkey = (v) => (v.startsWith('НЕТ ОСИ') ? 'нет оси у механики' : v.startsWith('не совпало') ? 'не совпало' : v.startsWith('ПРОТИВОПОЛОЖНО') ? 'противоположно' : v.startsWith('смешано') ? 'смешано' : v);
  for (const c of cells) { const k = vkey(c.verdict); verdictCount[k] = (verdictCount[k] || 0) + 1; }
  const text = [
    '«Кристалл» = один из 5 шагов внутри грани (в коде `face` в ветке a|b|c). 15 кристаллов × 4 ядра = 60 ячеек.',
    'Δ осей — фактическая (после зажима 0..100) при зажжённом ЭТОМ кристалле одном, относительно стартового профиля ядра.',
    'Δ stats — замер у живого бойца (`buildFighter().stats`): strikePower / toughness / mobility / accuracy / blockMitigation / blockPenetration / chargeMax…',
    'Рычаги, которых нет в `stats` (feintChance, feintPayoff, staminaRegen, blockCounter, interruptBonus, dodgeCounter, missCounter, interruptResist), видны только в колонке «бонусы» — как записано в данных.',
    '', md(head, rows),
    '', `Сводка сверки текста с механикой (по моему чтению CLAIMS в скрипте): ${JSON.stringify(verdictCount)}`,
  ].join('\n');
  emit('table', text, cells);

  const nz = nearZero.map((c) => [CORE_NAME[c.core], `${c.facet}/${c.crystal} (${c.branch}${c.idx + 1})`, c.dataName, fmtAx(c.dAxes), c.bonuses.join(', ') || '—', c.tags.join(', ') || '—']);
  const sat = satur.map((c) => [CORE_NAME[c.core], `${c.facet}/${c.crystal} (${c.branch}${c.idx + 1})`, c.declaredShifts.join(' '), fmtAx(c.dAxesMarg)]);
  const wireRows = Object.entries(wiring).map(([k, v]) => [k, `${v.diff}/${v.total}`, v.wired ? 'живой' : '**ЛОЖЬ: бой не меняется вовсе**']);
  const text2 = [
    '**4.2а. Проводка рычагов-бонусов.** Каждому рычагу ставилось +100% (бонус кристалла), 4 ядра × 20 зёрен, зеркало; сравнение с нулевым боем бит в бит. «Изменилось» — сколько боёв из 80 отличаются.', '',
    md(['рычаг', 'боёв изменилось', 'вывод'], wireRows),
    '', `**4.2б. Кристаллы, чей ЕДИНСТВЕННЫЙ бонус — мёртвый рычаг (осевой сдвиг, если он есть, остаётся):** ${deadOnly.length ? deadOnly.map((c) => `${CORE_NAME[c.core]} ${c.crystal}`).join(', ') : 'нет'}.`,
    '', '**4.2в. Малая дельта: Σ|Δ осей| ≤ 6 в изоляции и нет ни одного живого рычага-бонуса** (кристалл почти ничего не меняет в бойце сам по себе):', '',
    nz.length ? md(['ядро', 'кристалл', 'имя', 'Δ осей факт', 'бонусы', 'теги'], nz) : '_нет_',
    '', '**4.2г. Ось насыщается: при зажжённых предыдущих кристаллах той же грани записанный сдвиг съедается зажимом 0..100 (факт < записанного).**', '',
    sat.length ? md(['ядро', 'кристалл', 'записано', 'предельный вклад (факт)'], sat) : '_нет_',
    '', `Кристаллов без единого движения осей в изоляции: ${cells.filter((c) => !Object.keys(c.dAxes).length).length} из 60 (все имеют ось или бонус).`,
    `Кристаллов, у которых предельный вклад по осям нулевой и живого рычага нет: ${zeroAxisMarg.length} — ${zeroAxisMarg.map((c) => `${CORE_NAME[c.core]} ${c.crystal}`).join(', ') || '—'}.`,
  ].join('\n');
  emit('table_zero', text2, { nearZero, satur, zeroAxisMarg });
}

// ── РАЗДЕЛ effect: вклад каждого кристалла в исход (4.3) ────────────────────
// Зеркало: то же ядро с обеих сторон. Одна сторона («T») с ОДНИМ зажжённым
// кристаллом, другая без. Стороны плиты чередуются по чётности зерна (убирает
// перекос слева/справа). Метрика — винрейт T, п.п. к нулевому замеру (T без
// кристалла, те же зёрна и позиции).
function mirrorWr(coreId, behT, seedsN) {
  let wins = 0; const secs = [], sigs = [];
  for (let s = 1; s <= seedsN; s++) {
    const swap = s % 2 === 0; // T слева на нечётных, справа на чётных
    // T всегда идёт первым аргументом (сторона 'player'), позиция — swap.
    const r = duel({ seed: s, coreA: coreId, coreB: coreId, behA: behT, swap });
    if (r.winner === 'player') wins += 1;
    secs.push(r.sec);
    sigs.push(`${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}`);
  }
  return { wr: (100 * wins) / seedsN, wins, med: median(secs), sigs };
}
function sectionEffect() {
  const cells = [];
  const baseByCore = {};
  for (const coreId of CORE_IDS) {
    baseByCore[coreId] = mirrorWr(coreId, null, SEEDS);
    progress(`effect base ${coreId} wr=${baseByCore[coreId].wr}`);
  }
  for (const coreId of CORE_IDS) {
    for (const br of BRANCH_IDS) {
      for (let i = 0; i < 5; i++) {
        const face = faceOf(coreId, br, i);
        const r = mirrorWr(coreId, resolveBehavior(coreId, [face]), SEEDS);
        const base = baseByCore[coreId];
        cells.push({
          core: coreId, branch: br, idx: i, facet: FACET_NAMES[br], crystal: CRYSTAL_TEXTS[br][i].name, dataName: face.name,
          wr: r.wr, wins: r.wins, dWr: r.wr - 50, dWrVsBase: r.wr - base.wr, medSec: r.med, dMed: r.med - base.med,
          identical: r.sigs.filter((x, i) => x === base.sigs[i]).length,
        });
      }
    }
    progress(`effect ${coreId} done`);
  }
  const sigma = Math.sqrt(0.25 / SEEDS) * 100;
  const rows = cells.map((c) => [
    CORE_NAME[c.core], `${c.facet}/${c.crystal} (${c.branch}${c.idx + 1})`, c.dataName,
    `${c.wins}/${SEEDS}`, f0(c.wr) + '%', pp(c.dWr), pp(c.dWrVsBase), f1(c.medSec), pp(c.dMed), `${c.identical}/${SEEDS}`,
  ]);
  const dead = cells.filter((c) => c.identical === SEEDS);
  const nearDead = cells.filter((c) => c.identical < SEEDS && c.identical >= 0.8 * SEEDS);
  const baseRows = CORE_IDS.map((c) => [CORE_NAME[c], `${baseByCore[c].wins}/${SEEDS}`, f0(baseByCore[c].wr) + '%', f1(baseByCore[c].med)]);
  // Сводка по граням и по глубине.
  const byDepth = [0, 1, 2, 3, 4].map((i) => [`шаг ${i + 1}`, pp(mean(cells.filter((c) => c.idx === i).map((c) => c.dWr)))]);
  const byBranch = BRANCH_IDS.map((b) => [FACET_NAMES[b], pp(mean(cells.filter((c) => c.branch === b).map((c) => c.dWr)))]);
  const byCore = CORE_IDS.map((c) => [CORE_NAME[c], pp(mean(cells.filter((x) => x.core === c).map((x) => x.dWr))), pp(mean(cells.filter((x) => x.core === c).map((x) => Math.abs(x.dWr))))]);
  const strong = [...cells].sort((a, b) => b.dWr - a.dWr);
  const text = [
    `Зеркальный бой, ${SEEDS} зёрен на ячейку, стороны плиты чередуются. T = сторона с ОДНИМ зажжённым кристаллом. «Δ к 50%» — сдвиг винрейта T от честной ничьей; «Δ к нулю» — от замера того же зеркала без кристаллов (перекос сторон вычтен).`,
    `**Шум:** при n=${SEEDS} стандартное отклонение винрейта ≈ ${sigma.toFixed(1)} п.п. Колонка «Δ к нулю» — РАЗНОСТЬ двух замеров (кристалл и нулевой), поэтому её σ ≈ ${(Math.SQRT2 * sigma).toFixed(1)} п.п., а 95% интервал ≈ ±${(1.96 * Math.SQRT2 * sigma).toFixed(0)} п.п.: сдвиги «к нулю» меньше ~${(2 * Math.SQRT2 * sigma).toFixed(0)} п.п. от шума не отличимы. Столбец «Δ к 50%» несёт ещё и перекос зеркала — смотреть на «Δ к нулю».`,
    '', '**Нулевой замер (зеркало без кристаллов; T = сторона, помеченная в чётные/нечётные зёрна):**', '', md(['ядро', 'победы T', 'винрейт T', 'мед. длительность, с'], baseRows),
    '', md(['ядро', 'кристалл', 'имя в данных', 'победы T', 'винрейт T', 'Δ к 50%, п.п.', 'Δ к нулю, п.п.', 'мед. с', 'Δ мед. с', 'боёв бит-в-бит как без кристалла'], rows),
    '', `**Кристаллы, НИЧЕГО не меняющие в бою (все ${SEEDS} боёв совпали с нулевым бит в бит):** ` + (dead.length ? dead.map((c) => `${CORE_NAME[c.core]} ${c.facet}/${c.crystal}`).join(', ') : 'нет'),
    '', `**Почти ничего не меняющие (≥80% боёв совпали бит-в-бит, но не все):** ` + (nearDead.length ? nearDead.map((c) => `${CORE_NAME[c.core]} ${c.facet}/${c.crystal} (${c.identical}/${SEEDS})`).join(', ') : 'нет'),
    '', '**Средний сдвиг по ядрам (знак / средний модуль):**', '', md(['ядро', 'средний Δ', 'средний |Δ|'], byCore),
    '', '**По граням:** ' + byBranch.map((r) => `${r[0]} ${r[1]}`).join(' · '),
    '', '**По глубине (шаг в грани):** ' + byDepth.map((r) => `${r[0]} ${r[1]}`).join(' · '),
    '', '**Топ-5 плюс:** ' + strong.slice(0, 5).map((c) => `${CORE_NAME[c.core]} ${c.crystal} ${pp(c.dWr)}`).join(', '),
    '', '**Топ-5 минус:** ' + strong.slice(-5).reverse().map((c) => `${CORE_NAME[c.core]} ${c.crystal} ${pp(c.dWr)}`).join(', '),
  ].join('\n');
  emit(`effect_${SEEDS}`, text, { seeds: SEEDS, sigmaPP: sigma, base: Object.fromEntries(CORE_IDS.map((c) => [c, { wr: baseByCore[c].wr, wins: baseByCore[c].wins, med: baseByCore[c].med }])), cells });
}

// ── РАЗДЕЛ levers: баффы и клич ──────────────────────────────────────────────
// Правила применения (ФИКСИРОВАННЫЕ; одинаковы для всех ядер и зёрен). T = сторона
// с рычагом. Рычаг у T применяется РОВНО ОДИН РАЗ, если не сказано иное.
//   'fixed'  — в момент t = FIXED_T с начала боя, безусловно.
//   'bot'    — по правилу бота из buffBalance.bot (то же, что в игре, services/buffs.js
//              tickBot), но без паузы между бросками (бросок один):
//                 TOWEL  — как только здоровье T < towelHpBelow (0.40)
//                 BUCKET — как только расстояние до цели < bucketNearDist (2.2)
//                 DICE   — как только здоровье цели < diceFoeHpBelow (0.50) ИЛИ t ≥ diceLateSec (20 с)
//   клич: 'single' — один клич в t=KLICH_T; 'kit' — три применения (тот же клич)
//         в t = KLICH_T, +cooldown, +2·cooldown (три заряда, откат 6 с — потолок правил).
// Механика баффа воспроизведена по services/buffs.js applyBuff/buffTick теми же
// вызовами бойца (heal / shortenStagger / setBuffPace / armDiceCharge / applyKlich)
// и теми же числами из buffBalance / klichBalance.
const FIXED_T = 10;
const KLICH_T = 5;

function makeLever(kind, rule, opts = {}) {
  // kind: 'towel'|'bucket'|'dice'|'push'|'fallback'|'hold'
  let fired = 0;
  let effect = null;
  const times = [];
  return {
    fired: () => fired,
    step(now, alive) {
      const T = alive.find((u) => u.sideId === 'player');
      const C = alive.find((u) => u.sideId === 'foe');
      // Эффект баффа: тик.
      if (effect && T) {
        const f = T.f;
        if (effect.id === 'towel') {
          f.heal(effect.rate * INSTANT_DT);
          const st = f.isStaggered && f.isStaggered();
          if (st && !effect.stagHandled) { f.shortenStagger(BUFF_BALANCE.towel.staggerRecoverMul); effect.stagHandled = true; }
          if (!st && effect.stagHandled) effect.stagHandled = false;
        }
        if (effect.id === 'dice' && !strike.diceChargeOf(f)) effect = null;
        else if (now >= effect.until) { if (effect.id === 'bucket') f.setBuffPace(1); if (effect.id === 'dice') strike.clearDiceCharge(f); effect = null; }
      }
      if (!T || !C) return;
      const f = T.f;
      // Клич: расписание.
      if (KLICH_IDS.includes(kind)) {
        const K = KLICH_BALANCE;
        const sched = rule === 'kit' ? [KLICH_T, KLICH_T + K.cooldownSec, KLICH_T + 2 * K.cooldownSec] : [KLICH_T];
        if (fired < sched.length && now >= sched[fired]) {
          f.applyKlich(K.axes[kind], K.holdSec, K.fadeSec); fired += 1; times.push(now);
        }
        return;
      }
      if (fired >= 1 || effect) return;
      const hp01 = f.getHp() / f.maxHp;
      const foeHp01 = C.f.getHp() / C.f.maxHp;
      const gap = f.group.position.distanceTo(C.f.group.position);
      const B = BUFF_BALANCE.bot;
      let go = false;
      if (rule === 'fixed') go = now >= FIXED_T;
      else if (kind === 'towel') go = hp01 < B.towelHpBelow;
      else if (kind === 'bucket') go = gap < B.bucketNearDist;
      else if (kind === 'dice') go = foeHp01 < B.diceFoeHpBelow || now >= B.diceLateSec;
      if (!go) return;
      fired = 1; times.push(now);
      if (kind === 'towel') {
        const o = BUFF_BALANCE.towel;
        effect = { id: 'towel', until: now + o.durationSec, rate: o.healFracOfMax / o.durationSec, stagHandled: false };
        if (f.isStaggered && f.isStaggered()) { f.shortenStagger(o.staggerRecoverMul); effect.stagHandled = true; }
      } else if (kind === 'bucket') {
        f.setBuffPace(BUFF_BALANCE.bucket.paceMul);
        effect = { id: 'bucket', until: now + BUFF_BALANCE.bucket.durationSec };
      } else if (kind === 'dice') {
        const face = opts.face || rollDie();
        const row = BUFF_BALANCE.dice.faces[face];
        strike.armDiceCharge(f, row.mul, row.hits);
        effect = { id: 'dice', until: Infinity };
      }
    },
    firedAt: () => times[0],
  };
}

// ОКНА НАБЛЮДЕНИЯ. Молчаливый счётчик поверх боя (ничего не меняет): за окно [t0,t1)
// собирает, что делала сторона T — дистанция до цели, скорость, начатые атаки, снятое
// и полученное здоровье. Нужен, чтобы видеть, ДЕЛАЕТ ЛИ рычаг то, что обещает карточка
// (клич — манеру, ведро — скорость, полотенце — здоровье), а не только сдвиг винрейта.
const WINDOWS = { klich: [5, 13], fixed: [10, 15] };
function makeRecorder() {
  const acc = {};
  for (const k of Object.keys(WINDOWS)) acc[k] = { gap: 0, gapN: 0, dist: 0, atk: 0, out: 0, inn: 0, heal: 0, sec: 0 };
  let prevPos = null, prevPhase = 'neutral', prevMe = null, prevFoe = null;
  return {
    acc,
    step(now, alive) {
      const T = alive.find((u) => u.sideId === 'player'); const C = alive.find((u) => u.sideId === 'foe');
      if (!T) return;
      const p = T.f.group.position;
      const ph = T.f.getActionPhase();
      const started = (ph === 'windup' || ph === 'commit') && !(prevPhase === 'windup' || prevPhase === 'commit');
      const hpMe = T.f.getHp(), hpFoe = C ? C.f.getHp() : null;
      for (const [k, [t0, t1]] of Object.entries(WINDOWS)) {
        if (now < t0 || now >= t1) continue;
        const a = acc[k];
        a.sec += INSTANT_DT;
        if (prevPos) a.dist += Math.hypot(p.x - prevPos.x, p.z - prevPos.z);
        if (C) { a.gap += p.distanceTo(C.f.group.position); a.gapN += 1; }
        if (started) a.atk += 1;
        if (prevMe != null) { if (hpMe < prevMe) a.inn += prevMe - hpMe; else a.heal += hpMe - prevMe; }
        if (prevFoe != null && hpFoe != null && hpFoe < prevFoe) a.out += prevFoe - hpFoe;
      }
      prevPos = { x: p.x, z: p.z }; prevPhase = ph; prevMe = hpMe; prevFoe = hpFoe;
    },
  };
}
const sigOf = (r) => `${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}`;

function leverRun(coreId, kind, rule, seedsN, opts) {
  const recs = [], sigs = [];
  let applied = 0; const appliedAt = [];
  const win = {};
  for (const k of Object.keys(WINDOWS)) win[k] = { gap: 0, gapN: 0, dist: 0, atk: 0, out: 0, inn: 0, heal: 0, sec: 0 };
  for (let s = 1; s <= seedsN; s++) {
    const swap = s % 2 === 0;
    const lv = kind ? makeLever(kind, rule, opts) : null;
    const rec = makeRecorder();
    const r = duel({ seed: s, coreA: coreId, coreB: coreId, swap, onStep: (now, alive) => { if (lv) lv.step(now, alive); rec.step(now, alive); } });
    recs.push(r); sigs.push(sigOf(r));
    for (const k of Object.keys(win)) for (const f of Object.keys(win[k])) win[k][f] += rec.acc[k][f];
    if (lv && lv.fired()) { applied += 1; appliedAt.push(lv.firedAt()); }
  }
  return {
    wins: recs.filter((r) => r.winner === 'player').length, n: recs.length,
    secs: recs.map((r) => r.sec), sigs, applied, appliedAtMed: median(appliedAt), win,
  };
}

function sectionLevers() {
  const variants = [
    { key: 'towel/bot', kind: 'towel', rule: 'bot', label: 'TOWEL · правило бота (здоровье < 40%)' },
    { key: 'towel/fixed', kind: 'towel', rule: 'fixed', label: `TOWEL · фикс. t=${FIXED_T} с` },
    { key: 'bucket/bot', kind: 'bucket', rule: 'bot', label: 'BUCKET · правило бота (цель ближе 2.2)' },
    { key: 'bucket/fixed', kind: 'bucket', rule: 'fixed', label: `BUCKET · фикс. t=${FIXED_T} с` },
    { key: 'dice/bot', kind: 'dice', rule: 'bot', label: 'DICE · правило бота (цель < 50% HP или t ≥ 20 с), случайная грань' },
    { key: 'dice/fixed', kind: 'dice', rule: 'fixed', label: `DICE · фикс. t=${FIXED_T} с, случайная грань` },
    ...[1, 2, 3, 4, 5, 6].map((face) => ({ key: `dice/face${face}`, kind: 'dice', rule: 'fixed', opts: { face }, label: `DICE · фикс. t=${FIXED_T} с, грань ${face} (${BUFF_BALANCE.dice.faces[face].hits}×${BUFF_BALANCE.dice.faces[face].mul})` })),
    ...KLICH_IDS.flatMap((k) => [
      { key: `${k}/single`, kind: k, rule: 'single', label: `КЛИЧ ${k.toUpperCase()} · один, t=${KLICH_T} с` },
      { key: `${k}/kit`, kind: k, rule: 'kit', label: `КЛИЧ ${k.toUpperCase()} · три подряд (t=${KLICH_T}, +6, +12)` },
    ]),
  ];
  const baseline = {};
  for (const c of CORE_IDS) baseline[c] = leverRun(c, null, null, SEEDS);
  const baseAll = { wins: 0, n: 0, secs: [], win: {} };
  for (const k of Object.keys(WINDOWS)) baseAll.win[k] = { gap: 0, gapN: 0, dist: 0, atk: 0, out: 0, inn: 0, heal: 0, sec: 0 };
  for (const c of CORE_IDS) {
    baseAll.wins += baseline[c].wins; baseAll.n += baseline[c].n; baseAll.secs.push(...baseline[c].secs);
    for (const k of Object.keys(WINDOWS)) for (const f of Object.keys(baseAll.win[k])) baseAll.win[k][f] += baseline[c].win[k][f];
  }
  const results = [];
  for (const v of variants) {
    const per = {};
    const all = { wins: 0, n: 0, secs: [], applied: 0, at: [], changed: 0, win: {} };
    for (const k of Object.keys(WINDOWS)) all.win[k] = { gap: 0, gapN: 0, dist: 0, atk: 0, out: 0, inn: 0, heal: 0, sec: 0 };
    for (const c of CORE_IDS) {
      per[c] = leverRun(c, v.kind, v.rule, SEEDS, v.opts);
      all.wins += per[c].wins; all.n += per[c].n; all.secs.push(...per[c].secs); all.applied += per[c].applied;
      all.changed += per[c].sigs.filter((x, i) => x !== baseline[c].sigs[i]).length;
      for (const k of Object.keys(WINDOWS)) for (const f of Object.keys(all.win[k])) all.win[k][f] += per[c].win[k][f];
      if (Number.isFinite(per[c].appliedAtMed)) all.at.push(per[c].appliedAtMed);
    }
    results.push({ v, per, all });
    progress(`levers ${v.key} wr=${f1((100 * all.wins) / all.n)}`);
  }
  const wrOf = (o) => (100 * o.wins) / o.n;
  const baseWr = wrOf(baseAll);
  const baseMed = median(baseAll.secs);
  const perCoreHead = CORE_IDS.map((c) => CORE_NAME[c]);
  const rows = results.map(({ v, per, all }) => [
    v.label,
    `${all.applied}/${all.n}`, f1(median(all.at)), `${all.changed}/${all.n}`,
    `${all.wins}/${all.n}`, f1(wrOf(all)) + '%', pp(wrOf(all) - baseWr), f1(median(all.secs)), pp(median(all.secs) - baseMed),
    ...CORE_IDS.map((c) => pp(wrOf(per[c]) - wrOf(baseline[c]))),
  ]);
  const wf = (w) => ({ gap: w.gap / Math.max(w.gapN, 1), spd: w.dist / Math.max(w.sec, 1e-9), atk: w.atk / Math.max(w.sec, 1e-9), out: w.out / Math.max(w.sec, 1e-9), inn: w.inn / Math.max(w.sec, 1e-9), heal: w.heal / Math.max(w.sec, 1e-9) });
  const winRows = [];
  const pushWin = (label, key, r) => {
    const b = wf(baseAll.win[key]), t = wf(r.all.win[key]);
    winRows.push([label, `${WINDOWS[key][0]}–${WINDOWS[key][1]} с`,
      `${b.gap.toFixed(2)} → ${t.gap.toFixed(2)}`, `${b.spd.toFixed(2)} → ${t.spd.toFixed(2)}`, `${b.atk.toFixed(2)} → ${t.atk.toFixed(2)}`,
      `${b.out.toFixed(2)} → ${t.out.toFixed(2)}`, `${b.inn.toFixed(2)} → ${t.inn.toFixed(2)}`, `${b.heal.toFixed(2)} → ${t.heal.toFixed(2)}`]);
  };
  for (const r of results) {
    if (r.v.key === 'towel/fixed' || r.v.key === 'bucket/fixed' || r.v.key === 'dice/fixed') pushWin(r.v.label, 'fixed', r);
    if (r.v.key.endsWith('/single') || r.v.key.endsWith('/kit')) pushWin(r.v.label, 'klich', r);
  }
  // Клич по ядрам: дистанция до цели и атаки/с в окне 5–13 с, «нулевой → с кличем».
  const perCoreWin = [];
  for (const r of results) {
    if (!r.v.key.endsWith('/single')) continue;
    perCoreWin.push([r.v.label, ...CORE_IDS.map((c) => {
      const b = wf(baseline[c].win.klich), t = wf(r.per[c].win.klich);
      return `${b.gap.toFixed(2)}→${t.gap.toFixed(2)} · ${b.atk.toFixed(2)}→${t.atk.toFixed(2)}`;
    })]);
  }
  const sigmaAll = Math.sqrt(0.25 / (SEEDS * 4)) * 100;
  const sigmaCore = Math.sqrt(0.25 / SEEDS) * 100;
  const text = [
    `Зеркальный бой (одно и то же ядро с обеих сторон), по ${SEEDS} зёрен на ядро × 4 ядра = ${SEEDS * 4} боёв на строку. T — сторона с рычагом, стороны плиты чередуются по чётности зерна. Второй стороне рычага нет.`,
    `Нулевой замер (те же зёрна, рычага нет): винрейт T = ${f1(baseWr)}% (${baseAll.wins}/${baseAll.n}), мед. длительность = ${f1(baseMed)} с.`,
    `**Шум:** σ винрейта одного замера ≈ ${sigmaAll.toFixed(1)} п.п. на строку (n=${SEEDS * 4}) и ≈ ${sigmaCore.toFixed(1)} п.п. на одно ядро (n=${SEEDS}). Колонка Δ — РАЗНОСТЬ двух замеров (с рычагом и без), её σ ≈ ${(Math.SQRT2 * sigmaAll).toFixed(1)} п.п. на строку, 95% интервал ≈ ±${(1.96 * Math.SQRT2 * sigmaAll).toFixed(0)} п.п. (на одно ядро ±${(1.96 * Math.SQRT2 * sigmaCore).toFixed(0)} п.п.).`,
    '', '**Правила применения (фиксированные, одинаковы для всех ядер и зёрен).** `fixed` — безусловно в t=10 с. `bot` — по порогам бота из buffBalance.bot (полотенце: своё HP < 40%; ведро: цель ближе 2.2; кубик: HP цели < 50% или t ≥ 20 с). Клич: один в t=5 с либо три подряд (5, 11, 17 с — заряды и откат 6 с из klichBalance). «Применено» — в скольких боях правило вообще сработало.',
    '', '**Что рычаг делает с бойцом T в окне наблюдения** (среднее по всем боям «до → после»; окно — фиксированное, у клича 5–13 с, у баффов 10–15 с; строка «нулевой» — те же бои без рычага в то же окно). Колонки: дистанция до цели, скорость хода (ед./с), начатых атак/с, снятое у цели HP/с, полученное HP/с, вылеченное HP/с.', '',
    md(['рычаг', 'окно', 'дистанция', 'скорость', 'атак/с', 'снято/с', 'получено/с', 'лечение/с'], winRows),
    '', '**Клич по ядрам** (окно 5–13 с; в ячейке: дистанция до цели «нулевой→с кличем» · атак/с «нулевой→с кличем»):', '',
    md(['клич', ...CORE_IDS.map((c) => CORE_NAME[c])], perCoreWin),
    '', md(['рычаг · правило', 'применено', 'мед. t применения, с', 'боёв изменилось (бит-в-бит) к нулевому', 'победы T', 'винрейт T', 'Δ винрейта, п.п.', 'мед. длит., с', 'Δ мед., с', ...perCoreHead.map((n) => `Δ п.п. ${n}`)], rows),
  ].join('\n');
  emit('levers', text, { seeds: SEEDS, baseline: { wr: baseWr, med: baseMed }, results: results.map(({ v, per, all }) => ({ key: v.key, applied: all.applied, n: all.n, wins: all.wins, wr: wrOf(all), medSec: median(all.secs), perCore: Object.fromEntries(CORE_IDS.map((c) => [c, { wins: per[c].wins, n: per[c].n, wr: wrOf(per[c]) }])) })) });
}

// ── РАЗДЕЛ raid ──────────────────────────────────────────────────────────────
// Состав как в игре (foeCompose.composeRaid): игрок + 3 союзника против босса + 2
// охраны. Грани раздаются игроку и союзникам (litCount), чужой стороне — ноль.
// БОЕЦ ИГРОКА собирается тем же composeFoe (ядро случайное) — в замере он «бот с
// теми же гранями»: живого выбора ядра в замере нет.
// ⚠️ Точки выхода — collapseSpawnPos(4, …) (шеренга на четверых); настоящие точки
//    рейда лежат в ArenaScene.vue (защищённый файл, не открывался). Масштаб босса
//    (bossScale) — визуальная надбавка; мгновенный бой её не передаёт.
function sectionRaid() {
  const R = COMBAT_BALANCE.raid;
  const runs = [];
  for (const lit of [0, 1, 2, 3, 4, 5]) {
    const recs = [];
    for (let s = 1; s <= RAID_SEEDS; s++) {
      seedRandom(s);
      const raid = composeRaid({ litCount: lit });
      const player = composeFoe({ litCount: lit, takenNames: [], rnd: Math.random });
      const mk = (f, sideId, side, k, isSideA, extra = {}) => ({
        sideId, coreId: f.coreId, behavior: f.behavior, side, pos: collapseSpawnPos(4, isSideA, k), ...extra,
      });
      const specs = [
        mk(player, 'player', 'player', 0, true),
        ...raid.allies.map((f, k) => mk(f, 'player', 'player', k + 1, true)),
        mk(raid.boss, 'foe', 'opponent', 0, false, { isBoss: true }),
        ...raid.guards.map((f, k) => mk(f, 'foe', 'opponent', k + 1, false)),
      ];
      const r = runInstantBout(specs, { escalateStartSec: R.escalateStartSec });
      strike.clearAllDiceCharges();
      const alive = (id) => r.units.filter((u) => u.sideId === id && !u.dead && u.hp > 0).length;
      recs.push({
        winner: r.winner, sec: r.sec, capped: r.capped,
        playerAlive: alive('player'), foeAlive: alive('foe'),
        playerHpPct: r.units.filter((u) => u.sideId === 'player').reduce((a, u) => a + u.hp, 0) / 4,
        bossCore: raid.boss.coreId, playerCore: player.coreId,
        playerSurvived: r.units[0] && !r.units[0].dead && r.units[0].hp > 0,
      });
    }
    runs.push({ lit, recs });
    progress(`raid lit=${lit}`);
  }
  const rows = runs.map(({ lit, recs }) => {
    const secs = recs.map((r) => r.sec);
    const wins = recs.filter((r) => r.winner === 'player').length;
    const won = recs.filter((r) => r.winner === 'player');
    const lost = recs.filter((r) => r.winner !== 'player');
    return [
      `${lit} (у игрока и союзников)`, `${wins}/${recs.length}`, f0((100 * wins) / recs.length) + '%',
      f1(median(secs)), f1(quantile(secs, 0.1)), f1(quantile(secs, 0.9)), f1(Math.max(...secs)),
      String(recs.filter((r) => r.capped).length), String(recs.filter((r) => r.sec > 100).length),
      f1(mean(recs.map((r) => r.playerAlive))) + ' из 4',
      won.length ? f1(mean(won.map((r) => r.playerAlive))) : '—',
      lost.length ? f1(mean(lost.map((r) => r.foeAlive))) + ' из 3' : '—',
      `${recs.filter((r) => r.playerSurvived).length}/${recs.length}`,
    ];
  });
  const dist = runs.map(({ lit, recs }) => `граней ${lit}: доживших на стороне игрока (0..4) = ` + [0, 1, 2, 3, 4].map((k) => `${k}:${recs.filter((r) => r.playerAlive === k).length}`).join(' '));
  const text = [
    `Рейд: игрок + ${R.allies} союзника против босса (живучесть ×${R.bossDurability}, надбавка силы ${R.bossPowerBonus}) + ${R.guards} охраны. Порог накала рейда ${R.escalateStartSec} с. Зёрна 1..${RAID_SEEDS}, состав и ядра берутся из seeded composeRaid.`,
    '', md(['граней', 'победы игрока', 'винрейт', 'мед. с', 'p10 с', 'p90 с', 'макс. с', 'таймаут 240 с', 'дольше 100 с', 'ср. доживает у игрока', '…в выигранных', 'ср. доживает у босса в проигранных', 'сам боец игрока жив'], rows),
    '', ...dist.map((d) => '- ' + d),
  ].join('\n');
  emit('raid', text, runs);
}

// ── РАЗДЕЛ axes: чувствительность боя к каждой оси ──────────────────────────
// Где ось «насыщена»: сдвиг оси на ±D от стартового профиля ядра НЕ меняет бой
// (бит в бит) — значит либо зажим 0..100, либо порог внутри тела. Замеряется без
// чтения защищённого кода: 8 осей × 4 ядра × 4 сдвига × 20 зёрен, зеркало.
function sectionAxes() {
  const N = 20;
  const rows = [], json = [];
  for (const core of CORE_IDS) {
    const base = [];
    for (let s = 1; s <= N; s++) { const r = duel({ seed: s, coreA: core, coreB: core, swap: s % 2 === 0 }); base.push(`${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}`); }
    for (const ax of AXIS_IDS) {
      const start = CORE_PROFILES[core][ax];
      const cellTxt = [];
      for (const d of [-20, -10, 10, 20]) {
        const val = Math.max(0, Math.min(100, start + d));
        if (val === start) { cellTxt.push('—'); continue; }
        let diff = 0;
        for (let s = 1; s <= N; s++) {
          const beh = resolveBehavior(core, []); beh.axes[ax] = val;
          const r = duel({ seed: s, coreA: core, coreB: core, behA: beh, swap: s % 2 === 0 });
          if (`${r.winner}|${r.sec.toFixed(5)}|${r.winHp01.toFixed(8)}` !== base[s - 1]) diff += 1;
        }
        cellTxt.push(`${diff}/${N}`);
        json.push({ core, axis: ax, start, delta: d, changed: diff, n: N });
      }
      rows.push([CORE_NAME[core], ax, String(start), ...cellTxt]);
    }
    progress(`axes ${core}`);
  }
  const text = [
    `Ось сдвигается на −20/−10/+10/+20 от стартового значения ядра (с зажимом 0..100; «—» = ось уже на границе); мерится, в скольких из ${N} зеркальных боёв исход отличается от нулевого БИТ В БИТ. 0/${N} — бой к сдвигу нечувствителен.`,
    '', md(['ядро', 'ось', 'старт', '−20', '−10', '+10', '+20'], rows),
  ].join('\n');
  emit('axes', text, json);
}

// ── РАЗДЕЛ inventory: где живут числа (п.1) ─────────────────────────────────
// Плоский разбор всех числовых ключей файлов баланса: «параметр → файл → ключ →
// значение», значения читаются из живых модулей, а не переписаны руками.
function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') out.push([key, v]);
    else if (Array.isArray(v)) out.push([key, JSON.stringify(v)]);
    else if (v && typeof v === 'object') flatten(v, key, out);
  }
  return out;
}
async function sectionInventory() {
  const mods = [
    ['src/data/combatBalance.js', 'COMBAT_BALANCE', COMBAT_BALANCE],
    ['src/data/buffBalance.js', 'BUFF_BALANCE', BUFF_BALANCE],
    ['src/data/klichBalance.js', 'KLICH_BALANCE', KLICH_BALANCE],
    ['src/data/commandBalance.js', 'COMMAND_BALANCE', (await load('/src/data/commandBalance.js')).COMMAND_BALANCE],
    ['src/data/behavior.js', 'CORE_PROFILES', CORE_PROFILES],
    ['src/data/intentions.js', 'INTENTION_PROFILES', (await load('/src/data/intentions.js')).INTENTION_PROFILES],
  ];
  const lines = ['| файл | ключ | значение |', '| --- | --- | --- |'];
  let n = 0;
  for (const [file, name, obj] of mods) for (const [k, v] of flatten(obj, name, [])) { lines.push(`| ${file} | \`${k}\` | ${String(v).replace(/\|/g, '\\|')} |`); n += 1; }
  emit('inventory_full', `Плоский список ${n} ключей (все числа боя, баффов, клича, командования, стартовых профилей ядер, профилей намерений). Значения прочитаны из живых модулей.\n\n` + lines.join('\n'), undefined);
}

// ── РАЗДЕЛ metrics: измеренные (не прочитанные) метрики бойца ────────────────
// Скорость атаки, скорость хода и рабочая дистанция живут в защищённом
// buildFighter.js, который по условиям работы не открывался. Поэтому они здесь
// ИЗМЕРЕНЫ на ходу боя: onStep смотрит на тела, не вмешиваясь.
function sectionMetrics() {
  const rows = [], perCore = {};
  for (const core of CORE_IDS) {
    const acc = { atk: 0, alive: 0, dist: 0, moveT: 0, gapSum: 0, gapN: 0, dmgOut: 0, hits: 0 };
    for (const foeCore of CORE_IDS) for (let seed = 1; seed <= 20; seed++) {
      const prev = new Map(); const phase = new Map();
      let last = null;
      duel({
        seed, coreA: core, coreB: foeCore,
        onStep: (now, alive) => {
          const me = alive.find((u) => u.sideId === 'player'); const foe = alive.find((u) => u.sideId === 'foe');
          if (!me) return;
          const p = me.f.group.position;
          const q = prev.get(me);
          if (q) { const d = Math.hypot(p.x - q.x, p.z - q.z); acc.dist += d; if (d / INSTANT_DT > 0.15) acc.moveT += INSTANT_DT; }
          prev.set(me, { x: p.x, z: p.z });
          const ph = me.f.getActionPhase();
          if ((ph === 'windup' || ph === 'commit') && !(phase.get(me) === 'windup' || phase.get(me) === 'commit')) acc.atk += 1;
          phase.set(me, ph);
          acc.alive += INSTANT_DT;
          if (foe) {
            acc.gapSum += me.f.group.position.distanceTo(foe.f.group.position); acc.gapN += 1;
            const hp = foe.f.getHp();
            if (last != null && hp < last) { acc.dmgOut += last - hp; acc.hits += 1; }
            last = hp;
          }
        },
      });
    }
    perCore[core] = acc;
    rows.push([CORE_NAME[core], f1(acc.atk / acc.alive), f1(acc.dist / acc.alive), f1(acc.dist / Math.max(acc.moveT, 1e-9)), f1(acc.gapSum / acc.gapN), f1(acc.dmgOut / acc.hits), f1(acc.hits / acc.alive)]);
    progress(`metrics ${core}`);
  }
  // Оси → mobility (единственное, что видно снаружи).
  const wrows = [0, 25, 50, 75, 100].map((w) => {
    const beh = resolveBehavior('skala', []); beh.axes.weight = w;
    const f = buildFighter('#FF0069', { coreId: 'skala', behavior: beh, brain: 'spinal', portrait: [] });
    const st = f.stats; try { f.dispose(); } catch (_) { /* ok */ }
    return [String(w), String(st.mobility), String(st.strikePower)];
  });
  const cr = CORE_IDS.map((c) => { const st = fighterStats(c, []).stats; return [CORE_NAME[c], String(st.maxHp), String(st.strikePower), String(st.toughness), String(st.mobility), String(st.accuracy), String(st.blockMitigation), String(st.blockPenetration), String(st.chargeMax), String(st.chargeGainPerSec)]; });
  const text = [
    '**Стартовые читаемые характеристики (`buildFighter().stats`, без кристаллов):**', '',
    md(['ядро', 'HP', 'strikePower', 'toughness', 'mobility', 'accuracy', 'blockMitigation', 'blockPenetration', 'chargeMax', 'chargeGain/с'], cr),
    '', '**Ось weight → mobility (замер, ядро BULWARK, остальные оси стартовые):**', '', md(['weight', 'mobility', 'strikePower'], wrows),
    '', `**Измерено в бою** (каждое ядро против каждого из четырёх, по 20 зёрен = 80 боёв; время — пока боец жив):`, '',
    md(['ядро', 'начатых атак/с', 'средняя скорость, ед./с (за всё время)', 'скорость на ходу, ед./с (пока движется >0.15)', 'средняя дистанция до цели', 'средний урон за попадание (HP)', 'попаданий/с (нанесённых)'], rows),
  ].join('\n');
  emit('metrics', text, { perCore });
}

// ── запуск ──────────────────────────────────────────────────────────────────
const want = new Set(process.argv.slice(2));
const all = want.size === 0 || want.has('all');
const secs = { axes: sectionAxes, inventory: sectionInventory, metrics: sectionMetrics, det: sectionDet, cores: sectionCores, bias: sectionBias, table: sectionTable, effect: sectionEffect, levers: sectionLevers, raid: sectionRaid };
for (const [k, fn] of Object.entries(secs)) if (all || want.has(k)) { const t0 = Date.now(); await fn(); progress(`[${k}] ${(Date.now() - t0) / 1000}s`); }
await server.close();
