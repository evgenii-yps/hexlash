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
              class="club-public-switch"
              hide-details
              color="var(--hex-primary)"
            />
          </div>
          <span class="toggle-hint">{{ isPublic ? t.club.lblAnyoneCanJoin : t.club.lblInviteOnly }}</span>
        </div>

        <div class="notice">{{ t.club.notice }}</div>

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
import {ref, watch} from 'vue';
import store from "@/core/state/store.js";
import router from "@/router/index.js";
import {t} from "@/locales/index.js";


const title = ref("");
const description = ref("");
const isPublic = ref(true);

const loading = ref(false);
const resultMessage = ref('');
const titleError = ref('');

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
  const regex = /^[a-zA-Z0-9\s]*$/; // Разрешены латинские буквы, цифры и пробелы
  if (!regex.test(title.value)) {
    titleError.value  = t.value.club.errorInvalidCharacters;
    return false;
  }
  if (title.value.length > 32) {
    titleError.value = t.value.club.errorTooLong;
    return false;
  }
  if(title.value.length === 0) {
    titleError.value = t.value.club.errorEmpty;
    return false;
  }
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
    const club = await store.dispatch('club/createClub',
        {
          name: title.value,
          description: description.value,
          isPublic: isPublic.value
        }
    );
    hide();
    if(club){
      await router.push({path: `/club/${club.id}`});
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

.club-btn span {
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
  color: var(--hex-primary-dark);
  margin-top: 10px;
}

.notice{
  color: var(--hex-text-muted);
  font-size: 0.8rem;
  text-align: center;
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

.club-public-switch {
  flex: 0;
}

</style>
