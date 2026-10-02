<template>
  <section class="hero" id="top">
    <!-- Фон первого экрана — петля. Играет по расписанию, а время кадра отдаёт
         наверх: по нему знак и слово делают удар (см. onFrame). -->
    <LandingHeroVideo :paused="bgPaused" @frame="onFrame" @reset="clearFx" />

    <!-- Голова: знак + заголовок в одной рамке. Знак стоит НАД словом и в покое
         невидим — он появляется только в тёмной паузе петли (по её времени), а
         при «уменьшить движение» стоит всегда (см. landing.css). -->
    <div ref="headRef" class="hero-head">
      <HexlashMark class="hero-mark" :size="240" sizes="240px" />

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
    </div>

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

    <!-- Слот нулевой высоты: кнопка встаёт под «мышку» (а на телефоне, где мышки
         нет, — под кнопки), но ничего из остального первого экрана не сдвигает. -->
    <div class="hero-watch-slot reveal" data-d="7">
      <button class="btn-ghost btn-watch" type="button" @click="$emit('watch')">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" /></svg>
        <span>{{ t.landing.hero.watchTrailer }}</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { DiscordIcon, ArrowIcon } from './icons.js';
import { HexlashMark } from '@/components/brand/hexlashMark.js';
import LandingHeroVideo from './LandingHeroVideo.vue';
import { loopFx } from '@/data/heroLoop.js';
import { t } from '@/locales/index.js';
// Кадры сбоя для слоя .glow. Их набор общий с объёмной вывеской в коридоре
// сцены, поэтому живёт одной таблицей в src/data/signFlicker.js, а не вторым
// блоком @keyframes в landing.css — см. комментарий на месте, где он стоял.
import { installFlickerKeyframes } from '@/data/signFlicker.js';
installFlickerKeyframes();

defineProps({
  /** Окно полного трейлера открыто — фон стоит на паузе. */
  bgPaused: { type: Boolean, default: false },
});
defineEmits(['play', 'watch']);

const headRef = ref(null);
let fxOn = false;

/* Удар. Переменные читают стили (.hero-mark, .headline в landing.css); тут
   только их значения по времени петли. Снаружи окна эффекта страница лежит в
   покое без единой записи в DOM. */
function onFrame(time) {
  const el = headRef.value;
  if (!el) return;
  const fx = loopFx(time);
  if (!fx.active) {
    if (fxOn) clearFx();
    return;
  }
  fxOn = true;
  el.style.setProperty('--word-s', fx.word.toFixed(4));
  el.style.setProperty('--mark-s', fx.mark.toFixed(4));
  el.style.setProperty('--mark-a', fx.alpha.toFixed(3));
}

function clearFx() {
  const el = headRef.value;
  fxOn = false;
  if (!el) return;
  el.style.removeProperty('--word-s');
  el.style.removeProperty('--mark-s');
  el.style.removeProperty('--mark-a');
}
</script>
