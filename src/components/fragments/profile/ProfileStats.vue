<template>
  <div class="stats-container" v-if="stats.length > 0">
    <div class="stat-item" v-for="(stat, index) in stats" :key="stat.id" :class="{ 'stat-header': index < 2, 'stat-grid-item': index >= 2 }">
      <v-tooltip
          v-model="stat.show"
          location="top"
          content-class="v-tooltip__content"
      >
        <template #activator="{ props }">
          <div :id="stat.id" v-bind="props" @click="stat.show = !stat.show" :class="['stat-content', { 'stat-content-vertical': index >= 2 }]">
            <img :src="stat.icon" :alt="stat.title" :class="['stat-icon', { 'stat-icon-large': index < 2 }]" />
            <span :class="['stat-value', { 'stat-value-large': index < 2 }]">
              {{ stat.value }}<span v-if="index === 8" class="stat-value-gray">{{ stat.valueInBrackets }}</span>
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
import {  ref, watch } from 'vue';
import {useI18n} from "vue-i18n";
const { t } = useI18n({ useScope: 'global' })

import iconAllFights from '@/assets/images/icon_fights.svg';
import iconWins from '@/assets/images/icon_wins.svg';
import iconLosses from '@/assets/images/icon_lose.svg';
import iconDraws from '@/assets/images/icon_draw.svg';
import iconLuck from '@/assets/images/icon_lucky.svg';
import iconWonTokens from '@/assets/images/icon_tokens.svg';
import iconFreeTokens from '@/assets/images/icon_token_less.svg';
import iconInvites from '@/assets/images/icon_invites.svg';
import iconDaysInClub from '@/assets/images/icon_calendar.svg';



const stats = ref([]);

const props = defineProps({
  userData: {
    type: Object,
    required: true,
    default: () => ({})
  },
});

watch(() => props.userData, (userData) => {
  if (userData) {
    stats.value = [
      { id: 'stats-totalFights', title: t('profile.stats.lblTotalFights'), value: userData.totalFights, icon: iconAllFights, show: false },
      { id: 'stats-wins', title: t('profile.stats.lblWins'), value: userData.wins, icon: iconWins, show: false },
      { id: 'stats-losses', title: t('profile.stats.lblLosses'), value: userData.losses, icon: iconLosses, show: false },
      { id: 'stats-draws', title: t('profile.stats.lblDraws'), value: userData.draws, icon: iconDraws, show: false },
      { id: 'stats-luckPercentage', title: t('profile.stats.lblLuckPercentage'), value: userData.luckPercentage + '%', icon: iconLuck, show: false },
      { id: 'stats-wonTokens', title: t('profile.stats.lblWonTokens'), value: userData.wonTokens, icon: iconWonTokens, show: false },
      { id: 'stats-freeTokens', title: t('profile.stats.lblFreeTokens'), value: userData.freeTokens, icon: iconFreeTokens, show: false },
      { id: 'stats-invitedUsers', title: t('profile.stats.lblInvitedUsers'), value: userData.invitedUsers, icon: iconInvites, show: false },
      { id: 'stats-daysInClubAndNoSkipDays', title: t('profile.stats.lblDaysInClub'), value: userData.daysInClub, valueInBrackets: `(${userData.noSkipDays})`, icon: iconDaysInClub, show: false },
    ];
  }
}, { immediate: true });

</script>

<style scoped>
.stats-container {
  margin-top: 20px;
  color: white;
  position: relative;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 100%;
  margin-left: 20px;
  margin-right: 20px;
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
  width: 20px;
  height: 20px;
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
