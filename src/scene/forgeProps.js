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
// Экспортирует: FORGE_PROPS (настройки), buildRoster, buildUpgrade, buildShop,
//               buildCabinet, buildStatsBoard, buildLegendAnchor, buildBuffShelf.
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
  shop:    { w: 0.62, d: 0.48, label: 'SHOP' },
  cabinet: { w: 0.46, d: 0.40, label: 'CABINET' },

  // Табло статов — поднимается перед бойцом по нажатию на него.
  stats: { w: 1.30, h: 0.94, riseFrom: -0.55, riseDur: 0.45 },

  // Полка баффов — только МЕСТО, задел (решение 22.09: предметы баффов позже).
  shelf: { w: 1.10, d: 0.30, niches: 3, label: 'BUFFS' },

  // Место легенды — пустой якорь высоко над плитой.
  legend: { ringR: 0.62, label: 'LEGEND' },
};

// ───────────────────────────── Материалы ─────────────────────────────
/** Матовое тело предмета — тон декора из токенов, без своего цвета. */
function bodyMat(kind = 'decor') {
  const src = kind === 'dark' ? MATERIALS.decorDark
    : kind === 'pedestal' ? MATERIALS.pedestal
      : MATERIALS.decor;
  return new THREE.MeshStandardMaterial({ ...src });
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
export function buildRoster(variant = 'A') {
  const R = FORGE_PROPS.roster;
  const api = propShell(R.label, R.w * 1.25, 0.02, R.d * 0.72 + 0.20);
  // Подпись лежит на полу перед предметом — читается с фронтальной камеры зала.
  if (api.label) api.label.rotation.x = -Math.PI / 2;

  const D = FORGE_PROPS.deskY;

  if (variant === 'A') {
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
  } else if (variant === 'B') {
    const post = ownBox(api, slabBox(R.w * 0.20, D, R.d * 0.20, 'pedestal'));
    post.position.y = D / 2;
    api.add(post);
    const base = ownBox(api, slabBox(R.w * 0.66, 0.08, R.d * 0.56, 'dark'));
    base.position.y = 0.04;
    api.add(base, { pickable: false });
    const desk = ownBox(api, slabBox(R.w, 0.06, R.d * 0.92, 'decor'));
    desk.position.set(0, D + 0.06, 0.03);
    desk.rotation.x = -0.9;
    api.add(desk);
    const lip = ownBox(api, slabBox(R.w, 0.06, 0.08, 'dark'));
    lip.position.set(0, D - 0.05, R.d * 0.34);
    api.add(lip, { pickable: false });
    const holder = ownBox(api, slabBox(0.07, 0.16, 0.07, 'dark'));
    holder.position.set(R.w * 0.56, D + 0.02, 0.02);
    api.add(holder, { pickable: false });
    const pencil = buildPencil();
    pencil.group.position.set(R.w * 0.56, D + 0.16, 0.02);
    pencil.group.rotation.set(0, 0, 0.16);
    api.group.add(pencil.group);
    api.own(pencil.dispose);
  } else {
    const box = ownBox(api, slabBox(R.w * 1.06, D * 0.78, R.d * 0.92, 'pedestal'));
    box.position.y = D * 0.39;
    api.add(box);
    const pad = ownBox(api, slabBox(R.w * 0.78, 0.09, R.d * 0.62, 'decor'));
    pad.position.set(-0.05, D * 0.78 + 0.045, 0.02);
    api.add(pad);
    const leaf = ownBox(api, slabBox(R.w * 0.78, 0.02, R.d * 0.62, 'dark'));
    leaf.position.set(-0.05, D * 0.78 + 0.10, 0.02);
    leaf.rotation.z = 0.05;
    api.add(leaf, { pickable: false });
    const pencil = buildPencil();
    pencil.group.position.set(R.w * 0.40, D * 0.78 + 0.03, 0.10);
    pencil.group.rotation.set(0, 0.5, 0);
    api.group.add(pencil.group);
    api.own(pencil.dispose);
    // У варианта C подпись выгравирована на передней грани тумбы, а не на полу.
    if (api.label) {
      api.label.rotation.set(0, 0, 0);
      api.label.position.set(0, D * 0.34, R.d * 0.46 + 0.005);
    }
  }
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
export function buildUpgrade(variant = 'A') {
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

  if (variant === 'A') {
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
  } else if (variant === 'B') {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = ownBox(api, slabBox(0.08, D, 0.08, 'dark'));
      leg.position.set(sx * U.w * 0.40, D / 2, sz * U.d * 0.30);
      api.add(leg, { pickable: false });
    }
    const top = ownBox(api, slabBox(U.w * 1.02, 0.08, U.d * 0.74, 'decor'));
    top.position.y = D + 0.04;
    api.add(top);
    const frameL = ownBox(api, slabBox(0.06, 0.52, 0.06, 'pedestal'));
    frameL.position.set(-U.w * 0.34, D + 0.30, -U.d * 0.20);
    api.add(frameL, { pickable: false });
    const frameR = ownBox(api, slabBox(0.06, 0.52, 0.06, 'pedestal'));
    frameR.position.set(U.w * 0.34, D + 0.30, -U.d * 0.20);
    api.add(frameR, { pickable: false });
    const beam = ownBox(api, slabBox(U.w * 0.76, 0.06, 0.06, 'pedestal'));
    beam.position.set(0, D + 0.56, -U.d * 0.20);
    api.add(beam, { pickable: false });
    for (let i = -1; i <= 1; i++) {
      const socket = hexPlate(0.10, 0.03, 'dark');
      socket.rotation.x = Math.PI / 2;
      socket.position.set(i * 0.26, D + 0.34, -U.d * 0.20 + 0.04);
      api.add(socket, { pickable: false });
    }
  } else {
    const foot = hexPlate(U.w * 0.46, 0.10, 'dark');
    foot.position.y = 0.05;
    api.add(foot, { pickable: false });
    const shaft = hexPlate(U.w * 0.27, D * 1.35, 'pedestal');
    shaft.position.y = 0.10 + D * 0.675;
    api.add(shaft);
    const cap = hexPlate(U.w * 0.33, 0.09, 'decor');
    cap.position.y = 0.10 + D * 1.35 + 0.045;
    api.add(cap, { pickable: false });
    // Три пустые врезки на гранях столба — места под грани бойца.
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      const notch = hexPlate(0.085, 0.02, 'dark');
      notch.rotation.set(Math.PI / 2, 0, -a);
      notch.position.set(
        Math.sin(a) * U.w * 0.255,
        0.10 + D * 0.42 + i * 0.26,
        Math.cos(a) * U.w * 0.255,
      );
      api.add(notch, { pickable: false });
    }
  }
  return api;
}

