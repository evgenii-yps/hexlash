<template>
  <div class="background">
    <div class="agent-detail">
      <!-- Loading -->
      <div v-if="loading" class="loader-wrap"><v-progress-circular size="36" indeterminate /></div>

      <template v-else-if="agent">
        <!-- Header -->
        <div class="agent-header">
          <div class="header-top">
            <button class="back-link" @click="$router.push('/arena/club')">&larr;</button>
            <div class="header-actions">
              <button class="icon-btn" @click="showEdit = true">&#9881;</button>
              <button class="icon-btn icon-btn--danger" @click="confirmDelete">&#128465;</button>
            </div>
          </div>
          <div class="header-info">
            <img :src="`/images/skins/${agent.skin}`" class="header-skin" />
            <div class="header-text">
              <div class="header-name">{{ agent.name }}</div>
              <div v-if="agent.primaryModule" class="header-arch">
                <HexBadge variant="archetype" :archetype="agent.primaryModule" size="sm">{{ shortArch(agent.primaryModule) }}</HexBadge>
                <HexBadge variant="archetype" :archetype="agent.secondaryModule" size="sm">{{ shortArch(agent.secondaryModule) }}</HexBadge>
                <HexBadge variant="archetype" :archetype="agent.tertiaryModule" size="sm">{{ shortArch(agent.tertiaryModule) }}</HexBadge>
              </div>
              <div v-else class="header-arch-empty">{{ t.club.lblNoModules || 'No modules set' }}</div>
              <div class="header-stats">
                <span class="s-win">W:{{ agent.wins }}</span>
                <span class="s-lose">L:{{ agent.losses }}</span>
                <span class="s-draw">D:{{ agent.draws }}</span>
                <span class="s-wr">({{ winRate }}%)</span>
              </div>
            </div>
            <div class="header-elo" :class="eloClass">{{ agent.elo }}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tab-bar">
          <button v-for="tab in tabs" :key="tab" :class="['tab-btn', { active: activeTab === tab }]" @click="activeTab = tab">
            {{ t.club[`lbl${tab.charAt(0).toUpperCase() + tab.slice(1)}`] || tab }}
          </button>
        </div>

        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-content hex-fade-in">
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-val" :class="eloClass">{{ agent.elo }}</div><div class="stat-label">ELO</div></div>
            <div class="stat-card"><div class="stat-val">{{ agent.totalFights }}</div><div class="stat-label">{{ t.clan.lblTotalFights || 'Fights' }}</div></div>
            <div class="stat-card"><div class="stat-val">{{ winRate }}%</div><div class="stat-label">{{ t.club.lblWinRate || 'Win Rate' }}</div></div>
          </div>

          <div class="section">
            <div class="section-label">{{ t.club.lblStatus || 'STATUS' }}</div>
            <div class="status-row">
              <span>Mode: <strong>{{ agent.tactics?.fightMode || 'pve_training' }}</strong></span>
              <span>Auto: <strong :style="{ color: agent.autoFight ? 'var(--hex-victory)' : 'var(--hex-text-muted)' }">{{ agent.autoFight ? 'ON' : 'OFF' }}</strong></span>
            </div>
            <div class="status-row">
              <span>Status: <strong>{{ agent.status }}</strong></span>
            </div>
          </div>

          <div v-if="deck.length" class="section">
            <div class="section-label-row">
              <span class="section-label">{{ t.club.lblDeck || 'DECK' }} ({{ deck.length }})</span>
              <button class="link-btn" @click="showDeckEdit = true">{{ t.club.lblEdit || 'Edit' }}</button>
            </div>
            <div class="deck-badges">
              <HexBadge v-for="m in deck" :key="m" variant="branch" :branch="moveBranch(m)">{{ m }} Lv{{ moveLevel(m) }}</HexBadge>
            </div>
          </div>

          <div class="section">
            <div class="section-label">XP</div>
            <div class="xp-row"><span class="xp-label">Speed</span><HexProgress :value="prog.speedXp" :max="Math.max(prog.speedXp, 100)" variant="branch" branch="speed" size="sm" :show-value="true" /></div>
            <div class="xp-row"><span class="xp-label">Power</span><HexProgress :value="prog.powerXp" :max="Math.max(prog.powerXp, 100)" variant="branch" branch="power" size="sm" :show-value="true" /></div>
            <div class="xp-row"><span class="xp-label">Technique</span><HexProgress :value="prog.techniqueXp" :max="Math.max(prog.techniqueXp, 100)" variant="branch" branch="technique" size="sm" :show-value="true" /></div>
          </div>

          <HexButton variant="primary" block :loading="trainLoading" :disabled="agent.status !== 'idle'" @click="onTrain">
            {{ t.club.lblTrainNow || 'Train Now' }}
          </HexButton>
          <div v-if="trainResult" class="train-result" :class="trainResult.fight.result">
            {{ trainResult.fight.result.toUpperCase() }} &mdash; {{ trainResult.fight.rounds }} rounds, +{{ trainResult.fight.xpEarned }} XP
          </div>
        </div>

        <!-- Moves Tab -->
        <div v-if="activeTab === 'moves'" class="tab-content hex-fade-in">
          <div class="branch-tabs">
            <button v-for="b in branchIds" :key="b" :class="['branch-btn', { active: activeBranch === b }]" @click="activeBranch = b">{{ b }}</button>
          </div>
          <div v-if="availableMovesLoading" class="loader-wrap"><v-progress-circular size="24" indeterminate /></div>
          <div v-else class="moves-list">
            <div v-for="moveId in branchMoves" :key="moveId" class="move-card" :class="{ 'move-card--locked': !moveAvail(moveId) }">
              <template v-if="moveAvail(moveId)">
                <div class="move-top">
                  <span class="move-name">{{ moveId }}</span>
                  <span class="move-lvl">Lv {{ moveAvail(moveId).agentCurrentLevel }} / {{ moveAvail(moveId).maxLevel }}</span>
                </div>
                <HexProgress :value="moveAvail(moveId).agentCurrentLevel" :max="moveAvail(moveId).maxLevel" variant="generic" size="sm" />
                <div class="move-action">
                  <template v-if="moveAvail(moveId).agentCurrentLevel >= moveAvail(moveId).maxLevel">
                    <span class="move-max">MAX</span>
                  </template>
                  <template v-else-if="moveAvail(moveId).canUpgrade">
                    <HexButton variant="primary" size="sm" @click="onLearnMove(moveId, moveAvail(moveId).agentCurrentLevel + 1)">
                      {{ moveAvail(moveId).agentCurrentLevel === 0 ? (t.club.lblLearn || 'Learn') : (t.club.lblUpgrade || 'Upgrade') }}
                      {{ moveAvail(moveId).xpCost ? `— ${moveAvail(moveId).xpCost} XP` : '— Free' }}
                    </HexButton>
                  </template>
                </div>
              </template>
              <template v-else>
                <div class="move-top"><span class="move-name move-name--locked">{{ moveId }}</span></div>
                <div class="move-locked-text">{{ t.club.lblResearchFirst || 'Player must research first' }}</div>
              </template>
            </div>
          </div>
        </div>

        <!-- Tactics Tab -->
        <div v-if="activeTab === 'tactics'" class="tab-content hex-fade-in">
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblFightMode || 'Fight Mode' }}</div>
            <div class="tactic-btns">
              <button v-for="m in ['pve_training','ranked','free_arena']" :key="m" :class="['t-btn', { active: tacticsForm.fightMode === m }]" @click="tacticsForm.fightMode = m">{{ m.replace('_', ' ') }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblAggression || 'Aggression' }}</div>
            <div class="tactic-btns">
              <button v-for="v in ['cautious','balanced','aggressive']" :key="v" :class="['t-btn', { active: tacticsForm.aggression === v }]" @click="tacticsForm.aggression = v">{{ v }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblDicePolicy || 'Dice Policy' }}</div>
            <div class="tactic-btns">
              <button v-for="v in ['always','smart','never']" :key="v" :class="['t-btn', { active: tacticsForm.dicePolicy === v }]" @click="tacticsForm.dicePolicy = v">{{ v }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblCoachPref || 'Coach' }}</div>
            <div class="tactic-btns">
              <button v-for="v in ['attack','defense','position','auto']" :key="v" :class="['t-btn', { active: tacticsForm.coachPreference === v }]" @click="tacticsForm.coachPreference = v">{{ v }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblEmergency || 'Emergency' }}</div>
            <div class="tactic-btns">
              <button v-for="v in [30, 20, 0]" :key="v" :class="['t-btn', { active: tacticsForm.emergencyThreshold === v }]" @click="tacticsForm.emergencyThreshold = v">{{ v === 0 ? 'Off' : v + '% HP' }}</button>
            </div>
          </div>
          <div class="tactic-group">
            <div class="tactic-label">{{ t.club.lblRestPeriod || 'Rest Period' }}</div>
            <div class="tactic-btns">
              <button v-for="v in [600000, 1800000, 3600000]" :key="v" :class="['t-btn', { active: tacticsForm.restPeriod === v }]" @click="tacticsForm.restPeriod = v">{{ v === 600000 ? '10m' : v === 1800000 ? '30m' : '1h' }}</button>
            </div>
          </div>
          <HexButton variant="primary" block :loading="savingTactics" @click="onSaveTactics" style="margin-top:16px">
            {{ t.club.lblSaveTactics || 'Save Tactics' }}
          </HexButton>
        </div>

        <!-- Fights Tab -->
        <div v-if="activeTab === 'fights'" class="tab-content hex-fade-in">
          <div class="fight-filter">
            <button v-for="m in [null,'pve_training','ranked','free_arena']" :key="String(m)" :class="['filter-btn', { active: fightFilter === m }]" @click="onFightFilter(m)">
              {{ m ? m.replace('_', ' ') : 'All' }}
            </button>
          </div>
          <div v-if="fightHistoryLoading && !fightHistory.length" class="loader-wrap"><v-progress-circular size="24" indeterminate /></div>
          <div v-else>
            <div v-for="fight in fightHistory" :key="fight.id" :class="['fight-card', `fight-card--${fight.result}`]">
              <div class="fight-top">
                <span class="fight-result">{{ fight.result.toUpperCase() }}</span>
                <span class="fight-time">{{ relativeTime(fight.createdAt) }}</span>
              </div>
              <div class="fight-details">
                <span>vs {{ fight.opponentName || 'Bot' }}</span>
                <span>{{ fight.rounds }} rounds</span>
                <span>HP: {{ fight.playerHpLeft }}/100</span>
              </div>
              <div class="fight-meta">
                <span class="fight-xp">+{{ fight.xpEarned }} XP</span>
                <span v-if="fight.eloChange" class="fight-elo" :class="fight.eloChange > 0 ? 'elo-up' : 'elo-down'">ELO {{ fight.eloChange > 0 ? '+' : '' }}{{ fight.eloChange }}</span>
              </div>
            </div>
            <HexButton v-if="fightHistory.length < fightHistoryTotal" variant="ghost" block @click="loadMoreFights" :loading="fightHistoryLoading" style="margin-top:12px">
              {{ t.clan.lblLoadMore || 'Load More' }}
            </HexButton>
            <div v-if="!fightHistory.length && !fightHistoryLoading" class="empty-text">No fights yet</div>
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
import { branches } from '@/data/branches.js';
import HexButton from '@/components/ui/HexButton.vue';
import HexBadge from '@/components/ui/HexBadge.vue';
import HexProgress from '@/components/ui/HexProgress.vue';
import SkinPicker from '@/components/club/SkinPicker.vue';
import ArchetypeSelector from '@/components/club/ArchetypeSelector.vue';

