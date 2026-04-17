<template>
  <div class="cp">
    <button class="cp-trigger" @click="openModal">
      <span v-if="selectedCountry" class="cp-flag">{{ codeToFlag(selectedCountry.code) }}</span>
      <span class="cp-name">{{ selectedCountry?.name || (pv2.lblSelectCountry || 'Select country') }}</span>
    </button>

    <Teleport to="body">
      <div v-if="isOpen" class="cp-overlay" @click.self="closeModal">
        <div class="cp-modal">
          <div class="cp-modal-header">
            <h3>{{ pv2.lblSelectCountry || 'Select country' }}</h3>
            <button class="cp-close" @click="closeModal">×</button>
          </div>
          <input
            ref="searchInput"
            v-model="searchQuery"
            class="cp-search"
            type="text"
            :placeholder="pv2.lblSearchCountry || 'Search…'"
            @keydown.esc="closeModal"
          />
          <div class="cp-list">
            <button
              v-for="c in filteredCountries"
              :key="c.code"
              class="cp-item"
              :class="{ '--selected': c.code === modelValue }"
              @click="selectCountry(c)"
            >
              <span class="cp-flag">{{ codeToFlag(c.code) }}</span>
              <span class="cp-name">{{ c.name }}</span>
              <span class="cp-code">{{ c.code }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed, nextTick } from 'vue';
import { COUNTRIES, codeToFlag, findCountry } from '@/data/countries.js';
import { t } from '@/locales/index.js';

export default {
  name: 'CountryPicker',
  props: {
    modelValue: { type: String, default: null },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false);
    const searchQuery = ref('');
    const searchInput = ref(null);
    const pv2 = computed(() => t.value?.profile?.v2 || {});

    const selectedCountry = computed(() => findCountry(props.modelValue));

    const filteredCountries = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      if (!q) return COUNTRIES;
      return COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
    });

    function openModal() {
      isOpen.value = true;
      searchQuery.value = '';
      nextTick(() => searchInput.value?.focus());
    }

    function closeModal() {
      isOpen.value = false;
    }

    function selectCountry(c) {
      emit('update:modelValue', c.code);
      closeModal();
    }

    return { isOpen, searchQuery, searchInput, selectedCountry, filteredCountries, codeToFlag, openModal, closeModal, selectCountry, pv2 };
  },
};
</script>

<style scoped>
.cp { position: relative; }
.cp-trigger {
  display: flex; align-items: center; gap: 8px;
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  padding: 8px 12px;
  font-family: var(--hex-font-mono);
  color: var(--hex-text-primary);
  cursor: pointer;
  font-size: 13px;
  width: 100%;
  text-align: left;
}
.cp-trigger:hover { border-color: var(--hex-border-active); }
.cp-flag { font-size: 18px; }

.cp-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.cp-modal {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md);
  width: 100%; max-width: 400px;
  max-height: 80vh;
  display: flex; flex-direction: column;
}
.cp-modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hex-border-default);
}
.cp-modal-header h3 {
  font-family: var(--hex-font-display);
  font-size: 14px;
  letter-spacing: 2px;
  color: var(--hex-text-primary);
  text-transform: uppercase;
  margin: 0;
}
.cp-close {
  background: none; border: none;
  color: var(--hex-text-primary);
  font-size: 24px; cursor: pointer;
  line-height: 1;
}
.cp-search {
  margin: 12px 16px;
  padding: 8px 12px;
  background: var(--hex-bg-deep);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-sm);
  color: var(--hex-text-primary);
  font-family: var(--hex-font-mono);
}
.cp-list {
  overflow-y: auto;
  padding: 0 8px 12px;
}
.cp-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: none; border: none;
  color: var(--hex-text-primary);
  cursor: pointer;
  font-family: var(--hex-font-mono);
  font-size: 13px;
  text-align: left;
  border-radius: var(--hex-radius-sm);
}
.cp-item:hover { background: var(--hex-bg-deep); }
.cp-item.--selected { background: var(--hex-bg-deep); border: 1px solid var(--hex-border-active); }
.cp-name { flex: 1; }
.cp-code { color: var(--hex-text-muted); font-size: 11px; }
</style>
