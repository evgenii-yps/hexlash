<template>
  <div class="prep-v2">
    <div class="prep-scroll">
      <!-- Top bar -->
      <div class="prep-top">
        <button class="prep-back" @click="$router.push('/arena/pit')">←</button>
        <div class="prep-title">{{ pv2.lblTitle || 'PREPARATION' }}</div>
        <ModeSelector :onlineCount="onlineCount" @select="onModeSelect" />
      </div>

      <!-- No agent -->
      <div v-if="!activeAgent" class="prep-no-agent">
        {{ t.fight?.errNoActiveAgent || 'Create an agent first' }}
      </div>

      <template v-if="activeAgent">
        <!-- Deck slots -->
        <div class="prep-section-label">{{ pv2.lblDeck || 'YOUR DECK' }} <span class="prep-slots-left" v-if="deck.length < 5">{{ interpolate(pv2.lblSlotsLeft || '{n} slots left', { n: 5 - deck.length }) }}</span></div>
        <div class="prep-deck">
          <div v-for="i in 5" :key="'slot-' + i" :class="['prep-slot', { filled: deck[i - 1], [`branch-${getMoveData(deck[i - 1])?.branch}`]: deck[i - 1] }]" @click="deck[i - 1] && removeFromDeck(i - 1)">
            <template v-if="deck[i - 1]">
              <span class="prep-slot-name">{{ moveName(deck[i - 1]) }}</span>
              <span class="prep-slot-lvl">Lv{{ getMoveLevel(deck[i - 1]) }}</span>
            </template>
            <span v-else class="prep-slot-empty">+</span>
          </div>
        </div>

        <!-- Available moves pool -->
        <div class="prep-section-label">{{ pv2.lblMoves || 'AVAILABLE MOVES' }}</div>
        <div v-for="branch in branches" :key="branch.id" class="prep-branch">
          <div class="prep-branch-name" :style="{ color: `var(--hex-branch-${branch.id})` }">{{ branchName(branch.id) }}</div>
          <div class="prep-branch-moves">
            <button v-for="m in branch.moves" :key="m.moveId" :class="['prep-move', { inDeck: deck.includes(m.moveId), [`branch-${branch.id}`]: true }]" :disabled="deck.includes(m.moveId) || deck.length >= 5" @click="addToDeck(m.moveId)">
              {{ moveName(m.moveId) }} <span class="prep-move-lvl">{{ m.level }}</span>
            </button>
          </div>
        </div>

        <!-- Strategy (decorative) -->
        <div class="prep-section-label">{{ pv2.lblStrategy || 'STRATEGY' }}</div>
        <div class="prep-strategy">
          <button :class="['prep-strat-card', { active: strategy === 'aggressive' }]" @click="strategy = 'aggressive'" style="--strat-color: var(--hex-action-attack)">
            <span class="strat-name">{{ pv2.lblAggressive || 'AGGRESSIVE' }}</span>
          </button>
          <button :class="['prep-strat-card', { active: strategy === 'balanced' }]" @click="strategy = 'balanced'" style="--strat-color: var(--hex-text-muted)">
            <span class="strat-name">{{ pv2.lblBalanced || 'BALANCED' }}</span>
          </button>
          <button :class="['prep-strat-card', { active: strategy === 'defensive' }]" @click="strategy = 'defensive'" style="--strat-color: var(--hex-action-defense)">
            <span class="strat-name">{{ pv2.lblDefensive || 'DEFENSIVE' }}</span>
          </button>
        </div>

        <!-- Stake (PvE only — backend-wired in Phase 4.3) -->
        <div class="prep-section-label">{{ pv2.lblStake || 'STAKE' }}</div>
        <div class="prep-stake">
          <button v-for="s in stakes" :key="s.id" :class="['prep-stake-btn', { active: stake === s.id }]" @click="stake = s.id">{{ s.label }}</button>
        </div>
        <div class="prep-stake-meta" v-if="selectedMode === 'pve'">
          <span class="prep-stake-cost">{{ pv2.lblCost || 'COST' }}: {{ stakeAmount }}</span>
          <span class="prep-stake-balance" :class="{ 'prep-stake-balance--low': !canAffordStake }">
            {{ pv2.lblBalance || 'BALANCE' }}: {{ balance }}
          </span>
        </div>

        <!-- START FIGHT -->
        <HexButton variant="primary" size="lg" block :disabled="deck.length < 5" @click="startFight" class="prep-start-btn">
          {{ pv2.lblStartFight || 'START FIGHT' }}
        </HexButton>
      </template>

      <div class="scroll-gap"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t, interpolate } from '@/locales/index.js';
import { allMoves } from '@/data/moves.js';
import { branches as branchData } from '@/data/branches.js';
import { getOnlinePlayersCount } from '@/core/services/statsService.js';
import HexButton from '@/components/ui/HexButton.vue';
import ModeSelector from '@/components/arena/ModeSelector.vue';
import apiClient from '@/core/api/apiClient.js';

