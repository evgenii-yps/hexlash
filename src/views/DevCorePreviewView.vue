<template>
  <!-- СКРЫТАЯ СТРАНИЦА-ПРЕВЬЮ НОВОГО ЯДРА (ТЗ 21.09.2026).
       Адрес /dev/core, ниоткуда не линкуется, закрыта от поисковиков тегом
       robots (не через robots.txt — строка запрета там публична и работает
       как указатель).

       ⚠️ Здесь НИЧЕГО не встраивается в продукт. Лендинг, дека, игра и
       нынешняя иконка ядра не тронуты. Фон в третьей вкладке — тот самый
       компонент лендинга, взятый БЕЗ ПРАВКИ через его существующий вход
       accent; копия рисунка не заводилась намеренно (их уже две, и файл сам
       требует менять их парой). -->
  <div class="cp" :class="{ 'cp--bg': tab === 'bg' }">

    <!-- ── Верхняя полоса ───────────────────────────────────────────── -->
    <header class="cp-bar">
      <span class="cp-bar__title">CORE · PREVIEW</span>
      <nav class="cp-tabs">
        <button
          v-for="t in TABS" :key="t.id"
          type="button"
          class="cp-tab"
          :class="{ 'is-on': tab === t.id }"
          @click="tab = t.id"
        >{{ t.label }}</button>
      </nav>
    </header>

    <!-- ══ 1 · ЛИСТ ═════════════════════════════════════════════════ -->
    <main v-if="tab === 'sheet'" class="cp-page">
      <section class="cp-sec">
        <h2 class="cp-h">FOUR CORES · EIGHT STATES</h2>
        <p class="cp-note">
          Форма у всех четырёх одна. Различие — только цвет, и он приходит из
          файла токенов.
        </p>
        <div class="cp-scroll">
          <table class="cp-grid">
            <thead>
              <tr>
                <th class="cp-grid__corner"></th>
                <th v-for="s in STATES" :key="s.id" class="cp-grid__head">
                  <span>{{ s.label }}</span>
                  <em>{{ s.hint }}</em>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in CORES4" :key="c.id">
                <th class="cp-grid__row" :style="{ '--row': `var(--core-${c.id})` }">
                  <span class="cp-dot"></span>{{ c.label }}
                </th>
                <td v-for="s in STATES" :key="`${c.id}-${s.id}`">
                  <HexCore
                    :core="c.id"
                    :branches="s.branches"
                    :zone-mode="s.zoneMode || 'fusion'"
                    :variant="s.variant || 'normal'"
                    :size="96"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="cp-sec">
        <h2 class="cp-h">SIZES</h2>
        <p class="cp-note">
          Порог один — 48 точек. Ниже 48 остаются центр, три канала, вершина
          ветки и контур; узлы 1–4, огранка центра и свет зон убираются.
        </p>
        <div class="cp-row cp-row--base">
          <figure v-for="s in SIZES" :key="s" class="cp-fig">
            <HexCore core="zasada" :branches="{ a: 4, b: 3, c: 2 }" :size="s" />
            <figcaption>{{ s }}px<em v-if="s < 48">упрощённая</em><em v-else>полная</em></figcaption>
          </figure>
        </div>
        <div class="cp-row cp-row--base cp-row--full">
          <figure class="cp-fig">
            <HexCore core="natisk" :branches="{ a: 5, b: 3, c: 2 }" :size="fullSize" />
            <figcaption>во весь экран<em>{{ fullSize }}px</em></figcaption>
          </figure>
        </div>
      </section>

      <section class="cp-sec">
        <h2 class="cp-h">MARK vs CORE</h2>
        <p class="cp-note">
          Знак — толстая белая обводка и росчерки, один розовый, ноль свечения.
          Ядро — тонкий цветной контур и узлы-кристаллы на лучах. Белого в ядре
          нет вообще.
        </p>
        <div class="cp-pairs">
          <div v-for="s in [24, 48, 128]" :key="`p-${s}`" class="cp-pair">
            <div class="cp-pair__slot"><HexlashMark :size="s" /></div>
            <div class="cp-pair__slot"><HexCore core="skala" :branches="{ a: 3, b: 2, c: 1 }" :size="s" /></div>
            <span class="cp-pair__cap">{{ s }}px</span>
          </div>
        </div>
      </section>
    </main>

    <!-- ══ 2 · ПЕСОЧНИЦА ════════════════════════════════════════════ -->
    <main v-else-if="tab === 'lab'" class="cp-page">
      <section class="cp-sec cp-lab">
        <div class="cp-lab__stage">
          <HexCore
            :core="labCore"
            :branches="labBranches"
            :zone-mode="labZones"
            :breathe="labBreathe"
            :size="stageSize"
          />
        </div>

        <div class="cp-lab__panel">
          <div class="cp-ctl">
            <span class="cp-ctl__lbl">CORE</span>
            <div class="cp-chips">
              <button
                v-for="c in CORES4" :key="c.id"
                type="button"
                class="cp-chip"
                :class="{ 'is-on': labCore === c.id }"
                :style="{ '--chip': `var(--core-${c.id})` }"
                @click="labCore = c.id"
              >{{ c.label }}</button>
            </div>
          </div>

          <div class="cp-ctl">
            <span class="cp-ctl__lbl">
              FACETS
              <em>{{ spent }} / {{ RESOURCE }} lit</em>
            </span>
            <div v-for="b in BRANCH_IDS" :key="b.id" class="cp-branch">
              <span class="cp-branch__name">{{ branchName(b.id) }}</span>
              <div class="cp-step">
                <button
                  type="button" class="cp-step__btn"
                  :disabled="labBranches[b.id] <= 0"
                  @click="bump(b.id, -1)"
                >−</button>
                <span class="cp-step__val">{{ labBranches[b.id] }}</span>
                <button
                  type="button" class="cp-step__btn"
                  :disabled="labBranches[b.id] >= 5 || spent >= RESOURCE"
                  @click="bump(b.id, 1)"
                >+</button>
              </div>
              <span class="cp-branch__pips">
                <i v-for="n in 5" :key="n" :class="{ 'is-on': n <= labBranches[b.id] }"></i>
              </span>
            </div>
            <p v-if="spent >= RESOURCE" class="cp-warn">RESOURCE SPENT · NOTHING LEFT TO LIGHT</p>
          </div>

          <div class="cp-ctl">
            <span class="cp-ctl__lbl">ZONES</span>
            <div class="cp-chips">
              <button
                type="button" class="cp-chip" :class="{ 'is-on': labZones === 'fusion' }"
                @click="labZones = 'fusion'"
              >FUSION</button>
              <button
                type="button" class="cp-chip" :class="{ 'is-on': labZones === 'plain' }"
                @click="labZones = 'plain'"
              >PLAIN FACES</button>
            </div>
            <p class="cp-hint">
              {{ labZones === 'fusion'
                ? 'Зона горит, когда задействованы обе соседние ветки. Сила — по меньшей из двух.'
                : 'Зоны — чистые грани объёма. Не светятся никогда.' }}
            </p>
          </div>

          <div class="cp-ctl">
            <span class="cp-ctl__lbl">BREATH</span>
            <div class="cp-chips">
              <button
                type="button" class="cp-chip" :class="{ 'is-on': labBreathe }"
                @click="labBreathe = !labBreathe"
              >{{ labBreathe ? 'ON' : 'OFF' }}</button>
            </div>
            <p class="cp-hint">Ритм берётся из токена своего ядра. На витрине дыхания нет.</p>
          </div>
        </div>
      </section>
    </main>

    <!-- ══ 3 · ПРОТОТИП ФОНА ════════════════════════════════════════ -->
    <template v-else>
      <!-- Два слоя волны, между ними перетекание по прозрачности: строка
           «r, g, b» плавно не меняется, а два слоя — меняются. -->
      <div class="cp-wave" :class="`cp-wave--${surface}`">
        <div class="cp-wave__layer" :style="{ opacity: layerAOn ? 1 : 0 }">
          <LandingBackground :accent="accentA" :grain="false" />
        </div>
        <div class="cp-wave__layer" :style="{ opacity: layerAOn ? 0 : 1 }">
          <LandingBackground :accent="accentB" :grain="false" />
        </div>
        <!-- Фигура стоит в точке, откуда расходятся кольца. Размер, форма и
             положение при прокрутке не меняются. -->
        <div class="cp-wave__core">
          <!-- На розовом первом экране ветки НЕ горят: у ядра розового нет,
               горит только центр ровным нейтральным светом (см. HexCore). -->
          <HexCore
            :core="activeCore"
            :branches="activeCore ? { a: 5, b: 5, c: 5 } : { a: 0, b: 0, c: 0 }"
            variant="background"
            :size="bgCoreSize"
            class="cp-wave__fig"
          />
        </div>
      </div>

      <div class="cp-surface">
        <button
          v-for="s in ['phone', 'deck']" :key="s"
          type="button" class="cp-chip" :class="{ 'is-on': surface === s }"
          @click="surface = s"
        >{{ s === 'phone' ? 'ЛЕНДИНГ' : 'ДЕКА' }}</button>
      </div>

      <main class="cp-mock">
        <section
          v-for="(sec, i) in BG_SECTIONS" :key="sec.key"
          class="cp-mock__sec"
          :ref="(el) => setSecRef(el, i)"
        >
          <span class="cp-mock__tag">{{ sec.tag }}</span>
          <h2 class="cp-mock__h">{{ sec.head }}</h2>
          <p class="cp-mock__p">{{ sec.body }}</p>
          <button type="button" class="cp-cta">{{ sec.cta }}</button>
        </section>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import HexCore from '@/components/core/HexCore.vue';
