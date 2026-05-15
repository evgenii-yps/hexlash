<!-- Sub-Epic 5F Step 4 — HelpModal.
     Lazy-mounted via v-if in HudPit.vue (parent owns helpOpen ref).
     Mounted only when open → no overhead when closed. Symmetric with 5B
     ConnectWallet pattern.

     Pattern reuse from PhModal (src/components/hud/common/PhModal.vue):
     - Teleport to body — escapes .app-v2 wrapper for clean z-index stack.
     - Esc handler + backdrop click → emit('close').
     - Non-scoped style block (Step 5) — Teleport moves DOM out of SFC scope,
       so styles are namespaced via .help-* class prefix instead of scoped.

     Content: 6 inline EN sections (basics / hub navigation / training /
     pvp / clans / shop). i18n defer last per plan §R8 (5F decision Q5). -->
<template>
  <Teleport to="body">
    <div class="help-backdrop" @click="$emit('close')"></div>
    <div class="help-modal" role="dialog" aria-labelledby="helpTitle">
      <button class="help-close" @click="$emit('close')" aria-label="Close">×</button>
      <div class="help-kicker">How to play</div>
      <div id="helpTitle" class="help-title">HEXLASH</div>
      <div class="help-body">
        <section>
          <h3>The basics</h3>
          <p>Hexlash is a real-time PvP fighting game. Train your fighters, climb the ELO ladder, and earn cosmetics.</p>
        </section>
        <section>
          <h3>Hub navigation</h3>
          <p>Click 3D objects in the Pit to enter sub-views: heavy bag (Training), terminal (Matchmaking), scoreboard (Ratings), clan banner (Clan), shop locker (Shop), or "+" plinth (Create Fighter).</p>
        </section>
        <section>
          <h3>Training</h3>
          <p>Tap the heavy bag to gain Taps and free XP. Spend currency to upgrade fighter branches (Speed / Power / Tech).</p>
        </section>
        <section>
          <h3>PvP combat</h3>
          <p>Use the terminal to find an opponent in your ELO range. Real-time WebSocket matches. Win to climb, lose to fall.</p>
        </section>
        <section>
          <h3>Clans</h3>
          <p>Join or create a clan. Clan-mates appear in your roster. Activity feed shows recent fights and joins.</p>
        </section>
        <section>
          <h3>Shop</h3>
          <p>Spend Taps, XP, or Base ETH on cosmetic skins, gloves, boosts, titles, and banners. Cosmetics-only — no pay-to-win.</p>
        </section>
        <div class="help-full-guide">
          <button type="button" class="help-full-guide-link" @click="onFullGuide">
            Want more detail? Full game guide →
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const emit = defineEmits(['close']);
const router = useRouter();

// Esc handler bound for the lifetime of the mounted component (lazy-mount
// pattern means component exists only when modal is shown, so we don't need
// to gate the listener on an `open` prop).
function onKeyDown(e) {
  if (e.key === 'Escape') emit('close');
}

// Secondary entry into full HelpView. Close modal first (emit upward — parent
// HudPit owns helpOpen ref), then navigate. Same-tab navigation per spec.
function onFullGuide() {
  emit('close');
  router.push('/play/help');
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<!-- Styles arrive in Step 5 (src/styles/v24/help.css). Non-scoped because
     Teleport moves the markup outside the SFC; namespacing via .help-* class
     prefix prevents collision with legacy CSS. PhModal precedent. -->
