/**
 * Dados Mock para desenvolvimento e demonstração
 */

import type {
    Employee,
    Product,
    Machine,
    ProductionSpeedRecord,
    LossRecord,
    ErrorRecord,
    MaintenanceRecord,
    AbsenteeismRecord
} from '../types';
import { Sector, Unit, LossType, ErrorCategory, MaintenanceStatus, AbsenceType } from '../types';

// Funcionários
export const mockEmployees: Employee[] = [
    { id: 1, sector: Sector.PAES, name: 'João Silva', role: 'Padeiro Chefe' },
    { id: 2, sector: Sector.CONFEITARIA, name: 'Maria Souza', role: 'Confeiteira Pleno' },
    { id: 3, sector: Sector.SALGADO, name: 'Carlos Pereira', role: 'Salgadeiro' },
    { id: 4, sector: Sector.EMBALADORA, name: 'Ana Costa', role: 'Embaladora' },
    { id: 5, sector: Sector.PAO_DE_QUEIJO, name: 'Pedro Martins', role: 'Chapeiro' },
    { id: 6, sector: Sector.PAES, name: 'Mariana Lima', role: 'Padeira Jr' },
    { id: 7, sector: Sector.CONFEITARIA, name: 'Fernanda Alves', role: 'Auxiliar de Confeitaria' },
];

// Produtos
export const mockProducts: Product[] = [
    { id: 1, sector: Sector.PAES, name: 'Pão Francês', unit: Unit.KG, yield: 100, unit_cost: 5.50, notes: 'Produto principal da padaria.' },
    { id: 2, sector: Sector.CONFEITARIA, name: 'Bolo de Chocolate', unit: Unit.UND, yield: 1, unit_cost: 25.00, notes: 'Cobertura de brigadeiro.' },
    { id: 3, sector: Sector.SALGADO, name: 'Coxinha de Frango', unit: Unit.UND, yield: 50, unit_cost: 1.50, notes: 'Tamanho festa.' },
    { id: 4, sector: Sector.PAO_DE_QUEIJO, name: 'Pão de Queijo Tradicional', unit: Unit.KG, yield: 200, unit_cost: 12.00 },
    { id: 5, sector: Sector.EMBALADORA, name: 'Embalagem Plástica Pão Francês', unit: Unit.UND, unit_cost: 0.20 },
    { id: 6, sector: Sector.SALGADO, name: 'Esfiha de Carne', unit: Unit.UND, yield: 60, unit_cost: 1.80 },
];

// Máquinas
export const mockMachines: Machine[] = [
    { id: 1, sector: Sector.PAES, name: 'Forno Turbo F-01', code: 'FRN-001' },
    { id: 2, sector: Sector.CONFEITARIA, name: 'Batedeira Planetária BP-20L', code: 'BAT-001' },
    { id: 3, sector: Sector.SALGADO, name: 'Masseira M-50', code: 'MAS-001' },
    { id: 4, sector: Sector.EMBALADORA, name: 'Seladora Automática S-300', code: 'SEL-001' },
    { id: 5, sector: Sector.PAO_DE_QUEIJO, name: 'Modeladora PQP-5000', code: 'MOD-001' },
];

// Helper para gerar opções de mês/ano
export const getMesAnoOptions = () => {
    const options = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        options.push(`${month}/${year}`);
        date.setMonth(date.getMonth() - 1);
    }
    return options;
};

const mesAnoOptions = getMesAnoOptions();

// Registros de Velocidade de Produção
export const mockSpeedRecords: ProductionSpeedRecord[] = [
    {
        id: 1,
        mesAno: mesAnoOptions[0],
        sector: Sector.PAES,
        produto: 'Pão Francês',
        metaMes: 5000,
        dailyProduction: Array(31).fill(0).map((_, i) => ({
            programado: i < 22 ? 170 : 0,
            realizado: i < 22 ? Math.floor(160 + Math.random() * 20) : 0
        })),
        totalProgramado: 3740,
        totalRealizado: 3650,
        velocidade: 97.6
    },
    {
        id: 2,
        mesAno: mesAnoOptions[0],
        sector: Sector.CONFEITARIA,
        produto: 'Bolo de Chocolate',
        metaMes: 300,
        dailyProduction: Array(31).fill(0).map((_, i) => ({
            programado: i < 22 ? 10 : 0,
            realizado: i < 22 ? Math.floor(8 + Math.random() * 4) : 0
        })),
        totalProgramado: 220,
        totalRealizado: 210,
        velocidade: 95.5
    },
    {
        id: 3,
        mesAno: mesAnoOptions[0],
        sector: Sector.SALGADO,
        produto: 'Coxinha de Frango',
        metaMes: 10000,
        dailyProduction: Array(31).fill(0).map((_, i) => ({
            programado: i < 22 ? 350 : 0,
            realizado: i < 22 ? Math.floor(340 + Math.random() * 15) : 0
        })),
        totalProgramado: 7700,
        totalRealizado: 7550,
        velocidade: 98.1
    },
];