import LandingBackground from '@/components/landing/LandingBackground.vue';
import { HexlashMark } from '@/components/brand/hexlashMark.js';
import { CORES, RESOURCE } from '@/data/upgradeData.js';
import { CRYSTALS } from '@/data/upgradeData.js';
import { coreHue, coreRgb } from '@/data/sceneTokens.js';

/* ── Страница закрыта от поисковиков ───────────────────────────────────
   Тегом, а не robots.txt: строка запрета в robots.txt публична и работает
   как указатель на скрытый адрес. useDocumentMeta про robots не знает,
   поэтому тег ставится здесь и снимается при уходе. */
let robotsTag = null;
let prevTitle = null;
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

const TABS = [
  { id: 'sheet', label: 'ЛИСТ' },
  { id: 'lab', label: 'ПЕСОЧНИЦА' },
  { id: 'bg', label: 'ФОН' },
];
const tab = ref('sheet');

const CORES4 = CORES.map((c) => ({ id: c.id, label: c.name }));
const BRANCH_IDS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

/* ── ЛИСТ ──────────────────────────────────────────────────────────── */
const STATES = [
  { id: 'empty',  label: 'ПУСТОЕ',       hint: '0 граней',        branches: { a: 0, b: 0, c: 0 } },
  { id: 'part',   label: 'ЧАСТИЧНОЕ',    hint: '2 в одной',       branches: { a: 2, b: 0, c: 0 } },
  { id: 'hybrid', label: 'ГИБРИД',       hint: '3 + 2',           branches: { a: 3, b: 2, c: 0 } },
  { id: 'full',   label: 'ПОЛНОЕ',       hint: '5 по трём',       branches: { a: 2, b: 2, c: 1 } },
  { id: 'muted',  label: 'ПРИГЛУШЁННОЕ', hint: 'без свечения',    branches: { a: 3, b: 2, c: 0 }, variant: 'muted' },
  { id: 'select', label: 'ВЫБРАННОЕ',    hint: 'кольцо выделения', branches: { a: 2, b: 2, c: 1 }, variant: 'selected' },
  { id: 'foe',    label: 'ПРОТИВНИК',    hint: 'яркость ниже',    branches: { a: 2, b: 2, c: 1 }, variant: 'foe' },
  { id: 'bg',     label: 'ФОНОВОЕ',      hint: 'тускло, неподвижно', branches: { a: 5, b: 5, c: 5 }, variant: 'background' },
];
const SIZES = [24, 48, 128];
const fullSize = ref(320);

