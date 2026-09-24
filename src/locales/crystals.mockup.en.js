/* HEXLASH — ОПИСАНИЯ КРИСТАЛЛОВ · ЗАГЛУШКИ
   (ТЗ 24.09.2026, правка пятая — исправление словаря).

   ⚠️ ЭТО ЗАГЛУШКИ, А НЕ ТЕКСТ ИГРЫ. Настоящих описаний в проекте нет — их
   ещё никто не писал. Здесь правдоподобные английские строки, чтобы макет
   можно было посмотреть глазами. Заменяются целиком, макет при этом не
   трогается.

   ⚠️ ИМЕНА КРИСТАЛЛОВ СЮДА НЕ КОПИРУЮТСЯ. Они приходят из
   src/data/upgradeData.js, где живут как игровые данные: там у каждой грани
   (RAM / CHASE / FRENZY) ровно пять шагов со своими именами — это и есть
   пятнадцать кристаллов. Вторая копия имён разошлась бы с первой при первой
   же правке.

   СЛОВАРЬ (исправлен 24.09.2026):
     грань    — весь луч целиком, длинный клин от сердца до кромки. Их три.
     кристалл — один из пяти шагов внутри грани. Их пятнадцать.

   ⚠️ НИ ОДНОЙ ЦИФРЫ. Ни процентов, ни уровней, ни порогов. Кристалл говорит,
   ЧТО меняется, а не насколько. Это правило постановки, а не стилистика. */

/** Описание по ключу «грань + номер шага»: a1 … a5, b1 … b5, c1 … c5. */
export const CRYSTAL_TEXT = {
  /* ── ГРАНЬ A · RAM — идёт напролом ──────────────────────────────── */
  a1: 'He stops floating and starts pressing. Every step lands where he put it.',
  a2: 'A raised guard stops being a wall. The blow arrives through it, not around it.',
  a3: 'A hit mid-swing no longer throws the strike off. He finishes what he started.',
  a4: 'The closer the fight gets, the harder he lands. He wants the tight room.',
  a5: 'The guard stops counting. He walks through it as if it were not raised.',

  /* ── ГРАНЬ B · CHASE — не отпускает ─────────────────────────────── */
  b1: 'He crosses the gap in one piece instead of walking it down.',
  b2: 'A retreating foe is followed, not watched. Backing off stops being a rest.',
  b3: 'He closes the ways out before the foe reaches for them.',
  b4: 'Shaking him off stops working. He goes where the foe goes.',
  b5: 'Disengaging stops being an option. The room shrinks to arm’s length and stays there.',

  /* ── ГРАНЬ C · FRENZY — не даёт вдохнуть ────────────────────────── */
  c1: 'Strings run longer before they break. The end of one feeds the start of the next.',
  c2: 'The gaps between attacks close up. There is less quiet to use.',
  c3: 'Each blow that lands makes the next one arrive sooner.',
  c4: 'The foe never gets the still moment he needs to recover.',
  c5: 'The pace stops having a ceiling. Once it climbs, nothing in him slows it down.',
};

/** Описание одного кристалла. Ключ — «грань + номер», например 'b3'. */
export function crystalText(key) {
  return CRYSTAL_TEXT[key] || '';
}
