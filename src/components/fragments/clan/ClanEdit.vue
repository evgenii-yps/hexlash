<template>

  <VBtnDark
      class="clan-btn"
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
        <span>{{ t.clan.lblEditTooltip }}</span>
      </v-tooltip>
    </template>
    {{ t.clan.lblEditClan }}
    <template #append>
      <span class="custom-icon"/>
    </template>
  </VBtnDark>

  <VModal v-model="dialogEdit" max-width="500" @click:outside="hide">
    <VCard>
      <v-card-title class="headline">{{ t.clan.lblEditClan }}</v-card-title>
      <v-card-text class="text-center">

        <v-text-field
            :label="t.clan.lblClanName"
            v-model="title"
            class="title-field"
            :error-messages="titleError"
        >
        </v-text-field>

        <v-textarea
            :label="t.clan.lblClanDescription"
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
        <VBtnDark @click="hide" class="cancel-btn">{{ t.modal.btnCancel }}</VBtnDark>
        <VBtn @click="saveChanges" class="confirm-btn">{{ t.modal.btnSave }}</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>

  <div class="dissolve-section">
    <HexButton variant="danger" size="sm" @click="dialogDissolve = true">
      {{ t.clan.lblDissolve }}
    </HexButton>
  </div>

  <VModal v-model="dialogDissolve" max-width="500">
    <VCard>
      <v-card-title class="headline">{{ t.clan.lblDissolve }}</v-card-title>
      <v-card-text>
        {{ t.clan.lblDissolveConfirm }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="dialogDissolve = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
        <v-btn @click="confirmDissolve" class="confirm-btn">{{ t.clan.lblConfirm }}</v-btn>
      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";
import HexButton from "@/components/ui/HexButton.vue";
import router from "@/router/index.js";

const props = defineProps({
  clanData: {
    type: Object,
    required: true,
  }
});

// Создаем локальную копию clanData для редактирования
const localClanData = ref({...props.clanData});

// В computed создаем прямую связь с полями localClanData
const title = computed({
  get: () => localClanData.value.name,
  set: value => localClanData.value.name = value,
});

const description = computed({
  get: () => localClanData.value.description,
  set: value => localClanData.value.description = value,
});


const dialogEdit = ref(false);
const dialogDissolve = ref(false);
const loading = ref(false);
const resultMessage = ref('');
const titleError = ref('');
const showToolTip = ref(false);

// Функция для валидации названия
const validateTitle = () => {
  const trimmed = title.value.trim().replace(/\s{2,}/g, ' ');
  if (trimmed.length === 0) {
    titleError.value = t.value.clan.empty;
    return false;
  }
  if (trimmed.length < 3) {
    titleError.value = t.value.clan.errorTooShort || 'Name must be at least 3 characters';
    return false;
  }
  if (trimmed.length > 30) {
    titleError.value = t.value.clan.tooLong;
    return false;
  }
  if (!/^[\p{L}\p{N} ]+$/u.test(trimmed)) {
    titleError.value = t.value.clan.invalidCharacters;
    return false;
  }
  title.value = trimmed;
  titleError.value = '';
  return true;
};

const toggleToolTip = () => {
  showToolTip.value = !showToolTip.value;
};

const hide = () => {
  dialogEdit.value = false;
};

const confirmDissolve = async () => {
  dialogDissolve.value = false;
  try {
    await store.dispatch('clan/deleteClan');
    store.commit('master/setInfoMessage', {text: t.value.clan.lblDissolved, timeout: 3000, showButton: false});
    // Epic 5 — Sub-Epic 5D Step 8 augmentation — v2-aware navigation
    // (lesson #24 / Step 7 CreateClan precedent commit 1255898). Legacy
    // MyClanTab callers (path !== '/v2/clan') keep original redirect to
    // /ratings/clans; v2 HudClan callers stay on /v2/clan and rely on
    // reactive flip via userData.clanId (now null) — HudClan switches to
    // no-clan branch automatically. Tracked in FINAL §7 deferred for full
    // 5G v2-flow polish revisit.
    const currentPath = router.currentRoute.value.path;
    if (currentPath !== '/v2/clan') {
      router.push('/ratings/clans');
    }
  } catch (error) {
    store.commit('master/setErrorMessage', {text: error.message, timeout: 3000, showButton: false});
  }
};

const saveChanges = async () => {
  if (!validateTitle()) {
    return;
  }

  loading.value = true;

  try {

    await store.dispatch('clan/updateClanData', localClanData.value);

    hide();

  } catch (error) {
    resultMessage.value = t.value.clan.lblErrorSaving;
  } finally {
    loading.value = false;
  }
};

// Epic 5 — Sub-Epic 5D Step 8 prep — defineExpose({ openModal }) augmentation.
// Lets v2 HudClan trigger this legacy modal via shallowRef + dynamic import +
// markRaw + double nextTick + ref?.openModal?.() pattern (5B ConnectWallet
// precedent / Step 7 prep 6060c00 CreateClan precedent). Additive — legacy
// MyClanTab inline mount keeps working unchanged (its own VBtnDark click
// flips dialogEdit through v-model); v2 HudClan flips it through
// openModal() ref call.
defineExpose({
  openModal: () => { dialogEdit.value = true; },
});

</script>

<style scoped>
.clan-btn {
  height: 50px !important;
  margin: 15px auto;
  width: 80%;
  max-width: 500px;
  justify-content: space-between;
  text-align: center;
  color: var(--hex-text-primary);
  cursor: pointer;
  display: flex;
  background-color: var(--hex-bg-light) !important;
}

.title-field :deep(.v-input__details) {
  display: block !important;
}

.clan-btn span {
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
  color: var(--hex-text-muted);
  margin-top: 10px;
}

.dissolve-section {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

</style>
