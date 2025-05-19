// src/lib/db.ts
import { Pool } from 'pg';

let pool: Pool;

// O Next.js carrega automaticamente as variáveis de ambiente de .env.local
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn(
    "A variável de ambiente POSTGRES_URL não está definida. A conexão com o banco de dados não será estabelecida."
  );
  // Você pode optar por lançar um erro aqui se uma conexão de banco de dados for estritamente necessária
  // throw new Error("POSTGRES_URL não está definida. Verifique seu arquivo .env.local");
}

// Padrão Singleton para o pool de conexões para evitar múltiplas instâncias em hot-reloads no desenvolvimento
if (process.env.NODE_ENV === 'production') {
  if (!connectionString) {
     throw new Error("POSTGRES_URL é obrigatória em produção.");
  }
  pool = new Pool({
    connectionString: connectionString,
    // Configurações adicionais para produção, como SSL, podem ser adicionadas aqui
    // ssl: {
    //   rejectUnauthorized: false, // Ajuste conforme necessário para seu provedor de DB
    // },
  });
} else {
  // No ambiente de desenvolvimento, reutilize a conexão existente se ela existir no objeto global.
  // Isso evita criar um novo pool a cada recarregamento de módulo devido ao HMR (Hot Module Replacement).
  if (!(global as any).pgPool && connectionString) {
    (global as any).pgPool = new Pool({
      connectionString: connectionString,
    });
  }
  if (connectionString) {
    pool = (global as any).pgPool;
  }
}

/**
 * Executa uma consulta SQL no banco de dados.
 * @param text A string da consulta SQL.
 * @param params Um array de parâmetros para a consulta SQL.
 * @returns Uma promessa que resolve com o resultado da consulta.
 * @throws Se o pool de banco de dados não estiver inicializado.
 */
export async function query(text: string, params?: any[]) {
  if (!pool) {
    if (!connectionString) {
      throw new Error(
        "Pool de banco de dados não inicializado. A variável de ambiente POSTGRES_URL não está definida."
      );
    } else {
      // Tenta inicializar o pool se ainda não o fez (cenário de desenvolvimento)
      // Este bloco pode ser redundante se a lógica acima for suficiente
      if (!(global as any).pgPool) {
        (global as any).pgPool = new Pool({ connectionString });
      }
      pool = (global as any).pgPool;
      if (!pool) { // Verificação final
         throw new Error("Falha ao inicializar o pool de banco de dados mesmo após tentativa.");
      }
    }
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta executada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro ao executar consulta', { text, params, error });
    throw error;
  }
}

// Exporta o pool para permitir gerenciamento manual de transações quando necessário
export { pool };
