<!-- Epic 3Bc Step 1 — Create view stub.
     Lazy scene registration pattern from 3Ba/3Bb. Real scene binding and
     materialize wiring land in Steps 2-10. -->
<template>
  <div class="create-view">
    <HudCreate @back="onBack" />
    <div ref="flashRef" class="materialize-flash"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import HudCreate from '@/components/hud/HudCreate.vue';

const router = useRouter();
const flashRef = ref(null);

function onBack() {
  router.push('/v2');
}

function onKeydown(e) {
  if (e.key === 'Escape') onBack();
}

onMounted(() => {
  // eslint-disable-next-line no-console
  console.log('[v2/create] view mounted (Step 1 stub)');
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.create-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}
</style>
