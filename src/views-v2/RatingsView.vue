<!-- Sub-Epic 5C Step 1 stub. Full orchestrator lands in Step 5:
     build scene + register/activate + resize/keydown listeners + strict
     teardown (activateScene('pit') → unregisterScene → dispose). -->
<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // TODO Step 5: buildRatingsScene + registerScene + activateScene
  // TODO Step 5: resize + keydown listeners
});

onBeforeUnmount(() => {
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
