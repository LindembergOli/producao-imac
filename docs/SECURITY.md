# Política de Segurança

## 🔒 Segurança do Sistema IMAC Congelados

Este documento descreve as práticas de segurança implementadas no sistema e como reportar vulnerabilidades.

---

## 📋 Práticas de Segurança Implementadas

### 1. Autenticação e Autorização

#### JWT (JSON Web Tokens)
- **Access Tokens:** Expiração de 7 dias
- **Refresh Tokens:** Expiração de 30 dias, armazenados no banco
- **Algoritmo:** HS256 (HMAC SHA-256)
- **Secrets:** Mínimo 32 caracteres, únicos por ambiente

#### RBAC (Role-Based Access Control)
Quatro níveis de acesso:
- **ADMIN:** Acesso total, incluindo gestão de usuários
- **SUPERVISOR:** Acesso a cadastros e relatórios
- **LIDER_PRODUCAO:** Criar/editar registros de produção
- **ESPECTADOR:** Apenas visualização (read-only)

#### Bloqueio de Conta
- **Tentativas Máximas:** 5 tentativas falhas
- **Duração do Bloqueio:** 15 minutos
- **Reset Automático:** Após login bem-sucedido
- **Notificação:** Mensagem informa tentativas restantes

### 2. Proteção de Senhas

