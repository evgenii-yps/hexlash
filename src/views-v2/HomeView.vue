<!-- HomeView — the player HOME ("дом игрока"). A calm 3D stage (arena slab + the
     player's fighter in idle, no combat rift / opponent / HUD) under a 2D
     navigation layer. Three states: empty (new player) / lived (more decor) /
     arrange (placement UI). Arrange + BUY are visual stubs (no persistence, no
     purchase). The decor shop opens as a view (HomeShop).

     Scope = the shell only. Floor props are a fixed default set per state from
     the design reference, NOT player data. Glow discipline: the only glows are
     the 3D fighter core + the FIGHT button — every other pink mark is matte. -->
<template>
  <div class="home-root">
    <!-- 3D stage (behind the chrome) -->
    <HomeScene
      :core-hue="coreHue"
      :core-id="coreId"
      :placements="placements"
      :arrange="arrange"
      :grid-cells="gridCells"
      :ghost="ghost"
    />

    <!-- Decor shop view replaces the chrome (its own opaque bg covers the stage) -->
    <HomeShop v-if="view === 'shop'" :balance="balance" @back="view = 'home'" />

    <!-- Home / arrange chrome overlay -->
    <div v-else class="hs-overlay">
      <!-- ───────── normal home chrome ───────── -->
      <template v-if="!arrange">
        <!-- top bar intentionally empty on the home: the $HEX balance plaque and
             the personality chip were inert placeholders (no live wallet/account)
             and are deferred to Этап 2. The .hs-top bar itself is not rendered so
             no empty spacer remains. (The shop keeps its own .hs-top.) -->

        <!-- honest SOON stubs -->
        <div class="hs-rail">
          <div class="hs-stub">
            <div class="st-h"><b>Dailies</b><span class="soon">SOON</span></div>
            <div class="st-s">Daily contracts<br>land here.</div>
          </div>
          <div class="hs-stub">
            <div class="st-h"><b>Leaderboard</b><span class="soon">SOON</span></div>
            <div class="st-s">Season 0 ranks<br>open at launch.</div>
          </div>
        </div>

        <!-- bottom dock — one centered row: TRAIN · SHOP · FIGHT · PROFILE · CUSTOMIZE.
             Four uniform matte tiles flank the hero FIGHT (the one pink/glow mark). -->
        <div class="hs-dock">
          <div class="hs-tile" @click="onTrain">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l5-5 4 4 7-8" /><path d="M16 9h4v4" /></svg>
            <div><div class="tl-n">Train</div><div class="tl-s">TUNE FACETS</div></div>
          </div>
          <div class="hs-tile" @click="onShop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
            <div><div class="tl-n">Shop</div><div class="tl-s">DECOR · MORE</div></div>
          </div>

          <div class="hs-fight">
            <button type="button" class="fbtn" @click="onFight"><span>FIGHT</span><span class="arr">→</span></button>
            <div class="fsub">Send your fighter to the arena</div>
          </div>

          <div class="hs-tile" @click="onProfile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
            <div><div class="tl-n">Profile</div><div class="tl-s">WALLET · ACCT</div></div>
          </div>
          <div class="hs-tile" @click="onCustomize">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l8.5 5v10L12 22 3.5 17V7L12 2Z" /><path d="M12 8v8M8 10l8 4M16 10l-8 4" opacity="0.6" /></svg>
            <div><div class="tl-n">Customize</div><div class="tl-s">ARRANGE PROPS</div></div>
          </div>
        </div>
      </template>

      <!-- ───────── arrange mode ───────── -->
      <template v-else>
        <div class="hs-arrtop">
          <div class="hs-arrtit">
            <div class="at-k"><span class="dot" />ARRANGE MODE</div>
            <div class="at-n">PLACING <b>HEX DAIS</b></div>
          </div>
          <div class="hs-arract">
            <button type="button" class="hs-abtn cancel" @click="onArrangeCancel"><span>✕</span><span>Cancel</span></button>
            <button type="button" class="hs-abtn place" @click="onArrangePlace"><span>✓</span><span>Place here</span></button>
          </div>
        </div>

        <div class="hs-tray">
          <div class="hs-tray-h">
            <span class="th">Your props</span>
            <span class="ts">Drag onto a cell · snaps to the floor grid</span>
          </div>
          <div class="hs-tray-row">
            <div v-for="it in trayItems" :key="it.label" class="hs-slot" :class="{ active: it.active, locked: it.locked }">
              <span class="sn">{{ it.label }}</span>
              <span class="cnt">{{ it.cnt }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { getCore } from '@/data/upgradeData.js';
import HomeScene from '@/scene/HomeScene.vue';
import HomeShop from '@/components/home/HomeShop.vue';
import '@/styles/home.css';

const router = useRouter();

// View + state. The home renders a single fixed state (the empty floor — no
// ownership data source yet). arrange / shop are entered from the dock.
const view = ref('home'); // 'home' | 'shop'
const arrange = ref(false);

// Player fighter from the existing pre-fight store. No core picked → default
// fighter (canon pink). Drives the 3D core hue only.
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreHue = computed(() => core.value?.hue || '#FF0069');

const balance = '2,480'; // placeholder $HEX balance (stub — no economy wired); still shown in the shop

// Fixed default floor sets (from the design reference home_screen.jsx). The home
// always renders the `empty` set — a couple of default fixtures so the bare floor
// reads as an inhabitable space, not a void — and the `arrange`-mode set.
const SETS = {
  empty: [
    { kind: 'corePlinth', u: 0.27, v: 0.42 },
    { kind: 'banner', u: 0.75, v: 0.40 },
  ],
  arrange: [
    { kind: 'corePlinth', u: 0.24, v: 0.40 },
    { kind: 'banner', u: 0.80, v: 0.36 },
    { kind: 'crates', u: 0.18, v: 0.66 },
  ],
};
const placements = computed(() => (arrange.value ? SETS.arrange : SETS.empty));

// Arrange snap-grid + ghost (the piece being placed). Visual stub — no save.
const ghost = computed(() => (arrange.value ? { kind: 'dais', u: 0.56, v: 0.70 } : null));
const gridCells = computed(() => {
  if (!arrange.value) return [];
  const cells = [];
  for (const u of [0.2, 0.35, 0.5, 0.65, 0.8]) {
    for (const v of [0.42, 0.56, 0.70, 0.84]) {
      cells.push({ u, v, active: u === 0.5 && v === 0.70 }); // nearest cell to the ghost
    }
  }
  return cells;
});
const trayItems = [
  { label: 'Hex Dais', cnt: '×1', active: true },
  { label: 'Plinth', cnt: '×3' },
  { label: 'Cache', cnt: '×2' },
  { label: 'Banner', cnt: '×1' },
  { label: 'Core Plinth', cnt: '×1' },
  { label: 'Ward Arch', cnt: '×0', locked: true },
];

// --- Dock / nav. FIGHT + TRAIN route to existing screens; the arena/upgrade
//     guards bounce a core-less player to selection (the "no fighter" path).
function onFight() { router.push('/play/arena'); }
function onTrain() { router.push('/play/upgrade'); }
function onShop() { view.value = 'shop'; }
function onCustomize() { arrange.value = true; }
function onProfile() { /* no profile screen in this shell yet — inert */ }

// Arrange — both exit the mode; placement is a visual stub (nothing persists).
function onArrangeCancel() { arrange.value = false; }
function onArrangePlace() { arrange.value = false; }
</script>

<style scoped>
.home-root { position: absolute; inset: 0; overflow: hidden; }
</style>
