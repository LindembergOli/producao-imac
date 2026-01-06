import React, { useState, useMemo } from 'react';
import { Plus, Cpu, Pencil, Trash2, FileSpreadsheet, FileText, Eye } from 'lucide-react';
import { Machine, Sector, Unit, LossType, ErrorCategory, MaintenanceStatus, AbsenceType } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal, { ConfirmModal } from '../components/Modal';
import ViewModal from '../components/ViewModal';
import { useAuth } from '../contexts/AuthContext';
import { machinesService } from '../services/modules/machines';
import { formatText } from '../utils/formatters';

/**
 * Formulário de Cadastro/Edição de Máquinas
 * 
 * Permite cadastrar ou editar equipamentos.
 * Valida o preenchimento de campos obrigatórios (setor, nome, código).
 */
const MachineForm: React.FC<{
    machine: Partial<Machine> | null;
    onSave: (machine: Omit<Machine, 'id'>) => void;
    onCancel: () => void;
}> = ({ machine, onSave, onCancel }) => {
    // ... corpo do componente
    const [formData, setFormData] = useState({
        name: machine?.name || '',
        code: machine?.code || '',
        sector: machine?.sector || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sector) {
            alert('Por favor, selecione um setor.');
            return;
        }
        onSave(formData as Omit<Machine, 'id'>);
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-imac-primary focus:ring-imac-primary sm:text-sm p-3 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
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
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome do Equipamento <span className="text-imac-error">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Ex: Forno Industrial 01"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Código <span className="text-imac-error">*</span>
                </label>
                <input
                    type="text"
                    name="code"
                    id="code"
                    placeholder="Ex: FRN-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    className={inputClass}
                />
            </div>
            <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={onCancel} className="bg-transparent border border-imac-error text-imac-error px-4 py-2 rounded-lg hover:bg-imac-error/10 font-semibold transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold transition-opacity">
                    {machine && 'id' in machine ? 'Salvar' : 'Criar'}
                </button>
            </div>
        </form>
    );
};

interface MachinesProps {
    machines: Machine[];
    setMachines: React.Dispatch<React.SetStateAction<Machine[]>>;
}

/**
 * Página de Gerenciamento de Máquinas
 * 
 * Lista todas as máquinas da fábrica, permitindo filtragem por setor, nome e código.
 * Oferece funcionalidades de consulta, criação, edição e exclusão.
 */
