

import React, { useState, useMemo } from 'react';
import { sanitizeFormInput } from '../utils/sanitize';
import { Plus, Cpu, Pencil, Trash2, FileSpreadsheet, FileText } from 'lucide-react';
import type { Machine } from '../types';
import { Sector } from '../types';
import Modal, { ConfirmModal } from '../components/Modal';

const MachineForm: React.FC<{
    machine: Partial<Machine> | null;
    onSave: (machine: Omit<Machine, 'id'>) => void;
    onCancel: () => void;
}> = ({ machine, onSave, onCancel }) => {
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
                    {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
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
                    onChange={(e) => setFormData({ ...formData, name: sanitizeFormInput(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, code: sanitizeFormInput(e.target.value) })}
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

const Machines: React.FC<MachinesProps> = ({ machines, setMachines }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMachine, setCurrentMachine] = useState<Machine | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const sortedMachines = useMemo(() => {
        return [...machines].sort((a, b) => a.sector.localeCompare(b.sector));
    }, [machines]);

    const handleOpenModal = (machine?: Machine) => {
        setCurrentMachine(machine || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentMachine(null);
    };

    const handleSave = (machineData: Omit<Machine, 'id'>) => {
        if (currentMachine) {
            setMachines(machines.map(m => m.id === currentMachine.id ? { ...m, ...machineData } : m));
        } else {
            setMachines([...machines, { ...machineData, id: Date.now() }]);
        }
        handleCloseModal();
    };

    const confirmDelete = () => {
        if (deleteId) {
            setMachines(machines.filter(m => m.id !== deleteId));
            setDeleteId(null);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    const handleExportXLSX = () => {
        if (machines.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const XLSX = (window as any).XLSX;
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
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        doc.text("Relatório de Máquinas", 14, 16);
        (doc as any).autoTable({
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
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center bg-imac-success text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm font-semibold"
                    >
                        <Plus size={20} className="mr-2" />
                        Nova Máquina
                    </button>
                </div>
            </header>

            <main className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md transition-colors">
                <h2 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary flex items-center mb-6">
                    <Cpu size={22} className="mr-3 text-imac-primary dark:text-imac-secondary" />
                    Lista de Máquinas
                </h2>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px] align-middle">
                        {/* Header */}
                        <div className="grid grid-cols-10 gap-4 px-4 py-3 bg-imac-secondary/20 dark:bg-slate-700/50 rounded-lg">
                            <div className="col-span-3 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Setor</div>
                            <div className="col-span-4 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Nome do Equipamento</div>
                            <div className="col-span-2 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Código</div>
                            <div className="col-span-1 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary text-right no-print">Ações</div>
                        </div>

                        {/* Body */}
                        <div className="mt-2">
                            {sortedMachines.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    Nenhuma máquina cadastrada
                                </div>
                            ) : (
                                sortedMachines.map((mac) => (
                                    <div key={mac.id} className="grid grid-cols-10 gap-4 items-center px-4 py-4 border-b dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <div className="col-span-3 text-gray-600 dark:text-gray-300">{mac.sector}</div>
                                        <div className="col-span-4 font-medium text-gray-800 dark:text-gray-100">{mac.name}</div>
                                        <div className="col-span-2 text-gray-600 dark:text-gray-400">{mac.code}</div>
                                        <div className="col-span-1 flex justify-end items-center gap-2 no-print">
                                            <button type="button" onClick={() => handleOpenModal(mac)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" aria-label={`Editar ${mac.name}`}>
                                                <Pencil size={18} />
                                            </button>
                                            <button type="button" onClick={() => handleDeleteClick(mac.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" aria-label={`Excluir ${mac.name}`}>
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
        </div>
    );
};

export default Machines;
