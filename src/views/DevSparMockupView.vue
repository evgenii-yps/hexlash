<template>
  <!-- СКРЫТАЯ СТРАНИЦА-МАКЕТ SPAR (ТЗ 24.09.2026, вторая редакция «меню слева,
       сцена с двумя бойцами»). Адрес /dev/spar, ниоткуда не линкуется, закрыта
       от поисковиков тегом robots (не через robots.txt — строка запрета там
       публична и работает как указатель).

       ЧТО ЭТО. Бой-настройка: игрок берёт своего бойца и СОБИРАЕТ ему
       соперника — ядро и кристаллы. Единственный способ увидеть глазами, что
       дала прокачка: «Зеркало» против «Чистого».

       ═══ ЧТО ИЗМЕНИЛОСЬ ПРОТИВ ПЕРВОЙ РЕДАКЦИИ ═══════════════════════════
       Первая была плоской: три строки списка, подпись «пусто» и много пустой
       черноты. Экран про бой двух фигур не показывал НИ ОДНОЙ фигуры. Лечение
       не в том, чтобы ужать настройки, а в связке: всё управление уходит в
       узкую колонку слева, и всё освободившееся место отдаётся сцене, где
       стоят двое. Вместе с этим сняты полоса из трёх шагов и верхняя строка
       «боец против сборки» — их работу делают разделы панели и сама сцена.

       ⚠️ ОДНА ПАНЕЛЬ В ДВУХ ПОВЕДЕНИЯХ, а не два экрана. Широко — приколочена
       колонкой слева, сцена рядом. Стоя на телефоне колонки не существует:
       та же панель выезжает от левого края поверх сцены и уезжает обратно.
       Механика взята у кабинета игрока (PlayerCabinet + cabinet.css): тот же
       сдвиг, та же затемняющая подложка, те же три выхода — крестик, нажатие
       мимо, Esc. Второго способа делать то же самое нам не нужно.

       ⚠️ SPAR НЕ ДАЁТ ИГРОКУ НИЧЕГО и НИЧЕГО НИКУДА НЕ ЗАПИСЫВАЕТ. Ростер
       только ЧИТАЕТСЯ (геттеры), ни одного dispatch/commit. Дерево соперника
       живёт ЗДЕСЬ, в памяти страницы, и строится buildTree() напрямую.

       ⚠️ НИ ОДНОЙ ЦИФРЫ НА ЭКРАНЕ. Ни в панели, ни на сцене, ни в подписях.
       ⚠️ ВНУТРЕННЕГО СЛОВАРЯ НАРУЖУ НЕТ: ни HEXARCH, ни TEMPER, ни DOCTRINE,
          ни ASCENSION, ни HOUSE.

       СЛОВАРЬ. ГРАНЬ — весь луч «Печати» от сердца до кромки, их три.
       КРИСТАЛЛ — один из пяти шагов внутри грани, всего пятнадцать. В игровых
       данных гранью до сих пор зовётся `crystal`, а кристаллом — `face`.

       ЧТО ТРОГАЕТ В ИГРЕ. Ровно один файл — роутер (адрес). Всё остальное
       только читается или живёт своими копиями рядом (SparScene.vue — своя
       сцена страницы, по образцу BuffsPreviewScene у /dev/buffs). -->
  <div class="sp" :class="{ 'panel-open': panelOpen }">

    <!-- ── СЦЕНА ─────────────────────────────────────────────────────────
         Живёт ВСЕГДА и одна на все раскладки: открытие панели её не трогает,
         поворот экрана её не пересобирает (ТЗ §5.8, §6). -->
    <SparScene ref="sceneRef" class="sp-scene" @ready="onSceneReady" />

    <!-- Шапка: возврат. Единственный орган управления вне панели, кроме
         язычка её открытия. -->
    <header class="sp-bar">
      <button type="button" class="sp-bar__back" @click="goBack">← НАЗАД</button>
      <span class="sp-bar__title">SPAR · МАКЕТ</span>
    </header>

    <!-- ЯЗЫЧОК. Только стоя (широко панель приколочена и открывать нечего).

         ⚠️ ОТКРЫВАЕТ ПО `pointerup`, А НЕ ПО `click`, и это не стиль. Поздний
         клик гасится отменой действия по концу касания (см. killLate ниже), а
         отменённый конец касания уносит с собой И САМ КЛИК — на телефоне язычок
         переставал открывать панель вовсе. Поймано прогоном. Указатель приходит
         раньше отменяемого конца касания, поэтому по нему открывается надёжно;
         клавиатура идёт своей строкой, иначе с неё было бы не открыть.

         ⚠️ И ЯЗЫЧОК НЕ УБИРАЕТСЯ ИЗ РАЗМЕТКИ, А ГАСНЕТ. Здесь стояло
         `v-if="!panelOpen"`, и это ломало гашение позднего клика полностью:
         открытие снимало язычок с дерева ПРЯМО МЕЖДУ концом касания и его
         всплытием, конец касания до гасителя на документе не доходил, отмены
         не случалось — и досланный клик попадал в подложку, которая как раз
         встала под палец, и закрывал панель обратно. Замерено: панель не
         открывалась ни разу. Погашенный язычок остаётся в дереве, конец касания
         всплывает как положено, а от пальца и от обхода с клавиатуры он закрыт
         прозрачностью, `pointer-events` и снятым порядком обхода. -->
    <button
      type="button" class="sp-tab" :class="{ 'is-hidden': panelOpen }"
      aria-label="Открыть настройки"
      :aria-hidden="panelOpen ? 'true' : 'false'"
      :tabindex="panelOpen ? -1 : 0"
      @pointerup="openPanel"
      @keydown.enter.prevent="openPanel"
      @keydown.space.prevent="openPanel"
    ><span class="ch">›</span><span class="w">СБОРКА</span></button>

    <!-- ПОДЛОЖКА. Только стоя и только при открытой панели: нажатие мимо
         панели её закрывает. -->
    <div v-if="panelOpen" class="sp-scrim" @click="closePanel" />

    <!-- ── ПАНЕЛЬ ─────────────────────────────────────────────────────────
         Всё управление экраном — здесь. Органов вне неё нет. -->
    <aside class="sp-panel" :class="{ open: panelOpen }" aria-label="Сборка спарринга">
      <header class="sp-phead">
        <span class="sp-ptitle">СБОРКА</span>
        <button type="button" class="sp-x" aria-label="Закрыть" @click="closePanel">✕</button>
      </header>

      <!-- ПУСТО. Страница служебная, игрок может прийти на неё чистым.
           Не пустой экран и не ошибка: понятная заглушка и куда идти. -->
      <div v-if="!fighters.length" class="sp-hole">
        <p class="sp-hole__t">БОЙЦОВ НЕТ</p>
        <p class="sp-hole__b">
          Спарринг собирают вокруг своего бойца, а его нет ни одного.
          Возьмите бойца в зале FORGE и возвращайтесь.
        </p>
        <button type="button" class="sp-hole__btn" @click="toForge">В ЗАЛ FORGE</button>
      </div>

      <!-- ОШИБКА. Одной строкой и с работающим возвратом. Молчаливый чёрный
           экран — брак. Сюда приходит несобравшееся дерево соперника. -->
      <div v-else-if="fatal" class="sp-hole">
        <p class="sp-hole__t">ЯДРО НЕ СОБРАЛОСЬ</p>
        <p class="sp-hole__b">{{ fatal }}</p>
        <button type="button" class="sp-hole__btn" @click="goBack">НАЗАД</button>
      </div>

      <div v-else class="sp-pbody" ref="bodyEl">

        <!-- ── твой боец ────────────────────────────────────────────────
             ⚠️ ЗАНЯТЫЙ ВЫБИРАЕТСЯ НАРАВНЕ СО ВСЕМИ. SPAR ничего не даёт и
             ничего не отнимает — запрещать нечего. Состояние показано, потому
             что по нему читают бойца, а не потому что оно запрещает. -->
        <section class="sp-sec">
          <p class="sp-label">ТВОЙ БОЕЦ</p>
          <ul class="sp-list">
            <li v-for="f in fighters" :key="f.id">
              <button
                type="button" class="sp-row" :class="{ on: f.id === myId }"
                :style="{ '--core': coreOf(f).hue }"
                :aria-current="f.id === myId ? 'true' : 'false'"
                @click="pickMine(f.id)"
              >
                <span class="sw" aria-hidden="true"></span>
                <span class="nm">{{ f.callsign }}</span>
                <span class="cr">{{ coreOf(f).name }}</span>
                <span v-if="stateOf(f.id) !== 'free'" class="st">{{ stateWord(stateOf(f.id)) }}</span>
              </button>
            </li>
          </ul>
          <p class="sp-build">
            <span class="k">ЗАЖЖЕНО</span>
            <span v-if="!myLit.length" class="ph">пусто</span>
            <template v-else><span v-for="(n, i) in myLit" :key="i" class="b">{{ n }}</span></template>
          </p>
        </section>

        <!-- ── соперник: заготовки ─────────────────────────────────────── -->
        <section class="sp-sec">
          <p class="sp-label">ЗАГОТОВКИ</p>
          <div class="sp-presets">
            <button type="button" class="sp-preset" @click="presetMirror">ЗЕРКАЛО</button>
            <button type="button" class="sp-preset" @click="presetClean">ЧИСТЫЙ</button>
          </div>
          <p class="sp-note">
            «Зеркало» — точная копия твоего бойца. «Чистый» — то же ядро без
            единого кристалла. После любой заготовки сборка правится дальше.
          </p>
        </section>

        <!-- ── соперник: ядро ──────────────────────────────────────────── -->
        <section class="sp-sec">
          <p class="sp-label">ЯДРО СОПЕРНИКА</p>
          <div class="sp-cores">
            <button
              v-for="c in CORES" :key="c.id"
              type="button" class="sp-core" :class="{ on: c.id === foeCore }"
              :style="{ '--core': c.hue }"
              :aria-pressed="c.id === foeCore ? 'true' : 'false'"
              @click="pickFoeCore(c.id)"
            ><i class="sw" aria-hidden="true"></i>{{ c.name }}</button>
          </div>
        </section>

        <!-- ── соперник: кристаллы ─────────────────────────────────────────
             Интерфейс — ТОТ ЖЕ, что стоит в зале (ForgeCore), без единой
             правки. Новых форм не рисуется.

             ⚠️ ПОГАСИТЬ КРИСТАЛЛ ЗДЕСЬ НЕЧЕМ: ForgeCore умеет только зажигать
             (в зале гашение тоже недоступно), а править его этой работе
             нельзя. Выход из промаха — «ЧИСТЫЙ»: он собирает соперника ЗАНОВО
             с нуля, а не гасит по одному, и результат на экране тот же.

             ⚠️ ПОЗДНИЙ КЛИК гасится на этом узле — см. armLateClick. -->
        <section class="sp-sec sp-sec--core" ref="coreHost">
          <p class="sp-label">КРИСТАЛЛЫ СОПЕРНИКА</p>
          <ForgeCore
            v-if="foeTree"
            :core-id="foeCore"
            :tree="foeTree"
            :spent="foeSpent"
            :resource="RESOURCE"
            :gates="{}"
            fighter-name="СОПЕРНИК"
            :core-name="foeCoreMeta.name"
            @toggle="onFoeToggle"
          />
        </section>

        <!-- ── баффы ───────────────────────────────────────────────────────
             ⚠️ БЕСКОНЕЧНЫЕ, БЕСПЛАТНЫЕ, ОБЕИМ СТОРОНАМ. LASH не тратится,
             запас не считается, цифр нет. Бесконечные у одной стороны сделали
             бы проверку нечестной, а SPAR ровно для проверки и существует.

             Форма — та же, что в воротах арены (BuffKitSlots). Сам компонент
             ворот сюда не берётся: он приколочен к экрану, знает про запас и
             LASH и ЗАПИСЫВАЕТ выбор в хранилище — а здесь не записывается
             ничего. -->
        <section class="sp-sec">
          <p class="sp-label">БАФФЫ · ТВОЙ БОЕЦ</p>
          <div class="sp-kit">
            <button
              v-for="(slot, i) in myKit" :key="'m' + i"
              type="button" class="sp-slot" :class="{ 'is-empty': slot === null }"
              @click="cycle('me', i)"
            >
              <template v-if="slot">
                <img class="ic" :src="ICONS[slot]" :alt="BUFF_META[slot].name" />
                <span class="nm">{{ BUFF_META[slot].name }}</span>
              </template>
              <span v-else class="nm nm--empty">ПУСТО</span>
            </button>
          </div>

          <p class="sp-label">БАФФЫ · СОПЕРНИК</p>
          <div class="sp-kit">
            <button
              v-for="(slot, i) in foeKit" :key="'f' + i"
              type="button" class="sp-slot" :class="{ 'is-empty': slot === null }"
              @click="cycle('foe', i)"
            >
              <template v-if="slot">
                <img class="ic" :src="ICONS[slot]" :alt="BUFF_META[slot].name" />
                <span class="nm">{{ BUFF_META[slot].name }}</span>
              </template>
              <span v-else class="nm nm--empty">ПУСТО</span>
            </button>
          </div>
        </section>

        <p class="sp-note">
          В макете бой не запускается: нажатие показывает состав обеих сторон
          словами — проверить, что собралось именно то, что собирали.
        </p>
      </div>

      <!-- ── В БОЙ ────────────────────────────────────────────────────────
           ⚠️ ПРИКОЛОЧЕНА К НИЗУ ПАНЕЛИ, А НЕ СТОИТ В ПРОКРУТКЕ. Главное
           действие экрана не должно доставаться прокруткой мимо всей сборки.

           ⚠️ И БЕЗ ОРЕОЛА, матовой розовой — как приколоченная кнопка кабинета.
           Геройское свечение на этом экране УЖЕ ЕСТЬ И ОНО ОДНО: ядро бойца в
           сцене. Светящаяся кнопка встала бы с ним в спор, а на глубине карточки
           ядра рядом оказывается ещё и её собственная розовая «зажечь» — на
           снимке это читалось как два главных действия сразу. -->
      <button v-if="fighters.length && !fatal" type="button" class="sp-go" @click="openStub">В БОЙ</button>
    </aside>

    <!-- ── ЗАГЛУШКА БОЯ ───────────────────────────────────────────────── -->
    <div v-if="stub" class="sp-stub" role="dialog" aria-modal="true" @click.self="stub = null">
      <div class="sp-stub__box">
        <p class="sp-stub__kick">БОЙ НЕ ЗАПУСКАЕТСЯ · МАКЕТ</p>
        <div class="sp-stub__grid">
          <div class="sp-stub__col" :style="{ '--core': myCore.hue }">
            <p class="sp-stub__h"><i class="sw" aria-hidden="true"></i>{{ stub.myName }}</p>
            <p class="sp-stub__l"><span class="k">ЯДРО</span><span class="v">{{ stub.myCore }}</span></p>
            <p class="sp-stub__l"><span class="k">КРИСТАЛЛЫ</span><span class="v">{{ stub.myLit }}</span></p>
            <p class="sp-stub__l"><span class="k">БАФФЫ</span><span class="v">{{ stub.myBuffs }}</span></p>
          </div>
          <div class="sp-stub__col" :style="{ '--core': foeCoreMeta.hue }">
            <p class="sp-stub__h"><i class="sw" aria-hidden="true"></i>СОПЕРНИК</p>
            <p class="sp-stub__l"><span class="k">ЯДРО</span><span class="v">{{ stub.foeCore }}</span></p>
            <p class="sp-stub__l"><span class="k">КРИСТАЛЛЫ</span><span class="v">{{ stub.foeLit }}</span></p>
            <p class="sp-stub__l"><span class="k">БАФФЫ</span><span class="v">{{ stub.foeBuffs }}</span></p>
          </div>
        </div>
        <button type="button" class="sp-stub__btn" @click="stub = null">ЗАКРЫТЬ</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import ForgeCore from '@/components/forge/ForgeCore.vue';