// ═══════════════════ SHOP и КАБИНЕТ — предметами, а не кнопками ═══════════════════
// Сейчас это две плоские кнопки на всех игровых экранах (полоса .hs-strip).
//   A · ШКАФ + ЗЕРКАЛО — витрина-локер для магазина, узкая стойка-зеркало для кабинета.
//   B · ДВЕРИ — две плиты-створки в торце зала; кабинет уже магазина.
//   C · ТУМБА С СУМКОЙ + ЖЕТОН — низкая тумба, на ней сумка; кабинет — жетон на ножке.
export function buildShop(variant = 'A') {
  const S = FORGE_PROPS.shop;
  const api = propShell(S.label, S.w * 1.35, 0.02, S.d * 0.7 + 0.20);
  if (api.label) api.label.rotation.x = -Math.PI / 2;
  const D = FORGE_PROPS.deskY;

  if (variant === 'A') {
    const body = ownBox(api, slabBox(S.w, D * 1.7, S.d, 'pedestal'));
    body.position.y = D * 0.85;
    api.add(body);
    const glass = ownBox(api, slabBox(S.w * 0.78, D * 0.9, 0.03, 'dark'));
    glass.position.set(0, D * 1.02, S.d / 2 + 0.015);
    api.add(glass, { pickable: false });
    for (let i = 0; i < 2; i++) {
      const shelf = ownBox(api, slabBox(S.w * 0.74, 0.03, S.d * 0.6, 'decor'));
      shelf.position.set(0, D * 0.78 + i * 0.34, 0);
      api.add(shelf, { pickable: false });
    }
  } else if (variant === 'B') {
    const frame = ownBox(api, slabBox(S.w * 1.2, D * 2.4, 0.12, 'dark'));
    frame.position.y = D * 1.2;
    api.add(frame, { pickable: false });
    const leaf = ownBox(api, slabBox(S.w * 0.98, D * 2.2, 0.06, 'pedestal'));
    leaf.position.set(0, D * 1.16, 0.07);
    api.add(leaf);
    const handle = ownBox(api, slabBox(0.05, 0.26, 0.05, 'decor'));
    handle.position.set(S.w * 0.36, D * 1.1, 0.12);
    api.add(handle, { pickable: false });
  } else {
    const box = ownBox(api, slabBox(S.w * 1.1, D * 0.72, S.d * 1.05, 'pedestal'));
    box.position.y = D * 0.36;
    api.add(box);
    const bag = ownBox(api, slabBox(S.w * 0.56, 0.30, S.d * 0.5, 'decor'));
    bag.position.y = D * 0.72 + 0.15;
    api.add(bag);
    const strap = ownBox(api, slabBox(S.w * 0.30, 0.16, 0.04, 'dark'));
    strap.position.set(0, D * 0.72 + 0.36, 0);
    api.add(strap, { pickable: false });
  }
  return api;
}

