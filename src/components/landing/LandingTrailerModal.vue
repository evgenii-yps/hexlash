<template>
  <!-- Окно полного трейлера со звуком. Создаётся ТОЛЬКО по нажатию (v-if в
       MarketingView), поэтому 16 МБ видео до клика не запрашиваются вовсе.
       Закрытие — крестик, Esc, нажатие на тёмный фон. -->
  <div
    ref="rootRef"
    class="trailer"
    role="dialog"
    aria-modal="true"
    :aria-label="t.landing.trailer.dialog"
    @click.self="$emit('close')"
  >
    <button
      ref="closeRef"
      class="trailer__close"
      type="button"
      :aria-label="t.landing.trailer.close"
      @click="$emit('close')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
    </button>

    <!-- Источник задан без type: файл один и это H.264+AAC, а браузер сам
         разберёт контейнер. Автозапуск со звуком разрешён — окно открыто
         нажатием игрока. -->
    <div class="trailer__frame">
      <video
        ref="vidRef"
        class="trailer__video"
        :src="TRAILER_SRC"
        controls
        controlslist="nodownload"
        autoplay
        playsinline
        preload="auto"
        @canplay="state = 'ready'"
        @playing="state = 'ready'"
        @error="state = 'error'"
      ></video>
      <div v-if="state === 'loading'" class="trailer__wait" role="status">
        <span class="trailer__spin" aria-hidden="true"></span>
      </div>
      <p v-else-if="state === 'error'" class="trailer__fail" role="alert">{{ t.landing.trailer.error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { t } from '@/locales/index.js';
import { TRAILER_SRC } from '@/data/heroLoop.js';

const emit = defineEmits(['close']);

const rootRef = ref(null);
const closeRef = ref(null);
const vidRef = ref(null);
const state = ref('loading');

let opener = null;

/* Esc слушаем на окне, а не на элементе: фокус может стоять на самом видео, и
   тогда событие до корня не дошло бы. */
function onKey(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    emit('close');
  }
  // Минимальная ловушка фокуса: Tab ходит между крестиком и плеером.
  if (e.key === 'Tab' && rootRef.value) {
    const items = [closeRef.value, vidRef.value].filter(Boolean);
    const i = items.indexOf(document.activeElement);
    const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
    e.preventDefault();
    items[next].focus();
  }
}

onMounted(() => {
  opener = document.activeElement;
  // Прокрутку страницы держит класс на <html>, правило — в landing.css.
  document.documentElement.classList.add('lp-lock');
  window.addEventListener('keydown', onKey);
  if (closeRef.value) closeRef.value.focus({ preventScroll: true });
  const v = vidRef.value;
  if (v) {
    v.muted = false;
    const p = v.play();
    // Звук заблокирован — игрок нажмёт play в обычных кнопках плеера.
    if (p && p.catch) p.catch(() => {});
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  document.documentElement.classList.remove('lp-lock');
  // После закрытия видео ОСТАНАВЛИВАЕТСЯ и отпускает файл: иначе звук продолжал
  // бы идти из закрытого окна.
  const v = vidRef.value;
  if (v) {
    v.pause();
    v.removeAttribute('src');
    v.load();
  }
  if (opener && opener.focus) opener.focus({ preventScroll: true });
});
</script>
