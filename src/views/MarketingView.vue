<template>
  <div class="marketing">
    <!-- ============================================
         HEADER (sticky)
         ============================================ -->
    <header class="m-header" :class="{ 'is-scrolled': isScrolled }">
      <div class="m-header__inner">
        <a href="#hero" class="m-header__brand" @click.prevent="scrollToTop" aria-label="Hexlash">
          <svg class="m-header__brand-icon" viewBox="0 0 100 100" aria-hidden="true">
            <polygon points="50,4 92,28 92,72 50,96 8,72 8,28"
                     fill="var(--hex-primary)"
                     stroke="var(--hex-primary-light)"
                     stroke-width="2" />
            <polygon points="50,18 80,35 80,65 50,82 20,65 20,35"
                     fill="none"
                     stroke="rgba(255,255,255,0.35)"
                     stroke-width="1.5" />
          </svg>
        </a>

        <nav class="m-header__nav">
          <a href="#gameplay" class="m-header__navlink" @click.prevent="scrollTo('gameplay')">{{ t.marketing.nav.gameplay }}</a>
          <a href="#token" class="m-header__navlink" @click.prevent="scrollTo('token')">{{ t.marketing.nav.token }}</a>
          <a href="#roadmap" class="m-header__navlink" @click.prevent="scrollTo('roadmap')">{{ t.marketing.nav.roadmap }}</a>
        </nav>

        <div class="m-header__right">
          <span class="m-chip">
            <span class="m-chip__dot" aria-hidden="true"></span>
            <span>{{ t.marketing.nav.onBase }}</span>
          </span>
          <a href="#" target="_blank" rel="noopener" aria-label="Discord" class="m-header__social">
            <img :src="iconDisc" alt="" />
          </a>
          <a href="#" target="_blank" rel="noopener" aria-label="X (Twitter)" class="m-header__social">
            <img :src="iconX" alt="" />
          </a>
        </div>
      </div>
    </header>

    <!-- ============================================
         HERO
         ============================================ -->
    <section id="hero" class="m-hero">
      <!-- Hex grid floor in perspective -->
      <div class="m-hero__floor" aria-hidden="true">
        <div class="m-hero__floor-plane">
          <svg class="m-hero__floor-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="m-hero-hex-pattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon points="30,1 58,16 58,46 30,61 2,46 2,16"
                         fill="none"
                         stroke="rgba(255, 6, 111, 0.32)"
                         stroke-width="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#m-hero-hex-pattern)" />
          </svg>
        </div>
        <div class="m-hero__floor-fade"></div>
      </div>

      <!-- Single pink glow (the one allowed accent of the hero) -->
      <div class="m-hero__glow" aria-hidden="true"></div>

      <div class="m-hero__content">
        <div class="m-hero__logo-wrap">
          <img :src="logoSrc" alt="Hexlash" class="m-hero__logo" draggable="false" />
        </div>

        <h1 class="m-hero__title">{{ t.marketing.hero.title }}</h1>

        <button type="button" class="m-hero__cta" @click="onPlayClick">
          <span>{{ t.marketing.hero.play }}</span>
          <span class="m-hero__cta-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>

    <!-- ============================================
         GAMEPLAY
         ============================================ -->
    <section id="gameplay" class="m-section m-gameplay">
      <div class="m-section__inner" ref="gameplayRef" :class="{ 'is-visible': gameplayVisible }">
        <p class="m-section__kicker">{{ t.marketing.gameplay.kicker }}</p>
        <h2 class="m-section__heading">{{ t.marketing.gameplay.heading }}</h2>
        <p class="m-section__subtitle">{{ t.marketing.gameplay.subtitle }}</p>

        <div class="m-gameplay__video">
          <div class="m-gameplay__rec-tag">
            <span class="m-gameplay__rec-dot" aria-hidden="true"></span>
            <span>{{ t.marketing.gameplay.recTag }}</span>
          </div>

          <svg class="m-gameplay__pattern" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <pattern id="m-gp-hex" x="0" y="0" width="40" height="35" patternUnits="userSpaceOnUse">
                <polygon points="20,2 38,12 38,32 20,42 2,32 2,12"
                         fill="none"
                         stroke="rgba(255, 6, 111, 0.18)"
                         stroke-width="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#m-gp-hex)" />
          </svg>

          <div class="m-gameplay__center">
            <button type="button" class="m-gameplay__play-btn" aria-label="Play preview" disabled>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <polygon points="50,4 92,28 92,72 50,96 8,72 8,28"
                         fill="var(--hex-primary)" />
                <polygon points="42,32 70,50 42,68" fill="#fff" />
              </svg>
            </button>
            <p class="m-gameplay__placeholder">{{ t.marketing.gameplay.videoLabel }}</p>
          </div>
        </div>

        <p class="m-gameplay__caption">{{ t.marketing.gameplay.caption }}</p>
      </div>
    </section>

    <!-- ============================================
         $HEX TOKEN
         ============================================ -->
    <section id="token" class="m-section m-token">
      <div class="m-token__grid" ref="tokenRef" :class="{ 'is-visible': tokenVisible }">
        <div class="m-token__visual">
          <svg class="m-token__hex" viewBox="0 0 240 240" aria-hidden="true">
            <polygon points="120,6 210,57 210,159 120,210 30,159 30,57"
                     fill="none"
                     stroke="var(--hex-primary)"
                     stroke-width="1.5"
                     opacity="0.55" />
            <polygon points="120,28 192,68 192,148 120,188 48,148 48,68"
                     fill="none"
                     stroke="var(--hex-primary)"
                     stroke-width="1"
                     opacity="0.3" />
            <polygon points="120,50 172,80 172,140 120,170 68,140 68,80"
                     fill="rgba(255, 6, 111, 0.06)"
                     stroke="var(--hex-primary)"
                     stroke-width="1"
                     opacity="0.6" />
            <text x="120" y="118" text-anchor="middle" class="m-token__hex-symbol">$HEX</text>
            <text x="120" y="146" text-anchor="middle" class="m-token__hex-sub">UTILITY · BASE</text>
          </svg>
          <div class="m-token__visual-glow" aria-hidden="true"></div>
        </div>

        <div class="m-token__copy">
          <p class="m-section__kicker">{{ t.marketing.token.kicker }}</p>
          <h2 class="m-token__heading">
            <span>{{ t.marketing.token.headingPart1 }}</span>
            <span class="m-token__heading-accent">{{ t.marketing.token.headingAccent }}</span>
            <span>{{ t.marketing.token.headingPart2 }}</span>
          </h2>
          <p class="m-token__para">{{ t.marketing.token.para1 }}</p>
          <p class="m-token__para">{{ t.marketing.token.para2 }}</p>
          <a href="#" class="m-token__learn-more" @click.prevent="onLearnMoreClick">{{ t.marketing.token.learnMore }}</a>
        </div>
      </div>
    </section>

    <!-- ============================================
         ROADMAP
         ============================================ -->
    <section id="roadmap" class="m-section m-roadmap">
      <div class="m-section__inner" ref="roadmapRef" :class="{ 'is-visible': roadmapVisible }">
        <p class="m-section__kicker">{{ t.marketing.roadmap.kicker }}</p>
        <h2 class="m-section__heading">{{ t.marketing.roadmap.heading }}</h2>
        <p class="m-section__subtitle">{{ t.marketing.roadmap.subtitle }}</p>

        <ol class="m-roadmap__track">
          <!-- Phase 01 — DONE -->
          <li class="m-roadmap__node m-roadmap__node--done">
            <div class="m-roadmap__hex-wrap">
              <svg class="m-roadmap__hex" viewBox="0 0 120 120" aria-hidden="true">
                <polygon points="60,4 110,32 110,88 60,116 10,88 10,32"
                         fill="rgba(255, 255, 255, 0.04)"
                         stroke="rgba(255, 255, 255, 0.25)"
                         stroke-width="1.2" />
                <polyline points="42,62 56,78 80,46"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.7)"
                          stroke-width="3"
                          stroke-linecap="round"
                          stroke-linejoin="round" />
              </svg>
            </div>
            <span class="m-roadmap__num">01</span>
            <span class="m-roadmap__name" v-html="formatPhaseName(t.marketing.roadmap.phase1Name)"></span>
            <span class="m-roadmap__status">{{ t.marketing.roadmap.phase1Status }}</span>
          </li>

          <!-- Connector line between 01 and 02 — solid pink (path-done) -->
          <li class="m-roadmap__connector m-roadmap__connector--active" aria-hidden="true">
            <span class="m-roadmap__connector-line"></span>
          </li>

          <!-- Phase 02 — IN PROGRESS (the ONE glow) -->
          <li class="m-roadmap__node m-roadmap__node--active">
            <div class="m-roadmap__hex-wrap m-roadmap__hex-wrap--glow">
              <svg class="m-roadmap__hex" viewBox="0 0 120 120" aria-hidden="true">
                <polygon points="60,4 110,32 110,88 60,116 10,88 10,32"
                         fill="var(--hex-primary)"
                         stroke="var(--hex-primary-light)"
                         stroke-width="1.5" />
                <polygon points="60,24 92,42 92,78 60,96 28,78 28,42"
                         fill="none"
                         stroke="rgba(255, 255, 255, 0.3)"
                         stroke-width="1" />
              </svg>
            </div>
            <span class="m-roadmap__num">02</span>
            <span class="m-roadmap__name" v-html="formatPhaseName(t.marketing.roadmap.phase2Name)"></span>
            <span class="m-roadmap__status m-roadmap__status--active">
              <span class="m-roadmap__status-dot" aria-hidden="true"></span>{{ t.marketing.roadmap.phase2Status }}
            </span>
          </li>

          <!-- Connector line between 02 and 03 — dashed white -->
          <li class="m-roadmap__connector" aria-hidden="true">
            <span class="m-roadmap__connector-line m-roadmap__connector-line--dashed"></span>
          </li>

          <!-- Phase 03 — NEXT -->
          <li class="m-roadmap__node m-roadmap__node--next">
            <div class="m-roadmap__hex-wrap">
              <svg class="m-roadmap__hex" viewBox="0 0 120 120" aria-hidden="true">
                <polygon points="60,4 110,32 110,88 60,116 10,88 10,32"
                         fill="none"
                         stroke="rgba(255, 255, 255, 0.45)"
                         stroke-width="1.2"
                         stroke-dasharray="6 4" />
              </svg>
            </div>
            <span class="m-roadmap__num">03</span>
            <span class="m-roadmap__name" v-html="formatPhaseName(t.marketing.roadmap.phase3Name)"></span>
            <span class="m-roadmap__status">{{ t.marketing.roadmap.phase3Status }}</span>
          </li>

          <!-- Connector line between 03 and 04 — dashed muted -->
          <li class="m-roadmap__connector" aria-hidden="true">
            <span class="m-roadmap__connector-line m-roadmap__connector-line--dashed m-roadmap__connector-line--muted"></span>
          </li>

          <!-- Phase 04 — LATER -->
          <li class="m-roadmap__node m-roadmap__node--later">
            <div class="m-roadmap__hex-wrap">
              <svg class="m-roadmap__hex" viewBox="0 0 120 120" aria-hidden="true">
                <polygon points="60,4 110,32 110,88 60,116 10,88 10,32"
                         fill="none"
                         stroke="rgba(255, 255, 255, 0.18)"
                         stroke-width="1" />
              </svg>
            </div>
            <span class="m-roadmap__num">04</span>
            <span class="m-roadmap__name" v-html="formatPhaseName(t.marketing.roadmap.phase4Name)"></span>
            <span class="m-roadmap__status m-roadmap__status--muted">{{ t.marketing.roadmap.phase4Status }}</span>
          </li>
        </ol>
      </div>
    </section>

    <!-- ============================================
         SUBSCRIBE
         ============================================ -->
    <section id="subscribe" class="m-section m-subscribe">
      <div class="m-subscribe__inner" ref="subscribeRef" :class="{ 'is-visible': subscribeVisible }">
        <h2 class="m-subscribe__heading">{{ t.marketing.subscribe.heading }}</h2>
        <p class="m-subscribe__subtitle">{{ t.marketing.subscribe.subtitle }}</p>

        <form class="m-subscribe__form" @submit.prevent="onSubscribeSubmit">
          <input
            v-model="email"
            type="email"
            required
            :placeholder="t.marketing.subscribe.placeholder"
            class="m-subscribe__input"
            :disabled="isSubmitting"
            autocomplete="email"
            aria-label="Email"
          />
          <button
            type="submit"
            class="m-subscribe__btn"
            :disabled="isSubmitting"
          >
            {{ t.marketing.subscribe.button }}
          </button>
        </form>

        <p class="m-subscribe__fine">{{ t.marketing.subscribe.fine }}</p>
      </div>
    </section>

    <!-- ============================================
         FOOTER
         ============================================ -->
    <footer class="m-footer">
      <div class="m-footer__inner">
        <div class="m-footer__top">
          <div class="m-footer__brand-col">
            <a href="#hero" class="m-footer__brand" @click.prevent="scrollToTop" aria-label="Hexlash">
              <svg class="m-footer__brand-icon" viewBox="0 0 100 100" aria-hidden="true">
                <polygon points="50,4 92,28 92,72 50,96 8,72 8,28"
                         fill="var(--hex-primary)" />
              </svg>
              <span class="m-footer__brand-text">HEXLASH</span>
            </a>
            <p class="m-footer__tagline">{{ t.marketing.footer.tagline }}</p>
          </div>

          <div class="m-footer__cols">
            <div class="m-footer__col">
              <h3 class="m-footer__col-title">{{ t.marketing.footer.colGame }}</h3>
              <a class="m-footer__link" href="#" @click.prevent="onPlayClick">{{ t.marketing.footer.linkPlay }}</a>
              <a class="m-footer__link" href="#gameplay" @click.prevent="scrollTo('gameplay')">{{ t.marketing.footer.linkGameplay }}</a>
            </div>
            <div class="m-footer__col">
              <h3 class="m-footer__col-title">{{ t.marketing.footer.colToken }}</h3>
              <a class="m-footer__link" href="#token" @click.prevent="scrollTo('token')">{{ t.marketing.footer.linkToken }}</a>
            </div>
            <div class="m-footer__col">
              <h3 class="m-footer__col-title">{{ t.marketing.footer.colSupport }}</h3>
              <router-link to="/help" class="m-footer__link">{{ t.marketing.footer.linkHelp }}</router-link>
              <router-link to="/privacy" class="m-footer__link">{{ t.marketing.footer.linkPrivacy }}</router-link>
              <router-link to="/rules" class="m-footer__link">{{ t.marketing.footer.linkTerms }}</router-link>
            </div>
          </div>
        </div>

        <div class="m-footer__bottom">
          <p class="m-footer__copy">{{ t.marketing.footer.copyright }}</p>
          <ul class="m-footer__socials" aria-label="Social media">
            <li><a href="#" target="_blank" rel="noopener" aria-label="Telegram"><img :src="iconTelega" alt="" /></a></li>
            <li><a href="#" target="_blank" rel="noopener" aria-label="X (Twitter)"><img :src="iconX" alt="" /></a></li>
            <li><a href="#" target="_blank" rel="noopener" aria-label="YouTube"><img :src="iconYout" alt="" /></a></li>
            <li><a href="#" target="_blank" rel="noopener" aria-label="Discord"><img :src="iconDisc" alt="" /></a></li>
            <li><a href="#" target="_blank" rel="noopener" aria-label="Instagram"><img :src="iconInsta" alt="" /></a></li>
          </ul>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { t } from '@/locales/index.js';
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