/* ── ПЕСОЧНИЦА ─────────────────────────────────────────────────────── */
const labCore = ref('natisk');
const labBranches = reactive({ a: 0, b: 0, c: 0 });
const labZones = ref('fusion');
const labBreathe = ref(false);
const stageSize = ref(300);

const spent = computed(() => labBranches.a + labBranches.b + labBranches.c);
function bump(id, d) {
  const next = labBranches[id] + d;
  if (next < 0 || next > 5) return;
  if (d > 0 && spent.value >= RESOURCE) return;   // общий лимит из данных игры
  labBranches[id] = next;
}
/* Имена веток берутся из данных прокачки — свои не выдумываем. */
function branchName(id) {
  const list = CRYSTALS[labCore.value] || [];
  return (list.find((b) => b.id === id) || {}).name || id.toUpperCase();
}

/* ── ПРОТОТИП ФОНА ─────────────────────────────────────────────────── */
const surface = ref('phone');
const BG_SECTIONS = [
  { key: 'pink0',  core: null,     tag: 'HEXLASH',   head: 'NEVER GIVE UP',       body: 'Первый экран несёт розовый бренда. У ядра розового нет: горит только центр, ровным нейтральным светом, ветки тёмные.', cta: 'PLAY' },
  { key: 'natisk', core: 'natisk', tag: 'CORE 01',   head: 'ONSLAUGHT',           body: 'Марширует вплотную и не отпускает дистанцию. Трудный кадр: розовая кнопка на красном.', cta: 'PLAY' },
  { key: 'nalet',  core: 'nalet',  tag: 'CORE 02',   head: 'RAIDER',              body: 'Ударил, отвалился, ударил снова — коснулся и ушёл.', cta: 'PLAY' },
  { key: 'skala',  core: 'skala',  tag: 'CORE 03',   head: 'BULWARK',             body: 'Принимает удар, перемалывает и отдаёт позже.', cta: 'PLAY' },
  { key: 'zasada', core: 'zasada', tag: 'CORE 04',   head: 'AMBUSH',              body: 'Ждёт в тишине, потом один оплаченный сполна удар.', cta: 'PLAY' },
  { key: 'pink1',  core: null,     tag: 'HEXLASH',   head: 'ROUND AGAIN',         body: 'Круг замкнулся: цвет вернулся к бренду.', cta: 'SUBSCRIBE' },
];

