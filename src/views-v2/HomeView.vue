<!-- HomeView — the player HOME ("дом игрока"). A calm 3D stage (arena slab + the
     player's fighter in idle, no combat rift / opponent / HUD) under a 2D
     navigation layer. Three states: empty (new player) / lived (more decor) /
     arrange (placement UI). Arrange + BUY are visual stubs (no persistence, no
     purchase). The decor shop opens as a view (HomeShop).

     Scope = the shell only. Floor props are a fixed default set per state from
     the design reference, NOT player data. Glow discipline: the only glows are
     the 3D fighter core + the FIGHT button — every other pink mark is matte. -->
<template>
  <div class="home-root" :class="{ 'hs-anim-in': introPlaying, 'is-away': stage !== 'home' }">
    <!-- 3D stage (behind the chrome) -->
    <HomeScene
      :core-hue="coreHue"
      :core-id="coreId"
      :placements="placements"
      :arrange="arrange"
      :grid-cells="gridCells"
      :ghost="ghost"
      :stage="stage"
      @arrived="onArrived"
      @pick="onPickMode"
    />

    <!-- ───────── persistent top strip ─────────
         Constant across the home AND the shop: brand-block (left) + one connected
         cluster (right) fusing the SHOP entry + the cabinet entry. NO $HEX here
         (balance lives in the cabinet / shop). Hidden only in arrange mode, which
         brings its own focused top bar. Styles: .hs-strip in home.css. -->
    <div v-if="!arrange" class="hs-strip">
      <button type="button" class="hs-brandblock" @click="onBrand" :aria-label="`${t.home.brand} — home`">
        <HexlashMark :size="40" /><span class="wm">{{ t.home.brand }}</span>
      </button>
      <div class="hs-cluster">
        <!-- SHOP on home; the SAME chip becomes BACK (arrow) while the shop is open
             (onShop toggles view). One matte-chrome family member — glyph + label. -->
        <button type="button" class="hs-chrome hs-seg-shop" @click="onShop"
                :aria-label="view === 'shop' ? t.home.back : t.home.shop">
          <svg v-if="view === 'shop'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 11H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
          <span class="n">{{ view === 'shop' ? t.home.back : t.home.shop }}</span>
        </button>
        <!-- cabinet — chrome diamond avatar only (no handle/role text, no chevron) -->
        <button type="button" class="hs-chrome hs-seg-cab" @click="cabinetOpen = true" :aria-label="t.cabinet.chipOpen">
          <span class="av" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <!-- surface under the strip: home chrome OR the shop, cross-faded (fade+scale) -->
    <Transition name="hs-view" mode="out-in">
      <!-- Decor shop view replaces the chrome (its own opaque bg covers the stage) -->
      <HomeShop v-if="view === 'shop'" key="shop" :balance="balance" @back="setView('home')" />

      <!-- Home / arrange chrome overlay -->
      <div v-else key="home" class="hs-overlay">
      <!-- ───────── normal home chrome ─────────
           Kept MOUNTED at the mode stage and hidden by the `.is-away` class instead
           of being v-if'd away, so it can actually fade over the first beat of the
           flight rather than popping out of existence the moment FIGHT is pressed. -->
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
                <span class="f-label">{{ t.home.fight }}</span>
                <svg class="f-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
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
        <button type="button" class="hs-chrome edit-space" @click="onCustomize" :aria-label="t.home.editSpace">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" /><path d="M13.5 6.5l3 3" /></svg>
          <span class="n">{{ t.home.editSpace }}</span>
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

    <!-- ───────── mode-stage chrome ─────────
         The ARENA / FORGE fork is no longer a screen — it is a place in the same world,
         so its chrome is only what the place needs: ← BACK, and one caption per
         plate anchored over the real 3D slab (projected by HomeScene into
         modePlateTags, same trick as the fighter identity label). No top strip here
         — no brand, no SHOP, no cabinet: the cabinet stays reachable from home.
         Discipline: BACK is matte chrome, and the captions carry NO glow of their
         own — the one lit thing on this stage is the hovered plate, in 3D. -->
    <template v-if="stage === 'select'">
      <button
        v-show="!flying"
        type="button"
        class="hs-chrome mode-back"
        @click="onModeBack"
      >{{ t.mode.back }}</button>

      <div
        v-for="door in MODE_DOORS"
        :key="door.id"
        class="mode-cap"
        :class="{ 'is-lit': modePlateTags.hovered === door.id }"
        :style="{ transform: `translate3d(${modePlateTags[door.id].x}px, ${modePlateTags[door.id].y}px, 0)` }"
        aria-hidden="true"
      >
        <div class="mc-card" :class="{ 'is-shown': !flying && modePlateTags[door.id].visible }">
          <span class="mc-name">{{ door.name }}</span>
          <span class="mc-desc">{{ door.desc }}</span>
        </div>
      </div>
    </template>

    <!-- Reduced motion: there is no flight, so the stage swap is covered by a short
         dim instead (the camera is simply placed on the other framing). -->
    <div class="stage-dim" :class="{ 'is-on': dim }" aria-hidden="true"></div>

    <!-- ───────── dev performance readout ─────────
         Off unless the address carries ?perf=1, so it is a preview tool and not a
         feature: with the parameter absent nothing here renders and nothing is
         sampled in the frame loop (see perfProbe.js). Matte mono, muted ink, no
         glow and no pink — it must never read as part of the game. -->
    <div v-if="PERF_ON" class="perf-hud" aria-hidden="true">
      <div>FPS {{ perfState.fps }}<span class="pd">/{{ perfState.cap }}</span></div>
      <div>
        FLIGHT MIN {{ perfState.minFps || '—' }}
        <span class="pd">· STALL {{ perfState.stalled ? 'YES' : '—' }}</span>
      </div>
      <div>
        PLATES {{ perfState.plateBuildMs }}MS
        <span class="pd">· {{ perfState.plateTris }} TRI (+{{ perfState.plateHiddenTris }} HIT)</span>
      </div>
      <div class="pd">FLIGHTS {{ perfState.flights }}</div>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import HomeScene from '@/scene/HomeScene.vue';
import HomeShop from '@/components/home/HomeShop.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import { HexlashMark } from '@/components/brand/hexlashMark.js';
import { homeFighterTag } from '@/scene/homeFighterTag.js';
import { modePlateTags } from '@/scene/modePlateTags.js';
import { PERF_ON, perfState } from '@/scene/perfProbe.js';
import '@/styles/home.css';
import '@/styles/cabinet.css';

const router = useRouter();
const route = useRoute();

// ───────── stage: home ⇄ mode select, ONE world, ONE scene ─────────
// /play/home and /play/mode are the same route record (an alias — see the router),
// so this component is NOT remounted between them and the 3D scene survives the
// hop. `stage` is what the camera should be looking at; HomeScene flies there and
// calls back with `arrived`, and only THEN does the URL change — the flight is the
// navigation, the route is the bookmark.
const MODE_PATH = '/play/mode';
const HOME_PATH = '/play/home';
const routeStage = computed(() => (route.path === MODE_PATH ? 'select' : 'home'));
const stage = ref(routeStage.value);
const flying = ref(false);
const dim = ref(false);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The two islands at the mode stage. The ids stay 'pve' / 'pvp' — they are the
// contract with the 3D plates (modePlates), the caption tags (modePlateTags) and the
// scene's picking — but what the player reads is FORGE and ARENA (see en.js `mode`).
const MODE_DOORS = [
  { id: 'pve', name: t.value.mode.pveName, desc: t.value.mode.pveDesc, to: '/play/pve' },    // FORGE
  { id: 'pvp', name: t.value.mode.pvpName, desc: t.value.mode.pvpDesc, to: '/play' },        // ARENA
];

// Browser back / forward (and any other push at these two paths) moves the camera:
// the route is a wish, `stage` is what the scene acts on.
watch(routeStage, (v) => { if (v !== stage.value) goStage(v); });

// Under reduced motion HomeScene places the camera instead of flying it, so cover
// the swap with a short dim rather than letting the world jump.
async function goStage(next) {
  if (next === stage.value) return;
  if (!reducedMotion) {
    flying.value = true;
    stage.value = next;
    return;
  }
  dim.value = true;
  await new Promise((r) => setTimeout(r, 130));
  flying.value = true;
  stage.value = next;
}

// The camera has landed. NOW the URL catches up — pushing earlier would swap the
// route record mid-flight and tear the scene down under the camera.
function onArrived(where) {
  flying.value = false;
  dim.value = false;
  const want = where === 'select' ? MODE_PATH : HOME_PATH;
  // Carry the query across: the hop is one scene, so anything the address is
  // holding (?perf=1 on a preview build) has to survive it and survive a refresh.
  // Кроме ?view=shop — магазин принадлежит дому, на экране выбора режима его нет.
  const carry = { ...route.query };
  delete carry.view;
  if (route.path !== want) router.push({ path: want, query: carry });
}

// FIGHT no longer navigates — it flies. A second press while the camera is moving
// is ignored (the flight is already on its way).
function onFightMode() { if (!flying.value && stage.value === 'home') goStage('select'); }
function onModeBack() { if (!flying.value) goStage('home'); }

// A plate was chosen in 3D. These ARE screen changes (a different scene each way),
// so they navigate normally and the transition cover handles them.
function onPickMode(id) {
  const door = MODE_DOORS.find((d) => d.id === id);
  if (door) router.push(door.to);
}

// View + state. The home renders a single fixed state (the empty floor — no
// ownership data source yet). arrange / shop are entered from the dock.
//
// Магазин — это состояние ДОМА, а не отдельный маршрут: он рисуется поверх той
// же сцены. Но попасть в него надо уметь снаружи — из зала FORGE, где в полосе
// стоит та же кнопка SHOP. Поэтому состояние отражается в адресе как ?view=shop:
// внешняя ссылка ведёт куда обещает, обновление страницы возвращает туда же,
// а «назад» в браузере работает.
const view = ref(route.query.view === 'shop' ? 'shop' : 'home'); // 'home' | 'shop'
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

// --- Dock / nav. FIGHT flies the camera out to the mode plates (see goStage /
//     onFightMode above); from there FORGE → /play/pve and ARENA → /play (core
//     select). ARENA used to stop at a Ground Select screen that asked ARENA or
//     SPACE; a door labelled ARENA that opens onto the same question again is a
//     door that does not answer, so the screen is gone and the door goes straight
//     to the fight (24.08.2026 — space is a seasonal event now, not a ground).
//     TRAIN was removed from the dock (no training mode yet); the /play/upgrade
//     screen it used to open is gone too (25.08.2026 — upgrading lives in FORGE,
//     per fighter), and that address now redirects there.
function onFight() { onFightMode(); }
// SHOP segment toggles the surface (open shop / back to home); the brand-block is
// the other way home. Both swap the same `view`, cross-faded by the strip wrapper.
function onShop() { setView(view.value === 'shop' ? 'home' : 'shop'); }
function onBrand() { setView('home'); }

// Смена состояния всегда идёт через адрес: ?view=shop появляется при входе и
// исчезает при выходе (пустой параметр в адресе — мусор). replace, а не push:
// открытие магазина не должно копиться в истории кнопкой «назад».
function setView(next) {
  view.value = next;
  const query = { ...route.query };
  if (next === 'shop') query.view = 'shop'; else delete query.view;
  router.replace({ path: route.path, query });
}

// Адрес — источник правды: переход извне (из FORGE) и «назад» в браузере
// меняют только его, состояние подтягивается следом.
watch(() => route.query.view, (v) => { view.value = v === 'shop' ? 'shop' : 'home'; });
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
  display: inline-flex; align-items: center; gap: var(--sp-2); white-space: nowrap;
  padding: var(--sp-2) var(--sp-3) var(--sp-2);
  background: color-mix(in srgb, var(--void) 62%, transparent); backdrop-filter: blur(7px);
  border: 1px solid var(--line); border-radius: var(--r-none);
  opacity: 0;
  transition: opacity var(--d-hover) var(--e-settle),
              transform var(--d-hover) var(--e-spring);
}
.ft-card.is-shown { opacity: 1; transform: translate(-50%, calc(-100% - 14px)); }
/* flat core-hue marker — NO box-shadow / glow (glows stay the core + FIGHT) */
.ft-marker { width: 8px; height: 8px; border-radius: var(--r-none); flex: 0 0 auto; }
.ft-txt { display: flex; flex-direction: column; line-height: 1.18; }
.ft-name {
  font-family: var(--font-mono);
  font-size: var(--t-sm); letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink);
}
.ft-sig {
  font-family: var(--font-mono);
  font-size: var(--t-micro); letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-dim);
}
/* ───────── the two stages of the one world ─────────
   Pressing FIGHT does not open a screen, it flies the camera away — so the home's
   own 2D chrome has to be gone by the time the camera has really left. It fades on
   the class, over the first quarter-second of the flight, and comes back the same
   way on the way home. `.is-away` covers both the flight and the mode stage. */
