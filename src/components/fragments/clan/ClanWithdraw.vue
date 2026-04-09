<!-- ClanWithdraw — feature disabled, preserved for future reactivation. Visual System v1.0 compliant (ТЗ #6). -->
<template>
  <VBtnDark
      class="clan-btn"
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
        <span>{{ t.clan.lblWithdrawTooltip }}</span>
      </v-tooltip>
    </template>
    {{ t.clan.lblClanTokens }}
    <template #append>
      <span class="custom-icon"/>
      <span style="right: 0; position: absolute;">{{ balance }}$</span>
    </template>
  </VBtnDark>

  <VModal v-model="dialogWithdraw" max-width="500" @click:outside="hide">
    <VCard>
      <v-card-title class="headline">{{ t.clan.lblTokensWithdraw }}</v-card-title>
      <v-card-text class="text-center">

        <v-text-field
            :label="t.clan.lblWallet"
            v-model="wallet"
            class="wallet-field"
        >
        </v-text-field>

        <v-text-field
            :label="t.clan.lblAmount"
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
            <span>{{ t.clan.lblCalculationResult }} </span> {{ calculatedFC }} <span>{{ t.clan.lblFCTokens }}</span>
            <p class="notice">{{ t.clan.lblNotice }}</p>
          </div>
        </div>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <VBtnDark @click="hide" class="cancel-btn">{{ t.modal.btnCancel }}</VBtnDark>
        <VBtn @click="btnWithdraw" class="confirm-btn">{{ t.clan.lblWithdraw }}</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue';
import debounce from "debounce";
import {t} from "@/locales/index.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import store from "@/core/state/store.js";

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

  const withdraw = InfoMessageModel.withTimeout(t.value.info.withdrawClanDisable, 3000);
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
.clan-btn {
  height: 50px !important;
  margin: 15px auto;
  width: 80%;
  max-width: 500px;
  justify-content: space-between;
  text-align: center;
  color: var(--hex-text-primary);
  cursor: pointer;
  display: flex;
  background-color: var(--hex-bg-light) !important;
}

.clan-btn span {
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
  margin-top: 10px;
}

.calculation-result span {
  color: var(--hex-text-secondary);
  font-size: 1.2rem;
}

.notice{
  font-size: 0.5em;
  color: var(--hex-text-secondary);
  margin-top: 10px;
}

</style>
