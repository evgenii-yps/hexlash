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

      <div class="task" :class="{ done: trState.taskHitsDone }">
        <div class="task-head">
          <span class="task-name">Hit the bag</span>
          <span class="task-progress-text">
            {{ Math.min(trState.taskHits, trState.taskHitsGoal) }}
            / {{ trState.taskHitsGoal }}
          </span>
        </div>
        <div class="task-bar">
          <div
            class="task-bar-fill"
            :style="{ width: Math.min(100, 100 * trState.taskHits / trState.taskHitsGoal) + '%' }"
          ></div>
        </div>
        <div class="task-reward">Reward: 200 Taps + 50 XP</div>
      </div>

      <div class="task" :class="{ done: trState.taskCombosDone }">
        <div class="task-head">
          <span class="task-name">Land 5 combos (&times;3+)</span>
          <span class="task-progress-text">
            {{ Math.min(trState.taskCombos, trState.taskCombosGoal) }}
            / {{ trState.taskCombosGoal }}
          </span>
        </div>
        <div class="task-bar">
          <div
            class="task-bar-fill"
            :style="{ width: Math.min(100, 100 * trState.taskCombos / trState.taskCombosGoal) + '%' }"
          ></div>
        </div>
        <div class="task-reward">Reward: 100 XP</div>
      </div>
    </div>

    <!-- 5I — Social tasks (legacy SocialTasks.vue inline reuse, 0-line touch). -->
    <SocialTasks
      :socialTasks="socialTasks"
      :loadingSocialTasks="loadingSocialTasks"
      :hasIncompleteSocialTasks="hasIncompleteSocialTasks"
    />

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
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { trState } from '@/scene/interaction/useTrainingState.js';
import SocialTasks from '@/components/fragments/training/SocialTasks.vue';

const emit = defineEmits(['back']);
function onBack() { emit('back'); }

// 5I — Social tasks inline reuse (legacy SocialTasks.vue, 0-line touch).
// Mirror TrainingView reactive bindings exactly. Idempotency guard prevents
// duplicate fetch on re-mount (HudTraining can mount/unmount multiple times
// per session as user navigates /v2/training in/out).
const store = useStore();
const socialTasks = computed(() => store.getters['task/getAllSocialTasks']);
const loadingSocialTasks = computed(() => store.state.task.isLoadingSocialTasks);
const hasIncompleteSocialTasks = computed(() => store.getters['task/hasIncompleteSocialTasks']);

onMounted(() => {
  if (!loadingSocialTasks.value && !socialTasks.value?.length) {
    store.dispatch('task/fetchAllSocialTasks');
  }
});
</script>
