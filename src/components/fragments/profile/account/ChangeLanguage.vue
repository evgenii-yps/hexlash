<template>
  <div class="change-language-container">
    <div class="change-language">
      <label class="select-label">{{ t.profile.account.lblChangeLanguage }}</label>
      <v-select
          v-model="selectedLanguage"
          :items="languages"
          item-title="text"
          variant="outlined"
          :menu-icon="null"
          density="compact"
          bg-color="var(--black-opacity-80)"
          class="custom-select"
          style=""
          :hideNoData="true"
      >
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props"></v-list-item>
        </template>
        <template v-slot:append-inner>
          <img src="@/assets/images/icon_arrow_down.svg" alt="custom arrow" class="custom-arrow"/>
        </template>
      </v-select>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";

const selectedLanguage = computed({
  get: () => store.getters['master/getLanguage'] || localStorage.getItem('preferredLanguage') || 'en',
  set: (val) => store.dispatch('master/setLanguage', val)
});

const languages = [
  {text: 'English', value: 'en'},
  {text: 'Español', value: 'es'},
  {text: '中文', value: 'zh'},
  {text: 'Français', value: 'fr'},
  {text: 'Deutsch', value: 'de'},
  {text: 'Português', value: 'pt'},
  {text: 'العربية', value: 'ar'},
  {text: 'हिन्दी', value: 'hi'},
  {text: '日本語', value: 'ja'},
  {text: '한국어', value: 'ko'},
  {text: 'Русский', value: 'ru'},
];
</script>

<style scoped>
.change-language-container {
  align-items: center;
  margin: 10px 20px 20px;
}

.change-language {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
  margin: 0 auto;
}

.custom-select {
  width: 100%;
  color: var(--gray3) !important;
}

.select-label {
  color: white;
  text-transform: uppercase;
  margin-bottom: 5px;
  text-align: center;
  font-weight: 800;
  font-size: 0.5rem;
  display: flex;
  justify-content: center;
}

:deep(.v-select__selection-text){
  font-size: 0.8rem;
}
</style>