// leaderBeam.js — ЛУЧ НАД БОЙЦОМ ЛИДЕРА. Тонкий вертикальный столб розового
// света: единственная метка короны на поле и единственное новое свечение.
//
// ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Сцена арены — защищённый файл, и класть в неё ещё одну
// сборку меша значит растить её ради того, что к бою отношения не имеет. Здесь
// только геометрия, материал и затухание; кто лидер — решает поле боя, сцена
// лишь спрашивает его и переставляет лучи.
//
// ⚠️ СТОЛБ, А НЕ КОНУС И НЕ ШАПКА. Требование владельца дословно: «должно
//    читаться как луч». Поэтому цилиндр постоянного радиуса, а не конус (конус
//    читается как прожектор сверху) и не диск над головой (читается как метка
//    выбора, как в стратегиях). Радиус мал намеренно: луч отмечает ТОЧКУ, а не
//    накрывает бойца.
//
// ⚠️ ЯРКОСТЬ ПАДАЕТ КВЕРХУ. Ровный по высоте столб читается как колонна, то есть
//    как предмет. Градиент по вертикали снимает верхнюю кромку, и столб читается
//    как свет. Градиент лежит текстурой 1×N — так его не надо считать в шейдере,
//    и он один на все лучи.
//
// ⚠️ БЕЗ ТУМАНА И БЕЗ ЗАПИСИ ГЛУБИНЫ. Туман съел бы дальние лучи ровно там, где
//    они нужнее всего, — на другом конце поля. Запись глубины заставила бы лучи
//    резать друг друга при наложении.
//
// Экспортирует: createLeaderBeams.

import * as THREE from 'three';
import { COMBAT_BALANCE } from '@/data/combatBalance.js';

const LC = COMBAT_BALANCE.openField.leader;

/** Градиент яркости по высоте: плотно у земли, в ноль к верхушке. */
function makeBeamTexture() {
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 64;
  const g = c.getContext('2d');
  // Холст рисует сверху вниз, а столб стоит снизу вверх — поэтому ноль сверху.
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/**
 * НАБОР ЛУЧЕЙ. Один на каждого живого бойца короны; кто корона — спрашивается
 * снаружи, здесь только показ.
 *
 * @param {object} o
 * @param {THREE.Scene} o.scene куда класть
 * @param {number} o.color      розовый поля (число 0xRRGGBB)
 * @param {number} o.groundY    верх плиты
 * @returns {{ update: Function, dispose: Function }}
 */
export function createLeaderBeams({ scene, color, groundY }) {
  // Геометрия и материал ОБЩИЕ на все лучи: их до двадцати, и двадцать копий
  // одной трубы — это двадцать лишних загрузок в видеопамять ни за чем.
  //
  // Цилиндр открыт с торцов (`openEnded`): крышка сверху дала бы ту самую
  // «шапку», которой быть не должно.
  const geo = new THREE.CylinderGeometry(LC.beamRadius, LC.beamRadius, LC.beamHeight, 12, 1, true);
  const tex = makeBeamTexture();
  const mat = new THREE.MeshBasicMaterial({
    color,
    map: tex,
    transparent: true,
    opacity: 0,             // ставится затуханием; на нуле лучи не видны вовсе
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, // столб открыт с торцов — видна и внутренняя стенка
    fog: false,
  });

  /** @type {THREE.Mesh[]} живые лучи, переиспользуются между сменами короны */
  const pool = [];
  let shown = 0;      // сколько лучей сейчас на поле
  let fade = 0;       // 0..1 — насколько корона проявлена
  let want = 0;       // куда едет затухание: 1 корона есть, 0 короны нет
  let crown = null;   // чья корона сейчас показана

  const take = (i) => {
    while (pool.length <= i) {
      const m = new THREE.Mesh(geo, mat);
      m.renderOrder = 2;   // поверх колец на полу, но это всё ещё не свет сцены
      m.visible = false;
      scene.add(m);
      pool.push(m);
    }
    return pool[i];
  };

  /**
   * Переставить лучи. Зовётся каждый кадр.
   *
   * @param {string|null} leaderSide чья корона (null — короны нет)
   * @param {object[]} living        живые бойцы поля (записи с .f и .sideId)
   * @param {number} dtSec           сколько прошло с прошлого кадра
   */
  function update(leaderSide, living, dtSec) {
    // СМЕНА КОРОНЫ ИДЁТ ЧЕРЕЗ НОЛЬ. Сперва гаснем на прежней стороне, и только
    // погаснув — зажигаемся на новой. Перекладывать лучи на ходу нельзя: на
    // экране это читается как прыжок двадцати огней через всё поле.
    if (leaderSide !== crown) {
      want = 0;
      if (fade <= 0.001) { crown = leaderSide; fade = 0; }
    }
    if (crown === leaderSide) want = leaderSide ? 1 : 0;

    const step = LC.beamFadeSec > 0 ? dtSec / LC.beamFadeSec : 1;
    fade = want > fade ? Math.min(want, fade + step) : Math.max(want, fade - step);

    if (fade <= 0.001) {
      for (let i = 0; i < shown; i += 1) pool[i].visible = false;
      shown = 0;
      mat.opacity = 0;
      return;
    }
    mat.opacity = LC.beamOpacity * fade;

    let n = 0;
    if (crown) {
      for (const u of living) {
        if (u.sideId !== crown || !u.f) continue;
        const p = u.f.group.position;
        const m = take(n);
        m.position.set(p.x, groundY + LC.beamHeight / 2, p.z);
        m.visible = true;
        n += 1;
      }
    }
    for (let i = n; i < shown; i += 1) pool[i].visible = false;
    shown = n;
  }

  function dispose() {
    for (const m of pool) scene.remove(m);
    pool.length = 0;
    geo.dispose();
    tex.dispose();
    mat.dispose();
  }

  return { update, dispose };
}