// Scroll-fade-in refs for sections (composable preserved from 8c precedent)
const gameplayRef = ref(null);
const tokenRef = ref(null);
const roadmapRef = ref(null);
const subscribeRef = ref(null);

const { visible: gameplayVisible } = useScrollFadeIn(gameplayRef);
const { visible: tokenVisible } = useScrollFadeIn(tokenRef);
const { visible: roadmapVisible } = useScrollFadeIn(roadmapRef);
const { visible: subscribeVisible } = useScrollFadeIn(subscribeRef);

// Sticky header: add subtle bg/border when scrolled past hero
const isScrolled = ref(false);
function handleScroll() {
  isScrolled.value = window.scrollY > 40;
}

// Subscribe form
const email = ref('');
const isSubmitting = ref(false);

function onSubscribeSubmit() {
  if (isSubmitting.value || !email.value) return;
  isSubmitting.value = true;

  // Placeholder handler: existing Vuex toast mechanism (8b/8c precedent).
  // Real email-collection backend is a carry-over (Mailchimp / SendGrid /
  // in-house — owner decision). See final report §Open questions.
  store.commit('master/setInfoMessage', {
    text: t.value.marketing.subscribe.toast,
    timeout: 3000,
    showButton: false,
  });

  email.value = '';
  setTimeout(() => {
    isSubmitting.value = false;
  }, 600);
}

