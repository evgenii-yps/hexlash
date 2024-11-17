<template>
  <VModal v-model="dialogGetStarted" max-width="500" persistent>
    <VCard>
      <v-card-title class="headline">{{ t('getStarted.title') }}</v-card-title>
      <v-card-text class="text-center">

        <p class="notice" v-html="t('getStarted.noticeWelcome')"/>

        <!-- Поле для ввода имени -->
        <v-text-field
            class="text-field"
            :label="t('getStarted.lblName')"
            v-model="name"
            :placeholder="t('getStarted.lblHintName')"
            :error-messages="nameError"
            :rules="[rules.required]"
        >
        </v-text-field>

        <p class="notice" v-html="t('getStarted.noticeLogin')"/>
        <!-- Поле для ввода логина с проверкой доступности -->
        <v-text-field
            class="text-field"
            :label="t('getStarted.lblLogin')"
            v-model="login"
            :error-messages="loginError"
            :rules="[rules.required, rules.latinAndNumbers]"
            @input="handleLoginInput">

          <template v-slot:append-inner>
            <div v-if="loginAvailable && loginChanged && !loginError" class="success-message">
              {{ t('profile.account.lblAvailableLogin') }}
            </div>
            <v-progress-circular v-if="loadingLogin" color="var(--primary-color)" indeterminate :size="20"/>
          </template>
        </v-text-field>

        <p class="notice" v-html="t('getStarted.noticePassword')"/>
        <!-- Поле для ввода пароля -->
        <v-text-field
            class="text-field"
            :label="t('getStarted.lblPassword')"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :rules="[rules.required, rules.min]"
            @input="checkPasswordChange"
        >
          <template v-slot:append-inner>
            <img @click.prevent="showPassword = !showPassword" :src="showPassword ? iconHide : iconShow"
                 alt="password visibility"/>
          </template>
        </v-text-field>

        <v-text-field
            v-if="passwordChanged"
            class="text-field"
            :label="t('getStarted.lblConfirmPassword')"
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            :error-messages="confirmPasswordError"
            :rules="[rules.required, rules.match]"
            @input="validateConfirmPassword"
        >
          <template v-slot:append-inner>
            <img @click.prevent="showPassword = !showPassword" :src="showPassword ? iconHide : iconShow"
                 alt="password visibility"/>
          </template>
        </v-text-field>


        <div class="agree-checkbox">
          <div class="checkbox-custom" @click="toggleAgree" :class="{ checked: agree }"></div>
          <div>
            {{ t('getStarted.agreementText') }}
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props }">
                <a
                    href="/privacy"
                    target="_blank"
                    v-bind="props"
                    @click.stop
                    class="btn-privacy"
                >
                  {{ t('getStarted.rulesLinkText') }}
                </a>
              </template>
              {{ t('getStarted.tooltipText') }}
            </v-tooltip>
            {{ t('getStarted.joinText') }}
          </div>
        </div>


        <div v-if="loading" class="loader-container">
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
        <VBtn @click="saveChanges"
              :class="{ disabled: !isFormValid }"
              :disabled="!isFormValid"
              class="confirm-btn">{{ t('getStarted.btnGo') }}
        </VBtn>
      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import debounce from "debounce";
import {useI18n} from "vue-i18n";

import iconShow from "@/assets/images/icon_show.svg";
import iconHide from "@/assets/images/icon_hide.svg";
import store from "@/core/state/store.js";
import * as amplitude from "@amplitude/analytics-browser";

const {t, locale} = useI18n({useScope: 'global'});

const currentLocale = locale.value;

const dialogGetStarted = ref(true);

const name = ref("");
const nameError = ref('');

const password = ref('');
const confirmPassword = ref("");
const passwordChanged = ref(false);
const confirmPasswordError = ref('');
let initialPassword = '';
const showPassword = ref(true);

const login = ref('');
const loginError = ref('');
const loginChanged = ref(false);
const loginAvailable = ref(false);
const loadingLogin = ref(false);

const agree = ref(false);
const loading = ref(false);
const resultMessage = ref('');


const rules = {
  required: value => !!value || t('getStarted.errorRequired'),
  min: v => v.length >= 8 || t('getStarted.errorMinCharacters'),
  match: v => v === password.value || t('getStarted.errorPasswordsDoNotMatch'),
  latinAndNumbers: v => /^[a-zA-Z0-9]*$/.test(v) || t('getStarted.errorOnlyLatinAndNumbers')
};

