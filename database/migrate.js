/**
 * Aplica as migrations de database/migrations em ordem e registra cada uma na tabela "migracoes".
 *
 * Uso:
 *   node database/migrate.js            aplica as migrations pendentes
 *   node database/migrate.js --reset    apaga e recria o banco do zero
 *   node database/migrate.js --test     usa o banco de testes (DB_NAME_TEST)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const argumentos = new Set(process.argv.slice(2));
const modoTeste = argumentos.has('--test');
const resetar = argumentos.has('--reset');

// O ambiente precisa ser definido antes de carregar a configuração.
if (modoTeste) process.env.NODE_ENV = 'test';
const { config } = await import('../src/config/env.js');

const PASTA_MIGRATIONS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

async function executar() {
  const { host, port, user, password, database } = config.db;

  if (!/^[A-Za-z0-9_]+$/.test(database)) throw new Error(`Nome de banco inválido: "${database}".`);
  if (resetar && config.ehProducao) throw new Error('--reset não é permitido em produção.');
  if (modoTeste && !database.endsWith('_test')) {
    throw new Error(`Por segurança, o banco de testes precisa terminar com "_test" (atual: "${database}").`);
  }

  const conexao = await mysql.createConnection({ host, port, user, password, charset: 'utf8mb4', multipleStatements: true });

  try {
    if (resetar) {
      await conexao.query(`DROP DATABASE IF EXISTS \`${database}\``);
      console.log(`Banco "${database}" apagado.`);
    }

    await conexao.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await conexao.query(`USE \`${database}\``);
    await conexao.query(`
      CREATE TABLE IF NOT EXISTS migracoes (
        id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nome         VARCHAR(200) NOT NULL UNIQUE,
        executada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci`);

    const [linhas] = await conexao.query('SELECT nome FROM migracoes');
    const aplicadas = new Set(linhas.map((linha) => linha.nome));
    const arquivos = (await fs.readdir(PASTA_MIGRATIONS)).filter((nome) => nome.endsWith('.sql')).sort();

    let novas = 0;
    for (const arquivo of arquivos) {
      if (aplicadas.has(arquivo)) continue;
      const sql = await fs.readFile(path.join(PASTA_MIGRATIONS, arquivo), 'utf8');
      await conexao.query(sql);
      await conexao.query('INSERT INTO migracoes (nome) VALUES (?)', [arquivo]);
      console.log(`  + ${arquivo}`);
      novas += 1;
    }

    console.log(novas ? `${novas} migration(s) aplicada(s) em "${database}".` : `Banco "${database}" já está atualizado.`);
  } finally {
    await conexao.end();
  }
}

executar().catch((erro) => {
  console.error(`Erro ao executar as migrations: ${erro.message}`);
  if (erro.code === 'ER_ACCESS_DENIED_ERROR') console.error('Confira DB_USER e DB_PASSWORD no arquivo .env.');
  if (erro.code === 'ECONNREFUSED') console.error('O MySQL não está rodando ou DB_HOST/DB_PORT estão incorretos.');
  process.exitCode = 1;
});
