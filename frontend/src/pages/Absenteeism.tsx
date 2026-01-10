import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { AbsenteeismRecord, Employee } from '../types';
import { Sector, AbsenceType } from '../types';
import { formatChartNumber } from '../utils/formatters';
import { formatChartNumber } from '../utils/formatters';
// Imports dinâmicos para XLSX e jsPDF implementados nas funções de exportação
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { ComposedChart, Bar, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Area } from 'recharts';
import { TrendingUp, List, Plus, File, Users, Activity, TriangleAlert, Pencil, Trash2, Filter, Eye, ChevronDown, Calendar } from 'lucide-react';
import Modal, { ConfirmModal } from '../components/Modal';
import ViewModal from '../components/ViewModal';
import { useAuth } from '../contexts/AuthContext';
import { absenteeismService } from '../services/modules/absenteeism';
import { formatBrazilianNumber, formatText } from '../utils/formatters';
import DatePickerInput from '../components/DatePickerInput';
import AutocompleteInput from '../components/AutocompleteInput';

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

/**
 * Determina o status da taxa de absenteísmo (cor e rótulo)
 * @param rate - Taxa de absenteísmo (%)
 * @returns Objeto com metadados de exibição (cor, rótulo, descrição)
 */
const getAbsenteeismRateStatus = (rate: number): { color: string; label: string; description: string } => {
  if (rate < 3) {
    return {
      color: '#2ECC71',
      label: '🟢 EXCELENTE',
      description: 'Taxa abaixo de 3% indica gestão exemplar e alta satisfação dos colaboradores.'
    };
  } else if (rate <= 6) {
    return {
      color: '#F59E0B',
      label: '🟡 ATENÇÃO',
      description: 'Taxa entre 3-6% está dentro da média nacional, mas há espaço para melhorias.'
    };
  } else {
    return {
      color: '#E74C3C',
      label: '🔴 CRÍTICO',
      description: 'Taxa acima de 6% requer ação imediata. Investigue causas e implemente melhorias.'
    };
  }
};

// getMesAnoOptions removido pois agora usamos DatePickerInput com type="month"

/**
 * Calcula o número de dias úteis (Seg-Sex) entre duas datas.
 * @param startDate - Data de início
 * @param endDate - Data final
 * @returns Número de dias úteis
 */
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


/**
 * Formulário para Criar/Editar Registro de Absenteísmo
 */
const AbsenteeismRecordForm: React.FC<{
  record: Partial<AbsenteeismRecord> | null;
  onSave: (record: Omit<AbsenteeismRecord, 'id'>) => void;
  onCancel: () => void;
  employees: Employee[];
}> = ({ record, onSave, onCancel, employees }) => {
  // ... implementação do formulário
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
          <AutocompleteInput
            value={formData.employeeName}
            onChange={(value) => setFormData({ ...formData, employeeName: value })}
            options={availableEmployees.map(e => ({ id: e.id, name: e.name }))}
            placeholder={formData.sector ? 'Digite o nome do funcionário...' : 'Selecione um setor primeiro'}
            disabled={!formData.sector}
            emptyMessage="Nenhum funcionário encontrado para este setor"
          />
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
  isDarkMode: boolean;
}

/**
 * Página Principal de Absenteísmo
 * 
 * Exibe dashboard com KPIs, gráficos de absenteísmo por setor e evolução mensal,
 * além da tabela de registros diários.
 */
