<template>
  <!-- Модальное окно получения ачивки -->
  <VModal v-model="dialog" max-width="500" persistent >
    <VCard>
      <v-card-title class="headline"></v-card-title>
      <v-card-text class="text-center">
        <img :src="achievement?.icon" alt="achievement image" class="achievement-image"/>
        <div class="title">{{ achievement?.title }}</div>
        <div class="congratulations">{{ t('profile.achievements.congratulations') }} </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <VBtn @click="hide" class="confirm-btn">{{ t('modal.btnOk') }}</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>

</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from "vue-i18n";
import store from "@/core/state/store.js";

const { t } = useI18n({ useScope: 'global' });

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
.text-center{
  text-align: center;
}

.title{
  font-size: 1.5rem;
  margin: 10px 0;
}
.desc{
  color: var(--gray2);
}

.congratulations{
  color: var(--gray2);
}

.achievement-image{
  width: 180px;
  margin-bottom: 20px;
}
</style>
