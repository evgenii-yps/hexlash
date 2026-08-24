// Pre-fight state — the core the player picked on /play plus the upgrade
// screen's working face-tree (deep copy of CRYSTALS). Read by the upgrade
// screen and by the arena when it builds the fighter.
//
// PERSISTED (guest level, 24.08.2026). It used to live in tab memory only, so a
// refresh on /play/upgrade or /play/arena dropped the pick and the route guard
// bounced the player back to core select — losing every lit facet. Now the pick
// and the lit facets are written to per-tab storage on every change and restored
// synchronously below, at module load: that is BEFORE the router's requireCore
// guard runs, so a refresh mid-fight no longer throws the player out.
//
// What is saved is the SMALLEST honest thing — the core id and the ids of the
// lit facets, not the whole tree (see src/services/playerProgress.js). The tree
// is rebuilt from CRYSTALS on restore, so changing facet content in
// upgradeData.js can never resurrect a stale copy of it.
import { CORES, CRYSTALS, RESOURCE } from '@/data/upgradeData.js';
import { readSection, writeSection } from '@/services/playerProgress.js';

const SECTION = 'prefight';

// --- save shape: { core, lit: { crystalId: [faceId, ...] } } -----------------
function snapshotOf(s) {
    if (!s.selectedCoreId) return null;
    const lit = {};
    (s.upgradeTree || []).forEach((cr) => {
        const ids = cr.faces.filter((f) => f.state === 'lit').map((f) => f.id);
        if (ids.length) lit[cr.id] = ids;
    });
    return { core: s.selectedCoreId, lit };
}

function persist(s) {
    writeSection(SECTION, snapshotOf(s));
}

// Rebuild the working tree from the CURRENT data + the saved lit ids. Anything
// that no longer exists (renamed branch, removed facet) is simply ignored, and
// the pool caps are re-applied — a save can never over-spend the resource.
function rebuildTree(coreId, lit) {
    const source = CRYSTALS[coreId];
    if (!source || !lit || typeof lit !== 'object') return null;

    const tree = JSON.parse(JSON.stringify(source));
    let spent = 0;
    tree.forEach((cr) => {
        const ids = Array.isArray(lit[cr.id]) ? lit[cr.id] : [];
        cr.faces.forEach((f) => {
            if (spent >= RESOURCE) return;                              // global pool cap
            if (litCount(cr) >= cr.limit) return;                       // per-crystal cap
            if (f.state !== 'open') return;                             // locked stays locked
            if (!ids.includes(f.id)) return;
            f.state = 'lit';
            spent += 1;
        });
    });
    return spent ? tree : null; // nothing lit → let the screen build a fresh tree
}

function litCount(cr) {
    return cr.faces.filter((f) => f.state === 'lit').length;
}

// --- restore, synchronously, at module load ---------------------------------
function restore() {
    const saved = readSection(SECTION);
    if (!saved) return { selectedCoreId: null, upgradeTree: null };

    const coreId = typeof saved.core === 'string' && CORES.some((c) => c.id === saved.core)
        ? saved.core
        : null;
    if (!coreId) return { selectedCoreId: null, upgradeTree: null }; // unknown core → start clean

    return { selectedCoreId: coreId, upgradeTree: rebuildTree(coreId, saved.lit) };
}

const restored = restore();

const state = {
    selectedCoreId: restored.selectedCoreId,
    // Working copy of the active core's crystals/faces ([{ id, name, limit,
    // faces:[{ id, name, state }] }]). Built lazily on the upgrade screen; reset
    // whenever a new core is picked so each pick starts fresh.
    upgradeTree: restored.upgradeTree,
};

const getters = {
    selectedCoreId: (s) => s.selectedCoreId,
    upgradeTree: (s) => s.upgradeTree,
};

const mutations = {
    SET_CORE(s, id) {
        s.selectedCoreId = id;
        s.upgradeTree = null; // a fresh pick starts a fresh tree
        persist(s);
    },
    CLEAR_CORE(s) {
        s.selectedCoreId = null;
        s.upgradeTree = null;
        persist(s);
    },
    SET_UPGRADE_TREE(s, tree) {
        s.upgradeTree = tree;
        persist(s);
    },
    SET_FACE_STATE(s, {crystalId, faceId, faceState}) {
        if (!s.upgradeTree) return;
        const cr = s.upgradeTree.find((c) => c.id === crystalId);
        const f = cr && cr.faces.find((x) => x.id === faceId);
        if (f) f.state = faceState;
        persist(s);
    },
};

const actions = {
    selectCore({commit}, id) {
        commit('SET_CORE', id);
    },
    clearCore({commit}) {
        commit('CLEAR_CORE');
    },
    // Build the working tree from the given crystals once (deep copy). No-op if
    // already present — so a restored tree, and a trip to the arena and back,
    // both keep their lit faces.
    initUpgradeTree({state: s, commit}, crystals) {
        if (!s.upgradeTree) commit('SET_UPGRADE_TREE', JSON.parse(JSON.stringify(crystals)));
    },
    setFaceState({commit}, payload) {
        commit('SET_FACE_STATE', payload);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
