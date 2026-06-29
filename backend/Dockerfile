FROM node:20-slim
WORKDIR /app

# Prisma'nın çalışma zamanında ihtiyaç duyduğu OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Prisma client üret + TypeScript derle
RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Konteyner her başladığında bekleyen migration'ları uygula, sonra sunucuyu başlat.
# (İlk kurulumda villa/ek hizmet verisini yüklemek için bir kez `npm run seed` çalıştırın.)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
