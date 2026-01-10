import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { MaintenanceRecord, Machine, Employee } from '../types';
import { Sector, MaintenanceStatus } from '../types';
import { formatChartNumber, formatText } from '../utils/formatters';
import { formatChartNumber, formatText } from '../utils/formatters';
// Imports dinâmicos para XLSX e jsPDF implementados nas funções de exportação
import { Plus, Wrench, TriangleAlert, Activity, TrendingUp, List, File, Pencil, Trash2, Filter, Eye, ChevronDown, Calendar } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, LabelList, Area } from 'recharts';

import Modal, { ConfirmModal } from '../components/Modal';
import ViewModal from '../components/ViewModal';
import DatePickerInput from '../components/DatePickerInput';
import TimePickerInput from '../components/TimePickerInput';
import AutocompleteInput from '../components/AutocompleteInput';
import { useAuth } from '../contexts/AuthContext';
import { maintenanceService } from '../services/modules/maintenance';

const COLORS = {
    primary: '#D99B61',
    secondary: '#F3C78A',
    tertiary: '#B36B3C',
    success: '#2ECC71',
    error: '#E74C3C',
    pie: ['#34D399', '#FBBF24', '#F87171', '#60A5FA', '#A78BFA'] // Emerald, Amber, Red, Blue, Violet
};

// getMesAnoOptions removido pois agora usamos DatePickerInput com type="month"

