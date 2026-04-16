<template>
  <div class="background">
    <div class="agent-detail">
      <!-- Loading -->
      <div v-if="loading" class="loader-wrap"><v-progress-circular size="36" indeterminate /></div>

      <template v-else-if="agent">
        <!-- Header Actions -->
        <div class="header-top">
          <button class="back-link" @click="$router.push('/arena/club')">&larr;</button>
          <div class="header-actions">
            <button class="icon-btn" @click="showEdit = true">&#9881;</button>
            <button class="icon-btn icon-btn--danger" @click="confirmDelete">&#128465;</button>
          </div>
        </div>

        <!-- Hero -->
        <div class="hero">
          <img :src="`/images/skins/${agent.skin}`" class="hero-skin" />
          <div class="hero-identity">
            <div class="hero-name">{{ agent.name }}</div>
            <div v-if="agent.primaryModule" class="hero-arch">
              <HexBadge variant="archetype" :archetype="agent.primaryModule" size="sm">{{ shortArch(agent.primaryModule) }} 50%</HexBadge>
              <HexBadge variant="archetype" :archetype="agent.secondaryModule" size="sm">{{ shortArch(agent.secondaryModule) }} 30%</HexBadge>
              <HexBadge variant="archetype" :archetype="agent.tertiaryModule" size="sm">{{ shortArch(agent.tertiaryModule) }} 20%</HexBadge>
            </div>
            <div v-else class="hero-arch-empty">{{ t.club.lblNoModules || 'No modules set' }}</div>
            <div class="hero-inline-stats">
              <span class="stat-num">{{ agent.totalFights }}</span> {{ t.club.lblFightsShort || 'fights' }}
              · <span class="stat-num">{{ winRate }}%</span> {{ t.club.lblWinrateShort || 'winrate' }}
            </div>
          </div>
        </div>

        <!-- Belt -->
        <div class="belt-row">
          <template v-if="agent.isHexmaster">
            <div class="belt-hexmaster">★ {{ t.belts?.hexmaster || 'Hexmaster' }}</div>
          </template>
          <template v-else>
            <div class="belt-labels">
              <span class="belt-current">{{ beltName }}</span>
              <span v-if="nextBeltName" class="belt-next">→ {{ nextBeltName }}</span>
              <span class="belt-remaining">{{ beltProgress.remaining }} {{ t.belts?.lblWinsToNextShort || 'wins to next' }}</span>
            </div>
            <div class="belt-bar">
              <div class="belt-bar-fill" :style="{ width: beltProgressPercent + '%' }"></div>
            </div>
          </template>
        </div>

        <!-- Tabs -->
        <div class="tab-bar">
          <button v-for="tab in tabs" :key="tab" :class="['tab-btn', { active: activeTab === tab }]" @click="activeTab = tab">
            {{ t.club[`lbl${tab.charAt(0).toUpperCase() + tab.slice(1)}`] || tab }}
          </button>
        </div>

        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-content hex-fade-in">
          <!-- Branch XP -->
          <div class="branch-xp">
            <div class="xp-row">
              <span class="xp-label">{{ t.gameData?.branches?.speed?.name || 'Speed' }}</span>
              <HexProgress :value="prog.speedXp" :max="Math.max(prog.speedXp, 100)" variant="branch" branch="speed" size="sm" />
              <span class="xp-val">{{ prog.speedXp }} / {{ Math.max(prog.speedXp, 100) }}</span>
            </div>
            <div class="xp-row">
              <span class="xp-label">{{ t.gameData?.branches?.power?.name || 'Power' }}</span>
              <HexProgress :value="prog.powerXp" :max="Math.max(prog.powerXp, 100)" variant="branch" branch="power" size="sm" />
              <span class="xp-val">{{ prog.powerXp }} / {{ Math.max(prog.powerXp, 100) }}</span>
            </div>
            <div class="xp-row">
              <span class="xp-label">{{ t.gameData?.branches?.technique?.name || 'Technique' }}</span>
              <HexProgress :value="prog.techniqueXp" :max="Math.max(prog.techniqueXp, 100)" variant="branch" branch="technique" size="sm" />
              <span class="xp-val">{{ prog.techniqueXp }} / {{ Math.max(prog.techniqueXp, 100) }}</span>
            </div>
          </div>

          <!-- Deck -->
          <div v-if="deck.length" class="deck-section">
            <div class="deck-header">
              <span class="deck-title">{{ t.club.lblDeckShort || 'Deck' }} <span class="deck-count">{{ deck.length }} / 8</span></span>
              <button class="deck-edit-link" @click="showDeckEdit = true">{{ t.club.lblEditDeckShort || 'edit' }} →</button>
            </div>
            <div class="deck-chips">
              <span v-for="m in deck" :key="m" class="deck-chip">{{ moveName(m) }}</span>
            </div>
          </div>

          <!-- Train Now -->
          <HexButton variant="primary" block :loading="trainLoading" :disabled="agent.status !== 'idle'" @click="onTrain" class="train-btn">
            {{ t.club.lblTrainNow || 'Train Now' }}
          </HexButton>
          <div v-if="trainResult" class="train-result" :class="trainResult.fight.result">
            {{ trainResult.fight.result.toUpperCase() }} &mdash; {{ trainResult.fight.rounds }} rounds, +{{ trainResult.fight.xpEarned }} XP
          </div>
        </div>

        <!-- Moves Tab (Research Tree) -->
        <div v-if="activeTab === 'moves'" class="tab-content hex-fade-in">
          <ResearchTree :agent-id="agentId" />
        </div>

        <!-- Tactics Tab -->
        <div v-if="activeTab === 'tactics'" class="tab-content hex-fade-in">
          <div class="auto-fight-section">
            <div class="auto-fight-header">
              <div>
                <div class="tactic-label">{{ t.club.lblAutoFight || 'Auto Fight' }}</div>
                <div class="auto-fight-desc">{{ t.club.lblAutoFightDesc || 'Run battles automatically when idle' }}</div>
              </div>
              <button class="auto-switch" :class="{ 'auto-switch--on': agent.autoFight }" @click="onToggleAuto">
                <span class="auto-switch-knob"></span>
              </button>
            </div>
          </div>
          <div class="tactic-divider"></div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblFightMode || 'Fight Mode' }}</div>
            <div class="pill-row">
              <button v-for="m in ['pve_training','ranked','free_arena']" :key="m" :class="['hex-pill', { 'is-active': tacticsForm.fightMode === m }]" @click="tacticsForm.fightMode = m">{{ tacticLabel('fightMode', m) }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblAggression || 'Aggression' }}</div>
            <div class="pill-row">
              <button v-for="v in ['cautious','balanced','aggressive']" :key="v" :class="['hex-pill', { 'is-active': tacticsForm.aggression === v }]" @click="tacticsForm.aggression = v">{{ tacticLabel('aggression', v) }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblDicePolicy || 'Dice Policy' }}</div>
            <div class="pill-row">
              <button v-for="v in ['always','smart','never']" :key="v" :class="['hex-pill', { 'is-active': tacticsForm.dicePolicy === v }]" @click="tacticsForm.dicePolicy = v">{{ tacticLabel('dicePolicy', v) }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblCoachPref || 'Coach' }}</div>
            <div class="pill-row">
              <button v-for="v in ['attack','defense','position','auto']" :key="v" :class="['hex-pill', { 'is-active': tacticsForm.coachPreference === v }]" @click="tacticsForm.coachPreference = v">{{ tacticLabel('coach', v) }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblEmergency || 'Emergency' }}</div>
            <div class="pill-row">
              <button v-for="v in [30, 20, 0]" :key="v" :class="['hex-pill', { 'is-active': tacticsForm.emergencyThreshold === v }]" @click="tacticsForm.emergencyThreshold = v">{{ tacticLabel('emergency', String(v)) }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblRestPeriod || 'Rest Period' }}</div>
            <div class="pill-row">
              <button v-for="v in [600000, 1800000, 3600000]" :key="v" :class="['hex-pill', { 'is-active': tacticsForm.restPeriod === v }]" @click="tacticsForm.restPeriod = v">{{ tacticLabel('restPeriod', String(v)) }}</button>
            </div>
          </div>
          <HexButton variant="primary" block :loading="savingTactics" :disabled="!tacticsDirty" @click="onSaveTactics" class="tactic-save">
            {{ t.club.lblSaveTactics || 'Save Tactics' }}
          </HexButton>
        </div>

        <!-- Fights Tab -->
        <div v-if="activeTab === 'fights'" class="tab-content hex-fade-in">
          <div class="pill-row">
            <button v-for="m in [null,'pve_training','ranked','free_arena']" :key="String(m)" :class="['hex-pill', { 'is-active': fightFilter === m }]" @click="onFightFilter(m)">
              {{ m ? tacticLabel('fightMode', m) : (t.club.lblAll || 'All') }}
            </button>
          </div>
          <div v-if="fightHistoryLoading && !fightHistory.length" class="loader-wrap"><v-progress-circular size="24" indeterminate /></div>
          <div v-else>
            <div v-for="fight in fightHistory" :key="fight.id" :class="['fight-card', `fight-card--${fight.result}`]">
              <div class="fight-top">
                <span class="fight-result">{{ fightResultLabel(fight.result) }}</span>
                <span class="fight-time">{{ relativeTime(fight.createdAt) }}</span>
              </div>
              <div class="fight-details">
                <span>{{ t.club.lblVs || 'vs' }} {{ fight.opponentName || (t.club.lblBot || 'Bot') }}</span>
                <span>{{ fight.rounds }} {{ t.club.lblRoundsShort || 'rounds' }}</span>
                <span>{{ t.club.lblHpShort || 'HP' }}: {{ fight.playerHpLeft }}/100</span>
              </div>
              <div class="fight-meta">
                <span class="fight-xp">+{{ fight.xpEarned }} XP</span>
              </div>
            </div>
            <HexButton v-if="fightHistory.length < fightHistoryTotal" variant="ghost" block @click="loadMoreFights" :loading="fightHistoryLoading" class="fights-load-more">
              {{ t.clan.lblLoadMore || 'Load More' }}
            </HexButton>
            <div v-if="!fightHistory.length && !fightHistoryLoading" class="empty-text">{{ t.club.lblNoFightsYet || 'No fights yet' }}</div>
          </div>
        </div>

        <!-- Edit Modal -->
        <Teleport to="body">
          <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
            <div class="modal-content">
              <div class="modal-header">
                <span class="modal-title">{{ t.club.lblEditAgent || 'Edit Agent' }}</span>
                <button class="icon-btn" @click="showEdit = false">&times;</button>
              </div>
              <div class="field">
                <input v-model="editForm.name" class="name-input" :placeholder="t.club.lblAgentName || 'Name'" maxlength="20" />
              </div>
              <SkinPicker v-model="editForm.skin" />
              <ArchetypeSelector v-model="editForm.primaryModule" :label="t.club.lblPrimaryModule || 'Primary (50%)'" />
              <div style="height:12px" />
              <ArchetypeSelector v-model="editForm.secondaryModule" :label="t.club.lblSecondaryModule || 'Secondary (30%)'" />
              <div style="height:12px" />
              <ArchetypeSelector v-model="editForm.tertiaryModule" :label="t.club.lblTertiaryModule || 'Tertiary (20%)'" />
              <HexButton variant="primary" block @click="onSaveEdit" :loading="savingEdit" style="margin-top:16px">{{ t.club.lblSaveChanges || 'Save' }}</HexButton>
            </div>
          </div>
        </Teleport>

        <!-- Deck Edit Modal -->
        <Teleport to="body">
          <div v-if="showDeckEdit" class="modal-overlay" @click.self="showDeckEdit = false">
            <div class="modal-content">
              <div class="modal-header">
                <span class="modal-title">{{ t.club.lblEditDeck || 'Edit Deck' }} ({{ deckEditForm.length }}/8)</span>
                <button class="icon-btn" @click="showDeckEdit = false">&times;</button>
              </div>
              <div class="section-label">{{ t.club.lblCurrentDeck || 'Current' }}</div>
              <div class="deck-badges">
                <span v-for="m in deckEditForm" :key="m" class="deck-chip" @click="removeDeckMove(m)">{{ m }} &times;</span>
              </div>
              <div class="section-label" style="margin-top:12px">{{ t.club.lblAvailableMoves || 'Available' }}</div>
              <div class="deck-badges">
                <span v-for="m in deckAvailable" :key="m" class="deck-chip deck-chip--add" @click="addDeckMove(m)">{{ m }} +</span>
              </div>
              <HexButton variant="primary" block :disabled="deckEditForm.length < 4" @click="onSaveDeck" :loading="savingDeck" style="margin-top:16px">{{ t.club.lblSaveDeck || 'Save' }}</HexButton>
            </div>
          </div>
        </Teleport>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import HexButton from '@/components/ui/HexButton.vue';
