<template>
  <!-- СКРЫТАЯ СТРАНИЦА-МАКЕТ SPAR (ТЗ 24.09.2026, «SPAR: страница-макет
       боя-настройки»). Адрес /dev/spar, ниоткуда не линкуется, закрыта от
       поисковиков тегом robots (не через robots.txt — строка запрета там
       публична и работает как указатель).

       ЧТО ЭТО. Бой-настройка: игрок берёт своего бойца и СОБИРАЕТ ему
       соперника — ядро и зажжённые кристаллы. Единственный способ увидеть
       глазами, что дала прокачка: «Зеркало» против «Чистого» — и разница
       видна за два нажатия.

       ⚠️ SPAR НЕ ДАЁТ ИГРОКУ НИЧЕГО и НИЧЕГО НИКУДА НЕ ЗАПИСЫВАЕТ. Ни права
       зажечь кристалл, ни счёта боёв, ни истории, ни LASH. Отсюда главное
       ограничение этого файла: ростер только ЧИТАЕТСЯ (геттеры), ни одного
       dispatch/commit. Дерево соперника живёт ЗДЕСЬ, в памяти страницы, и
       строится buildTree() напрямую — в хранилище оно не попадает никогда.

       ⚠️ НИ ОДНОЙ ЦИФРЫ НА ЭКРАНЕ (ТЗ §3.1). Ни уровней, ни процентов, ни
       счётчиков, ни «3 / 5». Сборка показывается ИМЕНАМИ кристаллов и наливом
       по граням — так же, как в зале.

       ⚠️ ВНУТРЕННЕГО СЛОВАРЯ НАРУЖУ НЕТ (ТЗ §3.2): ни HEXARCH, ни TEMPER, ни
       DOCTRINE, ни ASCENSION, ни HOUSE. Психологическая строка кристалла
       подписана CHARACTER — это делает сам ForgeCore.

       СЛОВАРЬ. ГРАНЬ — весь луч «Печати» от сердца до кромки, их три.
       КРИСТАЛЛ — один из пяти шагов внутри грани, всего пятнадцать. В игровых
       данных гранью до сих пор зовётся `crystal`, а кристаллом — `face`; имена
       наружу уходят как были (они часть счёта), переводятся в ForgeCore.

       ЧТО ТРОГАЕТ В ИГРЕ. Ровно один файл — роутер (адрес). Всё остальное
       только читается: ForgeCore, ростер, данные ядер, иконки баффов.

       КОМПОЗИЦИЯ. Вверху — обе стороны сразу: слева твой боец, справа
       соперник (ТЗ §4.1). Ниже — три шага, по одному блоку на шаг: лёжа на
       телефоне два блока рядом не встают, и в зале этот случай уже разведён
       по шагам (ТЗ §6) — новой формы здесь не изобретается. -->
  <div class="sp">

    <!-- ── полоса ─────────────────────────────────────────────────────── -->
    <header class="sp-bar">
      <span class="sp-bar__title">SPAR · МАКЕТ</span>
      <button type="button" class="sp-bar__back" @click="goBack">← НАЗАД</button>
    </header>

    <!-- ── ОШИБКА ──────────────────────────────────────────────────────
         Одной строкой и с работающим возвратом (ТЗ §7.3). Молчаливый чёрный
         экран — брак. Сюда приходит и несобравшееся дерево соперника: дальше
         на этой странице делать нечего. -->
    <main v-if="fatal" class="sp-hole">
      <p class="sp-hole__t">ЯДРО НЕ СОБРАЛОСЬ</p>
      <p class="sp-hole__b">{{ fatal }}</p>
      <button type="button" class="sp-hole__btn" @click="goBack">НАЗАД</button>
    </main>

    <!-- ── ПУСТО ───────────────────────────────────────────────────────
         Страница служебная, игрок может прийти на неё чистым (ТЗ §7.1).
         Не пустой экран и не ошибка: понятная заглушка и куда идти. -->
    <main v-else-if="!fighters.length" class="sp-hole">
      <p class="sp-hole__t">БОЙЦОВ НЕТ</p>
      <p class="sp-hole__b">
        Спарринг собирают вокруг своего бойца, а его нет ни одного.
        Возьмите бойца в зале FORGE и возвращайтесь.
      </p>
      <button type="button" class="sp-hole__btn" @click="toForge">В ЗАЛ FORGE</button>
    </main>

    <template v-else>
      <!-- ── ОБЕ СТОРОНЫ СРАЗУ ─────────────────────────────────────────
           Экран описывает бой, и бой виден целиком в любой момент: слева
           твой, справа собранный. Нажатие по стороне уводит на её шаг —
           то же место читается и правится. -->
      <div class="sp-vs">
        <button
          type="button" class="sp-side" :class="{ on: step === 1 }"
          :style="{ '--core': myCore.hue }" @click="step = 1"
        >
          <span class="sp-side__kick">ТВОЙ БОЕЦ</span>
          <span class="sp-side__name"><i class="sw" aria-hidden="true"></i>{{ me ? me.callsign : '—' }}</span>
          <span class="sp-side__core">{{ myCore.name }}</span>
          <span class="sp-side__build">{{ myBuildLine }}</span>
        </button>

        <span class="sp-vs__x" aria-hidden="true">VS</span>

        <button
          type="button" class="sp-side sp-side--foe" :class="{ on: step === 2 }"
          :style="{ '--core': foeCoreMeta.hue }" @click="step = 2"
        >
          <span class="sp-side__kick">СОПЕРНИК</span>
          <span class="sp-side__name"><i class="sw" aria-hidden="true"></i>СБОРКА</span>
          <span class="sp-side__core">{{ foeCoreMeta.name }}</span>
          <span class="sp-side__build">{{ foeBuildLine }}</span>
        </button>
      </div>

      <!-- ── три шага ────────────────────────────────────────────────── -->
      <nav class="sp-rail" role="tablist" aria-label="Шаги сборки">
        <button
          v-for="s in STEPS" :key="s.n"
          type="button" class="sp-rail__b" :class="{ on: step === s.n }"
          role="tab" :aria-selected="step === s.n ? 'true' : 'false'"
          @click="step = s.n"
        >{{ s.name }}</button>
      </nav>

      <!-- ⚠️ ТЕЛО ШАГА ПРОКРУЧИВАЕТСЯ. Стоя на телефоне ни один шаг за край не
           уходит — прокрутки не появляется вовсе. Лёжа высоты всего 390, и
           карточка ядра в неё не влезает; без прокрутки из кристалла было бы
           не выйти кнопкой. Её же ищет сам ForgeCore, когда подводит карточку
           под открытый уровень. -->
      <main class="sp-body" ref="bodyEl">

        <!-- ══ ШАГ 1 · ТВОЙ БОЕЦ ══════════════════════════════════════
             ⚠️ ЗАНЯТЫЙ ВЫБИРАЕТСЯ НАРАВНЕ СО ВСЕМИ (ТЗ §4.2). SPAR ничего не
             даёт и ничего не отнимает — запрещать нечего. Состояние показано,
             потому что по нему читают бойца, а не потому что оно запрещает. -->
        <section v-show="step === 1" class="sp-step">
          <p class="sp-label">РОСТЕР</p>
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

          <div v-if="me" class="sp-card" :style="{ '--core': myCore.hue }">
            <p class="sp-card__name">{{ me.callsign }}</p>
            <p class="sp-card__core"><i class="sw" aria-hidden="true"></i>{{ myCore.name }}</p>
            <p class="sp-card__row"><span class="k">СОСТОЯНИЕ</span><span class="v">{{ stateWord(stateOf(me.id)) }}</span></p>
            <p class="sp-label">ЗАЖЖЕНО</p>
            <p class="sp-card__build">
              <span v-if="!myLit.length" class="ph">пусто</span>
              <template v-else><span v-for="(n, i) in myLit" :key="i" class="b">{{ n }}</span></template>
            </p>
          </div>
        </section>

        <!-- ══ ШАГ 2 · СОПЕРНИК ═══════════════════════════════════════
             Собирается целиком: ядро — любое из четырёх, кристаллы — до пяти,
             как угодно по трём граням. Интерфейс кристаллов — ТОТ ЖЕ, что
             стоит в зале (ForgeCore), новых форм не рисуется.

             ⚠️ ПОГАСИТЬ КРИСТАЛЛ ЗДЕСЬ НЕЧЕМ, и это не упущение этой страницы:
             ForgeCore умеет только зажигать (в зале гашение тоже недоступно), а
             править его этой работе нельзя — трогается ровно один игровой файл,
             роутер. Выход из промаха — «ЧИСТЫЙ»: он обнуляет сборку одним
             нажатием, и он же тут главный сценарий показа. -->
        <section v-show="step === 2" class="sp-step">
          <p class="sp-label">ЗАГОТОВКИ</p>
          <div class="sp-presets">
            <button type="button" class="sp-preset" @click="presetMirror">ЗЕРКАЛО</button>
            <button type="button" class="sp-preset" @click="presetClean">ЧИСТЫЙ</button>
          </div>
          <p class="sp-note">
            «Зеркало» — точная копия твоего бойца. «Чистый» — то же ядро без
            единого кристалла. После любой заготовки сборка правится дальше.
          </p>

          <p class="sp-label">ЯДРО СОПЕРНИКА</p>
          <div class="sp-cores">
            <button
              v-for="c in CORES" :key="c.id"
              type="button" class="sp-core" :class="{ on: c.id === foeCore }"
              :style="{ '--core': c.hue }"
              :aria-pressed="c.id === foeCore ? 'true' : 'false'"
              @click="pickFoeCore(c.id)"
            >
              <i class="sw" aria-hidden="true"></i>{{ c.name }}
            </button>
          </div>

          <!-- ⚠️ ПОЗДНИЙ КЛИК гасится на этом узле — см. killLateClick ниже. -->
          <div class="sp-core-host" ref="coreHost">
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
          </div>
        </section>

        <!-- ══ ШАГ 3 · БАФФЫ И БОЙ ════════════════════════════════════
             ⚠️ БАФФЫ БЕСКОНЕЧНЫЕ И БЕСПЛАТНЫЕ, И ДАЮТСЯ ОБЕИМ СТОРОНАМ. LASH
             не тратится, запас не считается, цифр нет. Бесконечные у одной
             стороны сделали бы проверку нечестной, а SPAR ровно для проверки
             и существует.

             Форма — та же, что в воротах арены (BuffKitSlots): три квадратных
             слота, тап переключает по кругу, пустой слот пунктиром. Сам
             компонент ворот сюда не берётся: он приколочен к экрану, знает про
             запас и LASH и ЗАПИСЫВАЕТ выбор в хранилище — а здесь не
             записывается ничего. -->
        <section v-show="step === 3" class="sp-step">
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

          <!-- ЕДИНСТВЕННОЕ ГЕРОЙСКОЕ СВЕЧЕНИЕ НА ЭКРАНЕ, и оно стоит только на
               этом шаге: на первых двух светиться нечему. -->
          <button type="button" class="sp-go" @click="openStub">В БОЙ</button>
          <p class="sp-note">
            В макете бой не запускается: нажатие показывает состав обеих сторон
            словами — проверить, что собралось именно то, что собирали.
          </p>
        </section>
      </main>
    </template>

    <!-- ── ЗАГЛУШКА БОЯ ──────────────────────────────────────────────── -->
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import ForgeCore from '@/components/forge/ForgeCore.vue';
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
/* ⚠️ ШАГИ БЕЗ НОМЕРОВ. Здесь стояло «1 · ТВОЙ», «2 · СОПЕРНИК», «3 · БОЙ» —
   и это были ЕДИНСТВЕННЫЕ цифры на экране, пойманные сплошной вычиткой текста
   страницы. «Ни одной цифры» — правило без оговорок, а порядок шагов и так
   сказан их порядком в полосе. */
