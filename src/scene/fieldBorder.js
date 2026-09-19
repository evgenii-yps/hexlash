// fieldBorder.js — ГРАНИЦА СУЖАЮЩЕГОСЯ ПОЛЯ, объёмная часть. Контур на полу.
//
// ПОЧЕМУ КОНТУР, А НЕ СТЕНА. Игроку нужны сразу две вещи: видеть, куда сходится
// поле, и видеть тех, кто ещё снаружи. Стена показывает первое и прячет второе.
//
// ⚠️ СВОЕГО СВЕТА У ГРАНИЦЫ НЕТ. Ни источника, ни складывающего смешивания:
//    материал обычный, матовый, и цвет берётся из общего набора — MATERIALS.rim,
//    «кромка плиты». Сужение и есть кромка, только движущаяся, и второго имени
//    этому тону заводить не надо. На поле светится только луч над короной.
//
// ПОЧЕМУ КОЛЬЦО НЕ МАСШТАБИРУЕТСЯ, А ПЕРЕПИСЫВАЕТСЯ. Радиус за матч падает
// всемеро; отмасштабируй готовое кольцо — вместе с радиусом истончится и сама
// линия, и к концу боя от неё останется волосок. Поэтому вершины переписываются
// на месте, в уже заведённом буфере: толщина в мировых единицах постоянная, а
// мусора за кадр не создаётся ни байта.
//
// ЧИСЕЛ ЗДЕСЬ НЕТ. Все живут в блоке `openField.shrink` файла чисел боя.
//
// Экспортирует: buildFieldBorder.

import * as THREE from 'three';
import { MATERIALS } from '@/data/sceneTokens.js';
import { COMBAT_BALANCE } from '@/data/combatBalance.js';

/** Сколько отрезков в кольце. Столько, чтобы на самом большом поле не ломалось. */
const SEGMENTS = 128;

/**
 * @param {number} topY высота верха плиты — контур лежит НА ней
 * @returns {{ mesh: THREE.Mesh, set: (r:number)=>void, tick: (t:number)=>void,
 *             setVisible: (v:boolean)=>void, setReducedMotion: (v:boolean)=>void,
 *             dispose: () => void }}
 */
export function buildFieldBorder(topY) {
  const S = COMBAT_BALANCE.openField.shrink;
  const half = S.lineWidth / 2;

  // Полоса из четырёхугольников: по два кольца вершин, внутреннее и внешнее.
  const pos = new Float32Array(SEGMENTS * 2 * 3);
  const idx = new Uint16Array(SEGMENTS * 6);
  // Углы считаются один раз — синус и косинус в кадре нам ни к чему.
  const cosA = new Float32Array(SEGMENTS);
  const sinA = new Float32Array(SEGMENTS);
  for (let i = 0; i < SEGMENTS; i += 1) {
    const a = (i / SEGMENTS) * Math.PI * 2;
    cosA[i] = Math.cos(a);
    sinA[i] = Math.sin(a);
    const j = (i + 1) % SEGMENTS;
    const o = i * 6;
    idx[o] = i * 2; idx[o + 1] = i * 2 + 1; idx[o + 2] = j * 2 + 1;
    idx[o + 3] = i * 2; idx[o + 4] = j * 2 + 1; idx[o + 5] = j * 2;
  }
  for (let i = 0; i < SEGMENTS * 2; i += 1) pos[i * 3 + 1] = topY + S.lineY;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  // Отсечение по объёму отключено: радиус меняется каждый кадр, и пересчитывать
  // шар ради предмета, который и так всегда в кадре, незачем.
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

  const mat = new THREE.MeshBasicMaterial({
    color: MATERIALS.rim.color,
    transparent: true,
    opacity: S.lineOpacity,
    depthWrite: false,          // лежит на полу, не спорит с ним за глубину
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;         // поверх плиты, под телами
  mesh.visible = false;
  mesh.frustumCulled = false;

  let reduced = false;

  /** Переписать кольцо под радиус `r`. Толщина при этом не меняется. */
  const set = (r) => {
    const inner = Math.max(0.01, r - half);
    const outer = r + half;
    for (let i = 0; i < SEGMENTS; i += 1) {
      const c = cosA[i];
      const s = sinA[i];
      const a = i * 6;
      pos[a] = c * inner; pos[a + 2] = s * inner;
      pos[a + 3] = c * outer; pos[a + 5] = s * outer;
    }
    geo.attributes.position.needsUpdate = true;
  };

  /**
   * Дыхание контура. ⚠️ Гасится при системной настройке «уменьшить движение» —
   * но САМО СУЖЕНИЕ не гасится ничем: это правило матча, а не украшение.
   */
  const tick = (t) => {
    if (!mesh.visible) return;
    mat.opacity = reduced
      ? S.lineOpacity
      : S.lineOpacity * (1 - S.pulseAmp + S.pulseAmp * (0.5 + 0.5 * Math.sin((t / S.pulseSec) * Math.PI * 2)));
  };

  return {
    mesh,
    set,
    tick,
    setVisible: (v) => { mesh.visible = !!v; },
    setReducedMotion: (v) => { reduced = !!v; if (v) mat.opacity = S.lineOpacity; },
    dispose: () => { geo.dispose(); mat.dispose(); },
  };
}
