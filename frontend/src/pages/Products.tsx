
import React, { useState, useMemo } from 'react';
import { sanitizeFormInput } from '../utils/sanitize';
import { Plus, Package, Pencil, Trash2, FileSpreadsheet, FileText } from 'lucide-react';
import type { Product } from '../types';
import { Sector, Unit, LossType, ErrorCategory, MaintenanceStatus, AbsenceType } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal, { ConfirmModal } from '../components/Modal';
import { productsService } from '../services/modules/products';
import { useAuth } from '../contexts/AuthContext';
import ViewModal from '../components/ViewModal';
import { Eye } from 'lucide-react';
import { formatText } from '../utils/formatters';

interface ProductsProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

/**
 * Formulário de Cadastro/Edição de Produtos
 * 
 * Gerencia os dados do produto, incluindo custos, rendimento e informações fiscais/logísticas.
 */
const ProductForm: React.FC<{
    product: Partial<Product> | null;
    onSave: (product: Omit<Product, 'id'>) => void;
    onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
    // ... corpo do componente
    const [formData, setFormData] = useState<{
        name: string;
        sector: Sector | '';
        unit: Unit | '';
        yield?: number;
        unitCost?: number;
        notes?: string;
    }>({
        name: product?.name || '',
        sector: product?.sector || '',
        unit: product?.unit || Unit.KG,
        yield: product?.yield,
        unitCost: product?.unitCost,
        notes: product?.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.sector || !formData.unit) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        onSave(formData as Omit<Product, 'id'>);
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
                        Nome do Produto <span className="text-imac-error">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Ex: Pão Francês"
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
                <div>
                    <label htmlFor="yield" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rendimento</label>
                    <input
                        type="number"
                        name="yield"
                        id="yield"
                        value={formData.yield || ''}
                        onFocus={e => e.target.select()}
                        onChange={(e) => setFormData({ ...formData, yield: e.target.value ? Number(e.target.value) : undefined })}
                        className={inputClass}
                    />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custo por Receita (R$)</label>
                    <input
                        type="number"
                        step="0.01"
                        name="unitCost"
                        id="unitCost"
                        value={formData.unitCost || ''}
                        onFocus={e => e.target.select()}
                        onChange={(e) => setFormData({ ...formData, unitCost: e.target.value ? Number(e.target.value) : undefined })}
                        className={inputClass}
                    />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                    <textarea
                        name="notes"
                        id="notes"
                        rows={4}
                        placeholder="Informações adicionais sobre o produto"
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
                    {product && 'id' in product ? 'Salvar' : 'Criar'}
                </button>
            </div>
        </form>
    );
};

/**
 * Página de Gerenciamento de Produtos
 * 
 * Lista o catálogo de produtos, permitindo filtrar por setor e nome.
 * Inclui funcionalidades de exportação (Excel/PDF) e CRUD completo.
 */
