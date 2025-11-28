import React from 'react';
import type { Page } from '../../types';
import { Menu, User, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentPage: Page;
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, toggleSidebar, isDarkMode, toggleTheme }) => {
  return (
    <header className="bg-imac-background/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="md:hidden mr-4 text-slate-600 dark:text-slate-300 hover:text-imac-tertiary dark:hover:text-imac-primary">
          <Menu size={24} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-imac-tertiary dark:text-imac-primary tracking-tight">{currentPage === 'Dashboard' ? 'Visão Geral' : currentPage}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Alternar tema"
        >
            {isDarkMode ? <Sun size={20} className="text-imac-highlight" /> : <Moon size={20} />}
        </button>
        <div className="w-10 h-10 bg-imac-secondary rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-700">
            <User size={20} className="text-imac-tertiary" />
        </div>
      </div>
    </header>
  );
};

export default Header;