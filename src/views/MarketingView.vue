<template>
  <div class="marketing">
    <!-- Sticky header (chrome, not one of the 5 sections).
         Transparent on hero, gains dark bg + blur after scroll > 50px.
         Nav anchors target the merged section ids. -->
    <header class="marketing-header" :class="{ 'is-scrolled': isHeaderScrolled }">
      <div class="marketing-header__inner">
        <a href="#" class="marketing-header__brand" @click.prevent="scrollToTop" aria-label="Hexlash">
          <img :src="logoSrc" alt="Hexlash" class="marketing-header__logo" draggable="false" />
        </a>

        <nav class="marketing-header__nav" aria-label="Primary">
          <a href="#gameplay" class="marketing-header__navlink" @click.prevent="scrollToSection('gameplay')">GAMEPLAY</a>
          <a href="#token" class="marketing-header__navlink" @click.prevent="scrollToSection('token')">$HEX</a>
        </nav>

        <div class="marketing-header__socials">
          <a href="#" target="_blank" rel="noopener" aria-label="Discord" class="marketing-header__social">
            <img :src="iconDisc" alt="" />
          </a>
          <a href="#" target="_blank" rel="noopener" aria-label="X (Twitter)" class="marketing-header__social">
            <img :src="iconX" alt="" />
          </a>
        </div>
      </div>
    </header>

    <!-- ========================================================
         1. HERO — "playable now", player-first, single PLAY CTA.
         ======================================================== -->
    <section class="lp-hero" ref="heroRef">
      <!-- Hex grid background — pink at ~13% opacity -->
      <div class="lp-hero__hex" aria-hidden="true">
        <svg class="lp-hero__hex-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="lp-hex-pattern" x="0" y="0" width="40" height="35" patternUnits="userSpaceOnUse">
              <polygon points="20,2 38,12 38,32 20,42 2,32 2,12" fill="none" stroke="rgba(255, 6, 111, 0.13)" stroke-width="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lp-hex-pattern)" />
        </svg>
      </div>

      <!-- Single glow source under the centre -->
      <div class="lp-hero__glow" aria-hidden="true"></div>

      <div class="lp-hero__content">
        <span class="lp-live">
          <span class="lp-live__dot" aria-hidden="true"></span>
          Playable Now
        </span>
        <h1 class="lp-hero__title">BIGGER FIGHTS INCOMING</h1>
        <p class="lp-hero__sub">You're among the first to step into the arena.</p>
        <button type="button" class="lp-btn lp-btn--primary lp-hero__cta" @click="onPlayClick">
          Play
        </button>
      </div>
    </section>

    <!-- ========================================================
         2. WHAT YOU DO — three blocks (replaces "NEVER GIVE UP").
         ======================================================== -->
    <section class="lp-pillars" ref="pillarsRef">
      <div class="lp-pillars__inner" :class="{ 'is-visible': pillarsVisible }">
        <h2 class="lp-pillars__heading">WHAT YOU DO</h2>
        <div class="lp-pillars__grid">
          <article class="lp-card">
            <h3 class="lp-card__title">Your Fighter</h3>
            <p class="lp-card__text">Who you bring to the arena.</p>
          </article>
          <article class="lp-card">
            <h3 class="lp-card__title">Your Style</h3>
            <p class="lp-card__text">Tune the build to fit you.</p>
          </article>
          <article class="lp-card">
            <h3 class="lp-card__title">Your Path</h3>
            <p class="lp-card__text">Fight, win, and grow.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ========================================================
         3. GAMEPLAY — video frame (kept structurally).
         ======================================================== -->
    <section id="gameplay" class="lp-gameplay" ref="gameplayRef">
      <div class="lp-gameplay__inner" :class="{ 'is-visible': gameplayVisible }">
        <h2 class="lp-gameplay__heading">GAMEPLAY</h2>
        <div class="lp-gameplay__frame">
          <svg class="lp-gameplay__pattern" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <pattern id="lp-gameplay-hex" x="0" y="0" width="44" height="38" patternUnits="userSpaceOnUse">
                <polygon points="22,2 42,13 42,35 22,46 2,35 2,13" fill="none" stroke="rgba(255, 6, 111, 0.13)" stroke-width="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lp-gameplay-hex)" />
          </svg>
          <div class="lp-gameplay__center">
            <svg class="lp-gameplay__play" viewBox="0 0 100 100" aria-hidden="true">
              <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="#FF066F" />
              <polygon points="42,32 70,50 42,68" fill="#fff" />
            </svg>
            <p class="lp-gameplay__placeholder">Video Incoming</p>
          </div>
        </div>
        <p class="lp-gameplay__caption">First match recordings drop with the next release.</p>
      </div>
    </section>

    <!-- ========================================================
         4. $HEX + ROADMAP — merged (was two sections).
            Roadmap = horizontal timeline, one phase highlighted.
         ======================================================== -->
    <section id="token" class="lp-token" ref="tokenRef">
      <div class="lp-token__glow" aria-hidden="true"></div>
      <div class="lp-token__inner" :class="{ 'is-visible': tokenVisible }">
        <h2 class="lp-token__symbol">$HEX</h2>
        <p class="lp-token__network">Launching on Base — player first, token second.</p>

        <ol class="lp-timeline" aria-label="Roadmap">
          <li class="lp-phase is-current">
            <span class="lp-phase__dot" aria-hidden="true"></span>
            <span class="lp-phase__num">01</span>
            <span class="lp-phase__label">Live</span>
          </li>
          <li class="lp-phase">
            <span class="lp-phase__dot" aria-hidden="true"></span>
            <span class="lp-phase__num">02</span>
            <span class="lp-phase__label">Next</span>
          </li>
          <li class="lp-phase">
            <span class="lp-phase__dot" aria-hidden="true"></span>
            <span class="lp-phase__num">03</span>
            <span class="lp-phase__label">Later</span>
          </li>
          <li class="lp-phase">
            <span class="lp-phase__dot" aria-hidden="true"></span>
            <span class="lp-phase__num">04</span>
            <span class="lp-phase__label">Beyond</span>
          </li>
        </ol>
      </div>
    </section>

    <!-- ========================================================
         5. STAY UPDATED + FOOTER — email subscribe + socials.
         ======================================================== -->
    <section class="lp-subscribe" ref="subscribeRef">
      <div class="lp-subscribe__inner" :class="{ 'is-visible': subscribeVisible }">
        <h2 class="lp-subscribe__heading">STAY UPDATED</h2>
        <form class="lp-subscribe__form" @submit.prevent="onSubscribeSubmit">
          <input
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            class="lp-subscribe__input"
            :disabled="isSubmitting"
            autocomplete="email"
          />
          <button type="submit" class="lp-btn lp-btn--primary lp-subscribe__button" :disabled="isSubmitting">
            Subscribe
          </button>
        </form>
      </div>
    </section>

    <footer class="lp-footer">
      <ul class="lp-footer__socials" aria-label="Social media">
        <li><a href="#" target="_blank" rel="noopener" aria-label="Telegram"><img :src="iconTelega" alt="" class="lp-footer__icon" /></a></li>
        <li><a href="#" target="_blank" rel="noopener" aria-label="X (Twitter)"><img :src="iconX" alt="" class="lp-footer__icon" /></a></li>
        <li><a href="#" target="_blank" rel="noopener" aria-label="YouTube"><img :src="iconYout" alt="" class="lp-footer__icon" /></a></li>
        <li><a href="#" target="_blank" rel="noopener" aria-label="Discord"><img :src="iconDisc" alt="" class="lp-footer__icon" /></a></li>
        <li><a href="#" target="_blank" rel="noopener" aria-label="Instagram"><img :src="iconInsta" alt="" class="lp-footer__icon" /></a></li>
      </ul>
      <nav class="lp-footer__links">
        <router-link to="/privacy" class="lp-footer__link">Privacy</router-link>
        <span class="lp-footer__sep" aria-hidden="true">·</span>
        <router-link to="/play/rules" class="lp-footer__link">Rules</router-link>
        <span class="lp-footer__sep" aria-hidden="true">·</span>
        <router-link to="/help" class="lp-footer__link">Help</router-link>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useDocumentMeta } from '@/composables/useDocumentMeta';
