<template>
  <VCard class="wallet-card">
    <h3>{{ t('profile.wallet.lblWalletBalance') }}</h3>
    <p v-if="isConnected">{{ balance }}</p>
    <div
        v-else
        class="loader"
    >{{ t('profile.wallet.lblConnecting') }}</div>
    <img src="@/assets/images/icon_money_in.svg" alt=""/>
    <div class="desc">{{ t('profile.wallet.lblDepositToGame') }}</div>
  </VCard>
</template>

<script setup>
import {useI18n} from "vue-i18n";
const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  balance: {
    type: String,
    required: true
  },
  isConnected: {
    type: Boolean,
    required: true,
    default: false
  }
});
</script>

<style scoped>
.wallet-card {
  border: none !important;
  padding: 16px;
  width: 220px;
  text-align: center;
}

.wallet-card h3 {
  margin: 0 0 8px;
  font-size: 0.7em;
  text-align: center;
  text-transform: capitalize;
}

.wallet-card p {
  margin: 0;
  font-size: 2.5em;
  color: var(--primary-color);
}

.wallet-card img {
  margin-top: 1.5em;
  width: 40px;
}

.desc {
  font-size: 1em;
  color: white;
  padding: 10px 0 20px;
  text-align: center;
  width: 150px;
  margin: 0 auto;
}

.loader{
  font-size: 1.3rem;
  color: var(--gray2);
  padding: 10px 0 20px;
}
</style>
