<!-- PveView — the FORGE hall (/play/pve): the 3D hall (PveScene) under its 2D layer.

     Two states, one screen. OVERVIEW: the roster stands facing the player, and the
     only thing on top of the scene is the hovered fighter's callsign. WORK: one
     fighter is picked — his card sits bottom-left (the body itself stays visible
     above it, lit, while the rest sink into the dark) and HIS upgrade tree takes
     the right side. The tree is the one that used to live on the pre-fight upgrade
     screen; each fighter has his own, stored inside his roster record.

     The scene owns the 3D (camera framings, hover light, who stands where); this
     view owns the panels and the decision of who is selected — including the case
     where that fighter is deleted from another tab while his card is open.

     Chrome: the shared .hs-strip (home.css) without the brand block — BACK left,
     SHOP + cabinet right. Its tokens are mirrored on the root so the strip is
     portable here without editing home.css. -->
<template>
  <div class="pve-root forge-root" :style="coreVars">
    <PveScene ref="sceneRef" @hover="onHover" @pick="onPick" @exit="exitWork" />

    <!-- hovered fighter's callsign — matte, no glow, follows the body -->
    <div class="fg-tag" :class="{ 'is-on': !!tag }" :style="tagStyle">{{ tag?.callsign }}</div>

    <!-- nothing to work with yet — say so, in the service tone -->
    <p v-if="!fighters.length" class="fg-empty">{{ t.forge.empty }}</p>

    <!-- WORK: the picked fighter's card (left) and his tree (right) -->
    <Transition name="fg-fade">
      <aside v-if="picked" class="fg-card">
        <button type="button" class="close" :aria-label="t.forge.close" @click="exitWork">✕</button>
        <div class="cs">{{ picked.callsign }}</div>
        <div class="core"><span class="sw" aria-hidden="true"></span>{{ pickedCore.name }}</div>
        <div class="rows">
          <div class="row"><span>{{ t.forge.fights }}</span><span class="none">{{ t.forge.noFights }}</span></div>
        </div>
      </aside>
    </Transition>

    <Transition name="fg-fade">
      <section v-if="picked" class="fg-tree">
        <ForgeTree
          ref="treeRef"
          :core-id="picked.core"
          :tree="picked.upgrade || []"
          :spent="spent"
          :resource="resource"
          @toggle="onToggle"
        />
        <p v-if="isGuest" class="fg-guest">{{ t.forge.guestNote }}</p>
      </section>
    </Transition>

    <!-- shared chrome (brand removed on PVE): ← BACK left, SHOP + cabinet right -->
    <div class="hs-strip">
      <!-- BACK (left) — matte-chrome family member, arrow glyph + label → /play/mode -->
      <button type="button" class="hs-chrome pve-back" @click="goMode" :aria-label="t.home.back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        <span class="n">{{ t.home.back }}</span>
      </button>
      <div class="hs-cluster">
        <!-- SHOP — bag glyph + single label; keeps its current target (→ /play/home) -->
        <button type="button" class="hs-chrome hs-seg-shop" @click="goShop" :aria-label="t.home.shop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
          <span class="n">{{ t.home.shop }}</span>
        </button>
        <!-- cabinet — chrome diamond avatar only (no handle/role text, no chevron) -->
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import PveScene from '@/scene/PveScene.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import ForgeTree from '@/components/forge/ForgeTree.vue';
import '@/styles/home.css';     // the shared .hs-strip chrome
import '@/styles/cabinet.css';  // the PlayerCabinet drawer
import '@/styles/forge.css';    // the hall's own layer

const router = useRouter();
const cabinetOpen = ref(false);
const sceneRef = ref(null);
const treeRef = ref(null);

// ── the roster, and who is being worked on ────────────────────────────────
const fighters = computed(() => store.getters['roster/fighters']);
const pickedId = ref(null);
const picked = computed(() => fighters.value.find((f) => f.id === pickedId.value) || null);
const pickedCore = computed(() => (picked.value ? getCore(picked.value.core) : getCore(null)));
const spent = computed(() => (picked.value ? store.getters['roster/spentOf'](picked.value.id) : 0));
const resource = computed(() => store.getters['roster/resource']);
// The hall is tinted by the picked fighter's own core (and by nothing at rest).
const coreVars = computed(() => (picked.value
  ? { '--core': pickedCore.value.hue, '--core-sup': pickedCore.value.sup }
  : {}));

// The guest honesty line moved here with the tree — this is where the work that
// would be lost now happens.
const isGuest = computed(() => !store.getters['master/getLoginState']?.isAuthenticated);

// ── hover tag ──────────────────────────────────────────────────────────────
const tag = ref(null);
const tagStyle = computed(() => (tag.value ? { left: tag.value.x + 'px', top: (tag.value.y - 34) + 'px' } : {}));
function onHover(payload) { tag.value = payload; }

// ── picking ────────────────────────────────────────────────────────────────
function onPick(id) {
  pickedId.value = id;
  store.dispatch('roster/ensureTree', id);      // his tree, built from HIS core
  tag.value = null;
  sceneRef.value?.select(id);
}
function exitWork() {
  pickedId.value = null;
  tag.value = null;
  sceneRef.value?.exitWork();
}
function onToggle({ crystalId, faceId }) {
  if (!picked.value) return;
  store.dispatch('roster/toggleFacet', { id: picked.value.id, crystalId, faceId });
}

// Deleted from somewhere else (the DEV console in another tab) while his card is
// open → fall back to the overview instead of showing a card for nobody.
watch(fighters, (list) => {
  if (pickedId.value && !list.some((f) => f.id === pickedId.value)) exitWork();
});

// Esc walks back: first up the tree, then out of the work state.
function onKeydown(e) {
  if (e.key !== 'Escape' || !pickedId.value) return;
  e.preventDefault();
  if (treeRef.value?.stepBack()) return;
  exitWork();
}
onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

// Cabinet card data (mirrors HomeView / Mode Select): default until a core is picked.
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreName = computed(() => core.value?.name || 'ONSLAUGHT');
const coreSig = computed(() => core.value?.sig || 'PRESSURE');
const balance = '2,480';

function goHome() { router.push('/play/home'); }
// Кнопка SHOP в полосе зала вела на /play/home — то есть просто домой, мимо
// магазина, хотя подписана «SHOP». Магазин живёт состоянием дома, поэтому
// ведём туда адресом (см. setView в HomeView).
function goShop() { router.push({ path: '/play/home', query: { view: 'shop' } }); }
function goMode() { router.push('/play/mode'); }
</script>

<style scoped>
/* Раньше здесь лежала КОПИЯ палитры home.css: полоса .hs-strip была написана
   под локальные имена .home-root, и чтобы она работала на этом маршруте, имена
   приходилось повторять. Теперь .hs-chrome читает глобальные токены напрямую,
   и копия не нужна — осталась только геометрия экрана. */
.pve-root {
  position: absolute; inset: 0; overflow: hidden;
  background: var(--void); color: var(--ink);
  font-family: var(--font-display);
}

/* brand removed on PVE → the strip carries BACK (left) + the SHOP/cabinet cluster
   (right). .hs-strip is justify-content:space-between; pin the cluster to the right
   edge here (scoped to PVE — home.css stays shared/untouched). BACK + SHOP + cabinet
   are all .hs-chrome family members (see template), so they need no styling here. */
.hs-cluster { margin-left: auto; }
</style>
