import {CardModel} from "@/core/models/cardModel.js";
import {DeckModel} from "@/core/models/deckModel.js";
import {CombatEngine} from "@/core/engine/combatEngine.js";
import {AIStrategy} from "@/core/engine/aiStrategy.js";
import {OpponentGenerator} from "@/core/engine/opponentGenerator.js";
import cardsData from "@/core/data/cards.json";
import router from "@/router/index.js";
import {MAX_HP, MAX_ROUNDS} from "@/core/constants.js";

const STORAGE_KEY = 'hexlash_player_deck';

// ─── Dice items (from prototype) ─────────────────────────────────────────────
export const DICE_ITEMS = [
    {id: 'heal',   name: 'АПТЕЧКА',    emoji: '💊', effect: 'heal',   desc: '+15 HP'},
    {id: 'double', name: 'АДРЕНАЛИН',  emoji: '⚡', effect: 'double', desc: '2x урон'},
    {id: 'shield', name: 'ЩИТ',        emoji: '🛡️', effect: 'shield', desc: 'Блок атаки'},
    {id: 'blind',  name: 'ОСЛЕПЛЕНИЕ', emoji: '✨', effect: 'blind',  desc: 'Промах врага'},
    {id: 'rage',   name: 'ЯРОСТЬ',     emoji: '🔥', effect: 'rage',   desc: '-20 HP врагу'},
    {id: 'crit',   name: 'КРИТ',       emoji: '💀', effect: 'crit',   desc: '-30 HP врагу'},
];

// ─── Module-level AI instances (class objects, NOT stored in Vuex) ────────────
let _ai1 = null;
let _ai2 = null;

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
    allCards:   [],
    playerDeck: new DeckModel(),
    opponent:   null,

    // Live fight
    liveHP1:  MAX_HP,
    liveHP2:  MAX_HP,
    roundNum: 0,
    roundLog: [],          // array of RoundResult (for display)

    // Player modifiers (reset each round)
    playerModifiers: {
        attackMultiplier: 1,
        shieldActive:     false,
        blindActive:      false,
    },

    // Dice of Fate
    diceState: {
        rolling:    false,   // spin animation active
        activeItem: null,    // DICE_ITEMS entry; null = no item shown
    },

    // Manual Override
    overrideAvailable: false,
    overrideDamage:    0,

    fightPhase: 'idle',    // idle | preparation | fighting | results
    difficulty: 'medium',

    // Fight statistics
    fightStats: {
        overridesHit:      0,
        diceUsed:          0,
        totalDamageDealt:  0,
        totalDamageTaken:  0,
    },
};

// ─── Getters ─────────────────────────────────────────────────────────────────
const getters = {
    getAllCards:         (s) => s.allCards,
    getPlayerDeck:      (s) => s.playerDeck,
    getEquippedCards:   (s) => s.playerDeck.cards,
    isDeckValid:        (s) => s.playerDeck.isValid(),
    getOpponent:        (s) => s.opponent,
    getFightPhase:      (s) => s.fightPhase,
    getDifficulty:      (s) => s.difficulty,

    getLiveHP1:         (s) => s.liveHP1,
    getLiveHP2:         (s) => s.liveHP2,
    getRoundNum:        (s) => s.roundNum,
    getRoundLog:        (s) => s.roundLog,
    getCurrentRound:    (s) => s.roundLog[s.roundLog.length - 1] || null,

    getPlayerModifiers: (s) => s.playerModifiers,
    getDiceState:       (s) => s.diceState,
    getOverrideAvailable: (s) => s.overrideAvailable,
    getOverrideDamage:  (s) => s.overrideDamage,
    getFightStats:      (s) => s.fightStats,
};

