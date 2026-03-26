<template>
  <div class="wallet-info">

    <InputField
        :label="t.profile.wallet.lblConnectedWalletAddress"
        type="text"
        v-model="walletAddress"
        labelColor="var(--hex-text-primary)"
        labelSize="0.5rem"
        inputBgColor="var(--hex-bg-card)"
        inputBorderColor="var(--hex-border-default)"
        inputTextColor="var(--hex-text-muted)"
        height="40px"
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
import {t, interpolate} from "@/locales/index.js";
import {useWeb3ModalAccount} from "@web3modal/ethers/vue";

const { address } = useWeb3ModalAccount();

// Создаем computed-свойство для отслеживания address
const walletAddress = computed(() => address.value);

const copyToClipboard = () => {
  navigator.clipboard.writeText(walletAddress.value).then(() => {
    alert(t.value.profile.wallet.msgWalletAddressCopied);
  }).catch(err => {
    console.error(interpolate(t.value.profile.wallet.msgCopyError, { error: err }));
  });
};

</script>

<style scoped>
.wallet-info {
  color: white;
  display: block;
  max-width: 500px;
  margin: 1.5rem auto 0 auto;
}


.btn-container {
  margin: 0 12px 0 0;
  cursor: pointer;
  align-items: center;
  display: flex;
}

</style>
