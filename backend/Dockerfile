FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy all files first so prisma schema is available during npm install (postinstall)
COPY . .

RUN npm install

# Database setup
RUN npx prisma db push
RUN node prisma/seed.js

EXPOSE 3000

CMD ["node", "src/index.js"]
