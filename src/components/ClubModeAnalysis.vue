<template>
  <!-- Idle — not yet requested -->
  <div v-if="!loading && !analysis && !error" class="ai-analysis ai-analysis--idle">
    <div class="ai-analysis-header">{{ t.clubMode.lblAiAnalysis }}</div>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="ai-analysis">
    <div class="ai-analysis-header">{{ t.clubMode.lblAiAnalysis }}</div>
    <div class="ai-analysis-loading">{{ t.clubMode.lblAnalyzing }}</div>
  </div>

  <!-- Success -->
  <div v-else-if="analysis" class="ai-analysis">
    <div class="ai-analysis-header">{{ t.clubMode.lblAiAnalysis }}</div>
    <div class="ai-analysis-divider"></div>
    <div v-for="(section, idx) in sections" :key="idx" class="ai-analysis-section">
      <div v-if="section.label" class="ai-analysis-section-label">{{ section.label }}</div>
      <div class="ai-analysis-section-text">{{ section.content }}</div>
    </div>
    <div class="ai-analysis-badge">{{ t.clubMode.lblPoweredBy }}</div>
  </div>

  <!-- Error -->
  <div v-else-if="error" class="ai-analysis ai-analysis--error">
    <div class="ai-analysis-header">{{ t.clubMode.lblAiAnalysis }}</div>
    <div class="ai-analysis-error-text">
      {{ t.clubMode.lblAnalysisError }}
      <button class="ai-analysis-retry" @click="$emit('retry')">{{ t.clubMode.lblRetry }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { t } from '@/locales/index.js';

const props = defineProps({
  loading: { type: Boolean, default: false },
  analysis: { type: String, default: null },
  error: { type: Boolean, default: false },
});

defineEmits(['retry']);

const sections = computed(() => {
  if (!props.analysis) return [];

  const labels = [t.value.clubMode.aiLabels.overview, t.value.clubMode.aiLabels.strengths, t.value.clubMode.aiLabels.weaknesses, t.value.clubMode.aiLabels.recommendation];
  const result = [];
  const text = props.analysis;

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
    result.push({ label: '', content: props.analysis });
  }

  return result;
});
</script>

<style scoped>
.ai-analysis {
  background: var(--hex-bg-card);
  border-left: 3px solid var(--hex-primary);
  border-radius: 8px;
  padding: 16px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
  animation: fadeInUp 0.3s ease-out;
}

.ai-analysis--idle {
  opacity: 0.5;
}

.ai-analysis--error {
  border-left-color: var(--hex-border-active);
}

.ai-analysis-header {
  font-family: 'Anonymous', monospace;
  color: var(--hex-primary);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.ai-analysis-divider {
  height: 1px;
  background: var(--hex-border-default);
  margin-top: 12px;
  margin-bottom: 12px;
}

.ai-analysis-section {
  margin-bottom: 12px;
}

.ai-analysis-section:last-child {
  margin-bottom: 0;
}

.ai-analysis-section-label {
  font-family: 'Anonymous', monospace;
  color: var(--hex-primary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.ai-analysis-section-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--hex-text-primary);
  font-size: 13px;
  line-height: 1.5;
}

.ai-analysis-badge {
  font-size: 10px;
  color: var(--hex-text-secondary);
  text-align: right;
  margin-top: 8px;
}

.ai-analysis-loading {
  color: var(--hex-text-secondary);
  font-size: 13px;
  margin-top: 8px;
  animation: pulse 1.5s infinite;
}

.ai-analysis-error-text {
  color: var(--hex-text-secondary);
  font-size: 12px;
  margin-top: 8px;
}

.ai-analysis-retry {
  background: none;
  border: 1px solid var(--hex-border-active);
  color: var(--hex-text-secondary);
  font-size: 10px;
  padding: 2px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;
  transition: color 0.2s, border-color 0.2s;
}

.ai-analysis-retry:hover {
  color: var(--hex-primary);
  border-color: var(--hex-primary);
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
