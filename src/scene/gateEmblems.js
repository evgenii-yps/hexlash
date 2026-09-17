// gateEmblems.js — ОБЪЁМНЫЕ ЭМБЛЕМЫ ПЯТИ ОСТРОВОВ РЕЖИМА.
//
// До них остров режима отличался от соседнего только подписью и цветом ядра, и
// игрок читал ворота словами. Эмблема отвечает на «что тут за бой» раньше, чем
// подпись: две фигуры через разлом — это поединок, шесть — команда на команду,
// цепь — череда боёв, большой с гребнем среди четверых — налёт на вожака, кольцо
// осколков — выбывание.
//
// ГЕОМЕТРИЯ ФИГУРЫ ОДНА НА ВСЕ ЭМБЛЕМЫ — та самая, что стоит кольцом учеников на
// острове FORGE дома (figureGeometry из modePlates). Не похожая, а буквально та
// же: тринадцать силуэтов в воротах делят один буфер. Вторая такая же фигура,
// нарисованная здесь, означала бы, что человек в игре может выглядеть двумя
// разными способами — и разойдётся на первой же правке пропорций.
//
// ⚠️ buildFighter рядом с плитами ЗАПРЕЩЁН (ТЗ). Он несёт суставы, привод
// анимации и табличку жизней; тринадцать таких конструкций на витрине, мимо
// которой пролетают, — это телефон на коленях.
//
// РАЗЛОМ ТОЖЕ НЕ СВОЙ. Ломаная лента разлома у DUEL и SQUAD собрана общей
// фабрикой riftRibbons — той, которой рвётся земля на острове ARENA дома. Числа
// (узкий, короткий) и цвет (свой у каждого режима) здесь свои, построение общее.
//
// ОДНО СВЕЧЕНИЕ НА ЭМБЛЕМУ, И ОНО ЗАМЕЩАЕТ ЯДРО ОСТРОВА, А НЕ ДОБАВЛЯЕТСЯ К
// НЕМУ. До эмблем цвет режима нёс плоский диск в крышке плиты; теперь его несёт
// сама эмблема — разлом, внутренняя грань звена, гребень вожака, кристалл. Диск
// при этом снимается (см. gatePlates): два светящихся пятна на одном острове —
// это два акцента, а в игре акцент на предмете один.
//
// Яркость свечения в покое и под курсором — ТЕ ЖЕ ЧИСЛА, что были у диска
// (GATE_PLATES.coreDim / coreLitBoost), и приходят они сюда оттуда же. Поведение
// острова в покое и под курсором обязано остаться прежним: менялась картинка, не
// отклик.
//
// ДВИЖЕНИЕ — ОДНО НА ЭМБЛЕМУ, медленное, без пульсации яркости (пульсирующий
// свет на витрине из пяти предметов читается как авария, а не как жизнь). При
// «уменьшить движение» эмблема стоит.
//
// Экспортирует: GATE_EMBLEMS (настройки), buildGateEmblem.
import * as THREE from 'three';
import { figureGeometry, FIGURE_H, riftRibbons } from './modePlates.js';
import { makeHaloBandTexture } from './arenaTextures.js';