import HexBadge from '@/components/ui/HexBadge.vue';
import HexProgress from '@/components/ui/HexProgress.vue';
import BeltBadge from '@/components/ui/BeltBadge.vue';
import { getBeltDisplay, getNextThreshold, getBeltProgressPercent } from '@/utils/beltDisplay.js';
import SkinPicker from '@/components/club/SkinPicker.vue';
import ArchetypeSelector from '@/components/club/ArchetypeSelector.vue';
import ResearchTree from '@/components/club/ResearchTree.vue';

const route = useRoute();
const router = useRouter();
const agentId = route.params.agentId;

const loading = computed(() => store.state.agent.currentAgentLoading);
const agent = computed(() => store.state.agent.currentAgent);
const prog = computed(() => agent.value?.progression || { speedXp: 0, powerXp: 0, techniqueXp: 0, moves: [], deck: [] });
const deck = computed(() => Array.isArray(prog.value.deck) ? prog.value.deck : []);
const trainLoading = computed(() => store.state.agent.trainLoading);
const trainResult = computed(() => store.state.agent.trainResult);
const fightHistory = computed(() => store.state.agent.fightHistory);
const fightHistoryTotal = computed(() => store.state.agent.fightHistoryTotal);
const fightHistoryLoading = computed(() => store.state.agent.fightHistoryLoading);

