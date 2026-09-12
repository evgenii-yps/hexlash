<!-- PveView — the FORGE hall (/play/pve): the 3D hall (PveScene) under its 2D layer.

     ONE panel, always there (ForgePanel): who is selected, his tree, what he is
     built out of, the whole roster as a list, and the way OUT of the hall. It
     replaces what used to float over the scene — a card in one corner and the
     tree pinned to the other edge — and it adds the thing the room was missing
     entirely: you can leave for the arena from here.

     The scene owns the 3D (camera framings, hover light, who stands where); this
     view owns the panel and the decision of who is selected — including the case
     where that fighter is deleted from another tab while he is open.

     LEAVING FOR THE ARENA. The arena's own guard asks `prefight/selectedCoreId`,
     not the roster, so FIGHT hands it the picked fighter's core before it goes.
     Until that wiring is a real "send THIS fighter", the core is what carries.

     Chrome: the shared .hs-strip (home.css) without the brand block — BACK left,
     SHOP + cabinet right. Its tokens are mirrored on the root so the strip is
     portable here without editing home.css. -->
<template>
  <div class="pve-root forge-root" :style="coreVars">
    <PveScene ref="sceneRef" @hover="onHover" @pick="onPick" @exit="exitWork" />

    <!-- hovered fighter's callsign — matte, no glow, follows the body -->
    <div class="fg-tag" :class="{ 'is-on': !!tag }" :style="tagStyle">{{ tag?.callsign }}</div>

    <!-- THE PANEL — always there, in every layout. It used to be two things
         floating over the hall (a card in one corner, the tree pinned to the
         other edge) and it had no way out of the room at all. -->
    <Transition name="fp-fade" appear>
      <ForgePanel
        ref="panelRef"
        :fighters="fighters"
        :picked-id="pickedId"
        :picked="picked"
        :spent="spent"
        :resource="resource"
        :roster-max="rosterMax"
        :is-guest="isGuest"
        :can-fight="canFight"
        :status="status"
        :tree-status="treeStatus"
        :load-step="loadStep"
        :retrying="retrying"
        @pick="onPick"
        @toggle="onToggle"
        @fight="onFight"
        @new-fighter="onNewFighter"
        @retry="onRetry"
      />
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
import ForgePanel from '@/components/forge/ForgePanel.vue';
import '@/styles/home.css';     // the shared .hs-strip chrome
import '@/styles/cabinet.css';  // the PlayerCabinet drawer
import '@/styles/forge.css';    // the hall's own layer

const router = useRouter();
const cabinetOpen = ref(false);
const sceneRef = ref(null);
const panelRef = ref(null);

// ── the roster, and who is being worked on ────────────────────────────────
const fighters = computed(() => store.getters['roster/fighters']);
const pickedId = ref(null);
const picked = computed(() => fighters.value.find((f) => f.id === pickedId.value) || null);
// No stand-in core when nobody is picked: getCore falls back to one of the four,
// and a stand-in colour is a second declaration of a colour that is declared
// once, in tokens.css. With nobody picked the hall simply carries no tint.
const pickedCore = computed(() => (picked.value ? getCore(picked.value.core) : null));
const spent = computed(() => (picked.value ? store.getters['roster/spentOf'](picked.value.id) : 0));
const resource = computed(() => store.getters['roster/resource']);
const rosterMax = computed(() => store.getters['roster/max']);
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
// Picking now comes from two places — a tap on a body in the hall, and a tap on
// a row in the panel's list. Both land here, so the two never disagree.
function onPick(id) {
  pickedId.value = id;
  tag.value = null;
  buildTreeFor(id);
  sceneRef.value?.select(id);
}

// Building his tree is the one step that can fail, so it is the one step with a
// status. Today it is synchronous and always succeeds; the status exists because
// the panel has to be able to SAY it failed, and because the moment the roster
// stops being a per-tab save this is where the wait will appear.
function buildTreeFor(id) {
  treeStatus.value = 'ready';
  try {
    store.dispatch('roster/ensureTree', id);
    const f = fighters.value.find((x) => x.id === id);
    if (!f || !f.upgrade) throw new Error('tree missing after build');
  } catch (_) {
    treeStatus.value = 'error';
  }
}

// RETRY — one in flight at a time: a second tap while the first is still working
// does nothing (there is nothing to race today, and there will be).
function onRetry() {
  if (retrying.value || !pickedId.value) return;
  retrying.value = true;
  try { buildTreeFor(pickedId.value); } finally { retrying.value = false; }
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

// ── what the panel is allowed to say ──────────────────────────────────────
// Three statuses, two seams. `status` is what the HEAD knows about the picked
// fighter; `treeStatus` is what the TREE knows, separately, so a tree that fails
// leaves the rest of the panel working (the hall asks for exactly that).
//
// ⚠️ Today neither can be anything but 'ready' by itself: the roster restores
// from the tab's own storage and the tree is built in the same tick, so there is
// nothing to wait for and nothing that can be half-done. The states are wired
// through, not faked — the day the roster comes off a server, this is the seam
// that carries the wait and the failure.
const status = ref('ready');
const treeStatus = ref('ready');
const loadStep = ref(null);      // { n, total } for the honest loading line
const retrying = ref(false);

// ── leaving for the arena ─────────────────────────────────────────────────
// The arena guard (requireCore in the router) asks `prefight/selectedCoreId`.
// Without a picked fighter there is nothing to hand it, and that — not a grey
// rectangle — is what the button's reason line says.
const canFight = computed(() => status.value === 'ready' && !!picked.value);
function onFight() {
  if (!canFight.value) return;
  store.dispatch('prefight/selectCore', picked.value.core);
  router.push('/play/arena');
}

// The roster is empty and the player is standing in an empty hall: give them the
// one move that opens it. Same call the DEV console makes.
function onNewFighter() {
  const f = store.dispatch('roster/recruit', null);
  Promise.resolve(f).then((made) => { if (made && made.id) onPick(made.id); });
}

// Deleted from somewhere else (the DEV console in another tab) while he is
// open → fall back to the overview instead of showing a card for nobody.
watch(fighters, (list) => {
  if (pickedId.value && !list.some((f) => f.id === pickedId.value)) exitWork();
});

// Esc walks back: first up the tree, then out of the work state.
function onKeydown(e) {
  if (e.key !== 'Escape' || !pickedId.value) return;
  e.preventDefault();
  if (panelRef.value?.stepBack()) return;
  exitWork();
}
// ── the hall opens with somebody already picked ───────────────────────────
// Walking in used to give a dark room with nothing lit: both of the screen's
// glows belong to a selection, and there was no selection, so the first thing
// the player saw said nothing about where to press. The first fighter of the
// roster — first in the same order the panel lists them — is picked for him.
//
// Only when there is NO selection. A choice already made in this visit wins; so
// would one that survived a reload, if anything survived a reload (see below).
// This is a selection and nothing else: no resource is spent, no facet is lit,
// nothing is written that picking by hand would not write.
//
// ⚠️ Today it always fires. `pickedId` is plain component state and this route
// has no keep-alive, so leaving the hall and coming back — or reloading — starts
// it at null every time. Nothing about the selection is saved, and this work is
// explicitly not allowed to start saving it.
function autoPick() {
  if (pickedId.value) return;              // a choice already exists — leave it alone
  const first = fighters.value[0];
  if (!first) return;                      // empty roster: the panel says so, the hall stays empty
  onPick(first.id);
}
onMounted(autoPick);

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