const STEPS = [
  { n: 1, name: 'ТВОЙ БОЕЦ' },
  { n: 2, name: 'СОПЕРНИК' },
  { n: 3, name: 'БОЙ' },
];
const KIT_SLOTS = 3;

const step = ref(1);
const stub = ref(null);
const fatal = ref('');
const bodyEl = ref(null);
const coreHost = ref(null);

/* ── СТОРОНА ИГРОКА · ТОЛЬКО ЧТЕНИЕ ───────────────────────────────────
   Ростер читается геттерами и не трогается ни одним действием: SPAR ничего
   никуда не записывает (ТЗ §2). Поэтому и выбранный боец хранится ЗДЕСЬ, а не
   через roster/pick — тот сохраняется в сейф и увёл бы за собой зал. */
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
    /* ⚠️ ЗАГЛАВНЫМИ — только короткий заголовок в разметке. Само объяснение
       набрано предложением: капитель в системе отведена лейблам и ударным
       словам до трёх, а не фразам (поймано на снимке этого состояния). */
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
function presetClean() {
  if (!me.value) return;
  foeCore.value = me.value.core;
  foeTree.value = makeTree(me.value.core, null);
}

/* ЗАЖИГАНИЕ. Те же два предела, что и в хранилище — предел грани и потолок
   пять, — и ни одного третьего: занятие здесь не спрашивается, права SPAR не
   выдаёт и не забирает.

   ⚠️ Наружу ForgeCore отдаёт СТАРЫЕ ИМЕНА: crystalId — это грань, faceId —
   кристалл. Так их зовёт хранилище. */
