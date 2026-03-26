<template>
  <VBtnDark
      size="small"
      class="back-btn"
      @click="goBack">
    {{ t.profile.back }}
    <template #prepend>
      <img src="@/assets/images/icon_right_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
    </template>
  </VBtnDark>
</template>

<script setup>

import {t} from "@/locales/index.js";
import router from "@/router/index.js";

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
  border: 0.5px solid var(--hex-border-active);
  font-size: 0.7em;
  text-transform: none;
  font-weight: lighter;
}

.custom-icon {
  width: 15px; /* Увеличиваем ширину изображения */
  height: 10px; /* Увеличиваем высоту изображения */
}

</style>
