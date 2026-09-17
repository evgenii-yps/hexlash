// gatePlateTags.js — мост между островами в воротах (ArenaGateScene) и их
// подписями (ArenaGateView). Та же форма, что у modePlateTags.js: одна
// module-scoped reactive запись, в которую сцена ПИШЕТ каждый кадр, а вид ЧИТАЕТ.
// Так подпись остаётся чётким DOM-текстом, приклеенным к настоящему острову в 3D,
// и на это не тратится событие Vue на каждый кадр.
//
// КЛЮЧИ ЗДЕСЬ НЕ ПЕРЕЧИСЛЕНЫ, И ЭТО ГЛАВНОЕ ОТЛИЧИЕ ОТ ДОМА. modePlateTags знает
// ровно два ключа поимённо — `pve` и `pvp`, — потому что дверей в доме ровно две
// и других не будет. В воротах острова МЕНЯЮТСЯ: сначала режимы, потом бойцы, а
// бойцов столько, сколько их у игрока, и зовут их случайными идентификаторами.
// Первая сборка этого файла была скопирована с домашней, с двумя зашитыми
// ключами, — и молча выбрасывала все подписи бойцов: `tags[id]` для чужого ключа
// возвращал ничего, и запись просто не происходила. Отсюда `items` как обычный
// словарь, который заполняется на ходу.
//
// x/y — экранные точки в CSS-пикселях канваса, куда встаёт ВЕРХ подписи.
// `visible` — false, пока остров за камерой или сцена ещё не показана.
// `hovered` — id подсвеченного острова (или null): подписи обязаны слушаться
// того же правила одного свечения, что и сами острова.
import { reactive } from 'vue';

export const gatePlateTags = reactive({
  /** @type {Record<string, {x:number, y:number, visible:boolean}>} */
  items: {},
  hovered: null,
  // Остров, который сейчас дрожит после отказа. Вид смотрит сюда, чтобы
  // дрогнуть подписью заодно с островом: дрожит предмет целиком, а не его часть.
  refused: null,
  // Надпись FIGHT на объёмной кнопке старта. Отдельным полем, а не ключом в
  // `items`: вид проходит по `items` списком островов, и запись с чужим ключом
  // там либо не отрисовалась бы вовсе, либо попала бы в список выбора. Кнопка —
  // не остров, и место у неё своё.
  fight: { x: 0, y: 0, visible: false, refused: false },
});

export function setGatePlateTag(id, x, y, visible) {
  if (!id) return;
  const tag = gatePlateTags.items[id];
  if (tag) { tag.x = x; tag.y = y; tag.visible = visible; return; }
  // Новый остров — заводим запись. Присваивание в reactive-объект видно виду:
  // Vue 3 следит за добавлением ключей, и отдельного «зарегистрируй» не нужно.
  gatePlateTags.items[id] = { x, y, visible };
}

export function setGatePlateHover(id) {
  gatePlateTags.hovered = id || null;
}

export function setGatePlateRefused(id) {
  gatePlateTags.refused = id || null;
}

/** Место надписи FIGHT — сцена пишет каждый кадр, пока кнопка стоит. */
export function setGateFightTag(x, y, visible) {
  const f = gatePlateTags.fight;
  f.x = x; f.y = y; f.visible = visible;
}

/** Кнопка дрогнула отказом — подпись обязана дрогнуть вместе с ней. */
export function setGateFightRefused(on) {
  gatePlateTags.fight.refused = !!on;
}

/**
 * Забыть острова, которых больше нет. Зовётся при смене шага: старые ключи
 * иначе копились бы за сеанс, а вид, читая их по имени, не заметил бы разницы —
 * то есть беда была бы тихой.
 */
export function clearGatePlateTags() {
  gatePlateTags.items = {};
  gatePlateTags.hovered = null;
  gatePlateTags.refused = null;
  gatePlateTags.fight = { x: 0, y: 0, visible: false, refused: false };
}
