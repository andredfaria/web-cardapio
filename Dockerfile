FROM node:20-alpine

# better-sqlite3 compila um addon nativo em C++ — requer essas ferramentas
RUN apk add --no-cache python3 make build-base

WORKDIR /app

# Instala dependências primeiro (aproveita cache do Docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o restante do código
COPY . .

# Variáveis de ambiente padrão (sobrescritas pelo EasyPanel)
ENV DB_PATH=/data/database.sqlite
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
