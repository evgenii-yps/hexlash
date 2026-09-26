<template>
  <section class="sec sec-gameplay" id="gameplay">
    <div class="wrap">
      <!-- ⚠️ 26.09.2026, по снимку владельца: блок пересобран.
           Сняты служебные метки FIRST LOOK и THE WORLD, заголовок уменьшен до
           сдержанного, а рамка-заглушка видео с подписью про записи матчей
           удалена целиком и ничем не заменена. Причина — блок был выше
           свободной высоты экрана и ужимался ЦЕЛИКОМ, из-за чего абзац и
           кнопка становились нечитаемо мелкими. Текст блока не менялся. -->
      <h2 class="big-title gameplay-title" data-reveal>GAMEPLAY</h2>

      <!-- Лор идёт СЛОЕМ во весь экран внутри этого блока, а не отдельной
           страницей, и пункта в меню шапки под него нет (решение владельца
           11.09.2026). -->
      <p class="world-lead" data-reveal data-d="1">A world that solved war by putting it in a frame. Every dispute — land, contracts, old grudges — is settled by a single fight. Nobody sends armies anymore. They send fighters they made, and those fighters learned to think.</p>
      <div class="world-cta-row" data-reveal data-d="2">
        <button type="button" class="btn-ghost world-cta" @click="worldOpen = true">
          <span>ENTER THE WORLD</span>
        </button>
      </div>
    </div>

    <LandingWorldModal :open="worldOpen" @close="worldOpen = false" />
  </section>
</template>

<script setup>
import { ref } from 'vue';
import LandingWorldModal from './LandingWorldModal.vue';

const worldOpen = ref(false);
</script>
