<template>
  <div class="landing">
    <!-- Pink radial glow background accent (decorative, behind everything) -->
    <div class="landing__glow" aria-hidden="true"></div>

    <!-- Hero: logo + tagline + CTA + social -->
    <main class="landing__hero">
      <img
        :src="logoSrc"
        alt="Hexlash"
        class="landing__logo"
        draggable="false"
      />

      <p class="landing__tagline">The underground Web3 arena</p>

      <button
        type="button"
        class="landing__cta"
        @click="onCtaClick"
      >
        Start Fighting
      </button>

      <ul class="landing__socials" aria-label="Social media">
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="Telegram">
            <img :src="iconTelega" alt="" class="landing__social-icon" />
          </a>
        </li>
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="X (Twitter)">
            <img :src="iconX" alt="" class="landing__social-icon" />
          </a>
        </li>
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="YouTube">
            <img :src="iconYout" alt="" class="landing__social-icon" />
          </a>
        </li>
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="Discord">
            <img :src="iconDisc" alt="" class="landing__social-icon" />
          </a>
        </li>
        <li>
          <a href="#" target="_blank" rel="noopener" aria-label="Instagram">
            <img :src="iconInsta" alt="" class="landing__social-icon" />
          </a>
        </li>
      </ul>
    </main>

    <!-- Footer: legal/help links -->
    <footer class="landing__footer">
      <router-link to="/privacy" class="landing__footer-link">Privacy</router-link>
      <span class="landing__footer-sep" aria-hidden="true">·</span>
      <router-link to="/rules" class="landing__footer-link">Rules</router-link>
      <span class="landing__footer-sep" aria-hidden="true">·</span>
      <router-link to="/help" class="landing__footer-link">Help</router-link>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import logoSrc from '@/assets/images/hexlash-logo.jpg';
import iconTelega from '@/assets/images/icon_telega.svg';
import iconX from '@/assets/images/icon_x.svg';
import iconYout from '@/assets/images/icon_yout.svg';
import iconDisc from '@/assets/images/icon_disc.svg';
import iconInsta from '@/assets/images/icon_insta.svg';

const router = useRouter();

function onCtaClick() {
  router.push('/auth/signup');
}
</script>

<style scoped>
.landing {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--hex-bg-dark);
  color: var(--hex-text-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.landing__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(400px, 60vw, 900px);
  height: clamp(400px, 60vw, 900px);
  background: radial-gradient(
    circle at center,
    rgba(255, 6, 111, 0.15) 0%,
    rgba(255, 6, 111, 0.05) 35%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

.landing__hero {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 24px;
}

.landing__logo {
  width: clamp(180px, 30vw, 320px);
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.landing__tagline {
  margin: 0;
  font-size: clamp(14px, 2vw, 18px);
  color: var(--hex-text-muted);
  letter-spacing: 0.02em;
  text-align: center;
  text-transform: uppercase;
}

.landing__cta {
  font-family: inherit;
  font-size: clamp(14px, 1.6vw, 16px);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 14px 36px;
  background: var(--hex-primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  box-shadow: 0 0 24px rgba(255, 6, 111, 0.4);
  margin-top: 8px;
}

.landing__cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 32px rgba(255, 6, 111, 0.6);
}

.landing__cta:active {
  transform: translateY(0);
  box-shadow: 0 0 16px rgba(255, 6, 111, 0.3);
}

.landing__socials {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: flex;
  gap: 20px;
  align-items: center;
}

.landing__socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  transition: opacity 0.15s ease, transform 0.15s ease;
  opacity: 0.7;
}

.landing__socials a:hover {
  opacity: 1;
  transform: translateY(-2px);
}

.landing__social-icon {
  width: 20px;
  height: 20px;
  user-select: none;
  -webkit-user-drag: none;
}

.landing__footer {
  position: relative;
  z-index: 1;
  padding: 16px 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  color: var(--hex-text-muted);
}

.landing__footer-link {
  color: var(--hex-text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.landing__footer-link:hover {
  color: var(--hex-text-primary);
}

.landing__footer-sep {
  color: var(--hex-text-muted);
  opacity: 0.5;
}

/* Mobile narrow viewport (<480px) */
@media (max-width: 480px) {
  .landing__hero {
    padding: 16px 12px;
    gap: 18px;
  }
  .landing__socials {
    gap: 14px;
  }
  .landing__socials a {
    width: 36px;
    height: 36px;
  }
}
</style>
