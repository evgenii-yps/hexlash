// Мир для плана: что лежит в «сейфе» вкладки ДО загрузки игры.
//
// Игровой сейф игрока — sessionStorage одной вкладки. Рендер идёт в одноразовом
// контексте браузера, поэтому настоящий прогресс никого не затрагивается: запись
// рождается вместе с вкладкой и умирает с ней.
//
// world = {
//   roster: [{ callsign, core, id?, ready?, lit?, lesson? }],   lesson — секунд занятия (идёт грушей), ≤ 55
//   squad: [индексы в roster], mode: 'duel'|'squad', n,
//   legend: { callsign, core }                                  легенда (восхождение не нужно)
// }
const BASE_DATE = 1_700_000_000_000;   // то же, что в page/clock.js

export function buildSave(world = {}) {
  const roster = (world.roster || []).map((f, i) => {
    const row = { id: f.id || 'f' + i, callsign: f.callsign || 'F' + i, core: f.core, createdAt: 1000 + i, lit: f.lit || {} };
    if (f.ready) row.rdy = true;
    // Игра отбрасывает срок занятия дальше 60 с вперёд, поэтому не больше 55.
    if (f.lesson) row.tr = BASE_DATE + Math.min(55, f.lesson) * 1000;
    return row;
  });
  const save = { v: 1, roster: { fighters: roster, seeded: true } };
  if (world.picked !== undefined) save.roster.picked = roster[world.picked]?.id;
  if (world.legend) save.roster.lg = { id: world.legend.id || 'lg0', callsign: world.legend.callsign, core: world.legend.core, at: 1 };
  const squad = (world.squad || []).map((i) => roster[i].id);
  save.prefight = { core: world.core || roster[0]?.core || 'natisk', squad, mode: world.mode || 'duel', n: world.n || Math.max(1, squad.length) };
  save.buffs = { stock: { towel: 3, bucket: 3, dice: 3 }, kit: ['towel', 'bucket', 'dice'], gifted: true };
  return save;
}
