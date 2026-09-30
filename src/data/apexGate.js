/* HEXLASH — ВЕРШИНА ЗАКРЫТА, ПОКА НЕ ЗАЖЖЕНЫ ЧЕТЫРЕ НИЖНИХ (TZ_apex_gate_v1).

   СЛОВАРЬ ТЗ: ГРАНЬ = ветка (в коде `crystal`, id a/b/c), КРИСТАЛЛ = шаг ветки
   (в коде `face`, 1..5). Вершина — пятый кристалл грани.

   ПРАВИЛО. Пятый кристалл грани недоступен, пока в ТОЙ ЖЕ грани не горят
   кристаллы 1–4. Один файл — одно определение, и его зовут все, кто собирает
   набор: хранилище бойца, окно SPAR, сборщик деревьев, сборка соперника и сам
   разрешатель характера. Поэтому нарушающий набор нельзя собрать нигде, а если
   он всё же пришёл со стороны (старое сохранение), вершина молча отбрасывается.

   ⚠️ ПРАВИЛО СТОИТ НА СЧЁТЕ КРИСТАЛЛОВ, А НЕ НА ИХ НОМЕРАХ В ИНТЕРФЕЙСЕ. */

/** Номер вершины в грани (face.id). */
export const APEX_FACE = 5;

/** Сколько кристаллов ниже вершины должно гореть. */
export const APEX_NEEDS = APEX_FACE - 1;

/**
 * Открыта ли вершина в грани: горят ли все нижние.
 * @param {Iterable<number>|number[]} litFaceIds номера горящих кристаллов ЭТОЙ грани
 */
export function apexOpen(litFaceIds) {
  const set = new Set(litFaceIds || []);
  for (let i = 1; i < APEX_FACE; i++) if (!set.has(i)) return false;
  return true;
}

/** Открыта ли вершина у грани рабочего дерева (`{ faces: [{id, state}] }`). */
export function apexOpenInBranch(branch) {
  if (!branch || !branch.faces) return false;
  return apexOpen(branch.faces.filter((f) => f.state === 'lit').map((f) => f.id));
}

/**
 * Список горящих кристаллов (объекты с `.branch` и `.id`) без запрещённых
 * вершин. Порядок остальных сохраняется. Грани без вершины в списке не трогает.
 */
export function withoutClosedApex(facets) {
  const byBranch = {};
  for (const f of facets || []) {
    if (!f) continue;
    (byBranch[f.branch] = byBranch[f.branch] || []).push(f.id);
  }
  return (facets || []).filter((f) => {
    if (!f || f.id !== APEX_FACE) return true;
    return apexOpen(byBranch[f.branch]);
  });
}
