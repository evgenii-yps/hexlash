/* ============================================================
   HEXLASH — экран прокачки · ДАННЫЕ + ГЕОМЕТРИЯ
   ------------------------------------------------------------
   Чистые функции (переносятся в Vue 1:1) + контент-ЗАГЛУШКИ.
   Имена ядер/кристаллов/граней, числа и лимиты — РАБОЧИЕ,
   их правит геймдизайн. Здесь — оболочка под порт.
   ============================================================ */

/* ---------- ГЕОМЕТРИЯ (pure · переносится как есть) ---------- */

/* pointy-top hexagon — точки вокруг (cx,cy), радиус r */
function hexPts(cx, cy, r){
  const k = 0.8660254; // cos30
  return [
    [cx, cy - r],
    [cx + r*k, cy - r/2],
    [cx + r*k, cy + r/2],
    [cx, cy + r],
    [cx - r*k, cy + r/2],
    [cx - r*k, cy - r/2]
  ].map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
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
    <circle class="seed" cx="100" cy="100" r="5"/>`
};

/* SVG ядра — центральный объект, единственное свечение экрана */
function coreSVG(kind, {seed=false}={}){
  let inner = FACETS[kind] || '';
  inner = inner.replace('__H56__', hexPts(100,100,56))
               .replace('__H44__', hexPts(100,100,44))
               .replace('__H34__', hexPts(100,100,34));
  const seedDot = seed ? `<circle class="seed" cx="100" cy="100" r="6"/>` : '';
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <polygon class="hex-line" points="${hexPts(100,100,78)}"/>
    ${inner}${seedDot}
  </svg>`;
}

/* малый гекс кристалла — заполнение снизу по доле зажжённых граней.
   uid — уникальный ключ для <clipPath> (в Vue: id кристалла). */
function shardSVG(litRatio=0, uid='0'){
  const pts = hexPts(50,50,42);
  const top = 8, span = 84;                 // гекс r=42 @50,50 → y∈[8,92]
  const y = (92 - span*Math.max(0,Math.min(1,litRatio))).toFixed(1);
  const h = (span*Math.max(0,Math.min(1,litRatio))).toFixed(1);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><clipPath id="sh-${uid}"><rect x="0" y="${y}" width="100" height="${h}"/></clipPath></defs>
    <polygon class="fill" points="${pts}"/>
    <polygon class="lit"  points="${pts}" clip-path="url(#sh-${uid})"/>
    <polygon class="hex-line" points="${pts}"/>
  </svg>`;
}

/* гекс грани (узел прокачки) */
function faceHex(){
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <polygon class="fl" points="${hexPts(50,50,40)}"/>
    <polygon class="ln" points="${hexPts(50,50,40)}"/>
  </svg>`;
}

/* раскладка N кристаллов по кругу радиусом r, старт сверху */
function radial(n, radius){
  const out = []; const start = -90;
  for(let i=0;i<n;i++){
    const a = (start + i*360/n) * Math.PI/180;
    out.push({ x: Math.cos(a)*radius, y: Math.sin(a)*radius });
  }
  return out;
}

/* ---------- КОНТЕНТ (ЗАГЛУШКИ · правит геймдизайн) ---------- */

/* RESOURCE — общий пул очков ядра. Делится между всеми кристаллами. */
const RESOURCE = 5;

/* Четыре ядра. id уходят в стор Vue — НЕ МЕНЯТЬ.
   hue — основной цвет ядра (в него темится весь экран через --core).
   sup — поддерживающий тон (нижний слой свечения, внутренний рисунок). */
const CORES = [
  { id:'natisk', ix:'01', name:'Натиск',   hue:'#FF3344', sup:'#FF7A3D',
    manner:'Прёт и давит вплотную — не отпускает дистанцию.' },
  { id:'nalet',  ix:'02', name:'Налётчик', hue:'#FFA526', sup:'#FFD93D',
    manner:'Налетает и уходит — серия касаний, разрыв, снова.' },
  { id:'skala',  ix:'03', name:'Скала',    hue:'#2ED6B0', sup:'#5DD6E6',
    manner:'Терпит и перемалывает — держит удар, отдаёт позже.' },
  { id:'zasada', ix:'04', name:'Засада',   hue:'#9461FF', sup:'#D461FF',
    manner:'Выжидает и наказывает — тишина, затем один удар.' }
];

/* грань: { id, name, state }   state ∈ 'lit' | 'open' | 'locked'  — НЕ МЕНЯТЬ имена */
function mkFaces(states){
  return states.map((s,i)=>({ id:i+1, name:'Грань '+String(i+1).padStart(2,'0'), state:s }));
}

/* CRYSTALS[coreId] = [{ id, name, limit, faces:[...] }]
   limit — личный потолок кристалла (сколько граней он вообще даст зажечь).
   Двойной ограничитель: limit кристалла + общий RESOURCE ядра. */
const CRYSTALS = {
  natisk:[
    { id:'a', name:'Напор',  limit:3, faces:mkFaces(['lit','lit','open','open','locked']) },
    { id:'b', name:'Захват', limit:2, faces:mkFaces(['lit','open','open','locked']) },
    { id:'c', name:'Темп',   limit:3, faces:mkFaces(['open','open','open','locked','locked']) }
  ],
  nalet:[
    { id:'a', name:'Налёт',   limit:3, faces:mkFaces(['lit','open','open','open','locked']) },
    { id:'b', name:'Отрыв',   limit:2, faces:mkFaces(['lit','lit','open','locked']) },
    { id:'c', name:'Финт',    limit:2, faces:mkFaces(['open','open','open','locked']) },
    { id:'d', name:'Касание', limit:3, faces:mkFaces(['open','open','locked','locked']) }
  ],
  skala:[
    { id:'a', name:'Корка', limit:3, faces:mkFaces(['lit','lit','open','open','locked']) },
    { id:'b', name:'Помол', limit:2, faces:mkFaces(['lit','open','open','locked']) },
    { id:'c', name:'Опора', limit:3, faces:mkFaces(['open','open','open','locked','locked']) }
  ],
  zasada:[
    { id:'a', name:'Тишина',   limit:2, faces:mkFaces(['lit','open','open','locked']) },
    { id:'b', name:'Капкан',   limit:3, faces:mkFaces(['lit','open','open','open','locked']) },
    { id:'c', name:'Расплата', limit:2, faces:mkFaces(['open','open','locked']) }
  ]
};
