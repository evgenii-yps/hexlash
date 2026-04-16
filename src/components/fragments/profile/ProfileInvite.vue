<!-- ProfileInvite — referral feature disabled, preserved for future reactivation. -->
<template>
  <div v-if="showInviteContainer" class="invite-container">
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
          <div class="share-icon-container" @click="openShare">
            {{ t.profile.invite.inviteFriend }}
          </div>
        </div>
      </template>
      <span>{{ t.profile.invite.lblTooltipText }}</span>
    </v-tooltip>
  </div>

  <!-- Модальное окно поделится -->
  <VModal v-model="showDialogConfirmShare" max-width="500">
    <VCard>
      <v-card-title class="headline"></v-card-title>
      <v-card-text>{{ t.profile.invite.confirmInviteFriend }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="showDialogConfirmShare = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
        <v-btn @click="goToUrl" class="confirm-btn">{{ t.modal.btnConfirm }}</v-btn>
      </v-card-actions>
    </VCard>
  </VModal>

</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import store from "@/core/state/store.js";
import {t, interpolate} from "@/locales/index.js";
import {VBtn, VCard, VCardActions, VCardText, VCardTitle, VSpacer} from "vuetify/components";



const clanId = ref(null);
const inviteCode = ref(null);
const showInviteContainer = ref(false);
const showTooltip = ref(false);
const showDialogConfirmShare = ref(false);

watch(store.getters['master/getMaster'],  async(newMaster) => {
  if (newMaster && newMaster.userData) {
    inviteCode.value = newMaster.inviteId;
    clanId.value = newMaster.userData.clanId;

    if (clanId.value) {
      const clan = await store.dispatch('clan/getClanById', clanId.value);
      if (clan) {
        showInviteContainer.value = clan.isPublic || clan.owner === newMaster.userData.id;
      }
    }

  }
}, { immediate: true });

const copyToClipboard = () => {
  navigator.clipboard.writeText(inviteCode.value).then(() => {
    alert(t.value.profile.invite.lblCopySuccess);
  }).catch(err => {
    console.error(interpolate(t.value.profile.invite.lblCopyError, { error: err }));
  });
};

const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value;
};

const openShare = () => {
  showDialogConfirmShare.value = !showDialogConfirmShare.value;
}

const goToUrl = () => {
  showDialogConfirmShare.value = !showDialogConfirmShare.value;
  store.dispatch('master/sendShare');
}

</script>

<style scoped>
.invite-container {
  color: var(--hex-text-primary);
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
  font-family: var(--hex-font-mono);
  color: var(--hex-text-primary);
  margin: 0;
  cursor: pointer;
}

.copy-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  background-color: var(--hex-text-secondary);
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

.share-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--hex-text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin-left: 1em;
  cursor: pointer;
  font-size: 0.8rem;
}


</style>
