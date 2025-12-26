
import React, { useState, useMemo } from 'react';
import { sanitizeFormInput } from '../utils/sanitize';
import { Plus, Package, Pencil, Trash2, FileSpreadsheet, FileText } from 'lucide-react';
import type { Supply } from '../types';
import { Sector, Unit } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal, { ConfirmModal } from '../components/Modal';
import { suppliesService } from '../services/modules/supplies';

interface SuppliesProps {
    supplies: Supply[];
    setSupplies: React.Dispatch<React.SetStateAction<Supply[]>>;
}

const SupplyForm: React.FC<{
    supply: Partial<Supply> | null;
    onSave: (supply: Omit<Supply, 'id'>) => void;
    onCancel: () => void;
}> = ({ supply, onSave, onCancel }) => {
    const [formData, setFormData] = useState<{
        name: string;
        sector: Sector | '';
        unit: Unit | '';
        unitCost: string;  // Mudado para string para evitar zero inicial
        notes?: string;
    }>({
        name: supply?.name || '',
        sector: supply?.sector || '',
        unit: supply?.unit || Unit.KG,
        unitCost: supply?.unitCost ? supply.unitCost.toFixed(2).replace('.', ',') : '',
        notes: supply?.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sector || !formData.unit || !formData.unitCost) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Converter unitCost de string para número (substituindo vírgula por ponto)
        const unitCostNumber = parseFloat(formData.unitCost.replace(',', '.'));

        if (isNaN(unitCostNumber) || unitCostNumber <= 0) {
            alert('Por favor, insira um custo válido maior que zero.');
            return;
        }

        onSave({
            ...formData,
            sector: formData.sector as Sector,
            unit: formData.unit as Unit,
            unitCost: unitCostNumber
        } as Omit<Supply, 'id'>);
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-imac-primary focus:ring-imac-primary sm:text-sm p-3 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                    <label htmlFor="sector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Setor <span className="text-imac-error">*</span>
                    </label>
                    <select
                        name="sector"
                        id="sector"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value as Sector })}
                        required
                        className={inputClass}
                    >
                        <option value="" disabled>Selecione o setor</option>
                        {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nome do Insumo <span className="text-imac-error">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Ex: Farinha de Trigo"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: sanitizeFormInput(e.target.value) })}
                        required
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Unidade <span className="text-imac-error">*</span>
                    </label>
                    <select
                        name="unit"
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value as Unit })}
                        required
                        className={inputClass}
                    >
                        {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custo por KG (R$) <span className="text-imac-error">*</span></label>
                    <input
                        type="text"
                        inputMode="decimal"
                        name="unitCost"
                        id="unitCost"
                        placeholder="Ex: 15,50 (custo de 1kg)"
                        value={formData.unitCost}
                        onFocus={e => e.target.select()}
                        onChange={(e) => {
                            let value = e.target.value;
                            // Permitir apenas números, vírgula e ponto
                            value = value.replace(/[^\d,\.]/g, '');
                            // Substituir ponto por vírgula
                            value = value.replace('.', ',');
                            // Limitar a 2 casas decimais após a vírgula
                            const parts = value.split(',');
                            if (parts.length > 1) {
                                const decimals = parts[1] || '';
                                parts[1] = decimals.substring(0, 2);
                                value = parts.join(',');
                            }
                            setFormData({ ...formData, unitCost: value });
                        }}
                        required
                        className={inputClass}
                    />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                    <textarea
                        name="notes"
                        id="notes"
                        rows={4}
                        placeholder="Informações adicionais sobre o insumo"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: sanitizeFormInput(e.target.value) })}
                        className={inputClass}
                    />
                </div>
            </div>
            <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={onCancel} className="bg-transparent border border-imac-error text-imac-error px-4 py-2 rounded-lg hover:bg-imac-error/10 font-semibold transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold transition-opacity">
                    {supply && 'id' in supply ? 'Salvar' : 'Criar'}
                </button>
            </div>
        </form>
    );
};

