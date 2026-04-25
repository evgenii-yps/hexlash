<!-- Epic 5 — Sub-Epic 5D Step 6 Part 4.
     HUD shell for /v2/clan — wrapper + state-branched markup. Template port
     of prototype hexlash_v24.html lines 4887-4981 minus dev-only demo-toggle.
     State derived from userData.clanId — no-clan branch (Step 7) shows
     browse + Create CTA, in-clan branch (Step 8) shows roster + stats.
     Scoped CSS selector aligned to template root class (.clan-hud) per
     5C HudRatings convention + lesson #22 pre-commit grep. -->
<template>
  <div class="hud clan-hud">
    <button class="clan-back" @click="onBack">← Back</button>
    <div class="clan-title">
      <div class="ct-kicker">Hexlash</div>
      <div class="ct-name">{{ inClan ? (clanName || 'CLAN') : 'CLANS' }}</div>
    </div>

    <div v-if="clanLoading" class="clan-loading">Loading clan…</div>

    <div v-else-if="!inClan" class="clan-noclan">
      <!-- populated Step 7 -->
    </div>

    <div v-else class="clan-ingrid">
      <!-- populated Step 8 -->
    </div>
  </div>
</template>

<script setup>
// State derives from master.userData (clanId / clanRole) — single source of
// truth for "am I in a clan, and which role?". The actual Clan object (name,
// tag, members, level, …) lives in the namespaced `clan/` Vuex module and is
// fetched lazily on mount when clanId is present but the cache is empty.
//
// Reactive imports (shallowRef / markRaw / nextTick) reserved for Step 7+8
// lazy modal mounts (CreateClan / ClanEdit) per spec §3 Step 7/8.
import { computed, ref, shallowRef, markRaw, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

const master = computed(() => store.getters['master/getMaster']);
const clanId = computed(() => master.value?.userData?.clanId ?? null);
const clanRole = computed(() => master.value?.userData?.clanRole ?? null);
const inClan = computed(() => !!clanId.value);

const clanLoading = ref(false);

const clan = computed(() =>
  clanId.value ? store.getters['clan/getClanById'](clanId.value) : null,
);

const clanName = computed(() => clan.value?.name || '');
const clanTag = computed(() => clan.value?.tag || '');

function onBack() {
  router.push('/v2');
}

onMounted(async () => {
  // Async clan fetch only fires when user is in a clan AND cache is empty.
  // 99% of accounts will be `clanId === null` — short-circuit no-op.
  if (clanId.value && !clan.value) {
    clanLoading.value = true;
    try {
      await store.dispatch('clan/getClanById', clanId.value);
    } finally {
      clanLoading.value = false;
    }
  }
});
</script>

<style scoped>
/* Wrapper-only positioning. All .clan-* / .nc-* / .ic-* styles live in
   src/styles/v24/clan.css (scoped to .app-v2).
   Selector matches template root class (`<div class="hud clan-hud">`,
   prototype line 4887) per 5C HudRatings convention (`{name}-hud`).
   Pre-commit grep per lesson #22: literal selector ↔ template root class
   match check. */
.clan-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.clan-hud > * {
  pointer-events: auto;
}
</style>
