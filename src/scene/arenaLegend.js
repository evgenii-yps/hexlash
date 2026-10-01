// arenaLegend.js — ЛЕГЕНДА НАД БОЕМ. Пока в бою «ВЕДЁТ ЛЕГЕНДА», сама легенда висит
// над ареной: уменьшенная, из темноты фона. Вернули управление себе — она уходит
// обратно во тьму.
//
// ЭТО ТОЛЬКО КАРТИНКА. Не цель, не препятствие, не тело боя: в поле боя она не
// регистрируется, столкновений и теней у неё нет, на расчёт боя не влияет ничем.
// Файлы боя (buildFighter, арена, плашка) здесь только ВЫЗЫВАЮТСЯ, не правятся.
//
// КАК ПОДКЛЮЧЕНА. По образцу кличей и баффов: арена зовёт bind / tick / unbind, а
// про тумблер не знает вовсе — позу тумблера читаем из services/command.js сами.
// Все три способа перехвата (тумблер, карта рычага, тап по бойцу) сходятся в одну
// точку — commandState.legendLeads, поэтому отдельно их ловить не надо.
//
// ТЕЛО — то же, что у легенды над залом FORGE (PveScene): buildFighter + золото
// сердца (ascensionRite.legendHue / heartHandle). Нового тела, материала и вида
// нет, ярче бойцов оно не становится. Постамента, облака и дыма зала здесь НЕТ:
// второго тёплого пятна над ареной не заводим.
//
// ⚠️ ЛЕГЕНДА ЖИВЁТ В МИРЕ, А НЕ НАКЛЕЙКОЙ НА ЭКРАНЕ (решение владельца
//    01.10.2026). Её место — точка над серединой плиты, и камера ходит вокруг неё
//    как вокруг любого предмета: наезд, облёт и смена ракурса сдвигают её вместе
//    с ареной, с честным параллаксом. Пересчитывается только то, что держит её
//    на месте относительно кадра, и каждое из трёх идёт плавно и без скачка:
//      · ВЫСОТА — ровно настолько, чтобы ноги были выше самых высоких плашек здоровья
//        (плашки читаются у тел, их файлы не трогаются);
//      · ОТЪЕЗД НАЗАД вдоль взгляда на плиту — только когда по высоте не помещается
//        (тесный кадр, камера почти горизонтально): дальше она меньше на экране;
//      · ПОДТЯЖКА К ТОМУ, КУДА СМОТРИТ КАМЕРА — только когда середина плиты ушла за край
//        кадра (открытое поле держит сторону игрока).
//    Каждая из трёх идёт вверх без запаздывания (иначе зазор мигнул бы) и оседает
//    назад плавно. Размер в мире не меняется никогда: 60% бойца.
//
// ⚠️ ВЫХОД ИЗ ТЕМНОТЫ — ЦВЕТОМ, А НЕ ПРОЗРАЧНОСТЬЮ. Тело затемняется в цвет фона и
//    уходит в глубину; прозрачность включается только на последних ≈15% пути, иначе
//    сквозь полупрозрачное тело просвечивали бы спаянные части.
import * as THREE from 'three';
import store from '@/core/state/store.js';
import { buildFighter } from './buildFighter.js';
import { legendHue, heartHandle } from './ascensionRite.js';
import { buildTree } from '@/data/upgradeTree.js';
import { resolveBehavior } from '@/data/behavior.js';
import { FOG_COLOR } from '@/data/sceneTokens.js';
import { commandState } from '@/services/command.js';
import { DEV_MODE } from '@/services/devMode.js';