import { useScrollFadeIn } from '@/composables/useScrollFadeIn';
import logoSrc from '@/assets/images/logo-512.png';
import iconTelega from '@/assets/images/icon_telega.svg';
import iconX from '@/assets/images/icon_x.svg';
import iconYout from '@/assets/images/icon_yout.svg';
import iconDisc from '@/assets/images/icon_disc.svg';
import iconInsta from '@/assets/images/icon_insta.svg';

const router = useRouter();
const store = useStore();

// Section refs for scroll fade-in
const heroRef = ref(null);
const pillarsRef = ref(null);
const gameplayRef = ref(null);
const tokenRef = ref(null);
const subscribeRef = ref(null);

// IntersectionObserver fade-in via composable (threshold 0.3, one-shot,
// fallback to immediate visibility where IntersectionObserver is absent).
const { visible: pillarsVisible } = useScrollFadeIn(pillarsRef);
const { visible: gameplayVisible } = useScrollFadeIn(gameplayRef);
const { visible: tokenVisible } = useScrollFadeIn(tokenRef);
const { visible: subscribeVisible } = useScrollFadeIn(subscribeRef);

// Subscribe form state
const email = ref('');
const isSubmitting = ref(false);

function onSubscribeSubmit() {
  if (isSubmitting.value || !email.value) return;
  isSubmitting.value = true;

  // Reuse the existing global toast (<Info> renders on / via App.vue
  // !isPlayRoute block). setInfoMessage is a MUTATION — use commit.
  store.commit('master/setInfoMessage', {
    text: 'Coming soon — stay tuned!',
    timeout: 3000,
    showButton: false,
  });

  email.value = '';
  setTimeout(() => { isSubmitting.value = false; }, 600);
}