import SparScene from '@/scene/SparScene.vue';
import { CORES, RESOURCE, getCore } from '@/data/upgradeData.js';
import { buildTree, litIdsOf, countLit } from '@/data/upgradeTree.js';
import { crystalTitle } from '@/data/crystalTexts.js';
import { BUFF_IDS, BUFF_META } from '@/data/buffBalance.js';
import towel from '@/assets/images/buff_towel.png';
import bucket from '@/assets/images/buff_bucket.png';
import dice from '@/assets/images/buff_dice.png';
import '@/styles/forge.css';   // слой ядра: правила .fc-* живут там

const router = useRouter();

const ICONS = { towel, bucket, dice };
const KIT_SLOTS = 3;

const stub = ref(null);
const fatal = ref('');
const coreHost = ref(null);
const sceneRef = ref(null);
/* Открыта ли выезжающая панель. Широко она приколочена и этот признак на неё
   не влияет вовсе — там он управляет только подложкой и язычком, которых на
   широком экране нет (CSS). */
const panelOpen = ref(false);

/* ── СТОРОНА ИГРОКА · ТОЛЬКО ЧТЕНИЕ ───────────────────────────────────
   Ростер читается геттерами и не трогается ни одним действием: SPAR ничего
   никуда не записывает. Поэтому и выбранный боец хранится ЗДЕСЬ, а не через
   roster/pick — тот сохраняется в сейф и увёл бы за собой зал. */