// Helper para formatação segura de datas
const formatDateSafe = (dateString: string) => {
    try {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (error) {
        return '-';
    }
};

// Helper para formatar horas decimais
const formatKpiTime = (decimalHours: number) => {
    if (isNaN(decimalHours) || decimalHours === undefined || decimalHours === null) return "0:00";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    if (minutes === 60) return `${hours + 1}:00`;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const formatDuration = (decimalHours: number) => {
    if (isNaN(decimalHours) || decimalHours < 0) return "0h 00min";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    if (minutes === 60) {
        return `${hours + 1}h 00min`;
    }

    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
};

// Função para determinar status do MTTR (Mean Time To Repair)
const getMTTRStatus = (mttrHours: number): { color: string; label: string; description: string } => {
    if (mttrHours < 2) {
        return {
            color: '#2ECC71',
            label: '🟢 EXCELENTE',
            description: 'MTTR abaixo de 2h indica manutenção eficiente, equipe treinada e boa disponibilidade de peças.'
        };
    } else if (mttrHours <= 4) {
        return {
            color: '#F59E0B',
            label: '🟡 ATENÇÃO',
            description: 'MTTR entre 2-4h está dentro da média industrial, mas há espaço para otimização.'
        };
    } else {
        return {
            color: '#E74C3C',
            label: '🔴 CRÍTICO',
            description: 'MTTR acima de 4h indica problemas. Implemente manutenção preventiva e treine a equipe.'
        };
    }
};

const MaintenanceRecordForm: React.FC<{
    record: Partial<MaintenanceRecord> | null;
    onSave: (record: Omit<MaintenanceRecord, 'id' | 'durationHours'>) => void;
    onCancel: () => void;
    machines: Machine[];
    employees: Employee[]; // Adicionado
}> = ({ record, onSave, onCancel, machines, employees }) => {

    // Função auxiliar para converter data para formato YYYY-MM-DD
    const formatDateForInput = (date: string | Date | undefined): string => {
        if (!date) {
            const today = new Date();
            return today.toISOString().split('T')[0]!;
        }
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const result = dateObj.toISOString().split('T')[0];
        return result || new Date().toISOString().split('T')[0]!;
    };

    const [formData, setFormData] = useState({
        date: formatDateForInput(record?.date),
        sector: (record?.sector as string) || '',
        machine: (record?.machine as string) || '',
        requester: record?.requester || '',
        technician: record?.technician || '',
        problem: record?.problem || '',
        solution: record?.solution || '',
        startTime: record?.startTime || '08:00',
        endTime: record?.endTime || '08:00',
        status: record?.status || MaintenanceStatus.EM_ABERTO,
    });
    const [availableMachines, setAvailableMachines] = useState<Machine[]>([]);
    const [availableRequesters, setAvailableRequesters] = useState<Employee[]>([]);
    const [availableTechnicians, setAvailableTechnicians] = useState<Employee[]>([]);
    const [durationDisplay, setDurationDisplay] = useState('0h 0min');

    // Função auxiliar para normalizar strings
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    // Filtrar solicitantes por setor selecionado
    useEffect(() => {
        if (formData.sector) {
            const requesters = employees.filter(emp =>
                normalize(String(emp.sector)) === normalize(String(formData.sector))
            );
            setAvailableRequesters(requesters);
        } else {
            setAvailableRequesters([]);
        }
    }, [formData.sector, employees]);

    // Filtrar técnicos do setor Manutenção (VISÍVEL PARA TODOS)
    useEffect(() => {
        const technicians = employees.filter(emp =>
            emp.sector === Sector.MANUTENCAO
        );
        setAvailableTechnicians(technicians);
    }, [employees]);

    useEffect(() => {
        if (formData.sector) {
            setAvailableMachines(machines.filter(m => normalize(String(m.sector)) === normalize(String(formData.sector))) || []);
            if (record?.sector !== formData.sector) {
                setFormData(f => ({ ...f, machine: '' }));
            }
        } else {
            setAvailableMachines([]);
        }
    }, [formData.sector, record?.sector, machines]);

    useEffect(() => {
        if (formData.startTime && formData.endTime) {
            const start = new Date(`1970-01-01T${formData.startTime}:00`);
            const end = new Date(`1970-01-01T${formData.endTime}:00`);
            if (end > start) {
                const diffMs = end.getTime() - start.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                const hours = Math.floor(diffHours);
                const minutes = Math.round((diffHours - hours) * 60);
                setDurationDisplay(`${hours}h ${minutes}min`);
            } else {
                setDurationDisplay('0h 0min');
            }
        }
    }, [formData.startTime, formData.endTime]);


    const handleSave = () => {
        if (!formData.date || !formData.sector || !formData.machine || !formData.problem) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        onSave(formData as Omit<MaintenanceRecord, 'id' | 'durationHours'>);
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data *</label>
                    <DatePickerInput value={formData.date || ''} onChange={date => setFormData({ ...formData, date })} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Setor *</label>
                    <select value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value as Sector })} className={inputClass}>
                        <option value="">Selecione</option>
                        {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Máquina *</label>
                    <AutocompleteInput
                        value={formData.machine}
                        onChange={(value) => setFormData({ ...formData, machine: value })}
                        options={availableMachines.map(m => ({ id: m.id, name: m.name }))}
                        placeholder={formData.sector ? 'Digite o nome da máquina...' : 'Selecione um setor primeiro'}
                        disabled={!formData.sector}
                        emptyMessage="Nenhuma máquina encontrada para este setor"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Solicitante</label>
                    <AutocompleteInput
                        value={formData.requester}
                        onChange={(value) => setFormData({ ...formData, requester: value })}
                        options={availableRequesters.map(emp => ({ id: emp.id, name: emp.name }))}
                        placeholder="Digite o nome do solicitante..."
                        emptyMessage="Nenhum funcionário encontrado"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Técnico</label>
                    <AutocompleteInput
                        value={formData.technician}
                        onChange={(value) => setFormData({ ...formData, technician: value })}
                        options={availableTechnicians.map(emp => ({ id: emp.id, name: emp.name }))}
                        placeholder="Digite o nome do técnico..."
                        emptyMessage="Nenhum técnico encontrado"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição do Problema *</label>
                    <textarea value={formData.problem} onChange={e => setFormData({ ...formData, problem: e.target.value })} rows={3} className={inputClass}></textarea>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ação/Solução</label>
                    <textarea value={formData.solution} onChange={e => setFormData({ ...formData, solution: e.target.value })} rows={3} className={inputClass}></textarea>
                </div>
                <div className="grid grid-cols-3 gap-4 md:col-span-2 items-end">
                    <TimePickerInput
                        label="Hora Início"
                        value={formData.startTime}
                        onChange={(time) => setFormData({ ...formData, startTime: time })}
                        required
                    />
                    <TimePickerInput
                        label="Hora Fim"
                        value={formData.endTime}
                        onChange={(time) => setFormData({ ...formData, endTime: time })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Duração</label>
                        <input type="text" readOnly value={durationDisplay} className="mt-1 block w-full rounded-md bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 p-2 font-semibold text-center dark:text-white" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status *</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as MaintenanceStatus })} className={inputClass}>
                        {Object.values(MaintenanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex justify-end pt-6 gap-2">
                <button type="button" onClick={onCancel} className="bg-transparent border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold">Cancelar</button>
                <button type="button" onClick={handleSave} className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold">{record?.id ? 'Salvar' : 'Criar'}</button>
            </div>
        </div>
    );
};

