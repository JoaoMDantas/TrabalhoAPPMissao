import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { validar } from '../../core/middlewares/validar.js';
import { paramsComId } from '../../core/validacao.js';
import * as controller from './mural.controller.js';
import { esquemaMensagem, filtrosMural } from './mural.schemas.js';

const rotas = Router();

rotas.use(autenticar);

rotas.get('/', validar({ query: filtrosMural }), controller.listar);
rotas.post('/', validar({ body: esquemaMensagem }), controller.criar);
rotas.delete('/:id', validar({ params: paramsComId }), controller.excluir);

export default rotas;
