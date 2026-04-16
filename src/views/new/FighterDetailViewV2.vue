<template>
  <div class="fd-v2">
    <canvas ref="sceneCanvas" class="scene-canvas" id="sceneFD"></canvas>
    <div class="scanlines" aria-hidden="true"></div>

    <div class="hud detail-hud">
      <!-- Top bar -->
      <div class="fd-top-bar">
        <button class="fd-back" @click="$router.push('/arena/pit')">←</button>
        <div v-if="agent" class="fd-fighter-info">
          <span class="fd-fighter-name">{{ agent.name }}</span>
          <BeltBadge :grade="agent.belt || 0" :is-hexmaster="agent.isHexmaster || false" size="sm" />
          <span class="fd-record">{{ agent.wins || 0 }}W / {{ agent.losses || 0 }}L / {{ agent.draws || 0 }}D</span>
        </div>
      </div>

      <!-- Branch floating labels -->
      <div ref="labelSpeed" class="fd-branch-label" style="color: var(--hex-branch-speed)">SPEED</div>
      <div ref="labelPower" class="fd-branch-label" style="color: var(--hex-branch-power)">POWER</div>
      <div ref="labelTechnique" class="fd-branch-label" style="color: var(--hex-branch-technique)">TECHNIQUE</div>

      <!-- Branch panel (slide-in) -->
      <Transition name="slide-right">
        <div v-if="activeBranch" class="fd-branch-panel">
          <div class="fd-bp-header">
            <span class="fd-bp-title" :style="{ color: `var(--hex-branch-${activeBranch})` }">{{ activeBranch.toUpperCase() }}</span>
            <button class="fd-bp-close" @click="activeBranch = null">✕</button>
          </div>
          <div class="fd-bp-body">
            <div class="fd-bp-xp">XP: {{ branchXp }}</div>
            <div v-if="!branchMoves.length" class="fd-bp-empty">No moves unlocked</div>
            <div v-for="m in branchMoves" :key="m.moveId" class="fd-bp-move">
              <span class="fd-bp-move-name">{{ moveName(m.moveId) }}</span>
              <span class="fd-bp-move-lvl">Lv {{ m.level }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Tab bar (lower section) -->
      <div class="fd-tab-section">
        <div class="fd-tabs">
          <button v-for="tab in tabs" :key="tab" :class="['fd-tab', { active: activeTab === tab }]" @click="activeTab = tab">
            {{ fv2[`lbl${tab.charAt(0).toUpperCase() + tab.slice(1)}`] || tab }}
          </button>
        </div>

        <div class="fd-tab-content">
          <!-- Overview -->
          <div v-if="activeTab === 'overview'" class="fd-tc">
            <div class="fd-stats-grid">
              <div class="fd-stat"><span class="fd-stat-val">{{ agent?.totalFights || 0 }}</span><span class="fd-stat-lbl">Fights</span></div>
              <div class="fd-stat"><span class="fd-stat-val wins">{{ agent?.wins || 0 }}</span><span class="fd-stat-lbl">Wins</span></div>
              <div class="fd-stat"><span class="fd-stat-val">{{ winRate }}%</span><span class="fd-stat-lbl">WR</span></div>
              <div class="fd-stat"><span class="fd-stat-val">{{ agent?.elo || 1000 }}</span><span class="fd-stat-lbl">ELO</span></div>
            </div>
            <div class="fd-xp-bars">
              <div class="fd-xp-row"><span class="fd-xp-lbl" style="color:var(--hex-branch-speed)">SPD</span><HexProgress :value="prog.speedXp" :max="Math.max(prog.speedXp,100)" variant="branch" branch="speed" size="sm" /><span class="fd-xp-val">{{ prog.speedXp }}</span></div>
              <div class="fd-xp-row"><span class="fd-xp-lbl" style="color:var(--hex-branch-power)">PWR</span><HexProgress :value="prog.powerXp" :max="Math.max(prog.powerXp,100)" variant="branch" branch="power" size="sm" /><span class="fd-xp-val">{{ prog.powerXp }}</span></div>
              <div class="fd-xp-row"><span class="fd-xp-lbl" style="color:var(--hex-branch-technique)">TCH</span><HexProgress :value="prog.techniqueXp" :max="Math.max(prog.techniqueXp,100)" variant="branch" branch="technique" size="sm" /><span class="fd-xp-val">{{ prog.techniqueXp }}</span></div>
            </div>
            <HexButton variant="primary" size="sm" block :loading="trainLoading" :disabled="agent?.status !== 'idle'" @click="onTrain">
              {{ t.club?.lblTrainNow || 'Train Now' }}
            </HexButton>
            <div v-if="trainResult" class="fd-train-result" :class="trainResult.fight?.result">
              {{ trainResult.fight?.result?.toUpperCase() }} — {{ trainResult.fight?.rounds }} rounds
            </div>
          </div>

          <!-- Moves -->
          <div v-if="activeTab === 'moves'" class="fd-tc">
            <ResearchTree :agent-id="agentId" />
          </div>

          <!-- Tactics -->
          <div v-if="activeTab === 'tactics'" class="fd-tc">
            <div v-for="group in tacticsGroups" :key="group.key" class="fd-tactic-group">
              <div class="fd-tactic-label">{{ group.label }}</div>
              <div class="fd-pill-row">
                <button v-for="opt in group.options" :key="opt" :class="['fd-pill', { active: tacticsForm[group.key] === opt }]" @click="setTactic(group.key, opt)">
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>

          <!-- Fights -->
          <div v-if="activeTab === 'fights'" class="fd-tc">
            <div v-for="fight in fightHistory" :key="fight.id" class="fd-fight-card" :class="fight.result">
              <span class="fd-fight-result">{{ fight.result }}</span>
              <span class="fd-fight-opp">vs {{ fight.opponentName || 'Bot' }}</span>
              <span class="fd-fight-meta">{{ fight.rounds }}R · +{{ fight.xpEarned || 0 }}XP</span>
            </div>
            <HexButton v-if="fightHistory.length < fightHistoryTotal" variant="ghost" size="sm" block @click="loadMoreFights">Load More</HexButton>
            <div v-if="!fightHistory.length" class="fd-no-fights">No fights yet</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { initFighterDetailScene } from '@/three/scenes/fighterDetailScene.js';
import BeltBadge from '@/components/ui/BeltBadge.vue';
import HexButton from '@/components/ui/HexButton.vue';
import HexProgress from '@/components/ui/HexProgress.vue';
import ResearchTree from '@/components/club/ResearchTree.vue';

export default {
  name: 'FighterDetailViewV2',
  components: { BeltBadge, HexButton, HexProgress, ResearchTree },
  setup() {
    const route = useRoute();
    const agentId = route.params.agentId;
    const sceneCanvas = ref(null);
    const labelSpeed = ref(null);
    const labelPower = ref(null);
    const labelTechnique = ref(null);
    let sceneCleanup = null;

    const fv2 = computed(() => t.value.fighter?.v2 || {});
    const agent = computed(() => store.state.agent.currentAgent);
    const prog = computed(() => agent.value?.progression || { speedXp: 0, powerXp: 0, techniqueXp: 0, moves: [], deck: [] });
    const winRate = computed(() => { const a = agent.value; return a?.totalFights ? Math.round((a.wins / a.totalFights) * 100) : 0; });
    const trainLoading = computed(() => store.state.agent.trainLoading);
    const trainResult = computed(() => store.state.agent.trainResult);
    const fightHistory = computed(() => store.state.agent.fightHistory || []);
    const fightHistoryTotal = computed(() => store.state.agent.fightHistoryTotal || 0);

    const tabs = ['overview', 'moves', 'tactics', 'fights'];
    const activeTab = ref('overview');
    const activeBranch = ref(null);

    // Branch panel data
    const branchXp = computed(() => {
      const fields = { speed: 'speedXp', power: 'powerXp', technique: 'techniqueXp' };
      return prog.value[fields[activeBranch.value]] || 0;
    });
    const branchMoves = computed(() => {
      if (!activeBranch.value || !prog.value.moves) return [];
      const branches = { speed: ['jab','double_jab','rapid_fire','combo_strike','flurry','hurricane'], power: ['straight','hook','uppercut','haymaker','hammer_fist','knockout_blow'], technique: ['block_strike','counter_jab','feint_cross','parry_punish','slip_counter','precision_strike'] };
      const ids = branches[activeBranch.value] || [];
      return (Array.isArray(prog.value.moves) ? prog.value.moves : []).filter(m => ids.includes(m.moveId));
    });
    const moveName = (id) => t.value.gameData?.moves?.[id]?.name || id;

    // Tactics
    const tacticsForm = ref({});
    const tacticsGroups = [
      { key: 'fightMode', label: 'Fight Mode', options: ['pve_training', 'ranked', 'free_arena'] },
      { key: 'aggression', label: 'Aggression', options: ['cautious', 'balanced', 'aggressive'] },
      { key: 'dicePolicy', label: 'Dice', options: ['always', 'smart', 'never'] },
      { key: 'coachPreference', label: 'Coach', options: ['attack', 'defense', 'position', 'auto'] },
    ];

    function setTactic(key, val) {
      tacticsForm.value[key] = val;
      store.dispatch('agent/updateTactics', { id: agentId, [key]: val }).catch(() => {});
    }

    function onTrain() { store.dispatch('agent/trainAgent', agentId).catch(() => {}); }

    let fightOffset = 0;
    function loadMoreFights() {
      fightOffset += 20;
      store.dispatch('agent/fetchFightHistory', { agentId, offset: fightOffset, append: true });
    }

    function onBranchClick(branchId) { activeBranch.value = branchId; }

    onMounted(() => {
      store.dispatch('agent/fetchAgent', agentId);
      store.dispatch('agent/fetchFightHistory', { agentId, offset: 0 });

      if (sceneCanvas.value) {
        const result = initFighterDetailScene(sceneCanvas.value, {
          agent: agent.value,
          onBranchClick,
          branchLabels: { speed: labelSpeed.value, power: labelPower.value, technique: labelTechnique.value },
        });
        sceneCleanup = result.cleanup;
      }
    });

    watch(agent, (a) => {
      if (a?.tactics) {
        tacticsForm.value = { fightMode: a.tactics.fightMode, aggression: a.tactics.aggression, dicePolicy: a.tactics.dicePolicy, coachPreference: a.tactics.coachPreference };
      }
    }, { immediate: true });

    onBeforeUnmount(() => { if (sceneCleanup) sceneCleanup(); });

    return {
      t, fv2, sceneCanvas, labelSpeed, labelPower, labelTechnique,
      agentId, agent, prog, winRate, trainLoading, trainResult,
      fightHistory, fightHistoryTotal, tabs, activeTab, activeBranch,
      branchXp, branchMoves, moveName, tacticsForm, tacticsGroups,
      setTactic, onTrain, loadMoreFights,
    };
  },
};
</script>

<style scoped>
.fd-v2 { position: relative; width: 100%; height: 100vh; overflow: hidden; background: var(--hex-bg-deep); }
@supports (height: 100dvh) { .fd-v2 { height: 100dvh; } }

/* Top bar */
.fd-top-bar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; gap: 12px; padding: 16px;
}
.fd-back { background: none; border: none; color: var(--hex-text-secondary); font-size: 20px; cursor: pointer; min-height: 44px; min-width: 44px; }
.fd-fighter-info { display: flex; align-items: center; gap: 8px; flex: 1; }
.fd-fighter-name { font-family: var(--hex-font-display); font-size: 18px; color: var(--hex-text-primary); letter-spacing: 1px; }
.fd-record { font-family: var(--hex-font-mono); font-size: 11px; color: var(--hex-text-muted); margin-left: auto; }

