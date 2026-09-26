<!-- ArenaScene — Three.js arena, the foundation for future combat. Two slabs
     with torn jagged inner edges split by a wide gap, the rift glowing as the
     single light (torn-rift pass 3/3), floating in dark void; orbit-drag + zoom,
     default 3/4 top view. Sharp render (full DPR, mipmapped hex). Single
     presence state — restrained whole-rift breathing ("clean platform"); manual
     orbit only.
     One idle fighter-construct stands on the near (player) half; no combat, no
     HUD, no controls (separate stages).

     Discipline: one pink accent (#FF0069 from --pink) + one glow (the
     rift — pulses as a whole, no running beam); nothing else glows, no pink
     under the plates. Throttled when idle/hidden, respects prefers-reduced-motion. -->
<template>
  <div ref="wrap" class="arena-wrap">
    <canvas ref="canvasEl" class="arena-canvas" />
    <div class="arena-vignette" />
    <!-- Сцена не собралась за отведённое время. Честная причина и дверь наружу
         вместо боя в недостроенной сцене. Матовое, без розового и без свечения:
         это сообщение о поломке, а не призыв к действию. -->
    <div v-if="sceneFailed" class="arena-failed">
      <p class="af-title">{{ t.arena.failedTitle }}</p>
      <p class="af-note">{{ t.arena.failedNote }}</p>
      <button type="button" class="af-back" @click="onFailedBack">{{ t.arena.failedBack }}</button>
    </div>
    <!-- Переключатель служебной панели. Существует ТОЛЬКО в служебном режиме
         (?dev=1) — игроку его видеть незачем. Панель сама прячется на время боя
         и возвращается по его концу; в бесконечном прогоне SIG бой не кончается,
         поэтому эта кнопка — единственный путь назад. -->
    <button v-if="DEV_MODE && !showcase" type="button" class="arena-panel-toggle" :class="{ on: panelVisible }" @click="panelVisible = !panelVisible" :aria-pressed="panelVisible" title="Toggle dev panel">DEV</button>
    <!-- Dev readability stand (preview only): FIGHT + the L/R signature A/B stand
         + GRAY. Hidden during a bout; brought back via the DEV corner toggle. -->
    <div v-if="panelVisible" class="arena-actions">
      <button type="button" class="tgt" @click="onFight">FIGHT</button>
      <button type="button" class="tgt" @click="cycleSig('left')">L:{{ sigTag(sigLeft) }}</button>
      <button type="button" class="tgt" @click="cycleSig('right')">R:{{ sigTag(sigRight) }}</button>
      <button type="button" class="tgt" @click="onSigFight">SIG FIGHT</button>
      <button type="button" class="tgt" :class="{ on: neutralColor }" @click="onNeutralColor">GRAY: {{ neutralColor ? 'ON' : 'OFF' }}</button>
      <button type="button" class="tgt" :class="{ on: brainMode === 'model' }" @click="onBrain">BRAIN: {{ brainMode === 'model' ? 'MODEL' : 'SPINAL' }}</button>
      <button type="button" class="tgt" :class="{ on: lockedIntention }" @click="onLockCycle">LOCK: {{ LOCK_ORDER[lockIdx].toUpperCase() }}</button>
      <button type="button" class="tgt" :class="{ on: blockDev }" @click="onBlockToggle">BLOCK: {{ blockDev ? 'ON' : 'OFF' }}</button>
      <button type="button" class="tgt" @click="onDevFeint">FEINT</button>
      <button type="button" class="tgt" @click="onDevStagger">STAGGER</button>
      <button type="button" class="tgt" @click="onDevCharge">CHARGE</button>
    </div>
    <!-- ЦЕНА КАДРА НА ОТКРЫТОМ ПОЛЕ. Служебная строка для замера НА ТЕЛЕФОНЕ:
         частота кадров при потолке цикла (29/30 — это здоровье, а не тормоз) и
         число тел на поле.

         ⚠️ ЖИВЁТ ОТДЕЛЬНО ОТ СЛУЖЕБНОЙ ПАНЕЛИ, хотя и включается тем же ?dev=1.
         Панель прячется на время боя — как раз тогда, когда цену кадра и надо
         смотреть. Показывается только на открытом поле: замерять двадцать тел
         больше негде, а в бою один на один это лишняя надпись поверх экрана. -->
    <div v-if="DEV_MODE && openFieldMode" class="arena-fps">{{ fpsReadout }}</div>
    <!-- КАМЕРА ОТЦЕПЛЕНА. Метка нужна затем, что отличить свободный полёт от
         обычного кадра по картинке нельзя, а забытый полёт выглядит как
         сломанная камера. Приглушённая и мелкая НАМЕРЕННО.
         ⚠️ ОБЫЧНОМУ ИГРОКУ МЕТКА ПОКАЗЫВАЕТСЯ ТОЛЬКО В ПОЛЁТЕ. Камера с
         21.09.2026 есть у всех, но до первого нажатия в кадре не должно быть
         ни одной служебной надписи: игрок пришёл смотреть бой. Взял камеру —
         метка появилась и говорит, чем вернуть; вернул по Esc — исчезла.
         ⚠️ «ГОТОВО» — ТОЛЬКО ПО ПРИЗНАКУ ?freecam=1. Это остаток служебного
         режима, и нужен он ровно для проверок: отличить «камера не завелась»
         от «клавиши не доходят» иначе нельзя — экран в обоих случаях молчит
         одинаково. -->
    <div v-if="freeFlying || freeCamReady" class="arena-freecam">{{ freeFlying ? 'FREE CAM · ESC' : 'FREE CAM · READY' }}</div>
    <!-- Dev stamina (силы) + charge (заряд) readout for both fighters — live. -->
    <div v-if="panelVisible" class="arena-readout">{{ staReadout }}<br>{{ chgReadout }}<br>{{ intReadout }}<br>{{ rdReadout }}<br>{{ mdlReadout }}<br>{{ nkReadout }}</div>
  </div>
</template>

<script setup>
// ⚠️ `watch` из Vue взят под именем vueWatch НАМЕРЕННО: внутри onMounted уже
//    живёт своя локальная функция watch — сторож сборки сцены, — и она перекрыла
//    бы импорт. Одноимённая пара в одном файле молча сломала бы наблюдатель.
import { onMounted, onBeforeUnmount, ref, watch as vueWatch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildArena } from './buildArena.js';
import { buildFighter } from './buildFighter.js';
import { createArenaPresence } from './arenaPresence.js';
import { createBattleField } from './battleField.js';
import { createBoutClocks, boutHooks, separateBodies, BODY_GAP } from './boutCore.js';
import { declutterPlates, plateOf } from './hpStagger.js';
import { setPlateVariant } from './hpIndicator.js';
import store from '@/core/state/store.js';
import { getCore, CORES, CRYSTALS } from '@/data/upgradeData.js';
import { resolveBehavior } from '@/data/behavior.js';
// БАФФЫ (ТЗ 22.09.2026, работа 2). Сцена НЕ знает ни одного правила баффов и ни
// одного их числа: она только говорит «вот плита, вот камера, вот палец, вот
// живые бойцы» и «бой начался / кончился / прошёл кадр». Всё остальное —
// services/buffs.js. Пять строк ниже — это весь след баффов в защищённой сцене.
import { bindBuffArena, unbindBuffArena, buffStartFight, buffEndFight, buffTick } from '@/services/buffs.js';
import { bindKlichArena, unbindKlichArena, klichStartFight, klichEndFight, klichTick } from '@/services/klich.js';
import { countLit } from '@/data/upgradeTree.js';
import { composeChainFoe, composeSquadFoes, composeRaid } from '@/data/foeCompose.js';
import { facetPhrase } from '@/data/facetReadout.js';
import { SIG_PRESETS, SIG_ORDER, presetBehavior } from '@/data/behaviorPresets.js';
import { COMBAT_BALANCE } from '@/data/combatBalance.js';
import apiClient from '@/core/api/apiClient.js';
import { beginSceneLoad, loadingState } from '@/services/sceneLoading.js';
import { DEV_MODE } from '@/services/devMode.js';
import { chainState, ROUNDS, startRun, clearRunState, winRound, loseRound, hasStaleRun } from '@/services/chainRun.js';
import {
  collapseState, startCollapse, shortOfFighters, winWave, loseWave,
  clearCollapseState, hasStaleCollapse, playerStartHp, currentFoeRoster,
} from '@/services/collapseRun.js';
import { parseLayoutId, getLayout, collapseSpawnPos, layoutByPerSide } from '@/data/collapseLayouts.js';
// ОТКРЫТОЕ ПОЛЕ. Плита — buildForgeSlab: размер у неё снаружи, а у боевой плиты
// он заперт константой внутри защищённого buildArena. Это не третья копия
// рецепта — та же плита, что под залом, только других размеров.
import { buildForgeSlab } from './forgeSlab.js';
// УКРЫТИЯ открытого поля: раскладка (данные), меши (объём) и обход (навигация).
import { buildCoverLayout } from '@/data/openFieldCovers.js';
import { buildCovers } from './buildCovers.js';
import { createCoverNav } from './coverNav.js';
import { createLeaderBeams } from './leaderBeam.js';
import { createFieldShrink } from './fieldShrink.js';
import { buildFieldBorder } from './fieldBorder.js';
import {
  getOfLayout, parseOfLayoutId, ofSpawnPos, spawnRingRadius,
} from '@/data/openFieldLayouts.js';
import {
  openFieldState, startOpenField, shortOfFighters as ofShortOfFighters,
  noteSidesLeft, noteClosingIn, noteLeader, outOfOpenField, finishOpenField, endOpenField,
  bindCameraReturn, bindSpectateLeave,
} from '@/services/openFieldRun.js';
import { buildBotSide } from '@/services/collapseRun.js';
import { showFightResult, hideFightResult, bindFightAgain } from '@/services/fightResult.js';
import { useRouter, useRoute } from 'vue-router';
import { t, interpolate } from '@/locales/index.js';
import { LIGHTING, FOG_COLOR, FOG, FOV, CAMERA } from '@/data/sceneTokens.js';;
import { FREE_CAM_MODE } from '@/services/freeCamMode.js';
import { createFreeCam } from './freeCam.js';

// Model-brain request (hybrid intention layer). Injected into each fighter; it
// POSTs the WORD context to the backend on a fight break and resolves to
// { intention, read }. The API key never touches the client — this only calls our
// own endpoint. Rejection (timeout / error) is handled in buildFighter (→ spinal).
const requestModelIntention = (payload) => apiClient.requestFighterIntention(payload);

const wrap = ref(null);
const canvasEl = ref(null);

// ─── РЕЖИМ ПОКАЗА (?showcase=1) ─────────────────────────────────────────────
// Одна арена, одна подача для страницы-деки: оба бойца назначены (ONSLAUGHT
// против AMBUSH), служебная панель и кнопка DEV НЕ создаются, бой стартует сам
// и доигрывается до конца. Без признака арена ведёт себя ровно как раньше.
//
// ⚠️ ПРАВИЛО, КОТОРОЕ НЕЛЬЗЯ НАРУШАТЬ (решение владельца 06.09.2026).
// Этот признак управляет ТОЛЬКО ПОДАЧЕЙ — что видно и что запускается.
// Он НИКОГДА не управляет включением думающего мозга модели, ограничителем
// расходов и вообще ничем, что стоит денег: признак приходит из адресной
// строки, значит его подставит кто угодно и нажжёт вызовов на наши деньги.
// Включение модели делается ОДНОРАЗОВЫМ ПРОПУСКОМ С СЕРВЕРА, отдельной
// задачей. Если следующая сессия захочет привязать сюда модель — нельзя.
const showcase = (() => {
  try { return new URLSearchParams(window.location.search).get('showcase') === '1'; }
  catch (_) { return false; }
})();

// Сообщение наверх (окно на странице-деке): готово / бой кончился. Родитель у
// нас всегда свой (страница /deckinvestors на том же домене), поэтому адрес
// получателя задан явно, а не '*'. Вне окна parent === window — безвредно.
const postShowcase = (phase) => {
  if (!showcase) return;
  try { window.parent.postMessage({ source: 'hexlash-arena', phase }, window.location.origin); }
  catch (_) { /* окно закрыто или чужой домен — молча пропускаем */ }
};

// Служебный режим (?dev=1) — видны ли органы разработчика. Решается при ЗАГРУЗКЕ
// СТРАНИЦЫ, а не здесь: страж арены отбивает прямой заход и уводит на адрес без
// признака, так что к монтажу этой сцены его в строке уже нет. Разбор — в самом
// файле services/devMode.js.
// Dev-panel visibility — auto-hidden during a bout, flipped by the DEV corner
// toggle (the only way back during the SIG auto-cycle). Без служебного режима и
// в режиме показа остаётся false навсегда → панель и телеметрия не создаются.
const panelVisible = ref(DEV_MODE && !showcase);
// Летит ли камера прямо сейчас — по этому признаку показывается метка. Пишется
// в кадре, поэтому меняется только при СМЕНЕ состояния: запись в ref каждый
// кадр будила бы перерисовку разметки шестьдесят раз в секунду.
const freeFlying = ref(false);
// Показывать ли метку «готово» ДО первого нажатия. Камера есть у всех и без
// признака; признак теперь заведует только этой подсказкой — и никогда витриной.
const freeCamReady = FREE_CAM_MODE && !showcase;
// Dev readout — both fighters' stamina (силы) + charge (заряд), refreshed live
// (throttled) in the loop so the spend / recover can be watched. Temporary.
const staReadout = ref('STA  P —  ·  O —');
const chgReadout = ref('CHG  P —  ·  O —');
// Current intention of each fighter — so it's VISIBLE that differently-raised
// builds lean to different intentions. Refreshed (throttled) in the loop.
const intReadout = ref('INT  P —  ·  O —');
// Reading the foe: each fighter's PERCEIVED foe phase (noised by counter) + the
// last сбив/контра it committed — so the read skill is visible in isolation (a
// high-counter fighter shows windup/open reads + SBIV/CONTRA far more than a low one).
const rdReadout = ref('RD   P —  ·  O —');
// Brain strategy ('spinal' = deterministic default; 'model' = hybrid Claude wake
// on fight breaks). Dev toggle only — prod default is spinal (OFF). The MDL readout
// shows model wakes/bout + last read so it's visible breaks stay ~5–10, not 80.
const brainMode = ref('spinal');
const mdlReadout = ref('MDL  off');
// Stalemate накал (escalation by silence-without-exchange) — % level + the live
// silence so the trigger / reset moment is watchable on the dev stand (toggle the
// panel back on mid-bout to see it climb in a гляделка and snap back on a trade).
const nkReadout = ref('NK   —');
// Цена кадра на открытом поле: частота / время кадра + число тел. Только под
// служебным признаком — см. причину у разметки выше.
const fpsReadout = ref('FPS —  ·  —ms  ·  BODIES —');
// Dev toggle: flip both fighters between spinal and model brain live. Wrapped so
// the toggle itself can never throw + eject from the arena (the model path degrades
// to spinal on any endpoint outcome — see apiClient.requestFighterIntention).
const onBrain = () => {
  try {
    brainMode.value = brainMode.value === 'model' ? 'spinal' : 'model';
    // На большом поле тумблер только переключает подпись: модель там выключена у
    // всех, и поднимать её паре бойцов из середины поля значило бы тихо завести
    // обращения там, где их быть не должно.
    if (multiBout) return;
    fighter?.setBrain?.(brainMode.value);
    opponent?.setBrain?.(brainMode.value);
  } catch (e) {
    console.warn('[arena] brain toggle failed — staying on spinal', e);
    brainMode.value = 'spinal';
  }
};

// DEV: lock BOTH fighters to one intention to inspect its body signature in
// isolation (cycles OFF → the 7 → OFF). Re-applied across respawns in spawn*().
const LOCK_ORDER = ['off', 'press', 'strike', 'sting', 'hold', 'catch', 'break', 'breathe'];
const lockIdx = ref(0);
const lockedIntention = ref(null); // null = off; else an intention id
const onLockCycle = () => {
  lockIdx.value = (lockIdx.value + 1) % LOCK_ORDER.length;
  const id = LOCK_ORDER[lockIdx.value];
  lockedIntention.value = id === 'off' ? null : id;
  fighter?.setIntentionLock?.(lockedIntention.value);
  opponent?.setIntentionLock?.(lockedIntention.value);
};

// --- Behaviour A/B dev stand (preview only). Pick a signature preset for the
//     LEFT (player slot) and RIGHT (opponent slot) fighter, run an autonomous
//     bout on the existing FIGHT pipeline, and auto-cycle (re-run at full HP) on
//     each KO so successive bouts can be watched without reloading. NEUTRAL
//     COLOUR greys both + kills the core glow so the read is movement-only. None
//     of this touches the real play → upgrade → arena flow (random opponent core
//     intact) — the presets only apply while a SIG bout is running (sigCycle).
const sigLeft = ref('onslaught');
const sigRight = ref('raider');
const neutralColor = ref(false);

let renderer, scene, camera, controls, arena, fighter, opponent, presence, resizeObserver, clock;
// СВОБОДНАЯ КАМЕРА — служебный режиссёрский полёт (scene/freeCam.js). Заводится
// ТОЛЬКО при взведённом ?freecam=1; без признака остаётся null, и ни один
// обработчик клавиш не вешается. Бой она не трогает: только смотрит.
let freeCam = null;
// ПОЛЕ БОЯ — кто на плите, кто кому враг, кончился ли бой (см. battleField.js).
// `fighter` и `opponent` выше остались: на них висит вся служебная панель, и они
// показывают ПЕРВОГО бойца игрока и ПЕРВОГО чужого. В бою один на один это те же
// двое, что и раньше; на большем поле панель показывает первую пару.
// Бой на многих (состав больше пары). Признак нужен в двух местах сразу —
// подгонке кадра и служебному тумблеру думающего мозга, — поэтому живёт здесь,
// а не внутри сборки сцены.
let multiBout = false;
// Собирается ниже, когда уже известен режим: у открытого поля своё правило
// выбора цели (радиус внимания), и поле боя должно родиться сразу с ним —
// пересобирать его на ходу значило бы потерять всех, кто уже на плите.
let field = null;
let playerUnit = null;
let onVisibility, onKeydown;
// КАМЕРА ОТКРЫТОГО ПОЛЯ: она СТОИТ, а не следит. Здесь её счётчики — тишина перед
// наводкой, ход самой наводки и признак пальца на экране.
//
// Живут они здесь, а не в состоянии режима, по двум причинам. Спрашиваются каждый
// кадр — реактивная переменная на кадровом пути это лишняя работа на ровном месте.
// И объявлены выше по файлу, чем начало боя (runFight), которое их сбрасывает:
// так порядок сборки сцены не может однажды поменяться и уронить их в мёртвую зону.
// УКРЫТИЯ открытого поля: раскладка, их меш и обход. В прочих режимах — null.
let covers = null;
let coverMesh = null;
let coverNav = null;
let leaderBeams = null;
// СУЖЕНИЕ ПОЛЯ: правило границы (fieldShrink) и её контур на полу (fieldBorder).
// Оба живут столько же, сколько сцена, и сбрасываются на каждый бой — как и
// обход. В прочих режимах — null.
let shrink = null;
let fieldBorder = null;
let camPrevSet = false;  // поза прошлого кадра уже снята
let gesturing = false;   // палец на холсте прямо сейчас
let sinceTouch = 0;      // секунд тишины: от отпускания и от конца прошлой наводки
let aimT = -1;           // >= 0 — наводка едет, столько секунд она уже в пути
let aimSnap = true;      // ближайшая наводка мгновенная (начало боя)
let unbindCameraReturn = null;
// ДОСМОТР: своя сторона пала, а поле дерётся дальше. Признак живёт здесь, рядом с
// счётчиками камеры, по той же причине — его спрашивают каждый кадр (наводка
// смотрит на лидера, а не на своих), и реактивная переменная на кадровом пути
// была бы лишней работой на ровном месте.
let ofSpectate = false;
let unbindSpectateLeave = null;
// Pre-load readiness: emit once after the first frame is rendered so the
// bootstrap splash (#hx-load) can fade out on real arena readiness.
// Loading-screen handle — see services/sceneLoading.js. The arena lifts the screen
// on its declared stages plus three settled frames, not on the first frame drawn.
let load = null;

