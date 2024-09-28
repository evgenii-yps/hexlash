import apiClient from '@/core/api/apiClient.js';
import {clearDatabase, deleteDB} from '@/core/database/idb.js';
import {getMasterFromLocalDB, saveMasterToLocalDB, updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {MasterModel} from "@/core/models/masterModel.js";
import store from "@/core/state/store.js";
import {AuthStateModel} from "@/core/models/internal/authStateModel.js";
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
            store.commit('master/setAuthState', AuthStateModel.Authenticated(true));
            // Асинхронно запускаем запрос на обновление данных через API
            getMasterFromAPI();
        } else {
            store.commit('master/setAuthState', AuthStateModel.Authenticated(false));
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


// Метод логина
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
        store.commit('master/setAuthState', AuthStateModel.Authenticated(true));

    } catch (error) {
        const errorStr = error.response?.data?.message || error.message || 'Failed to login';
        store.commit('master/setAuthState', AuthStateModel.Error(errorStr));
    }
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

export const sendInvite = async (inviteCode) => {

    if(!validateInviteCode(inviteCode)){
        throw new Error(i18n.global.t('auth.invite.errorInvalidInvite'));
    }

    // Имитируем API вызов
    await new Promise((resolve) => setTimeout(resolve, 2000));

    /*if (inviteCode === 'admin') {
        return { success: true};
    } else {*/
    throw new Error(i18n.global.t('auth.invite.errorInvalidInvite'));
    //}
};

const validateInviteCode = (code) => {
    const inviteCodePattern = /^[A-Za-z0-9]{6,10}$/;
    return inviteCodePattern.test(code);
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
        const response = await apiClient.put('/user/edit', profileData, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error('Failed to change profile');
    }
};

// Изменить пароль
export const changePassword = async (passwordData) => {
    try {
        const response = await apiClient.put('/user/password', passwordData, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error('Failed to change password');
    }
};

// Выйти из системы
export const logout = async () => {
    try {
        // const response = await apiClient.post('/users/logout', {}, {authRequired: true});

        await clearDatabase();

        return true;
        // return response.data;
    } catch (error) {
        throw new Error('Failed to logout');
    }
};

// Верифицировать пользователя
export const verifyUser = async (verifyData) => {
    try {
        const response = await apiClient.post('/user/verify-user', verifyData, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error('Failed to verify user');
    }
};

// Отправить запрос на верификацию почты
export const sendVerifyEmail = async () => {
    try {
        const response = await apiClient.post('/user/send-verify-email', {}, {authRequired: true});
        return response.data;
    } catch (error) {
        throw new Error('Failed to send verify email');
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

export const fullReset = async (text) => {
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