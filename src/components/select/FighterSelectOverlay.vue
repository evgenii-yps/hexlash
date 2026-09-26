<!-- FighterSelectOverlay — ВЫБРАННЫЙ БОЕЦ ПОВЕРХ БОЯ: метка на его месте и узкая
     панель рычагов у правого края.

     ЖИВЁТ СНАРУЖИ СЦЕНЫ, рядом с рядами кличей и баффов (см. шапку
     PlayStubView.vue): защищённая арена про панель не знает, панель про арену —
     тоже. Между ними один файл правил — services/fighterSelect.js, — и всё, что
     здесь есть, оттуда читается.

     ⚠️ СЛОЙ НЕ ЛОВИТ ПАЛЕЦ ВООБЩЕ. Панель — ПОКАЗАНИЯ, а не кнопки: нажимаются
     по-прежнему карты внизу, и рычаг у игрока остаётся ровно один на вид. Если
     бы панель ловила палец, она вдобавок заслоняла бы бойца, который стоит у
     правого края, — и тап по нему уходил бы в пустоту.

     ⚠️ ПАНЕЛЬ НЕ СТОЛКНЁТСЯ С КРУГЛОЙ КНОПКОЙ ОТКРЫТОГО ПОЛЯ. Та живёт справа
     сверху и кончается на 100 точках от верха; панель стоит по середине высоты,
     и даже на самом низком экране её верх ниже (замер в §Приёмка отчёта).

     ⚠️ НА НИЗКОМ ЭКРАНЕ ПАНЕЛЬ ЛОЖИТСЯ В ОДНУ СТРОКУ. Два ряда по три заняли бы
     треть высоты телефона лёжа и налезли бы на ряды карт внизу. Шесть значков в
     строку короче ровно втрое и встают правее карт, а не на них.

     ⚠️ В ПОРТРЕТЕ ПАНЕЛЬ УХОДИТ ВНИЗ, И ЭТО ЗАМЕР, А НЕ ДОГАДКА. Экран узкий,
     плита занимает его середину, и панель по середине высоты НАКРЫВАЛА плашки
     здоровья бойцов у правого края (поймано снимком). Плашки живут в сцене, над
     головами, и подвинуть их нельзя. Поэтому в портрете панель встаёт полосой
     НАД рядами карт — в единственную полосу экрана, где нет ни плашек, ни карт.
     Высота подъёма не зашита числом: обе панели карт меряются на месте, как это
     уже делает ряд кличей над панелью баффов. Зашитый отступ разошёлся бы с
     ними при первой же правке их размеров. -->
<template>
  <div v-if="s.active" class="fso">
    <!-- МЕТКА ВЫБРАННОГО. Плоская, поверх кадра, в цвет его ядра. Тела не
         подсвечивает: светится на арене один разлом, и второго свечения рядом с
         ядром бойца быть не должно. Четыре уголка — не кружок и не квадрат:
         снятая подсветка целей была ими, и метка не должна читаться как «сюда
         можно», она читается как «этот выбран».
         Ключ по номеру выбора: со сменой бойца элемент пересоздаётся, и короткий
         одиночный толчок проигрывается заново. -->
    <div
      v-show="s.mark.on"
      :key="s.key"
      class="fso-mark"
      :style="markStyle"
    >
      <i v-for="n in 4" :key="n" :class="`c${n}`" />
    </div>

    <!-- ПАНЕЛЬ РЫЧАГОВ. Заголовок — ник выбранного (у союзного бота ника нет,
         тогда имя его ядра), дальше значки рычагов со счётчиками. -->
    <aside class="fso-panel" :style="panelStyle" aria-live="polite">
      <!-- Ключ по номеру выбора — заголовок сменяется коротким проявлением, а не
           подменяется молча: смена выбранного обязана быть заметной. -->
      <h2 :key="s.key" class="fso-name">{{ s.name }}</h2>

      <div class="fso-levers">
        <!-- Кличи: рисованный значок, тот же, что на карте ряда. -->
        <div
          v-for="c in klich.cards" :key="`k-${c.key}`"
          class="fso-lever" :class="`is-${c.state}`"
          :aria-label="`${c.name}, ${c.left} left`"
        >
          <span class="fso-glyph"><KlichGlyph :glyph="c.glyph" /></span>
          <span class="fso-count">×{{ c.left }}</span>
        </div>

        <!-- Баффы: тот же снимок предмета, что на карточке панели.
             ⚠️ ЗНАЧКОВ РОВНО СТОЛЬКО, СКОЛЬКО ВИДОВ ИГРОК ВЗЯЛ В БОЙ. Три
             одинаковых предмета — это ОДИН значок со счётчиком ×3, а пустой
             запас — ни одного. Панель повторяет ряд карточек, а не обещает
             шесть рычагов там, где их нет. -->
        <div
          v-for="c in buff.cards" :key="`b-${c.key}`"
          class="fso-lever" :class="`is-${c.state}`"
          :aria-label="`${c.name}, ${c.left} left`"
        >
          <span class="fso-glyph"><img :src="BUFF_ICONS[c.id]" :alt="c.name" /></span>
          <span class="fso-count">×{{ c.left }}</span>
        </div>
      </div>

      <!-- ⚠️ ПОДПИСЬ ОБЯЗАТЕЛЬНА И ЧИТАЕТСЯ ИМЕННО ТАК. Счётчики выше — остаток
           НА БОЙ, общий на всю сторону игрока: он одинаков у любого выбранного
           бойца. Без этой строки панель молча врала бы, будто это запас именно
           этого бойца. Заряды поштучно на бойца — отдельная балансная работа. -->
      <p class="fso-note">{{ t.select.leftThisFight }}</p>
    </aside>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import KlichGlyph from '@/components/klich/KlichGlyph.vue';
