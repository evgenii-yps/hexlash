// homeFighterTag.js — a tiny module-scoped reactive bridge between the home 3D
// scene and the home 2D layer (the same sibling-state pattern the v2 scenes use
// for hover/click hints).
//
// HomeScene (3D) each frame projects the point above EACH standing fighter's head to
// screen pixels and computes a hysteresis "near" flag from the camera zoom distance,
// then writes the list here. HomeView (2D) reads it to anchor one label per fighter:
// the state word (FREE / TRAINING / READY) always, and the identity card on zoom-in.
// The label text is sharp DOM, not a 3D sprite — this only carries screen positions
// and show flags.
//
// Раньше метка была одна — над единственным бойцом. Теперь по одной на каждого из
// стоящих на острове (до шести), и идут они списком, а не полями: сколько тел, столько
// меток, и пустые места в список не попадают.
import { reactive } from 'vue';

/** items: [{ id, x, y, near, shown }] — по одному на стоящее тело, в порядке мест. */
export const homeFighterTags = reactive({ items: [] });

/**
 * Записать позиции. `list` — обычный массив записей; целые пиксели — чтобы на
 * покоящейся сцене реактивность не дёргалась каждый кадр из-за долей пикселя.
 */
export function setHomeFighterTags(list) {
  const items = homeFighterTags.items;
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    const x = Math.round(n.x);
    const y = Math.round(n.y);
    const cur = items[i];
    if (!cur) { items.push({ id: n.id, x, y, near: n.near, shown: n.shown }); continue; }
    if (cur.id !== n.id) cur.id = n.id;
    if (cur.x !== x) cur.x = x;
    if (cur.y !== y) cur.y = y;
    if (cur.near !== n.near) cur.near = n.near;
    if (cur.shown !== n.shown) cur.shown = n.shown;
  }
  if (items.length > list.length) items.length = list.length;
}

/** Снять все метки (сцена размонтирована или ушла со стадии дома). */
export function clearHomeFighterTags() {
  if (homeFighterTags.items.length) homeFighterTags.items.length = 0;
}
