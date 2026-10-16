import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const ambiente = process.env.NODE_ENV || 'development';
const ehTeste = ambiente === 'test';
const ehProducao = ambiente === 'production';

function segredoJwt() {
  const segredo = process.env.JWT_SECRET || (ehTeste ? 'segredo-usado-apenas-nos-testes-automatizados' : '');
  if (!segredo) {
    throw new Error('JWT_SECRET não definido. Copie .env.example para .env e preencha os valores.');
  }
  if (ehProducao && segredo.length < 32) {
    throw new Error('JWT_SECRET precisa ter pelo menos 32 caracteres em produção.');
  }
  return segredo;
}

export const config = Object.freeze({
  ambiente,
  ehTeste,
  ehProducao,
  porta: Number(process.env.PORT) || 3000,
  db: Object.freeze({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: ehTeste
      ? process.env.DB_NAME_TEST || 'projeto_missionario_test'
      : process.env.DB_NAME || 'projeto_missionario',
    timezone: process.env.DB_TIMEZONE || '-03:00',
  }),
  jwt: Object.freeze({
    segredo: segredoJwt(),
    expiracao: process.env.JWT_EXPIRES_IN || '7d',
  }),
});
