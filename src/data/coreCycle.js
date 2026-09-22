/* HEXLASH — КРУГ ЦВЕТОВ ВИТРИНЫ (21.09.2026).

   Листаешь лендинг или деку — фон перетекает из цвета в цвет: розовый бренда,
   потом четыре ядра игры по очереди, потом снова по кругу. Пролистал — увидел
   все четыре ядра, не читая ни строчки.

   ⚠️ Порядок задаётся ЗДЕСЬ и больше нигде. Дека живёт отдельной статической
   страницей и свой порядок держит сама, но берёт его отсюда же — через
   scripts/sync-core-figure.mjs. Если правите круг — прогоните скрипт.

   ⚠️ Цвета не объявляются: читаются из src/styles/tokens.css. Второе
   объявление цвета в проекте запрещено, даже если значения совпадают. */

import { coreHue, coreRgb } from './sceneTokens.js';

/* null — розовый бренда: у ядер розового нет, это цвет главного действия и
   экономики. На таком разделе фигура горит только центром. */
export const CORE_CYCLE = [null, 'natisk', 'nalet', 'skala', 'zasada'];

/** Какое ядро стоит на разделе с таким номером. */
export function coreAt(index) {
  const n = CORE_CYCLE.length;
  return CORE_CYCLE[((index % n) + n) % n];
}

/** Розовый бренда как три числа. Читается из файла токенов. */
export function brandRgb() {
  const raw = typeof document === 'undefined'
    ? ''
    : getComputedStyle(document.documentElement).getPropertyValue('--pink-rgb').trim();
  if (!raw) {
    throw new Error(
      '[hexlash] токен --pink-rgb не прочитался. Он объявлен в '
      + 'src/styles/tokens.css и должен приходить только оттуда. Запасное '
      + 'число здесь — это второе объявление цвета.',
    );
  }
  return raw.split(',').map((v) => Number(v.trim()));
}

/** Цвет раздела как три числа: розовый бренда либо цвет ядра. */
export function accentRgb(coreId) {
  if (!coreId) return brandRgb();
  return coreRgb(coreHue(coreId)).split(',').map((v) => Number(v.trim()));
}
