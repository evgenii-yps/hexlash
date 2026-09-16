// Pre-fight state — WHAT GOES INTO THE FIGHT. The arena reads this and nothing
// else when it builds the player's fighter.
//
// ОДИН ВХОД: экран выбора состава (/play). Игрок сам ставит бойцов в состав
// (`squad`) — список идентификаторов. Ядро и зажжённые грани читаются ЧЕРЕЗ
// список бойцов, поэтому запись там остаётся единственным источником правды:
// прокачал — и следующий бой идёт с новыми гранями, пересобирать нечего.
//
// Входов было два: до 15.09.2026 кнопка FIGHT в зале FORGE клала сюда бойца
// напрямую, минуя выбор состава (действие `sendFighter`). Пока в составе один
// боец, разницы не видно; на составе из двоих такой вход молча увёл бы одного.
// Кнопка и действие сняты работой D.
//
// Выбор голого ядра, без бойца за ним, отсюда ушёл вместе со своим экраном
// (15.09.2026). `selectedCoreId` остался отметкой в сейфе и запасным путём для
// арены, но сам по себе больше никем не выбирается.
//
// WHY A POINTER AND NOT A COPY (15.09.2026). Until this pass the fight was handed
// a core id plus a `lit` cell that NOTHING ever wrote — the screen that used to
// fill it (/play/upgrade) was retired on 25.08.2026 — so the arena always fell
// back to the CRYSTALS defaults, where not one facet is lit. Every point the
// player spent in the FORGE hall was invisible in the fight. A copy taken at
// FIGHT-time would have fixed that and then drifted the first time the fighter
// was re-upgraded. A pointer cannot drift, and it cannot become a second place
// where facets live.
//
// `selectedCoreId` IS STILL WRITTEN when a fighter is sent, even though the
// getter below resolves the core from the roster. The arena's route guard reads
// `store.state.prefight.selectedCoreId` DIRECTLY (see requireCore in the router):
// it deliberately does not depend on getters, on module evaluation order, or on
// the roster having been restored. Leaving it empty would bounce the player
// straight back out of the arena on every trip in from the hall.
//
// PERSISTED (guest level, 24.08.2026). Written to per-tab storage on every change
// and restored synchronously at module load — that is BEFORE the route guard runs,
// so a refresh mid-fight no longer throws the player out. Only IDS are stored
// (see src/services/playerProgress.js); a tree is never written here.
import { CORES } from '@/data/upgradeData.js';
import { MODE_IDS, DEFAULT_MODE_ID, squadSizeOf, sizesOf, clampSize } from '@/data/arenaModes.js';
import { readSection, writeSection } from '@/services/playerProgress.js';

const SECTION = 'prefight';

// ───────────────────── Размер состава ─────────────────────
// Сколько бойцов игрок ведёт в бой, задаёт ВЫБРАННЫЙ РЕЖИМ, а не число здесь.
// До 15.09.2026 тут стояла константа `SQUAD_SIZE = 1`: пока режим был один,
// разницы между «столько умеет бой» и «столько просит режим» не существовало.
// Как только режимов стало двое, константа оказалась вторым местом, где живёт
// то же число, — и первым, которое разошлось бы с таблицей режимов.
//
// Состав хранится списком и хранился им с самого начала, хотя список из одного
// выглядел избыточно. Ровно затем: переход на двоих не требует переписывать ни
// состояние, ни экран выбора, ни стража арены — меняется одно число в таблице.
// Размер состава: сколько бойцов игрок ведёт в бой.
//
// У дуэли он задан режимом и выбора нет. У команды игрок выбирает сам — 2 на 2
// или 3 на 3, — и выбор живёт рядом с составом, в той же памяти вкладки.
// Незнакомое число (сейф от прошлой версии, правка адреса) приводится к
// допустимому: дорога в бой не должна обрываться из-за мусора в сейфе.
function sizeOf(s) {
  if (!sizesOf(s.modeId).length) return squadSizeOf(s.modeId);
  return clampSize(s.modeId, s.squadN);
}

// --- save shape: { core, squad?, mode? } --------------------------------------
// `squad` — список идентификаторов бойцов, которых игрок ведёт в бой. Раньше на
// его месте было одно поле `fighter`: старые сейфы с ним читаются (см. restore),
// новые пишутся списком.
//
// `mode` — выбранный режим боя (см. data/arenaModes.js). Он задаёт размер
// состава, поэтому читается ПЕРВЫМ: подрезать список, не зная режима, значит
// подрезать его наугад.
//
// `lit` тут когда-то тоже лежал и был удалён 15.09.2026: он всегда оставался
// пустым, а вечно пустое хранилище граней хуже, чем никакого — следующий
// читатель примет его за настоящее.
function snapshotOf(s) {
    if (!s.selectedCoreId && !s.squad.length && !s.modeId) return null;
    const out = {};
    if (s.selectedCoreId) out.core = s.selectedCoreId;
    if (s.squad.length) out.squad = [...s.squad];
    if (s.modeId) out.mode = s.modeId;
    if (s.squadN) out.n = s.squadN;
    return out;
}