useDocumentMeta({
  title: 'Hexlash — Web3 Turn-Based Fighter',
  description: 'Pick your archetype, build your loadout, dominate the arena. Web3 PvP fighting game on Base.',
  ogImage: 'https://hexlash.com/og-image.png',
});

function onPlayClick() {
  // / route handles authed → /play; anonymous land on signup.
  router.push('/auth/signup');
}

// Sticky header — transparent on hero, dark + blur after 50px scroll.
const isHeaderScrolled = ref(false);
function handleScroll() {
  isHeaderScrolled.value = window.scrollY > 50;
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const HEADER_OFFSET = 80;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: 'smooth' });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* ============================================================
   LANDING v3 — Hexlash draft brand language (30.05.2026).
   SCOPE: this file only. Self-contained `--lp-*` tokens — does
   NOT use or modify the shared Neon Discipline `--hex-*` tokens,
   so the rest of the product (combat/profile/shop/wallet/guest)
   is untouched. The pixel `Anonymous` font is the impact face
   (headings / counters / key numbers); a calm sans is the body
   face (copy / buttons / nav).
   ============================================================ */
.marketing {
  /* Palette */
  --lp-bg: #0A0A0C;
  --lp-surface: #14141A;
  --lp-hover: #1E1E26;
  --lp-border: #2A2A32;
  --lp-text: #F0F0F0;
  --lp-text-quiet: #8A8A90;
  --lp-accent: #FF066F;
  --lp-accent-pressed: #C70557;
  --lp-accent-light: #FF6BA3;

  /* Type */
  --lp-font-display: 'Anonymous', 'Courier New', monospace;
  --lp-font-body: 'Inter', 'Roboto', 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  background: var(--lp-bg);
  color: var(--lp-text);
  font-family: var(--lp-font-body);
  overflow-x: hidden;
}

/* ============================================
   HEADER (sticky chrome)
   ============================================ */
.marketing-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background-color 0.2s ease, backdrop-filter 0.2s ease, border-color 0.2s ease;
}

.marketing-header.is-scrolled {
  background: rgba(10, 10, 12, 0.78);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom-color: var(--lp-border);
}

.marketing-header__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 48px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
}

.marketing-header__brand {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  -webkit-user-drag: none;
}