function onFoeToggle({ crystalId, faceId }) {
  const tree = foeTree.value;
  if (!tree) return;
  const branch = tree.find((c) => c.id === crystalId);
  const face = branch && branch.faces.find((f) => f.id === faceId);
  if (!face || face.state !== 'open') return;
  if (branch.faces.filter((f) => f.state === 'lit').length >= branch.limit) return;
  if (countLit(tree) >= RESOURCE) return;
  face.state = 'lit';
}

/* ── обе стороны одной строкой ─────────────────────────────────────── */
const buildLine = (names) => (names.length ? names.join(' · ') : 'без кристаллов');
const myBuildLine = computed(() => (me.value ? buildLine(myLit.value) : '—'));
const foeBuildLine = computed(() => buildLine(foeLit.value));

/* ── баффы ────────────────────────────────────────────────────────────
   Бесконечные, бесплатные, обеим сторонам, нигде не сохраняются. Ни запаса,
   ни LASH, ни цифр: ряд ворот арены знает про всё это, здесь — ничего. */
const myKit = ref(Array(KIT_SLOTS).fill(null));
const foeKit = ref(Array(KIT_SLOTS).fill(null));
/* ⚠️ Сторона приходит КЛЮЧОМ, а не самим набором. В разметке Vue разворачивает
   ref в значение, и переданный туда myKit — это уже массив, у которого нет
   .value: попытка писать в него молча роняла обработчик. Поймано прогоном. */
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
   собирали. Бой в макете не запускается (ТЗ §4.6). */
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

