<template>
  <div class="switcher-3d-punch-container">
    <VBtnDark
        class="punch-btn"
        @click="btnIs2D">
      {{t('profile.account.is3dPunch')}}
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

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import store from "@/core/state/store.js";
const {t} = useI18n({useScope: 'global'})



const is3DPunch = computed({
  get: () => !store.getters['punch/is2DPunchEnabled'],  // Инвертируем значение
  set: (value) => store.commit('punch/set2DPunch', !value)  // Инвертируем при установке
});

const btnIs2D = () => {
  is3DPunch.value = !is3DPunch.value;
};

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
  height: 50px;
  max-width: 500px;
  text-align: center;
  color: white;
  cursor: pointer;
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
  font-size: 1em;
  flex-grow: 1;
}

.switcher-3d-punch.checked :deep(.v-switch__thumb) {
  background-color: var(--primary-color) !important;
}



</style>
