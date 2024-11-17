<template>
  <div class="name-container">
    <div v-if="!isEditingName" class="name-edit-container">
      <h2 class="label-name" @click="editName">
        {{ userName }}
      </h2>
    </div>
    <input v-else
           type="text"
           v-model="userName"
           @blur="saveName"
           ref="nameInput"
           class="edit-name-input"
    />
    <img
        src="@/assets/images/icon_pencil.svg"
        alt="Change Name"
        class="change-name-icon"
        @click="editName"/>
  </div>
</template>

<script setup>
import {ref, nextTick, watch} from 'vue';
import store from "@/core/state/store.js";
import {useI18n} from "vue-i18n";
import * as amplitude from "@amplitude/analytics-browser";
const { t } = useI18n({ useScope: 'global' })

const userName = ref(null);
const isEditingName = ref(false);
const nameInput = ref(null);

const editName = () => {
    isEditingName.value = true;
    nextTick(() => {
      nameInput.value.focus();
    });
};

const saveName = () => {
  isEditingName.value = false;
  store.dispatch('master/updateMaster', {name: userName.value});

  // Amplitude
  amplitude.track('EditName');
};

watch(store.getters['master/getMaster'], (newMaster) => {
  if (newMaster && newMaster.userData) {
    userName.value = newMaster.userData.name || t('profile.anonymous');
  }
}, {immediate: true});

</script>

<style scoped>
.name-container {
  display: flex;
  align-items: center;
  width: 100%;
  margin-left: 10px;
  margin-top: 10px;
}

.name-edit-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.label-name {
  flex-grow: 1;
  font-weight: normal;
  font-size: 1.8em;
  max-width: 70vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.change-name-icon {
  width: 20px;
  height: 20px;
  margin-left: auto;
  cursor: pointer;
}

.edit-name-input {
  font-size: 1.8em;
  background: transparent;
  border: none;
  border-bottom: 1px solid white;
  color: white;
  outline: none;
  width: 100%;
  margin-right: 15px;
}
</style>
