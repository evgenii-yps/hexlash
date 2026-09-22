<template>
  <!-- СКРЫТАЯ СТРАНИЦА-МАКЕТ ЗАЛА FORGE (ТЗ 23.09.2026).
       Адрес /dev/forge, ниоткуда не линкуется, закрыта от поисковиков тегом
       robots (не через robots.txt — строка запрета там публична и работает как
       указатель). Тот же приём, что у /dev/core и /dev/buffs.

       В ИГРУ НИЧЕГО НЕ ВСТРАИВАЕТСЯ. Настоящий зал (/play/pve) остаётся как
       есть: страница заменяет пустую Figma, владелец принимает формы глазами. -->
  <div class="fx">
    <header class="fx-bar">
      <span class="fx-bar__title">ЗАЛ FORGE · МАКЕТ</span>
      <div class="fx-chips">
        <button v-for="s in SECTIONS" :key="s.id" type="button" class="fx-chip" @click="scrollTo(s.id)">{{ s.name }}</button>
      </div>
      <label class="fx-chip fx-chip--fps"><input type="checkbox" v-model="showFps" /> замер FPS</label>
    </header>

    <main class="fx-page">
      <!-- ═══════════════ 1 · ЗАЛ ЦЕЛИКОМ ═══════════════ -->
      <section id="s1" class="fx-sec">
        <h2 class="fx-h">1 · ЗАЛ ЦЕЛИКОМ, ПРЕДМЕТАМИ</h2>
        <p class="fx-note">
          Панелей нет. Ростер, объект прокачки, SHOP, кабинет и полка баффов стоят
          на плите предметами, одной полосой у ближней кромки. Плита — та же, что
          в настоящем зале, и растёт теми же тремя ступенями. Нажмите по предмету
          в кадре — под ним загорится розовое; по бойцу — поднимется табло статов.
          В покое всё матовое: розовое принадлежит действию.
        </p>

        <!-- ОДНА живая сцена за раз. Двух сразу на странице быть не должно:
             макет принимают на телефоне, а две тяжёлые сцены в одном окне он
             тянет хуже, чем сам зал, — и замер кадров вышел бы неправдой. -->
        <div class="fx-stagecell">
          <div class="fx-stagelabel">
            <button v-for="lay in LAYOUTS" :key="lay.id" type="button" class="fx-chip" :class="{ 'is-on': layout === lay.id }" @click="layout = lay.id">{{ lay.name }}</button>
          </div>
          <div class="fx-stage" :class="`is-${layout}`">
            <ForgeMockScene
              :layout="layout"
              :count="count"
              :v-roster="vRoster"
              :v-upgrade="vUpgrade"
              :v-shop="vShop"
              :legend="legend"
              :stats-open="statsOpen"
              :pressed="pressed"
              :train-state="trainState"
              :show-fps="showFps"
              @press="onPress"
              @pick-fighter="statsOpen = true"
            />
          </div>
        </div>

        <div class="fx-controls">
          <div class="fx-ctl">
            <div class="fx-ctl-name">СТУПЕНЬ ПЛИТЫ · РОСТЕР</div>
            <div class="fx-row">
              <button v-for="n in COUNTS" :key="n" type="button" class="fx-btn" :class="{ 'is-on': count === n }" @click="count = n">до {{ n }}</button>
            </div>
          </div>
          <div class="fx-ctl">
            <div class="fx-ctl-name">СОСТОЯНИЕ БОЙЦА</div>
            <div class="fx-row">
              <button v-for="s in TRAIN" :key="s.id" type="button" class="fx-btn" :class="{ 'is-on': trainState === s.id }" @click="trainState = s.id">{{ s.name }}</button>
            </div>
          </div>
          <div class="fx-ctl">
            <div class="fx-ctl-name">МЕСТО ЛЕГЕНДЫ</div>
            <div class="fx-row">
              <button type="button" class="fx-btn" :class="{ 'is-on': !legend }" @click="legend = false">легенды нет</button>
              <button type="button" class="fx-btn" :class="{ 'is-on': legend }" @click="legend = true">легенда есть</button>
            </div>
          </div>
          <div class="fx-ctl">
            <div class="fx-ctl-name">ТАБЛО СТАТОВ</div>
            <div class="fx-row">
              <button type="button" class="fx-btn" :class="{ 'is-on': !statsOpen }" @click="statsOpen = false">покой</button>
              <button type="button" class="fx-btn" :class="{ 'is-on': statsOpen }" @click="statsOpen = true">открыто</button>
            </div>
          </div>
          <div class="fx-ctl">
            <div class="fx-ctl-name">НАЖАТИЕ ПО ПРЕДМЕТУ</div>
            <div class="fx-row">
              <button type="button" class="fx-btn" :class="{ 'is-on': pressed === null }" @click="pressed = null">покой</button>
              <button v-for="k in PRESSABLE" :key="k.id" type="button" class="fx-btn" :class="{ 'is-on': pressed === k.id }" @click="pressed = k.id">{{ k.name }}</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 2 · ВАРИАНТЫ ФОРМ ═══════════════ -->
      <section id="s2" class="fx-sec">
        <h2 class="fx-h">2 · ПО ТРИ ФОРМЫ НА КАЖДЫЙ ПРЕДМЕТ</h2>
        <p class="fx-note">
          По ростеру, объекту прокачки и паре SHOP + кабинет — три формы каждая.
          Переключатель меняет форму прямо в кадре выше: сравнивать надо в зале,
          а не в вакууме. Один предложенный вариант означает круг правок — на
          превью ядра вариантный показ уже сработал с первого раза.
        </p>
        <div class="fx-controls">
          <div class="fx-ctl">
            <div class="fx-ctl-name">РОСТЕР · блокнот с карандашом</div>
            <div class="fx-row">
              <button v-for="v in ROSTER_V" :key="v.id" type="button" class="fx-btn fx-btn--wide" :class="{ 'is-on': vRoster === v.id }" @click="vRoster = v.id">{{ v.id }} · {{ v.name }}</button>
            </div>
            <p class="fx-desc">{{ ROSTER_V.find(v => v.id === vRoster).desc }}</p>
          </div>
          <div class="fx-ctl">
            <div class="fx-ctl-name">ОБЪЕКТ ПРОКАЧКИ</div>
            <div class="fx-row">
              <button v-for="v in UPGRADE_V" :key="v.id" type="button" class="fx-btn fx-btn--wide" :class="{ 'is-on': vUpgrade === v.id }" @click="vUpgrade = v.id">{{ v.id }} · {{ v.name }}</button>
            </div>
            <p class="fx-desc">{{ UPGRADE_V.find(v => v.id === vUpgrade).desc }}</p>
          </div>
          <div class="fx-ctl">
            <div class="fx-ctl-name">SHOP + КАБИНЕТ</div>
            <div class="fx-row">
              <button v-for="v in SHOP_V" :key="v.id" type="button" class="fx-btn fx-btn--wide" :class="{ 'is-on': vShop === v.id }" @click="vShop = v.id">{{ v.id }} · {{ v.name }}</button>
            </div>
            <p class="fx-desc">{{ SHOP_V.find(v => v.id === vShop).desc }}</p>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 3 · ТЕСНОТА ВЕРТИКАЛЬНОГО КАДРА ═══════════════ -->
      <section id="s3" class="fx-sec">
        <h2 class="fx-h">3 · КУДА ВСТАЮТ ПРЕДМЕТЫ НА ТЕЛЕФОНЕ</h2>
        <p class="fx-note">
          Прямой ответ на §4 ТЗ. В портрете зал держит ОДНО тело — так устроен и
          настоящий зал, и это не обходится: десять тел телефон не тянет. Выбрано
          первое из трёх допустимых направлений — <b>предметы на переднем плане,
          боец за ними</b>, и уточнено замером: предметы стоят ДВУМЯ рядами, а
          боец — между ними. Ближний ряд (ROSTER · FORGE · SHOP) — то, к чему
          ходят, он крупный и стоит ровно в той полосе экрана, которую сегодня
          занимает панель. Дальний (BUFFS · CABINET) — то, на что смотрят: он за
          бойцом, меньше по перспективе и не спорит за ширину кадра.
        </p>
        <p class="fx-note">
          Почему не две позиции камеры: переключатель «на бойца / на предметы»
          добавляет игроку действие там, где его не было, и прячет половину зала
          за нажатием. Почему не прижимать к краям с обрезкой: обрезанный предмет
          на 390 точках перестаёт читаться предметом. Почему все пять предметов не
          встали одним рядом перед бойцом: ряд из пяти шире кадра телефона, камера
          отъезжает — и мелкими становятся сразу и предметы, и боец. Это проверено
          на кадрах, а не решено на словах.
        </p>
        <p class="fx-note fx-note--ptr">
          Смотреть — на вертикальный кадр в разделе 1: он и есть этот ответ.
          Второй живой сцены здесь нет нарочно: две тяжёлые сцены в одном окне
          телефон тянет хуже, чем сам зал, и замер кадров вышел бы неправдой.
        </p>
      </section>

      <!-- ═══════════════ 4 · ЧЕГО ЗДЕСЬ НЕТ ═══════════════ -->
      <section id="s4" class="fx-sec">
        <h2 class="fx-h">4 · ЧЕГО ЗДЕСЬ НЕТ НАРОЧНО</h2>
        <ul class="fx-list">
          <li><b>Ни одной цифры.</b> Счётчиков, очков, опыта, валюты, уровней, порогов и полос заполнения нет — ресурсы вводятся отдельным заходом. На табло статов стоят имена осей и пустые жёлобы: место под значения видно, значений нет.</li>
          <li><b>Полка баффов пустая.</b> Решение 22.09: предметы баффов — позже. Здесь только место, три ниши, помечено заделом.</li>
          <li><b>Дерево граней не тронуто.</b> Объект прокачки — это место, к которому приходят; что именно на нём откроется, решает отдельная работа.</li>
          <li><b>В игру ничего не встроено.</b> Настоящий зал /play/pve работает как работал.</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import ForgeMockScene from '@/scene/ForgeMockScene.vue';

