

import React, { useState, useMemo } from 'react';
import { sanitizeFormInput } from '../utils/sanitize';
import { Plus, Users, Pencil, Trash2, FileSpreadsheet, FileText } from 'lucide-react';
import type { Employee } from '../types';
import { Sector } from '../types';
import Modal, { ConfirmModal } from '../components/Modal';

const EmployeeForm: React.FC<{
    employee: Partial<Employee> | null;
    onSave: (employee: Omit<Employee, 'id'>) => void;
    onCancel: () => void;
}> = ({ employee, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: employee?.name || '',
        sector: employee?.sector || '',
        role: employee?.role || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sector) {
            alert('Por favor, selecione um setor.');
            return;
        }
        onSave(formData as Omit<Employee, 'id'>);
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-imac-primary focus:ring-imac-primary sm:text-sm p-3 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
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
                    Nome Completo <span className="text-imac-error">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Ex: João da Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: sanitizeFormInput(e.target.value) })}
                    required
                    className={inputClass}
                />
            </div>
            <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo/Função</label>
                <input
                    type="text"
                    name="role"
                    id="role"
                    placeholder="Ex: Padeiro"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: sanitizeFormInput(e.target.value) })}
                    className={inputClass}
                />
            </div>
            <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={onCancel} className="bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 font-semibold transition-colors">
                    Cancelar
                </button>
                <button type="submit" className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold transition-opacity">
                    {employee && 'id' in employee ? 'Salvar Alterações' : 'Criar Funcionário'}
                </button>
            </div>
        </form>
    );
};

interface EmployeesProps {
    employees: Employee[];
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
}

const Employees: React.FC<EmployeesProps> = ({ employees, setEmployees }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const sortedEmployees = useMemo(() => {
        return [...employees].sort((a, b) => a.sector.localeCompare(b.sector));
    }, [employees]);

    const handleOpenModal = (employee?: Employee) => {
        setCurrentEmployee(employee || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentEmployee(null);
    };

    const handleSave = (employeeData: Omit<Employee, 'id'>) => {
        if (currentEmployee) {
            setEmployees(employees.map(emp => emp.id === currentEmployee.id ? { ...emp, ...employeeData } : emp));
        } else {
            setEmployees([...employees, { ...employeeData, id: Date.now() }]);
        }
        handleCloseModal();
    };

    const confirmDelete = () => {
        if (deleteId) {
            setEmployees(employees.filter(emp => emp.id !== deleteId));
            setDeleteId(null);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    const handleExportXLSX = () => {
        if (employees.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const XLSX = (window as any).XLSX;
        const dataToExport = employees.map(({ sector, name, role }) => ({
            Setor: sector,
            Nome: name,
            Cargo: role || '',
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Funcionarios");
        XLSX.writeFile(wb, "funcionarios.xlsx");
    };

    const handleExportPDF = () => {
        if (employees.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        doc.text("Relatório de Funcionários", 14, 16);
        (doc as any).autoTable({
            head: [['Setor', 'Nome', 'Cargo']],
            body: employees.map(emp => [
                emp.sector,
                emp.name,
                emp.role || '-'
            ]),
            startY: 20,
        });
        doc.save('funcionarios.pdf');
    };


    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary tracking-tight">Funcionários</h1>
                    <p className="text-md text-slate-500 dark:text-slate-400 mt-1">Gerencie a equipe da sua operação.</p>
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
                        Novo Funcionário
                    </button>
                </div>
            </header>

            <main className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md transition-colors">
                <h2 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary flex items-center mb-6">
                    <Users size={22} className="mr-3 text-imac-primary dark:text-imac-secondary" />
                    Lista de Funcionários
                </h2>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px] align-middle">
                        {/* Header - Estilo padronizado com Máquinas/Produtos */}
                        <div className="grid grid-cols-10 gap-4 px-4 py-3 bg-imac-secondary/20 dark:bg-slate-700/50 rounded-lg">
                            <div className="col-span-3 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Setor</div>
                            <div className="col-span-4 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Nome</div>
                            <div className="col-span-2 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Cargo</div>
                            <div className="col-span-1 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary text-right no-print">Ações</div>
                        </div>

                        {/* Body */}
                        <div className="mt-2">
                            {sortedEmployees.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <Users size={48} className="text-slate-200 dark:text-slate-600 mb-3" strokeWidth={1.5} />
                                        <p>Nenhum funcionário cadastrado</p>
                                    </div>
                                </div>
                            ) : (
                                sortedEmployees.map((emp) => (
                                    <div key={emp.id} className="grid grid-cols-10 gap-4 items-center px-4 py-4 border-b dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <div className="col-span-3 text-gray-600 dark:text-gray-300">{emp.sector}</div>
                                        <div className="col-span-4 font-medium text-gray-800 dark:text-gray-100">{emp.name}</div>
                                        <div className="col-span-2 text-gray-600 dark:text-gray-400">{emp.role || '-'}</div>
                                        <div className="col-span-1 flex justify-end items-center gap-2 no-print">
                                            <button type="button" onClick={() => handleOpenModal(emp)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" aria-label="Editar">
                                                <Pencil size={18} />
                                            </button>
                                            <button type="button" onClick={() => handleDeleteClick(emp.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" aria-label="Excluir">
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
                title={currentEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
            >
                <EmployeeForm
                    employee={currentEmployee}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Funcionário"
                message="Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita."
            />
        </div>
    );
};

export default Employees;