const fighters = computed(() => store.getters['roster/fighters']);
const myId = ref(null);
const me = computed(() => fighters.value.find((f) => f.id === myId.value) || null);
const coreOf = (f) => getCore(f.core);
const myCore = computed(() => (me.value ? coreOf(me.value) : CORES[2]));

/* Дерево своего бойца. В хранилище оно строится лениво, и у нетронутого бойца
   его просто нет — но достраивать его ОТСЮДА нельзя: ensureTree пишет в сейф.
   Здесь берётся своя копия на чтение. */
const myTree = computed(() => {
  const f = me.value;
  if (!f) return null;
  return f.upgrade || buildTree(f.core, null);
});
const litNamesOf = (tree) => {
  const out = [];
  (tree || []).forEach((cr) => cr.faces.forEach((face, i) => {
    if (face.state === 'lit') out.push(crystalTitle(cr.id, i) || face.name);
  }));
  return out;
};
const myLit = computed(() => litNamesOf(myTree.value));

/* Состояние занятия — тем же геттером, что и у зала. Своей копии проверки
   здесь нет: две копии разошлись бы в первый же день. */
const stateOf = (id) => store.getters['roster/trainingState'](id);
const stateWord = (st) => (st === 'busy' ? 'занят' : st === 'ready' ? 'готов' : 'свободен');

