<template>
  <div class="morning-report">
    <div class="report-header">
      <span class="report-title">{{ t.club.lblMorningReport || 'Morning Report' }}</span>
    </div>

    <div class="period-select">
      <button v-for="p in periods" :key="p.id" :class="['period-btn', { active: period === p.id }]" @click="period = p.id">{{ p.label }}</button>
    </div>

    <!-- Stats bar (always shown if available) -->
    <div v-if="report?.stats?.totalFights > 0" class="report-stats">
      <div class="rstat"><span class="rstat-val">{{ report.stats.totalFights }}</span><span class="rstat-label">Fights</span></div>
      <div class="rstat"><span class="rstat-val rstat-win">{{ report.stats.wins }}</span><span class="rstat-label">Wins</span></div>
      <div class="rstat"><span class="rstat-val">{{ report.stats.winRate }}%</span><span class="rstat-label">Win Rate</span></div>
    </div>

    <!-- AI Analysis -->
    <template v-if="report?.analysis">
      <div class="analysis-section" v-if="report.analysis.summary">
        <div class="analysis-label">{{ t.club.lblSummary || 'Summary' }}</div>
        <div class="analysis-text">{{ report.analysis.summary }}</div>
      </div>
      <div class="analysis-section" v-if="report.analysis.highlights">
        <div class="analysis-label analysis-label--good">{{ t.club.lblHighlights || 'Highlights' }}</div>
        <div class="analysis-text">{{ report.analysis.highlights }}</div>
      </div>
      <div class="analysis-section" v-if="report.analysis.concerns && report.analysis.concerns !== 'None'">
        <div class="analysis-label analysis-label--warn">{{ t.club.lblConcerns || 'Concerns' }}</div>
        <div class="analysis-text">{{ report.analysis.concerns }}</div>
      </div>
      <div class="analysis-section" v-if="report.analysis.recommendation">
        <div class="analysis-label analysis-label--tip">{{ t.club.lblRecommendation || 'Recommendation' }}</div>
        <div class="analysis-text">{{ report.analysis.recommendation }}</div>
      </div>
    </template>

    <!-- No fights -->
    <div v-else-if="report && report.stats?.totalFights === 0" class="empty-text">
      {{ t.club.lblNoFights || 'No fights in this period' }}
    </div>

    <!-- Generate / loading -->
    <div class="report-action">
      <HexButton v-if="!report || period !== lastPeriod" variant="primary" size="sm" block :loading="loading" @click="generate">
        {{ loading ? (t.club.lblGenerating || 'Generating...') : (t.club.lblGenerateReport || 'Generate Report') }}
      </HexButton>
    </div>

    <div v-if="error" class="error-text">{{ error }}</div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { t } from '@/locales/index.js'
import store from '@/core/state/store.js'
import apiClient from '@/core/api/apiClient.js'
import HexButton from '@/components/ui/HexButton.vue'

export default {
  name: 'MorningReport',
  components: { HexButton },
  setup() {
    const period = ref('today');
    const lastPeriod = ref(null);
    const report = ref(null);
    const loading = ref(false);
    const error = ref(null);

    const periods = computed(() => [
      { id: 'today', label: t.value.club?.lblToday || 'Today' },
      { id: 'yesterday', label: t.value.club?.lblYesterday || 'Yesterday' },
      { id: 'last_7d', label: t.value.club?.lbl7Days || '7 Days' },
    ]);

    // Reset on period change
    watch(period, () => { report.value = null; error.value = null; });

    const generate = async () => {
      loading.value = true;
      error.value = null;
      try {
        const { data } = await apiClient.post('/ai/morning-report', { period: period.value }, { authRequired: true });
        report.value = data.report;
        lastPeriod.value = period.value;
      } catch (err) {
        error.value = err?.response?.data?.error || t.value.club?.lblAiUnavailable || 'AI analysis unavailable';
      } finally {
        loading.value = false;
      }
    };

    return { t, period, lastPeriod, periods, report, loading, error, generate };
  },
};
</script>

<style scoped>
.morning-report {
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}
.report-header { margin-bottom: 10px; }
.report-title {
  font-family: 'Anonymous', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-primary);
}

.period-select { display: flex; gap: 4px; margin-bottom: 12px; }
.period-btn {
  flex: 1;
  padding: 5px 0;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid var(--hex-border-default);
  border-radius: 6px;
  background: var(--hex-bg-dark);
  color: var(--hex-text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.period-btn.active {
  border-color: var(--hex-primary);
  color: var(--hex-primary);
  background: rgba(255, 6, 111, 0.08);
}

.report-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.rstat {
  flex: 1;
  text-align: center;
  padding: 6px;
  background: var(--hex-bg-dark);
  border-radius: 6px;
}
.rstat-val {
  display: block;
  font-family: 'AnonymousBalance', monospace;
  font-size: 16px;
  color: var(--hex-text-primary);
}
.rstat-win { color: var(--hex-victory); }
.rstat-label { font-size: 9px; text-transform: uppercase; color: var(--hex-text-muted); }

.analysis-section { margin-bottom: 10px; }
.analysis-label {
  font-family: 'Anonymous', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--hex-text-muted);
  margin-bottom: 3px;
}
.analysis-label--good { color: var(--hex-victory); }
.analysis-label--warn { color: var(--hex-draw); }
.analysis-label--tip { color: var(--hex-primary); }
.analysis-text { font-size: 12px; color: var(--hex-text-secondary); line-height: 1.5; }

.report-action { margin-top: 10px; }
.empty-text { text-align: center; font-size: 12px; color: var(--hex-text-muted); padding: 12px 0; }
.error-text { margin-top: 8px; font-size: 11px; color: var(--hex-defeat); text-align: center; }
</style>
