<template>
  <div class="background">
    <Card
        :title="title"
        bgColor="var(--black-opacity-80)"
        borderColor="var(--gray1)"
        textColor="var(--white)"
        :showCloseButton="false">

      <template #back>
        <!-- Кнопка "Назад" -->
        <BackButton style="margin-left: 0 !important;" :defaultRoute="backRef(route)"/>
      </template>

      <div class="help-content" v-html="content"></div>

    </Card>
  </div>
</template>

<script setup>
import Card from "@/components/ui/Card.vue";
import {ref, watch} from "vue";
import {useRoute} from "vue-router";
import {t} from "@/locales/index.js";
import BackButton from "@/components/ui/BackButton.vue";
import {backRef} from "@/router/index.js";


const route = useRoute();
const title = ref('');
const content = ref('');

watch(route, () => {
  title.value = route.name.toLowerCase();
  content.value = t.value.pages?.[title.value] || '';

}, {immediate: true});


</script>

<style scoped>
.background {
  position: fixed;
  width: 100%;
  height: 100%;
  background: url('@/assets/images/background_page.webp') no-repeat center center;
  background-size: cover;
  overflow: hidden;
}

.background::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /*  background: linear-gradient(to left top, black 35%, transparent 75%);*/
  z-index: 1;
}

Card {
  position: relative;
  z-index: 2;
  font-size: 0.9em;
}

.help-content :deep(ul) {
  list-style-type: none;
  padding: 0 10px;
}

.help-content :deep(li) {
  margin-top: 20px;
  margin-bottom: 20px; /* Увеличивает отступы между пунктами списка */
}

.help-content :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 1.4em;
}

.help-content :deep(h2) {
  margin: 10px 0;
}

.help-content :deep(p) {
  line-height: 1.4;
  font-size: 1.2em;
}

.help-content :deep(span) {
  color: var(--primary-color);
}

.help-content :deep(.margin-l-20) {
  margin-left: 20px;
}
</style>
