// Script para criar usuário admin no Supabase
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔐 Gerando hash da senha...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        console.log('👤 Criando usuário admin...');
        const user = await prisma.user.upsert({
            where: { email: 'admin@imac.com' },
            update: {
                password: hashedPassword
            },
            create: {
                email: 'admin@imac.com',
                password: hashedPassword,
                name: 'Administrador',
                role: 'ADMIN'
            }
        });

        console.log('✅ Usuário admin criado com sucesso!');
        console.log('📧 Email:', user.email);
        console.log('🔑 Senha: admin123');
        console.log('');
        console.log('🎯 Use essas credenciais para fazer login no sistema');
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
