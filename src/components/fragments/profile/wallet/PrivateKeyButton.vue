<template>
  <div class="private-key-container">
    <VBtn class="private-key-btn" @mousedown="startHold" @mouseup="endHold" @mouseleave="endHold">
       Приватный ключ
      <template #append>
        <span class="countdown" v-if="countdown > 0">{{ countdown }}</span>
      </template>
    </VBtn>

    <VModal v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="headline">{{ showKey ? 'Private Key' : 'Confirm Action' }}</v-card-title>
        <v-card-text>
          <div v-if="showKey">
            <p>Ваш приватный ключ: {{ privateKey }}</p>
            <v-btn @click="copyToClipboard">
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </div>
          <div v-else>
            Показать приватный ключ?
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn v-if="!showKey" color="blue darken-1" @click="dialog = false">Отмена</v-btn>
          <v-btn v-if="!showKey" color="red darken-1" @click="showPrivateKey">Показать</v-btn>
          <v-btn v-if="showKey" color="green darken-1" @click="hidePrivateKey">OK</v-btn>
        </v-card-actions>
      </v-card>
    </VModal>
  </div>
</template>

<script setup>
import {ref, watch} from 'vue';
import {useClipboard} from '@vueuse/core';

const isGeneratedWallet = ref(true); // Измените это значение в зависимости от типа кошелька
const dialog = ref(false);
const showKey = ref(false);
const privateKey = ref('0xabcdef1234567890'); // Пример приватного ключа
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
  margin-top: 15px;
}

.private-key-btn {
  color: white;
  cursor: pointer;
  position: relative;
  padding: 0 30px;
}

.countdown {
  display: inline-block;
  font-size: 1.2rem;
  color: white;
  position: absolute;
  right: 15px; /* Позиционирование отсчета внутри кнопки */
}
</style>
