<template>
  <div class="wallet-info">

    <InputField
        label="CONNECTED WALLET ADDRESS"
        type="text"
        v-model="walletAddress"
        labelColor="var(--white)"
        labelSize="10px"
        inputBgColor="var(--black-opacity-80)"
        inputBorderColor="var(--gray1)"
        inputTextColor="var(--gray3)"
        padding="0.8rem"
        marginBottom="0.5rem"
        :showButton="true"
        :readonly="true"
    >
      <template v-slot>
        <div class="btn-container">
          <img src="@/assets/images/icon_copy.svg"
               @click="copyToClipboard"
               alt="" class="btn-copy-address"/>
        </div>

      </template>
    </InputField>


    <BuyButton />


  </div>
</template>

<script setup>
import {ref, watch} from 'vue';
import InputField from "@/components/ui/InputField.vue";
import store from "@/core/state/store.js";
import {WalletTypes} from "@/core/models/userModel.js";
import BuyButton from "@/components/fragments/profile/wallet/BuyTokens.vue";

const walletAddress = ref(null);
const notImportWallet = ref(false);

const copyToClipboard = () => {
  navigator.clipboard.writeText(walletAddress.value).then(() => {
    alert('Адрес кошелька скопирован в буфер обмена');
  }).catch(err => {
    console.error('Ошибка при копировании в буфер обмена: ', err);
  });
};


watch(store.getters['master/getMaster'], (master) => {
  if (master && master.userData) {
    walletAddress.value = master.userData.walletAddress;
    notImportWallet.value = master.userData.walletType === WalletTypes.GENERATED;
  }
}, {immediate: true});

</script>

<style scoped>
.wallet-info {
  color: white;
  display: block;
  max-width: 500px;
  margin: 2rem auto 0 auto;
}


.btn-container {
  margin: 0 20px;
  cursor: pointer;
}

</style>