/* ── ПОЗДНИЙ КЛИК ──────────────────────────────────────────────────────
   На сенсорном экране браузер после касания досылает вдогонку обычный клик
   мышью, примерно через треть секунды. За эту треть секунды карточка ядра
   успевает перестроиться под пальцем — и клик попадает уже в новую разметку:
   зажигает кристалл, которого игрок не выбирал. Тот же приём, что в зале:
   отменяем действие по концу касания — это единственное, что браузер
   спрашивает перед тем, как этот клик выдумать.

   ⚠️ Гасим ТОЛЬКО над самой фигурой (.fc-stage). Гасить на всей странице
   нельзя: кнопки «зажечь» и «назад» стоят под фигурой и ловят обычный клик —
   на телефоне они перестали бы работать вовсе.
   ⚠️ Слушателя нельзя вешать пассивным: пассивному браузер отменять не даёт. */
let killLateClick = null;
function armLateClick() {
  const host = coreHost.value;
  if (!host || killLateClick) return;
  killLateClick = (e) => {
    const t = e.target;
    if (t && t.closest && t.closest('.fc-stage')) e.preventDefault();
  };
  host.addEventListener('touchend', killLateClick, { passive: false });
}
watch(coreHost, armLateClick);

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
  armLateClick();
});

onBeforeUnmount(() => {
  document.title = prevTitle;
  if (robotsTag) robotsTag.remove();
  if (coreHost.value && killLateClick) {
    coreHost.value.removeEventListener('touchend', killLateClick);
  }
  killLateClick = null;
});
</script>

<style scoped>
/* ⚠️ ВСЕ ЗНАЧЕНИЯ — ИЗ tokens.css. Своих цветов, кеглей и отступов здесь нет.
   Скругление нулевое везде, включая заглушку боя: система разрешает радиус
   модальным окнам, но не обязывает, а прямой угол здесь узнаваем. */
