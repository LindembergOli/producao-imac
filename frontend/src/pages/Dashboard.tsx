import React, { useMemo, useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';
import ChartContainer from '../components/ChartContainer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, LabelList, Area } from 'recharts';
import type { ProductionSpeedRecord, LossRecord, ErrorRecord, MaintenanceRecord, AbsenteeismRecord, Employee } from '../types';
import { Sector, Unit } from '../types';
import { Activity, TrendingDown, TriangleAlert, Wrench, UserMinus, DollarSign } from 'lucide-react';
import { formatBrazilianNumber, formatChartNumber } from '../utils/formatters';
import DatePickerInput from '../components/DatePickerInput';

// Serviços para carregar dados
import { productionService } from '../services/modules/production';
import { lossesService } from '../services/modules/losses';
import { errorsService } from '../services/modules/errors';
import { maintenanceService } from '../services/modules/maintenance';
import { absenteeismService } from '../services/modules/absenteeism';

const COLORS = {
  primary: '#D99B61',
  secondary: '#F3C78A',
  tertiary: '#B36B3C',
  success: '#2ECC71',
  error: '#E74C3C',
};

// Função auxiliar para contar dias úteis (Seg-Sex) com segurança
const countBusinessDays = (startDate: Date, endDate: Date) => {
  if (!startDate || !endDate) return 0;
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

  // Clonar datas para remover horário e evitar mutação
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  if (start > end) return 0;

  let count = 0;
  const curDate = new Date(start.getTime());
  // Segurança para evitar loops infinitos
  let safety = 0;
  while (curDate <= end && safety < 5000) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);
    safety++;
  }
  return count;
};

