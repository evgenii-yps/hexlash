FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# 1. Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma

# 2. Install dependencies
RUN npm install

# 3. Generate Prisma client
RUN npx prisma generate

# 4. Copy the rest of the app
COPY . .

EXPOSE 3000

# 5. Start: migrate + run server (no seed — gutted project has no startup data)
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
