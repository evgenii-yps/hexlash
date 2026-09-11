<template>
  <section class="sec sec-gameplay" id="gameplay">
    <div class="wrap">
      <div class="eyebrow" data-reveal>
        <span class="eyebrow-line"></span>
        <span>FIRST LOOK</span>
      </div>
      <h2 class="big-title" data-reveal data-d="1">GAMEPLAY</h2>

      <!-- Лор идёт СЛОЕМ во весь экран внутри этого блока, а не отдельной
           страницей, и пункта в меню шапки под него нет (решение владельца
           11.09.2026).
           Метка — та же деталь .eyebrow, что у FIRST LOOK, второго набора чисел
           не заводим. Выравнивание — по центру, как у соседей по блоку; своих
           модификаторов выравнивания у этой части нет. -->
      <div class="eyebrow world-eyebrow" data-reveal data-d="1">
        <span class="eyebrow-line"></span>
        <span>THE WORLD</span>
      </div>
      <p class="world-lead" data-reveal data-d="2">A world that solved war by putting it in a frame. Every dispute — land, contracts, old grudges — is settled by a single fight. Nobody sends armies anymore. They send fighters they made, and those fighters learned to think.</p>
      <div class="world-cta-row" data-reveal data-d="2">
        <button type="button" class="btn-ghost world-cta" @click="worldOpen = true">
          <span>ENTER THE WORLD</span>
        </button>
      </div>

      <div class="player" data-reveal data-d="2">
        <span class="player-hex-bg"></span>
        <span class="player-scan"></span>
        <span class="hud-c tl"></span><span class="hud-c tr"></span>
        <span class="hud-c bl"></span><span class="hud-c br"></span>
        <button class="play-hex" aria-label="Video incoming">
          <span class="play-hex-shape"><PlayIcon /></span>
        </button>
        <span class="player-label">VIDEO INCOMING</span>
        <span class="player-bar"><i></i></span>
        <span class="player-rec"><b></b>REC · STANDBY</span>
      </div>
      <p class="player-cap" data-reveal data-d="3">First match recordings drop with the next release.</p>
    </div>

    <LandingWorldModal :open="worldOpen" @close="worldOpen = false" />
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { PlayIcon } from './icons.js';
import LandingWorldModal from './LandingWorldModal.vue';

const worldOpen = ref(false);
</script>
