import React from 'react';
import type { Page } from '../../types';
import { PRODUCTION_PAGES, REGISTRATION_PAGES } from '../../utils/constants';
import { X } from 'lucide-react';

const ImacLogo: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-1 rounded-xl w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-orange-900/10 ring-1 ring-slate-100 dark:ring-slate-700 transition-colors">
      <svg viewBox="0 0 110 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dark brown color for text elements */}
        <g className="fill-[#3F2317] dark:fill-[#F3C78A]">
          {/* I */}
          <rect x="5" y="45" width="12" height="35" />
          {/* M */}
          <path d="M22 80 V45 h8 l5 18 l5 -18 h8 v35 h-7 V58 l-6 18 h-4 l-6 -18 v22 h-7 Z" />
          {/* A Block container */}
          <rect x="55" y="10" width="28" height="70" />
          {/* C */}
          <path d="M88 80 V45 h18 v7 h-11 v21 h11 v7 H88 Z" />
        </g>

        {/* Smiley Face (Yellow matches background) */}
        <circle cx="69" cy="28" r="9" className="fill-[#FFD700]" />
        <circle cx="66" cy="26" r="1.2" className="fill-[#3F2317]" />
        <circle cx="72" cy="26" r="1.2" className="fill-[#3F2317]" />
        <path d="M65 30 Q69 35 73 30" className="stroke-[#3F2317]" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* A Letter Cutout (Yellow matches background) */}
        <path d="M59 75 L69 48 L79 75 H73 L69 62 L65 75 H59 Z" className="fill-[#FFD700]" />
      </svg>
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
  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const navLinkClasses = (page: Page) =>
    `group flex items-center px-4 py-3 my-1.5 mx-2 rounded-xl cursor-pointer text-sm font-medium transition-all duration-300 ease-out ${currentPage === page
      ? 'bg-gradient-to-r from-imac-primary to-imac-tertiary text-white shadow-lg shadow-imac-primary/30 translate-x-1'
      : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-imac-tertiary dark:hover:text-imac-primary hover:shadow-sm hover:translate-x-1'
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
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-imac-error transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="px-6 py-2">
        <hr className="border-t border-slate-200/60 dark:border-slate-700/60" />
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-6">
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-4">Controle de Produção</h2>
          {PRODUCTION_PAGES.map(({ name, icon: Icon }) => (
            <a key={name} onClick={() => handleNavigation(name)} className={navLinkClasses(name)}>
              <Icon size={20} className={`mr-3 transition-transform duration-300 ${currentPage === name ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span>{name === 'Dashboard' ? 'Visão Geral' : name}</span>
            </a>
          ))}
        </div>
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-4">Cadastro</h2>
          {REGISTRATION_PAGES.map(({ name, icon: Icon }) => (
            <a key={name} onClick={() => handleNavigation(name)} className={navLinkClasses(name)}>
              <Icon size={20} className={`mr-3 transition-transform duration-300 ${currentPage === name ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span>{name}</span>
            </a>
          ))}
        </div>
      </nav>

      <div className="p-4 m-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">Sistema de Gestão v1.0</p>
      </div>
    </>
  );

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-[#FAFAF9] dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        {sidebarContent}
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}
    </>
  );
};

export default Sidebar;