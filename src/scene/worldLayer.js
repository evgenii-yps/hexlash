// worldLayer.js — «живой ночной мир» вокруг дома игрока (ПРОБА, ТЗ 13.10.2026).
//
// Слой ничего не знает о доме и ничего в нём не правит: ему отдают готовую сцену
// и камеру, он кладёт в сцену ОДНУ группу `world` и сам её обслуживает. Убрать
// слой — снять группу; дом при этом остаётся ровно таким, каким был.
//
// Пять слоёв, каждый выключается отдельно (`setLayer`):
//   sea      — тёмное море под островом + полоса дымки у горизонта
//   ripple   — кольца ряби по тапу (живёт на море; без моря не видно)
//   clouds   — гранёные холодные облака, часть ниже острова
//   stars    — редкие приглушённые звёзды в верхней половине неба
//   islands  — 4 тёмных силуэта у горизонта
//
// Правила свечения (канон): розового в мире нет. Светятся только звёзды (и ядра
// бойцов — они дома, не здесь). Вода, облака, острова — матовые, без бликов.
//
// Туман. У дома свой туман (14…26 от камеры) — им ведёт режиссёр перелётов, и
// трогать его нельзя. Поэтому все материалы мира сделаны с `fog:false` и несут
// СВОЙ туман по расстоянию (`WORLD.fade`), иначе всё дальше 26 единиц пропало бы,
// и «горизонта» не было бы вовсе.
//
// Цены кадра: всё считается как чистая функция времени — на паузе стоит само.
// «Уменьшить движение»: волны и облака стоят, рябь не запускается.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ───────────────────────────── ручки (всё в одном месте) ─────────────────────────────
export const WORLD = {
  // Центр мира — под островом. Плита дома: верх 0.5, низ −0.5.
  centerX: 0,
  centerZ: 0,

  // Туман мира. Цвет дымки у горизонта — на полтона светлее --void, чтобы тёмные
  // силуэты островов читались НА чём-то. Оттенок остаётся внутри семьи VOID/PANEL.
  fade: { near: 34, far: 82, mist: 0x0e1016 },

  sea: {
    y: -4.2,           // уровень воды: остров висит над ней, форма не меняется
    rings: 38,         // колец полярной сетки (кольца расходятся гео-прогрессией)
    segs: 72,          // сегментов на кольцо
    rMin: 3.0,         // ближнее кольцо (под плитой всё равно не видно)
    rMax: 88,          // дальнее кольцо; за 82 от камеры вода уже вся дымка
    jitter: 0.32,      // доля шага сетки, на которую вершина сдвинута (низкополи, без «решётки»)
    bump: 0.2,         // статичный случайный рельеф вершин — даёт грани, не шум
    base: 0x090b11,    // тёмная вода (сине-чёрный, семья VOID)
    crest: 0x171c28,   // гребни — чуть светлее, но не светятся; тёмнее облаков (#1E1E24), чтобы облака читались
    light: [-0.55, 0.55, 0.62], // направление «на свет» — низкое, косое: наклон граней виден
    wave: [            // [амплитуда, kx, kz, скорость] — три медленные пологие волны
      [0.30, 0.21, 0.00, 0.55],
      [0.18, 0.33, 0.21, 0.80],
      [0.10, -0.47, 0.52, 1.05],
    ],
  },

  ripple: {
    max: 20,           // не больше одновременно; старые вытесняются
    life: 5.6,         // секунд до полного затухания
    speed: 1.7,        // скорость расхождения кольца, ед/с
    width: 0.42,       // полутолщина кольца в начале …
    widen: 0.55,       // … и прирост толщины за жизнь
    gain: 3.4,         // кольцо светлит воду на столько «разниц гребень−вода» (вода НЕ светится — только гребень)
    follow: 0.55,      // вторая, отстающая волна: доля яркости
    gap: 1.25,         // …и её отставание, ед
    tapPx: 6,          // тап = сдвиг не больше стольких пикселей
    tapMs: 600,        // …и не дольше стольких мс
    maxDist: 70,       // дальше — не пускаем (там всё равно дымка)
  },

  clouds: {
    count: 8,
    // [радиус от центра, высота, масштаб, фаза]. Первые четыре — НИЖЕ острова
    // (между ним и морем), остальные — на его уровне и выше, но далеко от оси
    // камеры дома (она не подходит ближе 12 единиц), чтобы облако не вставало
    // между камерой и бойцами.
    spots: [
      [20, -2.6, 1.0, 0.00],
      [31, -3.0, 1.4, 1.60],
      [24, -1.7, 0.9, 3.10],
      [44, -2.2, 1.7, 4.40],
      [27, 3.2, 1.0, 0.90],
      [38, 6.5, 1.6, 2.30],
      [52, 2.0, 2.0, 3.70],
      [34, 9.5, 1.3, 5.20],
    ],
    scale: 1.25,       // общий размер облака (в узком портрете крупное закрывает пол-экрана)
    scale: 1.2,        // общий размер облака (в узком портрете крупное закрывает пол-экрана)
    drift: 0.0042,     // рад/с вокруг центра — очень медленно
    bob: 0.35,         // покачивание по высоте
    dark: 0x151519,    // тень на гранях — не темнее воды вокруг
    light: 0x1e1e24,   // самая светлая точка облака — НЕ светлее #1E1E24 (канон)
    lightDir: [0.35, 0.85, 0.25],
  },

  stars: {
    count: 150,
    radius: 90,        // оболочка вокруг КАМЕРЫ (следует за ней — параллакса нет)
    minElev: 0.16,     // рад над горизонтом: только верхняя половина неба
    size: 2.3,         // px
    color: 0xcfccd3,   // --ink-soft, приглушённый белый
    minOpacity: 0.28,
    maxOpacity: 0.78,
  },

  islands: {
    // [угол°, расстояние, ширина, высота, фаза рельефа]
    // В портрете горизонтальный угол обзора всего ~20°, поэтому 8 единиц на 70 от камеры
    // уже треть ширины экрана: острова мелкие и низкие — намёк, не стена.
    spots: [
      [18, 62, 11, 5.0, 1],
      [96, 74, 15, 6.5, 2],
      [205, 56, 8, 3.8, 3],
      [292, 78, 17, 6.0, 4],
    ],
    // Свой, мягкий туман: силуэт «наполовину в дымке» (~55% на 70 единицах), а не
    // растворённый целиком — иначе контраст с горизонтом пропадает.
    fadeNear: 48,
    fadeFar: 125,
    dark: 0x07080c,    // силуэт темнее дымки (#0E1016), чтобы читаться НА ней, но не чёрной дырой
    light: 0x151720,
    lightDir: [-0.4, 0.8, 0.3],
  },

  haze: { radius: 86, height: 16, top: 0.0 }, // дымка у горизонта (полоса вокруг камеры мира)
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────────────── общий туман по расстоянию для «плоских» материалов ─────────────────────
// Клею к MeshBasicMaterial свой туман вместо сценового (см. шапку файла).
function withDistanceFade(mat, near = WORLD.fade.near, far = WORLD.fade.far) {
  mat.fog = false;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFadeNear = { value: near };
    shader.uniforms.uFadeFar = { value: far };
    // ⚠️ У MeshBasic туман подмешивается ПОСЛЕ colorspace_fragment, то есть уже в
    // sRGB: цвет дымки здесь нужен в кодировке sRGB, а не линейный (у воды, где
    // смешение идёт ДО перевода, он линейный — см. SEA_FRAG). Перепутаешь — дымка
    // выйдет почти чёрной, и острова станут дырами в небе.
    shader.uniforms.uMist = { value: new THREE.Color(WORLD.fade.mist).convertLinearToSRGB() };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vWDist;')
      .replace('#include <project_vertex>',
        '#include <project_vertex>\nvWDist = distance((modelMatrix * vec4(transformed, 1.0)).xyz, cameraPosition);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vWDist;\nuniform float uFadeNear;\nuniform float uFadeFar;\nuniform vec3 uMist;')
      .replace('#include <dithering_fragment>',
        'gl_FragColor.rgb = mix(gl_FragColor.rgb, uMist, smoothstep(uFadeNear, uFadeFar, vWDist));\n#include <dithering_fragment>');
  };
  return mat;
}

