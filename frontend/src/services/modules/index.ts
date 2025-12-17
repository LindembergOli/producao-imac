/**
 * SERVIÇOS DE API - INDEX
 * 
 * Exporta todos os serviços modulares para facilitar importação
 */

// Cliente HTTP base
export { default as api } from '../api';

// Serviços modulares
export * from './employees';
export * from './machines';
export * from './products';
export * from './production';
export * from './losses';
export * from './errors';
export * from './maintenance';
export * from './absenteeism';
