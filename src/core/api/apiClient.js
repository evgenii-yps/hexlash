import axios from 'axios';

console.log(import.meta.env.VITE_API_SERVER + "/api/v1")
// Создание экземпляра axios с базовой конфигурацией
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_SERVER + "/api/v1",
    timeout: 10000, // настройка таймаута для запросов (в миллисекундах)
    headers: {
        'Content-Type': 'application/json', // тип контента
    },
});
// Добавление interceptor для обработки запросов
apiClient.interceptors.request.use(
    (config) => {
        // Проверка свойства authRequired в конфигурации запроса
        if (config.authRequired) {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        // Обработка ошибки запроса
        return Promise.reject(error);
    }
);

// Добавление interceptor для обработки ответов
apiClient.interceptors.response.use(
    (response) => {
        // Обработка успешного ответа
        return response;
    },
    (error) => {
        // Обработка ошибки ответа
        // Здесь можно добавить логику для обработки ошибок, например, обновление токена
        return Promise.reject(error);
    }
);

export default apiClient;