const activeIndex = ref(0);
const activeCore = computed(() => BG_SECTIONS[activeIndex.value]?.core ?? null);

/* Акцент читается из файла токенов — второго объявления цвета не заводим. */
const PINK_FALLBACK = [255, 0, 105];
function accentFor(coreId) {
  try {
    if (!coreId) {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--pink-rgb').trim();
      return raw ? raw.split(',').map((n) => Number(n.trim())) : PINK_FALLBACK;
    }
    return coreRgb(coreHue(coreId)).split(',').map((n) => Number(n.trim()));
  } catch (e) {
    return PINK_FALLBACK;
  }
}

/* Два слоя волны — перетекание по прозрачности. */
const layerAOn = ref(true);
const accentA = ref(PINK_FALLBACK);
const accentB = ref(PINK_FALLBACK);
watch(activeCore, (id) => {
  const next = accentFor(id);
  if (layerAOn.value) accentB.value = next; else accentA.value = next;
  layerAOn.value = !layerAOn.value;
});

const bgCoreSize = ref(220);

/* Активен тот раздел, что пересекает середину экрана. */
const secEls = [];
function setSecRef(el, i) { if (el) secEls[i] = el; }
let io = null;
function mountObserver() {
  if (io) io.disconnect();
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = secEls.indexOf(e.target);
      if (i >= 0) activeIndex.value = i;
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  secEls.forEach((el) => el && io.observe(el));
}
watch(tab, async (t) => {
  if (t !== 'bg') { if (io) io.disconnect(); return; }
  activeIndex.value = 0;
  accentA.value = accentFor(null);
  accentB.value = accentFor(null);
  layerAOn.value = true;
  await nextTick();
  window.scrollTo(0, 0);
  mountObserver();
});

function fit() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  fullSize.value = Math.round(Math.min(w - 48, h - 200, 420));
  stageSize.value = Math.round(Math.min(w - 96, 340));
  bgCoreSize.value = Math.round(Math.min(w * 0.46, h * 0.3, 260));
}
onMounted(() => { fit(); window.addEventListener('resize', fit, { passive: true }); });
onBeforeUnmount(() => { window.removeEventListener('resize', fit); if (io) io.disconnect(); });
</script>

<style scoped>
/* Все значения — из токенов. Углы прямые, теней нет, чисто-белого нет. */
.cp {
  min-height: 100vh;
  min-height: 100lvh;
  background: var(--void);
  color: var(--ink);
  font-family: var(--font-display);
  padding-top: 52px;
}
.cp--bg { padding-top: 0; }

/* ── Полоса ─────────────────────────────────────────────────────────── */
.cp-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: var(--z-topbar);
  height: 52px;
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: 0 var(--sp-4);
  background: color-mix(in srgb, var(--void) 92%, transparent);
  border-bottom: 1px solid var(--line-strong);
  backdrop-filter: blur(var(--blur-glass));
}
.cp-bar__title {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-wide);
  color: var(--ink-dim);
  white-space: nowrap;
}
.cp-tabs { display: flex; gap: var(--sp-1); margin-left: auto; }
.cp-tab {
  appearance: none;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--ink-dim);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--t-xs);
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  padding: 0 var(--sp-3);
  min-height: var(--h-btn-sm);
  cursor: pointer;
  transition: color var(--d-fast), border-color var(--d-fast), background-color var(--d-fast);
}
.cp-tab:hover { color: var(--ink); }
.cp-tab:active { opacity: var(--o-dim); }
.cp-tab.is-on { color: var(--ink); border-color: var(--ink-dim); background: var(--fill-2); }

