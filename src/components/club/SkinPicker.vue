<template>
  <div class="skin-picker">
    <div class="skin-filter">
      <button :class="['filter-btn', { active: filter === 'all' }]" @click="filter = 'all'">{{ t.club.lblAll || 'All' }}</button>
      <button :class="['filter-btn', { active: filter === 'male' }]" @click="filter = 'male'">{{ t.club.lblMale || 'Male' }}</button>
      <button :class="['filter-btn', { active: filter === 'female' }]" @click="filter = 'female'">{{ t.club.lblFemale || 'Female' }}</button>
    </div>
    <div class="skin-grid-scroll">
      <div class="skin-grid">
        <div
          v-for="skin in filteredSkins"
          :key="skin"
          :class="['skin-item', { 'skin-item--selected': skin === modelValue }]"
          @click="$emit('update:modelValue', skin)"
        >
          <img :src="`/images/skins/${skin}`" :alt="skin" class="skin-thumb" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { t } from '@/locales/index.js'

const MALE_SKINS = Array.from({ length: 117 }, (_, i) =>
  i === 22 ? 'skin_m_23_notstandart.png' : `skin_m_${i + 1}.png`
);
const FEMALE_SKINS = Array.from({ length: 26 }, (_, i) => `skin_w_${i + 1}.png`);
const ALL_SKINS = [...MALE_SKINS, ...FEMALE_SKINS];

export default {
  name: 'SkinPicker',
  props: {
    modelValue: { type: String, default: null },
  },
  emits: ['update:modelValue'],
  setup() {
    const filter = ref('all');
    const filteredSkins = computed(() => {
      if (filter.value === 'male') return MALE_SKINS;
      if (filter.value === 'female') return FEMALE_SKINS;
      return ALL_SKINS;
    });
    return { t, filter, filteredSkins };
  },
};
</script>

<style scoped>
.skin-filter {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.filter-btn {
  flex: 1;
  padding: 6px 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid var(--hex-border-default);
  border-radius: 6px;
  background: var(--hex-bg-dark);
  color: var(--hex-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn.active {
  border-color: var(--hex-primary);
  color: var(--hex-primary);
  background: rgba(255, 6, 111, 0.08);
}

.skin-grid-scroll {
  max-height: 280px;
  overflow-y: auto;
  border-radius: 8px;
}
.skin-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
@media (max-width: 360px) {
  .skin-grid { grid-template-columns: repeat(4, 1fr); }
}

.skin-item {
  border-radius: 6px;
  border: 1.5px solid var(--hex-border-default);
  background: var(--hex-bg-card, var(--hex-bg-medium));
  cursor: pointer;
  overflow: hidden;
  transition: all 0.15s;
}
.skin-item:active { transform: scale(0.93); }
.skin-item--selected {
  border-color: var(--hex-primary);
  box-shadow: 0 0 10px rgba(255, 6, 111, 0.4);
}
.skin-thumb {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: top;
  display: block;
}
</style>
