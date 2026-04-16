<template>
  <div class="cf-v2">
    <div class="cf-scroll">
      <!-- Header -->
      <div class="cf-header">
        <button class="cf-back" @click="onBack">← {{ cv2.lblBack || 'BACK' }}</button>
        <div class="cf-steps">
          <span v-for="s in 3" :key="s" :class="['cf-step-dot', { active: step >= s, current: step === s }]">{{ s }}</span>
        </div>
      </div>

      <!-- Step 1: Archetype -->
      <div v-if="step === 1" class="cf-step">
        <div class="cf-step-title">{{ cv2.lblStep1 || 'CHOOSE ARCHETYPE' }}</div>
        <div class="cf-step-hint">{{ cv2.lblChooseArchetype || 'Choose your fighting style' }}</div>

        <ArchetypeSelector v-model="form.archetype" />

        <!-- Preview -->
        <div v-if="form.archetype" class="cf-preview" :style="{ borderColor: `var(--hex-arch-${form.archetype})` }">
          <img :src="`/images/skins/${form.skin}`" class="cf-preview-skin" alt="" />
          <div class="cf-preview-arch" :style="{ color: `var(--hex-arch-${form.archetype})` }">{{ form.archetype.toUpperCase() }}</div>
        </div>

        <HexButton variant="primary" size="lg" block :disabled="!form.archetype" @click="step = 2" class="cf-next-btn">
          {{ cv2.lblNext || 'NEXT' }}
        </HexButton>
      </div>

      <!-- Step 2: Name + Skin -->
      <div v-if="step === 2" class="cf-step">
        <div class="cf-step-title">{{ cv2.lblStep2 || 'NAME YOUR FIGHTER' }}</div>

        <div class="cf-name-row">
          <input v-model="form.name" :placeholder="cv2.lblNameHint || '2-20 characters'" maxlength="20" class="cf-name-input" />
          <button class="cf-gen-btn" @click="generateName">{{ cv2.lblGenerate || '🎲' }}</button>
        </div>
        <div v-if="nameError" class="cf-name-error">{{ nameError }}</div>

        <div class="cf-skin-label">SKIN</div>
        <SkinPicker v-model="form.skin" />

        <div class="cf-step-actions">
          <HexButton variant="ghost" size="sm" @click="step = 1">{{ cv2.lblBack || 'BACK' }}</HexButton>
          <HexButton variant="primary" size="lg" :disabled="!isNameValid" @click="step = 3">{{ cv2.lblNext || 'NEXT' }}</HexButton>
        </div>
      </div>

      <!-- Step 3: Confirm -->
      <div v-if="step === 3" class="cf-step">
        <div class="cf-step-title">{{ cv2.lblStep3 || 'CONFIRM' }}</div>

        <div class="cf-confirm-card" :style="{ borderColor: `var(--hex-arch-${form.archetype})` }">
          <img :src="`/images/skins/${form.skin}`" class="cf-confirm-skin" alt="" />
          <div class="cf-confirm-info">
            <div class="cf-confirm-name">{{ form.name }}</div>
            <div class="cf-confirm-arch" :style="{ color: `var(--hex-arch-${form.archetype})` }">{{ form.archetype?.toUpperCase() }}</div>
            <div class="cf-confirm-meta">ELO 1000 · White Belt</div>
          </div>
        </div>

        <div v-if="createError" class="cf-create-error">{{ createError }}</div>

        <div class="cf-step-actions">
          <HexButton variant="ghost" size="sm" @click="step = 2">{{ cv2.lblBack || 'BACK' }}</HexButton>
          <HexButton variant="primary" size="lg" :loading="creating" @click="onCreate">{{ cv2.lblCreate || 'CREATE FIGHTER' }}</HexButton>
        </div>
      </div>

      <div class="scroll-gap"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import HexButton from '@/components/ui/HexButton.vue';
import ArchetypeSelector from '@/components/club/ArchetypeSelector.vue';
import SkinPicker from '@/components/club/SkinPicker.vue';

const FIGHTER_NAMES = [
  'Shadowfist', 'Ironjaw', 'Nightstrike', 'Voidwalker', 'Steelclaw',
  'Blazefury', 'Frostbane', 'Thunderpaw', 'Crimsonblade', 'Ghostpunch',
  'Stormbreaker', 'Darkflare', 'Ashenwolf', 'Dreadnova', 'Silverbolt',
  'Hexviper', 'Obsidianfist', 'Pyrefang', 'Glacierheart', 'Venomstrike',
  'Bonecrusher', 'Nighthowl', 'Ironfist', 'Ravenclaw', 'Steelshadow',
  'Flamebringer', 'Froststeel', 'Thunderstrike', 'Ashblade', 'Voidpunch',
];

const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ0-9\s_-]{2,20}$/;

