# Sistema de Controle de Produção - IMAC Congelados

O sistema é dividido em duas partes principais:
- **Frontend**: Interface web moderna construída com React e Tailwind CSS.
- **Backend**: API robusta em Node.js com banco de dados PostgreSQL.

---

## 🚀 Estrutura do Projeto

O projeto está organizado em duas pastas principais para facilitar a manutenção:

```
/
├── frontend/     # Código da aplicação web (React, Vite, Tailwind)
├── backend/      # Código da API (Node.js, Express, Prisma)
├── docs/         # Documentação técnica detalhada
├── .github/      # Workflows de CI/CD (GitHub Actions)
└── docker-compose.yml # Orquestração dos containers para desenvolvimento
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18**: Biblioteca para construção de interfaces.
- **TypeScript**: Para maior segurança e qualidade de código.
- **Tailwind CSS**: Estilização moderna e responsiva.
- **Vite**: Build tool extremamente rápida.
- **Recharts**: Gráficos interativos para dashboards.
- **Lucide React**: Ícones modernos e leves.

### Backend
- **Node.js**: Ambiente de execução JavaScript.
- **Express**: Framework web rápido e minimalista.
- **Prisma ORM**: Manipulação de banco de dados segura e tipada.
- **PostgreSQL**: Banco de dados relacional robusto.
- **Zod**: Validação de dados rigorosa.
- **JWT**: Autenticação segura via tokens.

---

## 💻 Como Rodar o Projeto

A maneira mais fácil de rodar o projeto é usando os scripts facilitadores configurados no `package.json` da raiz.

### Pré-requisitos
- Docker e Docker Compose instalados.
- Node.js (opcional, para rodar scripts de facilitação).

### Passo a Passo

1. **Configuração Inicial**
   ```bash
   # Instala dependências e configura variáveis de ambiente
   npm run setup
   ```
   *Nota: Certifique-se de configurar o arquivo `.env` na raiz e em `backend/.env` se necessário.*

2. **Rodar em Desenvolvimento**
   ```bash
   # Inicia backend e frontend em modo dev (com hot-reload)
   npm run dev
   ```
   Acesse:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Logs: `npm run logs`

3. **Rodar em Produção**
   ```bash
   # Build e start dos containers de produção (otimizados)
   npm run prod:start
   ```
   Acesse:
   - Aplicação: http://localhost (Porta 80)

### Comandos Úteis

- `npm run stop`: Para todos os containers.
- `npm run dev:build`: Reconstrói containers de dev.
- `npm run prod:logs`: Vê logs de produção.

---

## 📚 Documentação

Para mais detalhes técnicos, consulte a pasta `docs/`:

- [Arquitetura Geral](docs/ARCHITECTURE.md)
- [Documentação do Backend](docs/BACKEND.md)
- [Documentação do Frontend](docs/FRONTEND.md)
