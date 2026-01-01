import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import ProductionSpeed from './pages/ProductionSpeed';
import Losses from './pages/Losses';
import Errors from './pages/Errors';
import Maintenance from './pages/Maintenance';
import Absenteeism from './pages/Absenteeism';
import Employees from './pages/Employees';
import Products from './pages/Products';
import Supplies from './pages/Supplies';
import Machines from './pages/Machines';
import Users from './pages/Users';
import type { Page, Employee, Product, Supply, Machine, ProductionSpeedRecord, LossRecord, ErrorRecord, MaintenanceRecord, AbsenteeismRecord } from './types';

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

  // Estados dos dados (agora vazios inicialmente, populados via API)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [speedRecords, setSpeedRecords] = useState<ProductionSpeedRecord[]>([]);
  const [lossRecords, setLossRecords] = useState<LossRecord[]>([]);
  const [errorRecords, setErrorRecords] = useState<ErrorRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [absenteeismRecords, setAbsenteeismRecords] = useState<AbsenteeismRecord[]>([]);

  // Resetar para Dashboard quando fizer logout
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentPage('Dashboard');
    }
  }, [isAuthenticated]);

  // Carregar dados do backend quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    try {
      setDataLoading(true);
      const [
        emps, prods, supps, machs, speeds, losses, errors, maint, absent
      ] = await Promise.all([
        employeesService.getAll(),
        productsService.getAll(),
        suppliesService.getAll(),
        machinesService.getAll(),
        productionService.getAll(),
        lossesService.getAll(),
        errorsService.getAll(),
        maintenanceService.getAll(),
        absenteeismService.getAll()
      ]);


      setEmployees(emps);
      setProducts(prods);
      setSupplies(supps);
      setMachines(machs);
      setSpeedRecords(speeds);
      setLossRecords(losses);
      setErrorRecords(errors);
      setMaintenanceRecords(maint);
      setAbsenteeismRecords(absent);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Não alertamos erro fatal aqui para não bloquear o usuário, 
      // mas components individuais podem tentar recarregar ou mostrar erro
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
        return <Dashboard
          speedRecords={speedRecords}
          lossRecords={lossRecords}
          errorRecords={errorRecords}
          maintenanceRecords={maintenanceRecords}
          absenteeismRecords={absenteeismRecords}
          employees={employees}
          isDarkMode={isDarkMode}
        />;
      case 'Velocidade':
        return <ProductionSpeed products={products} records={speedRecords} setRecords={setSpeedRecords} isDarkMode={isDarkMode} />;
      case 'Perdas':
        return <Losses products={products} records={lossRecords} setRecords={setLossRecords} isDarkMode={isDarkMode} />;
      case 'Erros':
        return <Errors products={products} records={errorRecords} setRecords={setErrorRecords} isDarkMode={isDarkMode} />;
      case 'Manutenção':
        return <Maintenance machines={machines} employees={employees} records={maintenanceRecords} setRecords={setMaintenanceRecords} isDarkMode={isDarkMode} />;
      case 'Absenteísmo':
        return <Absenteeism employees={employees} records={absenteeismRecords} setRecords={setAbsenteeismRecords} isDarkMode={isDarkMode} />;
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
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
