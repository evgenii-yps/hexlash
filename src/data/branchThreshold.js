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
  guard_crush: [ST, 'foeGuard', false, 0.12],   // a2
  unshaken: [H, 'foeSwing', false, 0.27],   // a3
  close_damage_ramp: [ST, 'close', false, 0.05],   // a4
  overload_strike: [ST, 'foeHpLow', true, 0.45],   // a5
  hard_entry: [ST, 'always', false, 0.05],   // b1
  chase_strike: [ST, 'foeQuiet', false, 0.14],   // b2
  cut_off: [H, 'close', false, 0.27],   // b3
  cling: [H, 'close', false, 0.45],   // b4
  lockdown: [H, 'close', true, 0.27],   // b5
  long_combo: [ST, 'close', false, 0.05],   // c1
  no_pause: [ST, 'foeOpen', false, 0.09],   // c2
  hit_accel: [ST, 'longFight', false, 0.09],   // c3
  no_breather: [ST, 'foeQuiet', false, 0.14],   // c4
  rampage: [ST, 'always', true, 0.3],   // c5
  // RAIDER
  quick_out: [BR, 'close', false, 0.15],   // a1
  pinpoint_entry: [P, 'foeQuiet', false, 0.18],   // a2
  clean_chain: [SG, 'always', false, 0.10],   // a4
  perfect_jab: [SG, 'foeQuiet', true, 0.45],   // a5
  fake_in: [BR, 'foeSwing', false, 0.15],   // b1
  punish_reaction: [P, 'foeGuard', false, 0.18],   // b2
  rhythm_break: [BR, 'close', false, 0.15],   // b3
  feint_interrupt: [SG, 'foeSwing', false, 0.18],   // b4
  feint_combo: [ST, 'close', true, 0.45],   // b5
  read_tell: [C, 'foeSwing', false, 0.31],   // c1
  punish_exhausted: [P, 'foeOpen', false, 0.18],   // c2
  charged_run: [SG, 'always', false, 0.10],   // c3
  hunt_reply: [ST, 'foeSwing', false, 0.45],   // c4
  lethal_entry: [P, 'charged', true, 0.45],   // c5
  // BULWARK
  tough_hide: [H, 'close', false, 0.25],   // a1
  steady_guard: [H, 'foeSwing', false, 0.31],   // a2
  catch_breath: [H, 'foeQuiet', false, 0.27],   // a3
  dig_in: [H, 'close', false, 0.25],   // a4
  fortress: [H, 'always', true, 0.15],   // a5
  riposte: [P, 'foeSwing', false, 0.19],   // b1
  catch_punish: [P, 'foeOpen', false, 0.45],   // b2
  hard_meet: [P, 'close', false, 0.17],   // b3
  retaliate_ramp: [ST, 'foeSwing', false, 0.45],   // b4
  counter_trap: [C, 'longFight', true, 0.45],   // b5
  body_shove: [P, 'close', false, 0.17],   // c1
  heavy_slam: [ST, 'close', false, 0.26],   // c2
  no_way_around: [H, 'foeGuard', false, 0.45],   // c3
  pin: [H, 'close', false, 0.25],   // c4
  clinch: [P, 'close', true, 0.17],   // c5
  // AMBUSH
  hard_counter: [ST, 'foeSwing', false, 0.45],   // a1
  slip_counter: [ST, 'foeQuiet', false, 0.45],   // a2
  punish_aggression: [ST, 'foeSwing', false, 0.45],   // a3
  punish_whiff: [ST, 'foeOpen', false, 0.6],   // a4
  perfect_trap: [ST, 'foeQuiet', true, 0.45],   // a5
  long_slip: [SG, 'foeSwing', false, 0.45],   // b1
  hard_to_reach: [SG, 'longFight', false, 0.40],   // b2
  exhaust: [SG, 'longFight', false, 0.40],   // b3
  open_window: [ST, 'foeOpen', false, 0.45],   // b4
  phantom: [SG, 'hpDropped', true, 0.45],   // b5
  loaded_hit: [ST, 'charged', false, 0.45],   // c1
  long_charge: [SG, 'charged', false, 0.3],   // c2
  vulnerable_strike: [ST, 'foeOpen', false, 0.45],   // c3
  pierce: [ST, 'foeGuard', false, 0.45],   // c4
  execute: [ST, 'close', true, 0.35],   // c5
};

/* Резонанс ветки: [главное намерение, второстепенное|null]. Ключ: ядро → id ветки (a/b/c). */
export const BRANCH_HOME = {
  natisk: { a: [ST, P], b: [P, ST], c: [ST, P] },   // RAM · CHASE · FRENZY (ядро и так давит в 99% тиков — PRESS главным был бы холостым: CHASE «пришивает» вплотную, FRENZY рубит сериями)
  nalet: { a: [SG, null], b: [SG, P], c: [ST, SG] }, // JAB · FEINT · HUNT
  skala: { a: [C, H], b: [C, null], c: [P, H] },   // BASTION · BREAKER · VICE
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
      if (t) leans.push({ i: t[0], w: t[3] != null ? t[3] : t[2] ? G.vertexLean : G.tagLean, when: t[1], tag });
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
