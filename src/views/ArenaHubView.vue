<template>
  <div class="background background-arena-hub">
    <div class="hub-container">
      <div class="hub-content">

        <div
          class="hub-card hex-animate-scale-in"
          :class="{ 'hub-card--fight': true }"
          @click="selectFight"
        >
          <div class="hub-card__glow"></div>
          <div class="hub-card__body">
            <h2 class="hub-card__title hub-card__title--fight">{{ t.arena.hub.fight.title }}</h2>
            <p class="hub-card__subtitle">{{ t.arena.hub.fight.subtitle }}</p>
            <p class="hub-card__desc">{{ t.arena.hub.fight.description }}</p>
          </div>
        </div>

        <div
          class="hub-card hex-animate-scale-in"
          :class="{ 'hub-card--club': true }"
          @click="selectClub"
        >
          <div class="hub-card__glow"></div>
          <div class="hub-card__body">
            <h2 class="hub-card__title hub-card__title--club">{{ t.arena.hub.club.title }}</h2>
            <p class="hub-card__subtitle">{{ t.arena.hub.club.subtitle }}</p>
            <p class="hub-card__desc">{{ t.arena.hub.club.description }}</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { t } from '@/locales/index.js';

const router = useRouter();

function selectFight() {
  router.push('/arena/fight');
}

function selectClub() {
  router.push('/arena/club');
}
</script>

<style scoped>
.background-arena-hub {
  background: url('@/assets/images/background_arena.webp') no-repeat center center;
  background-size: cover;
}

.background-arena-hub::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(180deg, rgba(9, 9, 9, 0.7) 0%, rgba(9, 9, 9, 0.85) 100%);
  z-index: 1;
}

.hub-container {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;
}

@supports (min-height: 100dvh) {
  .hub-container {
    min-height: 100dvh;
  }
}

.hub-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 900px;
}

/* ── Card ────────────────────────────────────────────── */
.hub-card {
  position: relative;
  overflow: hidden;
  border: 2px solid var(--hex-border-default);
  border-radius: var(--hex-radius-xl);
  background: var(--hex-bg-card);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.hub-card:hover {
  transform: scale(1.02);
}

.hub-card:active {
  transform: scale(1.04);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── Fight card accent ────────────────────────────────── */
.hub-card--fight {
  border-color: color-mix(in srgb, var(--hex-mode-pvp) 40%, transparent);
}

.hub-card--fight:hover {
  border-color: var(--hex-mode-pvp);
  box-shadow: 0 0 30px color-mix(in srgb, var(--hex-mode-pvp) 30%, transparent);
}

/* ── Club card accent ────────────────────────────────── */
.hub-card--club {
  border-color: color-mix(in srgb, var(--hex-mode-club) 40%, transparent);
}

.hub-card--club:hover {
  border-color: var(--hex-mode-club);
  box-shadow: 0 0 30px color-mix(in srgb, var(--hex-mode-club) 30%, transparent);
}

/* ── Hover gradient from bottom (gym door light) ──── */
.hub-card__glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, currentColor 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.hub-card--fight .hub-card__glow {
  color: color-mix(in srgb, var(--hex-mode-pvp) 15%, transparent);
}

.hub-card--club .hub-card__glow {
  color: color-mix(in srgb, var(--hex-mode-club) 15%, transparent);
}

.hub-card:hover .hub-card__glow {
  opacity: 1;
}

/* ── Card body ───────────────────────────────────────── */
.hub-card__body {
  position: relative;
  padding: 32px 24px;
  z-index: 1;
}

.hub-card__title {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 28px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0 0 8px 0;
}

.hub-card__title--fight {
  color: var(--hex-mode-pvp);
}

.hub-card__title--club {
  color: var(--hex-mode-club);
}

.hub-card__subtitle {
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--hex-text-secondary);
  margin: 0 0 12px 0;
}

.hub-card__desc {
  font-size: 13px;
  color: var(--hex-text-muted);
  line-height: 1.5;
  margin: 0;
  max-width: 320px;
}

/* ── Desktop: side by side ───────────────────────────── */
@media (min-width: 768px) {
  .hub-content {
    flex-direction: row;
  }

  .hub-card {
    flex: 1;
  }

  .hub-card__body {
    padding: 40px 32px;
    min-height: 180px;
  }
}

/* ── Small mobile ────────────────────────────────────── */
@media (max-width: 360px) {
  .hub-card__title {
    font-size: 24px;
  }

  .hub-card__body {
    padding: 24px 16px;
  }
}
</style>
