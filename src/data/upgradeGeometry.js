/* HEXLASH — экран прокачки · ГЕОМЕТРИЯ (pure).
   Перенос 1:1 из upgrade_handoff/data.js (геометрический блок). Чистые функции —
   ничего не мутируют, переносятся как есть. Возвращают строки SVG (рендерятся
   через v-html — источник доверенный, пользовательского ввода нет). */

/* pointy-top hexagon — точки вокруг (cx,cy), радиус r */
export function hexPts(cx, cy, r) {
  const k = 0.8660254; // cos30
  return [
    [cx, cy - r],
    [cx + r * k, cy - r / 2],
    [cx + r * k, cy + r / 2],
    [cx, cy + r],
    [cx - r * k, cy + r / 2],
    [cx - r * k, cy - r / 2],
  ].map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
}

/* внутренний рисунок ядра — каждое ядро отличается СИЛУЭТОМ граней.
   бокс 200x200, внешний гекс r=78 @ (100,100). */
const FACETS = {
  // Натиск — сходящиеся вперёд шевроны (давление в точку)
  natisk: `
    <polyline class="facet" points="56,150 100,108 144,150"/>
    <polyline class="facet" points="62,128 100,92 138,128"/>
    <polyline class="facet" points="70,104 100,78 130,104"/>
    <line class="facet" x1="100" y1="78" x2="100" y2="150"/>`,
  // Налётчик — диагональные росчерки (налёт и отрыв)
  nalet: `
    <line class="facet" x1="58" y1="138" x2="132" y2="64"/>
    <line class="facet" x1="74" y1="150" x2="148" y2="76"/>
    <line class="facet" x1="52" y1="118" x2="116" y2="54"/>`,
  // Скала — концентрические слои (выдержка / помол)
  skala: `
    <polygon class="facet" points="__H56__"/>
    <polygon class="facet" points="__H34__"/>`,
  // Засада — свёрнутое ядро, утопленная точка-расплата
  zasada: `
    <polygon class="facet" points="__H44__"/>
    <path class="facet" d="M100,72 L124,100 L100,128 L84,108"/>
    <circle class="seed" cx="100" cy="100" r="5"/>`,
};

/* Внутренний рисунок ядра БЕЗ обёртки — подставленные шестиугольники.
   Вынесено отдельной функцией, чтобы знак манеры можно было взять в другую
   фигуру (превью новой формы ядра, /dev/core), НЕ копируя координаты: копия
   рисунка — это ровно то, как в проекте однажды оказалось два разных логотипа.
   coreSVG ниже зовёт её же, поведение прежнее. Бокс тот же: 200×200, внешний
   гекс r=78 @ (100,100). */
export function coreFacets(kind) {
  return (FACETS[kind] || '')
    .replace('__H56__', hexPts(100, 100, 56))
    .replace('__H44__', hexPts(100, 100, 44))
    .replace('__H34__', hexPts(100, 100, 34));
}

/* SVG ядра — центральный объект, единственное свечение экрана */
export function coreSVG(kind, { seed = false } = {}) {
  const inner = coreFacets(kind);
  const seedDot = seed ? `<circle class="seed" cx="100" cy="100" r="6"/>` : '';
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <polygon class="hex-line" points="${hexPts(100, 100, 78)}"/>
    ${inner}${seedDot}
  </svg>`;
}

/* Высота гекса кристалла в его системе координат: r=42 @ (50,50) → y ∈ [8, 92].
   Нужна снаружи: доля зажжённых граней превращается в сдвиг маски. */
export const SHARD_SPAN = 84;

/* малый гекс кристалла — заполнение снизу по доле зажжённых граней.
   uid — уникальный ключ для <clipPath> (id кристалла, чтобы id были уникальны).

   ⚠️ РИСУНОК НЕ ЗАВИСИТ ОТ ДОЛИ. Раньше доля вжигалась прямо в координаты
   прямоугольника-маски, и каждое изменение перерисовывало всю картинку через
   v-html: узлы заменялись новыми, любой переход обрывался, и уровень щёлкал.
   Теперь строка постоянная, а доля приходит переменной --shard-y (сдвиг маски
   вниз в единицах рисунка) — её ставит родитель, и CSS доводит её плавно. */
export function shardSVG(uid = '0') {
  const pts = hexPts(50, 50, 42);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><clipPath id="sh-${uid}"><rect class="mask" x="0" y="8" width="100" height="${SHARD_SPAN}"/></clipPath></defs>
    <polygon class="fill" points="${pts}"/>
    <polygon class="lit"  points="${pts}" clip-path="url(#sh-${uid})"/>
    <polygon class="hex-line" points="${pts}"/>
  </svg>`;
}

/** Сдвиг маски кристалла вниз для доли зажжённых граней: 0 — пусто, 1 — полно. */
export function shardFillY(litRatio = 0) {
  const r = Math.max(0, Math.min(1, litRatio));
  return +((1 - r) * SHARD_SPAN).toFixed(2);
}

/* гекс грани (узел прокачки).

   Три слоя вместо прежних двух:
     .fl   — заливка, ОБРЕЗАННАЯ прямоугольником-маской: он стоит снизу и
             уходит вверх, поэтому цвет втекает в гекс снизу, а не проявляется
             целиком. Движение маски задаёт таблица стилей (ForgeTree.vue);
     .fx   — слой вспышки: тот же гекс, лежит поверх заливки и в покое
             прозрачен. Короткий всплеск в конце налива — это он;
     .ln   — линия гекса, как была.

   uid — уникальный ключ <clipPath>. ⚠️ Обязателен и обязан быть уникальным на
   всю страницу: один и тот же id на нескольких гранях означает, что браузер
   подставит первую попавшуюся маску и нальются чужие грани. Ровно так однажды
   разъехались градиенты ядра. Номер грани для этого не годится — он идёт 1..5
   внутри ветки и повторяется у всех веток; звать надо с ядром и кристаллом. */
export function faceHex(uid = '0') {
  const pts = hexPts(50, 50, 40);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><clipPath id="fh-${uid}"><rect class="mask" x="0" y="10" width="100" height="80"/></clipPath></defs>
    <polygon class="fl" points="${pts}" clip-path="url(#fh-${uid})"/>
    <polygon class="fx" points="${pts}"/>
    <polygon class="ln" points="${pts}"/>
  </svg>`;
}

/* раскладка N кристаллов по кругу радиусом r, старт сверху */
export function radial(n, radius) {
  const out = [];
  const start = -90;
  for (let i = 0; i < n; i++) {
    const a = ((start + (i * 360) / n) * Math.PI) / 180;
    out.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius });
  }
  return out;
}
