# Módulo de Produção

## Visão Geral

Módulo responsável por gerenciar registros de velocidade de produção, rastreando metas mensais e produção diária por setor e produto.

## Estrutura

```
production/
├── controller.js    # Handlers das rotas HTTP
├── service.js       # Lógica de negócio
├── validator.js     # Validação de dados com Zod
└── routes.js        # Definição de rotas
```

## Endpoints Disponíveis

### `GET /api/production`
Retorna todos os registros de produção.

**Autenticação:** Requerida  
**Permissões:** Todos os usuários autenticados

**Resposta:**
```json
[
  {
    "id": 1,
    "mesAno": "01/2024",
    "sector": "CONFEITARIA",
    "produto": "Bolo de Chocolate",
    "metaMes": 1000,
    "dailyProduction": [...],
    "totalProgramado": 1000,
    "totalRealizado": 950,
    "velocidade": 95.0
  }
]
```

### `POST /api/production`
Cria um novo registro de produção.

**Autenticação:** Requerida  
**Permissões:** ADMIN, SUPERVISOR, LIDER_PRODUCAO

**Body:**
```json
{
  "mesAno": "01/2024",
  "sector": "CONFEITARIA",
  "produto": "Bolo de Chocolate",
  "metaMes": 1000,
  "dailyProduction": [
    {"programado": 50, "realizado": 45},
    {"programado": 50, "realizado": 48}
  ]
}
```

### `PUT /api/production/:id`
Atualiza um registro existente.

**Autenticação:** Requerida  
**Permissões:** ADMIN, SUPERVISOR, LIDER_PRODUCAO

### `DELETE /api/production/:id`
Remove um registro.

**Autenticação:** Requerida  
**Permissões:** ADMIN, SUPERVISOR, LIDER_PRODUCAO

## Regras de Negócio

### Cálculo de Velocidade
```javascript
velocidade = (totalRealizado / totalProgramado) * 100
```

### Validações
- `mesAno`: Formato MM/YYYY
- `metaMes`: Número positivo
- `dailyProduction`: Array com até 31 elementos
- `sector`: Deve ser um setor válido (enum)

### Campos Calculados
- `totalProgramado`: Soma de todos os `dailyProduction[].programado`
- `totalRealizado`: Soma de todos os `dailyProduction[].realizado`
- `velocidade`: Percentual calculado automaticamente

## Exemplos de Uso

### Criar Registro de Produção
```javascript
const response = await fetch('/api/production', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    mesAno: '01/2024',
    sector: 'CONFEITARIA',
    produto: 'Bolo de Chocolate',
    metaMes: 1000,
    dailyProduction: [
      {programado: 50, realizado: 45},
      {programado: 50, realizado: 48}
    ]
  })
});
```

### Atualizar Produção Diária
```javascript
// Buscar registro existente
const record = await fetch(`/api/production/${id}`);
const data = await record.json();

// Atualizar dia específico
data.dailyProduction[5] = {programado: 60, realizado: 58};

// Salvar
await fetch(`/api/production/${id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

## Validação de Dados

O módulo usa Zod para validação rigorosa:

```javascript
const productionSchema = z.object({
  mesAno: z.string().regex(/^\d{2}\/\d{4}$/),
  sector: z.enum(['CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'EMBALADORA']),
  produto: z.string().min(1),
  metaMes: z.number().positive(),
  dailyProduction: z.array(z.object({
    programado: z.number().nonnegative(),
    realizado: z.number().nonnegative()
  })).max(31)
});
```

## Erros Comuns

### 400 - Dados Inválidos
```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "field": "mesAno",
      "message": "Formato inválido. Use MM/YYYY"
    }
  ]
}
```

### 403 - Permissão Negada
```json
{
  "error": "Acesso negado. Roles permitidas: ADMIN, SUPERVISOR, LIDER_PRODUCAO"
}
```

### 404 - Registro Não Encontrado
```json
{
  "error": "Registro de produção não encontrado"
}
```

## Relacionamentos

- **Setor:** Referência ao enum `Sector`
- **Produto:** String livre (não há FK para tabela de produtos)

## Performance

- Índices criados em: `mesAno`, `sector`
- Paginação disponível via query params `?page=1&limit=50`
- Cache de 5 minutos para listagens

## Testes

```bash
# Rodar testes do módulo
npm test -- production

# Com coverage
npm run test:coverage -- production
```

## Logs

Todos os eventos são logados:
- Criação de registros
- Atualizações
- Deleções
- Erros de validação

Localização: `logs/production.log`