const activeTab = ref('overview');
const tabs = ['overview', 'moves', 'tactics', 'fights'];
const fightFilter = ref(null);

const showEdit = ref(false);
const showDeckEdit = ref(false);
const savingEdit = ref(false);
const savingTactics = ref(false);
const savingDeck = ref(false);

const winRate = computed(() => {
  if (!agent.value || !agent.value.totalFights) return 0;
  return Math.round((agent.value.wins / agent.value.totalFights) * 100);
});

const beltDisplay = computed(() => agent.value ? getBeltDisplay(agent.value.belt || 0) : { color: 'white', stripes: 0 });
const beltName = computed(() => {
  if (!agent.value) return '';
  if (agent.value.isHexmaster) return t.value.belts?.hexmaster || 'Hexmaster';
  const d = beltDisplay.value;
  const colorName = t.value.belts?.[d.color] || d.color;
  return d.stripes > 0 ? `${colorName} ${'●'.repeat(d.stripes)}` : colorName;
});
const beltProgress = computed(() => {
  if (!agent.value) return { remaining: null, hexmasterRemaining: null };
  return getNextThreshold(agent.value.qualifiedWins || 0, agent.value.belt || 0);
});
const beltProgressPercent = computed(() => {
  if (!agent.value) return 0;
  return getBeltProgressPercent(agent.value.qualifiedWins || 0, agent.value.belt || 0);
});

