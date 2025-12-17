#!/bin/bash

# ================================
# Script de Backup - PostgreSQL
# IMAC Congelados - Sistema de Controle de Produção
# ================================

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ ${1}${NC}"; }
print_success() { echo -e "${GREEN}✓ ${1}${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ ${1}${NC}"; }
print_error() { echo -e "${RED}✗ ${1}${NC}"; }

# Configurações
BACKUP_DIR="../../backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="imac_congelados_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
KEEP_DAYS=7

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         IMAC Congelados - Backup PostgreSQL               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Verificar se container está rodando
print_info "Verificando container PostgreSQL..."
if ! docker compose ps postgres | grep -q "Up"; then
    print_error "Container PostgreSQL não está rodando!"
    print_info "Inicie com: docker compose up postgres -d"
    exit 1
fi
print_success "Container PostgreSQL está rodando"

# Carregar variáveis de ambiente
if [ -f "../../.env" ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
fi

POSTGRES_USER=${POSTGRES_USER:-imac_user}
POSTGRES_DB=${POSTGRES_DB:-imac_congelados}

# Executar backup
print_info "Iniciando backup do banco de dados..."
print_info "Database: $POSTGRES_DB"
print_info "Arquivo: $BACKUP_FILE_GZ"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_success "Backup SQL criado"
    
    # Comprimir backup
    print_info "Comprimindo backup..."
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE_GZ" | cut -f1)
        print_success "Backup comprimido: $BACKUP_SIZE"
        print_success "Localização: $BACKUP_DIR/$BACKUP_FILE_GZ"
    else
        print_error "Erro ao comprimir backup"
        exit 1
    fi
else
    print_error "Erro ao criar backup"
    exit 1
fi

# Limpar backups antigos
print_info "Limpando backups com mais de $KEEP_DAYS dias..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$KEEP_DAYS -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
print_success "Backups mantidos: $REMAINING"

# Listar backups
echo ""
print_info "Backups disponíveis:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

echo ""
print_success "Backup concluído com sucesso!"
echo ""
print_info "Para restaurar este backup:"
echo "  gunzip -c $BACKUP_DIR/$BACKUP_FILE_GZ | docker compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB"
echo ""
