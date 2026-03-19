import apiClient from '@/core/api/apiClient.js';
import {clearDatabase, deleteDB} from '@/core/database/idb.js';
import {getMasterFromLocalDB, saveMasterToLocalDB, updateMasterToLocalDB} from "@/core/database/masterRepository.js";
import {MasterModel} from "@/core/models/masterModel.js";
import store from "@/core/state/store.js";
import {jwtDecode} from "jwt-decode";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";
import {t, setLanguage as setLocaleLanguage} from "@/locales/index.js";
import {isMockMode, createMockMaster, MOCK_JWT_TOKEN} from "@/core/mock/mockData.js";

/**
 * Restore progression and deck from server data to progressionState.
 * Server data takes priority over localStorage.
 */
function restoreProgressionFromServer(userData) {
    if (!userData) return;

    if (userData.progression) {
        store.commit('progressionState/restoreProgression', userData.progression);
        console.log('[APP] Progression restored from server');
    }
    if (userData.deck) {
        store.commit('progressionState/restoreDeck', userData.deck);
        console.log('[APP] Deck restored from server');
    }
}

export const initializeMasterData = async () => {
    if (isMockMode()) {
        const mockMaster = createMockMaster();
        store.commit('master/setMaster', mockMaster);
        store.commit('master/setJwtToken', MOCK_JWT_TOKEN);
        store.commit('master/setLoginState', {isAuthenticated: true});
        console.log('[MOCK] Initialized with mock master data');
        return;
    }

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
        // Приоритет: localStorage > сервер для языка
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang) {
            apiUserModel.language = savedLang;
        }
        await updateMasterToLocalDB(apiUserModel);
        store.commit('master/setMaster', apiUserModel);
        setLocaleLanguage(apiUserModel.language);

        // Restore progression and deck from server data
        restoreProgressionFromServer(apiUserModel.userData);
    }).catch((error) => {
        console.error('Failed to fetch user data from API:', error);
    });
};

export const login = async (credentials) => {
    if (isMockMode()) {
        const mockMaster = createMockMaster();
        store.commit('master/setMaster', mockMaster);
        store.commit('master/setJwtToken', MOCK_JWT_TOKEN);
        store.commit('master/setLoginState', {isAuthenticated: true});
        console.log('[MOCK] Login successful');
        return;
    }

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
        restoreProgressionFromServer(masterModel.userData);

    } catch (error) {
        const errorStr = error.response?.data?.error || error.message || 'Failed to login';
        throw new Error(errorStr);
    }
};

export const telegram = async (payload) => {
    if (isMockMode()) {
        const mockMaster = createMockMaster();
        store.commit('master/setMaster', mockMaster);
        store.commit('master/setJwtToken', MOCK_JWT_TOKEN);
        store.commit('master/setLoginState', {isAuthenticated: true});
        console.log('[MOCK] Telegram login successful');
        return;
    }

    try {
        const response = await apiClient.post('/auth/telegram', payload);
        const {jwtToken, tempPassword, name} = response.data;

        if(name && tempPassword) {
            // Сначала полностью очистить всю базу с компьютера
            await resetClient();

            // Записываем временный пароль, который мы рекомендуем ему поставить
            store.commit('master/setSignupState', {
                generatedPassword: tempPassword,
                name: name,
            });
        }

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
        restoreProgressionFromServer(masterModel.userData);

    } catch (error) {
        const errorStr = error.response?.data?.error || error.message || 'Failed to login';
        throw new Error(errorStr);
    }
};

export const sendCheckLoginAvailable = async (login) => {
    if (isMockMode()) {
        console.log('[MOCK] Login available check:', login);
        return true;
    }

    try {
        const response = await apiClient.get(`/auth/login-available/${login}`);
        return response.data.available;
    } catch (error) {
        const errorStr = error.response?.data?.error || error.message || 'Failed to login';
        throw new Error(errorStr);
    }
};