const route = useRoute();
const router = useRouter();
const agentId = route.params.agentId;

const loading = computed(() => store.state.agent.currentAgentLoading);
const agent = computed(() => store.state.agent.currentAgent);
const prog = computed(() => agent.value?.progression || { speedXp: 0, powerXp: 0, techniqueXp: 0, moves: [], deck: [] });
const deck = computed(() => Array.isArray(prog.value.deck) ? prog.value.deck : []);
const trainLoading = computed(() => store.state.agent.trainLoading);
const trainResult = computed(() => store.state.agent.trainResult);
const availableMovesLoading = computed(() => store.state.agent.availableMovesLoading);
const fightHistory = computed(() => store.state.agent.fightHistory);
const fightHistoryTotal = computed(() => store.state.agent.fightHistoryTotal);
const fightHistoryLoading = computed(() => store.state.agent.fightHistoryLoading);

const activeTab = ref('overview');
const tabs = ['overview', 'moves', 'tactics', 'fights'];
const activeBranch = ref('speed');
const branchIds = ['speed', 'power', 'technique'];
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

const eloClass = computed(() => {
  if (!agent.value) return '';
  if (agent.value.elo < 900) return 'elo-low';
  if (agent.value.elo > 1100) return 'elo-high';
  return 'elo-mid';
});

