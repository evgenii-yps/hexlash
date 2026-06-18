import axios from 'axios';
import store from "@/core/state/store.js";
import {validateJwtToken} from "@/core/services/masterService.js";
import {isMockMode} from "@/core/mock/mockData.js";

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

// ── Arena fighter-intention (model brain) ───────────────────────────────────
// Posts the WORD context for one fighter on a fight break; resolves to
// { intention, read }. Short 1.5s timeout — a late answer is not worth applying.
//
// CRITICAL: this deliberately uses BARE axios, NOT the apiClient instance. The
// apiClient interceptors dispatch `master/logout` (→ navigate away from the arena)
// on a missing/invalid token or any 401 — which would EJECT the player to home the
// instant they flip BRAIN: MODEL. The model brain is a degrade-to-spinal dev path:
// every failure (no token, 401, 503 AI-off, 4xx/5xx, timeout, CORS, network, bad
// JSON) must REJECT quietly so the caller falls back to the spinal cord — it must
// never change the route or crash the fight frame. The token is attached manually
// when present; with no usable token we reject immediately (no doomed request, no
// logout). The caller (buildFighter.fireModelRequest) always has a .catch.
apiClient.requestFighterIntention = function (payload) {
    const token = store.getters['master/getJwtToken'];
    if (!token || !validateJwtToken(token)) {
        return Promise.reject(new Error('fighter-intention: no valid token (staying spinal)'));
    }
    return axios.post(`${__API_SERVER_URL__}/v1/ai/fighter-intention`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        timeout: 1500,
    }).then((resp) => resp.data);
};

export default apiClient;