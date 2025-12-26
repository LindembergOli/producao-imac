import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AbsenteeismRecord, Employee } from '../types';
import { Sector, AbsenceType } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { ComposedChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, List, Plus, File, Users, Activity, TriangleAlert, Pencil, Trash2, Filter } from 'lucide-react';
import Modal, { ConfirmModal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { absenteeismService } from '../services/modules/absenteeism';
import { formatBrazilianNumber } from '../utils/formatters';
import DatePickerInput from '../components/DatePickerInput';

const COLORS = {
  total: '#EF4444',    // Red 500
  atestado: '#10B981', // Emerald 500
  falta: '#F59E0B',    // Amber 500
  banco: '#6366F1',    // Indigo 500
  taxa: '#D99B61',     // Primary
  primary: '#D99B61',
  tertiary: '#B36B3C',
  success: '#2ECC71',
  error: '#E74C3C',
  pie: ['#2ECC71', '#E74C3C', '#F3C78A', '#60A5FA', '#A78BFA']
};

// getMesAnoOptions removido pois agora usamos DatePickerInput com type="month"

// Cálculo matemático de dias úteis (Seg-Sex) para evitar loops infinitos
const countBusinessDays = (startDate: Date, endDate: Date) => {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  if (endDate < startDate) return 0;

  const start = new Date(startDate.getTime());
  const end = new Date(endDate.getTime());

  // Ajustar para o início do dia
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let count = 0;
  const curDate = new Date(start);
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);

    // Safety break para evitar travamento em intervalos muito grandes
    if (count > 2000) break;
  }
  return count;
};

const formatDateSafe = (dateString: string) => {
  try {
    if (!dateString) return '-';
    // Remove parte de tempo se existir (ISO format)
    const cleanDate = dateString.split('T')[0] || dateString;
    const [year, month, day] = cleanDate.split('-');

    if (!year || !month || !day) return '-';
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return '-';
  }
};


