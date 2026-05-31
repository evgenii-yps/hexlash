<template>
  <div class="auth-layout">
    <!-- AuthSelectorView paints the full screen (backdrop, logo, card, footer)
         per the design handoff — the layout is just a full-bleed dark host. -->
    <router-view v-slot="{ Component }">
      <transition name="auth-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
// Minimal shell. Logo header + glow moved into AuthSelectorView (the handoff
// design owns logo-above-card + footer + ember backdrop). Avoids a double logo.
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  min-height: 100dvh;
  background: #08080a;
}

.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: opacity 0.2s ease;
}
.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
}
</style>