export default {
  name: 'CreateFighterViewV2',
  components: { HexButton, ArchetypeSelector, SkinPicker },
  setup() {
    const router = useRouter();
    const cv2 = computed(() => t.value.create?.v2 || {});
    const step = ref(1);
    const creating = ref(false);
    const createError = ref('');

    const form = ref({
      archetype: null,
      name: '',
      skin: 'skin_m_1.png',
    });

    const isNameValid = computed(() => NAME_REGEX.test(form.value.name.trim()));
    const nameError = computed(() => {
      const n = form.value.name.trim();
      if (!n) return '';
      if (n.length < 2) return 'Min 2 characters';
      if (n.length > 20) return 'Max 20 characters';
      if (!NAME_REGEX.test(n)) return 'Invalid characters';
      return '';
    });

    function generateName() {
      form.value.name = FIGHTER_NAMES[Math.floor(Math.random() * FIGHTER_NAMES.length)];
    }

    async function onCreate() {
      creating.value = true;
      createError.value = '';
      try {
        const agent = await store.dispatch('agent/createAgent', {
          name: form.value.name.trim(),
          skin: form.value.skin,
          primaryModule: form.value.archetype,
        });
        router.push(`/arena/club/${agent.id}`);
      } catch (err) {
        createError.value = err?.response?.data?.error || 'Failed to create';
      }
      creating.value = false;
    }

    function onBack() {
      if (step.value > 1) step.value--;
      else router.push('/arena/pit');
    }

    return { t, cv2, step, form, creating, createError, isNameValid, nameError, generateName, onCreate, onBack };
  },
};
</script>

<style scoped>
.cf-v2 {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}
@supports (height: 100dvh) { .cf-v2 { height: 100dvh; } }

.cf-scroll {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100%;
  padding: 80px 16px 120px;
  max-width: 600px;
  margin: 0 auto;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

/* Header */
.cf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.cf-back {
  background: none; border: none; color: var(--hex-text-secondary);
  font-family: var(--hex-font-body); font-size: 14px; cursor: pointer; min-height: 44px;
}
.cf-steps { display: flex; gap: 8px; }
.cf-step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--hex-font-mono); font-size: 12px;
  background: var(--hex-bg-medium); color: var(--hex-text-muted);
  border: 1px solid var(--hex-border-default);
  transition: all 0.2s;
}
.cf-step-dot.active { background: var(--hex-primary); color: #fff; border-color: var(--hex-primary); }
.cf-step-dot.current { box-shadow: 0 0 8px var(--hex-primary-glow); }

/* Step content */
.cf-step-title {
  font-family: var(--hex-font-display); font-size: 22px;
  color: var(--hex-text-primary); letter-spacing: 2px; margin-bottom: 4px;
}
.cf-step-hint { font-size: 13px; color: var(--hex-text-muted); margin-bottom: 16px; }

/* Preview */
.cf-preview {
  display: flex; align-items: center; gap: 16px;
  margin: 20px 0; padding: 16px;
  background: var(--hex-bg-card); border: 2px solid;
  border-radius: var(--hex-radius-lg);
}
.cf-preview-skin { width: 64px; height: 64px; border-radius: var(--hex-radius-md); object-fit: cover; object-position: top; }
.cf-preview-arch { font-family: var(--hex-font-display); font-size: 16px; letter-spacing: 2px; }

/* Name input */
.cf-name-row { display: flex; gap: 8px; margin-bottom: 8px; }
.cf-name-input {
  flex: 1; padding: 12px 14px;
  background: var(--hex-bg-card); border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md); color: var(--hex-text-primary);
  font-family: var(--hex-font-body); font-size: 15px; outline: none;
}
.cf-name-input:focus { border-color: var(--hex-border-active); }
.cf-name-input::placeholder { color: var(--hex-text-muted); }
.cf-gen-btn {
  width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
  background: var(--hex-bg-card); border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-md); font-size: 20px; cursor: pointer;
}
.cf-gen-btn:hover { border-color: var(--hex-border-active); }
.cf-name-error { font-size: 12px; color: var(--hex-danger); margin-bottom: 8px; }
.cf-skin-label {
  font-family: var(--hex-font-display); font-size: 11px;
  color: var(--hex-text-muted); letter-spacing: 2px; margin: 16px 0 8px;
}

/* Confirm card */
.cf-confirm-card {
  display: flex; align-items: center; gap: 16px;
  padding: 20px; margin: 20px 0;
  background: var(--hex-bg-card); border: 2px solid;
  border-radius: var(--hex-radius-lg);
}
.cf-confirm-skin { width: 80px; height: 80px; border-radius: var(--hex-radius-md); object-fit: cover; object-position: top; }
.cf-confirm-name { font-size: 20px; color: var(--hex-text-primary); font-weight: 500; margin-bottom: 4px; }
.cf-confirm-arch { font-family: var(--hex-font-display); font-size: 13px; letter-spacing: 2px; margin-bottom: 4px; }
.cf-confirm-meta { font-family: var(--hex-font-mono); font-size: 11px; color: var(--hex-text-muted); }
.cf-create-error { font-size: 13px; color: var(--hex-danger); margin-bottom: 8px; }

/* Actions */
.cf-step-actions { display: flex; gap: 12px; justify-content: space-between; margin-top: 16px; }
.cf-next-btn { margin-top: 16px; }

.scroll-gap { height: 80px; }
</style>