// ── CONFIG ─────────────────────────────────────────────────────────────────
const CONFIG = {
  sizeRatio: 0.6,       // рост легенды / рост бойца (решение владельца)
  backZ: 0.4,           // насколько «позади» середины плиты (мир, вдоль взгляда камеры на плиту)
  maxNdcX: 0.55,        // по горизонтали легенда не дальше этого от середины кадра
  backMax: 30,          // на сколько ещё можно отъехать назад, если по высоте не помещается (мир)
  clearNdc: 0.07,       // зазор между ногами легенды и самой высокой точкой плашек (доля кадра)
  maxNdcY: 0.88,        // голова не выше этого — иначе уйдёт за верх кадра
  minAbove: 1.0,        // ниже этого над плитой не опускаем
  maxAbove: 6.5,        // выше этого над плитой не поднимаем (иначе в почти вертикальном виде улетела бы к камере)
  settle: 3.0,          // 1/с — как плавно высота оседает назад (вверх идёт без запаздывания)
  hiddenBack: 7.0,      // откуда выплывает / куда уходит: вглубь, от камеры (мир)
  hiddenUp: 1.6,        // …и выше места (мир)
  appearSec: 1.0,
  leaveSec: 0.8,
  edgeFrac: 0.15,       // прозрачность только на этой доле пути с краю анимации
  reducedFadeSec: 0.3,  // «уменьшить движение»: короткое растворение, без полёта
  bobAmp: 0.05, bobSpeed: 0.9, // мягкое парение (мир, доля роста), в покое
  turn: 3.0,            // 1/с — как плавно разворачивается лицом к камере
};

const ease = (p) => p * p * (3 - 2 * p); // smoothstep: без рывка на концах
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const DARK = new THREE.Color(FOG_COLOR);

let ctx = null;

/**
 * @param {object} o
 * @param {THREE.Scene} o.scene
 * @param {THREE.PerspectiveCamera} o.camera
 * @param {THREE.WebGLRenderer} o.renderer — для прогрева шейдеров тела
 * @param {number} o.topY — верх плиты
 * @param {object} o.field — поле боя: у него читаем, где сейчас висят плашки здоровья
 * @param {boolean} o.reduced — «уменьшить движение»
 */
export function bindLegendArena({ scene, camera, renderer, field, topY = 0, reduced }) {
  ctx = {
    scene, camera, renderer, field, topY, reduced: !!reduced, lastBarTop: null,
    body: null, parts: null, snap: null, legH: 1.77, buildMs: 0,
    p: 0, lastTarget: 0, wasActive: false, hy: null, back: null, pull: null, yaw: null,
    forced: null, hold: null, clock: 0,
    rest: new THREE.Vector3(), _v: new THREE.Vector3(), _w: new THREE.Vector3(), _f: new THREE.Vector3(),
    probe: null,
  };
  if (DEV_MODE) installProbe();
  return unbindLegendArena;
}

/** Тело строится ЗАРАНЕЕ — в тот кадр, когда тумблер стал возможен, — и ждёт скрытым. */
function build() {
  const c = ctx;
  const rec = store.getters['roster/legend'];
  if (!rec) return;
  const t0 = performance.now();
  const tree = buildTree(rec.core, rec.lit || null);
  const lit = [];
  for (const br of tree || []) for (const f of br.faces || []) if (f.state === 'lit') lit.push(f);
  const gold = legendHue(rec.core);
  const body = buildFighter(gold, {
    side: 'player',
    coreId: rec.core,
    behavior: resolveBehavior(rec.core, lit),
    bounds: { x: 1000, z: 1000 }, // границ для картинки нет: место задаём мы
    neutralColor: false,
    getFoePos: () => null,
  });
  body.setReducedMotion(c.reduced);
  body.group.children.forEach((o) => { if (o.isSprite) o.visible = false; }); // без плашки здоровья
  body.group.scale.setScalar(CONFIG.sizeRatio);
  body.group.visible = true;
  c.scene.add(body.group);
  c.body = body;
  c.parts = heartHandle(body, gold);
  // Рост считаем с самого тела, а не берём числом.
  body.group.updateMatrixWorld(true);
  // Только меши: спрайты (плашка, ореол сердца) растягивают коробку выше головы.
  const box = new THREE.Box3();
  const mb = new THREE.Box3();
  body.group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    mb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    box.union(mb);
  });
  if (box.max.y > box.min.y) c.legH = box.max.y - box.min.y; // уже со scale
  // Прогрев: шейдеры тела собираются сейчас, а не в кадре первого показа.
  try { c.renderer?.compile?.(body.group, c.camera, c.scene); } catch (_) { /* прогрев — не обязательное */ }
  body.group.visible = false;
  c.buildMs = performance.now() - t0;
}