const nextBeltName = computed(() => {
  if (!agent.value || agent.value.isHexmaster) return null;
  const nextGrade = Math.min((agent.value.belt || 0) + 1, 32);
  const nd = getBeltDisplay(nextGrade);
  return t.value.belts?.[nd.color] || nd.color;
});

const shortArch = (n) => n ? n.slice(0, 3).toUpperCase() : '';

const moveName = (id) => {
  return t.value.gameData?.moves?.[id]?.name || id;
};

// Tactics form
const tacticsForm = ref({ fightMode: 'pve_training', aggression: 'balanced', dicePolicy: 'smart', coachPreference: 'auto', emergencyThreshold: 30, restPeriod: 600000 });
watch(agent, (a) => {
  if (a?.tactics) {
    tacticsForm.value = {
      fightMode: a.tactics.fightMode || 'pve_training',
      aggression: a.tactics.aggression || 'balanced',
      dicePolicy: a.tactics.dicePolicy || 'smart',
      coachPreference: a.tactics.coachPreference || 'auto',
      emergencyThreshold: a.tactics.emergencyThreshold ?? 30,
      restPeriod: a.tactics.restPeriod || 600000,
    };
  }
}, { immediate: true });

// Edit form
const editForm = ref({ name: '', skin: '', primaryModule: null, secondaryModule: null, tertiaryModule: null });
watch(showEdit, (v) => {
  if (v && agent.value) {
    editForm.value = {
      name: agent.value.name,
      skin: agent.value.skin,
      primaryModule: agent.value.primaryModule,
      secondaryModule: agent.value.secondaryModule,
      tertiaryModule: agent.value.tertiaryModule,
    };
  }
});