function persist(s) {
    writeSection(SECTION, snapshotOf(s));
}

// --- restore, synchronously, at module load ---------------------------------
function restore() {
    const saved = readSection(SECTION);
    if (!saved) return { selectedCoreId: null, squad: [], modeId: null, squadN: 0 };

    const coreId = typeof saved.core === 'string' && CORES.some((c) => c.id === saved.core)
        ? saved.core
        : null;

    // Незнакомый ключ режима (сейф от прошлой версии, правка адреса) — не ошибка:
    // getMode отдаст режим по умолчанию, и дорога в бой не оборвётся.
    const modeId = MODE_IDS.includes(saved.mode) ? saved.mode : null;

    // Выбранный размер состава. Проверяется при ЧТЕНИИ (sizeOf), поэтому здесь
    // достаточно взять число как есть.
    const squadN = Number.isFinite(saved.n) ? saved.n : 0;

    // Идентификаторы берутся как есть; живы ли они, проверяется при ЧТЕНИИ
    // (sentFighter). Проверять здесь значило бы зависеть от того, успел ли
    // раньше подняться список бойцов.
    //
    // `saved.fighter` — форма сейфа до появления состава. Читается, чтобы игрок,
    // у которого вкладка открыта с прошлой версии, не потерял выбранного бойца.
    let squad = Array.isArray(saved.squad)
        ? saved.squad.filter((x) => typeof x === 'string')
        : (typeof saved.fighter === 'string' ? [saved.fighter] : []);
    // ⚠️ Подрезать состав НАДО ПО ВЫБРАННОМУ РАЗМЕРУ, а не по размеру режима.
    //    У команды размер режима — это лишь значение по умолчанию (двойка), и
    //    подрезка по нему молча выбрасывала третьего бойца из состава, выбранного
    //    как тройка: игрок собирал троих, а на плиту выходили двое.
    const max = sizesOf(modeId).length ? clampSize(modeId, squadN) : squadSizeOf(modeId);
    if (squad.length > max) squad = squad.slice(0, max);

    return { selectedCoreId: coreId, squad, modeId, squadN };
}

const restored = restore();

// Re-read the save on demand. The module-load restore above already covers the
// normal boot, but ANY consumer that must not depend on when this module
// happened to be evaluated (the route guard, above all) can call this and be
// certain it is looking at the truth. Cheap: synchronous storage, ~60 bytes.
export function restoreIfEmpty(s) {
    if (s.squad.length || s.selectedCoreId || s.modeId) return;
    const r = restore();
    s.selectedCoreId = r.selectedCoreId;
    s.squad = r.squad;
    s.modeId = r.modeId;
    s.squadN = r.squadN;
}

const state = {
    selectedCoreId: restored.selectedCoreId,
    // Состав боя — идентификаторы бойцов, которых игрок ведёт драться. Пустой,
    // пока состав не набран; страж арены смотрит именно сюда.
    squad: restored.squad,
    // Выбранный режим боя. null — выбора ещё не было; читатели спрашивают размер
    // через таблицу режимов, и она в этом случае отдаёт режим по умолчанию.
    modeId: restored.modeId,
    // Выбранный размер состава. 0 — выбора ещё не было, и размер спрашивают у
    // режима. Значение по умолчанию ставят ворота: оно зависит от того, сколько
    // у игрока бойцов, а состояние про ростер знать не должно.
    squadN: restored.squadN,
    // SHOWCASE (?showcase=1) — the live arena embedded in the investor deck page.
    // It is a DIFFERENT document in an iframe, but the same origin and the same
    // tab, so it restores this tab's save: without this flag a deck opened in a
    // tab that had already played would quietly fight with that player's facets.
    // The deck must always show the same default bout. Set by the arena's route
    // guard, never saved (see snapshotOf).
    showcase: false,
};

// The fighter this fight was handed, resolved through the roster. Null when no
// fighter was sent, when the stored id no longer matches anybody (dismissed
// since), or in showcase mode.
function sentFighter(s, rootState) {
    if (s.showcase || !s.squad.length) return null;
    const list = rootState && rootState.roster && rootState.roster.fighters;
    if (!Array.isArray(list)) return null;
    // Дерётся первый в составе: движок умеет одного. Когда появится командный
    // бой, читателей у списка станет больше — сам список менять не придётся.
    return list.find((f) => f.id === s.squad[0]) || null;
}

