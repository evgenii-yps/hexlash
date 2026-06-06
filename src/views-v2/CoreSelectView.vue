<!-- /play — Core selection (Заход 1, Stage 1 pre-fight window).
     Pick 1 of 4 cores → fixes the choice → goes to the upgrade screen.

     Neon Discipline amendment (Notion → Visual System, 06.06): cores sit side by
     side here, so colour is muted to near-flat and at most ONE core glows — the
     selected one. The simplified faceted-hex icon keeps the four distinguishable
     even while muted; the chosen hue only blooms on tap. -->
<template>
  <div class="core-select">
    <header class="core-select__head">
      <h1 class="core-select__title">ВЫБЕРИ ЯДРО</h1>
      <p class="core-select__sub">Врождённый характер бойца · 1 из 4</p>
    </header>

    <ul class="core-grid">
      <li
        v-for="core in cores"
        :key="core.id"
        class="core-card"
        :class="{ 'is-selected': selectedId === core.id }"
        :style="{ '--core-color': core.color }"
        role="button"
        tabindex="0"
        :aria-pressed="selectedId === core.id"
        @click="choose(core)"
        @keydown.enter.prevent="choose(core)"
        @keydown.space.prevent="choose(core)"
      >
        <span class="core-card__glow" aria-hidden="true" />
        <svg class="core-card__icon" viewBox="0 0 100 100" aria-hidden="true">
          <!-- faceted hex crystal -->
          <polygon
            class="ci-hex"
            points="90,50 70,84.64 30,84.64 10,50 30,15.36 70,15.36"
          />
          <!-- facets -->
          <g class="ci-facets">
            <line x1="50" y1="50" x2="90" y2="50" />
            <line x1="50" y1="50" x2="70" y2="84.64" />
            <line x1="50" y1="50" x2="30" y2="84.64" />
            <line x1="50" y1="50" x2="10" y2="50" />
            <line x1="50" y1="50" x2="30" y2="15.36" />
            <line x1="50" y1="50" x2="70" y2="15.36" />
          </g>
          <!-- inner circle + hot centre -->
          <circle class="ci-ring" cx="50" cy="50" r="15" />
          <circle class="ci-core" cx="50" cy="50" r="5" />
        </svg>
        <span class="core-card__name">{{ core.name }}</span>
        <span class="core-card__axis">{{ core.axis }}</span>
      </li>
    </ul>

    <p class="core-select__hint">Тап по ядру — выбор и переход к прокачке</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { CORES } from '@/data/cores.js';

const cores = CORES;
const store = useStore();
const router = useRouter();

const selectedId = ref(null);
let navigating = false;

function choose(core) {
  if (navigating) return;
  navigating = true;
  selectedId.value = core.id; // single glow — others stay flat
  store.dispatch('prefight/selectCore', core.id);
  // Brief beat so the chosen core visibly blooms before the screen changes.
  setTimeout(() => router.push({ name: 'PrefightUpgrade' }), 280);
}
</script>

<style scoped>
.core-select {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 32px 20px;
  overflow-y: auto;
  background:
    radial-gradient(ellipse 70% 60% at 50% 40%, #0d0f1c 0%, #070811 60%, #030308 100%);
  text-align: center;
}

.core-select__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.core-select__title {
  margin: 0;
  font-family: var(--font-display, sans-serif);
  font-size: clamp(26px, 5vw, 42px);
  letter-spacing: 0.04em;
  color: #fff;
}
.core-select__sub {
  margin: 0;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
}

.core-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 180px));
  gap: 18px;
  width: 100%;
  max-width: 420px;
}
@media (min-width: 720px) {
  .core-grid {
    grid-template-columns: repeat(4, 160px);
    max-width: none;
  }
}

.core-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 22px 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(10, 12, 22, 0.55);
  cursor: pointer;
  outline: none;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.core-card:hover,
.core-card:focus-visible {
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(14, 17, 30, 0.7);
}

/* Muted (flat) by default — the shared-screen discipline. */
.core-card__icon {
  width: 76px;
  height: 76px;
  color: var(--core-color);
  opacity: 0.4;
  filter: saturate(0.6);
  transition: opacity 0.22s ease, filter 0.22s ease, transform 0.22s ease;
}
.ci-hex {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linejoin: round;
}
.ci-facets line {
  stroke: currentColor;
  stroke-width: 1;
  opacity: 0.4;
}
.ci-ring {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  opacity: 0.85;
}
.ci-core {
  fill: currentColor;
}

/* Radial bloom behind the icon — off until selected (the single glow). */
.core-card__glow {
  position: absolute;
  top: 18px;
  left: 50%;
  width: 130px;
  height: 130px;
  transform: translateX(-50%) scale(0.6);
  border-radius: 50%;
  background: radial-gradient(circle, var(--core-color) 0%, transparent 65%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.26s ease, transform 0.26s ease;
}

.core-card__name {
  font-family: var(--font-body, sans-serif);
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-mid, rgba(255, 255, 255, 0.75));
}
.core-card__axis {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim, rgba(255, 255, 255, 0.5));
}

/* Selected — the one core that glows its colour. */
.core-card.is-selected {
  border-color: var(--core-color);
  background: rgba(16, 18, 32, 0.85);
}
.core-card.is-selected .core-card__icon {
  opacity: 1;
  filter: saturate(1) drop-shadow(0 0 10px var(--core-color));
  transform: scale(1.04);
}
.core-card.is-selected .core-card__glow {
  opacity: 0.5;
  transform: translateX(-50%) scale(1);
}
.core-card.is-selected .core-card__name {
  color: #fff;
}

.core-select__hint {
  margin: 0;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim, rgba(255, 255, 255, 0.42));
}

@media (prefers-reduced-motion: reduce) {
  .core-card,
  .core-card__icon,
  .core-card__glow {
    transition: none;
  }
}
</style>