/* ── СТОРОНА СОПЕРНИКА · ЖИВЁТ ТОЛЬКО ЗДЕСЬ ───────────────────────────
   Дерево строится buildTree() в память страницы. Ни одного commit: ростер о
   сопернике не знает и знать не должен. */
const foeCore = ref(CORES[0].id);
const foeTree = ref(null);
const foeCoreMeta = computed(() => getCore(foeCore.value));
const foeSpent = computed(() => countLit(foeTree.value));
const foeLit = computed(() => litNamesOf(foeTree.value));

/* Дерево с обработкой отказа: нераспознанное ядро — это ошибка страницы, а не
   молчаливо пустая сборка. */
function makeTree(coreId, lit) {
  const tree = buildTree(coreId, lit);
  if (!tree) {
    fatal.value = 'Данные прокачки не прочитались, и собрать сопернику ядро не из чего.';
    return null;
  }
  return tree;
}

function pickFoeCore(id) {
  /* Кристаллы у ядер СВОИ, и перенести зажжённое между ядрами нечем: смена
     ядра обнуляет сборку. Это честнее, чем угадывать соответствие. */
  foeCore.value = id;
  foeTree.value = makeTree(id, null);
}
function presetMirror() {
  if (!me.value) return;
  foeCore.value = me.value.core;
  foeTree.value = makeTree(me.value.core, litIdsOf(myTree.value));
}
/* ⚠️ «ЧИСТЫЙ» СОБИРАЕТ ЗАНОВО, А НЕ ГАСИТ ПО ОДНОМУ. Гасить нечем — ForgeCore
   умеет только зажигать, — поэтому дерево строится с нуля. Результат на экране
   тот же, и это оговорено ТЗ §2.4. */
function presetClean() {
  if (!me.value) return;
  foeCore.value = me.value.core;
  foeTree.value = makeTree(me.value.core, null);
}

/* ЗАЖИГАНИЕ. Те же два предела, что и в хранилище — предел грани и потолок
   пять, — и ни одного третьего: занятие здесь не спрашивается, права SPAR не
   выдаёт и не забирает.

   ⚠️ Наружу ForgeCore отдаёт СТАРЫЕ ИМЕНА: crystalId — это грань, faceId —
   кристалл. Так их зовёт хранилище.

   ⚠️ ДЕРЕВО ЗАМЕНЯЕТСЯ ЦЕЛИКОМ, а не правится на месте: сцена пересобирает
   фигуру по наблюдателю за ссылкой, и правка вглубь его бы не разбудила. */
