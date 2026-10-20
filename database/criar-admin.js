/**
 * Cria a conta de administrador a partir das variáveis ADMIN_NOME, ADMIN_EMAIL e ADMIN_SENHA,
 * se ela ainda não existir. Roda a cada "npm start" e não faz nada quando o admin já está cadastrado.
 */
import { consultar, consultarUm, encerrarBanco } from '../src/config/database.js';
import { gerarHashSenha } from '../src/core/senha.js';

async function criarAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA;
  if (!email || !senha) {
    console.log('ADMIN_EMAIL/ADMIN_SENHA não definidos: nenhuma conta de administrador criada.');
    return;
  }
  if (await consultarUm('SELECT id FROM usuarios WHERE email = ?', [email])) return;

  await consultar('INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)', [
    process.env.ADMIN_NOME || 'Administrador',
    email,
    await gerarHashSenha(senha),
    'admin',
  ]);
  console.log(`Administrador criado: ${email}`);
}

criarAdmin()
  .catch((erro) => {
    console.error(`Erro ao criar o administrador: ${erro.message}`);
    process.exitCode = 1;
  })
  .finally(encerrarBanco);
