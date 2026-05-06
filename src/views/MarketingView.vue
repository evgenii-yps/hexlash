<template>
  <div class="marketing">
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
        <img
          :src="logoSrc"
          alt="Hexlash"
          class="marketing-hero__logo"
          draggable="false"
        />
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

    <section class="marketing-gameplay" ref="gameplayRef">
      <div class="marketing-gameplay__inner" :class="{ 'is-visible': gameplayVisible }">
        <h2 class="marketing-gameplay__heading">GAMEPLAY</h2>
        <div class="marketing-gameplay__video">
          <div class="marketing-gameplay__video-placeholder">
            <span class="marketing-gameplay__video-text">Video coming soon</span>
          </div>
        </div>
        <p class="marketing-gameplay__caption">
          Watch fighters battle in the underground octagon.
        </p>
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
        <router-link to="/rules" class="marketing-footer__link">Rules</router-link>
        <span class="marketing-footer__sep" aria-hidden="true">·</span>
        <router-link to="/help" class="marketing-footer__link">Help</router-link>
      </nav>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDocumentMeta } from '@/composables/useDocumentMeta';
import { useScrollFadeIn } from '@/composables/useScrollFadeIn';
import logoSrc from '@/assets/images/hexlash-logo.jpg';
import iconTelega from '@/assets/images/icon_telega.svg';
import iconX from '@/assets/images/icon_x.svg';
import iconYout from '@/assets/images/icon_yout.svg';
import iconDisc from '@/assets/images/icon_disc.svg';
import iconInsta from '@/assets/images/icon_insta.svg';

const router = useRouter();

const heroRef = ref(null);
const aboutRef = ref(null);
const gameplayRef = ref(null);
const footerRef = ref(null);

// 8c C1 — IntersectionObserver fade-in via composable (refactored from
// 8b inline pattern). Threshold 0.3 matches 8b verbatim. Native API,
// one-shot disconnect, fallback to immediate visibility for environments
// without IntersectionObserver. Future 8c sections (Gameplay/Token/
// Roadmap/Partners/Subscribe) will reuse the same composable to avoid
// 5x duplication of ~28-line inline observer setup.
const { visible: aboutVisible } = useScrollFadeIn(aboutRef);
const { visible: gameplayVisible } = useScrollFadeIn(gameplayRef);

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
</script>

<style scoped>
.marketing {
  background: var(--hex-bg-dark);
  color: var(--hex-text-primary);
  overflow-x: hidden;
}

.marketing-hero,
.marketing-about,
.marketing-gameplay,
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--hex-border-default, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 64px rgba(255, 6, 111, 0.1);
}

.marketing-gameplay__video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(20, 20, 20, 1) 0%, rgba(40, 10, 30, 1) 100%);
}

.marketing-gameplay__video-text {
  font-size: clamp(14px, 1.5vw, 18px);
  color: var(--hex-text-muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.marketing-gameplay__caption {
  margin: 24px 0 0;
  font-size: clamp(14px, 1.5vw, 16px);
  color: var(--hex-text-muted);
  letter-spacing: 0.05em;
}

@media (max-width: 480px) {
  .marketing-gameplay {
    padding: 60px 16px;
  }
  .marketing-gameplay__heading {
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

.marketing-hero__logo {
  width: clamp(220px, 35vw, 380px);
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 0 24px rgba(255, 6, 111, 0.3));
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
</style>