interface DashboardProps {
  employees: Employee[];
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, isDarkMode }) => {
  // Estados locais para dados carregados sob demanda
  const [speedRecords, setSpeedRecords] = useState<ProductionSpeedRecord[]>([]);
  const [lossRecords, setLossRecords] = useState<LossRecord[]>([]);
  const [errorRecords, setErrorRecords] = useState<ErrorRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [absenteeismRecords, setAbsenteeismRecords] = useState<AbsenteeismRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do dashboard ao montar o componente
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [speeds, losses, errors, maint, absent] = await Promise.all([
          productionService.getAll(),
          lossesService.getAll(),
          errorsService.getAll(),
          maintenanceService.getAll(),
          absenteeismService.getAll()
        ]);

        setSpeedRecords(speeds);
        setLossRecords(losses);
        setErrorRecords(errors);
        setMaintenanceRecords(maint);
        setAbsenteeismRecords(absent);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []); // Carrega apenas uma vez ao montar

  // Função auxiliar para normalizar nomes de setores (remove acentos, maiúsculas)
  const normalizeSector = (sector: string): string => {
    return sector
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  };

  // Estado inicial: Strings vazias para mostrar "Todo o período"
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Filtrar registros para visualização no dashboard
  const { filteredSpeed, filteredLoss, filteredError, filteredMaintenance, filteredAbsenteeism } = useMemo(() => {
    // Definir lógica de filtro
    const filterByDate = (records: any[], dateField: string = 'date') => {
      // Verificação de segurança: garantir que records é um array
      if (!Array.isArray(records)) return [];

      return records.filter(rec => {
        let recDate: Date;

        if (dateField === 'mesAno') {
          // Parse básico MM/AAAA
          const [m, y] = rec.mesAno.split('/');
          recDate = new Date(Number(y), Number(m) - 1, 1);
        } else {
          recDate = new Date(rec[dateField]);
        }

        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          if (recDate < startDate) return false;
        }

        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (recDate > endDate) return false;
        }

        return true;
      });
    };

    const result = {
      filteredSpeed: filterByDate(speedRecords, 'mesAno'),
      filteredLoss: filterByDate(lossRecords, 'date'),
      filteredError: filterByDate(errorRecords, 'date'),
      filteredMaintenance: filterByDate(maintenanceRecords, 'date'),
      filteredAbsenteeism: filterByDate(absenteeismRecords, 'date')
    };

    return result;
  }, [dateRange, speedRecords, lossRecords, errorRecords, maintenanceRecords, absenteeismRecords]);


  const kpiData = useMemo(() => {
    // Velocidade
    const speedProgramado = filteredSpeed.reduce((sum, r) => sum + r.totalProgramado, 0);
    const speedRealizado = filteredSpeed.reduce((sum, r) => sum + r.totalRealizado, 0);
    const velocidade = speedProgramado > 0 ? (speedRealizado / speedProgramado) * 100 : 0;

    // Perdas (Quantidade)
    const perdasTotais = filteredLoss.reduce((sum, r) => {
      if (r.unit === Unit.KG) return sum + r.quantity;
      return sum;
    }, 0);

    // Custo Perdas
    const custoPerdas = filteredLoss.reduce((sum, r) => sum + r.totalCost, 0);

    // Erros
    const errosProducao = filteredError.length;

    // Custo Erros
    const custoErros = filteredError.reduce((sum, r) => sum + r.cost, 0);

    // Custo Total (Perdas + Erros)
    const custoTotal = custoPerdas + custoErros;

    // Manutenção
    const ordensManutencao = filteredMaintenance.length;

    // Absenteísmo - Calcular dias perdidos considerando apenas dias dentro do período filtrado
    // Determinar intervalo de datas efetivo
    let effectiveStartDate: Date;
    let effectiveEndDate: Date;

    if (dateRange.start) {
      effectiveStartDate = new Date(dateRange.start);
    } else {
      // Sem filtro: usar intervalo de datas dos registros
      if (filteredAbsenteeism.length > 0) {
        const dates = filteredAbsenteeism.map(r => new Date(r.date));
        effectiveStartDate = new Date(Math.min(...dates.map(d => d.getTime())));
      } else {
        effectiveStartDate = new Date();
        effectiveStartDate.setDate(1);
      }
    }

    if (dateRange.end) {
      effectiveEndDate = new Date(dateRange.end);
    } else {
      // Sem filtro: usar intervalo de datas dos registros
      if (filteredAbsenteeism.length > 0) {
        const dates = filteredAbsenteeism.map(r => new Date(r.date));
        effectiveEndDate = new Date(Math.max(...dates.map(d => d.getTime())));
      } else {
        effectiveEndDate = new Date();
      }
    }

    const businessDays = countBusinessDays(effectiveStartDate, effectiveEndDate);

    // Calcular dias perdidos considerando interseção com período
    const totalDaysAbsent = filteredAbsenteeism.reduce((sum, r) => {
      const absenceStart = new Date(r.date);
      const absenceEnd = new Date(absenceStart);
      absenceEnd.setDate(absenceEnd.getDate() + (Number(r.daysAbsent) || 1) - 1);

      const effectiveStart = absenceStart > effectiveStartDate ? absenceStart : effectiveStartDate;
      const effectiveEnd = absenceEnd < effectiveEndDate ? absenceEnd : effectiveEndDate;

      if (effectiveStart <= effectiveEnd) {
        return sum + countBusinessDays(effectiveStart, effectiveEnd);
      }
      return sum;
    }, 0);

    const totalPossibleDays = employees.length * businessDays;
    const taxaAbsenteismo = totalPossibleDays > 0 ? (totalDaysAbsent / totalPossibleDays) * 100 : 0;

    return {
      velocidade,
      perdasTotais,
      errosProducao,
      ordensManutencao,
      taxaAbsenteismo,
      custoTotal,
      businessDays
    };
  }, [filteredSpeed, filteredLoss, filteredError, filteredMaintenance, filteredAbsenteeism, employees, dateRange]);

  const costEvolutionData = useMemo(() => {
    const monthlyData: Record<string, number> = {};

    const addToMonth = (dateStr: string, cost: number) => {
      if (!dateStr) return;
      const [y, m] = dateStr.split('-');
      if (!y || !m) return;
      const key = `${y}-${m}`;
      monthlyData[key] = (monthlyData[key] || 0) + cost;
    };

    filteredLoss.forEach(r => addToMonth(r.date, r.totalCost));
    filteredError.forEach(r => addToMonth(r.date, r.cost));

    const sortedKeys = Object.keys(monthlyData).sort();

    const allData = sortedKeys.map(key => {
      const [y, m] = key.split('-');
      return {
        name: `${m}/${y}`,
        'Custo Total (R$)': monthlyData[key]
      };
    });

    // Limitar aos últimos 6 meses apenas se não houver filtros aplicados
    if (!dateRange.start && !dateRange.end && allData.length > 6) {
      return allData.slice(-6);
    }
    return allData;
  }, [filteredLoss, filteredError, dateRange]);

  const chartData = useMemo(() => {
    const sectors = Object.values(Sector).filter(s => s !== Sector.MANUTENCAO);

    const speedBySector = filteredSpeed.reduce((acc, rec) => {
      const normalizedSector = normalizeSector(rec.sector);
      if (!acc[normalizedSector]) acc[normalizedSector] = { p: 0, r: 0 };
      acc[normalizedSector].p += rec.totalProgramado;
      acc[normalizedSector].r += rec.totalRealizado;
      return acc;
    }, {} as Record<string, { p: number, r: number }>);

    const lossesBySector = filteredLoss.reduce((acc, rec) => {
      const normalizedSector = normalizeSector(rec.sector);
      if (!acc[normalizedSector]) acc[normalizedSector] = { q: 0, c: 0 };
      if (rec.unit === Unit.KG) acc[normalizedSector].q += rec.quantity;
      acc[normalizedSector].c += rec.totalCost;
      return acc;
    }, {} as Record<string, { q: number, c: number }>);

    const errorsBySector = filteredError.reduce((acc, rec) => {
      const normalizedSector = normalizeSector(rec.sector);
      if (!acc[normalizedSector]) acc[normalizedSector] = { q: 0, c: 0, w: 0 };
      acc[normalizedSector].q += 1;
      acc[normalizedSector].c += rec.cost;
      acc[normalizedSector].w += rec.wastedQty || 0;
      return acc;
    }, {} as Record<string, { q: number, c: number, w: number }>);

    const employeesPerSector = Array.isArray(employees)
      ? employees.reduce((acc, emp) => {
        acc[emp.sector] = (acc[emp.sector] || 0) + 1;
        return acc;
      }, {} as Record<Sector, number>)
      : {} as Record<Sector, number>;

    const businessDays = kpiData.businessDays;

    const absenteeismBySector = filteredAbsenteeism.reduce((acc, rec) => {
      const normalizedSector = normalizeSector(rec.sector);
      if (!acc[normalizedSector]) acc[normalizedSector] = 0;
      acc[normalizedSector] += rec.daysAbsent;
      return acc;
    }, {} as Record<string, number>);

    return sectors.map(s => {
      const normalizedSector = normalizeSector(s);
      const speed = speedBySector[normalizedSector];
      const losses = lossesBySector[normalizedSector];
      const errors = errorsBySector[normalizedSector];

      const totalPossibleDaysInSector = (employeesPerSector[s] || 0) * businessDays;
      const daysAbsentInSector = absenteeismBySector[normalizedSector] || 0;
      const absenteeismRate = totalPossibleDaysInSector > 0 ? (daysAbsentInSector / totalPossibleDaysInSector) * 100 : 0;

      return {
        name: s,
        'Velocidade %': speed ? (speed.p > 0 ? (speed.r / speed.p) * 100 : 0) : 0,
        'Meta': 100,
        'Perdas (KG)': losses ? losses.q : 0,
        'Custo (R$) Perdas': losses ? losses.c : 0,
        'Quantidade': errors ? errors.q : 0,
        'Custo (R$) Erros': errors ? errors.c : 0,
        'Desperdício (KG)': errors ? Number(errors.w.toFixed(3)) : 0,
        'Taxa de Absenteísmo %': absenteeismRate,
      };
    });
  }, [filteredSpeed, filteredLoss, filteredError, filteredAbsenteeism, employees, kpiData.businessDays]);

  const maintenanceData = useMemo(() => {
    const stopsBySectorData = filteredMaintenance.reduce((acc, rec) => {
      const normalizedSector = normalizeSector(rec.sector);
      if (!acc[normalizedSector]) {
        acc[normalizedSector] = { count: 0, hours: 0 };
      }
      acc[normalizedSector].count += 1;
      acc[normalizedSector].hours += Number(rec.durationHours) || 0;
      return acc;
    }, {} as Record<string, { count: number; hours: number }>);

    const sectors = Object.values(Sector).filter(s => s !== Sector.MANUTENCAO);
    return sectors.map(sector => {
      const normalizedSector = normalizeSector(sector);
      const data = stopsBySectorData[normalizedSector] || { count: 0, hours: 0 };
      return {
        name: sector,
        'Ordens de Manutenção': data.count,
        'Horas Paradas': data.hours,
      };
    });
  }, [filteredMaintenance]);

  const absenteeismChartData = useMemo(() => {
    const sectors = Object.values(Sector).filter(s => s !== Sector.MANUTENCAO);

    const employeesPerSector = Array.isArray(employees)
      ? employees.reduce((acc, emp) => {
        acc[emp.sector] = (acc[emp.sector] || 0) + 1;
        return acc;
      }, {} as Record<Sector, number>)
      : ({} as Record<Sector, number>);

    const businessDays = kpiData.businessDays || 1;

    // Determinar período efetivo (mesmo do KPI)
    let effectiveStartDate: Date;
    let effectiveEndDate: Date;

    if (dateRange.start) {
      effectiveStartDate = new Date(dateRange.start);
    } else {
      if (filteredAbsenteeism.length > 0) {
        const dates = filteredAbsenteeism.map(r => new Date(r.date));
        effectiveStartDate = new Date(Math.min(...dates.map(d => d.getTime())));
      } else {
        effectiveStartDate = new Date();
        effectiveStartDate.setDate(1);
      }
    }

    if (dateRange.end) {
      effectiveEndDate = new Date(dateRange.end);
    } else {
      if (filteredAbsenteeism.length > 0) {
        const dates = filteredAbsenteeism.map(r => new Date(r.date));
        effectiveEndDate = new Date(Math.max(...dates.map(d => d.getTime())));
      } else {
        effectiveEndDate = new Date();
      }
    }

    const absenteeismBySector = filteredAbsenteeism.reduce((acc, rec) => {
      const normalizedSector = normalizeSector(rec.sector);
      if (!acc[normalizedSector]) acc[normalizedSector] = 0;

      // Calcular interseção
      const absenceStart = new Date(rec.date);
      const absenceEnd = new Date(absenceStart);
      absenceEnd.setDate(absenceEnd.getDate() + (Number(rec.daysAbsent) || 1) - 1);

      const effectiveStart = absenceStart > effectiveStartDate ? absenceStart : effectiveStartDate;
      const effectiveEnd = absenceEnd < effectiveEndDate ? absenceEnd : effectiveEndDate;

      if (effectiveStart <= effectiveEnd) {
        acc[normalizedSector] += countBusinessDays(effectiveStart, effectiveEnd);
      }

      return acc;
    }, {} as Record<string, number>);

    const result = sectors.map((sector) => {
      const normalizedSector = normalizeSector(sector);
      const totalPossibleDaysInSector = (employeesPerSector[sector] || 0) * businessDays;
      const daysAbsentInSector = absenteeismBySector[normalizedSector] || 0;
      const absenteeismRate =
        totalPossibleDaysInSector > 0 ? (daysAbsentInSector / totalPossibleDaysInSector) * 100 : 0;

      return {
        name: sector,
        'Taxa de Absenteísmo %': absenteeismRate,
      };
    });

    return result;
  }, [filteredAbsenteeism, employees, kpiData.businessDays]);

  // Constantes de estilização dos gráficos
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tickColor = isDarkMode ? '#94a3b8' : '#94a3b8';
  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
    borderColor: isDarkMode ? '#334155' : '#fff',
    color: isDarkMode ? '#f1f5f9' : '#1e293b',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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

  // Mostrar loading enquanto dados são carregados
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imac-primary"></div>
        <span className="ml-4 text-slate-600 dark:text-slate-400">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-imac-tertiary dark:text-imac-primary tracking-tight">Visão Geral da Produção</h1>
        <p className="text-md text-slate-500 dark:text-slate-400 mt-1">Os principais indicadores do setor produtivo em tempo real.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg dark:shadow-xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <DatePickerInput
              label="Data Início"
              value={dateRange.start}
              onChange={(date) => setDateRange({ ...dateRange, start: date })}
            />
          </div>
          <div>
            <DatePickerInput
              label="Data Fim"
              value={dateRange.end}
              onChange={(date) => setDateRange({ ...dateRange, end: date })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        <KpiCard title="Velocidade" value={formatBrazilianNumber(kpiData.velocidade, 1)} unit="%" icon={<Activity />} color={COLORS.primary} />
        <KpiCard title="Perdas Totais" value={formatBrazilianNumber(kpiData.perdasTotais, 1)} unit="KG" icon={<TrendingDown />} color={COLORS.error} />
        <KpiCard title="Erros" value={String(kpiData.errosProducao)} unit="" icon={<TriangleAlert />} color={'#F59E0B'} />
        <KpiCard title="Manutenção" value={String(kpiData.ordensManutencao)} unit="ordens" icon={<Wrench />} color={COLORS.tertiary} />
        <KpiCard title="Absenteísmo" value={formatBrazilianNumber(kpiData.taxaAbsenteismo, 2)} unit="%" icon={<UserMinus />} color={COLORS.success} />
        <KpiCard
          title="Custo Total (R$)"
          value={formatBrazilianNumber(kpiData.custoTotal, 2)}
          unit="R$"
          icon={<DollarSign />}
          color={'#EF4444'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Custo Total (R$)">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={costEvolutionData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="name" {...xAxisProps} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Custo Total']}
              />
              <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} iconType="circle" />
              <Area
                type="natural"
                dataKey="Custo Total (R$)"
                stroke="none"
                fill="url(#costGradient)"
                fillOpacity={1}
                legendType="none"
                name=""
                tooltipType="none"
              />
              <Line type="natural" dataKey="Custo Total (R$)" stroke="#EF4444" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#fff', stroke: '#EF4444', strokeWidth: 2 }}>
                <LabelList dataKey="Custo Total (R$)" position="top" formatter={(v) => `R$${formatChartNumber(Number(v))}`} style={{ fill: '#EF4444', fontSize: 16, fontWeight: 600 }} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
        <ChartContainer title="Velocidade de Produção por Setor">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="name"
                {...xAxisProps}
              />
              <YAxis tickFormatter={(tick) => `${Number(tick).toFixed(0)}%`} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => name === 'Velocidade %' ? [`${Number(value).toFixed(2)}%`, name] : [value, name]}
              />
              <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} iconType="circle" />
              <Bar dataKey="Velocidade %" fill={COLORS.primary} barSize={45} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Velocidade %" position="top" formatter={(v) => `${formatChartNumber(Number(v))}%`} style={{ fill: '#D99B61', fontSize: 16, fontWeight: 600 }} />
              </Bar>
              <Line type="monotone" dataKey="Meta" stroke={COLORS.tertiary} strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Perdas de Produção por Setor">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="name"
                {...xAxisProps}
              />
              <YAxis yAxisId="left" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ ...tooltipStyle, padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.name}</p>
                        <p style={{ color: COLORS.error }}>Perdas: {data['Perdas (KG)']} KG</p>
                        <p style={{ color: COLORS.tertiary }}>Custo: {data['Custo (R$) Perdas'].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} iconType="circle" />
              <Bar yAxisId="left" dataKey="Perdas (KG)" fill={COLORS.error} barSize={45} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Perdas (KG)" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#EF4444', fontSize: 16, fontWeight: 600 }} />
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="Custo (R$) Perdas" name="Custo (R$)" stroke={COLORS.tertiary} dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Erros de Produção por Setor">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="name"
                {...xAxisProps}
              />
              <YAxis yAxisId="left" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ ...tooltipStyle, padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.name}</p>
                        <p style={{ color: COLORS.secondary }}>Quantidade: {data['Quantidade']}</p>
                        <p style={{ color: COLORS.tertiary }}>Custo: {data['Custo (R$) Erros'].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p style={{ color: COLORS.error }}>Desperdício: {data['Desperdício (KG)']} KG</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} iconType="circle" />
              <Bar yAxisId="left" dataKey="Quantidade" fill={COLORS.secondary} barSize={45} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Quantidade" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#F3C78A', fontSize: 16, fontWeight: 600 }} />
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="Custo (R$) Erros" name="Custo (R$)" stroke={COLORS.tertiary} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Manutenção por Setor">
          {filteredMaintenance.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" key={`maintenance-${maintenanceRecords.length}-${JSON.stringify(maintenanceData)}`}>
              <BarChart data={maintenanceData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  {...xAxisProps}
                />
                <YAxis
                  tick={{ fill: tickColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const hours = Math.floor(Number(data['Horas Paradas']));
                      const minutes = Math.round((Number(data['Horas Paradas']) - hours) * 60);
                      return (
                        <div style={{
                          ...tooltipStyle,
                          padding: '12px',
                          border: `1px solid ${tooltipStyle.borderColor}`
                        }}>
                          <p style={{ fontWeight: 600, marginBottom: '8px' }}>{data.name}</p>
                          <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                            Ordens de Manutenção: <strong>{data['Ordens de Manutenção']}</strong>
                          </p>
                          <p style={{ fontSize: '14px', color: COLORS.tertiary }}>
                            Horas Paradas: <strong>{hours}:{String(minutes).padStart(2, '0')}h</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} iconType="circle" />
                <Bar dataKey="Ordens de Manutenção" fill={COLORS.tertiary} barSize={45} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="Ordens de Manutenção" position="top" formatter={(v) => formatChartNumber(Number(v))} style={{ fill: '#B36B3C', fontSize: 16, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>Nenhuma ordem de manutenção registrada no período</p>
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="Taxa de Absenteísmo por Setor">
          <ResponsiveContainer width="100%" height="100%" key={`absenteeism-${absenteeismRecords.length}-${JSON.stringify(absenteeismChartData)}`}>
            <ComposedChart data={absenteeismChartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
              <defs>
                <linearGradient id="absenteeismGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.6} />
                  <stop offset="50%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="name"
                {...xAxisProps}
                padding={{ left: 70, right: 70 }}
              />
              <YAxis
                tickFormatter={(tick) => `${Number(tick).toFixed(1)}%`}
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Taxa de Absenteísmo']}
              />
              <Area
                type="natural"
                dataKey="Taxa de Absenteísmo %"
                stroke="none"
                fill="url(#absenteeismGradient)"
                fillOpacity={1}
                legendType="none"
                tooltipType="none"
              />
              <Line
                type="natural"
                dataKey="Taxa de Absenteísmo %"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#fff', stroke: COLORS.primary, strokeWidth: 2 }}
              >
                <LabelList dataKey="Taxa de Absenteísmo %" position="top" formatter={(v) => `${formatChartNumber(Number(v))}%`} style={{ fill: COLORS.primary, fontSize: 16, fontWeight: 600 }} />
              </Line>
              <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} iconType="circle" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>

      </div>
    </div>
  );
};

export default Dashboard;
