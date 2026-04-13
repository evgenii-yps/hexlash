<template>
  <div class="morning-report">
    <div class="report-header">
      <span class="report-title">{{ t.club.lblReport || 'Report' }}</span>
      <span class="report-limit">{{ t.club.lblReportLimit || '3 / hr' }}</span>
    </div>

    <div class="period-select">
      <button v-for="p in periods" :key="p.id" :class="['period-btn', { active: period === p.id }]" @click="period = p.id">{{ p.label }}</button>
    </div>

    <!-- Stats bar -->
    <div v-if="report?.stats?.totalFights > 0" class="report-stats">
      <div class="stat-col"><div class="stat-num">{{ report.stats.totalFights }}</div><div class="stat-label">{{ t.club.lblFights || 'Fights' }}</div></div>
      <div class="stat-col"><div class="stat-num stat-num--win">{{ report.stats.wins }}</div><div class="stat-label">{{ t.club.lblWins || 'Wins' }}</div></div>
      <div class="stat-col"><div class="stat-num">{{ report.stats.winRate }}%</div><div class="stat-label">{{ t.club.lblWinRate || 'Win Rate' }}</div></div>
    </div>

    <!-- AI Analysis (club-level) -->
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

      <!-- Agent Details Accordion -->
      <div v-if="sortedAgentStats.length > 0" class="agent-details-section">
        <div class="agent-details-title">{{ t.club.lblAgentDetails || 'AGENT DETAILS' }}</div>

        <div v-for="agent in sortedAgentStats" :key="agent.agentId" class="agent-accordion">
          <div class="agent-accordion-header" @click="toggleAgent(agent.agentId)">
            <span class="accordion-arrow">{{ expandedAgents[agent.agentId] ? '▾' : '▸' }}</span>
            <img class="accordion-skin" :src="`/images/skins/${agent.skin}`" :alt="agent.name" />
            <div class="accordion-info">
              <span class="accordion-name">{{ agent.name }}</span>
              <BeltBadge :grade="agent.belt || 0" :is-hexmaster="agent.isHexmaster || false" size="sm" class="accordion-belt" />
            </div>
            <div class="accordion-record">
              <span class="rec-win">{{ agent.wins }}W</span>/<span class="rec-lose">{{ agent.losses }}L</span>
            </div>
          </div>

          <div v-if="expandedAgents[agent.agentId]" class="agent-accordion-body hex-fade-in">
            <!-- Recent results -->
            <div v-if="agent.recentResults?.length" class="recent-row">
              <span class="recent-label">{{ t.club.lblRecentResults || 'Recent' }}:</span>
              <span v-for="(r, i) in agent.recentResults" :key="i" :class="['result-dot', r === 'W' ? 'result-dot--win' : r === 'L' ? 'result-dot--loss' : 'result-dot--draw']"></span>
            </div>

            <!-- AI per-agent analysis -->
            <template v-if="getAgentAnalysis(agent.name)">
              <div class="agent-ai-section" v-if="getAgentAnalysis(agent.name).assessment">
                <div class="agent-ai-label">{{ t.club.lblAssessment || 'Assessment' }}</div>
                <div class="agent-ai-text">{{ getAgentAnalysis(agent.name).assessment }}</div>
              </div>
              <div class="agent-ai-section" v-if="getAgentAnalysis(agent.name).tacticsAdvice">
                <div class="agent-ai-label agent-ai-label--tactics">{{ t.club.lblTacticsAdvice || 'Tactics Advice' }}</div>
                <div class="agent-ai-text">{{ getAgentAnalysis(agent.name).tacticsAdvice }}</div>
              </div>
              <div class="agent-ai-section" v-if="getAgentAnalysis(agent.name).buildAdvice">
                <div class="agent-ai-label agent-ai-label--build">{{ t.club.lblBuildAdvice || 'Build Advice' }}</div>
                <div class="agent-ai-text">{{ getAgentAnalysis(agent.name).buildAdvice }}</div>
              </div>
            </template>
            <div v-else class="agent-ai-unavailable">{{ t.club.lblAnalysisUnavailable || 'Analysis not available' }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- No fights -->
    <div v-else-if="report && report.stats?.totalFights === 0" class="empty-text">
      {{ t.club.lblNoFights || 'No fights in this period' }}
    </div>

    <!-- Deep Analysis (Lv3) -->
    <div v-if="report?.stats?.totalFights > 0" class="deep-section">
      <div class="deep-divider"></div>
      <template v-if="premiumReport?.analysis">
        <div class="analysis-section" v-if="premiumReport.analysis.metaSummary">
          <div class="analysis-label analysis-label--meta">{{ t.club.lblMetaPosition || 'Meta Position' }}</div>
          <div class="analysis-text">{{ premiumReport.analysis.metaSummary }}</div>
        </div>
        <div class="analysis-section" v-if="premiumReport.analysis.clubStrength">
          <div class="analysis-label analysis-label--good">{{ t.club.lblClubStrength || 'Strength' }}</div>
          <div class="analysis-text">{{ premiumReport.analysis.clubStrength }}</div>
        </div>
        <div class="analysis-section" v-if="premiumReport.analysis.clubWeakness">
          <div class="analysis-label analysis-label--warn">{{ t.club.lblClubWeakness || 'Weakness' }}</div>
          <div class="analysis-text">{{ premiumReport.analysis.clubWeakness }}</div>
        </div>
        <div class="analysis-section" v-if="premiumReport.analysis.trainingPlan">
          <div class="analysis-label analysis-label--tip">{{ t.club.lblTrainingPlan || 'Training Plan' }}</div>
          <div class="analysis-text">{{ premiumReport.analysis.trainingPlan }}</div>
        </div>
        <div class="analysis-section" v-if="premiumReport.analysis.forecast">
          <div class="analysis-label">{{ t.club.lblForecast || 'Forecast' }}</div>
          <div class="analysis-text">{{ premiumReport.analysis.forecast }}</div>
        </div>
      </template>
      <template v-else>
        <HexButton variant="secondary" size="sm" block :loading="premiumLoading" @click="generatePremium">
          {{ premiumLoading ? (t.club.lblGenerating || 'Generating...') : (x402Enabled ? (t.club.lblUnlockDeep || 'Unlock — $0.02 USDC') : (t.club.lblFreePreview || 'Deep Analysis (Free Preview)')) }}
        </HexButton>
      </template>
      <div v-if="premiumError" class="error-text">{{ premiumError }}</div>
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
import { ref, reactive, computed, watch } from 'vue'
import { t } from '@/locales/index.js'
import apiClient from '@/core/api/apiClient.js'
import HexButton from '@/components/ui/HexButton.vue'
import BeltBadge from '@/components/ui/BeltBadge.vue'

export default {
  name: 'MorningReport',
  components: { HexButton, BeltBadge },
  setup() {
    const period = ref('today');
    const lastPeriod = ref(null);
    const report = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const expandedAgents = reactive({});
    const premiumReport = ref(null);
    const premiumLoading = ref(false);
    const premiumError = ref(null);
    const x402Enabled = ref(false); // TODO: read from config endpoint

    const periods = computed(() => [
      { id: 'today', label: t.value.club?.lblToday || 'Today' },
      { id: 'yesterday', label: t.value.club?.lblYesterday || 'Yesterday' },
      { id: 'last_7d', label: t.value.club?.lbl7Days || '7 Days' },
    ]);

    watch(period, () => { report.value = null; error.value = null; premiumReport.value = null; premiumError.value = null; });

    const sortedAgentStats = computed(() => {
      const stats = report.value?.stats?.agentStats || [];
      return [...stats].sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1));
    });

    const getAgentAnalysis = (name) => {
      const agents = report.value?.analysis?.agents || [];
      return agents.find(a => a.name === name) || null;
    };

    const toggleAgent = (id) => {
      expandedAgents[id] = !expandedAgents[id];
    };

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

    const generatePremium = async () => {
      premiumLoading.value = true;
      premiumError.value = null;
      try {
        const headers = {};
        // TODO: when x402Enabled, do USDC payment first and set X-Payment-Tx header
        const { data } = await apiClient.post('/ai/premium-report', { period: period.value }, { authRequired: true, headers });
        premiumReport.value = data.report;
      } catch (err) {
        premiumError.value = err?.response?.data?.error || t.value.club?.lblDeepAnalysisFailed || 'Deep analysis failed';
      } finally {
        premiumLoading.value = false;
      }
    };

    return { t, period, lastPeriod, periods, report, loading, error, expandedAgents, sortedAgentStats, getAgentAnalysis, toggleAgent, generate, premiumReport, premiumLoading, premiumError, x402Enabled, generatePremium };
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
.report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.report-title {
  font-size: 11px;
  color: var(--hex-text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
}
.report-limit {
  font-size: 9px;
  color: var(--hex-text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.period-select { display: flex; gap: 0; border-bottom: 1px solid var(--hex-border-default); margin-bottom: 14px; }
.period-btn {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  border: none;
  background: none;
  color: var(--hex-text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
}
.period-btn.active {
  color: var(--hex-text-primary);
  border-bottom-color: var(--hex-text-primary);
}

.report-stats { display: flex; justify-content: space-around; padding: 10px 0; margin-bottom: 14px; border-bottom: 1px solid var(--hex-border-default); }
.stat-col { text-align: center; }
.stat-num { font-size: 18px; color: var(--hex-text-primary); line-height: 1; }
.stat-num--win { color: var(--hex-victory); }
.stat-label { font-size: 9px; color: var(--hex-text-muted); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px; }

.analysis-section { margin-bottom: 10px; }
.analysis-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--hex-text-muted);
  margin-bottom: 3px;
}
.analysis-label--good { color: var(--hex-victory); }
.analysis-label--warn { color: var(--hex-draw); }
.analysis-label--tip { color: var(--hex-primary); }
.analysis-text { font-size: 12px; color: var(--hex-text-secondary); line-height: 1.5; }

/* Agent Details Accordion */
.agent-details-section { margin-top: 14px; }
.agent-details-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  margin-bottom: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--hex-border-default);
}

.agent-accordion { margin-bottom: 6px; }
.agent-accordion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--hex-bg-dark);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.agent-accordion-header:hover { background: var(--hex-bg-light); }

