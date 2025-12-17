import React from 'react';
import type { Page } from '../../types';
import { Menu, User, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  currentPage: Page;
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, toggleSidebar, isDarkMode, toggleTheme }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      await logout();
    }
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 transition-colors duration-300">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-imac-tertiary dark:hover:text-imac-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
            aria-label="Menu principal"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-imac-tertiary dark:text-imac-primary tracking-tight truncate">
            {currentPage === 'Dashboard' ? 'Visão Geral' : currentPage}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            aria-label="Alternar tema"
          >
            {isDarkMode ? <Sun size={20} className="text-imac-highlight" /> : <Moon size={20} />}
          </button>

          {/* Informações do usuário - Desktop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
              {user?.name || 'Usuário'}
            </span>
            <span className="text-xs px-2 py-0.5 bg-imac-primary/10 text-imac-primary rounded-full font-semibold">
              {user?.role || 'user'}
            </span>
          </div>

          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-imac-secondary to-imac-primary rounded-xl flex items-center justify-center ring-2 ring-white dark:ring-slate-700 shadow-sm">
            <User size={18} className="text-white" />
          </div>

          {/* Botão de Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
            aria-label="Sair do sistema"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;