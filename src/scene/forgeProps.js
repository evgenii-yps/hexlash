// forgeProps.js — ПРЕДМЕТЫ ЗАЛА FORGE для скрытой страницы-макета /dev/forge
// (ТЗ 23.09.2026, «страница-макет зала FORGE»).
//
// ⚠️ ЭТО МАКЕТ. Ни один файл игры отсюда не вызывается на правку и ни один
//    экран игры эти предметы не показывает. Настоящий зал (PveScene.vue +
//    ForgePanel.vue) остаётся как есть до отдельного решения владельца.
//
// ЗАЧЕМ. Решение владельца 23.09.2026: интерфейс зала перестаёт быть плоскими
// панелями и становится ОБЪЁМНЫМИ ПРЕДМЕТАМИ внутри самой сцены. Панель
// прокачки уходит из того, что игрок видит при входе. Здесь собраны кандидаты
// на эти предметы — по ТРИ формы на каждый ключевой (ростер, объект прокачки,
// SHOP/кабинет), потому что на /dev/core вариантный показ уже сработал: владелец
// выбрал форму с первого раза, а один предложенный вариант означает круг правок.
//
// ДИСЦИПЛИНА, КОТОРУЮ ЭТОТ ФАЙЛ ОБЯЗАН ДЕРЖАТЬ:
//   · В ПОКОЕ ПРЕДМЕТЫ МАТОВЫЕ. Розовое свечение — только в момент нажатия
//     (правка 23.09.2026, принята на баффах: розовое принадлежит действию, а
//     тем же розовым светится ядро бойца). Поэтому ни у одного предмета здесь
//     нет постоянной розовой подсветки — есть `setPressed(on, dt)`, и только
//     она зажигает.
//   · ЦВЕТА НЕ ОБЪЯВЛЯЮТСЯ. Тела — MATERIALS.decor / decorDark / pedestal из
//     sceneTokens.js, розовый — через leaderHue(). Второго
//     объявления цвета в этом файле нет ни одного.
//   · НИ ОДНОЙ ЦИФРЫ. Счётчиков, очков, уровней, порогов, процентов и полос
//     заполнения здесь нет и быть не должно (ТЗ §3.4). Подписи — только слова.
//   · УЗОРОВ И ОРНАМЕНТОВ НЕТ (правило, пришедшее с ядра). Грань — да, рисунок
//     на грани — нет.
//
// ПОДПИСИ. Рисуются на холсте и вешаются плоскостью в самом 3D — тот же приём,
// что у экрана терминала подбора: текст остаётся частью мира, а не вторым слоем
// поверх него, и не ломается при повороте камеры. Шрифт и цвет читаются из
// стилей через уже существующий мост (labelFont/labelInk ниже), своего
// объявления не заводят.
//
// ⚠️ SHOP и КАБИНЕТ ПРЕДМЕТАМИ НЕ ДЕЛАЮТСЯ (решение владельца 23.09.2026, правка
//    v2). Они остаются плоскими кнопками, такими же, как на остальных экранах,
//    вместе с кнопкой BACK. Причина: кнопка читается как «выйти отсюда», предмет
//    — как «работать здесь». Смешение плоского и объёмного здесь намеренное.
//    Полосу кнопок собирает страница из уже существующих стилей зала (.hs-strip
//    в src/styles/home.css) — второй такой полосы здесь не заводится.
//
// Экспортирует: FORGE_PROPS (настройки), buildRoster, buildUpgrade, buildPunchBag,
//               buildStatsFloor, buildLegendAnchor, buildBuffShelf.
import * as THREE from 'three';
import { MATERIALS, leaderHue } from '../data/sceneTokens.js';
import { makeRadialTexture } from './arenaTextures.js';

