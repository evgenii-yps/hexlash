<!-- HomeView — the player HOME ("дом игрока"). A calm 3D stage (arena slab + the
     player's fighter in idle, no combat rift / opponent / HUD) under a 2D
     navigation layer. Three states: empty (new player) / lived (more decor) /
     arrange (placement UI). Arrange + BUY are visual stubs (no persistence, no
     purchase). The decor shop opens as a view (HomeShop).

     Scope = the shell only. Floor props are a fixed default set per state from
     the design reference, NOT player data. Glow discipline: the only glows are
     the 3D fighter core + the FIGHT button — every other pink mark is matte. -->
<template>
  <div class="home-root" :class="{ 'hs-anim-in': introPlaying }">
    <!-- 3D stage (behind the chrome) -->
    <HomeScene
      :core-hue="coreHue"
      :core-id="coreId"
      :placements="placements"
      :arrange="arrange"
      :grid-cells="gridCells"
      :ghost="ghost"
    />

    <!-- ───────── persistent top strip ─────────
         Constant across the home AND the shop: brand-block (left) + one connected
         cluster (right) fusing the SHOP entry + the cabinet entry. NO $HEX here
         (balance lives in the cabinet / shop). Hidden only in arrange mode, which
         brings its own focused top bar. Styles: .hs-strip in home.css. -->
    <div v-if="!arrange" class="hs-strip">
      <button type="button" class="hs-brandblock" @click="onBrand" :aria-label="`${t.home.brand} — home`">
        <LogoMark /><span class="wm">{{ t.home.brand }}</span>
      </button>
      <div class="hs-cluster">
        <button type="button" class="seg hs-seg-shop" :class="{ active: view === 'shop' }" @click="onShop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
          <span class="txt"><span class="n">{{ t.home.shop }}</span><span class="s">{{ t.home.shopSub }}</span></span>
        </button>
        <button type="button" class="seg hs-seg-cab" @click="cabinetOpen = true">
          <span class="av"><span /></span>
          <span class="txt"><span class="hand">{{ t.cabinet.chipHandle }}</span><span class="sub">{{ t.cabinet.chipOpen }}</span></span>
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
    </div>

    <!-- surface under the strip: home chrome OR the shop, cross-faded (fade+scale) -->
    <Transition name="hs-view" mode="out-in">
      <!-- Decor shop view replaces the chrome (its own opaque bg covers the stage) -->
      <HomeShop v-if="view === 'shop'" key="shop" :balance="balance" @back="view = 'home'" />

      <!-- Home / arrange chrome overlay -->
      <div v-else key="home" class="hs-overlay">
      <!-- ───────── normal home chrome ───────── -->
      <template v-if="!arrange">
        <!-- bottom dock — FIGHT alone, centred: a physical plinth (the ONE pink +
             the ONE glow on the screen). Three stacked layers: f-bloom = the soft
             radial glow (only glow), f-plinth = the dark cabinet offset downward
             (the slab's thickness), f-face = the lit hex face (gradient + top blik
             + bottom inner shadow) carrying the label, arrow and a slow rare sheen.
             TRAIN removed (route kept for later); decor arrange moved to EDIT SPACE. -->
        <div class="hs-dock">
          <div class="hs-fight">
            <button type="button" class="fbtn" @click="onFight" :aria-label="t.home.fight">
              <span class="f-bloom" aria-hidden="true" />
              <span class="f-plinth" aria-hidden="true" />
              <span class="f-face">
                <span class="f-sheen" aria-hidden="true" />
                <span class="f-label">{{ t.home.fight }}</span>
                <span class="f-arr" aria-hidden="true">→</span>
              </span>
            </button>
            <div class="fsub">{{ t.home.fightSub }}</div>
          </div>
        </div>

        <!-- EDIT SPACE — home-only corner button → the SAME decor arrange mode the
             old CUSTOMIZE tile opened (reuses onCustomize). Matte chrome material
             (.chrome: glass + hairline frame + bottom-right bevel), no pink / no
             glow (those stay on FIGHT). Own scoped class, never the shared .hs-*
             top strip; not shown in the shop or during arrange. -->
        <button type="button" class="edit-space chrome" @click="onCustomize" :aria-label="t.home.editSpace">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
          <span>{{ t.home.editSpace }}</span>
        </button>
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
    </Transition>

    <!-- Fighter identity "by approach": a 2D label anchored over the walking fighter
         that surfaces when the player zooms the camera IN and fades when they zoom
         out (HomeScene projects the head position + sets the show flag with
         hysteresis; homeFighterTag carries it). Sharp DOM (not a 3D sprite) so the
         text stays crisp. Core identity only — the callsign is account-gated and
         parked to Этап 2, NOT invented here. Own scoped styles, never the shared
         .hs-* chrome. Shown on the home surface only (not shop / arrange). -->
    <div
      v-if="view === 'home' && !arrange"
      class="fighter-tag"
      :style="{ transform: `translate3d(${homeFighterTag.x}px, ${homeFighterTag.y}px, 0)` }"
      aria-hidden="true"
    >
      <div class="ft-card" :class="{ 'is-shown': homeFighterTag.near }">
        <span class="ft-marker" :style="{ background: coreHue }" />
        <span class="ft-txt">
          <span class="ft-name">{{ coreName }}</span>
          <span class="ft-sig">{{ coreSig }} {{ t.cabinet.coreSuffix }}</span>
          <!-- callsign (account-gated, parked to Этап 2) plugs in above ft-name here -->
        </span>
      </div>
    </div>

    <!-- Player Cabinet — sliding panel that slides in from the RIGHT (the same edge
         the strip's cabinet entry sits on). Always mounted so it opens over the home
         AND the shop; closed by ✕ / scrim-tap / Esc. Fixed-position, own pointer-events. -->
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import HomeScene from '@/scene/HomeScene.vue';
import HomeShop from '@/components/home/HomeShop.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import { LogoMark } from '@/components/landing/icons.js';
import { homeFighterTag } from '@/scene/homeFighterTag.js';
import '@/styles/home.css';
import '@/styles/cabinet.css';

const router = useRouter();

// View + state. The home renders a single fixed state (the empty floor — no
// ownership data source yet). arrange / shop are entered from the dock.
const view = ref('home'); // 'home' | 'shop'
const arrange = ref(false);
const cabinetOpen = ref(false); // Player Cabinet drawer — slides in from the right; closable at all widths

// Entrance — the controls stagger in ONCE on mount (brand → shop → cabinet →
// edit → FIGHT last). Driven by a single class on the root that the CSS keys the
// entrance animations off; we drop it after the run so toggling arrange/shop later
// never replays it. CSS gates the keyframes behind prefers-reduced-motion.
const introPlaying = ref(true);
onMounted(() => { setTimeout(() => { introPlaying.value = false; }, 1700); });

// Player fighter from the existing pre-fight store. No core picked → default
// fighter (canon pink). Drives the 3D core hue + the cabinet's fighter card.
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreHue = computed(() => core.value?.hue || '#FF0069');
const coreName = computed(() => core.value?.name || 'ONSLAUGHT');
const coreSig = computed(() => core.value?.sig || 'PRESSURE');

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

// --- Dock / nav. FIGHT routes to the arena; the arena guard bounces a core-less
//     player to selection (the "no fighter" path). TRAIN was removed from the dock
//     (no training mode yet) — its /play/upgrade route is kept in the router for later.
function onFight() { router.push('/play/arena'); }
// SHOP segment toggles the surface (open shop / back to home); the brand-block is
// the other way home. Both swap the same `view`, cross-faded by the strip wrapper.
function onShop() { view.value = view.value === 'shop' ? 'home' : 'shop'; }
function onBrand() { view.value = 'home'; }
function onCustomize() { arrange.value = true; }

// Arrange — both exit the mode; placement is a visual stub (nothing persists).
function onArrangeCancel() { arrange.value = false; }
function onArrangePlace() { arrange.value = false; }
</script>

<style scoped>
.home-root { position: absolute; inset: 0; overflow: hidden; }

/* ───────── Fighter identity label (surfaced on camera approach) ─────────
   Own scoped styles — NEVER the shared .hs-* chrome (those are shared with the
   shop). A zero-size anchor positioned at the projected head point; the card sits
   centred above it and fades in/out with the zoom "near" flag. Discipline: no glow,
   no new pink — the only colour is the flat core marker (the fighter's core hue),
   the text is neutral chrome / muted. Timing/easing reuse the home --hs-* tokens. */
.fighter-tag {
  position: absolute; left: 0; top: 0; width: 0; height: 0;
  z-index: 6; pointer-events: none; will-change: transform;
}
.ft-card {
  position: absolute; left: 0; bottom: 0;
  /* centred above the anchor (−14px gap); +6px lower while hidden → a soft rise */
  transform: translate(-50%, calc(-100% - 14px + 6px));
  display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
  padding: 6px 11px 7px;
  background: rgba(10, 10, 16, 0.62); backdrop-filter: blur(7px);
  border: 1px solid rgba(255, 255, 255, 0.10); border-radius: 9px;
  opacity: 0;
  transition: opacity 0.32s ease,
              transform 0.32s var(--hs-spring, cubic-bezier(0.22, 0.61, 0.36, 1));
}
.ft-card.is-shown { opacity: 1; transform: translate(-50%, calc(-100% - 14px)); }
/* flat core-hue marker — NO box-shadow / glow (glows stay the core + FIGHT) */
.ft-marker { width: 8px; height: 8px; border-radius: 2px; flex: 0 0 auto; }
.ft-txt { display: flex; flex-direction: column; line-height: 1.18; }
.ft-name {
  font-family: var(--hs-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #f4f2f6;
}
.ft-sig {
  font-family: var(--hs-mono, 'JetBrains Mono', ui-monospace, monospace);
  font-size: 8.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--muted, #76727c);
}
/* EDIT SPACE chrome material + the FIGHT plinth live in home.css (the shared
   chrome stylesheet) — EDIT SPACE shares the .chrome material with the top-strip
   cluster, so it is defined alongside it, not scoped here. */

/* reduced-motion: keep a soft opacity fade, but no movement (no rise) */
@media (prefers-reduced-motion: reduce) {
  .ft-card, .ft-card.is-shown { transform: translate(-50%, calc(-100% - 14px)); }
  .ft-card { transition: opacity 0.2s ease; }
}
</style>
