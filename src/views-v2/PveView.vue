<!-- PveView — the /play/pve route: the standalone PVE 3D space (PveScene) under a
     thin 2D layer. The shared .hs-strip (home.css) is reused, but WITHOUT the brand
     block — PVE shows only SHOP + cabinet chip (matte, no SEASON 0); with the brand
     gone the lone cluster is pinned right via a scoped margin (home.css untouched).
     Top-left ‹ Back (mono) → /play/mode. NO FIGHT button, no training logic, no
     panels — this is visual only. Strip tokens are mirrored on the root so the shared
     strip is portable here without editing home.css. -->
<template>
  <div class="pve-root">
    <PveScene />

    <!-- shared chrome (brand removed on PVE): ← BACK left, SHOP + cabinet right -->
    <div class="hs-strip">
      <button type="button" class="pve-back" @click="goMode">← Back</button>
      <div class="hs-cluster">
        <button type="button" class="seg hs-seg-shop" @click="goHome">
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
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { getCore } from '@/data/upgradeData.js';
import PveScene from '@/scene/PveScene.vue';
import PlayerCabinet from '@/views-v2/PlayerCabinet.vue';
import '@/styles/home.css';     // the shared .hs-strip chrome
import '@/styles/cabinet.css';  // the PlayerCabinet drawer

const router = useRouter();
const cabinetOpen = ref(false);

// Cabinet card data (mirrors HomeView / Mode Select): default until a core is picked.
const coreId = computed(() => store.getters['prefight/selectedCoreId'] || null);
const core = computed(() => (coreId.value ? getCore(coreId.value) : null));
const coreName = computed(() => core.value?.name || 'ONSLAUGHT');
const coreSig = computed(() => core.value?.sig || 'PRESSURE');
const balance = '2,480';

function goHome() { router.push('/play/home'); }
function goMode() { router.push('/play/mode'); }
</script>

<style scoped>
/* Tokens the reused .hs-strip needs (coded against .home-root) — same values, given
   here so the real strip is portable to this route without editing home.css. */
.pve-root {
  --line: rgba(255, 255, 255, 0.09);
  --line2: rgba(255, 255, 255, 0.16);
  --bone: #f6f4f6;
  --ash: #6e6a72;
  --ink: #ededf1;
  --ink-dim: #5d5d66;
  --hs-disp: "Saira Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif;
  --hs-mono: "JetBrains Mono", ui-monospace, monospace;

  position: absolute; inset: 0; overflow: hidden;
  background: #08080a; color: var(--ink);
  font-family: var(--hs-disp);
}

/* brand removed on PVE → the strip's only child is the SHOP + cabinet cluster.
   .hs-strip is justify-content:space-between; anchor the lone cluster to the right
   edge here (scoped to PVE — home.css stays shared/untouched). */
.hs-cluster { margin-left: auto; }

/* ‹ Back — mono, LEFT element inside the strip, on the same horizontal axis as the
   SHOP + cabinet cluster. .hs-strip is a flex row (justify-content:space-between);
   BACK is the left child, the cluster the right (pinned via margin-left:auto). No
   absolute positioning — it flows + centres on the strip axis. */
.pve-back {
  font-family: var(--hs-mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--ink-dim); background: none; border: 0; cursor: pointer; padding: 6px 4px;
  transition: color 0.15s;
}
.pve-back:hover { color: var(--ink); }
.pve-back:focus-visible { outline: 2px solid var(--bone); outline-offset: 3px; color: var(--ink); }
</style>
