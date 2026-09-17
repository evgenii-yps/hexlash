<!-- ChainPanels — экраны ЗАБЕГА (CHAIN): панель между раундами и итог забега.

     ПОЧЕМУ СНАРУЖИ СЦЕНЫ. Арена — защищённый файл: в ней живут бой и моторика.
     Панелям там делать нечего, они про раунды, а не про бой. Отсюда они читают
     ход забега (chainRun) и переводят его дальше; сцена замечает смену номера
     раунда и выводит бойцов. Ни одна сторона не лезет внутрь другой.

     ВИД — из общей панели арены (components/panel/ArenaPanel.vue). Своей коробки
     у забега нет: панель в игре одна, забег только кладёт в неё своё содержимое. -->
<template>
  <ArenaPanel
    v-if="show"
    :title="phase === 'between' ? roundLine : outcomeTitle"
    :note="phase === 'between' ? '' : outcomeNote"
    :muted="outcome === 'broken'"
  >
    <!-- Между раундами: что изменилось и что впереди. Отдельной надписи «победа»
         нет намеренно — панель следующего раунда сама означает, что раунд выигран. -->
    <dl v-if="phase === 'between'" class="cp-rows">
      <div class="cp-row">
        <dt>{{ t.chain.hp }}</dt>
        <dd><span class="cp-was">{{ hpBefore }}</span> <span class="cp-arrow">&rarr;</span> <span class="cp-now">{{ hpAfter }}</span></dd>
      </div>
      <div class="cp-row">
        <dt>{{ t.chain.foe }}</dt>
        <dd>{{ nextName }}</dd>
      </div>
      <div class="cp-row">
        <dt>{{ t.chain.stake }}</dt>
        <dd>&times;{{ stake }}</dd>
      </div>
    </dl>

    <template #actions>
      <button v-if="phase === 'between'" type="button" class="ap-go" @click="onNext">{{ t.chain.nextBtn }}</button>
      <button v-else type="button" class="ap-back" @click="onLeave">{{ t.chain.toGate }}</button>
    </template>
  </ArenaPanel>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { t, interpolate } from '@/locales/index.js';
import { chainState, ROUNDS, advanceRound, endRun, stakeOf } from '@/services/chainRun.js';
import ArenaPanel from '@/components/panel/ArenaPanel.vue';
import '@/components/panel/panel.css';

const router = useRouter();

const phase = computed(() => chainState.phase);
const outcome = computed(() => chainState.outcome);
// Панель показывается только между раундами и на итоге: пока дерутся — экран
// принадлежит бою.
const show = computed(() => chainState.active && phase.value !== 'fight');

// Номер СЛЕДУЮЩЕГО раунда. Без обрезки намеренно: панель «между раундами»
// выходит только когда следующий раунд есть, и подстраховка тут превратила бы
// будущую ошибку в правдоподобное число вместо заметного.
const nextRound = computed(() => chainState.round + 1);
const roundLine = computed(() => interpolate(t.value.chain.round, { n: nextRound.value, of: ROUNDS }));
const stake = computed(() => stakeOf(nextRound.value));
const hpBefore = computed(() => chainState.hpBefore);
const hpAfter = computed(() => chainState.hpAfter);
// Соперник собран заранее — панель про него и рассказывает. Прочерк только если
// имени почему-то нет: пустое место читалось бы как поломка.
const nextName = computed(() => chainState.nextName || '—');

const outcomeTitle = computed(() => (outcome.value === 'complete' ? t.value.chain.complete : t.value.chain.broken));
const outcomeNote = computed(() => (outcome.value === 'complete'
  ? t.value.chain.completeNote
  : interpolate(t.value.chain.brokenNote, { n: chainState.round })));

// ⚠️ Двойное нажатие: номер раунда двигает chainRun, и только из состояния
//    «между раундами». Второе нажатие приходит уже вне его и не делает ничего —
//    раунд не запускается дважды. Своей защиты здесь заводить не нужно.
function onNext() {
  advanceRound();
}

function onLeave() {
  endRun();
  // НА ВТОРОЙ ШАГ ворот, а не на первый. Режим игрок уже выбрал, и показывать
  // ему выбор режима заново — значит просить сделать тот же шаг дважды ради
  // того же боя. Раскладка и состав лежат в сейфе, так что следующий бой
  // начинается в два нажатия: кнопка старта и всё.
  router.push({ name: 'V2ArenaGate', query: { step: 'squad' } });
}
</script>

<style scoped>
/* Строки «что изменилось» — подпись слева, значение справа, моно, чтобы числа не
   прыгали. Живут здесь: это содержимое забега, а не часть общей панели. */
.cp-rows { margin: 0; display: flex; flex-direction: column; gap: var(--sp-2); }
.cp-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-4);
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-meta); text-transform: uppercase;
}
.cp-row dt { color: var(--ink-off); }
.cp-row dd { margin: 0; color: var(--ink-soft); }
.cp-was { color: var(--ink-off); }
.cp-arrow { color: var(--ink-off); padding: 0 var(--sp-1); }
.cp-now { color: var(--ink); }
</style>