interface MaintenanceProps {
    machines: Machine[];
    employees: Employee[];
    isDarkMode: boolean;
}


const Maintenance: React.FC<MaintenanceProps> = ({ machines, employees, isDarkMode }) => {
    // Estados locais para dados carregados sob demanda
    const [records, setRecords] = useState<MaintenanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<MaintenanceRecord | null>(null);

    // Carregar dados ao montar o componente
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await maintenanceService.getAll();
                setRecords(data);
            } catch (error) {
                console.error('Erro ao carregar manutenções:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Estados para visualização
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewData, setViewData] = useState<MaintenanceRecord | null>(null);

    const { canCreate, canEdit, canDelete, isEspectador } = useAuth();

    const [overviewFilters, setOverviewFilters] = useState({
        start: '',
        end: ''
    });

    const [tableFilters, setTableFilters] = useState({
        mesAno: '',
        sector: 'Todos',
        status: 'Todos',
        machine: ''
    });

    // Estados para controle de accordions (agrupamento por mês)
    const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

    // Estado para exclusão em massa de registros por mês
    const [deleteMonthData, setDeleteMonthData] = useState<{ mesAno: string; recordIds: number[] } | null>(null);


    const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
    const tickColor = isDarkMode ? '#94a3b8' : '#94a3b8';

    const tooltipStyle = useMemo(() => ({
        backgroundColor: isDarkMode ? '#1e293b' : '#fff',
        borderColor: isDarkMode ? '#334155' : '#fff',
        color: isDarkMode ? '#f1f5f9' : '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }), [isDarkMode]);

    const tooltipItemStyle = useMemo(() => ({
        color: isDarkMode ? '#f1f5f9' : '#1e293b'
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

    const yAxisProps = useMemo(() => ({
        tick: { fill: tickColor, fontSize: 11 },
        axisLine: false,
        tickLine: false
    }), [tickColor]);

    const verticalXAxisProps = useMemo(() => ({
        type: "number" as const,
        tick: { fill: tickColor, fontSize: 11 },
        axisLine: false,
        tickLine: false
    }), [tickColor]);

    const verticalYAxisProps = useMemo(() => ({
        type: "category" as const,
        dataKey: "name",
        tick: { fill: tickColor, fontSize: 12, fontWeight: 500 },
        axisLine: false,
        tickLine: false,
        width: 120,
        interval: 0
    }), [tickColor]);

    const chartMargin = useMemo(() => ({ top: 20, right: 30, left: -10, bottom: 20 }), []);
    const chartVerticalMargin = useMemo(() => ({ top: 0, right: 40, left: 20, bottom: 0 }), []);
    const legendStyle = useMemo(() => ({ fontSize: '14px', paddingTop: '10px' }), []);
    const lineDotProps = useMemo(() => ({ r: 4, fill: 'white', strokeWidth: 2 }), []);
    const lineActiveDotProps = useMemo(() => ({ r: 6 }), []);
    const barRadiusVertical: [number, number, number, number] = useMemo(() => [0, 4, 4, 0], []);

    // Funções de retorno
    const formatPieTooltip = useCallback((value: any, name: any) => [value, name], []);
    const formatTimeTooltip = useCallback((value: any) => {
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        return [`${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`, 'Horas Paradas'];
    }, []);
    const formatVerticalBarTooltip = useCallback((value: any, name: any) => {
        if (name === 'Horas Paradas') return [`${formatDuration(value)}`, 'Tempo Total'];
        return [value, name];
    }, []);

    const filteredOverviewRecords = useMemo(() => {
        if (!Array.isArray(records)) return [];
        return records.filter(rec => {
            if (!rec.date) return false;
            const recordDate = new Date(rec.date);
            if (isNaN(recordDate.getTime())) return false;

            if (overviewFilters.start) {
                const startDate = new Date(overviewFilters.start);
                if (!isNaN(startDate.getTime()) && recordDate < startDate) return false;
            }
            if (overviewFilters.end) {
                const endDate = new Date(overviewFilters.end);
                if (!isNaN(endDate.getTime())) {
                    endDate.setHours(23, 59, 59, 999);
                    if (recordDate > endDate) return false;
                }
            }
            return true;
        });
    }, [records, overviewFilters]);

    const filteredTableRecords = useMemo(() => {
        if (!Array.isArray(records)) return [];

        // Função auxiliar para normalizar strings para comparação
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

        return records.filter(rec => {
            if (!rec.date) return false;
            const recDate = new Date(rec.date);
            if (isNaN(recDate.getTime())) return false;

            if (tableFilters.mesAno) {
                const [y, m] = tableFilters.mesAno.split('-').map(Number);
                if (recDate.getMonth() + 1 !== m || recDate.getFullYear() !== y) return false;
            }
            if (tableFilters.sector !== 'Todos' && normalize(String(rec.sector)) !== normalize(tableFilters.sector)) return false;
            if (tableFilters.status !== 'Todos' && rec.status !== tableFilters.status) return false;
            if (tableFilters.machine && !rec.machine.toLowerCase().includes(tableFilters.machine.toLowerCase())) return false;
            return true;
        }); // Ordenação removida - agora vem do backend (data DESC, setor ASC, máquina ASC)
    }, [records, tableFilters]);

    // Agrupar registros filtrados por mês/ano para exibição em accordions
    const groupedRecords = useMemo(() => {
        const groups: Record<string, MaintenanceRecord[]> = {};
        filteredTableRecords.forEach(rec => {
            const date = new Date(rec.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(rec);
        });
        return groups;
    }, [filteredTableRecords]);

    // Abrir automaticamente o primeiro accordion ao carregar os dados
    useEffect(() => {
        const keys = Object.keys(groupedRecords);
        if (keys.length > 0 && Object.keys(openAccordions).length === 0) {
            const firstKey = keys[0];
            if (firstKey) {
                setOpenAccordions({ [firstKey]: true });
            }
        }
    }, [groupedRecords]);


    const kpiData = useMemo(() => {
        const totalOrders = filteredOverviewRecords.length;
        const openOrders = filteredOverviewRecords.filter(r => r.status === MaintenanceStatus.EM_ABERTO).length;
        const closedOrders = filteredOverviewRecords.filter(r => r.status === MaintenanceStatus.FECHADO).length;
        const totalDowntimeHours = filteredOverviewRecords.reduce((total, record) => total + (Number(record.durationHours) || 0), 0);

        // Calcular MTTR (Mean Time To Repair) = Tempo Total / Número de Paradas
        const mttr = totalOrders > 0 ? totalDowntimeHours / totalOrders : 0;

        return { totalOrders, openOrders, closedOrders, totalDowntimeHours, mttr };
    }, [filteredOverviewRecords]);

    const stopsBySectorData = useMemo(() => {
        if (filteredOverviewRecords.length === 0) return [];

        const data = filteredOverviewRecords.reduce((acc, rec) => {
            if (!acc[rec.sector]) {
                acc[rec.sector] = { count: 0, hours: 0 };
            }
            acc[rec.sector].count += 1;
            acc[rec.sector].hours += (Number(rec.durationHours) || 0);
            return acc;
        }, {} as Record<Sector, { count: number, hours: number }>);

        return (Object.entries(data) as [string, { count: number; hours: number }][]).map(([name, stats]) => ({
            name,
            value: stats.count,
            'Paradas': stats.count,
            'Horas Paradas': stats.hours
        })).filter(d => d.value > 0);
    }, [filteredOverviewRecords]);

    const topMachinesData = useMemo(() => {
        if (filteredOverviewRecords.length === 0) return [];

        const machineStats = filteredOverviewRecords.reduce((acc, rec) => {
            if (!rec.machine) return acc;
            if (!acc[rec.machine]) {
                acc[rec.machine] = { stops: 0, hours: 0, sector: rec.sector };
            }
            acc[rec.machine]!.stops += 1;
            acc[rec.machine]!.hours += (Number(rec.durationHours) || 0);
            return acc;
        }, {} as Record<string, { stops: number; hours: number; sector: Sector }>);

        const entries = Object.entries(machineStats) as [string, { stops: number; hours: number; sector: Sector }][];
        return entries
            .sort(([, a], [, b]) => b.stops - a.stops)
            .slice(0, 5)
            .map(([name, stats]) => ({
                name,
                "Paradas": stats.stops,
                "Horas Paradas": stats.hours,
                "sector": stats.sector
            }));
    }, [filteredOverviewRecords]);

    const monthlyDowntimeData = useMemo(() => {
        if (filteredOverviewRecords.length === 0) return [];

        const monthlyData = filteredOverviewRecords.reduce((acc, rec) => {
            if (!rec.date) return acc;
            const monthYearKey = rec.date.substring(0, 7); // "YYYY-MM"
            if (!acc[monthYearKey]) {
                acc[monthYearKey] = 0;
            }
            acc[monthYearKey] += (Number(rec.durationHours) || 0);
            return acc;
        }, {} as Record<string, number>);

        const monthlyArray = Object.entries(monthlyData)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, hours]) => {
                try {
                    if (!key || !key.includes('-')) return { name: key, 'Horas Paradas': hours, monthKey: key };
                    const [year, month] = key.split('-');
                    if (!year || !month) return { name: key, 'Horas Paradas': hours, monthKey: key };

                    const date = new Date(Number(year), Number(month) - 1, 1);
                    if (isNaN(date.getTime())) return { name: key, 'Horas Paradas': hours, monthKey: key };

                    return {
                        name: `${month}/${year}`,
                        'Horas Paradas': parseFloat((hours as number).toFixed(2)),
                        monthKey: key
                    };
                } catch (e) {
                    return { name: key, 'Horas Paradas': hours, monthKey: key };
                }
            });

        // Se não houver filtros aplicados, limitar aos últimos 12 meses
        if (!overviewFilters.start && !overviewFilters.end && monthlyArray.length > 12) {
            return monthlyArray.slice(-12);
        }
        return monthlyArray;
    }, [filteredOverviewRecords, overviewFilters]);

    const CustomMachineTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                    padding: '12px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? '#f1f5f9' : '#1e293b'
                }}>
                    <p className="font-bold text-sm mb-1">{data.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Setor: {data.sector}</p>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <p className="text-xs">Paradas: <span className="font-semibold">{data.Paradas}</span></p>
                    <p className="text-xs">Tempo: <span className="font-semibold">{formatDuration(data['Horas Paradas'])}</span></p>
                </div>
            );
        }
        return null;
    };

    const handleOpenModal = (record?: MaintenanceRecord) => {
        setCurrentRecord(record || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRecord(null);
    };

    const handleSave = async (data: Omit<MaintenanceRecord, 'id' | 'durationHours'>) => {
        if (!Array.isArray(records)) return;
        const start = new Date(`1970-01-01T${data.startTime}:00`);
        const end = new Date(`1970-01-01T${data.endTime}:00`);
        let durationHours = 0;
        if (end > start) {
            const diffMs = end.getTime() - start.getTime();
            durationHours = diffMs / (1000 * 60 * 60);
        }

        // Converter campos de texto para maiúsculas
        const normalizedData = {
            ...data,
            machine: data.machine.toUpperCase(),
            requester: data.requester?.toUpperCase() || '',
            technician: data.technician?.toUpperCase() || '',
            problem: data.problem.toUpperCase(),
            solution: data.solution?.toUpperCase() || ''
        };

        try {
            if (currentRecord) {
                await maintenanceService.update(currentRecord.id, { ...normalizedData, durationHours });
            } else {
                await maintenanceService.create({ ...normalizedData, durationHours });
            }

            // Recarregar todos os registros para garantir ordenação correta do backend
            const updatedRecords = await maintenanceService.getAll();
            setRecords(updatedRecords);
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao salvar manutenção:', error);
            alert('Erro ao salvar registro de manutenção.');
        }
    };

    const confirmDelete = async () => {
        if (!Array.isArray(records)) return;
        if (deleteId) {
            try {
                await maintenanceService.delete(deleteId);
                setRecords(records.filter(r => r.id !== deleteId));
                setDeleteId(null);
            } catch (error) {
                console.error('Erro ao deletar manutenção:', error);
                alert('Erro ao deletar registro de manutenção.');
            }
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
    };

    // Alternar estado de abertura/fechamento de um accordion específico
    const toggleAccordion = (key: string) => {
        setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Formatar chave "YYYY-MM" para "Mês de YYYY" em português
    const formatMonthYear = (key: string) => {
        const [year, month] = key.split('-');
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${monthNames[parseInt(month!) - 1]} de ${year}`;
    };

    // Preparar dados para exclusão em massa de todos os registros de um mês
    const handleDeleteMonthClick = (key: string, ids: number[]) => {
        setDeleteMonthData({ mesAno: key, recordIds: ids });
    };

    // Confirmar e executar exclusão em massa de registros por mês
    const confirmDeleteMonth = async () => {
        if (!deleteMonthData) return;

        let deleted = 0;
        let errors = 0;

        // Deletar cada registro individualmente
        for (const id of deleteMonthData.recordIds) {
            try {
                await maintenanceService.delete(id);
                deleted++;
            } catch (error) {
                console.error(`Erro ao deletar registro ${id}`, error);
                errors++;
            }
        }

        // Recarregar registros atualizados do backend
        const updatedRecords = await maintenanceService.getAll();
        setRecords(updatedRecords);
        setDeleteMonthData(null);

        // Exibir resultado da operação
        if (errors === 0) {
            alert(`✅ ${deleted} registros excluídos com sucesso!`);
        } else {
            alert(`⚠️ ${deleted} excluídos. ${errors} erros.`);
        }
    };


    const handleExportXLSX = async () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        const XLSX = await import('xlsx');

        const dataToExport = filteredTableRecords.map(r => ({
            'Data': formatDateSafe(r.date),
            'Setor': r.sector,
            'Máquina': r.machine,
            'Solicitante': r.requester,
            'Técnico': r.technician || '',
            'Status': r.status,
            'Duração': formatDuration(r.durationHours),
            'Problema': r.problem,
            'Solução': r.solution || ''
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Manutencao");
        XLSX.writeFile(wb, "ordens_manutencao.xlsx");
    };

    const handleExportPDF = async () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable')
        ]);

        const doc = new jsPDF();
        doc.text("Relatório de Ordens de Manutenção", 14, 16);
        autoTable(doc, {
            head: [['Data', 'Setor', 'Máquina', 'Solicitante', 'Técnico', 'Status', 'Duração']],
            body: filteredTableRecords.map(r => [
                formatDateSafe(r.date),
                r.sector,
                r.machine,
                r.requester,
                r.technician || '-',
                r.status,
                formatDuration(r.durationHours)
            ]),
            startY: 20,
        });
        doc.save('ordens_manutencao.pdf');
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <KpiCard title="Total de Ordens" value={String(kpiData.totalOrders)} unit="" icon={<Wrench />} color={COLORS.secondary} />
                <KpiCard title="Em Aberto" value={String(kpiData.openOrders)} unit="" icon={<TriangleAlert />} color={COLORS.error} />
                <KpiCard title="Fechadas" value={String(kpiData.closedOrders)} unit="" icon={<Activity />} color={COLORS.success} />
                <KpiCard title="Tempo Parado" value={formatKpiTime(kpiData.totalDowntimeHours)} unit="h" icon={<Activity />} color={COLORS.tertiary} />

                {/* MTTR (Mean Time To Repair) com indicador de status */}
                <KpiCard
                    title="MTTR (Tempo Médio)"
                    value={formatKpiTime(kpiData.mttr)}
                    unit="h"
                    icon={<TrendingUp />}
                    color={COLORS.primary}
                    tooltip={{
                        statusColor: getMTTRStatus(kpiData.mttr).color,
                        content: (
                            <div className="space-y-2">
                                <div className="font-bold text-sm mb-2">
                                    {getMTTRStatus(kpiData.mttr).label}
                                </div>
                                <p className="text-xs leading-relaxed">
                                    {getMTTRStatus(kpiData.mttr).description}
                                </p>
                                <div className="pt-2 mt-2 border-t border-slate-600 space-y-1">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span>{'<'} 2h = Excelente</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                        <span>2-4h = Atenção</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        <span>{'>'} 4h = Crítico</span>
                                    </div>
                                </div>
                            </div>
                        )
                    }}
                />
            </div>


            <ChartContainer title="Tempo de Parada Mensal">
                {monthlyDowntimeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={monthlyDowntimeData} margin={chartMargin}>
                            <defs>
                                <linearGradient id="maintenanceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.tertiary} stopOpacity={0.6} />
                                    <stop offset="50%" stopColor={COLORS.tertiary} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={COLORS.tertiary} stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="name"
                                {...xAxisProps}
                            />
                            <YAxis {...yAxisProps} />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                itemStyle={tooltipItemStyle}
                                formatter={formatTimeTooltip}
                            />
                            <Area
                                type="natural"
                                dataKey="Horas Paradas"
                                stroke="none"
                                fill="url(#maintenanceGradient)"
                                fillOpacity={1}
                                legendType="none"
                                tooltipType="none"
                            />
                            <Line
                                type="natural"
                                dataKey="Horas Paradas"
                                stroke={COLORS.tertiary}
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, fill: '#fff', stroke: COLORS.tertiary, strokeWidth: 2 }}
                            >
                                <LabelList dataKey="Horas Paradas" position="top" formatter={(v) => `${formatKpiTime(Number(v))}h`} style={{ fill: '#B36B3C', fontSize: 16, fontWeight: 600 }} />
                            </Line>
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <Activity size={24} className="mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma ordem registrada no período</p>
                    </div>
                )}
            </ChartContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Paradas por Setor">
                    {filteredOverviewRecords.length > 0 && stopsBySectorData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stopsBySectorData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    stroke={isDarkMode ? '#1e293b' : '#fff'}
                                    label={({ name, value }) => `${name}: ${formatChartNumber(Number(value))}`}
                                    labelLine={{ stroke: isDarkMode ? '#94a3b8' : '#64748b', strokeWidth: 1 }}
                                >
                                    {stopsBySectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    itemStyle={tooltipItemStyle}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{
                                                    ...tooltipStyle,
                                                    padding: '12px',
                                                    border: `1px solid ${tooltipStyle.borderColor}`
                                                }}>
                                                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>{data.name}</p>
                                                    <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                                                        Paradas: <strong>{data.Paradas}</strong>
                                                    </p>
                                                    <p style={{ fontSize: '14px', color: COLORS.tertiary }}>
                                                        Horas Paradas: <strong>{formatDuration(data['Horas Paradas'])}</strong>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '14px' }} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            <Activity size={24} className="mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma parada registrada no período</p>
                        </div>
                    )}
                </ChartContainer>

                <ChartContainer title="Máquinas com Mais Paradas">
                    {filteredOverviewRecords.length > 0 && topMachinesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topMachinesData} layout="vertical" margin={chartVerticalMargin} barSize={45}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                                <XAxis {...verticalXAxisProps} />
                                <YAxis {...verticalYAxisProps} />
                                <Tooltip
                                    content={<CustomMachineTooltip />}
                                />
                                <Bar dataKey="Paradas" fill={COLORS.primary} radius={barRadiusVertical}>
                                    <LabelList dataKey="Paradas" position="right" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#D99B61', fontSize: 16, fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            <Activity size={24} className="mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma máquina com paradas no período</p>
                        </div>
                    )}
                </ChartContainer>
            </div>
        </div>
    );

    const renderRecords = () => (
        <div className="space-y-6">
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
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                        <select
                            value={tableFilters.status}
                            onChange={(e) => setTableFilters({ ...tableFilters, status: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        >
                            <option value="Todos">Todos</option>
                            {Object.values(MaintenanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Máquina</label>
                        <input
                            type="text"
                            placeholder="Buscar máquina..."
                            value={tableFilters.machine}
                            onChange={(e) => setTableFilters({ ...tableFilters, machine: e.target.value })}
                            className="w-full rounded-md border-gray-200 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white text-sm"
                        />
                    </div>
                </div>
            </div>

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
                        Nova Ordem
                    </button>
                )}
            </div>

            {/* Container principal dos accordions agrupados por mês */}
            <div className="space-y-4">
                {Object.entries(groupedRecords).length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 p-12 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                        <div className="text-center text-gray-400 dark:text-gray-500">
                            <Wrench size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nenhuma ordem encontrada</p>
                            <p className="text-sm mt-2">Ajuste os filtros ou adicione novos registros</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(groupedRecords)
                        .sort(([a], [b]) => b.localeCompare(a)) // Ordenar por data decrescente (mais recente primeiro)
                        .map(([key, groupData]) => {
                            const isOpen = openAccordions[key] || false;
                            const label = formatMonthYear(key);

                            return (
                                <div key={key} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300">
                                    {/* Cabeçalho do Accordion */}
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
                                                    {groupData.length} {groupData.length !== 1 ? 'ordens' : 'ordem'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Botão de exclusão em massa (apenas se usuário tiver permissão) */}
                                            {canDelete() && !isEspectador() && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteMonthClick(key, groupData.map(r => r.id));
                                                    }}
                                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors no-print"
                                                    title={`Excluir todas as ${groupData.length} ordens de ${label}`}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            {/* Ícone de expansão/colapso */}
                                            <div
                                                onClick={() => toggleAccordion(key)}
                                                className={`transform transition-transform duration-300 cursor-pointer p-2 ${isOpen ? 'rotate-180 text-imac-primary' : 'text-gray-400'}`}
                                            >
                                                <ChevronDown size={24} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Corpo do Accordion (tabela de registros) */}
                                    {isOpen && (
                                        <div className="animate-fadeIn">
                                            <div className="overflow-x-auto w-full">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-700/50">
                                                        <tr>
                                                            <th className="px-6 py-3">Data</th>
                                                            <th className="px-6 py-3">Setor</th>
                                                            <th className="px-6 py-3">Máquina</th>
                                                            <th className="px-6 py-3">Solicitante</th>
                                                            <th className="px-6 py-3">Técnico</th>
                                                            <th className="px-6 py-3">Status</th>
                                                            <th className="px-6 py-3 text-right">Duração</th>
                                                            <th className="px-6 py-3 text-center no-print">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                        {groupData.map(rec => (
                                                            <tr key={rec.id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-400">{formatDateSafe(rec.date)}</td>
                                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-400 uppercase">{rec.sector}</td>
                                                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-gray-200 uppercase">{rec.machine}</td>
                                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-400">{rec.requester}</td>
                                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-400">{rec.technician || '-'}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.status === MaintenanceStatus.EM_ABERTO ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                                        {rec.status.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-400">{formatDuration(rec.durationHours)}</td>
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
                <span className="ml-4 text-slate-600 dark:text-slate-400">Carregando manutenções...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-2 no-print">
                <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary">Manutenção</h1>
                <p className="text-md text-imac-text/70 dark:text-slate-400">Gerencie as ordens de serviço e manutenções corretivas/preventivas</p>
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
                title={currentRecord ? 'Editar Ordem de Manutenção' : 'Nova Ordem de Manutenção'}
            >
                <MaintenanceRecordForm record={currentRecord} onSave={handleSave} onCancel={handleCloseModal} machines={machines} employees={employees} />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Ordem de Manutenção"
                message="Tem certeza que deseja excluir esta ordem de manutenção? Esta ação não pode ser desfeita."
            />

            <ViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Detalhes da Ordem de Manutenção"
                data={viewData}
                fields={[
                    { label: 'Data', key: 'date', format: (v: string) => new Date(v).toLocaleDateString('pt-BR') },
                    { label: 'Setor', key: 'sector', format: (v: string) => formatText(v) },
                    { label: 'Máquina', key: 'machine' },
                    { label: 'Solicitante', key: 'requester' },
                    { label: 'Técnico', key: 'technician' },
                    { label: 'Status', key: 'status', format: (v: string) => formatText(v) },
                    { label: 'Duração', key: 'durationHours', format: (v: number) => formatDuration(v) },
                    { label: 'Problema', key: 'problem' },
                    { label: 'Solução', key: 'solution' }
                ]}
            />

            {/* Modal de confirmação para exclusão em massa de registros por mês */}
            <ConfirmModal
                isOpen={!!deleteMonthData}
                onClose={() => setDeleteMonthData(null)}
                onConfirm={confirmDeleteMonth}
                title="Excluir Registros do Mês"
                message={`Tem certeza que deseja excluir todas as ${deleteMonthData?.recordIds.length || 0} ordens de ${deleteMonthData?.mesAno ? formatMonthYear(deleteMonthData.mesAno) : ''}? Esta ação não pode ser desfeita.`}
            />

        </div>
    );
};

export default Maintenance;
