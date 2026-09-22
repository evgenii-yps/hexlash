// The player's roster — the list of fighters they own.
//
// WHY THIS EXISTS SEPARATELY FROM `prefight`. Today the thing the player fights
// with is not a fighter at all: it is a core id plus a tree of lit facets, with
// no name and no record (see prefightState.js). The roster is the real article —
// named fighters that persist and that the FORGE hall lets the player choose
// between. Since 15.09.2026 the fight is handed one of THESE: `prefight` keeps a
// pointer at a roster fighter and reads his core and his facets back through here.
// The direction matters — nothing in this module touches `prefight`, so the
// record below stays the single source of truth for what a fighter is.
//
// PERSISTED in its own section of the same per-tab save as `prefight`
// (src/services/playerProgress.js): survives a refresh, dies with the tab.
// Only the four settled fields go to storage — see snapshotOf. Anything the save
// carries that this build does not know about is ignored on restore rather than
// crashing, so a roster written by a future version cannot break an older one.
//
// ТРЕНИРОВКА ЖИВЁТ ЗДЕСЬ (18.09.2026). У бойца три состояния, и они выводятся
// из ДВУХ полей, а не хранятся третьим словом:
//
//   свободен  — lesson пуст, ready ложь
//   занят     — lesson есть и его срок ещё не вышел
//   готов     — ready истина (занятие отработано, право на грань не забрано)
//
// ≠ НИКОГДА БОЛЬШЕ ОДНОГО НЕЗАБРАННОГО ПРАВА. Готовому нельзя назначить
//   занятие, а погасить грань можно только тому, у кого права нет. Иначе право
//   КОПИТСЯ, а копиться в этой работе ничему нельзя (ТЗ §4.1).
//
// `busy` — ПРОИЗВОДНОЕ от lesson, а не вторая правда. Поле осталось потому,
// что его уже читают два экрана состава («IN THE FORGE», карточка не нажимается), и
// держится в согласии одной мутацией SETTLE. Само оно НЕ СОХРАНЯЕТСЯ: сохранённое
// «занят» разошлось бы со сроком занятия в первый же раз, когда срок вышел без нас.
//
// WHO IS SELECTED lives here too (15.09.2026). It used to be plain component
// state inside the FORGE hall, so a refresh — or a trip to the arena and back —
// silently threw the choice away and the hall re-picked the oldest fighter. It is
// stored as a REFERENCE (the fighter's id), never a copy of the fighter: a copy
// would drift the moment the fighter is upgraded or dismissed. An id that no
// longer matches anybody is treated as "nothing selected" on restore, which is
// exactly the state the hall's own auto-pick is built to fill.
import { CORES, RESOURCE } from '@/data/upgradeData.js';
import { buildTree, litIdsOf, countLit } from '@/data/upgradeTree.js';
import { pickCallsign } from '@/data/callsigns.js';
import { readSection, writeSection } from '@/services/playerProgress.js';
import { LESSON_MS, lessonEndsAt, assignGate, facetGate, stateOf } from '@/services/training.js';

// ───────────────────────────── CONFIG ─────────────────────────────
// Cap. Ten is what the FORGE hall is laid out for: one arc, one personal zone per
// fighter, none of them touching (see ARC / ZONE in PveScene.vue). It was eight
// while the hall packed them into two rows; raising it came WITH that new layout,
// which is the only way this number is ever allowed to move.
export const ROSTER_MAX = 10;

const SECTION = 'roster';
const CORE_IDS = CORES.map((c) => c.id);

// ───────────────────── Стартовая тройка ─────────────────────
// Новому гостю выдаётся три бойца РАЗНЫХ ядер. До этого ростер был пуст, и зал
// FORGE встречал новичка пустотой — сравнивать нечего, качать некого, идти в бой
// не с кем.
//
// Почему три, а не один и не все четыре (решение владельца). Одного бойца не с
// чем сравнить: игрок не поймёт, что ядро вообще на что-то влияет. Четыре — это
// весь набор сразу, и в магазине становится нечего покупать. Три разных ядра
// дают контраст характеров — таран, стена, засада — и оставляют RAIDER поводом
// вернуться в магазин.
//
// Порядок здесь — порядок в зале: ниже он закрепляется временем создания.
const STARTER_CORES = ['natisk', 'skala', 'zasada']; // ONSLAUGHT · BULWARK · AMBUSH

