# Recuperação de Desastres (Disaster Recovery)

Este documento descreve os procedimentos necessários para restaurar o banco de dados da aplicação em caso de falha crítica, corrupção de dados ou perda de informações.

## 📋 Pré-requisitos

1.  Acesso ao terminal do servidor.
2.  Ferramentas do PostgreSQL instaladas (`pg_restore`, `psql`).
3.  Acesso ao arquivo de backup (`.dump`) desejado.
4.  Credenciais do banco de dados (ver arquivo `.env` ou variáveis de ambiente).

---

## 🔄 Procedimento de Restauração

### 1. Localizar o Backup
Os backups automatizados são armazenados em `backend/backups/`.
Identifique o arquivo mais recente ou o que contém os dados desejados:
```bash
ls -l backend/backups/
# Exemplo: backup_2023-10-27T10-00-00-000Z.dump
```

### 2. Parar a Aplicação (Recomendado)
Para evitar inconsistências durante a restauração, pare o serviço da API:
```bash
npm run stop
# ou se estiver usando PM2
pm2 stop backend
```

### 3. Executar a Restauração
Use o utilitário `pg_restore` para restaurar o banco.

**⚠️ AVISO: O comando abaixo (-c) limpará o banco de dados atual antes de restaurar!**

**Sintaxe Básica:**
```bash
pg_restore -d "postgres://usuario:senha@host:porta/nome_banco" -c --if-exists "caminho/para/arquivo.dump"
```

**Exemplo Prático (copie o DATABASE_URL do seu .env):**
```bash
# Exemplo local (ajuste conforme seu DATABASE_URL)
pg_restore -d "postgresql://postgres:root@localhost:5432/imac_db?schema=public" -c --if-exists "backend/backups/backup_2023-10-27T10-00-00-000Z.dump"
```

### 4. Verificar a Restauração
Após a conclusão, verifique se não houve erros críticos no terminal.
Inicie a aplicação e valide se os dados estão corretos:
```bash
npm run start
```

---

## 🛠️ Resolução de Problemas Comuns

### Erro: "role ... does not exist"
O backup foi criado com `--no-owner`. Se ainda assim houver erros de permissão, garanta que o usuário do banco tenha permissões de superusuário ou seja dono do banco.

### Erro: "database ... is being accessed by other users"
Certifique-se de que a aplicação está parada. Se necessário, desconecte outros usuários manualmente via `psql`.

### Arquivo Corrompido
Se o `pg_restore` falhar indicando arquivo corrompido, tente usar o backup imediatamente anterior.

---

## 📅 Teste de Recuperação
Recomenda-se realizar um teste de restauração em um ambiente de homologação a cada 3 meses para garantir a integridade dos backups.