.accordion-arrow { font-size: 12px; color: var(--hex-text-muted); width: 12px; }
.accordion-skin { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.accordion-info { flex: 1; min-width: 0; }
.accordion-name {
  font-size: 12px;
  color: var(--hex-text-primary);
}
.accordion-belt { margin-left: 6px; }

.accordion-record {
  font-size: 11px;
  flex-shrink: 0;
}
.rec-win { color: var(--hex-victory); }
.rec-lose { color: var(--hex-defeat); }

.agent-accordion-body {
  padding: 10px 12px;
  margin-top: 2px;
  background: var(--hex-bg-dark);
  border-radius: 0 0 8px 8px;
  border: 1px solid var(--hex-border-default);
  border-top: none;
}

.recent-row { margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
.recent-label { font-size: 10px; color: var(--hex-text-muted); text-transform: uppercase; }
.result-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.result-dot--win { background: var(--hex-victory); }
.result-dot--loss { background: var(--hex-defeat); }
.result-dot--draw { background: var(--hex-draw); }

.agent-ai-section { margin-bottom: 6px; }
.agent-ai-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--hex-text-muted);
  margin-bottom: 2px;
}
.agent-ai-label--tactics { color: var(--hex-draw); }
.agent-ai-label--build { color: var(--hex-primary); }
.agent-ai-text { font-size: 11px; color: var(--hex-text-secondary); line-height: 1.4; }
.agent-ai-unavailable { font-size: 11px; color: var(--hex-text-muted); font-style: italic; }

