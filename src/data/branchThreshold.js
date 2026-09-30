/* HEXLASH — грани и теги (TZ_grani_tags_v1). Числа — combatBalance.grani (ЧЕРНОВЫЕ).

   СЛОВАРЬ ТЗ: ГРАНЬ = ветка (в коде `crystal`, id a/b/c), КРИСТАЛЛ = шаг ветки (в коде `face`, 1..5).

   ЧТО ЭТО. Раньше 26 тегов кристаллов (conditionals / effects) только хранились: ни один файл их не читал,
   а ветка в бою не существовала — боец видел лишь сумму сдвигов осей. Здесь два слоя, оба — «наклоны»
   выбора намерения (intentions.js прибавляет их к очкам намерений; оси и тело не трогаются):

     1. ТЕГ — зажжённый кристалл с тегом даёт наклон к намерению по условию ('close', 'far', 'foeOpen', …).
        Тег называет приём (рост урона вблизи, «казнь» и т.п.) — самих приёмов в бою НЕТ, здесь только их
        характер как склонность выбирать намерение. Настоящая механика тегов — отдельная работа по одному.
     2. ПОРОГ ВЕТКИ — `threshold` кристаллов ОДНОЙ ветки включают её резонанс: сильный наклон к родным
        намерениям ветки (BRANCH_HOME). Россыпь из трёх РАЗНЫХ веток порога не даёт — ради этого игрок
        выбирает ветку, а не берёт лучшее из трёх.

   Результат — список { i, w, when } в `behavior.leans` (resolveBehavior); боец кладёт его в `self.leans`. */
import { COMBAT_BALANCE } from './combatBalance.js';

const P = 'press', ST = 'strike', SG = 'sting', H = 'hold', BR = 'break', C = 'catch'; // = INTENTIONS.*

/* Условия тега (считает intentions.js): always · close (враг в радиусе удара) · far (враг заметно дальше
   желаемой дистанции) · foeOpen (враг открыт: восстановление/сбив) · foeSwing (враг замахивается/недавно
   бил) · charged (заряд хлёсткого удара ≥ 0.5) · НОВЫЕ (TZ_tags_semantics_v2): selfHpLow · foeHpLow ·
   selfWindLow · foeWindLow · longFight · foeQuiet (враг не бил дольше N с) · hpDropped (своё HP упало на N%
   за M с). Условия склеиваются через «&» — наклон включается, когда истинны все (perfect_trap: foeHpLow&foeQuiet). Условия «враг бил» (foeSwing) у BULWARK и AMBUSH мертвы по устройству — жёсткая потребность
   CATCH решает тик до очков, — поэтому у их веток BREAKER и TRAP теги на новом словаре. */

