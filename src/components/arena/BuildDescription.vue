<template>
  <div v-if="visible" class="build-description">
    <div class="build-description-label">FIGHT STYLE</div>
    <div v-if="loading" class="build-description-shimmer">
      <div class="shimmer-line"></div>
      <div class="shimmer-line short"></div>
    </div>
    <div v-else class="build-description-text">{{ description }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import store from '@/core/state/store.js';
import apiClient from '@/core/api/apiClient.js';

const modules = computed(() => store.getters['fight/getPlayerModules']);
const isBuildValid = computed(() => store.getters['fight/isBuildValid']);
const language = computed(() => store.getters['master/getLanguage'] || 'en');

const description = ref('');
const loading = ref(false);
const visible = computed(() => isBuildValid.value && (loading.value || description.value));

let debounceTimer = null;
let lastKey = '';

watch([modules, language], () => {
  if (!isBuildValid.value) {
    description.value = '';
    return;
  }

  const sorted = [...modules.value].sort();
  const key = `${sorted.join('_')}_${language.value}`;
  if (key === lastKey) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchDescription(sorted, key), 500);
}, { deep: true });

async function fetchDescription(sorted, key) {
  loading.value = true;
  try {
    const res = await apiClient.post('/ai/build-description', {
      modules: sorted,
      locale: language.value
    }, { authRequired: true });

    if (res.description) {
      description.value = res.description;
      lastKey = key;
    } else {
      description.value = '';
    }
  } catch {
    description.value = '';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.build-description {
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid var(--gray1);
  border-radius: 10px;
  text-align: center;
}

.build-description-label {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--pink);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.build-description-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--gray3);
}

/* Shimmer loading */
.build-description-shimmer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.shimmer-line {
  height: 12px;
  width: 90%;
  border-radius: 4px;
  background: linear-gradient(90deg, transparent 0%, rgba(160, 160, 160, 0.15) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.shimmer-line.short {
  width: 60%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
