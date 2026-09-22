<template>
  <!-- СКРЫТАЯ СТРАНИЦА-МАКЕТ БАФФОВ (ТЗ 22.09.2026, «Баффы и LASH», работа 1/3).
       Адрес /dev/buffs, ниоткуда не линкуется, закрыта от поисковиков тегом
       robots (не через robots.txt — строка запрета там публична и работает как
       указатель). Ничего не встраивает в игру: макет заменяет Figma до того,
       как баффы попадут в бой (см. работы 2 и 3). -->
  <div class="bx">
    <header class="bx-bar">
      <span class="bx-bar__title">БАФФЫ · ПРЕВЬЮ</span>
      <div class="bx-chips">
        <button
          v-for="s in SECTIONS" :key="s.id"
          type="button" class="bx-chip"
          @click="scrollTo(s.id)"
        >{{ s.name }}</button>
      </div>
      <label class="bx-chip bx-chip--fps">
        <input type="checkbox" v-model="showFps" />
        замер FPS
      </label>
    </header>

    <main class="bx-page">
      <!-- ══════════════════ БЛОК 1 · 3D-ПРЕДМЕТЫ ══════════════════ -->
      <section id="b1" class="bx-sec">
        <h2 class="bx-h">1 · ТРИ 3D-ПРЕДМЕТА</h2>
        <p class="bx-note">
          Предметы крутятся на тёмной подставке рядом с манекеном — существующим
          бойцом из игры (вызван через <code>buildFighter</code>, файлы боя не
          правились). В покое предметы матовые, почти без свечения: розовое
          принадлежит действию, а тем же розовым светится ядро бойца. Розовая
          вспышка загорается под предметом только на время его анимации —
          нажмите «проиграть анимацию» и смотрите на подставку.
        </p>

        <div class="bx-stage">
          <BuffsPreviewScene ref="sceneRef" :show-fps="showFps" />
        </div>

        <div class="bx-controls">
          <div class="bx-item-ctl">
            <div class="bx-item-name">TOWEL</div>
            <button type="button" class="bx-btn bx-btn--wide" @click="sceneRef?.playTowel()">▶ проиграть анимацию</button>
          </div>

          <div class="bx-item-ctl">
            <div class="bx-item-name">BUCKET</div>
            <button type="button" class="bx-btn bx-btn--wide" @click="sceneRef?.playBucket()">▶ проиграть анимацию</button>
          </div>

          <div class="bx-item-ctl">
            <div class="bx-item-name">DICE</div>
            <div class="bx-dice-row">
              <button
                v-for="n in 6" :key="n"
                type="button" class="bx-btn bx-btn--sq"
                @click="sceneRef?.playDice(n)"
              >{{ n }}</button>
              <button type="button" class="bx-btn bx-btn--wide" @click="sceneRef?.playDice(null)">🎲 случайно</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ БЛОК 2 · ПЛОСКИЕ ИКОНКИ ══════════════════ -->
      <section id="b2" class="bx-sec">
        <h2 class="bx-h">2 · ПЛОСКИЕ ИКОНКИ ДЛЯ ПАНЕЛИ БОЯ</h2>
        <p class="bx-note">
          Отрендерены из тех же 3D-предметов, отдельным снимком (свой офскрин-
          рендер, прозрачный фон) — в бою 3D в панели не используется, только
          плоская картинка. Эти три снимка уже лежат в репозитории
          (<code>src/assets/images/buff_*.png</code>) и подставлены ниже в панель
          боя, значок и слоты — их же возьмёт работа 2. «Снять иконку»
          пересобирает снимок заново (если предмет в 3D поменяется),
          «Скачать PNG» сохраняет текущий на диск.
        </p>
        <div class="bx-icon-row">
          <div v-for="it in ITEM_META" :key="it.id" class="bx-icon-cell">
            <div class="bx-icon-frame">
              <img v-if="icons[it.id]" :src="icons[it.id]" :alt="it.name" />
              <span v-else class="bx-icon-ph">{{ it.mono }}</span>
            </div>
            <div class="bx-icon-name">{{ it.name }}</div>
            <div class="bx-icon-btns">
              <button type="button" class="bx-btn" @click="snapIcon(it.id)">снять иконку</button>
              <a v-if="icons[it.id]" class="bx-btn bx-link" :href="icons[it.id]" :download="`buff-${it.id}.png`">Скачать PNG</a>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════ БЛОК 3 · ПАНЕЛЬ БОЯ ══════════════════ -->
      <section id="b3" class="bx-sec">
        <h2 class="bx-h">3 · НИЖНЯЯ ПАНЕЛЬ В БОЮ (макет)</h2>
        <p class="bx-note">
          Три карточки в ряд внизу экрана боя. Каждая строка ниже — одно из
          четырёх состояний, все три предмета сразу, для сравнения рядом.
        </p>

        <div v-for="st in PANEL_STATES" :key="st.id" class="bx-panel-row">
          <div class="bx-panel-label">{{ st.label }}</div>
          <div class="bx-panel-bar">
            <BuffCard
              v-for="it in ITEM_META" :key="it.id"
              :item="it" :icon="icons[it.id]" :state="st.id"
              :count="st.id === 'empty' ? 0 : 3"
            />
          </div>
          <p class="bx-panel-desc">{{ st.desc }}</p>
        </div>
      </section>

      <!-- ══════════════════ БЛОК 4 · ЗНАЧОК НАД БОЙЦОМ ══════════════════ -->
      <section id="b4" class="bx-sec">
        <h2 class="bx-h">4 · ЗНАЧОК НАД БОЙЦОМ</h2>
        <p class="bx-note">
          Иконка баффа + кольцо, убывающее за время действия. У кубика рядом с
          кольцом видно выпавшую грань. Свой и чужой различаются яркостью —
          чтобы игрок сразу отличал «моё» от «на меня бросили».
        </p>
        <div class="bx-badge-row">
          <div class="bx-badge-cell">
            <div class="bx-badge-label">СВОЙ БОЕЦ</div>
            <BuffBadge :icon="icons.dice" mono="D" :own="true" :face="4" />
          </div>
          <div class="bx-badge-cell">
            <div class="bx-badge-label">ЧУЖОЙ БОЕЦ</div>
            <BuffBadge :icon="icons.dice" mono="D" :own="false" :face="4" />
          </div>
          <div class="bx-badge-cell">
            <div class="bx-badge-label">СВОЙ · ПОЛОТЕНЦЕ</div>
            <BuffBadge :icon="icons.towel" mono="T" :own="true" />
          </div>
          <div class="bx-badge-cell">
            <div class="bx-badge-label">ЧУЖОЙ · ВЕДРО</div>
            <BuffBadge :icon="icons.bucket" mono="B" :own="false" />
          </div>
        </div>
      </section>

      <!-- ══════════════════ БЛОК 5 · СЛОТЫ ПЕРЕД БОЕМ ══════════════════ -->
      <section id="b5" class="bx-sec">
        <h2 class="bx-h">5 · ВЫБОР НАБОРА ПЕРЕД БОЕМ (макет)</h2>
        <p class="bx-note">
          Три слота «В бой» — как в шаге выбора бойца в ARENA. По умолчанию
          заполнены из запаса; тап по слоту переключает бафф. Можно взять
          одинаковые, пустой слот допустим — кликните, чтобы проверить.
        </p>
        <div class="bx-slots">
          <button
            v-for="(s, i) in slots" :key="i"
            type="button" class="bx-slot"
            :class="{ 'is-empty': s === null }"
            @click="cycleSlot(i)"
          >
            <template v-if="s !== null">
              <img v-if="icons[s]" :src="icons[s]" :alt="s" />
              <span v-else class="bx-icon-ph bx-icon-ph--slot">{{ ITEM_BY_ID[s].mono }}</span>
              <span class="bx-slot-name">{{ ITEM_BY_ID[s].name }}</span>
            </template>
            <template v-else>
              <span class="bx-slot-empty">ПУСТО</span>
            </template>
          </button>
        </div>
        <p class="bx-panel-desc">В бой: {{ slots.filter(s => s !== null).map(s => ITEM_BY_ID[s].name).join(' · ') || '— пусто —' }}</p>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import BuffsPreviewScene from '@/scene/BuffsPreviewScene.vue';
