// soonWord.js — объёмное слово SOON, парящее над плитой закрытого острова.
//
// ⚠️ ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. Слово SOON в зале раньше было гравировкой на полу
//    (плоская плоскость с холстом), потом её сняли. Теперь нужно слово ОБЪЁМНОЕ и
//    висящее в воздухе, а гравировка так не умеет. Шрифтового загрузчика в
//    проекте нет (см. GLYPHS в transitionFlight.js и PLAQUE в gateFightPlaque.js),
//    поэтому буквы нарисованы руками контуром и выдавлены — тем же способом, что
//    вывеска HEXLASH.
//
// ⚠️ ТРЕТЬЯ КОПИЯ БУКВЫ S — НАМЕРЕННО. Такая же S уже нарисована в вывеске
//    HEXLASH. Алфавит не общий по той же причине, что описана в gateFightPlaque.js:
//    вывеска — частная таблица режиссёра пролёта, и связывать закрытую дверь острова
//    с ней значило бы, что правка вывески молча меняет эту дверь.
//
// Что это за объект — по правилам владельца (ТЗ 29.09.2026):
//   · МАТОВЫЙ, без свечения: розовое свечение принадлежит только моменту
//     срабатывания, а закрытая дверь не срабатывает. Свет зала он не использует
//     (маткап, см. ниже), поэтому с любой стороны оборота выглядит одинаково;
//   · цвет — токен `--ink-off` (#5D5D66), тот же, что у косых печатей SOON в
//     интерфейсе. Читается из стилей лениво, запасного числа нет: второе
//     объявление цвета — ровно то, из-за чего когда-то разъехались тона ядер;
//   · НЕ ДВИЖЕТСЯ: ни качания, ни вращения, ни пульсации. Единственное, что
//     слово делает, — разворачивается лицом к камере (см. faceCamera). Это не
//     собственное движение, а условие читаемости: слово стоит на месте, меняется
//     только сторона, которой оно повёрнуто к зрителю;
//   · НЕ ЛОВИТ НАЖАТИЙ: в списки предметов зала оно не входит и ничего не
//     запускает. Нажатие в него зал относит к глухой зоне острова (PveScene:
//     sparDead) — оно не делает ничего, а не «проваливается» на пол или в пустоту.
//
// Координаты букв: [x, y], y = 0 — базовая линия, y = 1 — линия прописных.
//
// Экспортирует: SOON_WORD (настройки), buildSoonWord.
import * as THREE from 'three';

// ───────────────────────────── Настройки ─────────────────────────────
export const SOON_WORD = {
  // Толщина выдавливания в долях высоты буквы. Слово должно читаться ОБЪЁМНЫМ, но
  // не бруском: 0.28 даёт видимую боковую грань с камеры зала и не превращает
  // тонкие штрихи в глыбу.
  depth: 0.28,
  // Скос по краю в долях высоты буквы: одна грань ловит один блик по кромке.
  // Столько же, сколько у вывески HEXLASH (≈1% прописной).
  bevel: 0.012,
  // Расстояние между буквами, в долях высоты.
  track: 0.085,
  // ⚠️ ВЫСОТА ПАРЕНИЯ — ПОЛОВИНА ВЫСОТЫ БУКВ (ТЗ 29.09.2026): низ букв стоит над
  //    плитой на полвысоты слова. Доля, а не мировое число: размер слова берётся
  //    от плиты, и число, закреплённое отдельно, уехало бы с ней.
  liftOfHeight: 0.5,
};

// Азбука — только то, из чего сложено SOON. Незнакомая буква — громкая ошибка, а
// не пустое место в слове.
const GLYPHS = {
  S: { w: 0.58, out: [[0, 0], [0.58, 0], [0.58, 0.58], [0.19, 0.58], [0.19, 0.81], [0.58, 0.81], [0.58, 1], [0, 1], [0, 0.42], [0.39, 0.42], [0.39, 0.19], [0, 0.19]] },
  // Огранённая O: срезанные углы вместо дуги («в огранённом мире дуги не живут»).
  O: {
    w: 0.6,
    out: [[0.14, 0], [0.46, 0], [0.6, 0.14], [0.6, 0.86], [0.46, 1], [0.14, 1], [0, 0.86], [0, 0.14]],
    holes: [[[0.19, 0.2], [0.41, 0.2], [0.41, 0.8], [0.19, 0.8]]],
  },
  N: { w: 0.62, out: [[0, 0], [0.19, 0], [0.19, 0.55], [0.43, 0], [0.62, 0], [0.62, 1], [0.43, 1], [0.43, 0.45], [0.19, 1], [0, 1]] },
};

let _ink = null;
function inkOff() {
  if (_ink) return _ink;
  const raw = typeof document === 'undefined' ? ''
    : getComputedStyle(document.documentElement).getPropertyValue('--ink-off').trim();
  if (!raw) throw new Error('[hexlash] токен --ink-off не прочитался из стилей (src/styles/tokens.css).');
  _ink = raw;
  return _ink;
}

