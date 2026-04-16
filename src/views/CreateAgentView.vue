<template>
  <div class="background">
    <div class="create-agent-container">
      <!-- Header -->
      <div class="create-header">
        <button class="back-arrow" @click="onBack">&larr;</button>
        <span class="step-indicator">{{ t.club.lblStep || 'Step' }} {{ step + 1 }} / 2</span>
        <span class="header-spacer"></span>
      </div>

      <!-- Step 0: Name & Skin -->
      <div v-if="step === 0" class="step-content hex-fade-in">
        <div class="name-field">
          <label class="name-label">{{ t.club.lblName || 'NAME' }}</label>
          <input
            v-model="form.name"
            type="text"
            class="name-input"
            :placeholder="t.club.lblAgentName || 'Fighter name'"
            maxlength="20"
          />
          <div class="name-hint" :class="{ 'name-hint--error': nameError }">
            {{ nameError || (t.club.lblNameHint || '2-20 characters') }}
          </div>
        </div>

        <SkinPicker v-model="form.skin" />

        <div class="step-actions">
          <HexButton variant="primary" block :disabled="!step0Valid" @click="step = 1" class="next-btn">
            {{ t.club.lblNext || 'NEXT' }}
          </HexButton>
        </div>
      </div>

      <!-- Step 1: Confirm -->
      <div v-if="step === 1" class="step-content hex-fade-in">
        <div class="confirm-preview">
          <img :src="`/images/skins/${form.skin}`" class="confirm-skin" />
          <div class="confirm-name">{{ form.name }}</div>
        </div>

        <div class="confirm-card">
          <div class="confirm-card-title">{{ t.club.lblStartingStats || 'Starting Stats' }}</div>
          <div class="confirm-stat">ELO: 1000</div>
          <div class="confirm-stat-muted">{{ t.club.lblModulesHint || 'Configure modules and deck after creation' }}</div>
        </div>

        <!-- NFT Mint (when enabled and not first agent) -->
        <div v-if="nftRequired" class="confirm-card nft-card">
          <div class="confirm-card-title">{{ t.club.lblNftRequired || 'NFT Required' }}</div>
          <div class="nft-text">{{ t.club.lblFirstFree || 'First agent is free!' }} {{ t.club.lblNeedNfts || 'Mint an Agent NFT for additional agents.' }}</div>
          <HexButton variant="secondary" block :loading="minting" @click="onMint" style="margin-top: 8px">
            {{ minting ? (t.club.lblMinting || 'Minting...') : (t.club.lblMintAgent || 'Mint Agent NFT') }}
          </HexButton>
        </div>

        <div class="step-actions">
          <HexButton variant="primary" block :loading="creating" :disabled="nftRequired" @click="onCreate">
            {{ creating ? (t.club.lblCreating || 'Creating...') : (t.club.lblCreateAgent || 'Create Agent') }}
          </HexButton>
          <HexButton variant="ghost" block @click="step = 0" style="margin-top: 8px">
            &larr; {{ t.club.lblEdit || 'Edit' }}
          </HexButton>
        </div>

        <div v-if="createError" class="error-msg">{{ createError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import HexButton from '@/components/ui/HexButton.vue';
import SkinPicker from '@/components/club/SkinPicker.vue';

const router = useRouter();
const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ0-9\s_-]{2,20}$/;

const step = ref(0);
const creating = ref(false);
const createError = ref(null);
const minting = ref(false);
const nftRequired = ref(false);

const form = ref({
  name: '',
  skin: 'skin_m_1.png',
});

const nameError = computed(() => {
  const n = form.value.name;
  if (!n) return null;
  if (n.length < 2) return t.value.club?.errNameTooShort || 'Min 2 characters';
  if (n.length > 20) return t.value.club?.errNameTooLong || 'Max 20 characters';
  if (!NAME_REGEX.test(n)) return t.value.club?.errNameInvalid || 'Invalid characters';
  return null;
});

const step0Valid = computed(() => {
  return form.value.name.length >= 2 && form.value.name.length <= 20 && !nameError.value && form.value.skin;
});

const onBack = () => {
  if (step.value > 0) step.value--;
  else router.push('/arena/club');
};

const onMint = async () => {
  minting.value = true;
  try {
    store.commit('master/setInfo', { text: 'NFT minting not yet enabled' });
  } finally { minting.value = false; }
};

const onCreate = async () => {
  if (creating.value) return;
  creating.value = true;
  createError.value = null;
  try {
    const agent = await store.dispatch('agent/createAgent', {
      name: form.value.name.trim(),
      skin: form.value.skin,
    });
    store.commit('master/setInfo', { text: t.value.club?.msgAgentCreated || 'Agent created!' });
    router.push(`/arena/club/${agent.id}`);
  } catch (err) {
    createError.value = err?.response?.data?.error || t.value.club?.errCreateAgent || 'Failed to create agent';
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped>
.create-agent-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100vh;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
  padding: 80px 16px 120px;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

@supports (height: 100dvh) {
  .create-agent-container {
    height: 100dvh;
  }
}
/* Header */
.create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-shrink: 0;
}
.back-arrow {
  font-size: 22px;
  color: var(--hex-primary);
  background: none;
  border: none;
  cursor: pointer;
  width: 22px;
}
.back-arrow:hover { opacity: 0.7; }
.step-indicator {
  font-size: 14px;
  color: var(--hex-text-secondary);
  letter-spacing: 3px;
  text-transform: uppercase;
}
.header-spacer { width: 22px; }

.step-content { min-height: 0; flex: 1; display: flex; flex-direction: column; }

/* Step 0: Name & Skin */
.name-field { margin-bottom: 22px; flex-shrink: 0; }
.name-label {
  display: block;
  font-size: 13px;
  color: var(--hex-text-muted);
  letter-spacing: 2.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.name-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  font-family: inherit;
  color: var(--hex-text-primary);
  background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md, 8px);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.name-input:focus { border-color: var(--hex-primary); }
.name-input::placeholder { color: var(--hex-text-muted); }
.name-hint { margin-top: 6px; font-size: 11px; color: var(--hex-text-muted); }
.name-hint--error { color: var(--hex-defeat); }

/* SkinPicker overrides */
.step-content :deep(.skin-picker) { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.step-content :deep(.skin-grid-scroll) { max-height: none; flex: 1; min-height: 0; }
.step-content :deep(.skin-filter) {
  gap: 0;
  border-bottom: 1px solid var(--hex-border-default);
  margin-bottom: 14px;
}
.step-content :deep(.filter-btn) {
  border: none;
  border-radius: 0;
  background: none;
  padding: 8px 0;
  font-size: 11px;
  letter-spacing: 2px;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.step-content :deep(.filter-btn.active) {
  color: var(--hex-text-primary);
  border-bottom-color: var(--hex-text-primary);
  background: none;
}
.step-content :deep(.skin-item--selected) {
  border-color: var(--hex-text-primary);
  box-shadow: none;
}
.step-content :deep(.skin-grid) { gap: 8px; }

.step-actions { margin-top: 20px; flex-shrink: 0; }
.next-btn[disabled] { background: transparent; border: 1px solid var(--hex-border-default); }

/* Step 1: Confirm */
.confirm-preview {
  text-align: center;
  margin-bottom: 16px;
}
.confirm-skin {
  width: 128px;
  height: 170px;
  border-radius: 12px;
  object-fit: cover;
  object-position: top;
  border: 2px solid var(--hex-primary);
  box-shadow: 0 0 20px rgba(255, 6, 111, 0.3);
}
.confirm-name {
  margin-top: 8px;
  font-family: var(--hex-font-display);
  font-size: 18px;
  color: var(--hex-text-primary);
}

.confirm-card {
  background: var(--hex-bg-medium);
  border: 1px solid var(--hex-border-default);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.confirm-card-title {
  font-family: var(--hex-font-display);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  margin-bottom: 8px;
}

.confirm-stat {
  font-family: var(--hex-font-mono);
  font-size: 14px;
  color: var(--hex-text-primary);
}
.confirm-stat-muted {
  font-size: 11px;
  color: var(--hex-text-muted);
  margin-top: 2px;
}

.nft-card { border-color: var(--hex-draw); }
.nft-text { font-size: 12px; color: var(--hex-text-secondary); line-height: 1.4; }

.error-msg {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--hex-defeat);
}

@media (min-width: 1024px) {
  .create-agent-container {
    max-width: 1200px;
    padding: 100px 32px 120px;
  }
  .back-arrow { font-size: 28px; width: 28px; }
  .step-indicator { font-size: 18px; letter-spacing: 4px; }
  .header-spacer { width: 28px; }
  .create-header { margin-bottom: 32px; }
  .name-field { margin-bottom: 30px; }
  .name-label { font-size: 16px; letter-spacing: 3px; margin-bottom: 14px; }
  .name-input { padding: 18px 20px; font-size: 18px; }
  .name-hint { font-size: 13px; }
  .step-content :deep(.skin-filter) { margin-bottom: 20px; }
  .step-content :deep(.filter-btn) { padding: 12px 0; font-size: 13px; letter-spacing: 2.5px; }
  .step-content :deep(.skin-grid) { gap: 12px; }
  .step-content :deep(.skin-item) { border-radius: 8px; }
  .step-actions { margin-top: 24px; }
}
</style>
