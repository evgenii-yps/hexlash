<template>
  <div class="background background-arena">
    <div class="arena-container" @scroll="handleScroll">
      <div class="arena-content-wrapper">

        <div class="player-header">
          <UserAvatar :avatarUrl="master?.userData?.avatarUrl" width="50px" height="50px"/>
          <UserName :userName="master?.userData?.name || ''" style="width: auto !important;"/>
        </div>

        <DeckBuilder/>

        <div class="difficulty-section">
          <div class="difficulty-label">{{ t('arena.lblDifficulty') }}</div>
          <div class="difficulty-buttons">
            <VBtn
                v-for="level in ['easy', 'medium', 'hard']"
                :key="level"
                size="small"
                :class="['diff-btn', { 'diff-active': difficulty === level }]"
                @click="setDifficulty(level)"
            >
              {{ t('arena.lbl' + level.charAt(0).toUpperCase() + level.slice(1)) }}
            </VBtn>
          </div>
        </div>

        <div class="fight-button-wrapper">
          <VBtn
              width="200"
              size="large"
              class="fight-btn"
              :disabled="!isDeckValid"
              @click="startFight"
          >
            {{ t('arena.lblStartFight') }}
          </VBtn>
        </div>

        <div class="scroll-gap"/>

      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted} from 'vue';
import store from "@/core/state/store.js";
import {useI18n} from "vue-i18n";
import UserAvatar from "@/components/fragments/profile/UserAvatar.vue";
import UserName from "@/components/fragments/profile/UserName.vue";
import DeckBuilder from "@/components/fragments/cards/DeckBuilder.vue";
const {t} = useI18n({useScope: 'global'});

const master = computed(() => store.getters['master/getMaster']);
const isDeckValid = computed(() => store.getters['fight/isDeckValid']);
const difficulty = computed(() => store.getters['fight/getDifficulty']);

const setDifficulty = (level) => {
  store.dispatch('fight/setDifficulty', level);
};

const startFight = async () => {
  await store.dispatch('fight/startFight');
};

onMounted(() => {
  store.dispatch('fight/loadCards');
});

const emit = defineEmits(['scroll']);
const handleScroll = (event) => {
  emit('scroll', event.target.scrollTop);
};
</script>

<style scoped>
.background-arena {
  background: url('@/assets/images/background_arena.webp') no-repeat center center;
}

.background-arena::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to right bottom, black 25%, transparent 75%);
  z-index: 1;
}

.background-arena::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

@keyframes fadeOut {
  to { opacity: 0; }
}

.arena-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

@supports (height: 100dvh) {
  .arena-container {
    height: 100dvh;
  }
}

.arena-content-wrapper {
  width: 100%;
  box-sizing: border-box;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px 16px;
}

.player-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  gap: 4px;
}

.difficulty-section {
  margin-top: 16px;
  text-align: center;
}

.difficulty-label {
  font-size: 0.75rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.difficulty-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.diff-btn {
  font-size: 0.75rem !important;
  background-color: var(--black-opacity-80) !important;
  color: var(--gray2) !important;
  border: 1px solid var(--gray2);
}

.diff-active {
  background-color: var(--primary-color) !important;
  color: white !important;
  border-color: var(--primary-color) !important;
}

.fight-button-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.fight-btn {
  cursor: pointer;
  background-color: var(--primary-color);
  color: white !important;
  font-size: 1rem;
}

.fight-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
