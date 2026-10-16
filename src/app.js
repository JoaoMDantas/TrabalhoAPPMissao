import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { consultar } from './config/database.js';
import { rotaNaoEncontrada, tratarErros } from './core/middlewares/tratarErros.js';
import { registrarModulos } from './modules/index.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function criarApi() {
  const api = express.Router();

  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  api.get('/saude', async (req, res) => {
    await consultar('SELECT 1');
    res.json({ status: 'ok' });
  });

  registrarModulos(api);
  api.use(rotaNaoEncontrada);
  return api;
}

export function criarApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        // Mantém o app acessível por http no celular (ex.: http://192.168.0.10:3000) durante os testes na rede local.
        directives: { upgradeInsecureRequests: null },
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', criarApi());

  app.use('/vendor/bootstrap', express.static(path.join(RAIZ, 'node_modules/bootstrap/dist')));
  app.use('/vendor/bootstrap-icons', express.static(path.join(RAIZ, 'node_modules/bootstrap-icons/font')));
  app.use(express.static(path.join(RAIZ, 'public')));

  app.use(tratarErros);
  return app;
}
