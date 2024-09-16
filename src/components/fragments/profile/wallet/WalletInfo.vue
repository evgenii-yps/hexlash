<template>
  <div class="wallet-info">

    <InputField
        :label="t('profile.wallet.lblConnectedWalletAddress')"
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


  </div>
</template>

<script setup>
import {computed} from 'vue';
import InputField from "@/components/ui/InputField.vue";

import BuyButton from "@/components/fragments/profile/wallet/BuyTokens.vue";
import {useI18n} from "vue-i18n";
import {useWeb3ModalAccount} from "@web3modal/ethers/vue";

const { t } = useI18n({ useScope: 'global' })

const { address } = useWeb3ModalAccount();

// Создаем computed-свойство для отслеживания address
const walletAddress = computed(() => address.value);

const copyToClipboard = () => {
  navigator.clipboard.writeText(walletAddress.value).then(() => {
    alert(t('profile.wallet.msgWalletAddressCopied'));
  }).catch(err => {
    console.error(t('profile.wallet.msgCopyError', { error: err }));
  });
};

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
