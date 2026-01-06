import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { ProductionSpeedRecord, Product, DailyProduction, ProductionObservationRecord } from '../types';
import { Sector, Unit } from '../types';
import { formatChartNumber } from '../utils/formatters';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Pencil, Trash2, TrendingUp, List, File, Activity, ArrowRight, ArrowLeftRight, FileText, Eye } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { ComposedChart, Line, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Modal, { ConfirmModal } from '../components/Modal';
import ViewModal from '../components/ViewModal';
import DatePickerInput from '../components/DatePickerInput';
import AutocompleteInput from '../components/AutocompleteInput';
import { useAuth } from '../contexts/AuthContext';
import { productionService } from '../services/modules/production';
import { productionObservationsService } from '../services/modules/productionObservations';

const COLORS = {
    primary: '#D99B61',
    secondary: '#F3C78A',
    tertiary: '#B36B3C',
    success: '#2ECC71',
    error: '#E74C3C',
};

// getMesAnoOptions removido pois agora usamos DatePickerInput com type="month"

const getCurrentMesAno = () => {
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${m}/${y}`;
};

const ProductionRecordForm: React.FC<{
    record: Partial<ProductionSpeedRecord> | null;
    onSave: (record: Omit<ProductionSpeedRecord, 'id' | 'totalRealizadoKgUnd' | 'unit'>) => void;
    onCancel: () => void;
    products: Product[];
}> = ({ record, onSave, onCancel, products }) => {

    const [formData, setFormData] = useState<Omit<ProductionSpeedRecord, 'id' | 'totalProgramado' | 'totalRealizado' | 'totalRealizadoKgUnd' | 'velocidade' | 'unit'>>({
        mesAno: record?.mesAno || getCurrentMesAno(),
        sector: record?.sector || Sector.CONFEITARIA,
        produto: record?.produto || '',
        metaMes: record?.metaMes || 0,
        dailyProduction: record?.dailyProduction || Array.from({ length: 31 }, () => ({ programado: 0, realizado: 0 })),
    });
    const [activeDayTab, setActiveDayTab] = useState(0);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

    const totals = useMemo(() => {
        if (!formData.dailyProduction) return { totalProgramado: 0, totalRealizado: 0, velocidade: 0 };
        const totalProgramado = formData.dailyProduction.reduce((sum, day) => sum + (Number(day.programado) || 0), 0);
        const totalRealizado = formData.dailyProduction.reduce((sum, day) => sum + (Number(day.realizado) || 0), 0);
        const velocidade = totalProgramado > 0 ? (totalRealizado / totalProgramado) * 100 : 0;
        return { totalProgramado, totalRealizado, velocidade };
    }, [formData.dailyProduction]);

    // Função auxiliar para normalizar strings para comparação (remove acentos e maiúsculas)
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    useEffect(() => {
        if (!Array.isArray(products)) return;
        setAvailableProducts(products.filter(p => normalize(String(p.sector)) === normalize(String(formData.sector))));
        if (record?.sector !== formData.sector) {
            setFormData(f => ({ ...f, produto: '' }));
        }
    }, [formData.sector, record?.sector, products]);

    const handleDailyChange = (dayIndex: number, field: keyof DailyProduction, value: string) => {
        const newDailyProduction = [...formData.dailyProduction];
        const updatedDay = { ...newDailyProduction[dayIndex] } as DailyProduction;
        updatedDay[field] = Number(value);
        newDailyProduction[dayIndex] = updatedDay;
        setFormData({ ...formData, dailyProduction: newDailyProduction });
    };

    const handleSave = () => {
        onSave({ ...formData, ...totals });
    };

    const dayTabs = [
        { label: 'Dias 1-7', range: [0, 6] },
        { label: 'Dias 8-14', range: [7, 13] },
        { label: 'Dias 15-21', range: [14, 20] },
        { label: 'Dias 22-28', range: [21, 27] },
        { label: 'Dias 29-31', range: [28, 30] },
    ];

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mês/Ano *</label>
                    <DatePickerInput
                        type="month"
                        value={formData.mesAno ? (() => {
                            const [m, y] = formData.mesAno.split('/');
                            return `${y}-${m}`;
                        })() : ''}
                        onChange={(date) => {
                            const [y, m] = date.split('-');
                            setFormData({ ...formData, mesAno: `${m}/${y}` });
                        }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Setor *</label>
                    <select value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value as Sector })} className={inputClass}>
                        {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto *</label>
                    <AutocompleteInput
                        value={formData.produto}
                        onChange={(value) => setFormData({ ...formData, produto: value })}
                        options={availableProducts.map(p => ({ id: p.id, name: p.name }))}
                        placeholder={formData.sector ? 'Digite o nome do produto...' : 'Selecione um setor primeiro'}
                        disabled={!formData.sector}
                        emptyMessage="Nenhum produto encontrado para este setor"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meta do Mês *</label>
                <input type="number" value={formData.metaMes || ''} onFocus={e => e.target.select()} onChange={e => setFormData({ ...formData, metaMes: Number(e.target.value) })} className={inputClass} />
            </div>

            <div className="border-t dark:border-slate-700 pt-4">
                <h3 className="text-lg font-medium text-imac-tertiary dark:text-imac-primary">Produção Diária (Programado e Realizado)</h3>
                <div className="flex space-x-1 mt-2 border-b dark:border-slate-700">
                    {dayTabs.map((tab, index) => (
                        <button key={tab.label} onClick={() => setActiveDayTab(index)} className={`px-3 py-2 text-sm font-medium rounded-t-md ${activeDayTab === index ? 'bg-imac-primary/10 dark:bg-imac-primary/20 border-b-2 border-imac-primary text-imac-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-b-md">
                    {(() => {
                        const range = dayTabs[activeDayTab]?.range as [number, number] | undefined; if (!range) return null; return Array.from({ length: range[1] - range[0] + 1 }, (_, i) => i + range[0]).map(dayIndex => (
                            <div key={dayIndex}>
                                <label className="block text-sm font-bold text-center text-gray-600 dark:text-gray-400">Dia {dayIndex + 1}</label>
                                <input type="number" placeholder="Prog" value={formData.dailyProduction[dayIndex]?.programado || ''} onFocus={e => e.target.select()} onChange={e => handleDailyChange(dayIndex, 'programado', e.target.value)} className="mt-1 block w-full text-center rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-1.5 text-sm bg-white dark:bg-slate-700 dark:text-white mb-1" />
                                <input type="number" placeholder="Real" value={formData.dailyProduction[dayIndex]?.realizado || ''} onFocus={e => e.target.select()} onChange={e => handleDailyChange(dayIndex, 'realizado', e.target.value)} className="mt-1 block w-full text-center rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-1.5 text-sm bg-white dark:bg-slate-700 dark:text-white" />
                            </div>
                        ))
                    })()}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-4 border-t dark:border-slate-700">
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Total Programado</label>
                    <input type="text" readOnly value={totals.totalProgramado} className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 p-2 text-center font-bold dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Total Realizado</label>
                    <input type="text" readOnly value={totals.totalRealizado} className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 p-2 text-center font-bold dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">QTD. EM KG/UND</label>
                    <input
                        type="text"
                        readOnly
                        value={(() => {
                            const product = availableProducts.find(p => p.name === formData.produto);
                            if (!product || !product.yield) return '-';
                            const qtd = totals.totalRealizado * product.yield;
                            const decimals = qtd % 1 === 0 ? 0 : 2;
                            return `${qtd.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })} ${product.unit}`;
                        })()}
                        className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 p-2 text-center font-bold dark:text-white"
                        title="Calculado automaticamente: Total Realizado × Rendimento"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Velocidade %</label>
                    <input type="text" readOnly value={`${totals.velocidade.toFixed(1)}%`} className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 p-2 text-center font-bold dark:text-white" />
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold">Cancelar</button>
                <button type="button" onClick={handleSave} className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold">{record?.id ? 'Salvar' : 'Criar'}</button>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENTE: ObservationRecordForm
// ============================================================================
const ObservationRecordForm: React.FC<{
    record: Partial<ProductionObservationRecord> | null;
    onSave: (record: Omit<ProductionObservationRecord, 'id'>) => void;
    onCancel: () => void;
    products: Product[];
}> = ({ record, onSave, onCancel, products }) => {

    const [formData, setFormData] = useState<Omit<ProductionObservationRecord, 'id'>>({
        date: record?.date ? new Date(record.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        sector: (record?.sector && Sector[record.sector as keyof typeof Sector]) || record?.sector || Sector.CONFEITARIA,
        product: record?.product || '',
        observationType: record?.observationType || '',
        description: record?.description || '',
        hadImpact: record?.hadImpact ?? false
    });

    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    useEffect(() => {
        if (!Array.isArray(products)) return;
        setAvailableProducts(products.filter(p => normalize(String(p.sector)) === normalize(String(formData.sector))));

        const recordSector = record?.sector ? (Sector[record.sector as keyof typeof Sector] || record.sector) : null;
        if (recordSector && recordSector !== formData.sector) {
            setFormData(f => ({ ...f, product: '' }));
        }
    }, [formData.sector, record?.sector, products]);

    const handleSave = () => {
        if (!formData.date || !formData.product || !formData.observationType || !formData.description) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        onSave(formData);
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data *</label>
                    <DatePickerInput
                        value={formData.date}
                        onChange={(date) => setFormData({ ...formData, date })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Setor *</label>
                    <select
                        value={formData.sector}
                        onChange={e => setFormData({ ...formData, sector: e.target.value as Sector })}
                        className={inputClass}
                    >
                        {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto *</label>
                    <AutocompleteInput
                        value={formData.product}
                        onChange={(value) => setFormData({ ...formData, product: value })}
                        options={availableProducts.map(p => ({ id: p.id, name: p.name }))}
                        placeholder={formData.sector ? 'Digite o nome do produto...' : 'Selecione um setor primeiro'}
                        disabled={!formData.sector}
                        emptyMessage="Nenhum produto encontrado para este setor"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Observação *</label>
                    <input
                        type="text"
                        value={formData.observationType}
                        onChange={e => setFormData({ ...formData, observationType: e.target.value })}
                        className={inputClass}
                        placeholder="Ex: Qualidade, Processo, Equipamento..."
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição *</label>
                <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className={inputClass}
                    rows={4}
                    placeholder="Descreva a observação em detalhes..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Houve Impacto na Produção? *</label>
                <select
                    value={formData.hadImpact ? 'SIM' : 'NÃO'}
                    onChange={e => setFormData({ ...formData, hadImpact: e.target.value === 'SIM' })}
                    className={inputClass}
                >
                    <option value="NÃO">NÃO</option>
                    <option value="SIM">SIM</option>
                </select>
            </div>

            <div className="flex justify-end pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold"
                >
                    {record?.id ? 'Salvar' : 'Criar'}
                </button>
            </div>
        </div>
    );
};

interface ProductionSpeedProps {
    products: Product[];
    records: ProductionSpeedRecord[];
    setRecords: React.Dispatch<React.SetStateAction<ProductionSpeedRecord[]>>;
    observationRecords: ProductionObservationRecord[];
    setObservationRecords: React.Dispatch<React.SetStateAction<ProductionObservationRecord[]>>;
    isDarkMode: boolean;
}

const ProductionSpeed: React.FC<ProductionSpeedProps> = ({ products, records, setRecords, observationRecords, setObservationRecords, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<ProductionSpeedRecord | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [overviewFilters, setOverviewFilters] = useState({
        start: '',
        end: ''
    });

    const [tableFilters, setTableFilters] = useState({
        mesAno: '',
        sector: 'Todos',
        product: ''
    });

    // Estados para observações
    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [currentObservation, setCurrentObservation] = useState<ProductionObservationRecord | null>(null);
    const [deleteObservationId, setDeleteObservationId] = useState<number | null>(null);
    const [observationFilters, setObservationFilters] = useState({
        date: '',
        sector: 'Todos',
        product: '',
        observationType: ''
    });

    // Estados para visualização genérica (Records e Observations)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState<any | null>(null);
    const [viewTitle, setViewTitle] = useState('');
    const [viewFields, setViewFields] = useState<any[]>([]);

    const { canCreate, canEdit, canDelete, isEspectador } = useAuth();

    const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
    const tickColor = isDarkMode ? '#94a3b8' : '#94a3b8';

    const tooltipStyle = {
        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
        borderColor: isDarkMode ? '#334155' : '#fff',
        color: isDarkMode ? '#f1f5f9' : '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    };

    // Propriedades padronizadas do XAxis para corresponder à configuração do Dashboard
    const xAxisProps = {
        tick: { fill: tickColor, fontSize: 11 },
        axisLine: false,
        tickLine: false,
        interval: 0,
        angle: 0,
        textAnchor: 'middle' as const,
        height: 50
    };

    const filteredOverviewRecords = useMemo(() => {
        if (!Array.isArray(records)) return [];
        return records.filter(rec => {
            const [month, year] = rec.mesAno.split('/');
            const recordDate = new Date(Number(year), Number(month) - 1, 1);

            if (overviewFilters.start) {
                const startDate = new Date(overviewFilters.start);
                startDate.setHours(0, 0, 0, 0);
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
        return records.filter(rec => {
            if (tableFilters.mesAno) {
                const [y, m] = tableFilters.mesAno.split('-');
                if (rec.mesAno !== `${m}/${y}`) return false;
            }
            if (tableFilters.sector !== 'Todos' && rec.sector !== tableFilters.sector) return false;
            if (tableFilters.product && !rec.produto?.toLowerCase().includes(tableFilters.product.toLowerCase())) return false;
            return true;
        }).sort((a, b) => a.sector.localeCompare(b.sector));
    }, [records, tableFilters]);

    const kpiData = useMemo(() => {
        if (filteredOverviewRecords.length === 0) {
            return { metaMes: 0, programado: 0, realizado: 0, diferenca: 0, mediaDiaria: 0, velocidade: 0 };
        }

        const programado = filteredOverviewRecords.reduce((sum, r) => sum + r.totalProgramado, 0);
        const realizado = filteredOverviewRecords.reduce((sum, r) => sum + r.totalRealizado, 0);
        const metaMes = filteredOverviewRecords.reduce((sum, r) => sum + r.metaMes, 0);

        // Subtração correta: Realizado - Programado
        // Negativo = Déficit (Ruim)
        // Positivo = Superávit (Bom)
        const diferenca = realizado - programado;

        const velocidade = programado > 0 ? (realizado / programado) * 100 : 0;

        const totalDaysWithProduction = filteredOverviewRecords.reduce((sum, r) => {
            return sum + (r.dailyProduction ? r.dailyProduction.filter(d => d.realizado > 0).length : 0);
        }, 0);
        const mediaDiaria = totalDaysWithProduction > 0 ? realizado / totalDaysWithProduction : 0;

        return { metaMes, programado, realizado, diferenca, mediaDiaria, velocidade };
    }, [filteredOverviewRecords]);

    // Lógica para os gráficos de "Top Piores" por setor
    const getProductPerformance = useCallback((sector: Sector) => {
        // 1. Agrupar dados por produto
        const productMap = new Map<string, { programado: number; realizado: number }>();

        filteredOverviewRecords
            .filter(r => r.sector === sector)
            .forEach(r => {
                const current = productMap.get(r.produto) || { programado: 0, realizado: 0 };
                productMap.set(r.produto, {
                    programado: current.programado + r.totalProgramado,
                    realizado: current.realizado + r.totalRealizado
                });
            });

        let products = Array.from(productMap.entries()).map(([name, stats]) => ({
            name,
            programado: stats.programado,
            realizado: stats.realizado,
            diferenca: stats.realizado - stats.programado
        }));

        // 2. Filtrar apenas os negativos (diferença < 0)
        products = products.filter(p => p.diferenca < 0);

        // 3. Ordenar do menor (mais negativo) para o maior
        products.sort((a, b) => a.diferenca - b.diferenca);

        // 4. Regra de desempate (Top 5 ou 4 se houver empate entre 5º e 6º)
        if (products.length >= 6) {
            const diff5 = products[4]!.diferenca;
            const diff6 = products[5]!.diferenca;
            if (diff5 === diff6) {
                return products.slice(0, 4);
            }
        }

        return products.slice(0, 5);
    }, [filteredOverviewRecords]);

    const paesData = useMemo(() => getProductPerformance(Sector.PAES), [getProductPerformance]);
    const salgadoData = useMemo(() => getProductPerformance(Sector.SALGADO), [getProductPerformance]);
    const confeitariaData = useMemo(() => getProductPerformance(Sector.CONFEITARIA), [getProductPerformance]);
    const paoQueijoData = useMemo(() => getProductPerformance(Sector.PAO_DE_QUEIJO), [getProductPerformance]);

    const handleOpenModal = (record?: ProductionSpeedRecord) => {
        setCurrentRecord(record || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRecord(null);
    };

    const handleSave = async (data: Omit<ProductionSpeedRecord, 'id' | 'totalRealizadoKgUnd' | 'unit'>) => {
        if (!Array.isArray(records)) return;
        try {
            if (currentRecord) {
                // Atualizar registro existente
                await productionService.update(currentRecord.id, data);
            } else {
                // Criar novo registro
                await productionService.create(data);
            }
            // Recarregar todos os registros para garantir consistência (especialmente campos computados)
            const updatedRecords = await productionService.getAll();
            setRecords(updatedRecords);
            handleCloseModal();
        } catch (error: any) {
            console.error('Erro ao salvar registro:', error);
            const msg = error.response?.data?.message || 'Erro ao salvar registro de produção.';
            const details = error.response?.data?.errors?.map((e: any) => `- ${e.field}: ${e.message}`).join('\n') || '';
            alert(`${msg}\n${details}`);
        }
    };

    const confirmDelete = async () => {
        if (!Array.isArray(records)) return;
        if (deleteId) {
            try {
                await productionService.delete(deleteId);
                const updatedRecords = await productionService.getAll();
                setRecords(updatedRecords);
                setDeleteId(null);
            } catch (error) {
                console.error('Erro ao deletar registro:', error);
                alert('Erro ao deletar registro de produção.');
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
        const dataToExport = filteredTableRecords.map(r => {
            const [m, y] = r.mesAno.split('/');
            const year = Number(y);
            const month = Number(m) - 1;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let weeks = 0;
            for (let d = 1; d <= daysInMonth; d++) {
                if (new Date(year, month, d).getDay() === 1) weeks++;
            }
            if (weeks < 4) weeks = 4;
            const weeklyMeta = Math.round(r.metaMes / weeks);

            return {
                'Mês/Ano': r.mesAno,
                'Setor': r.sector,
                'Produto': r.produto,
                'Meta Mês': r.metaMes,
                'Qtd Por Semana': weeklyMeta,
                'Total Programado': r.totalProgramado,
                'Total Realizado': r.totalRealizado,
                'Velocidade (%)': r.velocidade.toFixed(1),
            };
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Velocidade");
        XLSX.writeFile(wb, "velocidade_producao.xlsx");
    };

    const handleExportPDF = () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        // const { jsPDF } = (window as any).jspdf; // Removido
        const doc = new jsPDF();
        doc.text("Relatório de Velocidade de Produção", 14, 16);
        autoTable(doc, {
            head: [['Mês/Ano', 'Setor', 'Produto', 'Meta Mês', 'Qtd/Semana', 'Programado', 'Realizado', 'Velocidade %']],
            body: filteredTableRecords.map(r => {
                const [m, y] = r.mesAno.split('/');
                const year = Number(y);
                const month = Number(m) - 1;
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                let weeks = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                    if (new Date(year, month, d).getDay() === 1) weeks++;
                }
                if (weeks < 4) weeks = 4;
                const weeklyMeta = Math.round(r.metaMes / weeks).toLocaleString();

                return [
                    r.mesAno,
                    r.sector,
                    r.produto,
                    r.metaMes,
                    weeklyMeta,
                    r.totalProgramado,
                    r.totalRealizado,
                    r.velocidade.toFixed(1) + '%',
                ]
            }),
            startY: 20,
        });
        doc.save('velocidade_producao.pdf');
    };

    const chartData = useMemo(() => {
        const sectors = Object.values(Sector).filter(s => s !== Sector.MANUTENCAO);
        const dataBySector = filteredOverviewRecords.reduce((acc, rec) => {
            if (!acc[rec.sector]) {
                acc[rec.sector] = { realizado: 0, programado: 0, count: 0 };
            }
            acc[rec.sector].realizado += rec.totalRealizado;
            acc[rec.sector].programado += rec.totalProgramado;
            acc[rec.sector].count++;
            return acc;
        }, {} as Record<Sector, { realizado: number, programado: number, count: number }>);

        return sectors.map(s => {
            const p = dataBySector[s]?.programado || 0;
            const r = dataBySector[s]?.realizado || 0;
            const velocidade = p > 0 ? (r / p) * 100 : 0;
            return {
                name: s,
                'Realizado': r,
                'Programado': p,
                'Velocidade %': velocidade,
                'Meta 100%': 100,
            };
        });
    }, [filteredOverviewRecords]);

    // Tooltip personalizado para os gráficos de diferença
    const CustomPerformanceTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                    padding: '10px',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f1f5f9' : '#1e293b',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <p className="font-bold mb-1">{label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Programado: {data.programado}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Realizado: {data.realizado}</p>
                    <p className="text-sm font-semibold text-red-500 mt-1">Diferença: {data.diferenca}</p>
                </div>
            );
        }
        return null;
    };

    // ============================================================================
    // HANDLERS PARA OBSERVAÇÕES
    // ============================================================================
    const handleOpenObservationModal = (observation?: ProductionObservationRecord) => {
        setCurrentObservation(observation || null);
        setIsObservationModalOpen(true);
    };

    const handleCloseObservationModal = () => {
        setIsObservationModalOpen(false);
        setCurrentObservation(null);
    };

    const handleSaveObservation = async (data: Omit<ProductionObservationRecord, 'id'>) => {
        if (!Array.isArray(observationRecords)) return;
        try {
            if (currentObservation) {
                await productionObservationsService.update(currentObservation.id, data);
            } else {
                await productionObservationsService.create(data);
            }
            const updatedRecords = await productionObservationsService.getAll();
            setObservationRecords(updatedRecords);
            handleCloseObservationModal();
        } catch (error: any) {
            console.error('Erro ao salvar observação:', error);
            const msg = error.response?.data?.message || 'Erro ao salvar observação.';
            const details = error.response?.data?.errors?.map((e: any) => `- ${e.field}: ${e.message}`).join('\n') || '';
            alert(`${msg}\n${details}`);
        }
    };

    const confirmDeleteObservation = async () => {
        if (!Array.isArray(observationRecords)) return;
        if (deleteObservationId) {
            try {
                await productionObservationsService.delete(deleteObservationId);
                const updatedRecords = await productionObservationsService.getAll();
                setObservationRecords(updatedRecords);
                setDeleteObservationId(null);
            } catch (error) {
                console.error('Erro ao deletar observação:', error);
                alert('Erro ao deletar observação.');
            }
        }
    };

    const handleDeleteObservationClick = (id: number) => {
        setDeleteObservationId(id);
    };

    const handleViewRecord = (rec: ProductionSpeedRecord) => {
        setViewData(rec);
        setViewTitle('Detalhes do Registro');
        setViewFields([
            { label: 'Mês/Ano', key: 'mesAno' },
            { label: 'Setor', key: 'sector' },
            { label: 'Produto', key: 'produto' },
            { label: 'Meta Mês', key: 'metaMes' },
            { label: 'Programado', key: 'totalProgramado' },
            { label: 'Realizado', key: 'totalRealizado' },
            { label: 'Velocidade', key: 'velocidade', format: (v: number) => `${v.toFixed(1)}%` },
        ]);
        setIsViewModalOpen(true);
    };

    const handleViewObservation = (rec: ProductionObservationRecord) => {
        setViewData(rec);
        setViewTitle('Detalhes da Observação');
        setViewFields([
            { label: 'Data', key: 'date', format: (v: string) => new Date(v).toLocaleDateString('pt-BR') },
            { label: 'Setor', key: 'sector' },
            { label: 'Produto', key: 'product' },
            { label: 'Tipo', key: 'observationType' },
            { label: 'Impacto', key: 'hadImpact', format: (v: boolean) => v ? 'SIM' : 'NÃO' },
            { label: 'Descrição', key: 'description' },
        ]);
        setIsViewModalOpen(true);
    };

    // ============================================================================
    // FILTROS E EXPORTAÇÃO PARA OBSERVAÇÕES
    // ============================================================================
    const filteredObservations = useMemo(() => {
        if (!Array.isArray(observationRecords)) return [];
        return observationRecords.filter(rec => {
            if (observationFilters.date && rec.date.substring(0, 7) !== observationFilters.date) return false;

            const readableSector = Sector[rec.sector as keyof typeof Sector] || rec.sector;

            if (observationFilters.sector !== 'Todos' && readableSector !== observationFilters.sector) return false;
            if (observationFilters.product && !rec.product?.toLowerCase().includes(observationFilters.product.toLowerCase())) return false;
            if (observationFilters.observationType && !rec.observationType?.toLowerCase().includes(observationFilters.observationType.toLowerCase())) return false;
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [observationRecords, observationFilters]);

    const handleExportObservationsXLSX = () => {
        if (filteredObservations.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const dataToExport = filteredObservations.map(r => ({
            'Data': new Date(r.date).toLocaleDateString('pt-BR'),
            'Setor': (Sector[r.sector as keyof typeof Sector] || r.sector).toUpperCase(),
            'Produto': r.product.toUpperCase(),
            'Tipo de Observação': r.observationType.toUpperCase(),
            'Descrição': r.description,
            'Houve Impacto?': r.hadImpact ? 'SIM' : 'NÃO'
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Observações");
        XLSX.writeFile(wb, "observacoes_producao.xlsx");
    };

    const handleExportObservationsPDF = () => {
        if (filteredObservations.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const doc = new jsPDF();
        doc.text("Relatório de Observações de Produção", 14, 16);
        autoTable(doc, {
            head: [['Data', 'Setor', 'Produto', 'Tipo', 'Descrição', 'Impacto?']],
            body: filteredObservations.map(r => [
                new Date(r.date).toLocaleDateString('pt-BR'),
                (Sector[r.sector as keyof typeof Sector] || r.sector).toUpperCase(),
                r.product.toUpperCase(),
                r.observationType.toUpperCase(),
                r.description.substring(0, 50) + (r.description.length > 50 ? '...' : ''),
                r.hadImpact ? 'SIM' : 'NÃO'
            ]),
            startY: 20,
        });
        doc.save('observacoes_producao.pdf');
    };

    // ============================================================================
    // RENDER: OBSERVAÇÕES
    // ============================================================================
    const renderObservations = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 no-print">
                <div className="flex items-center gap-2">
                    <button onClick={handleExportObservationsXLSX} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-green-600 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition text-sm font-medium">
                        <File size={16} /> Exportar XLSX
                    </button>
                    <button onClick={handleExportObservationsPDF} className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-red-600 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition text-sm font-medium">
                        <File size={16} /> Exportar PDF
                    </button>
                </div>
                {canCreate() && (
                    <button onClick={() => handleOpenObservationModal()} className="flex items-center justify-center bg-imac-success text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold">
                        <Plus size={20} className="mr-2" />
                        Nova Observação
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 space-y-4 no-print transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Data</label>
                        <DatePickerInput
                            value={observationFilters.date}
                            type="month"
                            onChange={(date) => setObservationFilters({ ...observationFilters, date })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Setor</label>
                        <select
                            value={observationFilters.sector}
                            onChange={(e) => setObservationFilters({ ...observationFilters, sector: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        >
                            <option value="Todos">TODOS</option>
                            {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Produto</label>
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={observationFilters.product}
                            onChange={(e) => setObservationFilters({ ...observationFilters, product: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo de Observação</label>
                        <input
                            type="text"
                            placeholder="Buscar tipo..."
                            value={observationFilters.observationType}
                            onChange={(e) => setObservationFilters({ ...observationFilters, observationType: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><FileText size={20} />Observações de Produção</h3>
                <div className="overflow-x-auto w-full">
                    <div className="min-w-[800px]">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Setor</th>
                                    <th className="px-6 py-3">Produto</th>
                                    <th className="px-6 py-3">Tipo de Observação</th>
                                    <th className="px-6 py-3">Descrição</th>
                                    <th className="px-6 py-3 text-center">Houve Impacto?</th>
                                    <th className="px-6 py-3 text-center no-print">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 dark:text-gray-300">
                                {filteredObservations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-400">Nenhuma observação encontrada</td>
                                    </tr>
                                ) : filteredObservations.map(rec => (
                                    <tr key={rec.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4">{(Sector[rec.sector as keyof typeof Sector] || rec.sector).toUpperCase()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{rec.product.toUpperCase()}</td>
                                        <td className="px-6 py-4">{rec.observationType.toUpperCase()}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={rec.description}>{rec.description}</td>
                                        <td className="px-6 py-4 text-center font-semibold">{rec.hadImpact ? 'SIM' : 'NÃO'}</td>
                                        <td className="px-6 py-4 flex justify-center items-center gap-2 no-print">
                                            <button type="button" onClick={() => handleViewObservation(rec)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors" title="Visualizar">
                                                <Eye size={18} />
                                            </button>
                                            {!isEspectador() && (
                                                <>
                                                    {canEdit() && (
                                                        <button type="button" onClick={() => handleOpenObservationModal(rec)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Editar"><Pencil size={18} /></button>
                                                    )}
                                                    {canDelete() && (
                                                        <button type="button" onClick={() => handleDeleteObservationClick(rec.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" title="Excluir"><Trash2 size={18} /></button>
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
            </div>
        </div>
    );

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
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard title="Meta do Mês" value={kpiData.metaMes.toLocaleString()} unit="" icon={<Activity />} color={COLORS.secondary} />
                <KpiCard title="Programado" value={kpiData.programado.toLocaleString()} unit="" icon={<List />} color={COLORS.secondary} />
                <KpiCard title="Realizado" value={kpiData.realizado.toLocaleString()} unit="" icon={<TrendingUp />} color={COLORS.success} />
                <KpiCard
                    title="Diferença"
                    value={`${kpiData.diferenca > 0 ? '+' : ''}${kpiData.diferenca.toLocaleString()}`}
                    unit=""
                    icon={<ArrowLeftRight />}
                    color={kpiData.diferenca >= 0 ? COLORS.success : COLORS.error}
                />
                <KpiCard title="Média Diária" value={kpiData.mediaDiaria.toFixed(1)} unit="" icon={<File />} color={COLORS.primary} />
                <KpiCard title="Velocidade" value={kpiData.velocidade.toFixed(1)} unit="%" icon={<Activity />} color={COLORS.primary} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Total Realizado por Setor">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                xAxisId="0"
                                {...xAxisProps}
                            />
                            <XAxis
                                dataKey="name"
                                xAxisId="1"
                                hide
                            />
                            <YAxis yAxisId="left" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} iconType="circle" />
                            <Bar yAxisId="left" xAxisId="0" dataKey="Programado" fill="#64748B" barSize={45} radius={[4, 4, 0, 0]}>
                            </Bar>
                            <Bar yAxisId="left" xAxisId="1" dataKey="Realizado" fill={COLORS.primary} barSize={45} radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="Realizado" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#D99B61', fontSize: 16, fontWeight: 600 }} />
                            </Bar>
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Velocidade % por Setor">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis tickFormatter={(tick) => `${Number(tick).toFixed(0)}%`} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => name === 'Velocidade %' ? [`${Number(value).toFixed(2)}%`, name] : [value, name]} />
                            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} iconType="circle" />
                            <Bar dataKey="Velocidade %" fill={COLORS.primary} barSize={45} radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="Velocidade %" position="top" formatter={(v) => `${formatChartNumber(Number(v))}%`} style={{ fill: '#D99B61', fontSize: 16, fontWeight: 600 }} />
                            </Bar>
                            <Line type="monotone" dataKey="Meta 100%" stroke={COLORS.success} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>

            {/* Novos Gráficos de Pior Desempenho por Setor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-700">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 col-span-full">Produtos Abaixo do Programado</h3>

                {/* Pães */}
                <ChartContainer title={`Pães`}>
                    {paesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paesData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" {...xAxisProps} />
                                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomPerformanceTooltip />} />
                                <Bar dataKey="diferenca" fill={COLORS.error} barSize={45} radius={[4, 4, 0, 0]} name="Diferença">
                                    <LabelList dataKey="diferenca" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#E74C3C', fontSize: 16, fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="flex items-center justify-center h-full text-gray-400">Nenhum produto abaixo da meta</div>}
                </ChartContainer>

                {/* Pão de Queijo */}
                <ChartContainer title={`Pão de Queijo`}>
                    {paoQueijoData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paoQueijoData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" {...xAxisProps} />
                                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomPerformanceTooltip />} />
                                <Bar dataKey="diferenca" fill={COLORS.error} barSize={45} radius={[4, 4, 0, 0]} name="Diferença">
                                    <LabelList dataKey="diferenca" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#E74C3C', fontSize: 16, fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="flex items-center justify-center h-full text-gray-400">Nenhum produto abaixo da meta</div>}
                </ChartContainer>

                {/* Salgado */}
                <ChartContainer title={`Salgado`}>
                    {salgadoData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salgadoData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" {...xAxisProps} />
                                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomPerformanceTooltip />} />
                                <Bar dataKey="diferenca" fill={COLORS.error} barSize={45} radius={[4, 4, 0, 0]} name="Diferença">
                                    <LabelList dataKey="diferenca" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#E74C3C', fontSize: 16, fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="flex items-center justify-center h-full text-gray-400">Nenhum produto abaixo da meta</div>}
                </ChartContainer>

                {/* Confeitaria */}
                <ChartContainer title={`Confeitaria`}>
                    {confeitariaData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={confeitariaData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" {...xAxisProps} />
                                <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomPerformanceTooltip />} />
                                <Bar dataKey="diferenca" fill={COLORS.error} barSize={45} radius={[4, 4, 0, 0]} name="Diferença">
                                    <LabelList dataKey="diferenca" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#E74C3C', fontSize: 16, fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="flex items-center justify-center h-full text-gray-400">Nenhum produto abaixo da meta</div>}
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
                        Novo Registro
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
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><List size={20} />Registros de Produção</h3>
                <div className="overflow-x-auto w-full">
                    <div className="min-w-[800px]">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3">Mês/Ano</th>
                                    <th className="px-6 py-3">Setor</th>
                                    <th className="px-6 py-3">Produto</th>
                                    <th className="px-6 py-3 text-center">Meta Mês</th>
                                    <th className="px-6 py-3 text-center">QTD POR SEMANA</th>
                                    <th className="px-6 py-3 text-center">Programado</th>
                                    <th className="px-6 py-3 text-center">Realizado</th>
                                    <th className="px-6 py-3 text-center">QTD. EM KG/UND</th>
                                    <th className="px-6 py-3 text-center">Velocidade %</th>
                                    <th className="px-6 py-3 text-center no-print">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 dark:text-gray-300">
                                {filteredTableRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-10 text-gray-400">Nenhum registro encontrado</td>
                                    </tr>
                                ) : filteredTableRecords.map(rec => (
                                    <tr key={rec.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">{rec.mesAno}</td>
                                        <td className="px-6 py-4">{rec.sector}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{rec.produto}</td>
                                        <td className="px-6 py-4 text-center">{rec.metaMes}</td>
                                        <td className="px-6 py-4 text-center font-medium text-gray-600 dark:text-gray-300">
                                            {(() => {
                                                const [m, y] = rec.mesAno.split('/');
                                                // Dia 0 do próximo mês retorna o último dia do mês atual
                                                const daysInMonth = new Date(Number(y), Number(m), 0).getDate();

                                                // Conta segundas-feiras para estimar semanas de produção
                                                let weeks = 0;
                                                for (let d = 1; d <= daysInMonth; d++) {
                                                    const day = new Date(Number(y), Number(m) - 1, d).getDay();
                                                    if (day === 1) weeks++; // Conta segundas-feiras
                                                }
                                                // Fallback para 4 se algo der errado ou se for um mês atípico de produção
                                                if (weeks < 4) weeks = 4;

                                                const weeklyMeta = rec.metaMes / weeks;
                                                return Math.round(weeklyMeta).toLocaleString();
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-center">{rec.totalProgramado}</td>
                                        <td className="px-6 py-4 text-center">{rec.totalRealizado}</td>
                                        <td className="px-6 py-4 text-center">
                                            {rec.totalRealizadoKgUnd ? (() => {
                                                const decimals = rec.totalRealizadoKgUnd % 1 === 0 ? 0 : 2;
                                                return `${rec.totalRealizadoKgUnd.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })} ${rec.unit || 'UND'}`;
                                            })() : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-center">{rec.velocidade.toFixed(1)}%</td>
                                        <td className="px-6 py-4 flex justify-center items-center gap-2 no-print">
                                            <button type="button" onClick={() => handleViewRecord(rec)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors" title="Visualizar">
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
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="mb-2 no-print">
                <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary">Velocidade de Produção</h1>
                <p className="text-md text-imac-text/70 dark:text-slate-400">Analise o desempenho da produção em relação às metas</p>
            </div>

            <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-lg flex space-x-1 max-w-xl no-print transition-colors">
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
                <button
                    onClick={() => setActiveTab('observations')}
                    className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'observations' ? 'bg-white dark:bg-slate-600 text-imac-tertiary dark:text-white shadow' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                >
                    <FileText size={16} className="mr-2" />
                    Observações
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'overview' ? renderOverview() : activeTab === 'records' ? renderRecords() : renderObservations()}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentRecord ? 'Editar Registro de Produção' : 'Novo Registro de Produção'}
            >
                <ProductionRecordForm record={currentRecord} onSave={handleSave} onCancel={handleCloseModal} products={products} />
            </Modal>

            <Modal
                isOpen={isObservationModalOpen}
                onClose={handleCloseObservationModal}
                title={currentObservation ? 'Editar Observação' : 'Nova Observação'}
            >
                <ObservationRecordForm record={currentObservation} onSave={handleSaveObservation} onCancel={handleCloseObservationModal} products={products} />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Registro"
                message="Tem certeza que deseja excluir este registro de produção? Esta ação não pode ser desfeita."
            />

            <ConfirmModal
                isOpen={!!deleteObservationId}
                onClose={() => setDeleteObservationId(null)}
                onConfirm={confirmDeleteObservation}
                title="Excluir Observação"
                message="Tem certeza que deseja excluir esta observação? Esta ação não pode ser desfeita."
            />

            <ViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={viewTitle}
                data={viewData}
                fields={viewFields}
            />

        </div>
    );
};

export default ProductionSpeed;
