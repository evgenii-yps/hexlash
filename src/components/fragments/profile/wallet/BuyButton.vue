<template>
  <div class="buy-button-container">
    <VBtn class="buy-btn" @click="btnBuy">
      Top Up Balance
    </VBtn>

    <VModal v-model="dialog" max-width="500" @click:outside="hide">
      <VCard>
        <v-card-title class="headline">Buy FC tokens</v-card-title>
        <v-card-text class="text-center">

          <v-select
              class="custom-select"
              color="white"
              bg-color="var(--black-opacity)"
              label="Select token"
              :items="['Ethereum', 'USDT (ERC20)', 'USDC (ERC20)', 'DAI (ERC20)']"
              v-model="selectedToken"
              @change="updateToken"
          />

          <v-text-field
              label="Amount"
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
              <span>You will get </span> {{ calculatedFC }} <span>FC tokens</span>
            </div>
          </div>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <VBtnDark @click="dialog = false" class="cancel-btn">Отмена</VBtnDark>
          <VBtn @click="hide" class="confirm-btn">Buy</VBtn>
        </v-card-actions>
      </VCard>
    </VModal>
  </div>
</template>

<script setup>
import {ref, watch} from 'vue';
import debounce from "debounce";

const dialog = ref(false);
const amount = ref(50.00);
const selectedToken = ref('USDT (ERC20)');
const calculatedFC = ref(0);
const loading = ref(false);

const hide = () => {
  dialog.value = false;
};

const btnBuy = () => {
  dialog.value = true;
  calculateFC();
};

const updateToken = async () => {
  if (selectedToken.value === 'Ethereum') {
    amount.value = 0.10;
  } else {
    amount.value = 50.00;
  }
};

const updateAmount = debounce(async () => {
  calculateFC();
}, 500);


const calculateFC = () => {
  loading.value = true;
  setTimeout(() => {
    const rate = selectedToken.value === 'Ethereum' ? 1000 : 1; // Пример курса
    calculatedFC.value = (amount.value * rate).toFixed(2);
    loading.value = false;
  }, 1000);
};

watch(selectedToken, updateAmount);
watch(amount, calculateFC);

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
  font-size: 0.8rem;
  padding: 0 30px;
  color: var(--white);
}

.text-center {
  padding: 24px 24px 4px;
  justify-content: center;
}





/* Apply opacity to input elements inside v-select */
.custom-select :deep(.v-field .v-field__input > input) {
  opacity: 0 !important;
}

.amount-field :deep(.v-text-field__prefix) {
  color: white !important;
}

.amount-field .v-input__control .v-field__input {
  font-size: 1.4rem !important; /* Adjust the size as needed */
}

.loader-container {
  display: flex;
  justify-content: center; /* Центрирование по горизонтали */
  align-items: center; /* Центрирование по вертикали */
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

</style>
