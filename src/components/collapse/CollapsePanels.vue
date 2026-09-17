<!-- CollapsePanels — экраны ТУРНИРА (COLLAPSE): панель между волнами, итог
     турнира и честное состояние «бойцов не хватает».

     ПОЧЕМУ СНАРУЖИ СЦЕНЫ. Арена — защищённый файл: в ней живут бой и моторика.
     Панелям там делать нечего, они про волны, а не про бой. Отсюда они читают
     ход турнира (collapseRun) и переводят его дальше; сцена замечает смену
     номера волны и выводит бойцов. Ни одна сторона не лезет внутрь другой.

     ВИД — из общей панели арены (components/panel/ArenaPanel.vue). Своей коробки
     у турнира нет: панель в игре одна, турнир только кладёт в неё своё
     содержимое. Розовая на экране одна — кнопка NEXT.

     ⚠️ ПОЛНОЙ СЕТКИ ТУРНИРА ЗДЕСЬ НЕТ НАМЕРЕННО. В портрете шестнадцать сторон
     не помещаются без замера, а наполовину показанная сетка врёт сильнее, чем
     её отсутствие. Это отдельная работа после демо. -->
<template>
  <ArenaPanel
    v-if="show"
    :title="title"
    :note="note"
    :muted="muted"
  >
    <!-- Между волнами: что впереди и что стало со здоровьем. Отдельной надписи
         «победа» нет намеренно — панель следующей волны сама означает, что волна
         выиграна. -->
    <dl v-if="phase === 'between'" class="cl-rows">
      <div class="cl-row">
        <dt>{{ t.collapse.sidesLeft }}</dt>
        <dd>{{ sidesLeft }}</dd>
      </div>
      <!-- Здоровье: в SOLO одна строка HP, в команде — строка на каждого бойца.
           Имя вместо подписи HP, потому что важно, КОМУ сколько осталось. -->
      <div v-for="(row, i) in hpRows" :key="i" class="cl-row">
        <dt>{{ hpRows.length > 1 ? row.name : t.collapse.hp }}</dt>
        <dd>
          <span class="cl-was">{{ row.before }}</span>
          <span class="cl-arrow">&rarr;</span>
          <span class="cl-now">{{ row.after }}</span>
        </dd>
      </div>
      <div class="cl-row">
        <dt>{{ t.collapse.foe }}</dt>
        <dd>{{ foeName }}</dd>
      </div>
      <div v-if="beat.length" class="cl-row">
        <dt>{{ t.collapse.beat }}</dt>
        <dd>{{ beatLine }}</dd>
      </div>
    </dl>

    <!-- Итог турнира: место стоит строкой под заголовком, здесь — только кого
         сторона игрока прошла. Здоровья тут нет намеренно: турнир кончился, и
         остаток здоровья ни на что больше не влияет. -->
    <dl v-else-if="phase === 'done' && beat.length" class="cl-rows">
      <div class="cl-row">
        <dt>{{ t.collapse.beat }}</dt>
        <dd>{{ beatLine }}</dd>
      </div>
    </dl>

    <template #actions>
      <button v-if="phase === 'between'" type="button" class="ap-go" @click="onNext">{{ t.collapse.nextBtn }}</button>
      <button v-else type="button" class="ap-back" @click="onLeave">{{ t.collapse.toGate }}</button>
    </template>
  </ArenaPanel>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { t, interpolate } from '@/locales/index.js';
import { collapseState, advanceWave, endCollapse } from '@/services/collapseRun.js';
import ArenaPanel from '@/components/panel/ArenaPanel.vue';
import '@/components/panel/panel.css';

const router = useRouter();

const phase = computed(() => collapseState.phase);
// Панель показывается между волнами, на итоге и при нехватке бойцов. Пока
// дерутся — экран принадлежит бою.
const show = computed(() => collapseState.active && phase.value !== 'fight');

const sidesLeft = computed(() => collapseState.sidesLeft);
const hpRows = computed(() => collapseState.hpRows);
const beat = computed(() => collapseState.beat);
// Прочерк только если имени почему-то нет: пустое место читалось бы как поломка.
const foeName = computed(() => collapseState.foeName || '—');
const beatLine = computed(() => beat.value.join(' · '));

// Номер СЛЕДУЮЩЕЙ волны. Панель «между волнами» выходит только когда следующая
// волна есть, поэтому обрезки здесь нет намеренно: подстраховка превратила бы
// будущую ошибку в правдоподобное число вместо заметного.
const waveLine = computed(() => interpolate(t.value.collapse.wave, {
  n: collapseState.nextWave, of: collapseState.waves,
}));

// Место: у победителя одно число, у выбывшего — вилка (9–16 и так далее).
const placeLine = computed(() => {
  const p = collapseState.place;
  if (!p) return '';
  const span = p.from === p.to ? String(p.from) : `${p.from}–${p.to}`;
  return interpolate(t.value.collapse.place, { p: span, of: p.of });
});

const shortTitle = computed(() => (collapseState.shortBy === 1
  ? t.value.collapse.needOne
  : interpolate(t.value.collapse.needMany, { n: collapseState.shortBy })));

const title = computed(() => {
  if (phase.value === 'short') return shortTitle.value;
  if (phase.value === 'between') return waveLine.value;
  return collapseState.outcome === 'won'
    ? t.value.collapse.won
    : interpolate(t.value.collapse.out, { n: collapseState.wave });
});

const note = computed(() => {
  if (phase.value === 'short') return t.value.collapse.shortNote;
  if (phase.value === 'between') return '';
  return placeLine.value;
});

// Приглушаем заголовок там, где исход никуда не зовёт: выбыли из турнира, бойцов
// не хватает. Тревожного цвета у нас для этого нет и заводить его незачем.
const muted = computed(() => phase.value === 'short' || collapseState.outcome === 'out');

// ⚠️ Двойное нажатие: номер волны двигает collapseRun, и только из состояния
//    «между волнами». Второе нажатие приходит уже вне его и не делает ничего —
//    волна не запускается дважды. Своей защиты здесь заводить не нужно.
function onNext() {
  advanceWave();
}

function onLeave() {
  endCollapse();
  router.push({ name: 'V2ArenaGate' });
}
</script>

<style scoped>
/* Строки «что впереди» — подпись слева, значение справа, моно, чтобы числа не
   прыгали. Живут здесь: это содержимое турнира, а не часть общей панели. */
.cl-rows { margin: 0; display: flex; flex-direction: column; gap: var(--sp-2); }
.cl-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-4);
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-meta); text-transform: uppercase;
}
.cl-row dt { color: var(--ink-off); flex: 0 0 auto; }
.cl-row dd { margin: 0; color: var(--ink-soft); text-align: right; }
.cl-was { color: var(--ink-off); }
.cl-arrow { color: var(--ink-off); padding: 0 var(--sp-1); }
.cl-now { color: var(--ink); }
</style>
