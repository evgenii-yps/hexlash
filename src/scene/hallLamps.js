// Лампы зала — тёплые светильники на тросах под потолком, одни на все залы.
//
// Раньше и таблица чисел, и код сборки лежали двумя копиями (HomeScene и
// PveScene). Числа совпадали до последней запятой; расходился только код: у
// Кузницы был hangLift (поднять светильники над бойцами) и зажим длины троса,
// у Дома — возврат bulbMat (чтобы гасить лампы, когда камера ушла из зала).
// Здесь взято и то и другое: hangLift по умолчанию 0 = поведение Дома один в
// один, bulbMat отдаётся всегда.
//
// Теней лампы не отбрасывают намеренно — это чистая заливка (shadowMap в проекте
// не включён нигде), поэтому четыре PointLight'а стоят дёшево и на телефоне.
import * as THREE from 'three';

export const LAMPS = {
  ceilingY: 7.3,        // Y крепления тросов — общий рычаг высоты всей люстры
  wire: 1.6,            // базовая длина троса (потолок → плафон); `drop` добавляет
  hangLift: 0,          // поднять плафоны+лампы+свет на столько (трос укорачивается)
  shadeRadius: 0.55,    // радиус раструба
  shadeHeight: 0.5,     // глубина раструба
  shadeColor: 0x161a24, // тёмная матовая оболочка (семейство арены)
  rodColor: 0x0c0f16,   // тонкий подвес
  rodRadius: 0.018,
  bulbRadius: 0.12,     // тёплый светящийся элемент внутри плафона
  bulbColor: 0xffb368,  // тёплый янтарь (НЕ розовый и не белый)
  bulbOpacity: 0.95,
  light: {
    color: 0xffb368,    // тот же янтарь, что и колба
    intensity: 16,      // намеренно тускло — зал тёмный
    distance: 18,       // радиус затухания
    decay: 2,           // физическое затухание
  },
  // Спокойный разброс над плитой (±3 X, ±2 Z); `drop` разнимает высоты подвеса.
  positions: [
    { x: -1.9, z: -0.5, drop: 0.0 },
    { x: 1.9, z: 0.5, drop: 0.7 },
    { x: 0.1, z: -1.5, drop: 0.3 },
    { x: -0.3, z: 1.4, drop: 1.0 },
  ],
  flicker: 0.05,        // мягкое дыхание яркости (0 = ровный свет)
  flickerSpeed: 1.3,
};

/**
 * Собирает люстру зала.
 * @param {typeof LAMPS} opts таблица чисел (обычно LAMPS или {...LAMPS, hangLift})
 * @param {boolean} reduced системное «уменьшить движение» ⇒ tick = null (свет ровный)
 * @returns {{group: THREE.Group, tick: ((t:number)=>void)|null, bulbMat: THREE.Material, dispose: () => void}}
 */
export function buildLamps(opts, reduced) {
  const group = new THREE.Group();
  const shadeGeo = new THREE.ConeGeometry(opts.shadeRadius, opts.shadeHeight, 16, 1, true);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: opts.shadeColor, flatShading: true, roughness: 0.9, metalness: 0.2, side: THREE.DoubleSide,
  });
  const rodMat = new THREE.MeshBasicMaterial({ color: opts.rodColor });
  const bulbGeo = new THREE.SphereGeometry(opts.bulbRadius, 10, 8);
  const bulbMat = new THREE.MeshBasicMaterial({
    color: opts.bulbColor, transparent: true, opacity: opts.bulbOpacity, fog: false,
  });
  const rodGeos = [];   // по одному на лампу (длина зависит от drop)
  const lights = [];    // { light, base, phase }

  opts.positions.forEach((pos, i) => {
    const shadeTopY = opts.ceilingY - opts.wire - (pos.drop || 0) + (opts.hangLift || 0);

    // раструб — вершиной вверх на shadeTopY, широким краем вниз
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(pos.x, shadeTopY - opts.shadeHeight / 2, pos.z);
    group.add(shade);

    // трос — потолок → вершина раструба
    const rodLen = Math.max(0.05, opts.ceilingY - shadeTopY);
    const rodGeo = new THREE.CylinderGeometry(opts.rodRadius, opts.rodRadius, rodLen, 6);
    rodGeos.push(rodGeo);
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(pos.x, shadeTopY + rodLen / 2, pos.z);
    group.add(rod);

    // колба внутри раструба
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(pos.x, shadeTopY - opts.shadeHeight * 0.75, pos.z);
    group.add(bulb);

    // настоящий тёплый свет — мягкое пятно на плите и бойце
    const light = new THREE.PointLight(opts.light.color, opts.light.intensity, opts.light.distance, opts.light.decay);
    light.position.set(pos.x, shadeTopY - opts.shadeHeight, pos.z);
    group.add(light);
    lights.push({ light, base: opts.light.intensity, phase: i * 1.7 });
  });

  const tick = reduced ? null : (t) => {
    for (const l of lights) {
      l.light.intensity = l.base * (1 - opts.flicker * 0.5 + opts.flicker * 0.5 * Math.sin(t * opts.flickerSpeed + l.phase));
    }
  };

  const dispose = () => {
    shadeGeo.dispose();
    bulbGeo.dispose();
    shadeMat.dispose();
    rodMat.dispose();
    bulbMat.dispose();
    rodGeos.forEach((g) => g.dispose());
  };

  // bulbMat отдаётся наружу, чтобы зал мог погасить колбы, когда камера ушла
  // (см. applyHomeGlowGate в HomeScene).
  return { group, tick, bulbMat, dispose };
}