// Stake amounts — MUST match backend STAKE_AMOUNTS in backend/src/config.js.
// D-note: duplicated from backend for MVP. Park: single source via GET /v1/config.
const STAKE_AMOUNTS = { low: 100, medium: 500, high: 1000 };

export default {
  name: 'PreparationViewV2',
  components: { HexButton, ModeSelector },
  setup() {
    const router = useRouter();
    const pv2 = computed(() => t.value.preparation?.v2 || {});
    const activeAgent = computed(() => store.getters['agent/activeAgent']);
    const prog = computed(() => activeAgent.value?.progression || { moves: [], deck: [] });

    const deck = ref([]);
    const strategy = ref('balanced');
    const stake = ref('medium');
    const selectedMode = ref('pve');
    const onlineCount = ref(0);

    const stakes = computed(() => [
      { id: 'low', label: pv2.value.lblLow || 'LOW' },
      { id: 'medium', label: pv2.value.lblMedium || 'MEDIUM' },
      { id: 'high', label: pv2.value.lblHigh || 'HIGH' },
    ]);

    // Balance + stake cost (Phase 4.3)
    const balance = computed(() => store.getters['master/getMaster']?.userData?.balance || 0);
    const stakeAmount = computed(() => STAKE_AMOUNTS[stake.value] || 0);
    const canAffordStake = computed(() => balance.value >= stakeAmount.value);

    // Build branch → moves from agent's unlocked moves
    const agentMoves = computed(() => Array.isArray(prog.value.moves) ? prog.value.moves : []);
    const branches = computed(() => {
      return ['speed', 'power', 'technique'].map(id => {
        const branchMoveIds = branchData[id]?.moves || [];
        const unlocked = agentMoves.value.filter(m => branchMoveIds.includes(m.moveId) && m.level > 0);
        return { id, moves: unlocked };
      }).filter(b => b.moves.length > 0);
    });

    const moveName = (id) => t.value.gameData?.moves?.[id]?.name || id;
    const branchName = (id) => t.value.gameData?.branches?.[id]?.name || id;
    const getMoveData = (id) => id ? (allMoves[id] || null) : null;
    const getMoveLevel = (id) => {
      const m = agentMoves.value.find(am => am.moveId === id);
      return m?.level || 1;
    };

    function addToDeck(moveId) {
      if (deck.value.length >= 5 || deck.value.includes(moveId)) return;
      deck.value.push(moveId);
    }

    function removeFromDeck(idx) {
      if (idx >= 0 && idx < deck.value.length) deck.value.splice(idx, 1);
    }

    function onModeSelect(mode) { selectedMode.value = mode; }

    async function startFight() {
      if (deck.value.length < 5 || !activeAgent.value) return;

      // PvE stake affordability guard (Phase 4.3). PvP stake is out of scope.
      if (selectedMode.value === 'pve' && !canAffordStake.value) {
        store.commit('master/setInfoMessage', {
          text: pv2.value.lblInsufficientBalance || 'Not enough balance',
          timeout: 3000,
        });
        return;
      }

      // Save deck to backend
      await store.dispatch('agent/updateDeck', { agentId: activeAgent.value.id, deck: deck.value });

      if (selectedMode.value === 'pvp') {
        router.push('/matchmaking-v2');
        return;
      }

      // PvE: deduct stake on server before transitioning to fight
      try {
        const res = await apiClient.post('/fight/start', { stake: stake.value }, { authRequired: true });
        if (res?.data?.stakeApplied && typeof res.data.newBalance === 'number') {
          store.commit('master/setBalance', res.data.newBalance);
        }
      } catch (e) {
        const serverErr = e.response?.data?.error;
        const msg = serverErr === 'Insufficient balance'
          ? (pv2.value.lblInsufficientBalance || 'Not enough balance')
          : (pv2.value.lblFightStartError || 'Failed to start fight');
        store.commit('master/setInfoMessage', { text: msg, timeout: 3000 });
        return;
      }

      // Store stake for /fight/save to include (persisted across refresh in cardFightState)
      store.commit('fight/setStakeLevel', stake.value);

      await store.dispatch('fight/startFight', { targetRoute: '/fight-v2' });
    }

    onMounted(async () => {
      if (!store.state.agent?.agents?.length) await store.dispatch('agent/fetchAgents').catch(() => {});
      // Pre-fill deck from agent's current deck
      const agentDeck = prog.value.deck;
      if (Array.isArray(agentDeck) && agentDeck.length) {
        deck.value = [...agentDeck].slice(0, 5);
      }
      onlineCount.value = await getOnlinePlayersCount();
    });

    return {
      t, interpolate, pv2, activeAgent, deck, strategy, stake, stakes,
      selectedMode, onlineCount, branches, moveName, branchName,
      getMoveData, getMoveLevel, addToDeck, removeFromDeck,
      onModeSelect, startFight,
      // Stake (Phase 4.3)
      balance, stakeAmount, canAffordStake,
    };
  },
};
</script>

