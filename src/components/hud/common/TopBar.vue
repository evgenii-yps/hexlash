<!-- Epic 2 — pit-view hub. Step 17.
     Top bar: resource cards (Gold / Energy / ELO) on the left, centred pit
     title (HEXLASH kicker + "THE PIT" name + LVL/XP meta), avatar button on
     the right. Values are static placeholders — real data wiring is Epic 3.
     Source: prototype 4303-4344. All classes prefixed .v2- to avoid collision
     with legacy CSS.
     Sub-Epic 5B hot-fix 10.2: avatar initials bound to master.userData.login
     (was hardcoded 'YV' — Epic 2 era placeholder). -->
<template>
  <div class="v2-topbar">
    <div class="v2-topbar__left">
      <div class="v2-res">
        <div class="v2-res__label">Gold</div>
        <div class="v2-res__val">12,450</div>
      </div>
      <div class="v2-res">
        <div class="v2-res__label">Energy</div>
        <div class="v2-res__val">42 / 60</div>
      </div>
      <!-- Guests have no Belt/ELO/rating — show session Wins/Streak instead. -->
      <template v-if="isGuest">
        <div class="v2-res">
          <div class="v2-res__label">Wins</div>
          <div class="v2-res__val">{{ guestWins }}</div>
        </div>
        <div class="v2-res">
          <div class="v2-res__label">Streak</div>
          <div class="v2-res__val">{{ guestStreak }}</div>
        </div>
      </template>
      <div v-else class="v2-res">
        <div class="v2-res__label">ELO</div>
        <div class="v2-res__val">1,247</div>
      </div>
    </div>

    <div class="v2-pit-title">
      <div class="v2-pit-title__kicker">Hexlash</div>
      <div class="v2-pit-title__name">THE PIT</div>
      <div class="v2-pit-title__meta">LVL 1 · 250 / 1000 XP</div>
    </div>

    <div class="v2-topbar__right">
      <!-- Guest: understated escape hatch back to the landing site. Session
           stays in localStorage and is restored on next /play visit. -->
      <button v-if="isGuest" class="tb-home-btn" @click="onHome">‹ Home</button>
      <!-- Guest: neutral label (no glow) + persistent, understated Sign Up CTA. -->
      <span v-if="isGuest" class="tb-guest-label">Guest<template v-if="guestArchetypeName"> · {{ guestArchetypeName }}</template></span>
      <button v-if="isGuest" class="tb-signup-btn" @click="onSignUp">Sign Up</button>
      <button class="tb-help-btn" @click="$emit('help-click')" aria-label="Help">?</button>
      <button class="v2-avatar-btn" @click="$emit('avatar-click')">
        <span>{{ avatarInitials }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { ARCHETYPES } from '@/scene/interaction/useCreateState.js';

defineEmits(['avatar-click', 'help-click']);

const router = useRouter();

const avatarInitials = computed(() => {
  const login = store.getters['master/getMaster']?.userData?.login || '';
  return login.slice(0, 2).toUpperCase() || '??';
});

const isGuest = computed(() => store.getters['master/getIsGuest']);
const guestSession = computed(() => store.getters['master/getGuestSession']);
const guestWins = computed(() => guestSession.value?.wins ?? 0);
const guestStreak = computed(() => guestSession.value?.streak ?? 0);
const guestArchetypeName = computed(() => {
  const id = guestSession.value?.archetypeId;
  return ARCHETYPES.find((a) => a.id === id)?.name || '';
});

function onSignUp() {
  router.push('/auth/signup');
}

function onHome() {
  router.push('/');
}
</script>

<style scoped>
.v2-topbar {
  position: fixed;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 50;
  pointer-events: none;
}

.v2-topbar__left {
  display: flex;
  gap: 8px;
  pointer-events: auto;
}

/* Right-side cluster: ? help button + avatar button (5F Step 4 added).
   pointer-events: auto so children can be clicked through .v2-topbar's
   default pointer-events: none. */
.v2-topbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
}

.v2-res {
  padding: 6px 12px;
  background: rgba(14, 16, 28, 0.72);
  border: 1px solid rgba(212, 168, 67, 0.35);
  font-family: var(--font-mono);
  min-width: 72px;
}

.v2-res__label {
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.v2-res__val {
  font-size: 14px;
  color: #fff;
  margin-top: 2px;
  letter-spacing: 0.5px;
}

.v2-pit-title {
  text-align: center;
  pointer-events: none;
}

.v2-pit-title__kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.v2-pit-title__name {
  font-family: var(--font-display);
  font-size: 28px;
  letter-spacing: 6px;
  color: #fff;
  margin-top: 2px;
}

.v2-pit-title__meta {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--text-mid);
  margin-top: 4px;
}

.v2-avatar-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(14, 16, 28, 0.72);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  pointer-events: auto;
}

.v2-avatar-btn:hover {
  border-color: var(--hex-primary);
  background: rgba(32, 24, 40, 0.85);
}

.v2-avatar-btn:active {
  transform: scale(0.97);
}

/* Home — tertiary escape hatch back to the landing site. Text-only, no
   border/fill so it stays quieter than Sign Up and never competes with the
   pink accent or the primary FIGHT action. */
.tb-home-btn {
  padding: 8px 6px;
  background: none;
  border: none;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s;
  min-height: 36px;
}

.tb-home-btn:hover {
  color: #fff;
}

/* Guest label — neutral, no glow (per Neon Discipline guest rules). */
.tb-guest-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--text-mid);
  white-space: nowrap;
  align-self: center;
}

/* Persistent Sign Up — secondary, NOT the pink accent. Subtle bordered chip. */
.tb-signup-btn {
  padding: 8px 12px;
  background: rgba(14, 16, 28, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  min-height: 36px;
}

.tb-signup-btn:hover {
  border-color: var(--hex-primary);
  background: rgba(32, 24, 40, 0.85);
}
</style>
