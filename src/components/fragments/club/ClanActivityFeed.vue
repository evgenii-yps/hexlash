<template>
  <div class="activity-feed">
    <div v-if="groupedEvents.length === 0" class="no-activity">
      {{ t.club.lblNoActivity || 'No activity yet' }}
    </div>

    <div v-for="group in groupedEvents" :key="group.label" class="day-group">
      <div class="day-label">{{ group.label }}</div>
      <div v-for="event in group.events" :key="event.id" class="event-row">
        <span class="event-dot" :class="'dot-' + event.type"></span>
        <span class="event-text" v-html="event.html"></span>
        <span class="event-time">{{ event.timeStr }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { t } from "@/locales/index.js";

const props = defineProps({
  members: { type: Array, default: () => [] },
  clubData: { type: Object, default: null },
});

// Generate mock activity events from member data
const events = computed(() => {
  const list = [];
  const now = new Date();

  // Generate member_join events from members list
  if (props.members && props.members.length) {
    props.members.forEach((m, i) => {
      const name = m.name || m.login || 'Unknown';
      const joinDate = m.createdAt ? new Date(m.createdAt) : new Date(now.getTime() - (i + 1) * 86400000);
      list.push({
        id: `join-${m.id}`,
        type: 'member_join',
        html: `<b>${esc(name)}</b> ${t.value.club.lblJoinedClan || 'joined the clan'}`,
        date: joinDate,
      });
    });
  }

  // Generate fight events from members' wins data (mock)
  if (props.members && props.members.length) {
    props.members.slice(0, 5).forEach((m, i) => {
      const name = m.name || m.login || 'Unknown';
      const wins = m.wins || 0;
      if (wins > 0) {
        const fightDate = new Date(now.getTime() - i * 3600000 - Math.random() * 7200000);
        list.push({
          id: `fight-win-${m.id}`,
          type: 'fight_win',
          html: `<b>${esc(name)}</b> ${t.value.club.lblWonPvE || 'won PvE'}`,
          date: fightDate,
        });
      }
      if (m.losses > 0 || (m.battles && m.battles > wins)) {
        const loseDate = new Date(now.getTime() - i * 5400000 - Math.random() * 3600000);
        list.push({
          id: `fight-lose-${m.id}`,
          type: 'fight_lose',
          html: `<b>${esc(name)}</b> ${t.value.club.lblLostPvE || 'lost PvE'}`,
          date: loseDate,
        });
      }
    });
  }

  // Sort newest first
  list.sort((a, b) => b.date - a.date);
  return list.slice(0, 20);
});

// Group events by day
const groupedEvents = computed(() => {
  const groups = [];
  const now = new Date();
  const todayStr = dateKey(now);
  const yesterdayStr = dateKey(new Date(now.getTime() - 86400000));
  let currentKey = null;
  let currentGroup = null;

  for (const event of events.value) {
    const key = dateKey(event.date);
    const timeStr = event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const enriched = { ...event, timeStr };

    if (key !== currentKey) {
      currentKey = key;
      let label;
      if (key === todayStr) label = t.value.club.lblToday || 'Today';
      else if (key === yesterdayStr) label = t.value.club.lblYesterday || 'Yesterday';
      else label = event.date.toLocaleDateString();
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

.dot-member_join {
  background: var(--hex-primary);
  box-shadow: 0 0 6px var(--hex-primary-glow);
}

.dot-member_leave {
  background: var(--hex-text-muted);
}

.dot-member_kick {
  background: var(--hex-defeat);
}

.dot-role_change {
  background: var(--hex-info);
}

.dot-achievement {
  background: var(--hex-draw);
  box-shadow: 0 0 6px rgba(255, 184, 0, 0.5);
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
</style>
