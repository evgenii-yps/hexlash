<template>
  <div class="archetype-selector">
    <div class="selector-label">{{ label }}</div>
    <div class="archetype-grid">
      <div
        v-for="arch in archetypes"
        :key="arch.id"
        :class="['arch-card', { 'arch-card--selected': arch.id === modelValue }]"
        :style="arch.id === modelValue ? { borderColor: `var(--hex-arch-${arch.id})`, background: `color-mix(in srgb, var(--hex-arch-${arch.id}) 10%, transparent)` } : {}"
        @click="$emit('update:modelValue', arch.id)"
      >
        <div class="arch-name" :style="arch.id === modelValue ? { color: `var(--hex-arch-${arch.id})` } : {}">{{ arch.name }}</div>
        <div class="arch-desc">{{ arch.desc }}</div>
      </div>
    </div>
    <div v-if="modelValue && selectedDesc" class="selector-hint">{{ selectedDesc }}</div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { t } from '@/locales/index.js'

const ARCHETYPE_IDS = ['predator', 'sentinel', 'ghost', 'analyst', 'maverick', 'juggernaut'];

export default {
  name: 'ArchetypeSelector',
  props: {
    modelValue: { type: String, default: null },
    label: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props) {
    const archetypes = computed(() =>
      ARCHETYPE_IDS.map(id => ({
        id,
        name: t.value.cards?.archetypes?.[id] || id.charAt(0).toUpperCase() + id.slice(1),
        desc: t.value.cards?.archetypeDesc?.[id] || '',
      }))
    );
    const selectedDesc = computed(() => {
      if (!props.modelValue) return '';
      return t.value.cards?.archetypeDesc?.[props.modelValue] || '';
    });
    return { archetypes, selectedDesc };
  },
};
</script>

<style scoped>
.selector-label {
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  margin-bottom: 8px;
}

.archetype-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
@media (max-width: 360px) {
  .archetype-grid { grid-template-columns: repeat(2, 1fr); }
}

.arch-card {
  padding: 10px 8px;
  border: 1.5px solid var(--hex-border-default);
  border-radius: 8px;
  background: var(--hex-bg-dark);
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.arch-card:active { transform: scale(0.95); }

.arch-card--selected {
  box-shadow: 0 0 8px rgba(255, 6, 111, 0.2);
}

.arch-name {
  font-family: 'Anonymous', monospace;
  font-size: 12px;
  color: var(--hex-text-primary);
  margin-bottom: 3px;
}

.arch-desc {
  font-size: 9px;
  color: var(--hex-text-muted);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.selector-hint {
  margin-top: 6px;
  font-size: 11px;
  color: var(--hex-text-secondary);
  font-style: italic;
}
</style>