#### Requisitos de Senha Forte
Todas as senhas devem atender:
- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 letra maiúscula
- ✅ Pelo menos 1 letra minúscula
- ✅ Pelo menos 1 número
- ✅ Pelo menos 1 caractere especial (!@#$%^&* etc)
- ✅ Não pode ser senha comum (lista de senhas fracas)

#### Armazenamento
- **Hash:** bcrypt com 10 rounds
- **Nunca armazenamos senhas em texto plano**
- **Tokens de reset:** Expiração de 1 hora

### 3. Proteção Contra Ataques

#### SQL Injection
- ✅ Prisma ORM com queries parametrizadas
- ✅ Validação de tipos com Zod
- ✅ Sanitização de inputs

#### XSS (Cross-Site Scripting)
- ✅ Sanitização de strings no backend
- ✅ Content Security Policy (CSP) via Helmet
- ✅ Escape automático no React

#### CSRF (Cross-Site Request Forgery)
- ⚠️ **EM IMPLEMENTAÇÃO**
- Tokens CSRF em formulários
- Validação no backend

#### Rate Limiting
- **Global:** 100 requisições por 15 minutos por IP
- **Login:** 5 tentativas por 15 minutos por IP
- **Endpoints sensíveis:** Limites customizados

### 4. Headers de Segurança (Helmet)

```javascript
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 5. CORS (Cross-Origin Resource Sharing)

- **Origem Permitida:** Apenas frontend configurado
- **Credentials:** Permitido apenas para origem autorizada
- **Métodos:** GET, POST, PUT, DELETE, PATCH
- **Headers:** Authorization, Content-Type

### 6. HTTPS Obrigatório

- **Produção:** Redirecionamento automático HTTP → HTTPS
- **Desenvolvimento:** Opcional (localhost)
- **Certificados:** Let's Encrypt recomendado

### 7. Auditoria e Rastreabilidade

#### Logs de Auditoria
Ações auditadas automaticamente:
- ✅ LOGIN / LOGOUT
- ✅ Criação de usuários
- ✅ Alteração de permissões
- ✅ Exclusão de registros importantes
- ✅ Alterações em configurações

#### Informações Capturadas
- Usuário que executou a ação
- Tipo de ação
- Entidade afetada
- Detalhes da alteração (JSON)
- IP e User-Agent
- Timestamp preciso

#### Retenção
- **Logs de Auditoria:** 90 dias
- **Logs de Sistema:** 30 dias
- **Logs de Erro:** 60 dias

### 8. Validação de Dados

- **Zod:** Validação de tipos e formatos
- **Sanitização:** Remoção de caracteres perigosos
- **Whitelist:** Apenas campos permitidos são aceitos
- **Strict Mode:** Rejeita campos extras

---

## 🚨 Reportando Vulnerabilidades

### Divulgação Responsável

Se você descobrir uma vulnerabilidade de segurança, por favor:

1. **NÃO divulgue publicamente** antes de nos contatar
2. **Envie um email** para: security@imac.com (substitua pelo email real)
3. **Inclua:**
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de correção (opcional)

### Tempo de Resposta

- **Confirmação:** Dentro de 48 horas
- **Avaliação Inicial:** Dentro de 5 dias úteis
- **Correção:** Depende da severidade
  - Crítica: 7 dias
  - Alta: 14 dias
  - Média: 30 dias
  - Baixa: 60 dias

### Reconhecimento

Agradecemos pesquisadores de segurança que reportam vulnerabilidades de forma responsável. Com sua permissão, incluiremos seu nome em nosso Hall da Fama de Segurança.

---

## ✅ Checklist de Segurança para Desenvolvedores

### Ao Criar Novos Endpoints

- [ ] Adicionar autenticação (`authenticate` middleware)
- [ ] Adicionar autorização (`requireRole` ou similar)
- [ ] Validar inputs com Zod
- [ ] Sanitizar strings
- [ ] Implementar rate limiting se necessário
- [ ] Adicionar auditoria para ações sensíveis
- [ ] Logar erros apropriadamente
- [ ] Testar com dados maliciosos

### Ao Trabalhar com Senhas

- [ ] NUNCA logar senhas
- [ ] Usar bcrypt para hash
- [ ] Validar senha forte
- [ ] Limpar senha da memória após uso
- [ ] Não retornar senha em respostas API

### Ao Trabalhar com Tokens

- [ ] Validar expiração
- [ ] Verificar assinatura
- [ ] Invalidar tokens no logout
- [ ] Não logar tokens completos
- [ ] Usar secrets fortes e únicos

### Ao Trabalhar com Dados Sensíveis

- [ ] Mascarar em logs (emails, CPFs, etc)
- [ ] Criptografar se necessário
- [ ] Limitar acesso (RBAC)
- [ ] Auditar acessos
- [ ] Não expor em mensagens de erro

---

## 🔐 Configuração de Produção

### Variáveis de Ambiente Críticas

```env
# NUNCA use valores padrão em produção!
JWT_SECRET=<gere_um_secret_forte_de_32+_caracteres>
JWT_REFRESH_SECRET=<gere_outro_secret_diferente>
DATABASE_URL=<url_do_banco_com_senha_forte>

# Gerar secrets fortes:
# Linux/Mac: openssl rand -base64 32
# Windows: [Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

### Validação de Secrets

O sistema valida automaticamente que secrets de produção não são valores padrão:

```javascript
// backend/src/config/env.js
if (isProduction) {
    const FORBIDDEN_SECRETS = ['your-secret-key', 'change-me', ...];
    if (FORBIDDEN_SECRETS.includes(JWT_SECRET)) {
        throw new Error('JWT_SECRET de produção não pode ser valor padrão!');
    }
}
```

### Hardening Adicional

1. **Firewall:** Permitir apenas portas necessárias
2. **Fail2Ban:** Bloquear IPs com tentativas excessivas
3. **Backups:** Automáticos e criptografados
4. **Monitoramento:** Alertas para atividades suspeitas
5. **Updates:** Manter dependências atualizadas

---

## 📚 Recursos Adicionais

### Documentação
- [Guia de Autenticação](AUTH_SYSTEM.md)
- [Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [Guia de Deployment](docs/DEPLOYMENT.md)

### Ferramentas Recomendadas
- **OWASP ZAP:** Scanner de vulnerabilidades
- **npm audit:** Verificar dependências vulneráveis
- **Snyk:** Monitoramento contínuo de segurança

### Padrões e Compliance
- **OWASP Top 10:** Seguimos as melhores práticas
- **LGPD:** Conformidade com lei brasileira de dados
- **ISO 27001:** Princípios de segurança da informação


