<template>
  <div class="background">
    <Card
        :title="pageName"
        bgColor="var(--black-opacity-80)"
        borderColor="var(--gray1)"
        textColor="var(--white)"
        :showCloseButton="false">

      <template #back>
        <!-- Кнопка "Назад" -->
        <BackButton :defaultRoute="backRef()" />
      </template>

      <div v-html="content"></div>

    </Card>
  </div>
</template>

<script setup>
import Card from "@/components/ui/Card.vue";
import {ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import BackButton from "@/components/ui/BackButton.vue";
import {getPreviousRoute} from "@/router/index.js";
const { t } = useI18n({ useScope: 'global' })


const route = useRoute();
const content = ref('' );
const pageName = route.name.toLowerCase();

watch(route, () => {
  const pageName = route.name.toLowerCase();
  content.value = t(`pages.${pageName}`);

}, { immediate: true });

function backRef(){
  const back = route.query.back;

  if (back) {
    // Если параметр 'ref' есть, возвращаем его
    return back.charAt(0).toUpperCase() + back.slice(1);
  } else {
    // Если параметра 'ref' нет, возвращаем предпоследний маршрут
    return getPreviousRoute();
  }
}


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
</style>
