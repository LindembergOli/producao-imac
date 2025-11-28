export enum Sector {
  CONFEITARIA = 'Confeitaria',
  PAES = 'Pães',
  SALGADO = 'Salgado',
  PAO_DE_QUEIJO = 'Pão de Queijo',
  EMBALADORA = 'Embaladora'
}

export enum Unit {
  KG = 'KG',
  UND = 'UND'
}

export enum LossType {
  MASSA = 'Massa',
  EMBALAGEM = 'Embalagem',
  INSUMO = 'Insumo'
}

export enum ErrorCategory {
    OPERACIONAL = 'Operacional',
    EQUIPAMENTO = 'Equipamento',
    MATERIAL = 'Material',
    QUALIDADE = 'Qualidade'
}

export enum MaintenanceStatus {
  EM_ABERTO = 'Em Aberto',
  FECHADO = 'Fechado'
}

export enum AbsenceType {
  ATESTADO = 'Atestado',
  FALTA_INJUSTIFICADA = 'Falta Injustificada',
  BANCO_DE_HORAS = 'Banco de Horas'
}

export interface Employee {
  id: number;
  sector: Sector;
  name: string;
  role?: string;
}

export interface Product {
  id: number;
  sector: Sector;
  name:string;
  unit: Unit;
  yield?: number;
  unit_cost?: number;
  notes?: string;
}

export interface Machine {
  id: number;
  sector: Sector;
  name: string;
  code: string;
}

export type Page = 
  | 'Dashboard' 
  | 'Velocidade' 
  | 'Perdas' 
  | 'Erros' 
  | 'Manutenção' 
  | 'Absenteísmo' 
  | 'Funcionários' 
  | 'Produtos' 
  | 'Máquinas';

// Production Data Record Types
export interface DailyProduction {
  programado: number;
  realizado: number;
}

export interface ProductionSpeedRecord {
    id: number;
    mesAno: string;
    sector: Sector;
    produto: string;
    metaMes: number;
    dailyProduction: DailyProduction[]; // Array of up to 31 days
    totalProgramado: number;
    totalRealizado: number;
    velocidade: number;
}

export interface LossRecord {
    id: number;
    date: string;
    sector: Sector;
    product: string;
    lossType: LossType;
    quantity: number;
    unit: Unit;
    unitCost: number;
    totalCost: number;
}

export interface ErrorRecord {
    id: number;
    date: string;
    sector: Sector;
    product: string;
    description: string;
    action?: string;
    category: ErrorCategory;
    cost: number;
}

export interface MaintenanceRecord {
    id: number;
    date: string;
    sector: Sector;
    machine: string;
    requester: string;
    technician?: string;
    problem: string;
    solution?: string;
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    durationHours: number;
    status: MaintenanceStatus;
}

export interface AbsenteeismRecord {
    id: number;
    employeeName: string;
    sector: Sector;
    date: string;
    absenceType: AbsenceType;
    daysAbsent: number;
}