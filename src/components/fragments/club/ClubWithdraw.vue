<template>
  <VBtnDark
      class="club-btn"
      @click="dialogWithdraw = true">
    <template #prepend>
      <v-tooltip
          v-model="showToolTip"
          location="top"
          max-width="250px"
          contentClass="v-tooltip__content">
        <template #activator="{ props }">
          <img v-bind="props" @click.stop="toggleToolTip" src="@/assets/images/icon_tokens.svg" alt="" class="custom-icon"/>
        </template>
        <span>{{ t('club.lblWithdrawTooltip') }}</span>
      </v-tooltip>
    </template>
    {{ t('club.lblClubTokens') }}
    <template #append>
      <span class="custom-icon"/>
      <span style="right: 0; position: absolute;">{{ balance }}$</span>
    </template>
  </VBtnDark>

  <VModal v-model="dialogWithdraw" max-width="500" @click:outside="hide">
    <VCard>
      <v-card-title class="headline">{{ t('club.lblTokensWithdraw') }}</v-card-title>
      <v-card-text class="text-center">

        <v-text-field
            :label="t('club.lblWallet')"
            v-model="wallet"
            class="wallet-field"
        >
        </v-text-field>

        <v-text-field
            :label="t('club.lblAmount')"
            v-model="amount"
            class="amount-field"
            @input="updateAmount"
        >
        </v-text-field>

        <div class="loader-container">
          <v-progress-circular
              v-if="loading"
              class="loader"
              size="40"
              indeterminate
          />

          <div v-else class="calculation-result">
            <span>{{ t('club.lblCalculationResult') }} </span> {{ calculatedFC }} <span>{{ t('club.lblFCTokens') }}</span>
            <p class="notice">{{ t('club.lblNotice') }}</p>
          </div>
        </div>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <VBtnDark @click="hide" class="cancel-btn">{{ t('modal.btnCancel') }}</VBtnDark>
        <VBtn @click="btnWithdraw" class="confirm-btn">{{ t('club.lblWithdraw') }}</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue';
import debounce from "debounce";
import {useI18n} from "vue-i18n";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import store from "@/core/state/store.js";

const {t} = useI18n({useScope: 'global'})

const props = defineProps({
  balance: {
    type: String,
    required: true,
    default: '0.00',
  },
  wallet:{
    type: String,
    required: true,
    default: "",
  }
});

const dialogWithdraw = ref(false);
const amount = ref(parseFloat(props.balance));
const wallet = ref(props.wallet);
const calculatedFC = ref(0);
const loading = ref(false);
const showToolTip = ref(false);

const hide = () => {
  dialogWithdraw.value = false;
};

const btnWithdraw = () => {
  dialogWithdraw.value = true;
  calculateFC();

  const withdraw = InfoMessageModel.withTimeout(t('info.withdrawClubDisable'), 3000);
  store.commit('master/setInfoMessage', withdraw);

  // TODO Сделать заявки на вывод
};

const updateAmount = debounce(async () => {
  calculateFC();
}, 500);

const calculateFC = () => {
  const amountAfterFee = amount.value - (amount.value * 0.03); // Вычет 3% комиссии
  calculatedFC.value = amountAfterFee.toFixed(2);
};

const toggleToolTip = () => {
  showToolTip.value = !showToolTip.value;
};

onMounted(() => {
  calculateFC();
});

watch(amount, calculateFC);
</script>


<style scoped>
.club-btn {
  height: 50px !important;
  margin: 15px auto;
  width: 80%;
  max-width: 500px;
  justify-content: space-between;
  text-align: center;
  color: white;
  cursor: pointer;
  display: flex;
  background-color: var(--gray1) !important;
}

.club-btn span {
  font-size: 1.5em;
  margin-right: 5px
}

.text-center {
  padding: 24px 24px 4px;
  justify-content: center;
}


.wallet-field{
  margin-bottom: 20px;
}

.amount-field :deep(.v-text-field__prefix) {
  color: white !important;
}

.amount-field :deep(.v-input__control .v-field__input) {
  font-size: 1.4rem !important; /* Adjust the size as needed */
}

.loader-container {
  display: flex;
  justify-content: center; /* Центрирование по горизонтали */
  align-items: center; /* Центрирование по вертикали */
  margin-top: 20px;
}


.calculation-result {
  text-align: center;
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-top: 10px;
}

.calculation-result span {
  color: var(--gray2);
  font-size: 1.2rem;
}

.notice{
  font-size: 0.5em;
  color: var(--gray2);
  margin-top: 10px;
}

</style>
