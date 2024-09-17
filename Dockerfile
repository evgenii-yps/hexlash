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
FROM nginx:alpine

# Копируем файлы сборки в Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем Nginx конфигурацию (опционально)
# COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 8443
EXPOSE 8443

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
