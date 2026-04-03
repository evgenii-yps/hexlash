<template>
  <span class="league-badge" :style="{ color: league.color, background: league.color + '18' }">
    {{ league.icon }} {{ league.name }}
  </span>
</template>

<script>
import { computed } from 'vue'
import { getLeague } from '@/utils/leagues.js'

export default {
  name: 'LeagueBadge',
  props: {
    elo: { type: Number, required: true },
  },
  setup(props) {
    const league = computed(() => getLeague(props.elo));
    return { league };
  },
};
</script>

<style scoped>
.league-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: 'Anonymous', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>
