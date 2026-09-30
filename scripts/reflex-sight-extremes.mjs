// reflex-sight-extremes.mjs — ПРОВЕРКА «ЖЁСТКИЕ НУЖДЫ НЕ ОТМЕНЕНЫ» (TZ_reflex_sees_character_v2).
// Чистая функция: боя нет. Искусственные крайние состояния × 5000 случайных осей + все 256 углов куба осей (0/1 по каждой из 8).
// Старое правило вписано сюда дословно (копия hardNeed до правки) — для сравнения.
// ЗАПУСК: node scripts/reflex-sight-extremes.mjs
import { hardNeed, INTENTIONS } from '../src/data/intentions.js';
import { COMBAT_BALANCE } from '../src/data/combatBalance.js';

const oldHardNeed = (self, foe, memory, fight) => {
  const a = self.ax01;
  const foeThreat = memory.some((e) => e.type === 'attack' && fight.t - e.t < 1.5);
  if (self.stamina01 < 0.22) return INTENTIONS.BREATHE;
  if (foeThreat && a.counter > 0.55 && foe.has && foe.dist < self.range + 0.8) return INTENTIONS.CATCH;
  if (self.charge01 >= 0.85 && foe.inStrike) return INTENTIONS.STRIKE;
  return null;
};
const AX = ['distance', 'initiative', 'tempo', 'weight', 'stick', 'resilience', 'counter', 'slip'];
let seed = 12345; const rnd = () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const axes = [];
for (let i = 0; i < 5000; i++) axes.push(Object.fromEntries(AX.map((k) => [k, rnd()])));
for (let m = 0; m < 256; m++) axes.push(Object.fromEntries(AX.map((k, j) => [k, (m >> j) & 1])));

const NEUTRAL = { hp01: 1, charge01: 0, blocking: false, staggered: false, range: 1.6, current: 'hold' };
const mk = (a, o = {}) => ({ ...NEUTRAL, ax01: a, stamina01: 1, ...o });
const FAR = { has: true, dist: 4, inStrike: false, reacting: false, phase: 'neutral' };
const NEAR = { has: true, dist: 1.0, inStrike: true, reacting: false, phase: 'neutral' };
const SWING = [{ type: 'attack', t: 9.5 }];
const FIGHT = { t: 10, escalation01: 0, elapsed: 10 };
if (process.env.BEND != null) COMBAT_BALANCE.hardNeed.bend = Number(process.env.BEND); // проверить и при другой силе изгиба
const K = COMBAT_BALANCE.hardNeed.bend;
const rows = [];
const check = (name, ok, extra = '') => rows.push(`| ${name} | ${ok ? '✅' : '❌'} | ${extra} |`);
const all = (f) => axes.every(f);
const dist = (f) => { const d = {}; for (const a of axes) { const r = f(a); d[r] = (d[r] || 0) + 1; } return Object.entries(d).map(([k, v]) => `${k} ${(100 * v / axes.length).toFixed(0)}%`).join(', '); };

// E1 — кончился запас: любой характер дышит.
for (const st of [0, 0.05, 0.1]) check(`запас сил ${st}: BREATHE у любого характера`, all((a) => hardNeed(mk(a, { stamina01: st }), FAR, [], FIGHT) === INTENTIONS.BREATHE));
check(`запас сил ${st0(0.22 * (1 - K))} (нижняя граница порога при bend ${K}): BREATHE у любого`, all((a) => hardNeed(mk(a, { stamina01: 0.22 * (1 - K) - 1e-9 }), FAR, [], FIGHT) === INTENTIONS.BREATHE));
function st0(x) { return x.toFixed(3); }
check('запас сил 1.0: BREATHE не срабатывает ни у кого', all((a) => hardNeed(mk(a), FAR, [], FIGHT) !== INTENTIONS.BREATHE));
// E2 — живой замах на бойце с максимальным counter: нужда срабатывает и отвечает защитой.
const DEF = new Set([INTENTIONS.CATCH, INTENTIONS.BREAK, INTENTIONS.HOLD]);
check('замах + counter 1.0 + в зоне: нужда срабатывает, ответ ∈ {CATCH, BREAK, HOLD}', all((a) => DEF.has(hardNeed(mk({ ...a, counter: 1 }), NEAR, SWING, FIGHT))), dist((a) => hardNeed(mk({ ...a, counter: 1 }), NEAR, SWING, FIGHT)));
check('замах, но враг далеко (за range+0.8): нужда молчит', all((a) => !DEF.has(hardNeed(mk({ ...a, counter: 1 }), { ...FAR, dist: 3 }, SWING, FIGHT))));
check('нет замаха: ответ-нужда молчит', all((a) => !DEF.has(hardNeed(mk({ ...a, counter: 1 }), NEAR, [], FIGHT))));
// E3 — сходство со старым правилом там, где крайность несомненна.
check('запас < 0.1: результат тот же, что у старого правила', all((a) => hardNeed(mk(a, { stamina01: 0.05 }), FAR, SWING, FIGHT) === oldHardNeed(mk(a, { stamina01: 0.05 }), FAR, SWING, FIGHT)));
check('counter ≥ 0.75, замах, в зоне: срабатывает и старое, и новое', all((a) => { const s = mk({ ...a, counter: 0.75 + 0.25 * rnd() }); return oldHardNeed(s, NEAR, SWING, FIGHT) === INTENTIONS.CATCH && DEF.has(hardNeed(s, NEAR, SWING, FIGHT)); }));
// E4 — добивание.
check('заряд 1.0 + враг в досягаемости: STRIKE у любого характера', all((a) => hardNeed(mk(a, { charge01: 1 }), NEAR, [], FIGHT) === INTENTIONS.STRIKE));
check(`заряд ${(0.85 * (1 - K) - 0.01).toFixed(3)} (ниже самого низкого порога 0.85·(1−bend)): STRIKE не срабатывает ни у кого`, all((a) => hardNeed(mk(a, { charge01: 0.85 * (1 - K) - 0.01 }), NEAR, [], FIGHT) !== INTENTIONS.STRIKE));
// E5 — здоровье. В жёстких нуждах здоровья НЕТ ни до, ни после — фиксируем как факт.
check('HP 5% без других нужд: жёсткая нужда молчит, как и раньше', all((a) => hardNeed(mk(a, { hp01: 0.05 }), FAR, [], FIGHT) === oldHardNeed(mk(a, { hp01: 0.05 }), FAR, [], FIGHT)));
// E6 — приоритет: при пустом запасе он важнее замаха и заряда.
check('пустой запас + замах + заряд: BREATHE первым', all((a) => hardNeed(mk({ ...a, counter: 1 }, { stamina01: 0.02, charge01: 1 }), NEAR, SWING, FIGHT) === INTENTIONS.BREATHE));
// нейтральные оси: пороги прежние.
const N = Object.fromEntries(AX.map((k) => [k, 0.5]));
check('оси 0.5: запас 0.219 дышит, 0.221 — нет (порог 0.22 прежний)', hardNeed(mk(N, { stamina01: 0.219 }), FAR, [], FIGHT) === INTENTIONS.BREATHE && hardNeed(mk(N, { stamina01: 0.221 }), FAR, [], FIGHT) !== INTENTIONS.BREATHE);

console.log(`bend = ${K}; осей проверено: ${axes.length} (5000 случайных + 256 углов)\n`);
console.log('| проверка | итог | распределение / заметка |\n| --- | --- | --- |');
console.log(rows.join('\n'));
process.exit(rows.some((r) => r.includes('❌')) ? 1 : 0);
