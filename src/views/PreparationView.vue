<template>
  <div class="background background-arena">
    <div class="arena-container" @scroll="handleScroll">
      <div class="arena-content-wrapper">

        <div class="player-header">
          <UserAvatar :avatarUrl="master?.userData?.avatarUrl" width="50px" height="50px"/>
          <UserName :userName="master?.userData?.name || ''" style="width: auto !important;"/>
        </div>

        <ModuleBuilder/>

        <div class="fight-button-wrapper">
          <VBtn
              v-if="!isAutoFightEnabled"
              width="200"
              size="large"
              class="fight-btn"
              :disabled="!isBuildValid"
              @click="startFight"
          >
            {{ t.arena.lblStartFight }}
          </VBtn>
          <div v-else class="fight-btn-blocked">
            <span class="blocked-icon">&#x1F504;</span>
            {{ t.autoFight.lblAutoFightInProgress }}
          </div>
        </div>

        <div class="autofight-section">
          <AutoFightToggle/>
          <AutoFightStatus/>
        </div>

        <div class="scroll-gap"/>

      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted} from 'vue';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";
import UserAvatar from "@/components/fragments/profile/UserAvatar.vue";
import UserName from "@/components/fragments/profile/UserName.vue";
import ModuleBuilder from "@/components/fragments/modules/ModuleBuilder.vue";
import AutoFightToggle from "@/components/fragments/fight/AutoFightToggle.vue";
import AutoFightStatus from "@/components/fragments/fight/AutoFightStatus.vue";

const master = computed(() => store.getters['master/getMaster']);
const isBuildValid = computed(() => store.getters['fight/isBuildValid']);
const isAutoFightEnabled = computed(() => store.getters['autoFight/isEnabled']);

const startFight = async () => {
  await store.dispatch('fight/startFight');
};

onMounted(() => {
  store.dispatch('fight/loadModules');
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

.fight-btn-blocked {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid rgba(255, 6, 111, 0.4);
  background: rgba(255, 6, 111, 0.1);
  color: var(--primary-color);
  font-family: Anonymous, sans-serif;
  font-size: 0.85rem;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.blocked-icon {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.autofight-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.scroll-gap {
  display: block;
  position: relative;
  height: 150px;
}
</style>
