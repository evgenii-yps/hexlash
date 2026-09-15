// Pre-fight state — WHAT GOES INTO THE FIGHT. The arena reads this and nothing
// else when it builds the player's fighter.
//
// TWO WAYS IN, one shape out:
//   • the FORGE hall (/play/pve) sends a ROSTER FIGHTER. `fighterId` POINTS at
//     him; his core and his lit facets are read THROUGH the roster, so the record
//     there stays the one source of truth. Upgrade him and the next fight uses
//     the new grades, with nothing to re-sync.
//   • core select (/play) picks a bare core with no fighter behind it.
//     `selectedCoreId` carries alone and the fight runs on that core's own
//     untouched facets.
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
import { readSection, writeSection } from '@/services/playerProgress.js';

const SECTION = 'prefight';

// --- save shape: { core, fighter? } ------------------------------------------
// `fighter` is one id and only appears when a roster fighter was sent. The `lit`
// cell that used to sit here was removed on 15.09.2026: it was always empty (see
// the header) and a permanently-empty store of facets is worse than none — the
// next reader takes it for the real one.
function snapshotOf(s) {
    if (!s.selectedCoreId) return null;
    const out = { core: s.selectedCoreId };
    if (s.fighterId) out.fighter = s.fighterId;
    return out;
}

function persist(s) {
    writeSection(SECTION, snapshotOf(s));
}

// --- restore, synchronously, at module load ---------------------------------
function restore() {
    const saved = readSection(SECTION);
    if (!saved) return { selectedCoreId: null, fighterId: null };

    const coreId = typeof saved.core === 'string' && CORES.some((c) => c.id === saved.core)
        ? saved.core
        : null;
    if (!coreId) return { selectedCoreId: null, fighterId: null }; // unknown core → start clean

    // The id is taken at face value here; it is checked against the live roster
    // at READ time (sentFighter) instead. Checking it now would mean depending on
    // whether the roster module happened to be evaluated first.
    const fighterId = typeof saved.fighter === 'string' ? saved.fighter : null;
    return { selectedCoreId: coreId, fighterId };
}

const restored = restore();

// Re-read the save on demand. The module-load restore above already covers the
// normal boot, but ANY consumer that must not depend on when this module
// happened to be evaluated (the route guard, above all) can call this and be
// certain it is looking at the truth. Cheap: synchronous storage, ~60 bytes.
export function restoreIfEmpty(s) {
    if (s.selectedCoreId) return;
    const r = restore();
    s.selectedCoreId = r.selectedCoreId;
    s.fighterId = r.fighterId;
}

const state = {
    selectedCoreId: restored.selectedCoreId,
    // The roster fighter this fight was handed, as an id. Null on the core-select
    // path (no fighter behind the pick).
    fighterId: restored.fighterId,
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
    if (s.showcase || !s.fighterId) return null;
    const list = rootState && rootState.roster && rootState.roster.fighters;
    if (!Array.isArray(list)) return null;
    return list.find((f) => f.id === s.fighterId) || null;
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
};

const mutations = {
    // A bare core pick has no fighter behind it, so it drops the pointer —
    // otherwise the pick would be silently overruled by the fighter's own core.
    SET_CORE(s, id) {
        s.selectedCoreId = id;
        s.fighterId = null;
        persist(s);
    },
    CLEAR_CORE(s) {
        s.selectedCoreId = null;
        s.fighterId = null;
        persist(s);
    },
    // Send one roster fighter into the fight. The core is written alongside the
    // pointer in the SAME write, because the route guard reads it from state.
    SEND_FIGHTER(s, { id, core }) {
        s.fighterId = id;
        s.selectedCoreId = core;
        persist(s);
    },
    // Used by the route guard before it decides whether to let the player in.
    RESTORE_IF_EMPTY(s) {
        restoreIfEmpty(s);
    },
    SET_SHOWCASE(s, on) {
        s.showcase = !!on;
    },
};

const actions = {
    selectCore({ commit }, id) {
        commit('SET_CORE', id);
    },
    clearCore({ commit }) {
        commit('CLEAR_CORE');
    },
    /**
     * Hand this roster fighter to the fight. Refused (no-op) when the id matches
     * nobody — the arena must never be entered pointing at a ghost.
     * Returns true when the fight was actually handed a fighter.
     */
    sendFighter({ commit, rootState }, id) {
        const list = (rootState.roster && rootState.roster.fighters) || [];
        const f = list.find((x) => x.id === id);
        if (!f) return false;
        commit('SEND_FIGHTER', { id: f.id, core: f.core });
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
