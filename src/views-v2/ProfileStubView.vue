<!-- Game-cleanup reset: empty profile stub.
     The previous profile screen (stats / agents / clan / etc.) was removed.
     Profile will be redesigned. This empty modal-style stub keeps /play/profile
     routable. Account + Wallet sub-routes remain functional separately. -->
<template>
  <div class="profile-stub">
    <button class="profile-stub__back" @click="goBack">← Back</button>
    <div class="profile-stub__modal">
      <div class="profile-stub__title">PROFILE</div>
      <div class="profile-stub__note">Profile is being redesigned.</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
function goBack() {
  router.push('/play');
}
</script>

<style scoped>
.profile-stub {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep, #070811);
  padding: 24px;
}
.profile-stub__back {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 60;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-mid, #cfcfd6);
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.profile-stub__modal {
  background: var(--bg-panel, rgba(20, 20, 28, 0.9));
  border: 1px solid var(--hex-border-default, rgba(255, 255, 255, 0.12));
  border-radius: 12px;
  padding: 40px 48px;
  text-align: center;
}
.profile-stub__title {
  font-family: var(--font-display, 'Anonymous'), monospace;
  font-size: 1.5rem;
  letter-spacing: 0.25em;
  color: var(--text-strong, #fff);
}
.profile-stub__note {
  margin-top: 12px;
  font-family: var(--font-mono, monospace);
  font-size: 0.85rem;
  color: var(--text-dim, #888);
}
</style>
