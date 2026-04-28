<!-- Sub-Epic 5L Phase 3 — HudClan split child #2.
     Side panel: About description + Info meta rows + Action buttons
     (Invite / Settings / Leave). Pure presentational. Emits invite,
     edit, leave events to parent. CSS lives in src/styles/v24/clan.css
     (.app-v2 namespace, prototype lines 4922-4938). -->
<template>
  <div class="ic-side">
    <div class="ic-side-title">About</div>
    <div class="ic-desc">{{ description || '—' }}</div>

    <div class="ic-side-title">Info</div>
    <div class="ic-meta-list">
      <div class="ic-meta-row"><span class="imk">Leader</span><span class="imv">{{ leaderHandle || '—' }}</span></div>
      <div class="ic-meta-row"><span class="imk">Region</span><span class="imv">{{ region || '—' }}</span></div>
      <div class="ic-meta-row"><span class="imk">Privacy</span><span class="imv">{{ privacy || '—' }}</span></div>
      <div class="ic-meta-row"><span class="imk">Your Role</span><span class="imv">{{ clanRoleLabel }}</span></div>
    </div>

    <div class="ic-action-btns">
      <button class="ic-abtn primary" @click="emit('invite')">+ Invite Member</button>
      <button class="ic-abtn" @click="emit('edit')">Clan Settings</button>
      <button class="ic-abtn danger" @click="emit('leave')">Leave Clan</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  description: { type: String, default: '' },
  leaderHandle: { type: String, default: '' },
  region: { type: String, default: '' },
  privacy: { type: String, default: '' },
  clanRoleLabel: { type: String, default: '—' },
});

const emit = defineEmits(['invite', 'edit', 'leave']);
</script>
