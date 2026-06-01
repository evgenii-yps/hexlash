<template>
  <div class="lp" ref="rootRef">
    <div class="app" :class="{ 'is-in': isIn }">
      <!-- fixed background (shared with the auth screen) -->
      <LandingBackground
        :accent="accentRgb"
        :intensity="config.intensity"
        :shape="config.shape"
        :scanlines="config.scanlines"
        :grain="config.grain"
      />

      <LandingNav />

      <main class="page">
        <LandingHero
          :line1="config.line1"
          :line2="config.line2"
          @play="onPlay"
        />
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
import LandingBackground from '@/components/landing/LandingBackground.vue';
import LandingNav from '@/components/landing/LandingNav.vue';
import LandingHero from '@/components/landing/LandingHero.vue';
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
  grain: true,
  scanlines: true,
};

// hexToRgb('#ff0069') → [255, 0, 105] (reference icons.jsx helper).
function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}
const accentRgb = hexToRgb(config.accent);

const isIn = ref(false);

let revealObserver = null;
let revealSafety = null;
let entranceTimer = null;

// PLAY → into the game. Anonymous visitors enter via signup (authed users are
// redirected to /play by the route's beforeEnter, so they never see this CTA).
function onPlay() {
  router.push('/auth/signup');
}

// Delegated in-page anchor scrolling — reproduces native `href="#id"` smooth
// scroll without a global `html { scroll-padding-top }` rule. The nav is a
// normal-flow element that scrolls away, so sections land at their own top (no
// fixed-header offset). Unknown/placeholder hashes (#play, #discord, #x, social
// links) are swallowed so the page never jumps to top.
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
  const top = el.getBoundingClientRect().top + window.scrollY;
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
  if (rootRef.value) rootRef.value.removeEventListener('click', onAnchorClick);
});
</script>
