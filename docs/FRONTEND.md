# Documentação do Frontend

O frontend é uma SPA (Single Page Application) construída com React, Vite e Tailwind CSS.

---

## Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizáveis (UI, Layout)
│   ├── contexts/       # Contextos globais (Auth, Toast, Theme)
│   ├── hooks/          # Hooks customizados
│   ├── pages/          # Páginas da aplicação
│   ├── services/       # Integração com API
│   ├── types/          # Definições TypeScript
│   └── utils/          # Utilitários (formatters, validators)
```

---

## Componentes Principais

### KpiCard

Exibe indicadores-chave de desempenho com estilo diferenciado por modo.

**Props:**
```typescript
interface KpiCardProps {
  title: string;        // Título do indicador
  value: string;        // Valor principal
  unit?: string;        // Unidade de medida
  color: string;        // Cor do ícone (hex)
  icon: ReactNode;      // Ícone Lucide
}
```

**Estilos:**
- **Light Mode:** Fundo branco, sombras neutras, design limpo
- **Dark Mode:** Gradientes escuros, overlays coloridos, efeitos de glow

**Exemplo:**
```tsx
<KpiCard
  title="Velocidade de Produção"
  value="88,3"
  unit="%"
  color="#FFD700"
  icon={<TrendingUp />}
/>
```

### ChartContainer

Wrapper para gráficos Recharts com estilo consistente.

**Props:**
```typescript
interface ChartContainerProps {
  title: string;        // Título do gráfico
  children: ReactNode;  // Conteúdo (gráfico Recharts)
}
```

**Features:**
- Sombras pronunciadas (shadow-lg/2xl)
- Bordas com transparência
- Padding generoso
- Responsivo

**Exemplo:**
```tsx
<ChartContainer title="Produção Mensal">
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      {/* ... */}
    </BarChart>
  </ResponsiveContainer>
</ChartContainer>
```

### DatePickerInput

Input de data com suporte a mês/ano.

**Props:**
```typescript
interface DatePickerInputProps {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  type?: 'date' | 'month';  // Padrão: 'date'
}
```

### TimePickerInput

Input de hora no formato HH:MM.

**Props:**
```typescript
interface TimePickerInputProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  required?: boolean;
}
```

---

## Hooks Customizados

### `useAuth`

Gerencia a sessão do usuário e permissões.

```typescript
const {
  user,                 // Usuário atual
  login,                // Função de login
  logout,               // Função de logout
  isAuthenticated,      // Boolean de autenticação
  canCreate,            // Permissão de criar
  canEdit,              // Permissão de editar
  canDelete,            // Permissão de deletar
  isEspectador          // Se é apenas visualizador
} = useAuth();
```

**Níveis de Acesso:**
- `ADMIN`: Acesso total
- `SUPERVISOR`: Cadastros e relatórios
- `LIDER_PRODUCAO`: Criar/editar registros
- `ESPECTADOR`: Apenas visualização

### `useTheme`

Gerencia o tema (light/dark mode).

```typescript
const { isDarkMode, toggleTheme } = useTheme();
```

---

## Utilitários

### formatBrazilianNumber

Formata números no padrão brasileiro (vírgula para decimal, ponto para milhares).

```typescript
import { formatBrazilianNumber } from '../utils/formatters';

formatBrazilianNumber(1234.56, 2);  // "1.234,56"
formatBrazilianNumber(88.3, 1);     // "88,3"
formatBrazilianNumber(12500, 0);    // "12.500"
```

**Parâmetros:**
- `value: number` - Valor a formatar
- `decimals: number` - Casas decimais (padrão: 2)

**Retorno:** `string` - Número formatado

### Validação de Dados

Funções de validação disponíveis em `utils/validators.ts`:
- `validateEmail(email: string): boolean`
- `validateCPF(cpf: string): boolean`
- `validatePhone(phone: string): boolean`

---

## Serviços de API

Todos os serviços estendem um cliente HTTP base (`api.ts`) que gerencia:
- Base URL configurável
- Headers de Autenticação (Bearer Token)
- Refresh Token automático
- Tratamento de erros global
- Interceptors para logging

### Estrutura de Serviços

```
services/
├── api.ts              # Cliente HTTP base (Axios)
├── authService.ts      # Autenticação
└── modules/            # Serviços por módulo
    ├── employees.ts
    ├── products.ts
    ├── supplies.ts
    ├── machines.ts
    ├── production.ts
    ├── losses.ts
    ├── errors.ts
    ├── maintenance.ts
    └── absenteeism.ts
```

### Exemplo de Uso

```typescript
import { employeesService } from '../services/modules/employees';

// Listar todos
const employees = await employeesService.getAll();

// Criar novo
const newEmployee = await employeesService.create({
  name: 'João Silva',
  sector: 'PAES',
  role: 'Padeiro'
});

// Atualizar
const updated = await employeesService.update(id, data);

