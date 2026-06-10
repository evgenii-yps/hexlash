<!-- KlichBar — the player's combat-call HUD: a horizontal row of lever cards at
     bottom-centre, shown during a bout. Each card = a placeholder icon + a label
     + a corner badge showing the SHARED charge pool (all three calls draw from
     one per-bout pool of 3 — the same number sits on each card and they dim
     together at 0). PURELY presentational — renders the levers passed in + the
     pool and emits `arm(id)` on tap; the arm → pick-fighter → apply loop + pool
     bookkeeping live in ArenaScene (generic, reusable by future buffs).

     Style — Neon Discipline: dark flat controls, one pink accent (--hex-primary)
     on the armed card only; the three calls read by ICON + LABEL, not colour
     (no per-card hue). The armed pulse is decorative and drops to a static glow
     under prefers-reduced-motion. Touch-sized for mobile. -->
<template>
  <div class="klich-bar">
    <button
      v-for="lever in levers"
      :key="lever.id"
      type="button"
      class="klich-card"
      :class="{ armed: armedId === lever.id, spent: pool <= 0 }"
      :disabled="pool <= 0"
      :aria-pressed="armedId === lever.id"
      @click="$emit('arm', lever.id)"
    >
      <span class="klich-badge">{{ pool }}</span>
      <span class="klich-icon" aria-hidden="true">
        <!-- forward / ВПЕРЁД — double chevron in -->
        <svg v-if="lever.id === 'forward'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 13l6-6 6 6" />
          <path d="M6 18l6-6 6 6" />
        </svg>
        <!-- retreat / ОТХОД — double chevron out -->
        <svg v-else-if="lever.id === 'retreat'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 6l6 6 6-6" />
          <path d="M6 11l6 6 6-6" />
        </svg>
        <!-- hold / ДЕРЖАТЬ — shield -->
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6z" />
        </svg>
      </span>
      <span class="klich-label">{{ lever.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  levers: { type: Array, required: true }, // [{ id, label }]
  pool: { type: Number, default: 0 }, // remaining SHARED charges (shown on each card)
  armedId: { type: String, default: null }, // currently-armed lever id, or null
});
defineEmits(['arm']);
</script>

<style scoped>
/* Container is click-through; only the cards capture taps (so empty bar area
   passes orbit-drag to the canvas underneath). */
.klich-bar {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 20;
  pointer-events: none;
}
.klich-card {
  pointer-events: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 66px;
  min-height: 74px;
  padding: 8px 10px;
  font-family: var(--font-mono, monospace);
  color: rgba(255, 255, 255, 0.78);
  background: rgba(8, 10, 18, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.12s, border-color 0.12s, background 0.12s, box-shadow 0.12s, opacity 0.12s;
}
.klich-card:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}
/* Armed — the one accent. Pink ring + glow + a soft pulse (decorative). */
.klich-card.armed {
  color: #fff;
  border-color: var(--hex-primary, #ff0069);
  box-shadow: 0 0 0 1px var(--hex-primary, #ff0069), 0 0 16px rgba(255, 0, 105, 0.45);
  animation: klich-pulse 1.1s ease-in-out infinite;
}
/* Spent — dimmed + inert (the button is also disabled). */
.klich-card.spent {
  opacity: 0.32;
  pointer-events: none;
}
.klich-card:disabled {
  cursor: default;
}
.klich-icon {
  display: block;
  line-height: 0;
}
.klich-icon svg {
  width: 26px;
  height: 26px;
}
.klich-label {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
/* Charge badge — neutral pill in the corner (the per-bout counter). */
.klich-badge {
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: rgba(18, 20, 30, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 9px;
}
@keyframes klich-pulse {
  0%, 100% { box-shadow: 0 0 0 1px var(--hex-primary, #ff0069), 0 0 12px rgba(255, 0, 105, 0.35); }
  50% { box-shadow: 0 0 0 1px var(--hex-primary, #ff0069), 0 0 20px rgba(255, 0, 105, 0.6); }
}
/* Reduced motion — keep the static armed ring, drop the pulse. */
@media (prefers-reduced-motion: reduce) {
  .klich-card.armed { animation: none; }
  .klich-card { transition: none; }
}
</style>