.home-root .hs-strip,
.home-root .hs-dock,
.home-root .edit-space,
.home-root .fighter-tag {
  visibility: visible;
  transition: opacity var(--d-hover) var(--e-weight), visibility 0s linear 0s;
}
/* `visibility`, not just opacity: the strip's own children carry pointer-events:auto
   (home.css), so a merely transparent strip still swallows clicks meant for the mode
   stage's ← BACK underneath it. Visibility flips only after the fade has finished on
   the way out, and immediately on the way back in. */
.home-root.is-away .hs-strip,
.home-root.is-away .hs-dock,
.home-root.is-away .edit-space,
.home-root.is-away .fighter-tag {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity var(--d-hover) var(--e-weight), visibility 0s linear var(--d-hover);
}

/* ← BACK on the mode stage. Matte chrome, no pink, no glow — the one lit thing on
   this stage is the hovered plate, and it is lit in 3D. */
.mode-back {
  position: absolute; left: 28px; top: 26px; z-index: 10;
  pointer-events: auto;
  font-family: var(--font-mono);
  font-size: var(--t-sm); letter-spacing: 0.16em; text-transform: uppercase;
  height: 40px; padding: 0 var(--sp-4);
}

/* Plate captions — a zero-size anchor at the projected point, card centred on it.
   Sharp DOM text over real 3D plates (same approach as the fighter identity label).
   The lit plate's caption brightens; it never gains a glow of its own. */