// Deletar
await employeesService.delete(id);
```

---

## Guia de Estilo Visual

Para padrões completos de design, cores, componentes e boas práticas, consulte:

📖 **[Guia de Estilo Visual Completo](../README.md#documentação-adicional)**

### Paleta de Cores Principais

```css
--imac-yellow: #FFD700;      /* Amarelo IMAC (primário) */
--imac-orange: #FFA500;      /* Laranja quente (secundário) */
--imac-bronze: #D99B61;      /* Bronze/Dourado (terciário) */
--imac-brown: #8B4513;       /* Marrom (acento) */
```

### Modo Claro vs Escuro

| Aspecto | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Filosofia** | Clareza e simplicidade | Conforto visual e modernidade |
| **Cards** | Branco, sombras neutras | Gradientes, overlays coloridos |
| **Texto** | Escuro sobre claro | Claro sobre escuro |
| **Efeitos** | Minimalistas | Premium (glow, shadows) |

---

## Páginas da Aplicação

| Página | Rota | Descrição |
|--------|------|-----------|
| **Login** | `/login` | Autenticação com design imersivo |
| **Dashboard** | `/` | Visão geral de KPIs e métricas |
| **Velocidade** | `/velocidade` | Acompanhamento de produção |
| **Perdas** | `/perdas` | Registro de perdas de materiais |
| **Erros** | `/erros` | Rastreamento de erros |
| **Manutenção** | `/manutencao` | Ordens de manutenção |
| **Absenteísmo** | `/absenteismo` | Controle de ausências |
| **Funcionários** | `/funcionarios` | Gestão de funcionários |
| **Produtos** | `/produtos` | Catálogo de produtos |
| **Insumos** | `/insumos` | Gestão de insumos |
| **Máquinas** | `/maquinas` | Gestão de equipamentos |
| **Usuários** | `/usuarios` | Administração (ADMIN) |

---

## Gráficos (Recharts)

### Configuração Padrão

```typescript
const chartConfig = {
  gridColor: isDarkMode ? '#334155' : '#E5E7EB',
  tickColor: isDarkMode ? '#9CA3AF' : '#6B7280',
  fontSize: 11,  // Padronizado em todos os gráficos
  tooltipStyle: {
    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
    border: `1px solid ${isDarkMode ? '#334155' : '#E5E7EB'}`,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
};
```

### Exemplo de Gráfico

```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
    <XAxis
      dataKey="name"
      tick={{ fill: tickColor, fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />
    <YAxis
      tick={{ fill: tickColor, fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />
    <Tooltip contentStyle={tooltipStyle} />
    <Legend wrapperStyle={{ fontSize: '11px' }} />
    <Bar dataKey="value" fill="#FFD700" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## Boas Práticas

### Código
- ✅ Componentes funcionais com TypeScript
- ✅ Hooks para lógica reutilizável
- ✅ Props tipadas com interfaces
- ✅ Comentários em português brasileiro
- ✅ useMemo/useCallback para otimização

### Estilo
- ✅ Tailwind CSS para estilização
- ✅ Classes utilitárias responsivas
- ✅ Dark mode com prefixo `dark:`
- ✅ Transições suaves (200-300ms)
- ✅ Sombras pronunciadas para profundidade

### Performance
- ✅ Code splitting por rota (React.lazy)
- ✅ Lazy loading de componentes pesados
- ✅ Memoização de cálculos pesados (useMemo)
- ✅ Memoização de componentes (React.memo)
- ✅ Dynamic imports para bibliotecas de exportação
- ✅ Debounce em inputs de busca
- ✅ Bundle inicial otimizado (250 KB)

#### Otimizações Implementadas (Fase 1)

**Code-Splitting:**
```typescript
// Todas as páginas são carregadas sob demanda
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProductionSpeed = React.lazy(() => import('./pages/ProductionSpeed'));
// ... outras páginas
```

**Dynamic Imports:**
```typescript
// Bibliotecas de exportação só são carregadas quando necessário
const XLSX = await import('xlsx');
const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
  import('jspdf'),
  import('jspdf-autotable')
]);
```

#### Otimizações Implementadas (Fase 2)

**Lazy Loading de Dados:**
- **Remoção de Requisições Globais**: O `App.tsx` não carrega mais todos os dados no login.
- **Login Otimizado**: Inicialmente, apenas dados compartilhados leves são carregados (Funcionários, Máquinas, Produtos).
- **Dados Sob Demanda**: Cada página carrega seus próprios registros pesados (`useEffect` local) apenas quando acessada.
- **Redução de Carga Inicial**: De 10 requisições simultâneas para 4 no login.
- **Loading States**: Feedback visual (spinners) em cada página durante o carregamento.

**Impacto:**
- **Tempo de Login**: Reduzido drasticamente (menos dados trafegados).
- **Interatividade**: Páginas carregam mais rápido individualmente.
- **Uso de Memória**: Menor consumo, pois dados não visitados não são carregados.
const handleExportXLSX = async () => {
  const XLSX = await import('xlsx');
  // ... lógica de exportação
};

const handleExportPDF = async () => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  // ... lógica de exportação
};
```

**Memoização de Componentes:**
```typescript
// Evita re-renderizações desnecessárias
export default React.memo(Losses);
export default React.memo(Errors);
```

**Métricas de Performance:**
- Bundle inicial: 250 KB (gzipped: 80 KB)
- XLSX library: 419 KB (carregado sob demanda)
- jsPDF + autoTable: 396 KB (carregado sob demanda)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 2.5s
- Redução total: 70% no bundle inicial

---

## Recursos Externos

- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Recharts:** https://recharts.org/
- **Lucide Icons:** https://lucide.dev/
- **Axios:** https://axios-http.com/
