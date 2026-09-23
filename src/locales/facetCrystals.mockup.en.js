/* HEXLASH — КРИСТАЛЛЫ ГРАНЕЙ · ЗАГЛУШКИ (ТЗ 24.09.2026, макет /dev/facets).

   ⚠️ ЭТО ЗАГЛУШКИ, А НЕ ТЕКСТ ИГРЫ. Настоящих описаний кристаллов в проекте
   нет — их ещё никто не писал. Здесь правдоподобные английские строки, чтобы
   макет можно было посмотреть глазами. Заменяются целиком, макет при этом не
   трогается.

   Файл лежит отдельно от src/locales/en.js СОЗНАТЕЛЬНО: en.js — словарь
   продукта, и мешать в него черновик под одну служебную страницу значит
   потом гадать, где настоящая строка, а где заглушка.

   СЛОВАРЬ (ТЗ 24.09.2026):
     ветка    — один из трёх клиньев фигуры «Печать»;
     грань    — один из пяти шагов внутри ветки, всего пятнадцать;
     кристалл — то, что грань даёт бойцу. У грани их может быть несколько.

   ⚠️ НИ ОДНОЙ ЦИФРЫ. Ни процентов, ни уровней, ни порогов. Кристалл говорит,
   ЧТО меняется, а не насколько. Это правило постановки, а не стилистика.

   ⚠️ Имена веток и граней сюда НЕ копируются: они приходят из
   src/data/upgradeData.js, где живут как игровые данные. Вторая копия имён
   разошлась бы с первой при первой же правке. */

/** Кристаллы по ключу «ветка + номер грани»: a1 … a5, b1 … b5, c1 … c5. */
export const FACET_CRYSTALS = {
  /* ── ВЕТКА A · RAM — идёт напролом ──────────────────────────────── */
  a1: [
    { name: 'Settled Weight', text: 'He stops floating and starts pressing. Every step lands where he put it.' },
    { name: 'Long Swing', text: 'The wind-up gets slower and the blow gets heavier. Everyone sees it coming, and it arrives anyway.' },
  ],
  a2: [
    { name: 'Guard Splitter', text: 'A raised guard stops being a wall. The blow arrives through it, not around it.' },
    { name: 'Dented Stance', text: 'A foe who blocks him is pushed back by the block itself.' },
    { name: 'Slow Burn', text: 'Damage that the guard eats does not vanish — it stays and tells later.' },
  ],
  a3: [
    { name: 'Rooted', text: 'A hit mid-swing no longer throws the strike off. He finishes what he started.' },
    { name: 'Deaf to Noise', text: 'Feints and half-steps stop moving him. He answers only to what is real.' },
  ],
  a4: [
    { name: 'Inside Work', text: 'The closer the fight gets, the harder he lands. He wants the tight room.' },
    { name: 'No Room Given', text: 'A foe trying to open the distance pays on the way out.' },
  ],
  a5: [
    { name: 'Breakthrough', text: 'The guard stops counting. He walks through it as if it were not raised.' },
    { name: 'Overload', text: 'One blow that arrives all at once instead of in parts.' },
    { name: 'Nothing Left', text: 'After it lands, neither of them is the same for a while.' },
  ],

  /* ── ВЕТКА B · CHASE — не отпускает ─────────────────────────────── */
  b1: [
    { name: 'Hard Entry', text: 'He crosses the gap in one piece instead of walking it down.' },
    { name: 'First Word', text: 'He tends to be the one who starts the exchange.' },
  ],
  b2: [
    { name: 'Run-Down', text: 'A retreating foe is followed, not watched. Backing off stops being a rest.' },
    { name: 'Second Wind', text: 'Chasing no longer costs him as much as it costs the one running.' },
  ],
  b3: [
    { name: 'Cut Angles', text: 'He closes the ways out before the foe reaches for them.' },
    { name: 'Short Leash', text: 'The fight stays at the distance he picked, not the one offered.' },
  ],
  b4: [
    { name: 'Cling', text: 'Shaking him off stops working. He goes where the foe goes.' },
    { name: 'Dead Weight', text: 'Every attempt to break away drags him along instead of losing him.' },
  ],
  b5: [
    { name: 'Lockdown', text: 'Disengaging stops being an option. The room shrinks to arm’s length and stays there.' },
    { name: 'Nowhere to Stand', text: 'The foe runs out of places to reset from.' },
  ],

  /* ── ВЕТКА C · FRENZY — не даёт вдохнуть ────────────────────────── */
  c1: [
    { name: 'Long Combo', text: 'Strings run longer before they break.' },
    { name: 'Carried Rhythm', text: 'The end of one exchange feeds the start of the next.' },
  ],
  c2: [
    { name: 'No Pause', text: 'The gaps between attacks close up. There is less quiet to use.' },
    { name: 'Standing Start', text: 'He does not need to gather himself before going again.' },
  ],
  c3: [
    { name: 'Building Momentum', text: 'Each blow that lands makes the next one arrive sooner.' },
    { name: 'Hot Hands', text: 'A good exchange leaves him faster than it found him.' },
  ],
  c4: [
    { name: 'No Breather', text: 'The foe never gets the still moment he needs to recover.' },
    { name: 'Crowding', text: 'Rest has to be taken under pressure or not at all.' },
  ],
  c5: [
    { name: 'Rampage', text: 'The pace stops having a ceiling. It only goes one way.' },
    { name: 'Runaway', text: 'Once it starts climbing, nothing in him slows it down.' },
    { name: 'Burned Through', text: 'Everything he has goes forward. There is no reserve kept back.' },
  ],
};

/** Кристаллы одной грани. Ключ — «ветка + номер», например 'b3'. */
export function crystalsOf(key) {
  return FACET_CRYSTALS[key] || [];
}
