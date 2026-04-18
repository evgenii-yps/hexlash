<template>
  <div class="buy-button-container">
    <VBtn size="x-large" class="buy-btn" @click="btnModalBuy">
      {{ t.profile.wallet.lblTopUpBalance }}
    </VBtn>

    <VModal v-model="dialog" max-width="500" @click:outside="hide">
      <VCard>
        <v-card-title class="headline"> {{ t.profile.wallet.lblBuyFCTokens }}</v-card-title>
        <v-card-text class="text-center">

          <v-select
              class="custom-select"
              color="white"
              bg-color="var(--hex-bg-card)"
              :label="t.profile.wallet.lblSelectToken"
              :items="tokensAccepted"
              item-value="address"
              item-title="name"
              v-model="selectedToken"
              @change="updateToken"
          />
          <div class="userBalance">
            <span>{{ selectedTokenBalance }}</span>
          </div>
          <v-text-field
              :label="t.profile.wallet.lblAmount"
              v-model="localAmount"
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
              <span>{{ t.profile.wallet.lblYouWillGet }}</span> {{ calculatedAmount }}
              <span>{{ t.profile.wallet.lblFCTokens }}</span>
            </div>
          </div>

        </v-card-text>

        <div v-if="!hasSufficientBalance" class="balance-warning">
          {{ t.profile.wallet.lblInsufficientBalance }}
        </div>
        <div v-else-if="limitError" class="balance-warning">
          {{ limitError }}
        </div>

        <div v-if="errorTransaction" class="error-transaction">
          {{ errorTransaction }}
        </div>

        <div v-else class="progressing-info">

          <div v-if="loaderApproveTransaction" class="progressing-text-container">
            <div class="progressing-step">
              <v-progress-circular
                  v-if="loaderApproveTransaction"
                  class="loader"
                  size="20"
                  indeterminate/>
              {{ t.profile.wallet.approveExplainTitle }}
            </div>
            <div class="progressing-desc"> {{ t.profile.wallet.approveExplainDesc }}</div>
          </div>
          <div v-else-if="loaderPurchaseTransaction" class="progressing-text-container">
            <div class="progressing-step">
              <v-progress-circular
                  v-if="loaderPurchaseTransaction"
                  class="loader"
                  size="20"
                  indeterminate/>
              {{ t.profile.wallet.purchaseExplainTitle }}
            </div>
            <div class="progressing-desc"> {{ t.profile.wallet.purchaseExplainDesc }}</div>
          </div>


        </div>


        <v-card-actions>
          <div v-if="!loading && approvedAmount > 0 && approvedAmount !== BigInt(999999999999991)" class="balance-warning">
            {{ t.profile.wallet.approvedAmount }} {{ approvedAmount }}
          </div>
          <v-spacer></v-spacer>
          <VBtnDark v-if="!loaderApproveTransaction && !loaderPurchaseTransaction" @click="dialog = false" class="cancel-btn">{{ t.modal.btnCancel }}</VBtnDark>
          <VBtn :disabled="!hasSufficientBalance || limitError !== '' || loaderApproveTransaction || loaderPurchaseTransaction" @click="btnNext" class="confirm-btn">
            {{ t.modal.btnNext }}
          </VBtn>
        </v-card-actions>


      </VCard>
    </VModal>
  </div>
</template>

<script setup>
import store from "@/core/state/store.js";
import {computed, ref, watch} from 'vue';
import {t} from "@/locales/index.js";

import debounce from "debounce";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";

const dialog = ref(false);
const loading = ref(false);

const hide = () => {
  dialog.value = false;
};

const btnModalBuy = () => {
  dialog.value = true;
  store.dispatch("contract/fetchSelectedTokenBalance");
  calculateFC();
};

const btnNext = () => {
  if (localAmount.value > approvedAmount.value) {
    store.dispatch("contract/fetchSendApproveTransaction");
  } else {
    store.dispatch("contract/fetchSendPurchaseTransaction");
  }
};

const updateToken = async (tokenAddress) => {
  const token = tokensAccepted.value.find(t => t.address === tokenAddress);
  await store.dispatch("contract/updateToken", token);

  await store.dispatch("contract/fetchSelectedTokenBalance");

  // Меняем значение на рекомендованное для токена
  localAmount.value = token.initialAmount;
  await store.dispatch("contract/updateAmount", token.initialAmount);

  await calculateFC();
};

