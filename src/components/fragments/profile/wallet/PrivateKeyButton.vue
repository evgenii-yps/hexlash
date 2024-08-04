<template>
  <div class="private-key-container">
    <VBtnDark class="private-key-btn"  @mousedown="startHold" @mouseup="endHold" @mouseleave="endHold">
      Show private Key
      <template #append>
        <span class="countdown" v-if="countdown > 0">{{ countdown }}</span>
      </template>
    </VBtnDark>

    <VModal v-model="dialog" max-width="500" @click:outside="hidePrivateKey">
      <v-card>
        <v-card-title class="headline">{{ showKey ? 'Private Key' : 'Confirm Action' }}</v-card-title>
        <v-card-text class="text-center">
          <div v-if="showKey">
            {{ privateKey }}

            <VBtn @click="copyToClipboard" class="copy-btn" size="x-small">
              <img src="@/assets/images/icon_copy.svg"
                   @click="copyToClipboard"
               alt=""/>
            </VBtn>

          </div>
          <div v-else>
            Показать приватный ключ?
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <VBtnDark v-if="!showKey" @click="dialog = false" class="cancel-btn">Отмена</VBtnDark>
          <VBtn v-if="!showKey" @click="showPrivateKey" class="confirm-btn">Показать</VBtn>
          <VBtn v-if="showKey" @click="hidePrivateKey" class="confirm-btn">OK</VBtn>
        </v-card-actions>
      </v-card>
    </VModal>
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import {useClipboard} from '@vueuse/core';
import store from "@/core/state/store.js";

const isGeneratedWallet = ref(true); // Измените это значение в зависимости от типа кошелька
const dialog = ref(false);
const showKey = ref(false);
const privateKey = ref(''); // Пример приватного ключа
const countdown = ref(0);
const holdDuration = 3; // Длительность удержания в секундах

const {copy} = useClipboard();

let holdTimeout;

const startHold = () => {
  if (isGeneratedWallet.value) {
    countdown.value = holdDuration;
    holdTimeout = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(holdTimeout);
        dialog.value = true;
      }
    }, 1000);
  }
};

const endHold = () => {
  clearInterval(holdTimeout);
  countdown.value = 0;
};

const showPrivateKey = () => {
  // TODO Метод к апи для запроса приватного ключа
  showKey.value = true;
};

const hidePrivateKey = () => {
  showKey.value = false;
  dialog.value = false;
};

const copyToClipboard = async () => {
  try {
    await copy(privateKey.value);
    console.log('Private key copied to clipboard');
  } catch (error) {
    console.error('Failed to copy private key:', error);
  }
};





</script>

<style scoped>
.private-key-container {
  display: flex;
  flex-direction: column;
  align-items: center; /* Center content horizontally */
  justify-content: center; /* Center content vertically */
  text-align: center;
  margin-top: 20px;
}

.private-key-btn {
  cursor: pointer;
  position: relative;
  font-size: 0.8rem;
  padding: 0 30px;
  border: 1px solid var(--gray1);
  color: var(--gray2);
}

.countdown {
  display: inline-block;
  font-size: 1.2rem;
  color: white;
  position: absolute;
  right: 15px; /* Позиционирование отсчета внутри кнопки */
}

.copy-btn {
  border-radius: 50%;
  width: 35px;
  height: 35px;
  padding: 0;
  cursor: pointer;
}

.text-center {
  padding: 24px 24px 4px;
}

.cancel-btn {
  text-align: center;
  color: var(--gray2);
  cursor: pointer;
}


.confirm-btn{
  cursor: pointer;
  /* text-transform: none;*/
  background-color: var(--primary-color);
  color: white !important;
  margin: 10px;
}


</style>
