<template>
  <div class="hud fight-hud">
    <button class="back-btn" @click="onBack">← Back</button>
    <div class="fight-stub">
      <div class="fight-stub-kicker">Fight · Stub</div>
      <div class="fight-stub-name">FIGHT</div>
      <div class="fight-stub-hint">Step 1 placeholder. HUD fills in Steps 14-17.</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function onBack() {
  router.push('/v2/fd/warden');
}
</script>

<style scoped>
.fight-hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}

.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 60;
  padding: 8px 16px;
  font-family: var(--font-body);
  background: var(--bg-panel);
  color: var(--text-mid);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  pointer-events: auto;
  letter-spacing: 0.05em;
}

.fight-stub {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  color: var(--text-mid);
  font-family: var(--font-body);
}

.fight-stub-kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.fight-stub-name {
  font-family: var(--font-display);
  font-size: 32px;
  letter-spacing: 0.08em;
  color: var(--hex-primary);
  text-transform: uppercase;
}

.fight-stub-hint {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-dim);
}
</style>
