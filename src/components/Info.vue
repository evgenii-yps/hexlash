<template>
    <v-snackbar
        class="snackbar"
        v-model="snackbarVisible"
        :timeout="timeout"
        :multi-line="multiLine">
      <div class="content-html">{{ text }}</div>

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
  set: () => store.commit('master/clearInfoMessage')
});

const btnClose = () => {
  store.commit('master/clearInfoMessage');
};
</script>

<style scoped>
.btn-close {
  cursor: pointer;
  background-color: var(--pink);
  border-radius: var(--r-round);
  color: var(--ink) !important;
  margin: 8px;
  width: 44px;
  height: 44px;
  font-size: 1.3em;
}

.snackbar {
  bottom: 15vh;
}

:deep(.v-snackbar__content) {
  font-size: 1em;
}

.snackbar :deep(.v-snackbar__wrapper) {
  background-color: var(--void);
  border: 1px solid var(--line-strong);
}
</style>
