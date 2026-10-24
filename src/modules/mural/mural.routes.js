import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { receberArquivos } from '../../core/middlewares/receberArquivos.js';
import { validar } from '../../core/middlewares/validar.js';
import { paramsComId } from '../../core/validacao.js';
import { rotasDeInteracoes } from '../interacoes/interacoes.routes.js';
import * as controller from './mural.controller.js';
import { LIMITE_FOTO_MB, MAXIMO_FOTOS, esquemaMensagem, filtrosMural, linkDaFoto } from './mural.schemas.js';

const rotas = Router();

// Fotos abrem em <img>, que não envia o login: o acesso é pelo link assinado que a listagem entrega.
rotas.get('/fotos/:id', validar({ params: paramsComId, query: linkDaFoto }), controller.foto);

rotas.use(autenticar);

rotas.get('/', validar({ query: filtrosMural }), controller.listar);
rotas.post(
  '/',
  receberArquivos('fotos', { limiteMb: LIMITE_FOTO_MB, maximo: MAXIMO_FOTOS, item: 'foto' }),
  validar({ body: esquemaMensagem }),
  controller.criar,
);
rotas.delete('/:id', validar({ params: paramsComId }), controller.excluir);

// Curtidas e comentários: /api/mural/:id/curtida e /api/mural/:id/comentarios.
rotas.use(rotasDeInteracoes('mural'));

export default rotas;
