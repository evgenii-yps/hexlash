// Режиссёрская камера. Ставится ПОСЛЕ готовности сцены (page.evaluate).
//
// Игру не правим: достаём состояние сцены из Vue (`__vueParentComponent.setupState`
// доступно под dev-сервером) и оборачиваем `renderer.render`. Перед настоящей
// отрисовкой выставляем нашу позу камеры, после — возвращаем сценическую.
// Так сцена (пролёты, покачивание, OrbitControls) не замечает вмешательства.
//
// Два вида камеры в одном сценарии (plan.camera):
//   kind:'keys'    — ключи по кадрам (позиция, точка взгляда, крен, угол обзора);
//   kind:'dynamic' — планы, привязанные к бойцам на плите (общий / рамка на всех /
//                    «через плечо»). Высчитываются в момент отрисовки из живого
//                    состояния сцены, поэтому кадрирование не ломается, если бой
//                    пошёл иначе, чем при подборе зерна.
// release:{at,blend} — с кадра `at` плавно отпускаем камеру обратно сцене (нужно,
// когда дальше едет собственный пролёт игры, например после нажатия FIGHT).
(() => {
  const ease = {
    linear: (u) => u,
    smooth: (u) => u * u * (3 - 2 * u),
    smoother: (u) => u * u * u * (u * (u * 6 - 15) + 10),
  };
  const lerp = (a, b, u) => a + (b - a) * u;
  const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const mix = (A, B, u) => ({ pos: lerp3(A.pos, B.pos, u), look: lerp3(A.look, B.look, u), roll: lerp(A.roll || 0, B.roll || 0, u), fov: lerp(A.fov, B.fov, u) });

  window.__findSceneState = (pred) => {
    for (const c of document.querySelectorAll('canvas')) {
      let i = c.__vueParentComponent;
      for (let k = 0; k < 10 && i; k++) {
        const st = i.setupState;
        if (st && pred(st)) return st;
        i = i.parent;
      }
    }
    return null;
  };

  window.__director = {
    install(cfg) {
      const st = window.__findSceneState((s) => s.renderer && s.camera && s.scene);
      if (!st) return { ok: false, err: 'setupState сцены не найден (нужен dev-сервер)' };
      const renderer = st.renderer, cam = st.camera;
      const orig = renderer.render.bind(renderer);
      const T = { on: false, f0: 0 };
      const actors = new Map();           // боец → { i, last:[x,y,z] }
      const lastPose = { v: null };

      // ── бойцы арены ──
      function sense() {
        const field = st.field;
        if (!field || !field.units) return [];
        const us = field.units();
        for (const u of us) {
          if (!actors.has(u.f)) actors.set(u.f, { i: actors.size, last: [0, 0.5, 0], u });
          const p = u.f.group.position; const a = actors.get(u.f);
          if (!u.dead) a.last = [p.x, p.y, p.z];
        }
        return [...actors.values()].map((a) => ({ i: a.i, pos: a.last, dead: !!a.u.dead, bot: !!a.u.isBot, side: a.u.sideId }));
      }
      const alive = (A) => { const l = A.filter((a) => !a.dead); return l.length ? l : A; };
      const hero = (A) => A.find((a) => !a.bot && !a.dead) || A.find((a) => !a.bot) || A[0];
      const nearestOther = (A, me) => { let best = null, bd = 1e9; for (const a of alive(A)) { if (a.i === me.i || a.side === me.side) continue; const d = Math.hypot(a.pos[0] - me.pos[0], a.pos[2] - me.pos[2]); if (d < bd) { bd = d; best = a; } } return best || A.find((a) => a.i !== me.i) || me; };

      // ── планы «динамической» камеры ──
      const SHOTS = {
        // весь ринг, медленный облёт
        wide(sh, f) {
          const a = (sh.a0 || 0) + (sh.da || 0) * f, r = sh.r || 9, h = sh.h || 5.5;
          return { pos: [r * Math.sin(a), h, r * Math.cos(a)], look: sh.look || [0, 0.8, 0], fov: sh.fov || 42 };
        },
        // рамка на всех живых: дальше расходятся — отъезжаем
        frame(sh, f, A) {
          const L = alive(A); let cx = 0, cz = 0;
          for (const a of L) { cx += a.pos[0]; cz += a.pos[2]; }
          cx /= L.length; cz /= L.length;
          let spread = 0; for (const a of L) spread = Math.max(spread, Math.hypot(a.pos[0] - cx, a.pos[2] - cz));
          const ang = (sh.a0 || 0) + (sh.da || 0) * f, r = (sh.r || 3.4) + spread * (sh.k || 1.3);
          return { pos: [cx + r * Math.sin(ang), sh.h || 2.6, cz + r * Math.cos(ang)], look: [cx, sh.ly || 1.0, cz], fov: sh.fov || 40 };
        },
        // через плечо: камера за бойцом `who`, смотрит на ближайшего чужого
        over(sh, f, A) {
          const me = sh.who === 'foe' ? nearestOther(A, hero(A)) : hero(A), other = nearestOther(A, me);
          let dx = me.pos[0] - other.pos[0], dz = me.pos[2] - other.pos[2]; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
          const back = sh.back || 1.7, side = (sh.side || 0.55) + (sh.dside || 0) * f;
          return { pos: [me.pos[0] + dx * back - dz * side, sh.h || 1.5, me.pos[2] + dz * back + dx * side], look: [other.pos[0], sh.ly || 1.15, other.pos[2]], fov: sh.fov || 36 };
        },
      };

      function dynamicPose(f) {
        const A = sense();
        const sh = cfg.shots;
        let i = 0; while (i + 1 < sh.length && sh[i + 1].from <= f) i++;
        const cur = SHOTS[sh[i].shot](sh[i], f - sh[i].from, A);
        const p = { ...cur, roll: sh[i].roll || 0 };
        if (i > 0 && f - sh[i].from < (cfg.blend || 40)) {
          const pv = SHOTS[sh[i - 1].shot](sh[i - 1], f - sh[i - 1].from, A);
          const u = ease.smoother((f - sh[i].from) / (cfg.blend || 40));
          return mix({ ...pv, roll: sh[i - 1].roll || 0 }, p, u);
        }
        return p;
      }

      // kind:'rel' — ключи относительно позы, в которой камеру застал режиссёр:
      // push (доля пути вперёд к точке на расстоянии D), right/up (сдвиг), lroll — крен.
      let base = null;
      function relPose(f) {
        if (!base) {
          const V = cam.position.constructor;
          const fwd = new V(0, 0, -1).applyQuaternion(cam.quaternion);
          const right = new V(1, 0, 0).applyQuaternion(cam.quaternion);
          const up = new V(0, 1, 0).applyQuaternion(cam.quaternion);
          base = { p: cam.position.clone(), fwd, right, up, fov: cam.fov };
        }
        const D = cfg.D || 10;
        const keys = cfg.keys; let A, B, u;
        if (f <= keys[0].f) { A = B = keys[0]; u = 0; }
        else if (f >= keys[keys.length - 1].f) { A = B = keys[keys.length - 1]; u = 0; }
        else { let i = 0; while (keys[i + 1].f < f) i++; A = keys[i]; B = keys[i + 1]; u = ease[B.ease || cfg.ease || 'smoother']((f - A.f) / (B.f - A.f)); }
        const g = (k) => lerp(A[k] || 0, B[k] || 0, u);
        const push = g('push'), dx = g('right'), dy = g('up'), lx = g('lright'), ly = g('lup');
        const at = (t, x, y) => [base.p.x + base.fwd.x * t + base.right.x * x + base.up.x * y, base.p.y + base.fwd.y * t + base.right.y * x + base.up.y * y, base.p.z + base.fwd.z * t + base.right.z * x + base.up.z * y];
        return { pos: at(push * D, dx, dy), look: at(D, lx, ly), roll: g('roll'), fov: lerp(A.fov ?? base.fov, B.fov ?? base.fov, u) };
      }

      function keyPose(f) {
        const keys = cfg.keys;
        if (f <= keys[0].f) return { ...keys[0], fov: keys[0].fov ?? cam.fov };
        const last = keys[keys.length - 1];
        if (f >= last.f) return { ...last, fov: last.fov ?? cam.fov };
        let i = 0; while (keys[i + 1].f < f) i++;
        const A = keys[i], B = keys[i + 1];
        const u = ease[B.ease || cfg.ease || 'smoother']((f - A.f) / (B.f - A.f));
        return { pos: lerp3(A.pos, B.pos, u), look: lerp3(A.look, B.look, u), roll: lerp(A.roll || 0, B.roll || 0, u), fov: lerp(A.fov ?? cam.fov, B.fov ?? cam.fov, u) };
      }

      renderer.render = (scene, camera) => {
        if (!T.on || camera !== cam) return orig(scene, camera);
        const f = window.__vt.frame - T.f0;
        const sp = cam.position.clone(), sq = cam.quaternion.clone(), sf = cam.fov;
        let p = cfg.kind === 'dynamic' ? dynamicPose(f) : cfg.kind === 'rel' ? relPose(f) : keyPose(f);
        // отпуск камеры обратно сцене: смешиваем с её собственной позой
        if (cfg.release && f >= cfg.release.at) {
          const u = Math.min(1, (f - cfg.release.at) / cfg.release.blend);
          if (u >= 1) return orig(scene, camera);
          // сценическая поза: сейчас в камере (ещё не подменяли)
          const fwd = new cam.position.constructor(0, 0, -1).applyQuaternion(sq);
          const scenePose = { pos: [sp.x, sp.y, sp.z], look: [sp.x + fwd.x * 10, sp.y + fwd.y * 10, sp.z + fwd.z * 10], roll: 0, fov: sf };
          p = mix(lastPose.v, scenePose, ease.smoother(u));
        } else lastPose.v = p;
        cam.position.set(p.pos[0], p.pos[1], p.pos[2]);
        cam.lookAt(p.look[0], p.look[1], p.look[2]);
        if (p.roll) cam.rotateZ(p.roll * Math.PI / 180);
        if (p.fov !== cam.fov) { cam.fov = p.fov; cam.updateProjectionMatrix(); }
        orig(scene, camera);
        cam.position.copy(sp); cam.quaternion.copy(sq);
        if (cam.fov !== sf) { cam.fov = sf; cam.updateProjectionMatrix(); }
      };
      window.__director.start = (f0) => { T.f0 = f0; T.on = true; base = null; lastPose.v = null; };
      window.__director.stop = () => { T.on = false; };
      window.__director.info = () => ({ fov: cam.fov, pos: cam.position.toArray(), aspect: cam.aspect });
      return { ok: true, info: window.__director.info() };
    },
  };
})();
