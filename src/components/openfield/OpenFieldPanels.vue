<!-- OpenFieldPanels — надписи ОТКРЫТОГО ПОЛЯ: счётчик живых сторон поверх боя и
     честное состояние «бойцов не хватает».

     ПОЧЕМУ СНАРУЖИ СЦЕНЫ. Арена — защищённый файл: в ней живут бой и моторика.
     Надписям там делать нечего. Отсюда они читают ход боя (openFieldRun) — сцена
     пишет, надписи читают, ни одна сторона не лезет внутрь другой. Ровно так же
     устроены панели турнира и забега.

     ИТОГА БОЯ ЗДЕСЬ НЕТ НАМЕРЕННО. Победа и место показываются ОБЩЕЙ панелью
     итога (FightResultPanel): открытое поле — обычный бой, просто на двадцать
     тел, и заводить ему вторую панель значило бы, что игра говорит про исход
     двумя голосами. Строку «Place N of M» туда кладёт арена — она одна знает
     место (см. titleOver в services/fightResult.js).

     ⚠️ СЧЁТЧИК — БЛОК, А НЕ СТРОКА. Под ним встанет строка лидера в работе
     «охота на лидера»: там же, тем же списком, теми же значениями. Поэтому это
     сразу `<dl>` с одной строкой, а не абзац — вторая строка добавляется одной
     вставкой и ничего не двигает.

     ВИД — как в межволновой панели турнира: тот же моноширинный шрифт, тот же
     кегль, та же разрядка, те же два цвета (подпись тусклее значения). Ни
     одного нового токена здесь нет — игрок уже знает, как выглядит эта строка. -->
<template>
  <!-- Счётчик живых сторон. Только пока дерутся: на панели итога он не нужен —
       там уже сказано, чем всё кончилось. -->
  <div v-if="showCount" class="of-hud" aria-live="polite">
    <dl class="of-rows">
      <div class="of-row">
        <dt>{{ t.openField.sidesLeft }}</dt>
        <dd>{{ sidesLeft }}</dd>
      </div>
      <!-- Сюда встанет строка лидера — работа «охота на лидера». -->
    </dl>
  </div>

  <!-- Бойцов не хватает. На поле не вышел никто, и дверь ровно одна. -->
  <ArenaPanel
    v-if="showShort"
    :title="shortTitle"
    :note="t.openField.shortNote"
    muted
  >
    <template #actions>
      <button type="button" class="ap-back" @click="onLeave">{{ t.openField.toGate }}</button>
    </template>
  </ArenaPanel>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { t, interpolate } from '@/locales/index.js';
import { openFieldState, endOpenField } from '@/services/openFieldRun.js';
import ArenaPanel from '@/components/panel/ArenaPanel.vue';
import '@/components/panel/panel.css';

const router = useRouter();

const sidesLeft = computed(() => openFieldState.sidesLeft);
const showCount = computed(() => openFieldState.active && openFieldState.phase === 'fight');
const showShort = computed(() => openFieldState.active && openFieldState.phase === 'short');

const shortTitle = computed(() => (openFieldState.shortBy === 1
  ? t.value.openField.needOne
  : interpolate(t.value.openField.needMany, { n: openFieldState.shortBy })));

function onLeave() {
  endOpenField();
  // НА ВТОРОЙ ШАГ ворот, а не на первый — то же правило, что у турнира: режим
  // игрок уже выбрал, и показывать ему выбор заново значит просить сделать тот
  // же шаг дважды ради того же боя.
  router.push({ name: 'V2ArenaGate', query: { step: 'squad' } });
}
</script>

<style scoped>
/* Счётчик стоит сверху по центру и НЕ ЛОВИТ ПАЛЕЦ: под ним живой бой, и камера
   крутится пальцем по всему экрану. Перехвати он касание — верх экрана перестал
   бы вращать сцену. */
.of-hud {
  position: fixed; top: var(--sp-4); left: 50%; transform: translateX(-50%);
  z-index: var(--z-ui); pointer-events: none;
  max-width: calc(100% - var(--sp-7));
}

/* Строки — один в один как в межволновой панели турнира (.cl-row): моно, чтобы
   число не прыгало при смене, подпись тусклее значения. Новых значений здесь
   нет, только те же токены. */
.of-rows { margin: 0; display: flex; flex-direction: column; gap: var(--sp-1); }
.of-row {
  display: flex; align-items: baseline; justify-content: center; gap: var(--sp-2);
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-meta); text-transform: uppercase;
}
.of-row dt { color: var(--ink-off); flex: 0 0 auto; }
.of-row dd { margin: 0; color: var(--ink); }
</style>
