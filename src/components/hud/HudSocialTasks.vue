<!-- Sub-Epic 5I Phase 2 — HudSocialTasks v2-native panel.
     v2 design language: mirrors .training-tasks Daily Tasks panel
     positioning + Choose Archetype card structure (HudCreate.vue
     precedent).

     SubscribeModal reused via 1-line defineExpose augmentation (Option B
     Q1 β). Lazy import + markRaw + nextTick × 2 + ref method trigger
     pattern (5B ConnectWallet precedent). Legacy SocialTasks.vue retired
     in legacy-cleanup Phase 6 along with DailyTasks + TaskModal; only the
     nested SubscribeModal.vue augmentation (2 lines: openModal function
     + defineExpose) remains in use.

     Vuex bindings mirror TrainingView reactive computeds. Idempotency
     guard prevents duplicate fetch on re-mount. -->
<template>
  <div class="training-social-panel">
    <div class="tsp-header">
      <span class="tsp-title">Checklist</span>
      <span class="tsp-count">{{ incompleteCount }}</span>
    </div>

    <div v-if="loadingSocialTasks && !socialTasks?.length" class="tsp-loading">
      <div class="tsp-spinner" aria-label="Loading"></div>
    </div>

    <div v-else-if="!socialTasks?.length" class="tsp-empty">
      No tasks available
    </div>

    <div v-else-if="!hasIncompleteSocialTasks" class="tsp-empty">
      All tasks complete
    </div>

    <div v-else class="tsp-list">
      <button
        v-for="task in incompleteTasks"
        :key="task.id"
        class="tsp-card"
        @click="onTaskClick(task)"
      >
        <img
          v-if="task.getIcon"
          :src="task.getIcon()"
          loading="lazy"
          class="tsp-icon"
          alt=""
        />
        <span class="tsp-name">{{ task.title }}</span>
        <span v-if="task.reward" class="tsp-reward">{{ task.reward }}</span>
      </button>
    </div>

    <!-- Lazy SubscribeModal host (5B ConnectWallet precedent). Hidden source
         layout; Vuetify VModal teleports to body when openModal() fires. -->
    <component
      v-if="modalMounted && SubscribeModalComp"
      :is="SubscribeModalComp"
      ref="subscribeModalRef"
      :task="selectedTask"
      style="display: none;"
      @close="onModalClose"
      @complete="onTaskComplete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, markRaw, nextTick } from 'vue';
import store from '@/core/state/store.js';

// --- Vuex reactive bindings (mirror TrainingView pattern) ---
const socialTasks = computed(() => store.getters['task/getAllSocialTasks']);
const loadingSocialTasks = computed(() => store.state.task.isLoadingSocialTasks);
const hasIncompleteSocialTasks = computed(() => store.getters['task/hasIncompleteSocialTasks']);

const incompleteTasks = computed(() =>
  (socialTasks.value || []).filter((task) => !task.isCompleted),
);
const incompleteCount = computed(() => incompleteTasks.value.length);

// --- Initial fetch with idempotency guard (Q3) ---
onMounted(() => {
  if (!loadingSocialTasks.value && !socialTasks.value?.length) {
    store.dispatch('task/fetchAllSocialTasks');
  }
});

// --- SubscribeModal lazy mount (5B ConnectWallet pattern) ---
const SubscribeModalComp = shallowRef(null);
const modalMounted = ref(false);
const subscribeModalRef = ref(null);
const selectedTask = ref(null);

async function loadSubscribeModal() {
  if (SubscribeModalComp.value) return;
  const mod = await import('@/components/fragments/training/SubscribeModal.vue');
  SubscribeModalComp.value = markRaw(mod.default);
}

async function onTaskClick(task) {
  if (task.isCompleted) return;
  selectedTask.value = task;
  await loadSubscribeModal();
  modalMounted.value = true;
  // Two ticks cover: (1) v-if mount of <component :is>, (2) child setup
  // completion in SubscribeModal. defineExpose is populated by end of setup.
  await nextTick();
  await nextTick();
  subscribeModalRef.value?.openModal?.();
}

function onModalClose() {
  modalMounted.value = false;
  selectedTask.value = null;
}

function onTaskComplete(taskId) {
  // SubscribeModal emits 'complete' with task.id (per legacy contract).
  // task/updateSocialTask action expects full task object — find from store.
  const task = (socialTasks.value || []).find((t) => t.id === taskId);
  if (task) {
    const updated = { ...task, isCompleted: true };
    store.dispatch('task/updateSocialTask', updated);
  }
  modalMounted.value = false;
  selectedTask.value = null;
}
</script>

<style scoped>
/* ===== Panel — 5J Path D invert default: natural card shape =====
   Default: pure layout container. Container styles (bg/border/padding/etc) come
   from parent (.profile-card in Profile context). The .is-overlay modifier
   below restores the original fixed-position HUD overlay shape — currently
   unused (HudTraining mount removed in 5J Step 4) but preserved future-proof. */
.training-social-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Optional overlay modifier for fixed-position HUD contexts (defensive future-proof). */
.training-social-panel.is-overlay {
  position: fixed;
  top: 200px;
  right: 14px;
  width: 280px;
  background: var(--bg-panel);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 12px 14px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 55;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  pointer-events: auto;
}

/* Header */
.tsp-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}
.tsp-title {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text-dim);
  text-transform: uppercase;
}
.tsp-count {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--hex-primary);
  letter-spacing: 1px;
}

/* Loading + empty states */
.tsp-loading,
.tsp-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--text-dim);
  text-transform: uppercase;
}

.tsp-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--hex-primary);
  border-radius: 50%;
  animation: tsp-spin 0.8s linear infinite;
}
@keyframes tsp-spin {
  to { transform: rotate(360deg); }
}

/* Task list */
.tsp-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tsp-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  font-family: var(--font-mono);
  text-align: left;
  width: 100%;
  color: inherit;
}
.tsp-card:hover {
  border-color: rgba(255, 6, 111, 0.4);
  background: rgba(255, 6, 111, 0.05);
}
.tsp-card:active {
  transform: scale(0.98);
}

.tsp-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  flex-shrink: 0;
  object-fit: cover;
}

.tsp-name {
  flex: 1;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--text-mid);
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tsp-reward {
  font-size: 9px;
  color: #FFD262;
  letter-spacing: 1px;
  flex-shrink: 0;
}

/* Mobile — bottom-anchored compact for overlay context only (5J scope: was global). */
@media (max-width: 820px) {
  .training-social-panel.is-overlay {
    top: auto;
    bottom: 80px;
    right: 14px;
    left: 14px;
    width: auto;
    max-height: 35vh;
  }
}
</style>
