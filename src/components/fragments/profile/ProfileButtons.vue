<template>
  <div class="buttons-container">
    <div v-if="isOwner" class="split-button-container">
      <VBtnDark
          class="profile-btn"
          @click="navigateToClub"
      >
        <template #prepend>
          <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
        </template>
        {{ clubText }}
      </VBtnDark>
    </div>
    <div v-else class="split-button-container">
      <VBtnDark
          class="profile-btn"
          @click="navigateToClub">
        <template #prepend>
          <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
        </template>

        <span class="club-text">{{ clubText }}</span>

        <VTooltip
            v-model="showToolTip"
            location="top"
            max-width="250px"
            contentClass="v-tooltip__content">
          <template #activator="{ props }">
            <VBtn
                v-bind="props"
                class="create-club-btn"
                :class="{ 'sufficient-balance': isBalanceSufficient }"
                @click.stop="btnCreateNewClub">
              {{ t('profile.buttons.lblCreateClub') }}
            </VBtn>

            <CreateClub :dialogCreate="dialogCreate" @close="dialogCreate = false" />
          </template>
          <span> {{ t('profile.buttons.tooltipInsufficientFunds') }}</span>
        </VTooltip>
      </VBtnDark>
    </div>

    <VBtnDark
        class="profile-btn"
        @click="navigateTo('Wallet')">
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t('profile.buttons.lblWalletManagement') }}
    </VBtnDark>

    <VBtnDark
        class="profile-btn"
        @click="navigateTo('Account')"
    >
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t('profile.buttons.lblSettings') }}
    </VBtnDark>

    <VBtnDark
        class="profile-btn"
        @click="dialogExit = true"
    >
      <template #prepend>
        <img src="@/assets/images/icon_arrow.svg" alt="Arrow Icon" class="custom-icon"/>
      </template>
      {{ t('profile.buttons.lblLogout') }}
    </VBtnDark>

    <VModal v-model="dialogExit" max-width="500">
      <VCard>
        <v-card-title class="headline">{{ t('profile.buttons.lblConfirmLogout') }}</v-card-title>
        <v-card-text>{{ t('profile.buttons.msgConfirmLogout') }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogExit = false" class="cancel-btn">{{ t('modal.btnCancel') }}</v-btn>
          <v-btn @click="logout" class="confirm-btn">{{ t('profile.buttons.lblLogout') }}</v-btn>
        </v-card-actions>
      </VCard>
    </VModal>

  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import router from "@/router/index.js";
import store from "@/core/state/store.js";
import CreateClub from "@/components/fragments/club/CreateClub.vue";
import {COST_CREATE_CLUB} from "@/core/constants.js";
import {useI18n} from "vue-i18n";
const { t } = useI18n({ useScope: 'global' })

const master = computed(() => store.getters['master/getMaster']);
const clubId = computed(() => master.value?.userData.clubId);
const isBalanceSufficient = computed(() => master.value?.userData.balance >= COST_CREATE_CLUB);

const isOwner = ref(false);
const clubData = ref(null);
const clubText = ref(t('profile.buttons.lblClubLoading'));
const showToolTip = ref(false);
const dialogCreate = ref(false);
const dialogExit = ref(false);

const navigateTo = (route) => {
  router.push({name: route});
};

const navigateToClub = () => {
  if (clubId.value) {
    router.push({path: `/club/${clubId.value}`});
  }
};

const btnCreateNewClub = () => {
  if (!isBalanceSufficient.value) {
    showToolTip.value = true;
    setTimeout(() => {
      showToolTip.value = false;
    }, 4000); // Тултип будет отображаться 4 секунды
  } else {
    dialogCreate.value = true;
  }
};

const logout = () => {
  store.dispatch('master/logout');
}

onMounted(async () => {
  if (clubId.value) {
    const data = await store.dispatch('club/getClubById', clubId.value);
    if (data) {
      clubData.value = data;
      clubText.value = `${t('profile.buttons.lblClub')} ${clubData.value.name}`;
      isOwner.value = master.value && master.value.userData.id === clubData.value.owner;
    } else {
      clubText.value = t('profile.buttons.lblClubError') ;
    }
  }
});

</script>

<style scoped>
.buttons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 15px 20px 0 20px;
}

.profile-btn {
  width: 100%;
  height: 50px;
  margin: 5px 0;
  max-width: 500px;
  justify-content: flex-start;
  text-align: left;
  color: white;
  cursor: pointer;
}

.profile-btn :deep(.v-btn__content) {
  justify-content: flex-start !important;
}

.custom-icon {
  width: 15px;
  height: 15px;
  margin-right: 10px;
}

.create-club-btn {
  color: white;
  position: absolute;
  right: 0;
  height: 50px;
  font-size: 0.7em;
  padding-left: 20px;
  clip-path: polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%);
  background-color: var(--gray2) !important;
  border-radius: 0 4px 4px 0 !important;
  opacity: 0.5;
}


.sufficient-balance {
  background-color: var(--primary-color) !important;
  opacity: 1;
}


.split-button-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  height: 50px;
  margin: 5px 0 10px 0;
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
}

.club-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
}

@media (max-width: 600px) {
  .club-text {
    width: 200px;
  }
}
</style>
