<template>
  <div class="provider-selector">
    <h2 class="provider-selector__welcome">WELCOME</h2>
    <p class="provider-selector__hint">SELECT YOUR PREFERRED LOGIN OPTION</p>

    <div class="provider-selector__list">
      <ProviderButton @click="$emit('select', 'google')">
        <template #icon>
          <svg viewBox="0 0 18 18" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 9.5c0-.5-.05-1-.13-1.5H9v3h4.05c-.18 1-.75 1.85-1.6 2.4v2h2.6c1.5-1.4 2.45-3.45 2.45-5.9z"/>
            <path d="M9 17c2.2 0 4.05-.73 5.4-1.97l-2.6-2.03c-.73.5-1.66.78-2.8.78-2.15 0-3.97-1.45-4.62-3.4H1.7v2.13C3.05 15.18 5.8 17 9 17z"/>
            <path d="M4.38 10.38c-.16-.5-.26-1.02-.26-1.55s.1-1.05.26-1.55V5.15H1.7C1.16 6.27.85 7.6.85 9s.31 2.73.85 3.85l2.68-2.47z"/>
            <path d="M9 4.4c1.2 0 2.28.42 3.13 1.23l2.3-2.3C13.05 2.05 11.2 1.2 9 1.2 5.8 1.2 3.05 3.02 1.7 5.65L4.38 7.78C5.03 5.83 6.85 4.4 9 4.4z"/>
          </svg>
        </template>
        Google
      </ProviderButton>

      <ProviderButton @click="$emit('select', 'x')">
        <template #icon>
          <svg viewBox="0 0 18 18" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 2 L16 16 M16 2 L2 16"/>
          </svg>
        </template>
        X
      </ProviderButton>

      <ProviderButton @click="$emit('select', 'web3')">
        <template #icon>
          <svg viewBox="0 0 18 18" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4.5" width="14" height="10" rx="1.5"/>
            <path d="M2 7.5 H16"/>
            <circle cx="12.5" cy="11" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
        </template>
        Web3 Wallet
      </ProviderButton>

      <ProviderButton chevron @click="$emit('select', 'more')">
        <template #icon>
          <svg viewBox="0 0 18 18" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="6" r="2.8"/>
            <path d="M3 16 c0-3 2.7-5 6-5 s6 2 6 5"/>
          </svg>
        </template>
        More options
      </ProviderButton>
    </div>

    <button type="button" class="provider-selector__referral" @click="$emit('referral')">
      I have referral code
    </button>
  </div>
</template>

<script setup>
import ProviderButton from './ProviderButton.vue';

defineEmits(['select', 'referral']);
</script>

<style scoped>
.provider-selector {
  display: flex;
  flex-direction: column;
}

.provider-selector__welcome {
  margin: 0 0 8px;
  text-align: center;
  font-family: inherit;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--hex-text-primary);
}

.provider-selector__hint {
  margin: 0 0 24px;
  text-align: center;
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--hex-text-secondary);
}

.provider-selector__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.provider-selector__referral {
  margin-top: 4px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid var(--hex-border-default);
  border-radius: 6px;
  color: var(--hex-text-secondary);
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
  outline: none;
  min-height: 44px;
}

.provider-selector__referral:hover {
  border-color: var(--hex-border-strong);
  color: var(--hex-text-primary);
}

.provider-selector__referral:focus-visible {
  border-color: var(--hex-primary);
  box-shadow: 0 0 0 3px var(--hex-primary-glow);
}
</style>
