<template>
  <div class="background">
    <div class="create-agent-container">
      <div class="wizard-header">
        <button class="back-link" @click="onBack">&larr; {{ t.club.lblBack || 'Back' }}</button>
        <span class="wizard-step">{{ stepTitles[step] }} &nbsp; {{ step + 1 }}/2</span>
        <span class="wizard-header-spacer"></span>
      </div>

      <!-- Step indicators -->
      <div class="step-dots">
        <span v-for="i in 2" :key="i" :class="['dot', { active: i - 1 === step, done: i - 1 < step }]" />
      </div>

      <!-- Step 0: Name & Skin -->
      <div v-if="step === 0" class="step-content hex-fade-in">
        <div class="skin-preview-wrap">
          <img v-if="form.skin" :src="`/images/skins/${form.skin}`" class="skin-preview" />
          <div v-else class="skin-preview-placeholder">?</div>
        </div>

        <div class="field">
          <input
            v-model="form.name"
            type="text"
            class="name-input"
            :placeholder="t.club.lblAgentName || 'Agent name'"
            maxlength="20"
          />
          <div class="field-hint" :class="{ 'field-error': nameError }">
            {{ nameError || (t.club.lblNameHint || '2-20 characters') }}
          </div>
        </div>

        <div class="section-label">{{ t.club.lblChooseSkin || 'CHOOSE SKIN' }}</div>
        <SkinPicker v-model="form.skin" />

        <div class="step-actions">
          <HexButton variant="primary" block :disabled="!step0Valid" @click="step = 1">
            {{ t.club.lblNext || 'Next' }} &rarr;
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

const stepTitles = computed(() => [
  t.value.club?.lblNameAndSkin || 'Name & Skin',
  t.value.club?.lblConfirmStep || 'Confirm',
]);

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
.wizard-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.wizard-header-spacer {
  min-width: 60px;
}
.back-link {
  font-size: 16px;
  color: var(--hex-primary);
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'Anonymous', monospace;
  letter-spacing: 0.5px;
  padding: 6px 0;
  transition: opacity 0.2s;
  white-space: nowrap;
  min-width: 60px;
}
.back-link:hover {
  opacity: 0.7;
}
.wizard-step {
  font-family: 'Anonymous', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  flex: 1;
  text-align: center;
}

.step-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--hex-bg-light);
  transition: all 0.2s;
}
.dot.active { background: var(--hex-primary); box-shadow: 0 0 6px rgba(255, 6, 111, 0.5); }
.dot.done { background: var(--hex-primary); opacity: 0.5; }

.step-content { min-height: 0; flex: 1; display: flex; flex-direction: column; }

/* Step 0: Name & Skin */
.skin-preview-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.skin-preview {
  width: 120px;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
  object-position: top;
  border: 2px solid var(--hex-primary);
  box-shadow: 0 0 16px rgba(255, 6, 111, 0.3);
}
.skin-preview-placeholder {
  width: 120px;
  height: 160px;
  border-radius: 12px;
  border: 2px dashed var(--hex-border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--hex-text-muted);
}

.field { margin-bottom: 16px; flex-shrink: 0; }
.name-input {
  width: 100%;
  padding: 10px 12px;
  font-family: 'Anonymous', monospace;
  font-size: 14px;
  color: var(--hex-text-primary);
  background: var(--hex-bg-dark);
  border: 1px solid var(--hex-border-default);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}
.name-input:focus { border-color: var(--hex-primary); }
.name-input::placeholder { color: var(--hex-text-muted); }

.field-hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--hex-text-muted);
}
.field-error { color: var(--hex-defeat); }

.section-label {
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  margin-bottom: 8px;
  flex-shrink: 0;
}

.step-content :deep(.skin-picker) { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.step-content :deep(.skin-grid-scroll) { max-height: none; flex: 1; min-height: 0; }

.step-actions { margin-top: 20px; flex-shrink: 0; }

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
  font-family: 'Anonymous', monospace;
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
  font-family: 'Anonymous', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
  margin-bottom: 8px;
}

.confirm-stat {
  font-family: 'AnonymousBalance', monospace;
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
    max-width: 1024px;
  }
}
</style>