// ───────────────────────────── Настройки ─────────────────────────────
// Всё, что подбирается глазами, живёт здесь одним блоком (правило hexlash-3d:
// настроечные числа сцены — наверху файла, цвета и шрифты — в токенах).
export const FORGE_PROPS = {
  // Свечение нажатия. Те же две величины, что у постамента баффа: в покое
  // почти ноль, на нажатии — полная вспышка, подход плавный.
  press: { restOpacity: 0.0, activeOpacity: 0.78, lerp: 7.0, radius: 0.9 },

  // Общая высота «рабочей» столешницы предметов над полом. Одна на все три
  // варианта каждого предмета: варианты отличаются ФОРМОЙ, а не ростом, иначе
  // сравнивать их на одном кадре бессмысленно.
  deskY: 0.78,

  roster:  { w: 0.72, d: 0.52, label: 'ROSTER' },
  upgrade: { w: 0.86, d: 0.72, label: 'FORGE' },

  // ⚠️ РАЗМЕТКИ ЗОН БОЛЬШЕ НЕТ (правка v3). Она вводилась в v2, чтобы разнести
  //    слипшихся бойцов; слипание оказалось ошибкой макета и исправлено. Бродящему
  //    бойцу закреплённое место противоречит — теперь он ходит по всей плите.

  // ГРУША. Делается В ТОЧНОСТИ в манере перчаток с острова ARENA (modePlates.js):
  // гранёная, низкополигональная, матовая. Ни кожи, ни шнуровки, ни швов, ни
  // надписей. Не светится.
  //
  // ЗАЧЕМ ТАК. Перчатки — единственная вещь из реального мира в этом мире, и
  // тогда это было записано как исключение. Груша стала бы вторым исключением,
  // поэтому решение владельца: не плодить исключения, а завести СЕМЬЮ. Один
  // приём на обе вещи — низкая огранка, матовый тон плиты, никакого блеска.
  bag: {
    r: 0.26,            // радиус тела груши
    h: 0.86,            // высота цилиндрической части (без полусфер)
    sides: 8,           // столько же граней, сколько у кулака перчатки
    hang: 2.25,         // высота подвеса над плитой
    chain: 5,           // звеньев в цепи
    linkR: 0.035,
    strapH: 0.055,      // пояски на теле груши
    swingSpring: 7.0,   // насколько резво груша возвращается в отвес
    swingDamp: 0.90,    // затухание качания
    swingKick: 0.42,    // толчок от одного удара, радиан/с
    swingMax: 0.52,     // предел отклонения, радиан
  },

  // СТАТЫ — проступают НА ПОВЕРХНОСТИ ПЛИТЫ под остановленным бойцом и перед
  // ним (правка v2, уточнение v3). Ничего не поднимается и не висит: поднятое
  // табло отъедало высоту кадра, а высота в вертикальном телефоне — самое
  // дефицитное. `lift` — приподнятость над плитой, чтобы надпись не мерцала.
  stats: { w: 1.62, d: 1.28, openDur: 0.4, rows: 7, lift: 0.014 },

  // Полка баффов — только МЕСТО, задел (решение 22.09: предметы баффов позже).
  shelf: { w: 1.10, d: 0.30, niches: 3, label: 'BUFFS' },

  // Место легенды — пустой якорь высоко над плитой.
  legend: { ringR: 0.62, label: 'LEGEND' },
};

// ───────────────────────────── Материалы ─────────────────────────────
/** Матовое тело предмета — тон декора из токенов, без своего цвета. */
function bodyMat(kind = 'decor') {
  const src = kind === 'dark' || kind === 'decorDark2' ? MATERIALS.decorDark
    : kind === 'pedestal' ? MATERIALS.pedestal
      : MATERIALS.decor;
  // decorDark2 — тот же тон, но заметно глуше: им идут детали, которые не должны
  // спорить с телом предмета (цепь, пояски). Второго ЦВЕТА здесь не заводится —
  // меняется только то, сколько света вещь возвращает.
  const m = new THREE.MeshStandardMaterial({ ...src });
  if (kind === 'decorDark2') m.roughness = 1;
  return m;
}

