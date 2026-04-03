<template>
  <div class="morning-report">
    <div class="report-header">
      <span class="report-title">{{ t.club.lblMorningReport || 'Morning Report' }}</span>
    </div>

    <div class="period-select">
      <button v-for="p in periods" :key="p.id" :class="['period-btn', { active: period === p.id }]" @click="period = p.id">{{ p.label }}</button>
    </div>

    <!-- Stats bar -->
    <div v-if="report?.stats?.totalFights > 0" class="report-stats">
      <div class="rstat"><span class="rstat-val">{{ report.stats.totalFights }}</span><span class="rstat-label">Fights</span></div>
      <div class="rstat"><span class="rstat-val rstat-win">{{ report.stats.wins }}</span><span class="rstat-label">Wins</span></div>
      <div class="rstat"><span class="rstat-val">{{ report.stats.winRate }}%</span><span class="rstat-label">Win Rate</span></div>
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
              <span class="accordion-elo">{{ agent.elo }}
                <span :class="agent.eloChange >= 0 ? 'elo-up' : 'elo-down'">{{ agent.eloChange >= 0 ? '+' : '' }}{{ agent.eloChange }}</span>
              </span>
            </div>
            <div class="accordion-record">
              <span class="rec-win">{{ agent.wins }}W</span>/<span class="rec-lose">{{ agent.losses }}L</span>
            </div>
          </div>

          <div v-if="expandedAgents[agent.agentId]" class="agent-accordion-body hex-fade-in">
            <!-- Recent results -->
            <div v-if="agent.recentResults?.length" class="recent-row">
              <span class="recent-label">{{ t.club.lblRecentResults || 'Recent' }}:</span>
              <span v-for="(r, i) in agent.recentResults" :key="i" :class="['recent-icon', `recent-${r}`]">{{ r === 'W' ? '✅' : r === 'L' ? '❌' : '➖' }}</span>
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
            <div v-else class="agent-ai-unavailable">Analysis not available</div>
          </div>
        </div>
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
import { ref, reactive, computed, watch } from 'vue'
import { t } from '@/locales/index.js'
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
    const expandedAgents = reactive({});

    const periods = computed(() => [
      { id: 'today', label: t.value.club?.lblToday || 'Today' },
      { id: 'yesterday', label: t.value.club?.lblYesterday || 'Yesterday' },
      { id: 'last_7d', label: t.value.club?.lbl7Days || '7 Days' },
    ]);

    watch(period, () => { report.value = null; error.value = null; });

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

    return { t, period, lastPeriod, periods, report, loading, error, expandedAgents, sortedAgentStats, getAgentAnalysis, toggleAgent, generate };
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

.report-stats { display: flex; gap: 8px; margin-bottom: 12px; }
.rstat { flex: 1; text-align: center; padding: 6px; background: var(--hex-bg-dark); border-radius: 6px; }
.rstat-val { display: block; font-family: 'AnonymousBalance', monospace; font-size: 16px; color: var(--hex-text-primary); }
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

/* Agent Details Accordion */
.agent-details-section { margin-top: 14px; }
.agent-details-title {
  font-family: 'Anonymous', monospace;
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
  font-family: 'Anonymous', monospace;
  font-size: 12px;
  color: var(--hex-text-primary);
}
.accordion-elo {
  font-family: 'AnonymousBalance', monospace;
  font-size: 11px;
  color: var(--hex-text-muted);
  margin-left: 6px;
}
.elo-up { color: var(--hex-victory); font-size: 10px; }
.elo-down { color: var(--hex-defeat); font-size: 10px; }

.accordion-record {
  font-family: 'AnonymousBalance', monospace;
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
.recent-icon { font-size: 12px; }

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

.report-action { margin-top: 10px; }
.empty-text { text-align: center; font-size: 12px; color: var(--hex-text-muted); padding: 12px 0; }
.error-text { margin-top: 8px; font-size: 11px; color: var(--hex-defeat); text-align: center; }
</style>
