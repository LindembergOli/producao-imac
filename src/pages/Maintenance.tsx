
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { sanitizeFormInput } from '../utils/sanitize';
import type { MaintenanceRecord, Machine } from '../types';
import { Sector, MaintenanceStatus } from '../types';
import { Plus, Wrench, TriangleAlert, Activity, TrendingUp, List, File, Pencil, Trash2 } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import Modal, { ConfirmModal } from '../components/Modal';

const COLORS = {
    primary: '#D99B61',
    secondary: '#F3C78A',
    tertiary: '#B36B3C',
    success: '#2ECC71',
    error: '#E74C3C',
    pie: ['#34D399', '#FBBF24', '#F87171', '#60A5FA', '#A78BFA'] // Emerald, Amber, Red, Blue, Violet
};

const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            options.push(`${hour}:${minute}`);
        }
    }
    return options;
};
const timeOptions = generateTimeOptions();

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

const MaintenanceRecordForm: React.FC<{
    record: Partial<MaintenanceRecord> | null;
    onSave: (record: Omit<MaintenanceRecord, 'id' | 'durationHours'>) => void;
    onCancel: () => void;
    machines: Machine[];
}> = ({ record, onSave, onCancel, machines }) => {

    const [formData, setFormData] = useState({
        date: record?.date || new Date().toISOString().split('T')[0],
        sector: record?.sector || '',
        machine: record?.machine || '',
        requester: record?.requester || '',
        technician: record?.technician || '',
        problem: record?.problem || '',
        solution: record?.solution || '',
        startTime: record?.startTime || '08:00',
        endTime: record?.endTime || '08:00',
        status: record?.status || MaintenanceStatus.EM_ABERTO,
    });
    const [availableMachines, setAvailableMachines] = useState<Machine[]>([]);
    const [durationDisplay, setDurationDisplay] = useState('0h 0min');

    useEffect(() => {
        if (formData.sector) {
            setAvailableMachines(machines.filter(m => m.sector === formData.sector) || []);
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
        onSave({
            ...formData,
            sector: formData.sector as Sector,
            status: formData.status as MaintenanceStatus
        } as Omit<MaintenanceRecord, 'id' | 'durationHours'>);
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome da Máquina *</label>
                    <select value={formData.machine} onChange={e => setFormData({ ...formData, machine: e.target.value })} disabled={!formData.sector} className={`${inputClass} disabled:bg-gray-100 dark:disabled:bg-slate-800`}>
                        <option value="">{formData.sector ? 'Selecione' : 'Selecione um setor primeiro'}</option>
                        {availableMachines.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Solicitante</label>
                    <input type="text" value={formData.requester} onChange={e => setFormData({ ...formData, requester: sanitizeFormInput(e.target.value) })} className={inputClass} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Técnico</label>
                    <input type="text" value={formData.technician} onChange={e => setFormData({ ...formData, technician: sanitizeFormInput(e.target.value) })} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição do Problema *</label>
                    <textarea value={formData.problem} onChange={e => setFormData({ ...formData, problem: sanitizeFormInput(e.target.value) })} rows={3} className={inputClass}></textarea>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ação/Solução</label>
                    <textarea value={formData.solution} onChange={e => setFormData({ ...formData, solution: sanitizeFormInput(e.target.value) })} rows={3} className={inputClass}></textarea>
                </div>
                <div className="grid grid-cols-3 gap-4 md:col-span-2 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Início *</label>
                        <select value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className={inputClass}>
                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Fim</label>
                        <select value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className={inputClass}>
                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
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
    records: MaintenanceRecord[];
    setRecords: React.Dispatch<React.SetStateAction<MaintenanceRecord[]>>;
    isDarkMode: boolean;
}

const Maintenance: React.FC<MaintenanceProps> = ({ machines, records, setRecords, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<MaintenanceRecord | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

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
        tick: { fill: tickColor, fontSize: 9 },
        axisLine: false,
        tickLine: false,
        interval: 0,
        angle: -45,
        textAnchor: 'end' as const,
        height: 70
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

    const chartMargin = useMemo(() => ({ top: 10, right: 10, left: -10, bottom: 20 }), []);
    const chartVerticalMargin = useMemo(() => ({ top: 0, right: 20, left: 20, bottom: 0 }), []);
    const legendStyle = useMemo(() => ({ fontSize: '12px', paddingTop: '10px' }), []);
    const lineDotProps = useMemo(() => ({ r: 4, fill: 'white', strokeWidth: 2 }), []);
    const lineActiveDotProps = useMemo(() => ({ r: 6 }), []);
    const barRadiusVertical: [number, number, number, number] = useMemo(() => [0, 4, 4, 0], []);

    // Callbacks
    const formatPieTooltip = useCallback((value: any, name: any) => [value, name], []);
    const formatTimeTooltip = useCallback((value: any) => [`${value}h`, 'Horas Paradas'], []);
    const formatVerticalBarTooltip = useCallback((value: any, name: any) => {
        if (name === 'Horas Paradas') return [`${formatDuration(value)}`, 'Tempo Total'];
        return [value, name];
    }, []);

    const filteredOverviewRecords = useMemo(() => {
        if (!records) return [];
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
        if (!records) return [];
        return records.filter(rec => {
            if (!rec.date) return false;
            const recDate = new Date(rec.date);
            if (isNaN(recDate.getTime())) return false;

            if (tableFilters.mesAno) {
                const [m, y] = tableFilters.mesAno.split('/');
                if (recDate.getMonth() + 1 !== Number(m) || recDate.getFullYear() !== Number(y)) return false;
            }
            if (tableFilters.sector !== 'Todos' && rec.sector !== tableFilters.sector) return false;
            if (tableFilters.status !== 'Todos' && rec.status !== tableFilters.status) return false;
            if (tableFilters.machine && !rec.machine.toLowerCase().includes(tableFilters.machine.toLowerCase())) return false;
            return true;
        }).sort((a, b) => (a.sector || '').localeCompare(b.sector || ''));
    }, [records, tableFilters]);

    const kpiData = useMemo(() => {
        const totalOrders = filteredOverviewRecords.length;
        const openOrders = filteredOverviewRecords.filter(r => r.status === MaintenanceStatus.EM_ABERTO).length;
        const closedOrders = filteredOverviewRecords.filter(r => r.status === MaintenanceStatus.FECHADO).length;
        const totalDowntimeHours = filteredOverviewRecords.reduce((total, record) => total + (Number(record.durationHours) || 0), 0);
        return { totalOrders, openOrders, closedOrders, totalDowntimeHours };
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
            const machineStats = acc[rec.machine];
            if (machineStats) {
                machineStats.stops += 1;
                machineStats.hours += (Number(rec.durationHours) || 0);
            }
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

        return Object.entries(monthlyData)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, hours]) => {
                try {
                    if (!key || !key.includes('-')) return { name: key, 'Horas Paradas': hours };
                    const [year, month] = key.split('-');
                    if (!year || !month) return { name: key, 'Horas Paradas': hours };

                    const date = new Date(Number(year), Number(month) - 1, 1);
                    if (isNaN(date.getTime())) return { name: key, 'Horas Paradas': hours };

                    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
                    return {
                        name: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year}`,
                        'Horas Paradas': parseFloat((hours as number).toFixed(2)),
                    };
                } catch (e) {
                    return { name: key, 'Horas Paradas': hours };
                }
            });
    }, [filteredOverviewRecords]);

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

    const handleSave = (data: Omit<MaintenanceRecord, 'id' | 'durationHours'>) => {
        const start = new Date(`1970-01-01T${data.startTime}:00`);
        const end = new Date(`1970-01-01T${data.endTime}:00`);
        let durationHours = 0;
        if (end > start) {
            const diffMs = end.getTime() - start.getTime();
            durationHours = diffMs / (1000 * 60 * 60);
        }

        if (currentRecord) {
            setRecords(records.map(r => r.id === currentRecord.id ? { ...currentRecord, ...data, durationHours } : r));
        } else {
            setRecords([...records, { ...data, id: Date.now(), durationHours }]);
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

    const handleExportPDF = () => {
        if (filteredTableRecords.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        doc.text("Relatório de Ordens de Manutenção", 14, 16);
        (doc as any).autoTable({
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total de Ordens" value={String(kpiData.totalOrders)} unit="" icon={<Wrench />} color={COLORS.secondary} />
                <KpiCard title="Em Aberto" value={String(kpiData.openOrders)} unit="" icon={<TriangleAlert />} color={COLORS.error} />
                <KpiCard title="Fechadas" value={String(kpiData.closedOrders)} unit="" icon={<Activity />} color={COLORS.success} />
                <KpiCard title="Tempo Parado" value={formatKpiTime(kpiData.totalDowntimeHours)} unit="h" icon={<Activity />} color={COLORS.tertiary} />
            </div>

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
                                >
                                    {stopsBySectorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    itemStyle={tooltipItemStyle}
                                    formatter={formatPieTooltip}
                                />
                                <Legend wrapperStyle={legendStyle} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            <Activity size={24} className="mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma parada registrada no período</p>
                        </div>
                    )}
                </ChartContainer>

                <ChartContainer title="Tempo de Parada Mensal">
                    {monthlyDowntimeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyDowntimeData} margin={chartMargin}>
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
                                <Line type="monotone" dataKey="Horas Paradas" stroke={COLORS.tertiary} strokeWidth={3} dot={lineDotProps} activeDot={lineActiveDotProps} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            <Activity size={24} className="mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma ordem registrada no período</p>
                        </div>
                    )}
                </ChartContainer>

                <div className="lg:col-span-2">
                    <ChartContainer title="Top 5 Máquinas com Mais Paradas">
                        {filteredOverviewRecords.length > 0 && topMachinesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topMachinesData} layout="vertical" margin={chartVerticalMargin} barSize={24}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                                    <XAxis {...verticalXAxisProps} />
                                    <YAxis {...verticalYAxisProps} />
                                    <Tooltip
                                        content={<CustomMachineTooltip />}
                                    />
                                    <Bar dataKey="Paradas" fill={COLORS.primary} radius={barRadiusVertical} />
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
        </div>
    );

    const renderRecords = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm space-y-4 no-print transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-imac-success text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold">
                    <Plus size={20} className="mr-2" />
                    Nova Ordem
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm transition-colors">
                <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><List size={20} />Registros de Manutenção</h3>
                <div className="overflow-x-auto">
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
                        <tbody className="text-gray-600 dark:text-gray-300">
                            {filteredTableRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-400">Nenhuma ordem encontrada</td>
                                </tr>
                            ) : filteredTableRecords.map(rec => (
                                <tr key={rec.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">{formatDateSafe(rec.date)}</td>
                                    <td className="px-6 py-4">{rec.sector}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{rec.machine}</td>
                                    <td className="px-6 py-4">{rec.requester}</td>
                                    <td className="px-6 py-4">{rec.technician || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.status === MaintenanceStatus.EM_ABERTO ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                            {rec.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">{formatDuration(rec.durationHours)}</td>
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
                <MaintenanceRecordForm record={currentRecord} onSave={handleSave} onCancel={handleCloseModal} machines={machines} />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Excluir Ordem"
                message="Tem certeza que deseja excluir esta ordem de manutenção? Esta ação não pode ser desfeita."
            />

        </div>
    );
};

export default Maintenance;