// Deck edit form
const deckEditForm = ref([]);
const learnedMoveIds = computed(() => {
  const moves = prog.value.moves;
  if (!Array.isArray(moves)) return [];
  return moves.map(m => m.moveId);
});
const deckAvailable = computed(() => learnedMoveIds.value.filter(id => !deckEditForm.value.includes(id)));
watch(showDeckEdit, (v) => {
  if (v) deckEditForm.value = [...deck.value];
});
const addDeckMove = (id) => { if (deckEditForm.value.length < 8) deckEditForm.value.push(id); };
const removeDeckMove = (id) => { deckEditForm.value = deckEditForm.value.filter(m => m !== id); };

// Actions
const onToggleAuto = async () => {
  try {
    await store.dispatch('agent/toggleAutoFight', { id: agentId, enabled: !agent.value.autoFight });
    await store.dispatch('agent/fetchAgent', agentId);
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Failed to toggle auto fight' });
  }
};

const onTrain = async () => {
  try {
    await store.dispatch('agent/trainAgent', agentId);
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Training failed' });
  }
};

const onSaveTactics = async () => {
  savingTactics.value = true;
  try {
    await store.dispatch('agent/updateTactics', { id: agentId, ...tacticsForm.value });
    store.commit('master/setInfo', { text: t.value.club?.lblTacticsSaved || 'Tactics saved' });
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Failed' });
  } finally {
    savingTactics.value = false;
  }
};

const onSaveEdit = async () => {
  savingEdit.value = true;
  try {
    await store.dispatch('agent/updateAgent', { id: agentId, ...editForm.value });
    showEdit.value = false;
    store.commit('master/setInfo', { text: 'Agent updated' });
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Failed' });
  } finally {
    savingEdit.value = false;
  }
};

const onSaveDeck = async () => {
  savingDeck.value = true;
  try {
    await store.dispatch('agent/updateDeck', { agentId, deck: deckEditForm.value });
    showDeckEdit.value = false;
    store.commit('master/setInfo', { text: t.value.club?.lblDeckSaved || 'Deck saved' });
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Failed' });
  } finally {
    savingDeck.value = false;
  }
};

const confirmDelete = async () => {
  if (!confirm(t.value.club?.lblDeleteConfirm || 'Delete this agent?')) return;
  try {
    await store.dispatch('agent/deleteAgent', agentId);
    router.push('/arena/club');
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Failed' });
  }
};

const onFightFilter = (mode) => {
  fightFilter.value = mode;
  store.dispatch('agent/fetchFightHistory', { agentId, mode, offset: 0 });
};

