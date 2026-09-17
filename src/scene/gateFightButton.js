// gateFightButton.js — ОБЪЁМНАЯ КНОПКА СТАРТА в воротах.
//
// До неё в бой вела плоская кнопка внизу экрана — временная и названная
// временной с первого дня. Она честно работала, но читалась как элемент
// интерфейса поверх сцены, а не как предмет в ней: игрок выбирал бойцов в
// комнате, а выходил в бой нажатием на наклейку поверх комнаты.
//
// НОВОЙ ГЕОМЕТРИИ ЗДЕСЬ НЕТ. Корпус — та же плита, что у островов (`buildSlab`
// из modePlates), только меньше. Это не экономия: язык предметов в игре один, и
// вторая форма «тоже плита, но своя» — это место, где скос и обводка разойдутся
// на первой же правке. Кнопка отличается от острова размером, положением
// (ближе к камере) и стоящей на ней светящейся табличкой, а не силуэтом.
//
// ОДНО РОЗОВОЕ И ОДНО СВЕЧЕНИЕ. Розовый в игре принадлежит главному действию —
// и на шаге выбора бойцов главное действие ровно одно. Поэтому светится на этом
// шаге только кнопка, а ядра островов — нет. Пока состав не набран, кнопка
// ТУСКЛАЯ и не светится вовсе: обещать нажатие, за которым ничего не будет, —
// хуже, чем не обещать.
//
// СВЕТИТ ТАБЛИЧКА, А НЕ ДИСК. Плоский розовый диск в крышке снят: его место
// занял свет, идущий сквозь прорезанное слово FIGHT на объёмной табличке
// (gateFightPlaque.js). Тот же ход, что у эмблем на островах режима, — эмблема
// там ЗАМЕСТИЛА ядро острова, а не добавилась к нему, и по той же причине: два
// светящихся пятна на одном предмете — это два акцента, а акцент на предмете
// один. Числа яркости (coreDim / coreArmed / coreHoverBoost) остались от диска
// БЕЗ ИЗМЕНЕНИЙ и теперь правят панелью за прорезями: менялась картинка, а не
// отклик.
//
// ОРЕОЛ ОСТАЛСЯ. Он не второе свечение, а разлив первого: свет таблички лежит
// на крышке, под которой она стоит. Без него кнопка перестаёт отличаться от
// острова издали — с общего кадра ворот прорези занимают несколько пикселей.
//
// ОТКАЗ ТОТ ЖЕ, ЧТО У ЗАПЕРТОГО ОСТРОВА. Нажали, когда состав не собран, —
// короткая дрожь, и ничего больше. Механизм взят у островов дословно (и числа
// тоже), чтобы «нельзя» в воротах выглядело одинаково, откуда бы ни пришло.
//
// Экспортирует: FIGHT_BTN (настройки), buildGateFightButton.
import * as THREE from 'three';
import { buildSlab } from './modePlates.js';
import { buildFightPlaque } from './gateFightPlaque.js';
import { makeHexGridTexture } from './arenaTextures.js';