const updateAmount = debounce(async (amountContainer) => {
  const parsedAmount = parseFloat(amountContainer.target.value);
  if (!isNaN(parsedAmount)) {
    localAmount.value = parsedAmount;
    await store.dispatch("contract/updateAmount", parsedAmount);

    await calculateFC();
  }
}, 500);


const calculateFC = async () => {
  if (localAmount.value > 0) {
    loading.value = true;
    await store.dispatch("contract/calculateFC");

    // Check balance
    recalculateBalance();

    loading.value = false;
  }
};

const recalculateBalance = () => {
  hasSufficientBalance.value = selectedTokenBalance.value >= localAmount.value;
};


const tokensAccepted = computed(() => store.getters['contract/getTokensAccepted']);
const calculatedAmount = computed(() => store.getters['contract/getCalculatedFC']);
const selectedToken = computed({
  get: () => store.getters['contract/getSelectedToken'],
  set: (value) => updateToken(value)
});


const approvedAmount = computed(() => store.getters['contract/getApprovedAmount']);
const selectedTokenBalance = computed(() => store.getters['contract/getSelectedTokenBalance']);

const loaderApproveTransaction = computed(() => store.getters['contract/getLoaderApproveTransaction']);
const loaderPurchaseTransaction = computed(() => store.getters['contract/getLoaderPurchaseTransaction']);
const errorTransaction = computed(() => store.getters['contract/getTransactionError']);
const transactionSuccess = computed(() => store.getters['contract/getTransactionSuccess']);

const localAmount = ref(store.getters['contract/getAmount']);
const hasSufficientBalance = ref(false);
const limitError = ref('');


watch(transactionSuccess, (newValue) => {
  if (newValue) {
    // Закрываем модальное окно
    dialog.value = false;
    const successMessage = InfoMessageModel.withText(t.value.profile.wallet.successPurchase);
    store.commit('master/setInfoMessage', successMessage);

    // Сбрасываем флаг успешной транзакции
    store.commit('contract/setTransactionSuccess', false);
  }
});

watch(calculatedAmount, (newValue) => {
  if (newValue < 100 || newValue > 100000) {
    limitError.value = t.value.profile.wallet.checkLimits;
  } else {
    limitError.value = '';
  }
});
</script>

<style scoped>

.buy-button-container {
  display: flex;
  flex-direction: column;
  align-items: center; /* Center content horizontally */
  justify-content: center; /* Center content vertically */
  text-align: center;
  margin-top: 20px;
}

.buy-btn {
  cursor: pointer;
  position: relative;
  font-size: 1rem;
  width: 210px;
  height: 48px !important;
  padding: 0 25px;
  color: var(--hex-text-primary);
}

.text-center {
  padding: 24px 24px 4px;
  justify-content: center;
}


/* Apply opacity to input elements inside v-select */
.custom-select :deep(.v-field .v-field__input > input) {
  opacity: 0 !important;
}

.custom-select {
  margin-bottom: 0;
}

.amount-field :deep(.v-text-field__prefix) {
  color: var(--hex-text-primary) !important;
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
  color: var(--hex-text-primary);
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  margin-top: 12px;
}

.calculation-result span {
  color: var(--hex-text-secondary);
  font-size: 1.2rem;
}

.userBalance {
  color: var(--hex-text-secondary);
  font-size: 0.8rem;
  margin-bottom: 10px;
  margin-top: 5px;
  text-align: right;
}

.userBalance span {
  color: var(--hex-text-secondary);
  font-size: 0.9rem;
}

.balance-warning {
  color: var(--hex-text-secondary);
  font-size: 0.8rem;
  text-align: center;
  margin: 0 20px;
}

.error-transaction{
  color: var(--hex-danger);
  font-size: 0.8rem;
  text-align: center;
  margin: 0 20px;
}

.progressing-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
}

.progressing-text-container {
  display: flex;
  flex-direction: column;
  margin: 0 20px;
}

.progressing-step {
  margin-bottom: 5px;
  font-size: 1.2rem;
  color: var(--hex-text-secondary);
}

.progressing-desc {
  font-size: 0.8rem;
  color: var(--hex-text-secondary);
}


</style>