/* Branch floating labels */
.fd-branch-label {
  position: fixed; transform: translate(-50%, -100%); pointer-events: none; z-index: 10;
  font-family: var(--hex-font-display); font-size: 12px; letter-spacing: 2px;
  opacity: 0; transition: opacity 0.3s;
}

/* Branch panel */
.fd-branch-panel {
  position: fixed; top: 0; right: 0; bottom: 0; width: 300px; max-width: 85vw;
  background: var(--hex-bg-card); border-left: 1px solid var(--hex-border-default);
  backdrop-filter: blur(12px); z-index: 50; padding: 20px; overflow-y: auto;
}
.fd-bp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.fd-bp-title { font-family: var(--hex-font-display); font-size: 18px; letter-spacing: 2px; }
.fd-bp-close { background: none; border: none; color: var(--hex-text-muted); font-size: 18px; cursor: pointer; }
.fd-bp-xp { font-family: var(--hex-font-mono); font-size: 13px; color: var(--hex-text-secondary); margin-bottom: 12px; }
.fd-bp-empty { font-size: 13px; color: var(--hex-text-muted); }
.fd-bp-move { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--hex-border-default); }
.fd-bp-move-name { font-size: 13px; color: var(--hex-text-primary); }
.fd-bp-move-lvl { font-family: var(--hex-font-mono); font-size: 12px; color: var(--hex-text-muted); }

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s ease; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }

