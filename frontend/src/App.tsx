import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Code-splitting: Carregamento lazy de páginas para reduzir bundle inicial
// Cada página será carregada apenas quando necessária
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProductionSpeed = React.lazy(() => import('./pages/ProductionSpeed'));
const Losses = React.lazy(() => import('./pages/Losses'));
const Errors = React.lazy(() => import('./pages/Errors'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const Absenteeism = React.lazy(() => import('./pages/Absenteeism'));
const Employees = React.lazy(() => import('./pages/Employees'));
const Products = React.lazy(() => import('./pages/Products'));
const Supplies = React.lazy(() => import('./pages/Supplies'));
const Machines = React.lazy(() => import('./pages/Machines'));
const Users = React.lazy(() => import('./pages/Users'));
import type { Page, Employee, Product, Supply, Machine, ProductionSpeedRecord, ProductionObservationRecord, LossRecord, ErrorRecord, MaintenanceRecord, AbsenteeismRecord } from './types';

// Services
import { employeesService } from './services/modules/employees';
import { productsService } from './services/modules/products';
import { suppliesService } from './services/modules/supplies';
import { machinesService } from './services/modules/machines';
import { productionService } from './services/modules/production';
import { lossesService } from './services/modules/losses';
import { errorsService } from './services/modules/errors';
import { maintenanceService } from './services/modules/maintenance';
import { absenteeismService } from './services/modules/absenteeism';
import { productionObservationsService } from './services/modules/productionObservations';

const App: React.FC = () => {
  const { isAuthenticated, loading: authLoading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Estado do modo escuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Estados de dados compartilhados (usados por múltiplas páginas)
  // Carregados no login para evitar múltiplas requisições
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  // Resetar para Dashboard quando fizer logout
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentPage('Dashboard');
    }
  }, [isAuthenticated]);

  // Carregar apenas dados compartilhados quando autenticado
  // Dados específicos de páginas são carregados sob demanda
  useEffect(() => {
    if (isAuthenticated) {
      loadSharedData();
    }
  }, [isAuthenticated]);

  // Carrega apenas dados compartilhados entre páginas (4 requests vs 10 anteriormente)
  const loadSharedData = async () => {
    try {
      setDataLoading(true);
      const [emps, prods, supps, machs] = await Promise.all([
        employeesService.getAll(),
        productsService.getAll(),
        suppliesService.getAll(),
        machinesService.getAll()
      ]);

      setEmployees(emps);
      setProducts(prods);
      setSupplies(supps);
      setMachines(machs);
    } catch (error) {
      console.error('Erro ao carregar dados compartilhados:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Se estiver carregando autenticação, mostra spinner
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imac-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, mostra tela de Login
  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    if (dataLoading && employees.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imac-primary"></div>
          <span className="ml-4 text-slate-600 dark:text-slate-400">Carregando dados...</span>
        </div>
      );
    }

    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard employees={employees} isDarkMode={isDarkMode} />;
      case 'Velocidade':
        return <ProductionSpeed products={products} isDarkMode={isDarkMode} />;
      case 'Perdas':
        return <Losses products={products} isDarkMode={isDarkMode} />;
      case 'Erros':
        return <Errors products={products} isDarkMode={isDarkMode} />;
      case 'Manutenção':
        return <Maintenance machines={machines} employees={employees} isDarkMode={isDarkMode} />;
      case 'Absenteísmo':
        return <Absenteeism employees={employees} isDarkMode={isDarkMode} />;
      case 'Funcionários':
        return <Employees employees={employees} setEmployees={setEmployees} />;
      case 'Produtos':
        return <Products products={products} setProducts={setProducts} />;
      case 'Insumos':
        return <Supplies supplies={supplies} setSupplies={setSupplies} />;
      case 'Máquinas':
        return <Machines machines={machines} setMachines={setMachines} />;
      case 'Usuários':
        // Proteção extra: se não for admin, volta para o dashboard
        if (!isAdmin()) {
          setTimeout(() => setCurrentPage('Dashboard'), 0);
          return <Dashboard employees={employees} isDarkMode={isDarkMode} />;
        }
        return <Users />;
      default:
        return <Dashboard
          speedRecords={speedRecords}
          lossRecords={lossRecords}
          errorRecords={errorRecords}
          maintenanceRecords={maintenanceRecords}
          absenteeismRecords={absenteeismRecords}
          employees={employees}
          isDarkMode={isDarkMode}
        />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          currentPage={currentPage}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10">
          {/* Suspense: Mostra fallback enquanto código da página é carregado (code-splitting) */}
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imac-primary"></div>
                <span className="ml-4 text-slate-600 dark:text-slate-400">Carregando página...</span>
              </div>
            }
          >
            {renderPage()}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
