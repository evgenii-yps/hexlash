<template>
  <div class="background">
    <Card
        title="Privacy"
        bgColor="var(--black-opacity-80)"
        borderColor="var(--gray1)"
        textColor="var(--white)"
        :showCloseButton="false"
    >
      <p>Контент внутри карточки</p>

    </Card>
  </div>
</template>

<script setup>
import Card from "@/components/ui/Card.vue";
import {ref} from "vue";
import {useRoute} from "vue-router";

const route = useRoute();
const pageContent = ref({ title: '', content: '' });
const pageName = route.name.toLowerCase();
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
}
</style>
