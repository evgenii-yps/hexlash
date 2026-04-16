<template>
  <div class="app-shell">
    <!-- Global atmosphere layers — always rendered behind content -->
    <div class="grain" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <!-- View content with fade-blur transition -->
    <router-view v-slot="{ Component, route }">
      <transition name="view-fade" mode="out-in" :duration="{ enter: 400, leave: 300 }">
        <component
          :is="Component"
          :key="activeView"
          @scroll="$emit('scroll', $event)"
        />
      </transition>
    </router-view>
  </div>
</template>

<script>
import { useActiveView } from '@/composables/useActiveView';

export default {
  name: 'AppShell',
  emits: ['scroll'],
  setup() {
    const { activeView } = useActiveView();
    return { activeView };
  },
};
</script>

<style scoped>
.app-shell {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

/* View-fade transition — opacity + blur */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.4s ease, filter 0.4s ease;
}

.view-fade-enter-from {
  opacity: 0;
  filter: blur(8px);
}

.view-fade-leave-to {
  opacity: 0;
  filter: blur(6px);
}
</style>
