<template>
  <div class="lp" ref="rootRef">
    <div class="app" :class="{ 'is-in': isIn }">
      <!-- fixed background (shared with the auth screen) -->
      <LandingBackground
        :accent="accent"
        :core="activeCore"
        :scanlines="config.scanlines"
        :grain="config.grain"
      />

      <LandingNav />

      <main class="page" ref="pageRef">
        <LandingHero @play="onPlay" />
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useDocumentMeta } from '@/composables/useDocumentMeta';
import { coreAt, accentRgb } from '@/data/coreCycle.js';
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
const pageRef = ref(null);

// Static config — ported from the reference TWEAK_DEFAULTS (app.jsx). The
// design tool's live Tweaks panel is intentionally NOT ported (per the brief).
// intensity + shape ушли вместе с холстом ромбов (20.09.2026): у волны нет
// ни силы узора, ни выбора фигуры — она задана геометрией в LandingBackground.
//
// ⚠️ Отсюда уехал акцент. Тут лежал литерал '#ff0069' и свой hexToRgb — то
// есть ВТОРОЕ объявление фирменного розового рядом с тем, что в файле
// токенов. Теперь цвет раздела приходит из src/data/coreCycle.js, а тот
// читает токены.
const config = {
  grain: true,
  scanlines: true,
};

/* Круг цветов по разделам: розовый → четыре ядра → снова розовый.
   Разделов на странице семь, круг из пяти — значит он успевает замкнуться
   и пойти по второму разу, это и задумано. */
const activeIndex = ref(0);
const activeCore = computed(() => coreAt(activeIndex.value));
const accent = computed(() => accentRgb(activeCore.value));

let coreObserver = null;

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
  // Tab/share title is the bare domain on every route (incl. the landing).
  // og:title / twitter:title derive from this; description + og:image (marketing)
  // are intentionally left untouched.
  title: 'hexlash.com',
  description: 'Pick your fighter, build your loadout, take the belt. A Web3 turn-based fighter on Base. Train. Fight. Rise.',
  ogImage: 'https://hexlash.com/og-image.png',
});

onMounted(() => {
  // hero load entrance (reference: setTimeout 90ms → .is-in)
  entranceTimer = setTimeout(() => { isIn.value = true; }, 90);

  /* Цвет фона ведёт РАЗДЕЛ, а не таймер и не положение прокрутки в пикселях:
     активен тот, что пересекает середину экрана. Обработчика на каждый кадр
     нет — наблюдатель просыпается только на границах. */
  const sections = pageRef.value ? Array.from(pageRef.value.children) : [];
  if (sections.length && 'IntersectionObserver' in window) {
    coreObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = sections.indexOf(entry.target);
          if (i >= 0) activeIndex.value = i;
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    sections.forEach((el) => coreObserver.observe(el));
  }

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
  if (coreObserver) coreObserver.disconnect();
  if (rootRef.value) rootRef.value.removeEventListener('click', onAnchorClick);
});
</script>
