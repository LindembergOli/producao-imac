import React, { useState, useMemo, useEffect } from 'react';
import type { LossRecord, Product, Supply } from '../types';
import { Sector, LossType, Unit } from '../types';
import { formatChartNumber, formatText } from '../utils/formatters';
// XLSX e jsPDF removidos - serão carregados dinamicamente apenas quando necessário
import { Plus, Pencil, Trash2, List, File, TrendingUp, TrendingDown, DollarSign, Package, Wheat, Layers, Filter, Eye, ChevronDown, Calendar } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { lossesService } from '../services/modules/losses';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line, ComposedChart, LabelList } from 'recharts';

import Modal, { ConfirmModal } from '../components/Modal';
import ViewModal from '../components/ViewModal';
import DatePickerInput from '../components/DatePickerInput';
import AutocompleteInput from '../components/AutocompleteInput';
import { useAuth } from '../contexts/AuthContext';
import { formatBrazilianNumber } from '../utils/formatters';
import { suppliesService } from '../services/modules/supplies';

const COLORS = {
    primary: '#D99B61',
    secondary: '#F3C78A',
    tertiary: '#B36B3C',
    error: '#E74C3C',
};

const LossRecordForm: React.FC<{
    record: Partial<LossRecord> | null;
    onSave: (record: Omit<LossRecord, 'id'>) => void;
    onCancel: () => void;
    products: Product[];
}> = ({ record, onSave, onCancel, products }) => {

    const [formData, setFormData] = useState<{
        date: string;
        sector: Sector | '';
        lossType: LossType | '';
        product: string;
        quantity: string;
        unit: Unit;
        unitCost: string;
    }>({
        date: (record?.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]) as string,
        sector: record?.sector || '',
        lossType: record?.lossType || '',
        product: record?.product || '',
        quantity: record?.quantity?.toString().replace('.', ',') || '',
        unit: record?.unit || Unit.KG,
        unitCost: record?.unitCost?.toString().replace('.', ',') || '',
    });
    const [totalCost, setTotalCost] = useState(record?.totalCost || 0);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [availableSupplies, setAvailableSupplies] = useState<Supply[]>([]);

    // Função auxiliar para normalizar strings
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    // Carregar produtos ou supplies baseado no setor e tipo de perda
    useEffect(() => {
        const loadItems = async () => {
            if (formData.sector) {
                // Se tipo de perda for INSUMO, carregar insumos
                if (formData.lossType === LossType.INSUMO) {
                    try {
                        const allSupplies = await suppliesService.getAll();
                        const filteredSupplies = allSupplies.filter(s => normalize(String(s.sector)) === normalize(String(formData.sector)));
                        setAvailableSupplies(filteredSupplies);
                        setAvailableProducts([]);
                    } catch (error) {
                        console.error('Erro ao carregar supplies:', error);
                        setAvailableSupplies([]);
                    }
                } else {
                    // Caso contrário, carregar produtos
                    const filteredProducts = products.filter(p => normalize(String(p.sector)) === normalize(String(formData.sector)));
                    setAvailableProducts(filteredProducts);
                    setAvailableSupplies([]);
                }

                // Resetar produto se mudou setor ou tipo
                if (record?.sector !== formData.sector || record?.lossType !== formData.lossType) {
                    setFormData(f => ({ ...f, product: '', unitCost: '', unit: Unit.KG }));
                }
            } else {
                setAvailableProducts([]);
                setAvailableSupplies([]);
            }
        };

        loadItems();
    }, [formData.sector, formData.lossType, record?.sector, record?.lossType, products]);

    useEffect(() => {
        const qty = parseFloat(String(formData.quantity).replace(',', '.') || '0');
        const cost = parseFloat(String(formData.unitCost).replace(',', '.') || '0');
        setTotalCost(qty * cost);
    }, [formData.quantity, formData.unitCost]);

    const handleProductChange = (productName: string) => {
        // Determinar se estamos lidando com produto ou supply
        const isSupply = formData.lossType === LossType.INSUMO;

        if (isSupply) {
            const selectedSupply = availableSupplies.find(s => s.name === productName);
            const unitCost = selectedSupply?.unitCost || 0;

            setFormData({
                ...formData,
                product: productName,
                unit: selectedSupply?.unit || Unit.KG,
                unitCost: unitCost > 0 ? unitCost.toFixed(4).replace('.', ',') : '',
            });
        } else {
            const selectedProduct = availableProducts.find(p => p.name === productName);
            let calculatedUnitCost = 0;

            // Lógica de cálculo: Custo da Receita / Rendimento
            if (selectedProduct) {
                const recipeCost = selectedProduct.unitCost || 0;
                const productYield = selectedProduct.yield && selectedProduct.yield > 0 ? selectedProduct.yield : 1;
                calculatedUnitCost = recipeCost / productYield;
            }

            setFormData({
                ...formData,
                product: productName,
                unit: selectedProduct?.unit || Unit.KG,
                unitCost: calculatedUnitCost > 0 ? calculatedUnitCost.toFixed(4).replace('.', ',') : '',
            });
        }
    };

    const handleSave = () => {
        if (!formData.sector || !formData.lossType) {
            alert('Preencha os campos obrigatórios');
            return;
        }
        const qty = parseFloat(formData.quantity.replace(',', '.') || '0');
        const uCost = parseFloat(formData.unitCost.replace(',', '.') || '0');
        const totalCost = qty * uCost;
        onSave({
            ...formData,
            sector: formData.sector as Sector,
            lossType: formData.lossType as LossType,
            date: (formData.date || new Date().toISOString().split('T')[0]) as string,
            quantity: qty,
            unitCost: uCost,
            totalCost
        });
    };

    const inputClass = "w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white";

    return (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Data</label><DatePickerInput value={formData.date || ''} onChange={date => setFormData({ ...formData, date })} /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Setor</label><select value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value as Sector })} className={inputClass} required><option value="">Selecione</option>{Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Perda *</label>
                    <select value={formData.lossType} onChange={e => setFormData({ ...formData, lossType: e.target.value as LossType })} className={inputClass}>
                        <option value="">Selecione</option>
                        {Object.values(LossType).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formData.lossType === LossType.INSUMO ? 'Nome do Insumo *' : 'Nome do Produto *'}
                    </label>
                    <AutocompleteInput
                        value={formData.product}
                        onChange={(value) => handleProductChange(value)}
                        options={formData.lossType === LossType.INSUMO
                            ? availableSupplies.map(s => ({ id: s.id, name: s.name }))
                            : availableProducts.map(p => ({ id: p.id, name: p.name }))
                        }
                        placeholder={
                            !formData.sector ? 'Selecione um setor primeiro' :
                                !formData.lossType ? 'Selecione o tipo de perda primeiro' :
                                    formData.lossType === LossType.INSUMO ? 'Digite o nome do insumo...' : 'Digite o nome do produto...'
                        }
                        disabled={!formData.sector || !formData.lossType}
                        emptyMessage={formData.lossType === LossType.INSUMO ? 'Nenhum insumo encontrado' : 'Nenhum produto encontrado'}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade *</label>
                    <input type="text" inputMode="decimal" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className={inputClass} placeholder="0,000" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidade *</label>
                    <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })} className={inputClass}>
                        {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custo Unit. (R$) *</label>
                    <input type="text" inputMode="decimal" value={formData.unitCost} onChange={e => setFormData({ ...formData, unitCost: e.target.value })} className={inputClass} placeholder="0,0000" />
                    <p className="text-xs text-gray-500 mt-1">Calculado: Custo Receita / Rendimento</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Custo Total (R$) - Calculado</label>
                    <input type="text" readOnly value={totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 p-2 font-semibold dark:text-white" />
                </div>
            </div>

            <div className="flex justify-end pt-6 gap-2">
                <button type="button" onClick={onCancel} className="bg-transparent border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold">Cancelar</button>
                <button type="submit" className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold">{record?.id ? 'Salvar' : 'Criar'}</button>
            </div>
        </form>
    );
};