.marketing-header__logo {
  height: 72px;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

.marketing-header__nav {
  display: flex;
  justify-content: center;
  gap: 44px;
}

.marketing-header__navlink {
  font-family: var(--lp-font-body);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lp-text-quiet);
  text-decoration: none;
  transition: color 0.15s ease;
  cursor: pointer;
}

.marketing-header__navlink:hover {
  color: var(--lp-accent-light);
}

.marketing-header__socials {
  display: inline-flex;
  align-items: center;
  gap: 16px;
}

.marketing-header__social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
}

.marketing-header__social:hover {
  background: var(--lp-hover);
}

.marketing-header__social img {
  width: 26px;
  height: 26px;
  user-select: none;
  -webkit-user-drag: none;
}

/* ============================================
   Shared buttons
   ============================================ */
.lp-btn {
  font-family: var(--lp-font-body);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 6px;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.2s ease;
}

/* Primary — sole filled accent button per screen (#FF066F → #C70557) */
.lp-btn--primary {
  background: var(--lp-accent);
  color: #fff;
  border: none;
  box-shadow: 0 0 28px rgba(255, 6, 111, 0.45);
}

.lp-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 40px rgba(255, 6, 111, 0.6);
}

.lp-btn--primary:active:not(:disabled) {
  transform: translateY(0);
  background: var(--lp-accent-pressed);
  box-shadow: 0 0 18px rgba(255, 6, 111, 0.35);
}

.lp-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* ============================================
   1. HERO
   ============================================ */
.lp-hero {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--lp-bg);
}

.lp-hero__hex {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 1;
  animation: lp-hex-drift 60s linear infinite;
}

.lp-hero__hex-svg {
  width: 120%;
  height: 120%;
  position: absolute;
  top: -10%;
  left: -10%;
}

.lp-hero__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(400px, 60vw, 900px);
  height: clamp(400px, 60vw, 900px);
  background: radial-gradient(circle at center, rgba(255, 6, 111, 0.16) 0%, rgba(255, 6, 111, 0.05) 42%, transparent 70%);
  pointer-events: none;
  z-index: 1;
  animation: lp-glow-pulse 8s ease-in-out infinite;
}

.lp-hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px;
  text-align: center;
}

/* Live pill — dot + caps, body font (impact face reserved for headings) */
.lp-live {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 7px 16px;
  border: 1px solid var(--lp-border);
  border-radius: 999px;
  background: rgba(255, 6, 111, 0.06);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--lp-accent-light);
}

.lp-live__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lp-accent);
  box-shadow: 0 0 10px var(--lp-accent);
  animation: lp-live-pulse 2.4s ease-in-out infinite;
}

.lp-hero__title {
  margin: 0;
  font-family: var(--lp-font-display);
  font-size: clamp(40px, 7vw, 88px);
  font-weight: 400;
  line-height: 1.05;
  color: var(--lp-text);
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-shadow: 0 0 18px rgba(255, 6, 111, 0.35), 0 0 48px rgba(255, 6, 111, 0.15);
  max-width: 16ch;
}

.lp-hero__sub {
  margin: 0;
  font-size: clamp(15px, 1.8vw, 19px);
  color: var(--lp-text-quiet);
  letter-spacing: 0.02em;
  max-width: 36ch;
}

.lp-hero__cta {
  margin-top: 8px;
  font-size: clamp(16px, 1.8vw, 18px);
  padding: 16px 56px;
  min-width: 200px;
}

/* ============================================
   2. WHAT YOU DO (three blocks)
   ============================================ */
.lp-pillars {
  position: relative;
  background: var(--lp-bg);
  padding: 100px 24px;
}

.lp-pillars__inner {
  max-width: 1100px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.lp-pillars__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.lp-pillars__heading {
  margin: 0 0 48px;
  text-align: center;
  font-family: var(--lp-font-display);
  font-size: clamp(28px, 4.5vw, 48px);
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--lp-text);
  text-transform: uppercase;
}

.lp-pillars__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* Card — surface #14141A, border #2A2A32, radius 10px.
   Hover lifts to #1E1E26 and warms the border toward the accent. */
