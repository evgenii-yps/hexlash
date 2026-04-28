<!-- Epic 3Ba Step 6 — Training HUD.
     1-to-1 port of prototype HTML 4719-4764. Reactive bindings against
     trState; styles in src/styles/v24/training.css (shared, no scoped CSS).
     Combo + tap-pop + hit particles arrive in Step 7b.

     NOTE: hint text drops «TAP» (prototype has «CLICK or TAP») — touch
     support deferred to Epic 5. -->
<template>
  <div class="training-hud">
    <button class="training-back" @click="onBack">&larr; Back</button>

    <div class="training-counter">
      <div class="tc-kicker">Taps Earned</div>
      <div class="tc-value">{{ trState.tapsEarned.toLocaleString() }}</div>
      <div class="tc-meta">Session &middot; {{ trState.elapsedStr }}</div>
    </div>

    <div class="training-energy">
      <div class="te-row">
        <span class="te-label">Energy</span>
        <span class="te-value">
          {{ Math.floor(trState.energy) }} / {{ trState.energyMax }}
        </span>
      </div>
      <div class="te-bar">
        <div
          class="te-fill"
          :class="{ empty: trState.energy < 10 }"
          :style="{ width: (100 * trState.energy / trState.energyMax) + '%' }"
        ></div>
      </div>
    </div>

    <div class="training-tasks">
      <div class="tt-title">Daily Tasks</div>

      <div
        v-for="task in displayedTasks"
        :key="task.id"
        class="task"
        :class="{ done: task.isCompleted }"
      >
        <div class="task-head">
          <span class="task-name">{{ task.title }}</span>
          <span class="task-progress-text">
            {{ Math.min(task.progress || 0, taskGoal(task)) }}
            / {{ taskGoal(task) }}
          </span>
        </div>
        <div class="task-bar">
          <div
            class="task-bar-fill"
            :style="{ width: taskProgressWidth(task) + '%' }"
          ></div>
        </div>
        <div v-if="task.tokens" class="task-reward">Reward: {{ task.tokens.toLocaleString() }} Taps</div>
      </div>
    </div>

    <div
      class="training-combo"
      :class="{
        show: trState.comboVisible,
        x3:   trState.multiplier >= 3 && trState.multiplier < 5,
        x5:   trState.multiplier >= 5,
      }"
    >
      <div class="tc-combo-mult">&times;{{ trState.multiplier }}</div>
      <div class="tc-combo-label">Combo</div>
    </div>

    <div class="training-hint">
      <span class="key">CLICK</span> the bag &middot; keep rhythm for combo
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { trState, startSessionTimer, stopSessionTimer } from '@/scene/interaction/useTrainingState.js';
import store from '@/core/state/store.js';

const emit = defineEmits(['back']);
function onBack() { emit('back'); }

// 5K — Vuex bindings (mirror HudSocialTasks 5I pattern: direct store import)
const dailyTasks = computed(() => store.getters['task/getAllDailyTasks'] || []);
const dailyTrainingTasks = computed(() =>
  dailyTasks.value.filter((t) => t.scope === 'training')
);

// Q6 fallback — show legacy session-tracked trState когда backend tasks not loaded (down/mock/initial)
const fallbackTasks = computed(() => [
  {
    id: 'fb_hit_bag',
    title: 'Hit the bag',
    progress: trState.taskHits,
    goal: trState.taskHitsGoal,
    isCompleted: trState.taskHitsDone,
  },
  {
    id: 'fb_combos',
    title: 'Land 5 combos (×3+)',
    progress: trState.taskCombos,
    goal: trState.taskCombosGoal,
    isCompleted: trState.taskCombosDone,
  },
]);

const displayedTasks = computed(() =>
  dailyTrainingTasks.value.length > 0 ? dailyTrainingTasks.value : fallbackTasks.value
);

// Backend task uses goal field; fallback task also exposes goal. Backward compat: value field.
function taskGoal(task) {
  return task.goal || task.value || 1;
}

function taskProgressWidth(task) {
  const goal = taskGoal(task);
  const progress = task.progress || 0;
  return Math.min(100, (100 * progress) / goal);
}

onMounted(() => {
  // Defensive fetch — TrainingView.vue already dispatches на mount but HudTraining
  // can be mounted independently; loading guard в taskState prevents double-fetch.
  if (!store.state.task.isLoadingDailyTasks && dailyTasks.value.length === 0) {
    store.dispatch('task/fetchAllDailyTasks');
  }
  startSessionTimer();
});

onUnmounted(() => {
  stopSessionTimer();
});
</script>
