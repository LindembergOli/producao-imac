import React from 'react';
import type { Page } from '../../types';
import { PRODUCTION_PAGES, REGISTRATION_PAGES } from '../../utils/constants';
import { X, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logoImg from '../../assets/logo.png';
import { routeImports, PageKey } from '../../routes';

const ImacLogo: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-orange-900/10 ring-1 ring-slate-100 dark:ring-slate-700 transition-colors">
      <img src={logoImg} alt="IMAC Logo" className="w-full h-full object-cover" />
    </div>
  );
};

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isSidebarOpen, setSidebarOpen }) => {
  const { canAccessCadastro, isAdmin } = useAuth();

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const prefetchPage = (pageName: Page) => {
    // Tenta carregar o código da página em background quando o usuário passa o mouse
    const loadFn = routeImports[pageName as PageKey];
    if (loadFn) {
      loadFn();
    }
  };

  const navLinkClasses = (page: Page) =>
    `group flex items-center px-4 py-3 my-1 mx-2 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 ease-out ${currentPage === page
      ? 'bg-gradient-to-r from-imac-primary to-imac-tertiary text-white shadow-lg shadow-imac-primary/30 scale-[1.02]'
      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-imac-tertiary dark:hover:text-imac-primary hover:shadow-sm hover:scale-[1.01]'
    }`;

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-3">
          <ImacLogo />
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">IMAC</h1>
            <p className="text-xs font-medium text-imac-tertiary dark:text-imac-secondary tracking-wide mt-0.5">CONGELADOS</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
          aria-label="Fechar menu"
        >
          <X size={22} />
        </button>
      </div>

      <div className="px-6 py-2">
        <hr className="border-t border-slate-200/60 dark:border-slate-700/60" />
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-4">Controle de Produção</h2>
          {PRODUCTION_PAGES.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => handleNavigation(name)}
              onMouseEnter={() => prefetchPage(name)}
              className={`w-full text-left ${navLinkClasses(name)}`}
            >
              <Icon size={20} className={`mr-3 transition-transform duration-200 ${currentPage === name ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="truncate">{name === 'Dashboard' ? 'Visão Geral' : name}</span>
            </button>
          ))}
        </div>

        {/* Seção Cadastro - Apenas para ADMIN e SUPERVISOR */}
        {canAccessCadastro() && (
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-4">Cadastro</h2>
            {REGISTRATION_PAGES.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => handleNavigation(name)}
                onMouseEnter={() => prefetchPage(name)}
                className={`w-full text-left ${navLinkClasses(name)}`}
              >
                <Icon size={20} className={`mr-3 transition-transform duration-200 ${currentPage === name ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="truncate">{name}</span>
              </button>
            ))}
          </div>
        )}


        {/* Seção Administração - Apenas para ADMIN */}
        {isAdmin() && (
          <div>
            <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-4 mt-4">Administração</h2>
            <button
              onClick={() => handleNavigation('Usuários')}
              onMouseEnter={() => prefetchPage('Usuários')}
              className={`w-full text-left ${navLinkClasses('Usuários')}`}
            >
              <Users size={20} className={`mr-3 transition-transform duration-200 ${currentPage === 'Usuários' ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="truncate">Usuários</span>
            </button>
          </div>
        )}
      </nav>

      <div className="p-4 m-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">Sistema de Gestão v1.0</p>
      </div>
    </>
  );

  return (
    <>
      {/* Barra Lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 bg-[#FAFAF9] dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
          md:translate-x-0 md:relative md:flex md:flex-col
          ${isSidebarOpen ? 'md:w-72' : 'md:w-0 md:border-none md:overflow-hidden'}
          shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]
        `}
      >
        <div className={`w-72 flex flex-col h-full ${!isSidebarOpen && 'md:hidden'}`}>
          {sidebarContent}
        </div>
      </aside>

      {/* Overlay para mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;