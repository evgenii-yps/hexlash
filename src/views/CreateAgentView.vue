<template>
  <div class="background">
    <div class="create-agent-container">
      <!-- Header -->
      <div class="wizard-header">
        <button class="back-link" @click="onBack">&larr; {{ t.club.lblBack || 'Back' }}</button>
        <span class="wizard-step">{{ stepTitles[step] }} &nbsp; {{ step + 1 }}/3</span>
      </div>

      <!-- Step indicators -->
      <div class="step-dots">
        <span v-for="i in 3" :key="i" :class="['dot', { active: i - 1 === step, done: i - 1 < step }]" />
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

      <!-- Step 1: Build -->
      <div v-if="step === 1" class="step-content hex-fade-in">
        <ArchetypeSelector
          v-model="form.primaryModule"
          :label="t.club.lblPrimaryModule || 'Primary Module (50%)'"
        />
        <div class="module-spacer" />
        <ArchetypeSelector
          v-model="form.secondaryModule"
          :label="t.club.lblSecondaryModule || 'Secondary Module (30%)'"
        />
        <div class="module-spacer" />
        <ArchetypeSelector
          v-model="form.tertiaryModule"
          :label="t.club.lblTertiaryModule || 'Tertiary Module (20%)'"
        />

        <div class="step-actions">
          <HexButton variant="primary" block :disabled="!step1Valid" @click="step = 2">
            {{ t.club.lblNext || 'Next' }} &rarr;
          </HexButton>
        </div>
      </div>

      <!-- Step 2: Confirm -->
      <div v-if="step === 2" class="step-content hex-fade-in">
        <div class="confirm-preview">
          <img :src="`/images/skins/${form.skin}`" class="confirm-skin" />
          <div class="confirm-name">{{ form.name }}</div>
        </div>

        <div class="confirm-card">
          <div class="confirm-card-title">{{ t.club.lblBuild || 'Build' }}</div>
          <div class="confirm-row">
            <HexBadge variant="archetype" :archetype="form.primaryModule">{{ archName(form.primaryModule) }}</HexBadge>
            <span class="confirm-weight">50%</span>
          </div>
          <div class="confirm-row">
            <HexBadge variant="archetype" :archetype="form.secondaryModule">{{ archName(form.secondaryModule) }}</HexBadge>
            <span class="confirm-weight">30%</span>
          </div>
          <div class="confirm-row">
            <HexBadge variant="archetype" :archetype="form.tertiaryModule">{{ archName(form.tertiaryModule) }}</HexBadge>
            <span class="confirm-weight">20%</span>
          </div>
        </div>

        <div v-if="fightStyle" class="confirm-card">
          <div class="confirm-card-title">{{ t.club.lblFightStyle || 'Fight Style' }}</div>
          <div class="fight-style-text">{{ fightStyle }}</div>
        </div>

        <div class="confirm-card">
          <div class="confirm-card-title">{{ t.club.lblStartingStats || 'Starting Stats' }}</div>
          <div class="confirm-stat">ELO: 1000</div>
          <div class="confirm-stat-muted">{{ t.club.lblDeckEmpty || 'Empty deck — learn moves first' }}</div>
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
          <HexButton variant="ghost" block @click="step = 1" style="margin-top: 8px">
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
import { generateFightStylePreview } from '@/utils/fightStylePreview.js';
import HexButton from '@/components/ui/HexButton.vue';
import HexBadge from '@/components/ui/HexBadge.vue';
import SkinPicker from '@/components/club/SkinPicker.vue';
import ArchetypeSelector from '@/components/club/ArchetypeSelector.vue';

const router = useRouter();
const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ0-9\s_-]{2,20}$/;

const step = ref(0);
const creating = ref(false);
const createError = ref(null);
const minting = ref(false);
const nftRequired = ref(false); // set to true when NFT_MINTING_ENABLED + not first agent

const form = ref({
  name: '',
  skin: 'skin_m_1.png',
  primaryModule: null,
  secondaryModule: null,
  tertiaryModule: null,
});

const stepTitles = computed(() => [
  t.value.club?.lblNameAndSkin || 'Name & Skin',
  t.value.club?.lblBuild || 'Build',
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

const step1Valid = computed(() => {
  return form.value.primaryModule && form.value.secondaryModule && form.value.tertiaryModule;
});

const fightStyle = computed(() => {
  if (!step1Valid.value) return '';
  return generateFightStylePreview(form.value.primaryModule, form.value.secondaryModule, form.value.tertiaryModule);
});

const archName = (id) => {
  if (!id) return '';
  return t.value.cards?.archetypes?.[id] || id.charAt(0).toUpperCase() + id.slice(1);
};

const onBack = () => {
  if (step.value > 0) step.value--;
  else router.push('/arena/club');
};

const onMint = async () => {
  // TODO: integrate with nftMintService when NFT_MINTING_ENABLED=true
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
      primaryModule: form.value.primaryModule,
      secondaryModule: form.value.secondaryModule,
      tertiaryModule: form.value.tertiaryModule,
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
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

.wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.back-link {
  font-size: 13px;
  color: var(--hex-primary);
  background: none;
  border: none;
  cursor: pointer;
}
.wizard-step {
  font-family: 'Anonymous', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hex-text-muted);
}

.step-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
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

.step-content { min-height: 300px; }

/* Step 0: Name & Skin */
.skin-preview-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.skin-preview {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid var(--hex-primary);
  box-shadow: 0 0 16px rgba(255, 6, 111, 0.3);
}
.skin-preview-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  border: 2px dashed var(--hex-border-default);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--hex-text-muted);
}

.field { margin-bottom: 16px; }
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
}

.step-actions { margin-top: 20px; }

/* Step 1: Build */
.module-spacer { height: 16px; }

/* Step 2: Confirm */
.confirm-preview {
  text-align: center;
  margin-bottom: 16px;
}
.confirm-skin {
  width: 128px;
  height: 128px;
  border-radius: 12px;
  object-fit: cover;
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
.confirm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.confirm-weight {
  font-family: 'AnonymousBalance', monospace;
  font-size: 12px;
  color: var(--hex-text-muted);
}

.fight-style-text {
  font-size: 13px;
  color: var(--hex-text-secondary);
  line-height: 1.5;
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
</style>
