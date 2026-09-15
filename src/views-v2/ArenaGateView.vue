<!-- ArenaGateView — /play/gate: ВОРОТА АРЕНЫ, пространство за дверью ARENA.

     Путь целиком, каким он станет: дом → FIGHT → острова режимов → дверь ARENA →
     пролёт камеры внутрь острова → чёрный кадр → экран загрузки → растемнение
     ВМЕСТЕ с подлётом камеры → острова выбора режима → острова выбора бойцов →
     объёмная кнопка старта → арена.

     СЕЙЧАС ЗДЕСЬ ТОЛЬКО ДОРОГА. Островов ещё нет — их ставят следующие работы.
     Проверяется ровно то, ради чего работа сделана: переход плавный, чёрный кадр
     раньше сборки, растемнение и подлёт идут вместе, назад работает.

     ⚠️ ВРЕМЕННАЯ ПЕРЕАДРЕСАЦИЯ. Как только подлёт доехал, игрок уходит на плоский
     выбор состава (/play) — тот самый, что работал до этой работы. Причина: путь
     в бой сегодня один, и он не должен ломаться ни на один мерж. Строка уйдёт
     вместе с появлением островов выбора режима. Чтобы задержаться в пространстве
     и рассмотреть его, к адресу добавляется ?stay=1 — переадресация выключается,
     остаётся ← BACK.

     Хром: та же полоса .hs-strip (home.css), что в зале FORGE и в пространстве,
     без брендового блока — ← BACK слева, SHOP + кабинет справа. Свои значения ей
     не нужны: .hs-chrome читает глобальные токены. Прижать правый кластер всё же
     приходится здесь — полоса разносит края, а слева брендового блока нет. -->
<template>
  <div class="gate-root">
    <ArenaGateScene @arrived="onArrived" />

    <div class="hs-strip">
      <button type="button" class="hs-chrome gate-back" @click="goBack" :aria-label="t.home.back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        <span class="n">{{ t.home.back }}</span>
      </button>
      <div class="hs-cluster">
        <button type="button" class="hs-chrome hs-seg-shop" @click="goShop" :aria-label="t.home.shop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
          <span class="n">{{ t.home.shop }}</span>
        </button>
        <button type="button" class="hs-chrome hs-seg-cab" @click="cabinetOpen = true" :aria-label="t.cabinet.chipOpen">
          <span class="av" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <PlayerCabinet
      :open="cabinetOpen"
      :balance="balance"
      :core-name="coreName"
      :core-sig="coreSig"
      @close="cabinetOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import ArenaGateScene from '@/scene/ArenaGateScene.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import '@/styles/home.css';
import '@/styles/cabinet.css';

const router = useRouter();
const route = useRoute();

const cabinetOpen = ref(false);

// Пока пространство пустое, задерживаться в нём незачем — уводим на рабочий
// выбор состава. `?stay=1` оставляет здесь: это ручка приёмки, не режим игры.
const stay = route.query.stay === '1';

function onArrived() {
  if (stay) return;
  // replace, а не push: пустые ворота не должны оседать в истории браузера —
  // «назад» с выбора состава обязано вести к островам режимов, а не сюда.
  router.replace('/play');
}

function goBack() { router.push('/play/mode'); }
function goShop() { router.push({ path: '/play/home', query: { view: 'shop' } }); }

// Кабинет просит те же три вещи, что и в остальных залах.
const master = computed(() => store.getters['master/getMaster']);
const balance = computed(() => master.value?.userData?.balance ?? 0);
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreName = computed(() => core.value?.name || '');
const coreSig = computed(() => core.value?.sig || '');
</script>

<style scoped>
.gate-root {
  position: absolute; inset: 0; overflow: hidden;
  background: var(--void); color: var(--ink);
  font-family: var(--font-display);
}

/* Брендового блока нет → правый кластер прижимаем сами: .hs-strip разносит
   содержимое по краям, и без левого блока кластер уехал бы в начало. Правка
   локальная — home.css общий и остаётся нетронутым (так же в зале и в
   пространстве). */
.hs-cluster { margin-left: auto; }
</style>