/* ⚠️ ПОВЕРХ ОБОЛОЧКИ ПРИЛОЖЕНИЯ. App.vue держит свою шапку со знаком на всех
   адресах, кроме /play/* и витрины, — на дежурном адресе она встала бы поверх
   полосы этой страницы. Убрать её из App.vue нельзя: эта работа трогает ровно
   один игровой файл, роутер. Поэтому страница — сплошной непрозрачный слой на
   ступень выше шапки (--z-topbar), как выезжающие панели. Заглушка боя стоит
   ещё ступенью выше (--z-modal), иначе она ушла бы под саму страницу. */
.sp {
  position: fixed; inset: 0; z-index: var(--z-panel);
  display: flex; flex-direction: column;
  background: var(--void); color: var(--ink);
  font-family: var(--font-display);
}

/* ── полоса ───────────────────────────────────────────────────────── */
.sp-bar {
  flex: none; display: flex; align-items: center; justify-content: space-between;
  gap: var(--sp-3); padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--line);
}
.sp-bar__title {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-dim);
}
.sp-bar__back {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-dim);
  background: none; border: 1px solid var(--line); padding: var(--sp-2) var(--sp-3);
  min-height: 32px; cursor: pointer;
  transition: border-color var(--d-hover) var(--e-weight), color var(--d-hover) var(--e-weight);
}
.sp-bar__back:hover { border-color: var(--line-strong); color: var(--ink); }
.sp-bar__back:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }

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

/* ── обе стороны ──────────────────────────────────────────────────── */
.sp-vs {
  flex: none; display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: stretch; gap: var(--sp-2);
  padding: var(--sp-3); border-bottom: 1px solid var(--line);
}
.sp-vs__x {
  align-self: center; font-family: var(--font-mono);
  font-size: var(--t-micro); letter-spacing: var(--ls-wide); color: var(--ink-off);
}
.sp-side {
  display: flex; flex-direction: column; gap: 2px; min-width: 0;
  padding: var(--sp-2); text-align: left; cursor: pointer;
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: 1px solid var(--line); font: inherit; color: inherit;
  transition: border-color var(--d-hover) var(--e-weight);
}
.sp-side--foe { text-align: right; }
.sp-side--foe .sp-side__name, .sp-side--foe .sp-side__core { flex-direction: row-reverse; }
.sp-side:hover { border-color: var(--line-strong); }
.sp-side.on { border-color: color-mix(in srgb, var(--core) 60%, transparent); }
.sp-side:focus-visible { outline: 1px solid var(--ink); outline-offset: 2px; }
.sp-side__kick {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
}
.sp-side__name {
  display: flex; align-items: center; gap: var(--sp-2);
  font-size: var(--t-md); letter-spacing: var(--ls-title); text-transform: uppercase;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sp-side__core {
  display: flex; font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--core);
}
/* ⚠️ ОДНОЙ СТРОКОЙ С ОБРЕЗКОЙ, а не в две с переносом. В две перенос падал
   ровно после разделителя, и строка кончалась висящим «·» — читалось поломкой,
   а не продолжением. Здесь это ВЗГЛЯД: полную сборку показывают сама фигура на
   шаге соперника и заглушка боя. */
.sp-side__build {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); color: var(--ink-dim);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* Знак ядра — квадрат его цветом. Не свечение: светится одно на экран. */
.sw { width: 8px; height: 8px; flex: none; background: var(--core); display: inline-block; }

/* ── три шага ─────────────────────────────────────────────────────── */
.sp-rail { flex: none; display: flex; border-bottom: 1px solid var(--line); }
.sp-rail__b {
  flex: 1 1 0; min-height: 40px; cursor: pointer;
  background: none; border: none; border-bottom: 2px solid transparent;
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
  transition: color var(--d-hover) var(--e-weight), border-color var(--d-hover) var(--e-weight);
}
.sp-rail__b.on { color: var(--ink); border-bottom-color: var(--line-strong); }
.sp-rail__b:focus-visible { outline: 1px solid var(--ink); outline-offset: -2px; }