// ───────────────────────────── Настройки ─────────────────────────────
export const FIGHT_BTN = {
  // Размер — доля от острова (2.2 × 1.7 × 0.42). Меньше, но не марка: в неё
  // целятся пальцем, и она главный предмет шага.
  halfW: 1.45,
  halfD: 0.95,
  height: 0.34,

  // Насколько вынести вперёд от ближней кромки разложенных островов. Кнопка
  // обязана стоять БЛИЖЕ островов (так её видно первой и она не спорит с ними
  // за место), но не наезжать на их подписи: подпись висит под ближней кромкой
  // ряда, и зазор считается от неё.
  gap: 5.6,

  // Отделка — от островов, но корпус чуть светлее: предмет, к которому идут,
  // не должен тонуть в полу наравне с теми, из которых выбирают.
  body: 0x151a2b,
  rim: 0x6d7ea8,
  rimOpacity: 0.26,
  chamfer: 0.26,
  hexTile: 2.6,

  // Свет кнопки. Розовый — единственный на этом шаге (см. шапку). Числа те же,
  // что были у снятого диска: теперь они правят панелью за прорезями таблички.
  core: '#FF0069',
  coreDim: 0.10,        // не собран состав: тускло и без свечения
  coreArmed: 0.85,      // собран: горит
  coreHoverBoost: 0.15, // курсор поверх горящей — чуть ярче

  // Ореол — аддитивный диск на крышке, разлив света таблички. У островов его
  // нет вовсе: светится на этом шаге только кнопка.
  haloR: 1.15,
  haloArmed: 0.30,

  litLerp: 6.5,         // 1/с сглаживания — без щелчка

  // Отказ: те же числа, что у островов (gatePlates), намеренно.
  shakeMs: 380,
  shakeAmp: 0.075,
  shakeHz: 11,

  // Доля кадра, которую ТАБЛИЧКА занимает в конце подлёта «в лицо». Потолок ТЗ —
  // 0.85 по ширине, и доля здесь и есть эта доля: расстояние считается так, что
  // ширина прицела делит ширину кадра ровно в ней (islandDive.poseFor).
  // 0.72 — с запасом под потолок и с воздухом по кромкам, который ТЗ просит
  // отдельно (≥16 px).
  diveFill: 0.72,
  diveMinDist: 2.2,
};

const _v = new THREE.Vector3();