/** A fighter as the rest of the app sees it. `upgrade` / `record` are the seats
 *  kept for the next passes (per-fighter progression, fight history); they are
 *  null today and are NOT written to storage while they stay null. */
function makeFighter(callsign, core) {
    return {
        id: newId(),
        callsign,
        core,                 // canonical core id ('natisk' | 'nalet' | 'skala' | 'zasada')
        createdAt: Date.now(),
        upgrade: null,        // working upgrade tree, built on demand (see ensureTree)
        record: null,         // ← fights / wins land here
        // ТРЕНИРОВКА. Занятие — не накопление, а событие: началось и кончилось.
        // Хранится один СРОК — когда оно кончится, — а не остаток и не доля
        // пройденного: остаток пришлось бы тикать и сохранять, а срок просто лежит
        // и переживает и обновление страницы, и поход на арену (ТЗ §6.1–§6.2).
        lesson: null,         // { until } — идёт занятие; null — не идёт
        ready: false,         // занятие отработано, право на грань не забрано
        // ПРОИЗВОДНОЕ от lesson — см. шапку файла. Читают экраны состава.
        busy: false,
    };
}

function newId() {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch (_) { /* fall through to the cheap id */ }
    return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- save shape: { fighters: [...], picked?, seeded? }
// `lit` is the small form of the upgrade tree ({ crystalId: [faceId] }) and is
// written only once something is lit — an untouched fighter costs nothing.
// `picked` is one id and is written only while somebody IS selected; "nobody
// selected" is the absence of the key, not a stored null.
// `seeded` — стартовая тройка уже выдана. См. ниже, почему она не может быть
// просто «ростер не пуст».
// `tr` — срок идущего занятия, `rdy` — незабранное право на грань. Пишутся
// только когда есть: боец, который не занимался, не должен стоить места в сейфе.
// ⚠️ `busy` БОЛЬШЕ НЕ ПИШЕТСЯ: оно производное от срока, и сохранённое «занят»
//    разошлось бы со сроком в первый же раз, когда занятие кончилось без нас.
function snapshotOf(s) {
    // ⚠️ Пустой ростер БОЛЬШЕ НЕ СТИРАЕТ секцию. Раньше стирал — и это ровно то,
    // что ломало бы обещание «распустил всех → тройка заново не выдаётся»:
    // стёртая секция на следующей загрузке неотличима от первого входа. Теперь
    // в секции остаётся отметка о выдаче, даже когда бойцов ноль.
    if (!s.fighters.length && !s.seeded) return null;
    const out = {
        fighters: s.fighters.map((f) => {
            const row = { id: f.id, callsign: f.callsign, core: f.core, createdAt: f.createdAt };
            const lit = litIdsOf(f.upgrade);
            if (Object.keys(lit).length) row.lit = lit;
            if (f.lesson) row.tr = f.lesson.until;
            if (f.ready) row.rdy = true;
            return row;
        }),
    };
    if (s.pickedId) out.picked = s.pickedId;
    if (s.seeded) out.seeded = true;
    return out;
}

function persist(s) {
    writeSection(SECTION, snapshotOf(s));
}

// ЗАНЯТИЕ ИЗ СЕЙФА. Срок берётся, только если он вообще похож на срок и не
// уходит в будущее дальше, чем одно занятие: переведённые назад часы не должны
// запереть бойца в занятии навсегда. Мусор — это просто «свободен».
//
// Старые сейфы этих полей не несут вовсе, и все тамошние бойцы начинают
// свободными — ровно как требует ТЗ §4.4. Зажжённые грани при этом не трогаются.
function restoreLesson(raw) {
    if (!Number.isFinite(raw)) return null;
    const until = Math.floor(raw);
    if (until <= Date.now()) return null;                  // срок вышел без нас
    if (until > Date.now() + LESSON_MS) return null;       // часы уехали — не запираем
    return { until };
}

// Rebuild from the save, keeping only records this build can actually read.
// A record with an unknown core, or without an id/callsign, is dropped rather
// than repaired; extra fields are ignored. The cap is re-applied here too, so a
// save made when the cap was higher cannot exceed today's limit.
function restore() {
    const saved = readSection(SECTION);
    const raw = saved && Array.isArray(saved.fighters) ? saved.fighters : [];
    const out = [];
    const seen = new Set();
    for (const f of raw) {
        if (out.length >= ROSTER_MAX) break;
        if (!f || typeof f !== 'object') continue;
        if (typeof f.id !== 'string' || typeof f.callsign !== 'string') continue;
        if (!CORE_IDS.includes(f.core)) continue;
        if (seen.has(f.id)) continue;
        seen.add(f.id);
        // A tree is rebuilt only when the save says something was lit; the caps
        // are re-applied inside buildTree. Junk in `lit` costs this fighter its
        // progression and nobody else's (a broken record is not repaired).
        const lit = f.lit && typeof f.lit === 'object' ? f.lit : null;
        out.push({
            id: f.id,
            callsign: f.callsign,
            core: f.core,
            createdAt: typeof f.createdAt === 'number' ? f.createdAt : 0,
            upgrade: lit ? buildTree(f.core, lit) : null,
            record: null,
            lesson: restoreLesson(f.tr),
            // Срок вышел, пока вкладка была закрыта — это не потеря, а отработанное
            // занятие: игрок найдёт бойца готовым, а не свободным.
            ready: f.rdy === true || (Number.isFinite(f.tr) && f.tr <= Date.now()),
            busy: false,   // производное; выставит SETTLE ниже
        });
    }
    // The saved selection is kept ONLY if it still points at somebody who
    // survived the restore above (dismissed fighter, record dropped as broken,
    // roster cap lowered). Otherwise: nobody selected — the hall's auto-pick
    // then takes the oldest fighter, which is what a first visit does anyway.
    const pickedId = saved && typeof saved.picked === 'string'
        && out.some((f) => f.id === saved.picked)
        ? saved.picked
        : null;
    return { fighters: out, pickedId, seeded: saved ? saved.seeded === true : false };
}

// ЗАНЯТИЕ КОНЧИЛОСЬ — единственное место, где занятый становится готовым.
//
// Зовётся и по часам из открытого зала, и при входе на экраны состава, и один
// раз при подъёме списка. Идемпотентно и стоит ноль: бойцов десять.
// Возвращает true, если что-то изменилось — только тогда нужна запись в сейф.
function settleList(list, now) {
    let changed = false;
    for (const f of list) {
        const on = !!f.lesson && f.lesson.until > now;
        if (f.lesson && !on) {          // срок вышел — занятие отработано
            f.lesson = null;
            f.ready = true;
            changed = true;
        }
        if (f.busy !== on) { f.busy = on; changed = true; }
    }
    return changed;
}

const restored = restore();
settleList(restored.fighters, Date.now());

/** Три бойца разных ядер, имена — существующим раздатчиком позывных. */
function makeStarterRoster() {
    const taken = [];
    return STARTER_CORES.map((core, i) => {
        const f = makeFighter(pickCallsign(taken), core);
        taken.push(f.callsign);
        // Порядок в зале — по времени создания (см. геттер fighters). Три бойца,
        // рождённые в одну миллисекунду, встали бы в произвольном порядке;
        // сдвиг на индекс делает его тем, что объявлен в STARTER_CORES.
        f.createdAt += i;
        return f;
    });
}

// Выдаём ТОЛЬКО когда отметки нет И бойцов нет. Два условия, а не одно:
//   • нет отметки, но бойцы есть — это игрок, чей сейф записан до появления
//     тройки. Выдать ему тройку значит стереть его ростер;
//   • отметка есть, бойцов нет — игрок распустил всех. Пустой ростер остаётся
//     пустым, экраны показывают честное пустое состояние.
const needStarter = !restored.seeded && restored.fighters.length === 0;

const state = {
    fighters: needStarter ? makeStarterRoster() : restored.fighters,
    // Who the FORGE hall is working on. An id, not a fighter (see the header).
    pickedId: restored.pickedId,
    // Отметка ставится и тому, кто тройку получил, и тому, у кого ростер уже был:
    // оба — не новички, и обоим выдавать больше нечего.
    seeded: true,
};

// Записываем сразу, а не ждём первой правки ростера. Иначе игрок, обновивший
// страницу до первого действия, получил бы ДРУГУЮ тройку — с другими позывными
// и другими идентификаторами.
if (needStarter) writeSection(SECTION, snapshotOf(state));

const getters = {
    // Oldest first: the list then has a natural order that never reshuffles.
    fighters: (s) => [...s.fighters].sort((a, b) => a.createdAt - b.createdAt),
    count: (s) => s.fighters.length,
    isFull: (s) => s.fighters.length >= ROSTER_MAX,
    max: () => ROSTER_MAX,
    byId: (s) => (id) => s.fighters.find((f) => f.id === id) || null,
    pickedId: (s) => s.pickedId,
    // The selected fighter resolved through the roster — always the live record,
    // never a stale copy. Null when nobody is selected, or when the stored id
    // stopped matching anybody.
    picked: (s) => s.fighters.find((f) => f.id === s.pickedId) || null,
    // СОСТОЯНИЕ И ВОРОТА — через список бойцов, чтобы экраны не заводили
    // своих копий проверки. Сами правила живут в services/training.js — и там же
    // их берёт действие ниже, так что отказ и объяснение не могут разойтись.
    trainingState: (s) => (id) => stateOf(s.fighters.find((f) => f.id === id) || null),
    /** Причина, по которой занятие нельзя назначить, или null. */
    assignBlock: (s) => (id) => {
        const f = s.fighters.find((x) => x.id === id);
        if (!f) return 'none';
        return assignGate(f, countLit(f.upgrade), RESOURCE);
    },
    /** Причина, по которой грань нельзя зажечь, или null. */
    lightBlock: (s) => (id) => {
        const f = s.fighters.find((x) => x.id === id);
        return f ? facetGate(f, true) : 'none';
    },
    // Points spent / available FOR ONE FIGHTER — the pool is per fighter, not
    // shared across the roster (owner's call, 24.08).
    spentOf: (s) => (id) => {
        const f = s.fighters.find((x) => x.id === id);
        return f ? countLit(f.upgrade) : 0;
    },
    resource: () => RESOURCE,
};

const mutations = {
    ADD(s, fighter) {
        if (s.fighters.length >= ROSTER_MAX) return;
        s.fighters.push(fighter);
        persist(s);
    },
    // Select somebody, or nobody (null). An id nobody answers to is stored as
    // "nobody" rather than kept — the hall must never show a card for a ghost.
    PICK(s, id) {
        s.pickedId = id && s.fighters.some((f) => f.id === id) ? id : null;
        persist(s);
    },
    SET_TREE(s, { id, tree }) {
        const f = s.fighters.find((x) => x.id === id);
        if (!f) return;
        f.upgrade = tree;
        persist(s);
    },
    // ГРАНЬ И ПРАВО МЕНЯЮТСЯ ОДНОЙ ЗАПИСЬЮ. Раздели их на две мутации — и
    // между ними появился бы миг, когда грань уже горит, а право ещё не забрано.
    // `right`: 'spend' — забрать право · 'return' — вернуть · ничего — не трогать.
    SET_FACE(s, { id, crystalId, faceId, faceState, right }) {
        const f = s.fighters.find((x) => x.id === id);
        const cr = f && f.upgrade && f.upgrade.find((c) => c.id === crystalId);
        const face = cr && cr.faces.find((x) => x.id === faceId);
        if (!face) return;
        face.state = faceState;
        if (right === 'spend') f.ready = false;
        else if (right === 'return') f.ready = true;
        persist(s);
    },
    // НАЗНАЧИТЬ ЗАНЯТИЕ. Повторное нажатие приходит к уже занятому и ничего
    // не делает — занятие начинается один раз (ТЗ §6.7).
    START_LESSON(s, { id, until }) {
        const f = s.fighters.find((x) => x.id === id);
        if (!f || f.lesson || f.ready) return;
        f.lesson = { until };
        f.busy = true;
        persist(s);
    },
    // ОТМЕНА. Боец возвращается в «свободен», право НЕ выдаётся (ТЗ §6.3).
    CANCEL_LESSON(s, id) {
        const f = s.fighters.find((x) => x.id === id);
        if (!f || !f.lesson) return;
        f.lesson = null;
        f.busy = false;
        persist(s);
    },
    // Сроки вышли — занятые становятся готовыми. См. settleList.
    SETTLE(s) {
        if (settleList(s.fighters, Date.now())) persist(s);
    },
    REMOVE(s, id) {
        const i = s.fighters.findIndex((f) => f.id === id);
        if (i === -1) return;
        s.fighters.splice(i, 1);
        // Dismissing the fighter who was open clears the selection in the same
        // write, so the save can never carry an id with nobody behind it.
        if (s.pickedId === id) s.pickedId = null;
        persist(s);
    },
};

const actions = {
    /**
     * Recruit one fighter. `core` is a core id, or null/'random' for a random one.
     * Returns the new fighter, or null when the roster is full (the caller shows
     * the reason; this never throws).
     */
    recruit({ state: s, commit }, core = null) {
        if (s.fighters.length >= ROSTER_MAX) return null;
        const coreId = CORE_IDS.includes(core)
            ? core
            : CORE_IDS[Math.floor(Math.random() * CORE_IDS.length)];
        const fighter = makeFighter(pickCallsign(s.fighters.map((f) => f.callsign)), coreId);
        commit('ADD', fighter);
        return fighter;
    },
    dismiss({ commit }, id) {
        commit('REMOVE', id);
    },
    /**
     * Назначить бойцу занятие. Возвращает причину отказа или null, если началось:
     * панель тем же ключом говорит словами, почему не вышло.
     */
    assignLesson({ state: s, commit }, id) {
        commit('SETTLE');                       // спросить часы ПЕРЕД решением
        const f = s.fighters.find((x) => x.id === id);
        if (!f) return 'none';
        const why = assignGate(f, countLit(f.upgrade), RESOURCE);
        if (why) return why;
        commit('START_LESSON', { id, until: lessonEndsAt() });
        return null;
    },
    /** Отменить занятие. Право не выдаётся. */
    cancelLesson({ commit }, id) {
        commit('CANCEL_LESSON', id);
    },
    /** Спросить часы: кто успел отработать занятие. */
    settleTraining({ commit }) {
        commit('SETTLE');
    },
    /** Select this fighter (or nobody, with null). Survives a refresh. */
    pick({ commit }, id) {
        commit('PICK', id || null);
    },
    /** Make sure this fighter has a working tree (built from ITS core). No-op if present. */
    ensureTree({ state: s, commit }, id) {
        const f = s.fighters.find((x) => x.id === id);
        if (!f || f.upgrade) return;
        commit('SET_TREE', { id, tree: buildTree(f.core, null) });
    },
    /**
     * Light or quench one facet, with the same two guards the upgrade screen
     * used: the crystal's own limit and the fighter's point pool. Returns true
     * when something changed, false when the move was refused (the caller
     * shakes the facet).
     */
    toggleFacet({ state: s, commit }, { id, crystalId, faceId }) {
        const f = s.fighters.find((x) => x.id === id);
        if (!f || !f.upgrade) return false;
        const cr = f.upgrade.find((c) => c.id === crystalId);
        const face = cr && cr.faces.find((x) => x.id === faceId);
        if (!face || face.state === 'locked') return false;

        if (face.state === 'lit') {                       // погасить
            // Погашение ВОЗВРАЩАЕТ право — иначе одно промахнувшееся нажатие
            // стоило бы игроку целого занятия. Но только тому, у кого права нет:
            // иначе их стало бы два, а копиться праву нельзя (ТЗ §4.1).
            if (facetGate(f, false)) return false;
            commit('SET_FACE', { id, crystalId, faceId, faceState: 'open', right: 'return' });
            return true;
        }
        // ЗАЖЕЧЬ МОЖЕТ ТОЛЬКО ГОТОВЫЙ. Прежний свободный путь закрыт: грань
        // открывается занятием, а не нажатием (ТЗ §4.3). Это ЗАСЛОН, а не оформление:
        // дерево считает те же ворота, но его можно миновать, а эту строку — нет.
        if (facetGate(f, true)) return false;
        const litHere = cr.faces.filter((x) => x.state === 'lit').length;
        if (litHere >= cr.limit || countLit(f.upgrade) >= RESOURCE) return false;
        commit('SET_FACE', { id, crystalId, faceId, faceState: 'lit', right: 'spend' });
        return true;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
