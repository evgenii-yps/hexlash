<template>
  <div class="research-tree">
    <!-- Header: agent card + resources -->
    <div class="rt-header">
      <div class="rt-header-left">
        <img :src="`/images/skins/${agentSkin}`" class="rt-skin" />
        <div class="rt-identity">
          <div v-if="agent?.isCaptain" class="rt-captain-label">{{ t.club?.lblCaptain || 'CAPTAIN' }}</div>
          <div class="rt-name">{{ agent?.name || '' }}</div>
        </div>
      </div>
      <div class="rt-resources">
        <div class="rt-resource">
          <span class="rt-resource-val">{{ totalTaps }}</span>
          <span class="rt-resource-label">{{ t.research?.lblTaps || 'TAPS' }}</span>
        </div>
        <div class="rt-resource">
          <span class="rt-resource-val">{{ freeXP }}</span>
          <span class="rt-resource-label">{{ t.research?.lblFreeXp || 'FREE XP' }}</span>
        </div>
      </div>
    </div>

    <!-- Body: sidebar + moves -->
    <div class="rt-body">
      <!-- Branch sidebar -->
      <div class="rt-sidebar">
        <button
          v-for="b in branchIds"
          :key="b"
          :class="['rt-branch-card', { 'rt-branch-card--active': activeBranch === b }]"
          @click="activeBranch = b"
        >
          <div class="rt-branch-name">{{ branchName(b) }}</div>
          <div class="rt-branch-level" :style="activeBranch === b ? { color: `var(--hex-branch-${b})` } : {}">
            {{ interpolate(t.research?.lblBranchLevel || 'Lv {n}', { n: branchXp(b) }) }}
          </div>
          <div class="rt-branch-divider"></div>
          <button
            class="rt-allocate-btn"
            :disabled="freeXP < 10 || allocating"
            @click.stop="onAllocateXp(b)"
          >
            {{ interpolate(t.research?.lblAllocateXp || '+ {amount} XP', { amount: 10 }) }}
          </button>
        </button>
      </div>

      <!-- Moves list -->
      <div class="rt-moves">
        <div
          v-for="move in currentBranchMoves"
          :key="move.moveId"
          :class="['rt-move', {
            'rt-move--locked': move.locked && !move.unlockable,
            'rt-move--unlockable': move.locked && move.unlockable,
            'rt-move--max': !move.locked && move.researchLevel >= 5,
          }]"
        >
          <!-- Unlocked move -->
          <template v-if="!move.locked">
            <div class="rt-move-top">
              <span class="rt-move-name">{{ moveName(move.moveId) }}</span>
              <span v-if="move.researchLevel >= 5" class="rt-move-max">{{ t.research?.lblMax || 'MAX' }}</span>
              <span v-else class="rt-move-lvl">Lv {{ move.researchLevel }} / 5</span>
            </div>
            <template v-if="move.researchLevel < 5">
              <div class="rt-progress-bar">
                <div
                  class="rt-progress-fill"
                  :style="{
                    width: (move.researchLevel / 5 * 100) + '%',
                    background: `var(--hex-branch-${activeBranch})`,
                  }"
                ></div>
              </div>
              <div class="rt-move-bottom">
                <span class="rt-move-cost">
                  {{ formatCost(move.researchCost) }}
                </span>
                <button
                  class="rt-action-btn"
                  :disabled="!canAffordResearch(move.researchCost) || researching"
                  @click="onResearch('upgrade', move.moveId)"
                >
                  {{ t.research?.lblUpgrade || 'Upgrade' }}
                </button>
              </div>
            </template>
          </template>

          <!-- Locked but unlockable -->
          <template v-else-if="move.unlockable">
            <div class="rt-move-top">
              <span class="rt-move-name">{{ moveName(move.moveId) }}</span>
              <span class="rt-move-locked-tag">{{ t.research?.lblLocked || 'Locked' }}</span>
            </div>
            <div class="rt-move-bottom">
              <span class="rt-move-cost">
                {{ formatCost(move.researchCost) }}
              </span>
              <button
                class="rt-action-btn"
                :disabled="!canAffordResearch(move.researchCost) || researching"
                @click="onResearch('unlock', move.moveId)"
              >
                {{ t.research?.lblUnlock || 'Unlock' }}
              </button>
            </div>
          </template>

          <!-- Locked, not unlockable -->
          <template v-else>
            <div class="rt-move-top">
              <span class="rt-move-name">{{ moveName(move.moveId) }}</span>
              <span class="rt-move-locked-tag">{{ t.research?.lblLocked || 'Locked' }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import store from '@/core/state/store.js';
import { t, interpolate } from '@/locales/index.js';
import { branches } from '@/data/branches.js';

const props = defineProps({
  agentId: { type: String, required: true },
});

const activeBranch = ref('speed');
const branchIds = ['speed', 'power', 'technique'];
const researching = ref(false);
const allocating = ref(false);

// Data sources
const agent = computed(() => store.state.agent.currentAgent);
const agentSkin = computed(() => agent.value?.skin || 'skin_m_1.png');
const prog = computed(() => agent.value?.progression || { speedXp: 0, powerXp: 0, techniqueXp: 0, research: {} });
const research = computed(() => prog.value.research || {});

const userData = computed(() => store.state.master?.master?.userData);
const totalTaps = computed(() => userData.value?.totalTaps || 0);
const freeXP = computed(() => userData.value?.progression?.freeXP || 0);

// Branch helpers
const branchName = (b) => t.value.gameData?.branches?.[b]?.name || b;
const branchXp = (b) => {
  const fields = { speed: 'speedXp', power: 'powerXp', technique: 'techniqueXp' };
  return prog.value[fields[b]] || 0;
};

const moveName = (id) => t.value.gameData?.moves?.[id]?.name || id;

// Build move list from agent.progression.research + branch ordering
const currentBranchMoves = computed(() => {
  const branchMoveIds = branches[activeBranch.value]?.moves || [];
  const res = research.value;

  return branchMoveIds.map((moveId, i) => {
    const entry = res[moveId];
    const isUnlocked = !!entry?.unlocked;
    const researchLevel = isUnlocked ? entry.level : 0;

    let locked = !isUnlocked;
    let unlockable = false;
    let researchCost = null;

    if (!isUnlocked) {
      if (i === 0) {
        // First move in branch: free unlock
        unlockable = true;
        researchCost = { taps: 0, exp: 0 };
      } else {
        // Check prerequisite: previous move at Lv3+
        const prevMoveId = branchMoveIds[i - 1];
        const prevEntry = res[prevMoveId];
        if (prevEntry?.unlocked && prevEntry.level >= 3) {
          unlockable = true;
          const UNLOCK_REQS = { 3: { taps: 300, exp: 150 }, 4: { taps: 250, exp: 120 }, 5: { taps: 200, exp: 100 } };
          researchCost = UNLOCK_REQS[prevEntry.level] || UNLOCK_REQS[5];
        }
      }
    } else if (researchLevel < 5) {
      // Upgrade cost
      const LEVEL_UP_REQS = { 2: { taps: 100, exp: 50 }, 3: { taps: 200, exp: 100 }, 4: { taps: 350, exp: 200 }, 5: { taps: 500, exp: 350 } };
      researchCost = LEVEL_UP_REQS[researchLevel + 1] || null;
    }

    return { moveId, position: i, researchLevel, locked, unlockable, researchCost };
  });
});

// Cost formatting
const formatCost = (cost) => {
  if (!cost) return '';
  if (cost.taps === 0 && cost.exp === 0) return t.value.club?.lblFree || 'Free';
  const parts = [];
  if (cost.taps > 0) parts.push(`${cost.taps} TAPS`);
  if (cost.exp > 0) parts.push(`${cost.exp} XP`);
  return parts.join(' \u00b7 ');
};

const canAffordResearch = (cost) => {
  if (!cost) return false;
  if (cost.taps > totalTaps.value) return false;
  if (cost.exp > branchXp(activeBranch.value)) return false;
  return true;
};

// Actions
const onResearch = async (action, moveId) => {
  researching.value = true;
  try {
    const res = await store.dispatch('agent/researchAction', { agentId: props.agentId, action, moveId });
    // Update user totalTaps locally
    if (res.tapsSpent && userData.value) {
      store.commit('master/updateMaster', { totalTaps: userData.value.totalTaps - res.tapsSpent });
    }
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Research failed' });
  } finally {
    researching.value = false;
  }
};

const onAllocateXp = async (branch) => {
  allocating.value = true;
  try {
    const res = await store.dispatch('agent/allocateXp', { agentId: props.agentId, branch, amount: 10 });
    // Update user freeXP locally
    if (userData.value?.progression) {
      const updated = { ...userData.value.progression, freeXP: res.freeXP };
      store.commit('master/updateMaster', { progression: updated });
    }
  } catch (err) {
    store.commit('master/setError', { text: err?.response?.data?.error || 'Allocation failed' });
  } finally {
    allocating.value = false;
  }
};
</script>

<style scoped>
.research-tree {
  width: 100%;
}

/* Header */
.rt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  margin-bottom: 16px;
}
.rt-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.rt-skin {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  object-position: top;
  border: 1px solid var(--hex-border-default);
  flex-shrink: 0;
}
.rt-identity {
  min-width: 0;
}
.rt-captain-label {
  font-size: 9px;
  color: var(--hex-primary);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 2px;
}
.rt-name {
  font-size: 16px;
  color: var(--hex-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rt-resources {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}
.rt-resource {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.rt-resource-val {
  font-size: 16px;
  color: var(--hex-text-primary);
  font-family: 'AnonymousBalance', monospace;
}
.rt-resource-label {
  font-size: 9px;
  color: var(--hex-text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

/* Body layout */
.rt-body {
  display: flex;
  gap: 12px;
}

/* Branch sidebar */
.rt-sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  width: 90px;
}
.rt-branch-card {
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s;
}
.rt-branch-card--active {
  border-color: var(--hex-text-primary);
}
.rt-branch-name {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--hex-text-secondary);
}
.rt-branch-level {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--hex-text-muted);
  margin-top: 4px;
}
.rt-branch-divider {
  border-top: 1px solid var(--hex-border-default);
  margin: 10px 0;
}
.rt-allocate-btn {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--hex-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 100%;
  text-align: center;
  transition: color 0.15s;
}
.rt-allocate-btn:hover:not(:disabled) {
  color: var(--hex-text-primary);
}
.rt-allocate-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Moves list */
.rt-moves {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.rt-move {
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  padding: 12px 14px;
}
.rt-move--locked {
  opacity: 0.4;
}
.rt-move--unlockable {
  opacity: 0.7;
}
.rt-move--max {
  opacity: 1;
}
.rt-move-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.rt-move-name {
  font-size: 13px;
  color: var(--hex-text-primary);
}
.rt-move--locked .rt-move-name,
.rt-move--unlockable .rt-move-name {
  color: var(--hex-text-muted);
}
.rt-move-lvl {
  font-size: 10px;
  color: var(--hex-text-muted);
}
.rt-move-max {
  font-size: 10px;
  color: var(--hex-victory);
  text-transform: uppercase;
  letter-spacing: 2px;
}
.rt-move-locked-tag {
  font-size: 9px;
  color: var(--hex-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Progress bar */
.rt-progress-bar {
  height: 3px;
  background: var(--hex-bg-medium);
  border-radius: 2px;
  margin: 8px 0;
  overflow: hidden;
}
.rt-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

/* Bottom row: cost + action */
.rt-move-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}
.rt-move-cost {
  font-size: 10px;
  color: var(--hex-text-muted);
}
.rt-action-btn {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-primary);
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.rt-action-btn:hover:not(:disabled) {
  border-color: var(--hex-text-primary);
}
.rt-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Desktop */
@media (min-width: 1024px) {
  .rt-header { padding: 16px 18px; }
  .rt-skin { width: 56px; height: 56px; }
  .rt-name { font-size: 18px; }
  .rt-resource-val { font-size: 18px; }
  .rt-resource-label { font-size: 10px; }
  .rt-sidebar { width: 110px; }
  .rt-branch-name { font-size: 12px; }
  .rt-branch-level { font-size: 10px; }
  .rt-allocate-btn { font-size: 11px; }
  .rt-move { padding: 14px 16px; }
  .rt-move-name { font-size: 15px; }
  .rt-move-cost { font-size: 11px; }
  .rt-action-btn { font-size: 11px; padding: 5px 12px; }
}
</style>