interface LossesProps {
    products: Product[];
    isDarkMode: boolean;
}

const Losses: React.FC<LossesProps> = ({ products, isDarkMode }) => {
    // Estados locais para dados carregados sob demanda
    const [records, setRecords] = useState<LossRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<LossRecord | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Carregar dados ao montar o componente
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await lossesService.getAll();
                setRecords(data);
            } catch (error) {
                console.error('Erro ao carregar perdas:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Estados para visualização
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState<LossRecord | null>(null);

    // Novos estados para Accordion e Exclusão em Massa
    const [openAccordions, setOpenAccordions] = useState<string[]>([]);
    const [deleteMonthData, setDeleteMonthData] = useState<{ mesAno: string; recordIds: number[] } | null>(null);


    // Filtros para Visão Geral
    const [overviewFilters, setOverviewFilters] = useState({
        start: '',
        end: ''
    });

    // Filtros para Tabela
    const [tableFilters, setTableFilters] = useState({
        mesAno: '',
        sector: 'Todos',
        type: 'Todos'
    });

    const { canCreate, canEdit, canDelete, isEspectador } = useAuth();

    // Constantes de estilo de gráficos
    const gridColor = isDarkMode ? '#334155' : '#e5e7eb';
    const tickColor = isDarkMode ? '#9ca3af' : '#6b7280';
    const tooltipStyle = useMemo(() => ({
        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
        borderColor: isDarkMode ? '#334155' : '#fff',
        color: isDarkMode ? '#f1f5f9' : '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }), [isDarkMode]);

    const xAxisProps = useMemo(() => ({
        tick: { fill: tickColor, fontSize: 11 },
        axisLine: false,
        tickLine: false,
        interval: 0,
        angle: 0,
        textAnchor: 'middle' as const,
        height: 50
    }), [tickColor]);

    const filteredOverviewRecords = useMemo(() => {
        if (!Array.isArray(records)) return [];
        return records.filter(rec => {
            const recordDate = new Date(rec.date);
            if (overviewFilters.start) {
                const startDate = new Date(overviewFilters.start);
                if (recordDate < startDate) return false;
            }
            if (overviewFilters.end) {
                const endDate = new Date(overviewFilters.end);
                endDate.setHours(23, 59, 59, 999);
                if (recordDate > endDate) return false;
            }
            return true;
        });
    }, [records, overviewFilters]);

    const filteredTableRecords = useMemo(() => {
        if (!Array.isArray(records)) return [];

        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

        return records.filter(rec => {
            if (tableFilters.mesAno) {
                const [y, m] = tableFilters.mesAno.split('-').map(Number);
                const recDate = new Date(rec.date);
                if (recDate.getMonth() + 1 !== m || recDate.getFullYear() !== y) return false;
            }
            if (tableFilters.sector !== 'Todos' && normalize(String(rec.sector)) !== normalize(tableFilters.sector)) return false;
            if (tableFilters.type !== 'Todos' && rec.lossType !== tableFilters.type) return false;
            return true;
        });
    }, [records, tableFilters]);

    // Agrupamento por Mês
    const groupedRecords = useMemo(() => {
        const groups: Record<string, LossRecord[]> = {};

        filteredTableRecords.forEach(rec => {
            const date = new Date(rec.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(rec);
        });

        // Ordenar chaves decrescente
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filteredTableRecords]);

    // Abrir o primeiro accordion por padrão
    useEffect(() => {
        if (groupedRecords.length > 0 && openAccordions.length === 0) {
            const firstKey = groupedRecords[0]?.[0];
            if (firstKey) setOpenAccordions([firstKey]);
        }
    }, [groupedRecords.length]);

    const toggleAccordion = (key: string) => {
        setOpenAccordions(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const formatMonthYear = (key: string) => {
        const [year, month] = key.split('-');
        const date = new Date(Number(year), Number(month) - 1, 1);
        const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const handleDeleteMonthClick = (key: string, ids: number[]) => {
        setDeleteMonthData({ mesAno: key, recordIds: ids });
    };

    const confirmDeleteMonth = async () => {
        if (!deleteMonthData) return;

        let deleted = 0;
        let errors = 0;

        for (const id of deleteMonthData.recordIds) {
            try {
                await lossesService.delete(id);
                deleted++;
            } catch (error) {
                console.error(`Erro ao deletar registro ${id}`, error);
                errors++;
            }
        }

        const updatedRecords = await lossesService.getAll();
        setRecords(updatedRecords);
        setDeleteMonthData(null);

        if (errors === 0) {
            alert(`✅ ${deleted} registros excluídos com sucesso!`);
        } else {
            alert(`⚠️ ${deleted} excluídos. ${errors} erros.`);
        }
    };


    const kpiData = useMemo(() => {
        return filteredOverviewRecords.reduce((acc, rec) => {
            if (rec.unit === Unit.KG) {
                acc.totalLossKg += rec.quantity;
            }
            acc.totalCost += rec.totalCost;

            if (rec.lossType === LossType.MASSA) {
                acc.lossMassa += rec.quantity;
            } else if (rec.lossType === LossType.EMBALAGEM) {
                acc.lossEmbalagem += rec.quantity;
            } else if (rec.lossType === LossType.INSUMO) {
                acc.lossInsumo += rec.quantity;
            }

            return acc;
        }, { totalLossKg: 0, totalCost: 0, lossMassa: 0, lossEmbalagem: 0, lossInsumo: 0 });
    }, [filteredOverviewRecords]);

    const chartData = useMemo(() => {
        const sectors = Object.values(Sector).filter(s => s !== Sector.MANUTENCAO);
        const dataBySector = filteredOverviewRecords.reduce((acc, rec) => {
            if (!acc[rec.sector]) {
                acc[rec.sector] = {
                    'Massa (KG)': 0,
                    'Embalagem (KG)': 0,
                    'Insumo (KG)': 0,
                    'Perdas (KG)': 0,
                    'Custo (R$)': 0,
                };
            }

            const typeKey = `${rec.lossType} (KG)`;
            if (acc[rec.sector]!.hasOwnProperty(typeKey)) {
                acc[rec.sector]![typeKey as keyof typeof acc[Sector]]! += rec.quantity;
            }

            if (rec.unit === Unit.KG) {
                acc[rec.sector]!['Perdas (KG)']! += rec.quantity;
            }

            acc[rec.sector]!['Custo (R$)']! += rec.totalCost;
            return acc;
        }, {} as Record<Sector, Record<string, number>>);

        return sectors.map(s => ({
            name: s,
            'Massa (KG)': dataBySector[s]?.['Massa (KG)'] || 0,
            'Embalagem (KG)': dataBySector[s]?.['Embalagem (KG)'] || 0,
            'Insumo (KG)': dataBySector[s]?.['Insumo (KG)'] || 0,
            'Perdas (KG)': dataBySector[s]?.['Perdas (KG)'] || 0,
            'Custo (R$)': dataBySector[s]?.['Custo (R$)'] || 0,
        }));
    }, [filteredOverviewRecords]);

    const handleOpenModal = (record?: LossRecord) => {
        setCurrentRecord(record || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRecord(null);
    };

    const handleSave = async (data: Omit<LossRecord, 'id'>) => {
        if (!Array.isArray(records)) return;
        try {
            const normalizedData = {
                ...data,
                product: data.product.toUpperCase()
            };

            if (currentRecord) {
                await lossesService.update(currentRecord.id, normalizedData);
            } else {
                await lossesService.create(normalizedData);
            }

            const updatedRecords = await lossesService.getAll();
            setRecords(updatedRecords);
            handleCloseModal();
        } catch (error: any) {
            console.error('Erro ao salvar perda:', error);
            const msg = error.response?.data?.message || 'Erro ao salvar registro de perda.';
            const details = error.response?.data?.errors?.map((e: any) => `- ${e.field}: ${e.message}`).join('\n') || '';
            alert(`${msg}\n${details}`);
        }
    };

    const confirmDelete = async () => {
        if (!Array.isArray(records)) return;
        if (deleteId) {
            try {
                await lossesService.delete(deleteId);
                setRecords(records.filter(r => r.id !== deleteId));
                setDeleteId(null);
            } catch (error) {
                console.error('Erro ao deletar perda:', error);
                alert('Erro ao deletar registro de perda.');
            }
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    // Dynamic import: XLSX só é carregado quando usuário clica em exportar
    // Reduz bundle inicial em ~200KB
    const handleExportXLSX = async () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        // Carrega biblioteca XLSX dinamicamente (apenas na primeira exportação)
        const XLSX = await import('xlsx');

        const dataToExport = filteredTableRecords.map(r => ({
            'Data': new Date(r.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            'Setor': r.sector,
            'Produto': r.product,
            'Tipo de Perda': r.lossType,
            'Quantidade': r.quantity,
            'Unidade': r.unit,
            'Custo Total (R$)': r.totalCost.toFixed(2),
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Perdas");
        XLSX.writeFile(wb, "perdas_producao.xlsx");
    };

    // Dynamic import: jsPDF só é carregado quando usuário clica em exportar
    // Reduz bundle inicial em ~200KB
    const handleExportPDF = async () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        // Carrega bibliotecas jsPDF e autoTable dinamicamente
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable')
        ]);

        const doc = new jsPDF();
        doc.text("Relatório de Perdas de Produção", 14, 16);
        autoTable(doc, {
            head: [['Data', 'Setor', 'Produto', 'Tipo', 'Quantidade', 'Custo (R$)']],
            body: filteredTableRecords.map(r => [
                new Date(r.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                r.sector,
                r.product,
                r.lossType,
                `${r.quantity} ${r.unit}`,
                r.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            ]),
            startY: 20,
        });
        doc.save('perdas_producao.pdf');
    };

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <DatePickerInput
                            label="Data Início"
                            value={overviewFilters.start}
                            onChange={(date) => setOverviewFilters({ ...overviewFilters, start: date })}
                        />
                    </div>
                    <div>
                        <DatePickerInput
                            label="Data Fim"
                            value={overviewFilters.end}
                            onChange={(date) => setOverviewFilters({ ...overviewFilters, end: date })}
                        />
                    </div>
                </div>
                {(overviewFilters.start || overviewFilters.end) && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => setOverviewFilters({ start: '', end: '' })}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            🔄 Limpar Filtros
                        </button>
                    </div>
                )}
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Filter size={16} className="text-imac-primary" />
                    <span>Mostrando <span className="font-semibold text-imac-primary">{filteredOverviewRecords.length}</span> de <span className="font-semibold">{records.length}</span> registros</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <KpiCard title="Total de Perdas (KG)" value={formatBrazilianNumber(kpiData.totalLossKg, 1)} unit="KG" icon={<TrendingDown />} color={COLORS.error} />
                <KpiCard title="Custo Total" value={formatBrazilianNumber(kpiData.totalCost, 2)} unit="R$" icon={<DollarSign />} color={COLORS.tertiary} />
                <KpiCard title="Perda de Massa" value={formatBrazilianNumber(kpiData.lossMassa, 1)} unit="KG" icon={<Wheat />} color="#EAB308" />
                <KpiCard title="Perda de Embalagem" value={formatBrazilianNumber(kpiData.lossEmbalagem, 0)} unit="KG" icon={<Package />} color="#3B82F6" />
                <KpiCard title="Perda de Insumo" value={formatBrazilianNumber(kpiData.lossInsumo, 1)} unit="KG" icon={<Layers />} color="#A855F7" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Perdas por Setor (KG)">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis yAxisId="left" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => name === 'Custo (R$)' ? `R$ ${Number(value).toFixed(2)}` : `${value} KG`} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar yAxisId="left" dataKey="Perdas (KG)" fill={COLORS.error} barSize={45} radius={[4, 4, 0, 0]} name="Perdas (KG)">
                                <LabelList dataKey="Perdas (KG)" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#E74C3C', fontSize: 16, fontWeight: 600 }} />
                            </Bar>
                            <Line yAxisId="right" type="monotone" dataKey="Custo (R$)" stroke={COLORS.tertiary} strokeWidth={2} name="Custo (R$)" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Perdas de Massas">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} KG`} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="Massa (KG)" fill={COLORS.primary} barSize={45} radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="Massa (KG)" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#D99B61', fontSize: 16, fontWeight: 600 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Perdas de Embalagens">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} KG`} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="Embalagem (KG)" fill={COLORS.secondary} barSize={45} radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="Embalagem (KG)" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#F3C78A', fontSize: 16, fontWeight: 600 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Perdas de Insumos">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} KG`} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="Insumo (KG)" fill={COLORS.tertiary} barSize={45} radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="Insumo (KG)" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#B36B3C', fontSize: 16, fontWeight: 600 }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </div>
    );

    const renderRecords = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={handleExportXLSX} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-green-600 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition text-sm font-medium">
                        <File size={16} /> Exportar XLSX
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-red-600 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm font-medium">
                        <File size={16} /> Exportar PDF
                    </button>
                </div>
                {canCreate() && (
                    <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-imac-success text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold">
                        <Plus size={20} className="mr-2" />
                        Nova Perda
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 space-y-4 no-print transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mês/Ano</label>
                        <DatePickerInput
                            type="month"
                            value={tableFilters.mesAno}
                            onChange={(date) => setTableFilters({ ...tableFilters, mesAno: date })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Setor</label>
                        <select
                            value={tableFilters.sector}
                            onChange={(e) => setTableFilters({ ...tableFilters, sector: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        >
                            <option value="Todos">Todos</option>
                            {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
                        <select
                            value={tableFilters.type}
                            onChange={(e) => setTableFilters({ ...tableFilters, type: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        >
                            <option value="Todos">Todos</option>
                            {Object.values(LossType).map(lt => <option key={lt} value={lt}>{lt}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><TrendingUp size={20} />Registros de Perdas</h3>

                {groupedRecords.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-lg border border-dashed border-gray-300 dark:border-slate-700 text-center">
                        <p className="text-gray-400 text-lg">Nenhum registro encontrado.</p>
                    </div>
                ) : (
                    groupedRecords.map(([key, groupData]) => {
                        const isOpen = openAccordions.includes(key);
                        const label = formatMonthYear(key);

                        return (
                            <div key={key} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300">
                                {/* Header */}
                                <div
                                    className={`
                                        flex items-center justify-between p-4 transition-colors border-l-4
                                        ${isOpen
                                            ? 'bg-imac-primary/5 dark:bg-slate-700/50 border-imac-primary border-b border-b-imac-primary/10'
                                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/30 border-transparent'}
                                    `}
                                >
                                    <div
                                        onClick={() => toggleAccordion(key)}
                                        className="flex items-center gap-3 cursor-pointer select-none flex-1"
                                    >
                                        <div className={`p-2 rounded-lg ${isOpen ? 'bg-imac-primary text-white shadow-sm' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h4 className={`text-lg font-bold ${isOpen ? 'text-imac-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {label}
                                            </h4>
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                {groupData.length} registro{groupData.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canDelete() && !isEspectador() && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMonthClick(key, groupData.map(r => r.id));
                                                }}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors no-print"
                                                title={`Excluir todos os registros de ${label}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <div
                                            onClick={() => toggleAccordion(key)}
                                            className={`transform transition-transform duration-300 cursor-pointer p-2 ${isOpen ? 'rotate-180 text-imac-primary' : 'text-gray-400'}`}
                                        >
                                            <ChevronDown size={24} />
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                {isOpen && (
                                    <div className="animate-fadeIn">
                                        <div className="overflow-x-auto w-full">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-700/50">
                                                    <tr>
                                                        <th className="px-6 py-3">Data</th>
                                                        <th className="px-6 py-3">Setor</th>
                                                        <th className="px-6 py-3">Produto</th>
                                                        <th className="px-6 py-3">Tipo</th>
                                                        <th className="px-6 py-3 text-right">Quantidade</th>
                                                        <th className="px-6 py-3 text-right">Custo (R$)</th>
                                                        <th className="px-6 py-3 text-center no-print">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                    {groupData.map(rec => (
                                                        <tr key={rec.id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-400">{new Date(rec.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-400 uppercase">{rec.sector}</td>
                                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-gray-200 uppercase">{rec.product}</td>
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 uppercase">
                                                                {rec.lossType}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-400">{rec.quantity} {rec.unit}</td>
                                                            <td className="px-6 py-4 font-semibold text-right text-gray-700 dark:text-gray-400">{rec.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                            <td className="px-6 py-4 flex justify-center items-center gap-2 no-print">
                                                                <button type="button" onClick={() => { setViewData(rec); setIsViewModalOpen(true); }} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors" title="Visualizar">
                                                                    <Eye size={18} />
                                                                </button>
                                                                {!isEspectador() && (
                                                                    <>
                                                                        {canEdit() && (
                                                                            <button type="button" onClick={() => handleOpenModal(rec)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Editar"><Pencil size={18} /></button>
                                                                        )}
                                                                        {canDelete() && (
                                                                            <button type="button" onClick={() => handleDeleteClick(rec.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" title="Excluir"><Trash2 size={18} /></button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // Mostrar loading enquanto dados são carregados
    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imac-primary"></div>
                <span className="ml-4 text-slate-600 dark:text-slate-400">Carregando perdas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-2 no-print">
                <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary">Perdas de Produção</h1>
                <p className="text-md text-imac-text/70 dark:text-slate-400">Monitore e analise as perdas por setor</p>
            </div>

            <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-lg flex space-x-1 max-w-sm no-print transition-colors">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white dark:bg-slate-600 text-imac-tertiary dark:text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                >
                    <TrendingUp size={16} className="mr-2" />
                    Visão Geral
                </button>
                <button
                    onClick={() => setActiveTab('records')}
                    className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'records' ? 'bg-white dark:bg-slate-600 text-imac-tertiary dark:text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                >
                    <List size={16} className="mr-2" />
                    Dados Registrados
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'overview' ? renderOverview() : renderRecords()}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentRecord ? 'Editar Registro de Perda' : 'Registrar Nova Perda'}
            >
                <LossRecordForm record={currentRecord} onSave={handleSave} onCancel={handleCloseModal} products={products} />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Perda"
                message="Tem certeza que deseja excluir este registro de perda? Esta ação não pode ser desfeita."
            />

            <ConfirmModal
                isOpen={!!deleteMonthData}
                onClose={() => setDeleteMonthData(null)}
                onConfirm={confirmDeleteMonth}
                title={`Excluir Todos os Registros de ${deleteMonthData ? formatMonthYear(deleteMonthData.mesAno) : ''}`}
                message={`Tem certeza que deseja excluir TODOS os ${deleteMonthData?.recordIds.length || 0} registros de ${deleteMonthData ? formatMonthYear(deleteMonthData.mesAno) : ''}? Esta ação não pode ser desfeita.`}
            />

            <ViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detalhes da Perda"
                data={viewData}
                fields={[
                    { label: 'Data', key: 'date', format: (v: string) => new Date(v).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) },
                    { label: 'Setor', key: 'sector' },
                    { label: 'Produto', key: 'product' },
                    { label: 'Tipo', key: 'lossType' },
                    { label: 'Quantidade', key: 'quantity', format: (v: number) => `${v} ${viewData?.unit || ''}` },
                    { label: 'Custo Unit.', key: 'unitCost', format: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                    { label: 'Custo Total', key: 'totalCost', format: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
                ]}
            />

        </div>
    );
};

// React.memo: Evita re-renderizações desnecessárias quando props não mudam
export default React.memo(Losses);
