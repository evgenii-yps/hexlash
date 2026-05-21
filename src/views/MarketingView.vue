<template>
  <div class="marketing">
    <!-- Sticky header (claude/landing-refresh — added 2026-05-21).
         Transparent on hero, gains dark bg + blur after scroll > 50px.
         Anchors smooth-scroll to existing sections via id targets. -->
    <header class="marketing-header" :class="{ 'is-scrolled': isHeaderScrolled }">
      <div class="marketing-header__inner">
        <a href="#" class="marketing-header__brand" @click.prevent="scrollToTop" aria-label="Hexlash">
          <img :src="logoSrc" alt="Hexlash" class="marketing-header__logo" draggable="false" />
        </a>

        <nav class="marketing-header__nav" aria-label="Primary">
          <a href="#gameplay" class="marketing-header__navlink" @click.prevent="scrollToSection('gameplay')">GAMEPLAY</a>
          <a href="#token" class="marketing-header__navlink" @click.prevent="scrollToSection('token')">$HEX</a>
          <a href="#roadmap" class="marketing-header__navlink" @click.prevent="scrollToSection('roadmap')">ROADMAP</a>
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

    <section class="marketing-hero" ref="heroRef">
      <!-- Animated hex pattern background -->
      <div class="marketing-hero__hex-bg" aria-hidden="true">
        <svg class="marketing-hero__hex-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hex-pattern" x="0" y="0" width="40" height="35" patternUnits="userSpaceOnUse">
              <polygon
                points="20,2 38,12 38,32 20,42 2,32 2,12"
                fill="none"
                stroke="rgba(255, 6, 111, 0.12)"
                stroke-width="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-pattern)" />
        </svg>
      </div>

      <!-- Pink radial glow -->
      <div class="marketing-hero__glow" aria-hidden="true"></div>

      <!-- Hero content -->
      <div class="marketing-hero__content">
        <h1 class="marketing-hero__title">BIGGER FIGHTS INCOMING</h1>
        <button
          type="button"
          class="marketing-hero__cta"
          @click="onPlayClick"
        >
          Play
        </button>
      </div>

    </section>

    <section class="marketing-about" ref="aboutRef">
      <div class="marketing-about__content" :class="{ 'is-visible': aboutVisible }">
        <h2 class="marketing-about__heading">NEVER GIVE UP</h2>
        <p class="marketing-about__subtitle">Train. Fight. Rise.</p>
      </div>
    </section>

    <section id="gameplay" class="marketing-gameplay" ref="gameplayRef">
      <div class="marketing-gameplay__inner" :class="{ 'is-visible': gameplayVisible }">
        <h2 class="marketing-gameplay__heading">GAMEPLAY</h2>
        <div class="marketing-gameplay__video">
          <!-- Faint hex pattern overlay on the placeholder surface -->
          <svg class="marketing-gameplay__pattern"
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 400 225"
               preserveAspectRatio="xMidYMid slice"
               aria-hidden="true">
            <defs>
              <pattern id="gameplay-hex-pattern" x="0" y="0" width="44" height="38" patternUnits="userSpaceOnUse">
                <polygon points="22,2 42,13 42,35 22,46 2,35 2,13"
                         fill="none"
                         stroke="rgba(255, 6, 111, 0.18)"
                         stroke-width="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gameplay-hex-pattern)" />
          </svg>

          <div class="marketing-gameplay__center">
            <svg class="marketing-gameplay__play-icon" viewBox="0 0 100 100" aria-hidden="true">
              <polygon points="50,4 92,28 92,72 50,96 8,72 8,28"
                       fill="#FF066F" />
              <polygon points="42,32 70,50 42,68" fill="#fff" />
            </svg>
            <p class="marketing-gameplay__placeholder">VIDEO INCOMING</p>
          </div>
        </div>
        <p class="marketing-gameplay__caption">
          First match recordings drop with the next release.
        </p>
      </div>
    </section>

    <section id="token" class="marketing-token" ref="tokenRef">
      <div class="marketing-token__inner" :class="{ 'is-visible': tokenVisible }">
        <h2 class="marketing-token__symbol">$HEX</h2>
        <p class="marketing-token__status">Coming Soon</p>
        <p class="marketing-token__network">Launching on Base</p>
      </div>
    </section>

    <section id="roadmap" class="marketing-roadmap" ref="roadmapRef">
      <div class="marketing-roadmap__inner" :class="{ 'is-visible': roadmapVisible }">
        <h2 class="marketing-roadmap__heading">ROADMAP</h2>
        <div class="marketing-roadmap__grid">
          <div class="marketing-roadmap__card">
            <span class="marketing-roadmap__card-num">01</span>
            <h3 class="marketing-roadmap__card-title">Phase 1</h3>
            <p class="marketing-roadmap__card-text">Coming soon</p>
          </div>
          <div class="marketing-roadmap__card">
            <span class="marketing-roadmap__card-num">02</span>
            <h3 class="marketing-roadmap__card-title">Phase 2</h3>
            <p class="marketing-roadmap__card-text">Coming soon</p>
          </div>
          <div class="marketing-roadmap__card">
            <span class="marketing-roadmap__card-num">03</span>
            <h3 class="marketing-roadmap__card-title">Phase 3</h3>
            <p class="marketing-roadmap__card-text">Coming soon</p>
          </div>
          <div class="marketing-roadmap__card">
            <span class="marketing-roadmap__card-num">04</span>
            <h3 class="marketing-roadmap__card-title">Phase 4</h3>
            <p class="marketing-roadmap__card-text">Coming soon</p>
          </div>
        </div>
      </div>
    </section>

    <section class="marketing-partners" ref="partnersRef">
      <div class="marketing-partners__inner" :class="{ 'is-visible': partnersVisible }">
        <h2 class="marketing-partners__heading">COMING SOON</h2>
        <p class="marketing-partners__subtitle">Strategic partnerships TBA</p>
      </div>
    </section>

    <section class="marketing-subscribe" ref="subscribeRef">
      <div class="marketing-subscribe__inner" :class="{ 'is-visible': subscribeVisible }">
        <h2 class="marketing-subscribe__heading">STAY UPDATED</h2>
        <form class="marketing-subscribe__form" @submit.prevent="onSubscribeSubmit">
          <input
            v-model="email"
            type="email"
            required
            placeholder="Enter your email"
            class="marketing-subscribe__input"
            :disabled="isSubmitting"
            autocomplete="email"
          />
          <button
            type="submit"
            class="marketing-subscribe__button"
            :disabled="isSubmitting"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>

    <footer class="marketing-footer" ref="footerRef">
      <ul class="marketing-footer__socials" aria-label="Social media">
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="Telegram">
            <img :src="iconTelega" alt="" class="marketing-footer__social-icon" />
          </a>
        </li>
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="X (Twitter)">
            <img :src="iconX" alt="" class="marketing-footer__social-icon" />
          </a>
        </li>
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="YouTube">
            <img :src="iconYout" alt="" class="marketing-footer__social-icon" />
          </a>
        </li>
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="Discord">
            <img :src="iconDisc" alt="" class="marketing-footer__social-icon" />
          </a>
        </li>
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="Instagram">
            <img :src="iconInsta" alt="" class="marketing-footer__social-icon" />
          </a>
        </li>
      </ul>
      <nav class="marketing-footer__links">
        <router-link to="/privacy" class="marketing-footer__link">Privacy</router-link>
        <span class="marketing-footer__sep" aria-hidden="true">·</span>
        <router-link to="/play/rules" class="marketing-footer__link">Rules</router-link>
        <span class="marketing-footer__sep" aria-hidden="true">·</span>
        <router-link to="/help" class="marketing-footer__link">Help</router-link>
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
import logoSrc from '@/assets/images/hexlash-logo.jpg';
import iconTelega from '@/assets/images/icon_telega.svg';
import iconX from '@/assets/images/icon_x.svg';
import iconYout from '@/assets/images/icon_yout.svg';
import iconDisc from '@/assets/images/icon_disc.svg';
import iconInsta from '@/assets/images/icon_insta.svg';