import BuffCard from '@/components/dev/BuffCard.vue';
import BuffBadge from '@/components/dev/BuffBadge.vue';
// Сохранённые в репозитории иконки — ими страница показывает панель, значок и
// слоты сразу, без нажатия «снять иконку». Кнопка снимка остаётся: ею иконка
// пересобирается заново, если предмет в 3D изменится.
import iconTowel from '@/assets/images/buff_towel.png';
import iconBucket from '@/assets/images/buff_bucket.png';
import iconDice from '@/assets/images/buff_dice.png';

const ITEM_META = [
  { id: 'towel', name: 'TOWEL', mono: 'T' },
  { id: 'bucket', name: 'BUCKET', mono: 'B' },
  { id: 'dice', name: 'DICE', mono: 'D' },
];
const ITEM_BY_ID = Object.fromEntries(ITEM_META.map((it) => [it.id, it]));

const PANEL_STATES = [
  { id: 'normal', label: 'ОБЫЧНАЯ', desc: 'Бафф в запасе, ждёт выбора.' },
  { id: 'selected', label: 'ВЫБРАНА', desc: 'Подсвечена, ждёт тапа по бойцу.' },
  { id: 'empty', label: 'ПУСТАЯ (0 ШТУК)', desc: 'Тусклая, не нажимается.' },
  { id: 'locked', label: 'ЗАБЛОКИРОВАНА', desc: 'Бафф на бойце уже действует — нажать можно, но подсветка цели не появится.' },
];