/** Мягкий круглый ореол — тот же приём, что под ядром бойца. */
function makeHaloTexture(hex) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  const col = new THREE.Color(hex);
  const rgb = `${Math.round(col.r * 255)}, ${Math.round(col.g * 255)}, ${Math.round(col.b * 255)}`;
  grad.addColorStop(0.0, `rgba(${rgb}, 0.85)`);
  grad.addColorStop(0.45, `rgba(${rgb}, 0.22)`);
  grad.addColorStop(1.0, `rgba(${rgb}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {object} opts
 * @param {number} [opts.maxAniso]
 * @returns {object} кнопка и её контракт — та же форма, что у островов
 */
export function buildGateFightButton(opts = {}) {
  const o = FIGHT_BTN;
  const root = new THREE.Group();

  const hexTex = makeHexGridTexture(opts.maxAniso || 1);
  hexTex.repeat.set(1, 1);
  const slab = buildSlab(o.halfW, o.halfD, o.height, hexTex, o);
  root.add(slab.group);

  // Табличка со словом FIGHT. Она же несёт весь свет кнопки — плоского диска в
  // крышке больше нет (см. шапку).
  const plaque = buildFightPlaque({ plateHalfW: o.halfW, topY: slab.topY, glowColor: o.core });
  root.add(plaque.group);

  // Ореол — разлив света таблички по крышке, под которой она стоит. Он слабее
  // самих прорезей намеренно: светится ПРЕДМЕТ, а пятно только объясняет, от
  // чего свет. Без него кнопка перестаёт отличаться от острова издали — с общего
  // кадра ворот прорези занимают несколько пикселей.
  const haloTex = makeHaloTexture(o.core);
  const haloGeo = new THREE.PlaneGeometry(o.haloR * 2, o.haloR * 2);
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = slab.topY + 0.006;
  root.add(halo);

  // Невидимая коробка — одна цель для луча на весь предмет, как у островов.
  //
  // ⚠️ КОРОБКА ДОРОСЛА ДО ВЕРХА ТАБЛИЧКИ, и это не удобство, а требование: в
  // кнопку целятся пальцем, а глазами целятся в надпись. Коробка по одной
  // плите означала бы, что нажатие ровно в слово FIGHT не попадает НИКУДА —
  // луч прошёл бы над крышкой. Низ остаётся прежним (плита с запасом снизу),
  // так что площадь только выросла.
  const pickTop = plaque.top + o.height * 0.2;
  const pickBot = -o.height * 0.6;
  const pickGeo = new THREE.BoxGeometry(o.halfW * 2, pickTop - pickBot, o.halfD * 2);
  const pick = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ visible: false }));
  pick.position.y = (pickTop + pickBot) / 2;
  pick.userData.gateFight = true;
  root.add(pick);

  let armed = false;
  let hovered = false;
  let lit = 0;          // 0…1 — сглаженная «собранность»
  let hoverLit = 0;
  let baseX = 0, baseZ = 0;
  let shakeUntil = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /**
   * Поставить кнопку перед разложенными островами.
   * @param {{halfD:number}} bounds габарит островов — от него и отступаем
   */
  function place(bounds) {
    baseX = 0;
    baseZ = (bounds ? bounds.halfD : 0) + o.gap + o.halfD;
    root.position.set(baseX, 0, baseZ);
  }

  /** Собран ли состав. Не собран — тускло, без свечения и без курсора-пальца. */
  function setArmed(on) { armed = !!on; }
  function setHover(on) { hovered = !!on; }
  function refuse() { shakeUntil = now() + o.shakeMs; }
  function shaking() { return shakeUntil > now(); }

  /**
   * Прицел для подлёта — та же форма, что у островов (её ждёт islandDive).
   *
   * ЦЕЛИМСЯ В ТАБЛИЧКУ, А НЕ В ПЛИТУ. Подлёт «в лицо» показывает лицо, а лицо
   * кнопки — это слово. Пока прицелом была плита, камера подъезжала к пустой
   * крышке, а надпись висела над кадром. Половина ВЫСОТЫ берётся по наклонённой
   * табличке (её проекция на вертикаль), иначе камера подходит слишком близко и
   * срезает верх слова.
   */
  function aimFor() {
    const rise = plaque.halfH * Math.cos(plaque.tilt);
    _v.set(0, plaque.top - rise, 0);
    const point = root.localToWorld(_v.clone());
    return {
      point,
      halfW: plaque.halfW,
      halfH: rise,
      fill: o.diveFill,
      minDist: o.diveMinDist,
      // ПОДЛЁТ В ЛИЦО. У острова направление берут то, с которого игрок смотрит:
      // остров — дверь, и въезжать в неё всегда с одной стороны значило бы
      // отменять его поворот. Кнопка — не дверь, у неё есть лицо: табличка со
      // словом. Поэтому направление задаём мы, и камера приходит спереди-сверху,
      // а не с той стороны, куда игрок случайно отвернул.
      //
      // Луч ИДЁТ ПО НОРМАЛИ ТАБЛИЧКИ: она откинута ровно настолько, насколько
      // поднята камера покоя, и подлетать к ней под другим углом значило бы
      // показывать крупно то, что в покое читалось прямо. Одно число на оба
      // случая — наклон таблички.
      dir: new THREE.Vector3(0, Math.sin(plaque.tilt), Math.cos(plaque.tilt)).normalize(),
    };
  }

  function update(t, dt) {
    const k = 1 - Math.exp(-o.litLerp * dt);
    lit += ((armed ? 1 : 0) - lit) * k;
    hoverLit += ((armed && hovered ? 1 : 0) - hoverLit) * k;

    plaque.setLit(o.coreDim + (o.coreArmed - o.coreDim) * lit + o.coreHoverBoost * hoverLit);
    haloMat.opacity = o.haloArmed * lit * (1 + 0.35 * hoverLit);
    slab.rimMat.opacity = o.rimOpacity * (1 + lit * 1.4);

    const tNow = now();
    if (shakeUntil > tNow) {
      const left = (shakeUntil - tNow) / o.shakeMs;
      const a = o.shakeAmp * left;
      root.position.x = baseX + a * Math.sin((tNow / 1000) * Math.PI * 2 * o.shakeHz);
    } else if (root.position.x !== baseX) {
      root.position.x = baseX;
    }
  }

  function dispose() {
    slab.dispose();
    plaque.dispose();
    haloGeo.dispose(); haloMat.dispose(); haloTex.dispose();
    pickGeo.dispose(); pick.material.dispose();
    hexTex.dispose();
  }

  return {
    group: root, pick, slab, plaque,
    place, setArmed, setHover, refuse, shaking, aimFor, update, dispose,
    get armed() { return armed; },
  };
}