/** Аддитивная розовая лужица нажатия — ровно тот же состав, что у баффов. */
function pressMat(map) {
  return new THREE.MeshBasicMaterial({
    map,
    color: new THREE.Color(leaderHue()),
    transparent: true,
    opacity: FORGE_PROPS.press.restOpacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
}

// ───────────────────────────── Подписи ─────────────────────────────
// Шрифт и цвет подписи — из тех же стилей, что и весь интерфейс. Читаются
// лениво и один раз: на момент загрузки модуля tokens.css может быть ещё не
// применён (та же причина, по которой ленив и cssToken в sceneTokens.js).
let _labelInk = null;
let _labelFont = null;
function labelInk() {
  if (_labelInk) return _labelInk;
  const raw = typeof document === 'undefined' ? ''
    : getComputedStyle(document.documentElement).getPropertyValue('--ink-dim').trim();
  // Запасного числа здесь НЕТ намеренно: запасное число — это второе
  // объявление цвета, ровно та ошибка, из-за которой когда-то разъехались
  // вторые тона ядер. Громкая ошибка, как и в sceneTokens.js.
  if (!raw) throw new Error('[hexlash] токен --ink-dim не прочитался из стилей (src/styles/tokens.css).');
  _labelInk = raw;
  return _labelInk;
}
function labelFont() {
  if (_labelFont) return _labelFont;
  const raw = typeof document === 'undefined' ? ''
    : getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim();
  _labelFont = raw || 'monospace';   // родовое семейство, а не объявление шрифта
  return _labelFont;
}

/**
 * Плоскость с ВЫГРАВИРОВАННЫМ словом. Не светится — это гравировка на матовом
 * теле, а не вывеска. Ширина плоскости задаётся, высота выводится из пропорций
 * холста, чтобы буквы никогда не растягивались.
 */
function buildLabel(text, width, { align = 'center', dim = 1 } = {}) {
  // ⚠️ 512×128 и анизотропия ниже — НЕ запас «на всякий случай», а измеренный
  // минимум. Пробовали вчетверо дешевле (256×64, anisotropy 1): кадров это не
  // вернуло НИ ОДНОГО (горизонталь 10.7–11.0 до и после), а слова на планшете и
  // наковальне размазались в пунктир. Снимки — в отчёте. Не удешевлять снова.
  const PX = 512;
  const H = 128;
  const cv = document.createElement('canvas');
  cv.width = PX; cv.height = H;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, PX, H);
  c.fillStyle = labelInk();
  c.globalAlpha = 0.92 * dim;
  c.font = `600 ${Math.round(H * 0.52)}px ${labelFont()}`;
  c.textBaseline = 'middle';
  c.textAlign = align;
  // Разрядка подписи — руками, посимвольно: canvas не умеет letter-spacing
  // одинаково во всех браузерах, а разрядка здесь несущая (ls-meta).
  const sp = Math.round(H * 0.10);
  const chars = [...text];
  const widths = chars.map((ch) => c.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  let x = align === 'left' ? H * 0.12 : (PX - total) / 2;
  c.textAlign = 'left';
  for (let i = 0; i < chars.length; i++) {
    c.fillText(chars[i], x, H / 2);
    x += widths[i] + sp;
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Подписи лежат плашмя, камера смотрит на них под скользящим углом — без
  // анизотропии буквы слипаются. См. предупреждение выше.
  tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(width, width * (H / PX));
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 2;
  return { mesh, dispose: () => { tex.dispose(); geo.dispose(); mat.dispose(); } };
}

// ─────────────────── Общая обвязка предмета ───────────────────
// Каждый предмет отдаёт ОДИН и тот же договор, чтобы сцена не знала, какой
// вариант собран: группа, лужица нажатия, setPressed, tick, dispose и список
// мешей, по которым ловится луч курсора (`hit`).
function propShell(label, labelWidth, labelY, labelZ) {
  const group = new THREE.Group();
  const disposers = [];
  const hit = [];

  // Розовая лужица под предметом — гаснет в покое, зажигается на нажатии.
  // Белая маска: ЦВЕТ даёт материал (leaderHue), маска только задаёт форму
  // пятна — второго объявления цвета здесь нет, ровно как у баффов.
  const pmap = makeRadialTexture('rgba(255,255,255,0.95)', 'rgba(255,255,255,0)', 0.45);
  const pgeo = new THREE.PlaneGeometry(FORGE_PROPS.press.radius * 2, FORGE_PROPS.press.radius * 2);
  const pmat = pressMat(pmap);
  const puddle = new THREE.Mesh(pgeo, pmat);
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.y = 0.012;
  puddle.renderOrder = 1;
  group.add(puddle);
  disposers.push(() => { pgeo.dispose(); pmat.dispose(); pmap.dispose(); });

  let lbl = null;
  if (label) {
    lbl = buildLabel(label, labelWidth);
    lbl.mesh.position.set(0, labelY, labelZ);
    group.add(lbl.mesh);
    disposers.push(lbl.dispose);
  }

  let pressed = false;
  const api = {
    group,
    hit,
    /** Подпись всегда видна — по ТЗ у ростера она не прячется никогда. */
    label: lbl?.mesh || null,
    setPressed(on) { pressed = !!on; },
    tick(dt) {
      const P = FORGE_PROPS.press;
      const target = pressed ? P.activeOpacity : P.restOpacity;
      const k = 1 - Math.exp(-P.lerp * Math.min(0.05, dt));
      pmat.opacity += (target - pmat.opacity) * k;
    },
    add(mesh, { pickable = true } = {}) {
      group.add(mesh);
      if (pickable) hit.push(mesh);
      return mesh;
    },
    own(fn) { disposers.push(fn); },
    dispose() { disposers.forEach((d) => d()); },
  };
  return api;
}

/** Коробка с фаской — базовый кирпич всех предметов (огранённый, матовый). */
function slabBox(w, h, d, kind = 'decor') {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = bodyMat(kind);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData._geo = geo; mesh.userData._mat = mat;
  return mesh;
}
function ownBox(api, mesh) {
  api.own(() => { mesh.userData._geo?.dispose(); mesh.userData._mat?.dispose(); });
  return mesh;
}

// ═══════════════════════ РОСТЕР — блокнот с карандашом ═══════════════════════
// Решение 18.09.2026: ростер — это блокнот с карандашом. Подпись ROSTER видна
// ВСЕГДА (требование ТЗ), поэтому она не часть состояния, а часть предмета.
//
//   A · ПЛАНШЕТ на низкой подставке — лист лежит под наклоном, карандаш поперёк.
//   B · ПЮПИТР — наклонная стойка, блокнот на ней, карандаш в держателе сбоку.
//   C · СТОПКА — блокнот плашмя на приземистой тумбе, карандаш рядом, подпись
//       выгравирована на передней грани тумбы.
export function buildRoster() {
  const R = FORGE_PROPS.roster;
  const api = propShell(R.label, R.w * 1.25, 0.02, R.d * 0.72 + 0.20);
  // Подпись лежит на полу перед предметом — читается с фронтальной камеры зала.
  if (api.label) api.label.rotation.x = -Math.PI / 2;

  const D = FORGE_PROPS.deskY;
  const foot = ownBox(api, slabBox(R.w * 0.52, D * 0.55, R.d * 0.46, 'pedestal'));
  foot.position.y = D * 0.275;
  api.add(foot);
  const arm = ownBox(api, slabBox(R.w * 0.14, D * 0.5, R.d * 0.14, 'dark'));
  arm.position.set(0, D * 0.72, -0.02);
  api.add(arm);
  const board = ownBox(api, slabBox(R.w, 0.045, R.d, 'decor'));
  board.position.set(0, D * 0.96, 0.04);
  board.rotation.x = -0.62;
  api.add(board);
  const clip = ownBox(api, slabBox(R.w * 0.42, 0.05, 0.07, 'dark'));
  clip.position.set(0, D * 0.96 + 0.16, -0.10);
  clip.rotation.x = -0.62;
  api.add(clip, { pickable: false });
  const pencil = buildPencil();
  pencil.group.position.set(0.02, D * 0.96 - 0.02, 0.12);
  pencil.group.rotation.set(-0.62, 0.22, 0);
  api.group.add(pencil.group);
  api.own(pencil.dispose);
  return api;
}

/** Карандаш — общий для всех трёх вариантов ростера. */
function buildPencil() {
  const group = new THREE.Group();
  const bodyGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.30, 6);
  const bodyM = bodyMat('decor');
  const body = new THREE.Mesh(bodyGeo, bodyM);
  body.rotation.z = Math.PI / 2;
  group.add(body);
  const tipGeo = new THREE.ConeGeometry(0.019, 0.06, 6);
  const tipM = bodyMat('dark');
  const tip = new THREE.Mesh(tipGeo, tipM);
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 0.18;
  group.add(tip);
  return { group, dispose: () => { bodyGeo.dispose(); bodyM.dispose(); tipGeo.dispose(); tipM.dispose(); } };
}

// ═══════════════════ ОБЪЕКТ ПРОКАЧКИ — куда приходят работать ═══════════════════
//   A · НАКОВАЛЬНЯ — приземистый огранённый блок, на нём шестиугольная площадка.
//   B · ВЕРСТАК — стол, над ним поднятая рама с тремя пустыми гнёздами граней.
//   C · СТОЛБ — колонна с гранями, врезанными в её боковые стороны.
//
// ⚠️ Гнёзда ПУСТЫЕ и ничем не заполнены: заполнение — это и есть числа
//    прокачки, а их в этой работе нет (ТЗ §3.4).
export function buildUpgrade() {
  const U = FORGE_PROPS.upgrade;
  const api = propShell(U.label, U.w * 1.05, 0.02, U.d * 0.7 + 0.22);
  if (api.label) api.label.rotation.x = -Math.PI / 2;
  const D = FORGE_PROPS.deskY;

  const hexPlate = (r, h, kind) => {
    const geo = new THREE.CylinderGeometry(r, r, h, 6);
    const mat = bodyMat(kind);
    const m = new THREE.Mesh(geo, mat);
    api.own(() => { geo.dispose(); mat.dispose(); });
    return m;
  };

  const base = ownBox(api, slabBox(U.w * 0.62, 0.14, U.d * 0.62, 'dark'));
  base.position.y = 0.07;
  api.add(base, { pickable: false });
  const waist = ownBox(api, slabBox(U.w * 0.34, D * 0.62, U.d * 0.34, 'pedestal'));
  waist.position.y = 0.14 + D * 0.31;
  api.add(waist);
  const top = ownBox(api, slabBox(U.w, 0.17, U.d * 0.52, 'decor'));
  top.position.y = D * 0.76;
  api.add(top);
  const horn = hexPlate(U.d * 0.20, 0.13, 'decor');
  horn.position.set(U.w * 0.52, D * 0.76, 0);
  horn.rotation.z = Math.PI / 2;
  api.add(horn, { pickable: false });
  const anvilHex = hexPlate(U.d * 0.21, 0.035, 'dark');
  anvilHex.position.y = D * 0.76 + 0.10;
  api.add(anvilHex, { pickable: false });
  return api;
}

// ═══════════════════ РАЗМЕТКА ЗОНЫ НА ПЛИТЕ ═══════════════════
// Участок пола, закреплённый за бойцом. Появился в правке v2, потому что на
// дуге настоящего зала бойцы слипаются в кучу, и чем их больше, тем хуже.
// Разметка не расталкивает их — она объясняет, что каждый стоит на СВОЁМ месте.
//
// Это ещё и то, что уже происходит в игре: боец в состоянии TRAINING работает
// именно в своей зоне (см. forgeWander, «ЗАНЯТИЕ РАБОТАЕТ В СВОЕЙ ЗОНЕ»).
// Разметка делает видимым то, что раньше происходило молча — поэтому у зоны
// есть второе состояние: пока в ней работают, её черта заметнее.
//
// Форма — скобы по углам, а не сплошная рамка: сплошная на десяти местах
// превращает пол в сетку, а сетка — это узор, которого в проекте быть не должно.
// ═══════════════════ СТАТЫ — НА ПОВЕРХНОСТИ ПЛИТЫ ═══════════════════
// Открываются нажатием по самому бойцу и проступают НА ПОЛУ перед ним — как
// надпись на плите, а не предмет в воздухе (правка v2). Ничего не поднимается.
//
// Черта и заливка те же, что у разметки зоны: один приём на две задачи —
// статы читаются как продолжение того же места, а не как второе устройство.
//
// ⚠️ ЦИФР НЕТ. Имена осей и ПУСТЫЕ ЖЁЛОБА под будущие значения. Жёлоб оставлен
//    пустым нарочно, чтобы на макете было видно, где значения встанут.
export function buildStatsFloor(axisNames = []) {
  const S = FORGE_PROPS.stats;
  const Z = { lift: FORGE_PROPS.stats.lift };
  const group = new THREE.Group();
  const disposers = [];
  const fade = [];          // всё, что проявляется вместе

  const push = (mesh, mat) => { group.add(mesh); fade.push(mat); };

  const plateMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(MATERIALS.decorDark.color),
    transparent: true, opacity: 0, depthWrite: false,
  });
  const plateGeo = new THREE.PlaneGeometry(S.w, S.d);
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = Z.lift;
  push(plate, plateMat);
  disposers.push(() => { plateGeo.dispose(); plateMat.dispose(); });

  const rows = axisNames.slice(0, S.rows);
  const top = S.d / 2 - 0.12;
  const gap = rows.length > 1 ? (S.d - 0.24) / (rows.length - 1) : 0;
  const troughMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(MATERIALS.decorLine.color),
    transparent: true, opacity: 0, depthWrite: false,
  });
  const troughGeo = new THREE.PlaneGeometry(S.w * 0.40, 0.022);
  disposers.push(() => { troughGeo.dispose(); troughMat.dispose(); });

  rows.forEach((name, i) => {
    const z = -top + i * gap;          // −Z = дальше от камеры, читается сверху вниз
    const l = buildLabel(name, S.w * 0.42, { align: 'left', dim: 0.9 });
    l.mesh.rotation.x = -Math.PI / 2;
    l.mesh.position.set(-S.w * 0.26, Z.lift * 1.3, z);
    l.mesh.material.transparent = true;
    l.mesh.material.opacity = 0;
    group.add(l.mesh);
    fade.push(l.mesh.material);
    disposers.push(l.dispose);

    // Пустой жёлоб — место под значение. Ничем не заполнен намеренно.
    const t = new THREE.Mesh(troughGeo, troughMat);
    t.rotation.x = -Math.PI / 2;
    t.position.set(S.w * 0.24, Z.lift * 1.2, z);
    group.add(t);
  });
  fade.push(troughMat);

  let open = false;
  let phase = 0;
  group.visible = false;
  return {
    group,
    setOpen(on) { open = !!on; },
    tick(dt, reduced) {
      const target = open ? 1 : 0;
      if (reduced) phase = target;
      else {
        const step = dt / S.openDur;
        phase += Math.sign(target - phase) * Math.min(step, Math.abs(target - phase));
      }
      group.visible = phase > 0.001;
      // Проявляется на месте: ничего не едет и не поднимается.
      for (const m of fade) m.opacity = (m === plateMat ? 0.34 : 0.92) * phase;
    },
    dispose() { disposers.forEach((d) => d()); },
  };
}

