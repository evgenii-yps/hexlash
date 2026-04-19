<template>
  <div class="hud detail-hud">
    <button class="back-btn" @click="onBack">← Back</button>
    <div class="fd-stub">
      <div class="fd-stub-kicker">Fighter Detail · Stub</div>
      <div class="fd-stub-name">{{ keyProp }}</div>
      <div class="fd-stub-hint">Step 1 placeholder. HUD fills in Step 8.</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

defineProps({
  keyProp: { type: String, default: 'warden' },
});

const router = useRouter();

function onBack() {
  router.push('/v2');
}
</script>

<style scoped>
.detail-hud {
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

.fd-stub {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  color: var(--text-mid);
  font-family: var(--font-body);
}

.fd-stub-kicker {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.fd-stub-name {
  font-family: var(--font-display);
  font-size: 32px;
  letter-spacing: 0.08em;
  color: var(--hex-primary);
  text-transform: uppercase;
}

.fd-stub-hint {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-dim);
}
</style>