// Registros de Perdas
export const mockLossRecords: LossRecord[] = [
    { id: 1, date: '2024-07-15', sector: Sector.SALGADO, product: 'Coxinha de Frango', lossType: LossType.MASSA, quantity: 5, unit: Unit.KG, unitCost: 10, totalCost: 50 },
    { id: 2, date: '2024-07-15', sector: Sector.PAES, product: 'Pão Francês', lossType: LossType.MASSA, quantity: 12, unit: Unit.KG, unitCost: 5.5, totalCost: 66 },
    { id: 3, date: '2024-07-14', sector: Sector.CONFEITARIA, product: 'Bolo de Chocolate', lossType: LossType.INSUMO, quantity: 2, unit: Unit.UND, unitCost: 25, totalCost: 50 },
    { id: 4, date: '2024-07-13', sector: Sector.EMBALADORA, product: 'Embalagem Plástica Pão Francês', lossType: LossType.EMBALAGEM, quantity: 100, unit: Unit.UND, unitCost: 0.2, totalCost: 20 },
];

// Registros de Erros
export const mockErrorRecords: ErrorRecord[] = [
    { id: 1, date: '2024-07-15', sector: Sector.PAES, product: 'Pão Francês', description: 'Massa passou do ponto de fermentação', action: 'Descartado 10kg de massa', category: ErrorCategory.OPERACIONAL, cost: 55 },
    { id: 2, date: '2024-07-14', sector: Sector.CONFEITARIA, product: 'Bolo de Chocolate', description: 'Queimou no forno', action: 'Ajustado termostato do forno', category: ErrorCategory.EQUIPAMENTO, cost: 25 },
    { id: 3, date: '2024-07-13', sector: Sector.SALGADO, product: 'Coxinha de Frango', description: 'Falta de recheio em um lote', action: 'Lote separado para reanálise', category: ErrorCategory.QUALIDADE, cost: 75 },
    { id: 4, date: '2024-07-12', sector: Sector.PAES, product: 'Pão Francês', description: 'Farinha de baixa qualidade recebida', action: 'Devolvido ao fornecedor', category: ErrorCategory.MATERIAL, cost: 0 },
];

// Registros de Manutenção
export const mockMaintenanceRecords: MaintenanceRecord[] = [
    { id: 1, date: '2024-07-15', sector: Sector.PAES, machine: 'Forno Turbo F-01', requester: 'João Silva', technician: 'Mecânico A', problem: 'Não está aquecendo corretamente', solution: 'Troca da resistência', startTime: '08:00', endTime: '10:30', durationHours: 2.5, status: MaintenanceStatus.FECHADO },
    { id: 2, date: '2024-07-16', sector: Sector.SALGADO, machine: 'Masseira M-50', requester: 'Carlos Pereira', technician: 'Mecânico B', problem: 'Barulho estranho no motor', startTime: '14:00', endTime: '14:00', durationHours: 0, status: MaintenanceStatus.EM_ABERTO },
    { id: 3, date: '2024-07-14', sector: Sector.PAES, machine: 'Forno Turbo F-01', requester: 'João Silva', problem: 'Porta não veda', solution: 'Ajuste na borracha de vedação', startTime: '09:00', endTime: '09:45', durationHours: 0.75, status: MaintenanceStatus.FECHADO },
];

// Registros de Absenteísmo
export const mockAbsenteeismRecords: AbsenteeismRecord[] = [
    { id: 1, employeeName: 'João Silva', sector: Sector.PAES, date: '2024-07-15', absenceType: AbsenceType.ATESTADO, daysAbsent: 2 },
    { id: 2, employeeName: 'Carlos Pereira', sector: Sector.SALGADO, date: '2024-07-12', absenceType: AbsenceType.FALTA_INJUSTIFICADA, daysAbsent: 1 },
    { id: 3, employeeName: 'Ana Costa', sector: Sector.EMBALADORA, date: '2024-07-10', absenceType: AbsenceType.BANCO_DE_HORAS, daysAbsent: 1 },
    { id: 4, employeeName: 'Maria Souza', sector: Sector.CONFEITARIA, date: '2024-07-15', absenceType: AbsenceType.ATESTADO, daysAbsent: 1 },
];