/** Покрасить плоские грани по направлению: тёмный → светлый. Возвращает геометрию без индекса. */
function paintFacets(geo, dark, light, lightDir) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals(); // без индекса → нормали по граням, то есть настоящая огранка
  const n = g.attributes.normal;
  const L = new THREE.Vector3(...lightDir).normalize();
  const cd = new THREE.Color(dark);
  const cl = new THREE.Color(light);
  const col = new Float32Array(n.count * 3);
  const c = new THREE.Color();
  const v = new THREE.Vector3();
  for (let i = 0; i < n.count; i++) {
    v.fromBufferAttribute(n, i);
    const k = THREE.MathUtils.clamp(v.dot(L) * 0.5 + 0.5, 0, 1);
    c.copy(cd).lerp(cl, k * k * (3 - 2 * k)); // светлее конечного нигде не бывает
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  return g;
}

// ───────────────────────────── море ─────────────────────────────
const SEA_VERT = /* glsl */`
  uniform float uTime;
  uniform vec4 uRip[${WORLD.ripple.max}];   // x, z (мир), t0, амплитуда
  uniform int uRipN;
  uniform vec4 uWave[3];   // амплитуда, kx, kz, скорость
  attribute float aBump;
  varying vec3 vW;
  void main() {
    vec3 p = position;
    vec2 wxz = (modelMatrix * vec4(p, 1.0)).xz;
    float h = aBump;
    for (int i = 0; i < 3; i++) {
      h += uWave[i].x * sin(p.x * uWave[i].y + p.z * uWave[i].z + uTime * uWave[i].w);
    }
    // Рябь поднимает воду плавно и широко: кольцо читается в основном фрагментом
    // (грани на удалении крупные и кольцо им не передать), здесь — лишь лёгкий горб.
    for (int i = 0; i < ${WORLD.ripple.max}; i++) {
      if (i >= uRipN) break;
      float age = uTime - uRip[i].z;
      float r = age * ${WORLD.ripple.speed.toFixed(3)};
      float d = distance(wxz, uRip[i].xy) - r;
      h += uRip[i].w * 0.16 * exp(-d * d * 0.9) * cos(d * 1.9);
    }
    p.y += h;
    vW = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  }
`;

