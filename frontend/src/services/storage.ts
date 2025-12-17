/**
 * Serviço de Storage Local Seguro
 * Gerencia localStorage com validação, versionamento e segurança
 */

const STORAGE_VERSION = '1.0';
const VERSION_KEY = 'imac_storage_version';

interface StorageOptions<T> {
  key: string;
  defaultValue: T;
  validator?: (data: any) => boolean;
  version?: string;
}

/**
 * Salva dados no localStorage com validação
 */
export function saveToStorage<T>(key: string, data: T): boolean {
  try {
    const storageData = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data: data
    };
    
    localStorage.setItem(key, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
    return false;
  }
}

/**
 * Carrega dados do localStorage com validação
 */
export function loadFromStorage<T>(options: StorageOptions<T>): T {
  const { key, defaultValue, validator } = options;
  
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const storedItem = localStorage.getItem(key);
    
    if (!storedItem) {
      return defaultValue;
    }

    const parsed = JSON.parse(storedItem);
    
    // Verificar estrutura do storage
    if (!parsed.data) {
      console.warn(`Dados em ${key} estão em formato antigo, usando padrão`);
      localStorage.removeItem(key);
      return defaultValue;
    }

    // Validar versão
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`Versão incompatível em ${key}, migrando dados`);
      // Aqui você pode adicionar lógica de migração se necessário
    }

    // Validar dados se validator fornecido
    if (validator && !validator(parsed.data)) {
      console.warn(`Dados inválidos em ${key}, usando padrão`);
      localStorage.removeItem(key);
      return defaultValue;
    }

    return parsed.data as T;
  } catch (error) {
    console.error(`Erro ao carregar ${key} do localStorage:`, error);
    // Limpar dados corrompidos
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignorar erro de remoção
    }
    return defaultValue;
  }
}

/**
 * Remove dados do localStorage
 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erro ao remover ${key} do localStorage:`, error);
    return false;
  }
}

/**
 * Limpa todos os dados do storage da aplicação
 */
export function clearAllStorage(): boolean {
  try {
    const keys = Object.keys(localStorage);
    const imacKeys = keys.filter(key => key.startsWith('imac_'));
    
    imacKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
    return false;
  }
}

/**
 * Exporta todos os dados para backup
 */
export function exportAllData(): string {
  try {
    const keys = Object.keys(localStorage);
    const imacKeys = keys.filter(key => key.startsWith('imac_'));
    
    const backup: Record<string, any> = {};
    imacKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        backup[key] = JSON.parse(value);
      }
    });
    
    return JSON.stringify({
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      data: backup
    }, null, 2);
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return '';
  }
}

/**
 * Importa dados de backup
 */
export function importAllData(jsonData: string): boolean {
  try {
    const backup = JSON.parse(jsonData);
    
    if (!backup.data) {
      throw new Error('Formato de backup inválido');
    }
    
    Object.entries(backup.data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return false;
  }
}

/**
 * Obtém tamanho usado do localStorage em KB
 */
export function getStorageSize(): number {
  try {
    let total = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        total += key.length + value.length;
      }
    });
    
    return Math.round(total / 1024 * 100) / 100; // KB com 2 decimais
  } catch (error) {
    console.error('Erro ao calcular tamanho do storage:', error);
    return 0;
  }
}