function onFoeToggle({ crystalId, faceId }) {
  const tree = foeTree.value;
  if (!tree) return;
  const branch = tree.find((c) => c.id === crystalId);
  const face = branch && branch.faces.find((f) => f.id === faceId);
  if (!face || face.state !== 'open') return;
  if (branch.faces.filter((f) => f.state === 'lit').length >= branch.limit) return;
  if (countLit(tree) >= RESOURCE) return;
  face.state = 'lit';
  foeTree.value = tree.map((b) => ({ ...b, faces: b.faces.map((f) => ({ ...f })) }));
}

/* ── СЦЕНА ОТВЕЧАЕТ НА СБОРКУ ─────────────────────────────────────────
   Обе стороны пересобираются, как только меняется их ядро или дерево. Фигура
   строится ИЗ САМОЙ СБОРКИ — второй записи «как выглядит соперник» нет.

   ⚠️ ЧТО ПРИ ЭТОМ ВИДНО ГЛАЗАМИ. Ядро — полностью: цвет фигуры и её ореол.
   Кристаллы — на СТОЯЩЕЙ фигуре ничем: они меняют оси, оси меняют МАНЕРУ, а
   манера живёт в навигации, до которой планка без мозга не доходит. Своего
   значка «тут горит кристалл» здесь не заводится — это был бы выдуманный язык
   поверх настоящего; сборка показана там, где она и читается, — на «Печати» в
   панели. Разбор и цена лечения — в отчёте разведки по внешности. */
const sceneReady = ref(false);
function onSceneReady() { sceneReady.value = true; pushBoth(); }
function pushSide(key) {
  if (!sceneReady.value) return;
  const api = sceneRef.value;
  if (!api) return;
  if (key === 'me') api.setSide('me', { coreId: me.value?.core || null, tree: myTree.value });
  else api.setSide('foe', { coreId: foeCore.value, tree: foeTree.value });
}
function pushBoth() { pushSide('me'); pushSide('foe'); }
watch([() => me.value?.id, myTree], () => pushSide('me'));
watch([foeCore, foeTree], () => pushSide('foe'));

/* ── баффы ────────────────────────────────────────────────────────────
   Бесконечные, бесплатные, обеим сторонам, нигде не сохраняются.
   ⚠️ Сторона приходит КЛЮЧОМ, а не самим набором: в разметке Vue разворачивает
   ref в значение, и переданный туда myKit — это уже массив без .value. */
const myKit = ref(Array(KIT_SLOTS).fill(null));
const foeKit = ref(Array(KIT_SLOTS).fill(null));
function cycle(side, i) {
  const kit = side === 'me' ? myKit : foeKit;
  const order = [...BUFF_IDS, null];
  kit.value[i] = order[(order.indexOf(kit.value[i]) + 1) % order.length];
}
const kitWords = (kit) => {
  const on = kit.filter(Boolean).map((id) => BUFF_META[id].name);
  return on.length ? on.join(' · ') : 'нет';
};

/* ── заглушка боя ─────────────────────────────────────────────────────
   Составом СЛОВАМИ и без единой цифры: проверить, что собралось то, что
   собирали. Бой в макете не запускается. */
const buildLine = (names) => (names.length ? names.join(' · ') : 'без кристаллов');
function openStub() {
  stub.value = {
    myName: me.value ? me.value.callsign : '—',
    myCore: myCore.value.name,
    myLit: buildLine(myLit.value),
    myBuffs: kitWords(myKit.value),
    foeCore: foeCoreMeta.value.name,
    foeLit: buildLine(foeLit.value),
    foeBuffs: kitWords(foeKit.value),
  };
}

function pickMine(id) {
  myId.value = id;
  /* Соперник всегда осмыслен относительно выбранного: смена бойца ставит
     «Чистого» его ядра — пару к «Зеркалу», ради которой всё и делается. */
  presetClean();
}

/* ── панель ───────────────────────────────────────────────────────────
   Три выхода, как у кабинета: крестик, нажатие мимо, Esc. */
const bodyEl = ref(null);
/* ⚠️ ПАНЕЛЬ ОТКРЫВАЕТСЯ СВЕРХУ. ForgeCore на монтировании сам подводит свою
   карточку под верх прокрутки — в зале это правильно (её и открыли), а здесь
   панель несёт ВСЮ сборку, и игрок попадал сразу в середину, мимо выбора
   бойца. Сбрасываем один раз на открытии; дальше прокрутку ведёт сам ForgeCore
   при смене уровня, и в это мы не вмешиваемся. */
function scrollPanelTop() {
  nextTick(() => { if (bodyEl.value) bodyEl.value.scrollTop = 0; });
}
function openPanel() { panelOpen.value = true; scrollPanelTop(); }
function closePanel() { panelOpen.value = false; }
function onKeydown(e) {
  if (e.key !== 'Escape') return;
  if (stub.value) { stub.value = null; return; }
  if (panelOpen.value) closePanel();
}

