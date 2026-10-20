import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { autorizar } from '../../core/middlewares/autorizar.js';
import { validar } from '../../core/middlewares/validar.js';
import { PAPEIS } from '../../core/permissoes.js';
import { paramsComId } from '../../core/validacao.js';
import * as controller from './usuarios.controller.js';
import { esquemaPerfil, esquemaTrocaSenha, filtrosUsuarios } from './usuarios.schemas.js';

const rotas = Router();

rotas.use(autenticar);

rotas.get('/', validar({ query: filtrosUsuarios }), controller.listar);
rotas.put('/eu', validar({ body: esquemaPerfil }), controller.atualizarPerfil);
rotas.put('/eu/senha', validar({ body: esquemaTrocaSenha }), controller.trocarSenha);
rotas.get('/:id', validar({ params: paramsComId }), controller.obter);
rotas.post('/:id/redefinir-senha', autorizar(PAPEIS.ADMIN), validar({ params: paramsComId }), controller.redefinirSenha);

export default rotas;
