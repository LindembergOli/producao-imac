
const BASE_URL = 'http://[::1]:3002/api/auth';
const USERS = [
    {
        name: 'Administrador',
        email: 'admin@imac.com',
        password: 'SenhaForte@123',
        role: 'ADMIN'
    },
    {
        name: 'Líder de Produção',
        email: 'lider@imac.com',
        password: 'SenhaForte@123',
        role: 'LIDER_PRODUCAO'
    },
    {
        name: 'Espectador',
        email: 'espectador@imac.com',
        password: 'SenhaForte@123',
        role: 'ESPECTADOR'
    }
];

async function createUsers() {
    console.log('🚀 Iniciando criação de usuários de teste...');

    for (const user of USERS) {
        try {
            console.log(`\nTentando criar usuário: ${user.name} (${user.role})...`);
            const response = await fetch(`${BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(user)
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`✅ Sucesso! Usuário criado: ${user.email}`);
            } else {
                if (data.error && data.error.code === 'P2002') {
                    console.log(`⚠️ Usuário já existe: ${user.email}`);
                } else if (data.message && data.message.includes('email already exists')) {
                    console.log(`⚠️ Usuário já existe: ${user.email}`);
                } else {
                    console.error(`❌ Erro ao criar ${user.email}:`, data);
                }
            }
        } catch (error) {
            console.error(`❌ Erro de conexão ao criar ${user.email}:`, error.message);
        }
    }

    console.log('\n🏁 Processo finalizado!');
}

createUsers();
