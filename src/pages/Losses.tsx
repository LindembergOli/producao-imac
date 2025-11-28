

import React, { useState, useMemo, useEffect } from 'react';
import { sanitizeFormInput } from '../utils/sanitize';
import type { LossRecord, Product } from '../types';
import { Sector, LossType, Unit } from '../types';
import { Plus, Pencil, Trash2, List, File, TrendingUp, TrendingDown, DollarSign, Package, Wheat, Layers } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart as RechartsLineChart, Line, ComposedChart } from 'recharts';
import Modal, { ConfirmModal } from '../components/Modal';

const COLORS = {
    primary: '#D99B61',
    secondary: '#F3C78A',
    tertiary: '#B36B3C',
    error: '#E74C3C',
};

const getMesAnoOptions = () => {
    const options = [];
    const startYear = 2022;
    const endYear = 2030;
    for (let year = endYear; year >= startYear; year--) {
        for (let month = 12; month >= 1; month--) {
            const monthStr = month.toString().padStart(2, '0');
            options.push(`${monthStr}/${year}`);
        }
    }
    return options;
};

const mesAnoOptions = getMesAnoOptions();

const LossRecordForm: React.FC<{
    record: Partial<LossRecord> | null;
    onSave: (record: Omit<LossRecord, 'id'>) => void;
    onCancel: () => void;
    products: Product[];
}> = ({ record, onSave, onCancel, products }) => {

    const [formData, setFormData] = useState({
        date: record?.date || new Date().toISOString().split('T')[0],
        sector: record?.sector || '',
        lossType: record?.lossType || '',
        product: record?.product || '',
        quantity: record?.quantity || 0,
        unit: record?.unit || Unit.KG,
        unitCost: record?.unitCost || 0,
    });
    const [totalCost, setTotalCost] = useState(record?.totalCost || 0);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (formData.sector) {
            const filteredProducts = products.filter(p => p.sector === formData.sector);
            setAvailableProducts(filteredProducts);
            if (record?.sector !== formData.sector) {
                setFormData(f => ({ ...f, product: '', unitCost: 0, unit: Unit.KG }));
            }
        } else {
            setAvailableProducts([]);
        }
    }, [formData.sector, record?.sector, products]);

    useEffect(() => {
        const cost = (Number(formData.quantity) || 0) * (Number(formData.unitCost) || 0);
        setTotalCost(cost);
    }, [formData.quantity, formData.unitCost]);

    const handleProductChange = (productName: string) => {
        const selectedProduct = availableProducts.find(p => p.name === productName);

        let calculatedUnitCost = 0;

        // Lógica de cálculo: Custo da Receita / Rendimento
        if (selectedProduct) {
            const recipeCost = selectedProduct.unit_cost || 0;
            const productYield = selectedProduct.yield && selectedProduct.yield > 0 ? selectedProduct.yield : 1;
            calculatedUnitCost = recipeCost / productYield;
        }

        setFormData({
            ...formData,
            product: productName,
            unit: selectedProduct?.unit || Unit.KG,
            unitCost: Number(calculatedUnitCost.toFixed(4)), // Mantém precisão para custos baixos por unidade
        });
    };

    const handleSave = () => {
        if (!formData.date || !formData.sector || !formData.lossType || !formData.product) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        onSave({
            ...formData,
            sector: formData.sector as Sector,
            lossType: formData.lossType as LossType,
            unit: formData.unit as Unit,
            totalCost
        } as Omit<LossRecord, 'id'>);
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data *</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: sanitizeFormInput(e.target.value) })} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Setor *</label>
                    <select value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value as Sector })} className={inputClass}>
                        <option value="">Selecione</option>
                        {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Perda *</label>
                    <select value={formData.lossType} onChange={e => setFormData({ ...formData, lossType: e.target.value as LossType })} className={inputClass}>
                        <option value="">Selecione</option>
                        {Object.values(LossType).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto *</label>
                    <select value={formData.product} onChange={e => handleProductChange(e.target.value)} disabled={!formData.sector} className={`${inputClass} disabled:bg-gray-100 dark:disabled:bg-slate-800`}>
                        <option value="">{formData.sector ? 'Selecione' : 'Selecione um setor primeiro'}</option>
                        {availableProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade *</label>
                    <input type="number" value={formData.quantity || ''} onFocus={e => e.target.select()} onChange={e => setFormData({ ...formData, quantity: Number(sanitizeFormInput(e.target.value)) })} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidade *</label>
                    <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value as Unit })} className={inputClass}>
                        {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custo Unit. (R$) *</label>
                    <input type="number" step="0.0001" value={formData.unitCost || ''} onFocus={e => e.target.select()} onChange={e => setFormData({ ...formData, unitCost: Number(sanitizeFormInput(e.target.value)) })} className={inputClass} />
                    <p className="text-xs text-gray-500 mt-1">Calculado: Custo Receita / Rendimento</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Custo Total (R$) - Calculado</label>
                    <input type="text" readOnly value={totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 p-2 font-semibold dark:text-white" />
                </div>
            </div>

            <div className="flex justify-end pt-6 gap-2">
                <button type="button" onClick={onCancel} className="bg-transparent border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold">Cancelar</button>
                <button type="button" onClick={handleSave} className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold">{record?.id ? 'Salvar' : 'Criar'}</button>
            </div>
        </div>
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

    // Filters for Overview
    const [overviewFilters, setOverviewFilters] = useState({
        start: '',
        end: ''
    });

    // Filters for Table
    const [tableFilters, setTableFilters] = useState({
        mesAno: '',
        sector: 'Todos',
        type: 'Todos'
    });

    // Chart styling constants
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
        tick: { fill: tickColor, fontSize: 9 },
        axisLine: false,
        tickLine: false,
        interval: 0,
        angle: -45,
        textAnchor: 'end' as const,
        height: 70
    }), [tickColor]);

    const filteredOverviewRecords = useMemo(() => {
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
        return records.filter(rec => {
            if (tableFilters.mesAno) {
                const [m, y] = tableFilters.mesAno.split('/');
                const recDate = new Date(rec.date);
                if (recDate.getMonth() + 1 !== Number(m) || recDate.getFullYear() !== Number(y)) return false;
            }
            if (tableFilters.sector !== 'Todos' && rec.sector !== tableFilters.sector) return false;
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
        const sectors = Object.values(Sector);
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
            const sectorData = acc[rec.sector];
            if (sectorData && sectorData.hasOwnProperty(typeKey)) {
                sectorData[typeKey] = (sectorData[typeKey] || 0) + rec.quantity;
            }

            if (rec.unit === Unit.KG && sectorData) {
                sectorData['Perdas (KG)'] += rec.quantity;
            }

            if (sectorData) {
                sectorData['Custo (R$)'] += rec.totalCost;
            }
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

    const handleSave = (data: Omit<LossRecord, 'id'>) => {
        if (currentRecord) {
            setRecords(records.map(r => r.id === currentRecord.id ? { ...currentRecord, ...data } : r));
        } else {
            setRecords([...records, { ...data, id: Date.now() }]);
        }
        handleCloseModal();
    };

    const confirmDelete = () => {
        if (deleteId) {
            setRecords(records.filter(r => r.id !== deleteId));
            setDeleteId(null);
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
        const XLSX = (window as any).XLSX;
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
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        doc.text("Relatório de Perdas de Produção", 14, 16);
        (doc as any).autoTable({
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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Início</label>
                        <input
                            type="date"
                            value={overviewFilters.start}
                            onChange={(e) => setOverviewFilters({ ...overviewFilters, start: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Fim</label>
                        <input
                            type="date"
                            value={overviewFilters.end}
                            onChange={(e) => setOverviewFilters({ ...overviewFilters, end: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <KpiCard title="Total de Perdas (KG)" value={kpiData.totalLossKg.toFixed(1)} unit="KG" icon={<TrendingDown />} color={COLORS.error} />
                <KpiCard title="Custo Total" value={kpiData.totalCost.toFixed(2)} unit="R$" icon={<DollarSign />} color={COLORS.tertiary} />
                <KpiCard title="Perda de Massa" value={kpiData.lossMassa.toFixed(1)} unit="KG" icon={<Wheat />} color="#EAB308" />
                <KpiCard title="Perda de Embalagem" value={kpiData.lossEmbalagem.toFixed(0)} unit="KG" icon={<Package />} color="#3B82F6" />
                <KpiCard title="Perda de Insumo" value={kpiData.lossInsumo.toFixed(1)} unit="KG" icon={<Layers />} color="#A855F7" />
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
                            <YAxis tick={{ fill: tickColor }} axisLine={false} tickLine={false} />
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
                            <YAxis tick={{ fill: tickColor }} axisLine={false} tickLine={false} />
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
                            <YAxis tick={{ fill: tickColor }} axisLine={false} tickLine={false} />
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
                <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-imac-success text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold">
                    <Plus size={20} className="mr-2" />
                    Nova Perda
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-4 no-print transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mês/Ano</label>
                        <select
                            value={tableFilters.mesAno}
                            onChange={(e) => setTableFilters({ ...tableFilters, mesAno: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        >
                            <option value="">Todos</option>
                            {mesAnoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Setor</label>
                        <select
                            value={tableFilters.sector}
                            onChange={(e) => setTableFilters({ ...tableFilters, sector: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        >
                            <option value="Todos">Todos</option>
                            {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
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

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm transition-colors">
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
                                <th className="px-6 py-3 text-center no-print">Ações</th>
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
                                    <td className="px-6 py-4 flex justify-center items-center gap-2 no-print">
                                        <button type="button" onClick={() => handleOpenModal(rec)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Editar"><Pencil size={18} /></button>
                                        <button type="button" onClick={() => handleDeleteClick(rec.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" title="Excluir"><Trash2 size={18} /></button>
                                    </td>
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
