# Используем базовый образ для Node.js
FROM node:18-alpine AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json (если он есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код проекта
COPY . .

# Собираем приложение
RUN npm run build

# Используем минимальный сервер для статических файлов на базе Nginx
FROM nginx:1.26.2-alpine

# Копируем файлы сборки в Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем Nginx конфигурацию
COPY nginx.test.conf /etc/nginx/nginx.test.conf
COPY nginx.prod.conf /etc/nginx/nginx.prod.conf

ARG TARGET_ENV=test
RUN if [ "$TARGET_ENV" = "main" ]; then \
cp /etc/nginx/nginx.prod.conf /etc/nginx/nginx.conf; \
else \
cp /etc/nginx/nginx.test.conf /etc/nginx/nginx.conf; \
fi

# Открываем порт 8080, 8443
EXPOSE 8080
EXPOSE 8443

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
