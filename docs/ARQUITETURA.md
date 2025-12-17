# Arquitetura do Sistema

## Princípios Chave

1.  **Modularidade por Domínio**: O código é organizado por contexto de negócio (ex: `products`, `employees`), não por tipo técnico (ex: `controllers`, `services` misturados).
2.  **Responsabilidade Única**: Cada módulo resolve um problema específico.
3.  **Tipagem Estrita**: TypeScript é usado extensivamente para evitar erros em tempo de execução.
4.  **Validação na Entrada**: Todos os dados externos passam por validação rigorosa (Zod) antes de entrar na lógica de negócio.

## Diagrama de Alto Nível

```mermaid
graph TD
    Client[Frontend (React)] -->|HTTP/REST| API[Backend (Node.js)]
    API -->|Prisma| DB[(PostgreSQL)]
    API -->|Auth| JWT[JWT Service]
```

## Fluxo de Dados

1.  **Request**: Cliente envia requisição HTTP.
2.  **Middleware**: Autenticação, Logging, Rate Limiting.
3.  **Controller**: Recebe request, valida input (Zod), chama Service.
4.  **Service**: Executa regra de negócio, chama Repository/Prisma.
5.  **Database**: Persistência de dados.
6.  **Response**: Retorna dados padronizados ou erro tratado.