export function buildCabinet(variant = 'A') {
  const C = FORGE_PROPS.cabinet;
  const api = propShell(C.label, C.w * 1.75, 0.02, C.d * 0.7 + 0.20);
  if (api.label) api.label.rotation.x = -Math.PI / 2;
  const D = FORGE_PROPS.deskY;

  if (variant === 'A') {
    const post = ownBox(api, slabBox(C.w * 0.26, D * 1.1, C.d * 0.26, 'dark'));
    post.position.y = D * 0.55;
    api.add(post, { pickable: false });
    const mirror = ownBox(api, slabBox(C.w, D * 1.05, 0.05, 'pedestal'));
    mirror.position.set(0, D * 1.5, 0);
    mirror.rotation.x = -0.10;
    api.add(mirror);
    const pane = ownBox(api, slabBox(C.w * 0.78, D * 0.82, 0.02, 'decor'));
    pane.position.set(0, D * 1.5, 0.035);
    pane.rotation.x = -0.10;
    api.add(pane, { pickable: false });
  } else if (variant === 'B') {
    const frame = ownBox(api, slabBox(C.w * 1.25, D * 2.1, 0.12, 'dark'));
    frame.position.y = D * 1.05;
    api.add(frame, { pickable: false });
    const leaf = ownBox(api, slabBox(C.w, D * 1.92, 0.06, 'pedestal'));
    leaf.position.set(0, D * 1.02, 0.07);
    api.add(leaf);
    const handle = ownBox(api, slabBox(0.05, 0.22, 0.05, 'decor'));
    handle.position.set(C.w * 0.32, D * 0.96, 0.12);
    api.add(handle, { pickable: false });
  } else {
    const stem = ownBox(api, slabBox(0.07, D * 1.05, 0.07, 'dark'));
    stem.position.y = D * 0.525;
    api.add(stem, { pickable: false });
    const footGeo = new THREE.CylinderGeometry(C.w * 0.42, C.w * 0.46, 0.06, 6);
    const footM = bodyMat('dark');
    const foot = new THREE.Mesh(footGeo, footM);
    foot.position.y = 0.03;
    api.group.add(foot);
    api.own(() => { footGeo.dispose(); footM.dispose(); });
    // Жетон — ромб-грань на ножке, тот же язык, что и хромовый аватар в полосе.
    const tagGeo = new THREE.CylinderGeometry(C.w * 0.5, C.w * 0.5, 0.05, 6);
    const tagM = bodyMat('pedestal');
    const tag = new THREE.Mesh(tagGeo, tagM);
    tag.rotation.set(Math.PI / 2, 0, Math.PI / 6);
    tag.position.y = D * 1.15;
    api.group.add(tag);
    api.hit.push(tag);
    api.own(() => { tagGeo.dispose(); tagM.dispose(); });
  }
  return api;
}

// ═══════════════════ ТАБЛО СТАТОВ — открывается нажатием на бойца ═══════════════════
// Поднимается из пола перед бойцом. Несёт ИМЕНА осей и ПУСТЫЕ жёлобы под
// значения: значения — это цифры, а их в этой работе нет (ТЗ §3.4, §7).
// Жёлоб оставлен нарочно пустым, чтобы на макете было видно, где они встанут.
export function buildStatsBoard(axisNames = []) {
  const S = FORGE_PROPS.stats;
  const group = new THREE.Group();
  const disposers = [];

  const back = slabBox(S.w, S.h, 0.05, 'pedestal');
  back.position.y = S.h / 2;
  group.add(back);
  disposers.push(() => { back.userData._geo.dispose(); back.userData._mat.dispose(); });

  const edge = slabBox(S.w * 1.04, 0.035, 0.07, 'dark');
  edge.position.y = S.h;
  group.add(edge);
  disposers.push(() => { edge.userData._geo.dispose(); edge.userData._mat.dispose(); });

  const rows = axisNames.slice(0, 8);
  const top = S.h - 0.16;
  const gap = rows.length > 1 ? (S.h - 0.30) / (rows.length - 1) : 0;
  rows.forEach((name, i) => {
    const y = top - i * gap;
    const l = buildLabel(name, S.w * 0.40, { align: 'left', dim: 0.85 });
    l.mesh.position.set(-S.w * 0.27, y, 0.032);
    group.add(l.mesh);
    disposers.push(l.dispose);
    // Пустой жёлоб — место под значение. Ничем не заполнен намеренно.
    const trough = slabBox(S.w * 0.40, 0.035, 0.02, 'dark');
    trough.position.set(S.w * 0.22, y, 0.031);
    group.add(trough);
    disposers.push(() => { trough.userData._geo.dispose(); trough.userData._mat.dispose(); });
  });

  let open = false;
  let phase = 0;   // 0 — спрятано, 1 — поднято
  group.position.y = S.riseFrom;
  group.visible = false;

  return {
    group,
    setOpen(on) { open = !!on; },
    isOpen: () => open,
    tick(dt, reduced) {
      const target = open ? 1 : 0;
      if (reduced) phase = target;
      else {
        const step = dt / S.riseDur;
        phase += Math.sign(target - phase) * Math.min(step, Math.abs(target - phase));
      }
      group.visible = phase > 0.001;
      group.position.y = S.riseFrom * (1 - phase);
      // Табло приподнимается и проявляется вместе — без второго свечения.
      group.traverse((o) => {
        if (o.isMesh && o.material && o.material.transparent) o.material.opacity = phase;
      });
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