function onPlayClick() {
  // Preserve current behavior: anonymous Play → signup flow (1a precedent,
  // 8b decision #11 Option A). Authed users never reach this view because
  // router beforeEnter on `/` redirects them to /play.
  router.push('/auth/signup');
}

function onLearnMoreClick() {
  // No dedicated $HEX info page yet — scroll to token section as fallback.
  // Real link target is a carry-over (tokenomics page / litepaper).
  scrollTo('token');
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Sticky header is ~64px tall — offset so target is not hidden behind it.
  const headerOffset = 64;
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top, behavior: 'smooth' });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Format roadmap phase name: split on last space → two lines (matches the
// prototype's stacked layout, e.g. "CORE\nCOMBAT"). Safe input — i18n key,
// no user data.
function formatPhaseName(name) {
  if (!name) return '';
  const idx = name.lastIndexOf(' ');
  if (idx === -1) return name;
  return name.slice(0, idx) + '<br>' + name.slice(idx + 1);
}

useDocumentMeta({
  title: 'Hexlash',
  description: 'Hexlash — Web3 fighting game on Base. Turn-based combat on a hex arena. Train your AI agent. Fight in the underground octagon.',
  ogImage: logoSrc,
});

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  // Run once in case page loads scrolled (e.g. browser restored position)
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* ============================================
   ROOT + UTILITY
   ============================================ */
.marketing {
  background: var(--hex-bg-dark);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

/* Typography hierarchy uses a single sans-serif (var(--hex-font-body))
   throughout — size, weight, and letter-spacing carry the visual hierarchy.
   The Anonymous pixel font is intentionally NOT used on the landing.
   It remains available globally for other parts of the app. */

/* ============================================
   HEADER (sticky)
   ============================================ */
.m-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: rgba(9, 9, 9, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.m-header.is-scrolled {
  background: rgba(9, 9, 9, 0.85);
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.m-header__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
}

/* Brand: small hex icon + HEXLASH wordmark */
.m-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--hex-text-primary);
  -webkit-user-drag: none;
}

.m-header__brand-icon {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 0 6px rgba(255, 6, 111, 0.5));
}

