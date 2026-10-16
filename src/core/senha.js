import bcrypt from 'bcryptjs';

const CUSTO_HASH = 10;

export const gerarHashSenha = (senha) => bcrypt.hash(senha, CUSTO_HASH);

export const conferirSenha = (senha, hash) => bcrypt.compare(senha, hash);
