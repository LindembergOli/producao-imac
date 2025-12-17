#!/bin/bash

# ================================
# Script de Inicialização - Desenvolvimento
# IMAC Congelados - Sistema de Controle de Produção
# ================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para printar com cor
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         IMAC Congelados - Ambiente de Desenvolvimento     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se Docker está instalado
print_info "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado!"
    echo "Por favor, instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker encontrado: $(docker --version)"

# Verificar se Docker Compose está instalado
print_info "Verificando Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose não está instalado!"
    echo "Por favor, instale o Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
print_success "Docker Compose encontrado: $(docker compose version)"

# Verificar se arquivo .env existe
print_info "Verificando arquivo .env..."
if [ ! -f "../../.env" ]; then
    print_warning "Arquivo .env não encontrado!"
    print_info "Criando .env a partir de .env.example..."
    cp ../../.env.example ../../.env
    print_success "Arquivo .env criado!"
    print_warning "IMPORTANTE: Revise as configurações em .env antes de continuar"
    read -p "Pressione ENTER para continuar..."
else
    print_success "Arquivo .env encontrado"
fi

# Verificar portas disponíveis
print_info "Verificando portas..."
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "Porta $1 está em uso!"
        return 1
    else
        print_success "Porta $1 disponível"
        return 0
    fi
}

PORTS_OK=true
check_port 3000 || PORTS_OK=false
check_port 3001 || PORTS_OK=false
check_port 5432 || PORTS_OK=false

if [ "$PORTS_OK" = false ]; then
    print_warning "Algumas portas estão em uso. Deseja continuar mesmo assim? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Operação cancelada"
        exit 0
    fi
fi

# Perguntar se deseja limpar volumes antigos
echo ""
print_info "Deseja limpar volumes antigos? (Isso apagará dados do banco) (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    print_warning "Removendo volumes..."
    docker compose down -v
    print_success "Volumes removidos"
fi

# Iniciar serviços
echo ""
print_info "Iniciando serviços Docker..."
echo ""

# Opções de inicialização
echo "Escolha uma opção:"
echo "  1) Iniciar em foreground (ver logs)"
echo "  2) Iniciar em background (daemon)"
echo "  3) Rebuild e iniciar"
echo "  4) Apenas PostgreSQL"
echo ""
read -p "Opção [1]: " option
option=${option:-1}

case $option in
    1)
        print_info "Iniciando em foreground..."
        docker compose up
        ;;
    2)
        print_info "Iniciando em background..."
        docker compose up -d
        print_success "Serviços iniciados!"
        echo ""
        print_info "Para ver logs: docker compose logs -f"
        print_info "Para parar: docker compose down"
        ;;
    3)
        print_info "Rebuilding e iniciando..."
        docker compose up --build -d
        print_success "Serviços iniciados!"
        ;;
    4)
        print_info "Iniciando apenas PostgreSQL..."
        docker compose up postgres -d
        print_success "PostgreSQL iniciado!"
        ;;
    *)
        print_error "Opção inválida"
        exit 1
        ;;
esac

# Informações de acesso
if [ "$option" != "1" ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    Serviços Disponíveis                    ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║  Frontend:    http://localhost:3000                        ║"
    echo "║  Backend:     http://localhost:3001/api                    ║"
    echo "║  PostgreSQL:  localhost:5432                               ║"
    echo "║               User: imac_user                              ║"
    echo "║               DB: imac_congelados                          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    print_info "Comandos úteis:"
    echo "  docker compose logs -f              # Ver logs"
    echo "  docker compose ps                   # Status dos containers"
    echo "  docker compose down                 # Parar serviços"
    echo "  docker compose exec backend sh      # Acessar backend"
    echo "  docker compose exec postgres psql -U imac_user -d imac_congelados"
    echo ""
fi

print_success "Ambiente de desenvolvimento pronto!"
