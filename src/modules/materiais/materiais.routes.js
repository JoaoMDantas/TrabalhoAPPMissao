import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { autorizar } from '../../core/middlewares/autorizar.js';
import { limitarDownloads } from '../../core/middlewares/limitarDownloads.js';
import { validar } from '../../core/middlewares/validar.js';
import { PAPEIS } from '../../core/permissoes.js';
import { paramsComId } from '../../core/validacao.js';
import * as controller from './materiais.controller.js';
import { esquemaMaterial } from './materiais.schemas.js';

const rotas = Router();

rotas.use(autenticar);

rotas.get('/', controller.listar);
rotas.post('/', autorizar(PAPEIS.LIDER, PAPEIS.ADMIN), validar({ body: esquemaMaterial }), controller.criar);
rotas.get('/:id', validar({ params: paramsComId }), controller.obter);
rotas.get('/:id/arquivo', limitarDownloads, validar({ params: paramsComId }), controller.arquivo);
rotas.delete('/:id', validar({ params: paramsComId }), controller.excluir);

export default rotas;
