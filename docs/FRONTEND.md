# Documentação do Frontend

O frontend é uma SPA (Single Page Application) construída com React, Vite e Tailwind CSS.

## Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizáveis (UI, Layout)
│   ├── contexts/       # Contextos globais (Auth, Toast)
│   ├── hooks/          # Hooks customizados
│   ├── pages/          # Páginas da aplicação
│   ├── services/       # Integração com API
│   ├── types/          # Definições TypeScript
│   └── utils/          # Utilitários
```

## Hooks Customizados

### `useAuth`
Gerencia a sessão do usuário.
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### `useToast`
Exibe notificações globais.
```typescript
const { addToast } = useToast();
addToast({ type: 'success', message: 'Salvo com sucesso!' });
```

### `useApi`
Padroniza chamadas à API com estados de loading e erro.
```typescript
const { data, loading, error, execute } = useApi(service.list);
```

## Serviços de API

Todos os serviços estendem um cliente HTTP base (`api.ts`) que gerencia:
- Base URL
- Headers de Autenticação (Bearer Token)
- Refresh Token automático
- Tratamento de erros global

Exemplo de uso:
```typescript
import { employeesService } from '../services/modules';
const employees = await employeesService.list();
```
