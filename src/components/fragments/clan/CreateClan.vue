<template>

  <VModal v-model="showDialog" max-width="500" @click:outside="hide">
    <VCard>
      <v-card-title class="headline">{{ t.club.modalTitle }}</v-card-title>
      <v-card-text class="text-center">

        <v-text-field
            :label="t.club.inputName"
            v-model="title"
            class="title-field"
            :error-messages="titleError"
        >
        </v-text-field>

        <v-textarea
            :label="t.club.inputDescription"
            v-model="description"
            class="description-field"
        >
        </v-textarea>

        <div class="public-toggle">
          <div class="toggle-row">
            <span class="toggle-label">{{ t.club.lblPublicClub }}</span>
            <v-switch
              v-model="isPublic"
              :class="{ checked: isPublic }"
              class="clan-public-switch"
              hide-details
              color="var(--hex-success)"
            />
          </div>
          <span class="toggle-hint">{{ isPublic ? t.club.lblAnyoneCanJoin : t.club.lblInviteOnly }}</span>
        </div>

        <div  v-if="loading" class="loader-container">
          <v-progress-circular
              class="loader"
              size="40"
              indeterminate
          />
        </div>
        <div v-else class="result-message">
          <p>{{ resultMessage }}</p>
        </div>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <VBtnDark @click="hide" class="cancel-btn">{{ t.modal.btnCancel }}</VBtnDark>
        <VBtn @click="saveChanges" class="confirm-btn">{{ t.modal.btnCreate }}</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {ref, computed, watch} from 'vue';
import store from "@/core/state/store.js";
import router from "@/router/index.js";
import {t} from "@/locales/index.js";
// Clan creation is now free


const title = ref("");
const description = ref("");
const isPublic = ref(true);

const loading = ref(false);
const resultMessage = ref('');
const titleError = ref('');

// Clan creation is free — no taps check needed

const props = defineProps({
  dialogCreate: Boolean,
  required:true
});

const emit = defineEmits(['close']);

const showDialog = ref(false);

watch(() => props.dialogCreate, (val) => {
  showDialog.value = val;
});

watch(showDialog, (val) => {
  if (!val) {
    emit('close');
  }
});


// Функция для валидации названия
const validateTitle = () => {
  const trimmed = title.value.trim().replace(/\s{2,}/g, ' ');
  if (trimmed.length === 0) {
    titleError.value = t.value.club.errorEmpty;
    return false;
  }
  if (trimmed.length < 3) {
    titleError.value = t.value.club.errorTooShort || 'Name must be at least 3 characters';
    return false;
  }
  if (trimmed.length > 30) {
    titleError.value = t.value.club.errorTooLong;
    return false;
  }
  if (!/^[\p{L}\p{N} ]+$/u.test(trimmed)) {
    titleError.value = t.value.club.errorInvalidCharacters;
    return false;
  }
  title.value = trimmed;
  titleError.value = '';
  return true;
};

const hide = () => {
  emit('close');
};

const saveChanges = async () => {
  if (!validateTitle()) {
    return;
  }

  loading.value = true;

  try {
    const clan = await store.dispatch('clan/createClan',
        {
          name: title.value,
          description: description.value,
          isPublic: isPublic.value
        }
    );
    hide();
    if(clan){
      await router.push({path: `/clan/${clan.id}`});
    }
  } catch (error) {
    resultMessage.value = t.value.club.errorCreate;
  } finally {
    loading.value = false;
  }
};


</script>

<style scoped>

.title-field :deep(.v-input__details){
  display: block !important;
}

.clan-btn span {
  font-size: 1.5em;
  margin-right: 5px
}

.text-center {
  padding: 24px 24px 4px !important;
  justify-content: center;
}

.title-field, .description-field {
  margin-bottom: 20px;
}

.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.result-message {
  text-align: center;
  font-size: 0.8rem;
  color: var(--hex-danger);
  margin-top: 10px;
}

.cost-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.cost-label {
  color: var(--hex-text-secondary);
  font-size: 0.9rem;
}

.cost-value {
  color: var(--hex-text-primary);
  font-size: 0.9rem;
  font-weight: bold;
  font-family: 'AnonymousBalance', monospace;
}

.cost-insufficient {
  color: var(--hex-defeat);
}

.cost-warning {
  color: var(--hex-defeat);
  font-size: 0.75rem;
  text-align: center;
  margin-bottom: 8px;
}

.public-toggle {
  margin-bottom: 12px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-label {
  color: var(--hex-text-primary);
  font-size: 0.9rem;
}

.toggle-hint {
  color: var(--hex-text-muted);
  font-size: 0.75rem;
}

.clan-public-switch {
  flex: 0;
}

</style>
