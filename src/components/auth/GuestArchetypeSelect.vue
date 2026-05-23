<!-- Guest archetype picker — shown after "Play as Guest". Four real archetypes
     (Predator / Sentinel / Analyst / Ghost). Archetype colour is applied only
     in the active/selected card context per Neon Discipline (archetype colours
     belong to fighter context, not chrome). -->
<template>
  <div class="guest-arch">
    <h2 class="guest-arch__title">CHOOSE YOUR FIGHTER</h2>
    <p class="guest-arch__hint">PICK AN ARCHETYPE TO START PLAYING</p>

    <div class="guest-arch__list">
      <button
        v-for="a in archetypes"
        :key="a.id"
        type="button"
        class="guest-arch__card"
        :class="{ 'guest-arch__card--active': selected === a.id }"
        :style="cardStyle(a)"
        @click="selected = a.id"
      >
        <span class="guest-arch__short" :style="{ color: hex(a.color) }">{{ a.short }}</span>
        <span class="guest-arch__body">
          <span class="guest-arch__name">{{ a.name }}</span>
          <span class="guest-arch__tag">{{ a.tagline }}</span>
        </span>
      </button>
    </div>

    <button
      type="button"
      class="guest-arch__start"
      :disabled="!selected"
      @click="onStart"
    >
      ENTER THE PIT
    </button>

    <button type="button" class="guest-arch__back" @click="$emit('back')">
      &larr; Back
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ARCHETYPES } from '@/scene/interaction/useCreateState.js';
import { GUEST_ARCHETYPE_IDS } from '@/core/services/guestService.js';

const emit = defineEmits(['select', 'back']);

const selected = ref(null);

const archetypes = computed(() =>
  GUEST_ARCHETYPE_IDS
    .map((id) => ARCHETYPES.find((a) => a.id === id))
    .filter(Boolean),
);

function hex(num) {
  return '#' + num.toString(16).padStart(6, '0');
}

function cardStyle(a) {
  if (selected.value !== a.id) return {};
  // Active context — tint border + faint bg with the archetype colour.
  return {
    borderColor: hex(a.color),
    boxShadow: `0 0 0 1px ${hex(a.color)}`,
  };
}

function onStart() {
  if (!selected.value) return;
  emit('select', selected.value);
}
</script>

<style scoped>
.guest-arch {
  display: flex;
  flex-direction: column;
}

.guest-arch__title {
  margin: 0 0 8px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--hex-text-primary);
}

.guest-arch__hint {
  margin: 0 0 20px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
}

.guest-arch__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.guest-arch__card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  text-align: left;
  background: transparent;
  border: 1px solid var(--hex-border-default);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  outline: none;
  min-height: 64px;
}

.guest-arch__card:hover {
  border-color: var(--hex-border-strong);
}

.guest-arch__card--active {
  background: rgba(255, 255, 255, 0.03);
}

.guest-arch__short {
  font-family: var(--font-mono, monospace);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  flex: 0 0 auto;
  width: 40px;
  text-align: center;
}

.guest-arch__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.guest-arch__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--hex-text-primary);
}

.guest-arch__tag {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  line-height: 1.4;
  color: var(--hex-text-secondary);
}

/* Single pink accent on this screen — the primary CTA. */
.guest-arch__start {
  padding: 14px 16px;
  background: var(--hex-primary);
  border: none;
  border-radius: 6px;
  color: var(--hex-bg-dark);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: opacity 0.15s ease, filter 0.15s ease;
  min-height: 48px;
}

.guest-arch__start:hover:not(:disabled) {
  filter: brightness(1.08);
}

.guest-arch__start:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.guest-arch__back {
  margin-top: 12px;
  padding: 10px;
  background: transparent;
  border: none;
  color: var(--hex-text-secondary);
  font-size: 12px;
  cursor: pointer;
  min-height: 44px;
}

.guest-arch__back:hover {
  color: var(--hex-text-primary);
}
</style>