const loadMoreFights = () => {
  store.dispatch('agent/fetchFightHistory', { agentId, mode: fightFilter.value, offset: fightHistory.value.length, append: true });
};

// Tactic label helper
const TACTIC_LABELS = {
  fightMode: { pve_training: 'PvE Training', ranked: 'Ranked', free_arena: 'Free Arena' },
  aggression: { cautious: 'Cautious', balanced: 'Balanced', aggressive: 'Aggressive' },
  dicePolicy: { always: 'Always', smart: 'Smart', never: 'Never' },
  coach: { attack: 'Attack', defense: 'Defense', position: 'Position', auto: 'Auto' },
  emergency: { '30': '30% HP', '20': '20% HP', '0': 'Off' },
  restPeriod: { '600000': '10m', '1800000': '30m', '3600000': '1h' },
};
const tacticLabel = (group, value) => {
  return t.value.club?.tactics?.[group]?.[value] || TACTIC_LABELS[group]?.[value] || value;
};

const tacticsDirty = computed(() => {
  if (!agent.value?.tactics) return false;
  const orig = agent.value.tactics;
  return tacticsForm.value.fightMode !== (orig.fightMode || 'pve_training')
    || tacticsForm.value.aggression !== (orig.aggression || 'balanced')
    || tacticsForm.value.dicePolicy !== (orig.dicePolicy || 'smart')
    || tacticsForm.value.coachPreference !== (orig.coachPreference || 'auto')
    || tacticsForm.value.emergencyThreshold !== (orig.emergencyThreshold ?? 30)
    || tacticsForm.value.restPeriod !== (orig.restPeriod || 600000);
});

const fightResultLabel = (result) => {
  const key = `lbl${result.charAt(0).toUpperCase() + result.slice(1)}`;
  return (t.value.club?.[key] || result).toUpperCase();
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  const ago = t.value.club?.lblAgo || 'ago';
  if (min < 60) return `${min}${t.value.club?.lblMinShort || 'm'} ${ago}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}${t.value.club?.lblHourShort || 'h'} ${ago}`;
  return `${Math.floor(hr / 24)}${t.value.club?.lblDayShort || 'd'} ${ago}`;
};

// Tab watchers — load data on tab switch
watch(activeTab, (tab) => {
  if (tab === 'fights') store.dispatch('agent/fetchFightHistory', { agentId, mode: fightFilter.value, offset: 0 });
});

onMounted(() => {
  store.dispatch('agent/fetchAgent', agentId);
});
</script>

<style scoped>
.agent-detail {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
  max-width: 480px;
  margin: 0 auto;
  padding: 80px 16px 120px;
}

@supports (height: 100dvh) {
  .agent-detail {
    height: 100dvh;
  }
}
.loader-wrap { display: flex; justify-content: center; padding: 48px 0; }

/* Header Actions */
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.back-link { font-size: 18px; color: var(--hex-primary); background: none; border: none; cursor: pointer; }
.header-actions { display: flex; gap: 8px; }
.icon-btn { font-size: 16px; color: var(--hex-text-muted); background: none; border: none; cursor: pointer; }
.icon-btn--danger { color: var(--hex-defeat); }

/* Hero */
.hero { display: flex; gap: 18px; align-items: flex-start; margin-bottom: 16px; }
.hero-skin { width: 120px; height: 120px; border-radius: var(--hex-radius-md, 8px); object-fit: cover; object-position: top; border: 1px solid var(--hex-border-default); flex-shrink: 0; }
.hero-identity { flex: 1; min-width: 0; }
.hero-name { font-size: 24px; color: var(--hex-text-primary); font-weight: 500; line-height: 1.1; letter-spacing: 0.5px; }
.hero-arch { display: flex; gap: 6px; margin-top: 8px; }
.hero-arch-empty { font-size: 11px; color: var(--hex-text-muted); margin-top: 8px; font-style: italic; }
.hero-inline-stats { font-size: 11px; color: var(--hex-text-muted); margin-top: 8px; }
.stat-num { color: var(--hex-text-primary); }

