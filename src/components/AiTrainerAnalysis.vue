<template>
  <!-- Loading -->
  <div v-if="loading" class="ai-trainer-analysis">
    <div class="ai-trainer-header">{{ t.fight.lblAiTrainer }}</div>
    <div class="ai-trainer-loading">{{ t.fight.lblAiLoading }}</div>
  </div>

  <!-- Success -->
  <div v-else-if="analysis" class="ai-trainer-analysis">
    <div class="ai-trainer-header">{{ t.fight.lblAiTrainer }}</div>
    <div class="ai-trainer-divider"></div>
    <div class="ai-trainer-text">{{ analysis }}</div>
    <div class="ai-trainer-badge">Powered by Claude</div>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="ai-trainer-error">
    {{ t.fight.lblAiError }}
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/core/api/apiClient.js';
import { t } from '@/locales/index.js';

const props = defineProps({
  fightData: { type: Object, required: true },
  locale: { type: String, default: 'en' },
});

const loading = ref(true);
const analysis = ref(null);
const error = ref(false);

onMounted(async () => {
  try {
    const response = await apiClient.post('/ai/analyze-fight', {
      fightLog: props.fightData,
      locale: props.locale,
    }, { authRequired: true });
    analysis.value = response.analysis;
  } catch (err) {
    console.warn('[AiTrainer] Analysis failed:', err.message);
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.ai-trainer-analysis {
  background: rgba(9, 9, 9, 0.8);
  border-left: 3px solid var(--pink);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  animation: fadeInUp 0.3s ease-out;
}

.ai-trainer-header {
  font-family: 'Anonymous', monospace;
  color: var(--pink);
  font-size: 14px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ai-trainer-divider {
  height: 1px;
  background: var(--gray1);
  margin-bottom: 12px;
}

.ai-trainer-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--white);
  font-size: 13px;
  line-height: 1.5;
}

.ai-trainer-badge {
  font-size: 10px;
  color: var(--gray2);
  text-align: right;
  margin-top: 8px;
}

.ai-trainer-loading {
  color: var(--gray2);
  font-size: 13px;
  animation: pulse 1.5s infinite;
}

.ai-trainer-error {
  color: var(--gray2);
  font-size: 11px;
  text-align: center;
  margin-top: 8px;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
