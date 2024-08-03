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
import {computed, ref, watch} from 'vue';
import InputField from "@/components/ui/InputField.vue";
import PrivateKeyButton from "@/components/fragments/profile/wallet/PrivateKeyButton.vue";
import store from "@/core/state/store.js";

const walletAddress = ref(null);

const copyToClipboard = () => {
  navigator.clipboard.writeText(walletAddress.value).then(() => {
    alert('Адрес кошелька скопирован в буфер обмена');
  }).catch(err => {
    console.error('Ошибка при копировании в буфер обмена: ', err);
  });
};


const master = computed(() => store.getters['master/getMaster']);

watch(() => master.value.userData.walletAddress, (address) => {
  walletAddress.value = address;
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