function glyphShape(g) {
  const shape = new THREE.Shape();
  shape.moveTo(g.out[0][0], g.out[0][1]);
  for (let i = 1; i < g.out.length; i++) shape.lineTo(g.out[i][0], g.out[i][1]);
  shape.closePath();
  (g.holes || []).forEach((h) => {
    const path = new THREE.Path();
    path.moveTo(h[0][0], h[0][1]);
    for (let i = 1; i < h.length; i++) path.lineTo(h[i][0], h[i][1]);
    path.closePath();
    shape.holes.push(path);
  });
  return shape;
}

/**
 * Маткап: шар, освещённый спереди. Центр (грань смотрит в зрителя) = 1.0, то есть
 * лицо буквы остаётся ровно цветом материала; к краю темнеет, а низ темнее верха.
 * Строится один раз на слово и уходит вместе с ним.
 */
function makeMatcap() {
  const N = 64;
  const cv = document.createElement('canvas');
  cv.width = N; cv.height = N;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = ((x + 0.5) / N) * 2 - 1;
      const v = 1 - ((y + 0.5) / N) * 2;   // вверх — плюс
      const r2 = Math.min(1, u * u + v * v);
      const b = Math.max(0.3, 1 - 0.32 * r2 - (v < 0 ? 0.3 * -v * Math.sqrt(r2) : 0));
      const c = Math.round(255 * b);
      const i = (y * N + x) * 4;
      img.data[i] = c; img.data[i + 1] = c; img.data[i + 2] = c; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const _wp = new THREE.Vector3();

/**
 * Слово из выдавленных букв, стоящее в воздухе. Начало координат группы — центр
 * слова (по ширине, по высоте и по глубине), так что вызывающий ставит её одной
 * точкой.
 *
 * @param {string} text  только буквы азбуки выше
 * @param {number} width ширина всего слова в единицах мира
 * @returns {{ group: THREE.Group, height: number, lift: number, faceCamera: (camera: THREE.Camera) => void, dispose: () => void }}
 *   `height` — высота букв; `lift` — на сколько низ букв должен стоять над плитой.
 */
export function buildSoonWord(text, width) {
  const S = SOON_WORD;
  const chars = [...text.toUpperCase()];
  let em = 0;
  const items = chars.map((ch) => {
    const g = GLYPHS[ch];
    if (!g) throw new Error(`[hexlash] в слове SOON нет буквы «${ch}» (src/scene/soonWord.js).`);
    const it = { g, x: em };
    em += g.w + S.track;
    return it;
  });
  em -= S.track;                       // ширина слова в высотах букв
  const k = width / em;                // мировых единиц на одну высоту буквы
  const height = k;

  // ⚠️ МАТКАП, А НЕ СВЕТ ЗАЛА. Лампы зала стоят с одной стороны, и слово, всегда
  //    повёрнутое к камере, с противоположной стороны оборота уходило лицом в
  //    чёрное (снимки 30.09.2026: буквы почти неразличимы на фоне). Маткап красит
  //    по направлению грани к ЗРИТЕЛЮ, а не к лампам: лицо буквы всегда своего
  //    цвета (токен без искажений — тон-маппинг выключен), боковые грани и скосы
  //    темнее, верхние светлее — это и есть объём. Матово, ничего не светится.
  const matcap = makeMatcap();
  const mat = new THREE.MeshMatcapMaterial({
    color: new THREE.Color(inkOff()),
    matcap,
    flatShading: true,                 // огранённо, как всё в зале
    // ⚠️ БЕЗ ТУМАНА. Стоя на телефоне камера отходит от острова SPAR далеко (плита
    //    должна сесть в кадр целиком), и туман зала съедал слово почти дотла.
    fog: false,
    toneMapped: false,                 // лицо букв — ровно цвет токена
  });

  const group = new THREE.Group();
  const geos = [];
  for (const it of items) {
    const shape = glyphShape(it.g);
    shape.getPoints();                 // разрешить контур до экструзии
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: S.depth,
      bevelEnabled: true, bevelThickness: S.bevel, bevelSize: S.bevel, bevelSegments: 1,
      curveSegments: 1,
    });
    // Центр слова — в нуле: и по ширине, и по высоте, и по глубине.
    geo.translate(it.x - em / 2, -0.5, -S.depth / 2);
    geo.scale(k, k, k);
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    geos.push(geo);
  }

  /**
   * Развернуть слово лицом к камере вокруг вертикали. Только рыскание: буквы
   * остаются прямыми, а не заваливаются вместе с наклоном камеры. Собственного
   * движения у слова нет — от кадра к кадру меняется лишь то, чем оно повёрнуто.
   */
  function faceCamera(camera) {
    group.getWorldPosition(_wp);
    group.rotation.y = Math.atan2(camera.position.x - _wp.x, camera.position.z - _wp.z);
  }

  return {
    group,
    height,
    lift: height * S.liftOfHeight,
    faceCamera,
    dispose() { geos.forEach((g) => g.dispose()); mat.dispose(); matcap.dispose(); },
  };
}
