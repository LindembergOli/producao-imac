# Componentes Reutilizáveis

## Visão Geral

Biblioteca de componentes React reutilizáveis do sistema IMAC Congelados. Todos os componentes seguem padrões de design consistentes e são totalmente tipados com TypeScript.

## Estrutura

```
components/
├── layout/
│   ├── Header.tsx       # Cabeçalho da aplicação
│   └── Sidebar.tsx      # Menu lateral de navegação
├── ChartContainer.tsx   # Container para gráficos
├── DatePickerInput.tsx  # Seletor de data customizado
├── KpiCard.tsx          # Card de KPI/métrica
├── Modal.tsx            # Modal genérico
└── PrivateRoute.tsx     # Proteção de rotas
```

## Componentes Disponíveis

### DatePickerInput

Seletor de data customizado com suporte para seleção de mês ou dia.

**Props:**
```typescript
interface DatePickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'date' | 'month';  // Padrão: 'date'
  className?: string;
}
```

**Uso:**
```tsx
// Seleção de data completa
<DatePickerInput
  label="Data do Erro"
  value={formData.date}
  onChange={(date) => setFormData({...formData, date})}
  type="date"
/>

// Seleção apenas de mês
<DatePickerInput
  label="Mês/Ano"
  value={filterMonth}
  onChange={setFilterMonth}
  type="month"
/>
```

**Características:**
- ✅ Calendário visual interativo
- ✅ Navegação entre meses/anos
- ✅ Botão "Limpar" para resetar
- ✅ Formato automático (YYYY-MM-DD ou YYYY-MM)
- ✅ Localização em português

### KpiCard

Card para exibir métricas e KPIs.

**Props:**
```typescript
interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}
```

**Uso:**
```tsx
<KpiCard
  title="Total de Erros"
  value={totalErrors}
  icon={<AlertTriangle className="w-6 h-6" />}
  trend={{
    value: -12.5,
    isPositive: true  // Redução de erros é positivo
  }}
  onClick={() => setCurrentPage('Erros')}
/>
```

### Modal

Modal genérico reutilizável.

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

**Uso:**
```tsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Adicionar Produto"
  size="md"
>
  <ProductForm onSubmit={handleSubmit} />
</Modal>
```

### ChartContainer

Container padronizado para gráficos Recharts.

**Props:**
```typescript
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  height?: number;
}
```

**Uso:**
```tsx
<ChartContainer
  title="Velocidade de Produção"
  height={300}
  actions={
    <button onClick={exportData}>
      Exportar
    </button>
  }
>
  <BarChart data={productionData}>
    {/* ... */}
  </BarChart>
</ChartContainer>
```

### Header

Cabeçalho da aplicação com informações do usuário.

**Props:**
```typescript
interface HeaderProps {
  onMenuClick: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}
```

### Sidebar

Menu lateral de navegação.

**Props:**
```typescript
interface SidebarProps {
  isOpen: boolean;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onClose: () => void;
  isAdmin: boolean;
}
```

## Padrões de Design

### Cores

Todos os componentes usam a paleta de cores do sistema:

```css
--imac-primary: #f59e0b    /* Amarelo/Dourado */
--imac-primary-dark: #d97706
--imac-primary-light: #fbbf24
```

### Tipografia

```css
font-family: 'Inter', sans-serif
```

### Espaçamento

Seguimos escala do Tailwind:
- `p-2` = 0.5rem (8px)
- `p-4` = 1rem (16px)
- `p-6` = 1.5rem (24px)
- `p-8` = 2rem (32px)

### Responsividade

Todos os componentes são responsivos:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Acessibilidade

✅ Todos os componentes seguem WCAG 2.1:
- Labels descritivos
- Contraste adequado
- Navegação por teclado
- ARIA attributes quando necessário

## Testes

```bash
# Rodar testes de componentes
npm test -- components

# Com coverage
npm run test:coverage -- components
```

## Exemplos Completos

### Formulário com DatePicker e Modal

```tsx
function ErrorForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    description: ''
  });

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Novo Erro
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Registrar Erro"
      >
        <form onSubmit={handleSubmit}>
          <DatePickerInput
            label="Data do Erro"
            value={formData.date}
            onChange={(date) => 
              setFormData({...formData, date})
            }
          />
          
          <textarea
            value={formData.description}
            onChange={(e) => 
              setFormData({...formData, description: e.target.value})
            }
          />
          
          <button type="submit">Salvar</button>
        </form>
      </Modal>
    </>
  );
}
```

### Dashboard com KPIs

```tsx
function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Produção Hoje"
        value="1,234 un"
        icon={<Package />}
        trend={{value: 5.2, isPositive: true}}
      />
      
      <KpiCard
        title="Erros do Mês"
        value={totalErrors}
        icon={<AlertTriangle />}
        trend={{value: -8.3, isPositive: true}}
      />
      
      {/* ... mais KPIs */}
    </div>
  );
}
```

## Contribuindo

Ao criar novos componentes:

1. ✅ Adicione TypeScript types
2. ✅ Documente props com comentários
3. ✅ Siga padrões de cores/espaçamento
4. ✅ Torne responsivo
5. ✅ Adicione testes
6. ✅ Atualize este README
