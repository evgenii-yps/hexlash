<template>
  <!-- Loading -->
  <div v-if="loading" class="ai-trainer-analysis">
    <div class="ai-trainer-header">{{ t.fight.lblAiTrainer }}</div>
    <div class="ai-trainer-loading">{{ t.fight.lblAiLoading }}</div>
  </div>

  <!-- Success -->
  <div v-else-if="analysis" class="ai-trainer-analysis">
    <div class="ai-trainer-header-row" @click="expanded = !expanded">
      <div class="ai-trainer-header">{{ t.fight.lblAiTrainer }}</div>
      <span class="ai-trainer-arrow" :class="{ 'ai-trainer-arrow--open': expanded }">▼</span>
    </div>
    <template v-if="expanded">
      <div class="ai-trainer-divider"></div>
      <div v-for="(section, idx) in sections" :key="idx" class="ai-trainer-section">
        <div v-if="section.label" class="ai-trainer-section-label">{{ section.label }}</div>
        <div class="ai-trainer-section-text">{{ section.content }}</div>
      </div>
      <div class="ai-trainer-badge">Powered by Claude</div>
    </template>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="ai-trainer-error">
    {{ t.fight.lblAiError }}
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import apiClient from '@/core/api/apiClient.js';
import { t } from '@/locales/index.js';

const props = defineProps({
  fightData: { type: Object, required: true },
  locale: { type: String, default: 'en' },
});

const loading = ref(true);
const analysis = ref(null);
const error = ref(false);
const expanded = ref(false);

const sections = computed(() => {
  if (!analysis.value) return [];

  const labels = ['Fight Summary', 'What You Did Well', 'What Went Wrong', 'Advice'];
  const result = [];
  let text = analysis.value;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const nextLabel = labels[i + 1];

    const startIdx = text.indexOf(label);
    if (startIdx === -1) continue;

    const contentStart = startIdx + label.length;
    const endIdx = nextLabel ? text.indexOf(nextLabel, contentStart) : text.length;

    const content = text.substring(contentStart, endIdx === -1 ? text.length : endIdx).trim();
    if (content) {
      result.push({ label, content });
    }
  }

  // Fallback: if parsing failed — return entire text as single section
  if (result.length === 0) {
    result.push({ label: '', content: analysis.value });
  }

  return result;
});

const abortController = new AbortController();

onMounted(async () => {
  try {
    const response = await apiClient.post('/ai/analyze-fight', {
      fightLog: props.fightData,
      locale: props.locale,
    }, { authRequired: true, signal: abortController.signal });
    analysis.value = response.analysis;
  } catch (err) {
    if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
    console.warn('[AiTrainer] Analysis failed:', err.message);
    error.value = true;
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  abortController.abort();
});
</script>

<style scoped>
.ai-trainer-analysis {
  background: rgba(9, 9, 9, 0.8);
  border-left: 3px solid var(--pink);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
  animation: fadeInUp 0.3s ease-out;
}

.ai-trainer-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.ai-trainer-header {
  font-family: 'Anonymous', monospace;
  color: var(--pink);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ai-trainer-arrow {
  color: var(--pink);
  font-size: 12px;
  transition: transform 0.2s ease;
}

.ai-trainer-arrow--open {
  transform: rotate(180deg);
}

.ai-trainer-divider {
  height: 1px;
  background: var(--gray1);
  margin-top: 12px;
  margin-bottom: 12px;
}

.ai-trainer-section {
  margin-bottom: 12px;
}

.ai-trainer-section:last-child {
  margin-bottom: 0;
}

.ai-trainer-section-label {
  font-family: 'Anonymous', monospace;
  color: var(--pink);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.ai-trainer-section-text {
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
