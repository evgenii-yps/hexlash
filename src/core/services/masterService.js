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

        // Restore player modules (fighter archetypes) from server
        if (Array.isArray(userData.progression.playerModules) && userData.progression.playerModules.length === 3) {
            store.commit('fight/setPlayerModules', userData.progression.playerModules);
            localStorage.setItem('hexlash_player_modules', JSON.stringify(userData.progression.playerModules));
        }
    }
    if (userData.deck) {
        store.commit('progressionState/restoreDeck', userData.deck);
    }

    // Restore PvP stats (rating, wins, losses, draws) from server
    store.dispatch('pvp/restoreFromServer', userData);
}

export const initializeMasterData = async () => {
    if (isMockMode()) {
        const mockMaster = createMockMaster();
        store.commit('master/setMaster', mockMaster);
        store.commit('master/setJwtToken', MOCK_JWT_TOKEN);
        store.commit('master/setLoginState', {isAuthenticated: true});
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
        const savedLang = localStorage.getItem('hexlash-language') || localStorage.getItem('preferredLanguage');
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

// Sub-epic 1b C6: telegram() function DELETED (decision #2 — Telegram-as-auth
// excised). setTelegram/getTelegram below preserved for adaptive UI flag.

export const sendCheckLoginAvailable = async (login) => {
    if (isMockMode()) {
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
        const mockMaster = createMockMaster();
        store.commit('master/setMaster', mockMaster);
        store.commit('master/setJwtToken', MOCK_JWT_TOKEN);
        store.commit('master/setLoginState', {isAuthenticated: true});
        return;
    }

    try {
        const referralCode = localStorage.getItem('hexlash_referral_code');
        const response = await apiClient.post('/auth/register', {
            login: credentials.login,
            password: credentials.password,
            // Email Auth Phase 5 — optional email at signup
            ...(credentials.email ? { email: credentials.email } : {}),
            ...(referralCode ? { referralCode } : {}),
        });
        localStorage.removeItem('hexlash_referral_code');
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

// Функция для получения данных текущего пользователя
const fetchMasterData = async () => {
    if (isMockMode()) {
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

// Email Auth Phase 5 — verify email by token from email link.
// Renamed from sendVerifyEmail (1b artifact) per ТЗ §9. Body shape changed
// from `code` к `{ token }` to match Phase 4 backend rewrite. Endpoint is
// public (token in body IS auth) — no JWT header attached.
export const verifyEmail = async (token) => {
    if (isMockMode()) {
        return true;
    }

    try {
        const response = await apiClient.post('/user/verify-email', { token });
        return !!response.data;
    } catch (error) {
        const errorStr = error.response?.data?.error || error.message || 'Failed to verify email';
        throw new Error(errorStr);
    }
};

// Email Auth Phase 5 — request password reset.
// Returns generic success regardless of backend outcome (forgot-password
// endpoint returns 200 in all cases to prevent email enumeration).
export const forgotPassword = async (email) => {
    if (isMockMode()) {
        return { ok: true };
    }

    try {
        await apiClient.post('/auth/forgot-password', { email });
        return { ok: true };
    } catch (error) {
        // Backend returns 200 even on internal errors. Real 4xx (bad email
        // format) is also normalized to ok:true для UX consistency — caller
        // displays generic success message regardless.
        if (error.response?.status === 400) {
            return { ok: false, error: error.response.data?.error || 'Invalid email format' };
        }
        return { ok: true };
    }
};

// Email Auth Phase 5 — complete password reset.
// On success: returns JWT + sets up logged-in state (mirror login flow).
export const resetPassword = async (token, newPassword) => {
    if (isMockMode()) {
        const mockMaster = createMockMaster();
        store.commit('master/setMaster', mockMaster);
        store.commit('master/setJwtToken', MOCK_JWT_TOKEN);
        store.commit('master/setLoginState', {isAuthenticated: true});
        return { ok: true };
    }

    try {
        const response = await apiClient.post('/auth/reset-password', { token, newPassword });
        const { jwtToken } = response.data;

        updateJwtToken(jwtToken);

        // Fetch master data after auto-login
        const masterModel = await fetchMasterData();
        await saveMasterToLocalDB(masterModel);

        store.commit('master/setMaster', masterModel);
        store.commit('master/setLoginState', { isAuthenticated: true });
        restoreProgressionFromServer(masterModel.userData);

        return { ok: true };
    } catch (error) {
        const errorStr = error.response?.data?.error || error.message || 'Failed to reset password';
        throw new Error(errorStr);
    }
};

// Email Auth Phase 5 — request a fresh verify email.
// Auth required (JWT — apiClient interceptor adds Bearer token).
export const resendVerification = async () => {
    if (isMockMode()) {
        return { ok: true };
    }

    try {
        await apiClient.post('/user/resend-verification', {});
        return { ok: true };
    } catch (error) {
        const errorStr = error.response?.data?.error || error.message || 'Failed to send verification email';
        return { ok: false, error: errorStr };
    }
};

export const uploadAvatar = async (formData, onUploadProgress) => {
    if (isMockMode()) {
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
    const lang = localStorage.getItem('hexlash-language') || localStorage.getItem('preferredLanguage');
    await deleteDB();
    localStorage.clear();
    if (lang) localStorage.setItem('hexlash-language', lang);
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
    const KEY = 'isTelegramMiniApp';
    localStorage.setItem(KEY, true);
};