// ─── Mutations ────────────────────────────────────────────────────────────────
const mutations = {
    setAllCards(s, v)    { s.allCards   = v; },
    setPlayerDeck(s, v)  { s.playerDeck = v; },
    setOpponent(s, v)    { s.opponent   = v; },
    setFightPhase(s, v)  { s.fightPhase = v; },
    setDifficulty(s, v)  { s.difficulty = v; },

    setLiveHP1(s, v)  { s.liveHP1  = Math.max(0, Math.min(MAX_HP, v)); },
    setLiveHP2(s, v)  { s.liveHP2  = Math.max(0, Math.min(MAX_HP, v)); },
    setRoundNum(s, v) { s.roundNum = v; },
    addRoundToLog(s, round) { s.roundLog.push(round); },
    clearRoundLog(s) { s.roundLog = []; },

    setPlayerModifiers(s, mods) {
        s.playerModifiers = {...s.playerModifiers, ...mods};
    },
    resetPlayerModifiers(s) {
        s.playerModifiers = {attackMultiplier: 1, shieldActive: false, blindActive: false};
    },

    setDiceState(s, v) { s.diceState = {...s.diceState, ...v}; },
    clearDice(s)       { s.diceState = {rolling: false, activeItem: null}; },

    setOverride(s, {available, damage = 0}) {
        s.overrideAvailable = available;
        s.overrideDamage    = damage;
    },

    addStats(s, delta) {
        s.fightStats = {
            overridesHit:     s.fightStats.overridesHit     + (delta.overridesHit     || 0),
            diceUsed:         s.fightStats.diceUsed         + (delta.diceUsed         || 0),
            totalDamageDealt: s.fightStats.totalDamageDealt + (delta.totalDamageDealt || 0),
            totalDamageTaken: s.fightStats.totalDamageTaken + (delta.totalDamageTaken || 0),
        };
    },
    resetStats(s) {
        s.fightStats = {overridesHit: 0, diceUsed: 0, totalDamageDealt: 0, totalDamageTaken: 0};
    },
};

