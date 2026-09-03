// Задник зала — тёмный купол вокруг сцены, один на все залы.
//
// Раньше это был один и тот же код, скопированный в три файла (HomeScene,
// PveScene, SpaceScene) и уже разошедшийся: у Дома купол умел смещаться по Z и
// возвращал mesh с центром коридора, у Арены и Космоса — нет; у Дома и Кузницы
// тянулись за собой ещё два помощника, которые НИЧЕГО НЕ РИСОВАЛИ.
//
// Что удалено вместе с копиями:
//   • drawHexWeave + strokeHex — шестиугольная сетка на куполе. Оба зала держали
//     hexMaxAlpha: 0, то есть альфа каждого штриха выходила нулевой и цикл всегда
//     срывался на `continue`. Функции проходили по 60 колонкам × ~70 рядам и не
//     оставляли ни одного пикселя.
//   • dither — зерно против полос в градиенте. Оба зала держали dither: 0, ветка
//     `if (o.dither > 0)` не исполнялась ни разу.
// Если сетка или зерно понадобятся — они возвращаются сюда, в одно место, и
// описываются в Документе А, а не заводятся заново в каждом зале.
import * as THREE from 'three';

// Вертикальный градиент купола. Числа одни и те же во всех трёх залах — они и
// были одинаковыми, просто лежали в трёх местах.
//
// Верхний полюс РАВЕН --void (#08080A) и тону тумана (FOG_COLOR): передний план
// уходит в туман, туман встречается с куполом, и стык не виден. Раньше здесь
// стояло #060710 с подписью «≈ цвет тумана» — «примерно» и есть шов.
// Нижний полюс тёплый намеренно: это отсвет ламп на полу зала.
export const BACKDROP_GRAD = [
  [0.00, '#08080A'], // верхний полюс — = --void, = туман
  [0.42, '#0A0A12'], // верх кадра — почти чёрный
  [0.62, '#120F0C'], // переход в тёплое (семейство ламп)
  [1.00, '#1B150D'], // нижний полюс — тёмное тёплое
];

export const BACKDROP_TEX = { w: 1024, h: 1024 };

/**
 * Строит купол.
 * @param {{radius:number, centerY:number, centerZ?:number|null}} o геометрия зала
 * @param {number} [maxAniso] renderer.capabilities.getMaxAnisotropy()
 * @returns {{mesh: THREE.Mesh, dispose: () => void}}
 */
export function buildBackdrop(o, maxAniso) {
  const c = document.createElement('canvas');
  c.width = BACKDROP_TEX.w;
  c.height = BACKDROP_TEX.h;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  for (const [stop, col] of BACKDROP_GRAD) g.addColorStop(stop, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;        // долгота смыкается без шва
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(4, maxAniso || 1);

  const geo = new THREE.SphereGeometry(o.radius, 48, 32);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, side: THREE.BackSide, fog: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, o.centerY, o.centerZ ?? 0);
  mesh.renderOrder = -10; // рисуется первым, за всем остальным

  const dispose = () => { geo.dispose(); mat.dispose(); tex.dispose(); };
  return { mesh, dispose };
}
