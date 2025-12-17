
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log('--- USERS LIST ---');
    users.forEach(u => {
        console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
    });
    console.log('------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
