FROM node:20-slim

WORKDIR /app

# Instala dependências nativas necessárias para Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install
RUN npm run build
RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
