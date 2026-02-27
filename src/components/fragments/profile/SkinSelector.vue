<template>
  <div class="skin-section">
    <div class="skin-section-title">{{ t('profile.skins.lblTitle') }}</div>

    <!-- Current skin preview -->
    <div class="skin-preview">
      <v-img
        :src="`/images/skins/${currentSkin}`"
        class="skin-preview-img"
        aspect-ratio="1"
      />
    </div>

    <!-- Skin grid -->
    <div class="skin-grid">
      <div
        v-for="skin in allSkins"
        :key="skin.id"
        class="skin-card"
        :class="{ 'skin-card-selected': skin.id === currentSkin }"
        @click="selectSkin(skin.id)"
      >
        <v-img
          :src="`/images/skins/${skin.id}`"
          class="skin-card-img"
          aspect-ratio="1"
        />
        <span class="skin-card-label">{{ t('profile.skins.lblFree') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

const master = computed(() => store.getters['master/getMaster']);
const currentSkin = computed(() => master.value?.userData?.skin || 'skin_m_1.png');

// Build skin list
const MALE_COUNT = 117;
const FEMALE_COUNT = 26;

const allSkins = (() => {
  const skins = [];
  for (let i = 1; i <= MALE_COUNT; i++) {
    const id = i === 23 ? 'skin_m_23_notstandart.png' : `skin_m_${i}.png`;
    skins.push({ id, category: 'male' });
  }
  for (let i = 1; i <= FEMALE_COUNT; i++) {
    skins.push({ id: `skin_w_${i}.png`, category: 'female' });
  }
  skins.push({ id: 'vip_k1.png', category: 'vip' });
  skins.push({ id: 'vip_k2.png', category: 'vip' });
  skins.push({ id: 'vip_t1.png', category: 'vip' });
  skins.push({ id: 'vip_t2.png', category: 'vip' });
  return skins;
})();

const selectSkin = (skinId) => {
  if (skinId === currentSkin.value) return;
  store.dispatch('master/changeSkin', skinId);
};
</script>

<style scoped>
.skin-section {
  margin: 20px 16px 0;
  position: relative;
  z-index: 3;
}

.skin-section-title {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 14px;
  text-align: center;
}

/* ── Preview ─────────────────────────────────────────── */
.skin-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.skin-preview-img {
  width: 140px;
  height: 220px;
  filter: drop-shadow(0 4px 20px rgba(255, 6, 111, 0.3));
}

/* ── Grid ────────────────────────────────────────────── */
.skin-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
  padding: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 6, 111, 0.3) transparent;
}

.skin-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 4px;
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(135deg, rgba(9, 9, 9, 0.85) 0%, rgba(26, 26, 46, 0.5) 100%);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.skin-card:active {
  transform: scale(0.95);
}

.skin-card-selected {
  border-color: var(--primary-color);
  box-shadow:
    0 0 12px rgba(255, 6, 111, 0.4),
    0 0 24px rgba(255, 6, 111, 0.15);
}

.skin-card-img {
  width: 100%;
  height: 90px;
}

.skin-card-label {
  font-size: 0.5rem;
  font-weight: bold;
  color: #2ecc71;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
</style>
