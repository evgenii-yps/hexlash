<template>
  <!-- СКРЫТАЯ СТРАНИЦА-ПРЕВЬЮ ЯДРА (ТЗ 22.09.2026, «Печать»).
       Адрес /dev/core, ниоткуда не линкуется, закрыта от поисковиков тегом
       robots (не через robots.txt — строка запрета там публична и работает
       как указатель).

       ⚠️ Страница ничего не рисует сама. И фигура, и кольца приходят теми же
       компонентами, что стоят на лендинге и в деке. Второй отрисовки быть не
       должно: именно она когда-то развела знак в игре с иконкой вкладки. -->
  <div class="cp">
    <header class="cp-bar">
      <span class="cp-bar__title">ЯДРО · ПЕЧАТЬ</span>

      <div class="cp-chips">
        <button
          v-for="s in SECTIONS" :key="s.id || 'pink'"
          type="button" class="cp-chip" :class="{ 'is-on': section === s.id }"
          @click="section = s.id"
        >
          <span class="cp-dot" :style="{ background: hueOf(s.id) }"></span>{{ s.name }}
        </button>
      </div>

      <div class="cp-chips">
        <button
          v-for="m in MODE_IDS" :key="m"
          type="button" class="cp-chip" :class="{ 'is-on': mode === m }"
          @click="mode = m"
        >{{ m }}</button>
        <button
          type="button" class="cp-chip" :class="{ 'is-on': flicker }"
          @click="flicker = !flicker"
        >мерцание: {{ flicker ? 'вкл' : 'выкл' }}</button>
      </div>
    </header>

    <main class="cp-page">
      <!-- ── Пять цветов ───────────────────────────────────────────── -->
      <section class="cp-sec">
        <h2 class="cp-h">ПЯТЬ ЦВЕТОВ · РЕЖИМ {{ mode.toUpperCase() }}</h2>
        <p class="cp-note">
          Форма одна на все пять. Различие — только цвет, и он приходит из
          файла токенов: второго объявления цвета в проекте нет.
        </p>
        <div class="cp-grid">
          <figure v-for="s in SECTIONS" :key="`c${s.id || 'pink'}`" class="cp-cell">
            <HexCore :mode="mode" :hue="hueOf(s.id)" :flicker="flicker" />
            <figcaption>{{ s.name }}</figcaption>
          </figure>
        </div>
      </section>

      <!-- ── Три режима ────────────────────────────────────────────── -->
      <section class="cp-sec">
        <h2 class="cp-h">ТРИ РЕЖИМА ЯРКОСТИ · {{ currentName }}</h2>
        <p class="cp-note">
          full — цветные разделы. muted — вся дека. quiet — розовые разделы
          лендинга и экран входа: горит почти только сердце.
        </p>
        <div class="cp-grid">
          <figure v-for="m in MODE_IDS" :key="`m${m}`" class="cp-cell">
            <HexCore :mode="m" :hue="hue" :flicker="flicker" />
            <figcaption>{{ m }}</figcaption>
          </figure>
        </div>
      </section>

      <!-- ── Раскладка «Вихрь» ─────────────────────────────────────── -->
      <section class="cp-sec">
        <h2 class="cp-h">РАСКЛАДКА «ВИХРЬ»</h2>
        <p class="cp-note">
          Кольца расходятся от ядра, каждое следующее повёрнуто ещё на 5°.
          Макеты показаны в уменьшении; числа — из эталона.
        </p>

        <div class="cp-frames">
          <figure class="cp-frame">
            <figcaption>390 × 844 · телефон · 6 колец</figcaption>
            <div class="cp-shot" :style="shot(390, 844, .6)">
              <div class="cp-shot__in" :style="{ width: '390px', height: '844px', transform: 'scale(.6)' }">
                <CoreVortex
                  :mode="mode" :flicker="flicker"
                  :core-r="104" core-cy="40.05%" :ring-count="6"
                  :style="{ color: hue }"
                />
              </div>
            </div>
          </figure>

          <figure class="cp-frame">
            <figcaption>1440 × 900 · компьютер · 7 колец</figcaption>
            <div class="cp-shot" :style="shot(1440, 900, .5)">
              <div class="cp-shot__in" :style="{ width: '1440px', height: '900px', transform: 'scale(.5)' }">
                <CoreVortex
                  :mode="mode" :flicker="flicker"
                  :core-r="250" core-cy="47.78%" :ring-count="7"
                  :style="{ color: hue }"
                />
              </div>
            </div>
          </figure>

          <figure class="cp-frame">
            <figcaption>1440 × 900 · дека · muted, весь слой × 0.5</figcaption>
            <div class="cp-shot" :style="shot(1440, 900, .5)">
              <div class="cp-shot__in" :style="{ width: '1440px', height: '900px', transform: 'scale(.5)', opacity: .5 }">
                <CoreVortex
                  mode="muted" :flicker="flicker"
                  :core-r="220" core-cy="33.33%" :ring-count="7"
                  :style="{ color: hue }"
                />
              </div>
              <div class="cp-shot__text">
                <div class="cp-shot__h">Плотный раздел деки</div>
                <p>
                  Проверка читаемости: фон идёт на половинной яркости, мерцание
                  почти не заметно, контраст текста к фону сохраняется.
                </p>
              </div>
            </div>
          </figure>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import HexCore from '@/components/core/HexCore.vue';