.mode-cap {
  position: absolute; left: 0; top: 0; width: 0; height: 0;
  z-index: 9; pointer-events: none; will-change: transform;
}
.mc-card {
  position: absolute; left: 0; top: 0;
  transform: translate(-50%, 6px);
  display: flex; flex-direction: column; align-items: center; gap: var(--sp-1);
  white-space: nowrap; text-align: center;
  opacity: 0;
  transition: opacity var(--d-hover) var(--e-weight), transform var(--d-hover) var(--e-weight);
}
.mc-card.is-shown { opacity: 1; transform: translate(-50%, 0); }
.mc-name {
  font-family: var(--font-display);
  font-weight: 900; font-size: var(--t-xl); line-height: 0.9;
  letter-spacing: 0.02em; text-transform: uppercase;
  color: var(--ink);
}
.mc-desc {
  font-family: var(--font-mono);
  font-size: var(--t-xs); letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-off);
  transition: color var(--d-hover) var(--e-weight);
}
.mode-cap.is-lit .mc-desc { color: var(--ink-dim); }

@media (max-width: 560px) {
  .mode-back { left: 18px; top: 18px; }
  .mc-name { font-size: var(--t-xl); }
  .mc-desc { font-size: var(--t-micro); letter-spacing: 0.14em; }
}