const Supplies: React.FC<SuppliesProps> = ({ supplies, setSupplies }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSupply, setCurrentSupply] = useState<Supply | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Estado dos filtros
    const [filters, setFilters] = useState({
        sector: '',
        name: ''
    });

    const filteredAndSortedSupplies = useMemo(() => {
        if (!supplies || !Array.isArray(supplies)) return [];

        let filtered = [...supplies];

        // Aplicar filtros
        if (filters.sector) {
            filtered = filtered.filter(s => s.sector === filters.sector);
        }
        if (filters.name) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(filters.name.toLowerCase())
            );
        }

        return filtered.sort((a, b) => a.sector.localeCompare(b.sector));
    }, [supplies, filters]);

    const clearFilters = () => {
        setFilters({ sector: '', name: '' });
    };

    const handleOpenModal = (supply?: Supply) => {
        setCurrentSupply(supply || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSupply(null);
    };

    const handleSave = async (supplyData: Omit<Supply, 'id'>) => {
        const currentSupplies = Array.isArray(supplies) ? supplies : [];
        try {
            // Converter campos de texto para maiúsculas
            const normalizedData = {
                ...supplyData,
                name: supplyData.name.toUpperCase()
            };

            if (currentSupply) {
                const updated = await suppliesService.update(currentSupply.id, normalizedData);
                setSupplies(currentSupplies.map(s => s.id === currentSupply.id ? updated : s));
            } else {
                const created = await suppliesService.create(normalizedData);
                setSupplies([...currentSupplies, created]);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar insumo:', error);
            alert('Erro ao salvar insumo.');
        }
    };

    const confirmDelete = async () => {
        if (!Array.isArray(supplies)) return;
        if (deleteId) {
            try {
                await suppliesService.delete(deleteId);
                setSupplies(supplies.filter(s => s.id !== deleteId));
                setDeleteId(null);
            } catch (error) {
                console.error('Erro ao deletar insumo:', error);
                alert('Erro ao deletar insumo.');
            }
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    const handleExportXLSX = () => {
        if (!Array.isArray(supplies) || supplies.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const dataToExport = supplies.map(({ sector, name, unit, unitCost, notes }) => ({
            Setor: sector,
            Nome: name,
            Unidade: unit,
            'Custo por KG (R$)': unitCost || 0,
            'Observacoes': notes || ''
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Insumos");
        XLSX.writeFile(wb, "insumos.xlsx");
    };

    const handleExportPDF = () => {
        if (supplies.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const doc = new jsPDF();
        doc.text("Relatório de Insumos", 14, 16);
        autoTable(doc, {
            head: [['Setor', 'Nome', 'Unidade', 'Custo por KG']],
            body: supplies.map(supply => [
                supply.sector,
                supply.name,
                supply.unit,
                supply.unitCost ? supply.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
            ]),
            startY: 20,
        });
        doc.save('insumos.pdf');
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary">Insumos</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os insumos (matérias-primas) da sua produção</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportXLSX} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-green-600 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition text-sm font-medium">
                        <FileSpreadsheet size={16} /> Exportar XLSX
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-red-600 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm font-medium">
                        <FileText size={16} /> Exportar PDF
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center bg-imac-success text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm font-semibold"
                    >
                        <Plus size={20} className="mr-2" />
                        Novo Insumo
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg shadow-md dark:shadow-lg border border-slate-200/30 dark:border-slate-600/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sector Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Setor
                        </label>
                        <select
                            value={filters.sector}
                            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                            className="w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        >
                            <option value="">Todos os setores</option>
                            {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Name Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome
                        </label>
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={filters.name}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            className="w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        />
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            <main className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md transition-colors">
                <h2 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary flex items-center mb-6">
                    <Package size={22} className="mr-3 text-imac-primary dark:text-imac-secondary" />
                    Lista de Insumos ({filteredAndSortedSupplies.length})
                </h2>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px] align-middle">
                        <div className="grid grid-cols-11 gap-4 px-4 py-3 bg-imac-secondary/20 dark:bg-slate-700/50 rounded-lg">
                            <div className="col-span-3 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Setor</div>
                            <div className="col-span-4 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Nome</div>
                            <div className="col-span-1 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Unidade</div>
                            <div className="col-span-2 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Custo por KG</div>
                            <div className="col-span-1 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary text-right no-print">Ações</div>
                        </div>
                        {/* Body */}
                        <div className="mt-2">
                            {filteredAndSortedSupplies.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <Package size={48} className="text-slate-200 dark:text-slate-600 mb-3" strokeWidth={1.5} />
                                        <p>{filters.sector || filters.name ? 'Nenhum insumo encontrado com os filtros aplicados' : 'Nenhum insumo cadastrado'}</p>
                                    </div>
                                </div>
                            ) : (
                                filteredAndSortedSupplies.map((supply) => (
                                    <div key={supply.id} className="grid grid-cols-11 gap-4 items-center px-4 py-4 border-b dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <div className="col-span-3 text-gray-600 dark:text-gray-300">{supply.sector}</div>
                                        <div className="col-span-4 font-medium text-gray-800 dark:text-gray-100">{supply.name}</div>
                                        <div className="col-span-1 text-gray-600 dark:text-gray-400">{supply.unit}</div>
                                        <div className="col-span-2 text-gray-600 dark:text-gray-400">
                                            {supply.unitCost ? supply.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                        </div>
                                        <div className="col-span-1 flex justify-end items-center gap-2 no-print">
                                            <button type="button" onClick={() => handleOpenModal(supply)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" aria-label={`Editar ${supply.name}`}>
                                                <Pencil size={18} />
                                            </button>
                                            <button type="button" onClick={() => handleDeleteClick(supply.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" aria-label={`Excluir ${supply.name}`}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentSupply ? 'Editar Insumo' : 'Novo Insumo'}
            >
                <SupplyForm
                    supply={currentSupply}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Insumo"
                message="Tem certeza que deseja excluir este insumo? Esta ação não pode ser desfeita."
            />
        </div>
    );
};

export default Supplies;
