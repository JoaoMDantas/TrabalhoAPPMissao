import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { validar } from '../../core/middlewares/validar.js';
import { paramsComId } from '../../core/validacao.js';
import { rotasDeInteracoes } from '../interacoes/interacoes.routes.js';
import * as controller from './eventos.controller.js';
import { esquemaEvento, filtrosEventos } from './eventos.schemas.js';

const rotas = Router();

rotas.use(autenticar);

rotas.get('/', validar({ query: filtrosEventos }), controller.listar);
rotas.get('/:id', validar({ params: paramsComId }), controller.obter);
rotas.post('/', validar({ body: esquemaEvento }), controller.criar);
rotas.put('/:id', validar({ params: paramsComId, body: esquemaEvento }), controller.atualizar);
rotas.delete('/:id', validar({ params: paramsComId }), controller.excluir);

// Curtidas e comentários: /api/eventos/:id/curtida e /api/eventos/:id/comentarios.
rotas.use(rotasDeInteracoes('eventos'));

export default rotas;
