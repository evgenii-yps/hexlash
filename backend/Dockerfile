FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npx prisma db push
RUN node prisma/seed.js

EXPOSE 3000

CMD ["node", "src/index.js"]
