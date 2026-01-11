
import { lazy } from 'react';

// Importa funções mapeadas pelo nome da Página (Português)
// Essa estrutura permite prefetch por chave
export const routeImports = {
    'Dashboard': () => import('./pages/Dashboard'),
    'Velocidade': () => import('./pages/ProductionSpeed'),
    'Perdas': () => import('./pages/Losses'),
    'Erros': () => import('./pages/Errors'),
    'Manutenção': () => import('./pages/Maintenance'),
    'Absenteísmo': () => import('./pages/Absenteeism'),
    'Funcionários': () => import('./pages/Employees'),
    'Produtos': () => import('./pages/Products'),
    'Insumos': () => import('./pages/Supplies'),
    'Máquinas': () => import('./pages/Machines'),
    'Usuários': () => import('./pages/Users'),
};

export type PageKey = keyof typeof routeImports;

// Componentes Lazy para uso no App
export const LazyRoutes = {
    Dashboard: lazy(routeImports['Dashboard']),
    ProductionSpeed: lazy(routeImports['Velocidade']),
    Losses: lazy(routeImports['Perdas']),
    Errors: lazy(routeImports['Erros']),
    Maintenance: lazy(routeImports['Manutenção']),
    Absenteeism: lazy(routeImports['Absenteísmo']),
    Employees: lazy(routeImports['Funcionários']),
    Products: lazy(routeImports['Produtos']),
    Supplies: lazy(routeImports['Insumos']),
    Machines: lazy(routeImports['Máquinas']),
    Users: lazy(routeImports['Usuários']),
};