/* ── ПОЗДНИЙ КЛИК ──────────────────────────────────────────────────────
   На сенсорном экране браузер после касания досылает вдогонку обычный клик
   мышью, примерно через треть секунды. За эту треть секунды разметка под
   пальцем успевает перестроиться — и клик попадает уже в новую: зажигает
   кристалл, которого игрок не выбирал, или жмёт кнопку в только что
   открывшейся панели. Тот же приём, что в зале: отменяем действие по концу
   касания — это единственное, что браузер спрашивает перед тем, как этот клик
   выдумать.

   ДВА МЕСТА, И ОБА ТОЧЕЧНЫЕ:
     · над самой фигурой «Печати» (.fc-stage) — там перестраивается карточка;
     · на язычке открытия панели — самое удобное место для этой поломки: панель
       встаёт ровно под палец.
   ⚠️ Гасить на всей странице нельзя: кнопки «зажечь» и «назад» стоят под
   фигурой и ловят обычный клик — на телефоне они перестали бы работать вовсе.
   ⚠️ Слушателя нельзя вешать пассивным: пассивному браузер отменять не даёт. */
const KILL_LATE = '.fc-stage, .sp-tab';
function killLate(e) {
  const t = e.target;
  if (t && t.closest && t.closest(KILL_LATE)) e.preventDefault();
}

function goBack() { router.back(); }
function toForge() { router.push('/play/pve'); }

/* Страница закрыта от поисковиков тегом, а не robots.txt: строка запрета там
   публична и работает как указатель. */
let robotsTag = null;
let prevTitle = '';

onMounted(() => {
  prevTitle = document.title;
  document.title = 'SPAR · макет — Hexlash';
  robotsTag = document.createElement('meta');
  robotsTag.setAttribute('name', 'robots');
  robotsTag.setAttribute('content', 'noindex, nofollow, noarchive');
  document.head.appendChild(robotsTag);

  /* Кого открыть первым: того, кого открыл зал, иначе первого по списку.
     Читаем — не выбираем: roster/pick писал бы в сейф. */
  const picked = store.getters['roster/pickedId'];
  const list = fighters.value;
  if (list.length) {
    myId.value = list.some((f) => f.id === picked) ? picked : list[0].id;
    presetClean();
  }

  /* Широко панель приколочена и открывать её нечем — сброс прокрутки нужен и
     там, иначе первый кадр встаёт на середине сборки. */
  scrollPanelTop();

  window.addEventListener('keydown', onKeydown);
  document.addEventListener('touchend', killLate, { passive: false });
});

onBeforeUnmount(() => {
  document.title = prevTitle;
  if (robotsTag) robotsTag.remove();
  window.removeEventListener('keydown', onKeydown);
  document.removeEventListener('touchend', killLate);
});
</script>

<style scoped>
/* ⚠️ ВСЕ ЗНАЧЕНИЯ — ИЗ tokens.css. Своих цветов, кеглей и отступов здесь нет.
   Скругление нулевое везде, включая заглушку боя: система разрешает радиус
   модальным окнам, но не обязывает, а прямой угол здесь узнаваем.

   ⚠️ ПОВЕРХ ОБОЛОЧКИ ПРИЛОЖЕНИЯ. App.vue держит свою шапку со знаком на всех
   адресах, кроме /play/* и витрины, — на дежурном адресе она встала бы поверх
   полосы этой страницы. Убрать её из App.vue нельзя: эта работа трогает ровно
   один игровой файл, роутер. Поэтому страница — сплошной непрозрачный слой на
   ступень выше шапки (--z-topbar), как выезжающие панели. */
.sp {
  position: fixed; inset: 0; z-index: var(--z-panel);
  background: var(--void); color: var(--ink);
  font-family: var(--font-display);
  overflow: hidden;
}

/* ── сцена ────────────────────────────────────────────────────────────
   Занимает экран целиком и НЕ переезжает при открытии панели: панель едет
   поверх неё. Широко панель приколочена слева, и сцене остаётся правая часть —
   сдвигом кадра, а не пересборкой. */
.sp-scene { position: absolute; inset: 0; }

/* ── шапка ────────────────────────────────────────────────────────────
   Поверх сцены, своими указателями: сама полоса их не ловит, чтобы нажатие
   мимо кнопки уходило странице. */
.sp-bar {
  position: absolute; top: 0; left: 0; right: 0; z-index: var(--z-topbar);
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  pointer-events: none;
}
.sp-bar__title {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
}
.sp-bar__back {
  pointer-events: auto;
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-dim);
  background: color-mix(in srgb, var(--void) 70%, transparent);
  border: 1px solid var(--line); padding: var(--sp-2) var(--sp-3);
  min-height: 36px; cursor: pointer;
  transition: border-color var(--d-hover) var(--e-weight), color var(--d-hover) var(--e-weight);
}
.sp-bar__back:hover { border-color: var(--line-strong); color: var(--ink); }
.sp-bar__back:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }

/* ── язычок ───────────────────────────────────────────────────────────
   ⚠️ СТОИТ ВНИЗУ, А НЕ ПОСЕРЕДИНЕ КРАЯ. Посередине он ложился ровно на левого
   бойца — поймано снимком: фигуры стоят в средней трети кадра, и середина
   левого края это их пояс. Внизу он чист от обеих и заодно попадает в ту зону,
   до которой на телефоне дотягивается большой палец.
   Широко он не существует вовсе (CSS ниже): там панель приколочена и открывать
   нечего. */
