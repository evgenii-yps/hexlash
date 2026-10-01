import axios from 'axios';
import store from "@/core/state/store.js";
import {validateJwtToken} from "@/core/services/masterService.js";
import {isMockMode} from "@/core/mock/mockData.js";
import {getGuestId} from "@/services/playerProgress.js";

// Создание экземпляра axios с базовой конфигурацией
const apiClient = axios.create({
    baseURL: __API_SERVER_URL__ + "/v1",
    timeout: 10000, // настройка таймаута для запросов (в миллисекундах)
    headers: {
        'Content-Type': 'application/json', // тип контента
    },
});
// Добавление interceptor для обработки запросов
apiClient.interceptors.request.use(
    (config) => {
        if (isMockMode()) {
            // В мок-режиме отменяем реальные запросы
            const cancelSource = axios.CancelToken.source();
            config.cancelToken = cancelSource.token;
            cancelSource.cancel('[MOCK] API request cancelled — using mock data');
            return config;
        }

        // Проверяем, нужно ли добавлять токен
        if (config.authRequired) {
            const token = store.getters['master/getJwtToken']; // Получаем токен через getter Vuex
            if (token && validateJwtToken(token)) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }else{
                store.dispatch('master/logout');
                return Promise.reject(new Error('Token is invalid or missing'));
            }
        }
        return config;
    },
    (error) => {
        console.error(error);
        return Promise.reject(error);
    }
);

// Добавление interceptor для обработки ответов
apiClient.interceptors.response.use(
    (response) => {
        // Обработка успешного ответа
        return response.data;
    },
    (error) => {
        if (isMockMode() && axios.isCancel(error)) {
            return Promise.resolve({data: {}});
        }

        // Обработка ошибки ответа
        if (error.response && error.response.status === 401) {
            // Не вызываем logout для auth-роутов (login, register, telegram)
            const url = error.config?.url || '';
            const isAuthRoute = url.includes('/auth/');
            if (!isAuthRoute) {
                // Если получен код 401, пользователь не авторизован, сбрасываем состояние аутентификации
                return store.dispatch('master/logout')
                    .then(() => {
                        return Promise.reject(new Error('Token is invalid or missing'));
                    });
            }
        }
        return Promise.reject(error);
    }
);

// ── Referral API helpers ───────────────────────────────────────────────────
apiClient.getReferrals = function () {
    return this.get('/user/referrals', { authRequired: true });
};

// ── Arena model calls (fighter intention + legend command) ─────────────────
// Both go through BARE axios, NOT the apiClient instance, and use the same rules:
//
//  • SHORT 1.5s timeout — a late answer is not worth applying; the fight never
//    waits for the model.
//  • EVERY failure (no network, 401, 429, 503 AI-off or daily cap, 4xx/5xx,
//    timeout, CORS, bad JSON) must REJECT quietly so the caller falls back to
//    the reflexes. It must never change the route or crash the fight frame.
//  • WHY BARE AXIOS: the apiClient interceptors dispatch `master/logout` (→ navigate
//    away from the arena) on a missing/invalid token or any 401 — which would
//    EJECT the player to home. The callers (buildFighter.fireModelRequest,
//    commandBrain.fire) always have a .catch.
//
// WHO IS ASKING. A signed-in player sends their token, exactly as before. A GUEST
// has no token (guest play is the only entry today), so the request goes out as a
// guest: no Authorization header, plus an anonymous per-tab id in X-Guest-Id.
// The id is not an account and carries no personal data — see getGuestId().
// The server accepts a guest on these two routes only.
function modelRequestHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = store.getters['master/getJwtToken'];
    if (token && validateJwtToken(token)) {
        headers.Authorization = `Bearer ${token}`;
    } else {
        headers['X-Guest-Id'] = getGuestId();
    }
    return headers;
}

// Posts the WORD context for one fighter on a fight break; resolves to
// { intention, read }.
apiClient.requestFighterIntention = function (payload) {
    return axios.post(`${__API_SERVER_URL__}/v1/ai/fighter-intention`, payload, {
        headers: modelRequestHeaders(),
        timeout: 1500,
    }).then((resp) => resp.data);
};

/**
 * РЕШЕНИЕ ЛЕГЕНДЫ — рычаг, цель и реплика ОДНИМ ответом (COMMAND часть B).
 *
 * ⚠️ ТОТ ЖЕ СРОК ОЖИДАНИЯ, ЧТО У НАМЕРЕНИЯ БОЙЦА, И ПО ТОЙ ЖЕ ПРИЧИНЕ: бой не
 *    ждёт модель. Не успели — правила остаются на табличке порогов, а отказ
 *    здесь нормальное, ожидаемое событие, а не происшествие.
 */
apiClient.requestLegendCommand = function (payload) {
    return axios.post(`${__API_SERVER_URL__}/v1/ai/legend-command`, payload, {
        headers: modelRequestHeaders(),
        timeout: 1500,
    }).then((resp) => resp.data);
};

export default apiClient;
