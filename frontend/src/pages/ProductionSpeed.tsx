import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { ProductionSpeedRecord, Product, DailyProduction, ProductionObservationRecord } from '../types';
import { Sector, Unit } from '../types';
import { formatChartNumber } from '../utils/formatters';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plus, Pencil, Trash2, TrendingUp, List, File, Activity, ArrowRight, ArrowLeftRight, FileText, Eye, ChevronDown, ChevronRight, Calendar, AlertTriangle, Tag, Briefcase } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { ComposedChart, Line, Bar, BarChart, PieChart, Pie, Cell, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
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
    pie: ['#34D399', '#FBBF24', '#F87171', '#60A5FA', '#A78BFA', '#F472B6', '#22D3EE', '#FB923C', '#A3E635', '#818CF8'] // Emerald, Amber, Red, Blue, Violet, Pink, Cyan, Orange, Lime, Indigo
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

// ============================================================================
// COMPONENTE: BulkRegistrationModal
// ============================================================================
const BulkRegistrationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mesAno: string, selectedSectors: Sector[]) => void;
    products: Product[];
}> = ({ isOpen, onClose, onConfirm, products }) => {
    const [mesAno, setMesAno] = useState('');
    const [selectedSectors, setSelectedSectors] = useState<Sector[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const availableSectors = Object.values(Sector).filter(s => s !== Sector.MANUTENCAO);

    // Contar produtos por setor
    const productCountBySector = useMemo(() => {
        const counts: Record<string, number> = {};
        availableSectors.forEach(sector => {
            counts[sector] = products.filter(p => p.sector === sector).length;
        });
        return counts;
    }, [products]);

    const totalProductsToCreate = useMemo(() => {
        return selectedSectors.reduce((sum, sector) => sum + (productCountBySector[sector] || 0), 0);
    }, [selectedSectors, productCountBySector]);

    const toggleSector = (sector: Sector) => {
        setSelectedSectors(prev =>
            prev.includes(sector)
                ? prev.filter(s => s !== sector)
                : [...prev, sector]
        );
    };

    const toggleAll = () => {
        if (selectedSectors.length === availableSectors.length) {
            setSelectedSectors([]);
        } else {
            setSelectedSectors(availableSectors);
        }
    };

    const handleConfirm = () => {
        if (!mesAno) {
            alert('Por favor, selecione o mês/ano.');
            return;
        }
        if (selectedSectors.length === 0) {
            alert('Por favor, selecione pelo menos um setor.');
            return;
        }
        onConfirm(mesAno, selectedSectors);
        handleClose();
    };

    const handleClose = () => {
        setMesAno('');
        setSelectedSectors([]);
        setIsLoading(false);
        onClose();
    };

    useEffect(() => {
        if (isOpen && !mesAno) {
            setMesAno(getCurrentMesAno());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-imac-tertiary dark:text-imac-primary">Registro Geral de Produção</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Crie registros para todos os produtos dos setores selecionados de uma vez
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Mês/Ano */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mês/Ano *
                        </label>
                        <DatePickerInput
                            type="month"
                            value={mesAno ? (() => {
                                const [m, y] = mesAno.split('/');
                                return `${y}-${m}`;
                            })() : ''}
                            onChange={(date) => {
                                const [y, m] = date.split('-');
                                setMesAno(`${m}/${y}`);
                            }}
                        />
                    </div>

                    {/* Seleção de Setores */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Selecione os Setores *
                            </label>
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="text-xs text-imac-primary hover:text-imac-tertiary font-medium"
                            >
                                {selectedSectors.length === availableSectors.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableSectors.map(sector => (
                                <label
                                    key={sector}
                                    className={`
                                        flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all
                                        ${selectedSectors.includes(sector)
                                            ? 'border-imac-primary bg-imac-primary/5 dark:bg-imac-primary/10'
                                            : 'border-gray-200 dark:border-slate-600 hover:border-imac-primary/50'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedSectors.includes(sector)}
                                            onChange={() => toggleSector(sector)}
                                            className="w-4 h-4 text-imac-primary rounded focus:ring-imac-primary"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {sector}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                                        {productCountBySector[sector] || 0} produto{productCountBySector[sector] !== 1 ? 's' : ''}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Resumo */}
                    {totalProductsToCreate > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <span className="font-bold">{totalProductsToCreate}</span> registro{totalProductsToCreate !== 1 ? 's' : ''} será{totalProductsToCreate !== 1 ? 'ão' : ''} criado{totalProductsToCreate !== 1 ? 's' : ''} com valores zerados.
                                <br />
                                <span className="text-xs">Você poderá editar cada registro individualmente depois.</span>
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading || selectedSectors.length === 0}
                        className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Plus size={18} />
                                Criar Registros
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ProductionSpeedProps {
    products: Product[];
    isDarkMode: boolean;
}

const ProductionSpeed: React.FC<ProductionSpeedProps> = ({ products, isDarkMode }) => {
    // Estados locais para dados carregados sob demanda
    const [records, setRecords] = useState<ProductionSpeedRecord[]>([]);
    const [observationRecords, setObservationRecords] = useState<ProductionObservationRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Carregar dados ao montar o componente
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [speeds, observations] = await Promise.all([
                    productionService.getAll(),
                    productionObservationsService.getAll()
                ]);
                setRecords(speeds);
                setObservationRecords(observations);
            } catch (error) {
                console.error('Erro ao carregar dados de velocidade:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

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

    // Estados para registro em massa
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // Estado para exclusão em massa por mês
    const [deleteMonthData, setDeleteMonthData] = useState<{ mesAno: string; recordIds: number[] } | null>(null);

    // Estados para accordion de observações
    const [openObservationDates, setOpenObservationDates] = useState<string[]>([]);
    const [deleteObservationDateData, setDeleteObservationDateData] = useState<{ date: string; observationIds: number[] } | null>(null);

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

    // ============================================================================
    // ESTADOS E LÓGICA PARA ACCORDION (AGRUPAMENTO POR MÊS)
    // ============================================================================
    const [openMonths, setOpenMonths] = useState<string[]>([]);

    const groupedRecords = useMemo(() => {
        const groups: Record<string, ProductionSpeedRecord[]> = {};

        // Agrupar registros
        filteredTableRecords.forEach(rec => {
            if (!groups[rec.mesAno]) {
                groups[rec.mesAno] = [];
            }
            groups[rec.mesAno]!.push(rec);
        });

        // Ordenar os grupos por data (mais recente primeiro)
        return Object.entries(groups).sort((a, b) => {
            const [mA, yA] = a[0].split('/');
            const [mB, yB] = b[0].split('/');
            return new Date(Number(yB), Number(mB) - 1).getTime() - new Date(Number(yA), Number(mA) - 1).getTime();
        });
    }, [filteredTableRecords]);

    // Abrir o primeiro grupo por padrão quando os dados carregarem
    useEffect(() => {
        if (groupedRecords.length > 0 && openMonths.length === 0) {
            const firstMonth = groupedRecords[0]?.[0];
            if (firstMonth) {
                setOpenMonths([firstMonth]);
            }
        }
    }, [groupedRecords.length]);

    const toggleMonth = (month: string) => {
        setOpenMonths(prev =>
            prev.includes(month)
                ? prev.filter(m => m !== month)
                : [...prev, month]
        );
    };

    const formatMonthYear = (mesAno: string) => {
        const [m, y] = mesAno.split('/');
        const date = new Date(Number(y), Number(m) - 1, 1);
        const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

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

    const handleBulkRegistration = async (mesAno: string, selectedSectors: Sector[]) => {
        try {
            // Filtrar produtos dos setores selecionados
            const productsToCreate = products.filter(p => selectedSectors.includes(p.sector));

            if (productsToCreate.length === 0) {
                alert('Nenhum produto encontrado para os setores selecionados.');
                return;
            }

            // Criar registros com valores zerados
            const recordsToCreate = productsToCreate.map(product => ({
                mesAno,
                sector: product.sector,
                produto: product.name,
                metaMes: 0,
                dailyProduction: Array.from({ length: 31 }, () => ({ programado: 0, realizado: 0 })),
                totalProgramado: 0,
                totalRealizado: 0,
                velocidade: 0
            }));

            // Criar registros sequencialmente com feedback
            let created = 0;
            let errors = 0;

            for (const record of recordsToCreate) {
                try {
                    await productionService.create(record);
                    created++;
                } catch (error: any) {
                    console.error(`Erro ao criar registro para ${record.produto}:`, error);
                    errors++;
                }
            }

            // Recarregar registros
            const updatedRecords = await productionService.getAll();
            setRecords(updatedRecords);

            // Feedback ao usuário
            if (errors === 0) {
                alert(`✅ ${created} registro${created !== 1 ? 's' : ''} criado${created !== 1 ? 's' : ''} com sucesso!`);
            } else {
                alert(`⚠️ ${created} registro${created !== 1 ? 's' : ''} criado${created !== 1 ? 's' : ''} com sucesso.\n${errors} erro${errors !== 1 ? 's' : ''} encontrado${errors !== 1 ? 's' : ''}.`);
            }
        } catch (error) {
            console.error('Erro ao criar registros em massa:', error);
            alert('Erro ao criar registros em massa. Por favor, tente novamente.');
        }
    };

    const handleDeleteMonthClick = (mesAno: string, recordIds: number[]) => {
        setDeleteMonthData({ mesAno, recordIds });
    };

    const confirmDeleteMonth = async () => {
        if (!deleteMonthData) return;

        try {
            let deleted = 0;
            let errors = 0;

            // Deletar todos os registros do mês
            for (const id of deleteMonthData.recordIds) {
                try {
                    await productionService.delete(id);
                    deleted++;
                } catch (error) {
                    console.error(`Erro ao deletar registro ${id}:`, error);
                    errors++;
                }
            }

            // Recarregar registros
            const updatedRecords = await productionService.getAll();
            setRecords(updatedRecords);
            setDeleteMonthData(null);

            // Feedback
            if (errors === 0) {
                alert(`✅ ${deleted} registro${deleted !== 1 ? 's' : ''} excluído${deleted !== 1 ? 's' : ''} com sucesso!`);
            } else {
                alert(`⚠️ ${deleted} registro${deleted !== 1 ? 's' : ''} excluído${deleted !== 1 ? 's' : ''} com sucesso.\n${errors} erro${errors !== 1 ? 's' : ''} encontrado${errors !== 1 ? 's' : ''}.`);
            }
        } catch (error) {
            console.error('Erro ao deletar registros do mês:', error);
            alert('Erro ao deletar registros. Por favor, tente novamente.');
        }
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

    // Agrupar observações por data
    const groupedObservations = useMemo(() => {
        const groups: Record<string, ProductionObservationRecord[]> = {};

        filteredObservations.forEach(obs => {
            const dateKey = obs.date.substring(0, 7); // YYYY-MM (Agrupar por Mês)
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey]!.push(obs);
        });

        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filteredObservations]);

    // Calcular KPIs de Observações (Impactos)
    const observationKpis = useMemo(() => {
        const impacts = filteredObservations.filter(o => o.hadImpact);
        const qtdImpactos = impacts.length;

        // Moda de Categoria
        const typeCounts: Record<string, number> = {};
        impacts.forEach(o => {
            const type = o.observationType;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        const categoriaMaisRecorrente = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        // Moda de Setor
        const sectorCounts: Record<string, number> = {};
        impacts.forEach(o => {
            const sec = o.sector;
            sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
        });
        const setorMaisPrejudicado = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        return { qtdImpactos, categoriaMaisRecorrente, setorMaisPrejudicado };
    }, [filteredObservations]);

    // Calcular dados para gráfico de pizza de Impactos por Setor
    const impactsBySectorData = useMemo(() => {
        const impacts = filteredObservations.filter(o => o.hadImpact);
        const sectorCounts: Record<string, number> = {};

        impacts.forEach(o => {
            const sectorName = Sector[o.sector as keyof typeof Sector] || o.sector;
            sectorCounts[sectorName] = (sectorCounts[sectorName] || 0) + 1;
        });

        return Object.entries(sectorCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredObservations]);

    // Calcular dados para gráfico de pizza de Impactos por Categoria
    const impactsByCategoryData = useMemo(() => {
        const impacts = filteredObservations.filter(o => o.hadImpact);
        const categoryCounts: Record<string, number> = {};

        impacts.forEach(o => {
            const category = o.observationType;
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        return Object.entries(categoryCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredObservations]);

    // Calcular dados para gráfico de Taxa de Impactos Mensal
    const monthlyImpactRateData = useMemo(() => {
        interface MonthData {
            productDaysWithImpact: Set<string>; // produto+dia com impacto
            totalProductDays: Set<string>; // total de produto+dia produzidos
            impactsBySector: Record<string, number>;
            impactsByProduct: Record<string, number>;
            impactsByCategory: Record<string, number>;
            totalImpacts: number;
        }

        const monthlyData: Record<string, MonthData> = {};

        // Primeiro: Processar registros de produção para contar produto-dias totais
        records.forEach(record => {
            const [monthNum, year] = record.mesAno.split('/');
            if (!monthNum || !year) return;

            const month = `${year}-${monthNum.padStart(2, '0')}`;

            if (!monthlyData[month]) {
                monthlyData[month] = {
                    productDaysWithImpact: new Set(),
                    totalProductDays: new Set(),
                    impactsBySector: {},
                    impactsByProduct: {},
                    impactsByCategory: {},
                    totalImpacts: 0
                };
            }

            // Para cada dia com produção, adicionar produto+dia
            record.dailyProduction.forEach((day, index) => {
                if (day.realizado > 0 || day.programado > 0) {
                    const dayNum = String(index + 1).padStart(2, '0');
                    const dayDate = `${month}-${dayNum}`;
                    const productDay = `${record.produto}|${dayDate}`; // chave: produto|data
                    monthlyData[month]?.totalProductDays.add(productDay);
                }
            });
        });

        // Segundo: Processar observações com impacto para contar produto-dias impactados
        observationRecords
            .filter(o => o.hadImpact)
            .forEach(obs => {
                const month = obs.date.substring(0, 7); // YYYY-MM
                const day = obs.date.substring(0, 10); // YYYY-MM-DD
                const productDay = `${obs.product}|${day}`; // chave: produto|data

                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        productDaysWithImpact: new Set(),
                        totalProductDays: new Set(),
                        impactsBySector: {},
                        impactsByProduct: {},
                        impactsByCategory: {},
                        totalImpacts: 0
                    };
                }

                // Adicionar produto-dia impactado
                monthlyData[month].productDaysWithImpact.add(productDay);

                // Também adicionar ao total (caso não tenha registro de produção)
                monthlyData[month].totalProductDays.add(productDay);

                monthlyData[month].totalImpacts++;

                // Contar por setor
                const sectorName = Sector[obs.sector as keyof typeof Sector] || obs.sector;
                monthlyData[month].impactsBySector[sectorName] = (monthlyData[month].impactsBySector[sectorName] || 0) + 1;

                // Contar por produto
                monthlyData[month].impactsByProduct[obs.product] = (monthlyData[month].impactsByProduct[obs.product] || 0) + 1;

                // Contar por categoria
                monthlyData[month].impactsByCategory[obs.observationType] = (monthlyData[month].impactsByCategory[obs.observationType] || 0) + 1;
            });

        // Calcular taxa e preparar dados para o gráfico
        const chartData = Object.entries(monthlyData)
            .map(([month, data]) => {
                const productDaysWithImpact = data.productDaysWithImpact.size;
                const totalProductDays = data.totalProductDays.size;
                const taxa = totalProductDays > 0 ? (productDaysWithImpact / totalProductDays) * 100 : 0;

                // Encontrar TODOS os setores mais prejudicados (em caso de empate)
                const sectorEntries = Object.entries(data.impactsBySector);
                const maxSectorCount = Math.max(...sectorEntries.map(([, count]) => count), 0);
                const mostAffectedSectors = sectorEntries
                    .filter(([, count]) => count === maxSectorCount)
                    .map(([sector]) => sector);

                // Encontrar TODOS os produtos mais prejudicados (em caso de empate)
                const productEntries = Object.entries(data.impactsByProduct);
                const maxProductCount = Math.max(...productEntries.map(([, count]) => count), 0);
                const mostAffectedProducts = productEntries
                    .filter(([, count]) => count === maxProductCount)
                    .map(([product]) => product);

                // Calcular percentual por categoria (ranking)
                const categoryBreakdown = Object.entries(data.impactsByCategory)
                    .map(([category, count]) => ({
                        category,
                        count,
                        percentage: data.totalImpacts > 0 ? (count / data.totalImpacts) * 100 : 0
                    }))
                    .sort((a, b) => b.percentage - a.percentage);

                // Formatar mês para exibição (03/2026)
                const [year, monthNum] = month.split('-');
                const monthLabel = `${monthNum}/${year}`;

                return {
                    month: monthLabel,
                    monthKey: month,
                    taxa: Number(taxa.toFixed(2)),
                    productDaysWithImpact,
                    totalProductDays,
                    mostAffectedSectors: mostAffectedSectors.length > 0 ? mostAffectedSectors : ['-'],
                    mostAffectedProducts: mostAffectedProducts.length > 0 ? mostAffectedProducts : ['-'],
                    mostAffectedProductCount: maxProductCount,
                    categoryBreakdown,
                    totalImpacts: data.totalImpacts
                };
            })
            .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
            .slice(-12); // Últimos 12 meses

        return chartData;
    }, [observationRecords, records]);

    useEffect(() => {
        if (groupedObservations.length > 0 && openObservationDates.length === 0) {
            const firstDate = groupedObservations[0]?.[0];
            if (firstDate) setOpenObservationDates([firstDate]);
        }
    }, [groupedObservations.length]);

    const toggleObservationDate = (dateKey: string) => {
        setOpenObservationDates(prev =>
            prev.includes(dateKey)
                ? prev.filter(d => d !== dateKey)
                : [...prev, dateKey]
        );
    };

    const formatObservationDate = (dateKey: string) => {
        const [year, month] = dateKey.split('-');
        const date = new Date(Number(year), Number(month) - 1, 1);
        const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    };

    const handleDeleteObservationDateClick = (dateKey: string, observationIds: number[]) => {
        setDeleteObservationDateData({ date: dateKey, observationIds });
    };

    const confirmDeleteObservationDate = async () => {
        if (!deleteObservationDateData) return;

        try {
            let deleted = 0;
            let errors = 0;

            for (const id of deleteObservationDateData.observationIds) {
                try {
                    await productionObservationsService.delete(id);
                    deleted++;
                } catch (error) {
                    console.error(`Erro ao deletar observação ${id}:`, error);
                    errors++;
                }
            }

            const updatedRecords = await productionObservationsService.getAll();
            setObservationRecords(updatedRecords);
            setDeleteObservationDateData(null);

            if (errors === 0) {
                alert(`✅ ${deleted} observação${deleted !== 1 ? 'ões' : ''} excluída${deleted !== 1 ? 's' : ''} com sucesso!`);
            } else {
                alert(`⚠️ ${deleted} observação${deleted !== 1 ? 'ões' : ''} excluída${deleted !== 1 ? 's' : ''} com sucesso.\n${errors} erro${errors !== 1 ? 's' : ''} encontrado${errors !== 1 ? 's' : ''}.`);
            }
        } catch (error) {
            console.error('Erro ao deletar observações da data:', error);
            alert('Erro ao deletar observações. Por favor, tente novamente.');
        }
    };

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



    const renderOverview = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Data Início</label>
                        <DatePickerInput
                            value={overviewFilters.start}
                            onChange={(date) => setOverviewFilters({ ...overviewFilters, start: date })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Data Fim</label>
                        <DatePickerInput
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

                {/* Novos Cards KPI de Observações */}
                <KpiCard
                    title="Qtd de Impactos"
                    value={observationKpis.qtdImpactos.toLocaleString()}
                    unit=""
                    icon={<AlertTriangle />}
                    color={COLORS.error}
                    tooltip={{
                        content: "Quantidade de observações registradas com impacto na produção.",
                        statusColor: COLORS.error
                    }}
                />
                <KpiCard
                    title="Categoria Mais Recorrente"
                    value={observationKpis.categoriaMaisRecorrente.toUpperCase()}
                    unit=""
                    icon={<Tag />}
                    color={COLORS.tertiary}
                    enableWrap={true}
                    tooltip={{
                        content: "Tipo de observação com impacto que mais apareceu nos registros feitos.",
                        statusColor: COLORS.tertiary
                    }}
                />
                <KpiCard
                    title="Setor Mais Prejudicado"
                    value={observationKpis.setorMaisPrejudicado.toUpperCase()}
                    unit=""
                    icon={<Briefcase />}
                    color={COLORS.error}
                    enableWrap={true}
                    tooltip={{
                        content: "Setor que mais registrou observações com impacto na produção.",
                        statusColor: COLORS.error
                    }}
                />
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

            {/* Nova Seção: Observações de Produção */}
            <div className="grid grid-cols-1 gap-6 pt-4 border-t dark:border-slate-700">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Observações de Produção</h3>

                {/* Gráfico de Taxa de Impactos Mensal - Largura Completa */}
                <ChartContainer title="Taxa de Impactos Mensal">
                    {monthlyImpactRateData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyImpactRateData} margin={{ top: 20, right: 30, left: -10, bottom: 20 }}>
                                {/* Gradiente para o preenchimento */}
                                <defs>
                                    <linearGradient id="impactRateGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#E74C3C" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#E74C3C" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: tickColor, fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: tickColor, fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                />

                                {/* Tooltip Rico Customizado */}
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    wrapperStyle={{ zIndex: 1000, outline: 'none' }}
                                    contentStyle={tooltipStyle}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{
                                                    ...tooltipStyle,
                                                    padding: '16px',
                                                    border: `2px solid ${COLORS.error}`,
                                                    borderRadius: '8px',
                                                    minWidth: '280px',
                                                    maxWidth: '320px',
                                                    maxHeight: '400px',
                                                    overflowY: 'auto'
                                                }}>
                                                    {/* Cabeçalho */}
                                                    <div style={{
                                                        borderBottom: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
                                                        paddingBottom: '12px',
                                                        marginBottom: '12px'
                                                    }}>
                                                        <p style={{
                                                            fontWeight: 'bold',
                                                            fontSize: '16px',
                                                            color: COLORS.error,
                                                            marginBottom: '4px'
                                                        }}>
                                                            {data.month}
                                                        </p>
                                                        <p style={{
                                                            fontSize: '24px',
                                                            fontWeight: 'bold',
                                                            color: COLORS.error
                                                        }}>
                                                            {data.taxa.toFixed(2)}%
                                                        </p>
                                                        <p style={{
                                                            fontSize: '12px',
                                                            color: isDarkMode ? '#94a3b8' : '#64748b',
                                                            marginTop: '4px'
                                                        }}>
                                                            {data.productDaysWithImpact} de {data.totalProductDays} produtos impactados
                                                        </p>
                                                        <p style={{
                                                            fontSize: '11px',
                                                            color: isDarkMode ? '#64748b' : '#94a3b8',
                                                            marginTop: '2px'
                                                        }}>
                                                            {data.totalImpacts} {data.totalImpacts === 1 ? 'ocorrência' : 'ocorrências'} registrada{data.totalImpacts === 1 ? '' : 's'}
                                                        </p>
                                                    </div>

                                                    {/* Setor(es) Mais Prejudicado(s) */}
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <p style={{
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            color: isDarkMode ? '#94a3b8' : '#64748b',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            marginBottom: '4px'
                                                        }}>
                                                            🏭 {data.mostAffectedSectors.length > 1 ? 'Setores Mais Prejudicados' : 'Setor Mais Prejudicado'}
                                                        </p>
                                                        <div style={{
                                                            fontWeight: 'bold',
                                                            fontSize: '14px',
                                                            color: '#F97316',
                                                            lineHeight: '1.2'
                                                        }}>
                                                            {data.mostAffectedSectors.join(', ')}
                                                        </div>
                                                    </div>

                                                    {/* Produto(s) Mais Prejudicado(s) */}
                                                    <div style={{ marginBottom: '12px' }}>
                                                        <p style={{
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            color: isDarkMode ? '#94a3b8' : '#64748b',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px',
                                                            marginBottom: '4px'
                                                        }}>
                                                            📦 {data.mostAffectedProducts.length > 1 ? 'Produtos Mais Prejudicados' : 'Produto Mais Prejudicado'}
                                                        </p>
                                                        <div style={{
                                                            fontWeight: 'bold',
                                                            fontSize: '14px',
                                                            color: '#8B5CF6',
                                                            lineHeight: '1.2'
                                                        }}>
                                                            {data.mostAffectedProducts.map((product: string, index: number) => (
                                                                <span key={index}>
                                                                    {product}
                                                                    {index < data.mostAffectedProducts.length - 1 ? ', ' : ''}
                                                                </span>
                                                            ))}
                                                            <div style={{
                                                                fontSize: '12px',
                                                                fontWeight: 'normal',
                                                                color: isDarkMode ? '#94a3b8' : '#64748b',
                                                                marginTop: '2px'
                                                            }}>
                                                                ({data.mostAffectedProductCount} {data.mostAffectedProductCount === 1 ? 'ocorrência' : 'ocorrências'}{data.mostAffectedProducts.length > 1 ? ' cada' : ''})
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Ranking de Categorias */}
                                                    {data.categoryBreakdown && data.categoryBreakdown.length > 0 && (
                                                        <div>
                                                            <p style={{
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                color: isDarkMode ? '#94a3b8' : '#64748b',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px',
                                                                marginBottom: '8px'
                                                            }}>
                                                                📊 Ranking por Categoria
                                                            </p>
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '6px'
                                                            }}>
                                                                {data.categoryBreakdown.map((cat: any, idx: number) => {
                                                                    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
                                                                    const color = colors[idx % colors.length];
                                                                    return (
                                                                        <div key={idx} style={{
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            padding: '4px 8px',
                                                                            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                                                                            borderRadius: '4px',
                                                                            borderLeft: `3px solid ${color}`
                                                                        }}>
                                                                            <span style={{
                                                                                fontSize: '13px',
                                                                                fontWeight: '500',
                                                                                color: color
                                                                            }}>
                                                                                {cat.category}
                                                                            </span>
                                                                            <span style={{
                                                                                fontSize: '13px',
                                                                                fontWeight: 'bold',
                                                                                color: color
                                                                            }}>
                                                                                {cat.percentage.toFixed(1)}%
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />

                                {/* Area com gradiente */}
                                <Area
                                    type="monotone"
                                    dataKey="taxa"
                                    fill="url(#impactRateGradient)"
                                    stroke="none"
                                    fillOpacity={1}
                                    isAnimationActive={false}
                                    legendType="none"
                                />

                                {/* Linha principal */}
                                <Line
                                    type="monotone"
                                    dataKey="taxa"
                                    stroke={COLORS.error}
                                    strokeWidth={3}
                                    name="Taxa %"
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#fff', stroke: COLORS.error, strokeWidth: 2 }}
                                    isAnimationActive={false}
                                >
                                    <LabelList
                                        dataKey="taxa"
                                        position="top"
                                        formatter={(v: any) => `${formatChartNumber(Number(v))}%`}
                                        style={{ fill: COLORS.error, fontSize: 16, fontWeight: 600 }}
                                    />
                                </Line>

                                <Legend wrapperStyle={{ fontSize: '14px', zIndex: 1 }} iconType="circle" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Nenhum dado disponível para exibir o gráfico
                        </div>
                    )}
                </ChartContainer>

                {/* Gráficos de Pizza em Grid 2 Colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Placeholder para futuros gráficos */}
                    <ChartContainer title="Impactos por Categoria">
                        {impactsByCategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={impactsByCategoryData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        stroke={isDarkMode ? '#1e293b' : '#fff'}
                                        label={({ name, value }) => `${name}: ${formatChartNumber(Number(value))}`}
                                        labelLine={{ stroke: isDarkMode ? '#94a3b8' : '#64748b', strokeWidth: 1 }}
                                    >
                                        {impactsByCategoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div style={{ ...tooltipStyle, padding: '10px', border: '1px solid #ccc' }}>
                                                        <p style={{ fontWeight: 'bold' }}>{data.name}</p>
                                                        <p>Impactos: {data.value}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                Nenhum impacto registrado para exibir o gráfico
                            </div>
                        )}
                    </ChartContainer>

                    <ChartContainer title="Impactos por Setor">
                        {impactsBySectorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={impactsBySectorData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        stroke={isDarkMode ? '#1e293b' : '#fff'}
                                        label={({ name, value }) => `${name}: ${formatChartNumber(Number(value))}`}
                                        labelLine={{ stroke: isDarkMode ? '#94a3b8' : '#64748b', strokeWidth: 1 }}
                                    >
                                        {impactsBySectorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div style={{ ...tooltipStyle, padding: '10px', border: '1px solid #ccc' }}>
                                                        <p style={{ fontWeight: 'bold' }}>{data.name}</p>
                                                        <p>Impactos: {data.value}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                Nenhum impacto registrado para exibir o gráfico
                            </div>
                        )}
                    </ChartContainer>
                </div>
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="flex items-center justify-center bg-imac-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-semibold"
                        >
                            <Plus size={20} className="mr-2" />
                            Registro Geral
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center bg-imac-success text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold"
                        >
                            <Plus size={20} className="mr-2" />
                            Registro Individual
                        </button>
                    </div>
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

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><List size={20} />Registros de Produção</h3>

                {groupedRecords.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-lg border border-dashed border-gray-300 dark:border-slate-700 text-center">
                        <p className="text-gray-400 text-lg">Nenhum registro encontrado para os filtros selecionados.</p>
                    </div>
                ) : (
                    groupedRecords.map(([mesAno, groupRecords]) => {
                        const isOpen = openMonths.includes(mesAno);
                        const label = formatMonthYear(mesAno);

                        return (
                            <div key={mesAno} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300">
                                {/* Header (Retângulo/Cabeçalho) */}
                                <div
                                    className={`
                                        flex items-center justify-between p-4 transition-colors border-l-4
                                        ${isOpen
                                            ? 'bg-imac-primary/5 dark:bg-slate-700/50 border-imac-primary border-b border-b-imac-primary/10'
                                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/30 border-transparent'}
                                    `}
                                >
                                    <div
                                        onClick={() => toggleMonth(mesAno)}
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
                                                {groupRecords.length} registro{groupRecords.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canDelete() && !isEspectador() && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMonthClick(mesAno, groupRecords.map(r => r.id));
                                                }}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors no-print"
                                                title={`Excluir todos os ${groupRecords.length} registros de ${label}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <div
                                            onClick={() => toggleMonth(mesAno)}
                                            className={`transform transition-transform duration-300 cursor-pointer p-2 ${isOpen ? 'rotate-180 text-imac-primary' : 'text-gray-400'}`}
                                        >
                                            <ChevronDown size={24} />
                                        </div>
                                    </div>
                                </div>

                                {/* Body (Gaveta/Tabela) */}
                                {isOpen && (
                                    <div className="animate-fadeIn">
                                        <div className="overflow-x-auto w-full">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-700/50">
                                                    <tr>
                                                        <th className="px-6 py-3">Setor</th>
                                                        <th className="px-6 py-3">Produto</th>
                                                        <th className="px-6 py-3 text-center">Meta Mês</th>
                                                        <th className="px-6 py-3 text-center">QTD/Semana</th>
                                                        <th className="px-6 py-3 text-center">Programado</th>
                                                        <th className="px-6 py-3 text-center">Realizado</th>
                                                        <th className="px-6 py-3 text-center">QTD. (KG/UND)</th>
                                                        <th className="px-6 py-3 text-center">Velocidade %</th>
                                                        <th className="px-6 py-3 text-center no-print">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-gray-700 dark:text-gray-400 border-t dark:border-slate-700">
                                                    {groupRecords.map(rec => (
                                                        <tr key={rec.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                                            <td className="px-6 py-4 uppercase">{rec.sector}</td>
                                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-gray-200 uppercase">{rec.produto}</td>
                                                            <td className="px-6 py-4 text-center">{rec.metaMes}</td>
                                                            <td className="px-6 py-4 text-center font-medium text-gray-700 dark:text-gray-400">
                                                                {(() => {
                                                                    const [m, y] = rec.mesAno.split('/');
                                                                    const daysInMonth = new Date(Number(y), Number(m), 0).getDate();
                                                                    let weeks = 0;
                                                                    for (let d = 1; d <= daysInMonth; d++) {
                                                                        const day = new Date(Number(y), Number(m) - 1, d).getDay();
                                                                        if (day === 1) weeks++;
                                                                    }
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
                                                            <td className="px-6 py-4 font-semibold text-center">
                                                                <span className={`
                                                                    px-2 py-1 rounded-full text-xs
                                                                    ${rec.velocidade >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                        rec.velocidade >= 90 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                            rec.velocidade >= 80 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                                                                `}>
                                                                    {rec.velocidade.toFixed(1)}%
                                                                </span>
                                                            </td>
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
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

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
                    <button
                        onClick={() => handleOpenObservationModal()}
                        className="flex items-center justify-center bg-imac-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-semibold"
                    >
                        <Plus size={20} className="mr-2" />
                        Nova Observação
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 space-y-4 no-print transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mês/Ano</label>
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
                            <option value="Todos">Todos</option>
                            {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
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
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
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

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><FileText size={20} />Observações Registradas</h3>

                {groupedObservations.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-lg border border-dashed border-gray-300 dark:border-slate-700 text-center">
                        <p className="text-gray-400 text-lg">Nenhuma observação encontrada para os filtros selecionados.</p>
                    </div>
                ) : (
                    groupedObservations.map(([dateKey, groupObservations]) => {
                        const isOpen = openObservationDates.includes(dateKey);
                        const label = formatObservationDate(dateKey);

                        return (
                            <div key={dateKey} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300">
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
                                        onClick={() => toggleObservationDate(dateKey)}
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
                                                {groupObservations.length} {groupObservations.length !== 1 ? 'observações' : 'observação'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canDelete() && !isEspectador() && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteObservationDateClick(dateKey, groupObservations.map(o => o.id));
                                                }}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors no-print"
                                                title={`Excluir todas as ${groupObservations.length} observações de ${label}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        <div
                                            onClick={() => toggleObservationDate(dateKey)}
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
                                                        <th className="px-6 py-3">Setor</th>
                                                        <th className="px-6 py-3">Produto</th>
                                                        <th className="px-6 py-3">Tipo</th>
                                                        <th className="px-6 py-3">Descrição</th>
                                                        <th className="px-6 py-3">Houve Impacto?</th>
                                                        <th className="px-6 py-3 text-center">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                    {groupObservations.map((obs) => (
                                                        <tr key={obs.id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-400 uppercase">
                                                                {Sector[obs.sector as keyof typeof Sector] || obs.sector}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-gray-200 uppercase">
                                                                {obs.product || '-'}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                                {obs.observationType}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-400 max-w-xs truncate" title={obs.description}>
                                                                {obs.description}
                                                            </td>
                                                            <td className="px-6 py-4 text-left">
                                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${obs.hadImpact ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                                                                    {obs.hadImpact ? 'SIM' : 'NÃO'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center flex justify-center gap-2 no-print">
                                                                <button type="button" onClick={() => handleViewObservation(obs)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors" title="Visualizar">
                                                                    <Eye size={18} />
                                                                </button>
                                                                {!isEspectador() && (
                                                                    <>
                                                                        {canEdit() && (
                                                                            <button type="button" onClick={() => handleOpenObservationModal(obs)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors" title="Editar"><Pencil size={18} /></button>
                                                                        )}
                                                                        {canDelete() && (
                                                                            <button type="button" onClick={() => handleDeleteObservationClick(obs.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors" title="Excluir"><Trash2 size={18} /></button>
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
                                )
                                }
                            </div>
                        );
                    })
                )}
            </div>
        </div >
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

            <ConfirmModal
                isOpen={!!deleteMonthData}
                onClose={() => setDeleteMonthData(null)}
                onConfirm={confirmDeleteMonth}
                title={`Excluir Todos os Registros de ${deleteMonthData ? formatMonthYear(deleteMonthData.mesAno) : ''}`}
                message={`Tem certeza que deseja excluir TODOS os ${deleteMonthData?.recordIds.length || 0} registros de ${deleteMonthData ? formatMonthYear(deleteMonthData.mesAno) : ''}? Esta ação não pode ser desfeita.`}
            />

            <ConfirmModal
                isOpen={!!deleteObservationDateData}
                onClose={() => setDeleteObservationDateData(null)}
                onConfirm={confirmDeleteObservationDate}
                title={`Excluir Todas as Observações de ${deleteObservationDateData ? formatObservationDate(deleteObservationDateData.date) : ''}`}
                message={`Tem certeza que deseja excluir TODAS as ${deleteObservationDateData?.observationIds.length || 0} observações de ${deleteObservationDateData ? formatObservationDate(deleteObservationDateData.date) : ''}? Esta ação não pode ser desfeita.`}
            />

            <ViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={viewTitle}
                data={viewData}
                fields={viewFields}
            />

            <BulkRegistrationModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleBulkRegistration}
                products={products}
            />

        </div>
    );
};

export default ProductionSpeed;
