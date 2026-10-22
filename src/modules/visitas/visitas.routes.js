import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { validar } from '../../core/middlewares/validar.js';
import { paramsComId } from '../../core/validacao.js';
import * as controller from './visitas.controller.js';
import { esquemaVisita, filtrosVisitas } from './visitas.schemas.js';

const rotas = Router();

rotas.use(autenticar);

rotas.get('/', validar({ query: filtrosVisitas }), controller.listar);
rotas.get('/:id', validar({ params: paramsComId }), controller.obter);
rotas.post('/', validar({ body: esquemaVisita }), controller.criar);
rotas.put('/:id', validar({ params: paramsComId, body: esquemaVisita }), controller.atualizar);
rotas.delete('/:id', validar({ params: paramsComId }), controller.excluir);

export default rotas;