/* Nav center — system sans-serif, uppercase, medium weight */
.m-header__nav {
  display: flex;
  justify-content: center;
  gap: 36px;
}

.m-header__navlink {
  font-family: var(--hex-font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
  cursor: pointer;
}

.m-header__navlink:hover {
  color: var(--hex-text-primary);
}

/* Right cluster: chip + social icons */
.m-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.m-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  font-family: var(--hex-font-body);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
  border: 1px solid var(--hex-border-default);
  border-radius: 999px;
  background: transparent;
  white-space: nowrap;
}

.m-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hex-text-secondary);
  flex-shrink: 0;
}

.m-header__social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  opacity: 0.6;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.m-header__social:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.05);
}

.m-header__social img {
  width: 16px;
  height: 16px;
  user-select: none;
  -webkit-user-drag: none;
}

@media (max-width: 720px) {
  .m-header__nav {
    display: none;
  }
  .m-header__inner {
    grid-template-columns: 1fr auto;
    gap: 16px;
    padding: 14px 16px;
  }
  .m-chip {
    padding: 5px 10px;
    font-size: 10px;
  }
}

/* ============================================
   HERO
   ============================================ */
.m-hero {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--hex-bg-dark);
  padding: 60px 24px 80px;
}

/* Hex grid floor with CSS perspective */
.m-hero__floor {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200%;
  height: 60%;
  perspective: 600px;
  perspective-origin: 50% 0%;
  pointer-events: none;
  z-index: 0;
}

