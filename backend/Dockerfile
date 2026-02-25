FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. Copy prisma schema BEFORE npm install
COPY prisma ./prisma

# 3. Install dependencies (no postinstall issues now)
RUN npm install

# 4. Generate Prisma client explicitly
RUN npx prisma generate

# 5. Copy the rest of the app
COPY . .

# 6. Setup database
RUN npx prisma db push
RUN node prisma/seed.js

EXPOSE 3000

CMD ["node", "src/index.js"]
