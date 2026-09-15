// gatePlates.js — ПЕРВЫЕ ОСТРОВА ВОРОТ: выбор режима боя. DUEL и SQUAD.
//
// ФОРМА ТА ЖЕ, ОТДЕЛКА СВОЯ. Геометрия острова берётся готовой из modePlates
// (`buildSlab`): язык островов в игре один, и рисовать вторую такую же плиту
// значило бы завести место, где скос и обводка могут разойтись между двумя
// дверями. А вот всё, что красит, — тон корпуса, обводка, цвет ядра, плотность
// решётки — здесь своё: игрок должен понимать, что он В ДРУГОМ МЕСТЕ, а не на
// том же экране режимов.
//
// ЭМБЛЕМ НЕТ. На островах дома стоят фигуры — гексарх с учениками, разлом с
// перчатками. Здесь их нет намеренно (решение владельца, ТЗ v7 §5): новую
// геометрию под первую сборку не лепим. Режим несут подпись и цвет ядра. Если
// на приёмке окажется, что этого мало, — рисуем эмблемы отдельной работой, уже
// зная, чего именно не хватило.
//
// ОДНО СВЕЧЕНИЕ. Оба острова светиться не могут никогда: горит только тот, на
// который наведён курсор, второй в это время притухает. Запертый остров не
// загорается вообще — это и есть его главный признак, читаемый раньше подписи.
//
// ОТКАЗ ВИДЕН, А НЕ СЛЫШЕН. Клик по запертому острову не ведёт никуда и коротко
// дрожит. Дрожит предмет целиком, вместе со своей подписью (см. gatePlateTags):
// дрогнувшая плита при неподвижном имени читается как сбой отрисовки.
//
// Экспортирует: GATE_PLATES (настройки), buildGatePlates.
import * as THREE from 'three';
import { buildSlab } from './modePlates.js';
import { makeHexGridTexture } from './arenaTextures.js';
import { ARENA_MODES } from '@/data/arenaModes.js';

// ───────────────────────────── Настройки ─────────────────────────────
export const GATE_PLATES = {
  // Размер и раскладка. Лёжа острова стоят рядом, стоя — уходят в глубину:
  // так пара продолжает заполнять кадр, а не сжимается в узкую полоску. Это
  // тот же приём, что на островах дома, и то же объяснение.
  halfW: 2.2,
  halfD: 1.7,
  height: 0.42,
  spreadX: 2.9,        // ±X каждого острова (лёжа) — зазор 2.9−2.2−2.2 ≈ −1.5?
                       // нет: halfW 2.2 при ±2.9 даёт зазор 1.4, острова стоят врозь
  // Стоя разносим ЗАМЕТНО сильнее: острова уходят в глубину, и перспектива
  // съедает расстояние между ними. При ±3.0 они почти соприкасались — пара
  // читалась одной длинной плитой, а подпись дальнего ложилась на ближний.
  spreadZ: 4.4,        // ±Z каждого острова (стоя), halfD 1.7 → зазор 1.0
  portraitAspect: 1.0, // уже этого соотношения — раскладка «в глубину»

  // Отделка. Холоднее и темнее островов дома: ворота — преддверие боя, а не
  // развилка. Обводка матовая, своего света у неё нет.
  body: 0x10131f,
  rim: 0x5c6b94,
  rimOpacity: 0.22,
  chamfer: 0.34,       // скос угла — тот же, что у островов дома: форма общая
  hexTile: 4.2,        // мировой размер одной ячейки решётки на крышке

  // Цвет ядра каждого режима. Розовый не берём: он принадлежит интерфейсу и
  // деньгам, а здесь предметы. Холодный для дуэли, тёплый для команды.
  duelCore: '#4DD9FF',
  squadCore: '#FFB21D',

  dimLevel: 0.5,       // яркость НЕподсвеченного острова, пока горит другой
  litLerp: 6.5,        // 1/с сглаживания подсветки — без щелчка
  lockedLit: 0.0,      // запертый не загорается никогда

  // Ядро — плоский светящийся диск в крышке острова. Не сфера и не столб: на
  // плите, которую разглядывают сверху-сбоку, диск читается, а столб спорит с
  // подлётом камеры.
  coreR: 0.40,
  coreLift: 0.012,     // над крышкой, чтобы не спорить за глубину
  coreDim: 0.16,       // яркость ядра в покое (запертый стоит на ней всегда)
  coreLitBoost: 0.72,  // добавка яркости подсвеченному

  // Отказ: короткое дрожание запертого острова.
  shakeMs: 380,
  shakeAmp: 0.075,     // мировых единиц вбок
  shakeHz: 11,

  // Подпись встаёт под БЛИЖНЕЙ кромкой острова, а не под его центром: от центра
  // она при взгляде сверху-сбоку ложится на саму плиту. Отступ в мировых
  // единицах — он переводится в пиксели проекцией, поэтому при зуме подпись не
  // отрывается от предмета.
  captionDrop: 0.35,
};