export const register = async (credentials) => {
    if (isMockMode()) {
        console.log('[MOCK] Register:', credentials.login);
        const mockMaster = createMockMaster();
        store.commit('master/setMaster', mockMaster);
        store.commit('master/setJwtToken', MOCK_JWT_TOKEN);
        store.commit('master/setLoginState', {isAuthenticated: true});
        return;
    }

    try {
        const response = await apiClient.post('/auth/register', {
            login: credentials.login,
            password: credentials.password
        });
        const {jwtToken} = response.data;

        updateJwtToken(jwtToken);

        const masterModel = await fetchMasterData();

        const existingUser = await getMasterFromLocalDB();

        if (existingUser && existingUser.getUuid() !== masterModel.getUuid()) {
            await clearDatabase();
        }

        await saveMasterToLocalDB(masterModel);

        store.commit('master/setMaster', masterModel);
        store.commit('master/setLoginState', {isAuthenticated: true});
        restoreProgressionFromServer(masterModel.userData);

    } catch (error) {
        const errorStr = error.response?.data?.error || error.message || 'Failed to register';
        throw new Error(errorStr);
    }
};

export const resetPassword = async (email) => {
    if (isMockMode()) {
        console.log('[MOCK] Password reset for:', email);
        return {success: true, message: 'Mock: password reset email sent'};
    }

    // Проверка на пустой email
    if (!email) {
        throw new Error(t.value.auth.reset.errorEmpty);
    }

    // Проверка на правильный формат email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        throw new Error(t.value.auth.reset.errorInvalidFormat);
    }

    const response = await apiClient.post('/user/reset', { email });

    // Проверяем ответ
    if (response.data) {
        return { success: true, message: t.value.auth.reset.success };
    } else {
        throw new Error(t.value.auth.reset.error);
    }
};


// Функция для получения данных текущего пользователя
const fetchMasterData = async () => {
    if (isMockMode()) {
        console.log('[MOCK] Fetching master data');
        return createMockMaster();
    }

    try {
        const response = await apiClient.get('/user/me', {authRequired: true});
        return MasterModel.fromJSON(response.data);
    } catch (error) {
        throw new Error('Failed to fetch user data from server');
    }
};

// Изменить профиль
export const changeProfile = async (profileData) => {
    if (isMockMode()) {
        console.log('[MOCK] Profile changed:', profileData);
        return {data: profileData};
    }

    try {
        return await apiClient.post('/user/edit', { profileData }, {authRequired: true});
    } catch (error) {
        console.error(error.response?.data?.error);
        throw new Error('Failed to change profile ' + error.response?.data?.error || error.message);
    }
};


// Выйти из системы
export const logout = async () => {
    if (isMockMode()) {
        console.log('[MOCK] Logout');
        store.commit('master/clearAuthData');
        return true;
    }

    try {
        // const response = await apiClient.post('/users/logout', {}, {authRequired: true});

        await clearDatabase();
        updateJwtToken("");

        return true;
    } catch (error) {
        throw new Error('Failed to logout');
    }
};

// Удалить аккаунт
export const deleteAccount = async () => {
    if (isMockMode()) {
        console.log('[MOCK] Account deleted');
        return;
    }

    try {
        const response = await apiClient.post('/user/delete', null, {authRequired: true});

        await resetClient();

    } catch (error) {
        console.error(error.response?.data?.error);
        throw new Error('Failed to change profile ' + error.response?.data?.error || error.message);
    }
};

// Отправить запрос на верификацию почты
export const sendVerifyEmail = async (code) => {
    if (isMockMode()) {
        console.log('[MOCK] Email verified');
        return true;
    }

    try {
        const response = await apiClient.post('/user/verify-email', code, {authRequired: false});

        if (response.data) {
            return true;
        }

        return false;

    } catch (error) {
        throw new Error('Failed verify email');
    }
};

export const uploadAvatar = async (formData, onUploadProgress) => {
    if (isMockMode()) {
        console.log('[MOCK] Avatar uploaded');
        return '';
    }

    try {
        const response = await apiClient.post('/user/put-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            authRequired: true,
            onUploadProgress, // Обработчик для прогресса загрузки
        });

        // Сохраняем в базу данных
        await updateMasterToLocalDB({avatarUrl: response.data.avatarUrl});

        return response.data.avatarUrl;

    } catch (error) {
        throw new Error('Failed to upload avatar ' + (error.response?.data?.error || error.message));
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
    const lang = localStorage.getItem('preferredLanguage');
    await deleteDB();
    localStorage.clear();
    if (lang) localStorage.setItem('preferredLanguage', lang);
}

export const validateJwtToken = (jwtToken) => {
    if (isMockMode()) {
        return true;
    }

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


export const getTelegram = () => {
    const KEY = 'isTelegramMiniApp';
    return localStorage.getItem(KEY) || false;
};

export const setTelegram = () => {
    store.commit('master/setIsTelegram', true);
    const KEY = 'isTelegramMiniApp';
    localStorage.setItem(KEY, true);
};