/* Deep Analysis (Lv3) */
.deep-section { margin-top: 12px; }
.deep-divider { height: 1px; background: var(--hex-border-default); margin-bottom: 12px; }
.analysis-label--meta { color: var(--hex-info, var(--hex-primary)); }

.report-action { margin-top: 10px; }
.empty-text { text-align: center; font-size: 12px; color: var(--hex-text-muted); padding: 12px 0; }
.error-text { margin-top: 8px; font-size: 11px; color: var(--hex-defeat); text-align: center; }

@media (min-width: 1024px) {
  .morning-report { padding: 22px; border-radius: 10px; }
  .report-header { margin-bottom: 18px; }
  .report-title { font-size: 13px; letter-spacing: 2.5px; }
  .report-limit { font-size: 11px; }
  .period-select { margin-bottom: 18px; }
  .period-btn { padding: 11px 0; font-size: 12px; letter-spacing: 2.5px; }
  .report-stats { padding: 14px 0; margin-bottom: 18px; }
  .stat-num { font-size: 24px; }
  .stat-label { font-size: 11px; letter-spacing: 2px; margin-top: 4px; }
  .analysis-label { font-size: 12px; letter-spacing: 2px; margin-bottom: 4px; }
  .analysis-text { font-size: 14px; line-height: 1.6; }
  .analysis-section { margin-bottom: 14px; }
  .agent-details-title { font-size: 12px; letter-spacing: 1.5px; }
  .agent-accordion-header { padding: 10px 14px; gap: 10px; }
  .accordion-skin { width: 34px; height: 34px; }
  .accordion-name { font-size: 14px; }
  .accordion-record { font-size: 13px; }
  .agent-accordion-body { padding: 14px 16px; }
  .agent-ai-label { font-size: 11px; }
  .agent-ai-text { font-size: 13px; }
  .result-dot { width: 10px; height: 10px; }
  .recent-label { font-size: 12px; }
  .deep-section { margin-top: 16px; }
  .report-action { margin-top: 14px; }
  .empty-text { font-size: 14px; }
}
</style>