// ═══════════════════ ГРУША ═══════════════════
// Вторая — и последняя — вещь из реального мира в этом мире, после перчаток с
// острова ARENA. Сделана ТЕМ ЖЕ ПРИЁМОМ, что и они (modePlates.js, «the gloves»):
// низкосегментная сфера и цилиндр с плоской огранкой, матовый тон плиты,
// roughness под 0.85, никакого блеска. Ни кожи, ни шнуровки, ни швов, ни
// надписей — их нет и у перчаток.
//
// ⚠️ ГРУША НЕ СВЕТИТСЯ. У перчаток розовое на исподе — это ЗАПЕЧЁННЫЙ цвет
//    вершин: свет разлома, отражённый плитой снизу. Под грушами разлома нет, и
//    подкрашивать их снизу не от чего, поэтому здесь чистый матовый тон и
//    ничего больше.
//
// Качание — снаружи и по одной оси: удар толкает грушу от бойца, пружина
// возвращает её в отвес. Тело бойца груша не трогает совсем.
export function buildPunchBag() {
  const B = FORGE_PROPS.bag;
  const group = new THREE.Group();   // стоит на полу; вся груша висит внутри
  const disposers = [];

  // Тело груши — ТЁМНЫЙ тон декора, а не светлый, и вдобавок совсем глухой
  // (decorDark2 = тот же тон, шероховатость до упора). На светлом и на блике она
  // под лампой выбеливалась в белую бочку и читалась раньше бойца рядом, а
  // первым должно читаться тело. Нового цвета при этом не заведено: тон взят
  // из набора, гасится только блик.
  const mat = bodyMat('decorDark2');
  const dark = bodyMat('dark');
  disposers.push(() => { mat.dispose(); dark.dispose(); });

  // Точка подвеса — вокруг неё всё и качается.
  const pivot = new THREE.Group();
  pivot.position.y = B.hang;
  group.add(pivot);

  // Цепь: несколько коротких гранёных звеньев вниз от потолка к телу груши.
  const linkGeo = new THREE.CylinderGeometry(B.linkR, B.linkR, 0.10, 5);
  disposers.push(() => linkGeo.dispose());
  for (let i = 0; i < B.chain; i++) {
    const l = new THREE.Mesh(linkGeo, dark);
    l.position.y = -0.07 * i - 0.05;
    l.rotation.y = (i % 2) * Math.PI / 4;   // звенья через одно повёрнуты — цепь, а не труба
    pivot.add(l);
  }
  const chainDrop = 0.07 * B.chain;

  // Тело — цилиндр с гранями, сверху и снизу по полусфере того же счёта граней.
  // Ровно та же логика, что у кулака перчатки: мало сегментов + плоская огранка.
  const bodyY = -chainDrop - B.h / 2 - B.r * 0.6;
  const tubeGeo = new THREE.CylinderGeometry(B.r, B.r * 0.94, B.h, B.sides);
  const capGeo = new THREE.SphereGeometry(B.r, B.sides, 4);
  disposers.push(() => { tubeGeo.dispose(); capGeo.dispose(); });
  const tube = new THREE.Mesh(tubeGeo, mat);
  tube.position.y = bodyY;
  pivot.add(tube);
  const capTop = new THREE.Mesh(capGeo, mat);
  capTop.position.y = bodyY + B.h / 2;
  capTop.scale.set(1, 0.82, 1);
  pivot.add(capTop);
  const capBot = new THREE.Mesh(capGeo, mat);
  capBot.position.y = bodyY - B.h / 2;
  capBot.scale.set(0.94, 0.90, 0.94);
  pivot.add(capBot);

  // Два пояска — то же, что манжета у перчатки: деталь, которая держит форму.
  const strapGeo = new THREE.CylinderGeometry(B.r * 1.04, B.r * 1.04, B.strapH, B.sides);
  disposers.push(() => strapGeo.dispose());
  for (const k of [0.30, -0.30]) {
    const st = new THREE.Mesh(strapGeo, dark);
    st.position.y = bodyY + B.h * k;
    pivot.add(st);
  }

  // Качание: угол и скорость по одной оси. Удар задаёт скорость, пружина тянет
  // обратно в отвес, затухание гасит. Ни физики, ни столкновений здесь нет —
  // это движение предмета, а не тело в мире.
  let ang = 0, vel = 0, axis = 0;   // axis — направление толчка в плоскости XZ
  return {
    group,
    /** Высота, на которой тело груши — туда целится боец. */
    hitY: B.hang + bodyY,
    /** Удар. `dirX/dirZ` — куда толкнуть (от бойца к груше). */
    hit(dirX, dirZ, reduced) {
      if (reduced) return;
      axis = Math.atan2(dirX, dirZ);
      vel += B.swingKick;
    },
    tick(dt, reduced) {
      if (reduced) { pivot.rotation.set(0, 0, 0); return; }
      vel += -B.swingSpring * ang * dt;
      vel *= Math.pow(B.swingDamp, dt * 60);
      ang += vel * dt;
      if (ang > B.swingMax) { ang = B.swingMax; vel = 0; }
      if (ang < -B.swingMax) { ang = -B.swingMax; vel = 0; }
      // Наклон в сторону толчка: раскладываем один угол на две оси.
      pivot.rotation.set(Math.cos(axis) * ang, 0, -Math.sin(axis) * ang);
    },
    dispose() { disposers.forEach((d) => d()); },
  };
}