const _v = new THREE.Vector3();

/** Плоский диск-ядро в крышке острова. */
function buildCore(colorHex, topY) {
  const geo = new THREE.CircleGeometry(GATE_PLATES.coreR, 40);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: GATE_PLATES.coreDim,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = topY + GATE_PLATES.coreLift;
  return { mesh, mat, dispose: () => { geo.dispose(); mat.dispose(); } };
}

/**
 * @param {object} opts
 * @param {number} [opts.maxAniso]
 * @returns {object} острова + их общий контракт
 */
export function buildGatePlates(opts = {}) {
  const o = GATE_PLATES;
  const group = new THREE.Group();
  const hexTex = makeHexGridTexture(opts.maxAniso || 1);
  hexTex.repeat.set(1, 1);

  const make = (mode) => {
    const root = new THREE.Group();
    const slab = buildSlab(o.halfW, o.halfD, o.height, hexTex, o);
    root.add(slab.group);

    const core = buildCore(mode.id === 'duel' ? o.duelCore : o.squadCore, slab.topY);
    root.add(core.mesh);

    // Одна невидимая коробка на остров — дешёвая цель для луча, и заодно она
    // делает весь остров ОДНИМ предметом: наведение не зависит от того, попал
    // ли курсор в крышку или в бок.
    const pickGeo = new THREE.BoxGeometry(o.halfW * 2, o.height * 2.2, o.halfD * 2);
    const pick = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ visible: false }));
    pick.position.y = o.height * 0.6;
    pick.userData.gatePlate = mode.id;
    root.add(pick);

    group.add(root);
    return {
      id: mode.id,
      locked: mode.locked,
      root, slab, core, pick, pickGeo,
      lit: 0,        // 0…1 — собственная подсветка
      level: 1,      // 1…dimLevel — насколько его топит свет соседа
      baseX: 0, baseZ: 0,   // поза без дрожания (ставит layout)
      shakeUntil: 0,
    };
  };

  const plates = {};
  for (const m of ARENA_MODES) plates[m.id] = make(m);
  const list = Object.values(plates);
  const pickables = list.map((p) => p.pick);

  let hovered = null;
  let portrait = false;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /** Разложить пару под текущее соотношение кадра. */
  function layout(aspect) {
    portrait = aspect < o.portraitAspect;
    list.forEach((p, i) => {
      const sign = i === 0 ? -1 : 1;
      p.baseX = portrait ? 0 : sign * o.spreadX;
      p.baseZ = portrait ? sign * o.spreadZ : 0;
      p.root.position.set(p.baseX, 0, p.baseZ);
    });
  }

  /** Подсветить остров. Запертый не подсвечивается — у него это и есть признак. */
  function setHover(id) {
    const p = id ? plates[id] : null;
    hovered = (p && !p.locked) ? id : null;
  }

  /** Отказать: коротко дрогнуть островом. Возвращает false, если острова нет. */
  function refuse(id) {
    const p = plates[id];
    if (!p) return false;
    p.shakeUntil = now() + o.shakeMs;
    return true;
  }

  /**
   * Прицел для пролёта внутрь острова — та же форма, что отдаёт modePlates.aimFor,
   * потому что её ждёт тот же режиссёр (islandDive).
   */
  function aimFor(id) {
    const p = plates[id];
    if (!p) return null;
    _v.set(0, o.height * 0.5, 0);
    const point = p.root.localToWorld(_v.clone());
    return {
      point,
      halfW: o.halfW,
      halfH: o.height * 0.5 + o.coreR,
      fill: 0.88,
      minDist: 1.2,
    };
  }

  /** Экранная точка, куда встаёт верх подписи. */
  function captionScreen(id, camera, w, h) {
    const p = plates[id];
    if (!p) return { x: 0, y: 0, visible: false };
    // Точка отсчёта — ближняя к камере кромка плиты. Какая из двух ближняя,
    // решает раскладка: лёжа острова стоят по X и ближняя кромка у обоих одна и
    // та же (+Z), стоя они уходят в глубину, и у дальнего ближняя всё равно +Z.
    _v.set(0, -o.captionDrop, o.halfD);
    p.root.localToWorld(_v);
    _v.project(camera);
    const visible = _v.z < 1 && _v.x > -1.6 && _v.x < 1.6;
    return {
      x: (_v.x * 0.5 + 0.5) * w,
      y: (-_v.y * 0.5 + 0.5) * h,
      visible,
    };
  }

  /** Кадр: подсветка, ядро, дрожание отказа. */
  function update(t, dt) {
    const k = 1 - Math.exp(-o.litLerp * dt);
    const tNow = now();

    for (const p of list) {
      const wantLit = p.locked ? o.lockedLit : (hovered === p.id ? 1 : 0);
      const wantLevel = (hovered && hovered !== p.id) ? o.dimLevel : 1;
      p.lit += (wantLit - p.lit) * k;
      p.level += (wantLevel - p.level) * k;

      p.slab.rimMat.opacity = o.rimOpacity * p.level * (1 + p.lit * 1.6);
      p.slab.hexMat.opacity = 0.55 * p.level;
      p.core.mat.opacity = (o.coreDim + o.coreLitBoost * p.lit) * p.level;

      // Дрожание — только по X/Z, вокруг позы, которую поставил layout. Оно
      // затухает само: амплитуда падает к концу, иначе остров останавливается
      // рывком и это читается как поломка, а не как отказ.
      if (p.shakeUntil > tNow) {
        const left = (p.shakeUntil - tNow) / o.shakeMs;      // 1 → 0
        const a = o.shakeAmp * left;
        const ph = Math.sin((tNow / 1000) * Math.PI * 2 * o.shakeHz);
        p.root.position.x = p.baseX + (portrait ? a * ph : a * ph);
        p.root.position.z = p.baseZ + (portrait ? 0 : 0);
      } else if (p.root.position.x !== p.baseX || p.root.position.z !== p.baseZ) {
        p.root.position.set(p.baseX, 0, p.baseZ);
      }
    }
  }

  /** Дрожит ли остров прямо сейчас — вид синхронит подпись по этому. */
  function shaking(id) {
    const p = plates[id];
    return !!p && p.shakeUntil > now();
  }

  function dispose() {
    for (const p of list) {
      p.slab.dispose();
      p.core.dispose();
      p.pickGeo.dispose();
      p.pick.material.dispose();
    }
    hexTex.dispose();
  }

  return {
    group, plates, list, pickables,
    layout, setHover, refuse, aimFor, captionScreen, update, shaking, dispose,
    get hovered() { return hovered; },
  };
}
