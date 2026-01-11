# 🚀 Guia de Implantação em Produção - IMAC Congelados

Este guia detalha como colocar a aplicação em produção utilizando Docker, Nginx e SSL automatizado com Let's Encrypt.

## 📋 Pré-requisitos

- Servidor Linux (Ubuntu/Debian recomendado)
- Docker e Docker Compose instalados
- Domínio configurado apontando para o IP do servidor (Portas 80 e 443 abertas)

## 🛠️ Passo a Passo

### 1. Configuração do Ambiente

1. Clone o repositório no servidor.
2. Navegue até a pasta de infraestrutura Docker:
   ```bash
   cd infra/docker
   ```
3. Crie o arquivo `.env` de produção:
   ```bash
   cp .env.production.example .env
   nano .env
   ```
   **IMPORTANTE:**
   - Gere senhas fortes para `POSTGRES_PASSWORD` e `JWT_SECRET`.
   - Configure `CORS_ORIGIN` com seu domínio (ex: `https://producaoimac.com`).
   - Configure `DOMAIN_NAME` com seu domínio.

### 2. Configuração SSL (Primeira vez)

Edite o script de inicialização para definir seu domínio e email:

```bash
nano init-letsencrypt.sh
# Edite: domains=(seudominio.com www.seudominio.com)
# Edite: email="admin@imac.com"
```

Execute o script:
```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

Este script irá:
1. Baixar parâmetros de segurança TLS.
2. Criar certificados temporários para o Nginx iniciar.
3. Iniciar o Nginx.
4. Solicitar o certificado real ao Let's Encrypt via Certbot.
5. Configurar renovação automática.

### 3. Gerenciamento

#### Iniciar Aplicação
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Parar Aplicação
```bash
docker-compose -f docker-compose.prod.yml down
```

#### Ver Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

#### Renovação de Certificados
O Certbot roda em um container separado e verifica a renovação a cada 12 horas automaticamente.

## 🛡️ Segurança Implementada

- **Rede Isolada:** Backend e Banco de Dados não expõem portas para a internet. Apenas o Nginx (80/443).
- **Proxy Reverso:** Nginx gerencia SSL, Headers de segurança e compressão Gzip.
- **HTTPS Obrigatório:** Redirecionamento automático de HTTP para HTTPS.
- **Usuário Não-Root:** Containers rodam com usuário limitado (onde possível).
- **Restart Policy:** `restart: always` garante que o serviço volte em caso de reboot.
- **Limites de Recursos:** CPU e Memória limitados para proteger o servidor.

## 🐛 Teste Local (Windows/Linux)

Para testar localmente com certificados auto-assinados:
1. Use o script `init-dev-certs.ps1` (Windows) ou ajuste o shell script.
2. Configure `.env` com `DOMAIN_NAME=localhost` ou use arquivo hosts.
3. Execute `docker-compose -f docker-compose.prod.yml up -d --build`.
   *Nota:* O navegador alertará sobre certificado inválido, isso é normal em localhost.
