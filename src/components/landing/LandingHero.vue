<template>
  <section class="hero" id="top">
    <!-- Заголовок — само имя бренда, одной строкой, живым текстом.
         .glow — копия слова, которая несёт ТОЛЬКО ореол (буквы у неё
         прозрачные). Мерцает она, а буквы стоят неподвижно: гаснет свет
         вывески, а не сама вывеска. Для читалок экрана копия скрыта. -->
    <h1 class="headline">
      <span class="line reveal" data-d="3">
        <span class="word">HEXLASH</span>
        <span class="glow" aria-hidden="true">HEXLASH</span>
      </span>
    </h1>

    <p class="lead reveal" data-d="5">{{ t.landing.hero.lead }}</p>
    <p class="lead-sub reveal" data-d="5">{{ t.landing.hero.leadSub }}</p>

    <div class="cta-row reveal" data-d="6">
      <a class="btn-play" href="#play" @click.prevent="$emit('play')">
        <span class="btn-play-bg"></span>
        <span class="btn-play-label">PLAY</span>
        <span class="btn-play-arrow"><ArrowIcon /></span>
      </a>
      <a class="btn-ghost" href="#discord">
        <DiscordIcon />
        <span>JOIN DISCORD</span>
      </a>
    </div>

    <a class="scrollcue reveal" data-d="7" href="#manifesto" aria-label="Scroll"><span></span></a>
  </section>
</template>

<script setup>
import { DiscordIcon, ArrowIcon } from './icons.js';
import { t } from '@/locales/index.js';
defineEmits(['play']);
</script>
