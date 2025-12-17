const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configurações
const BACKUP_DIR = path.join(__dirname, '../../backups');
const DATE = new Date().toISOString().replace(/[:.]/g, '-');
const FILENAME = `backup_${DATE}.dump`;
const FILE_PATH = path.join(BACKUP_DIR, FILENAME);

// Garantir que o diretório de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Obter URL do banco de dados
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não definida no arquivo .env');
    process.exit(1);
}

console.log('📦 Iniciando backup do banco de dados...');
console.log(`📂 Diretório: ${BACKUP_DIR}`);
console.log(`📄 Arquivo: ${FILENAME}`);

// Comando pg_dump
// -F c: Formato Custom (comprimido por padrão, permite pg_restore)
// --no-owner: Não salvar informações de dono (evita erros em restore)
// --no-acl: Não salvar privilégios (evita erros em restore)
const command = `pg_dump "${DATABASE_URL}" -F c --no-owner --no-acl -f "${FILE_PATH}"`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Erro ao criar backup: ${error.message}`);
        return;
    }

    if (stderr) {
        // pg_dump escreve warnings no stderr, mas não necessariamente erros
        console.warn(`⚠️ Aviso: ${stderr}`);
    }

    console.log('✅ Backup concluído com sucesso!');
    console.log(`💾 Tamanho: ${(fs.statSync(FILE_PATH).size / 1024 / 1024).toFixed(2)} MB`);

    // Rotina de limpeza: Manter apenas os últimos 7 backups
    cleanOldBackups();
});

function cleanOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup_') && file.endsWith('.dump'))
        .map(file => ({
            name: file,
            path: path.join(BACKUP_DIR, file),
            time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Do mais novo para o mais antigo

    const KEEP_COUNT = 7;

    if (files.length > KEEP_COUNT) {
        console.log(`🧹 Removendo backups antigos (mantendo os ${KEEP_COUNT} mais recentes)...`);

        files.slice(KEEP_COUNT).forEach(file => {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Removido: ${file.name}`);
        });
    }
}