/* ── Разделы листа ──────────────────────────────────────────────────── */
.cp-page { padding: var(--sp-5) var(--sp-4) var(--sp-7); max-width: 1180px; margin: 0 auto; }
.cp-sec { margin-bottom: var(--sp-7); }
.cp-h {
  margin: 0 0 var(--sp-2);
  font-size: var(--t-lg);
  font-weight: 800;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
}
.cp-note, .cp-hint {
  margin: 0 0 var(--sp-4);
  max-width: 62ch;
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  line-height: 1.6;
  color: var(--ink-dim);
}
.cp-hint { margin: var(--sp-2) 0 0; }

.cp-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.cp-grid { border-collapse: collapse; }
.cp-grid th, .cp-grid td { padding: var(--sp-2); text-align: center; vertical-align: middle; }
.cp-grid__corner { min-width: 118px; }
.cp-grid__head {
  min-width: 118px;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-wide);
  color: var(--ink-dim);
  font-weight: 400;
}
.cp-grid__head em { display: block; font-style: normal; letter-spacing: 0; color: var(--ink-off); margin-top: 2px; }
.cp-grid__row {
  text-align: left;
  font-size: var(--t-xs);
  letter-spacing: var(--ls-title);
  color: var(--ink-dim);
  font-weight: 700;
  white-space: nowrap;
}
.cp-dot {
  display: inline-block;
  width: 8px; height: 8px;
  margin-right: var(--sp-2);
  background: var(--row);
  vertical-align: middle;
}

.cp-row { display: flex; flex-wrap: wrap; gap: var(--sp-5); align-items: flex-end; }
.cp-row--full { margin-top: var(--sp-5); }
.cp-fig { margin: 0; display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); }
.cp-fig figcaption {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
  text-align: center;
}
.cp-fig figcaption em { display: block; font-style: normal; color: var(--ink-off); }

.cp-pairs { display: flex; flex-wrap: wrap; gap: var(--sp-6); }
.cp-pair { display: flex; align-items: center; gap: var(--sp-4); }
.cp-pair__slot { display: grid; place-items: center; min-width: 136px; min-height: 136px; background: var(--fill-1); }
.cp-pair__cap { font-family: var(--font-mono); font-size: var(--t-micro); letter-spacing: var(--ls-meta); color: var(--ink-dim); }

/* ── Песочница ──────────────────────────────────────────────────────── */
.cp-lab { display: flex; flex-wrap: wrap; gap: var(--sp-6); align-items: flex-start; }
.cp-lab__stage {
  box-sizing: border-box;
  flex: 1 1 320px;
  max-width: 100%;
  display: grid;
  place-items: center;
  min-height: 340px;
  background: var(--carbon);
  border: 1px solid var(--line-strong);
  padding: var(--sp-5);
}
.cp-lab__panel { flex: 1 1 300px; display: flex; flex-direction: column; gap: var(--sp-5); }
.cp-ctl { display: flex; flex-direction: column; gap: var(--sp-2); }
.cp-ctl__lbl {
  display: flex; justify-content: space-between; align-items: baseline; gap: var(--sp-3);
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-wide);
  color: var(--ink-dim);
}
.cp-ctl__lbl em { font-style: normal; letter-spacing: var(--ls-meta); color: var(--ink-off); }

.cp-chips { display: flex; flex-wrap: wrap; gap: var(--sp-1); }
.cp-chip {
  appearance: none;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--ink-dim);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--t-xs);
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  padding: 0 var(--sp-3);
  min-height: var(--h-btn-sm);
  cursor: pointer;
  transition: color var(--d-fast), border-color var(--d-fast), background-color var(--d-fast);
}
.cp-chip:hover { color: var(--ink); }
.cp-chip:active { opacity: var(--o-dim); }
.cp-chip.is-on { color: var(--ink); border-color: var(--chip, var(--ink-dim)); background: var(--fill-2); }

