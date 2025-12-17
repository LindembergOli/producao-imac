# Documentação do Backend

O backend é uma API RESTful construída com Node.js, Express e Prisma.

## Estrutura de Pastas

```
backend/
├── src/
│   ├── config/         # Configurações globais (env, db)
│   ├── middlewares/    # Middlewares (auth, error, validation)
│   ├── modules/        # Módulos de domínio (controllers, services, schemas)
│   │   ├── auth/
│   │   ├── employees/
│   │   ├── products/
│   │   └── ...
│   ├── utils/          # Utilitários gerais
│   ├── app.js          # Configuração do Express
│   └── server.js       # Ponto de entrada
```

## Módulos Disponíveis

| Módulo | Descrição | Endpoints Principais |
|---|---|---|
| **Auth** | Autenticação e Usuários | `/auth/login`, `/auth/register`, `/auth/me` |
| **Employees** | Gestão de Funcionários | `/employees` (CRUD) |
| **Products** | Catálogo de Produtos | `/products` (CRUD) |
| **Machines** | Gestão de Máquinas | `/machines` (CRUD) |
| **Production** | Velocidade de Produção | `/production/speed` (CRUD) |
| **Losses** | Registro de Perdas | `/losses` (CRUD) |
| **Errors** | Registro de Erros | `/errors` (CRUD) |
| **Maintenance** | Ordens de Manutenção | `/maintenance` (CRUD) |
| **Absenteeism** | Controle de Absenteísmo | `/absenteeism` (CRUD) |

## Padrões de Código

### Controller
```javascript
export const list = async (req, res, next) => {
  try {
    const data = await service.list();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
```

### Service
```javascript
export const list = async () => {
  return prisma.model.findMany();
};
```

### Validação (Zod)
```javascript
export const createSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});
```
