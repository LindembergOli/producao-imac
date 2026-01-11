# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-slim AS dependencies

WORKDIR /app

# Instalar OpenSSL e outras dependências necessárias para Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (incluindo devDependencies para desenvolvimento)
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Gerar Prisma Client
RUN npx prisma generate

# ================================
# Stage 2: Development
# ================================
FROM node:20-slim AS development

WORKDIR /app

# Instalar OpenSSL para Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copiar node_modules da stage anterior
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3001

# Comando de desenvolvimento
CMD ["npm", "run", "dev"]

# ================================
# Stage 3: Production
# ================================
FROM node:20-slim AS production

# Criar usuário não-root
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Instalar OpenSSL para Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar dependências de produção
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=dependencies --chown=nodejs:nodejs /app/package*.json ./

# Copiar código fonte
COPY --chown=nodejs:nodejs . .

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de produção
CMD ["node", "src/server.js"]
