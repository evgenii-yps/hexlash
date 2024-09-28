import axios from 'axios';
import store from "@/core/state/store.js";

// Создание экземпляра axios с базовой конфигурацией
const apiClient = axios.create({
    baseURL: __SERVER_URL__ + "/v1",
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
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
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
        // Здесь можно добавить логику для обработки ошибок, например, обновление токена
        return Promise.reject(error);
    }
);

export default apiClient;