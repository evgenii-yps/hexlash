<template>
  <div class="more-options">
    <button type="button" class="more-options__back" aria-label="Back to providers" @click="$emit('back')">
      ‹ Back
    </button>

    <h2 class="more-options__welcome">WELCOME</h2>
    <p class="more-options__hint">SELECT YOUR PREFERRED LOGIN OPTION</p>

    <div class="more-options__list">
      <ProviderButton @click="$emit('select', 'email')">
        <template #icon>
          <svg viewBox="0 0 18 18" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="14" height="10" rx="1.2"/>
            <path d="M2.5 5 L9 10 L15.5 5"/>
          </svg>
        </template>
        Email
      </ProviderButton>

      <ProviderButton @click="$emit('select', 'farcaster')">
        <template #icon>
          <svg viewBox="0 0 18 18" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3 H15 V15 H12 V8 L9 11 L6 8 V15 H3 Z"/>
          </svg>
        </template>
        Farcaster
      </ProviderButton>

      <ProviderButton @click="$emit('select', 'discord')">
        <template #icon>
          <svg viewBox="0 0 18 18" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 5 c-1.5 0-2.5 1-2.5 2.5 v3 c0 1.5 1 2.5 2.5 2.5 l1 1.5 h6 l1-1.5 c1.5 0 2.5-1 2.5-2.5 v-3 c0-1.5-1-2.5-2.5-2.5 z"/>
            <circle cx="6.5" cy="9" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="11.5" cy="9" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
        </template>
        Discord
      </ProviderButton>
    </div>
  </div>
</template>

<script setup>
import ProviderButton from './ProviderButton.vue';

defineEmits(['select', 'back']);
</script>

<style scoped>
.more-options {
  position: relative;
  display: flex;
  flex-direction: column;
}

.more-options__back {
  position: absolute;
  top: -14px;
  left: -10px;
  min-height: 44px;
  min-width: 44px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  color: var(--hex-text-muted);
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease;
  outline: none;
}

.more-options__back:hover {
  color: var(--hex-text-primary);
}

.more-options__back:focus-visible {
  color: var(--hex-primary);
  box-shadow: 0 0 0 2px var(--hex-primary-glow);
  border-radius: 2px;
}

.more-options__welcome {
  margin: 0 0 8px;
  text-align: center;
  font-family: inherit;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--hex-text-primary);
}

.more-options__hint {
  margin: 0 0 24px;
  text-align: center;
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
}

.more-options__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