// Autonomous-behaviour intent per side (kept across respawns so a KO doesn't
// stop the loop). Set by the FIGHT / SIG FIGHT bouts.
let aiPlayer = false;
let aiOpponent = false;
// Full self-running fight (key F / FIGHT button). runFight is assigned in
// onMounted (needs the scene); fightActive gates the win-and-freeze behaviour.
let fightActive = false;
let runFight = null;
// Режим показа: бой запускается один раз за загрузку окна. Повтор делает
// страница-дека, перезагружая окно, — своей кнопки повтора у арены нет.
let showcaseStarted = false;

// ── Автозапуск боя в обычном пути игрока ────────────────────────────────────
// До этой правки бой начинался сам ТОЛЬКО в режиме показа для деки: игрок,
// доведённый до арены, видел двух неподвижных бойцов, а запускала их кнопка
// служебной панели или клавиша. То есть путь в бой заканчивался ничем.
//
// Ждём ГОТОВНОСТЬ СЦЕНЫ, а не таймер от начала загрузки. Признак готовности —
// снятый экран загрузки: он уходит, когда собраны все объявленные этапы И три
// кадра подряд нарисовались одинаковыми (см. services/sceneLoading.js). Таймер
// от начала загрузки на медленном телефоне выстрелил бы в пустую сцену.
const AUTO_START_MS = 1500; // пауза между «сцена готова» и первым ударом
// Полторы секунды — не произвол: мгновенный старт не даёт разглядеть, кто вышел
// драться, а пауза длиннее читается как зависание. Подбирается глазом.
let autoStarted = false;    // один заход на арену — один запуск, повтора нет
let autoTimer = null;       // отменяется при уходе со страницы

// Сцена не собралась. Молча запускать бой в такой сцене нельзя — игрок получит
// пустой экран и решит, что игра сломалась; поэтому показываем честную причину
// и дверь наружу.
const SCENE_TIMEOUT_MS = 10000;
let sceneTimer = null;
const sceneFailed = ref(false);
// SIG dev stand: sigCycle owns the auto-restart-on-KO loop (distinct from the
// normal FIGHT win-and-freeze). runSigFight assigned in onMounted. sigRestartAt
// is loop time the next bout fires; lastFrameT is the live loop time (so an
// elimination handler can schedule the restart).
let sigCycle = false;
let sigRestartAt = 0;
let lastFrameT = 0;
let lastStaReadout = 0; // throttle clock for the dev stamina readout
let runSigFight = null;
// Отсчёты боя (начало боя и последний чистый размен) переехали внутрь часов
// накала — scene/boutCore.js. Здесь их больше нет намеренно: два места, где
// живёт одно и то же время, разошлись бы при первой же правке.
const SIG_RESTART_DELAY = 1.4; // seconds after a KO before the next bout (~ the dissolve)

const router = useRouter();
// Служебный признак ?field= — временный вход на большое поле до экрана режимов.
const route = useRoute();

// ─── ЗАБЕГ (?chain=1) ───────────────────────────────────────────────────────
// Служебный вход в режим CHAIN — три боя подряд одним бойцом, по образцу ?field=.
// ⚠️ 17.09.2026 он больше НЕ единственный: у забега появился свой остров в
// воротах, и обычный игрок приходит сюда оттуда (см. блок про gateMode ниже).
// Признак остался для проверки режима в отрыве от выбора. БЕЗ ПРИЗНАКА И БЕЗ
// ВЫБОРА арена работает как DUEL и ничего из забега не включает — ни отметки во
// вкладке, ни стартового здоровья, ни граней сопернику.
//
// ⚠️ То же правило, что у признака показа рядом: он управляет ТОЛЬКО режимом
// боя. Думающий мозг модели и всё, что стоит денег, он не трогает — признак
// приходит из адресной строки, значит его подставит кто угодно.
// ─── ОТКУДА АРЕНА УЗНАЁТ РЕЖИМ (17.09.2026) ─────────────────────────────────
// Раньше три режима из пяти включались ТОЛЬКО служебным признаком в адресе, и
// игроку они были недоступны: в воротах стояло два острова. Теперь острова есть
// у всех пяти, и выбор приходит оттуда — тем же путём, каким уже приходил
// SQUAD: через сейф (`prefight/modeId`), а не через адрес.
//
// ПРИЗНАК В АДРЕСЕ ОСТАЁТСЯ И ОН СИЛЬНЕЕ. Им проверяют режим в отрыве от выбора
// — открыл ссылку и увидел рейд, что бы ни лежало в сейфе. Если бы сильнее был
// сейф, такая ссылка молча показывала бы не то, ради чего её открыли.
//
// СЛУЖЕБНЫЙ ?field= СИЛЬНЕЕ ОБОИХ: им проверяют поле само по себе, и он не
// должен зависеть ни от адреса, ни от выбора игрока.
const urlMode = route.query.chain === '1' ? 'chain'
  : route.query.raid === '1' ? 'raid'
  : (route.query.collapse !== undefined && route.query.collapse !== '') ? 'collapse'
  : null;
// ОТКРЫТОЕ ПОЛЕ — СЛУЖЕБНЫЙ ПРИЗНАК, И ОН СИЛЬНЕЕ ВЫБОРА В ВОРОТАХ, как ?field=.
// Читается здесь, до всего остального: ниже он гасит выбор из ворот, и без этого
// сохранённый в сейфе командный бой включился бы ВМЕСТЕ с открытым полем — два
// состава на одной плите, и чей из них выйдет, решал бы порядок проверок.
const hasOpenField = route.query.openfield !== undefined && route.query.openfield !== '';
const gateMode = (showcase || route.query.field || urlMode || hasOpenField)
  ? null
  : store.getters['prefight/modeId'];

const chainMode = !showcase && (urlMode === 'chain' || gateMode === 'chain');

// ─── РЕЙД (?raid=1) ─────────────────────────────────────────────────────────
// Служебный вход в режим RAID — команда из четверых против босса и двух его
// бойцов, по образцу ?chain=1. ⚠️ 17.09.2026 у рейда есть свой остров в воротах,
// и обычный игрок приходит сюда оттуда. Признак остался для проверки режима в
// отрыве от выбора. БЕЗ ПРИЗНАКА И БЕЗ ВЫБОРА арена работает как прежде.
//
// ⚠️ То же правило, что у признака показа и признака забега: он управляет ТОЛЬКО
// режимом боя. Думающий мозг модели и всё, что стоит денег, он не трогает.
//
// ЗАБЕГ СИЛЬНЕЕ: два режима боя разом не включаются. Спрошены оба, потому что
// адрес может нести оба признака сразу, и молчаливое «оба включились» дало бы
// состав рейда с ходом раундов забега.
const raidMode = !showcase && !chainMode && (urlMode === 'raid' || gateMode === 'raid');
// ─── ТУРНИР (?collapse=solo | duo | quad) ───────────────────────────────────
// Служебный вход в режим COLLAPSE — сетка на выбывание, по образцу ?chain=1.
// ⚠️ 17.09.2026 у турнира есть свой остров в воротах, и раскладку игрок выбирает
// там переключателем SOLO / DUO / QUAD. Признак остался для проверки режима в
// отрыве от выбора; любое другое его значение читается как SOLO. БЕЗ ПРИЗНАКА И
// БЕЗ ВЫБОРА арена работает как прежде.
//
// ⚠️ То же правило, что у признаков показа, забега и рейда: он управляет ТОЛЬКО
// подачей и режимом боя. Думающий мозг модели и всё, что стоит денег, он не
// трогает — признак приходит из адресной строки, значит его подставит кто угодно
// и нажжёт вызовов. Мгновенные бои турнира к модели не обращаются вовсе.
//
// ЗАБЕГ И РЕЙД СИЛЬНЕЕ: три режима боя разом не включаются. Спрошены все,
// потому что адрес может нести несколько признаков сразу, и молчаливое «все
// включились» дало бы состав одного режима с ходом другого.
//
// СЛУЖЕБНЫЙ ?field= ТОЖЕ СИЛЬНЕЕ: им проверяют поле само по себе, и он не должен
// зависеть от того, какой режим включён. Два разных состава на одной плите
// сложиться не могут, поэтому побеждает один — тот, что ближе к проверке.
// Раскладка турнира приходит из адреса (`?collapse=quad`) или из ворот. В
// воротах игрок выбирает её ЧИСЛОМ бойцов тем же переключателем, что размер
// команды, — 1, 2 или 4, — и это число и есть `perSide` раскладки. Второго
// списка соответствий нет: см. layoutByPerSide.
const collapseLayout = (showcase || chainMode || raidMode || route.query.field)
  ? null
  : (urlMode === 'collapse'
    ? parseLayoutId(route.query.collapse)
    : (gateMode === 'collapse' ? layoutByPerSide(store.getters['prefight/squadSize']).id : null));
const collapseMode = !!collapseLayout;
let collapseStartHp = null;   // здоровье бойцов игрока на старте волны (абсолют)
let collapsePanelTimer = null; // пауза между замиранием боя и панелью волны

// Ход раунда. Номер и здоровье живут в chainRun; здесь — только то, что нужно
// сцене, чтобы собрать следующего соперника.
let chainLastCore = null;   // ядро прошлого раунда — подряд не повторяем
let chainPanelTimer = null; // пауза между замиранием боя и панелью
let chainStartHp = null;    // здоровье бойца игрока на старте раунда (абсолют)
let resultTimer = null;     // пауза между замиранием боя и панелью итога
let unbindFightAgain = null; // отвязать кнопку «драться снова» при уходе
// Дверь наружу из несобравшейся сцены — домой, а не «назад»: назад может вести
// на тот же адрес арены, и игрок закольцуется на той же поломке.
function onFailedBack() { router.push('/play/home'); }

function lowPowerDevice() {
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  return cores <= 4 || mem <= 4;
}

function onFight() { runFight?.(); }

// --- SIG dev-stand controls (preview only). Cancel the auto-cycle (a normal
//     FIGHT / AI / DEMO takes over from the A/B loop).
function cancelSig() { sigCycle = false; sigRestartAt = 0; }
const sigTag = (id) => SIG_PRESETS[id]?.tag || '—';
// Step a slot through the five presets (L = player slot, R = opponent slot).
function cycleSig(which) {
  const slot = which === 'left' ? sigLeft : sigRight;
  const i = SIG_ORDER.indexOf(slot.value);
  slot.value = SIG_ORDER[(i + 1) % SIG_ORDER.length];
}
function onSigFight() { runSigFight?.(); }
// NEUTRAL COLOUR toggle — grey both fighters + kill the core glow live (and
// re-applied on every respawn via the build option). Fighters only; the rift +
// arena are untouched.
function onNeutralColor() {
  neutralColor.value = !neutralColor.value;
  fighter?.setNeutralColor(neutralColor.value);
  opponent?.setNeutralColor(neutralColor.value);
}
// BLOCK dev toggle (key B / button) — manually raise / drop the player fighter's
// block stance to inspect the guard pose + damage softening without waiting for
// the reflex. Manual hold (Infinity) until toggled off.
const blockDev = ref(false);
function onBlockToggle() {
  blockDev.value = !blockDev.value;
  fighter?.setBlock(blockDev.value);
}
// FEINT dev trigger (key V / button) — throw the player fighter's feint once to
// see the fake + check the payoff. (F is already FIGHT, so feint is on V.)
function onDevFeint() { fighter?.feint(); }
// STAGGER dev trigger (key G / button) — play the player's interrupt reaction clip
// to see the new movement without timing an actual interrupt.
function onDevStagger() { fighter?.stagger(); }
// CHARGE dev trigger (key C / button) — first press fills the player's charge to
// full; once full, the next press throws the empowered strike (see the readout
// drop + the harder, guard-piercing hit).
function onDevCharge() {
  if (!fighter) return;
  if (fighter.getCharge01() < 0.999) fighter.fillCharge();
  else fighter.discharge();
}

// Stalemate safeguard — rising накал by SILENCE (not fight time). Правила и их
// причины переехали в scene/boutCore.js (17.09.2026): их теперь читает не только
// сцена, но и мгновенный бой турнира COLLAPSE, а второй записи тех же правил
// быть не должно — она разошлась бы с первой. Числа, условия и пороги перенесены
// дословно, включая рейдовый порог ниже.
// ─── ОТКРЫТОЕ ПОЛЕ (?openfield=solo | duo | quad) ───────────────────────────
// Двадцать тел на одной большой плите, стороны дерутся все против всех.
//
// ⚠️ ДО РАБОТЫ «ОСТРОВ В ВОРОТАХ» РЕЖИМ ЖИВЁТ ТОЛЬКО ЗА ЭТИМ ПРИЗНАКОМ. Острова
//    у него нет, в таблице режимов (data/arenaModes.js) его тоже нет — и это
//    намеренно: всё, что там лежит, ворота показывают дверью, а дверь в
//    незаконченный режим игроку показывать нельзя. Путь через ворота не меняется.
//
// ⚠️ ТО ЖЕ ПРАВИЛО, ЧТО У ПРИЗНАКОВ ПОКАЗА, ЗАБЕГА, РЕЙДА И ТУРНИРА: он управляет
//    ТОЛЬКО режимом боя. Думающий мозг модели и всё, что стоит денег, он не
//    трогает — признак приходит из адресной строки, значит его подставит кто
//    угодно. На двадцати телах модель и так выключена у всех (см. multiBout).
//
// ОСТАЛЬНЫЕ РЕЖИМЫ СИЛЬНЕЕ: шесть режимов боя разом не включаются. Спрошены все,
// потому что адрес может нести несколько признаков сразу, и молчаливое «все
// включились» дало бы состав одного режима с ходом другого.
// ЗАБЕГ, РЕЙД И ТУРНИР СИЛЬНЕЕ: они приходят своими признаками, и адрес может
// нести несколько сразу. Выбор из ворот здесь уже погашен (см. hasOpenField).
const openFieldLayoutId = (showcase || chainMode || raidMode || collapseMode || route.query.field)
  ? null
  : parseOfLayoutId(route.query.openfield);
const openFieldMode = !!openFieldLayoutId;
const ofLayout = openFieldMode ? getOfLayout(openFieldLayoutId) : null;

// ПОЛЕ БОЯ. Радиус внимания и лидер — два правила ОДНОГО режима: без них выбор
// цели идёт прежним путём, и пять прежних режимов ведут себя ровно как вели.
//
// ⚠️ ЧАСЫ ЛИДЕРА — ВРЕМЯ БОЯ, А НЕ ВРЕМЯ СЦЕНЫ. «Лидера нет первые десять
//    секунд» отсчитывается от начала боя; возьми часы сцены — и во втором бою
//    подряд («драться снова») корона села бы в первом же кадре, потому что сцена
//    к тому моменту стоит уже минуту. `clocks.elapsed()` объявлен ниже, но к
//    моменту первого обращения он уже есть.
field = createBattleField({
  attentionRadius: openFieldMode ? COMBAT_BALANCE.openField.attentionRadius : null,
  leader: openFieldMode ? { now: () => clocks.elapsed() } : null,
});

const clocks = createBoutClocks({
  now: () => lastFrameT,
  // У РЕЙДА СВОЙ ПОРОГ часов длины — см. причину в combatBalance.raid. У открытого
  // поля своего НЕТ: замер показал, что длина к нему нечувствительна, и лишнее
  // число сняли — см. блок openField в файле чисел боя.
  startSec: () => (raidMode ? COMBAT_BALANCE.raid.escalateStartSec : COMBAT_BALANCE.escalateStartSec),
});
const escalation01 = clocks.escalation01;
const escalationMult = clocks.escalationMult;

