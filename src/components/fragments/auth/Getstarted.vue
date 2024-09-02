<template>
  <VModal v-model="dialogGetStarted" max-width="500" @click:outside="hide">
    <VCard>
      <v-card-title class="headline">{{ t('getStarted.title') }}</v-card-title>
      <v-card-text class="text-center">

        <p class="notice-intro">Добро пожаловать в FightClub перед началом мы настоятельно рекомендуем вам ознакомиться с правилами, крайне важно следовать им</p>

        <!-- Поле для ввода имени -->
        <v-text-field
            :label="t('getStarted.lblName')"
            v-model="name"
            :error-messages="nameError"
            :rules="[rules.required]"
        >
        </v-text-field>

        <p class="notice-login">Мы автоматически сгенерировали для вас логин, хотите его заменить?</p>
        <!-- Поле для ввода логина с проверкой доступности -->
        <v-text-field
            :label="t('getStarted.lblLogin')"
            v-model="login"
            :error-messages="loginError"
            @input="handleLoginInput">

          <template v-slot:append-inner>
            <v-progress-circular v-if="loadingLogin" color="var(--primary-color)" indeterminate :size="20"/>
          </template>
        </v-text-field>

        <p class="notice-password">Мы автоматически сгенерировали для вас пароль, в целях безопасности мы рекомендуем вам поменять его</p>
        <!-- Поле для ввода пароля -->
        <v-text-field
            :label="t('club.inputPassword')"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            :rules="[rules.required, rules.min]"
        >
          <template v-slot:append-inner>
            <img @click.prevent="showPassword = !showPassword" :src="showPassword ? iconHide : iconShow" alt="password visibility" />
          </template>
        </v-text-field>


        <div class="agree-checkbox">
          <div class="checkbox-custom" @click="toggleAgree" :class="{ checked: agree }"></div>
          <div>
            I agree with
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props }">
                <a
                    href="/privacy"
                    target="_blank"
                    v-bind="props"
                    @click.stop
                    class="btn-privacy"
                >
                  privacy
                </a>
              </template>
              Opens in new window
            </v-tooltip>
            is awesome
          </div>
        </div>


        <div class="notice">{{ t('club.notice') }}</div>

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
        <VBtn @click="saveChanges" class="confirm-btn">{{ t('getStarted.btnGo') }}</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {ref} from 'vue';
import debounce from "debounce";
import store from "@/core/state/store.js";
import router from "@/router/index.js";
import {useI18n} from "vue-i18n";

import iconShow from "@/assets/images/icon_show.svg";
import iconHide from "@/assets/images/icon_hide.svg";
import iconFalse from "@/assets/images/icon_hide.svg";
import iconTrue from "@/assets/images/icon_hide.svg";

const {t} = useI18n({useScope: 'global'});

const dialogGetStarted = ref(true);

const name = ref("");
const login = ref("");
const password = ref("");
const showPassword = ref(false);

const loading = ref(false);
const loadingLogin = ref(false);
const resultMessage = ref('');
const nameError = ref('');
const loginError = ref('');
const loginChanged = ref(false);
const loginAvailable = ref(false);
const errorMessage = ref('');

const agree = ref(false);

const rules = {
  required: value => !!value || t('club.errorRequired'),
  min: v => v.length >= 8 || t('club.errorMinCharacters'),
};

// Валидация логина
const validateLogin = (login) => {
  const loginPattern = /^[a-zA-Z0-9_]{3,}$/;
  return loginPattern.test(login) || t('profile.account.lblInvalidLoginFormat');
};

const handleLoginInput = () => {
  loginChanged.value = login.value.length > 0;
  if (loginChanged.value) {
    loginError.value = '';
    loginAvailable.value = false;

    debouncedCheckLoginExistence();
  }
};

const debouncedCheckLoginExistence = debounce(async () => {
  if (!loginChanged.value) return;

  loadingLogin.value = true;

  try {
    // Задержка для демонстрации лоадера
    await new Promise(resolve => setTimeout(resolve, 1000));

    const available = true;
    loginAvailable.value = available;

    if (!available) {
      errorMessage.value = t('profile.account.lblLoginAlreadyTaken');
    }
  } catch (error) {
    errorMessage.value = t('profile.account.lblFailedToCheckLoginAvailability');
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

const saveChanges = async () => {
  if (!validateLogin(login.value) || !rules.required(name.value) || !rules.min(password.value)) {
    return;
  }

  loading.value = true;

  try {
    //const club = await store.dispatch('club/createClub', {name: name.value, login: login.value, password: password.value});
    hide();
    // if (club) {
    //   await router.push({path: `/club/${club.id}`});
    // }
  } catch (error) {
    // resultMessage.value = t('club.errorCreate');
  } finally {
    loading.value = false;
  }
};


</script>

<style scoped>


.club-btn span {
  font-size: 1.5em;
  margin-right: 5px
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
  font-size: 0.8rem;
  text-align: center;
}

.error-message {
  color: var(--pinkDark);
  font-size: 0.8rem;
  text-align: center;
}

:deep(.v-input__details) {
  display: block;
}

.btn-privacy{
  color: var(--pink);
  text-decoration: none;
  cursor: pointer;
  font-size: 1.4em;
  font-weight: bold;
}


.agree-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-custom {
  width: 24px;
  height: 24px;
  border: 2px solid var(--primary-color);
  border-radius: 4px;
  position: relative;
  transition: background-color 0.2s ease;
  margin-right: 8px;
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