.m-hero__floor-plane {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotateX(60deg);
  transform-origin: 50% 100%;
}

.m-hero__floor-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Fade horizon → smooth blend into dark bg */
.m-hero__floor-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    var(--hex-bg-dark) 0%,
    rgba(9, 9, 9, 0.85) 30%,
    rgba(9, 9, 9, 0.2) 70%,
    transparent 100%
  );
  pointer-events: none;
}

/* The single allowed pink glow of the hero */
.m-hero__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(360px, 60vw, 800px);
  height: clamp(360px, 60vw, 800px);
  background: radial-gradient(
    circle at center,
    rgba(255, 6, 111, 0.22) 0%,
    rgba(255, 6, 111, 0.08) 30%,
    transparent 65%
  );
  pointer-events: none;
  z-index: 1;
  animation: m-glow-pulse 6s ease-in-out infinite;
}

@keyframes m-glow-pulse {
  0%, 100% { opacity: 0.85; }
  50%      { opacity: 1; }
}

.m-hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  max-width: 720px;
  text-align: center;
}

.m-hero__logo-wrap {
  position: relative;
  width: clamp(140px, 22vw, 220px);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 14px rgba(255, 6, 111, 0.25));
}

.m-hero__logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

.m-hero__title {
  margin: 0;
  font-family: var(--hex-font-body);
  font-size: clamp(40px, 7.5vw, 80px);
  font-weight: 800;
  line-height: 0.95;
  color: #fff;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.m-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 200px;
  padding: 18px 40px;
  font-family: var(--hex-font-body);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #fff;
  background: var(--hex-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.15s ease;
  box-shadow: 0 0 32px rgba(255, 6, 111, 0.55), inset 0 -2px 0 rgba(0, 0, 0, 0.15);
}

.m-hero__cta:hover {
  transform: translateY(-2px);
  background: var(--hex-primary-light);
  box-shadow: 0 0 48px rgba(255, 6, 111, 0.75), inset 0 -2px 0 rgba(0, 0, 0, 0.15);
}

.m-hero__cta:active {
  transform: translateY(0);
  box-shadow: 0 0 24px rgba(255, 6, 111, 0.4), inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}

.m-hero__cta-arrow {
  font-size: 1.1em;
  line-height: 1;
}

@media (max-width: 720px) {
  .m-hero {
    padding: 40px 16px 60px;
  }
  .m-hero__content {
    gap: 24px;
  }
  .m-hero__cta {
    padding: 16px 36px;
    font-size: 16px;
    min-width: 180px;
  }
}

/* ============================================
   SECTION COMMON
   ============================================ */
.m-section {
  position: relative;
  width: 100%;
  padding: 100px 24px;
  background: var(--hex-bg-dark);
}

.m-section__inner {
  max-width: 1100px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.m-section__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.m-section__kicker {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--hex-text-muted);
}

.m-section__heading {
  margin: 0 0 16px;
  font-family: var(--hex-font-body);
  font-size: clamp(36px, 5.5vw, 60px);
  font-weight: 700;
  line-height: 1;
  color: var(--hex-text-primary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.m-section__subtitle {
  margin: 0 0 48px;
  max-width: 620px;
  font-size: clamp(15px, 1.7vw, 17px);
  line-height: 1.55;
  color: var(--hex-text-secondary);
}

@media (max-width: 720px) {
  .m-section {
    padding: 64px 16px;
  }
  .m-section__subtitle {
    margin-bottom: 36px;
  }
}

/* ============================================
   GAMEPLAY
   ============================================ */
.m-gameplay__video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, rgba(18, 18, 22, 1) 0%, rgba(30, 12, 22, 1) 100%);
  border: 1px solid rgba(255, 6, 111, 0.32);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 56px rgba(255, 6, 111, 0.12);
}

.m-gameplay__rec-tag {
  position: absolute;
  top: 14px;
  left: 16px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--hex-text-muted);
}