onMounted(() => {
  // ЗАБЕГ БРОШЕН НА СЕРЕДИНЕ. Отметка во вкладке говорит, что прошлый забег не
  // доигран: обновили страницу, закрыли вкладку, ушли кнопкой «назад». Забег
  // с середины мы не обещаем восстанавливать — уводим в ворота, а сообщение
  // покажут там. Отметку НЕ снимаем: её снимет тот, кто покажет сообщение,
  // иначе оно потерялось бы вместе с этим экраном при переходе.
  //
  // Проверка стоит ДО startRun ниже — иначе мы нашли бы отметку, которую сами же
  // и поставили секунду назад.
  if (hasStaleRun(showcase) || hasStaleCollapse(showcase)) {
    router.replace({ name: 'V2ArenaGate' });
    return;
  }
  // Ход забега живёт в памяти страницы и переживает уход с арены. Обычный бой
  // обязан начаться с чистого хода, иначе панель прошлого забега выскочит в DUEL.
  if (chainMode) startRun(); else clearRunState();
  // То же самое у турнира, и по той же причине.
  if (!collapseMode) clearCollapseState();

  // Build stages, in the order they happen below.
  load = beginSceneLoad(['renderer', 'arena', 'fighters', 'controls']);

  // Сторож сборки. Если за SCENE_TIMEOUT_MS сцена так и не объявила готовность,
  // бой НЕ запускаем и говорим об этом вслух. Своя страховка загрузки снимает
  // экран позже (15 с) и просто пускает игрока внутрь — в недостроенную сцену;
  // раньше неё мы успеваем сказать правду и дать дверь наружу.
  //
  // Вкладка в фоне — не отказ: кадры там не идут вовсе, готовности взяться
  // неоткуда. В этом случае сторож заводится заново, а не обвиняет сцену.
  const watch = () => {
    sceneTimer = null;
    if (autoStarted || !loadingState.active) return; // успели, сторож не нужен
    if (document.hidden) { sceneTimer = setTimeout(watch, SCENE_TIMEOUT_MS); return; }
    sceneFailed.value = true;
  };
  sceneTimer = setTimeout(watch, SCENE_TIMEOUT_MS);

  const el = wrap.value;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const targetFPS = coarse ? 30 : 60;

  // --- Renderer. Transparent so the CSS void shows behind the WebGL. Full
  //     device resolution (DPR capped — 2 desktop, 1.5 on low-power phones) so
  //     nothing is upscaled / blurry.
  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const maxDPR = lowPowerDevice() ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDPR));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  // Atmospheric haze — far edge of the slab dissolves into the void (depth +
  // hides far-half aliasing). Additive glows opt out via material.fog = false.
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG.arena.density);

  // --- Camera: perspective, 3/4 view from above (~56° tilt from vertical).
  camera = new THREE.PerspectiveCamera(FOV.arena, w / h, CAMERA.near, CAMERA.far.arena);
  camera.position.set(5.5, 6.2, 7.5);

  // --- Lighting: one key directional from top-front (bright top, dark sides,
  //     sharp face boundaries via flat shading) + low cool fill.
  const key = new THREE.DirectionalLight(LIGHTING.key.color, LIGHTING.key.intensity);
  key.position.set(...LIGHTING.key.position);
  scene.add(key);
  scene.add(new THREE.AmbientLight(LIGHTING.amb.color, LIGHTING.amb.intensity));
  scene.add(new THREE.HemisphereLight(LIGHTING.hemi.sky, LIGHTING.hemi.ground, LIGHTING.hemi.intensity));

  // --- Arena + presence. Pink comes from the --pink token (the scene
  //     inherits it via .app-v2), never hard-coded — one canonical pink.
  const pink = getComputedStyle(el).getPropertyValue('--pink').trim() || '#FF0069';
  // Player's core (Заход 3): the chosen core glows its own hue on the player
  // fighter. The opponent + the rift stay canon pink — one glow source + a clean
  // friend/foe read. coreId is carried whole (not just the colour) so future
  // core→fight-style behaviour can hook onto the same id without rewiring. The
  // route guard normally blocks reaching the arena without a pick; canon-pink
  // fallback keeps the scene sane otherwise.
  // getCore() always resolves (falls back to Скала), so gate on the raw pick to
  // keep the canon-pink fallback when nothing was chosen.
  // Режим показа: ядро игрока задано жёстко (ONSLAUGHT) — так написано на
  // странице-деке, и заходить туда через выбор ядра инвестор не будет.
  const pickedId = showcase ? 'natisk' : store.getters['prefight/selectedCoreId'];
  const selectedCore = pickedId ? getCore(pickedId) : null;
  const playerColor = selectedCore ? selectedCore.hue : pink;
  const playerCoreId = selectedCore ? selectedCore.id : null;

  // --- Behaviour resolve (data-каркас). Each fighter's profile = its core start
  //     profile + lit-facet shifts (empty shifts this pass → just the core). The
  //     player resolves from the picked core + the working upgrade tree's lit
  //     faces; the opponent is assigned its OWN random core (lit from that core's
  //     CRYSTALS defaults) so it fights by a different profile, never a mirror of
  //     the player. buildFighter maps these 8 axes onto its move / AI knobs.
  const collectLit = (crystals) => {
    const lit = [];
    for (const cr of crystals || []) for (const f of cr.faces || []) if (f.state === 'lit') lit.push(f);
    return lit;
  };
  // Player lit faces: the live working tree if present, else the picked core's
  // CRYSTALS defaults (so the arena reflects the build even without a tree).
  const playerTree = store.getters['prefight/upgradeTree'] || (playerCoreId ? CRYSTALS[playerCoreId] : null);
  const playerBehavior = resolveBehavior(playerCoreId, collectLit(playerTree));
  // Opponent: a random one of the four cores, lit from its own CRYSTALS defaults.
  //
  // ⚠️ `let`, А НЕ `const`, РАДИ ЗАБЕГА. В DUEL ядро соперника выбирается ОДИН РАЗ
  //    при открытии страницы и дальше не меняется — кнопка FIGHT пересобирает тела,
  //    но ядро остаётся то же. Забегу нужен НОВЫЙ соперник на каждый раунд, иначе
  //    все три боя пройдут против одного и того же бойца. Переписывает эти три
  //    строки только rollChainFoe ниже, и только когда забег включён: в DUEL они
  //    как были заданы при входе, так и стоят.
  //
  //    `opponentTree` заведено здесь же: раньше дерево соперника спрашивали по
  //    ядру в двух местах (характер и портрет), и оба всегда получали заготовку
  //    БЕЗ ЕДИНОЙ ЗАЖЖЁННОЙ ГРАНИ. В забеге у соперника грани есть, и оба места
  //    обязаны видеть одно и то же дерево — поэтому оно теперь одно.
  let opponentCoreId = showcase ? 'zasada' : CORES[Math.floor(Math.random() * CORES.length)].id;
  let opponentTree = CRYSTALS[opponentCoreId];
  let opponentBehavior = resolveBehavior(opponentCoreId, collectLit(opponentTree));

  // Behaviour for a side: during a SIG dev bout the chosen signature preset
  // (L = player, R = opponent) overrides the core-derived profile; otherwise the
  // real core behaviour stands (so page load + the normal FIGHT button are the
  // genuine preview, opponent random core intact).
  const behaviorFor = (side) => {
    if (sigCycle) {
      const pb = presetBehavior(side === 'player' ? sigLeft.value : sigRight.value);
      if (pb) return pb;
    }
    return side === 'player' ? playerBehavior : opponentBehavior;
  };
  // ─── СОПЕРНИК ЗАБЕГА ──────────────────────────────────────────────────────
  //     Кто выходит драться в раунде N, решает data/foeCompose.js — там же, где
  //     живут ядра и грани. Сцена только принимает готового бойца и ставит его на
  //     плиту. В DUEL эта ветка не работает вовсе: соперник остаётся таким, каким
  //     его выбрали при открытии страницы, — без граней и без поправок.
  const playerLit = countLit(playerTree);

  // ─── КОМАНДНЫЙ БОЙ (SQUAD) ────────────────────────────────────────────────
  //     Игрок выводит на плиту НЕСКОЛЬКО своих бойцов, каждого со своим ядром и
  //     своими гранями. Чужая сторона — столько же ботов.
  //
  //     Режим включается выбором в воротах, а не признаком в адресе: остров SQUAD
  //     там живой. Служебный ?field= сильнее — им проверяют поле само по себе, и
  //     он не должен зависеть от того, что игрок выбрал.
  const squadFighters = showcase ? [] : (store.getters['prefight/squadFighters'] || []);
  const squadMode = !showcase && !chainMode && !raidMode && !collapseMode
    && store.getters['prefight/modeId'] === 'squad'
    && squadFighters.length > 1;

  // ─── ТУРНИР (COLLAPSE) ────────────────────────────────────────────────────
  //     Игрок выводит на плиту столько своих бойцов, сколько просит раскладка:
  //     одного в SOLO, двоих в DUO, четверых в QUAD. Против него — сторона ботов
  //     из сетки турнира; её состав и здоровье ведёт services/collapseRun.js.
  //
  //     ОТКУДА БЕРУТСЯ БОЙЦЫ. Сначала состав, выбранный в воротах, по порядку;
  //     недостающие добираются из списка бойцов по его порядку, без повторов. У
  //     турнира своего экрана выбора пока нет, а идти в бой с тем, кого игрок
  //     выбрал, честнее, чем брать первых попавшихся.
  const collapsePlayerRoster = (() => {
    if (!collapseMode) return [];
    const want = getLayout(collapseLayout).perSide;
    const picked = [...squadFighters];
    const all = store.getters['roster/fighters'] || [];
    for (const f of all) {
      if (picked.length >= want) break;
      if (!picked.some((p) => p.id === f.id)) picked.push(f);
    }
    return picked.slice(0, want).map((f) => ({
      id: f.id,
      coreId: f.core,
      behavior: resolveBehavior(f.core, collectLit(f.upgrade)),
      name: f.callsign || '',
      upgrade: f.upgrade,
    }));
  })();
  // Чужая сторона текущей волны. Обновляется на старте каждой волны: сетка
  // решает, кто выходит следующим, сцена только ставит его на плиту.
  let collapseFoes = [];
  const pullCollapseFoes = () => { collapseFoes = currentFoeRoster(); };
  // Бойцов меньше, чем просит раскладка. Турнир НЕ начинается — вместо него
  // честное состояние с одной дверью наружу. Это временная замена правилу SQUAD
  // «режим доступен, кнопка не горит»: своего экрана у турнира пока нет.
  const collapseShort = collapseMode
    && collapsePlayerRoster.length < getLayout(collapseLayout).perSide;
  // ─── ОТКРЫТОЕ ПОЛЕ ────────────────────────────────────────────────────────
  //     Сторона игрока — его бойцы, столько, сколько просит раскладка. Берутся
  //     ТЕМ ЖЕ ПРАВИЛОМ, ЧТО В ТУРНИРЕ: сначала состав, выбранный в воротах, по
  //     порядку, недостающие добираются из списка бойцов, без повторов. Своего
  //     экрана выбора у режима пока нет, а идти в бой с тем, кого игрок выбрал,
  //     честнее, чем брать первых попавшихся.
  const openFieldRoster = (() => {
    if (!openFieldMode) return [];
    const want = ofLayout.perSide;
    const picked = [...squadFighters];
    const all = store.getters['roster/fighters'] || [];
    for (const f of all) {
      if (picked.length >= want) break;
      if (!picked.some((p) => p.id === f.id)) picked.push(f);
    }
    return picked.slice(0, want).map((f) => ({
      coreId: f.core,
      behavior: resolveBehavior(f.core, collectLit(f.upgrade)),
    }));
  })();
  // Бойцов меньше, чем просит раскладка. На поле не выходит НИКТО — то же
  // честное состояние, что у турнира, и по той же причине: половина стороны
  // означала бы бой, которого нет.
  const openFieldShort = openFieldMode && openFieldRoster.length < ofLayout.perSide;

  // ЧУЖИЕ СТОРОНЫ. Собираются заново на каждый бой — «драться снова» должно
  // выводить новое поле, а не то же самое.
  //
  // Сторона строится ТЕМ ЖЕ сборщиком, что в турнире (buildBotSide): одно число
  // граней на всю сторону, ровно 0..5, от игрока не зависит. Это решение владельца
  // оплачено уроком рейда — когда грани игрока раздавались врагам, прокачка
  // работала против того, кто её делал. Второго сборщика с теми же правилами
  // заводить нельзя: они разошлись бы.
  //
  // ПОЗЫВНЫЕ БЕЗ ПОВТОРОВ НА ВСЁМ ПОЛЕ. Список занятых имён ведётся ОДИН на все
  // девятнадцать чужих бойцов и передаётся из стороны в сторону — иначе на плите
  // встретились бы два одинаковых имени.
  let openFieldFoes = [];
  const rollOpenFieldFoes = () => {
    const taken = [];
    openFieldFoes = [];
    for (let i = 1; i < ofLayout.sides; i++) {
      openFieldFoes.push(buildBotSide(i, ofLayout.perSide, taken));
    }
  };

  // ПОЗЫВНОЙ СТОРОНЫ — имя её ПЕРВОГО бойца. То же правило, по которому турнир
  // называет сторону (collapseRun.nameOf): второго имени у стороны в этой игре
  // нет, и заводить его ради одной строки значило бы завести второе имя одному
  // и тому же. Сторона игрока сюда не приходит: про неё строка говорит иначе.
  const ofLeaderName = (sideId) => {
    const i = Number(String(sideId).replace('foe', ''));
    const side = Number.isFinite(i) ? openFieldFoes[i - 1] : null;
    return side && side.roster[0] ? side.roster[0].name : null;
  };

  // Чужая сторона. Собирается заново на каждый бой — «драться снова» должно
  // выводить новую команду, а не ту же.
  let squadFoes = [];
  const rollSquadFoes = () => {
    squadFoes = composeSquadFoes(squadFighters.length, squadFighters.map((f) => countLit(f.upgrade)));
  };

  // ─── РЕЙД ─────────────────────────────────────────────────────────────────
  //     Игрок выводит ОДНОГО своего бойца, к нему встают три бота-союзника, а
  //     против них выходит босс и двое его бойцов. Всех шестерых собирает один
  //     вызов — позывные не должны повторяться ни у кого на плите, а для этого
  //     занятые имена надо вести одним списком (см. composeRaid).
  //
  //     Боец игрока — ПЕРВЫЙ из выбранного в воротах состава. Состава нет —
  //     сюда вообще не доходят: страж арены заворачивает на выбор состава, ровно
  //     как заворачивает DUEL.
  let raid = null;
  const rollRaid = () => { raid = composeRaid({ litCount: playerLit }); };

  // НОВЫЙ СОПЕРНИК ДЛЯ ПОВТОРНОГО БОЯ. Ядро соперника выбирается один раз при
  // открытии страницы, поэтому кнопка «драться снова» без этого выводила бы на
  // плиту ТОГО ЖЕ бойца, что и в прошлый раз. Правила те же, по которым он
  // рождается при входе на арену: случайное ядро, без граней.
  const rollDuelFoe = () => {
    if (raidMode) { rollRaid(); return; }         // рейд — новые союзники, новый босс и охрана
    if (squadMode) { rollSquadFoes(); return; }   // командный бой — новая чужая команда
    // Открытое поле — новые девятнадцать соперников. ТЗ просит именно этого:
    // «драться снова» выводит новые стороны, новые позывные и новую расстановку.
    // Отсчёт сторон здесь НЕ трогаем: его заводит сам бой (runFight), потому что
    // бой начинается не только этой кнопкой — есть ещё служебная FIGHT и клавиша.
    if (openFieldMode) { rollOpenFieldFoes(); return; }
    opponentCoreId = CORES[Math.floor(Math.random() * CORES.length)].id;
    opponentTree = CRYSTALS[opponentCoreId];
    opponentBehavior = resolveBehavior(opponentCoreId, collectLit(opponentTree));
  };

  const rollChainFoe = (round) => {
    const foe = composeChainFoe({ round, litCount: playerLit, lastCoreId: chainLastCore });
    chainLastCore = foe.coreId;
    opponentCoreId = foe.coreId;
    opponentTree = foe.tree;
    opponentBehavior = foe.behavior;
    return { name: foe.name, coreId: foe.coreId };
  };

  // Character PORTRAIT in WORDS for the model brain: the core's manner line + each
  // lit facet's manner-phrase (facetReadout) — NO raw axis numbers. Built where the
  // core + facet data lives; the backend just wraps it into the prompt. During a SIG
  // dev bout (no core/facets) a coarse preset label stands in.
  const portraitFor = (side) => {
    if (sigCycle) {
      const id = side === 'player' ? sigLeft.value : sigRight.value;
      return [`${String(id).toUpperCase()} signature fighter`];
    }
    const coreId = side === 'player' ? playerCoreId : opponentCoreId;
    const core = coreId ? getCore(coreId) : null;
    const lit = side === 'player' ? collectLit(playerTree) : collectLit(opponentTree);
    const out = [];
    if (core) out.push(`${core.name} — ${core.manner}`);
    const seen = new Set();
    for (const f of lit) {
      const ph = facetPhrase(f);
      if (ph && !seen.has(ph)) { seen.add(ph); out.push(ph); }
    }
    return out;
  };
  load.stage('renderer');
  // --- ПЛИТА ПОД НОГАМИ. Обычно — боевая плита арены. У ОТКРЫТОГО ПОЛЯ она
  //     другая, и вот почему.
  //
  //     Боевая плита 6 на 4, и этот размер заперт константой PLATFORM ВНУТРИ
  //     защищённого buildArena.js. Двадцать сторон на неё не встают физически:
  //     кольцо выхода не помещается, все начинают бой в упоре. Поднять константу
  //     нельзя — она одна на все пять режимов и на экран дома.
  //
  //     Поэтому берётся buildForgeSlab — ТА ЖЕ ПЛИТА, у которой размер вынесен
  //     наружу. Это не третья копия рецепта: файл уже живёт в проекте, его завёл
  //     зал по этой же причине, и зову я его как есть. Материал, размер
  //     шестиугольной ячейки и вид рваного шва у них общие — пол остаётся тем же
  //     полом, просто больше.
  //
  //     РАЗЛОМА У НЕЁ НЕТ ВОВСЕ — он в forgeSlab не строится. Значит на большом
  //     поле не появляется ни второго свечения, ни лишнего розового, и гасить
  //     после сборки, как это делает дом, здесь нечего.
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  if (openFieldMode) {
    // Размер поля СЧИТАЕТСЯ от кольца выхода, а не пишется числом: напиши его
    // числом, и он разойдётся с кольцом при первой же правке просвета между
    // сторонами — стороны либо вылезут за край, либо соберутся в середине.
    const span = (spawnRingRadius(ofLayout) + COMBAT_BALANCE.openField.edgeMargin) * 2;
    arena = buildForgeSlab({ width: span, depth: span, maxAniso });
  } else {
    arena = buildArena(maxAniso, pink);
  }
  scene.add(arena.group);
  // ДЫХАНИЕ РАЗЛОМА — только там, где разлом есть. На большом поле его нет, и
  // presence не создаётся вовсе: он читает из плиты свечение и искры, которых
  // там не построено. Так же поступает дом — «не создавать» вместо «погасить».
  presence = openFieldMode ? null : createArenaPresence(scene, arena.refs);
  if (presence) presence.setReducedMotion(reducedMotion);

  // --- УКРЫТИЯ. Низкие толстые блоки, дробящие общую свалку на местные стычки.
  //     Ставятся только на открытом поле: на боевой плите 6 на 4 им негде стоять,
  //     и заводить их там значило бы менять пять принятых режимов.
  //
  //     Здесь, а не раньше, потому что блоки стоят НА плите, а высота её верха
  //     известна только после сборки.
  if (openFieldMode) {
    covers = buildCoverLayout();
    coverMesh = buildCovers(covers, arena.refs.topY);
    scene.add(coverMesh.group);
    // --- ЛУЧ ЛИДЕРА. Единственное новое свечение на поле: разлома здесь нет
    //     (см. presence выше), и розовый, занятый в этом режиме действием, тут же
    //     достаётся короне. Кто корона — знает поле боя; здесь только показ.
    leaderBeams = createLeaderBeams({ scene, color: pink, groundY: arena.refs.topY });
    // --- СУЖЕНИЕ ПОЛЯ. Граница трогается с КОЛЬЦА ВЫХОДА, а не с кромки плиты:
    //     вне кольца лежит только запас до края, драться там всё равно негде.
    //     Правило и его контур заводятся один раз на сцену и сбрасываются на
    //     каждый бой — ровно как обход укрытий.
    //
    //     ⚠️ Контур НЕ СВЕТИТСЯ. Он матовый и лежит на полу: на этом поле
    //        светится только луч над короной, и второго свечения не появляется.
    shrink = createFieldShrink({ startRadius: spawnRingRadius(ofLayout), covers });
    fieldBorder = buildFieldBorder(arena.refs.topY);
    fieldBorder.setReducedMotion(reducedMotion);
    scene.add(fieldBorder.mesh);
  }
  load.stage('arena');

  // --- Fighters: spawned on opposite sides, then free to roam the whole plate —
  //     they navigate toward each other, manoeuvre at range and turn to face the
  //     moving target (the rift is no longer a barrier). A strike connecting in
  //     range damages the other; the hit signal lives ON the fighters (defender
  //     recoils + core flash), NOT on the rift — the rift stays ambient, so
  //     there's only one glow on screen. Elimination ends a FIGHT (winner idles);
  //     outside a fight it respawns (dev loop / re-preview).
  //
  // Plate bounds for navigation: half-extents minus a margin so feet stay on the
  // slab. The whole plate (both sides) is walkable.
  const NAV_MARGIN = 0.5;
  const navBounds = {
    x: arena.refs.W / 2 - NAV_MARGIN,
    z: arena.refs.totalDepth / 2 - NAV_MARGIN,
  };
  // ОБХОД УКРЫТИЙ. Сетка проходимости печётся здесь один раз — она нужна и полю
  // боя (куда идти), и циклу (выталкивать тела из блоков). Время берёт у часов
  // сцены: у мгновенного боя оно своё, и обход об этом ничего знать не должен.
  if (openFieldMode) {
    coverNav = createCoverNav({ covers, bounds: navBounds, now: () => lastFrameT });
  }
  // --- СВОИ ОТЛИЧИМЫ ОТ ЧУЖИХ. Тонкое белое кольцо на плите под СТОРОНОЙ игрока.
  //
  //     ⚠️ Здесь стояло обратное: «союзные боты в RAID не метятся». Это было
  //     написано до того, как режим появился, и расходилось с решением
  //     девятнадцатой записи, которое прямо говорит: кольцо под всей стороной
  //     игрока, включая союзных ботов, и делается это в работе RAID. Переписано
  //     16.09.2026 вместе с самой правкой.
  //
  //     Кольцо отвечает «где моя команда», а не «где бот». Живой союзник получит
  //     такое же кольцо, когда появятся живые, — поэтому ботов оно не выдаёт, и
  //     правило «бота игроку не показывать» остаётся в силе.
  //
  //     Кому кольцо — решает СОСТАВ (`spec.ringed`), а не эта сборка: в рейде
  //     это вся сторона, в прочих режимах — только бойцы самого игрока.
  //
  //     Почему белое и не светится. Цвет бойца принадлежит ядру, розовый —
  //     действию; кольцо не имеет права забрать ни то, ни другое. И свечение на
  //     экране одно — разлом, — поэтому кольцо рисуется плоским, обычным
  //     смешиванием: это метка на полу, а не второй источник света.
  const RING_Y = 0.012;  // над плитой, чтобы не тонуть в ней
  let ringGeo = null, ringMat = null;
  const makeOwnRing = () => {
    if (!ringGeo) {
      ringGeo = new THREE.RingGeometry(0.42, 0.47, 40);
      ringGeo.rotateX(-Math.PI / 2);
      ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.34, depthWrite: false });
    }
    const m = new THREE.Mesh(ringGeo, ringMat);   // геометрия и материал общие на всех
    m.renderOrder = 1;
    scene.add(m);
    return m;
  };
  const dropRing = (u) => { if (u && u.ring) { scene.remove(u.ring); u.ring = null; } };

  // --- КАДР ПО ЖИВЫМ. Камера держит в кадре всех, кто ещё дерётся, и сжимается
  //     по мере выбывания. Углы не трогаем — их крутит игрок; двигаем только
  //     точку, вокруг которой он крутит, и удаление от неё.
  //
  //     В бою ОДИН НА ОДИН не включается вовсе: кадр там выставлен и принят
  //     глазами, и менять его — значит менять бой, который должен остаться
  //     прежним. Признак ставится на весь бой, а не по числу живых, иначе на
  //     последней паре кадр дёрнулся бы обратно.
  // Запас кадра. Считать один разброс по плите мало: у бойца есть рост, а над
  // головой висит плашка здоровья, и по горизонтали они в габарит не входят.
  // HEADROOM добавляется к радиусу, иначе кадр садится бойцам на макушки.
  const FRAME_MARGIN = 1.25;
  const FRAME_HEADROOM = 1.8;
  const _cen = new THREE.Vector3();
  const _want = new THREE.Vector3();

  /**
   * КУДА ХОЧЕТ ВСТАТЬ КАДР — чистый расчёт, без единого движения камеры.
   *
   * Отделён от самого движения намеренно: этот же расчёт нужен ДВУМ разным
   * повадкам камеры. В пяти прежних режимах кадр подъезжает к нему каждый кадр
   * (frameLiving), на открытом поле камера стоит и приходит сюда только на
   * наводку (aimTick). Расчёт один, и второй его записи быть не должно.
   *
   * Возвращает `{ cx, cz, dist }` или null, если наводить не на кого.
   */
  const framePose = (list) => {
    if (!list.length) return null;
    // ОТКРЫТОЕ ПОЛЕ: КАДР ДЕРЖИТ СВОЮ СТОРОНУ, А НЕ ВСЁ ПОЛЕ.
    //
    // Общее правило «в кадре все живые» на двадцати телах работает против игрока:
    // поле в разы больше боевой плиты, и кадр, вмещающий двадцать тел, делает
    // своего бойца точкой. ТЗ прямо требует обратного — он не должен быть мельче,
    // чем в турнире QUAD. Поэтому здесь кадр считается по ЖИВЫМ СВОИМ, а тот, с
    // кем свой дерётся, попадает в него запасом (camEngageRoom), а не тем, что
    // его положение входит в расчёт: цель может стоять на другом конце поля.
    //
    // Остался один свой — кадр встаёт по нему, это выходит само собой.
    //
    // ⚠️ СВОИХ НЕ ОСТАЛОСЬ ВОВСЕ — ВОЗВРАЩАЕМ null, А НЕ КАДР ПО ВСЕМ. Камера САМА
    //    на чужую драку не наводится никогда: своих бойцов нет, наводиться не на
    //    кого, и через пятнадцать секунд тишины она просто стоит. По кнопке — да:
    //    в досмотре кнопка ведёт к лидеру, и у неё свой расчёт (spectatePose).
    let focus = list;
    let room = 0;
    if (openFieldMode) {
      const mine = list.filter((u) => u.sideId === 'player');
      if (!mine.length) return null;
      focus = mine;
      room = COMBAT_BALANCE.openField.camEngageRoom;
    }
    return poseFromUnits(focus, room);
  };

  /**
   * Сама арифметика кадра: середина названных тел и удаление, с которого они в
   * него влезают. Вынесена из framePose, потому что считать это стало нужно по
   * двум разным спискам — свои в бою и сторона-лидер в досмотре, — а второй записи
   * той же арифметики быть не должно.
   */
  const poseFromUnits = (focus, room) => {
    _cen.set(0, 0, 0);
    for (const u of focus) _cen.add(u.f.group.position);
    _cen.divideScalar(focus.length);
    let r = 0.9;
    for (const u of focus) r = Math.max(r, _cen.distanceTo(u.f.group.position));
    r += FRAME_HEADROOM + room;
    const half = THREE.MathUtils.degToRad(camera.fov) / 2;
    const need = Math.max(r / Math.tan(half), r / (Math.tan(half) * camera.aspect)) * FRAME_MARGIN;
    // ⚠️ КЛАМП СВОЙ, А НЕ ПО КОРИДОРУ УПРАВЛЕНИЯ. Коридор на открытом поле
    //    растянут под руку игрока — до края поля; возьми наводка его потолок,
    //    и она вставала бы у края, а правило «свой боец не мельче, чем в турнире
    //    QUAD» перестало бы работать. У наводки свой потолок, у руки свой.
    const lo = openFieldMode ? COMBAT_BALANCE.openField.camMinDistance : controls.minDistance;
    const hi = openFieldMode ? COMBAT_BALANCE.openField.camMaxDistance : controls.maxDistance;
    return { cx: _cen.x, cz: _cen.z, dist: THREE.MathUtils.clamp(need, lo, hi) };
  };

  /**
   * ПЛАВНОЕ СЛЕЖЕНИЕ — пять прежних режимов. На открытом поле НЕ ЗОВЁТСЯ вовсе:
   * там камера стоит (см. aimTick). Здесь всё ровно так, как было принято глазами
   * до открытого поля, и трогать это нельзя.
   */
  const frameLiving = (list) => {
    if (!multiBout) return;
    const pose = framePose(list);
    if (!pose) return;
    const k = 0.04;
    // Точка вращения едет к середине живых.
    controls.target.lerp(_want.set(pose.cx, 0.2, pose.cz), k);
    // Удаление подгоняем вдоль ТЕКУЩЕГО направления — угол остаётся игроков.
    const dir = camera.position.clone().sub(controls.target);
    const cur = dir.length();
    if (cur > 1e-3) {
      dir.multiplyScalar(THREE.MathUtils.lerp(cur, pose.dist, k) / cur);
      camera.position.copy(controls.target).add(dir);
    }
  };

  // Развести пересёкшиеся тела — общий проход (scene/boutCore.js). Переехал туда
  // 17.09.2026 вместе с остальной обвязкой боя: мгновенный бой турнира COLLAPSE
  // разводит тела ровно так же, и второй записи этого правила быть не должно.
  //
  // Пара с боссом расходится шире: он крупнее обычного тела и на общем просвете
  // входил бы в соседей. Общий просвет при этом не тронут — на нём стоит бой
  // один на один, и трогать его ради одного режима нельзя.
  const BOSS_GAP = COMBAT_BALANCE.raid.bossBodyGap;
  const gapOf = (a, b) => ((a.isBoss || b.isBoss) ? BOSS_GAP : BODY_GAP);

  // --- КОМУ ПЛАШКА ЗДОРОВЬЯ НА ОТКРЫТОМ ПОЛЕ.
  //
  //     Плашка висит над каждым телом и держит постоянный размер на экране. На
  //     двадцати телах это двадцать плашек разом — они перестают быть показанием
  //     здоровья и превращаются в сетку поверх боя. Разведение по экрану
  //     (hpStagger) тут не спасает: оно разводит то, что показано, а показано
  //     слишком многое.
  //
  //     Правило из ТЗ: свои — всегда; чужой — пока дерётся с нашим; остальные —
  //     скрыты. «Дерётся с нашим» читается в обе стороны: он выбрал нашего целью
  //     ИЛИ наш выбрал его. Одной стороны мало — цель у двоих не обязана быть
  //     взаимной, и половина разменов шла бы с невидимым здоровьем.
  //
  //     А В ДОСМОТРЕ СВОИХ НЕТ — И ПЛАШКИ ПЕРЕХОДЯТ К КОРОНЕ. Правило выше при
  //     пустых своих гасит все двадцать разом, и чужой бой игрок смотрел бы вовсе
  //     без здоровья. Вернуть их всем нельзя: это та самая сетка поверх боя, ради
  //     которой правило и заведено. Корона — единственная сторона, на которую игра
  //     уже указывает лучом, именем и кнопкой наводки, и здоровье показывается ей.
  //
  //     ⚠️ ЗАЩИЩЁННЫЙ ФАЙЛ ПЛАШКИ НЕ ТРОНУТ. Плашка — единственный спрайт среди
  //     прямых детей группы бойца, и гасится снаружи, как это делает дом.
  //     Положение она ставит один раз при сборке, поэтому видимостью можно
  //     распоряжаться со стороны.
  const visiblePlates = (onPlate) => {
    const shown = [];
    const mine = [];
    for (const u of onPlate) if (u.sideId === 'player') mine.push(u);

    // ДОСМОТР: своих на поле не осталось — плашки у стороны, носящей корону.
    //
    // Корону спрашиваем у поля боя: оно одно её считает, и второго расчёта силы
    // сторон в проекте быть не должно. Сменилась — плашки уходят с прежней
    // стороны и встают на новую ТЕМ ЖЕ КАДРОМ: отдельного правила перехода не
    // нужно, видимость и так пересчитывается каждый кадр по текущей короне.
    //
    // Короны ещё нет — не показываем никого. Пусто честнее, чем двадцать плашек
    // «пока не решили».
    if (!mine.length) {
      const crown = field.leaderSide();
      for (const u of onPlate) {
        const want = !!crown && u.sideId === crown;
        const plate = plateOf(u.f.group);
        if (plate) plate.visible = want;
        if (want) shown.push(u);
      }
      return shown;
    }

    for (const u of onPlate) {
      let want = u.sideId === 'player';
      if (!want) {
        // Цель читаем ПОЛЕМ (u.target), а не спрашиваем заново: спросить — значит
        // выбрать цель тому, кто в этом кадре и не думал её выбирать.
        want = !!(u.target && u.target.sideId === 'player');
        if (!want) for (const m of mine) if (m.target === u) { want = true; break; }
      }
      const plate = plateOf(u.f.group);
      if (plate) plate.visible = want;
      if (want) shown.push(u);
    }
    return shown;
  };

  // ОСТАНОВИТЬ БОЙ. Вынесено из endFight, потому что теперь остановок две: конец
  // поля и кнопка «уйти» на полосе досмотра. Второй записи этих пяти строк быть не
  // должно — разойдутся.
  const freezeBout = () => {
    fightActive = false;
    buffEndFight(); // эффекты прекращаются, неиспользованные баффы — обратно в запас
    klichEndFight(); // и кличи: сдвиги манеры прекращаются, заряды не переносятся
    aiPlayer = false;
    aiOpponent = false;
    // Бой кончился — граница уходит вместе с ним. Оставить её значило бы держать
    // на полу правило матча, которого больше нет, под панелью итога.
    fieldBorder?.setVisible(false);
    noteClosingIn(null);
    for (const u of field.living()) u.f.setAI(false); // победители перестают бить → оседают в стойку
    if (DEV_MODE && !showcase) panelVisible.value = true; // bout over → bring the dev panel back
    // Бой кончился, пока камера в полёте: отпускаем её сами. Итог боя игрок
    // должен увидеть обычным кадром, а не с высоты, и жать Esc ради этого
    // не должен.
    freeCam?.release();
    postShowcase('end'); // окно на деке покажет «ЕЩЁ РАЗ»
  };

  const endFight = () => {
    freezeBout();
    if (chainMode) { closeChainRound(); return; }
    if (collapseMode) { closeCollapseWave(); return; }
    // ИТОГ БОЯ. У забега свои панели и свой счёт раундов — там победа означает
    // «идём дальше», а не «бой выигран», поэтому общая панель туда не ходит.
    // Дека тоже мимо: там своя подача, и своё «ЕЩЁ РАЗ» ей даёт окно страницы.
    if (showcase) return;
    // Пауза, как в забеге: без неё панель выскакивает поверх ещё не осевшего боя
    // и читается как случившаяся посреди него.
    if (resultTimer) clearTimeout(resultTimer);
    // Победителя спрашиваем ОДИН раз: два вызова — это два ответа, которые
    // однажды разойдутся.
    const winSide = field.winnerSide();
    const won = winSide === 'player';
    // ОТКРЫТОЕ ПОЛЕ: строки итога собираются СЕЙЧАС, пока поле ещё не разобрано, а
    // не внутри отложенной панели — к её выходу состав уже может пересобраться.
    let ofOver = null;
    if (openFieldMode) {
      // ПОБЕДИТЕЛЬ ПО ИМЕНИ — только когда поле доиграло не в нашу пользу. Свою
      // сторону не называем: на победе заголовок и так говорит VICTORY.
      //
      // Место здесь считается только у победителя; пришли из досмотра — оно уже
      // заморожено в миг гибели своей стороны (см. finishOpenField).
      const winner = (!won && winSide) ? ofLeaderName(winSide) : null;
      finishOpenField(won, openFieldSidesAbove(), winner);
      ofOver = ofResultLines(won);
    }
    resultTimer = setTimeout(() => {
      resultTimer = null;
      // Заголовок общий, строка под ним у рейда своя: он выигран падением босса,
      // а не тем, что своя сторона осталась одна.
      showFightResult(won, raidMode ? 'raid' : null, ofOver);
    }, COMBAT_BALANCE.panelDelaySec * 1000);
  };

  /**
   * СТРОКИ ИТОГА ОТКРЫТОГО ПОЛЯ. Собираются в одном месте, потому что путей к
   * панели теперь три: победа, конец поля после досмотра и уход по кнопке.
   *
   * Победа — общий заголовок VICTORY, место строкой под ним (оно там первое).
   * Поражение — место И ЕСТЬ заголовок: «DEFEAT» на поле из двадцати сторон не
   * говорит ничего, а «PLACE 7 OF 20» говорит всё. Под ним — позывной того, кто
   * поле выиграл; ушёл игрок раньше конца — победителя ещё нет, и строки нет.
   */
  const ofResultLines = (won) => {
    const place = interpolate(t.value.openField.place, {
      n: openFieldState.place.n, of: openFieldState.place.of,
    });
    if (won) return { note: place };
    const w = openFieldState.winnerName;
    return { title: place, note: w ? interpolate(t.value.openField.winner, { name: w }) : '' };
  };

  /**
   * ИГРОК УШЁЛ С ДОСМОТРА. Поле останавливается В ЭТОТ ЖЕ МИГ — ни одного шага боя
   * после нажатия, — и панель выходит СРАЗУ, без паузы.
   *
   * ⚠️ ПАУЗЫ ЗДЕСЬ НЕТ НАМЕРЕННО. Пауза перед панелью существует затем, чтобы
   *    игрок успел увидеть, чем бой кончился. Здесь он не кончился, а прерван по
   *    его же просьбе: ждать нечего, и ожидание читалось бы как залипшая кнопка.
   */
  const leaveSpectate = () => {
    if (!openFieldMode || !ofSpectate || !fightActive) return;
    freezeBout();
    if (resultTimer) { clearTimeout(resultTimer); resultTimer = null; }
    // Место уже заморожено досмотром, победителя нет — поле не доиграло.
    finishOpenField(false, 0, null);
    showFightResult(false, null, ofResultLines(false));
  };

  // ЗАБЕГ: раунд кончился. Своего показа исхода у арены нет — бой просто замирает,
  // — поэтому панель выходит ПОСЛЕ ПАУЗЫ: без неё игрок не успевает увидеть, чем
  // бой кончился, и панель читается как выскочившая посреди боя.
  //
  // Победил игрок или нет, спрашиваем у поля боя: оно и так знает, ничьих в этой
  // игре нет. Здоровье берём у самого бойца — оно уже посчитано боем.
  const closeChainRound = () => {
    if (!chainState.active) return;
    const won = field.winnerSide() === 'player';
    const alive = field.living().find((u) => u.sideId === 'player');
    const hp01 = won && alive ? alive.f.getHp() / alive.f.maxHp : 0;
    if (chainPanelTimer) clearTimeout(chainPanelTimer);
    chainPanelTimer = setTimeout(() => {
      chainPanelTimer = null;
      if (!won) { loseRound(); return; }
      // Имя и ядро следующего соперника нужны панели ДО того, как он выйдет:
      // она про него и рассказывает. Поэтому соперник собирается здесь, а раунд
      // потом просто выводит уже собранного.
      const nextRound = chainState.round + 1;
      const next = nextRound <= ROUNDS ? rollChainFoe(nextRound) : {};
      winRound(hp01, next);
    }, COMBAT_BALANCE.panelDelaySec * 1000);
  };

  // ТУРНИР: волна кончилась. Как и в забеге, своего показа исхода у арены нет —
  // бой просто замирает, — поэтому панель выходит ПОСЛЕ ПАУЗЫ: без неё игрок не
  // успевает увидеть, чем бой кончился.
  //
  // Выиграл игрок или нет, спрашиваем у поля боя: оно и так знает, ничьих в этой
  // игре нет. Здоровье берём у самих бойцов — оно уже посчитано боем. Порядок
  // бойцов на плите тот же, что в составе, поэтому остатки ложатся по местам.
  const closeCollapseWave = () => {
    if (!collapseState.active || collapseState.phase !== 'fight') return;
    const won = field.winnerSide() === 'player';
    // Остаток каждого бойца игрока по порядку. Павший даёт ноль — турнир сам
    // превратит его в добавку, отдельного правила для павшего нет.
    const mine = field.units().filter((u) => u.sideId === 'player');
    const hpLeft = mine.map((u) => (u.dead || !u.f ? 0 : Math.max(0, u.f.getHp())));
    if (collapsePanelTimer) clearTimeout(collapsePanelTimer);
    collapsePanelTimer = setTimeout(() => {
      collapsePanelTimer = null;
      if (!won) { loseWave(); return; }
      // winWave ждёт, пока досчитаются чужие пары: без них неизвестно, кто
      // выйдет следующим. Считать они начали в начале волны, так что ждать
      // почти не приходится.
      winWave(hpLeft).then((goesOn) => { if (goesOn) pullCollapseFoes(); });
    }, COMBAT_BALANCE.panelDelaySec * 1000);
  };

  // Служебная панель и все её показания висят на ПЕРВОМ бойце игрока и ПЕРВОМ
  // чужом. В бою один на один это ровно та же пара, что и раньше, поэтому панель
  // работает как работала; на большем поле она показывает первую пару.
  const refreshDevAliases = () => {
    playerUnit = field.living().find((u) => u.sideId === 'player') || null;
    fighter = playerUnit ? playerUnit.f : null;
    const foeU = field.living().find((u) => u.sideId !== 'player');
    opponent = foeU ? foeU.f : null;
  };

  // --- ВЫХОД НА ПЛИТУ. Одна функция на любого бойца. Раньше их было две,
  //     зеркальные, и каждая ниточка к врагу была написана дважды — на троих
  //     такую запись пришлось бы писать девять раз.
  //
  //     Враг больше не «тот, второй», а ТЕКУЩАЯ ЦЕЛЬ, которую выдаёт поле боя.
  //     В бою один на один цель ровно одна — тот самый единственный второй, —
  //     поэтому пара дерётся в точности как дралась: ни одна ниточка не меняет
  //     смысла, меняется только способ узнать, к кому она ведёт.
  //
  //     Расчёт урона не тронут: onImpact передаёт то же, что передавал.
  const spawnUnit = (spec) => {
    const unit = field.add({ sideId: spec.sideId, isBot: !!spec.isBot, coreId: spec.coreId });
    unit.spec = spec; // служебный респаун пересобирает бойца по этой же записи
    // Цель прямо сейчас. Спрашивается на каждое обращение, поэтому смена цели
    // доходит до тела в тот же кадр.
    unit.f = buildFighter(spec.color, {
      side: spec.side,
      coreId: spec.coreId,
      behavior: spec.behavior,
      // Стартовое здоровье — у бойца игрока в забеге и в турнире (см. spec).
      // В любом другом бою здесь undefined, и боец выходит полным, как выходил.
      startHp: spec.startHp,
      bounds: navBounds,
      neutralColor: neutralColor.value,
      // НИТОЧКИ К ЦЕЛИ — общие (scene/boutCore.js). Раньше они были написаны
      // здесь; переехали 17.09.2026, когда у мгновенного боя турнира COLLAPSE
      // появилась нужда в тех же ниточках. Ни одна из них не изменила смысла:
      // перенос дословный, и бой один на один остался прежним.
      // ОБХОД УКРЫТИЙ идёт сюда же, одной ниточкой: пока дорога к цели перекрыта
      // блоком, бойцу называют её в стороне обхода — но на том же расстоянии. В
      // прочих режимах `steer` нет, и ниточки ровно те, что были.
      ...boutHooks({ field, unit, clocks, steer: coverNav ? coverNav.steer : null }),
      // ДУМАЮЩИЙ МОЗГ — ТОЛЬКО В БОЮ ОДИН НА ОДИН.
      //
      // В паре мозг раздаётся обоим, как раздавался до фундамента: служебный
      // тумблер включал модель И игроку, И сопернику. Первая версия этой строки
      // сажала на спинной мозг любого бота — и соперник в паре молча переставал
      // обращаться к модели: замер показывал «P 4 · O 0» там, где до фундамента
      // было «P 4 · O 4». Бой один на один переставал быть прежним.
      //
      // На большом поле модель выключена у ВСЕХ, включая игрока: иначе потолок
      // обращений за бой рос бы вместе с числом тел. Потолок остаётся прежним —
      // двое по 12, то есть не выше 24 за бой.
      brain: multiBout ? 'spinal' : brainMode.value,
      portrait: spec.portrait,
      requestModelIntention,
      onEliminated: () => {
        scene.remove(unit.f.group);
        unit.f.dispose();
        dropRing(unit);
        coverNav?.forget(unit);   // путь выбывшего больше не нужен
        if (sigCycle) {                       // служебный стенд A/B — перезапуск круга
          field.kill(unit);
          refreshDevAliases();
          if (!sigRestartAt) sigRestartAt = lastFrameT + SIG_RESTART_DELAY;
          return;
        }
        if (fightActive) {                    // настоящий бой: сторона могла кончиться
          field.kill(unit);
          refreshDevAliases();
          // Счётчик сторон наверху экрана. Обновляется на выбывании, а не каждый
          // кадр: меняться ему больше не от чего.
          if (openFieldMode) {
            noteSidesLeft(field.livingSides().length);
            // СВОЯ СТОРОНА ПАЛА — НАЧИНАЕТСЯ ДОСМОТР. Место берётся ЗДЕСЬ, пока
            // поле ещё не разобрано, и дальше не меняется ничем: чужие стороны
            // доигрывают между собой, но все они и так выше нас.
            //
            // ⚠️ ДО `field.isOver()`, А НЕ ПОСЛЕ. Свои могут пасть последними в
            //    матче: тогда в этом же кадре поле кончится, и порядок решает,
            //    успеет ли место заморозиться до панели итога.
            if (!ofSpectate && !field.living().some((u) => u.sideId === 'player')) {
              ofSpectate = true;
              outOfOpenField(openFieldSidesAbove());
            }
          }
          if (field.isOver()) endFight();
          return;
        }
        field.drop(unit);                     // вне боя — служебный респаун тем же составом
        spawnUnit(spec);
        refreshDevAliases();
      },
    });
    // Кольцо: в рейде состав просит его на всю сторону (spec.ringed), в прочих
    // режимах поля `ringed` нет — и остаётся прежнее «свой, не бот».
    const wantRing = spec.ringed !== undefined
      ? spec.ringed
      : (spec.sideId === 'player' && !spec.isBot);
    if (wantRing) unit.ring = makeOwnRing();
    unit.isBoss = !!spec.isBoss;
    unit.f.group.position.set(spec.pos.x, arena.refs.topY, spec.pos.z);
    // БОСС КРУПНЕЕ. Домножаем к масштабу, который боец поставил себе сам при
    // сборке, — абсолютного числа здесь нет намеренно: поменяется масштаб внутри
    // бойца, и босс поедет за ним, а не разъедется с остальными. Всё, что висит
    // на теле, едет вместе с ним: свечение ядра, ореол; плашка здоровья делит
    // свой размер на размер тела и на экране остаётся прежней.
    //
    // ⚠️ Досягаемость удара НЕ растёт — расстояния боя живут в бойце и к размеру
    //    не привязаны. Принято: босс выглядит чуть длиннорукее, чем бьёт.
    if (spec.scale) unit.f.group.scale.multiplyScalar(spec.scale);
    // Подпись плашки: BOSS вместо FOE. Ставится снаружи, после сборки, — боец
    // собран общим сборщиком как обычный чужой, и трогать его файл ради слова
    // нельзя. Цвет и яркость при этом прежние, чужие: второй оттенок на плите
    // читался бы как второй источник света.
    if (spec.isBoss) setPlateVariant(unit.f.group, 'boss');
    unit.f.setReducedMotion(reducedMotion);
    unit.f.setAI(spec.sideId === 'player' ? aiPlayer : aiOpponent); // keep AI on across respawn
    if (lockedIntention.value) unit.f.setIntentionLock(lockedIntention.value);
    if (blockDev.value && spec.sideId === 'player') unit.f.setBlock(true);
    scene.add(unit.f.group);
    return unit;
  };

  // --- СОСТАВ БОЯ. Сколько сторон и сколько бойцов на сторону.
  //
  //     По умолчанию — один на один, ровно как было: сторона игрока и одна чужая,
  //     по бойцу в каждой, на тех же исторических точках. Это не «частный случай
  //     для совместимости», это обычный бой сегодняшней игры.
  //
  //     Служебный признак в адресе (?field=3x3 / 4x1 / 8) поднимает поле больше —
  //     он нужен владельцу, чтобы проверить фундамент на телефоне ДО того, как
  //     появится экран режимов. Игроку он не виден и по ссылке не встречается.
  const HISTORIC_POS = { player: { x: 0.45, z: 1.3 }, foe: { x: -0.65, z: -1.4 } };
  // Радиус кольца выхода открытого поля. Считается один раз: он зависит только от
  // раскладки и от чисел поля, а они за заход на арену не меняются.
  const ofRingR = openFieldMode ? spawnRingRadius(ofLayout) : 0;
  const buildRoster = () => {
    // Бойцов не хватает — на плиту не выходит никто: турнир не начался, и
    // ставить половину стороны значило бы показать бой, которого нет.
    if (collapseShort || openFieldShort) return [];
    const raw = String(route.query.field || '').toLowerCase();
    // сколько сторон и сколько бойцов на сторону
    let sides = 2, per = 1;
    let m = raw.match(/^(\d+)v(\d+)$/) || raw.match(/^(\d+)x(\d+)$/);
    if (m) { sides = 2; per = Math.max(1, Math.min(4, +m[1])); }
    else if (/^4s$/.test(raw)) { sides = 4; per = 1; }
    else if (/^\d+$/.test(raw)) { const n = Math.max(2, Math.min(8, +raw)); sides = 2; per = Math.ceil(n / 2); }
    // Командный бой: столько бойцов на сторону, сколько игрок выбрал в воротах.
    // Служебный признак выше сильнее — им проверяют поле само по себе.
    else if (squadMode) { sides = 2; per = squadFighters.length; }
    // Турнир: столько, сколько просит раскладка. Обе стороны одного размера.
    else if (collapseMode) { sides = 2; per = getLayout(collapseLayout).perSide; }
    // ОТКРЫТОЕ ПОЛЕ: сторон не две, а столько, сколько просит раскладка — двадцать
    // в SOLO, десять в DUO, пять в QUAD. Это первый режим, где сторон больше двух,
    // и общая расстановка по кольцу (spreadPos) с этим справляется: она с самого
    // начала считала стороны по кругу, просто её никто об этом не просил.
    else if (openFieldMode) { sides = ofLayout.sides; per = ofLayout.perSide; }

    // СТОРОНЫ РАЗНОГО РАЗМЕРА. Рейд — первый случай, когда их не поровну: четверо
    // против троих. До него одного числа хватало на обе стороны, поэтому размер
    // стал списком: `perSide[sIdx]`. Во всех прежних режимах список — это одно и
    // то же число дважды, и они не заметили разницы.
    const perSide = raidMode
      ? [1 + COMBAT_BALANCE.raid.allies, 1 + COMBAT_BALANCE.raid.guards]
      : Array.from({ length: sides }, () => per);

    const specs = [];
    const oneOnOne = sides === 2 && perSide[0] === 1 && perSide[1] === 1;
    for (let sIdx = 0; sIdx < sides; sIdx++) {
      const isPlayerSide = sIdx === 0;
      const sideId = isPlayerSide ? 'player' : `foe${sIdx}`;
      const count = perSide[sIdx];
      for (let k = 0; k < count; k++) {
        // ТОЧКИ ВЫХОДА. У турнира они свои и лежат рядом с его раскладками: те
        // же точки спрашивает мгновенный бой чужих пар, и разъехаться им нельзя
        // — иначе бой на экране пошёл бы не с тех позиций, что бой в расчёте.
        // При одном на сторону это ровно исторические точки дуэли.
        const pos = openFieldMode
          ? ofSpawnPos(ofLayout, ofRingR, sIdx, k)
          : collapseMode
          ? collapseSpawnPos(count, isPlayerSide, k)
          : (oneOnOne
            ? (isPlayerSide ? HISTORIC_POS.player : HISTORIC_POS.foe)
            : (raidMode ? raidPos(isPlayerSide, k, count) : spreadPos(sIdx, sides, k, count)));

        // РЕЙД. Сторона игрока — его боец и трое ботов-союзников; внешне бот от
        // игрока не отличается, и кольцо стоит под всеми (решение девятнадцатой
        // записи). Чужая сторона — босс и двое его бойцов; босс идёт ПЕРВЫМ, см.
        // причину у composeRaid.
        if (raidMode) {
          const own = isPlayerSide && k === 0;
          const unit = isPlayerSide
            ? (own ? null : raid.allies[k - 1])
            : (k === 0 ? raid.boss : raid.guards[k - 1]);
          const coreId = own ? playerCoreId : unit.coreId;
          const isBoss = !isPlayerSide && k === 0;
          specs.push({
            sideId,
            isBot: !own,
            isBoss,
            // Кольцо — под ВСЕЙ командой игрока, включая союзных ботов. Кольцо
            // отвечает «где моя команда», а не «где бот»: живой союзник получит
            // то же кольцо, поэтому ботов оно не выдаёт.
            ringed: isPlayerSide,
            // Босс крупнее — домножением к тому масштабу, который боец ставит
            // себе сам. Абсолютного числа размера здесь нет намеренно: подними
            // масштаб внутри бойца, и босс поедет за ним, а не разъедется с ним.
            scale: isBoss ? COMBAT_BALANCE.raid.bossScale : 0,
            coreId,
            side: isPlayerSide ? 'player' : 'opponent',
            color: own ? playerColor : (coreId ? getCore(coreId).hue : pink),
            behavior: own ? behaviorFor('player') : unit.behavior,
            portrait: own ? portraitFor('player') : [],
            pos,
          });
          continue;
        }

        // ОТКРЫТОЕ ПОЛЕ. Сторона игрока — ЕГО бойцы, каждый со своим ядром, своими
        // гранями и своим белым кольцом. Чужие стороны — собранные ботами; внешне
        // бот от игрока не отличается, кольцо стоит только под своими.
        if (openFieldMode) {
          const mine = isPlayerSide ? openFieldRoster[k] : null;
          // Стороны нумеруются с единицы, а в списке чужих лежат с нуля.
          const foeSide = isPlayerSide ? null : openFieldFoes[sIdx - 1];
          const bot = foeSide ? foeSide.roster[k] : null;
          const coreId = mine ? mine.coreId : bot.coreId;
          const core = getCore(coreId);
          specs.push({
            sideId,
            isBot: !isPlayerSide,            // свои — не боты, у каждого кольцо
            coreId,
            side: isPlayerSide ? 'player' : 'opponent',
            // Цвет — от ядра. Первый боец игрока держит выбранный им цвет, как и
            // во всех прочих режимах: это ЕГО боец, а не ещё одно тело на поле.
            color: isPlayerSide && k === 0 ? playerColor : (core ? core.hue : pink),
            behavior: mine ? mine.behavior : bot.behavior,
            portrait: mine ? portraitFor('player') : [],
            pos,
          });
          continue;
        }

        // ТУРНИР. Сторона игрока — его бойцы, каждый со своим ядром, своими
        // гранями и своим белым кольцом. Чужая сторона — сторона из сетки
        // турнира: её собрал collapseRun, здесь её только ставят на плиту.
        //
        // Здоровье несётся между волнами: со второй волны боец выходит с
        // остатком прошлого боя плюс добавка. Считает это турнир, сцена берёт
        // готовое число.
        if (collapseMode) {
          const mine = isPlayerSide ? collapsePlayerRoster[k] : null;
          const foeSide = isPlayerSide ? null : (collapseFoes[k] || null);
          const coreId = mine ? mine.coreId : (foeSide ? foeSide.coreId : playerCoreId);
          const core = getCore(coreId);
          specs.push({
            sideId,
            isBot: !isPlayerSide,            // свои — не боты, у каждого кольцо
            coreId,
            side: isPlayerSide ? 'player' : 'opponent',
            color: isPlayerSide && k === 0 ? playerColor : (core ? core.hue : pink),
            behavior: mine ? mine.behavior : foeSide.behavior,
            startHp: isPlayerSide && collapseStartHp ? collapseStartHp[k] : undefined,
            portrait: mine ? portraitFor('player') : [],
            pos,
          });
          continue;
        }

        // КОМАНДНЫЙ БОЙ. Сторона игрока — ЕГО бойцы, все до одного: каждый со
        // своим ядром, своими гранями и своим белым кольцом. Чужая сторона —
        // столько же ботов, собранных общим сборщиком.
        if (squadMode) {
          const mine = isPlayerSide ? squadFighters[k] : null;
          const foe = isPlayerSide ? null : squadFoes[k];
          const core = mine ? getCore(mine.core) : null;
          specs.push({
            sideId,
            isBot: !isPlayerSide,             // свои — не боты, у каждого кольцо
            coreId: mine ? mine.core : foe.coreId,
            side: isPlayerSide ? 'player' : 'opponent',
            color: mine ? (core ? core.hue : pink) : getCore(foe.coreId).hue,
            behavior: mine ? resolveBehavior(mine.core, collectLit(mine.upgrade)) : foe.behavior,
            portrait: mine ? [core ? `${core.name} — ${core.manner}` : ''] : [],
            pos,
          });
          continue;
        }

        // Сторона игрока: первым идёт сам игрок, остальные — боты-союзники.
        // Чужие стороны — боты целиком. Внешне бот от игрока не отличается.
        const isBot = !(isPlayerSide && k === 0);
        const coreId = isPlayerSide && k === 0
          ? playerCoreId
          : (sIdx === 1 && k === 0 ? opponentCoreId : CORES[Math.floor(Math.random() * CORES.length)].id);
        const own = isPlayerSide && k === 0;
        specs.push({
          sideId, isBot, coreId,
          // Забег: со второго раунда боец игрока выходит с остатком прошлого боя.
          // `undefined` во всех прочих случаях — то есть полное здоровье.
          startHp: own && chainStartHp != null ? chainStartHp : undefined,
          side: isPlayerSide ? 'player' : 'opponent',
          color: own ? playerColor : (coreId ? getCore(coreId).hue : pink),
          behavior: own ? behaviorFor('player')
            : (sIdx === 1 && k === 0 ? behaviorFor('opponent')
              : resolveBehavior(coreId, collectLit(CRYSTALS[coreId]))),
          portrait: own ? portraitFor('player') : portraitFor('opponent'),
          pos,
        });
      }
    }
    return specs;
  };

  // Точки выхода РЕЙДА — две шеренги вдоль плиты, а не дуги вокруг центра.
  //
  // ПОЧЕМУ НЕ ОБЩАЯ РАССТАНОВКА. Общая ставит стороны в две точки круга и
  // разводит бойцов стороны по дуге радиуса 1.08 (плита узкая по глубине). При
  // трёх на сторону дуга занимает 122° и в свои 180° укладывается впритык; при
  // ЧЕТЫРЁХ ей нужно 183° — сторона игрока обошла бы круг и вышла бы в чужую.
  // Плита при этом 6 на 4: по ширине места вдвое больше, чем по глубине, и
  // шеренги ложатся на неё свободно, а бой это не меняет — бойцы всё равно
  // сходятся сами с первой секунды.
  //
  // Шаг между соседями заведомо больше рабочего просвета (spawnGap = 1.15),
  // иначе первый же кадр начинался бы с расталкивания тел.
  const RAID_ROW_Z = 1.15;   // своя шеренга: перед швом со своей стороны
  const RAID_FOE_Z = -1.25;  // чужая шеренга: зеркально, чуть дальше
  const RAID_STEP = 1.2;     // шаг вдоль шеренги
  //
  // БОСС СТОИТ В СЕРЕДИНЕ СВОЕЙ ШЕРЕНГИ, хотя в списке он первый. Это два разных
  // «первым»: в списке — чтобы правила выбора цели брали его (см. composeRaid), а
  // на плите — по центру, потому что рейд читается как «мы вместе против него», и
  // главный с краю читался бы как ещё один охранник. Поэтому у чужой стороны
  // место в шеренге считается не по порядку: первому достаётся середина,
  // остальным — места от краёв внутрь.
  function raidSlot(k, count, bossFirst) {
    if (!bossFirst) return k;
    const mid = Math.floor((count - 1) / 2);
    if (k === 0) return mid;
    const rest = [];
    for (let i = 0; i < count; i++) if (i !== mid) rest.push(i);
    return rest[k - 1];
  }
  function raidPos(isPlayerSide, k, count) {
    const slot = raidSlot(k, count, !isPlayerSide);
    const x = (slot - (count - 1) / 2) * RAID_STEP;
    return {
      x: THREE.MathUtils.clamp(x, -navBounds.x, navBounds.x),
      z: isPlayerSide ? RAID_ROW_Z : RAID_FOE_Z,
    };
  }

  // Точки выхода: стороны по кругу, бойцы стороны — по дуге. Просвет держится
  // заведомо больше рабочего (COMBAT_BALANCE.field.spawnGap), иначе первый же
  // кадр начинался бы с расталкивания тел.
  function spreadPos(sIdx, sides, k, per) {
    const R = Math.min(navBounds.x, navBounds.z) * 0.72;
    const base = (sIdx / sides) * Math.PI * 2;
    const spread = per > 1 ? COMBAT_BALANCE.field.spawnGap / Math.max(R, 0.001) : 0;
    const a = base + (k - (per - 1) / 2) * spread;
    return { x: Math.cos(a) * R, z: Math.sin(a) * R };
  }

  // Убрать с плиты всех — перед новым боем.
  const clearField = () => {
    for (const u of field.units()) {
      dropRing(u);
      if (!u.f) continue;
      scene.remove(u.f.group);
      u.f.dispose();
    }
    field.reset();
    fighter = null;
    opponent = null;
    playerUnit = null;
  };

  // Командный бой: чужую команду собираем ДО первого состава — иначе на плиту
  // выйти будет некому.
  if (squadMode) rollSquadFoes();

  // РЕЙД. То же самое — состав собирается до первого выхода на плиту. Плюс
  // ставится СВОЁ правило конца боя: общее правило «жива ровно одна сторона»
  // рейду не годится в обе стороны сразу.
  //   • Босс пал — рейд взят, даже если охрана ещё на плите. Общее правило в этот
  //     момент сказало бы «бой идёт».
  //   • Пал боец игрока, а союзники живы — бой ПРОДОЛЖАЕТСЯ. Общее правило и тут
  //     согласно (сторона жива), но полагаться на совпадение нельзя: рейд
  //     проигран, только когда команды не осталось совсем.
  // Правило ставится один раз на весь заход на арену и переживает пересборку
  // состава кнопкой «драться снова».
  if (raidMode) {
    rollRaid();
    field.setEndRule((units) => {
      const boss = units.find((u) => u.isBoss);
      if (boss && boss.dead) return 'player';
      if (!units.some((u) => u.sideId === 'player' && !u.dead)) return 'foe1';
      return null;
    });
  }

  // ОТКРЫТОЕ ПОЛЕ: СВОЕГО ПРАВИЛА КОНЦА БОЯ ЗДЕСЬ БОЛЬШЕ НЕТ — И ЭТО ГЛАВНАЯ
  // ПРАВКА РАБОТЫ «ДОСМОТР ПОСЛЕ ГИБЕЛИ».
  //
  // Стояло так: «свои пали — бой кончился», по образцу рейда. Расчёт был на то,
  // что место уже известно и досчитывать нечего. Цена оказалась выше выгоды —
  // примерно в половине заходов игрок видел одну дуэль и вылетал, так и не увидев
  // поля из двадцати бойцов, ради которого режим и делается.
  //
  // Теперь поле живёт по ОБЩЕМУ правилу («жива одна сторона»), как DUEL и SQUAD, а
  // гибель своей стороны перестала быть концом боя и стала отдельным событием:
  // место замораживается в тот же миг (outOfOpenField в обработчике выбывания), а
  // поле доигрывает. Прекращает его либо сам конец поля, либо кнопка «уйти».
  //
  // ⚠️ НЕ ВОЗВРАЩАТЬ setEndRule СЮДА. Оно спрашивается и `isOver`, и `winnerSide`,
  //    то есть любое правило здесь обрывает поле для ВСЕХ, а не только для игрока,
  //    — и досмотр исчезает молча, не оставив ни одной ошибки на экране.

  // СКОЛЬКО СТОРОН ВЫШЕ НАС. Это и есть место минус один (см. placeOnElimination).
  //
  // Считаются не только живые: если в одном кадре пали последние бойцы нескольких
  // сторон, к моменту подсчёта живых у них уже нет, а выше нас они всё равно —
  // те, чей боец погиб ПОЗЖЕ нашего. Порядок выбывания поле боя ведёт само.
  const openFieldSidesAbove = () => {
    const units = field.units();
    const mine = units.filter((u) => u.sideId === 'player');
    // ⚠️ СТОРОНА ПАЛА — ЭТО ГИБЕЛЬ ПОСЛЕДНЕГО ЕЁ БОЙЦА, А НЕ ПЕРВОГО.
    //
    //    Здесь стояла ошибка, которую поймал снимок победы: момент падения брался
    //    как гибель последнего ПАВШЕГО нашего бойца — без проверки, пала ли сторона
    //    вообще. В победной четвёрке кто-то из своих гибнет по ходу боя, а враги
    //    добиваются ПОСЛЕ него, — и каждая чужая сторона засчитывалась выше нашей.
    //    Победителю писалось «Place 5 of 5» вместо первого места.
    //
    //    Жива хоть одна наша — мы не пали вовсе, и выше нас не может быть никого:
    //    бой кончился, значит мы его и выиграли.
    const weFell = mine.length > 0 && mine.every((u) => u.dead);
    const myLast = weFell ? mine.reduce((m, u) => Math.max(m, u.order || 0), 0) : Infinity;

    // Сводим чужие стороны: жива ли и когда пал её последний боец.
    const bySide = new Map();
    for (const u of units) {
      if (u.sideId === 'player') continue;
      const acc = bySide.get(u.sideId) || { alive: false, last: 0 };
      if (u.dead) acc.last = Math.max(acc.last, u.order || 0);
      else acc.alive = true;
      bySide.set(u.sideId, acc);
    }
    let above = 0;
    for (const acc of bySide.values()) {
      if (acc.alive) { above += 1; continue; }   // ещё дерётся — значит выше нас
      if (acc.last > myLast) above += 1;         // пала позже нас — значит выше
    }
    return above;
  };

  // Забег: первого соперника собираем ДО первого состава — иначе на плиту выйдет
  // тот, кого выбрали при открытии страницы, то есть боец без граней и без
  // поправки раунда.
  if (chainMode) rollChainFoe(1);

  // ТУРНИР. Сетка собирается ДО первого состава — иначе на плиту выйти будет
  // некому. Бойцов не хватает — сетку не собираем вовсе: турнир не начался, и
  // отметки «турнир идёт» тоже нет, бросать нечего.
  if (collapseMode) {
    if (collapseShort) {
      shortOfFighters(collapseLayout, collapsePlayerRoster.length);
    } else {
      startCollapse(collapseLayout, collapsePlayerRoster);
      pullCollapseFoes();
      collapseStartHp = playerStartHp();
    }
  }

  // ОТКРЫТОЕ ПОЛЕ. Чужие стороны собираются ДО первого состава — иначе на плиту
  // выйти будет некому. Бойцов не хватает — не собираем вовсе: бой не начался.
  if (openFieldMode) {
    if (openFieldShort) {
      ofShortOfFighters(openFieldLayoutId, openFieldRoster.length);
    } else {
      rollOpenFieldFoes();
      startOpenField(openFieldLayoutId);
    }
  }

  const startRoster = buildRoster();
  multiBout = startRoster.length > 2;
  for (const spec of startRoster) spawnUnit(spec);
  refreshDevAliases();
  load.stage('fighters');

  // БАФФЫ — привязка. На деке их нет: там окно показа, а не игрок с набором.
  if (!showcase) bindBuffArena({ scene, camera, canvas: canvasEl.value, field, reduced: reducedMotion });
  if (!showcase) bindKlichArena({ camera, canvas: canvasEl.value, field }); // кличу сцена не нужна — он ничего в неё не кладёт

  // FIGHT (key F / button): clean re-run — dispose both, respawn fresh at full
  // HP + neutral, then both fight autonomously until one is eliminated.
  runFight = () => {
    cancelSig(); // a normal bout uses core behaviour, not the A/B presets
    if (chainPanelTimer) { clearTimeout(chainPanelTimer); chainPanelTimer = null; }
    if (resultTimer) { clearTimeout(resultTimer); resultTimer = null; }
    hideFightResult(); // новый бой начался — старому итогу на экране не место
    clearField();
    aiPlayer = true;
    aiOpponent = true;
    fightActive = true;
    clocks.startBout(); // arm the stalemate safeguard (gate) — оба отсчёта с нуля
    if (!showcase) buffStartFight(); // новый бой — новый набор баффов у игрока и у бота
    if (!showcase) klichStartFight(); // и новый запас кличей: по три на каждый, только на этот бой
    // ОТСЧЁТ СТОРОН — НА КАЖДЫЙ БОЙ, И ИМЕННО ЗДЕСЬ.
    //
    // ⚠️ Сначала он стоял рядом со сбором новых соперников («драться снова»), и
    //    этого было мало: бой начинается ещё и служебной кнопкой FIGHT, и
    //    клавишей — обе зовут сюда напрямую, мимо того места. После них счётчик
    //    оставался в состоянии «для игрока всё», то есть не показывался вовсе, а
    //    место на панели было от прошлого боя.
    if (openFieldMode && !openFieldShort) startOpenField(openFieldLayoutId);
    // СУЖЕНИЕ — НА КАЖДЫЙ БОЙ С НУЛЯ. «Драться снова» выводит новое поле: блоки,
    // ушедшие в пол в прошлом матче, обязаны стоять, а обход — снова их видеть.
    // Сама граница состояния не держит: она считается от времени боя, а оно уже
    // обнулено выше (clocks.startBout).
    if (shrink) {
      shrink.reset();
      coverMesh?.reset();
      coverNav?.setAlive(covers);
      shrink.takeNavDirty();          // состав уже отдан выше — признак гасим здесь
      fieldBorder?.setVisible(false);
      noteClosingIn(null);
    }
    // Досмотр — за бой, а не за заход на арену: новый бой начинается со своими на
    // поле, и камера снова наводится на них, а не на лидера.
    ofSpectate = false;
    // НОВЫЙ БОЙ — НАВОДКА СРАЗУ, ВСЕГДА. Включая «драться снова»: ручное положение
    // камеры от прошлого боя не переносится, иначе второй бой начинался бы с
    // чужого угла поля. Первый кадр боя ставится мгновенно (см. aimTick).
    aimSnap = true;
    aimT = -1;
    sinceTouch = 0;
    const roster = buildRoster();
    multiBout = roster.length > 2;
    for (const spec of roster) spawnUnit(spec);
    refreshDevAliases();
    panelVisible.value = false; // bout started → hide the dev panel (clean view)
  };

  // ИТОГ БОЯ: отдаём панели способ начать новый бой. Панель про сцену не знает,
  // сцена про кнопки — тоже; знание встречается здесь. В забеге кнопки «драться
  // снова» нет, поэтому и связывать нечего.
  if (!chainMode && !collapseMode && !showcase) {
    unbindFightAgain = bindFightAgain(() => { rollDuelFoe(); runFight(); });
  }

  // ЗАБЕГ: игрок нажал NEXT на панели. Панель живёт снаружи сцены и внутрь не
  // лезет — она только переводит забег на следующий раунд, а сцена замечает смену
  // номера и выводит бойцов. Так панель не знает про Three.js, а сцена — про
  // кнопки.
  //
  // ⚠️ Двойное нажатие: номер раунда меняет chainRun, и второе нажатие приходит
  //    уже вне состояния «между раундами» — номер не двигается, наблюдатель молчит,
  //    раунд не запускается дважды.
  vueWatch(() => chainState.round, (round, prev) => {
    if (!chainMode || !chainState.active || round === prev) return;
    // Стартовое здоровье раунда — доля, посчитанная забегом, в абсолют бойца.
    chainStartHp = Math.round((chainState.hpAfter / 100) * COMBAT_BALANCE.maxHp);
    runFight();
  });

  // ТУРНИР: игрок нажал NEXT на панели. Панель живёт снаружи сцены и внутрь не
  // лезет — она только переводит турнир на следующую волну, а сцена замечает
  // смену номера и выводит бойцов. Так панель не знает про Three.js, а сцена —
  // про кнопки. Тот же шов, что у забега.
  //
  // ⚠️ Двойное нажатие: номер волны двигает collapseRun, и только из состояния
  //    «между волнами». Второе нажатие приходит уже вне его — номер не двигается,
  //    наблюдатель молчит, волна не запускается дважды.
  vueWatch(() => collapseState.wave, (wave, prev) => {
    if (!collapseMode || !collapseState.active || wave === prev) return;
    // Здоровье волны уже посчитано турниром — сцена берёт готовые числа.
    collapseStartHp = playerStartHp();
    runFight();
  });

  // SIG dev bout (SIG FIGHT button): same clean re-run as FIGHT but the two
  // fighters take the chosen LEFT / RIGHT signature presets, and on each KO the
  // bout auto-restarts (sigCycle) at full HP so successive runs can be watched
  // back-to-back. fightActive stays off — sigCycle owns the end-handling
  // (auto-cycle), not the win-and-freeze path.
  runSigFight = () => {
    clearField();
    sigCycle = true;
    fightActive = false;
    sigRestartAt = 0;
    clocks.startBout(); // arm the stalemate safeguard (re-armed each auto-cycle re-run)
    aiPlayer = true;
    aiOpponent = true;
    const roster = buildRoster();
    multiBout = roster.length > 2;
    for (const spec of roster) spawnUnit(spec);
    refreshDevAliases();
    panelVisible.value = false; // bout started → hide the dev panel (clean view)
  };

  // --- Orbit controls — drag to rotate, wheel / pinch zoom; centred, no pan.
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  // СДВИГ ДВУМЯ ПАЛЬЦАМИ — ТОЛЬКО НА БОЛЬШОМ ПОЛЕ. На боевой плите 6 на 4 сдвигать
  // нечего: весь бой и так в кадре, а уехать вбок значило бы потерять его. На поле
  // в шесть десятков единиц это единственный способ посмотреть чужой угол.
  controls.enablePan = openFieldMode;

  // ДАЛЬНИЙ ПРЕДЕЛ СЧИТАЕТСЯ, А НЕ ПИШЕТСЯ ЧИСЛОМ. Он зависит от размера поля И от
  // пропорций экрана: в портрете кадр узкий, и то же поле влезает в него только с
  // гораздо большего отъезда, чем в горизонтали. Число здесь было бы верно ровно
  // для одной ориентации одного телефона.
  //
  // Считается той же формулой, что и кадр по живым: радиус, который должен
  // поместиться, делится на угол обзора по более тесной из двух сторон.
  //
  // ⚠️ РАДИУС — ПО ДИАГОНАЛИ ПЛИТЫ, А НЕ ПО ЕЁ ПОЛОВИНЕ ШИРИНЫ. Плита квадратная, и
  //    камера может стоять к ней под любым углом: с угла она шире себя же в
  //    полтора раза. Первый снимок это и показал — поле обрезалось по краям.
  const ofFitRadius = openFieldMode
    ? (ofRingR + COMBAT_BALANCE.openField.edgeMargin) * Math.SQRT2
      * COMBAT_BALANCE.openField.camFitMargin
    : 0;
  const ofFitDistance = () => {
    const half = THREE.MathUtils.degToRad(camera.fov) / 2;
    return Math.max(ofFitRadius / Math.tan(half), ofFitRadius / (Math.tan(half) * camera.aspect));
  };

  // Коридор удаления. В прежних режимах — как был. На открытом поле он шире
  // ОБОИХ концов: ближе, чтобы рассмотреть замах, и дальше, чтобы увидеть поле
  // целиком. Кадр по живым этим коридором НЕ пользуется — у него свой потолок
  // (см. frameLiving), иначе слежение отъезжало бы до края поля.
  controls.minDistance = openFieldMode ? COMBAT_BALANCE.openField.camMinFree : 6;
  controls.maxDistance = openFieldMode ? ofFitDistance() : 18;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.45; // ~83°, never dip under the slab
  controls.update();

  // СВОБОДНАЯ КАМЕРА. Коробку, за которую её не выпускать, меряем ПОЛЕМ, а не
  // числом: у дуэли плита маленькая, у открытого поля огромная, и одно число на
  // обоих дало бы либо клетку, либо пустоту. Потолок высоты камера считает сама
  // от этой же полуширины и от пропорций кадра.
  //
  // `rest` — РАБОЧЕЕ удаление режима, то, с которого сцена обычно смотрит бой.
  // Оно нужно только возврату по Esc: без него «законной» позой оказывался
  // дальний предел орбиты, а на открытом поле он больше сотни единиц.
  // ⚠️ КАМЕРА ЕСТЬ У КАЖДОГО ИГРОКА, КРОМЕ ВИТРИНЫ. Решение владельца 21.09.2026:
  //    служебный режим снят, клавиатура есть — бери камеру. Хвост ?freecam=1
  //    больше ничего не открывает, он остался только подсказкой (см. метку выше).
  // ⚠️ ВИТРИНА ДЕКИ ИСКЛЮЧЕНА ЯВНО, А НЕ РАСЧЁТОМ НА ТО, ЧТО ОКНО БЕЗ ФОКУСА.
  //    Окно инвестора не берёт ни касаний, ни фокуса — клавиши до него и так не
  //    дойдут. Но «и так не дойдут» — это не условие, а совпадение: поправят
  //    когда-нибудь вёрстку окна, и в витрине заведётся камера, которой там быть
  //    не должно. Поэтому условие названо.
  if (!showcase) {
    freeCam = createFreeCam(camera, controls, renderer.domElement, {
      span: openFieldMode ? ofRingR + COMBAT_BALANCE.openField.edgeMargin : 8,
      rest: openFieldMode ? COMBAT_BALANCE.openField.camMaxDistance : 10,
    });
  }

  if (openFieldMode) {
    // ДАЛЬНЯЯ ПЛОСКОСТЬ ОТСЕЧЕНИЯ — ТОЖЕ ОТ ПОЛЯ, А НЕ ЧИСЛОМ. Арена видит на сто
    // единиц: этого хватало плите 6 на 4 и не хватает полю, отодвинувшись от
    // которого на полторы сотни единиц игрок увидел бы пустоту вместо дальней
    // половины. Считаем: отъезд плюс само поле, с запасом.
    camera.far = ofFitDistance() + ofFitRadius * 2 + 20;
    camera.updateProjectionMatrix();
  }

  // --- КАМЕРА СТОИТ, А НЕ СЛЕДИТ.
  //
  //     Решение владельца после просмотра превью: сама по себе камера не движется.
  //     Где игрок её оставил, там она и стоит — хоть все двадцать тел уйдут за
  //     кромку. Двигают её ровно три вещи, и все три названы: начало боя, кнопка
  //     «показать своих» и тишина в пятнадцать секунд, когда своих в кадре нет.
  //
  //     ⚠️ ЧЕМ ЭТО НЕ ЯВЛЯЕТСЯ. Это не «слежение пореже». Наводка не подправляет
  //        кадр по ходу боя: если свои на экране, она не сработает ни через
  //        пятнадцать секунд, ни через минуту. Она нужна одному случаю — игрок
  //        засмотрелся в чужой угол поля и потерял своих из виду.
  //
  //     ⚠️ ЧЕГО ЗДЕСЬ БОЛЬШЕ НЕТ. Прежняя пара состояний «следит сама / в руках» и
  //        вся оснастка различения жеста от промаха (grab*) выброшены: различать
  //        их было нужно только для того, чтобы придержать слежение. Слежения нет
  //        — нет и различения. Прикосновение теперь одно и то же событие для всех
  //        трёх случаев: останови наводку, начни отсчёт заново.
  const OF = COMBAT_BALANCE.openField;
  const aimFrom = { t: new THREE.Vector3(), d: 0, phi: 0 };

  // РАБОЧИЙ НАКЛОН КАМЕРЫ. Снимается с самой камеры при сборке сцены, а не пишется
  // числом: наклон задан позой камеры выше, и второе его написание разошлось бы с
  // первым при первой же правке позы.
  const _sph = new THREE.Spherical();
  const _off = new THREE.Vector3();
  const _dst = new THREE.Vector3();
  const _camWas = new THREE.Vector3();
  const _tgtWas = new THREE.Vector3();
  const _prj = new THREE.Vector3();
  const _fwd = new THREE.Vector3();
  const workPolar = _sph.setFromVector3(_off.copy(camera.position).sub(controls.target)).phi;

  // ПРИКОСНУЛИСЬ. Наводка обрывается ТАМ ЖЕ, где её застал палец: камеру пишем
  // только внутри наводки, а снявшись, мы её больше не трогаем — она остаётся в
  // последнем своём положении, и дальше ею распоряжается игрок.
  //
  // ⚠️ ПРОМАХ ПАЛЬЦЕМ ТОЖЕ СЧИТАЕТСЯ ПРИКОСНОВЕНИЕМ — и это правильно. ТЗ говорит
  //    «отсчёт от последнего прикосновения», а не «от последнего жеста»: палец на
  //    экране означает, что игрок здесь и смотрит, и дёргать у него кадр не надо.
  controls.addEventListener('start', () => {
    if (!openFieldMode) return;
    gesturing = true; aimT = -1; sinceTouch = 0;
  });
  // Отпустили — отсюда и пошли пятнадцать секунд.
  controls.addEventListener('end', () => {
    if (!openFieldMode) return;
    gesturing = false; sinceTouch = 0;
  });

  // ВЗГЛЯД ТЯНЕТ К СЕРЕДИНЕ ПОЛЯ, ЧЕМ ДАЛЬШЕ ОТЪЕХАЛИ.
  //
  // ЗАЧЕМ. Кадр наводится на СВОЮ сторону, а она стоит у КРАЯ поля. Если оттуда
  // просто отъезжать, поле уезжает вбок и обрезается кромкой экрана — первый
  // снимок дальнего предела показал ровно это. Считать дальний предел «от края
  // поля до дальнего угла» можно, но тогда на дальнем пределе поле занимает треть
  // кадра, а две трети — пустота.
  //
  // Поэтому взгляд едет к середине, и тем сильнее, чем дальше камера. Тяга растёт
  // КВАДРАТОМ: у рабочего удаления её нет вовсе, к дальнему пределу она уверенная.
  //
  // ⚠️ ТЯНЕТ ТОЛЬКО ПОКА КАМЕРА ЕДЕТ ОТ ВВОДА. Отпустил, всё затихло — камера
  //    замерла ровно там, где её оставили: правило «камера не движется сама»
  //    держится. Тяга нужна ВО ВРЕМЯ отъезда, чтобы поле не сползало за кромку, и
  //    ровно тогда она и работает.
  //
  //    ⚠️ СНАЧАЛА ЗДЕСЬ СТОЯЛО «ПОКА ПАЛЕЦ НА ЭКРАНЕ», И ЭТО БЫЛО НЕВЕРНО. Колесо
  //       шлёт «взял» и «отпустил» в ОДНОМ тике — значит по признаку пальца тяга
  //       не срабатывала вообще ни разу, и отъезд колесом уводил поле за кромку
  //       экрана. Снимок дальнего предела это и показал: две трети кадра пустота.
  //       Признак «камера сдвинулась от ввода» ловит и колесо, и палец, и затухание
  //       после него — и при этом остаётся ложным в покое.
  const ofCenterPull = () => {
    const follow = COMBAT_BALANCE.openField.camMaxDistance;
    const far = ofFitDistance();
    const dist = camera.position.distanceTo(controls.target);
    const t01 = THREE.MathUtils.clamp((dist - follow) / Math.max(1, far - follow), 0, 1);
    if (t01 <= 0) return;
    const k = 0.05 * t01 * t01;
    controls.target.x = THREE.MathUtils.lerp(controls.target.x, 0, k);
    controls.target.z = THREE.MathUtils.lerp(controls.target.z, 0, k);
  };

  // ТОЧКА ВЗГЛЯДА НЕ УЕЗЖАЕТ С ПОЛЯ. Сдвиг двумя пальцами ничем не ограничен сам
  // по себе — без этого игрок уводит камеру в пустоту и не находит дороги назад.
  const ofPanBound = openFieldMode ? ofRingR + COMBAT_BALANCE.openField.edgeMargin : 0;
  const clampPan = () => {
    controls.target.x = THREE.MathUtils.clamp(controls.target.x, -ofPanBound, ofPanBound);
    controls.target.z = THREE.MathUtils.clamp(controls.target.z, -ofPanBound, ofPanBound);
  };

  // ТУМАН ЕДЕТ ЗА КАМЕРОЙ — тот же приём, что в воротах арены, и по той же
  // причине. Туман считается в мировых единицах: отодвинули камеру в полтора
  // десятка раз — и всё поле оказалось в молоке, то есть дальний предел показывал
  // бы не поле, а ровную мглу. Число в токенах — плотность ДЛЯ РАБОЧЕГО удаления;
  // отъехали — разрежаем во столько же раз. На слежении отъезд равен единице, и
  // туман остаётся ровно тем, что принят глазами.
  const ofFogBase = openFieldMode ? COMBAT_BALANCE.openField.camMaxDistance : 1;
  const followFog = () => {
    if (!openFieldMode || !scene.fog) return;
    const pull = Math.max(1, camera.position.distanceTo(controls.target) / ofFogBase);
    scene.fog.density = FOG.arena.density / pull;
  };

  // --- НАВОДКА НА СВОЮ СТОРОНУ. Одно движение, три причины его начать.
  //
  //     Азимут НЕ ТРОГАЕТСЯ НИКОГДА. Обойти поле и остаться с той стороны, откуда
  //     смотрел, — это и есть смысл камеры в руках игрока; наводка возвращает
  //     только то, что мешает видеть: куда смотрим, с какого удаления и под каким
  //     наклоном.
  //
  //     ⚠️ НАКЛОН ВОЗВРАЩАЕТСЯ ТОЖЕ, А НЕ ТОЛЬКО УДАЛЕНИЕ. Игрок, заглянувший на
  //        поле сверху вниз, после наводки видел бы своего бойца с макушки, то
  //        есть мельче, чем в турнире QUAD, — а ТЗ требует обратного именно от
  //        кадра ПОСЛЕ наводки. Снимок это в своё время и показал.

  /** Запомнить, откуда едем, и тронуться. Мгновенная наводка — это та же с e=1. */
  const startAim = () => {
    aimFrom.t.copy(controls.target);
    aimFrom.d = camera.position.distanceTo(controls.target);
    _sph.setFromVector3(_off.copy(camera.position).sub(controls.target));
    aimFrom.phi = _sph.phi;
    aimT = 0;
  };

  /**
   * Поставить камеру между «откуда едем» и живой целью, доля пути — e.
   *
   * ⚠️ ЦЕЛЬ ЖИВАЯ, А НЕ ЗАМОРОЖЕННАЯ. Бойцы за полторы секунды успевают уйти, и
   *    наводка, посчитанная один раз на старте, приезжала бы туда, где их уже нет.
   *    Поэтому едем ОТ замороженного начала К пересчитываемой каждый кадр цели:
   *    сходится ровно в срок и приходит туда, где свои сейчас.
   */
  const applyAim = (pose, e) => {
    controls.target.lerpVectors(aimFrom.t, _dst.set(pose.cx, 0.2, pose.cz), e);
    _sph.setFromVector3(_off.copy(camera.position).sub(controls.target));
    _sph.radius = THREE.MathUtils.lerp(aimFrom.d, pose.dist, e);
    _sph.phi = THREE.MathUtils.lerp(aimFrom.phi, workPolar, e);
    camera.position.copy(controls.target).add(_off.setFromSpherical(_sph));
  };

  /**
   * НЕ МЕЛЬЧЕ, ЧЕМ ПОСТАВИЛА БЫ САМА НАВОДКА.
   *
   * ⚠️ СРАВНИВАЕМ С УДАЛЕНИЕМ САМОЙ НАВОДКИ, А НЕ С ЕЁ ПОТОЛКОМ. Сначала здесь
   *    стояло «дальше camMaxDistance — значит мелко», и это оказалось условием,
   *    которого наводка не может выполнить: её собственное удаление в любой
   *    раскладке и при любых пропорциях экрана упирается ровно в этот потолок
   *    (посчитано: 32 и 14.8 против потолка 12). То есть сразу после наводки
   *    условие уже нарушено, и следующая срабатывает через пятнадцать секунд —
   *    и так до конца боя. Получалось «слежение пореже», ровно то, чего быть не
   *    должно.
   *
   *    Правильный вопрос не «далеко ли», а «не дальше ли, чем встала бы наводка».
   *    Отъехал игрок рукой — дальше, наводка нужна; стоит там, куда она его сама
   *    поставила, — не нужна. Слабина (camAimSlack) здесь не ручка настройки, а
   *    допуск на дрожь: камеру каждый кадр подталкивают затухание управления и
   *    зажим сдвига.
   */
  const aimedOutFar = (pose) => camera.position.distanceTo(controls.target) > pose.dist + OF.camAimSlack;

  /** Боец в спокойной середине экрана. */
  const inCalmMiddle = (u) => {
    _prj.copy(u.f.group.position); _prj.y += 1.0;   // корпус, а не пятки
    // За спиной у камеры проекция переворачивается и дала бы ложное «в середине».
    camera.getWorldDirection(_fwd);
    if (_fwd.dot(_off.copy(_prj).sub(camera.position)) <= 0) return false;
    _prj.project(camera);
    return Math.abs(_prj.x) <= OF.camCalmFrac && Math.abs(_prj.y) <= OF.camCalmFrac;
  };

  /**
   * ЛИДЕР В КАДРЕ: лучи над его бойцами, позывной в надписи, уголок на кромке.
   *
   * ⚠️ СЧИТАЕТСЯ ЗДЕСЬ, А НЕ В НАДПИСЯХ. Надписи живут снаружи сцены и камеры не
   *    видят, а вопрос «лидер за кадром или нет» — это вопрос к камере. Наружу
   *    уходит уже готовый ответ: позывной и место уголка в процентах экрана.
   *
   * Уголок ставится по СЕРЕДИНЕ живых бойцов короны, а не по каждому: в QUAD их
   * четверо, и четыре уголка на кромке читались бы как сыпь, а не как указание.
   */
  const noteLeaderFrame = (list, dtSec) => {
    const crown = field.leaderSide();
    leaderBeams.update(crown, list, dtSec);
    if (!crown) { noteLeader(null, false, null); return; }
    let n = 0, sx = 0, sz = 0;
    for (const u of list) { if (u.sideId === crown) { sx += u.f.group.position.x; sz += u.f.group.position.z; n += 1; } }
    if (!n) { noteLeader(null, false, null); return; }
    const mine = crown === 'player';
    _prj.set(sx / n, arena.refs.topY + 1.0, sz / n);
    camera.getWorldDirection(_fwd);
    const behind = _fwd.dot(_off.copy(_prj).sub(camera.position)) <= 0;
    _prj.project(camera);
    // За спиной у камеры проекция переворачивается: берём её наизнанку, иначе
    // уголок показывал бы ровно в противоположную сторону.
    let nx = behind ? -_prj.x : _prj.x;
    let ny = behind ? -_prj.y : _prj.y;
    const out = behind || Math.abs(nx) > 1 || Math.abs(ny) > 1;
    if (!out) { noteLeader(ofLeaderName(crown), mine, null); return; }
    // Прижимаем к кромке по длинной из двух осей — так уголок встаёт на той
    // стороне экрана, куда на самом деле смотреть.
    // Не в саму кромку, а чуть внутрь: уголок ставится по своей середине, и на
    // точной кромке половина значка ушла бы за экран.
    const m = (Math.max(Math.abs(nx), Math.abs(ny)) || 1) / 0.94;
    nx /= m; ny /= m;
    noteLeader(ofLeaderName(crown), mine, {
      x: Math.round((nx * 0.5 + 0.5) * 1000) / 10,
      // В экране ось вниз, в проекции — вверх.
      y: Math.round((0.5 - ny * 0.5) * 1000) / 10,
      angle: Math.round(Math.atan2(-ny, nx) * 180 / Math.PI),
    });
  };

  /**
   * КУДА ВЕДЁТ КНОПКА В ДОСМОТРЕ — на сторону-лидера, то есть на самую сильную
   * живую сторону поля. Своих на поле нет, вести некуда, а лидер — это ровно то
   * место, где поле решается; за ним же тянутся все остальные (он и есть магнит).
   *
   * Корону спрашиваем у поля боя: оно одно её считает, и второго расчёта силы
   * сторон в проекте быть не должно.
   *
   * Короны ещё нет (первые секунды боя) — ведём по всем живым: пусто честнее
   * только тогда, когда вести действительно некуда.
   */
  const spectatePose = (list) => {
    if (!list.length) return null;
    const crown = field.leaderSide();
    const focus = crown ? list.filter((u) => u.sideId === crown) : list;
    return poseFromUnits(focus.length ? focus : list, COMBAT_BALANCE.openField.camEngageRoom);
  };

  /** Раз в кадр — вместо слежения. Открытое поле и только оно. */
  const aimTick = (dtSec, list) => {
    // В ДОСМОТРЕ КАДР СЧИТАЕТСЯ ПО ЛИДЕРУ, А НЕ ПО СВОИМ: своих нет.
    const pose = ofSpectate ? spectatePose(list) : framePose(list);
    // Наводить не на кого — камера стоит.
    if (!pose) { aimT = -1; return; }

    // НАЧАЛО БОЯ — МГНОВЕННО, БЕЗ ПОДЪЕЗДА. Точка вращения стоит в середине поля,
    // а стороны выходят у КРАЯ, за три десятка единиц от неё: плавный подъезд
    // означал бы, что первые секунды матча игрок смотрит в пустой пол. Рывка это
    // не даёт — до первого кадра смотреть всё равно не на что.
    if (aimSnap) {
      aimSnap = false;
      startAim();
      applyAim(pose, 1);
      aimT = -1; sinceTouch = 0;
      return;
    }

    // НАВОДКА ЕДЕТ. Тронулась плавно, встала плавно: рывок на двадцати телах
    // читается как сбой картинки, а не как движение камеры.
    if (aimT >= 0) {
      aimT += dtSec;
      const p = Math.min(1, aimT / OF.camAimSec);
      applyAim(pose, p * p * (3 - 2 * p));
      if (p >= 1) { aimT = -1; sinceTouch = 0; }  // отсчёт — от КОНЦА наводки
      return;
    }

    // ПОКОЙ. Камере здесь делать нечего: она стоит. Считаем тишину.
    if (gesturing) { sinceTouch = 0; return; }
    // ⚠️ В ДОСМОТРЕ НАВОДКИ ПО ТИШИНЕ НЕТ ВОВСЕ. Она заведена под один случай —
    //    «игрок засмотрелся в чужой угол и потерял СВОИХ», — а своих больше нет.
    //    Дёргать за руку кадр у того, кто просто смотрит чужой бой, незачем: за
    //    лидером он идёт сам, кнопкой. Отсчёт тишины при этом держим сброшенным,
    //    чтобы он не накопился и не выстрелил в следующем бою.
    if (ofSpectate) { sinceTouch = 0; return; }
    sinceTouch += dtSec;
    if (sinceTouch < OF.camHoldSec) return;
    sinceTouch = 0;                                 // не сложилось — отсчёт заново
    if (!aimedOutFar(pose) && list.some((u) => u.sideId === 'player' && inCalmMiddle(u))) return;
    startAim();
  };

  // Кнопка «показать своих». Кнопку рисует надпись поверх боя — сцена только
  // отдаёт способ. Едет так же плавно, как наводка по тишине: это одно и то же
  // движение, просто начатое пальцем, а не молчанием.
  if (openFieldMode) {
    unbindCameraReturn = bindCameraReturn(() => { sinceTouch = 0; startAim(); });
    // Кнопка «уйти» на полосе досмотра — тот же шов и та же причина: полоса живёт
    // снаружи сцены и внутрь за боем не лезет.
    unbindSpectateLeave = bindSpectateLeave(leaveSpectate);
  }

  load.stage('controls');

  // --- Render loop. FPS-capped (30 mobile / 60 desktop), elapsed time drives
  //     presence so skipped frames don't desync the breathing.
  clock = new THREE.Clock();
  const interval = 1000 / targetFPS;
  let lastFrame = 0;

  // Счёт кадров для служебной строки. Копится между показами, показывается ~2
  // раза в секунду: чаще — и число не успевает прочитаться, реже — не видно
  // проседаний. Без служебного признака ни одна из этих строк не исполняется.
  let fpsFrames = 0, fpsSince = 0, fpsWorst = 0;

  const loop = (time) => {
    if (time - lastFrame < interval) return;
    const frameMs = lastFrame ? time - lastFrame : 0;
    lastFrame = time;
    const t = clock.getElapsedTime();
    if (DEV_MODE && openFieldMode) {
      fpsFrames += 1;
      if (frameMs > fpsWorst) fpsWorst = frameMs;
      if (!fpsSince) fpsSince = t;
      if (t - fpsSince >= 0.5) {
        const fpsSince0 = fpsSince;
        const fps = Math.round(fpsFrames / (t - fpsSince));
        // Потолок печатается рядом: цикл ограничен (30 на касании, 60 на мыши), и
        // «29» без «/30» читалось бы как поломка.
        // HOLD — тишина перед наводкой; AIM — наводка в пути. Без них проверить
        // «сработала между 15 и 16 секундами» можно только секундомером в руках.
        const cam = aimT >= 0 ? `AIM ${aimT.toFixed(1)}s` : `HOLD ${sinceTouch.toFixed(1)}s`;
        // ЦЕНА ПОИСКА ПУТИ — ОТДЕЛЬНОЙ СТРОКОЙ, как просил владелец: сколько
        // миллисекунд за показ ушло на обход и сколько это было поисков. `lies` —
        // сторож главного правила подмены, он обязан всегда показывать ноль.
        let nav = '';
        if (coverNav) {
          const c = coverNav.takeCost();
          nav = `  ·  NAV ${c.ms.toFixed(1)}ms/${(t - fpsSince0).toFixed(1)}s (${c.n} поисков, обходят ${coverNav.steeringCount()}, ложь вблизи ${c.lies})`;
        }
        fpsReadout.value = `FPS ${fps}/${targetFPS}  ·  worst ${Math.round(fpsWorst)}ms  ·  BODIES ${field.living().length}  ·  ${cam}${nav}`;
        fpsFrames = 0; fpsSince = t; fpsWorst = 0;
      }
    }
    lastFrameT = t; // live loop time — used to schedule the SIG auto-cycle restart
    // ПОЗА КАМЕРЫ НАРУЖУ — ТОЛЬКО ПОД СЛУЖЕБНЫМ ПРИЗНАКОМ. Приёмка требует двух
    // чисел, которых снаружи взять негде: «за тридцать секунд покоя камера не
    // сдвинулась» и «наводка сработала между 15 и 16 секундами». По картинке их не
    // померить — бойцы двигаются и кадр меняется сам. В обычной игре этой строки
    // нет вовсе: DEV_MODE снимается с адреса и в прод не попадает.
    if (DEV_MODE) {
      window.__hexCam = {
        px: camera.position.x, py: camera.position.y, pz: camera.position.z,
        tx: controls.target.x, ty: controls.target.y, tz: controls.target.z,
        hold: sinceTouch, aim: aimT,
      };
    }

    // КАМЕРУ СДВИНУЛ ИГРОК — сравниваем с тем, какой мы её ОСТАВИЛИ в конце
    // прошлого кадра. Всё, что изменилось между кадрами, сделал ввод: свои
    // собственные правки (наводка, тяга, зажим) попали в тот снимок и в разницу
    // не идут.
    //
    // ⚠️ СРАВНИВАТЬ ВОКРУГ `controls.update()` НЕЛЬЗЯ, ХОТЯ ЭТО И НАПРАШИВАЕТСЯ.
    //    Управление камерой применяет колесо СВОИМ вызовом обновления прямо в
    //    обработчике события — к нашему кадру поза уже окончательная, и разница
    //    вокруг нашего вызова выходит нулевой. Замер это и показал: отъезд с 12 до
    //    119 при наибольшей разнице 1.6e-14, то есть тяга к середине не сработала
    //    ни разу и поле уезжало за кромку.
    // СВОБОДНАЯ КАМЕРА ИДЁТ ПЕРВОЙ И, ПОКА ЛЕТИТ, ЗАБИРАЕТ КАДР СЕБЕ. Орбиту в
    // это время не обновляем вовсе: она выправила бы камеру под свой коридор,
    // то есть отняла бы у полёта и высоту, и наклон.
    const flying = freeCam ? freeCam.tick(frameMs / 1000) : false;
    if (freeFlying.value !== flying) freeFlying.value = flying;
    if (!flying) controls.update();
    const inputMoved = !flying && camPrevSet
      && (camera.position.distanceTo(_camWas) > 1e-4 || controls.target.distanceTo(_tgtWas) > 1e-4);
    // Камера: не уехал ли взгляд с поля и туман — за отъездом. Тяга к середине —
    // только пока камера едет от ввода (см. её причину). Всё это — только на
    // открытом поле, в прочих режимах пусто.
    if (openFieldMode) {
      if (inputMoved) ofCenterPull();
      clampPan();
    }
    followFog();
    if (presence) presence.update(t); // на большом поле разлома нет — дышать нечему
    // Обход поля в порядке выхода на плиту: сторона игрока первой, чужие следом —
    // ровно тот порядок, в котором раньше стояли два вызова подряд. Порядок важен:
    // в одном кадре первым разрешается удар того, кто обновился раньше.
    const onPlate = field.living();
    for (const u of onPlate) u.f.update(t, camera);

    // РАСТАЛКИВАНИЕ ТЕЛ. Боец сам держит дистанцию только от СВОЕЙ цели, поэтому
    // на плите с шестью телами остальные прошли бы друг сквозь друга. Этот проход
    // разводит любые две пересёкшиеся пары.
    //
    // При двух телах он НЕ ВЫПОЛНЯЕТСЯ ВОВСЕ: пару и так держит врозь сам боец,
    // и лишний проход означал бы, что бой один на один стал считаться иначе.
    if (onPlate.length > 2) separateBodies(onPlate, navBounds, gapOf);

    // ВЫТОЛКНУТЬ ТЕЛА ИЗ УКРЫТИЙ — сразу после расталкивания и по той же причине,
    // что оно вообще существует: позицию бойцу пишет не только его навигация.
    // Расталкивание и отшат от тяжёлого удара двигают тело мимо неё и могут
    // вдавить его в блок. Приёмка требует нуля тел внутри укрытий, и держит этот
    // ноль именно здесь.
    coverNav?.pushOut(onPlate);

    // ГРАНИЦА ПОЛЯ — ПОСЛЕДНЕЙ ИЗ ВСЕХ, КТО ПИШЕТ ПОЗИЦИЮ. Их четверо: сам боец,
    // расталкивание тел, выталкивание из укрытий и вот это. Правило «наружу не
    // остаёмся» обязано стоять после трёх остальных — иначе любой из них вытолкнул
    // бы тело обратно за границу, и игрок увидел бы бойца снаружи.
    //
    // ⚠️ ГРАНИЦА НЕ РАНИТ. Здесь нет ни строки про урон, и расчёт урона этой
    //    правкой не тронут: тело снаружи получает сдвиг к середине, и только.
    if (shrink && fightActive) {
      const boutT = clocks.elapsed();
      // Один вызов на кадр: он и тела возвращает, и блоки за границей отправляет
      // в пол. До 90-й секунды не делает НИЧЕГО — см. причину в fieldShrink.
      const { radius: R, sink } = shrink.step(onPlate, boutT);
      // Обход перестаёт видеть ушедший блок — иначе бойцы огибали бы призрак.
      //
      // ⚠️ УХОДИТ БЛОК НЕ ОДНИМ МИГОМ. Осуждённый начинает опускаться, но мешать
      //    перестаёт только когда скрылся в полу: что видно глазу, то и не
      //    пускает. Разбор — в шапке fieldShrink.js.
      if (sink.length) coverMesh?.sink(sink);
      if (shrink.takeNavDirty()) coverNav?.setAlive(shrink.liveCovers());
      // Контур появляется вместе с обратным отсчётом: это одно предупреждение.
      fieldBorder.setVisible(shrink.shown(boutT));
      fieldBorder.set(R);
      fieldBorder.tick(t);
      noteClosingIn(shrink.closingIn(boutT));
    }
    // ОПУСКАЮЩИЕСЯ БЛОКИ ДВИГАЮТСЯ И ПОСЛЕ КОНЦА БОЯ — иначе блок, которому
    // осталось полшага, замер бы наполовину в полу под панелью итога. Пусто почти
    // всегда: внутри стоит выход по «никто не опускается».
    coverMesh?.tick(frameMs / 1000);

    // ПЛАШКИ ЗДОРОВЬЯ: развести по экрану (scene/hpStagger.js). Проход по тем же
    // живым телам и с тем же условием «больше двух» — при двух телах он не
    // выполняется вовсе, и бой один на один считается ровно как считался.
    //
    // На открытом поле сперва решаем, КОМУ плашка вообще положена: двадцать
    // плашек разом — это не показание здоровья, а сетка поверх боя.
    const shownPlates = openFieldMode ? visiblePlates(onPlate) : onPlate;
    declutterPlates(shownPlates, camera);
    // КОМУ СЕЙЧАС ВИДНА ПЛАШКА — НАРУЖУ, ТОЛЬКО ПОД СЛУЖЕБНЫМ ПРИЗНАКОМ.
    //
    // Приёмка требует проверить, что при смене короны плашки ушли с прежней
    // стороны и встали на новую. Снаружи это взять негде: плашка живёт внутри
    // сцены, а по картинке принадлежность стороне не померить. Та же причина и
    // тот же признак, что у позы камеры ниже; в обычной игре этой строки нет.
    if (DEV_MODE && openFieldMode) {
      window.__hexPlates = { n: shownPlates.length, sides: [...new Set(shownPlates.map((u) => u.sideId))] };
    }

    // Кольцо едет за своим бойцом; кадр подбирается под живых.
    for (const u of onPlate) {
      if (!u.ring) continue;
      u.ring.position.set(u.f.group.position.x, arena.refs.topY + RING_Y, u.f.group.position.z);
    }
    // ЛИДЕР: лучи над его бойцами и строка поверх боя. Корону считает поле боя,
    // сцена только показывает — и она же одна знает камеру, поэтому уголок «лидер
    // за кадром» считается здесь, а не в надписях.
    if (leaderBeams) noteLeaderFrame(onPlate, frameMs / 1000);
    buffTick(frameMs / 1000, t); // баффы: срок эффектов, лечение, бот, подача, места значков
    klichTick(frameMs / 1000, t); // кличи: срок сдвигов и места значков
    // КАДР. На открытом поле камера СТОИТ и наводится по случаю (aimTick), в пяти
    // прежних режимах — подъезжает к живым каждый кадр, как было принято глазами.
    // ⚠️ ПОКА КАМЕРА В ПОЛЁТЕ, СЛЕЖЕНИЕ МОЛЧИТ — ОБА ЕГО ВИДА. Иначе сцена
    //    тянула бы камеру к бойцам, а игрок от них, и кадр дрожал бы между
    //    двумя хозяевами. Возврат из полёта сам приведёт камеру в законную позу,
    //    а дальше её подхватит это же слежение — то, которое у режима своё.
    if (flying) { /* камерой правит игрок */ }
    else if (openFieldMode) aimTick(frameMs / 1000, onPlate);
    else frameLiving(onPlate);
    // Запомнить, какой мы оставили камеру: со следующим кадром эта поза станет
    // мерой того, сдвинул ли её игрок.
    _camWas.copy(camera.position);
    _tgtWas.copy(controls.target);
    camPrevSet = true;

    // Dev readout (throttled ~5/s) — live stamina + charge of both fighters.
    if (panelVisible.value && t - lastStaReadout > 0.2) {
      lastStaReadout = t;
      const sta = (fr) => (fr ? Math.round(fr.getStamina01() * 100) : '—');
      const chg = (fr) => (fr ? Math.round(fr.getCharge01() * 100) : '—');
      const intn = (fr) => (fr && fr.getIntention ? fr.getIntention().toUpperCase() : '—');
      // Read: perceived foe phase + (если свежо) the last сбив/контра, e.g. "WINDUP!SBIV".
      const rd = (fr) => {
        if (!fr || !fr.getReadPhase) return '—';
        const ph = (fr.getReadPhase() || 'neutral').toUpperCase();
        const act = fr.getReadAction ? fr.getReadAction() : '';
        return act ? `${ph}!${act.toUpperCase()}` : ph;
      };
      staReadout.value = `STA  P ${sta(fighter)}  ·  O ${sta(opponent)}`;
      chgReadout.value = `CHG  P ${chg(fighter)}  ·  O ${chg(opponent)}`;
      intReadout.value = `INT  P ${intn(fighter)}  ·  O ${intn(opponent)}`;
      rdReadout.value = `RD   P ${rd(fighter)}  ·  O ${rd(opponent)}`;
      // Model brain: wakes-per-bout counter (confirm ~5–10, not 80) + last "read".
      if (brainMode.value === 'model') {
        const cnt = (fr) => (fr && fr.getModelRequestCount ? fr.getModelRequestCount() : 0);
        const mrd = (fr) => ((fr && fr.getModelRead && fr.getModelRead()) || '—').slice(0, 18);
        mdlReadout.value = `MDL  P ${cnt(fighter)} "${mrd(fighter)}"  ·  O ${cnt(opponent)} "${mrd(opponent)}"`;
      } else {
        mdlReadout.value = 'MDL  off (spinal)';
      }
      // Накал: % level + live silence (s) since the last clean exchange. Rises in a
      // гляделка past escalateSilenceSec, snaps to 0 on any landed hit.
      if (clocks.armed()) {
        const sil = clocks.silence();
        nkReadout.value = `NK   ${Math.round(escalation01() * 100)}%  sil ${sil.toFixed(1)}s`;
      } else {
        nkReadout.value = 'NK   — (no bout)';
      }
    }

    // SIG A/B auto-cycle — a KO scheduled a restart; fire it (full HP, fresh
    // presets) so consecutive bouts run back-to-back without a reload.
    if (sigCycle && sigRestartAt && t >= sigRestartAt) {
      sigRestartAt = 0;
      runSigFight();
    }

    renderer.render(scene, camera);

    // One settled frame toward readiness — counted only once every stage above is
    // in, and reset by any re-fit (see the resize observer).
    load.frame();

    // Режим показа: бой стартует сам — но только ПОСЛЕ того, как экран загрузки
    // ушёл, иначе первые секунды боя пройдут под ним и зритель их не увидит.
    if (showcase && !showcaseStarted && !loadingState.active) {
      showcaseStarted = true;
      postShowcase('ready');
      runFight();
    }

    // Обычный путь игрока: то же условие готовности, но с паузой, чтобы игрок
    // успел увидеть, кто вышел драться. Флаг ставится СРАЗУ, а не в таймере, —
    // иначе следующие кадры успеют завести ещё один таймер, и бой перезапустится
    // сам собой через полторы секунды после начала.
    if (!showcase && !collapseShort && !autoStarted && !sceneFailed.value && !loadingState.active) {
      autoStarted = true;
      if (sceneTimer) { clearTimeout(sceneTimer); sceneTimer = null; } // успели — сторож больше не нужен
      autoTimer = setTimeout(() => { autoTimer = null; runFight(); }, AUTO_START_MS);
    }
  };
  renderer.setAnimationLoop(loop);

  // --- Pause entirely when the tab is hidden.
  onVisibility = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else renderer.setAnimationLoop(loop);
  };
  document.addEventListener('visibilitychange', onVisibility);

  // --- Dev keys on preview: F = FIGHT · B = block · V = feint · G = stagger ·
  //     C = charge (fill, then discharge). (F is FIGHT, so feint is on V.)
  //
  // ⚠️ ТОЛЬКО В СЛУЖЕБНОМ РЕЖИМЕ. Раньше слушатель вешался всегда, и любой игрок,
  //    нажав F, перезапускал себе бой, а B / V / G / C меняли ход боя на ходу.
  //    Пока клавиатурой пользовался один человек, это никому не мешало; с
  //    21.09.2026 камера есть у всех, игроков к клавишам поощряют — и служебные
  //    клавиши закрыты тем же признаком, что и служебная панель.
  //
  // ⚠️ САМА ЛОГИКА БОЯ НЕ ТРОНУТА. Изменено ровно одно — УСЛОВИЕ, при котором
  //    клавиши слушаются. Те же обработчики остались на кнопках служебной панели,
  //    а она и так живёт по этому же признаку.
  if (DEV_MODE && !showcase) {
    onKeydown = (e) => {
      if (e.key === 'f') onFight();
      else if (e.key === 'b') onBlockToggle();
      else if (e.key === 'v') onDevFeint();
      else if (e.key === 'g') onDevStagger();
      else if (e.key === 'c') onDevCharge();
    };
    window.addEventListener('keydown', onKeydown);
  }

  // --- Responsive to the container box (embedded + resize/rotate).
  resizeObserver = new ResizeObserver(() => {
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (!cw || !ch) return;
    camera.aspect = cw / ch;
    // ПОВОРОТ ТЕЛЕФОНА МЕНЯЕТ ДАЛЬНИЙ ПРЕДЕЛ. Он считается от пропорций экрана: в
    // портрете кадр узкий, и поле влезает в него только с большего отъезда. Не
    // пересчитать — и после поворота предел остался бы от прежней ориентации:
    // в портрете поле не влезло бы, в горизонтали камера уезжала бы вдвое дальше
    // нужного.
    if (openFieldMode) {
      controls.maxDistance = ofFitDistance();
      camera.far = ofFitDistance() + ofFitRadius * 2 + 20;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
    // We just moved the picture under ourselves — start the settled-frame count
    // again, or the screen could lift on a frame that is about to change.
    load?.unsettle();
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => {
  // Первым делом — отложенный запуск боя и сторож сборки. Игрок мог уйти внутри
  // тех полутора секунд; без отмены таймер разбудил бы уже разобранную сцену.
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  if (sceneTimer) { clearTimeout(sceneTimer); sceneTimer = null; }
  if (chainPanelTimer) { clearTimeout(chainPanelTimer); chainPanelTimer = null; } // панель забега — туда же
  if (collapsePanelTimer) { clearTimeout(collapsePanelTimer); collapsePanelTimer = null; } // и панель волны турнира
  if (resultTimer) { clearTimeout(resultTimer); resultTimer = null; }  // и панель итога
  hideFightResult();   // уходим с арены — панель итога уходит с нами
  endOpenField();      // и счётчик сторон открытого поля: считать больше нечего
  coverMesh?.dispose(); coverMesh = null; covers = null; coverNav = null;
  fieldBorder?.dispose(); fieldBorder = null; shrink = null;
  leaderBeams?.dispose(); leaderBeams = null;
  unbindCameraReturn?.(); // и способ вернуть слежение: камеры, которой он владел, больше нет
  unbindSpectateLeave?.(); // и способ уйти с досмотра: боя, который он останавливал, больше нет
  unbindFightAgain?.(); // и способ начать бой: сцены, которая его умеет, больше нет
  unbindBuffArena();   // и баффы: палец ловить нечем, класть предметы некуда
  unbindKlichArena();  // и кличи: палец ловить нечем, кричать некому
  load?.dispose();   // left mid-load → drop the screen and the wait with us
  if (resizeObserver) resizeObserver.disconnect();
  if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
  freeCam?.dispose(); freeCam = null; // и клавиши полёта: зажатых не остаётся
  if (onKeydown) window.removeEventListener('keydown', onKeydown);
  if (renderer) renderer.setAnimationLoop(null);
  if (controls) controls.dispose();
  if (presence) presence.dispose();
  if (fighter) fighter.dispose();
  if (opponent) opponent.dispose();
  if (arena) arena.dispose();
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.arena-wrap {
  position: fixed;
  inset: 0;
  background: var(--scene-backdrop);
}
.arena-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
/* Cheap vignette (no postprocess) — darkens the frame edges. */
.arena-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--scene-vignette);
}
/* Temporary dev stamina readout (preview only). */
.arena-readout {
  position: absolute;
  right: 14px;
  bottom: 44px;
  pointer-events: none;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(8, 10, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  padding: 4px 8px;
}
/* Цена кадра — тот же вид, что у служебного показания рядом, но в СВОБОДНОМ углу.
   ⚠️ Сначала стояла в левом верху и на узком экране НАЕЗЖАЛА на счётчик сторон:
   счётчик стоит по центру сверху, и в портрете 390 точек места им двоим не
   хватает. Снизу слева свободно: справа снизу — служебное показание, справа
   сверху — кнопка DEV, сверху по центру — счётчик.

   ⚠️ ПОДНЯТА НАД ПОЛОСОЙ ДОСМОТРА (работа «досмотр после гибели»). Свои пали —
   снизу во всю ширину встаёт полоса с местом и дверью, и на прежних четырнадцати
   точках служебное число уходило бы под неё ровно тогда, когда оно и нужно:
   цена кадра в досмотре — отдельный пункт приёмки. Постоянный отступ вместо
   условного намеренно — служебная строка и так живёт только в этом режиме и
   только по служебному признаку, а состояние, от которого она зависела бы, — это
   ещё одно место, где однажды заведётся расхождение. */
.arena-fps {
  position: absolute;
  left: 14px;
  bottom: 72px;
  pointer-events: none;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(8, 10, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  padding: 4px 8px;
}
/* МЕТКА СВОБОДНОЙ КАМЕРЫ. Семья та же, что у строки цены кадра: моноширинный,
   мелкий, приглушённый, на тёмной подложке. Своего цвета не берёт — ни розового,
   ни какого-либо акцента: розовый в игре принадлежит главному действию, а это
   служебная метка, которую будут видеть на показе. Угол ПРАВЫЙ ВЕРХНИЙ: левый
   нижний занят ценой кадра, правый нижний — служебными кнопками, а верх в бою
   свободен. */
.arena-freecam {
  position: absolute;
  right: 14px;
  top: 14px;
  pointer-events: none;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.45);
  background: rgba(8, 10, 18, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
}
/* Temporary dev action triggers (preview only). */
.arena-actions {
  position: absolute;
  right: 14px;
  bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 60%;
}
.arena-actions button {
  pointer-events: auto;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.55);
  background: rgba(8, 10, 18, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  padding: 5px 9px;
  cursor: pointer;
}
.arena-actions button:hover {
  color: #fff;
  border-color: var(--pink);
}
.arena-actions button.tgt {
  color: var(--pink);
  border-color: var(--pink);
}
/* Active state for a toggle button (e.g. GRAY: ON). */
.arena-actions button.on {
  color: #fff;
  background: var(--pink);
  border-color: var(--pink);
}
/* Always-on dev-panel show/hide toggle — small, unobtrusive, top-right corner.
   Stays visible during a bout (incl. the SIG auto-cycle) so the panel is always
   recoverable. */
.arena-panel-toggle {
  position: absolute;
  top: 12px;
  right: 14px;
  pointer-events: auto;
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(8, 10, 18, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 4px 7px;
  cursor: pointer;
  opacity: 0.6;
}
.arena-panel-toggle:hover {
  opacity: 1;
  color: #fff;
  border-color: var(--pink);
}
.arena-failed {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  text-align: center;
  background: var(--void);
}
.af-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: var(--t-2xl);
  letter-spacing: var(--ls-title);
  text-transform: uppercase;
  color: var(--ink);
}
.af-note {
  margin: 0;
  max-width: 46ch;
  font-family: var(--font-mono);
  font-size: var(--t-sm);
  line-height: 1.5;
  color: var(--ink-dim);
}
.af-back {
  margin-top: var(--sp-2);
  padding: var(--sp-2) var(--sp-4);
  min-height: 44px;
  font-family: var(--font-mono);
  font-size: var(--t-sm);
  letter-spacing: var(--ls-meta);
  text-transform: uppercase;
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: border-color var(--d-hover) var(--e-settle), color var(--d-hover) var(--e-settle);
}
.af-back:hover { border-color: var(--line-strong); }

.arena-panel-toggle.on {
  color: var(--pink);
  border-color: var(--pink);
  opacity: 0.9;
}
</style>
