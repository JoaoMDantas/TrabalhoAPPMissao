import { criarApp } from './app.js';
import { config } from './config/env.js';
import { consultar, encerrarBanco } from './config/database.js';

const app = criarApp();

const servidor = app.listen(config.porta, () => {
  console.log(`Projeto Missionário rodando em http://localhost:${config.porta}`);
});

consultar('SELECT 1')
  .then(() => console.log(`Conectado ao MySQL (banco "${config.db.database}").`))
  .catch((erro) => {
    console.error(`Não foi possível conectar ao MySQL: ${erro.message}`);
    console.error('Confira o arquivo .env e rode "npm run db:migrate".');
  });

function desligar() {
  servidor.close(() => {
    encerrarBanco().finally(() => process.exit(0));
  });
}

process.on('SIGINT', desligar);
process.on('SIGTERM', desligar);