.cp-branch { display: flex; align-items: center; gap: var(--sp-3); }
.cp-branch__name {
  flex: 1 1 auto;
  font-size: var(--t-xs);
  letter-spacing: var(--ls-title);
  font-weight: 700;
  color: var(--ink-soft);
  text-transform: uppercase;
}
.cp-step { display: flex; align-items: center; gap: var(--sp-1); }
.cp-step__btn {
  appearance: none;
  width: var(--h-btn-sm); height: var(--h-btn-sm);
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: var(--t-md);
  line-height: 1;
  cursor: pointer;
  transition: opacity var(--d-fast), border-color var(--d-fast);
}
.cp-step__btn:active { opacity: var(--o-dim); }
.cp-step__btn:disabled { color: var(--ink-off); cursor: not-allowed; opacity: var(--o-dim); }
.cp-step__val {
  min-width: 22px; text-align: center;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--t-base);
  color: var(--ink);
}
.cp-branch__pips { display: flex; gap: 3px; }
.cp-branch__pips i { width: 7px; height: 7px; background: var(--fill-2); border: 1px solid var(--line-strong); }
.cp-branch__pips i.is-on { background: var(--ink-dim); border-color: var(--ink-dim); }
.cp-warn {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-meta);
  color: var(--ink-off);
}

/* ── Прототип фона ──────────────────────────────────────────────────── */
.cp-wave { position: fixed; inset: 0; z-index: var(--z-scene); pointer-events: none; }
.cp-wave__layer { position: absolute; inset: 0; transition: opacity var(--d-panel) var(--e-settle); }
/* Дека — половина силы розового во всей волне. */
.cp-wave--deck :deep(.lp-bg) { --lp-wave-strength: .5; }
.cp-wave__core {
  position: absolute;
  left: 50%;
  /* Совпадает с центром волны — --lp-wave-cy в компоненте фона. */
  top: 46%;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
}

.cp-surface {
  position: fixed;
  top: 60px; right: var(--sp-4);
  z-index: var(--z-topbar);
  display: flex; gap: var(--sp-1);
}

.cp-mock { position: relative; z-index: var(--z-ui); }
.cp-mock__sec {
  min-height: 100vh;
  min-height: 100lvh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--sp-3);
  padding: 0 var(--sp-4) calc(var(--sp-7) * 1.4);
  max-width: 640px;
  margin: 0 auto;
}
.cp-mock__tag {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--ls-wide);
  color: var(--ink-dim);
}
.cp-mock__h {
  margin: 0;
  font-size: var(--t-3xl);
  font-weight: 800;
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
}
.cp-mock__p {
  margin: 0;
  max-width: 46ch;
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  line-height: 1.7;
  color: var(--ink-dim);
}
/* Розовая кнопка-заглушка — проверяем, не спорит ли фон с ней. */
.cp-cta {
  appearance: none;
  align-self: flex-start;
  margin-top: var(--sp-2);
  border: none;
  background: var(--pink);
  color: var(--ink);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--t-md);
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  padding: 0 var(--sp-6);
  min-height: 48px;
  cursor: pointer;
  box-shadow: var(--glow-hero);
  transition: opacity var(--d-press);
}
.cp-cta:active { opacity: var(--o-dim); }

@media (max-width: 640px) {
  /* Пары «знак — ядро» на телефоне выстраиваются в колонку: два бокса по 136
     плюс подпись за отведённую ширину не влезали и обрезались слева. */
  .cp-pairs { gap: var(--sp-5); }
  .cp-pair { width: 100%; gap: var(--sp-3); }
  .cp-pair__slot { flex: 1 1 0; min-width: 0; min-height: 112px; }
  .cp-pair__cap { flex: 0 0 auto; }
  .cp-mock__h { font-size: var(--t-xl); }
}
@media (max-width: 560px) {
  /* Подпись полосы уходит первой: вкладки важнее, «ФОН» обрезался. */
  .cp-bar__title { display: none; }
  .cp-tab { padding: 0 var(--sp-2); }
}

/* Фокус с клавиатуры — видимый и без блума, по конвенции проекта
   (обводка --ink-dim со смещением; так же в shop.css и forge.css). */
.cp-tab:focus-visible,
.cp-chip:focus-visible,
.cp-step__btn:focus-visible,
.cp-cta:focus-visible {
  outline: 2px solid var(--ink-dim);
  outline-offset: 2px;
}

/* При «уменьшить движение» цвет меняется мгновенно. */
@media (prefers-reduced-motion: reduce) {
  .cp-wave__layer { transition: none; }
}
</style>