/* Belt */
.belt-row { margin-bottom: 20px; }
.belt-labels { display: flex; align-items: baseline; gap: 6px; font-size: 11px; margin-bottom: 6px; }
.belt-current { color: var(--hex-text-primary); }
.belt-next { color: var(--hex-text-muted); }
.belt-remaining { margin-left: auto; color: var(--hex-text-muted); }
.belt-bar { height: 3px; background: var(--hex-border-default); border-radius: 2px; overflow: hidden; }
.belt-bar-fill { height: 100%; background: var(--hex-text-muted); border-radius: 2px; transition: width 0.3s; }
.belt-hexmaster { font-size: 13px; color: var(--hex-text-primary); }
.belt-hexmaster span:first-child { color: var(--hex-primary); }

/* Tabs */
.tab-bar { display: flex; gap: 24px; border-bottom: 1px solid var(--hex-border-default); margin-bottom: 16px; }
.tab-btn { padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--hex-text-muted); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
.tab-btn.active { color: var(--hex-text-primary); border-bottom-color: var(--hex-text-primary); }

/* Sections (used by Moves/Tactics/Fights tabs) */
.section { margin-bottom: 16px; }
.section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--hex-text-muted); margin-bottom: 8px; }

/* Branch XP */
.branch-xp { margin-bottom: 20px; }
.xp-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.xp-label { width: 80px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--hex-text-secondary); flex-shrink: 0; }
.xp-val { width: 48px; text-align: right; font-size: 10px; color: var(--hex-text-muted); flex-shrink: 0; }

/* Deck */
.deck-section { margin-bottom: 20px; }
.deck-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.deck-title { font-size: 11px; color: var(--hex-text-muted); }
.deck-count { color: var(--hex-text-muted); }
.deck-edit-link { font-size: 11px; color: var(--hex-text-muted); background: none; border: none; cursor: pointer; }
.deck-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.deck-badges { display: flex; flex-wrap: wrap; gap: 4px; }
.deck-chip { background: var(--hex-bg-light); border: 1px solid var(--hex-border-default); color: var(--hex-text-secondary); padding: 3px 8px; font-size: 11px; border-radius: 3px; }

/* Train */
.train-btn { margin-top: 20px; }
.train-btn[disabled] { background: transparent; border: 1px solid var(--hex-border-default); }
.train-result { margin-top: 10px; text-align: center; font-size: 13px; padding: 8px; border-radius: 6px; }
.train-result.victory { color: var(--hex-victory); background: var(--hex-victory-bg); }
.train-result.defeat { color: var(--hex-defeat); background: var(--hex-defeat-bg); }
.train-result.draw { color: var(--hex-draw); background: var(--hex-draw-bg); }

/* Pill row (shared by Moves/Tactics/Fights) */
.pill-row { display: flex; gap: 4px; margin-bottom: 12px; }

/* Tactics */
.auto-fight-section { margin-bottom: 4px; }
.auto-fight-header { display: flex; justify-content: space-between; align-items: center; }
.auto-fight-desc { font-size: 11px; color: var(--hex-text-muted); margin-top: 2px; }
.auto-switch {
  position: relative;
  width: 24px;
  height: 14px;
  background: var(--hex-bg-light);
  border-radius: 7px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.auto-switch--on { background: var(--hex-text-secondary); }
.auto-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 10px;
  height: 10px;
  background: var(--hex-text-primary);
  border-radius: 50%;
  transition: left 0.15s;
}
.auto-switch--on .auto-switch-knob { left: 12px; }
.tactic-divider { border-top: 1px solid var(--hex-border-default); margin: 12px 0; }
.tactic-group { margin-bottom: 14px; }
.tactic-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--hex-text-muted); margin-bottom: 6px; }
.tactic-save { margin-top: 20px; }