/* Тег → [намерение, условие, вершина?]. Черновые соответствия по смыслу тега (комментарии в upgradeData.js). */
export const TAG_LEANS = {
  // ONSLAUGHT
  close_damage_ramp: [ST, 'close'],
  overload_strike: [ST, 'foeHpLow', true],     // вершина RAM: добивает раненого (было: заряд ≥ 0.5 — почти не наступал)
  chase_strike: [P, 'longFight'],              // CHASE: гонит всё настойчивее с длиной боя (было: враг далеко — 4%)
  lockdown: [H, 'close', true],                // вершина CHASE: прижав вплотную — держит (было: PRESS вблизи, как шаг 2)
  hit_accel: [ST, 'longFight'],                // FRENZY: разгоняется с длиной боя (было: всегда)
  no_breather: [P, 'foeHpLow'],                // FRENZY: не даёт раненому врагу перевести дух (было: всегда)
  rampage: [ST, 'selfHpLow', true],            // вершина FRENZY: вразнос, когда прижали (было: всегда)
  // RAIDER
  clean_chain: [SG, 'always'],
  perfect_jab: [SG, 'foeQuiet', true],         // вершина JAB: свободные тычки по пассивному (было: враг далеко — 3%)
  rhythm_break: [BR, 'close'],
  feint_interrupt: [SG, 'foeSwing'],
  feint_combo: [ST, 'close', true],
  punish_exhausted: [ST, 'foeWindLow'],        // HUNT: карает выдохшегося (было: враг открыт)
  hunt_reply: [ST, 'foeSwing'],                // HUNT·4, бывший punish_aggression: атакующая ветка отвечает ударом, а не ловит
  lethal_entry: [P, 'foeHpLow', true],         // вершина HUNT: вход на добивание (было: враг далеко — 5%)
  // BULWARK
  dig_in: [H, 'close'],
  fortress: [H, 'selfHpLow', true],            // вершина BASTION: несокрушим, когда прижали (было: всегда)
  retaliate_ramp: [ST, 'hpDropped'],           // BREAKER: получил — отдаёт (было: CATCH по «враг бил» — мертво по устройству)
  counter_trap: [C, 'longFight', true],        // вершина BREAKER: стена, которая с длиной боя только крепнет
  pin: [H, 'close'],
  clinch: [P, 'close', true],
  // AMBUSH
  punish_aggression: [C, 'hpDropped'],         // TRAP·3: осталось CATCH; условие из нового словаря
  perfect_trap: [ST, 'foeHpLow&foeQuiet', true], // вершина TRAP: добивает переставшего сопротивляться — враг ранен И затих (было: просто «затих» — 68–72%, переодетое «всегда»)
  exhaust: [SG, 'longFight'],                  // SHADOW: изматывает с длиной боя (было: враг далеко — 5%)
  phantom: [BR, 'hpDropped', true],            // вершина SHADOW: уходит из-под удара после попадания
  vulnerable_strike: [ST, 'foeOpen'],
  execute: [ST, 'foeHpLow', true],             // вершина STING: казнь раненого (было: враг открыт, как шаг 3)
};

/* Резонанс ветки: [главное намерение, второстепенное|null]. Ключ: ядро → id ветки (a/b/c). */
export const BRANCH_HOME = {
  natisk: { a: [ST, P], b: [H, P], c: [ST, P] },   // RAM · CHASE · FRENZY (ядро и так давит в 99% тиков — PRESS главным был бы холостым: CHASE «пришивает» вплотную, FRENZY рубит сериями)
  nalet: { a: [SG, null], b: [SG, BR], c: [ST, SG] }, // JAB · FEINT · HUNT
  skala: { a: [H, C], b: [C, null], c: [H, P] },   // BASTION · BREAKER · VICE
  zasada: { a: [C, null], b: [BR, SG], c: [SG, C] }, // TRAP · SHADOW · STING
};

/** Список наклонов и число кристаллов по веткам для набора зажжённых кристаллов. Чистая функция. */
export function resolveLeans(coreId, litFacets) {
  const G = COMBAT_BALANCE.grani;
  const leans = [];
  const resonance = {};
  const count = {};
  for (const f of litFacets || []) {
    if (!f) continue;
    if (f.branch) count[f.branch] = (count[f.branch] || 0) + 1;
    for (const tag of [...(f.conditionals || []), ...(f.effects || [])]) {
      const t = TAG_LEANS[tag];
      if (t) leans.push({ i: t[0], w: t[2] ? G.vertexLean : G.tagLean, when: t[1], tag });
    }
  }
  for (const [b, n] of Object.entries(count)) {
    if (n < G.threshold) continue;
    const home = BRANCH_HOME[coreId] && BRANCH_HOME[coreId][b];
    if (!home) continue;
    resonance[b] = n;
    leans.push({ i: home[0], w: G.homeLean, when: 'always', tag: `branch:${b}` });
    if (home[1]) leans.push({ i: home[1], w: G.homeLeanMinor, when: 'always', tag: `branch:${b}` });
  }
  return { leans, resonance, count };
}