.m-gameplay__rec-dot {
  width: 7px;
  height: 7px;
  background: var(--hex-primary);
  border-radius: 1px;
  animation: m-rec-blink 1.6s ease-in-out infinite;
}

@keyframes m-rec-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}

.m-gameplay__pattern {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.55;
  pointer-events: none;
}

.m-gameplay__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  z-index: 1;
}

.m-gameplay__play-btn {
  width: 78px;
  height: 78px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: not-allowed;
  filter: drop-shadow(0 0 18px rgba(255, 6, 111, 0.55));
  opacity: 0.95;
  transition: opacity 0.15s ease;
}

.m-gameplay__play-btn svg {
  width: 100%;
  height: 100%;
  display: block;
}

.m-gameplay__placeholder {
  margin: 0;
  font-family: var(--hex-font-body);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--hex-text-primary);
}

.m-gameplay__caption {
  margin: 18px 0 0;
  font-size: 14px;
  color: var(--hex-text-muted);
  letter-spacing: 0.03em;
}

@media (max-width: 720px) {
  .m-gameplay__play-btn {
    width: 62px;
    height: 62px;
  }
  .m-gameplay__placeholder {
    font-size: 15px;
  }
}

/* ============================================
   $HEX TOKEN
   ============================================ */
.m-token {
  padding: 120px 24px;
}

.m-token__grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(280px, 1.3fr);
  gap: 64px;
  align-items: center;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.m-token__grid.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.m-token__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  max-width: 380px;
  margin: 0 auto;
}

