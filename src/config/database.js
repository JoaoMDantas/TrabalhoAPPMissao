import mysql from 'mysql2/promise';
import { config } from './env.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  charset: 'utf8mb4',
  timezone: config.db.timezone,
  // Datas trafegam como texto 'AAAA-MM-DD HH:MM:SS', evitando conversões de fuso no Node.
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
});

pool.on('connection', (conexao) => {
  conexao.query('SET time_zone = ?', [config.db.timezone], (erro) => {
    if (erro) console.error('Falha ao definir o fuso horário da conexão MySQL:', erro.message);
  });
});

/** Executa SQL parametrizado. Retorna as linhas (SELECT) ou o resultado (INSERT/UPDATE/DELETE). */
export async function consultar(sql, parametros = []) {
  const [resultado] = await pool.query(sql, parametros);
  return resultado;
}

export async function consultarUm(sql, parametros = []) {
  const linhas = await consultar(sql, parametros);
  return linhas[0] ?? null;
}

export async function encerrarBanco() {
  await pool.end();
}
