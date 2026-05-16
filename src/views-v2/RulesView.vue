<script setup>
import { computed } from 'vue';
import { t } from '@/locales/index.js';
import { useRouter } from 'vue-router';

const router = useRouter();

const rulesContent = computed(() => t.value.pages?.rules || '');

function goBack() {
  router.back();
}
</script>

<template>
  <div class="rules-view">
    <div class="rules-header">
      <button class="rules-back-btn" @click="goBack" type="button">
        ← {{ t.common?.back || 'Back' }}
      </button>
      <h1 class="rules-title">{{ t.nav?.rules || 'Rules' }}</h1>
    </div>
    <div class="rules-scroll">
      <div class="rules-content" v-html="rulesContent"></div>
    </div>
  </div>
</template>

<style scoped>
.rules-view {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.rules-header {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--bg-panel, rgba(0, 0, 0, 0.7));
  border-bottom: 1px solid var(--hex-primary, rgba(255, 255, 255, 0.15));
}

.rules-back-btn {
  background: transparent;
  border: 1px solid var(--text-mid, rgba(255, 255, 255, 0.3));
  color: var(--text-mid, #ccc);
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: border-color 0.2s, color 0.2s;
}

.rules-back-btn:hover {
  border-color: var(--hex-primary, #fff);
  color: var(--hex-primary, #fff);
}

.rules-title {
  font-family: var(--font-display, sans-serif);
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-mid, #ddd);
  margin: 0;
}

.rules-scroll {
  pointer-events: auto;
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px 48px;
  background: var(--bg-deep, rgba(0, 0, 0, 0.85));
}

.rules-content {
  max-width: 720px;
  margin: 0 auto;
  font-family: var(--font-body, sans-serif);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-mid, #ddd);
}

.rules-content :deep(h2) {
  font-family: var(--font-display, sans-serif);
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--hex-primary, #fff);
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--text-mid, rgba(255, 255, 255, 0.15));
}

.rules-content :deep(h2:first-child) {
  margin-top: 0;
}

.rules-content :deep(h3),
.rules-content :deep(h4) {
  font-family: var(--font-display, sans-serif);
  font-size: 14px;
  text-transform: uppercase;
  color: var(--text-mid, #ddd);
  margin: 24px 0 12px;
}

.rules-content :deep(p) {
  margin: 0 0 14px;
}

.rules-content :deep(ul) {
  margin: 0 0 14px;
  padding-left: 20px;
}

.rules-content :deep(li) {
  margin-bottom: 6px;
}

.rules-content :deep(a) {
  color: var(--hex-primary, #fff);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.rules-content :deep(a:hover) {
  text-decoration-thickness: 2px;
}

.rules-content :deep(strong) {
  color: var(--hex-primary, #fff);
}
</style>