.m-token__visual-glow {
  position: absolute;
  inset: 10%;
  background: radial-gradient(
    circle at center,
    rgba(255, 6, 111, 0.18) 0%,
    rgba(255, 6, 111, 0.04) 50%,
    transparent 75%
  );
  pointer-events: none;
  z-index: 0;
}

.m-token__hex {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.m-token__hex-symbol {
  fill: var(--hex-primary);
  font-family: var(--hex-font-body);
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 2px;
}

.m-token__hex-sub {
  fill: var(--hex-text-muted);
  font-family: var(--hex-font-body);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 1.8px;
}

.m-token__copy {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.m-token__heading {
  margin: 0;
  font-size: clamp(28px, 3.6vw, 40px);
  font-weight: 700;
  line-height: 1.2;
  color: var(--hex-text-primary);
}

.m-token__heading-accent {
  color: var(--hex-primary);
}

.m-token__para {
  margin: 0;
  font-size: clamp(15px, 1.6vw, 16px);
  line-height: 1.6;
  color: var(--hex-text-secondary);
  max-width: 520px;
}

.m-token__learn-more {
  display: inline-block;
  margin-top: 8px;
  align-self: flex-start;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--hex-primary);
  text-decoration: none;
  transition: color 0.15s ease, transform 0.15s ease;
}

.m-token__learn-more:hover {
  color: var(--hex-primary-light);
  transform: translateX(2px);
}

@media (max-width: 820px) {
  .m-token {
    padding: 80px 16px;
  }
  .m-token__grid {
    grid-template-columns: 1fr;
    gap: 32px;
    text-align: center;
  }
  .m-token__copy {
    align-items: center;
  }
  .m-token__visual {
    max-width: 300px;
  }
  .m-token__para {
    text-align: center;
  }
  .m-token__learn-more {
    align-self: center;
  }
}

/* ============================================
   ROADMAP
   ============================================ */
.m-roadmap__track {
  list-style: none;
  margin: 64px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
  align-items: start;
  gap: 0;
}

.m-roadmap__node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
}

.m-roadmap__hex-wrap {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.m-roadmap__hex-wrap--glow {
  filter: drop-shadow(0 0 24px rgba(255, 6, 111, 0.65));
  animation: m-roadmap-pulse 2.6s ease-in-out infinite;
}

@keyframes m-roadmap-pulse {
  0%, 100% { filter: drop-shadow(0 0 18px rgba(255, 6, 111, 0.5)); }
  50%      { filter: drop-shadow(0 0 32px rgba(255, 6, 111, 0.85)); }
}

.m-roadmap__hex {
  width: 100%;
  height: 100%;
}

/* Connector lines between nodes */
.m-roadmap__connector {
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100px;
  padding: 0 4px;
}

.m-roadmap__connector-line {
  display: block;
  width: 100%;
  height: 1px;
  background: var(--hex-primary);
  box-shadow: 0 0 6px var(--hex-primary-glow);
}

.m-roadmap__connector-line--dashed {
  background: transparent;
  background-image: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.35) 0,
    rgba(255, 255, 255, 0.35) 6px,
    transparent 6px,
    transparent 12px
  );
  background-size: 12px 1px;
  background-repeat: repeat-x;
  box-shadow: none;
}

.m-roadmap__connector-line--muted {
  background-image: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.15) 0,
    rgba(255, 255, 255, 0.15) 6px,
    transparent 6px,
    transparent 12px
  );
}

.m-roadmap__num {
  margin-top: 8px;
  font-family: var(--hex-font-body);
  font-size: 32px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  color: var(--hex-text-muted);
  letter-spacing: 0.08em;
  line-height: 1;
}

.m-roadmap__name {
  margin-top: 4px;
  font-family: var(--hex-font-body);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1.3;
  text-transform: uppercase;
  text-align: center;
  color: var(--hex-text-primary);
}

.m-roadmap__status {
  margin-top: 8px;
  font-family: var(--hex-font-body);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--hex-text-muted);
}

.m-roadmap__status--active {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--hex-primary);
}

.m-roadmap__status--muted {
  color: rgba(255, 255, 255, 0.25);
}

.m-roadmap__status-dot {
  width: 6px;
  height: 6px;
  background: var(--hex-primary);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--hex-primary-glow);
  flex-shrink: 0;
}