// ═══════════════════ МЕСТО ЛЕГЕНДЫ ═══════════════════
// Легенда летает над всеми, когда она есть. Когда её нет — на её месте остаётся
// ЯКОРЬ: матовое шестиугольное кольцо, которое ничем не светится. Когда есть —
// кольцо уходит, а над ним висит фигура (её ставит сцена; здесь только место).
export function buildLegendAnchor() {
  const L = FORGE_PROPS.legend;
  const group = new THREE.Group();
  const disposers = [];

  const ringGeo = new THREE.TorusGeometry(L.ringR, 0.028, 6, 6);
  const ringM = bodyMat('decor');
  const ring = new THREE.Mesh(ringGeo, ringM);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  disposers.push(() => { ringGeo.dispose(); ringM.dispose(); });

  const lbl = buildLabel(L.label, L.ringR * 1.7, { dim: 0.7 });
  lbl.mesh.position.set(0, -L.ringR * 0.55, 0);
  group.add(lbl.mesh);
  disposers.push(lbl.dispose);

  // ⚠️ Своего свечения у якоря НЕТ. Когда легенда есть, тёплое облако даёт она
  // сама (legendPresence) — и оно единственное тёплое пятно зала. Добавить сюда
  // второй янтарный ореол означало бы два источника одного сигнала.

  let present = false;
  return {
    group,
    setPresent(on) { present = !!on; },
    tick(dt, t) {
      // Есть легенда — якоря не видно: место занято ею самой.
      ring.visible = !present;
      lbl.mesh.visible = !present;
      if (!present) ring.rotation.z = t * 0.12;
    },
    dispose() { disposers.forEach((d) => d()); },
  };
}

