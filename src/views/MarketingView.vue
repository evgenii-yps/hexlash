<template>
  <div class="lp" ref="rootRef">
    <div class="app" :class="{ 'is-in': isIn }">
      <!-- fixed background -->
      <div class="bg-fixed">
        <div class="bg-base"></div>
        <HexGrid :accent="accentRgb" :intensity="config.intensity" :shape="config.shape" />
        <div class="bg-glow"></div>
        <div class="vignette"></div>
        <div v-if="config.scanlines" class="scanlines"></div>
        <div v-if="config.grain" class="grain"></div>
      </div>

      <!-- persistent HUD frame -->
      <div class="hud-frame" aria-hidden="true">
        <span class="hud tl"></span><span class="hud tr"></span>
        <span class="hud bl"></span><span class="hud br"></span>
      </div>

      <LandingNav :scrolled="scrolled" />

      <main class="page">
        <LandingHero
          :kicker="config.kicker"
          :line1="config.line1"
          :line2="config.line2"
          @play="onPlay"
        />
        <LandingTicker v-if="config.marquee" :items="tickerItems" />
        <LandingCode />
        <LandingGameplay />
        <LandingToken />
        <LandingRoadmap />
        <LandingStayUpdated />
        <LandingFooter />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useDocumentMeta } from '@/composables/useDocumentMeta';
import HexGrid from '@/components/landing/HexGrid.vue';
import LandingNav from '@/components/landing/LandingNav.vue';
import LandingHero from '@/components/landing/LandingHero.vue';
import LandingTicker from '@/components/landing/LandingTicker.vue';
import LandingCode from '@/components/landing/LandingCode.vue';
import LandingGameplay from '@/components/landing/LandingGameplay.vue';
import LandingToken from '@/components/landing/LandingToken.vue';
import LandingRoadmap from '@/components/landing/LandingRoadmap.vue';
import LandingStayUpdated from '@/components/landing/LandingStayUpdated.vue';
import LandingFooter from '@/components/landing/LandingFooter.vue';
import '@/components/landing/landing.css';

const router = useRouter();
const rootRef = ref(null);

// Static config — ported from the reference TWEAK_DEFAULTS (app.jsx). The
// design tool's live Tweaks panel is intentionally NOT ported (per the brief).
const config = {
  accent: '#ff0069',
  intensity: 8,
  shape: 'shard',
  line1: 'BIGGER FIGHTS',
  line2: 'INCOMING',
  kicker: 'SEASON 0 — TEASER LIVE',
  grain: true,
  scanlines: true,
  marquee: true,
};

// hexToRgb('#ff0069') → [255, 0, 105] (reference icons.jsx helper).
function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}
const accentRgb = hexToRgb(config.accent);

// Ticker copy — verbatim from app.jsx tickerItems.
const tickerItems = [
  config.line1 + ' ' + config.line2,
  '$HEX LAUNCHING ON BASE',
  'NEVER GIVE UP',
  'TRAIN · FIGHT · RISE',
];

const isIn = ref(false);
const scrolled = ref(false);

let revealObserver = null;
let revealSafety = null;
let entranceTimer = null;

function onScroll() {
  scrolled.value = window.scrollY > 40;
}

// PLAY → into the game. Anonymous visitors enter via signup (authed users are
// redirected to /play by the route's beforeEnter, so they never see this CTA).
function onPlay() {
  router.push('/auth/signup');
}

// Delegated in-page anchor scrolling — reproduces the reference's native
// `href="#id"` behaviour with an offset under the fixed nav, without a global
// `html { scroll-padding-top }` rule. Unknown/placeholder hashes (#play,
// #discord, #x, social links) are swallowed so the page never jumps to top.
function onAnchorClick(e) {
  const a = e.target.closest('a[href^="#"]');
  if (!a || !rootRef.value || !rootRef.value.contains(a)) return;
  const href = a.getAttribute('href');
  if (!href || href === '#') {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  const id = href.slice(1);
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return; // placeholder hash (social/play) — no-op
  const navOffset = window.innerWidth <= 680 ? 70 : 84;
  const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
  window.scrollTo({ top, behavior: 'smooth' });
}

useDocumentMeta({
  title: 'Hexlash — Bigger Fights Incoming',
  description: 'Pick your fighter, build your loadout, take the belt. A Web3 turn-based fighter on Base. Train. Fight. Rise.',
  ogImage: 'https://hexlash.com/og-image.png',
});

onMounted(() => {
  // hero load entrance (reference: setTimeout 90ms → .is-in)
  entranceTimer = setTimeout(() => { isIn.value = true; }, 90);

  // sticky-nav state
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // in-page anchor smooth-scroll (delegated)
  rootRef.value.addEventListener('click', onAnchorClick);

  // scroll-reveal for [data-reveal] sections (reference app.jsx)
  const els = Array.from(rootRef.value.querySelectorAll('[data-reveal]'));
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.setAttribute('data-inview', '1'));
  } else {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-inview', '1');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => revealObserver.observe(el));
    // safety net: reveal anything still hidden after a beat (throttled observers)
    revealSafety = setTimeout(
      () => els.forEach((el) => el.setAttribute('data-inview', '1')),
      2600
    );
  }
});

onBeforeUnmount(() => {
  if (entranceTimer) clearTimeout(entranceTimer);
  if (revealSafety) clearTimeout(revealSafety);
  if (revealObserver) revealObserver.disconnect();
  window.removeEventListener('scroll', onScroll);
  if (rootRef.value) rootRef.value.removeEventListener('click', onAnchorClick);
});
</script>