const router = useRouter();
const store = useStore();

const heroRef = ref(null);
const aboutRef = ref(null);
const gameplayRef = ref(null);
const tokenRef = ref(null);
const roadmapRef = ref(null);
const partnersRef = ref(null);
const subscribeRef = ref(null);
const footerRef = ref(null);

// 8c C1 — IntersectionObserver fade-in via composable (refactored from
// 8b inline pattern). Threshold 0.3 matches 8b verbatim. Native API,
// one-shot disconnect, fallback to immediate visibility for environments
// without IntersectionObserver. Future 8c sections (Gameplay/Token/
// Roadmap/Partners/Subscribe) will reuse the same composable to avoid
// 5x duplication of ~28-line inline observer setup.
const { visible: aboutVisible } = useScrollFadeIn(aboutRef);
const { visible: gameplayVisible } = useScrollFadeIn(gameplayRef);
const { visible: tokenVisible } = useScrollFadeIn(tokenRef);
const { visible: roadmapVisible } = useScrollFadeIn(roadmapRef);
const { visible: partnersVisible } = useScrollFadeIn(partnersRef);
const { visible: subscribeVisible } = useScrollFadeIn(subscribeRef);

// Subscribe form state
const email = ref('');
const isSubmitting = ref(false);

function onSubscribeSubmit() {
  if (isSubmitting.value || !email.value) return;

  isSubmitting.value = true;

  // Reuse existing global toast via Vuex mutation (Phase 0 §S1.4 verified —
  // `<Info>` component renders on / route via App.vue:19 `!isPlayRoute` block).
  // Lesson #11 catch: setInfoMessage is MUTATION not ACTION — use commit.
  // Lesson #11 catch: plain object literal pattern (mirrors ChallengeNotification
  // precedent) — InfoMessageModel.withText also works but adds import.
  store.commit('master/setInfoMessage', {
    text: 'Coming soon — stay tuned!',
    timeout: 3000,
    showButton: false,
  });

  // Clear field after submit (signals success per decision #8)
  email.value = '';

  // Re-enable button after debounce window (per decision #9, ~600ms)
  setTimeout(() => {
    isSubmitting.value = false;
  }, 600);
}