const SECTIONS = [
  { id: 'b1', name: '1 · Предметы' },
  { id: 'b2', name: '2 · Иконки' },
  { id: 'b3', name: '3 · Панель' },
  { id: 'b4', name: '4 · Значок' },
  { id: 'b5', name: '5 · Слоты' },
];

const sceneRef = ref(null);
const showFps = ref(false);
const icons = reactive({ towel: iconTowel, bucket: iconBucket, dice: iconDice });
const slots = ref(['towel', 'bucket', 'dice']);

function snapIcon(id) {
  const url = sceneRef.value?.captureIcon(id);
  if (url) icons[id] = url;
}
function cycleSlot(i) {
  const order = ['towel', 'bucket', 'dice', null];
  const cur = order.indexOf(slots.value[i]);
  slots.value[i] = order[(cur + 1) % order.length];
}
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Страница закрыта от поисковиков тегом, а не robots.txt — строка запрета там
   публична и работает как указатель на скрытый адрес. */
let robotsTag = null;
let prevTitle = null;
onMounted(() => {
  prevTitle = document.title;
  document.title = 'Buffs preview';
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
/* Все значения — из токенов. Углы прямые (кроме круглых элементов — кольцо,
   иконка-заглушка), теней нет, чисто-белого нет. */
.bx {
  min-height: 100vh;
  min-height: 100lvh;
  background: var(--void);
  color: var(--ink);
  font-family: var(--font-ui, var(--font-mono));
  --bx-app-header: 70px;
  padding-top: var(--bx-app-header);
  padding-bottom: var(--sp-7);
}

.bx-bar {
  position: sticky;
  top: var(--bx-app-header);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--carbon);
  border-bottom: 1px solid var(--line);
}
.bx-bar__title {
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
}
.bx-chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.bx-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  min-height: var(--h-btn-sm);
  padding: 0 var(--sp-3);
  border: 1px solid var(--line);
  background: var(--fill-1);
  color: var(--ink-dim);
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-meta);
  cursor: pointer;
  transition: border-color var(--d-hover) var(--e-settle), color var(--d-hover) var(--e-settle);
}
.bx-chip:hover { border-color: var(--line-strong); color: var(--ink); }
.bx-chip--fps { cursor: pointer; }

.bx-page {
  display: flex;
  flex-direction: column;
  gap: var(--sp-7);
  padding: var(--sp-6) var(--sp-4) var(--sp-7);
  max-width: 1200px;
  margin: 0 auto;
}
.bx-sec { display: flex; flex-direction: column; gap: var(--sp-3); scroll-margin-top: calc(var(--bx-app-header) + 60px); }
.bx-h {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-meta);
  color: var(--ink-dim);
}
.bx-note {
  margin: 0;
  max-width: 74ch;
  font-size: var(--t-base);
  line-height: 1.55;
  color: var(--ink-soft);
}
.bx-note code {
  font-family: var(--font-mono);
  font-size: var(--t-sm);
  color: var(--ink);
}

