// Помощники страницы: экранные координаты предметов сцены для нажатий мышью.
// Нажатия идут НАСТОЯЩЕЙ мышью (CDP), а координаты берём из состояния сцены — так
// игра видит то же, что увидела бы рука игрока: наведение, нажатие, отпускание.
(() => {
  const project = (st, obj, dy = 0) => {
    const V = st.camera.position.constructor;
    const v = new V(); obj.getWorldPosition(v); v.y += dy; v.project(st.camera);
    const r = st.canvasEl.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  };
  // ворота арены: 'plate' (остров режима или бойца по id) и 'fight' (объёмная кнопка)
  window.__gateTarget = (kind, id) => {
    const st = window.__findSceneState((s) => s.plates && s.fightBtn !== undefined && s.camera && s.canvasEl);
    if (!st) throw new Error('сцена ворот не найдена');
    if (kind === 'fight') return project(st, st.fightBtn.pick);
    return project(st, st.plates.plates[id].pick);
  };
  // сцена дома: нажатие по острову режима (ARENA = 'pvp') — через луч сцены нельзя,
  // поэтому для него нужен __homeTarget, см. plan (пока не используется)
})();