// ───────────────────────────── Настройки ─────────────────────────────
export const GATE_EMBLEMS = {
  // ВЫСОТА КОМПОЗИЦИИ — доля ШИРИНЫ плиты. Потолок из ТЗ — 0.6, начинать велено
  // с 0.45 и поднимать, только пока держатся условия §5. Для сравнения: на
  // острове дома гексарх с постаментом занимает 0.57 ширины своей плиты, а пара
  // перчаток — 0.37. То есть 0.45 — ровно середина принятого в мире диапазона.
  height: 0.45,

  // Тон один на все эмблемы — тот, которым на острове FORGE дома написан
  // гексарх. Тон его учеников (0x2b3446) здесь не годится, и это замер, а не
  // вкус: плита ворот темнее домашней (0x10131f против 0x14182a), а свет падает
  // сверху, поэтому вертикальные грани фигуры не получают почти ничего. На
  // тёмном тоне фигура в кадре ворот выходила чёрной чёрточкой.
  //
  // Второго тона — «вожак светлее своих» — здесь нет намеренно: вожака метит
  // рост и гребень, а лишний тон стоил бы второго вызова отрисовки на пятерых.
  body: 0x4a5a78,
  roughness: 0.88,
  metalness: 0.1,

  // Свечение. Числа приходят от островов (GATE_PLATES) — здесь только имена.
  glowRest: 0.16,   // = coreDim
  glowLit: 0.72,    // = coreLitBoost

  // ── DUEL: двое лицом друг к другу через узкий разлом ──
  duel: {
    figH: 1.0,       // доля высоты композиции
    gap: 0.66,       // ±X от разлома до подошв фигуры
    lean: 0.055,     // размах наклона, радианы
    period: 5.4,     // секунд на цикл (ТЗ: не короче 4)
  },

  // РАЗВОРОТ «В ТРИ ЧЕТВЕРТИ» — общий для DUEL, SQUAD и толпы RAID, и это не
  // украшение. Фигура вдвое шире, чем глубже (плечи 0.46 против 0.19). Стоя
  // строго друг к другу поперёк кадра, обе повёрнуты к камере РЕБРОМ, и на
  // экране от них остаётся палка: на общем кадре ворот противники читались двумя
  // чёрточками. Этот угол разворачивает плечи к зрителю, не разворачивая их друг
  // от друга, — та самая стойка, в которой бойцов и рисуют.
  quarter: 0.5,     // радианы, на которые фигура довёрнута к камере

  // ── SQUAD: трое на трое, тот же разлом ──
  // Фигура мельче DUEL: шестеро в полный рост на этой плите встают плечо к
  // плечу и с дальнего ряда телефона сливаются в одно пятно (ТЗ §9 называет эту
  // беду прямо). Рифма с DUEL при этом держится — та же поза, тот же разлом, тот
  // же тон; читается «то же самое, но их больше».
  squad: {
    figH: 0.80,
    gap: 0.62,
    // Ряды по глубине и небольшой разнобой по X: строй, выровненный по линейке,
    // читается чертежом, а не отрядом.
    rows: [-0.82, 0.02, 0.86],
    jitterX: [0.06, -0.04, 0.05],
    jitterY: [0.10, -0.07, 0.12],   // разворот плеч, радианы
    lean: 0.045,
    period: 6.2,
  },

  // Разлом — общий для DUEL и SQUAD (в этом и рифма).
  rift: {
    // Ломаная в долях полуразмеров плиты. Идёт в ГЛУБИНУ (по Z), рваная по X —
    // узкая щель между двумя сторонами, а не диагональ через всю плиту, как на
    // острове ARENA дома: там разлом это место, здесь — граница.
    path: [[-0.05, -0.94], [0.04, -0.56], [-0.06, -0.14], [0.05, 0.26], [-0.03, 0.64], [0.04, 0.96]],
    samples: 24,     // мельче, чем у дома (48): разлом короткий и мелкий на экране
    groove: 0.075,   // полуширина матовой канавки
    glow: 0.22,      // полуширина светящейся ленты
    grooveOpacity: 0.85,
  },

  // ── CHAIN: три гранёных шестиугольных звена, сцепленных и парящих ──
  chain: {
    R: 0.42,          // радиус звена по средней линии
    tube: 0.12,       // толщина прутка
    spacing: 0.57,    // шаг между центрами звеньев по X (меньше 2R — сцеплены)
    lift: 1.24,       // центр цепи над крышкой
    glowScale: 0.62,  // радиус светящегося кольца внутри звена, доля от R
    // Цепь вращается вокруг СВОЕЙ ОСИ — той линии, вдоль которой она лежит, — а
    // не вокруг вертикали. Вокруг вертикали цепь половину оборота идёт торцом к
    // зрителю и складывается в одно пятно (замерено на крупном плане: с фронта
    // читалась комком). Вокруг своей оси она всегда развёрнута к зрителю боком,
    // а звенья при этом поворачиваются гранями — то самое, как ходит настоящая
    // цепь: половина звеньев показывает кольцо, половина ребро, и на обороте они
    // меняются ролями.
    period: 14.0,     // секунд на оборот
  },

  // ── RAID: вожак с гребнем и четверо против него ──
  raid: {
    bossH: 0.87,      // доля высоты композиции — остаток забирает гребень
    mobRatio: 1 / 1.9, // ТЗ: вожак в 1,8–2 раза выше
    // Вожак стоит НЕ у дальней кромки, хотя туда его и просится поставить. Он
    // самый высокий предмет в воротах, а всё, что стоит дальше, на экране выше:
    // с дальней кромки (−0.86) его гребень подходил к подписи дальнего ряда на
    // 5 px (замерено 844×390). Сдвиг вперёд опускает макушку по экрану, ничего
    // не меняя в чтении: «крупный, к нему лицом четверо».
    bossZ: -0.52,
    // Четверо стоят полукругом лицом к вожаку — то есть спиной к камере. Лиц у
    // фигур нет вовсе, направление читается разворотом плеч, и «спиной к нам,
    // лицом к нему» — самая ясная из возможных расстановок.
    mob: [
      { x: -1.00, z: 0.78 },
      { x: -0.34, z: 0.56 },
      { x: 0.34, z: 0.56 },
      { x: 1.00, z: 0.78 },
    ],
    // Гребень. На первом крупном плане он вышел красной чёрточкой — заметной,
    // но не читаемой как форма. Поднят по всем трём измерениям; рост вожака
    // ужат на столько же, чтобы потолок композиции не сдвинулся.
    crestH: 0.13,     // доля высоты композиции
    crestR: 0.09,     // полутолщина гребня поперёк
    crestLen: 0.40,   // длина гребня вдоль взгляда вожака
    sway: 0.06,       // размах разворота плеч вожака, радианы
    period: 6.4,
  },

  // ── COLLAPSE: кольцо осколков, нацеленных в кристалл над центром ──
  collapse: {
    count: 8,
    rx: 1.72,         // кольцо по кромке плиты — эллипс, плита не квадратная
    rz: 1.28,
    // Осколки длиннее, а точка схода НИЖЕ, чем стояло сначала (0.88 высоты).
    // Там кристалл висел так высоко над кольцом, что связь между ними
    // разрывалась: восемь осколков внизу и отдельная искра в небе. Кольцо должно
    // ЦЕЛИТЬСЯ, а для этого осколок обязан пройти заметную долю пути до цели.
    shardLen: 0.95,
    shardR: 0.10,
    apex: 0.62,       // доля высоты композиции — где висит кристалл
    crystalR: 0.24,
    period: 9.0,      // секунд на оборот кристалла
  },
};