const SEA_FRAG = /* glsl */`
  #include <common>
  #include <dithering_pars_fragment>
  uniform float uTime;
  uniform vec4 uRip[${WORLD.ripple.max}];
  uniform int uRipN;
  uniform float uGain;
  uniform vec3 uBase;
  uniform vec3 uCrest;
  uniform vec3 uMist;
  uniform vec3 uLight;
  uniform float uSeaY;
  uniform vec2 uFade;
  varying vec3 vW;
  void main() {
    // Грани: нормаль из производных положения — одна на треугольник, то есть огранка.
    vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
    if (n.y < 0.0) n = -n;
    float d = clamp(dot(n, uLight), 0.0, 1.0);
    float k = smoothstep(0.30, 0.95, d);                 // грань к свету светлее, грань от света — вода
    float hh = clamp((vW.y - uSeaY) * 1.4 + 0.5, 0.0, 1.0);
    vec3 col = mix(uBase, uCrest, clamp(k * 0.75 + hh * 0.25, 0.0, 1.0));

    // Кольца ряби: тонкий светлый гребень + отстающая вторая волна. Не свечение —
    // вода только чуть светлеет на гребне и тут же возвращается.
    float lift = 0.0;
    for (int i = 0; i < ${WORLD.ripple.max}; i++) {
      if (i >= uRipN) break;
      float age = uTime - uRip[i].z;
      float life = clamp(age / ${WORLD.ripple.life.toFixed(3)}, 0.0, 1.0);
      float fall = pow(1.0 - life, 1.15) * min(age * 4.0, 1.0) * uRip[i].w;
      float dist = distance(vW.xz, uRip[i].xy);
      float r = age * ${WORLD.ripple.speed.toFixed(3)};
      float w = ${WORLD.ripple.width.toFixed(3)} + life * ${WORLD.ripple.widen.toFixed(3)};
      float a = (dist - r) / w;
      float b = (dist - r + ${WORLD.ripple.gap.toFixed(3)}) / (w * 1.4);
      lift += fall * (exp(-a * a) + ${WORLD.ripple.follow.toFixed(3)} * exp(-b * b) * step(0.0, r - ${WORLD.ripple.gap.toFixed(3)}));
    }
    col += (uCrest - uBase) * lift * uGain;

    float dist = distance(vW, cameraPosition);
    col = mix(col, uMist, smoothstep(uFade.x, uFade.y, dist));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <dithering_fragment>
  }
`;

