# Módulo de Erros

## Visão Geral

Módulo responsável por registrar e rastrear erros ocorridos na produção, incluindo descrição, categoria, ação corretiva e custos associados.

## Estrutura

```
errors/
├── controller.js    # Handlers das rotas HTTP
├── service.js       # Lógica de negócio
├── validator.js     # Validação de dados com Zod
└── routes.js        # Definição de rotas
```

## Endpoints Disponíveis

### `GET /api/errors`
Retorna todos os registros de erros.

**Query Params:**
- `sector` (opcional): Filtrar por setor
- `category` (opcional): Filtrar por categoria
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)

**Exemplo:**
```
GET /api/errors?sector=CONFEITARIA&startDate=2024-01-01&endDate=2024-01-31
```

### `POST /api/errors`
Cria um novo registro de erro.

**Body:**
```json
{
  "date": "2024-01-15",
  "sector": "CONFEITARIA",
  "product": "Bolo de Chocolate",
  "description": "Massa queimada por temperatura incorreta",
  "action": "Ajustado termostato do forno",
  "category": "EQUIPAMENTO",
  "cost": 150.00,
  "wastedQty": 5.5
}
```

### `PUT /api/errors/:id`
Atualiza um registro existente.

### `DELETE /api/errors/:id`
Remove um registro.

## Categorias de Erros

### OPERACIONAL
Erros relacionados a processos ou operação humana.

**Exemplos:**
- Ingrediente errado adicionado
- Tempo de forno incorreto
- Processo não seguido corretamente

### EQUIPAMENTO
Falhas ou problemas com máquinas e equipamentos.

**Exemplos:**
- Forno com temperatura instável
- Batedeira com defeito
- Esteira parada

### MATERIAL
Problemas com matéria-prima ou insumos.

**Exemplos:**
- Farinha com qualidade ruim
- Ovos vencidos
- Embalagem danificada

### QUALIDADE
Não conformidades de qualidade do produto final.

**Exemplos:**
- Produto fora do padrão visual
- Sabor inadequado
- Textura incorreta

## Regras de Negócio

### Validações
- `date`: Formato YYYY-MM-DD, não pode ser futuro
- `cost`: Número positivo
- `wastedQty`: Número não-negativo (opcional)
- `description`: Mínimo 10 caracteres
- `category`: Deve ser uma das categorias válidas

### Campos Opcionais
- `action`: Ação corretiva (pode ser preenchida depois)
- `wastedQty`: Quantidade desperdiçada

### Cálculo de Custos
O custo total de erros por período é calculado somando todos os `cost` dos registros.

## Exemplos de Uso

### Registrar Erro Operacional
```javascript
await fetch('/api/errors', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    date: '2024-01-15',
    sector: 'PAES',
    product: 'Pão Francês',
    description: 'Fermentação excessiva por tempo incorreto',
    action: 'Revisado cronograma de fermentação',
    category: 'OPERACIONAL',
    cost: 80.00,
    wastedQty: 3.2
  })
});
```

### Buscar Erros por Categoria
```javascript
const response = await fetch(
  '/api/errors?category=EQUIPAMENTO&startDate=2024-01-01',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const errors = await response.json();
```

### Atualizar Ação Corretiva
```javascript
await fetch(`/api/errors/${id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'Forno substituído e calibrado'
  })
});
```

## Relatórios e Análises

### Custo Total por Categoria
```javascript
const errors = await fetch('/api/errors?startDate=2024-01-01&endDate=2024-01-31');
const data = await errors.json();

const costByCategory = data.reduce((acc, error) => {
  acc[error.category] = (acc[error.category] || 0) + error.cost;
  return acc;
}, {});
```

### Erros Mais Frequentes
```javascript
const errorsByProduct = data.reduce((acc, error) => {
  const key = `${error.product} - ${error.category}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
```

## Validação de Dados

```javascript
const errorSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sector: z.enum(['CONFEITARIA', 'PAES', 'SALGADO', 'PAO_DE_QUEIJO', 'EMBALADORA']),
  product: z.string().min(1),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  action: z.string().optional(),
  category: z.enum(['OPERACIONAL', 'EQUIPAMENTO', 'MATERIAL', 'QUALIDADE']),
  cost: z.number().positive(),
  wastedQty: z.number().nonnegative().optional()
});
```

## Permissões

| Ação | Roles Permitidas |
|------|------------------|
| Listar (GET) | Todos autenticados |
| Criar (POST) | ADMIN, SUPERVISOR, LIDER_PRODUCAO |
| Editar (PUT) | ADMIN, SUPERVISOR, LIDER_PRODUCAO |
| Deletar (DELETE) | ADMIN, SUPERVISOR, LIDER_PRODUCAO |

## Erros Comuns

### 400 - Descrição Muito Curta
```json
{
  "error": "Dados inválidos",
  "details": [{
    "field": "description",
    "message": "Descrição deve ter no mínimo 10 caracteres"
  }]
}
```

### 400 - Data Futura
```json
{
  "error": "Data não pode ser no futuro"
}
```

## Integração com Dashboard

Os dados deste módulo alimentam:
- Gráfico de custos por categoria
- Ranking de erros mais frequentes
- Tendência de erros ao longo do tempo
- Análise de eficácia de ações corretivas

## Logs

Eventos logados:
- Criação de registros de erro
- Atualizações (especialmente de ações corretivas)
- Deleções
- Buscas com filtros

Localização: `logs/errors.log`