const Machines: React.FC<MachinesProps> = ({ machines, setMachines }) => {
    const { user, canCreate, canEdit, canDelete, isEspectador } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMachine, setCurrentMachine] = useState<Machine | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Estados para visualização
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState<Machine | null>(null);

    // Estado dos filtros
    const [filters, setFilters] = useState({
        sector: '',
        name: '',
        code: ''
    });

    // Filtra lista de máquinas conforme critérios definidos
    const filteredAndSortedMachines = useMemo(() => {
        if (!machines || !Array.isArray(machines)) return [];

        let filtered = [...machines];

        // Aplicar filtros
        if (filters.sector) {
            filtered = filtered.filter(m => m.sector === filters.sector);
        }
        if (filters.name) {
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(filters.name.toLowerCase())
            );
        }
        if (filters.code) {
            filtered = filtered.filter(m =>
                m.code.toLowerCase().includes(filters.code.toLowerCase())
            );
        }

        return filtered.sort((a, b) => a.sector.localeCompare(b.sector));
    }, [machines, filters]);

    const clearFilters = () => {
        setFilters({ sector: '', name: '', code: '' });
    };

    const handleOpenModal = (machine?: Machine) => {
        setCurrentMachine(machine || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentMachine(null);
    };

    const handleView = (machine: Machine) => {
        setViewData(machine);
        setIsViewModalOpen(true);
    };

    const handleSave = async (machineData: Omit<Machine, 'id'>) => {
        const currentMachines = Array.isArray(machines) ? machines : [];
        try {
            // Converter campos de texto para maiúsculas
            const normalizedData = {
                ...machineData,
                name: machineData.name.toUpperCase(),
                code: machineData.code.toUpperCase()
            };

            if (currentMachine) {
                const updated = await machinesService.update(currentMachine.id, normalizedData);
                setMachines(currentMachines.map(m => m.id === currentMachine.id ? updated : m));
            } else {
                const created = await machinesService.create(normalizedData);
                setMachines([...currentMachines, created]);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar máquina:', error);
            alert('Erro ao salvar máquina.');
        }
    };

    const confirmDelete = async () => {
        if (!Array.isArray(machines)) return;
        if (deleteId) {
            try {
                await machinesService.delete(deleteId);
                setMachines(machines.filter(m => m.id !== deleteId));
                setDeleteId(null);
            } catch (error) {
                console.error('Erro ao deletar máquina:', error);
                alert('Erro ao deletar máquina.');
            }
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    const handleExportXLSX = () => {
        if (!Array.isArray(machines) || machines.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // const XLSX = (window as any).XLSX; // Removido
        const dataToExport = machines.map(({ sector, name, code }) => ({
            Setor: sector,
            'Nome do Equipamento': name,
            'Código': code,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Maquinas");
        XLSX.writeFile(wb, "maquinas.xlsx");
    };

    const handleExportPDF = () => {
        if (machines.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // const { jsPDF } = (window as any).jspdf; // Removido
        const doc = new jsPDF();
        doc.text("Relatório de Máquinas", 14, 16);
        autoTable(doc, {
            head: [['Setor', 'Nome do Equipamento', 'Código']],
            body: machines.map(mac => [
                mac.sector,
                mac.name,
                mac.code
            ]),
            startY: 20,
        });
        doc.save('maquinas.pdf');
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary">Máquinas</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os equipamentos da sua operação</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportXLSX} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-green-600 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition text-sm font-medium">
                        <FileSpreadsheet size={16} /> Exportar XLSX
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-red-600 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm font-medium">
                        <FileText size={16} /> Exportar PDF
                    </button>
                    {canCreate() && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center bg-imac-success text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm font-semibold"
                        >
                            <Plus size={20} className="mr-2" />
                            Nova Máquina
                        </button>
                    )}
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg shadow-md dark:shadow-lg border border-slate-200/30 dark:border-slate-600/30">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Name Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome do Equipamento
                        </label>
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={filters.name}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            className="w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        />
                    </div>

                    {/* Code Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Código
                        </label>
                        <input
                            type="text"
                            placeholder="Buscar por código..."
                            value={filters.code}
                            onChange={(e) => setFilters({ ...filters, code: e.target.value })}
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
                    <Cpu size={22} className="mr-3 text-imac-primary dark:text-imac-secondary" />
                    Lista de Máquinas ({filteredAndSortedMachines.length})
                </h2>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px] align-middle">
                        {/* Header */}
                        <div className="grid grid-cols-10 gap-4 px-4 py-3 bg-imac-secondary/20 dark:bg-slate-700/50 rounded-lg">
                            <div className="col-span-3 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Setor</div>
                            <div className="col-span-4 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Nome do Equipamento</div>
                            <div className="col-span-2 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Código</div>
                            <div className="col-span-1 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary text-center no-print">Ações</div>
                        </div>

                        {/* Body */}
                        <div className="mt-2">
                            {filteredAndSortedMachines.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <Cpu size={48} className="text-slate-200 dark:text-slate-600 mb-3" strokeWidth={1.5} />
                                        <p>{filters.sector || filters.name || filters.code ? 'Nenhuma máquina encontrada com os filtros aplicados' : 'Nenhuma máquina cadastrada'}</p>
                                    </div>
                                </div>
                            ) : (
                                filteredAndSortedMachines.map((mac) => (
                                    <div key={mac.id} className="grid grid-cols-10 gap-4 items-center px-4 py-4 border-b dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <div className="col-span-3 text-gray-600 dark:text-gray-300">{mac.sector}</div>
                                        <div className="col-span-4 font-medium text-gray-800 dark:text-gray-100">{mac.name}</div>
                                        <div className="col-span-2 text-gray-600 dark:text-gray-300">{mac.code}</div>
                                        <div className="col-span-1 flex justify-center items-center gap-2 no-print">
                                            <button type="button" onClick={() => handleView(mac)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors" aria-label="Visualizar" title="Visualizar">
                                                <Eye size={18} />
                                            </button>
                                            {canEdit() && (
                                                <button type="button" onClick={() => handleOpenModal(mac)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" aria-label={`Editar ${mac.name}`} title="Editar">
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                            {canDelete() && (
                                                <button type="button" onClick={() => handleDeleteClick(mac.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" aria-label={`Excluir ${mac.name}`} title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
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
                title={currentMachine ? 'Editar Máquina' : 'Nova Máquina'}
            >
                <MachineForm
                    machine={currentMachine}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Máquina"
                message="Tem certeza que deseja excluir esta máquina? Esta ação não pode ser desfeita."
            />

            <ViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detalhes da Máquina"
                data={viewData}
                fields={[
                    { label: 'Setor', key: 'sector', format: (v: string) => formatText(v) },
                    { label: 'Nome do Equipamento', key: 'name' },
                    { label: 'Código', key: 'code' }
                ]}
            />
        </div>
    );
};

export default Machines;