const LAYOUTS = [
  { id: 'portrait', name: 'ВЕРТИКАЛЬНО · 390 × 844' },
  { id: 'landscape', name: 'ГОРИЗОНТАЛЬНО · 844 × 390' },
];
const COUNTS = [4, 7, 10];
const TRAIN = [
  { id: 'free', name: 'FREE · стоит' },
  { id: 'busy', name: 'TRAINING · занят' },
  { id: 'ready', name: 'READY · смирно' },
];
const PRESSABLE = [
  { id: 'roster', name: 'ростер' },
  { id: 'upgrade', name: 'прокачка' },
  { id: 'shop', name: 'SHOP' },
  { id: 'cabinet', name: 'кабинет' },
];
const ROSTER_V = [
  { id: 'A', name: 'планшет', desc: 'Лист на низкой подставке под наклоном, карандаш поперёк. Самый низкий — не спорит с бойцом за кадр.' },
  { id: 'B', name: 'пюпитр', desc: 'Наклонная стойка в рост, блокнот на ней, карандаш в держателе сбоку. Самый заметный, читается издалека.' },
  { id: 'C', name: 'стопка на тумбе', desc: 'Блокнот плашмя на приземистой тумбе, карандаш рядом. Подпись ROSTER выгравирована на передней грани — не на полу.' },
];
const UPGRADE_V = [
  { id: 'A', name: 'наковальня', desc: 'Приземистый огранённый блок, сверху шестиугольная площадка. Прямее всех говорит «сюда приходят работать».' },
  { id: 'B', name: 'верстак', desc: 'Стол, над ним рама с тремя пустыми гнёздами под грани. Место под грани видно заранее.' },
  { id: 'C', name: 'столб', desc: 'Колонна с врезанными гранями по бокам. Самый высокий — держит центр зала, но забирает больше высоты кадра.' },
];
const SHOP_V = [
  { id: 'A', name: 'шкаф + зеркало', desc: 'Витрина-локер для магазина, узкая стойка-зеркало для кабинета. Оба — мебель зала.' },
  { id: 'B', name: 'две двери', desc: 'Створки в торце: магазин шире, кабинет уже. Говорят «отсюда выходят», а не «здесь стоит предмет».' },
  { id: 'C', name: 'тумба + жетон', desc: 'Сумка на тумбе для магазина, жетон-грань на ножке для кабинета. Самая низкая пара — меньше всего спорит за кадр.' },
];
const SECTIONS = [
  { id: 's1', name: '1 · Зал' },
  { id: 's2', name: '2 · Варианты' },
  { id: 's3', name: '3 · Телефон' },
  { id: 's4', name: '4 · Чего нет' },
];