// ─────────────────── Общая геометрия фигуры на все эмблемы ───────────────────
// Одна на весь модуль, со счётчиком держателей. Острова пересобираются при смене
// шага и при повороте экрана; выбросить буфер, которым ещё пользуется соседняя
// эмблема, — это чёрные дыры вместо фигур, и ловится такое не сразу.
let _figGeo = null;
let _figRefs = 0;
function holdFigure() {
  if (!_figGeo) _figGeo = figureGeometry();
  _figRefs++;
  return _figGeo;
}
function releaseFigure() {
  if (--_figRefs <= 0 && _figGeo) { _figGeo.dispose(); _figGeo = null; _figRefs = 0; }
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();

/** Матовый материал семьи: гранёный, без блеска, тон задаёт вызывающий. */
function matteMat(hex) {
  return new THREE.MeshStandardMaterial({
    color: hex, flatShading: true,
    roughness: GATE_EMBLEMS.roughness, metalness: GATE_EMBLEMS.metalness,
  });
}

/** Аддитивное свечение — тот же состав, что у ядра острова (см. gatePlates). */
function glowMat(color, map = null) {
  return new THREE.MeshBasicMaterial({
    map,
    color: new THREE.Color(color),
    transparent: true,
    opacity: GATE_EMBLEMS.glowRest,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: map ? THREE.DoubleSide : THREE.FrontSide,
  });
}

/** Поставить одну копию в набор: позиция, разворот вокруг Y, масштаб. */
function setInstance(mesh, i, x, y, z, ry, scale, rx = 0) {
  _q.setFromEuler(new THREE.Euler(rx, ry, 0));
  _p.set(x, y, z);
  _s.setScalar(scale);
  mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
}

// ───────────────────────────── DUEL / SQUAD ─────────────────────────────
// Двое (или трое на трое) друг против друга через узкий разлом в крышке. Разлом
// — свечение эмблемы; фигуры матовые и своего света не имеют никогда.
function buildFacingEmblem(kind, { color, halfW, halfD, topY, H }) {
  const o = GATE_EMBLEMS;
  const cfg = kind === 'squad' ? o.squad : o.duel;
  const group = new THREE.Group();
  const owned = [];

  // — разлом: матовая канавка и поверх неё светящаяся лента —
  const rift = riftRibbons({ path: o.rift.path, halfW, halfD, samples: o.rift.samples });
  const grooveGeo = rift.ribbon(o.rift.groove);
  const grooveMat = new THREE.MeshBasicMaterial({
    color: 0x090c14, transparent: true, opacity: o.rift.grooveOpacity, depthWrite: false,
  });
  const groove = new THREE.Mesh(grooveGeo, grooveMat);
  groove.position.y = topY + 0.004;
  group.add(groove);
  owned.push(grooveGeo);

  const bandTex = makeHaloBandTexture(color);
  const glowGeo = rift.ribbon(o.rift.glow);
  const gMat = glowMat(0xffffff, bandTex);   // цвет несёт текстура полосы
  const glow = new THREE.Mesh(glowGeo, gMat);
  glow.position.y = topY + 0.008;
  group.add(glow);
  owned.push(glowGeo);

  // — фигуры —
  const figH = H * cfg.figH;
  const scale = figH / FIGURE_H;
  const geo = holdFigure();
  const mat = matteMat(o.body);

  // Слева стоят лицом к +X, справа — к −X. Геометрия смотрит в +Z, поворот на
  // ±π/2 вокруг Y и разворачивает её поперёк.
  const q = o.quarter;   // довод плеч к зрителю — см. пояснение у настройки
  const slots = [];
  if (kind === 'squad') {
    cfg.rows.forEach((z, i) => {
      slots.push({ x: -(cfg.gap + cfg.jitterX[i]), z, ry: Math.PI / 2 - q + cfg.jitterY[i], sign: -1 });
      slots.push({ x: cfg.gap + cfg.jitterX[i], z: z * 0.94, ry: -Math.PI / 2 + q - cfg.jitterY[i], sign: 1 });
    });
  } else {
    slots.push({ x: -cfg.gap, z: -0.06, ry: Math.PI / 2 - q, sign: -1 });
    slots.push({ x: cfg.gap, z: 0.06, ry: -Math.PI / 2 + q, sign: 1 });
  }

  const figs = new THREE.InstancedMesh(geo, mat, slots.length);
  figs.frustumCulled = false;   // набор стоит там же, где плита; своей коробки у него нет
  group.add(figs);

  const w = (Math.PI * 2) / cfg.period;
  const place = (t) => {
    slots.forEach((s, i) => {
      // Наклон «вперёд-назад» вокруг подошв, стороны в противофазе: двое не
      // качаются как один предмет, они примеряются друг к другу.
      const lean = t === null ? 0 : Math.sin(t * w + (s.sign > 0 ? Math.PI : 0)) * cfg.lean;
      setInstance(figs, i, s.x, topY, s.z, s.ry, scale, lean * s.sign);
    });
    figs.instanceMatrix.needsUpdate = true;
  };
  place(null);

  const tick = (t, lit, level) => {
    mat.color.setHex(o.body).multiplyScalar(level);
    grooveMat.opacity = o.rift.grooveOpacity * level;
    gMat.opacity = (o.glowRest + o.glowLit * lit) * level;
    if (t !== null) place(t);
  };
  const still = () => place(null);
  const dispose = () => {
    owned.forEach((g) => g.dispose());
    grooveMat.dispose(); gMat.dispose(); bandTex.dispose();
    mat.dispose(); figs.dispose(); releaseFigure();
  };
  return { group, top: topY + figH, tick, still, dispose };
}

// ───────────────────────────── CHAIN ─────────────────────────────
// Три гранёных звена, сцепленных в цепь и парящих над плитой. Свечение — по
// внутренней грани звеньев: светится то, что цепь держит вместе.
//
// Звено — тор с ЧЕТЫРЬМЯ гранями поперёк и ШЕСТЬЮ по кругу: шестиугольник как
// форма, а не как знак. Фирменный шестиугольник знака сюда не переносится —
// логотип в игре живёт по своим правилам и на предметах не появляется.
function buildChainEmblem({ color, topY }) {
  const o = GATE_EMBLEMS;
  const c = o.chain;
  const group = new THREE.Group();

  const linkGeo = new THREE.TorusGeometry(c.R, c.tube, 4, 6);
  const linkMat = matteMat(o.body);
  const links = new THREE.InstancedMesh(linkGeo, linkMat, 3);
  links.frustumCulled = false;

  const glowGeo = new THREE.TorusGeometry(c.R * c.glowScale, c.tube * 0.5, 4, 6);
  const gMat = glowMat(color);
  const glows = new THREE.InstancedMesh(glowGeo, gMat, 3);
  glows.frustumCulled = false;

  // Звенья чередуют плоскость: тор по умолчанию лежит в XY (ось — Z). Соседнее
  // звено повёрнуто на π/2 вокруг X, и только так цепь читается цепью, а не
  // стопкой колец.
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * c.spacing;
    const rx = i % 2 ? Math.PI / 2 : 0;
    _q.setFromEuler(new THREE.Euler(rx, 0, 0));
    _p.set(x, 0, 0);
    _s.setScalar(1);
    links.setMatrixAt(i, _m.compose(_p, _q, _s));
    glows.setMatrixAt(i, _m);
  }
  links.instanceMatrix.needsUpdate = true;
  glows.instanceMatrix.needsUpdate = true;

  const spin = new THREE.Group();
  spin.position.y = topY + c.lift;
  spin.add(links);
  spin.add(glows);
  group.add(spin);

  const w = (Math.PI * 2) / c.period;
  const tick = (t, lit, level) => {
    linkMat.color.setHex(o.body).multiplyScalar(level);
    gMat.opacity = (o.glowRest + o.glowLit * lit) * level;
    if (t !== null) spin.rotation.x = t * w;
  };
  const still = () => { spin.rotation.x = 0; };
  const dispose = () => {
    linkGeo.dispose(); linkMat.dispose(); links.dispose();
    glowGeo.dispose(); gMat.dispose(); glows.dispose();
  };
  return { group, top: topY + c.lift + c.R + c.tube, tick, still, dispose };
}

