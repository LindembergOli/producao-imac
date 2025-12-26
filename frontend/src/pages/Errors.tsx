
import React, { useState, useMemo, useEffect } from 'react';
import type { ErrorRecord, Product } from '../types';
import { Sector, ErrorCategory } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Pencil, Trash2, List, File, TriangleAlert, DollarSign, HelpCircle, Star, TrendingUp, Filter } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar } from 'recharts';
import Modal, { ConfirmModal } from '../components/Modal';
import DatePickerInput from '../components/DatePickerInput';
import { useAuth } from '../contexts/AuthContext';
import { errorsService } from '../services/modules/errors';
import { formatBrazilianNumber } from '../utils/formatters';

const COLORS = {
    primary: '#D99B61',
    secondary: '#F3C78A',
    tertiary: '#B36B3C',
    error: '#E74C3C',
    pie: ['#34D399', '#FBBF24', '#F87171', '#60A5FA', '#A78BFA'] // Emerald, Amber, Red, Blue, Violet
};

// getMesAnoOptions removido pois agora usamos DatePickerInput com type="month"

const ErrorRecordForm: React.FC<{
    record: Partial<ErrorRecord> | null;
    onSave: (record: Omit<ErrorRecord, 'id'>) => void;
    onCancel: () => void;
    products: Product[];
}> = ({ record, onSave, onCancel, products }) => {

    // Função auxiliar para converter data para formato YYYY-MM-DD
    const formatDateForInput = (date: string | Date | undefined): string => {
        if (!date) return new Date().toISOString().split('T')[0] || '';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toISOString().split('T')[0] || '';
    };

    const [formData, setFormData] = useState({
        date: formatDateForInput(record?.date),
        sector: (record?.sector as string) || '',
        product: record?.product || '',
        category: (record?.category as string) || '',
        description: record?.description || '',
        action: record?.action || '',
        cost: record?.cost || 0,
        wastedQty: record?.wastedQty?.toString().replace('.', ',') || '',
    });
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [isManualCost, setIsManualCost] = useState(false);

    // Função auxiliar para normalizar strings
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    useEffect(() => {
        if (formData.sector) {
            const filteredProducts = products.filter(p => normalize(String(p.sector)) === normalize(String(formData.sector)));
            setAvailableProducts(filteredProducts);
            if (record?.sector !== formData.sector) {
                setFormData(f => ({ ...f, product: '' }));
            }
        } else {
            setAvailableProducts([]);
        }
    }, [formData.sector, record?.sector, products]);

    // Calcular automaticamente o custo baseado no unitCost/yield do produto * wastedQty
    useEffect(() => {
        if (formData.product && formData.wastedQty && !isManualCost) {
            const selectedProduct = availableProducts.find(p => p.name === formData.product);
            if (selectedProduct?.unitCost && selectedProduct?.yield) {
                const wastedQtyNum = parseFloat(formData.wastedQty.replace(',', '.'));
                if (!isNaN(wastedQtyNum) && wastedQtyNum > 0) {
                    const calculatedCost = (selectedProduct.unitCost / selectedProduct.yield) * wastedQtyNum;
                    // Arredondar para 2 casas decimais
                    const roundedCost = Math.round(calculatedCost * 100) / 100;
                    setFormData(prev => ({ ...prev, cost: roundedCost }));
                }
            }
        }
    }, [formData.product, formData.wastedQty, availableProducts, isManualCost]);

    const handleSave = () => {
        if (!formData.date || !formData.sector || !formData.product || !formData.category || !formData.description) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        onSave({
            ...formData,
            cost: Number(formData.cost),
            wastedQty: parseFloat(formData.wastedQty.replace(',', '.') || '0')
        } as unknown as Omit<ErrorRecord, 'id'>);
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white";
    const calculatedInputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-gray-50 dark:bg-slate-600 dark:text-white";

    // Verificar se o produto atual tem unitCost e yield para cálculo automático
    const selectedProduct = availableProducts.find(p => p.name === formData.product);
    const canAutoCalculate = selectedProduct?.unitCost && selectedProduct?.yield;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data *</label>
                    <DatePickerInput
                        value={formData.date || ''}
                        onChange={date => setFormData({ ...formData, date })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Setor *</label>
                    <select
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value as Sector })}
                        className={inputClass}
                    >
                        <option value="">Selecione</option>
                        {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto *</label>
                    <select value={formData.product} onChange={e => setFormData({ ...formData, product: e.target.value })} disabled={!formData.sector} className={`${inputClass} disabled:bg-gray-100 dark:disabled:bg-slate-800`}>
                        <option value="">{formData.sector ? 'Selecione' : 'Selecione um setor primeiro'}</option>
                        {availableProducts.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria *</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ErrorCategory })} className={inputClass}>
                        <option value="">Selecione a categoria</option>
                        {Object.values(ErrorCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição do Erro *</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className={inputClass}></textarea>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ação/Solução Tomada</label>
                    <textarea value={formData.action} onChange={e => setFormData({ ...formData, action: e.target.value })} rows={3} className={inputClass}></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qtd. Desperdiçada (KG)</label>
                    <input type="text" inputMode="decimal" value={formData.wastedQty} onChange={e => setFormData({ ...formData, wastedQty: e.target.value })} className={inputClass} placeholder="0,000" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        Custo do Erro (R$)
                        {canAutoCalculate && !isManualCost && (
                            <span className="text-xs text-green-600 dark:text-green-400">(calculado automaticamente)</span>
                        )}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            value={formData.cost || ''}
                            onFocus={e => {
                                e.target.select();
                                if (canAutoCalculate) {
                                    setIsManualCost(true);
                                }
                            }}
                            onChange={e => {
                                setFormData({ ...formData, cost: Number(e.target.value) });
                                setIsManualCost(true);
                            }}
                            className={canAutoCalculate && !isManualCost ? calculatedInputClass : inputClass}
                            title={canAutoCalculate && !isManualCost ? "Calculado automaticamente. Clique para editar manualmente." : ""}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 gap-2">
                <button type="button" onClick={onCancel} className="bg-transparent border border-red-500 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 font-semibold">Cancelar</button>
                <button type="button" onClick={handleSave} className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold">{record?.id ? 'Salvar' : 'Criar'}</button>
            </div>
        </div>
    );
};