.m-roadmap__node--later .m-roadmap__num,
.m-roadmap__node--later .m-roadmap__name {
  color: rgba(255, 255, 255, 0.35);
}

/* Mobile: vertical stack — drop connector lines, stack nodes */
@media (max-width: 820px) {
  .m-roadmap__track {
    grid-template-columns: 1fr;
    gap: 28px;
    margin-top: 40px;
  }
  .m-roadmap__connector {
    display: none;
  }
  .m-roadmap__hex-wrap {
    width: 80px;
    height: 80px;
  }
}

/* ============================================
   SUBSCRIBE
   ============================================ */
.m-subscribe {
  padding: 120px 24px;
  text-align: center;
  background: var(--hex-bg-dark);
}

.m-subscribe__inner {
  max-width: 720px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}

.m-subscribe__inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.m-subscribe__heading {
  margin: 0 0 12px;
  font-size: clamp(32px, 4.5vw, 52px);
  font-weight: 700;
  line-height: 1.1;
  color: var(--hex-text-primary);
}

.m-subscribe__subtitle {
  margin: 0 0 36px;
  font-size: clamp(14px, 1.5vw, 16px);
  color: var(--hex-text-muted);
  letter-spacing: 0.03em;
}

.m-subscribe__form {
  display: flex;
  align-items: stretch;
  gap: 0;
  max-width: 540px;
  margin: 0 auto;
  padding: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.m-subscribe__input {
  flex: 1;
  font-family: inherit;
  font-size: 15px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--hex-text-primary);
  outline: none;
  min-width: 0;
}

.m-subscribe__input::placeholder {
  color: var(--hex-text-muted);
}

.m-subscribe__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.m-subscribe__btn {
  font-family: var(--hex-font-body);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 12px 28px;
  background: var(--hex-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  box-shadow: 0 0 24px rgba(255, 6, 111, 0.45);
  white-space: nowrap;
}

.m-subscribe__btn:hover:not(:disabled) {
  background: var(--hex-primary-light);
  box-shadow: 0 0 32px rgba(255, 6, 111, 0.65);
  transform: translateY(-1px);
}

.m-subscribe__btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 0 18px rgba(255, 6, 111, 0.35);
}

.m-subscribe__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.m-subscribe__fine {
  margin: 18px 0 0;
  font-size: 12px;
  color: var(--hex-text-muted);
  letter-spacing: 0.05em;
}

@media (max-width: 560px) {
  .m-subscribe {
    padding: 80px 16px;
  }
  .m-subscribe__form {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  .m-subscribe__input {
    text-align: center;
  }
}

/* ============================================
   FOOTER
   ============================================ */
.m-footer {
  width: 100%;
  background: var(--hex-bg-dark);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.m-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 24px 32px;
}

.m-footer__top {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 64px;
  padding-bottom: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.m-footer__brand-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 280px;
}

.m-footer__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--hex-text-primary);
  -webkit-user-drag: none;
}

.m-footer__brand-icon {
  width: 24px;
  height: 24px;
  opacity: 0.85;
}

.m-footer__brand-text {
  font-family: var(--hex-font-body);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
}

.m-footer__tagline {
  margin: 0;
  font-size: 13px;
  color: var(--hex-text-muted);
  line-height: 1.5;
}

.m-footer__cols {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 160px));
  gap: 48px;
}

.m-footer__col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.m-footer__col-title {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.25em;
  color: var(--hex-text-muted);
  text-transform: uppercase;
}

.m-footer__link {
  font-size: 14px;
  color: var(--hex-text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
  cursor: pointer;
}

.m-footer__link:hover {
  color: var(--hex-text-primary);
}

.m-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 24px;
}

.m-footer__copy {
  margin: 0;
  font-size: 12px;
  color: var(--hex-text-muted);
  letter-spacing: 0.05em;
}

.m-footer__socials {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.m-footer__socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  opacity: 0.5;
  transition: opacity 0.15s ease, background 0.15s ease, transform 0.15s ease;
}

.m-footer__socials a:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}

.m-footer__socials img {
  width: 16px;
  height: 16px;
  user-select: none;
  -webkit-user-drag: none;
}

@media (max-width: 820px) {
  .m-footer__inner {
    padding: 48px 20px 24px;
  }
  .m-footer__top {
    grid-template-columns: 1fr;
    gap: 36px;
    padding-bottom: 32px;
  }
  .m-footer__cols {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .m-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .m-footer__cols {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}
</style>