const Absenteeism: React.FC<AbsenteeismProps> = ({ employees, isDarkMode }) => {
  // Estados locais para dados carregados sob demanda
  const [records, setRecords] = useState<AbsenteeismRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');

  // Carregar dados ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await absenteeismService.getAll();
        setRecords(data);
      } catch (error) {
        console.error('Erro ao carregar absenteísmo:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AbsenteeismRecord | null>(null);



  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Estados para visualização
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<AbsenteeismRecord | null>(null);

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

  // Estados para controle de accordions (agrupamento por mês)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  // Estado para exclusão em massa de registros por mês
  const [deleteMonthData, setDeleteMonthData] = useState<{ mesAno: string; recordIds: number[] } | null>(null);


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
    }); // Ordenação removida - agora vem do backend (data DESC, setor ASC, funcionário ASC)
  }, [records, tableFilters]);

  // Agrupar registros filtrados por mês/ano para exibição em accordions
  const groupedRecords = useMemo(() => {
    const groups: Record<string, AbsenteeismRecord[]> = {};
    filteredTableRecords.forEach(rec => {
      const cleanDate = rec.date.split('T')[0] || rec.date;
      const [year, month] = cleanDate.split('-');
      const key = `${year}-${month}`;
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

    if (overviewFilters.start || overviewFilters.end) {
      // Se há filtro, usar as datas do filtro
      if (overviewFilters.start) {
        const [y, m, d] = overviewFilters.start.split('-').map(Number);
        if (y && m !== undefined && d) {
          start = new Date(y, m - 1, d);
        } else {
          start = new Date();
          start.setDate(1);
        }
      } else {
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
    } else {
      // Se não há filtro, usar o intervalo de datas dos registros filtrados
      if (safeRecords.length > 0) {
        const dates = safeRecords.map(r => new Date(r.date));
        start = new Date(Math.min(...dates.map(d => d.getTime())));
        end = new Date(Math.max(...dates.map(d => d.getTime())));
      } else {
        // Se não há registros, usar mês atual
        start = new Date();
        start.setDate(1);
        end = new Date();
      }
    }

    const businessDays = countBusinessDays(start, end);

    // Calcular dias perdidos considerando apenas dias dentro do período filtrado
    const totalDaysLost = safeRecords.reduce((sum, r) => {
      // Data de início da ausência
      const absenceStart = new Date(r.date);

      // Data de fim da ausência (início + dias ausentes - 1)
      const absenceEnd = new Date(absenceStart);
      absenceEnd.setDate(absenceEnd.getDate() + (Number(r.daysAbsent) || 1) - 1);

      // Calcular interseção entre período da ausência e período filtrado
      const effectiveStart = absenceStart > start ? absenceStart : start;
      const effectiveEnd = absenceEnd < end ? absenceEnd : end;

      // Contar apenas dias úteis que caem dentro do período filtrado
      if (effectiveStart <= effectiveEnd) {
        return sum + countBusinessDays(effectiveStart, effectiveEnd);
      }
      return sum;
    }, 0);

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

  const chartDataByMonth = useMemo(() => {
    if (!filteredOverviewRecords || filteredOverviewRecords.length === 0) return [];

    // Agrupar registros por mês
    const monthlyData: Record<string, { records: AbsenteeismRecord[], monthYear: string }> = {};

    filteredOverviewRecords.forEach(record => {
      const cleanDate = record.date.split('T')[0] || record.date;
      const [year, month] = cleanDate.split('-').map(Number);

      if (!year || !month) return;

      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthYear = `${String(month).padStart(2, '0')}/${year}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { records: [], monthYear };
      }
      monthlyData[monthKey].records.push(record);
    });

    // Calcular taxa de absenteísmo para cada mês
    const monthlyRates = Object.entries(monthlyData).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-').map(Number);

      if (!year || month === undefined) return null;

      // Calcular dias úteis do mês
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const businessDays = countBusinessDays(firstDay, lastDay);

      // Calcular dias perdidos no mês
      const totalDaysLost = data.records.reduce((sum, r) => {
        const absenceStart = new Date(r.date);
        const absenceEnd = new Date(absenceStart);
        absenceEnd.setDate(absenceEnd.getDate() + (Number(r.daysAbsent) || 1) - 1);

        const effectiveStart = absenceStart > firstDay ? absenceStart : firstDay;
        const effectiveEnd = absenceEnd < lastDay ? absenceEnd : lastDay;

        if (effectiveStart <= effectiveEnd) {
          return sum + countBusinessDays(effectiveStart, effectiveEnd);
        }
        return sum;
      }, 0);

      const totalEmployees = employees?.length || 0;
      const totalPossibleDays = totalEmployees * (businessDays || 1);
      const taxaAbsenteismo = (totalPossibleDays > 0) ? (totalDaysLost / totalPossibleDays) * 100 : 0;

      return {
        name: data.monthYear,
        'Taxa %': taxaAbsenteismo,
        monthKey
      };
    });

    // Filtrar valores null e ordenar por mês
    const validMonthlyRates = monthlyRates.filter(item => item !== null) as { name: string; 'Taxa %': number; monthKey: string }[];
    const sortedRates = validMonthlyRates.sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // Se não houver filtros aplicados, limitar aos últimos 12 meses
    if (!overviewFilters.start && !overviewFilters.end && sortedRates.length > 12) {
      return sortedRates.slice(-12);
    }

    return sortedRates;
  }, [filteredOverviewRecords, employees, overviewFilters]);

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

  const handleExportXLSX = async () => {
    if (filteredTableRecords.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    const XLSX = await import('xlsx');

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
        <KpiCard
          title="Taxa de Absenteísmo"
          value={formatBrazilianNumber(kpiData.taxaAbsenteismo || 0, 2)}
          unit="%"
          icon={<TrendingUp />}
          color={COLORS.taxa}
          tooltip={{
            statusColor: getAbsenteeismRateStatus(kpiData.taxaAbsenteismo || 0).color,
            content: (
              <div className="space-y-2">
                <div className="font-bold text-sm mb-2">
                  {getAbsenteeismRateStatus(kpiData.taxaAbsenteismo || 0).label}
                </div>
                <p className="text-xs leading-relaxed">
                  {getAbsenteeismRateStatus(kpiData.taxaAbsenteismo || 0).description}
                </p>
                <div className="pt-2 mt-2 border-t border-slate-600 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>{'<'} 3% = Excelente</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span>3-6% = Atenção</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>{'>'} 6% = Crítico</span>
                  </div>
                </div>
              </div>
            )
          }}
        />
      </div>

      <ChartContainer title="Taxa de Absenteísmo Mensal">
        {chartDataByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartDataByMonth} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="monthlyAbsenteeismGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="name"
                {...xAxisProps}
                padding={{ left: 30, right: 30 }}
              />
              <YAxis
                {...yAxisLeftProps}
                tickFormatter={(tick) => `${Number(tick).toFixed(1)}%`}
                domain={[0, 'auto']}
                yAxisId="left"
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipItemStyle}
                formatter={(value: any, name: any) => {
                  if (name === 'Taxa %') return [`${(Number(value) || 0).toFixed(2)}%`, 'Taxa de Absenteísmo'];
                  return [value, name];
                }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="Taxa %"
                stroke="none"
                fill="url(#monthlyAbsenteeismGradient)"
                fillOpacity={1}
                isAnimationActive={false}
                legendType="none"
                name=""
                tooltipType="none"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="Taxa %"
                stroke={COLORS.primary}
                strokeWidth={3}
                name="Taxa %"
                dot={false}
                activeDot={{ r: 6, fill: '#fff', stroke: COLORS.primary, strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <LabelList dataKey="Taxa %" position="top" formatter={(v) => `${formatChartNumber(Number(v))}%`} style={{ fill: COLORS.primary, fontSize: 16, fontWeight: 600 }} />
              </Line>
              <Legend wrapperStyle={legendStyle} iconType="circle" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <Activity size={24} className="mb-2 opacity-50" />
            <p className="text-sm">Nenhum dado disponível para o período</p>
          </div>
        )}
      </ChartContainer>

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
                <Bar yAxisId="left" dataKey="Funcionários" fill={COLORS.success} barSize={45} name="Funcionários" radius={barRadius}>
                  <LabelList dataKey="Funcionários" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#10B981', fontSize: 16, fontWeight: 600 }} />
                </Bar>
                <Bar yAxisId="right" dataKey="Taxa %" fill="transparent" barSize={0} name="Taxa %" />
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
                  label={({ name, value }) => `${name}: ${formatChartNumber(Number(value))}`}
                  labelLine={{ stroke: isDarkMode ? '#94a3b8' : '#64748b', strokeWidth: 1 }}
                  style={{ fontSize: '17px' }}
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
        await absenteeismService.delete(id);
        deleted++;
      } catch (error) {
        console.error(`Erro ao deletar registro ${id}`, error);
        errors++;
      }
    }

    // Recarregar registros atualizados do backend
    const updatedRecords = await absenteeismService.getAll();
    setRecords(updatedRecords);
    setDeleteMonthData(null);

    // Exibir resultado da operação
    if (errors === 0) {
      alert(`✅ ${deleted} registros excluídos com sucesso!`);
    } else {
      alert(`⚠️ ${deleted} excluídos. ${errors} erros.`);
    }
  };

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

      {/* Container principal dos accordions agrupados por mês */}
      <div className="space-y-4">
        {Object.entries(groupedRecords).length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-colors">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum registro encontrado</p>
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
                          {groupData.length} {groupData.length !== 1 ? 'ausências' : 'ausência'}
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
                          title={`Excluir todas as ${groupData.length} ausências de ${label}`}
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
                              <th className="px-6 py-3">Dia da Falta</th>
                              <th className="px-6 py-3">Setor</th>
                              <th className="px-6 py-3">Funcionário</th>
                              <th className="px-6 py-3 text-center">Dias Ausentes</th>
                              <th className="px-6 py-3">Tipo de Ausência</th>
                              <th className="px-6 py-3 text-center no-print">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {groupData.map(rec => (
                              <tr key={rec.id} className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 text-gray-700 dark:text-gray-400">{formatDateSafe(rec.date)}</td>
                                <td className="px-6 py-4 text-gray-700 dark:text-gray-400 uppercase">{rec.sector}</td>
                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-gray-200 uppercase">{rec.employeeName}</td>
                                <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-400">{rec.daysAbsent}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.absenceType === AbsenceType.ATESTADO ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    rec.absenceType === AbsenceType.FALTA_INJUSTIFICADA ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                    {rec.absenceType.toUpperCase()}
                                  </span>
                                </td>
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
        <span className="ml-4 text-slate-600 dark:text-slate-400">Carregando absenteísmo...</span>
      </div>
    );
  }

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

      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes da Ausência"
        data={viewData}
        fields={[
          { label: 'Dia da Falta', key: 'date', format: (v: string) => new Date(v).toLocaleDateString('pt-BR') },
          { label: 'Setor', key: 'sector', format: (v: string) => formatText(v) },
          { label: 'Funcionário', key: 'employeeName' },
          { label: 'Dias Ausentes', key: 'daysAbsent' },
          { label: 'Tipo de Ausência', key: 'absenceType', format: (v: string) => formatText(v) }
        ]}
      />

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Ausência"
        message="Tem certeza que deseja excluir este registro de ausência? Esta ação não pode ser desfeita."
      />

      {/* Modal de confirmação para exclusão em massa de registros por mês */}
      <ConfirmModal
        isOpen={!!deleteMonthData}
        onClose={() => setDeleteMonthData(null)}
        onConfirm={confirmDeleteMonth}
        title="Excluir Registros do Mês"
        message={`Tem certeza que deseja excluir todas as ${deleteMonthData?.recordIds.length || 0} ausências de ${deleteMonthData?.mesAno ? formatMonthYear(deleteMonthData.mesAno) : ''}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default Absenteeism;