.lp-card {
  padding: 36px 28px;
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  border-radius: 10px;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.lp-card:hover {
  background: var(--lp-hover);
  border-color: var(--lp-accent);
  transform: translateY(-4px);
}

.lp-card__title {
  margin: 0 0 10px;
  font-family: var(--lp-font-display);
  font-size: clamp(20px, 2.4vw, 28px);
  font-weight: 400;
  letter-spacing: 0.03em;
  color: var(--lp-text);
  text-transform: uppercase;
}

.lp-card__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--lp-text-quiet);
}

/* ============================================
   3. GAMEPLAY
   ============================================ */
.lp-gameplay {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lp-bg);
  padding: 100px 24px;
}

.lp-gameplay__inner {
  width: 100%;
  max-width: 1100px;
  text-align: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.lp-gameplay__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.lp-gameplay__heading {
  margin: 0 0 32px;
  font-family: var(--lp-font-display);
  font-size: clamp(28px, 4.5vw, 48px);
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--lp-text);
  text-transform: uppercase;
}

.lp-gameplay__frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 64px rgba(255, 6, 111, 0.08);
}

.lp-gameplay__pattern {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.lp-gameplay__center {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.lp-gameplay__play {
  width: 88px;
  height: 88px;
  display: block;
  filter: drop-shadow(0 0 22px rgba(255, 6, 111, 0.5));
}

.lp-gameplay__placeholder {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lp-text);
}

.lp-gameplay__caption {
  margin: 24px 0 0;
  font-size: clamp(13px, 1.4vw, 15px);
  color: var(--lp-text-quiet);
  letter-spacing: 0.04em;
}

/* ============================================
   4. $HEX + ROADMAP (merged) — timeline
   ============================================ */
.lp-token {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lp-bg);
  padding: 110px 24px;
  overflow: hidden;
}

/* Single glow source for the section */
.lp-token__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 640px;
  height: 640px;
  background: radial-gradient(circle, rgba(255, 6, 111, 0.09) 0%, transparent 70%);
  pointer-events: none;
}

.lp-token__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 980px;
  text-align: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.lp-token__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.lp-token__symbol {
  margin: 0 0 14px;
  font-family: var(--lp-font-display);
  font-size: clamp(64px, 12vw, 150px);
  font-weight: 400;
  letter-spacing: 0.02em;
  color: var(--lp-text);
  line-height: 1;
  text-shadow: 0 0 48px rgba(255, 6, 111, 0.4);
}

.lp-token__network {
  margin: 0 0 64px;
  font-size: clamp(14px, 1.6vw, 17px);
  color: var(--lp-text-quiet);
  letter-spacing: 0.04em;
}

/* Horizontal timeline — connecting line behind evenly spaced phases */
.lp-timeline {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.lp-timeline::before {
  content: '';
  position: absolute;
  top: 7px;
  left: 12.5%;
  right: 12.5%;
  height: 1px;
  background: var(--lp-border);
  z-index: 0;
}

.lp-phase {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.lp-phase__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--lp-bg);
  border: 1px solid var(--lp-border);
  box-shadow: 0 0 0 4px var(--lp-bg);
}

.lp-phase__num {
  font-family: var(--lp-font-display);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 400;
  line-height: 1;
  color: var(--lp-text-quiet);
  opacity: 0.5;
}

.lp-phase__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lp-text-quiet);
}

/* Current phase — the one lit node (accent), everyone else muted */
.lp-phase.is-current .lp-phase__dot {
  background: var(--lp-accent);
  border-color: var(--lp-accent);
  box-shadow: 0 0 0 4px var(--lp-bg), 0 0 16px rgba(255, 6, 111, 0.7);
}

.lp-phase.is-current .lp-phase__num {
  color: var(--lp-accent);
  opacity: 1;
}

.lp-phase.is-current .lp-phase__label {
  color: var(--lp-accent-light);
}

/* ============================================
   5. STAY UPDATED + FOOTER
   ============================================ */
.lp-subscribe {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lp-bg);
  padding: 100px 24px 64px;
}

.lp-subscribe__inner {
  width: 100%;
  max-width: 600px;
  text-align: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.lp-subscribe__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.lp-subscribe__heading {
  margin: 0 0 32px;
  font-family: var(--lp-font-display);
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--lp-text);
  text-transform: uppercase;
}