useDocumentMeta({
  title: 'Hexlash',
  description: 'Hexlash — Web3 fighting game. Train your AI agent. Fight in the underground octagon.',
  ogImage: logoSrc,
});

function onPlayClick() {
  // Decision #11 Option A — preserve 1a beforeEnter cascade pattern.
  // / route handles authed → /play; anonymous never reach this CTA via cascade,
  // but if they do click while anonymous, push to signup directly.
  router.push('/auth/signup');
}

// Sticky header — transparent on hero, dark + blur after 50px scroll.
const isHeaderScrolled = ref(false);
function handleScroll() {
  isHeaderScrolled.value = window.scrollY > 50;
}

// Anchor scroll with offset to account for the ~80px sticky header
// (otherwise section heading hides under the bar). Mobile header is
// ~64px — 80 over-offsets by ~16px on mobile, which still reads OK.
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
  // Run once in case page loads with restored scroll position
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.marketing {
  background: var(--hex-bg-dark);
  color: var(--hex-text-primary);
  overflow-x: hidden;
}

/* ============================================
   HEADER (sticky, transparent on hero)
   Added 2026-05-21 (claude/landing-refresh).
   ============================================ */
.marketing-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom: 1px solid transparent;
  transition: background-color 0.2s ease, backdrop-filter 0.2s ease, border-color 0.2s ease;
}

.marketing-header.is-scrolled {
  background: rgba(9, 9, 9, 0.78);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom-color: rgba(255, 255, 255, 0.05);
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
  height: 80px;
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
  font-family: var(--hex-font-body);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: color 0.15s ease;
  cursor: pointer;
}