interface ErrorsProps {
    products: Product[];
    records: ErrorRecord[];
    setRecords: React.Dispatch<React.SetStateAction<ErrorRecord[]>>;
    isDarkMode: boolean;
}

const Errors: React.FC<ErrorsProps> = ({ products, records, setRecords, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<ErrorRecord | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { canCreate, canEdit, canDelete, isEspectador } = useAuth();

    // Filtros para Visão Geral
    const [overviewFilters, setOverviewFilters] = useState({
        start: '',
        end: ''
    });

    // Filtros para Tabela
    const [tableFilters, setTableFilters] = useState({
        mesAno: '',
        sector: 'Todos',
        product: '',
        category: ''
    });

    // Constantes de estilo de gráficos
    const gridColor = isDarkMode ? '#334155' : '#e5e7eb';
    const tickColor = isDarkMode ? '#9ca3af' : '#6b7280';
    const tooltipStyle = {
        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
        borderColor: isDarkMode ? '#334155' : '#fff',
        color: isDarkMode ? '#f1f5f9' : '#1e293b',
    };

    const tooltipItemStyle = {
        color: isDarkMode ? '#f1f5f9' : '#1e293b'
    };

    const xAxisProps = {
        tick: { fill: tickColor, fontSize: 11 },
        axisLine: false,
        tickLine: false,
        interval: 0,
        angle: 0,
        textAnchor: 'middle' as const,
        height: 50
    };

    // Dados Filtrados para Visão Geral
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

    // Dados Filtrados para Tabela
    const filteredTableRecords = useMemo(() => {
        if (!Array.isArray(records)) return [];

        // Função auxiliar para normalizar strings para comparação
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

        return records.filter(rec => {
            if (tableFilters.mesAno) {
                const [y, m] = tableFilters.mesAno.split('-').map(Number);
                const recDate = new Date(rec.date);
                // Ajuste para garantir comparação correta de mês/ano
                if (recDate.getMonth() + 1 !== m || recDate.getFullYear() !== y) return false;
            }
            if (tableFilters.sector !== 'Todos' && normalize(String(rec.sector)) !== normalize(tableFilters.sector)) return false;
            if (tableFilters.product && !rec.product.toLowerCase().includes(tableFilters.product.toLowerCase())) return false;
            if (tableFilters.category && !rec.category.toLowerCase().includes(tableFilters.category.toLowerCase())) return false;
            return true;
        }).sort((a, b) => a.sector.localeCompare(b.sector));
    }, [records, tableFilters]);


    const kpiData = useMemo(() => {
        const totalErrors = filteredOverviewRecords.length;
        const totalCost = filteredOverviewRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
        const totalWasted = filteredOverviewRecords.reduce((sum, r) => sum + (r.wastedQty || 0), 0);

        if (totalErrors === 0) {
            return { totalErrors, totalCost, totalWasted, mostCommonError: '-', highlightSector: '-' };
        }

        const errorFrequency = filteredOverviewRecords.reduce((acc, r) => {
            acc[r.category] = (acc[r.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const mostCommonError = Object.keys(errorFrequency).reduce((a, b) => errorFrequency[a]! > errorFrequency[b]! ? a : b);

        const sectorFrequency = filteredOverviewRecords.reduce((acc, r) => {
            acc[r.sector] = (acc[r.sector] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const highlightSector = Object.keys(sectorFrequency).reduce((a, b) => sectorFrequency[a]! > sectorFrequency[b]! ? a : b);
        return { totalErrors, totalCost, totalWasted, mostCommonError, highlightSector };
    }, [filteredOverviewRecords]);


    const chartDataBySector = useMemo(() => {
        const sectors = Object.values(Sector).filter(s => s !== Sector.MANUTENCAO);

        // Função auxiliar para normalizar e encontrar setor correspondente do enum
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const findMatchingSector = (recSector: string): Sector => {
            const normalizedRec = normalize(recSector);
            return sectors.find(s => normalize(s) === normalizedRec) || recSector as Sector;
        };

        const dataBySector = filteredOverviewRecords.reduce((acc, rec) => {
            const matchedSector = findMatchingSector(String(rec.sector));
            if (!acc[matchedSector]) {
                acc[matchedSector] = { 'Quantidade': 0, 'Custo (R$)': 0, 'Desperdício (KG)': 0 };
            }
            acc[matchedSector]['Quantidade'] += 1;
            acc[matchedSector]['Custo (R$)'] += rec.cost || 0;
            acc[matchedSector]['Desperdício (KG)'] += rec.wastedQty || 0;
            return acc;
        }, {} as Record<Sector, { 'Quantidade': number, 'Custo (R$)': number, 'Desperdício (KG)': number }>);

        return sectors.map(s => ({
            name: s,
            'Quantidade': dataBySector[s]?.['Quantidade'] || 0,
            'Custo (R$)': dataBySector[s]?.['Custo (R$)'] || 0,
            'Desperdício (KG)': Number((dataBySector[s]?.['Desperdício (KG)'] || 0).toFixed(3)),
        }));
    }, [filteredOverviewRecords]);

    const chartDataByCategory = useMemo(() => {
        const data = filteredOverviewRecords.reduce((acc, rec) => {
            const key = rec.category;
            if (!acc[key]) acc[key] = { name: key, value: 0, wasted: 0 };
            acc[key].value += 1;
            acc[key].wasted += rec.wastedQty || 0;
            return acc;
        }, {} as Record<string, { name: string, value: number, wasted: number }>);
        return Object.values(data);
    }, [filteredOverviewRecords]);


    const handleOpenModal = (record?: ErrorRecord) => {
        setCurrentRecord(record || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRecord(null);
    };

    const handleSave = async (data: Omit<ErrorRecord, 'id'>) => {
        if (!Array.isArray(records)) return;
        try {
            // Converter campos de texto para maiúsculas
            const normalizedData = {
                ...data,
                product: data.product.toUpperCase(),
                description: data.description.toUpperCase(),
                action: data.action?.toUpperCase() || ''
            };

            if (currentRecord) {
                const updated = await errorsService.update(currentRecord.id, normalizedData);
                setRecords(records.map(r => r.id === currentRecord.id ? updated : r));
            } else {
                const created = await errorsService.create(normalizedData);
                setRecords([...records, created]);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar erro:', error);
            alert('Erro ao salvar registro de erro.');
        }
    };

    const confirmDelete = async () => {
        if (!Array.isArray(records)) return;
        if (deleteId) {
            try {
                await errorsService.delete(deleteId);
                setRecords(records.filter(r => r.id !== deleteId));
                setDeleteId(null);
            } catch (error) {
                console.error('Erro ao deletar erro:', error);
                alert('Erro ao deletar registro de erro.');
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
            'Categoria': r.category,
            'Descrição': r.description,
            'Ação Tomada': r.action || '',
            'Custo (R$)': r.cost.toFixed(2),
            'Qtd. Desperdiçada (KG)': (r.wastedQty || 0).toFixed(3),
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Erros");
        XLSX.writeFile(wb, "erros_producao.xlsx");
    };

    const handleExportPDF = () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // const { jsPDF } = (window as any).jspdf; // Removido
        const doc = new jsPDF();
        doc.text("Relatório de Erros de Produção", 14, 16);
        autoTable(doc, {
            head: [['Data', 'Setor', 'Produto', 'Categoria', 'Descrição', 'Ação', 'Custo (R$)', 'Qtd. Desp. (KG)']],
            body: filteredTableRecords.map(r => [
                new Date(r.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                r.sector,
                r.product,
                r.category,
                r.description,
                r.action || '-',
                r.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                `${(r.wastedQty || 0).toFixed(3)} KG`
            ]),
            startY: 20,
        });
        doc.save('erros_producao.pdf');
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard title="Total de Erros" value={String(kpiData.totalErrors)} unit="" icon={<TriangleAlert />} color={'#F3C78A'} />
                <KpiCard title="Custo Total" value={formatBrazilianNumber(kpiData.totalCost, 2)} unit="R$" icon={<DollarSign />} color={'#E74C3C'} />
                <KpiCard title="Total Desperdiçado (KG)" value={formatBrazilianNumber(kpiData.totalWasted, 3)} unit="KG" icon={<Trash2 />} color={'#EF4444'} />
                <KpiCard title="Erro Mais Comum" value={kpiData.mostCommonError} unit="" icon={<HelpCircle />} color={'#D99B61'} enableWrap={true} />
                <KpiCard title="Setor Destaque" value={kpiData.highlightSector} unit="" icon={<Star />} color={'#B36B3C'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Erros por Setor">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartDataBySector} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis yAxisId="left" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div style={{ ...tooltipStyle, padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
                                            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.name}</p>
                                            <p>Quantidade: {data['Quantidade']}</p>
                                            <p>Custo: {data['Custo (R$)'].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            <p>Desperdício: {data['Desperdício (KG)']} KG</p>
                                        </div>
                                    );
                                }
                                return null;
                            }} />
                            <Legend wrapperStyle={{ fontSize: '14px' }} />
                            <Bar yAxisId="left" dataKey="Quantidade" fill={COLORS.secondary} barSize={24} radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="Custo (R$)" stroke={COLORS.tertiary} strokeWidth={2} dot={false} />
                            <Line yAxisId="right" dataKey="Desperdício (KG)" stroke="#00000000" strokeWidth={0} dot={false} activeDot={false} legendType="none" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Erros por Categoria">
                    {filteredOverviewRecords.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartDataByCategory}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    stroke={isDarkMode ? '#1e293b' : '#fff'}
                                >
                                    {chartDataByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(value, name, props) => {
                                    if (name === 'value') return [value, 'Quantidade'];
                                    return [value, name];
                                }} content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div style={{ ...tooltipStyle, padding: '10px', border: '1px solid #ccc' }}>
                                                <p style={{ fontWeight: 'bold' }}>{data.name}</p>
                                                <p>Quantidade: {data.value}</p>
                                                <p>Desperdício: {data.wasted.toFixed(3)} KG</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Legend wrapperStyle={{ fontSize: '14px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <p>Nenhum erro registrado para exibir o gráfico</p>
                        </div>
                    )}
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
                        Novo Erro
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 space-y-4 no-print transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Produto</label>
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={tableFilters.product}
                            onChange={(e) => setTableFilters({ ...tableFilters, product: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Categoria</label>
                        <input
                            type="text"
                            placeholder="Buscar categoria..."
                            value={tableFilters.category}
                            onChange={(e) => setTableFilters({ ...tableFilters, category: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><TriangleAlert size={20} />Registros de Erros</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3">Data</th>
                                <th className="px-6 py-3">Setor</th>
                                <th className="px-6 py-3">Produto</th>
                                <th className="px-6 py-3">Categoria</th>
                                <th className="px-6 py-3">Descrição</th>
                                <th className="px-6 py-3">Ação</th>
                                <th className="px-6 py-3 text-right">Qtd. Desp. (KG)</th>
                                <th className="px-6 py-3 text-right">Custo (R$)</th>
                                {!isEspectador() && <th className="px-6 py-3 text-center no-print">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 dark:text-gray-300">
                            {filteredTableRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-400">Nenhum erro encontrado</td>
                                </tr>
                            ) : filteredTableRecords.map(rec => (
                                <tr key={rec.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">{new Date(rec.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td className="px-6 py-4">{rec.sector}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800 dark:text-gray-100">{rec.product}</td>
                                    <td className="px-6 py-4">{rec.category}</td>
                                    <td className="px-6 py-4 truncate max-w-xs">{rec.description}</td>
                                    <td className="px-6 py-4 truncate max-w-xs">{rec.action || '-'}</td>
                                    <td className="px-6 py-4 text-right font-medium text-red-500">{rec.wastedQty ? `${rec.wastedQty}` : '-'}</td>
                                    <td className="px-6 py-4 text-right font-semibold">{rec.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
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
                <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary">Erros de Produção</h1>
                <p className="text-md text-imac-text/70 dark:text-slate-400">Gerencie os incidentes de produção e qualidade</p>
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
                title={currentRecord ? 'Editar Registro de Erro' : 'Novo Registro de Erro'}
            >
                <ErrorRecordForm record={currentRecord} onSave={handleSave} onCancel={handleCloseModal} products={products} />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Erro"
                message="Tem certeza que deseja excluir este registro de erro? Esta ação não pode ser desfeita."
            />

        </div>
    );
};

export default Errors;
