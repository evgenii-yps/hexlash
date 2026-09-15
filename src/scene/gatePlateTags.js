// gatePlateTags.js — мост между островами режима в воротах (ArenaGateScene) и их
// подписями (ArenaGateView). Та же форма, что у modePlateTags.js: одна
// module-scoped reactive запись, в которую сцена ПИШЕТ каждый кадр, а вид ЧИТАЕТ.
// Так подпись остаётся чётким DOM-текстом, приклеенным к настоящему острову в 3D,
// и на это не тратится событие Vue на каждый кадр.
//
// ПОЧЕМУ СВОЙ ФАЙЛ, А НЕ ОБЩИЙ С ДОМОМ. modePlateTags знает ровно два ключа —
// `pve` и `pvp`, — и знает их поимённо, а не списком. Добавить в него ещё два
// значит завести файл, который обслуживает две разные двери и молча переживает
// обе; разойдутся они на первой же правке. В проекте это уже принятое решение:
// один предмет — один модуль (так живут мешок зала и мешок тренировки).
//
// x/y — экранные точки в CSS-пикселях канваса, куда встаёт ВЕРХ подписи.
// `visible` — false, пока остров за камерой или сцена ещё не показана.
// `hovered` — id подсвеченного острова (или null): подписи обязаны слушаться
// того же правила одного свечения, что и сами острова.
import { reactive } from 'vue';

export const gatePlateTags = reactive({
  duel:  { x: 0, y: 0, visible: false },
  squad: { x: 0, y: 0, visible: false },
  hovered: null,  // 'duel' | 'squad' | null
  // Остров, который сейчас дрожит после отказа. Вид смотрит сюда, чтобы
  // дрогнуть подписью заодно с островом: дрожит предмет целиком, а не его часть.
  refused: null,  // 'duel' | 'squad' | null
});

export function setGatePlateTag(id, x, y, visible) {
  const tag = gatePlateTags[id];
  if (!tag) return;
  tag.x = x;
  tag.y = y;
  tag.visible = visible;
}

export function setGatePlateHover(id) {
  gatePlateTags.hovered = id || null;
}

export function setGatePlateRefused(id) {
  gatePlateTags.refused = id || null;
}

/** Скрыть обе подписи (ушли со сцены), не трогая того, что ведёт сцена. */
export function clearGatePlateTags() {
  gatePlateTags.duel.visible = false;
  gatePlateTags.squad.visible = false;
  gatePlateTags.hovered = null;
  gatePlateTags.refused = null;
}
