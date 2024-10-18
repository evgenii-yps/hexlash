import axios from 'axios';
import store from "@/core/state/store.js";
import {validateJwtToken} from "@/core/services/masterService.js";

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
        // Проверяем, нужно ли добавлять токен
        if (config.authRequired) {
            const token = store.getters['master/getJwtToken']; // Получаем токен через getter Vuex
            if (token && validateJwtToken(token)) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }else{
                store.commit('master/setLoginState', {isAuthenticated: false});
                // TODO Reset
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
        // Обработка ошибки ответа
        if (error.response && error.response.status === 401) {
            // Если получен код 401, пользователь не авторизован, сбрасываем состояние аутентификации
            store.commit('master/setLoginState', {isAuthenticated: false});
        }
        return Promise.reject(error);
    }
);

export default apiClient;