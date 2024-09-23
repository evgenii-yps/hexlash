<template>
  <VBtnDark
      size="small"
      class="back-btn"
      @click="goBack">
    {{ t('profile.back') }}
    <template #prepend>
      <img src="@/assets/images/icon_right_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
    </template>
  </VBtnDark>
</template>

<script setup>

import {useI18n} from "vue-i18n";
import router from "@/router/index.js";

const { t } = useI18n({ useScope: 'global' });

// Определение пропсов
const props = defineProps({
  defaultRoute: {
    type: String,
    default: "Home",
    required: true
  }
});

// Функция для обработки кнопки "Назад"
const goBack = () => {
  router.push({ name: props.defaultRoute });
};
</script>

<style scoped>
.back-btn {
  margin-left: 20px;
  text-align: left;
  color: white;
  cursor: pointer;
  border: 0.5px solid var(--gray2);
  font-size: 0.7em;
  text-transform: none;
  font-weight: lighter;
}

.custom-icon {
  width: 15px; /* Увеличиваем ширину изображения */
  height: 10px; /* Увеличиваем высоту изображения */
}

</style>