/* ── тело шага ────────────────────────────────────────────────────── */
.sp-body { flex: 1 1 auto; overflow-y: auto; overscroll-behavior: contain; }
.sp-step { display: flex; flex-direction: column; gap: var(--sp-2); padding: var(--sp-3); }
.sp-label {
  font-family: var(--font-mono); font-size: var(--t-micro);
  letter-spacing: var(--ls-meta); text-transform: uppercase; color: var(--ink-off);
  margin-top: var(--sp-2);
}
.sp-step > .sp-label:first-child { margin-top: 0; }
.sp-note { font-size: var(--t-xs); color: var(--ink-dim); line-height: 1.5; }

/* ── ростер ───────────────────────────────────────────────────────── */
.sp-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
.sp-row {
  width: 100%; min-height: 44px; display: flex; align-items: center; gap: var(--sp-2);
  padding: 0 var(--sp-3); cursor: pointer; font: inherit; color: inherit; text-align: left;
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

/* ── карточка бойца ───────────────────────────────────────────────── */
.sp-card {
  display: flex; flex-direction: column; gap: var(--sp-1);
  padding: var(--sp-3); background: var(--panel); border: 1px solid var(--line);
}
.sp-card__name { font-size: var(--t-lg); letter-spacing: var(--ls-title); text-transform: uppercase; }
.sp-card__core {
  display: flex; align-items: center; gap: var(--sp-2);
  font-family: var(--font-mono); font-size: var(--t-xs);
  letter-spacing: var(--ls-meta); color: var(--core);
}
.sp-card__row { display: flex; gap: var(--sp-2); font-family: var(--font-mono); font-size: var(--t-micro); }
.sp-card__row .k { letter-spacing: var(--ls-meta); color: var(--ink-off); }
.sp-card__row .v { letter-spacing: var(--ls-meta); color: var(--ink-dim); }
.sp-card__build { display: flex; flex-wrap: wrap; gap: var(--sp-1) var(--sp-2); }
.sp-card__build .b, .sp-card__build .ph {
  font-family: var(--font-mono); font-size: var(--t-micro); letter-spacing: var(--ls-meta);
}
.sp-card__build .b { color: var(--ink-dim); }
.sp-card__build .ph { color: var(--ink-off); }

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

/* Карточка ядра приезжает со своим слоем (forge.css) — здесь ей только место. */
.sp-core-host { display: flex; flex-direction: column; min-width: 0; }

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
  margin-top: var(--sp-2); min-height: 52px; cursor: pointer;
  font-family: var(--font-display); font-size: var(--t-md);
  letter-spacing: var(--ls-title); text-transform: uppercase; color: var(--ink);
  background: var(--pink); border: none; box-shadow: var(--glow-hero);
}
.sp-go:focus-visible { outline: 1px solid var(--ink); outline-offset: 3px; }

/* ── заглушка боя ─────────────────────────────────────────────────── */
.sp-stub {
  position: fixed; inset: 0; z-index: var(--z-modal);
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

/* ── шире телефона: обе стороны заглушки встают рядом ─────────────── */
@media (min-width: 560px) {
  .sp-stub__grid { grid-template-columns: 1fr 1fr; }
}
/* ── лёжа: полоса и шапка ужимаются, высоту отдаём телу шага ──────── */
/* ── лёжа: высоты всего 390, и её всю забирает тело шага ──────────────
   Шапка и полоса шагов ужимаются до минимума, по которому ещё попадают
   пальцем; карточка ядра на шаге соперника при этом уходит в прокрутку —
   лёжа два блока рядом не встают, и это оговорено (ТЗ §6). */
@media (max-height: 460px) {
  .sp-bar { padding: var(--sp-1) var(--sp-3); }
  .sp-vs { padding: var(--sp-2) var(--sp-3); }
  .sp-side { padding: var(--sp-1) var(--sp-2); }
  .sp-side__name { font-size: var(--t-base); }
  .sp-rail__b { min-height: 34px; }
  .sp-step { gap: var(--sp-1); padding: var(--sp-2) var(--sp-3); }
}
/* ── движения меньше: переходы гасим, анимаций своих здесь нет ────── */
@media (prefers-reduced-motion: reduce) {
  .sp-bar__back, .sp-side, .sp-rail__b, .sp-row, .sp-preset, .sp-core, .sp-slot {
    transition: none;
  }
}
</style>