function buildSea(rng, reduced) {
  const S = WORLD.sea;
  const growth = Math.pow(S.rMax / S.rMin, 1 / (S.rings - 1));
  const ringCount = S.rings;
  const vertCount = ringCount * S.segs;
  const pos = new Float32Array(vertCount * 3);
  const bump = new Float32Array(vertCount);
  for (let i = 0; i < ringCount; i++) {
    const r = S.rMin * Math.pow(growth, i);
    const step = r * (growth - 1);
    const rot = (i % 2) * (Math.PI / S.segs);       // кольца сдвинуты через одно — треугольники «ёлочкой», не лучами
    for (let j = 0; j < S.segs; j++) {
      const a = (j / S.segs) * Math.PI * 2 + rot + (rng() - 0.5) * (Math.PI * 2 / S.segs) * S.jitter;
      const rr = r + (rng() - 0.5) * step * S.jitter * 2;
      const k = i * S.segs + j;
      pos[k * 3] = Math.cos(a) * rr;
      pos[k * 3 + 1] = 0;
      pos[k * 3 + 2] = Math.sin(a) * rr;
      // Статичный рельеф вершин нарастает с расстоянием: близкая вода спокойная,
      // дальняя огранена крупнее и читается как низкополи, а не как гладь.
      bump[k] = (rng() - 0.5) * 2 * S.bump * Math.min(1, 0.35 + i / (ringCount * 0.6));
    }
  }
  const idx = [];
  for (let i = 0; i < ringCount - 1; i++) {
    for (let j = 0; j < S.segs; j++) {
      const a = i * S.segs + j;
      const b = i * S.segs + ((j + 1) % S.segs);
      const c = (i + 1) * S.segs + j;
      const d = (i + 1) * S.segs + ((j + 1) % S.segs);
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aBump', new THREE.BufferAttribute(bump, 1));
  geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), S.rMax + 4);

  const rip = Array.from({ length: WORLD.ripple.max }, () => new THREE.Vector4(0, 0, -1e4, 0));
  const mat = new THREE.ShaderMaterial({
    vertexShader: SEA_VERT,
    fragmentShader: SEA_FRAG,
    side: THREE.DoubleSide, // обход сетки смотрит вниз: без этого вода отсекается целиком
    dithering: true,
    uniforms: {
      uTime: { value: 0 },
      uRip: { value: rip },
      uRipN: { value: 0 },
      uGain: { value: WORLD.ripple.gain },
      uWave: { value: S.wave.map((w) => new THREE.Vector4(...w)) },
      uBase: { value: new THREE.Color(S.base) },
      uCrest: { value: new THREE.Color(S.crest) },
      uMist: { value: new THREE.Color(WORLD.fade.mist) },
      uLight: { value: new THREE.Vector3(...S.light).normalize() },
      uSeaY: { value: S.y },
      uFade: { value: new THREE.Vector2(WORLD.fade.near, WORLD.fade.far) },
    },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(WORLD.centerX, S.y, WORLD.centerZ);
  mesh.frustumCulled = false;
  return { mesh, mat, rip, reduced };
}

// Дымка вокруг горизонта: полоса цвета дымки внизу (на уровне моря), прозрачная вверху.
function buildHaze() {
  const H = WORLD.haze;
  const geo = new THREE.CylinderGeometry(H.radius, H.radius, H.height, 64, 1, true);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 4);
  const c = new THREE.Color(WORLD.fade.mist);
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) + H.height / 2) / H.height; // 0 внизу … 1 вверху
    col[i * 4] = c.r; col[i * 4 + 1] = c.g; col[i * 4 + 2] = c.b;
    col[i * 4 + 3] = (1 - t) * (1 - t); // убывает к верху плавно
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 4));
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false, dithering: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(WORLD.centerX, WORLD.sea.y + H.height / 2, WORLD.centerZ);
  mesh.frustumCulled = false;
  mesh.renderOrder = -4;
  return { mesh, dispose: () => { geo.dispose(); mat.dispose(); } };
}

