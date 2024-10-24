<template>
  <div class="stats-container" v-if="stats.length > 0">
    <div class="stat-item stat-header" v-for="(stat, index) in stats" :key="stat.id">
      <v-tooltip
          v-model="stat.show"
          location="top"
          content-class="v-tooltip__content"
      >
        <template #activator="{ props }">
          <div :id="stat.id" v-bind="props" @click="stat.show = !stat.show"
               :class="['stat-content', { 'stat-content-vertical': index >= 2 }]">
            <img :src="stat.icon" :alt="stat.title" :class="['stat-icon', { 'stat-icon-large': index < 2 }]"/>
            <span :class="['stat-value', { 'stat-value-large': index < 2 }]">
              {{ stat.value }}
            </span>
          </div>
        </template>
        <span>{{ stat.title }}</span>
      </v-tooltip>
    </div>
  </div>
  <div v-else>
    {{ t('loading') }}
  </div>
</template>

<script setup>
import {ref, watch} from 'vue';
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'})
import iconAllFights from '@/assets/images/icon_fights.svg';
import iconWins from '@/assets/images/icon_wins.svg';
import {formatNumber} from "@/core/constants.js";


const stats = ref([]);

const props = defineProps({
  clubData: {
    type: Object,
    required: true,
    default: () => ({})
  },
});

watch(() => props.clubData, (clubData) => {
  if (clubData) {
    stats.value = [
      {
        id: 'stats-totalFights',
        title: t('club.lblTotalFights'),
        value: formatNumber(clubData.battles),
        icon: iconAllFights,
        show: false
      },
      {id: 'stats-wins', title: t('club.lblWins'), value: formatNumber(clubData.wins), icon: iconWins, show: false},

    ];
  }
}, {immediate: true});

</script>

<style scoped>
.stats-container {
  color: white;
  position: relative;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 500px;
  margin: 20px auto;
}

.stat-header {
  flex: 1 1 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-bottom: 10px;
}

.stat-grid-item {
  flex: 1 1 10%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 30px;
  height: 30px;
  cursor: pointer;
  fill: white;
  margin-bottom: 10px;
}

.stat-icon-large {
  width: 40px;
  height: 40px;
  margin-bottom: 0;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.stat-content-vertical {
  flex-direction: column;
}

.stat-value {
  font-size: 0.8em;
  display: flex;
  align-items: center;
}

.stat-value-large {
  font-size: 1.5em;
  margin-left: 10px;
}

.stat-value-gray {
  color: var(--gray3);
  font-size: 1em;
}
</style>