.sp-tab {
  position: absolute; left: 0; bottom: var(--sp-6);
  z-index: var(--z-ui);
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-1);
  padding: var(--sp-3) var(--sp-1); min-width: 28px; min-height: 96px;
  cursor: pointer; font: inherit;
  background: color-mix(in srgb, var(--panel) 90%, transparent);
  border: 1px solid var(--line); border-left: none;
  color: var(--ink-dim);
  transition: color var(--d-hover) var(--e-weight), border-color var(--d-hover) var(--e-weight);
}
.sp-tab:hover { color: var(--ink); border-color: var(--line-strong); }
/* Погашен, но остался в дереве — см. разметку. */
.sp-tab.is-hidden { opacity: 0; pointer-events: none; }
.sp-tab:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }
.sp-tab .ch { font-size: var(--t-md); line-height: 1; }
.sp-tab .w {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); writing-mode: vertical-rl;
}

/* ── подложка ─────────────────────────────────────────────────────────
   Затемнение — void с прозрачностью, не размытие: на телефоне размытие стоит
   реальных кадров. То же, что у кабинета. */
.sp-scrim {
  position: absolute; inset: 0; z-index: var(--z-panel);
  background: color-mix(in srgb, var(--void) 60%, transparent);
  animation: sp-scrim-in var(--d-hover) ease both;
}
@keyframes sp-scrim-in { from { opacity: 0; } to { opacity: 1; } }

/* ── панель ───────────────────────────────────────────────────────────
   Стоя — выезжает от ЛЕВОГО края (кабинет едет от правого; механика та же,
   сторона другая). Широко — приколочена колонкой, см. перелом ниже. */
.sp-panel {
  position: absolute; top: 0; left: 0; bottom: 0; z-index: var(--z-panel);
  width: min(92vw, var(--w-cabinet));
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, var(--carbon) 0%, var(--void) 100%);
  border-right: 1px solid var(--line);
  transform: translateX(-100%);
  transition: transform var(--d-panel) var(--e-spring);
  will-change: transform;
}
.sp-panel.open { transform: translateX(0); }

.sp-phead {
  flex: none; height: 52px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 var(--sp-3); border-bottom: 1px solid var(--line);
}
.sp-ptitle {
  font-size: var(--t-md); letter-spacing: var(--ls-title); text-transform: uppercase;
}
.sp-x {
  background: none; border: none; color: var(--ink-dim); cursor: pointer;
  font-size: var(--t-md); min-width: 44px; min-height: 44px;
}
.sp-x:hover { color: var(--ink); }
.sp-x:focus-visible { outline: 1px solid var(--ink); outline-offset: -2px; }

.sp-pbody { flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; padding: var(--sp-3); }
.sp-sec { display: flex; flex-direction: column; gap: var(--sp-2); margin-bottom: var(--sp-4); }
.sp-sec--core { min-width: 0; }
.sp-label {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
}
.sp-note { font-size: var(--t-xs); color: var(--ink-dim); line-height: 1.5; }

/* ── пусто и ошибка ───────────────────────────────────────────────── */
.sp-hole {
  flex: 1 1 auto; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: var(--sp-3);
  padding: var(--sp-5); text-align: center;
}
.sp-hole__t { font-size: var(--t-lg); letter-spacing: var(--ls-title); text-transform: uppercase; }
.sp-hole__b { max-width: 34ch; font-size: var(--t-base); color: var(--ink-dim); line-height: 1.5; }
.sp-hole__btn {
  font-family: var(--font-mono); font-size: var(--t-xs); letter-spacing: var(--ls-title);
  color: var(--ink); background: none; border: 1px solid var(--line-strong);
  padding: var(--sp-3) var(--sp-5); min-height: 44px; cursor: pointer;
}
.sp-hole__btn:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }

/* ── ростер ───────────────────────────────────────────────────────── */
.sp-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
.sp-row {
  width: 100%; min-height: 44px; display: flex; align-items: center; gap: var(--sp-2);
  padding: 0 var(--sp-2); cursor: pointer; font: inherit; color: inherit; text-align: left;
  background: color-mix(in srgb, var(--panel) 70%, transparent);
  border: 1px solid transparent;
  transition: border-color var(--d-hover) var(--e-weight);
}
.sp-row:hover { border-color: var(--line); }
.sp-row.on { border-color: color-mix(in srgb, var(--core) 60%, transparent); }
.sp-row:focus-visible { outline: 1px solid var(--ink); outline-offset: -2px; }
.sp-row .nm {
  flex: 1 1 auto; min-width: 0; font-size: var(--t-base);
  letter-spacing: var(--ls-title); text-transform: uppercase;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sp-row .cr, .sp-row .st {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-off); flex: none;
}
.sp-row .cr { color: var(--core); }
/* Знак ядра — квадрат его цветом. Не свечение: светится одно на экран. */
.sw { width: 8px; height: 8px; flex: none; background: var(--core); display: inline-block; }

.sp-build { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--sp-1) var(--sp-2); }
.sp-build .k, .sp-build .b, .sp-build .ph {
  font-family: var(--font-mono); font-size: var(--t-micro); letter-spacing: var(--ls-meta);
}
.sp-build .k { color: var(--ink-off); text-transform: uppercase; }
.sp-build .b { color: var(--ink-dim); }
.sp-build .ph { color: var(--ink-off); }

