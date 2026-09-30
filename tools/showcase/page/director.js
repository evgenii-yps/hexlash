// Режиссёрская камера. Ставится ПОСЛЕ готовности сцены (page.evaluate).
//
// Игру не правим: достаём состояние сцены из Vue (`__vueParentComponent.setupState`
// доступно под dev-сервером) и оборачиваем `renderer.render`. Перед настоящей
// отрисовкой выставляем нашу позу камеры, после — возвращаем сценическую.
// Так сцена (пролёты, покачивание, OrbitControls) не замечает вмешательства и не
// «подтягивает» камеру обратно.
(() => {
  window.__director = {
    install(cfg) {
      const find = () => {
        for (const c of document.querySelectorAll('canvas')) {
          let i = c.__vueParentComponent;
          for (let k = 0; k < 10 && i; k++) {
            const st = i.setupState;
            if (st && st.renderer && st.camera && st.scene) return st;
            i = i.parent;
          }
        }
        return null;
      };
      const st = find();
      if (!st) return { ok: false, err: 'setupState сцены не найден (нужен dev-сервер)' };
      const renderer = st.renderer, cam = st.camera;
      const orig = renderer.render.bind(renderer);
      const keys = cfg.keys;
      const ease = {
        linear: (u) => u,
        smooth: (u) => u * u * (3 - 2 * u),
        smoother: (u) => u * u * u * (u * (u * 6 - 15) + 10),
      };
      const lerp = (a, b, u) => a + (b - a) * u;
      const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
      function pose(f) {
        if (f <= keys[0].f) return keys[0];
        const last = keys[keys.length - 1];
        if (f >= last.f) return last;
        let i = 0; while (keys[i + 1].f < f) i++;
        const A = keys[i], B = keys[i + 1];
        const u = ease[B.ease || cfg.ease || 'smoother']((f - A.f) / (B.f - A.f));
        return { pos: lerp3(A.pos, B.pos, u), look: lerp3(A.look, B.look, u), roll: lerp(A.roll || 0, B.roll || 0, u), fov: lerp(A.fov ?? cam.fov, B.fov ?? cam.fov, u) };
      }
      const state = { on: false, f0: 0 };
      renderer.render = (scene, camera) => {
        if (!state.on || camera !== cam) return orig(scene, camera);
        const sp = cam.position.clone(), sq = cam.quaternion.clone(), sf = cam.fov;
        const p = pose(window.__vt.frame - state.f0);
        cam.position.set(p.pos[0], p.pos[1], p.pos[2]);
        cam.lookAt(p.look[0], p.look[1], p.look[2]);
        if (p.roll) cam.rotateZ(p.roll * Math.PI / 180);
        if (p.fov !== cam.fov) { cam.fov = p.fov; cam.updateProjectionMatrix(); }
        orig(scene, camera);
        cam.position.copy(sp); cam.quaternion.copy(sq);
        if (cam.fov !== sf) { cam.fov = sf; cam.updateProjectionMatrix(); }
      };
      window.__director.start = (f0) => { state.f0 = f0; state.on = true; };
      window.__director.stop = () => { state.on = false; };
      window.__director.info = () => ({ fov: cam.fov, pos: cam.position.toArray(), aspect: cam.aspect });
      return { ok: true, info: window.__director.info() };
    },
  };
})();