.marketing-header__navlink:hover {
  color: var(--hex-primary);
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
  color: rgba(255, 255, 255, 0.85);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.marketing-header__social:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.marketing-header__social img {
  width: 28px;
  height: 28px;
  user-select: none;
  -webkit-user-drag: none;
}

@media (max-width: 720px) {
  .marketing-header__inner {
    grid-template-columns: auto 1fr auto;
    gap: 14px;
    padding: 0 20px;
  }
  .marketing-header__nav {
    gap: 24px;
  }
  .marketing-header__navlink {
    font-size: 14px;
    letter-spacing: 0.06em;
  }
  .marketing-header__logo {
    height: 64px;
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

@media (max-width: 420px) {
  .marketing-header__nav {
    gap: 16px;
  }
  .marketing-header__navlink {
    font-size: 12px;
    letter-spacing: 0.04em;
  }
}

.marketing-hero,
.marketing-about,
.marketing-gameplay,
.marketing-token,
.marketing-roadmap,
.marketing-partners,
.marketing-subscribe,
.marketing-footer {
  position: relative;
  width: 100%;
}

.marketing-hero {
  min-height: 100vh;
  min-height: 100dvh;
}

.marketing-about {
  min-height: 60vh;
  padding: 80px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hex-bg-dark);
}

/* === ABOUT === */
.marketing-about__content {
  text-align: center;
  max-width: 800px;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.marketing-about__content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.marketing-about__heading {
  margin: 0 0 16px;
  font-size: clamp(40px, 7vw, 80px);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  line-height: 1.1;
}

.marketing-about__subtitle {
  margin: 0;
  font-size: clamp(16px, 2vw, 22px);
  color: var(--hex-text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

@media (max-width: 480px) {
  .marketing-about {
    padding: 60px 20px;
  }
}

/* === GAMEPLAY === */
.marketing-gameplay {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hex-bg-dark);
  padding: 80px 24px;
}

.marketing-gameplay__inner {
  width: 100%;
  max-width: 1100px;
  text-align: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.marketing-gameplay__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.marketing-gameplay__heading {
  margin: 0 0 32px;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--hex-text-primary);
  text-transform: uppercase;
}

.marketing-gameplay__video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--hex-bg-medium);
  border: 1px solid rgba(255, 6, 111, 0.4);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 64px rgba(255, 6, 111, 0.1);
}

.marketing-gameplay__pattern {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.marketing-gameplay__center {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.marketing-gameplay__play-icon {
  width: 92px;
  height: 92px;
  display: block;
  filter: drop-shadow(0 0 22px rgba(255, 6, 111, 0.55));
}

.marketing-gameplay__placeholder {
  margin: 0;
  font-family: var(--hex-font-body);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.30em;
  text-transform: uppercase;
  color: #fff;
}

.marketing-gameplay__caption {
  margin: 24px 0 0;
  font-size: clamp(13px, 1.4vw, 15px);
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.05em;
  text-align: center;
}

@media (max-width: 480px) {
  .marketing-gameplay {
    padding: 60px 16px;
  }
  .marketing-gameplay__heading {
    margin-bottom: 24px;
  }
  .marketing-gameplay__play-icon {
    width: 72px;
    height: 72px;
  }
  .marketing-gameplay__placeholder {
    font-size: 12px;
    letter-spacing: 0.25em;
  }
  .marketing-gameplay__center {
    gap: 16px;
  }
}

/* === TOKEN === */
.marketing-token {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hex-bg-dark);
  padding: 100px 24px;
  overflow: hidden;
}

.marketing-token::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 6, 111, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.marketing-token__inner {
  position: relative;
  text-align: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
  z-index: 1;
}

.marketing-token__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.marketing-token__symbol {
  margin: 0 0 16px;
  font-family: var(--hex-font-display, 'Impact', sans-serif);
  font-size: clamp(72px, 14vw, 180px);
  font-weight: 900;
  letter-spacing: 0.02em;
  color: var(--hex-text-primary);
  line-height: 1;
  text-shadow: 0 0 48px rgba(255, 6, 111, 0.4);
}

.marketing-token__status {
  margin: 0 0 12px;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 600;
  color: var(--hex-primary);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.marketing-token__network {
  margin: 0;
  font-size: clamp(14px, 1.5vw, 16px);
  color: var(--hex-text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

@media (max-width: 480px) {
  .marketing-token {
    padding: 80px 16px;
  }
}

/* === ROADMAP === */
.marketing-roadmap {
  background: var(--hex-bg-dark);
  padding: 100px 24px;
}

.marketing-roadmap__inner {
  max-width: 1200px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.marketing-roadmap__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.marketing-roadmap__heading {
  margin: 0 0 56px;
  text-align: center;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--hex-text-primary);
  text-transform: uppercase;
}

.marketing-roadmap__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.marketing-roadmap__card {
  padding: 32px 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--hex-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.marketing-roadmap__card:hover {
  border-color: rgba(255, 6, 111, 0.3);
  transform: translateY(-4px);
}

.marketing-roadmap__card-num {
  font-family: var(--hex-font-display, 'Impact', sans-serif);
  font-size: 48px;
  font-weight: 900;
  color: var(--hex-primary);
  opacity: 0.5;
  line-height: 1;
  margin-bottom: 16px;
}

.marketing-roadmap__card-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.marketing-roadmap__card-text {
  margin: 0;
  font-size: 14px;
  color: var(--hex-text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Tablet: 4 → 2 cards per row */
@media (max-width: 900px) {
  .marketing-roadmap__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile: 2 → 1 card per row */
@media (max-width: 480px) {
  .marketing-roadmap {
    padding: 80px 16px;
  }
  .marketing-roadmap__grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .marketing-roadmap__heading {
    margin-bottom: 40px;
  }
}

/* === PARTNERS === */
.marketing-partners {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hex-bg-dark);
  padding: 100px 24px;
}

.marketing-partners__inner {
  text-align: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.marketing-partners__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.marketing-partners__heading {
  margin: 0 0 16px;
  font-size: clamp(40px, 7vw, 80px);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  line-height: 1.1;
}

.marketing-partners__subtitle {
  margin: 0;
  font-size: clamp(16px, 2vw, 22px);
  color: var(--hex-text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

@media (max-width: 480px) {
  .marketing-partners {
    padding: 80px 16px;
  }
}

/* === SUBSCRIBE === */
.marketing-subscribe {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hex-bg-dark);
  padding: 100px 24px;
}

.marketing-subscribe__inner {
  text-align: center;
  width: 100%;
  max-width: 600px;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.marketing-subscribe__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.marketing-subscribe__heading {
  margin: 0 0 32px;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--hex-text-primary);
  text-transform: uppercase;
}

.marketing-subscribe__form {
  display: flex;
  gap: 12px;
  align-items: stretch;
  max-width: 480px;
  margin: 0 auto;
}

.marketing-subscribe__input {
  flex: 1;
  font-family: inherit;
  font-size: 14px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--hex-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
  color: var(--hex-text-primary);
  transition: border-color 0.15s ease, background 0.15s ease;
  min-width: 0; /* allow flex shrink */
}

.marketing-subscribe__input::placeholder {
  color: var(--hex-text-muted);
}

.marketing-subscribe__input:focus {
  outline: none;
  border-color: var(--hex-primary);
  background: rgba(255, 255, 255, 0.06);
}

.marketing-subscribe__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Subscribe CTA — mirrors 8b Hero CTA aesthetic (custom scoped per
   Phase 0 §S3.3 + Lesson #11 catch: .hex-button does NOT exist,
   global classes are .hex-btn / .hex-btn-primary). 8b Hero CTA
   precedent: scoped custom for fine-grained marketing-specific control. */
.marketing-subscribe__button {
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 12px 32px;
  background: var(--hex-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 0 24px rgba(255, 6, 111, 0.4);
  white-space: nowrap;
}

.marketing-subscribe__button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 32px rgba(255, 6, 111, 0.6);
}

.marketing-subscribe__button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 0 16px rgba(255, 6, 111, 0.3);
}

.marketing-subscribe__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Mobile: stack form vertically */
@media (max-width: 480px) {
  .marketing-subscribe {
    padding: 80px 16px;
  }
  .marketing-subscribe__form {
    flex-direction: column;
    gap: 10px;
  }
  .marketing-subscribe__heading {
    margin-bottom: 24px;
  }
}

.marketing-footer {
  padding: 40px 24px 24px;
  border-top: 1px solid var(--hex-border-default, rgba(255, 255, 255, 0.06));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background: var(--hex-bg-dark);
}

/* === FOOTER === */
.marketing-footer__socials {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 24px;
  align-items: center;
}

.marketing-footer__socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  opacity: 0.6;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.marketing-footer__socials a:hover {
  opacity: 1;
  transform: translateY(-2px);
}

.marketing-footer__social-icon {
  width: 22px;
  height: 22px;
  user-select: none;
  -webkit-user-drag: none;
}

.marketing-footer__links {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: var(--hex-text-muted);
}

.marketing-footer__link {
  color: var(--hex-text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.marketing-footer__link:hover {
  color: var(--hex-text-primary);
}

.marketing-footer__sep {
  opacity: 0.5;
}

@media (max-width: 480px) {
  .marketing-footer {
    padding: 32px 16px 24px;
  }
  .marketing-footer__socials {
    gap: 16px;
  }
}

/* === HERO === */
.marketing-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--hex-bg-dark);
}

.marketing-hero__hex-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.5;
  animation: hex-drift 60s linear infinite;
}

.marketing-hero__hex-svg {
  width: 120%;
  height: 120%;
  position: absolute;
  top: -10%;
  left: -10%;
}

.marketing-hero__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(400px, 60vw, 900px);
  height: clamp(400px, 60vw, 900px);
  background: radial-gradient(
    circle at center,
    rgba(255, 6, 111, 0.15) 0%,
    rgba(255, 6, 111, 0.05) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
  animation: marketing-glow-pulse 8s ease-in-out infinite;
}

.marketing-hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 24px;
}

/* Hero centerpiece: large title, single sans-serif, soft pink glow
   (text-shadow only — NO background on characters, no plaque effect). */
.marketing-hero__title {
  margin: 0;
  font-family: var(--hex-font-body);
  font-size: clamp(40px, 6.5vw, 80px);
  font-weight: 800;
  line-height: 1;
  color: #fff;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  text-shadow:
    0 0 18px rgba(255, 6, 111, 0.35),
    0 0 48px rgba(255, 6, 111, 0.15);
  background: transparent;
  max-width: 18ch;
}

.marketing-hero__cta {
  font-family: inherit;
  font-size: clamp(16px, 1.8vw, 18px);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 16px 56px;
  background: var(--hex-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 0 32px rgba(255, 6, 111, 0.5);
  min-width: 200px;
}

.marketing-hero__cta:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 48px rgba(255, 6, 111, 0.7);
}

.marketing-hero__cta:active {
  transform: translateY(0) scale(1);
  box-shadow: 0 0 24px rgba(255, 6, 111, 0.4);
}

/* Hero animations (scoped — prefixed to avoid global @keyframes collisions) */
@keyframes hex-drift {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-40px, -35px); }
}

@keyframes marketing-glow-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Mobile */
@media (max-width: 480px) {
  .marketing-hero__content {
    gap: 24px;
  }
  .marketing-hero__cta {
    padding: 14px 40px;
    min-width: 160px;
  }
}

/* Accessibility: respect prefers-reduced-motion for the hero background
   animations (hex drift + glow pulse). Users who request reduced motion
   see the static composition without any background movement. */
@media (prefers-reduced-motion: reduce) {
  .marketing-hero__hex-bg,
  .marketing-hero__glow,
  .marketing-header {
    animation: none !important;
    transition: none !important;
  }
}
</style>
