<template>
  <div class="switcher-3d-punch-container">
    <VBtnDark
        class="punch-btn"
        @click="toggle3DPunch">
      {{ t.profile.account.is3dPunch }}
      <template #append>
        <span class="custom-icon"/>
        <v-switch
            style="position: absolute; right:10px;"
            v-model="is3DPunch"
            :class="{ checked: is3DPunch }"
            class="switcher-3d-punch"
            hide-details
        ></v-switch>
      </template>
    </VBtnDark>
  </div>
</template>

<script setup>

import {computed, onMounted, ref} from "vue";
import {t} from "@/locales/index.js";
import store from "@/core/state/store.js";

const is3DPunch = ref(!store.getters['punch/is2DPunchEnabled']); // Инвертируем начальное значение из store

const toggle3DPunch = () => {
  is3DPunch.value = !is3DPunch.value;
  store.commit('punch/set2DPunch', !is3DPunch.value); // Инвертируем при установке
};

onMounted(() => {
  is3DPunch.value = !store.getters['punch/is2DPunchEnabled']; // Устанавливаем текущее значение из store при монтировании
});

</script>

<style scoped>
.switcher-3d-punch-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 20px 20px;
}


.punch-btn {
  width: 100%;
  height: 40px;
  max-width: 500px;
  text-align: center;
  color: white;
  cursor: pointer;
  font-size: 0.7rem !important;
}


.switcher {
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80%;
  margin: 10px auto 10px auto;
  background-color: var(--gray1);
  padding: 0 10px;
  border-radius: 4px;
  max-width: 500px;
  text-transform: uppercase;
}

.switcher p {
  display: flex;
  align-items: center;
  font-size: 0.9em;
  flex-grow: 1;
}

.switcher-3d-punch.checked :deep(.v-switch__thumb) {
  background-color: var(--primary-color) !important;
}



</style>
