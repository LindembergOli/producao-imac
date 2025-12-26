import React, { useState, useMemo, useEffect } from 'react';
import type { LossRecord, Product, Supply } from '../types';
import { Sector, LossType, Unit } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Pencil, Trash2, List, File, TrendingUp, TrendingDown, DollarSign, Package, Wheat, Layers, Filter } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line, ComposedChart } from 'recharts';
import Modal, { ConfirmModal } from '../components/Modal';
import DatePickerInput from '../components/DatePickerInput';
import { useAuth } from '../contexts/AuthContext';
import { lossesService } from '../services/modules/losses';
import { formatBrazilianNumber } from '../utils/formatters';
import { suppliesService } from '../services/modules/supplies';

const COLORS = {
    primary: '#D99B61',
    secondary: '#F3C78A',
    tertiary: '#B36B3C',
    error: '#E74C3C',
};

// getMesAnoOptions removido pois agora usamos DatePickerInput com type="month"

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
                // Se tipo de perda for SUPPLY, carregar supplies
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
                    <select
                        value={formData.product}
                        onChange={e => handleProductChange(e.target.value)}
                        disabled={!formData.sector || !formData.lossType}
                        className={`${inputClass} disabled:bg-gray-100 dark:disabled:bg-slate-800`}
                    >
                        <option value="">
                            {!formData.sector ? 'Selecione um setor primeiro' :
                                !formData.lossType ? 'Selecione o tipo de perda primeiro' :
                                    'Selecione'}
                        </option>
                        {formData.lossType === LossType.INSUMO
                            ? availableSupplies.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                            : availableProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
                        }
                    </select>
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
    records: LossRecord[];
    setRecords: React.Dispatch<React.SetStateAction<LossRecord[]>>;
    isDarkMode: boolean;
}

const Losses: React.FC<LossesProps> = ({ products, records, setRecords, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<LossRecord | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);


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

        // Função auxiliar para normalizar strings para comparação
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
        }).sort((a, b) => a.sector.localeCompare(b.sector));
    }, [records, tableFilters]);


    const kpiData = useMemo(() => {
        return filteredOverviewRecords.reduce((acc, rec) => {
            // Total Geral
            if (rec.unit === Unit.KG) {
                acc.totalLossKg += rec.quantity;
            }
            acc.totalCost += rec.totalCost;

            // Totais por Categoria
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
            // Converter campos de texto para maiúsculas
            const normalizedData = {
                ...data,
                product: data.product.toUpperCase()
            };

            if (currentRecord) {
                const updated = await lossesService.update(currentRecord.id, normalizedData);
                setRecords(records.map(r => r.id === currentRecord.id ? updated : r));
            } else {
                const created = await lossesService.create(normalizedData);
                setRecords([...records, created]);
            }
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

    const handleExportXLSX = () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // const XLSX = (window as any).XLSX; // Removido
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

    const handleExportPDF = () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // const { jsPDF } = (window as any).jspdf; // Removido
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
                        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis yAxisId="left" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => name === 'Custo (R$)' ? `R$ ${Number(value).toFixed(2)}` : `${value} KG`} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar yAxisId="left" dataKey="Perdas (KG)" fill={COLORS.error} barSize={20} radius={[4, 4, 0, 0]} name="Perdas (KG)" />
                            <Line yAxisId="right" type="monotone" dataKey="Custo (R$)" stroke={COLORS.tertiary} strokeWidth={2} name="Custo (R$)" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Perdas de Massas">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} KG`} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="Massa (KG)" fill={COLORS.primary} barSize={30} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Perdas de Embalagens">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} KG`} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="Embalagem (KG)" fill={COLORS.secondary} barSize={30} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Perdas de Insumos">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} KG`} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar dataKey="Insumo (KG)" fill={COLORS.tertiary} barSize={30} radius={[4, 4, 0, 0]} />
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

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><TrendingUp size={20} />Registros de Perdas</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3">Data</th>
                                <th className="px-6 py-3">Setor</th>
                                <th className="px-6 py-3">Produto</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3 text-right">Quantidade</th>
                                <th className="px-6 py-3 text-right">Custo (R$)</th>
                                {!isEspectador() && <th className="px-6 py-3 text-center no-print">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 dark:text-gray-300">
                            {filteredTableRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-400">Nenhuma perda encontrada</td>
                                </tr>
                            ) : filteredTableRecords.map(rec => (
                                <tr key={rec.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">{new Date(rec.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td className="px-6 py-4">{rec.sector}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{rec.product}</td>
                                    <td className="px-6 py-4">{rec.lossType}</td>
                                    <td className="px-6 py-4 text-right">{rec.quantity} {rec.unit}</td>
                                    <td className="px-6 py-4 font-semibold text-right">{rec.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    {!isEspectador() && (
                                        <td className="px-6 py-4 flex justify-center items-center gap-2 no-print">
                                            {canEdit() && (
                                                <button type="button" onClick={() => handleOpenModal(rec)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Editar"><Pencil size={18} /></button>
                                            )}
                                            {canDelete() && (
                                                <button type="button" onClick={() => handleDeleteClick(rec.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" title="Excluir"><Trash2 size={18} /></button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

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

        </div>
    );
};

export default Losses;