// Валидация логина
const validateLogin = (login) => {
  const loginPattern = /^[a-zA-Z0-9_]{3,32}$/;
  return loginPattern.test(login) || t('profile.account.lblInvalidLoginFormat');
};

const checkPasswordChange = () => {
  passwordChanged.value = password.value !== initialPassword;
  validateConfirmPassword();
};

const validateConfirmPassword = () => {
  if (!passwordChanged.value || !confirmPassword.value) {
    // Не показывать ошибку, если поле подтверждения пароля пустое
    confirmPasswordError.value = '';
    return;
  }

  if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = t('getStarted.errorPasswordsDoNotMatch');
  } else {
    confirmPasswordError.value = '';
  }
};


const handleLoginInput = () => {

  loginChanged.value = login.value.length > 0;

  login.value = login.value.replace(/\s/g, '');

  const hasErrors = rules.required(login.value) !== true ||
      rules.latinAndNumbers(login.value) !== true;

  if (!hasErrors) {
    loginError.value = '';
    loginAvailable.value = false;

    debouncedCheckLoginExistence();
  } else {
    // Если есть ошибки, установим соответствующее сообщение
    loginError.value = t('getStarted.errorOnlyLatinAndNumbers');
  }
};

const debouncedCheckLoginExistence = debounce(async () => {
  if (!loginChanged.value) return;

  loadingLogin.value = true;

  try {
    const available = store.dispatch('master/sendCheckLoginAvailable', login);

    loginAvailable.value = available;

    if (!available) {
      loginError.value = t('profile.account.lblLoginAlreadyTaken');
    }
  } catch (error) {
    loginError.value = t('profile.account.lblFailedToCheckLoginAvailability');
  } finally {
    loadingLogin.value = false;
  }
}, 500);

const hide = () => {
  dialogGetStarted.value = false;
};

const toggleAgree = () => {
  agree.value = !agree.value;
};

const isFormValid = computed(() => {
  const basicValidation = name.value && login.value && password.value && agree.value &&
      !nameError.value && !loginError.value;

  const confirmPasswordValidation = !confirmPasswordError.value && confirmPassword.value &&
      confirmPassword.value === password.value;

  return basicValidation && (confirmPasswordValidation || initialPassword === password.value);
});


const saveChanges = async () => {
  if (!validateLogin(login.value)) {
    return;
  }

  loading.value = true;

  try {
    await store.dispatch('master/updateMaster', {
      name: name.value,
      login: login.value,
      newPassword: password.value,
      oldPassword: initialPassword,
      initialVerified: true,
      language: currentLocale
    });
    hide();


    // Amplitude
    amplitude.setUserId(login.value);
    amplitude.track('Signup');

  } catch (error) {
    resultMessage.value = error;
  } finally {
    loading.value = false;
  }
};


watch(store.getters['master/getSignupState'], (initState) => {
  name.value = initState.name;
  login.value = initState.generatedLogin;
  password.value = initState.generatedPassword;
  initialPassword = initState.generatedPassword;
}, {immediate: true});

</script>

<style scoped>

.disabled {
  background-color: var(--gray2) !important;
}

.text-center {
  padding: 24px 24px 4px !important;
  justify-content: center;
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

.notice {
  color: var(--gray3);
  font-size: 0.7rem;
  text-align: center;
}

.notice :deep(a) {
  color: var(--pink);
  text-decoration: none;
  cursor: pointer;
  font-size: 1.5em;
  font-weight: bold;
}

.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  text-align: center;
}

:deep(.v-input__details) {
  display: block;
}

.btn-privacy {
  color: var(--pink);
  text-decoration: none;
  cursor: pointer;
  font-size: 1.4em;
  font-weight: bold;
}

.text-field {
  margin-top: 10px;
  margin-bottom: 10px;
}


.agree-checkbox {
  display: flex;
  align-items: center;

}

.checkbox-custom {
  cursor: pointer;
  width: 24px;
  height: 24px;
  border: 2px solid var(--primary-color);
  border-radius: 4px;
  position: relative;
  transition: background-color 0.2s ease;
  margin-right: 15px;
  flex-shrink: 0;
}

.checkbox-custom.checked {
  background-color: var(--primary-color);
}

.checkbox-custom.checked::after {
  content: '';
  position: absolute;
  top: 43%;
  left: 50%;
  width: 5px;
  height: 13px;
  border: solid white;
  border-width: 0 3px 2px 0;
  transform: translate(-50%, -50%) rotate(45deg);
}

</style>
