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
      <!-- BACK (left) — matte-chrome family member, arrow glyph + label → /play/mode -->
      <button type="button" class="hs-chrome pve-back" @click="goMode" :aria-label="t.home.back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        <span class="n">{{ t.home.back }}</span>
      </button>
      <div class="hs-cluster">
        <!-- SHOP — bag glyph + single label; keeps its current target (→ /play/home) -->
        <button type="button" class="hs-chrome hs-seg-shop" @click="goHome" :aria-label="t.home.shop">
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
  /* secondary-button chrome family tokens + motion — mirrored from .home-root so the
     shared .hs-chrome material (home.css) resolves on this route (home.css untouched). */
  --hs-chrome-ink: #c8d1d8;
  --hs-chrome-ink-dim: #5d5d66;
  --hs-chrome-line: rgba(200, 209, 216, 0.16);
  --hs-chrome-rim: rgba(216, 227, 234, 0.45);
  --hs-chrome-rim-hot: rgba(216, 227, 234, 0.8);
  --hs-chrome-bloom: rgba(200, 209, 216, 0.22);
  --hs-chrome-bloom-hot: rgba(200, 209, 216, 0.3);
  --hs-chrome-glass: rgba(22, 22, 27, 0.55);
  --hs-chrome-glass-hover: rgba(28, 30, 37, 0.72);
  --hs-chrome-void: #08080a;
  --ease-weight: cubic-bezier(0.55, 0, 0.12, 1);
  --hs-hover: 0.22s;
  --hs-press: 0.12s;
  --hs-fast: 0.15s;

  position: absolute; inset: 0; overflow: hidden;
  background: #08080a; color: var(--ink);
  font-family: var(--hs-disp);
}

/* brand removed on PVE → the strip carries BACK (left) + the SHOP/cabinet cluster
   (right). .hs-strip is justify-content:space-between; pin the cluster to the right
   edge here (scoped to PVE — home.css stays shared/untouched). BACK + SHOP + cabinet
   are all .hs-chrome family members (see template), so they need no styling here. */
.hs-cluster { margin-left: auto; }
</style>
