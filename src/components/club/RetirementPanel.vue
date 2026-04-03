<template>
  <div class="retirement-panel">
    <template v-if="loading">
      <div class="retirement-loading"><v-progress-circular size="24" indeterminate /></div>
    </template>

    <!-- Legend display (already retired) -->
    <template v-else-if="data?.legend">
      <div class="legend-header">
        <span class="legend-title">{{ t.club.lblLegend || 'Legend' }}</span>
      </div>
      <div class="legend-display">
        <img :src="`/images/skins/${data.legend.skin}`" class="legend-skin" />
        <div class="legend-info">
          <div class="legend-archetype">{{ archName(data.legend.archetype) }}</div>
          <div class="legend-buffs">
            <div class="buff-line buff-xp">+{{ pct(data.legend.buff.xpBonus) }}% XP</div>
            <div class="buff-line buff-dmg">+{{ pct(data.legend.buff.dmgBonus) }}% DMG</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Retirement progress -->
    <template v-else-if="data">
      <div class="retirement-header">
        <span class="retirement-title">{{ data.canRetire ? (t.club.lblReadyToRetire || 'Ready to Retire!') : (t.club.lblRetirement || 'Fighter Retirement') }}</span>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-label">{{ data.progress?.overallProgress || 0 }}%</div>
        <div class="progress-track"><div class="progress-fill" :style="{ width: (data.progress?.overallProgress || 0) + '%' }"></div></div>
      </div>

      <div class="req-list">
        <div :class="['req', { done: data.requirements?.allUnlocked }]">
          {{ data.requirements?.allUnlocked ? '✅' : '❌' }} {{ t.club.lblAllUnlocked || 'All moves unlocked' }} ({{ data.progress?.unlockedMoves }}/{{ data.progress?.totalMoves }})
        </div>
        <div :class="['req', { done: data.requirements?.minLevel3 }]">
          {{ data.requirements?.minLevel3 ? '✅' : '❌' }} {{ data.progress?.movesAtLevel3Plus }} moves at Lv3+ (need 12)
        </div>
        <div :class="['req', { done: data.requirements?.minLevel5 }]">
          {{ data.requirements?.minLevel5 ? '✅' : '❌' }} {{ data.progress?.movesAtLevel5 }} moves at Lv5 (need 3)
        </div>
        <div :class="['req', { done: data.requirements?.hasClub }]">
          {{ data.requirements?.hasClub ? '✅' : '❌' }} {{ t.club.lblHasClub || 'In a clan' }}
        </div>
        <div :class="['req', { done: data.requirements?.noExistingLegend }]">
          {{ data.requirements?.noExistingLegend ? '✅' : '❌' }} {{ t.club.lblNoLegend || 'No existing legend' }}
        </div>
      </div>

      <!-- Buff preview + retire button -->
      <template v-if="data.canRetire && data.buffPreview">
        <div class="buff-preview">
          <div class="buff-preview-title">{{ t.club.lblBuffPreview || 'Legend Buff Preview' }}</div>
          <div class="buff-line buff-xp">+{{ pct(data.buffPreview.xpBonus) }}% XP for all agents</div>
          <div class="buff-line buff-dmg">+{{ pct(data.buffPreview.dmgBonus) }}% damage</div>
        </div>
        <div class="retire-warning">{{ t.club.lblRetireWarning || 'This action cannot be undone' }}</div>
        <HexButton variant="danger" block :loading="retiring" @click="onRetire">
          {{ t.club.lblRetireFighter || 'Retire Fighter' }}
        </HexButton>
      </template>
    </template>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { t } from '@/locales/index.js'
import apiClient from '@/core/api/apiClient.js'
import store from '@/core/state/store.js'
import HexButton from '@/components/ui/HexButton.vue'

export default {
  name: 'RetirementPanel',
  components: { HexButton },
  setup() {
    const data = ref(null);
    const loading = ref(true);
    const retiring = ref(false);

    const archName = (id) => t.value.cards?.archetypes?.[id] || (id ? id.charAt(0).toUpperCase() + id.slice(1) : '');
    const pct = (v) => Math.round((v || 0) * 100);

    const load = async () => {
      loading.value = true;
      try {
        const { data: res } = await apiClient.get('/user/retirement-status', { authRequired: true });
        data.value = res;
      } catch { /* ignore */ }
      finally { loading.value = false; }
    };

    const onRetire = async () => {
      if (retiring.value) return;
      retiring.value = true;
      try {
        const { data: res } = await apiClient.post('/user/retire', {}, { authRequired: true });
        store.commit('master/setInfo', { text: res.message || t.value.club?.lblRetireSuccess || 'Retired!' });
        await load();
      } catch (err) {
        store.commit('master/setError', { text: err?.response?.data?.error || 'Retirement failed' });
      } finally { retiring.value = false; }
    };

    onMounted(load);

    return { t, data, loading, retiring, archName, pct, onRetire };
  },
};
</script>

<style scoped>
.retirement-panel {
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}
.retirement-loading { text-align: center; padding: 16px; }

.legend-header, .retirement-header { margin-bottom: 10px; }
.legend-title, .retirement-title {
  font-family: 'Anonymous', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-primary);
}

.legend-display { display: flex; align-items: center; gap: 12px; }
.legend-skin {
  width: 64px; height: 64px; border-radius: 10px; object-fit: cover;
  border: 2px solid var(--hex-draw); box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
}
.legend-archetype { font-family: 'Anonymous', monospace; font-size: 13px; color: var(--hex-text-primary); }
.legend-buffs { margin-top: 4px; }

.progress-bar-wrap { margin-bottom: 10px; }
.progress-label { font-family: 'AnonymousBalance', monospace; font-size: 12px; color: var(--hex-text-muted); margin-bottom: 4px; text-align: right; }
.progress-track { height: 6px; background: var(--hex-bg-dark); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--hex-primary), #FF3399); border-radius: 3px; transition: width 0.3s; }

.req-list { margin-bottom: 12px; }
.req { font-size: 11px; color: var(--hex-text-muted); padding: 2px 0; }
.req.done { color: var(--hex-text-secondary); }

.buff-preview { background: var(--hex-bg-dark); border-radius: 8px; padding: 10px; margin-bottom: 8px; }
.buff-preview-title { font-size: 10px; text-transform: uppercase; color: var(--hex-text-muted); margin-bottom: 4px; }
.buff-line { font-family: 'AnonymousBalance', monospace; font-size: 12px; }
.buff-xp { color: var(--hex-victory); }
.buff-dmg { color: var(--hex-primary); }

.retire-warning { font-size: 10px; color: var(--hex-defeat); text-align: center; margin-bottom: 8px; }
</style>
