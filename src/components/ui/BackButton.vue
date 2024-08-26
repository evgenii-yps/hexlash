<template>
  <VBtnDark
      size="small"
      class="back-btn"
      @click="goBack">
    {{ $t('profile.back') }}
    <template #prepend>
      <img src="@/assets/images/icon_right_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
    </template>

  </VBtnDark>

</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.back();
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
