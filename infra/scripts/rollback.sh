#!/bin/bash

# Script de Rollback
# Uso: ./rollback.sh [dev|prod]

set -e


ENVIRONMENT=${1:-dev}

# Navegar para o diretório dos arquivos docker compose
cd "$(dirname "$0")/../docker"

COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR=~/backups

if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "🔙 Iniciando rollback para $ENVIRONMENT..."

# Obter backup mais recente
LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ Nenhum backup encontrado!"
    exit 1
fi

echo "📂 Usando backup: $LATEST_BACKUP"

# Parar containers atuais
echo "🛑 Parando containers..."
docker-compose -f $COMPOSE_FILE down

# Restaurar banco de dados
echo "🔄 Restaurando banco de dados..."
docker-compose -f $COMPOSE_FILE up -d postgres
sleep 10

docker-compose -f $COMPOSE_FILE exec -T postgres \
    psql -U $POSTGRES_USER $POSTGRES_DB < $BACKUP_DIR/$LATEST_BACKUP/database.sql

# Iniciar todos os containers
echo "▶️  Iniciando containers..."
docker-compose -f $COMPOSE_FILE up -d

echo "✅ Rollback concluído!"