/* Reduced motion only: the camera is placed, not flown, so a short dim covers the
   swap. Zero cost (and invisible) when the flight is doing its job. */
.stage-dim {
  position: absolute; inset: 0; z-index: 9;
  background: var(--void);
  opacity: 0; pointer-events: none;
  transition: opacity var(--d-press) linear;
}
.stage-dim.is-on { opacity: 1; }

/* Dev performance readout (?perf=1). Deliberately plain: mono, muted, no panel,
   no glow, no pink — a preview instrument sitting on top of the game, never a
   part of it. Top-right so it clears ← BACK and the FIGHT plinth. */
.perf-hud {
  position: absolute; right: 12px; top: 84px; z-index: 20;
  pointer-events: none; user-select: none;
  font-family: var(--font-mono);
  font-size: var(--t-micro); line-height: 1.65; letter-spacing: 0.08em;
  text-transform: uppercase; text-align: right;
  color: var(--ink-off);
}
.perf-hud .pd { opacity: 0.62; }

/* EDIT SPACE chrome material + the FIGHT plinth live in home.css (the shared
   chrome stylesheet) — EDIT SPACE shares the .chrome material with the top-strip
   cluster, so it is defined alongside it, not scoped here. */

/* reduced-motion: keep a soft opacity fade, but no movement (no rise) */
@media (prefers-reduced-motion: reduce) {
  .ft-card, .ft-card.is-shown { transform: translate(-50%, calc(-100% - 14px)); }
  .ft-card { transition: opacity var(--d-hover) var(--e-settle); }
}
</style>