/* ── заготовки и ядра ─────────────────────────────────────────────── */
.sp-presets, .sp-cores { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.sp-preset, .sp-core {
  display: flex; align-items: center; gap: var(--sp-2);
  min-height: 40px; padding: 0 var(--sp-3); cursor: pointer;
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-dim);
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: 1px solid var(--line);
  transition: border-color var(--d-hover) var(--e-weight), color var(--d-hover) var(--e-weight);
}
.sp-preset { flex: 1 1 0; justify-content: center; }
.sp-core { flex: 1 1 40%; }
.sp-preset:hover, .sp-core:hover { border-color: var(--line-strong); color: var(--ink); }
.sp-core.on { border-color: color-mix(in srgb, var(--core) 60%, transparent); color: var(--ink); }
.sp-preset:focus-visible, .sp-core:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }

/* ── баффы ────────────────────────────────────────────────────────── */
.sp-kit { display: flex; gap: var(--sp-2); }
.sp-slot {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--sp-1); width: 72px; height: 72px; cursor: pointer; font: inherit;
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: 1px solid var(--line);
  transition: border-color var(--d-hover) var(--e-weight);
}
.sp-slot:hover { border-color: var(--line-strong); }
.sp-slot:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }
.sp-slot.is-empty { border-style: dashed; }
.sp-slot .ic { width: 30px; height: 30px; object-fit: contain; }
.sp-slot .nm {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-dim);
}
.sp-slot .nm--empty { color: var(--ink-off); }

/* ── в бой ────────────────────────────────────────────────────────── */
.sp-go {
  flex: none; min-height: 52px; cursor: pointer;
  font-family: var(--font-display); font-size: var(--t-md);
  letter-spacing: var(--ls-title); text-transform: uppercase; color: var(--ink);
  background: var(--pink); border: none;
  transition: filter var(--d-fast);
}
.sp-go:hover { filter: brightness(1.12); }
.sp-go:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }

/* ── заглушка боя ─────────────────────────────────────────────────── */
.sp-stub {
  position: absolute; inset: 0; z-index: var(--z-modal);
  display: grid; place-items: center; padding: var(--sp-4);
  background: color-mix(in srgb, var(--void) 88%, transparent);
}
.sp-stub__box {
  width: min(100%, 560px); max-height: 100%; overflow-y: auto;
  display: flex; flex-direction: column; gap: var(--sp-3);
  padding: var(--sp-4); background: var(--panel); border: 1px solid var(--line-strong);
}
.sp-stub__kick {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
}
.sp-stub__grid { display: grid; grid-template-columns: 1fr; gap: var(--sp-3); }
.sp-stub__col {
  display: flex; flex-direction: column; gap: var(--sp-1);
  padding: var(--sp-3); background: var(--carbon); border: 1px solid var(--line);
}
.sp-stub__h {
  display: flex; align-items: center; gap: var(--sp-2);
  font-size: var(--t-md); letter-spacing: var(--ls-title); text-transform: uppercase;
}
.sp-stub__l { display: flex; gap: var(--sp-2); font-family: var(--font-mono); font-size: var(--t-micro); }
.sp-stub__l .k { flex: none; min-width: 9ch; letter-spacing: var(--ls-meta); color: var(--ink-off); }
.sp-stub__l .v { letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.sp-stub__btn {
  min-height: 44px; cursor: pointer; font-family: var(--font-mono);
  font-size: var(--t-xs); letter-spacing: var(--ls-title); color: var(--ink);
  background: none; border: 1px solid var(--line-strong);
}
.sp-stub__btn:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }

@media (min-width: 560px) { .sp-stub__grid { grid-template-columns: 1fr 1fr; } }

/* ══ ШИРОКО: ПАНЕЛЬ ПРИКОЛОЧЕНА КОЛОНКОЙ СЛЕВА ═══════════════════════
   ⚠️ ОДНА ПАНЕЛЬ, ДВА ПОВЕДЕНИЯ, а не два экрана: та же разметка, тот же
   набор разделов, та же логика. Перелом меняет ТОЛЬКО то, стоит она на месте
   или выезжает. Язычок, крестик и подложка на широком не нужны и снимаются —
   открывать и закрывать нечего.

   ⚠️ КОЛОНКА УЖЕ ПОЛОВИНЫ ЭКРАНА. Сцена обязана оставаться главной по площади
   (ТЗ §2.1), поэтому ширина взята кабинетная и ограничена третью кадра.
   Сцена при этом не перестраивается: она по-прежнему во весь экран, панель
   стоит поверх её левого края. */
@media (min-width: 900px) {
  .sp-tab, .sp-scrim, .sp-x { display: none; }
  .sp-panel { transform: translateX(0); width: min(var(--w-cabinet), 33vw); }
  .sp-bar { left: min(var(--w-cabinet), 33vw); }
}

/* ── лёжа на телефоне: шапка и панель ужимаются ──────────────────── */
@media (max-height: 460px) {
  .sp-phead { height: 44px; }
  .sp-sec { margin-bottom: var(--sp-3); }
}

/* ── движения меньше: переходы гасим ─────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .sp-panel, .sp-tab, .sp-bar__back, .sp-row, .sp-preset, .sp-core, .sp-slot { transition: none; }
  .sp-scrim { animation: none; }
}
</style>
