#!/bin/bash

# Script de Verificação de Saúde (Health Check)
# Uso: ./health-check.sh [url]

URL=${1:-http://localhost/health}
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "🏥 Executando health check em $URL..."

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s $URL > /dev/null 2>&1; then
        echo "✅ Health check passou! (tentativa $i/$MAX_RETRIES)"
        exit 0
    fi
    
    echo "⏳ Aguardando serviço... (tentativa $i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

echo "❌ Falha no health check após $MAX_RETRIES tentativas"
exit 1