<style scoped>
.prep-v2 { position: relative; width: 100%; height: 100vh; overflow: hidden; background: var(--hex-bg-deep); }
@supports (height: 100dvh) { .prep-v2 { height: 100dvh; } }

.prep-scroll {
  position: relative; z-index: 10; overflow-y: auto; height: 100%;
  padding: 80px 16px 120px; max-width: 600px; margin: 0 auto;
  -webkit-overflow-scrolling: auto; overscroll-behavior-y: none;
}

/* Top */
.prep-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.prep-back { background: none; border: none; color: var(--hex-text-secondary); font-size: 20px; cursor: pointer; min-height: 44px; min-width: 44px; }
.prep-title { font-family: var(--hex-font-display); font-size: 20px; color: var(--hex-text-primary); letter-spacing: 3px; }
.prep-no-agent { text-align: center; padding: 40px; color: var(--hex-text-muted); }

/* Section labels */
.prep-section-label {
  font-family: var(--hex-font-display); font-size: 11px; color: var(--hex-text-muted);
  letter-spacing: 2px; margin: 20px 0 8px; display: flex; align-items: center; gap: 8px;
}
.prep-slots-left { font-family: var(--hex-font-mono); font-size: 10px; color: var(--hex-primary); }

/* Deck slots */
.prep-deck { display: flex; gap: 8px; margin-bottom: 8px; }
.prep-slot {
  flex: 1; min-height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: var(--hex-bg-card); border: 1px dashed var(--hex-border-default); border-radius: var(--hex-radius-md);
  cursor: default; transition: all 0.15s; padding: 6px 4px;
}
.prep-slot.filled { border-style: solid; cursor: pointer; }
.prep-slot.branch-speed { border-color: var(--hex-branch-speed); }
.prep-slot.branch-power { border-color: var(--hex-branch-power); }
.prep-slot.branch-technique { border-color: var(--hex-branch-technique); }
.prep-slot-name { font-size: 10px; color: var(--hex-text-primary); text-align: center; line-height: 1.2; }
.prep-slot-lvl { font-family: var(--hex-font-mono); font-size: 9px; color: var(--hex-text-muted); }
.prep-slot-empty { font-size: 24px; color: var(--hex-text-muted); }
.prep-slot.filled:hover { opacity: 0.7; }

/* Branch moves pool */
.prep-branch { margin-bottom: 12px; }
.prep-branch-name { font-family: var(--hex-font-display); font-size: 10px; letter-spacing: 1.5px; margin-bottom: 4px; }
.prep-branch-moves { display: flex; flex-wrap: wrap; gap: 4px; }
.prep-move {
  padding: 6px 10px; font-size: 11px; font-family: var(--hex-font-body);
  background: var(--hex-bg-medium); border: 1px solid var(--hex-border-default);
  color: var(--hex-text-primary); border-radius: var(--hex-radius-sm); cursor: pointer;
  transition: all 0.15s;
}
.prep-move.branch-speed { border-color: color-mix(in srgb, var(--hex-branch-speed) 40%, transparent); }
.prep-move.branch-power { border-color: color-mix(in srgb, var(--hex-branch-power) 40%, transparent); }
.prep-move.branch-technique { border-color: color-mix(in srgb, var(--hex-branch-technique) 40%, transparent); }
.prep-move.inDeck { opacity: 0.3; cursor: not-allowed; }
.prep-move:disabled { opacity: 0.3; cursor: not-allowed; }
.prep-move:not(:disabled):hover { border-color: var(--hex-border-active); }
.prep-move-lvl { font-family: var(--hex-font-mono); font-size: 9px; color: var(--hex-text-muted); margin-left: 4px; }

/* Strategy */
.prep-strategy { display: flex; gap: 8px; }
.prep-strat-card {
  flex: 1; padding: 12px 8px; text-align: center;
  background: var(--hex-bg-card); border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md); cursor: pointer; transition: all 0.15s;
}
.prep-strat-card.active { border-color: var(--strat-color); box-shadow: 0 0 8px color-mix(in srgb, var(--strat-color) 30%, transparent); }
.strat-name { font-family: var(--hex-font-display); font-size: 10px; letter-spacing: 1.5px; color: var(--hex-text-primary); }

/* Stake */
.prep-stake { display: flex; gap: 8px; }
.prep-stake-btn {
  flex: 1; padding: 8px; text-align: center;
  font-family: var(--hex-font-mono); font-size: 12px;
  background: var(--hex-bg-medium); border: 1px solid var(--hex-border-default);
  color: var(--hex-text-muted); border-radius: var(--hex-radius-sm); cursor: pointer;
}
.prep-stake-btn.active { background: var(--hex-bg-card); color: var(--hex-text-primary); border-color: var(--hex-text-primary); }

.prep-stake-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
  font-family: var(--hex-font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
}
.prep-stake-cost { color: var(--hex-text-secondary); }
.prep-stake-balance { color: var(--hex-text-primary); font-weight: 600; }
.prep-stake-balance--low { color: var(--hex-danger); }

.prep-start-btn { margin-top: 24px; }
.scroll-gap { height: 80px; }
</style>