const getters = {
    // The core the fight runs on: the sent fighter's own, else the bare pick.
    selectedCoreId: (s, g, rootState) => {
        const f = sentFighter(s, rootState);
        return f ? f.core : s.selectedCoreId;
    },
    // The sent fighter's working tree — the lit facets the arena resolves his
    // behaviour from. Null when nobody was sent, and the arena then falls back to
    // the core's untouched facets (which is the core-select path).
    upgradeTree: (s, g, rootState) => {
        const f = sentFighter(s, rootState);
        return f ? f.upgrade || null : null;
    },
    // Who is fighting — identity, for anything that names him.
    fighter: (s, g, rootState) => sentFighter(s, rootState),
    fighterId: (s, g, rootState) => {
        const f = sentFighter(s, rootState);
        return f ? f.id : null;
    },
    // ВЕСЬ состав как бойцы, а не как идентификаторы. Нужен командному бою: там
    // на плиту выходит не один боец, а все выбранные, каждый со своим ядром и
    // своими гранями. Порядок — тот, в котором игрок их выбирал. Призраки
    // (распустили, пока состав лежал в сейфе) отсеиваются здесь же.
    squadFighters: (s, g, rootState) => {
        if (s.showcase) return [];
        const list = (rootState && rootState.roster && rootState.roster.fighters) || [];
        return s.squad.map((id) => list.find((f) => f.id === id)).filter(Boolean);
    },
    // Состав — как он лежит в состоянии. Список идентификаторов, не бойцов:
    // единственный источник правды о бойце остаётся в списке бойцов.
    squad: (s) => [...s.squad],
    inSquad: (s) => (id) => s.squad.includes(id),
    squadFull: (s) => s.squad.length >= sizeOf(s),
    // Сколько ещё выбрать. Экран говорит это игроку словами.
    squadLeft: (s) => Math.max(0, sizeOf(s) - s.squad.length),
    // Режим боя: ключ и сколько бойцов он просит. Экран выбора состава говорит
    // это игроку словами, поэтому размер спрашивают здесь, а не считают заново.
    modeId: (s) => s.modeId || DEFAULT_MODE_ID,
    squadSize: (s) => sizeOf(s),
    // Из чего игрок выбирает размер. Пустой список — переключателя нет.
    squadSizes: (s) => sizesOf(s.modeId),
};

const mutations = {
    // Положить состав целиком. Ядро пишется той же записью: арена читает его
    // через геттер с запасным путём, а в сейфе он остаётся отметкой, по которой
    // старая версия вкладки поймёт, что выбор был.
    SET_SQUAD(s, { ids, core }) {
        s.squad = ids.slice(0, sizeOf(s));
        s.selectedCoreId = core || null;
        persist(s);
    },
    // Used by the route guard before it decides whether to let the player in.
    RESTORE_IF_EMPTY(s) {
        restoreIfEmpty(s);
    },
    // Выбрать режим боя. Состав подрезается той же записью: переход на режим
    // поменьше не должен оставить в составе лишних — они бы поехали в бой молча.
    SET_MODE(s, id) {
        s.modeId = MODE_IDS.includes(id) ? id : DEFAULT_MODE_ID;
        const max = sizeOf(s);
        if (s.squad.length > max) s.squad = s.squad.slice(0, max);
        persist(s);
    },
    // Выбрать размер состава. Состав подрезается той же записью: переход на
    // размер поменьше не должен оставить в составе лишних — они бы поехали в бой
    // молча. Снимается ПОСЛЕДНИЙ выбранный: игрок помнит, кого поставил только
    // что, и терять первого выбранного было бы неожиданно.
    SET_SQUAD_SIZE(s, n) {
      s.squadN = clampSize(s.modeId, n);
      const max = sizeOf(s);
      if (s.squad.length > max) s.squad = s.squad.slice(0, max);
      persist(s);
    },
    SET_SHOWCASE(s, on) {
        s.showcase = !!on;
    },
};

// Собрать состав из идентификаторов, выбросив тех, кого в списке бойцов уже нет.
// Одно место, где список сверяется с реальностью, — через него проходит каждая
// запись состава, поэтому в состав не может попасть призрак.
function resolveSquad(rootState, ids, size) {
    const list = (rootState.roster && rootState.roster.fighters) || [];
    const alive = ids.filter((id) => list.some((f) => f.id === id)).slice(0, size);
    const first = alive.length ? list.find((f) => f.id === alive[0]) : null;
    return { ids: alive, core: first ? first.core : null };
}

const actions = {
    /**
     * Поставить бойца в состав или снять его оттуда.
     * Возвращает true, если состав изменился.
     */
    toggleSquad({ state: s, commit, rootState }, id) {
        const has = s.squad.includes(id);
        let ids;
        if (has) ids = s.squad.filter((x) => x !== id);
        else if (s.squad.length >= sizeOf(s)) return false;  // состав полон — молча отказываем
        else ids = [...s.squad, id];
        const r = resolveSquad(rootState, ids, sizeOf(s));
        commit('SET_SQUAD', r);
        return true;
    },
    /** Убрать из состава тех, кого больше нет в списке бойцов (распустили). */
    pruneSquad({ state: s, commit, rootState }) {
        const r = resolveSquad(rootState, s.squad, sizeOf(s));
        if (r.ids.length === s.squad.length) return false;
        commit('SET_SQUAD', r);
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
