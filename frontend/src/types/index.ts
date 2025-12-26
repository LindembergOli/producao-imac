/**
 * Tipos e Interfaces do Sistema IMAC Congelados
 * 
 * Define todos os tipos TypeScript usados no frontend.
 * Mantém sincronização com o schema Prisma do backend.
 */

// ============================================
// ENUMS - Valores Padronizados
// ============================================

/**
 * Setores da fábrica IMAC Congelados
 */
export enum Sector {
  CONFEITARIA = 'CONFEITARIA',
  PAES = 'PÃES',
  SALGADO = 'SALGADO',
  PAO_DE_QUEIJO = 'PÃO DE QUEIJO',
  EMBALADORA = 'EMBALADORA',
  MANUTENCAO = 'MANUTENÇÃO'
}

/**
 * Unidades de medida para produtos
 */
export enum Unit {
  KG = 'KG',    // Quilogramas
  UND = 'UND'   // Unidades
}

/**
 * Tipos de perda na produção
 */
export enum LossType {
  MASSA = 'Massa',
  EMBALAGEM = 'Embalagem',
  INSUMO = 'Insumo'
}

/**
 * Categorias de erros de produção
 */
export enum ErrorCategory {
  OPERACIONAL = 'Operacional',  // Erro humano ou de processo
  EQUIPAMENTO = 'Equipamento',  // Falha de máquina
  MATERIAL = 'Material',        // Problema com matéria-prima
  QUALIDADE = 'Qualidade'       // Não conformidade de qualidade
}

/**
 * Status de ordens de manutenção
 */
export enum MaintenanceStatus {
  EM_ABERTO = 'Em Aberto',  // Aguardando resolução
  FECHADO = 'Fechado'       // Resolvido
}

/**
 * Tipos de ausência de funcionários
 */
export enum AbsenceType {
  ATESTADO = 'Atestado',                      // Atestado médico
  FALTA_INJUSTIFICADA = 'Falta Injustificada', // Falta sem justificativa
  BANCO_DE_HORAS = 'Banco de Horas'           // Compensação de horas
}

// ============================================
// INTERFACES - Cadastros Base
// ============================================

/**
 * Representa um funcionário da fábrica
 */
export interface Employee {
  id: number;
  sector: Sector;
  name: string;
  role?: string;  // Cargo/função (opcional)
}

/**
 * Representa um produto fabricado
 */
export interface Product {
  id: number;
  sector: Sector;
  name: string;
  unit: Unit;
  yield?: number;      // Rendimento esperado
  unitCost?: number;   // Custo unitário
  notes?: string;      // Observações adicionais
}

/**
 * Representa um supply (matéria-prima/insumo)
 */
export interface Supply {
  id: number;
  sector: Sector;
  name: string;
  unit: Unit;
  unitCost: number;    // Custo por KG
  notes?: string;      // Observações adicionais
}

/**
 * Representa uma máquina da fábrica
 */
export interface Machine {
  id: number;
  sector: Sector;
  name: string;
  code: string;  // Código único de identificação
}

/**
 * Páginas disponíveis no sistema
 * Usado para navegação e controle de acesso
 */
export type Page =
  | 'Dashboard'
  | 'Velocidade'
  | 'Perdas'
  | 'Erros'
  | 'Manutenção'
  | 'Absenteísmo'
  | 'Funcionários'
  | 'Produtos'
  | 'Insumos'
  | 'Máquinas'
  | 'Usuários';

// ============================================
// INTERFACES - Registros de Produção
// ============================================

/**
 * Produção diária (programada vs realizada)
 * Usado dentro de ProductionSpeedRecord
 */
export interface DailyProduction {
  programado: number;  // Quantidade planejada para o dia
  realizado: number;   // Quantidade efetivamente produzida
}

/**
 * Registro de velocidade de produção mensal
 * 
 * Rastreia metas mensais e produção diária por setor/produto.
 * A velocidade é calculada como: (totalRealizado / totalProgramado) * 100
 * 
 * @example
 * {
 *   id: 1,
 *   mesAno: "01/2024",
 *   sector: Sector.CONFEITARIA,
 *   produto: "Bolo de Chocolate",
 *   metaMes: 1000,
 *   dailyProduction: [{programado: 50, realizado: 45}, ...],
 *   totalProgramado: 1000,
 *   totalRealizado: 950,
 *   velocidade: 95.0
 * }
 */
export interface ProductionSpeedRecord {
  id: number;
  mesAno: string;                      // Formato: MM/YYYY
  sector: Sector;
  produto: string;
  metaMes: number;                     // Meta total do mês em unidades
  dailyProduction: DailyProduction[];  // Array de até 31 dias
  totalProgramado: number;             // Soma de todos os dias programados
  totalRealizado: number;              // Soma de todos os dias realizados
  velocidade: number;                  // Percentual de atingimento (0-100+)
}

/**
 * Registro de perda de produção
 * 
 * Rastreia perdas de materiais (massa, embalagem, insumos)
 * com cálculo automático de custo total.
 */
export interface LossRecord {
  id: number;
  date: string;         // Formato: YYYY-MM-DD
  sector: Sector;
  product: string;
  lossType: LossType;
  quantity: number;     // Quantidade perdida
  unit: Unit;           // Unidade de medida
  unitCost: number;     // Custo por unidade
  totalCost: number;    // Calculado: quantity * unitCost
}

/**
 * Registro de erro de produção
 * 
 * Documenta erros ocorridos na produção com descrição,
 * ação corretiva e custo associado.
 */
export interface ErrorRecord {
  id: number;
  date: string;              // Formato: YYYY-MM-DD
  sector: Sector;
  product: string;
  description: string;       // Descrição do erro
  action?: string;           // Ação corretiva tomada (opcional)
  category: ErrorCategory;
  cost: number;              // Custo estimado do erro
  wastedQty?: number;        // Quantidade desperdiçada (opcional)
}

/**
 * Registro de manutenção de máquinas
 * 
 * Rastreia solicitações de manutenção com tempo de duração
 * e status de resolução.
 */
export interface MaintenanceRecord {
  id: number;
  date: string;              // Formato: YYYY-MM-DD
  sector: Sector;
  machine: string;
  requester: string;         // Quem solicitou a manutenção
  technician?: string;       // Técnico responsável (opcional)
  problem: string;           // Descrição do problema
  solution?: string;         // Solução aplicada (opcional)
  startTime: string;         // Formato: HH:MM
  endTime: string;           // Formato: HH:MM
  durationHours: number;     // Calculado: endTime - startTime
  status: MaintenanceStatus;
}

/**
 * Registro de absenteísmo de funcionários
 * 
 * Rastreia ausências de funcionários por tipo e duração.
 * Usado para calcular taxa de absenteísmo por setor.
 */
export interface AbsenteeismRecord {
  id: number;
  employeeName: string;
  sector: Sector;
  date: string;              // Formato: YYYY-MM-DD
  absenceType: AbsenceType;
  daysAbsent: number;        // Número de dias ausentes
}