// ───────────────────────────── облака ─────────────────────────────
function buildClouds(rng) {
  const C = WORLD.clouds;
  const group = new THREE.Group();
  const clouds = [];
  const mat = withDistanceFade(new THREE.MeshBasicMaterial({ vertexColors: true }));
  const disposables = [mat];
  for (let i = 0; i < C.count; i++) {
    const [R, Y, S, ph] = C.spots[i % C.spots.length];
    const parts = [];
    const lumps = 4 + Math.floor(rng() * 3);
    for (let k = 0; k < lumps; k++) {
      const g = new THREE.IcosahedronGeometry(1, 0);
      const sx = (1.5 + rng() * 1.0) * S, sy = (0.7 + rng() * 0.45) * S, sz = (1.0 + rng() * 0.7) * S;
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3((k - (lumps - 1) / 2) * 1.6 * S + (rng() - 0.5) * S, (rng() - 0.3) * 0.5 * S, (rng() - 0.5) * 1.6 * S),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 3, rng() * 3, rng() * 3)),
        new THREE.Vector3(sx, sy, sz),
      );
      g.applyMatrix4(m);
      parts.push(paintFacets(g, C.dark, C.light, C.lightDir));
      g.dispose();
    }
    const geo = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(C.scale); // комки собраны мелко — общий масштаб одной ручкой
    mesh.frustumCulled = false;
    group.add(mesh);
    clouds.push({ mesh, R, Y, ph });
    disposables.push(geo);
  }
  const place = (t) => {
    for (const c of clouds) {
      const a = c.ph + t * C.drift;
      c.mesh.position.set(
        WORLD.centerX + Math.cos(a) * c.R,
        c.Y + Math.sin(t * 0.21 + c.ph * 2) * C.bob,
        WORLD.centerZ + Math.sin(a) * c.R,
      );
      c.mesh.rotation.y = -a; // вытянутой стороной вдоль дрейфа
    }
  };
  place(0);
  return { group, place, dispose: () => disposables.forEach((d) => d.dispose()) };
}