import { t } from '@/locales/index.js';
import { selectState as s } from '@/services/fighterSelect.js';
import { klichFightState as klich } from '@/services/klich.js';
import { buffFightState as buff } from '@/services/buffs.js';

// Те же снимки предметов, что на карточках панели баффов: второй набор картинок
// разошёлся бы с первым при первой же замене.
import towel from '@/assets/images/buff_towel.png';
import bucket from '@/assets/images/buff_bucket.png';
import dice from '@/assets/images/buff_dice.png';
const BUFF_ICONS = { towel, bucket, dice };

/**
 * Цвет ядра выбранного. Берётся ОБЪЯВЛЕНИЕМ ТОКЕНА, а не значением: читать
 * значение из стилей в JS пришлось бы после того, как они применены, и на первом
 * кадре цвет был бы пустым. Ядер четыре, пятого нет; ядро неизвестно — тихая
 * мета-серая рамка, без цвета.
 */
const coreVar = computed(() => (s.coreId ? `var(--core-${s.coreId})` : 'var(--ink-dim)'));
const panelStyle = computed(() => ({ '--pcore': coreVar.value, '--fso-lift': `${lift.value}px` }));

/**
 * ПОДЪЁМ НАД РЯДАМИ КАРТ — только для портрета (см. предупреждение в шапке).
 * Меряются ОБЕ панели карт: баффы прижаты к низу, кличи стоят на них. Считаем
 * всегда, а не только в портрете: узнать раскладку из разметки нельзя, а замер
 * стоит ноль, и при повороте телефона число уже готово.
 */
const LIFT_FALLBACK = 240; // обе панели не нашлись — всё равно не ляжем на них
const lift = ref(LIFT_FALLBACK);
let ro = null;

function measureBars() {
  const bars = [document.querySelector('.bfo-bar'), document.querySelector('.kfo-bar')].filter(Boolean);
  if (!bars.length) { lift.value = LIFT_FALLBACK; return; }
  const apply = () => {
    // Панели прижаты к низу и стоят друг на друге, поэтому берём САМЫЙ ВЕРХНИЙ
    // край: складывать высоты нельзя — ряд кличей уже поднят на панель баффов, и
    // сумма посчитала бы её дважды.
    const top = Math.min(...bars.map((b) => b.getBoundingClientRect().top));
    lift.value = Math.max(0, Math.round(window.innerHeight - top));
  };
  apply();
  ro = new ResizeObserver(apply);
  for (const b of bars) ro.observe(b);
}

onMounted(() => {
  // Ряды карт монтируются рядом, порядок между соседями не гарантирован —
  // меряем в следующем кадре, когда оба слоя уже на месте.
  requestAnimationFrame(measureBars);
});
onBeforeUnmount(() => { if (ro) { ro.disconnect(); ro = null; } });
const markStyle = computed(() => ({
  left: `${s.mark.x}px`,
  top: `${s.mark.y}px`,
  '--pcore': coreVar.value,
}));
</script>

<style scoped>
.fso {
  position: fixed;
  inset: 0;
  z-index: 40;          /* тот же слой, что у кличей и баффов: над сценой, под итогом боя */
  pointer-events: none; /* слой сквозной целиком — см. предупреждение в шапке */
}

