# IMAC Congelados - Controle de Produção

Sistema de controle de produção, perdas e manutenção para a indústria IMAC Congelados.

## 🚀 Funcionalidades

- **Dashboard**: Visão geral dos KPIs de produção, perdas, erros e absenteísmo.
- **Controle de Produção**: Registro de velocidade e eficiência por setor.
- **Gestão de Perdas**: Monitoramento de perdas por quantidade e custo.
- **Manutenção**: Controle de ordens de serviço e paradas de máquina.
- **RH**: Gestão de absenteísmo e cadastro de funcionários.
- **Cadastros**: Produtos, Máquinas e Funcionários.
- **Relatórios**: Exportação de dados em Excel e PDF.

## 🛡️ Segurança e Tecnologia

Este projeto foi refatorado para atender a altos padrões de segurança e performance:

- **Armazenamento Local Seguro**: Dados salvos em `localStorage` com validação e versionamento (sem dependência de Firebase).
- **Sanitização de Dados**: Proteção contra XSS usando `DOMPurify` em todos os inputs.
- **Content Security Policy (CSP)**: Headers de segurança configurados.
- **Dependências Seguras**: Substituição de bibliotecas vulneráveis (`xlsx` -> `exceljs`).
- **TypeScript Strict**: Tipagem forte para maior confiabilidade.
- **Tailwind CSS Local**: Estilização performática sem dependência de CDNs externos.

## 🛠️ Instalação e Execução

### Pré-requisitos

- Node.js (v18 ou superior)

### Passo a Passo

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Rodar em desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Gerar build de produção:**
   ```bash
   npm run build
   ```

4. **Visualizar build de produção:**
   ```bash
   npm run preview
   ```

## 📂 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis (KpiCard, Modal, etc.)
├── data/           # Dados iniciais (mockData)
├── pages/          # Páginas da aplicação
├── services/       # Serviços (storage, export, validation)
├── utils/          # Utilitários (sanitize, constants)
├── types/          # Definições de tipos TypeScript
└── index.css       # Estilos globais e Tailwind
```

## 📝 Notas de Segurança

- **Dados**: Todos os dados são persistidos apenas no navegador do usuário. Limpar o cache do navegador apagará os dados.
- **Exportação**: Relatórios são gerados localmente no navegador.
