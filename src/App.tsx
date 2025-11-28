
import React, { useState, useEffect } from 'react';
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
import Machines from './pages/Machines';
import type { Page, Employee, Product, Machine, ProductionSpeedRecord, LossRecord, ErrorRecord, MaintenanceRecord, AbsenteeismRecord } from './types';
import { loadFromStorage, saveToStorage } from './services/storage';
import {
  mockEmployees,
  mockProducts,
  mockMachines,
  mockSpeedRecords,
  mockLossRecords,
  mockErrorRecords,
  mockMaintenanceRecords,
  mockAbsenteeismRecords
} from './data/mockData';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Dark mode state
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

  // Initialize states with LocalStorage data or Mock data
  const [employees, setEmployees] = useState<Employee[]>(() =>
    loadFromStorage({ key: 'imac_employees', defaultValue: mockEmployees })
  );
  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage({ key: 'imac_products', defaultValue: mockProducts })
  );
  const [machines, setMachines] = useState<Machine[]>(() =>
    loadFromStorage({ key: 'imac_machines', defaultValue: mockMachines })
  );

  // States for production records
  const [speedRecords, setSpeedRecords] = useState<ProductionSpeedRecord[]>(() =>
    loadFromStorage({ key: 'imac_speedRecords', defaultValue: mockSpeedRecords })
  );
  const [lossRecords, setLossRecords] = useState<LossRecord[]>(() =>
    loadFromStorage({ key: 'imac_lossRecords', defaultValue: mockLossRecords })
  );
  const [errorRecords, setErrorRecords] = useState<ErrorRecord[]>(() =>
    loadFromStorage({ key: 'imac_errorRecords', defaultValue: mockErrorRecords })
  );
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() =>
    loadFromStorage({ key: 'imac_maintenanceRecords', defaultValue: mockMaintenanceRecords })
  );
  const [absenteeismRecords, setAbsenteeismRecords] = useState<AbsenteeismRecord[]>(() =>
    loadFromStorage({ key: 'imac_absenteeismRecords', defaultValue: mockAbsenteeismRecords })
  );

  // Effects to save data to LocalStorage whenever it changes
  useEffect(() => { saveToStorage('imac_employees', employees); }, [employees]);
  useEffect(() => { saveToStorage('imac_products', products); }, [products]);
  useEffect(() => { saveToStorage('imac_machines', machines); }, [machines]);

  useEffect(() => { saveToStorage('imac_speedRecords', speedRecords); }, [speedRecords]);
  useEffect(() => { saveToStorage('imac_lossRecords', lossRecords); }, [lossRecords]);
  useEffect(() => { saveToStorage('imac_errorRecords', errorRecords); }, [errorRecords]);
  useEffect(() => { saveToStorage('imac_maintenanceRecords', maintenanceRecords); }, [maintenanceRecords]);
  useEffect(() => { saveToStorage('imac_absenteeismRecords', absenteeismRecords); }, [absenteeismRecords]);

  const renderPage = () => {
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
        return <Maintenance machines={machines} records={maintenanceRecords} setRecords={setMaintenanceRecords} isDarkMode={isDarkMode} />;
      case 'Absenteísmo':
        return <Absenteeism employees={employees} records={absenteeismRecords} setRecords={setAbsenteeismRecords} isDarkMode={isDarkMode} />;
      case 'Funcionários':
        return <Employees employees={employees} setEmployees={setEmployees} />;
      case 'Produtos':
        return <Products products={products} setProducts={setProducts} />;
      case 'Máquinas':
        return <Machines machines={machines} setMachines={setMachines} />;
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
