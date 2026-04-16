<template>
  <!-- Модальное окно получения ачивки -->
  <VModal v-model="dialog" max-width="500" persistent >
    <VCard>
      <v-card-title class="headline"></v-card-title>
      <v-card-text class="text-center">
        <img :src="achievement?.icon" alt="achievement image" class="achievement-image"/>
        <div class="title">{{ achievement?.title }}</div>
        <div class="congratulations">{{ t.profile.achievements.congratulations }} </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <VBtn @click="hide" class="confirm-btn">{{ t.modal.btnOk }}</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>

</template>

<script setup>
import { ref, watch, computed } from 'vue';
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

const dialog = ref(false);


// Получаем данные об ачивке из store
const achievement = computed(() => store.getters['achievement/getNewAchievement']);

// Отслеживаем появление новой ачивки
watch(achievement, (newAchievement) => {
  if (newAchievement) {
    dialog.value = true;
  }
});


const hide = () => {
  dialog.value = false;
  store.commit('achievement/clearNewAchievement');
};


</script>

<style scoped>
/* TODO: Replace VModal/VCard with custom modal for dramatic 600ms animation control */

.text-center {
  text-align: center;
}

.title {
  font-family: var(--hex-font-display);
  font-size: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-primary);
  margin: 8px 0;
}

.desc {
  color: var(--hex-text-secondary);
}

.congratulations {
  color: var(--hex-text-secondary);
}

.achievement-image {
  width: 180px;
  margin-bottom: 20px;
}

:deep(.v-card) {
  background-color: var(--hex-bg-card) !important;
  border: 1px solid var(--hex-border-strong) !important;
}

:deep(.v-card-title) {
  color: var(--hex-text-primary) !important;
}

:deep(.v-card-text) {
  color: var(--hex-text-primary) !important;
}

.confirm-btn {
  background-color: var(--hex-primary) !important;
  color: var(--hex-text-primary) !important;
  min-width: 44px;
  min-height: 44px;
}
</style>