// ───────────────────────────── RAID ─────────────────────────────
// Вожак вдвое выше остальных, с огранённым гребнем, и четверо против него.
// Свечение — на гребне: горит то, ради чего пришли.
function buildRaidEmblem({ color, topY, H }) {
  const o = GATE_EMBLEMS;
  const r = o.raid;
  const group = new THREE.Group();

  const bossH = H * r.bossH;
  const mobH = bossH * r.mobRatio;
  const geo = holdFigure();
  const mat = matteMat(o.body);

  // Все пятеро — один набор: тон у них общий, а «кто тут главный» несут рост и
  // гребень. Второй материал ради оттенка стоил бы второго вызова отрисовки, а
  // на пятерых это заметнее, чем разница тонов.
  const figs = new THREE.InstancedMesh(geo, mat, 1 + r.mob.length);
  figs.frustumCulled = false;
  group.add(figs);

  // Гребень — тонкое гранёное перо вдоль взгляда вожака, а не корона и не рога:
  // корона это власть, рога это зверь, а здесь нужен просто «он крупнее и
  // помечен».
  const crestH = H * r.crestH;
  const crestGeo = new THREE.ConeGeometry(1, 1, 3);
  crestGeo.scale(r.crestR, crestH, r.crestLen);
  const crestMat = matteMat(o.body);
  const crest = new THREE.Mesh(crestGeo, crestMat);
  const crestGlowGeo = crestGeo.clone();
  crestGlowGeo.scale(1.35, 1.1, 1.2);
  const gMat = glowMat(color);
  const crestGlow = new THREE.Mesh(crestGlowGeo, gMat);

  const bossGroup = new THREE.Group();
  bossGroup.position.set(0, topY + bossH, r.bossZ);
  bossGroup.add(crest);
  bossGroup.add(crestGlow);
  group.add(bossGroup);

  const mobScale = mobH / FIGURE_H;
  const bossScale = bossH / FIGURE_H;
  const w = (Math.PI * 2) / r.period;
  const place = (t) => {
    const sway = t === null ? 0 : Math.sin(t * w) * r.sway;
    setInstance(figs, 0, 0, topY, r.bossZ, sway, bossScale);
    r.mob.forEach((m, i) => {
      // Разворот «лицом к вожаку»: геометрия смотрит в +Z, и её надо повернуть
      // так, чтобы +Z указал на вожака.
      const ry = Math.atan2(-m.x, r.bossZ - m.z);
      setInstance(figs, i + 1, m.x, topY, m.z, ry, mobScale);
    });
    figs.instanceMatrix.needsUpdate = true;
    bossGroup.rotation.y = sway;
  };
  place(null);

  const tick = (t, lit, level) => {
    mat.color.setHex(o.body).multiplyScalar(level);
    crestMat.color.setHex(o.body).multiplyScalar(level);
    gMat.opacity = (o.glowRest + o.glowLit * lit) * level;
    if (t !== null) place(t);
  };
  const still = () => place(null);
  const dispose = () => {
    mat.dispose(); figs.dispose(); releaseFigure();
    crestGeo.dispose(); crestMat.dispose();
    crestGlowGeo.dispose(); gMat.dispose();
  };
  return { group, top: topY + bossH + crestH, tick, still, dispose };
}

