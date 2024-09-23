# Используем базовый образ для Node.js
FROM node:20-alpine AS build

# Устанавливаем необходимые инструменты для сборки пакетов
RUN apk add --no-cache \
    autoconf \
    automake \
    libtool \
    nasm \
    build-base \
    pkgconfig \
    zlib-dev \
    jpeg-dev

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

# Копируем шаблон Nginx конфигурации
COPY nginx.template.conf /etc/nginx/nginx.template.conf

# Открываем порт 8080, 8443
EXPOSE 8080
EXPOSE 8443

# Используем переменные окружения для конфигурации
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