// ═══════════════════ ПОЛКА БАФФОВ — ТОЛЬКО МЕСТО ═══════════════════
// Решение 22.09.2026: предметы баффов — «позже». Здесь стоит пустая полка с
// тремя нишами, помеченная как задел: ничего в неё не кладётся.
export function buildBuffShelf() {
  const B = FORGE_PROPS.shelf;
  const api = propShell(B.label, B.w * 0.78, 0.02, B.d * 0.7 + 0.20);
  if (api.label) api.label.rotation.x = -Math.PI / 2;
  const D = FORGE_PROPS.deskY;

  const plank = ownBox(api, slabBox(B.w, 0.06, B.d, 'pedestal'));
  plank.position.y = D * 0.72;
  api.add(plank);
  for (const sx of [-1, 1]) {
    const leg = ownBox(api, slabBox(0.06, D * 0.72, B.d * 0.8, 'dark'));
    leg.position.set(sx * (B.w / 2 - 0.05), D * 0.36, 0);
    api.add(leg, { pickable: false });
  }
  const step = B.w / B.niches;
  for (let i = 0; i < B.niches; i++) {
    const nicheGeo = new THREE.CylinderGeometry(step * 0.26, step * 0.26, 0.02, 6);
    const nicheM = bodyMat('dark');
    const n = new THREE.Mesh(nicheGeo, nicheM);
    n.position.set(-B.w / 2 + step * (i + 0.5), D * 0.72 + 0.04, 0);
    api.group.add(n);
    api.own(() => { nicheGeo.dispose(); nicheM.dispose(); });
  }
  return api;
}