const AbsenteeismRecordForm: React.FC<{
  record: Partial<AbsenteeismRecord> | null;
  onSave: (record: Omit<AbsenteeismRecord, 'id'>) => void;
  onCancel: () => void;
  employees: Employee[];
}> = ({ record, onSave, onCancel, employees }) => {
  // Função auxiliar para converter data para formato YYYY-MM-DD
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return new Date().toISOString().split('T')[0] || '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0] || '';
  };

  const [formData, setFormData] = useState({
    date: formatDateForInput(record?.date),
    sector: (record?.sector as string) || '',
    employeeName: record?.employeeName || '',
    daysAbsent: record?.daysAbsent || 1,
    absenceType: (record?.absenceType as string) || '',
  });
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);

  // Função auxiliar para normalizar strings
  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  useEffect(() => {
    if (formData.sector) {
      setAvailableEmployees(employees.filter(e => normalize(String(e.sector)) === normalize(String(formData.sector))));
      if (record?.sector !== formData.sector && !record) {
        setFormData(f => ({ ...f, employeeName: '' }));
      }
    } else {
      setAvailableEmployees([]);
    }
  }, [formData.sector, employees, record]);

  const handleSave = () => {
    if (!formData.date || !formData.sector || !formData.employeeName || !formData.absenceType) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    onSave(formData as Omit<AbsenteeismRecord, 'id'>);
  };

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-imac-primary focus:border-imac-primary";

  return (
    <div className="space-y-6 text-imac-text dark:text-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <DatePickerInput
            label="Dia da Falta *"
            value={formData.date || ''}
            onChange={date => setFormData({ ...formData, date })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Setor *</label>
          <select value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value as Sector })} className={inputClass}>
            <option value="">Selecione</option>
            {Object.values(Sector).filter(s => s !== Sector.MANUTENCAO).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Nome do Funcionário *</label>
          <select value={formData.employeeName} onChange={e => setFormData({ ...formData, employeeName: e.target.value })} disabled={!formData.sector} className={`${inputClass} disabled:bg-gray-100 dark:disabled:bg-slate-800`}>
            <option value="">{formData.sector ? 'Selecione um funcionário' : 'Selecione um setor primeiro'}</option>
            {availableEmployees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dias Ausentes *</label>
          <input type="number" min="1" value={formData.daysAbsent || ''} onFocus={e => e.target.select()} onChange={e => setFormData({ ...formData, daysAbsent: Number(e.target.value) })} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Ausência *</label>
          <select value={formData.absenceType} onChange={e => setFormData({ ...formData, absenceType: e.target.value as AbsenceType })} className={inputClass}>
            <option value="">Selecione</option>
            {Object.values(AbsenceType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-6 gap-3">
        <button type="button" onClick={onCancel} className="bg-transparent border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold">Cancelar</button>
        <button type="button" onClick={handleSave} className="bg-imac-success text-white px-6 py-2 rounded-lg hover:opacity-90 font-semibold">{record?.id ? 'Salvar' : 'Criar'}</button>
      </div>
    </div>
  );
};

interface AbsenteeismProps {
  employees: Employee[];
  records: AbsenteeismRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AbsenteeismRecord[]>>;
  isDarkMode: boolean;
}

const Absenteeism: React.FC<AbsenteeismProps> = ({ employees, records, setRecords, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AbsenteeismRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { canCreate, canEdit, canDelete, isEspectador } = useAuth();

  const [overviewFilters, setOverviewFilters] = useState({
    start: '',
    end: ''
  });

  const [tableFilters, setTableFilters] = useState({
    mesAno: '',
    sector: 'Todos',
    employee: ''
  });

  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tickColor = isDarkMode ? '#94a3b8' : '#94a3b8';

  // Otimização extrema do Recharts para evitar crashes (Tela Branca)
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

  const yAxisLeftProps = useMemo(() => ({
    yAxisId: "left",
    tick: { fill: tickColor, fontSize: 11 },
    axisLine: false,
    tickLine: false,
    allowDecimals: false
  }), [tickColor]);

  const yAxisRightProps = useMemo(() => ({
    yAxisId: "right",
    orientation: "right" as const,
    tick: { fill: tickColor, fontSize: 11 },
    axisLine: false,
    tickLine: false
  }), [tickColor]);

  const legendStyle = useMemo(() => ({ fontSize: '14px', paddingTop: '10px' }), []);
  const barRadius: [number, number, number, number] = useMemo(() => [4, 4, 0, 0], []);
  const chartMargin = useMemo(() => ({ top: 20, right: 20, left: -10, bottom: 20 }), []);

  const formatComposedTooltip = useCallback((value: any, name: any) => {
    if (name === 'Taxa %') return [`${(Number(value) || 0).toFixed(2)}%`, name];
    if (name === 'Funcionários') return [`${value} funcionários`, 'Qtd'];
    return [value, name];
  }, []);

  const formatPieTooltip = useCallback((value: any, name: any) => [`${value} funcionários`, 'Quantidade'], []);

  const filteredOverviewRecords = useMemo(() => {
    if (!records || !Array.isArray(records)) return [];

    return records.filter(rec => {
      if (!rec || !rec.date) return false;
      // Parsing manual da data para evitar problemas de timezone e formatos ISO
      const cleanDate = rec.date.split('T')[0] || rec.date;
      const [year, month, day] = cleanDate.split('-').map(Number);
      if (!year || month === undefined || !day) return false;
      const recDate = new Date(year, month - 1, day);

      if (overviewFilters.start) {
        const [sy, sm, sd] = overviewFilters.start.split('-').map(Number);
        if (!sy || sm === undefined || !sd) return false;
        const startDate = new Date(sy, sm - 1, sd);
        if (recDate < startDate) return false;
      }

      if (overviewFilters.end) {
        const [ey, em, ed] = overviewFilters.end.split('-').map(Number);
        if (!ey || em === undefined || !ed) return false;
        const endDate = new Date(ey, em - 1, ed);
        endDate.setHours(23, 59, 59, 999);
        if (recDate > endDate) return false;
      }
      return true;
    });
  }, [records, overviewFilters]);

  const filteredTableRecords = useMemo(() => {
    if (!records || !Array.isArray(records)) return [];

    // Função auxiliar para normalizar strings para comparação
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    return records.filter(rec => {
      if (!rec || !rec.date) return false;

      // Filtro Mês/Ano
      // Filtro Mês/Ano
      if (tableFilters.mesAno) {
        const [y, m] = tableFilters.mesAno.split('-').map(Number);
        if (!y || !m) return false;

        const cleanDate = rec.date.split('T')[0] || rec.date;
        const [recY, recM] = cleanDate.split('-').map(Number);

        if (recM !== m || recY !== y) return false;
      }

      if (tableFilters.sector !== 'Todos' && normalize(String(rec.sector)) !== normalize(tableFilters.sector)) return false;
      if (tableFilters.employee && !rec.employeeName.toLowerCase().includes(tableFilters.employee.toLowerCase())) return false;
      return true;
    }).sort((a, b) => (a.sector || '').localeCompare(b.sector || ''));
  }, [records, tableFilters]);


  const kpiData = useMemo(() => {
    const safeRecords = filteredOverviewRecords || [];
    const totalAusencias = new Set(safeRecords.map(r => r.employeeName)).size;

    const atestados = new Set(
      safeRecords.filter(r => r.absenceType === AbsenceType.ATESTADO).map(r => r.employeeName)
    ).size;

    const faltasInjust = new Set(
      safeRecords.filter(r => r.absenceType === AbsenceType.FALTA_INJUSTIFICADA).map(r => r.employeeName)
    ).size;

    const bancoHoras = new Set(
      safeRecords.filter(r => r.absenceType === AbsenceType.BANCO_DE_HORAS).map(r => r.employeeName)
    ).size;

    // Calcular intervalo para taxa
    let start: Date;
    let end: Date;

    if (overviewFilters.start) {
      const [y, m, d] = overviewFilters.start.split('-').map(Number);
      if (y && m !== undefined && d) {
        start = new Date(y, m - 1, d);
      } else {
        start = new Date();
        start.setDate(1);
      }
    } else {
      // Se não tem filtro, pega o início do mês atual ou a menor data
      start = new Date();
      start.setDate(1);
    }

    if (overviewFilters.end) {
      const [y, m, d] = overviewFilters.end.split('-').map(Number);
      if (y && m !== undefined && d) {
        end = new Date(y, m - 1, d);
      } else {
        end = new Date();
      }
    } else {
      end = new Date();
    }

    const businessDays = countBusinessDays(start, end);
    const totalDaysLost = safeRecords.reduce((sum, r) => sum + (Number(r.daysAbsent) || 0), 0);
    const totalEmployees = employees?.length || 0;
    const totalPossibleDays = totalEmployees * (businessDays || 1);

    const taxaAbsenteismo = (totalPossibleDays > 0)
      ? (totalDaysLost / totalPossibleDays) * 100
      : 0;

    return {
      totalAusencias,
      atestados,
      faltasInjust,
      bancoHoras,
      taxaAbsenteismo,
      businessDays
    };
  }, [filteredOverviewRecords, employees, overviewFilters]);

  const chartDataBySector = useMemo(() => {
    const sectors = Object.values(Sector).filter(s => s !== Sector.MANUTENCAO);

    // Função auxiliar para normalizar e comparar setores
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const sectorsMatch = (sector1: string, sector2: string) => normalize(sector1) === normalize(sector2);

    const employeesPerSector = Array.isArray(employees) ? employees.reduce((acc, emp) => {
      acc[emp.sector] = (acc[emp.sector] || 0) + 1;
      return acc;
    }, {} as Record<Sector, number>) : {} as Record<Sector, number>;

    const businessDays = kpiData.businessDays || 1;

    return sectors.map(sector => {
      const sectorRecords = filteredOverviewRecords.filter(r => sectorsMatch(String(r.sector), sector));

      const absentDaysInSector = sectorRecords.reduce((sum, r) => sum + (Number(r.daysAbsent) || 0), 0);
      const totalPossibleDaysInSector = (employeesPerSector[sector] || 0) * businessDays;

      const sectorTax = (totalPossibleDaysInSector > 0)
        ? (absentDaysInSector / totalPossibleDaysInSector) * 100
        : 0;

      const uniqueEmployeesAbsent = new Set(sectorRecords.map(r => r.employeeName)).size;

      return {
        name: sector,
        'Funcionários': uniqueEmployeesAbsent,
        'Taxa %': sectorTax,
      };
    });
  }, [filteredOverviewRecords, employees, kpiData.businessDays]);

  const chartDataByType = useMemo(() => {
    if (!filteredOverviewRecords || filteredOverviewRecords.length === 0) return [];

    const data = Object.values(AbsenceType).map(type => {
      const typeRecords = filteredOverviewRecords.filter(r => r.absenceType === type);
      // Contar eventos únicos ou dias? Geralmente eventos únicos ou pessoas únicas
      const uniqueEmployees = new Set(typeRecords.map(r => r.employeeName));
      return {
        name: type,
        value: uniqueEmployees.size
      };
    });
    return data.filter(d => d.value > 0);
  }, [filteredOverviewRecords]);

  const handleOpenModal = (record?: AbsenteeismRecord) => {
    setCurrentRecord(record || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentRecord(null);
  };

  const handleSave = async (data: Omit<AbsenteeismRecord, 'id'>) => {
    if (!Array.isArray(records)) return;
    try {
      // Converter campos de texto para maiúsculas
      const normalizedData = {
        ...data,
        employeeName: data.employeeName.toUpperCase()
      };

      if (currentRecord) {
        await absenteeismService.update(currentRecord.id, normalizedData);
      } else {
        await absenteeismService.create(normalizedData);
      }
      // Refetch force para garantir atualização dos gráficos e tabelas
      const updatedRecords = await absenteeismService.getAll();
      setRecords(updatedRecords);
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar absenteísmo:', error);
      alert('Erro ao salvar registro de absenteísmo.');
    }
  };

  const confirmDelete = async () => {
    if (!Array.isArray(records)) return;
    if (deleteId) {
      try {
        await absenteeismService.delete(deleteId);
        const updatedRecords = await absenteeismService.getAll();
        setRecords(updatedRecords);
        setDeleteId(null);
      } catch (error) {
        console.error('Erro ao deletar absenteísmo:', error);
        alert('Erro ao deletar registro de absenteísmo.');
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
    const XLSX = (window as any).XLSX; // This is line 423-ish originally in provided snippet, but based on grep it was 425. Checking context.
    const dataToExport = filteredTableRecords.map(r => ({
      'Dia da Falta': formatDateSafe(r.date),
      'Setor': r.sector,
      'Funcionário': r.employeeName,
      'Dias Ausentes': r.daysAbsent,
      'Tipo de Ausência': r.absenceType,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absenteismo");
    XLSX.writeFile(wb, "absenteismo.xlsx");
  };

  const handleExportPDF = () => {
    if (filteredTableRecords.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    // const { jsPDF } = (window as any).jspdf; // Removido
    const doc = new jsPDF();
    doc.text("Relatório de Absenteísmo", 14, 16);

    const startStr = overviewFilters.start ? formatDateSafe(overviewFilters.start) : 'Início';
    const endStr = overviewFilters.end ? formatDateSafe(overviewFilters.end) : 'Fim';
    doc.text(`Período: ${startStr} a ${endStr}`, 14, 24);

    autoTable(doc, {
      head: [['Dia da Falta', 'Setor', 'Funcionário', 'Dias Ausentes', 'Tipo']],
      body: filteredTableRecords.map(r => [
        formatDateSafe(r.date),
        r.sector,
        r.employeeName,
        r.daysAbsent,
        r.absenceType
      ]),
      startY: 30,
    });
    doc.save('absenteismo.pdf');
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
        <KpiCard title="Total de Ausências" value={String(kpiData.totalAusencias || 0)} unit="func." icon={<Users />} color={COLORS.total} />
        <KpiCard title="Atestados" value={String(kpiData.atestados || 0)} unit="func." icon={<File />} color={COLORS.atestado} />
        <KpiCard title="Faltas Injust." value={String(kpiData.faltasInjust || 0)} unit="func." icon={<TriangleAlert />} color={COLORS.falta} />
        <KpiCard title="Banco de Horas" value={String(kpiData.bancoHoras || 0)} unit="func." icon={<Activity />} color={COLORS.banco} />
        <KpiCard title="Taxa de Absenteísmo" value={formatBrazilianNumber(kpiData.taxaAbsenteismo || 0, 2)} unit="%" icon={<TrendingUp />} color={COLORS.taxa} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Ausências por Setor">
          {filteredOverviewRecords.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataBySector} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  {...xAxisProps}
                />
                <YAxis {...yAxisLeftProps} />
                <YAxis {...yAxisRightProps} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={formatComposedTooltip}
                />
                <Legend
                  wrapperStyle={legendStyle}
                  iconType="circle"
                />
                <Bar yAxisId="left" dataKey="Funcionários" fill={COLORS.success} barSize={24} name="Funcionários" radius={barRadius} />
                <Line yAxisId="right" type="monotone" dataKey="Taxa %" stroke={COLORS.primary} strokeWidth={3} name="Taxa %" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <Activity size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Nenhum dado disponível para o período</p>
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="Categoria de Ausência">
          {chartDataByType && chartDataByType.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataByType}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  stroke={isDarkMode ? '#1e293b' : '#fff'}
                >
                  {chartDataByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={formatPieTooltip}
                />
                <Legend
                  wrapperStyle={legendStyle}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <Activity size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Nenhuma ausência registrada</p>
            </div>
          )}
        </ChartContainer>
      </div>

    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 space-y-4 no-print transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Funcionário</label>
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={tableFilters.employee}
              onChange={(e) => setTableFilters({ ...tableFilters, employee: e.target.value })}
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
            Nova Ausência
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
        <h3 className="text-lg font-semibold text-imac-tertiary dark:text-imac-primary mb-4 flex items-center gap-2"><List size={20} />Registros de Ausência</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3">Dia da Falta</th>
                <th className="px-6 py-3">Setor</th>
                <th className="px-6 py-3">Funcionário</th>
                <th className="px-6 py-3 text-center">Dias Ausentes</th>
                <th className="px-6 py-3">Tipo de Ausência</th>
                {!isEspectador() && <th className="px-6 py-3 text-center no-print">Ações</th>}
              </tr>
            </thead>
            <tbody className="text-gray-600 dark:text-gray-300">
              {filteredTableRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">Nenhum registro encontrado</td>
                </tr>
              ) : filteredTableRecords.map(rec => (
                <tr key={rec.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">{formatDateSafe(rec.date)}</td>
                  <td className="px-6 py-4">{rec.sector}</td>
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{rec.employeeName}</td>
                  <td className="px-6 py-4 text-center">{rec.daysAbsent}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.absenceType === AbsenceType.ATESTADO ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      rec.absenceType === AbsenceType.FALTA_INJUSTIFICADA ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                      {rec.absenceType}
                    </span>
                  </td>
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
        <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary">Absenteísmo</h1>
        <p className="text-md text-imac-text/70 dark:text-slate-400">Controle de ausência dos funcionários</p>
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
        title={currentRecord ? 'Editar Registro de Ausência' : 'Novo Registro de Ausência'}
      >
        <AbsenteeismRecordForm record={currentRecord} onSave={handleSave} onCancel={handleCloseModal} employees={employees} />
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Ausência"
        message="Tem certeza que deseja excluir este registro de ausência? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default Absenteeism;
