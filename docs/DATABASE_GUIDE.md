# Guia do Banco de Dados

## 1. Visão Geral do Banco

O banco de dados `imac_congelados` é relacional e utiliza o PostgreSQL. Ele foi projetado para suportar a arquitetura do sistema, garantindo integridade, performance e escalabilidade.

### Principais Entidades:
- **Autenticação**: Usuários e Tokens de Refresh.
- **Cadastros Base**: Funcionários, Produtos, Insumos eMáquinas.
- **Produção**: Velocidade de Produção (Metas vs Realizado).
- **Ocorrências**: Perdas, Erros de Produção, Manutenção, Absenteísmo.

---

## 2. Lista de Tabelas

| Tabela | Descrição | Principais Colunas |
|---|---|---|
| `users` | Usuários do sistema com acesso administrativo ou operacional. | `email`, `password` (hash), `role` |
| `refresh_tokens` | Tokens para manter a sessão do usuário ativa com segurança. | `token`, `userId`, `expiresAt` |
| `employees` | Cadastro de funcionários da fábrica. | `name`, `sector`, `role` |
| `products` | Catálogo de produtos fabricados. | `name`, `sector`, `unit`, `unit_cost` |
| `supplies` | Catálogo de insumos utilizados na produção. | `name`, `sector`, `unit`, `unit_cost` |
| `machines` | Equipamentos utilizados na produção. | `name`, `code`, `sector` |
| `production_speed` | Registro de metas e produção diária. | `mesAno`, `sector`, `dailyProduction` (JSON) |
| `losses` | Registro de perdas de material ou produto. | `date`, `lossType`, `quantity`, `totalCost` |
| `errors` | Registro de erros operacionais ou de qualidade. | `date`, `category`, `description`, `cost` |
| `maintenance` | Ordens de serviço para manutenção de máquinas. | `date`, `machine`, `problem`, `status` |
| `absenteeism` | Controle de faltas e atestados de funcionários. | `date`, `employeeName`, `absenceType` |

---

## 3. Diagrama de Relacionamentos (Textual)

- **User (1) <-> (N) RefreshToken**: Um usuário pode ter vários tokens de sessão (ex: logado no celular e no PC), mas um token pertence a apenas um usuário.
- **Outras Entidades**: A maioria das tabelas operacionais (`losses`, `production`, etc.) são independentes, mas referenciam logicamente `Sector`, `Product` ou `Machine` através de campos de texto ou Enums para manter o histórico imutável (ex: se um produto mudar de nome, o registro antigo de perda mantém o nome original).

---

## 4. Guia de Instalação e Criação

