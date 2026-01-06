import React from 'react';
import { X, TriangleAlert } from 'lucide-react';

/**
 * Propriedades do Modal genérico.
 */
interface ModalProps {
  /** Define se o modal está visível */
  isOpen: boolean;
  /** Função chamada ao fechar o modal */
  onClose: () => void;
  /** Título do modal */
  title: string;
  /** Conteúdo interno do modal */
  children: React.ReactNode;
}

/**
 * Componente Modal Genérico
 * 
 * Container flexível para exibir conteúdo sobreposto à tela.
 * Inclui animação de entrada e backdrop escurecido.
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
          <h3 className="text-xl font-semibold text-imac-tertiary dark:text-imac-primary">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto text-slate-800 dark:text-slate-200">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

/**
 * Propriedades do Modal de Confirmação.
 */
interface ConfirmModalProps {
  /** Define se o modal está visível */
  isOpen: boolean;
  /** Função chamada ao cancelar */
  onClose: () => void;
  /** Função chamada ao confirmar a ação */
  onConfirm: () => void;
  /** Título do modal */
  title: string;
  /** Mensagem de aviso/confirmação */
  message: string;
}

/**
 * Modal de Confirmação
 * 
 * Modal específico para solicitar confirmação do usuário antes de ações destrutivas.
 * Exibe um alerta visual e botões "Cancelar" e "Sim, Excluir".
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-[60] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <TriangleAlert className="text-red-600 dark:text-red-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 font-semibold shadow-md transition-colors"
          >
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;