.lp-subscribe__form {
  display: flex;
  gap: 12px;
  align-items: stretch;
  max-width: 480px;
  margin: 0 auto;
}

.lp-subscribe__input {
  flex: 1;
  min-width: 0;
  font-family: var(--lp-font-body);
  font-size: 14px;
  padding: 12px 16px;
  background: var(--lp-surface);
  border: 1px solid var(--lp-border);
  border-radius: 6px;
  color: var(--lp-text);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.lp-subscribe__input::placeholder {
  color: var(--lp-text-quiet);
}

.lp-subscribe__input:focus {
  outline: none;
  border-color: var(--lp-accent);
  background: var(--lp-hover);
}

.lp-subscribe__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lp-subscribe__button {
  font-size: 14px;
  padding: 12px 32px;
  white-space: nowrap;
}

.lp-footer {
  padding: 40px 24px 28px;
  border-top: 1px solid var(--lp-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background: var(--lp-bg);
}

.lp-footer__socials {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 24px;
  align-items: center;
}

.lp-footer__socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  opacity: 0.6;
  transition: opacity 0.15s ease, transform 0.15s ease, background-color 0.15s ease;
}

.lp-footer__socials a:hover {
  opacity: 1;
  transform: translateY(-2px);
  background: var(--lp-hover);
}

.lp-footer__icon {
  width: 22px;
  height: 22px;
  user-select: none;
  -webkit-user-drag: none;
}

.lp-footer__links {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: var(--lp-text-quiet);
}

.lp-footer__link {
  color: var(--lp-text-quiet);
  text-decoration: none;
  transition: color 0.15s ease;
}

.lp-footer__link:hover {
  color: var(--lp-text);
}

.lp-footer__sep {
  opacity: 0.5;
}

/* ============================================
   Keyframes (prefixed — avoid global collisions)
   ============================================ */
@keyframes lp-hex-drift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-40px, -35px); }
}

@keyframes lp-glow-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

@keyframes lp-live-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px var(--lp-accent); }
  50% { opacity: 0.55; box-shadow: 0 0 4px var(--lp-accent); }
}

/* ============================================
   Responsive
   ============================================ */
@media (max-width: 900px) {
  .lp-pillars__grid {
    grid-template-columns: 1fr;
    max-width: 460px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .marketing-header__inner {
    gap: 14px;
    padding: 0 20px;
  }
  .marketing-header__nav {
    gap: 24px;
  }
  .marketing-header__navlink {
    font-size: 13px;
    letter-spacing: 0.06em;
  }
  .marketing-header__logo {
    height: 60px;
  }
  .marketing-header__social {
    width: 32px;
    height: 32px;
  }
  .marketing-header__social img {
    width: 24px;
    height: 24px;
  }
}

@media (max-width: 640px) {
  /* Timeline → vertical stack for readability */
  .lp-timeline {
    grid-template-columns: 1fr;
    gap: 24px;
    max-width: 220px;
    margin: 0 auto;
    text-align: left;
  }
  .lp-timeline::before {
    top: 12.5%;
    bottom: 12.5%;
    left: 7px;
    right: auto;
    width: 1px;
    height: auto;
  }
  .lp-phase {
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .lp-pillars,
  .lp-gameplay,
  .lp-subscribe {
    padding-left: 16px;
    padding-right: 16px;
  }
  .lp-pillars,
  .lp-gameplay {
    padding-top: 72px;
    padding-bottom: 72px;
  }
  .lp-token {
    padding: 80px 16px;
  }
  .lp-hero__content {
    gap: 20px;
  }
  .lp-hero__cta {
    padding: 14px 44px;
    min-width: 170px;
  }
  .lp-subscribe__form {
    flex-direction: column;
    gap: 10px;
  }
}

/* Accessibility — respect reduced-motion for the background animations */
@media (prefers-reduced-motion: reduce) {
  .lp-hero__hex,
  .lp-hero__glow,
  .lp-live__dot,
  .marketing-header {
    animation: none !important;
    transition: none !important;
  }
}
</style>
