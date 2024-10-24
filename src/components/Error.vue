<template>
    <v-snackbar
        class="snackbar"
        v-model="snackbarVisible"
        :timeout="timeout"
        :multi-line="multiLine">
      <div class="content-html" v-html="text"/>

      <template v-if="showButton" v-slot:actions>
        <VBtn class="btn-close"  @click="btnClose">
          <img src="@/assets/images/icon_close.svg"  alt=""/>
        </VBtn>
      </template>
    </v-snackbar>
</template>

<script setup>
import {computed} from 'vue';
import store from "@/core/state/store.js";

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  timeout: {
    type: Number,
    default: 2000
  },
  showButton: {
    type: Boolean,
    default: false
  },
  multiLine: {
    type: Boolean,
    default: true
  }
});


const snackbarVisible = computed({
  get: () => props.text !== '',
  set: () => store.commit('master/clearErrorMessage')
});

const btnClose = () => {
  store.commit('master/clearErrorMessage');
};
</script>

<style scoped>
.btn-close {
  cursor: pointer;
  border-radius: 50%;
  color: white !important;
  margin: 10px;
  width: 40px;
  height: 40px;
  font-size: 1.3em;
}

.snackbar {
  bottom: 15vh;
  z-index: 10000 !important;
}

:deep(.v-snackbar__content) {
  font-size: 1em;
}

.snackbar :deep(.v-snackbar__wrapper) {
  background-color: #ff00002b !important;
  border: 1px solid var(--gray2);
}

:deep(.v-snackbar__content a) {
  color: var(--pink) !important;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.2em;
}

</style>