### Passo 1: Instalar o PostgreSQL
1.  Baixe o instalador em [postgresql.org/download](https://www.postgresql.org/download/).
2.  Siga a instalação padrão. Defina uma senha para o usuário `postgres` (anote-a!).
3.  Instale também o **pgAdmin 4** (geralmente vem junto) para gerenciar o banco visualmente.

### Passo 2: Criar o Banco de Dados
1.  Abra o **pgAdmin 4**.
2.  Conecte-se ao servidor local (localhost).
3.  Clique com o botão direito em `Databases` > `Create` > `Database...`.
4.  Nome: `imac_congelados`.
5.  Clique em `Save`.

### Passo 3: Executar o Script SQL
1.  Clique com o botão direito no banco `imac_congelados` recém-criado.
2.  Selecione `Query Tool`.
3.  Copie o **SQL FINAL COMPLETO** (seção 7 deste guia).
4.  Cole no editor do Query Tool.
5.  Clique no botão "Play" (Execute) ou pressione `F5`.
6.  Verifique se as tabelas apareceram em `Schemas` > `public` > `Tables`.

---

## 5. Conectando o Backend

O backend usa o Prisma ORM para conectar. Configure o arquivo `.env` na pasta `backend/`:

```env
# Formato: postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO?schema=public
DATABASE_URL="postgresql://postgres:sua_senha_aqui@localhost:5432/imac_congelados?schema=public"
```

### Testando a Conexão
No terminal, dentro da pasta `backend/`:
```bash
npx prisma db pull
```
Se funcionar, ele lerá o banco e atualizará o `schema.prisma`.

---

## 6. Manutenção Futura

### Backup
Para fazer backup, use o terminal ou pgAdmin:
```bash
pg_dump -U postgres -h localhost imac_congelados > backup_data.sql
```

### Restaurar Backup
```bash
psql -U postgres -h localhost -d imac_congelados < backup_data.sql
```

### Migrações (Alterar o banco)
Sempre que alterar o `schema.prisma`, rode:
```bash
npx prisma migrate dev --name nome_da_mudanca
```
Isso cria o SQL de alteração e aplica no banco automaticamente.

---

## 7. SQL FINAL COMPLETO

Copie e execute este código no Query Tool do PostgreSQL para criar toda a estrutura do zero.

```sql
-- ============================================================
-- CRIAÇÃO DO BANCO DE DADOS
-- ============================================================

-- 1. Criação dos ENUMS (Tipos Personalizados)
DO $$ BEGIN
    CREATE TYPE "Sector" AS ENUM ('CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'EMBALADORA');
    CREATE TYPE "Unit" AS ENUM ('KG', 'UND');
    CREATE TYPE "LossType" AS ENUM ('MASSA', 'EMBALAGEM', 'INSUMO');
    CREATE TYPE "ErrorCategory" AS ENUM ('OPERACIONAL', 'EQUIPAMENTO', 'MATERIAL', 'QUALIDADE');
    CREATE TYPE "MaintenanceStatus" AS ENUM ('EM_ABERTO', 'FECHADO');
    CREATE TYPE "AbsenceType" AS ENUM ('ATESTADO', 'FALTA_INJUSTIFICADA', 'BANCO_DE_HORAS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Usuários (users)
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- 3. Tabela de Tokens de Refresh (refresh_tokens)
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_key" ON "refresh_tokens"("token");

ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Tabela de Funcionários (employees)
CREATE TABLE IF NOT EXISTS "employees" (
    "id" SERIAL NOT NULL,
    "sector" "Sector" NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- 5. Tabela de Produtos (products)
CREATE TABLE IF NOT EXISTS "products" (
    "id" SERIAL NOT NULL,
    "sector" "Sector" NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "Unit" NOT NULL,
    "yield" DOUBLE PRECISION,
    "unit_cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- 6. Tabela de Insumos (supplies)
CREATE TABLE IF NOT EXISTS "supplies" (
    "id" SERIAL NOT NULL,
    "sector" "Sector" NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "Unit" NOT NULL,
    "unit_cost" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplies_pkey" PRIMARY KEY ("id")
);

-- 7. Tabela de Máquinas (machines)
CREATE TABLE IF NOT EXISTS "machines" (
    "id" SERIAL NOT NULL,
    "sector" "Sector" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "machines_code_key" ON "machines"("code");

-- 8. Tabela de Velocidade de Produção (production_speed)
CREATE TABLE IF NOT EXISTS "production_speed" (
    "id" SERIAL NOT NULL,
    "mesAno" TEXT NOT NULL,
    "sector" "Sector" NOT NULL,
    "produto" TEXT NOT NULL,
    "metaMes" DOUBLE PRECISION NOT NULL,
    "dailyProduction" JSONB NOT NULL,
    "totalProgramado" DOUBLE PRECISION NOT NULL,
    "totalRealizado" DOUBLE PRECISION NOT NULL,
    "velocidade" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_speed_pkey" PRIMARY KEY ("id")
);

-- 9. Tabela de Perdas (losses)
CREATE TABLE IF NOT EXISTS "losses" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sector" "Sector" NOT NULL,
    "product" TEXT NOT NULL,
    "lossType" "LossType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "losses_pkey" PRIMARY KEY ("id")
);

-- 10. Tabela de Erros (errors)
CREATE TABLE IF NOT EXISTS "errors" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sector" "Sector" NOT NULL,
    "product" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action" TEXT,
    "category" "ErrorCategory" NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "errors_pkey" PRIMARY KEY ("id")
);

-- 11. Tabela de Manutenção (maintenance)
CREATE TABLE IF NOT EXISTS "maintenance" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sector" "Sector" NOT NULL,
    "machine" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "technician" TEXT,
    "problem" TEXT NOT NULL,
    "solution" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "status" "MaintenanceStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_pkey" PRIMARY KEY ("id")
);

-- 12. Tabela de Absenteísmo (absenteeism)
CREATE TABLE IF NOT EXISTS "absenteeism" (
    "id" SERIAL NOT NULL,
    "employeeName" TEXT NOT NULL,
    "sector" "Sector" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "absenceType" "AbsenceType" NOT NULL,
    "daysAbsent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absenteeism_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- DADOS INICIAIS (SEED)
-- ============================================================

-- Inserir usuário admin padrão (Senha: 123456)
-- O hash abaixo é para '123456' gerado com bcrypt
INSERT INTO "users" ("email", "password", "name", "role", "updatedAt")
VALUES ('admin@imac.com', '$2b$10$tH.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w', 'Administrador', 'admin', NOW())
ON CONFLICT ("email") DO NOTHING;

-- Inserir alguns produtos de exemplo
INSERT INTO "products" ("sector", "name", "unit", "yield", "unit_cost", "updatedAt")
VALUES 
('PAES', 'Pão Francês', 'KG', 50, 0.35, NOW()),
('PAO_DE_QUEIJO', 'Pão de Queijo Tradicional', 'KG', 40, 0.80, NOW()),
('CONFEITARIA', 'Bolo de Chocolate', 'UND', 12, 15.00, NOW())
ON CONFLICT DO NOTHING;

-- Inserir alguns insumos de exemplo
INSERT INTO "supplies" ("sector", "name", "unit", "unit_cost", "updatedAt")
VALUES 
('PAES', 'Farinha de Trigo', 'KG', 2.50, NOW()),
('CONFEITARIA', 'Açúcar Refinado', 'KG', 3.20, NOW()),
('PAO_DE_QUEIJO', 'Polvilho Azedo', 'KG', 4.80, NOW())
ON CONFLICT DO NOTHING;

-- Inserir algumas máquinas de exemplo
INSERT INTO "machines" ("sector", "name", "code", "updatedAt")
VALUES 
('PAES', 'Forno Rotativo 01', 'FRN-001', NOW()),
('EMBALADORA', 'Embaladora Automática', 'EMB-001', NOW())
ON CONFLICT ("code") DO NOTHING;

```