/* Fights */
.fight-card { background: var(--hex-bg-medium); border-radius: 8px; padding: 10px; margin-bottom: 8px; border-left: 3px solid var(--hex-border-default); }
.fight-card--victory { border-left-color: var(--hex-victory); }
.fight-card--defeat { border-left-color: var(--hex-defeat); }
.fight-card--draw { border-left-color: var(--hex-draw); }
.fight-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
.fight-result { font-size: 12px; font-weight: 600; }
.fight-card--victory .fight-result { color: var(--hex-victory); }
.fight-card--defeat .fight-result { color: var(--hex-defeat); }
.fight-card--draw .fight-result { color: var(--hex-draw); }
.fight-time { font-size: 10px; color: var(--hex-text-muted); }
.fight-details { font-size: 11px; color: var(--hex-text-secondary); display: flex; gap: 10px; }
.fight-meta { display: flex; gap: 10px; margin-top: 4px; font-size: 11px; }
.fight-xp { color: var(--hex-victory); }
.fights-load-more { margin-top: 12px; }
.empty-text { text-align: center; color: var(--hex-text-muted); font-size: 13px; padding: 24px 0; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9000; display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto; }
.modal-content { background: var(--hex-bg-dark); border: 1px solid var(--hex-border-default); border-radius: 12px; padding: 16px; width: 100%; max-width: 420px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.modal-title { font-family: 'Anonymous', monospace; font-size: 14px; color: var(--hex-text-primary); }
.name-input { width: 100%; padding: 8px 10px; font-family: 'Anonymous', monospace; font-size: 13px; color: var(--hex-text-primary); background: var(--hex-bg-medium); border: 1px solid var(--hex-border-default); border-radius: 6px; outline: none; margin-bottom: 12px; }
.name-input:focus { border-color: var(--hex-primary); }
.field { margin-bottom: 8px; }

/* Deck chips */
.deck-chip { display: inline-flex; padding: 4px 8px; font-size: 11px; border-radius: 4px; background: var(--hex-bg-light); color: var(--hex-text-primary); cursor: pointer; border: 1px solid var(--hex-border-default); }
.deck-chip--add { border-style: dashed; color: var(--hex-text-muted); }

@media (min-width: 1024px) {
  .agent-detail {
    max-width: 1200px;
    padding: 100px 32px 120px;
  }
  .back-link { font-size: 20px; }
  .icon-btn { font-size: 18px; }
  .hero { gap: 24px; margin-bottom: 24px; }
  .hero-skin { width: 160px; height: 160px; }
  .hero-name { font-size: 32px; }
  .hero-arch { gap: 8px; margin-top: 10px; }
  .hero-arch-empty { font-size: 13px; }
  .hero-inline-stats { font-size: 14px; margin-top: 10px; }
  .belt-row { margin-bottom: 28px; }
  .belt-labels { font-size: 13px; margin-bottom: 8px; }
  .belt-bar { height: 4px; }
  .belt-hexmaster { font-size: 15px; }
  .tab-bar { gap: 32px; margin-bottom: 24px; }
  .tab-btn { padding: 12px 0; font-size: 13px; letter-spacing: 2.5px; }
  .branch-xp { margin-bottom: 28px; }
  .xp-row { gap: 12px; margin-bottom: 10px; }
  .xp-label { width: 100px; font-size: 13px; }
  .xp-val { width: 56px; font-size: 12px; }
  .deck-section { margin-bottom: 28px; }
  .deck-header { margin-bottom: 12px; }
  .deck-title { font-size: 13px; }
  .deck-edit-link { font-size: 13px; }
  .deck-chips { gap: 8px; }
  .deck-chip { padding: 5px 12px; font-size: 13px; }
  .train-btn { margin-top: 24px; }
  /* Tactics desktop */
  .tactic-label { font-size: 12px; }
  .auto-fight-desc { font-size: 13px; }
  .tactic-save { margin-top: 24px; }
  /* Fights desktop */
  .fight-card { padding: 14px; }
  .fight-result { font-size: 14px; }
  .fight-time { font-size: 12px; }
  .fight-details { font-size: 13px; }
  .fight-meta { font-size: 13px; }
}
</style>
