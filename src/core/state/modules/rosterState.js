// The player's roster — the list of fighters they own.
//
// WHY THIS EXISTS SEPARATELY FROM `prefight`. Today the thing the player fights
// with is not a fighter at all: it is a core id plus a tree of lit facets, with
// no name and no record (see prefightState.js). The roster is the real article —
// named fighters that persist and that the FORGE hall will let the player choose
// between. Wiring the two together (ARENA → pick a fighter) is a LATER pass and
// is deliberately not started here: nothing in this module touches `prefight`.
//
// PERSISTED in its own section of the same per-tab save as `prefight`
// (src/services/playerProgress.js): survives a refresh, dies with the tab.
// Only the four settled fields go to storage — see snapshotOf. Anything the save
// carries that this build does not know about is ignored on restore rather than
// crashing, so a roster written by a future version cannot break an older one.
import { CORES } from '@/data/upgradeData.js';
import { pickCallsign } from '@/data/callsigns.js';
import { readSection, writeSection } from '@/services/playerProgress.js';

// ───────────────────────────── CONFIG ─────────────────────────────
// Cap. Eight is what will still stand in a readable row on the FORGE platform;
// past that the hall turns into a crowd. Raise only together with that layout.
export const ROSTER_MAX = 8;

const SECTION = 'roster';
const CORE_IDS = CORES.map((c) => c.id);

/** A fighter as the rest of the app sees it. `upgrade` / `record` are the seats
 *  kept for the next passes (per-fighter progression, fight history); they are
 *  null today and are NOT written to storage while they stay null. */
function makeFighter(callsign, core) {
    return {
        id: newId(),
        callsign,
        core,                 // canonical core id ('natisk' | 'nalet' | 'skala' | 'zasada')
        createdAt: Date.now(),
        upgrade: null,        // ← per-fighter progression lands here
        record: null,         // ← fights / wins land here
    };
}

function newId() {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch (_) { /* fall through to the cheap id */ }
    return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- save shape: { fighters: [{ id, callsign, core, createdAt }] } ------------
function snapshotOf(s) {
    if (!s.fighters.length) return null;   // empty roster → drop the section entirely
    return {
        fighters: s.fighters.map((f) => ({
            id: f.id, callsign: f.callsign, core: f.core, createdAt: f.createdAt,
        })),
    };
}

function persist(s) {
    writeSection(SECTION, snapshotOf(s));
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
        out.push({
            id: f.id,
            callsign: f.callsign,
            core: f.core,
            createdAt: typeof f.createdAt === 'number' ? f.createdAt : 0,
            upgrade: null,
            record: null,
        });
    }
    return out;
}

const state = {
    fighters: restore(),
};

const getters = {
    // Oldest first: the list then has a natural order that never reshuffles.
    fighters: (s) => [...s.fighters].sort((a, b) => a.createdAt - b.createdAt),
    count: (s) => s.fighters.length,
    isFull: (s) => s.fighters.length >= ROSTER_MAX,
    max: () => ROSTER_MAX,
};

const mutations = {
    ADD(s, fighter) {
        if (s.fighters.length >= ROSTER_MAX) return;
        s.fighters.push(fighter);
        persist(s);
    },
    REMOVE(s, id) {
        const i = s.fighters.findIndex((f) => f.id === id);
        if (i === -1) return;
        s.fighters.splice(i, 1);
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
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
