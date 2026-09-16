<!-- ChainInterrupted — «RUN INTERRUPTED». Короткое сообщение о том, что прошлый
     ЗАБЕГ не доигран: обновили страницу, закрыли вкладку, ушли кнопкой «назад».

     ПОЧЕМУ ЗДЕСЬ, А НЕ НА АРЕНЕ. Игрок после брошенного забега оказывается в
     воротах — арена его туда и уводит. Показывать сообщение на арене значило бы
     показать его за миг до ухода с неё. Поэтому уводит одна сторона, а говорит
     другая: отметку забирает тот, кто показывает, — и сообщение не может ни
     потеряться при переходе, ни выйти дважды.

     ⚠️ ДЕКА. Страница-дека держит арену в своём окне, в ТОЙ ЖЕ вкладке и в той
     же памяти. Без оговорки инвестору выпало бы «RUN INTERRUPTED» от чужого
     забега — тот же урок, что с признаком показа (15.09). Признак сюда приходит
     снаружи: этот компонент не знает, где он стоит.

     Не блокирует: не ловит кликов, гаснет сам, дверь никуда не закрывает. -->
<template>
  <transition name="ci-fade">
    <p v-if="shown" class="chain-interrupted" role="status" @click="shown = false">
      {{ t.chain.interrupted }}
    </p>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { t } from '@/locales/index.js';
import { takeStaleRun } from '@/services/chainRun.js';

const props = defineProps({
  // Признак показа (дека). Приходит снаружи — компонент про своё место не знает.
  skip: { type: Boolean, default: false },
  // Сколько висит, прежде чем уйти само.
  holdMs: { type: Number, default: 4000 },
});

const shown = ref(false);
let timer = null;

onMounted(() => {
  // Забрать факт брошенного забега и стереть отметку. Второй раз вернёт false —
  // поэтому сообщение не может выйти дважды, даже если компонент стоит в двух
  // местах сразу.
  if (!takeStaleRun(props.skip)) return;
  shown.value = true;
  timer = setTimeout(() => { timer = null; shown.value = false; }, props.holdMs);
});

onBeforeUnmount(() => {
  if (timer) { clearTimeout(timer); timer = null; }
});
</script>

<style scoped>
/* Матовая строка сверху — сообщение о прошлом, а не призыв к действию.
   Ни розового, ни свечения: здесь ничего не происходит, здесь констатируют. */
.chain-interrupted {
  position: fixed; left: 50%; top: var(--sp-6); transform: translateX(-50%);
  z-index: var(--z-modal); margin: 0;
  padding: var(--sp-2) var(--sp-4);
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-wide); text-transform: uppercase;
  color: var(--ink-dim);
  background: color-mix(in srgb, var(--panel) 88%, transparent);
  border: 1px solid var(--line-strong);
  cursor: default;
}

.ci-fade-enter-active, .ci-fade-leave-active { transition: opacity var(--d-hover) var(--e-settle); }
.ci-fade-enter-from, .ci-fade-leave-to { opacity: 0; }

/* Системная «уменьшить движение»: появление без плавности, но сообщение остаётся. */
@media (prefers-reduced-motion: reduce) {
  .ci-fade-enter-active, .ci-fade-leave-active { transition: none; }
}
</style>