// ───────────────────────────── COLLAPSE ─────────────────────────────
// Кольцо осколков по кромке плиты, наклонённых внутрь к точке над центром, и
// маленький кристалл в этой точке. Свечение — кристалл: остаётся один.
function buildCollapseEmblem({ color, topY, H }) {
  const o = GATE_EMBLEMS;
  const c = o.collapse;
  const group = new THREE.Group();

  const apexY = topY + H * c.apex;

  const shardGeo = new THREE.OctahedronGeometry(1, 0);
  shardGeo.scale(c.shardR, c.shardLen / 2, c.shardR);
  const shardMat = matteMat(o.body);
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, c.count);
  shards.frustumCulled = false;
  group.add(shards);

  for (let i = 0; i < c.count; i++) {
    const a = (i / c.count) * Math.PI * 2 + 0.22;
    const x = Math.cos(a) * c.rx;
    const z = Math.sin(a) * c.rz;
    // Ось осколка ведёт от его основания к вершине: кольцо не просто стоит, оно
    // целится.
    _dir.set(-x, apexY - topY, -z).normalize();
    _q.setFromUnitVectors(_up, _dir);
    _p.set(x, topY, z).addScaledVector(_dir, c.shardLen / 2);
    _s.setScalar(1);
    shards.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  shards.instanceMatrix.needsUpdate = true;

  const crysGeo = new THREE.OctahedronGeometry(c.crystalR, 0);
  const crysMat = matteMat(o.body);
  const crystal = new THREE.Mesh(crysGeo, crysMat);
  const auraGeo = new THREE.OctahedronGeometry(c.crystalR * 1.45, 0);
  const gMat = glowMat(color);
  const aura = new THREE.Mesh(auraGeo, gMat);

  const spin = new THREE.Group();
  spin.position.y = apexY;
  spin.add(crystal);
  spin.add(aura);
  group.add(spin);

  const w = (Math.PI * 2) / c.period;
  const tick = (t, lit, level) => {
    shardMat.color.setHex(o.body).multiplyScalar(level);
    crysMat.color.setHex(o.body).multiplyScalar(level);
    gMat.opacity = (o.glowRest + o.glowLit * lit) * level;
    if (t !== null) spin.rotation.y = t * w;
  };
  const still = () => { spin.rotation.y = 0; };
  const dispose = () => {
    shardGeo.dispose(); shardMat.dispose(); shards.dispose();
    crysGeo.dispose(); crysMat.dispose();
    auraGeo.dispose(); gMat.dispose();
  };
  return { group, top: apexY + c.crystalR * 1.45, tick, still, dispose };
}

/**
 * Собрать эмблему острова.
 *
 * @param {string} kind  'duel' | 'squad' | 'chain' | 'raid' | 'collapse'
 * @param {object} p
 *   color  — цвет режима (он же цвет свечения)
 *   halfW / halfD — полуразмеры плиты
 *   topY   — крышка плиты в системе острова
 * @returns {{group, top, tick(t,lit,level), still(), dispose()}}
 *   top — верхняя точка эмблемы: по ней остров растит свою коробку выбора,
 *   чтобы клик по эмблеме был кликом по острову.
 *   tick(t=null) — кадр без движения (при «уменьшить движение»).
 */
export function buildGateEmblem(kind, p) {
  const H = GATE_EMBLEMS.height * p.halfW * 2;
  const args = { ...p, H };
  if (kind === 'duel' || kind === 'squad') return buildFacingEmblem(kind, args);
  if (kind === 'chain') return buildChainEmblem(args);
  if (kind === 'raid') return buildRaidEmblem(args);
  if (kind === 'collapse') return buildCollapseEmblem(args);
  return null;
}