/* --- МЕТКА: четыре уголка. Обводка в цвет ядра, БЕЗ свечения. --- */
.fso-mark {
  position: fixed;
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px; /* ставим по середине метки */
  animation: fso-pop var(--d-hover) var(--e-weight) 1; /* один толчок на смену выбора */
}
.fso-mark i {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1px solid var(--pcore);
  opacity: 0.9;
}
.fso-mark .c1 { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.fso-mark .c2 { top: 0; right: 0; border-left: 0; border-bottom: 0; }
.fso-mark .c3 { bottom: 0; right: 0; border-left: 0; border-top: 0; }
.fso-mark .c4 { bottom: 0; left: 0; border-right: 0; border-top: 0; }
@keyframes fso-pop {
  from { transform: scale(1.35); opacity: 0.2; }
  to   { transform: scale(1);    opacity: 1; }
}

/* --- ПАНЕЛЬ. Узкая, у правого края, по середине высоты. Материал — тот же
       матовый хром, что у прочих накладок боя; от ядра берётся только рамка и
       едва заметная подложка, чтобы цвет читался, но не спорил с бойцами. --- */
.fso-panel {
  position: absolute;
  right: var(--sp-2);
  top: 50%;
  transform: translateY(-50%);
  width: 118px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--sp-2);
  padding: var(--sp-2);
  border: 1px solid var(--pcore);
  background: color-mix(in srgb, var(--pcore) 9%, var(--chrome-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  backdrop-filter: blur(var(--blur-glass));
  /* Смена выбранного меняет цвет — коротким переходом, не мгновенной подменой. */
  transition: border-color var(--d-hover) var(--e-weight),
              background-color var(--d-hover) var(--e-weight);
}

.fso-name {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-meta);
  color: var(--pcore);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  animation: fso-fade var(--d-hover) var(--e-weight) 1;
}
@keyframes fso-fade { from { opacity: 0; } to { opacity: 1; } }

/* Три в строку: сверху кличи, ниже баффы. Ровно «три клича и три баффа». */
.fso-levers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-1);
}

/* СОСТОЯНИЯ РАЗЛИЧАЮТСЯ ФОРМОЙ И ЯРКОСТЬЮ, НЕ ЦВЕТОМ: цвет занят ядром.
   готов — рамка видна, значок в полную яркость;
   потрачен — приглушён и счётчик ×0 (он же и есть причина);
   нельзя сейчас — приглушён, рамка пунктиром: «не сейчас», а не «кончилось». */
.fso-lever {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 3px 0;
  border: 1px solid var(--line-strong);
  background: var(--fill-1);
}
.fso-lever.is-empty  { opacity: 0.32; }
.fso-lever.is-locked { opacity: 0.45; border-style: dashed; }

.fso-glyph {
  display: block;
  width: 22px;
  height: 22px;
  color: var(--ink-soft);
}
.fso-glyph img { width: 100%; height: 100%; object-fit: contain; }

.fso-count {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.fso-note {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
  text-align: center;
}

/* ПОРТРЕТ: панель уходит вниз, полосой над рядами карт — единственная полоса
   экрана, где нет ни плашек здоровья, ни карт (см. предупреждение в шапке).
   Строка одна: два ряда по три в эту полосу не помещаются. */
@media (max-aspect-ratio: 1/1) {
  .fso-panel {
    top: auto;
    bottom: calc(var(--fso-lift, 240px) + var(--sp-2));
    transform: none;
    width: auto;
    gap: var(--sp-1);
    padding: var(--sp-1) var(--sp-2);
  }
  .fso-levers { grid-template-columns: repeat(6, 1fr); }
  .fso-lever { padding: 2px 3px; }
  .fso-glyph { width: 18px; height: 18px; }
}

/* Телефон лёжа: высоты мало. Панель ложится в ОДНУ строку из шести значков —
   так она втрое короче и не налезает на ряды карт у нижнего края. Подпись
   остаётся: без неё счётчики начали бы врать. */
@media (max-height: 460px) {
  .fso-panel { width: auto; gap: var(--sp-1); padding: var(--sp-1) var(--sp-2); }
  .fso-levers { grid-template-columns: repeat(6, 1fr); gap: var(--sp-1); }
  .fso-lever { padding: 2px 3px; }
  .fso-glyph { width: 18px; height: 18px; }
}

/* «Уменьшить движение»: ни метка, ни заголовок, ни цвет не двигаются — всё
   встаёт сразу в конечный вид. Мигания и пульсации здесь нет и в обычном
   режиме: толчок и проявление одиночные, по одному разу на смену выбора. */
@media (prefers-reduced-motion: reduce) {
  .fso-mark, .fso-name { animation: none; }
  .fso-panel { transition: none; }
}
</style>
