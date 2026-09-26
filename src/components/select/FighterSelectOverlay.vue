<!-- FighterSelectOverlay — ПАНЕЛЬ РЫЧАГОВ у правого края.

     ЧТО ОНА ГОВОРИТ, И ЧЕГО НЕ ГОВОРЯТ КАРТЫ. Карты внизу отвечают «сколько
     осталось» — счётчиком ×N. Панель отвечает «когда снова можно» — отсчётом
     отката. Это разные вопросы, и второй на картах не помещается: там уже стоит
     счётчик, и два числа на одной карте читались бы как одно.

     ⚠️ ПАНЕЛЬ БОЛЬШЕ НЕ ПРИВЯЗАНА К ВЫБРАННОМУ БОЙЦУ (ТЗ 26.09.2026). У неё был
     заголовок с ником и покраска в цвет ядра — снято целиком: откат общий на
     сторону игрока, и привязывать его к одному бойцу значило бы врать. Кто
     выбран, теперь видно на плите — цветным кружком под ногами.

     ЖИВЁТ СНАРУЖИ СЦЕНЫ, рядом с рядами кличей и баффов (см. шапку
     PlayStubView.vue): защищённая арена про панель не знает, панель про арену —
     тоже. Числа отката приходят из services/klich.js и services/buffs.js.

     ⚠️ СЛОЙ НЕ ЛОВИТ ПАЛЕЦ ВООБЩЕ. Панель — показания, а не кнопки: нажимаются
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
    <aside class="fso-panel" :style="panelStyle" aria-live="off">
      <p class="fso-head">{{ t.select.cooldown }}</p>

      <div class="fso-levers">
        <div
          v-for="l in levers" :key="l.key"
          class="fso-lever"
          :class="{ 'is-empty': l.spent, 'is-locked': l.locked, 'is-cooling': l.cooling }"
          :aria-label="l.aria"
        >
          <span class="fso-glyph">
            <KlichGlyph v-if="l.glyph" :glyph="l.glyph" />
            <img v-else :src="l.icon" :alt="l.name" />
          </span>

          <!-- ОДНА СТРОКА НА ТРИ СОСТОЯНИЯ, И ОНА НЕ ПРЫГАЕТ. Место под неё
               держится всегда (пустой пробел), иначе значки ездили бы вверх-вниз
               на каждый откат. Свободный рычаг молчит — так «спокойно доступен»
               читается тем, что сказать про него нечего. -->
          <span class="fso-note">{{ l.note }}</span>

          <!-- ОТСЧЁТ ПОЛОСКОЙ, А НЕ КОЛЬЦОМ. На телефоне лёжа значок 18 точек —
               кольцо вокруг него было бы толщиной в волос. Полоска во всю ширину
               плитки убывает слева направо и читается с одного взгляда.
               Ширина ставится кадром, поэтому ни петли, ни перехода здесь нет:
               гасить нечего и при «уменьшить движение». -->
          <span v-if="l.cooling" class="fso-drain"><i :style="{ width: `${l.pct}%` }" /></span>
        </div>
      </div>
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
 * ШЕСТЬ РЫЧАГОВ ОДНИМ СПИСКОМ: сначала три клича, потом баффы.
 *
 * ⚠️ БАФФОВ БЫВАЕТ МЕНЬШЕ ТРЁХ. Значков ровно столько, сколько ВИДОВ игрок взял
 *    в бой: три одинаковых предмета — это один значок, а пустой запас — ни
 *    одного. Панель повторяет ряды карт, а не обещает шесть рычагов там, где их
 *    нет.
 */
const levers = computed(() => {
  const out = [];
  const add = (c, cool, extra) => {
    const left = cool ? cool.left : 0;
    const cooling = left > 0.05 && c.state !== 'empty';
    const spent = c.state === 'empty';
    out.push({
      key: extra.key,
      name: c.name,
      ...extra,
      spent,
      cooling,
      // «Нельзя сейчас» БЕЗ отката — например, боец уже под баффом. Отсчёта тут
      // нет, потому что ждать нечего: причина уйдёт сама, когда сменится
      // обстановка, а не по часам.
      locked: c.state === 'locked' && !cooling,
      // Секунды ОКРУГЛЯЕМ ВВЕРХ И ЦЕЛЫМИ. Дробное число менялось бы шестьдесят
      // раз в секунду и читалось бы как мельтешение; целое меняется раз в
      // секунду, а плавность берёт на себя полоска.
      note: spent ? '×0' : (cooling ? `${Math.ceil(left)}` : ' '),
      pct: cooling ? Math.max(0, Math.min(100, cool.frac * 100)) : 0,
      aria: spent ? `${c.name}, spent`
        : (cooling ? `${c.name}, ${Math.ceil(left)} seconds` : `${c.name}, ready`),
    });
  };
  for (const c of klich.cards) add(c, klich.cool[c.id], { key: `k-${c.id}`, glyph: c.glyph });
  for (const c of buff.cards) add(c, buff.cool[c.id], { key: `b-${c.id}`, icon: BUFF_ICONS[c.id] });
  return out;
});

