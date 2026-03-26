<template>
  <div class="profile-skins">
    <div class="back-btn-sticky">
      <BackButton :defaultRoute="backRef(route)"/>
    </div>

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
        <div class="skin-card-price">
          <span class="price-text">{{ t.profile.skins.lblFree }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import { useRoute } from 'vue-router';
import { backRef } from '@/router/index.js';
import BackButton from '@/components/ui/BackButton.vue';
const route = useRoute();

const master = computed(() => store.getters['master/getMaster']);
const currentSkin = computed(() => master.value?.userData?.skin || 'skin_m_1.png');

// Build skin list
const MALE_COUNT = 117;
const FEMALE_COUNT = 26;

const allSkins = (() => {
  const skins = [];
  for (let i = 1; i <= MALE_COUNT; i++) {
    const id = i === 23 ? 'skin_m_23_notstandart.png' : `skin_m_${i}.png`;
    skins.push({ id });
  }
  for (let i = 1; i <= FEMALE_COUNT; i++) {
    skins.push({ id: `skin_w_${i}.png` });
  }
  skins.push({ id: 'vip_k1.png' });
  skins.push({ id: 'vip_k2.png' });
  skins.push({ id: 'vip_t1.png' });
  skins.push({ id: 'vip_t2.png' });
  return skins;
})();

const selectSkin = (skinId) => {
  if (skinId === currentSkin.value) return;
  store.dispatch('master/changeSkin', skinId);
};

onMounted(() => {
  const contentContainer = document.querySelector('.profile-container');
  if (contentContainer) {
    contentContainer.scrollTo(0, 0);
  }
});
</script>

<style scoped>
.profile-skins {
  margin: 1.2rem 0 0 0;
}

.back-btn-sticky {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 100;
}

/* ── Preview ─────────────────────────────────────────── */
.skin-preview {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.skin-preview-img {
  width: 120px;
  height: 200px;
  filter: drop-shadow(0 4px 20px color-mix(in srgb, var(--hex-primary) 35%, transparent));
}

/* ── Grid ────────────────────────────────────────────── */
.skin-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px 40px;
}

.skin-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 6px;
  border: 1.5px solid var(--hex-border-active);
  background: var(--hex-bg-card);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.skin-card:active {
  transform: scale(0.95);
}

.skin-card-selected {
  border-color: var(--hex-primary);
  box-shadow: 0 0 12px color-mix(in srgb, var(--hex-primary) 45%, transparent);
}

.skin-card-img {
  width: 100%;
  height: 200px;
  padding: 6px;
}

.skin-card-price {
  width: 100%;
  text-align: center;
  padding: 3px 0;
  background: var(--hex-bg-card);
}

.price-text {
  font-size: 0.65rem;
  font-weight: bold;
  color: var(--hex-success);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
