<!-- Epic 2 — pit-view hub. Step 17.
     Top bar: resource cards (Gold / Energy / ELO) on the left, centred pit
     title (HEXLASH kicker + "THE PIT" name + LVL/XP meta), avatar button on
     the right. Values are static placeholders — real data wiring is Epic 3.
     Source: prototype 4303-4344. All classes prefixed .v2- to avoid collision
     with legacy CSS.
     Sub-Epic 5B hot-fix 10.2: avatar initials bound to master.userData.login
     (was hardcoded 'YV' — Epic 2 era placeholder). -->
<template>
  <div class="v2-topbar">
    <div class="v2-topbar__left">
      <div class="v2-res">
        <div class="v2-res__label">Gold</div>
        <div class="v2-res__val">12,450</div>
      </div>
      <div class="v2-res">
        <div class="v2-res__label">Energy</div>
        <div class="v2-res__val">42 / 60</div>
      </div>
      <div class="v2-res">
        <div class="v2-res__label">ELO</div>
        <div class="v2-res__val">1,247</div>
      </div>
    </div>

    <div class="v2-pit-title">
      <div class="v2-pit-title__kicker">Hexlash</div>
      <div class="v2-pit-title__name">THE PIT</div>
      <div class="v2-pit-title__meta">LVL 1 · 250 / 1000 XP</div>
    </div>

    <button class="v2-avatar-btn" @click="$emit('avatar-click')">
      <span>{{ avatarInitials }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';

defineEmits(['avatar-click']);

const avatarInitials = computed(() => {
  const login = store.getters['master/getMaster']?.userData?.login || '';
  return login.slice(0, 2).toUpperCase() || '??';
});
</script>

<style scoped>
.v2-topbar {
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 50;
  pointer-events: none;
}

.v2-topbar__left {
  display: flex;
  gap: 8px;
  pointer-events: auto;
}

.v2-res {
  padding: 6px 12px;
  background: rgba(14, 16, 28, 0.72);
  border: 1px solid rgba(212, 168, 67, 0.35);
  font-family: var(--font-mono);
  min-width: 72px;
}

.v2-res__label {
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.v2-res__val {
  font-size: 14px;
  color: #fff;
  margin-top: 2px;
  letter-spacing: 0.5px;
}

.v2-pit-title {
  text-align: center;
  pointer-events: none;
}

.v2-pit-title__kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.v2-pit-title__name {
  font-family: var(--font-display);
  font-size: 28px;
  letter-spacing: 6px;
  color: #fff;
  margin-top: 2px;
}

.v2-pit-title__meta {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--text-mid);
  margin-top: 4px;
}

.v2-avatar-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(14, 16, 28, 0.72);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  pointer-events: auto;
}

.v2-avatar-btn:hover {
  border-color: var(--hex-primary);
  background: rgba(32, 24, 40, 0.85);
}

.v2-avatar-btn:active {
  transform: scale(0.97);
}
</style>