/* ── Блок 1 · сцена + управление ─────────────────────────────────────── */
.bx-stage {
  width: 100%;
  height: min(60vh, 480px);
  min-height: 320px;
  border: 1px solid var(--line);
  background: var(--carbon);
}
.bx-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-4);
}
.bx-item-ctl {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid var(--line);
  background: var(--panel);
}
.bx-item-name {
  font-family: var(--font-display);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--ls-title);
  font-size: var(--t-md);
  color: var(--ink);
}
.bx-dice-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); }

.bx-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  min-height: var(--h-btn-sm);
  min-width: var(--h-btn-sm);
  padding: 0 var(--sp-3);
  border: 1px solid var(--line-strong);
  background: var(--fill-2);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: var(--t-sm);
  letter-spacing: var(--ls-meta);
  cursor: pointer;
  text-decoration: none;
  transition: border-color var(--d-hover) var(--e-settle), box-shadow var(--d-hover) var(--e-settle);
}
.bx-btn:hover { border-color: var(--chrome-hi); box-shadow: var(--glow-hover); }
.bx-btn--wide { flex: 1 1 auto; min-width: 168px; }
.bx-btn--sq { min-width: var(--h-btn-square); padding: 0; }
.bx-link { color: var(--pink); border-color: color-mix(in srgb, var(--pink) 45%, var(--line-strong)); }

/* ── Блок 2 · иконки ─────────────────────────────────────────────────── */
.bx-icon-row { display: flex; flex-wrap: wrap; gap: var(--sp-5); }
.bx-icon-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border: 1px solid var(--line);
  background: var(--panel);
  width: 168px;
}
.bx-icon-frame {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--carbon);
  border: 1px solid var(--line);
}
.bx-icon-frame img { width: 100%; height: 100%; object-fit: contain; }
.bx-icon-name { font-family: var(--font-mono); font-size: var(--t-xs); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.bx-icon-btns { display: flex; flex-direction: column; gap: var(--sp-1); width: 100%; }

.bx-icon-ph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-round);
  border: 1px solid var(--line-strong);
  color: var(--ink-off);
  font-family: var(--font-mono);
  font-size: var(--t-lg);
}
.bx-icon-ph--slot { width: 32px; height: 32px; font-size: var(--t-md); }

/* ── Блок 3 · панель боя, 4 состояния (сами карточки — BuffCard.vue) ──── */
.bx-panel-row { display: flex; flex-direction: column; gap: var(--sp-2); }
.bx-panel-label { font-family: var(--font-mono); font-size: var(--t-xs); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.bx-panel-bar {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--carbon);
  border: 1px solid var(--line);
  width: fit-content;
}
.bx-panel-desc { margin: 0; font-size: var(--t-xs); color: var(--ink-dim); max-width: 60ch; }

/* ── Блок 4 · значок над бойцом (сам значок — BuffBadge.vue) ──────────── */
.bx-badge-row { display: flex; flex-wrap: wrap; gap: var(--sp-6); }
.bx-badge-cell { display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); }
.bx-badge-label { font-family: var(--font-mono); font-size: var(--t-xs); letter-spacing: var(--ls-meta); color: var(--ink-dim); }

/* ── Блок 5 · слоты перед боем ───────────────────────────────────────── */
.bx-slots { display: flex; gap: var(--sp-3); }
.bx-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  width: 96px;
  height: 96px;
  padding: var(--sp-2);
  border: 1px solid var(--line-strong);
  background: var(--fill-1);
  color: var(--ink);
  cursor: pointer;
  transition: border-color var(--d-hover) var(--e-settle), box-shadow var(--d-hover) var(--e-settle);
}
.bx-slot:hover { box-shadow: var(--glow-touch); }
.bx-slot img { width: 32px; height: 32px; object-fit: contain; }
.bx-slot-name { font-family: var(--font-mono); font-size: var(--t-micro); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.bx-slot.is-empty { border-style: dashed; color: var(--ink-off); }
.bx-slot-empty { font-family: var(--font-mono); font-size: var(--t-xs); letter-spacing: var(--ls-meta); color: var(--ink-off); }
</style>