// ─── Actions ─────────────────────────────────────────────────────────────────
const actions = {

    /** Load all cards; restore saved deck from localStorage. */
    loadCards({commit, state}) {
        const cards = cardsData.map(c => CardModel.fromJSON(c)).filter(Boolean);
        commit('setAllCards', cards);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const ids  = JSON.parse(saved);
                const deck = DeckModel.fromJSON(ids, cards);
                commit('setPlayerDeck', deck);
            } catch {
                commit('setPlayerDeck', new DeckModel());
            }
        }

        if (state.playerDeck.cards.length === 0) {
            const ids  = ['strike_head_basic', 'strike_body_basic', 'guard_head', 'guard_body', 'power_punch', 'dodge'];
            const deck = DeckModel.fromJSON(ids, cards);
            commit('setPlayerDeck', deck);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(deck.toJSON()));
        }

        commit('setFightPhase', 'preparation');
    },

    equipCard({commit, state}, cardId) {
        const card = state.allCards.find(c => c.id === cardId);
        if (!card) return;
        const deck = new DeckModel([...state.playerDeck.cards]);
        if (deck.addCard(card)) {
            commit('setPlayerDeck', deck);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(deck.toJSON()));
        }
    },

    unequipCard({commit, state}, cardId) {
        const deck = new DeckModel([...state.playerDeck.cards]);
        if (deck.removeCard(cardId)) {
            commit('setPlayerDeck', deck);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(deck.toJSON()));
        }
    },

    /** Start a live fight: generate opponent, init AI, reset all fight state. */
    async startFight({commit, state}) {
        if (!state.playerDeck.isValid()) return;

        const opponent = OpponentGenerator.generate(state.allCards, state.difficulty);
        commit('setOpponent', opponent);

        // Create AI instances (module-level, not in Vuex)
        _ai1 = new AIStrategy(state.playerDeck.cards, 'balanced');
        _ai2 = new AIStrategy(opponent.deck, opponent.archetype || 'balanced');

        // Reset live fight state
        commit('setLiveHP1', MAX_HP);
        commit('setLiveHP2', MAX_HP);
        commit('setRoundNum', 0);
        commit('clearRoundLog');
        commit('resetPlayerModifiers');
        commit('clearDice');
        commit('setOverride', {available: false});
        commit('resetStats');
        commit('setFightPhase', 'fighting');

        await router.push('/fight');
    },

    /**
     * Compute and commit the next round of the live fight.
     * Called by CardFightView's round timer.
     */
    computeNextRound({commit, state}) {
        const nextRound = state.roundNum + 1;

        // Already over?
        if (state.liveHP1 <= 0 || state.liveHP2 <= 0 || state.fightPhase !== 'fighting') {
            commit('setFightPhase', 'results');
            return;
        }
        if (nextRound > MAX_ROUNDS) {
            commit('setFightPhase', 'results');
            return;
        }

        const card1  = _ai1.selectCard(state.liveHP1, MAX_HP, nextRound);
        const card2  = _ai2.selectCard(state.liveHP2, MAX_HP, nextRound);
        const result = CombatEngine.resolveRoundLive(
            card1, card2,
            state.liveHP1, state.liveHP2,
            _ai1, _ai2,
            nextRound,
            state.playerModifiers,
        );

        commit('setLiveHP1', result.hp1After);
        commit('setLiveHP2', result.hp2After);
        commit('setRoundNum', nextRound);
        commit('addRoundToLog', result);
        commit('addStats', {totalDamageDealt: result.damage2, totalDamageTaken: result.damage1});
        commit('resetPlayerModifiers');

        _ai1.tickCooldowns();
        _ai2.tickCooldowns();

        // Check end conditions
        if (result.hp1After <= 0 || result.hp2After <= 0 || nextRound >= MAX_ROUNDS) {
            commit('setFightPhase', 'results');
            return;
        }

        // Random override: 12% chance per round
        if (Math.random() < 0.12) {
            const dmg = 22 + Math.floor(Math.random() * 17); // 22–38
            commit('setOverride', {available: true, damage: dmg});
        }
    },

    // ── Dice of Fate ──────────────────────────────────────────────────────────

    /** Start dice roll animation, then reveal a random item. */
    rollDice({commit, state}) {
        if (state.diceState.rolling) return;
        commit('setDiceState', {rolling: true, activeItem: null});
        // After spin animation, show the item
        setTimeout(() => {
            const item = DICE_ITEMS[Math.floor(Math.random() * DICE_ITEMS.length)];
            commit('setDiceState', {rolling: false, activeItem: item});
        }, 1200);
    },

    /** Player taps dice item to use it. */
    useDice({commit, state}) {
        const item = state.diceState.activeItem;
        if (!item) return;

        switch (item.effect) {
            case 'heal':
                commit('setLiveHP1', state.liveHP1 + 15);
                break;
            case 'double':
                commit('setPlayerModifiers', {attackMultiplier: 2});
                break;
            case 'shield':
                commit('setPlayerModifiers', {shieldActive: true});
                break;
            case 'blind':
                commit('setPlayerModifiers', {blindActive: true});
                break;
            case 'rage': {
                const hp2rage = state.liveHP2 - 20;
                commit('setLiveHP2', hp2rage);
                if (hp2rage <= 0) commit('setFightPhase', 'results');
                break;
            }
            case 'crit': {
                const hp2crit = state.liveHP2 - 30;
                commit('setLiveHP2', hp2crit);
                if (hp2crit <= 0) commit('setFightPhase', 'results');
                break;
            }
        }

        commit('clearDice');
        commit('addStats', {diceUsed: 1});
    },

    /** Auto-dismiss dice item if player didn't tap in time. */
    dismissDice({commit}) {
        commit('clearDice');
    },

    // ── Manual Override ───────────────────────────────────────────────────────

    /** Player taps the Override button. */
    useOverride({commit, state}) {
        if (!state.overrideAvailable) return;
        const dmg = state.overrideDamage;
        const hp2 = state.liveHP2 - dmg;
        commit('setLiveHP2', hp2);
        commit('setOverride', {available: false});
        commit('addStats', {overridesHit: 1});
        if (hp2 <= 0) commit('setFightPhase', 'results');
    },

    dismissOverride({commit}) {
        commit('setOverride', {available: false});
    },

    // ── Navigation ────────────────────────────────────────────────────────────

    async resetToPreparation({commit}) {
        _ai1 = null;
        _ai2 = null;
        commit('clearRoundLog');
        commit('setOpponent', null);
        commit('setFightPhase', 'preparation');
        await router.push('/arena');
    },

    async fightAgain({dispatch}) {
        await dispatch('startFight');
    },

    setDifficulty({commit}, difficulty) {
        commit('setDifficulty', difficulty);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
