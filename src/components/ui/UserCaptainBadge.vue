<template>
  <div v-if="captain" class="user-captain-badge" :class="`size-${size}`">
    <BeltBadge
      :grade="captain.belt || 0"
      :is-hexmaster="captain.isHexmaster || false"
      :size="badgeSize"
    />
    <span v-if="showName" class="captain-name">{{ captain.name }}</span>
  </div>
  <span v-else class="no-captain-text">—</span>
</template>

<script>
import BeltBadge from './BeltBadge.vue';
import { t } from '@/locales/index.js';

export default {
  name: 'UserCaptainBadge',
  components: { BeltBadge },
  props: {
    captain: { type: Object, default: null },
    size: { type: String, default: 'sm', validator: v => ['xs', 'sm', 'md'].includes(v) },
    showName: { type: Boolean, default: false },
  },
  setup() { return { t }; },
  computed: {
    badgeSize() {
      return { xs: 'sm', sm: 'sm', md: 'md' }[this.size];
    },
  },
};
</script>

<style scoped>
.user-captain-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.captain-name {
  font-size: 11px;
  color: var(--hex-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
.no-captain-text {
  font-size: 11px;
  color: var(--hex-text-muted);
}
</style>
