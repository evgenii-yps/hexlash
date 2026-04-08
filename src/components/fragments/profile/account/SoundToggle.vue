<template>
  <div class="sound-toggle-container">
    <VBtnDark
        class="sound-btn"
        @click="toggleSound">
      {{ t.profile.account.soundToggle }}
      <template #append>
        <span class="custom-icon"/>
        <v-switch
            style="position: absolute; right:10px;"
            v-model="isSoundOn"
            :class="{ checked: isSoundOn }"
            class="sound-toggle-switch"
            hide-details
        ></v-switch>
      </template>
    </VBtnDark>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { t } from '@/locales/index.js';
import store from '@/core/state/store.js';

const isSoundOn = ref(!store.getters['punch/isMuted']);

const toggleSound = () => {
  isSoundOn.value = !isSoundOn.value;
  store.commit('punch/setMuted', !isSoundOn.value);
};

onMounted(() => {
  isSoundOn.value = !store.getters['punch/isMuted'];
});
</script>

<style scoped>
.sound-toggle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 20px 20px;
}

.sound-btn {
  width: 100%;
  height: 40px;
  max-width: 500px;
  text-align: center;
  color: var(--hex-text-primary);
  cursor: pointer;
  font-size: 0.7rem !important;
}

.sound-toggle-switch.checked :deep(.v-switch__thumb) {
  background-color: var(--hex-success) !important;
}
</style>