/** Снимок цветов и прозрачности тела: от него каждый кадр считается затемнение. */
function takeSnapshot() {
  const c = ctx;
  const seen = new Set();
  const list = [];
  c.body.group.traverse((o) => {
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) {
      if (seen.has(m)) continue;
      seen.add(m);
      list.push({
        m,
        color: m.color ? m.color.clone() : null,
        emissive: m.emissive ? m.emissive.clone() : null,
        opacity: m.opacity,
        transparent: m.transparent,
      });
    }
  });
  c.snap = list;
}

function ndcYOf(c, x, y, z) {
  return c._v.set(x, y, z).project(c.camera).y;
}

/**
 * Высота ног (мир), при которой точка (feet + off) встаёт на уровень ndc. Бисекция.
 *
 * Бесконечность — «выше потолка не достать» (вид почти сверху: подъём точки над серединой
 * кадра почти не двигает её вверх по экрану, там надо уходить назад по земле).
 *
 * ⚠️ ВЕРХНЯЯ ГРАНИЦА — ТАМ, ГДЕ ТОЧКА ЕЩЁ ПЕРЕД КАМЕРОЙ. Камера смотрит вниз, и выше
 *    какой-то высоты точка уходит за спину: проекция переворачивается, и «выше» начинает
 *    выглядеть как «ниже». Без этой границы бисекция улетала на 80 единиц и ставила
 *    легенду под плиту.
 */
