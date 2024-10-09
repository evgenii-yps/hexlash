<template>
  <div class="container">
    <p>{{ t('arena.lblSearchOpponent') }}</p>
    <v-progress-circular
        class="loader"
        size="30"
        indeterminate
    />
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'});


</script>

<style scoped>
.container {
  position: fixed;
  right: 10px;
  bottom: 10vh;
  background-color: var(--dark);
  border: 1px solid var(--gray2);
  padding: 10px;
  display: flex;
  align-items: center;
}

p {
  margin: 0 10px 0 0;
  color: white;
}

.loader {
  color: var(--gray2);
}

</style>
