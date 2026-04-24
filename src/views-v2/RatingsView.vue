<!-- Sub-Epic 5C Step 1 stub. Full orchestrator lands in Step 5:
     build scene + register/activate + resize/keydown listeners + strict
     teardown (activateScene('pit') → unregisterScene → dispose). -->
<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

function handleKeydown(e) {
  if (e.key === 'Escape') {
    router.push('/v2');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
  // TODO Step 5: buildRatingsScene + registerScene + activateScene
  // TODO Step 5: resize listener
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  // TODO Step 5: activateScene('pit') → unregisterScene → dispose
});

function handleBack() {
  router.push('/v2');
}
</script>

<template>
  <div class="ratings-view">
    <!-- HudRatings mounted in Step 5 when scene API is wired. -->
  </div>
</template>

<style scoped>
.ratings-view {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
</style>
