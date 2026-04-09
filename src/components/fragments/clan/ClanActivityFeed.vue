<template>
  <div class="activity-feed">
    <div v-if="!loaded && loading" class="no-activity">
      {{ t.club.lblLoading || 'Loading...' }}
    </div>

    <div v-else-if="groupedEvents.length === 0" class="no-activity">
      {{ t.club.lblNoActivity || 'No activity yet' }}
    </div>

    <template v-else>
      <div v-for="group in groupedEvents" :key="group.label" class="day-group">
        <div class="day-label">{{ group.label }}</div>
        <div v-for="event in group.events" :key="event.id" class="event-row">
          <span class="event-dot" :class="'dot-' + event.type"></span>
          <span class="event-text" v-html="event.html"></span>
          <span class="event-time">{{ event.timeStr }}</span>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <button class="load-more-btn" :disabled="loading" @click="loadMore">
          {{ loading ? (t.club.lblLoading || 'Loading...') : (t.club.lblLoadMore || 'Load more') }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { t } from "@/locales/index.js";

const props = defineProps({
  clanId: { type: String, required: true },
});

const store = useStore();
const loaded = ref(false);

const loading = computed(() => store.state.clan.clanEventsLoading);
const hasMore = computed(() => store.state.clan.clanEventsHasMore);
const rawEvents = computed(() => store.state.clan.clanEvents);

onMounted(async () => {
  store.commit('clan/resetClanEvents');
  await store.dispatch('clan/fetchClanEvents', { clanId: props.clanId, limit: 30 });
  loaded.value = true;
});

async function loadMore() {
  const events = rawEvents.value;
  if (!events.length) return;
  const lastEvent = events[events.length - 1];
  await store.dispatch('clan/fetchClanEvents', {
    clanId: props.clanId,
    limit: 30,
    before: lastEvent.createdAt,
  });
}

function renderEventHtml(event) {
  const actorName = event.actor?.login || event.actor?.name || 'Unknown';
  const targetName = event.target?.login || event.target?.name || 'Unknown';
  const data = event.data || {};
  const mode = data.mode === 'pvp' ? 'PvP' : 'PvE';

  switch (event.type) {
    case 'fight_win':
      return `<b>${esc(actorName)}</b> ${t.value.club.lblWonPvP || 'won'} ${mode} vs <b>${esc(data.opponentName || '?')}</b> — ${data.playerHp ?? '?'} to ${data.opponentHp ?? '?'} HP`;
    case 'fight_lose':
      return `<b>${esc(actorName)}</b> ${t.value.club.lblLostPvP || 'lost'} ${mode} — ${data.playerHp ?? '?'} to ${data.opponentHp ?? '?'} HP`;
    case 'fight_draw':
      return `<b>${esc(actorName)}</b> ${t.value.club.lblDrewMatch || 'drew'} ${mode}`;
    case 'member_join':
      return `<b>${esc(actorName)}</b> ${t.value.club.lblJoinedClan || 'joined the clan'}`;
    case 'member_leave':
      return `<b>${esc(actorName)}</b> ${t.value.club.lblLeftClan || 'left the clan'}`;
    case 'member_kick':
      return `<b>${esc(targetName)}</b> ${t.value.club.lblWasKickedBy || 'was kicked by'} <b>${esc(actorName)}</b>`;
    case 'role_change':
      return `<b>${esc(actorName)}</b> ${t.value.club.lblPromotedTo || 'promoted'} <b>${esc(targetName)}</b> ${t.value.club.lblToRole || 'to'} ${data.role || '?'}`;
    case 'level_up':
      return `${t.value.club.lblClanReachedLevel || 'Clan reached Level'} <b>${data.level || '?'}</b>!`;
    default:
      return event.type;
  }
}

// Group events by day
const groupedEvents = computed(() => {
  const groups = [];
  const now = new Date();
  const todayStr = dateKey(now);
  const yesterdayStr = dateKey(new Date(now.getTime() - 86400000));
  let currentKey = null;
  let currentGroup = null;

  for (const event of rawEvents.value) {
    const date = new Date(event.createdAt);
    const key = dateKey(date);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const enriched = {
      id: event.id,
      type: event.type,
      html: renderEventHtml(event),
      timeStr,
    };

    if (key !== currentKey) {
      currentKey = key;
      let label;
      if (key === todayStr) label = t.value.club.lblToday || 'Today';
      else if (key === yesterdayStr) label = t.value.club.lblYesterday || 'Yesterday';
      else label = date.toLocaleDateString();
      currentGroup = { label, events: [] };
      groups.push(currentGroup);
    }
    currentGroup.events.push(enriched);
  }

  return groups;
});

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
</script>

<style scoped>
.activity-feed {
  padding: 0 16px;
}

.no-activity {
  text-align: center;
  color: var(--hex-text-muted);
  padding: 40px 0;
  font-size: 13px;
}

.day-group {
  margin-bottom: 16px;
}

.day-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  margin-bottom: 8px;
  padding-left: 16px;
}

.event-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;
}

.event-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
}

.dot-fight_win {
  background: var(--hex-victory);
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
}

.dot-fight_lose {
  background: var(--hex-defeat);
}

.dot-fight_draw {
  background: var(--hex-draw);
}

.dot-member_join {
  background: var(--hex-text-secondary);
}

.dot-member_leave {
  background: var(--hex-text-muted);
}

.dot-member_kick {
  background: var(--hex-warning, #FF9800);
}

.dot-role_change {
  background: var(--hex-info);
}

.dot-level_up {
  background: var(--hex-success);
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.3);
}

.event-text {
  flex: 1;
  font-size: 12px;
  color: var(--hex-text-secondary);
  line-height: 1.4;
}

.event-text :deep(b) {
  color: var(--hex-text-primary);
  font-weight: 600;
}

.event-time {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--hex-text-muted);
  margin-top: 2px;
}

.load-more {
  text-align: center;
  padding: 12px 0 4px;
}

.load-more-btn {
  background: transparent;
  border: 1px solid var(--hex-border-default);
  color: var(--hex-text-secondary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 8px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  border-color: var(--hex-border-active);
  color: var(--hex-text-primary);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
