<template>

  <VBtnDark
      class="club-btn"
      @click="dialogEdit = true">
    <template #prepend>
      <v-tooltip
          v-model="showToolTip"
          location="top"
          max-width="250px"
          contentClass="v-tooltip__content">
        <template #activator="{ props }">
          <img v-bind="props" @click.stop="toggleToolTip" src="@/assets/images/icon_pencil.svg" alt=""
               class="custom-icon"/>
        </template>
        <span>{{ t('club.lblEditTooltip') }}</span>
      </v-tooltip>
    </template>
    {{ t('club.lblEditClub') }}
    <template #append>
      <span class="custom-icon"/>
    </template>
  </VBtnDark>

  <VModal v-model="dialogEdit" max-width="500" @click:outside="hide">
    <VCard>
      <v-card-title class="headline">{{ t('club.lblEditClub') }}</v-card-title>
      <v-card-text class="text-center">

        <v-text-field
            :label="t('club.lblClubName')"
            v-model="title"
            class="title-field"
            :error-messages="titleError"
        >
        </v-text-field>

        <v-textarea
            :label="t('club.lblClubDescription')"
            v-model="description"
            class="description-field"
        >
        </v-textarea>

        <div class="loader-container">
          <v-progress-circular
              v-if="loading"
              class="loader"
              size="40"
              indeterminate
          />
          <div v-else class="result-message">
            <p>{{ resultMessage }}</p>
          </div>
        </div>

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <VBtnDark @click="hide" class="cancel-btn">{{ t('modal.btnCancel') }}</VBtnDark>
        <VBtn @click="saveChanges" class="confirm-btn">{{ t('modal.btnSave') }}</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import store from "@/core/state/store.js";
import {useI18n} from "vue-i18n";

const {t} = useI18n({useScope: 'global'})

const props = defineProps({
  clubData: {
    type: Object,
    required: true,
  }
});

// Создаем локальную копию clubData для редактирования
const localClubData = ref({...props.clubData});

// В computed создаем прямую связь с полями localClubData
const title = computed({
  get: () => localClubData.value.name,
  set: value => localClubData.value.name = value,
});

const description = computed({
  get: () => localClubData.value.description,
  set: value => localClubData.value.description = value,
});


const dialogEdit = ref(false);
const loading = ref(false);
const resultMessage = ref('');
const titleError = ref('');
const showToolTip = ref(false);

// Функция для валидации названия
const validateTitle = () => {
  const regex = /^[a-zA-Z0-9\s]*$/; // Разрешены латинские буквы, цифры и пробелы
  if (!regex.test(title.value)) {
    titleError.value = t('club.invalidCharacters');
    return false;
  }
  if (title.value.length > 32) {
    titleError.value = t('club.tooLong');
    return false;
  }
  if (title.value.length === 0) {
    titleError.value = t('club.empty');
    return false;
  }
  titleError.value = '';
  return true;
};

const toggleToolTip = () => {
  showToolTip.value = !showToolTip.value;
};

const hide = () => {
  dialogEdit.value = false;
};

const saveChanges = async () => {
  if (!validateTitle()) {
    return;
  }

  loading.value = true;

  try {

    await store.dispatch('club/updateClubData', localClubData.value);

    hide();

  } catch (error) {
    resultMessage.value = t('club.lblErrorSaving');
  } finally {
    loading.value = false;
  }
};


</script>

<style scoped>
.club-btn {
  height: 50px;
  margin: 15px auto;
  width: 80%;
  max-width: 500px;
  justify-content: space-between;
  text-align: center;
  color: white;
  cursor: pointer;
  display: flex;
  background-color: var(--gray1) !important;
}

.title-field :deep(.v-input__details) {
  display: block !important;
}

.club-btn span {
  font-size: 1.5em;
  margin-right: 5px
}

.custom-icon {
  width: 25px; /* Увеличиваем ширину изображения */
  height: 25px; /* Увеличиваем высоту изображения */
  margin-right: 10px; /* Добавляем отступ справа для расстояния между иконкой и текстом */
}

.text-center {
  padding: 24px 24px 4px;
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
  color: var(--gray3);
  margin-top: 10px;
}


</style>
