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

// ── AI API helpers ──────────────────────────────────────────────────────────
apiClient.analyzeClubModeFights = function (fights, totalFights, period, locale) {
    return this.post('/ai/club-mode-summary', { fights, totalFights, period, locale }, { authRequired: true });
};

export default apiClient;