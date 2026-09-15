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

// ───────────────────────────── CONFIG ─────────────────────────────
// Cap. Ten is what the FORGE hall is laid out for: one arc, one personal zone per
// fighter, none of them touching (see ARC / ZONE in PveScene.vue). It was eight
// while the hall packed them into two rows; raising it came WITH that new layout,
// which is the only way this number is ever allowed to move.
export const ROSTER_MAX = 10;

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
        upgrade: null,        // working upgrade tree, built on demand (see ensureTree)
        record: null,         // ← fights / wins land here
    };
}

function newId() {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch (_) { /* fall through to the cheap id */ }
    return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- save shape: { fighters: [{ id, callsign, core, createdAt, lit? }], picked? }
// `lit` is the small form of the upgrade tree ({ crystalId: [faceId] }) and is
// written only once something is lit — an untouched fighter costs nothing.
// `picked` is one id and is written only while somebody IS selected; "nobody
// selected" is the absence of the key, not a stored null.
function snapshotOf(s) {
    if (!s.fighters.length) return null;   // empty roster → drop the section entirely
    const out = {
        fighters: s.fighters.map((f) => {
            const row = { id: f.id, callsign: f.callsign, core: f.core, createdAt: f.createdAt };
            const lit = litIdsOf(f.upgrade);
            if (Object.keys(lit).length) row.lit = lit;
            return row;
        }),
    };
    if (s.pickedId) out.picked = s.pickedId;
    return out;
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
    return { fighters: out, pickedId };
}

const restored = restore();

const state = {
    fighters: restored.fighters,
    // Who the FORGE hall is working on. An id, not a fighter (see the header).
    pickedId: restored.pickedId,
};

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
    SET_FACE(s, { id, crystalId, faceId, faceState }) {
        const f = s.fighters.find((x) => x.id === id);
        const cr = f && f.upgrade && f.upgrade.find((c) => c.id === crystalId);
        const face = cr && cr.faces.find((x) => x.id === faceId);
        if (!face) return;
        face.state = faceState;
        persist(s);
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

        if (face.state === 'lit') {                       // give the point back
            commit('SET_FACE', { id, crystalId, faceId, faceState: 'open' });
            return true;
        }
        const litHere = cr.faces.filter((x) => x.state === 'lit').length;
        if (litHere >= cr.limit || countLit(f.upgrade) >= RESOURCE) return false;
        commit('SET_FACE', { id, crystalId, faceId, faceState: 'lit' });
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
