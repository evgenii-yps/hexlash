<!-- Epic 3A Step 8b — Branch panel (slides in from the right when a column
     is clicked). CSS 1-to-1 from prototype 679-802. Upgrade buttons are
     permanently disabled in Epic 3A — the real upgrade flow (taps/xp spend,
     rebuildColumnHeight, spawnShockwave) arrives in Epic 4. -->
<template>
  <div class="branch-panel" :class="[branchId, { open }]">
    <button class="bp-close" @click="$emit('close')">&times;</button>
    <div class="bp-kicker">{{ data?.kicker }}</div>
    <div class="bp-title">{{ data?.title }}</div>
    <div class="bp-level">Level {{ data?.level }}</div>
    <div class="bp-moves">
      <div
        v-for="(m, idx) in (data?.moves || [])"
        :key="idx"
        class="bp-move"
      >
        <span class="bp-move-name">{{ m.name }}</span>
        <span class="bp-move-controls">
          <span class="bp-move-lvl">Lv {{ m.lvl }}</span>
          <button
            class="bp-move-up"
            disabled
            title="Upgrade &mdash; Epic 4"
          >+</button>
        </span>
      </div>
    </div>
    <button
      class="bp-upgrade disabled"
      disabled
      title="Upgrade &mdash; Epic 4"
    >Level Up Branch</button>
    <div class="bp-cost">
      Cost: <strong>{{ cost?.taps }} Taps &middot; {{ cost?.xp }} XP</strong>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  data: { type: Object, default: null },
  cost: { type: Object, default: null },
});

defineEmits(['close']);

const open = ref(false);
const branchId = ref('');

defineExpose({
  open(id) {
    branchId.value = id;
    open.value = true;
  },
  close() {
    open.value = false;
  },
});
</script>

<style scoped>
.branch-panel {
  position: fixed;
  top: 80px;
  right: 14px;
  width: 320px;
  background: var(--bg-deep);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 18px 20px;
  transform: translateX(360px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 55;
  color: #fff;
}
.branch-panel.open {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}
.branch-panel.speed     { border-left: 3px solid #00E5FF; box-shadow: 0 0 40px rgba(0,229,255,0.12); }
.branch-panel.power     { border-left: 3px solid #FF066F; box-shadow: 0 0 40px rgba(255,6,111,0.12); }
.branch-panel.technique { border-left: 3px solid #A855F7; box-shadow: 0 0 40px rgba(168,85,247,0.12); }

.bp-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}
.bp-close:hover { color: #fff; }

.bp-kicker {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 3px;
  text-transform: uppercase;
}
.branch-panel.speed     .bp-kicker { color: #00E5FF; }
.branch-panel.power     .bp-kicker { color: #FF066F; }
.branch-panel.technique .bp-kicker { color: #A855F7; }

.bp-title {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 3px;
  margin-top: 6px;
}
.bp-level {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--text-mid);
  margin-top: 4px;
}

.bp-moves {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bp-move {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}
.bp-move-name {
  font-size: 12px;
  color: var(--text-mid);
  font-family: var(--font-mono);
  letter-spacing: 1px;
}
.bp-move-lvl {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #fff;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
}
.bp-move-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bp-move-up {
  width: 22px;
  height: 22px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  color: var(--text-mid);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: all 0.12s ease;
}
.bp-move-up:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bp-upgrade {
  margin-top: 16px;
  width: 100%;
  padding: 12px 0;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
}
.bp-upgrade.disabled,
.bp-upgrade:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.bp-upgrade.disabled:hover,
.bp-upgrade:disabled:hover {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
}

.bp-cost {
  margin-top: 8px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--text-dim);
}
.bp-cost strong { color: #FFD262; font-weight: normal; }
</style>
