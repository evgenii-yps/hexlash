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
      <!-- ЛИДЕР. Второй строкой того же списка: то же поле, то же показание.
           Пока короны нет (первые секунды боя) строки нет вовсе — пустое место
           честнее прочерка, за которым игрок ждал бы появления числа.

           Позывной РОЗОВЫЙ — единственная розовая надпись поверх боя, и это тот
           же розовый, что у луча над короной. Дальше по экрану розового нет
           нигде: счётчик сторон, кнопка наводки и панель итога все матовые. -->
      <div v-if="leaderLine" class="of-row">
        <dt>{{ t.openField.leader }}</dt>
        <dd class="of-leader">{{ leaderLine }}</dd>
      </div>
    </dl>
  </div>

  <!-- ЛИДЕР ЗА КАДРОМ — уголок на кромке экрана. Камера на этом поле СТОИТ, и
       корона может оказаться где угодно за краем; строка говорит КТО, уголок —
       КУДА смотреть.

       Место и поворот считает сцена: только она знает камеру. Сюда приходит уже
       готовый ответ в процентах экрана.

       Пальца не ловит: под ним живой бой, и камера крутится пальцем по всему
       экрану. -->
  <div
    v-if="leaderEdge"
    class="of-leader-arrow"
    role="img"
    :aria-label="t.openField.leaderOffscreen"
    :style="arrowStyle"
  >
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4l8 8-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>

  <!-- ПОКАЗАТЬ СВОИХ. Камера на открытом поле СТОИТ, а не следит: где игрок её
       оставил, там она и стоит. Значит, потерять своих из виду можно в любую
       секунду, а не только после того, как камеру «взяли в руки», — и кнопка
       стоит весь бой, а не по признаку.

       ⚠️ Раньше она появлялась только когда камера была в руках, потому что
          возвращать имело смысл только выключённое слежение. Слежения больше нет:
          кнопка теперь не «вернуть», а «навести», и нужна она ровно тогда, когда
          игрок сам этого захотел.

       Матовая, круглая, со значком и БЕЗ РОЗОВОГО И БЕЗ СВЕЧЕНИЯ: розовое в этом
       режиме занято действием, а дальше займётся лучом лидера. Материал —
       существующий матовый хром (--chrome-*), тот же, что у кнопок дома. -->
  <button
    v-if="showRecenter"
    type="button"
    class="of-recenter"
    :aria-label="t.openField.recenter"
    :title="t.openField.recenter"
    @click="onRecenter"
  >
    <!-- Прицел: рамка с просветами и точка в середине. Читается как «навести на
         своих», а не как «закрыть» или «в центр экрана». -->
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="1.6" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  </button>

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
import { openFieldState, endOpenField, cameraReturnNow } from '@/services/openFieldRun.js';
import ArenaPanel from '@/components/panel/ArenaPanel.vue';
import '@/components/panel/panel.css';

const router = useRouter();

const sidesLeft = computed(() => openFieldState.sidesLeft);
const showCount = computed(() => openFieldState.active && openFieldState.phase === 'fight');

// Строка лидера. Корона на своей стороне — прямое обращение вместо позывного;
// короны ещё нет — строки нет вовсе.
const leaderLine = computed(() => {
  if (!showCount.value) return null;
  if (openFieldState.leaderMine) return t.value.openField.youAreLeader;
  return openFieldState.leaderName || null;
});
// Уголок — только пока дерёмся и только когда корона за кадром.
const leaderEdge = computed(() => (showCount.value ? openFieldState.leaderEdge : null));
const arrowStyle = computed(() => {
  const e = leaderEdge.value;
  if (!e) return null;
  return { left: `${e.x}%`, top: `${e.y}%`, transform: `translate(-50%, -50%) rotate(${e.angle}deg)` };
});
const showShort = computed(() => openFieldState.active && openFieldState.phase === 'short');
// Кнопка «показать своих» — весь бой. На панели итога её нет: бой кончился, и
// наводиться не на кого.
const showRecenter = computed(() => openFieldState.active
  && openFieldState.phase === 'fight');

// ⚠️ Двойное нажатие безвредно: вторая наводка начинается с того места, где её
//    застала первая (см. cameraReturnNow).
function onRecenter() {
  cameraReturnNow();
}

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

/* ПОЗЫВНОЙ ЛИДЕРА — единственная розовая надпись поверх боя. Розовый в этом
   режиме принадлежит короне: луч над её бойцами, уголок на кромке и это слово —
   одно и то же указание, поэтому и цвет один. Свечения у надписи нет: светится
   на поле только луч. */
.of-leader { color: var(--pink); }

/* УГОЛОК НА КРОМКЕ. Место и поворот приходят из сцены встроенным стилем — она
   одна знает камеру. Здесь только вид: тот же розовый, никакого свечения,
   пальца не ловит. Размер мелкий намеренно — это указание, а не кнопка. */
.of-leader-arrow {
  position: fixed; z-index: var(--z-ui); pointer-events: none;
  color: var(--pink);
  width: var(--icon-sm); height: var(--icon-sm);
  /* В саму кромку не ставим: место приходит уже отжатым внутрь на долю экрана
     (см. noteLeaderFrame в сцене), иначе половина значка ушла бы за край. */
}
.of-leader-arrow > svg { width: 100%; height: 100%; display: block; }

/* Кнопка «показать своих». Материал — существующий матовый хром, тот же, что у
   кнопок дома (.hs-chrome): матовое стекло, волосяная рамка, холодный текст.
   Отличие одно — круглая: так её не спутать с кнопками панелей, которые в этой
   игре все прямоугольные.

   Справа: сверху по центру стоит счётчик сторон, слева снизу — служебная строка
   кадра, справа сверху — служебная кнопка DEV. Ниже неё и стоим.

   Розового и свечения здесь нет намеренно — см. причину у разметки. */
.of-recenter {
  position: fixed; top: 56px; right: var(--sp-4);
  z-index: var(--z-ui); pointer-events: auto;
  width: 44px; height: 44px;                 /* палец — не меньше 44 */
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--chrome-line); border-radius: 50%;
  background: var(--chrome-glass);
  -webkit-backdrop-filter: blur(var(--blur-glass)); backdrop-filter: blur(var(--blur-glass));
  color: var(--chrome-ink);
  cursor: pointer;
  transition: border-color var(--d-hover) var(--e-weight),
              color var(--d-hover) var(--e-weight);
}
.of-recenter > svg { width: var(--icon-sm); height: var(--icon-sm); }
.of-recenter:hover { border-color: var(--chrome-rim); }
.of-recenter:active { transform: scale(0.97); }
</style>