const layout = ref('portrait');   // основная раскладка проекта — вертикальный телефон
const count = ref(4);
const vRoster = ref('A');
const vUpgrade = ref('A');
const vShop = ref('A');
const legend = ref(false);
const statsOpen = ref(false);
const pressed = ref(null);
const trainState = ref('free');
const showFps = ref(false);

let pressTimer = null;
function onPress(key) {
  // Нажатие в кадре гаснет само — свечение принадлежит действию, а не покою.
  pressed.value = key;
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => { pressed.value = null; }, 900);
}
function scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

/* Страница закрыта от поисковиков тегом, а не robots.txt. */
let robotsTag = null;
let prevTitle = null;
onMounted(() => {
  prevTitle = document.title;
  document.title = 'Forge hall mockup';
  robotsTag = document.createElement('meta');
  robotsTag.setAttribute('name', 'robots');
  robotsTag.setAttribute('content', 'noindex, nofollow, noarchive');
  document.head.appendChild(robotsTag);
});
onBeforeUnmount(() => {
  clearTimeout(pressTimer);
  if (prevTitle !== null) document.title = prevTitle;
  if (robotsTag) robotsTag.remove();
});
</script>

<style scoped>
/* Все значения — из токенов. Углы прямые, теней нет, чисто-белого нет. */
.fx {
  min-height: 100vh;
  min-height: 100lvh;
  background: var(--void);
  color: var(--ink);
  font-family: var(--font-mono);
  --fx-app-header: 70px;
  padding-top: var(--fx-app-header);
  padding-bottom: var(--sp-7);
}
.fx-bar {
  /* Полоса НЕ липкая намеренно: вертикальный кадр здесь 844 точки высотой —
     выше окна на ноутбуке, — и липкая полоса накрывала бы ему верх. */
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--carbon);
  border-bottom: 1px solid var(--line);
}
.fx-bar__title { font-size: var(--t-xs); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.fx-chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.fx-chip {
  display: inline-flex; align-items: center; gap: var(--sp-2);
  min-height: var(--h-btn-sm); padding: 0 var(--sp-3);
  border: 1px solid var(--line); background: var(--fill-1);
  color: var(--ink-dim); font-family: var(--font-mono);
  font-size: var(--t-xs); letter-spacing: var(--ls-meta); cursor: pointer;
  transition: border-color var(--d-hover) var(--e-settle), color var(--d-hover) var(--e-settle);
}
.fx-chip:hover { border-color: var(--line-strong); color: var(--ink); }
.fx-chip:focus-visible { outline: 1px solid var(--ink-dim); outline-offset: 2px; }

.fx-page { display: flex; flex-direction: column; gap: var(--sp-7); padding: var(--sp-6) var(--sp-4) var(--sp-7); max-width: 1280px; margin: 0 auto; }
.fx-sec { display: flex; flex-direction: column; gap: var(--sp-3); scroll-margin-top: calc(var(--fx-app-header) + 60px); }
.fx-h { margin: 0; font-size: var(--t-xs); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.fx-note { margin: 0; max-width: 74ch; font-size: var(--t-base); line-height: 1.55; color: var(--ink-soft); }
.fx-note b { color: var(--ink); font-weight: 600; }
.fx-list { margin: 0; padding-left: var(--sp-4); max-width: 74ch; font-size: var(--t-base); line-height: 1.6; color: var(--ink-soft); display: flex; flex-direction: column; gap: var(--sp-2); }
.fx-list b { color: var(--ink); font-weight: 600; }

/* Кадры — в НАСТОЯЩИХ пропорциях телефона, а не «примерно»: макет принимается
   на 390 × 844, и растянутый кадр врал бы ровно про то, ради чего он здесь. */
.fx-stagerow { display: flex; flex-wrap: wrap; gap: var(--sp-5); align-items: flex-start; }
.fx-stagerow--single { justify-content: flex-start; }
.fx-stagecell { display: flex; flex-direction: column; gap: var(--sp-2); }
.fx-stagelabel { display: flex; flex-wrap: wrap; gap: var(--sp-2); font-size: var(--t-xs); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.fx-chip.is-on { border-color: color-mix(in srgb, var(--pink) 55%, var(--line-strong)); color: var(--ink); }
.fx-stage { border: 1px solid var(--line); background: var(--carbon); }
.fx-stage.is-portrait { width: 390px; height: 844px; }
.fx-stage.is-landscape { width: 844px; height: 390px; }
@media (max-width: 900px) {
  .fx-stage.is-landscape { width: min(100%, 844px); height: min(46vw, 390px); }
  .fx-stage.is-portrait { width: min(100%, 390px); height: min(216vw, 844px); }
}

.fx-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--sp-4); }
.fx-ctl { display: flex; flex-direction: column; gap: var(--sp-2); padding: var(--sp-3); border: 1px solid var(--line); background: var(--panel); }
.fx-ctl-name { font-size: var(--t-xs); letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.fx-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.fx-note--ptr { border-left: 1px solid var(--line-strong); padding-left: var(--sp-3); }
.fx-desc { margin: 0; font-size: var(--t-xs); color: var(--ink-dim); line-height: 1.5; }
.fx-btn {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: var(--h-btn-sm); padding: 0 var(--sp-3);
  border: 1px solid var(--line-strong); background: var(--fill-2); color: var(--ink);
  font-family: var(--font-mono); font-size: var(--t-sm); letter-spacing: var(--ls-meta);
  cursor: pointer;
  transition: border-color var(--d-hover) var(--e-settle), box-shadow var(--d-hover) var(--e-settle);
}
.fx-btn:hover { border-color: var(--chrome-hi); box-shadow: var(--glow-hover); }
.fx-btn:focus-visible { outline: 1px solid var(--ink-dim); outline-offset: 2px; }
.fx-btn:active { transform: translateY(1px); }
.fx-btn--wide { flex: 1 1 auto; min-width: 190px; }
.fx-btn.is-on { border-color: color-mix(in srgb, var(--pink) 55%, var(--line-strong)); color: var(--ink); }
</style>