function solveHeight(c, x, z, off, ndc, lo, hi) {
  const cam = c.camera;
  c._f.set(0, 0, -1).applyQuaternion(cam.quaternion);
  if (c._f.y < -1e-4) {
    const a = (x - cam.position.x) * c._f.x + (z - cam.position.z) * c._f.z;
    const front = cam.position.y + (0.6 - a) / c._f.y - off; // глубина точки = 0.6 (чуть дальше плоскости камеры)
    if (front < hi) hi = Math.max(lo, front);
  }
  if (ndcYOf(c, x, hi + off, z) < ndc) return Infinity; // даже на потолке не дотянуться до этой точки экрана
  if (ndcYOf(c, x, lo + off, z) > ndc) return lo;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (ndcYOf(c, x, mid + off, z) < ndc) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Самая высокая точка плашек здоровья на экране сейчас (доля кадра, +1 — верх).
 *
 * ⚠️ ПЛАШКИ ЧИТАЮТСЯ У ТЕЛ, А НЕ ВЫЧИСЛЯЮТСЯ ПО УГЛАМ ПЛИТЫ. Расчёт «боец у дальнего
 *    угла» держит зазор там, где бойца нет, и съедает всё место над ареной. Плашки
 *    разводятся только ВНИЗ (hpStagger), поэтому верхняя из них — честная граница.
 *    Файлы плашки и бойца не трогаются: только читаются положение и размер спрайта.
 */
function highestPlateNdc(c) {
  let top = -2;
  const units = c.field ? c.field.units() : null;
  if (units) {
    for (const u of units) {
      if (!u || u.dead) continue;
      const g = u.f && u.f.group;
      if (!g) continue;
      let plate = null;
      for (const ch of g.children) if (ch.isSprite) { plate = ch; break; }
      if (!plate || !plate.visible) continue;
      g.updateMatrixWorld();
      plate.getWorldPosition(c._w);                    // низ плашки (привязка снизу)
      c._w.y += plate.scale.y * (g.scale ? g.scale.y || 1 : 1);
      const y = c._w.project(c.camera).y;
      if (y > top) top = y;
    }
  }
  if (top > -2) c.lastBarTop = top;
  return c.lastBarTop != null ? c.lastBarTop : 0.5;     // бой кончился / плашек нет — как было
}

export function legendTick(dt, t) {
  const c = ctx;
  if (!c) return;
  const f = c.forced;
  const active = f ? true : commandState.active;
  const leads = f ? f.leads : (active && commandState.legendLeads);

  if (active && !c.body) build();
  if (!c.body) return;

  // Новый бой (тумблер снова стал возможен) — легенды на экране нет.
  // Если на входе тумблер уже «ведёт легенда» — она стоит сразу, без выплывания.
  if (active && !c.wasActive) { c.p = leads ? 1 : 0; c.lastTarget = c.p; c.hy = null; c.back = null; c.pull = null; c.yaw = null; }
  c.wasActive = active;

  // Идёт бой — цель задаёт тумблер. Бой кончился — доводим начатое до конца, но
  // нового ухода не играем: легенда стоит до экрана результата и уходит со сценой.
  if (active) c.lastTarget = leads ? 1 : 0;
  const target = c.lastTarget;
  const dur = c.reduced ? CONFIG.reducedFadeSec : (target > c.p ? CONFIG.appearSec : CONFIG.leaveSec);
  const step = Math.min(dt, 0.25) / dur;
  c.clock += Math.min(dt, 0.25); // часы анимации — для служебных проверок
  c.p = target > c.p ? Math.min(target, c.p + step) : Math.max(target, c.p - step);
  if (c.hold != null) c.p = c.hold; // служебная заморозка на заданной доле (проверка затемнения по ступеням)

  const g = c.body.group;
  if (c.p <= 0) { g.visible = false; return; }
  g.visible = true;

  const cam = c.camera;
  cam.updateMatrixWorld(); // камера уже доехала в этом кадре — считаем по её нынешней позе, а не вчерашней
  const e = ease(c.p);
  const k = Math.min(dt, 0.25);

  // ── тело: основа → покой → золото сердца → затемнение ──
  if (c.snap) for (const r of c.snap) {
    if (r.color) r.m.color.copy(r.color);
    if (r.emissive) r.m.emissive.copy(r.emissive);
    r.m.opacity = r.opacity;
  }
  c.body.update(t, cam);
  c.parts?.apply(1);
  if (!c.snap) takeSnapshot(); // первый кадр: основа = как тело выглядит в полную силу


  // ⚠️ ПОЗИЦИЯ СТАВИТСЯ ПОСЛЕ update(): тело само зажимает себя границами и своей ходьбой — как в зале.
  // ── МЕСТО В МИРЕ: над серединой плиты, чуть позади; высота — по зазору над плашками ──
  const barTop = highestPlateNdc(c);
  const lo = c.topY + CONFIG.minAbove;
  const hi = c.topY + CONFIG.maxAbove;
  const wantFeet = barTop + CONFIG.clearNdc; // куда должны встать ноги на экране
  // По высоте не помещается (тесный кадр) — отодвигаем легенду НАЗАД по миру: дальше
  // она меньше на экране. Берём наименьший отъезд, при котором и зазор, и кадр сходятся.
  // Подбор непрерывный (бисекция), а не по ступеням: ступень дала бы скачок позиции.
  // «Назад» — вдоль взгляда камеры на середину плиты (по земле): при облёте она остаётся
  // позади арены, а не уезжает к камере. В обычном кадре смещение мало (backZ).
  let ux = -cam.position.x, uz = -cam.position.z;
  const ul = Math.hypot(ux, uz);
  if (ul > 1e-3) { ux /= ul; uz /= ul; } else { ux = 0; uz = -1; }
  // ПО ГОРИЗОНТАЛИ — НАД СЕРЕДИНОЙ ПЛИТЫ, ПОКА ОНА В КАДРЕ. Если камера смотрит в сторону
  // (открытое поле: она держит сторону игрока, а середина поля уходит за край), точка
  // привязки плавно подтягивается к тому месту плиты, куда смотрит камера.
  c._f.set(0, 0, -1).applyQuaternion(cam.quaternion);
  let gx = 0, gz = 0;
  if (c._f.y < -1e-3) { const sg = (c.topY - cam.position.y) / c._f.y; gx = cam.position.x + c._f.x * sg; gz = cam.position.z + c._f.z * sg; }
  const midY = c.hy != null ? c.hy + c.legH / 2 : c.topY + 3;
  const xAt = (tt) => {
    const d = CONFIG.backZ + (c.back || 0);
    return c._v.set(gx * tt + ux * d, midY, gz * tt + uz * d).project(cam).x;
  };
  let pullNeed = 0;
  if (Math.abs(xAt(0)) > CONFIG.maxNdcX) {
    if (Math.abs(xAt(1)) > CONFIG.maxNdcX) pullNeed = 1;
    else { let t0 = 0, t1 = 1; for (let i = 0; i < 12; i++) { const m = (t0 + t1) / 2; if (Math.abs(xAt(m)) > CONFIG.maxNdcX) t0 = m; else t1 = m; } pullNeed = t1; }
  }
  if (c.pull == null || c.reduced) c.pull = pullNeed;
  else c.pull = pullNeed > c.pull ? pullNeed : c.pull + (pullNeed - c.pull) * (1 - Math.exp(-CONFIG.settle * k));
  const bx = gx * c.pull, bz = gz * c.pull; // точка привязки на плите
  const slack = (B) => {
    const d = CONFIG.backZ + B;
    const nd = solveHeight(c, bx + ux * d, bz + uz * d, 0, wantFeet, lo, hi);
    if (nd === Infinity) return -Infinity;                                       // выше потолка не достать
    return Math.min(solveHeight(c, bx + ux * d, bz + uz * d, c.legH, CONFIG.maxNdcY, lo, hi), hi) - nd;
  };
  let backNeed = 0;
  if (slack(0) < 0) {
    if (slack(CONFIG.backMax) < 0) backNeed = CONFIG.backMax;
    else {
      let b0 = 0, b1 = CONFIG.backMax;
      for (let i = 0; i < 14; i++) { const m = (b0 + b1) / 2; if (slack(m) < 0) b0 = m; else b1 = m; }
      backNeed = b1;
    }
  }
  // отъезд — как высота: вперёд без запаздывания, обратно плавно
  if (c.back == null || c.reduced) c.back = backNeed;
  else c.back = backNeed > c.back ? backNeed : c.back + (backNeed - c.back) * (1 - Math.exp(-CONFIG.settle * k));
  const dBack = CONFIG.backZ + c.back;
  const ax = bx + ux * dBack, az = bz + uz * dBack;
  const need = Math.min(solveHeight(c, ax, az, 0, wantFeet, lo, hi), hi);              // ноги над плашками
  const cap = Math.min(solveHeight(c, ax, az, c.legH, CONFIG.maxNdcY, lo, hi), hi);   // голова в кадре
  // вверх — без запаздывания (иначе зазор мигнул бы), вниз — плавно
  if (c.hy == null || c.reduced) c.hy = need;
  else c.hy = need > c.hy ? need : c.hy + (need - c.hy) * (1 - Math.exp(-CONFIG.settle * k));
  // зазор важнее кадра: если даже на предельном отъезде не помещается, уступает верх кадра
  const feetY = Math.max(need, Math.min(c.hy, cap));
  c.rest.set(ax, feetY, az);

  // из темноты: от места — вглубь от камеры и выше (направление берётся с камеры сейчас)
  let px = c.rest.x, py = c.rest.y, pz = c.rest.z;
  if (!c.reduced) {
    c._w.set(c.rest.x - cam.position.x, 0, c.rest.z - cam.position.z);
    const len = c._w.length() || 1;
    const away = 1 - e;
    px += (c._w.x / len) * CONFIG.hiddenBack * away;
    pz += (c._w.z / len) * CONFIG.hiddenBack * away;
    py += CONFIG.hiddenUp * away;
    py += Math.sin(t * CONFIG.bobSpeed * Math.PI * 2) * CONFIG.bobAmp * c.legH * e;
  }
  g.position.set(px, py, pz);

  // лицом к камере, плавно (модель смотрит в −Z, как в зале)
  const want = Math.atan2(-(cam.position.x - px), -(cam.position.z - pz));
  if (c.yaw == null || c.reduced) c.yaw = want;
  else {
    let d = (want - c.yaw) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
    c.yaw += d * (1 - Math.exp(-CONFIG.turn * k));
  }
  g.rotation.y = c.yaw;

  // затемнение в цвет фона: вся дорога, кроме полёта «с полной яркостью»
  const dark = c.reduced ? 0 : 1 - e;
  // прозрачность — только на краях: первые/последние edgeFrac пути
  const a = clamp01(c.p / CONFIG.edgeFrac);
  const alpha = a * a * (3 - 2 * a);
  const faded = alpha < 0.999;
  for (const r of c.snap) {
    const m = r.m;
    if (dark > 0) {
      if (m.color) m.color.lerp(DARK, dark);
      if (m.emissive) m.emissive.lerp(DARK, dark);
    }
    if (faded) { m.transparent = true; m.opacity *= alpha; }
    else m.transparent = r.transparent;
  }
  if (DEV_MODE) c.probe = { barTop, need, cap, hy: c.hy, feetY, backNeed, legH: c.legH };
}

export function unbindLegendArena() {
  const c = ctx;
  ctx = null;
  if (!c) return;
  if (c.body) { c.scene.remove(c.body.group); c.body.dispose(); }
}

// ── Служебное окно в состояние (только ?dev=1): для приёмки по видео и замеров ──
function installProbe() {
  window.__legendProbe = {
    /** Что видно сейчас: ход анимации, положение в кадре, зазор над плашками. */
    read() {
      const c = ctx;
      if (!c) return null;
      const out = { clock: c.clock, built: !!c.body, legH: c.legH, buildMs: c.buildMs, p: c.p, visible: !!c.body?.group.visible, sceneChildren: c.scene.children.length, fieldUnits: c.field ? c.field.units().length : null };
      if (c.body && c.body.group.visible) {
        const h = new THREE.Vector3();
        const feet = h.copy(c.body.group.position).project(c.camera).y;
        const head = h.copy(c.body.group.position).setY(c.body.group.position.y + c.legH).project(c.camera).y;
        out.feetNdc = feet; out.headNdc = head;
        out.barTopNdc = c.probe?.barTop; out.clearNdc = c.probe ? feet - c.probe.barTop : null;
        out.pos = c.body.group.position.toArray();
        out.scale = c.body.group.scale.x;
        out.cam = c.camera.position.toArray(); out.back = c.back; out.dbg = c.probe;
      }
      return out;
    },
    /** Мировая точка → пиксель окна (для тапа по бойцу в проверках). */
    toPixel(x, y, z) {
      const c = ctx; if (!c) return null;
      const v = new THREE.Vector3(x, y, z).project(c.camera);
      return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
    },
    /** Заморозить анимацию на доле p (0..1) или снять заморозку (null). */
    hold(p) { if (ctx) ctx.hold = p == null ? null : p; },
    /** Принудительно показать/убрать легенду там, где тумблера нет (витрина, открытое поле). */
    force(on) { if (ctx) ctx.forced = on == null ? null : { leads: !!on }; },
  };
}
