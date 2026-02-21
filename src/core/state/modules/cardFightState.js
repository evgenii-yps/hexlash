import {CardModel} from "@/core/models/cardModel.js";
import {DeckModel} from "@/core/models/deckModel.js";
import {CombatEngine} from "@/core/engine/combatEngine.js";
import {OpponentGenerator} from "@/core/engine/opponentGenerator.js";
import cardsData from "@/core/data/cards.json";
import router from "@/router/index.js";

const STORAGE_KEY = 'hexlash_player_deck';

const state = {
    allCards: [],           // all card definitions
    playerDeck: new DeckModel(), // player's equipped deck
    opponent: null,         // { id, name, avatarUrl, skin, deck }
    combatResult: null,     // CombatResultModel
    fightPhase: 'idle',     // idle | preparation | fighting | results
    animationRound: -1,     // current round being shown (-1 = not started)
    difficulty: 'medium',   // easy | medium | hard
};

const getters = {
    getAllCards: (state) => state.allCards,
    getPlayerDeck: (state) => state.playerDeck,
    getEquippedCards: (state) => state.playerDeck.cards,
    isDeckValid: (state) => state.playerDeck.isValid(),
    getOpponent: (state) => state.opponent,
    getCombatResult: (state) => state.combatResult,
    getFightPhase: (state) => state.fightPhase,
    getAnimationRound: (state) => state.animationRound,
    getDifficulty: (state) => state.difficulty,
    getCurrentRoundData: (state) => {
        if (!state.combatResult || state.animationRound < 0) return null;
        return state.combatResult.rounds[state.animationRound] || null;
    },
    getTotalRounds: (state) => {
        return state.combatResult ? state.combatResult.totalRounds : 0;
    },
};

const mutations = {
    setAllCards(state, cards) {
        state.allCards = cards;
    },
    setPlayerDeck(state, deck) {
        state.playerDeck = deck;
    },
    setOpponent(state, opponent) {
        state.opponent = opponent;
    },
    setCombatResult(state, result) {
        state.combatResult = result;
    },
    setFightPhase(state, phase) {
        state.fightPhase = phase;
    },
    setAnimationRound(state, round) {
        state.animationRound = round;
    },
    setDifficulty(state, difficulty) {
        state.difficulty = difficulty;
    },
};

const actions = {
    /**
     * Load all card definitions and restore player deck from localStorage.
     */
    loadCards({commit, state}) {
        const cards = cardsData.map(c => CardModel.fromJSON(c)).filter(Boolean);
        commit('setAllCards', cards);

        // Restore saved deck
        const savedDeckIds = localStorage.getItem(STORAGE_KEY);
        if (savedDeckIds) {
            try {
                const ids = JSON.parse(savedDeckIds);
                const deck = DeckModel.fromJSON(ids, cards);
                commit('setPlayerDeck', deck);
            } catch {
                commit('setPlayerDeck', new DeckModel());
            }
        }

        // If no saved deck, give player a starter deck
        if (state.playerDeck.cards.length === 0) {
            const starterIds = [
                'strike_head_basic', 'strike_body_basic',
                'guard_head', 'guard_body',
                'power_punch', 'dodge',
            ];
            const deck = DeckModel.fromJSON(starterIds, cards);
            commit('setPlayerDeck', deck);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(deck.toJSON()));
        }

        commit('setFightPhase', 'preparation');
    },

    /**
     * Equip a card to the player's deck.
     */
    equipCard({commit, state}, cardId) {
        const card = state.allCards.find(c => c.id === cardId);
        if (!card) return;

        const deck = new DeckModel([...state.playerDeck.cards]);
        if (deck.addCard(card)) {
            commit('setPlayerDeck', deck);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(deck.toJSON()));
        }
    },

    /**
     * Remove a card from the player's deck.
     */
    unequipCard({commit, state}, cardId) {
        const deck = new DeckModel([...state.playerDeck.cards]);
        if (deck.removeCard(cardId)) {
            commit('setPlayerDeck', deck);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(deck.toJSON()));
        }
    },

    /**
     * Start a fight: generate opponent, run simulation, navigate to fight view.
     */
    async startFight({commit, state}) {
        if (!state.playerDeck.isValid()) return;

        // Generate opponent
        const opponent = OpponentGenerator.generate(state.allCards, state.difficulty);
        commit('setOpponent', opponent);

        // Run combat simulation
        const result = CombatEngine.runCombat(
            state.playerDeck.cards,
            opponent.deck
        );
        commit('setCombatResult', result);

        // Start fight animation
        commit('setFightPhase', 'fighting');
        commit('setAnimationRound', -1);

        await router.push('/fight');
    },

    /**
     * Advance to the next animation round.
     */
    nextAnimationRound({commit, state}) {
        const nextRound = state.animationRound + 1;
        if (state.combatResult && nextRound < state.combatResult.totalRounds) {
            commit('setAnimationRound', nextRound);
        } else {
            commit('setFightPhase', 'results');
        }
    },

    /**
     * Finish the fight and go to results.
     */
    finishFight({commit}) {
        commit('setFightPhase', 'results');
    },

    /**
     * Reset to preparation screen.
     */
    async resetToPreparation({commit}) {
        commit('setCombatResult', null);
        commit('setOpponent', null);
        commit('setAnimationRound', -1);
        commit('setFightPhase', 'preparation');
        await router.push('/arena');
    },

    /**
     * Start a new fight immediately (Fight Again).
     */
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
