#!/bin/bash

# Script de Deploy para IMAC Congelados
# Uso: ./deploy.sh [dev|prod]

set -e  # Sair em caso de erro


ENVIRONMENT=${1:-dev}

# Navegar para o diretório dos arquivos docker compose
cd "$(dirname "$0")/../docker"

COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "🚀 Iniciando deploy para ambiente $ENVIRONMENT..."

# Baixar imagens mais recentes
echo "📦 Baixando últimas imagens Docker..."
docker-compose -f $COMPOSE_FILE pull

# Parar containers atuais
echo "🛑 Parando containers atuais..."
docker-compose -f $COMPOSE_FILE down

# Iniciar novos containers
echo "▶️  Iniciando novos containers..."
docker-compose -f $COMPOSE_FILE up -d

# Aguardar serviços estarem prontos
echo "⏳ Aguardando serviços iniciarem..."
sleep 15

# Executar migrações de banco de dados
echo "🔄 Executando migrações do banco de dados..."
docker-compose -f $COMPOSE_FILE exec -T backend npx prisma migrate deploy

# Verificação de saúde (Health check)
echo "🏥 Executando verificação de saúde..."
sleep 5

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Health check passou!"
else
    echo "❌ Falha no health check!"
    echo "🔙 Revertendo..."
    docker-compose -f $COMPOSE_FILE down
    exit 1
fi

# Mostrar status
echo "📊 Status dos containers:"
docker-compose -f $COMPOSE_FILE ps

echo "✅ Deploy para $ENVIRONMENT concluído com sucesso!"