/**
 * ПОДЪЁМ НАД РЯДАМИ КАРТ — только для портрета (см. предупреждение в шапке).
 * Меряются ОБЕ панели карт: баффы прижаты к низу, кличи стоят на них. Считаем
 * всегда, а не только в портрете: узнать раскладку из разметки нельзя, а замер
 * стоит ноль, и при повороте телефона число уже готово.
 */
const LIFT_FALLBACK = 240; // обе панели не нашлись — всё равно не ляжем на них
const lift = ref(LIFT_FALLBACK);
const panelStyle = computed(() => ({ '--fso-lift': `${lift.value}px` }));
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
</script>

<style scoped>
.fso {
  position: fixed;
  inset: 0;
  z-index: 40;          /* тот же слой, что у кличей и баффов: над сценой, под итогом боя */
  pointer-events: none; /* слой сквозной целиком — см. предупреждение в шапке */
}

/* --- ПАНЕЛЬ. Узкая, у правого края, по середине высоты. Материал — тот же
       матовый хром, что у прочих накладок боя. Ни розового, ни цвета ядра:
       откат общий на сторону, а не чей-то личный. --- */
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
  border: 1px solid var(--chrome-line);
  background: var(--chrome-glass);
  -webkit-backdrop-filter: blur(var(--blur-glass));
  backdrop-filter: blur(var(--blur-glass));
}

.fso-head {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
  text-align: center;
}

/* Три в строку: сверху кличи, ниже баффы. Ровно «три клича и три баффа». */
.fso-levers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-1);
}

/* СОСТОЯНИЯ РАЗЛИЧАЮТСЯ ФОРМОЙ И ЯРКОСТЬЮ, НЕ ЦВЕТОМ.
   свободен — рамка видна, значок в полную яркость, строка пуста;
   в откате — приглушён, секунды и убывающая полоска;
   нельзя сейчас (без отката) — приглушён, рамка пунктиром;
   потрачен — приглушён сильнее всех и ×0 (он же и есть причина). */
.fso-lever {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 3px 0 4px;
  border: 1px solid var(--line-strong);
  background: var(--fill-1);
}
.fso-lever.is-cooling { opacity: 0.5; }
.fso-lever.is-locked  { opacity: 0.45; border-style: dashed; }
.fso-lever.is-empty   { opacity: 0.32; }

.fso-glyph {
  display: block;
  width: 22px;
  height: 22px;
  color: var(--ink-soft);
}
.fso-glyph img { width: 100%; height: 100%; object-fit: contain; }

.fso-note {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  line-height: 1.1;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

/* Полоска отката — по нижнему краю плитки, во всю её ширину. */
.fso-drain {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 2px;
  background: var(--fill-1);
}
.fso-drain i {
  display: block;
  height: 100%;
  background: var(--ink-dim);
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
  .fso-lever { padding: 2px 4px 4px; }
  .fso-glyph { width: 18px; height: 18px; }
}

/* Телефон лёжа: высоты мало. Панель ложится в ОДНУ строку из шести значков —
   так она втрое короче и не налезает на ряды карт у нижнего края. */
@media (max-height: 460px) {
  .fso-panel { width: auto; gap: var(--sp-1); padding: var(--sp-1) var(--sp-2); }
  .fso-levers { grid-template-columns: repeat(6, 1fr); gap: var(--sp-1); }
  .fso-lever { padding: 2px 4px 4px; }
  .fso-glyph { width: 18px; height: 18px; }
}

/* «Уменьшить движение»: гасить нечего. Ни петель, ни переходов в панели нет —
   отсчёт идёт числом раз в секунду и шириной полоски, а это показания, а не
   украшение. Правило оставлено пустым нарочно: пусть следующая правка, если
   заведёт движение, наткнётся на него, а не забудет. */
@media (prefers-reduced-motion: reduce) {
  .fso-panel, .fso-drain i { animation: none; transition: none; }
}
</style>
