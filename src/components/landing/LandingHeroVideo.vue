<template>
  <!-- Фон первого экрана: заставка + беззвучная петля + затемнение.
       Сидит ПОД текстом (z-index -1 внутри .page, см. landing.css) и выше общего
       фона-вихря, который при этом не тронут. Читалкам экрана не нужен. -->
  <div ref="rootRef" class="hero-bg" aria-hidden="true">
    <!-- Заставка — первый кадр петли, поэтому подмена на видео не заметна.
         Лежит всегда: под «уменьшить движение», до первого кадра видео и там,
         где автозапуск запрещён (экономия энергии на iPhone). -->
    <picture>
      <source :media="PHONE_QUERY" :srcset="POSTER.phone">
      <img
        class="hero-bg__media hero-bg__poster"
        :src="POSTER.src"
        :srcset="POSTER.srcset"
        sizes="100vw"
        alt=""
        decoding="async"
        fetchpriority="high"
      >
    </picture>

    <!-- При «уменьшить движение» видео не создаётся вовсе — файл не качается. -->
    <video
      v-if="!reduce"
      :key="loopName"
      ref="vidRef"
      class="hero-bg__media hero-bg__video"
      :class="{ 'is-on': ready }"
      muted
      loop
      playsinline
      preload="auto"
      disablepictureinpicture
      tabindex="-1"
    >
      <source v-for="s in sources" :key="s.src" :src="s.src" :type="s.type">
    </video>

    <div class="hero-bg__dim"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { POSTER, PHONE_QUERY, MID_QUERY, pickLoopName, loopSources } from '@/data/heroLoop.js';

const props = defineProps({
  /** Пауза снаружи — пока открыто окно полного трейлера. */
  paused: { type: Boolean, default: false },
});
/** frame(t) — на каждый показанный кадр: t — время петли, секунды.
    reset — видео пропало (включили «уменьшить движение»), эффекты снять. */
const emit = defineEmits(['frame', 'reset']);

const rootRef = ref(null);
const vidRef = ref(null);
const ready = ref(false);
const loopName = ref(pickLoopName());
const sources = computed(() => loopSources(loopName.value));

const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduce = ref(reduceMq.matches);
const onReduce = () => { reduce.value = reduceMq.matches; };

/* Играет только пока первый экран на виду, вкладка открыта и окно трейлера
   закрыто. Остальное время — пауза: ни декодирования, ни батареи. */
let inView = true;
let docVisible = !document.hidden;
let io = null;
let boundEl = null;
let rvfcId = 0;
let rafId = 0;

function shouldPlay() {
  return inView && docVisible && !props.paused && !reduce.value;
}

function apply() {
  const el = boundEl;
  if (!el) return;
  if (shouldPlay()) {
    const p = el.play();
    // Автозапуск запрещён (энергосбережение) — остаётся заставка, это норма.
    if (p && p.catch) p.catch(() => {});
  } else {
    el.pause();
  }
}

function onFrame(t) {
  if (!ready.value) ready.value = true;
  emit('frame', t);
}

function startRaf() {
  cancelAnimationFrame(rafId);
  const tick = () => {
    if (boundEl) onFrame(boundEl.currentTime);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}
function stopRaf() { cancelAnimationFrame(rafId); }

function unbind() {
  if (boundEl) {
    if (rvfcId && boundEl.cancelVideoFrameCallback) boundEl.cancelVideoFrameCallback(rvfcId);
    boundEl.removeEventListener('playing', startRaf);
    boundEl.removeEventListener('pause', stopRaf);
  }
  stopRaf();
  rvfcId = 0;
  boundEl = null;
}

/* Время для эффектов берётся у самого кадра: requestVideoFrameCallback отдаёт
   mediaTime показанного кадра, поэтому знак и удар слова садятся на картинку, а
   не «примерно туда». Где его нет — currentTime раз в кадр отрисовки. */
function bind(el) {
  unbind();
  ready.value = false;
  if (!el) { emit('reset'); return; }
  boundEl = el;
  el.muted = true;
  el.defaultMuted = true;
  if ('requestVideoFrameCallback' in el) {
    const cb = (_now, meta) => {
      onFrame(meta.mediaTime);
      rvfcId = el.requestVideoFrameCallback(cb);
    };
    rvfcId = el.requestVideoFrameCallback(cb);
  } else {
    el.addEventListener('playing', startRaf);
    el.addEventListener('pause', stopRaf);
  }
  apply();
}

watch(vidRef, (el) => bind(el), { flush: 'post' });
watch(() => props.paused, apply);
watch(reduce, apply);

function onVisibility() {
  docVisible = !document.hidden;
  apply();
}

/* Экран повернули или окно растянули через границу раскладки — берём другой
   файл. Ключ на <video> пересоздаёт элемент, bind() подхватит новый. */
const mqs = [window.matchMedia(PHONE_QUERY), window.matchMedia(MID_QUERY)];
const onLayoutChange = () => { loopName.value = pickLoopName(); };

onMounted(() => {
  reduceMq.addEventListener('change', onReduce);
  mqs.forEach((m) => m.addEventListener('change', onLayoutChange));
  document.addEventListener('visibilitychange', onVisibility);
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      apply();
    }, { threshold: 0 });
    io.observe(rootRef.value);
  }
});

onBeforeUnmount(() => {
  reduceMq.removeEventListener('change', onReduce);
  mqs.forEach((m) => m.removeEventListener('change', onLayoutChange));
  document.removeEventListener('visibilitychange', onVisibility);
  if (io) io.disconnect();
  unbind();
});
</script>
