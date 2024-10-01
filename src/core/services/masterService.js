import apiClient from '@/core/api/apiClient.js';
import {clearDatabase, deleteDB} from '@/core/database/idb.js';
import {getMasterFromLocalDB, saveMasterToLocalDB, updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {MasterModel} from "@/core/models/masterModel.js";
import store from "@/core/state/store.js";
import {jwtDecode} from "jwt-decode";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {i18n} from "@/main.js";

export const initializeMasterData = async () => {
    // Сначала берем данные из локальной базы данных
    const localData = await getMasterFromLocalDB();

    const jwtToken = await getJwtToken(localData);

    if (localData) {
        store.commit('master/setMaster', localData);
        if (jwtToken && validateJwtToken(jwtToken)) {
            store.commit('master/setLoginState', {isAuthenticated: true});
            // Асинхронно запускаем запрос на обновление данных через API
            getMasterFromAPI();
        } else {
            store.commit('master/setLoginState', {isAuthenticated: false});
        }
    }
};

export const getMasterFromAPI = () => {
    // Асинхронно обновляем данные из API
    fetchMasterData().then(async (apiUserModel) => {
        await updateMasterToLocalDB(apiUserModel);
        store.commit('master/setMaster', apiUserModel);
    }).catch((error) => {
        console.error('Failed to fetch user data from API:', error);
    });
};

export const login = async (credentials) => {
    try {
        const response = await apiClient.post('/auth/login', credentials);
        const {jwtToken} = response.data;

        updateJwtToken(jwtToken);

        // Получите данные текущего пользователя
        const masterModel = await fetchMasterData();

        // Проверяем пользователя в базе данных
        const existingUser = await getMasterFromLocalDB();

        if (existingUser && existingUser.getUuid() !== masterModel.getUuid()) {
            // Удаляем данные старого пользователя, если он отличается от текущего
            await clearDatabase();
        }

        // Сохраняем данные пользователя в локальную базу данных
        await saveMasterToLocalDB(masterModel);

        store.commit('master/setMaster', masterModel);
        store.commit('master/setLoginState', {isAuthenticated: true});

    } catch (error) {
        const errorStr = error.response?.error || error.message || 'Failed to login';
        throw new Error(errorStr);
    }
};

export const sendCheckLoginAvailable = async (login) => {
    try {
        const response = await apiClient.get(`/auth/login-available/${login}`);

        return response.data.available;
    } catch (error) {
        const errorStr = error.response?.error || error.message || 'Failed to login';
        throw new Error(errorStr);
    }
};

export const sendInvite = async (inviteCode) => {
    if (!validateInviteCode(inviteCode)) {
        throw new Error(i18n.global.t('auth.invite.errorInvalidInvite'));
    }
    try {
        const response = await apiClient.post('/auth/signup', { inviteCode });

        // Проверяем наличие полей login и tempPassword в ответе
        const { login, temporaryPassword } = response.data;

        if (!login || !temporaryPassword) {
            return new Error(i18n.global.t('auth.invite.errorInvalidResponse'));
        }

        return { login, temporaryPassword };

    } catch (error) {
        const errorStr = error.response?.data?.error || error.message || 'Failed to invite';
        throw new Error(errorStr);
    }
};

const validateInviteCode = (code) => {
    const inviteCodePattern = /^[A-Za-z0-9]{6,10}$/;
    return inviteCodePattern.test(code);
};

export const resetPassword = async (email) => {
    // Проверка на пустой email
    if (!email) {
        throw new Error(i18n.global.t('auth.reset.errorEmpty'));
    }

    // Проверка на правильный формат email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        throw new Error(i18n.global.t('auth.reset.errorInvalidFormat'));
    }

    // Имитируем API вызов
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (email === 'test@example.com') {
        return {success: true, message: i18n.global.t('auth.reset.success')};
    } else {
        throw new Error(i18n.global.t('auth.reset.error'));
    }
};


// Функция для получения данных текущего пользователя
const fetchMasterData = async () => {
    try {
        const response = await apiClient.get('/user/me', {authRequired: true});
        console.log(response);
        return MasterModel.fromJSON(response.data);
    } catch (error) {
        throw new Error('Failed to fetch user data from server');
    }
};

// Изменить профиль
export const changeProfile = async (profileData) => {
    try {
        return await apiClient.post('/user/edit', profileData, {authRequired: true});
    } catch (error) {
        throw new Error('Failed to change profile ' + error.response?.error || error.message);
    }
};


// Выйти из системы
export const logout = async () => {
    try {
        // const response = await apiClient.post('/users/logout', {}, {authRequired: true});

        await clearDatabase();
        updateJwtToken("");

        return true;
    } catch (error) {
        throw new Error('Failed to logout');
    }
};

// Отправить запрос на верификацию почты
export const sendVerifyEmail = async (code) => {
    try {
        const response = await apiClient.post('/user/verify-email', {code}, {authRequired: false});

        console.log(response);

        return response.status === 200;

    } catch (error) {
        throw new Error('Failed verify email');
    }
};


export const showFightRulesReminder = (text) => {
    const MESSAGE_KEY = 'firstFightToolTip';
    const MAX_SHOW_COUNT = 2;

    let showCount = localStorage.getItem(MESSAGE_KEY) || 0;

    if (showCount < MAX_SHOW_COUNT) {
        showCount++;
        localStorage.setItem(MESSAGE_KEY, showCount);
        const customMessage = InfoMessageModel.withTimeout(text, 15000);
        store.commit('master/setInfoMessage', customMessage);
    }
};

export const showTrainingRulesReminder = (text) => {
    const MESSAGE_KEY = 'firstTrainingToolTip';
    const MAX_SHOW_COUNT = 1;

    let showCount = localStorage.getItem(MESSAGE_KEY) || 0;

    if (showCount < MAX_SHOW_COUNT) {
        showCount++;
        localStorage.setItem(MESSAGE_KEY, showCount);
        const customMessage = InfoMessageModel.withTimeout(text, 15000);
        store.commit('master/setInfoMessage', customMessage);
    }
};

export const isShowPrivacyInfo = (text) => {
    const MESSAGE_KEY = 'isShowPrivacyInfo';
    const MAX_SHOW_COUNT = 1;

    let showCount = localStorage.getItem(MESSAGE_KEY) || 0;

    if (showCount < MAX_SHOW_COUNT) {
        showCount++;
        localStorage.setItem(MESSAGE_KEY, showCount);
        const customMessage = InfoMessageModel.withTimeout(text, 15000);
        store.commit('master/setInfoMessage', customMessage);
    }
};

export const resetClient = async () => {
    await deleteDB();
    localStorage.clear();
}

const validateJwtToken = (jwtToken) => {
    try {
        const decodedToken = jwtDecode(jwtToken);
        const currentTime = Math.floor(Date.now() / 1000); // Текущее время в секундах

        return !!(decodedToken.exp && currentTime < decodedToken.exp);
    } catch (error) {
        return false; // Токен невалиден
    }
};

export const getJwtToken = () => {
    const KEY = 'jwtToken';
    return localStorage.getItem(KEY) || null;
};

export const updateJwtToken = (jwtToken) => {
    store.commit('master/setJwtToken', jwtToken);
    const KEY = 'jwtToken';
    localStorage.setItem(KEY, jwtToken);
};