// ───────────────────────────── звёзды ─────────────────────────────
function makeDotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildStars(rng) {
  const S = WORLD.stars;
  const pos = new Float32Array(S.count * 3);
  const col = new Float32Array(S.count * 3);
  const base = new THREE.Color(S.color);
  for (let i = 0; i < S.count; i++) {
    // равномерно по высоте над горизонтом: sin(elev) от minElev…1 — звёзд у зенита не больше, чем у края
    const elev = Math.asin(THREE.MathUtils.lerp(Math.sin(S.minElev), 1, rng()));
    const az = rng() * Math.PI * 2;
    pos[i * 3] = Math.cos(elev) * Math.cos(az) * S.radius;
    pos[i * 3 + 1] = Math.sin(elev) * S.radius;
    pos[i * 3 + 2] = Math.cos(elev) * Math.sin(az) * S.radius;
    const o = THREE.MathUtils.lerp(S.minOpacity, S.maxOpacity, rng() * rng() * 1.6);
    col[i * 3] = base.r * o; col[i * 3 + 1] = base.g * o; col[i * 3 + 2] = base.b * o;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tex = makeDotTexture();
  const mat = new THREE.PointsMaterial({
    map: tex, vertexColors: true, size: S.size, sizeAttenuation: false, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = -9; // сразу за куполом; от воды и островов закрыты тестом глубины (оболочка r=90 < far=100)
  return { points, dispose: () => { geo.dispose(); mat.dispose(); tex.dispose(); } };
}

// ───────────────────────────── дальние острова ─────────────────────────────
function buildIslands(rng) {
  const I = WORLD.islands;
  const group = new THREE.Group();
  const mat = withDistanceFade(new THREE.MeshBasicMaterial({ vertexColors: true }), I.fadeNear, I.fadeFar);
  const disposables = [mat];
  for (const [deg, dist, w, h, seed] of I.spots) {
    const r2 = mulberry32(seed * 7919);
    const g = new THREE.IcosahedronGeometry(1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      // вершины на одном месте обязаны сдвинуться одинаково (иначе в сетке щели) — шум от позиции
      const q = Math.sin(v.x * 12.9898 + v.y * 78.233 + v.z * 37.719 + seed) * 43758.5453;
      const jit = 0.78 + (q - Math.floor(q)) * 0.44;
      v.multiplyScalar(jit);
      if (v.y < 0) v.y *= 0.4;               // подошва пологая
      p.setXYZ(i, v.x * w * 0.5, v.y * h, v.z * w * 0.38);
    }
    const geo = paintFacets(g, I.dark, I.light, I.lightDir);
    g.dispose();
    const mesh = new THREE.Mesh(geo, mat);
    const a = (deg * Math.PI) / 180;
    mesh.position.set(WORLD.centerX + Math.cos(a) * dist, WORLD.sea.y + h * 0.12, WORLD.centerZ + Math.sin(a) * dist);
    mesh.rotation.y = r2() * Math.PI * 2;
    mesh.frustumCulled = false;
    group.add(mesh);
    disposables.push(geo);
    rng(); // держим общий поток случайных одним числом на остров — порядок не зависит от числа слоёв
  }
  return { group, dispose: () => disposables.forEach((d) => d.dispose()) };
}

// ───────────────────────────── сборка ─────────────────────────────
/**
 * @param {{scene: THREE.Scene, camera: THREE.Camera, canvas: HTMLCanvasElement, reduced?: boolean}} o
 */
export function createWorld({ scene, camera, canvas, reduced = false }) {
  const rng = mulberry32(14102026);
  const group = new THREE.Group();
  group.name = 'world-layer';

  const sea = buildSea(rng, reduced);
  const haze = buildHaze();
  const clouds = buildClouds(rng);
  const stars = buildStars(rng);
  const islands = buildIslands(rng);

  // порядок не важен для глубины (всё с тестом глубины), важен лишь для прозрачной дымки
  group.add(sea.mesh, haze.mesh, clouds.group, stars.points, islands.group);
  scene.add(group);

  const layers = { sea: true, ripple: true, clouds: true, stars: true, islands: true };
  const apply = () => {
    sea.mesh.visible = layers.sea;
    haze.mesh.visible = layers.sea;
    clouds.group.visible = layers.clouds;
    stars.points.visible = layers.stars;
    islands.group.visible = layers.islands;
  };
  apply();

  // ── рябь ──
  const ripples = []; // { x, z, t0 } — кольцевой список, новые в конец
  let t0 = performance.now() / 1000;
  const clock = () => (performance.now() / 1000 - t0);
  const pushRipple = (x, z) => {
    if (reduced || !layers.ripple || !layers.sea) return false;
    ripples.push({ x, z, t0: clock() });
    while (ripples.length > WORLD.ripple.max) ripples.shift(); // вытеснение старых
    return true;
  };

  // ── тап ──
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WORLD.sea.y);
  const hit = new THREE.Vector3();
  let down = null;
  const lastTap = { x: 0, z: 0, ok: false, why: '' };

  /** Прямая точка → вода? Если на пути стоит дом/боец — это тап не по воде. */
  const waterPoint = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return null; // луч смотрит выше горизонта
    const dWater = ray.ray.origin.distanceTo(hit);
    if (dWater > WORLD.ripple.maxDist) return null;
    const objs = [];
    for (const ch of scene.children) if (ch !== group) objs.push(ch);
    // Облака и дальние острова мира тоже стоят между камерой и водой: тап по ним — не тап
    // по воде (кольцо всё равно спряталось бы за ними). Море, дымка и звёзды — нет.
    if (layers.clouds) objs.push(clouds.group);
    if (layers.islands) objs.push(islands.group);
    const hits = ray.intersectObjects(objs, true);
    for (const h of hits) {
      const o = h.object;
      if (!o.visible || o.isSprite || o.isPoints || o.isLine) continue;
      const m = o.material;
      if (!m || m.visible === false || m.side === THREE.BackSide) continue; // купол, невидимые коробки выбора
      if (h.distance < dWater) return null; // дом или боец ближе воды — тап им
    }
    return hit.clone();
  };

  const onDown = (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; };
  const onUp = (e) => {
    if (!down || e.pointerId !== down.id) return;
    const d = down; down = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > WORLD.ripple.tapPx) return; // это был поворот камеры
    if (performance.now() - d.t > WORLD.ripple.tapMs) return;
    if (!layers.ripple || !layers.sea || reduced) { lastTap.ok = false; lastTap.why = 'off'; return; }
    const p = waterPoint(e.clientX, e.clientY);
    if (!p) { lastTap.ok = false; lastTap.why = 'not-water'; return; }
    pushRipple(p.x, p.z);
    lastTap.ok = true; lastTap.x = p.x; lastTap.z = p.z; lastTap.why = '';
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { down = null; });

  // ── кадр ──
  const u = sea.mat.uniforms;
  const tick = () => {
    const t = clock();
    const tw = reduced ? 0 : t; // «уменьшить движение»: время стоит, рябь не бывает вовсе
    if (layers.sea) {
      u.uTime.value = tw;
      // Живые кольца: только не старше жизни. Список отрезаем с головы.
      while (ripples.length && t - ripples[0].t0 > WORLD.ripple.life) ripples.shift();
      for (let i = 0; i < ripples.length; i++) sea.rip[i].set(ripples[i].x, ripples[i].z, ripples[i].t0, 1);
      u.uRipN.value = ripples.length;
    }
    if (layers.clouds) clouds.place(tw);
    if (layers.stars) stars.points.position.copy(camera.position);
  };

  const dispose = () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp);
    scene.remove(group);
    sea.mesh.geometry.dispose(); sea.mat.dispose();
    haze.dispose(); clouds.dispose(); stars.dispose(); islands.dispose();
  };

  return {
    group,
    layers,
    setLayer(name, on) { if (name in layers) { layers[name] = !!on; apply(); } },
    tick,
    /** Служебное: пустить кольцо в мировую точку (приёмка без мыши). */
    rippleAt: (x, z) => pushRipple(x, z),
    waterPoint,
    get rippleCount() { return ripples.length; },
    get lastTap() { return lastTap; },
    dispose,
    stats() {
      const tri = (g) => { let n = 0; g.traverse((o) => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return Math.round(n); };
      return {
        sea: tri(sea.mesh), haze: tri(haze.mesh), clouds: tri(clouds.group), islands: tri(islands.group),
        stars: stars.points.geometry.attributes.position.count,
      };
    },
  };
}
