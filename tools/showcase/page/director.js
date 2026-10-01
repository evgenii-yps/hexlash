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
//
// Этап 3, добавочные каналы (работают поверх любого вида камеры):
//   post:[{ ch:'roll'|'yaw'|'push'|'fov', f0, f1, v0, v1, ease }] — прибавка к позе: крен (°), поворот
//        вида вокруг вертикали (°, «рывок»), подъезд вперёд (м), угол обзора (°). До f0 — v0, после f1 — v1;
//   platesOff:[[f0,f1], …] — на эти кадры прячем плашки HP (YOU/FOE) над бойцами арены;
//   anchor:'legend' — у ключей kind:'keys' поля off/loff считаются от позиции легенды зала (берётся
//        один раз в момент старта плана, чтобы камера не качалась вместе с её парением);
//   drive:true — камера двигается НАСТОЯЩАЯ (перед кадром игры), а не подменяется на отрисовке.
//        Нужно воротам: подписи островов считает сама сцена по своей камере, подмена их бы
//        оставила стоять на месте. С release.at управление отдаётся игре (её пролёт к кнопке
//        стартует с того места, где мы оставили камеру);
//   stage:{ fighters:[{ id, x, z, face:[x,z] }], gesture:{ f0, dur } } — постановка пятерых на главном
//        острове и жест «рука-стрела». Всё делается ПОСЛЕ fighter.update() и ПЕРЕД render(),
//        из обёртки: файл бойца не правится.
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
        // сбоку: камера ПЕРПЕНДИКУЛЯРНО линии «герой — ближайший чужой», оба в профиль и разведены
        // на экране (силуэты не сливаются). r — отступ от середины; k — прибавка на каждый метр между
        // бойцами; flip — с какой стороны; bias — смещение вдоль линии (в долях расстояния).
        side(sh, f, A) {
          const me = hero(A), other = nearestOther(A, me);
          const dx = other.pos[0] - me.pos[0], dz = other.pos[2] - me.pos[2]; const d = Math.hypot(dx, dz) || 1;
          const ux = dx / d, uz = dz / d, nx = -uz * (sh.flip ? -1 : 1), nz = ux * (sh.flip ? -1 : 1);
          const mx = (me.pos[0] + other.pos[0]) / 2 + ux * d * (sh.bias || 0), mz = (me.pos[2] + other.pos[2]) / 2 + uz * d * (sh.bias || 0);
          const r = (sh.r || 3) + d * (sh.k || 1) + (sh.dr || 0) * f;
          return { pos: [mx + nx * r, sh.h || 1.6, mz + nz * r], look: [mx, sh.ly || 1.1, mz], fov: sh.fov || 38 };
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
        const keys = resolveKeys();
        if (f <= keys[0].f) return { ...keys[0], fov: keys[0].fov ?? cam.fov };
        const last = keys[keys.length - 1];
        if (f >= last.f) return { ...last, fov: last.fov ?? cam.fov };
        let i = 0; while (keys[i + 1].f < f) i++;
        const A = keys[i], B = keys[i + 1];
        const u = ease[B.ease || cfg.ease || 'smoother']((f - A.f) / (B.f - A.f));
        return { pos: lerp3(A.pos, B.pos, u), look: lerp3(A.look, B.look, u), roll: lerp(A.roll || 0, B.roll || 0, u), fov: lerp(A.fov ?? cam.fov, B.fov ?? cam.fov, u) };
      }

      // ── добавочные каналы ──
      const postVal = (f, ch) => {
        let v = 0;
        for (const q of cfg.post || []) {
          if (q.ch !== ch) continue;
          const u = f <= q.f0 ? 0 : f >= q.f1 ? 1 : ease[q.ease || 'smooth']((f - q.f0) / (q.f1 - q.f0));
          v += lerp(q.v0, q.v1, u);
        }
        return v;
      };
      function applyPost(p, f) {
        if (!cfg.post) return p;
        const roll = postVal(f, 'roll'), yaw = postVal(f, 'yaw'), push = postVal(f, 'push'), fov = postVal(f, 'fov');
        let pos = p.pos, look = p.look;
        let dx = look[0] - pos[0], dy = look[1] - pos[1], dz = look[2] - pos[2];
        if (yaw) { const a = yaw * Math.PI / 180, c = Math.cos(a), s2 = Math.sin(a); const nx = dx * c + dz * s2, nz = -dx * s2 + dz * c; dx = nx; dz = nz; look = [pos[0] + dx, look[1], pos[2] + dz]; }
        if (push) { const d = Math.hypot(dx, dy, dz) || 1; pos = [pos[0] + dx / d * push, pos[1] + dy / d * push, pos[2] + dz / d * push]; look = [look[0], look[1], look[2]]; }
        return { pos, look, roll: (p.roll || 0) + roll, fov: p.fov + fov };
      }

      // плашки HP над бойцами арены — единственные Sprite, добавленные прямо в группу бойца
      function withPlates(f, fn) {
        const off = (cfg.platesOff || []).some(([a, b]) => f >= a && f < b);
        if (!off || !st.field || !st.field.units) return fn();
        const hid = [];
        for (const u of st.field.units()) for (const o of u.f.group.children) if (o.isSprite && o.visible) { o.visible = false; hid.push(o); }
        try { return fn(); } finally { for (const o of hid) o.visible = true; }
      }

      // ── постановка пятерых и жест (главный остров) ──
      function applyStage(f) {
        const sg = cfg.stage; if (!sg || !st.bodies) return;
        const g = sg.gesture ? (f <= sg.gesture.f0 ? 0 : f >= sg.gesture.f0 + sg.gesture.dur ? 1 : ease.smooth((f - sg.gesture.f0) / sg.gesture.dur)) : 0;
        for (const spec of sg.fighters) {
          const b = st.bodies.find((x) => x && x.id === spec.id); if (!b) continue;
          const grp = b.fighter.group;
          grp.position.x = spec.x; grp.position.z = spec.z;
          grp.rotation.y = Math.atan2(-(spec.face[0] - spec.x), -(spec.face[1] - spec.z)) + (sg.yawOff || 0) * Math.PI / 180;
          if (g > 0) {
            if (sg.gesture.torsoTurn) b.fighter.joints.torso.rotation.y += sg.gesture.torsoTurn * Math.PI / 180 * g;
            const j = b.fighter.joints.armR;
            j.shoulder.rotation.x = lerp(j.shoulder.rotation.x, sg.gesture.reach ?? 1.5, g);
            j.elbow.rotation.x = lerp(j.elbow.rotation.x, 0.05, g);
          }
        }
      }

      // ключи с привязкой к якорю (off/loff от позиции легенды в момент старта)
      let keysR = null;
      function resolveKeys() {
        if (keysR) return keysR;
        let A = [0, 0, 0];
        if (cfg.anchor === 'legend' && st.legend) { const q = st.legend.group.position; A = [q.x, q.y, q.z]; }
        keysR = cfg.keys.map((k) => (k.off ? { ...k, pos: [A[0] + k.off[0], A[1] + k.off[1], A[2] + k.off[2]], look: [A[0] + (k.loff?.[0] ?? 0), A[1] + (k.loff?.[1] ?? 0), A[2] + (k.loff?.[2] ?? 0)] } : k));
        return keysR;
      }

      // ── drive: двигаем настоящую камеру до цикла игры ──
      function driveFrame() {
        if (!T.on || !cfg.drive) return;
        const f = window.__vt.frame - T.f0;
        if (f < 0 || (cfg.release && f >= cfg.release.at)) return;
        applyStage(f);
        let p = cfg.kind === 'rel' ? relPose(f) : keyPose(f);
        p = applyPost(p, f);
        const c = st.controls;
        if (c) { c.minDistance = 0.1; c.maxDistance = 1e5; c.minPolarAngle = 0; c.maxPolarAngle = Math.PI; c.target.set(p.look[0], p.look[1], p.look[2]); }
        cam.position.set(p.pos[0], p.pos[1], p.pos[2]);
        cam.lookAt(p.look[0], p.look[1], p.look[2]);
        if (p.fov !== cam.fov) { cam.fov = p.fov; cam.updateProjectionMatrix(); }
      }
      window.__vt.pre = driveFrame;

      renderer.render = (scene, camera) => {
        if (!T.on || camera !== cam || cfg.drive) return orig(scene, camera);
        const f = window.__vt.frame - T.f0;
        const sp = cam.position.clone(), sq = cam.quaternion.clone(), sf = cam.fov;
        applyStage(f);
        let p = cfg.kind === 'dynamic' ? dynamicPose(f) : cfg.kind === 'rel' ? relPose(f) : keyPose(f);
        p = applyPost(p, f);
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
        withPlates(f, () => orig(scene, camera));
        cam.position.copy(sp); cam.quaternion.copy(sq);
        if (cam.fov !== sf) { cam.fov = sf; cam.updateProjectionMatrix(); }
      };
      window.__director.start = (f0) => { T.f0 = f0; T.on = true; base = null; lastPose.v = null; keysR = null; };
      window.__director.stop = () => { T.on = false; };
      window.__director.info = () => ({ fov: cam.fov, pos: cam.position.toArray(), aspect: cam.aspect });
      return { ok: true, info: window.__director.info() };
    },
  };
})();