/* Tab section */
.fd-tab-section {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
  background: var(--hex-bg-card); border-top: 1px solid var(--hex-border-default);
  max-height: 45vh; display: flex; flex-direction: column;
}
.fd-tabs { display: flex; border-bottom: 1px solid var(--hex-border-default); flex-shrink: 0; }
.fd-tab {
  flex: 1; padding: 10px 4px; text-align: center;
  font-family: var(--hex-font-display); font-size: 10px; letter-spacing: 1.5px;
  color: var(--hex-text-muted); background: none; border: none;
  border-bottom: 2px solid transparent; cursor: pointer;
}
.fd-tab.active { color: var(--hex-primary); border-bottom-color: var(--hex-primary); }
.fd-tab-content { flex: 1; overflow-y: auto; padding: 12px 16px; }

.fd-tc { min-height: 120px; }

/* Stats grid */
.fd-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
.fd-stat { text-align: center; padding: 6px; background: var(--hex-bg-medium); border-radius: var(--hex-radius-sm); }
.fd-stat-val { display: block; font-family: var(--hex-font-mono); font-size: 16px; color: var(--hex-text-primary); }
.fd-stat-val.wins { color: var(--hex-victory); }
.fd-stat-lbl { font-size: 9px; color: var(--hex-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

/* XP bars */
.fd-xp-bars { margin-bottom: 12px; }
.fd-xp-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.fd-xp-lbl { font-family: var(--hex-font-mono); font-size: 10px; width: 28px; flex-shrink: 0; }
.fd-xp-val { font-family: var(--hex-font-mono); font-size: 10px; color: var(--hex-text-muted); width: 40px; text-align: right; }

.fd-train-result { font-size: 12px; margin-top: 6px; text-align: center; }
.fd-train-result.victory { color: var(--hex-victory); }
.fd-train-result.defeat { color: var(--hex-defeat); }

/* Tactics */
.fd-tactic-group { margin-bottom: 12px; }
.fd-tactic-label { font-size: 10px; color: var(--hex-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.fd-pill-row { display: flex; gap: 4px; flex-wrap: wrap; }
.fd-pill {
  padding: 5px 10px; font-size: 11px; font-family: var(--hex-font-mono);
  background: var(--hex-bg-medium); border: 1px solid var(--hex-border-default);
  color: var(--hex-text-muted); border-radius: var(--hex-radius-sm); cursor: pointer;
}
.fd-pill.active { background: var(--hex-primary); color: #fff; border-color: var(--hex-primary); }

/* Fights */
.fd-fight-card {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border-bottom: 1px solid var(--hex-border-default); font-size: 12px;
}
.fd-fight-result { font-family: var(--hex-font-mono); font-weight: 600; width: 50px; text-transform: uppercase; }
.fd-fight-card.victory .fd-fight-result { color: var(--hex-victory); }
.fd-fight-card.defeat .fd-fight-result { color: var(--hex-defeat); }
.fd-fight-card.draw .fd-fight-result { color: var(--hex-draw); }
.fd-fight-opp { flex: 1; color: var(--hex-text-primary); }
.fd-fight-meta { color: var(--hex-text-muted); font-family: var(--hex-font-mono); }
.fd-no-fights { text-align: center; padding: 20px; color: var(--hex-text-muted); font-size: 13px; }
</style>