const Products: React.FC<ProductsProps> = ({ products, setProducts }) => {
    const { isEspectador } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Estados para visualização
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState<Product | null>(null);

    // Estado dos filtros
    const [filters, setFilters] = useState({
        sector: '',
        name: ''
    });

    // Filtra e ordena produtos baseado nos critérios selecionados
    const filteredAndSortedProducts = useMemo(() => {
        if (!products || !Array.isArray(products)) return [];

        let filtered = [...products];

        // Aplicar filtros
        if (filters.sector) {
            filtered = filtered.filter(p => p.sector === filters.sector);
        }
        if (filters.name) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(filters.name.toLowerCase())
            );
        }

        return filtered.sort((a, b) => a.sector.localeCompare(b.sector));
    }, [products, filters]);

    const clearFilters = () => {
        setFilters({ sector: '', name: '' });
    };

    const handleOpenModal = (product?: Product) => {
        setCurrentProduct(product || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
    };

    const handleView = (product: Product) => {
        setViewData(product);
        setIsViewModalOpen(true);
    };

    const handleSave = async (productData: Omit<Product, 'id'>) => {
        const currentProducts = Array.isArray(products) ? products : [];
        try {
            // Converter campos de texto para maiúsculas
            const normalizedData = {
                ...productData,
                name: productData.name.toUpperCase()
            };

            if (currentProduct) {
                const updated = await productsService.update(currentProduct.id, normalizedData);
                setProducts(currentProducts.map(p => p.id === currentProduct.id ? updated : p));
            } else {
                const created = await productsService.create(normalizedData);
                setProducts([...currentProducts, created]);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar produto.');
        }
    };

    const confirmDelete = async () => {
        if (!Array.isArray(products)) return;
        if (deleteId) {
            try {
                await productsService.delete(deleteId);
                setProducts(products.filter(p => p.id !== deleteId));
                setDeleteId(null);
            } catch (error) {
                console.error('Erro ao deletar produto:', error);
                alert('Erro ao deletar produto.');
            }
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    const handleExportXLSX = () => {
        if (!Array.isArray(products) || products.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // const XLSX = (window as any).XLSX; // Removido
        const dataToExport = products.map(({ sector, name, unit, yield: rendimento, unitCost, notes }) => ({
            Setor: sector,
            Nome: name,
            Unidade: unit,
            Rendimento: rendimento || '',
            'Custo por Receita (R$)': unitCost || 0,
            'Observacoes': notes || ''
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Produtos");
        XLSX.writeFile(wb, "produtos.xlsx");
    };

    const handleExportPDF = () => {
        if (products.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // const { jsPDF } = (window as any).jspdf; // Removido
        const doc = new jsPDF();
        doc.text("Relatório de Produtos", 14, 16);
        autoTable(doc, {
            head: [['Setor', 'Nome', 'Unidade', 'Rendimento', 'Custo por Receita']],
            body: products.map(prod => [
                prod.sector,
                prod.name,
                prod.unit,
                prod.yield || '-',
                prod.unitCost ? prod.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
            ]),
            startY: 20,
        });
        doc.save('produtos.pdf');
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary">Produtos</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os produtos da sua linha de produção</p>
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
                        Novo Produto
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
                    Lista de Produtos ({filteredAndSortedProducts.length})
                </h2>

                <div className="overflow-x-auto">
                    <div className="min-w-[1000px] align-middle">
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-imac-secondary/20 dark:bg-slate-700/50 rounded-lg">
                            <div className="col-span-3 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Setor</div>
                            <div className="col-span-3 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Nome</div>
                            <div className="col-span-1 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Unidade</div>
                            <div className="col-span-2 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Rendimento</div>
                            <div className="col-span-2 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary">Custo por Receita</div>
                            <div className="col-span-1 text-sm font-semibold text-imac-tertiary dark:text-imac-secondary text-center no-print">Ações</div>
                        </div>
                        {/* Body */}
                        <div className="mt-2">
                            {filteredAndSortedProducts.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <Package size={48} className="text-slate-200 dark:text-slate-600 mb-3" strokeWidth={1.5} />
                                        <p>{filters.sector || filters.name ? 'Nenhum produto encontrado com os filtros aplicados' : 'Nenhum produto cadastrado'}</p>
                                    </div>
                                </div>
                            ) : (
                                filteredAndSortedProducts.map((prod) => (
                                    <div key={prod.id} className="grid grid-cols-12 gap-4 items-center px-4 py-4 border-b dark:border-slate-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <div className="col-span-3 text-gray-600 dark:text-gray-300">{prod.sector}</div>
                                        <div className="col-span-3 font-medium text-gray-800 dark:text-gray-100">{prod.name}</div>
                                        <div className="col-span-1 text-gray-600 dark:text-gray-400">{prod.unit}</div>
                                        <div className="col-span-2 text-gray-600 dark:text-gray-400">{prod.yield || '-'}</div>
                                        <div className="col-span-2 text-gray-600 dark:text-gray-400">
                                            {prod.unitCost ? prod.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                        </div>
                                        <div className="col-span-1 flex justify-center items-center gap-2 no-print">
                                            <button type="button" onClick={() => handleView(prod)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors" aria-label="Visualizar" title="Visualizar">
                                                <Eye size={18} />
                                            </button>
                                            {!isEspectador() && (
                                                <>
                                                    <button type="button" onClick={() => handleOpenModal(prod)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" aria-label={`Editar ${prod.name} `} title="Editar">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteClick(prod.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" aria-label={`Excluir ${prod.name} `} title="Excluir">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
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
                title={currentProduct ? 'Editar Produto' : 'Novo Produto'}
            >
                <ProductForm
                    product={currentProduct}
                    onSave={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Produto"
                message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
            />

            <ViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detalhes do Produto"
                data={viewData}
                fields={[
                    { label: 'Setor', key: 'sector', format: (v: string) => formatText(v) },
                    { label: 'Nome', key: 'name' },
                    { label: 'Unidade', key: 'unit' },
                    { label: 'Rendimento', key: 'yield' },
                    { label: 'Custo por Receita', key: 'unitCost', format: (v) => v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-' },
                    { label: 'Observações', key: 'notes' }
                ]}
            />
        </div>
    );
};

export default Products;
