<template>
  <div class="auth-tabs" role="tablist" aria-label="Authentication mode">
    <button
      type="button"
      role="tab"
      class="auth-tabs__tab"
      :class="{ 'auth-tabs__tab--active': mode === 'login' }"
      :aria-selected="mode === 'login'"
      :tabindex="mode === 'login' ? 0 : -1"
      @click="$emit('change', 'login')"
    >
      Login
    </button>
    <button
      type="button"
      role="tab"
      class="auth-tabs__tab"
      :class="{ 'auth-tabs__tab--active': mode === 'signup' }"
      :aria-selected="mode === 'signup'"
      :tabindex="mode === 'signup' ? 0 : -1"
      @click="$emit('change', 'signup')"
    >
      Sign up
    </button>
  </div>
</template>

<script setup>
defineProps({
  mode: {
    type: String,
    required: true,
    validator: (v) => ['login', 'signup'].includes(v),
  },
});

defineEmits(['change']);
</script>

<style scoped>
.auth-tabs {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--hex-border-default);
}

.auth-tabs__tab {
  position: relative;
  min-height: 44px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--hex-text-muted);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: color 0.15s ease;
  outline: none;
}

.auth-tabs__tab:hover:not(.auth-tabs__tab--active) {
  color: var(--hex-text-secondary);
}

.auth-tabs__tab:focus-visible {
  box-shadow: inset 0 0 0 2px var(--hex-primary-glow);
  border-radius: 2px;
}

.auth-tabs__tab--active {
  color: var(--hex-text-primary);
}

.auth-tabs__tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--hex-primary);
  box-shadow: 0 4px 12px rgba(255, 6, 111, 0.3);
}
</style>