import CoreVortex from '@/components/core/CoreVortex.vue';
import { MODE_IDS } from '@/data/coreFigure.js';
import { CORE_CYCLE, accentRgb } from '@/data/coreCycle.js';

/* ── Страница закрыта от поисковиков ───────────────────────────────────
   Тегом, а не robots.txt: строка запрета в robots.txt публична и работает
   как указатель на скрытый адрес. */
let robotsTag = null;
let prevTitle = null;

const NAMES = {
  null: 'PINK', natisk: 'ONSLAUGHT', nalet: 'RAIDER', skala: 'BULWARK', zasada: 'AMBUSH',
};
const SECTIONS = CORE_CYCLE.map((id) => ({ id, name: NAMES[id] }));

const section = ref(null);
const mode = ref('full');
const flicker = ref(true);

/* Цвет берём тем же путём, что лендинг и дека: из файла токенов. */
const hueOf = (id) => `rgb(${accentRgb(id).join(' ')})`;
const hue = computed(() => hueOf(section.value));
const currentName = computed(() => NAMES[section.value]);

/* Рамка макета: настоящий размер, уменьшенный на месте. */
const shot = (w, h, k) => ({ width: `${w * k}px`, height: `${h * k}px` });

onMounted(() => {
  prevTitle = document.title;
  document.title = 'Core preview';
  robotsTag = document.createElement('meta');
  robotsTag.setAttribute('name', 'robots');
  robotsTag.setAttribute('content', 'noindex, nofollow, noarchive');
  document.head.appendChild(robotsTag);
});
onBeforeUnmount(() => {
  if (prevTitle !== null) document.title = prevTitle;
  if (robotsTag) robotsTag.remove();
});
</script>

<style scoped>
/* Все значения — из токенов. Углы прямые, теней нет, чисто-белого нет. */
.cp {
  min-height: 100vh;
  min-height: 100lvh;
  background: var(--void);
  color: var(--ink);
  font-family: var(--font-ui);

  /* Служебные адреса /dev/* показываются с общей шапкой приложения: она
     закреплена сверху и перекрывает всё, что стоит в нуле. Страница отступает
     на её высоту, чтобы по переключателям можно было попасть пальцем. */
  --cp-app-header: 70px;
  padding-top: var(--cp-app-header);
}

.cp-bar {
  position: sticky;
  top: var(--cp-app-header);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--carbon);
  border-bottom: 1px solid var(--line-1);
}
.cp-bar__title {
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro);
  color: var(--ink-dim);
}

.cp-chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.cp-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  min-height: 38px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--line-1);
  background: var(--fill-1);
  color: var(--ink-mute);
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro);
  cursor: pointer;
  transition: border-color var(--d-hover) var(--e-standard),
              color var(--d-hover) var(--e-standard);
}
.cp-chip:hover { border-color: var(--line-2); color: var(--ink); }
.cp-chip.is-on { border-color: var(--line-2); color: var(--ink); background: var(--fill-2); }
.cp-dot { width: 10px; height: 10px; display: block; }

.cp-page {
  display: flex;
  flex-direction: column;
  gap: var(--sp-7);
  padding: var(--sp-6) var(--sp-4) var(--sp-8);
  max-width: 1240px;
  margin: 0 auto;
}
.cp-sec { display: flex; flex-direction: column; gap: var(--sp-3); }
.cp-h {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro);
  color: var(--ink-dim);
}
.cp-note {
  margin: 0;
  max-width: 62ch;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--ink-mute);
}

.cp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--sp-4);
}
.cp-cell {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid var(--line-1);
  background: var(--void);
}
.cp-cell figcaption {
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro);
  color: var(--ink-dim);
}
.cp-cell :deep(.hc) { width: 100%; height: auto; }

.cp-frames { display: flex; flex-wrap: wrap; gap: var(--sp-5); }
.cp-frame { margin: 0; display: flex; flex-direction: column; gap: var(--sp-2); }
.cp-frame figcaption {
  font-family: var(--font-mono);
  font-size: var(--fs-micro);
  letter-spacing: var(--ls-micro);
  color: var(--ink-dim);
}
.cp-shot {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line-1);
  background: var(--void);
}
.cp-shot__in { position: absolute; left: 0; top: 0; transform-origin: top left; }
.cp-shot__text {
  position: absolute;
  inset: 0;
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.cp-shot__h { font-size: var(--fs-h3); font-weight: 700; color: var(--ink); }
.cp-shot__text p {
  margin: 0;
  max-width: 60ch;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--ink-mute);
}
</style>
