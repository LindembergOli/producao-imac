import { updateSchema } from './src/modules/production/validator.js';

const data = {
    sector: 'Pães',
    mesAno: '01/2024',
    produto: 'Teste',
    metaMes: 100,
    dailyProduction: [{ programado: 10, realizado: 10 }],
    totalProgramado: 10,
    totalRealizado: 10,
    velocidade: 100
};

console.log('Testando validação com dados:', JSON.stringify(data, null, 2));

try {
    const result = await updateSchema.parseAsync(data);
    console.log('Sucesso! Resultado transformado:', JSON.stringify(result, null, 2));
} catch (e) {
    console.error('Erro na validação:', e);
}
