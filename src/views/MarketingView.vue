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

      <!-- Scroll hint -->
      <div class="marketing-hero__scroll-hint" aria-hidden="true" @click="scrollToAbout">
        <span class="marketing-hero__scroll-arrow">↓</span>
      </div>
    </section>

    <section class="marketing-about" ref="aboutRef">
      <div class="marketing-about__content" :class="{ 'is-visible': aboutVisible }">
        <h2 class="marketing-about__heading">NEVER GIVE UP</h2>
        <p class="marketing-about__subtitle">Train. Fight. Rise.</p>
      </div>
    </section>

    <footer class="marketing-footer" ref="footerRef">
      <!-- Footer content — C4 -->
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useDocumentMeta } from '@/composables/useDocumentMeta';
import logoSrc from '@/assets/images/hexlash-logo.jpg';

const router = useRouter();

const heroRef = ref(null);
const aboutRef = ref(null);
const footerRef = ref(null);
const aboutVisible = ref(false);

let aboutObserver = null;

onMounted(() => {
  // C3 — IntersectionObserver fade-in trigger for About section.
  // Per ТЗ decision: native API (not @vueuse/core composable). Threshold 0.3.
  if (aboutRef.value && 'IntersectionObserver' in window) {
    aboutObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            aboutVisible.value = true;
            aboutObserver.disconnect();
            aboutObserver = null;
          }
        });
      },
      { threshold: 0.3 }
    );
    aboutObserver.observe(aboutRef.value);
  } else {
    // Fallback for environments without IntersectionObserver — show immediately.
    aboutVisible.value = true;
  }
});

onBeforeUnmount(() => {
  if (aboutObserver) {
    aboutObserver.disconnect();
    aboutObserver = null;
  }
});

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

function scrollToAbout() {
  if (aboutRef.value) {
    aboutRef.value.scrollIntoView({ behavior: 'smooth' });
  }
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

.marketing-footer {
  padding: 40px 24px 24px;
  border-top: 1px solid var(--hex-border-default, rgba(255, 255, 255, 0.06));
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

.marketing-hero__scroll-hint {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  cursor: pointer;
  animation: marketing-scroll-bounce 2.5s ease-in-out infinite;
  user-select: none;
}

.marketing-hero__scroll-arrow {
  font-size: 32px;
  color: var(--hex-text-muted);
  display: block;
  transition: color 0.15s ease;
}

.marketing-hero__scroll-hint:hover .marketing-hero__scroll-arrow {
  color: var(--hex-primary);
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

@keyframes marketing-scroll-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
  50% { transform: translateX(-50%) translateY(8px); opacity: 1; }
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
