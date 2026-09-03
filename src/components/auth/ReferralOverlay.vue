<template>
  <Teleport to="body">
    <div
      class="referral-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Referral code"
      @click.self="$emit('close')"
    >
      <div class="referral-overlay__card">
        <button
          type="button"
          class="referral-overlay__close"
          aria-label="Close referral dialog"
          @click="$emit('close')"
        >
          ×
        </button>

        <h3 class="referral-overlay__title">REFERRAL CODE</h3>
        <p class="referral-overlay__hint">Enter the code shared by your referrer to unlock bonuses.</p>

        <input
          ref="inputRef"
          v-model.trim="code"
          type="text"
          class="referral-overlay__input"
          placeholder="HEX-XXXX-XXXX"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          @keydown.enter="onApply"
        />

        <button
          type="button"
          class="referral-overlay__apply"
          :disabled="!code"
          @click="onApply"
        >
          Apply
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const emit = defineEmits(['apply', 'close']);

const code = ref('');
const inputRef = ref(null);

onMounted(() => {
  // Autofocus input on open
  inputRef.value?.focus();

  // Esc key closes
  document.addEventListener('keydown', onKeydown);
});

function onKeydown(e) {
  if (e.key === 'Escape') emit('close');
}

function onApply() {
  if (!code.value) return;
  emit('apply', code.value);
}

import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.referral-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: color-mix(in srgb, var(--void) 45%, transparent);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  animation: referral-fade-in 0.18s ease;
}

@keyframes referral-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.referral-overlay__card {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 28px 24px 24px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.referral-overlay__close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--ink-off);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease;
  outline: none;
}

.referral-overlay__close:hover {
  color: var(--ink);
}

.referral-overlay__close:focus-visible {
  color: var(--pink);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pink) 50%, transparent);
  border-radius: 4px;
}

.referral-overlay__title {
  margin: 0 0 8px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink);
  text-align: center;
}

.referral-overlay__hint {
  margin: 0 0 20px;
  font-size: 12px;
  color: var(--ink-dim);
  text-align: center;
  line-height: 1.5;
}

.referral-overlay__input {
  width: 100%;
  padding: 14px;
  margin-bottom: 16px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  letter-spacing: 0.2em;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.referral-overlay__input::placeholder {
  color: var(--ink-off);
  letter-spacing: 0.15em;
}

.referral-overlay__input:focus {
  border-color: var(--pink);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pink) 50%, transparent);
}

.referral-overlay__apply {
  width: 100%;
  padding: 14px;
  min-height: 48px;
  background: var(--pink);
  color: var(--ink);
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.08s ease, opacity 0.15s ease;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--pink) 25%, transparent);
  outline: none;
}

.referral-overlay__apply:hover:not(:disabled) {
  filter: brightness(1.08);
}

.referral-overlay__apply:active:not(:disabled) {
  transform: translateY(1px);
}

.referral-overlay__apply:focus-visible {
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--pink) 50%, transparent);
}

.referral-overlay__apply:disabled {
  background: var(--panel);
  color: var(--ink-off);
  box-shadow: none;
  cursor: not-allowed;
}
</style>
