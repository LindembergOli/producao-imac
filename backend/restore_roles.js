
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Restoring roles...');

    // Restore Admin
    await prisma.user.update({
        where: { email: 'admin@imac.com' },
        data: { role: 'ADMIN' }
    });
    console.log('Restored admin@imac.com -> ADMIN');

    // Restore Lider (Assuming, based on name)
    await prisma.user.update({
        where: { email: 'lider@imac.com' },
        data: { role: 'LIDER_PRODUCAO' }
    });
    console.log('Restored lider@imac.com -> LIDER_PRODUCAO');

    // Leave others as ESPECTADOR for now unless specified otherwise
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
