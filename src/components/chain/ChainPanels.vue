<!-- ChainPanels — экраны ЗАБЕГА (CHAIN): панель между раундами и итог забега.

     ПОЧЕМУ СНАРУЖИ СЦЕНЫ. Арена — защищённый файл: в ней живут бой и моторика,
     уже принятые глазами. Панелям там делать нечего, они про раунды, а не про
     бой. Отсюда они читают ход забега (chainRun) и переводят его дальше; сцена
     замечает смену номера раунда и выводит бойцов. Ни одна сторона не лезет
     внутрь другой.

     ВИД — ИЗ СУЩЕСТВУЮЩЕГО. Матовая панель и матовые кнопки, как в воротах
     (.gate-go / .gate-empty): те же токены, тот же шрифт, та же рамка. Розовый
     ровно один и ровно на действии — кнопка NEXT. Свечения нет: светится разлом
     на арене, а не надпись про него. -->
<template>
  <div v-if="show" class="chain-scrim">
    <!-- ── МЕЖДУ РАУНДАМИ ────────────────────────────────────────────────────
         Отдельной надписи «победа» нет намеренно: панель следующего раунда сама
         означает, что этот раунд выигран. -->
    <div v-if="phase === 'between'" class="chain-panel" role="dialog" aria-modal="true">
      <p class="cp-round">{{ roundLine }}</p>
      <dl class="cp-rows">
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
      <button type="button" class="cp-go" @click="onNext">{{ t.chain.nextBtn }}</button>
    </div>

    <!-- ── ИТОГ ЗАБЕГА ──────────────────────────────────────────────────────── -->
    <div v-else class="chain-panel" role="dialog" aria-modal="true">
      <p class="cp-title" :class="{ 'is-broken': outcome === 'broken' }">{{ outcomeTitle }}</p>
      <p class="cp-note">{{ outcomeNote }}</p>
      <button type="button" class="cp-back" @click="onLeave">{{ t.chain.toGate }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { t, interpolate } from '@/locales/index.js';
import { chainState, ROUNDS, advanceRound, endRun, stakeOf } from '@/services/chainRun.js';

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
  router.push({ name: 'V2ArenaGate' });
}
</script>

<style scoped>
/* Затемнение под панелью — бой позади замер, и взгляд должен уйти на панель.
   Кликов не ловит нигде, кроме самой панели: промах мимо кнопки ничего не делает,
   а не закрывает забег. */
.chain-scrim {
  position: fixed; inset: 0; z-index: var(--z-modal);
  display: flex; align-items: center; justify-content: center;
  padding: var(--sp-5);
  background: color-mix(in srgb, var(--void) 62%, transparent);
  pointer-events: auto;
}

/* Матовая панель — та же, что везде в игре: панель, волосяная рамка, без тени
   и без свечения. */
.chain-panel {
  width: min(360px, 100%);
  display: flex; flex-direction: column; align-items: stretch; gap: var(--sp-4);
  padding: var(--sp-5);
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  border: 1px solid var(--line-strong);
  text-align: center;
}

.cp-round, .cp-title {
  margin: 0;
  font-family: var(--font-display); font-weight: 900; font-size: var(--t-xl);
  line-height: 0.95; letter-spacing: var(--ls-tight); text-transform: uppercase;
  color: var(--ink);
}
/* Сгоревший забег — приглушённо, а не тревожно: это конец попытки, не авария. */
.cp-title.is-broken { color: var(--ink-off); }

.cp-note {
  margin: 0;
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-meta); line-height: 1.6; color: var(--ink-dim);
}

/* Строки «что изменилось» — подпись слева, значение справа, моно, чтобы числа
   не прыгали. */
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

/* ГЛАВНОЕ ДЕЙСТВИЕ — единственный розовый на экране. */
.cp-go {
  padding: var(--sp-3) var(--sp-5);
  font-family: var(--font-display); font-weight: 900; font-size: var(--t-md);
  letter-spacing: var(--ls-title); text-transform: uppercase;
  color: var(--ink); cursor: pointer;
  background: var(--pink); border: 1px solid var(--pink);
  transition: filter var(--d-hover) var(--e-weight);
}
.cp-go:hover { filter: brightness(1.08); }
.cp-go:active { filter: brightness(0.94); transition-duration: var(--d-press); }
.cp-go:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }

/* Выход из забега — матовый: забег кончился, звать никуда не нужно. */
.cp-back {
  padding: var(--sp-3) var(--sp-5);
  font-family: var(--font-display); font-weight: 900; font-size: var(--t-md);
  letter-spacing: var(--ls-title); text-transform: uppercase;
  color: var(--ink); cursor: pointer;
  background: transparent; border: 1px solid var(--line-strong);
  transition: border-color var(--d-hover) var(--e-weight);
}
.cp-back:hover { border-color: var(--ink-dim); }
.cp-back:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }

@media (max-width: 560px) {
  .cp-round, .cp-title { font-size: var(--t-lg); }
}
</style>
