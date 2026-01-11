import React from 'react';
import { X, FileText } from 'lucide-react';

/**
 * Propriedades para configuração do Modal de Visualização.
 */
interface ViewModalProps {
    /** Define se o modal está visível */
    isOpen: boolean;
    /** Função chamada ao solicitar o fechamento do modal */
    onClose: () => void;
    /** Título exibido no cabeçalho do modal */
    title: string;
    /** Objeto contendo os dados a serem exibidos */
    data: Record<string, any> | null;
    /** Lista de campos para renderizar */
    fields: Array<{
        /** Rótulo visível do campo */
        label: string;
        /** Chave da propriedade no objeto 'data' */
        key: string;
        /** Função opcional para formatar o valor antes de exibir */
        format?: (val: any) => React.ReactNode | string
    }>;
}

/**
 * Modal de Visualização Genérico
 * 
 * Componente reutilizável para exibir detalhes de um registro em modo de leitura.
 * Renderiza os campos dinamicamente com base na prop 'fields'.
 */
const ViewModal: React.FC<ViewModalProps> = ({ isOpen, onClose, title, data, fields }) => {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">

                {/* Cabeçalho */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-imac-primary/10 rounded-lg">
                            <FileText className="text-imac-primary" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Corpo */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.map((field, index) => {
                            const value = data[field.key];
                            const formattedValue = field.format ? field.format(value) : (value ?? '-');

                            // Verifica se o valor é booleano para exibição
                            const displayValue = typeof formattedValue === 'boolean'
                                ? (formattedValue ? 'Sim' : 'Não')
                                : formattedValue;

                            return (
                                <div key={field.key} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-imac-primary/30 transition-colors">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                        {field.label}
                                    </label>
                                    <div className="text-gray-900 dark:text-gray-100 font-medium break-words">
                                        {displayValue}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rodapé */}
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewModal;
