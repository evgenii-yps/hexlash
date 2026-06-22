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
      <div class="hs-bracket tl" /><div class="hs-bracket tr" />
      <div class="hs-bracket bl" /><div class="hs-bracket br" />

      <!-- fighter nameplate — "this is MY fighter" (callsign ≠ core name) -->
      <div class="hs-plate" :class="{ linkable: !coreName }" :style="{ left: '50%', top: '300px' }">
        <div class="pn">{{ callsign }}</div>
        <div class="pm" v-if="coreName">
          <span class="ln" /><span>NÆ-04</span><i>◆</i><span>{{ coreName }} CORE</span><span class="ln" />
        </div>
        <div class="pm" v-else @click="goSelectCore">
          <span class="ln" /><span>NO CORE</span><i>◆</i><span class="core-sel">SELECT YOUR CORE</span><span class="ln" />
        </div>
      </div>

      <!-- ───────── normal home chrome ───────── -->
      <template v-if="!arrange">
        <div class="hs-top">
          <div class="hs-brand">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <polygon points="24,3 41.5,13 41.5,35 24,45 6.5,35 6.5,13" fill="none" stroke="currentColor" stroke-width="2.4" />
              <polygon points="24,13 33,18.5 33,29.5 24,35 15,29.5 15,18.5" fill="none" stroke="currentColor" stroke-width="2.4" />
              <path d="M24 13 L24 24 M24 24 L33 18.5 M24 24 L15 29.5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" />
            </svg>
            <span class="wm">HEXLASH</span>
            <span class="season">SEASON 0</span>
          </div>
          <div class="hs-topr">
            <div class="hs-bal"><span class="dia" /><b>{{ balance }}</b>&nbsp;<i>$HEX</i></div>
            <div class="hs-prof" @click="onProfile">
              <span class="hand">{{ handle }}</span>
              <span class="av"><span /></span>
            </div>
          </div>
        </div>

        <!-- bind-account ribbon — lead with the benefit; wallet/email is secondary fine print -->
        <div v-if="unbound" class="hs-bind">
          <span class="dot" />
          <span>Save your progress — <a @click="onLinkAccount">link an account</a> so you don't lose your fighter &amp; space</span>
          <span class="wallet-note">wallet or email</span>
          <span class="x" @click="bindDismissed = true">✕</span>
        </div>

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

        <!-- empty-state "make it yours" hook -->
        <div v-if="homeState === 'empty'" class="hs-hook" :style="{ right: '300px', top: '372px' }">
          <div class="hh">Your space.</div>
          <div class="hsx">A bare floor, a fighter, a core. Drop in props and make it yours →</div>
        </div>

        <!-- bottom dock -->
        <div class="hs-dock">
          <div class="hs-navset">
            <div class="hs-tile" @click="onTrain">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18l5-5 4 4 7-8" /><path d="M16 9h4v4" /></svg>
              <div><div class="tl-n">Train</div><div class="tl-s">TUNE FACETS</div></div>
            </div>
            <div class="hs-tile" @click="onShop">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
              <div><div class="tl-n">Shop</div><div class="tl-s">DECOR · MORE</div></div>
            </div>
            <div class="hs-tile" @click="onProfile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
              <div><div class="tl-n">Profile</div><div class="tl-s">WALLET · ACCT</div></div>
            </div>
          </div>

          <div class="hs-fight">
            <button type="button" class="fbtn" @click="onFight"><span>FIGHT</span><span class="arr">→</span></button>
            <div class="fsub">Send your fighter to the arena</div>
          </div>

          <div class="hs-custom" @click="onCustomize">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l8.5 5v10L12 22 3.5 17V7L12 2Z" /><path d="M12 8v8M8 10l8 4M16 10l-8 4" opacity="0.6" /></svg>
            <div><div class="cu-n">Customize<br>Space</div><div class="cu-s">ARRANGE PROPS</div></div>
          </div>
        </div>

        <!-- dev-only state preview (empty/lived have no data source yet) -->
        <div class="hs-statedev">
          <button type="button" :class="{ on: homeState === 'empty' }" @click="homeState = 'empty'">EMPTY</button>
          <button type="button" :class="{ on: homeState === 'lived' }" @click="homeState = 'lived'">LIVED</button>
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

// View + state. homeState (empty/lived) has no data source yet → defaults empty,
// flipped by the dev preview buttons. arrange / shop are entered from the dock.
const view = ref('home'); // 'home' | 'shop'
const homeState = ref('empty'); // 'empty' | 'lived'
const arrange = ref(false);
const bindDismissed = ref(false);

// Player fighter from the existing pre-fight store. No core picked → default
// fighter (canon pink) + a "select your core" path on the nameplate.
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreHue = computed(() => core.value?.hue || '#FF0069');
const coreName = computed(() => core.value?.name || null); // ONSLAUGHT / RAIDER / BULWARK / AMBUSH

// Callsign is a free name, deliberately NOT a core name. Placeholder for the shell.
const callsign = 'GHOST';
const handle = 'GHOST_0xA4'; // placeholder profile handle
const balance = '2,480'; // placeholder $HEX balance (stub — no economy wired)

// New player hasn't linked an account yet (no auth state in this shell).
const unbound = computed(() => homeState.value === 'empty' && !bindDismissed.value);

// Fixed default floor sets per state (from the design reference home_screen.jsx).
const SETS = {
  empty: [
    { kind: 'corePlinth', u: 0.27, v: 0.42 },
    { kind: 'banner', u: 0.75, v: 0.40 },
  ],
  lived: [
    { kind: 'corePlinth', u: 0.23, v: 0.40 },
    { kind: 'banner', u: 0.81, v: 0.36 },
    { kind: 'crates', u: 0.17, v: 0.66 },
    { kind: 'arch', u: 0.84, v: 0.64 },
    { kind: 'plinth', u: 0.67, v: 0.50 },
    { kind: 'dais', u: 0.50, v: 0.84 },
  ],
  arrange: [
    { kind: 'corePlinth', u: 0.24, v: 0.40 },
    { kind: 'banner', u: 0.80, v: 0.36 },
    { kind: 'crates', u: 0.18, v: 0.66 },
  ],
};
const placements = computed(() => (arrange.value ? SETS.arrange : SETS[homeState.value]));

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
function onLinkAccount() { /* account linking has no screen yet — stub */ }
function goSelectCore() { router.push('/play'); }

// Arrange — both exit the mode; placement is a visual stub (nothing persists).
function onArrangeCancel() { arrange.value = false; }
function onArrangePlace() { arrange.value = false; }
</script>

<style scoped>
.home-root { position: absolute; inset: 0; overflow: hidden; }
</style>
