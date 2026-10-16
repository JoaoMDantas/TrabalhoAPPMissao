import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { autorizar } from '../../core/middlewares/autorizar.js';
import { validar } from '../../core/middlewares/validar.js';
import { PAPEIS } from '../../core/permissoes.js';
import { paramsComId } from '../../core/validacao.js';
import * as controller from './igrejas.controller.js';
import { esquemaIgreja, filtrosIgrejas } from './igrejas.schemas.js';

const rotas = Router();

// Pública: alimenta o campo "igreja" da tela de cadastro.
rotas.get('/opcoes', controller.listarOpcoes);

rotas.use(autenticar);

rotas.get('/', validar({ query: filtrosIgrejas }), controller.listar);
rotas.get('/:id', validar({ params: paramsComId }), controller.obter);
rotas.post('/', autorizar(PAPEIS.LIDER, PAPEIS.ADMIN), validar({ body: esquemaIgreja }), controller.criar);
rotas.put('/:id', validar({ params: paramsComId, body: esquemaIgreja }), controller.atualizar);
rotas.delete('/:id', validar({ params: paramsComId }), controller.excluir);

export default rotas;
