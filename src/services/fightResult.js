// fightResult.js — ИТОГ БОЯ. Выиграл игрок или проиграл, и что делать дальше.
//
// ЗАЧЕМ ЭТО ВООБЩЕ. До этой работы арена не сообщала исход НИКАК: бой замирал, и
// всё. Без служебного режима на экране не оставалось ни одной кнопки — ни начать
// заново, ни уйти; единственной дверью была кнопка «назад» браузера. На поле из
// шести тел даже понять, чья сторона выстояла, было нельзя.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Про итог знают двое: арена (она одна знает, чем бой
// кончился) и панель (она одна знает, как об этом сказать). Держать это внутри
// арены значило бы, что панель лезет в защищённую сцену за исходом.
//
// ЗАБЕГ СЮДА НЕ ХОДИТ. У CHAIN свои панели и свой счёт раундов: победа в раунде
// там означает не «бой выигран», а «идём дальше». Арена включает этот итог
// только вне забега — см. её же endFight.
//
// Экспортирует: fightResultState, showFightResult, hideFightResult, bindFightAgain.
import { reactive } from 'vue';

/**
 * Что показывает панель итога.
 *   visible — панель на экране
 *   outcome — 'victory' сторона игрока выстояла · 'defeat' пала
 */
export const fightResultState = reactive({
  visible: false,
  outcome: null,
});

// Кто умеет начать новый бой. Ставит арена (только она это умеет), зовёт панель.
// Живёт здесь, а не в панели: панель не должна знать про сцену, а сцена — про
// кнопки. Снимается при уходе с арены, иначе следующая панель дёрнула бы
// разобранную сцену.
let fightAgain = null;

/** Арена отдаёт способ начать новый бой. Вернуть — снять. */
export function bindFightAgain(fn) {
  fightAgain = typeof fn === 'function' ? fn : null;
  return () => { if (fightAgain === fn) fightAgain = null; };
}

/** Показать итог. `won` — выстояла ли сторона игрока. */
export function showFightResult(won) {
  fightResultState.outcome = won ? 'victory' : 'defeat';
  fightResultState.visible = true;
}

/** Убрать панель. */
export function hideFightResult() {
  fightResultState.visible = false;
  fightResultState.outcome = null;
}

/**
 * Игрок нажал «драться снова». Панель уходит, арена собирает новый бой.
 *
 * ⚠️ Двойное нажатие: панель гасится ПЕРВОЙ строкой, и второе нажатие приходит
 *    уже к невидимой кнопке. Плюс сюда же — проверка на visible: без неё второе
 *    нажатие в тот же кадр, до перерисовки, запустило бы второй бой.
 */
export function fightAgainNow() {
  if (!fightResultState.visible) return false;
  hideFightResult();
  if (fightAgain) fightAgain();
  return true;
}