const shortArch = (n) => n ? n.slice(0, 3).toUpperCase() : '';

// Moves
const branchMoves = computed(() => branches[activeBranch.value]?.moves || []);
const availableMoves = computed(() => store.state.agent.availableMoves);
const moveAvailMap = computed(() => {
  const map = {};
  for (const m of availableMoves.value) map[m.moveId] = m;
  return map;
});
const moveAvail = (id) => moveAvailMap.value[id] || null;
const moveBranch = (id) => {
  const m = availableMoves.value.find(x => x.moveId === id);
  return m?.branch || null;
};
const moveLevel = (id) => {
  const m = availableMoves.value.find(x => x.moveId === id);
  return m?.agentCurrentLevel || 0;
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
const onTrain = async () => {
  try {
    await store.dispatch('agent/trainAgent', agentId);
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Training failed' });
  }
};

const onLearnMove = async (moveId, targetLevel) => {
  try {
    await store.dispatch('agent/learnMove', { agentId, moveId, targetLevel });
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Failed to learn move' });
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

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

// Tab watchers — load data on tab switch
watch(activeTab, (tab) => {
  if (tab === 'moves') store.dispatch('agent/fetchAvailableMoves', agentId);
  if (tab === 'fights') store.dispatch('agent/fetchFightHistory', { agentId, mode: fightFilter.value, offset: 0 });
});

onMounted(() => {
  store.dispatch('agent/fetchAgent', agentId);
});
</script>

<style scoped>
.agent-detail { max-width: 480px; margin: 0 auto; padding: 80px 16px 24px; }
.loader-wrap { display: flex; justify-content: center; padding: 48px 0; }

/* Header */
.agent-header { padding: 12px 0; }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.back-link { font-size: 18px; color: var(--hex-primary); background: none; border: none; cursor: pointer; }
.header-actions { display: flex; gap: 8px; }
.icon-btn { font-size: 16px; color: var(--hex-text-muted); background: none; border: none; cursor: pointer; }
.icon-btn--danger { color: var(--hex-defeat); }

.header-info { display: flex; gap: 12px; align-items: flex-start; }
.header-skin { width: 72px; height: 72px; border-radius: 10px; object-fit: cover; border: 1.5px solid var(--hex-border-active); flex-shrink: 0; }
.header-text { flex: 1; min-width: 0; }
.header-name { font-family: 'Anonymous', monospace; font-size: 16px; color: var(--hex-text-primary); }
.header-arch { display: flex; gap: 3px; margin-top: 4px; }
.header-arch-empty { font-size: 11px; color: var(--hex-text-muted); margin-top: 4px; font-style: italic; }
.header-stats { display: flex; gap: 8px; margin-top: 4px; font-family: 'AnonymousBalance', monospace; font-size: 11px; }
.s-win { color: var(--hex-victory); } .s-lose { color: var(--hex-defeat); } .s-draw { color: var(--hex-draw); }
.s-wr { color: var(--hex-text-muted); }
.header-elo { font-family: 'AnonymousBalance', monospace; font-size: 20px; font-weight: bold; margin-left: auto; flex-shrink: 0; }
.elo-low { color: var(--hex-defeat); } .elo-mid { color: var(--hex-text-secondary); } .elo-high { color: var(--hex-victory); }

/* Tabs */
.tab-bar { display: flex; border-bottom: 1px solid var(--hex-border-default); margin-bottom: 16px; }
.tab-btn { flex: 1; padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--hex-text-muted); background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
.tab-btn.active { color: var(--hex-primary); border-bottom-color: var(--hex-primary); }

/* Sections */
.section { margin-bottom: 16px; }
.section-label { font-family: 'Anonymous', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--hex-text-muted); margin-bottom: 8px; }
.section-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.link-btn { font-size: 11px; color: var(--hex-primary); background: none; border: none; cursor: pointer; }

/* Stats grid */
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
.stat-card { background: var(--hex-bg-medium); border: 1px solid var(--hex-border-default); border-radius: 8px; padding: 10px; text-align: center; }
.stat-val { font-family: 'AnonymousBalance', monospace; font-size: 18px; color: var(--hex-text-primary); }
.stat-label { font-size: 9px; text-transform: uppercase; color: var(--hex-text-muted); margin-top: 2px; }

/* Status */
.status-row { display: flex; gap: 16px; font-size: 12px; color: var(--hex-text-secondary); margin-bottom: 4px; }

/* Deck */
.deck-badges { display: flex; flex-wrap: wrap; gap: 4px; }

/* XP */
.xp-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.xp-label { font-family: 'Anonymous', monospace; font-size: 10px; text-transform: uppercase; color: var(--hex-text-muted); width: 70px; flex-shrink: 0; }

/* Train */
.train-result { margin-top: 10px; text-align: center; font-family: 'Anonymous', monospace; font-size: 13px; padding: 8px; border-radius: 6px; }
.train-result.victory { color: var(--hex-victory); background: var(--hex-victory-bg); }
.train-result.defeat { color: var(--hex-defeat); background: var(--hex-defeat-bg); }
.train-result.draw { color: var(--hex-draw); background: var(--hex-draw-bg); }

/* Moves */
.branch-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.branch-btn { flex: 1; padding: 6px; font-size: 11px; text-transform: uppercase; border: 1px solid var(--hex-border-default); border-radius: 6px; background: var(--hex-bg-dark); color: var(--hex-text-muted); cursor: pointer; }
.branch-btn.active { border-color: var(--hex-primary); color: var(--hex-primary); }
.moves-list { display: flex; flex-direction: column; gap: 8px; }
.move-card { background: var(--hex-bg-medium); border: 1px solid var(--hex-border-default); border-radius: 8px; padding: 10px; }
.move-card--locked { opacity: 0.4; }
.move-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
.move-name { font-family: 'Anonymous', monospace; font-size: 12px; color: var(--hex-text-primary); }
.move-name--locked { color: var(--hex-text-muted); }
.move-lvl { font-family: 'AnonymousBalance', monospace; font-size: 11px; color: var(--hex-text-muted); }
.move-action { margin-top: 6px; }
.move-max { font-size: 11px; color: var(--hex-victory); font-family: 'Anonymous', monospace; }
.move-locked-text { font-size: 11px; color: var(--hex-text-muted); margin-top: 4px; }

/* Tactics */
.tactic-group { margin-bottom: 14px; }
.tactic-label { font-family: 'Anonymous', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--hex-text-muted); margin-bottom: 6px; }
.tactic-btns { display: flex; gap: 4px; }
.t-btn { flex: 1; padding: 7px 4px; font-size: 10px; text-transform: capitalize; border: 1px solid var(--hex-border-default); border-radius: 6px; background: var(--hex-bg-dark); color: var(--hex-text-muted); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.t-btn.active { border-color: var(--hex-primary); color: var(--hex-primary); background: rgba(255, 6, 111, 0.08); }

/* Fights */
.fight-filter { display: flex; gap: 4px; margin-bottom: 12px; }
.filter-btn { flex: 1; padding: 6px 2px; font-size: 10px; text-transform: capitalize; border: 1px solid var(--hex-border-default); border-radius: 6px; background: var(--hex-bg-dark); color: var(--hex-text-muted); cursor: pointer; white-space: nowrap; }
.filter-btn.active { border-color: var(--hex-primary); color: var(--hex-primary); }
.fight-card { background: var(--hex-bg-medium); border-radius: 8px; padding: 10px; margin-bottom: 8px; border-left: 3px solid var(--hex-border-default); }
.fight-card--victory { border-left-color: var(--hex-victory); }
.fight-card--defeat { border-left-color: var(--hex-defeat); }
.fight-card--draw { border-left-color: var(--hex-draw); }
.fight-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
.fight-result { font-family: 'Anonymous', monospace; font-size: 12px; font-weight: bold; }
.fight-card--victory .fight-result { color: var(--hex-victory); }
.fight-card--defeat .fight-result { color: var(--hex-defeat); }
.fight-card--draw .fight-result { color: var(--hex-draw); }
.fight-time { font-size: 10px; color: var(--hex-text-muted); }
.fight-details { font-size: 11px; color: var(--hex-text-secondary); display: flex; gap: 10px; }
.fight-meta { display: flex; gap: 10px; margin-top: 4px; font-family: 'AnonymousBalance', monospace; font-size: 11px; }
.fight-xp { color: var(--hex-primary); }
.elo-up { color: var(--hex-victory); } .elo-down { color: var(--hex-defeat); }
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
</style>
