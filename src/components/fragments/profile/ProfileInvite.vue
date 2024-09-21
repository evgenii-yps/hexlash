<template>
  <div class="invite-container">
    <v-tooltip
        v-model="showTooltip"
        location="bottom"
        contentClass="v-tooltip__content"
        max-width="200px"
    >
      <template #activator="{ props }">
        <div class="code-container">
          <h2 v-bind="props" @click="toggleTooltip" class="invite-code">{{ inviteCode }}</h2>
          <div class="copy-icon-container" @click="copyToClipboard">
            <img src="@/assets/images/icon_copy.svg" alt="Copy Icon" class="copy-icon">
          </div>
        </div>
      </template>
      <span>{{ t('profile.invite.lblTooltipText') }}</span>
    </v-tooltip>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import store from "@/core/state/store.js";
import {useI18n} from "vue-i18n";
const { t } = useI18n({ useScope: 'global' })



const inviteCode = ref(null);
const showTooltip = ref(false);

watch(store.getters['master/getMaster'], (newMaster) => {
  if (newMaster && newMaster.userData) {
    inviteCode.value = newMaster.inviteId;
  }
}, { immediate: true });

const copyToClipboard = () => {
  navigator.clipboard.writeText(inviteCode.value).then(() => {
    alert(t('profile.invite.lblCopySuccess'));
  }).catch(err => {
    console.error( t('profile.invite.lblCopyError', { error: err }));
  });
};

const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value;
};
</script>

<style scoped>
.invite-container {
  color: white;
  text-align: center;
  font-weight: 800;
  font-size: 0.5em;
}

.invite-text {
  margin-bottom: 0.2em;
}

.code-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.invite-code {
  font-size: 2.5rem;
  font-family: 'Anonymous', 'Arial', sans-serif;
  color: white;
  margin: 0;
  cursor: pointer;
}

.copy-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  background-color: var(--pink);
  border-radius: 50%;
  margin-left: 1em;
  cursor: pointer;
}

.copy-icon {
  width: 12px;
  height: 12px;
}

.copy-icon:hover {
  opacity: 0.8;
}
</style>
