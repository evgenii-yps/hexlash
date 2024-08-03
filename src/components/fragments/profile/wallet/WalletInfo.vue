<template>
  <div class="wallet-info">

    <InputField
        label="WALLET ADDRESS"
        type="text"
        v-model="walletAddress"
        labelColor="var(--white)"
        labelSize="10px"
        inputBgColor="var(--black-opacity-60)"
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


    <PrivateKeyButton/>


  </div>
</template>

<script setup>
import {ref} from 'vue';
import InputField from "@/components/ui/InputField.vue";
import PrivateKeyButton from "@/components/fragments/profile/wallet/PrivateKeyButton.vue";

const walletAddress = ref('0x434a1253bAf9EE7552fd6b0Af973B7E312cb5fCf');
const walletBalance = ref('100');

const copyToClipboard = () => {
  navigator.clipboard.writeText(walletAddress.value).then(() => {
    alert('Адрес кошелька скопирован в буфер обмена');
  }).catch(err => {
    console.error('Ошибка при копировании в буфер обмена: ', err);
  });
};

const depositToGame = () => {
  // Логика для заведения средств в игру
};

const withdrawToWallet = () => {
  // Логика для вывода средств на кошелек
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
