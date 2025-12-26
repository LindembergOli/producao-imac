import React from 'react';
import type { Page } from '../types';
import { LayoutDashboard, Activity, TrendingDown, TriangleAlert, Wrench, UserMinus, Users, Package, ShoppingBasket, Cpu, LucideIcon } from 'lucide-react';

export const PRODUCTION_PAGES: { name: Page; icon: LucideIcon }[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Velocidade', icon: Activity },
    { name: 'Perdas', icon: TrendingDown },
    { name: 'Erros', icon: TriangleAlert },
    { name: 'Manutenção', icon: Wrench },
    { name: 'Absenteísmo', icon: UserMinus },
];

export const REGISTRATION_PAGES: { name: Page; icon: LucideIcon }[] = [
    { name: 'Funcionários', icon: Users },
    { name: 'Produtos', icon: Package },
    { name: 'Insumos', icon: ShoppingBasket },
    { name: 'Máquinas', icon: Cpu },
];