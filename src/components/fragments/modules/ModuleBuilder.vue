<template>
  <div class="module-builder">
    <!-- Fighter avatar -->
    <div class="fighter-avatar">
      <v-img :src="`/images/skins/${master?.userData?.skin || 'skin_m_1.png'}`" class="avatar-skin"/>
    </div>

    <!-- 3 module slots -->
    <div class="module-slots">
      <div v-for="slot in 3" :key="slot" class="module-slot" :class="{ 'slot-primary': slot === 1 }">
        <div class="slot-label">{{ slotLabels[slot - 1] }}</div>
        <div
            class="slot-content"
            :class="{ 'slot-filled': selectedModules[slot - 1] }"
            @click="openModuleSelect(slot - 1)"
        >
          <template v-if="selectedModules[slot - 1]">
            <span class="module-icon">{{ getArchetype(selectedModules[slot - 1]).icon }}</span>
            <span class="module-name">{{ getArchetype(selectedModules[slot - 1]).nameRu }}</span>
          </template>
          <template v-else>
            <span class="slot-placeholder">+</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Build style preview -->
    <div class="build-preview" v-if="isComplete">
      <div class="preview-title">{{ t('arena.lblBuildStyle') }}</div>
      <div class="preview-text">{{ buildDescription }}</div>
    </div>

    <!-- Emergency Protocol selector -->
    <div class="emergency-protocol">
      <div class="protocol-title">{{ t('arena.lblEmergencyProtocol') }}</div>
      <div class="protocol-options">
        <div
            v-for="protocol in emergencyProtocols"
            :key="protocol.id"
            class="protocol-option"
            :class="{ 'protocol-selected': selectedProtocol === protocol.id }"
            @click="selectProtocol(protocol.id)"
        >
          <span class="protocol-icon">{{ protocol.icon }}</span>
          <span class="protocol-name">{{ protocol.name }}</span>
          <span class="protocol-trigger">{{ protocol.trigger }}</span>
        </div>
      </div>
    </div>

    <!-- Module selection modal -->
    <div class="module-modal" v-if="showModal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-title">{{ t('arena.lblSlotPrimary') }} {{ activeSlot + 1 }}</div>
        <div class="archetypes-grid">
          <div
              v-for="archetype in archetypes"
              :key="archetype.id"
              class="archetype-card"
              :class="{ 'archetype-used': isArchetypeUsed(archetype.id) }"
              @click="selectArchetype(archetype.id)"
          >
            <span class="archetype-icon">{{ archetype.icon }}</span>
            <span class="archetype-name">{{ archetype.nameRu }}</span>
            <span class="archetype-desc">{{ archetype.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ARCHETYPES } from '@/core/data/archetypes.js';
import store from '@/core/state/store.js';

const { t } = useI18n({ useScope: 'global' });
const master = computed(() => store.getters['master/getMaster']);

const slotLabels = computed(() => [
  t('arena.lblSlotPrimary'),
  t('arena.lblSlotSecondary'),
  t('arena.lblSlotTertiary'),
]);
const archetypes = Object.values(ARCHETYPES);

const selectedModules = computed(() => store.getters['fight/getPlayerModules']);
const selectedProtocol = ref(store.getters['fight/getEmergencyProtocol']?.type || 'medkit');
const showModal = ref(false);
const activeSlot = ref(0);

const emergencyProtocols = [
  { id: 'medkit',     name: 'Аптечка',    icon: '💊', trigger: 'HP < 30%' },
  { id: 'adrenaline', name: 'Адреналин',  icon: '⚡', trigger: 'Критический момент' },
  { id: 'shield',     name: 'Щит',        icon: '🛡️', trigger: 'Серия ударов' },
];

const isComplete = computed(() => selectedModules.value.every(m => m !== null));

const buildDescription = computed(() => {
  if (!isComplete.value) return '';
  const names = selectedModules.value.map(id => ARCHETYPES[id]?.nameRu || id);
  return `${names.join(' + ')} — ${getBuildStyle()}`;
});

function getBuildStyle() {
  const modules = selectedModules.value;
  if (modules.includes('predator') && modules.includes('analyst')) {
    return 'Расчётливый хищник. Наблюдает, находит слабость, бьёт точно.';
  }
  if (modules.includes('sentinel') && modules.includes('juggernaut')) {
    return 'Непробиваемый стратег. Держит удар, затем раздавливает.';
  }
  if (modules.includes('ghost') && modules.includes('maverick')) {
    return 'Хаос из тени. Непредсказуем, то исчезает, то взрывается.';
  }
  if (modules.includes('predator') && modules.includes('juggernaut')) {
    return 'Чистая агрессия. Давит без остановки, не даёт передышки.';
  }
  if (modules.includes('sentinel') && modules.includes('analyst')) {
    return 'Стальная стена. Читает врага и контратакует в нужный момент.';
  }
  if (modules.includes('ghost') && modules.includes('analyst')) {
    return 'Тень-стратег. Уклоняется и бьёт, когда противник раскрыт.';
  }
  return 'Уникальный стиль. Адаптируется под ситуацию.';
}

function getArchetype(id) {
  return ARCHETYPES[id] || {};
}

function isArchetypeUsed(id) {
  return selectedModules.value.includes(id);
}

function openModuleSelect(slotIndex) {
  activeSlot.value = slotIndex;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

function selectArchetype(id) {
  if (isArchetypeUsed(id)) return;
  const newModules = [...selectedModules.value];
  newModules[activeSlot.value] = id;
  store.dispatch('fight/setPlayerModules', newModules);
  closeModal();
}

function selectProtocol(id) {
  selectedProtocol.value = id;
  store.dispatch('fight/setEmergencyProtocol', id);
}
</script>

<style scoped>
.module-builder {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fighter-avatar {
  margin-bottom: 12px;
}

.avatar-skin {
  width: 120px;
  height: 200px;
}

/* ── Module slots ──────────────────────────────────────────── */
.module-slots {
  display: flex;
  gap: 8px;
  justify-content: center;
  width: 100%;
  margin-bottom: 16px;
}

.module-slot {
  flex: 1;
  max-width: 120px;
  text-align: center;
}

.slot-label {
  font-size: 0.6rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.slot-content {
  height: 80px;
  border-radius: 8px;
  border: 2px dashed var(--gray2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: var(--black-opacity-80);
}

.slot-content:active {
  transform: scale(0.96);
}

.slot-filled {
  border-style: solid;
  border-color: var(--primary-color);
}

.slot-primary .slot-filled {
  border-color: #FFD600;
  box-shadow: 0 0 10px rgba(255, 214, 0, 0.3);
}

.module-icon {
  font-size: 1.6rem;
}

.module-name {
  font-size: 0.65rem;
  color: white;
  font-weight: bold;
}

.slot-placeholder {
  font-size: 1.5rem;
  color: var(--gray2);
  opacity: 0.5;
}

/* ── Build preview ─────────────────────────────────────────── */
.build-preview {
  width: 100%;
  max-width: 320px;
  background-color: var(--black-opacity-80);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  text-align: center;
}

.preview-title {
  font-size: 0.65rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.preview-text {
  font-size: 0.75rem;
  color: var(--gray3);
  line-height: 1.4;
}

/* ── Emergency Protocol ────────────────────────────────────── */
.emergency-protocol {
  width: 100%;
  max-width: 320px;
}

.protocol-title {
  font-size: 0.65rem;
  color: var(--gray2);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  text-align: center;
}

.protocol-options {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.protocol-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  background-color: var(--black-opacity-80);
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.protocol-option:active {
  transform: scale(0.96);
}

.protocol-selected {
  border-color: var(--primary-color);
  background-color: rgba(var(--primary-color-rgb, 68, 138, 255), 0.15);
}

.protocol-icon {
  font-size: 1.3rem;
}

.protocol-name {
  font-size: 0.6rem;
  color: white;
  font-weight: bold;
}

.protocol-trigger {
  font-size: 0.5rem;
  color: var(--gray3);
}

/* ── Module selection modal ────────────────────────────────── */
.module-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 400px;
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
}

.modal-title {
  font-size: 0.85rem;
  color: white;
  text-align: center;
  margin-bottom: 16px;
  font-weight: bold;
}

.archetypes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.archetype-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid var(--gray2);
  background-color: var(--black-opacity-80);
  cursor: pointer;
  transition: all 0.2s ease;
}

.archetype-card:active {
  transform: scale(0.96);
}

.archetype-used {
  opacity: 0.3;
  pointer-events: none;
}

.archetype-icon {
  font-size: 1.8rem;
}

.archetype-name {
  font-size: 0.75rem;
  color: white;
  font-weight: bold;
}

.archetype-desc {
  font-size: 0.55rem;
  color: var(--gray3);
  text-align: center;
  line-height: 1.3;
}
</style>
