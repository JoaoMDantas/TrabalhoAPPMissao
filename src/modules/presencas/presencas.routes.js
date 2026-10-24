import { Router } from 'express';
import { validar } from '../../core/middlewares/validar.js';
import { paramsComId } from '../../core/validacao.js';
import * as controller from './presencas.controller.js';

/** Confirmação de presença. É montada dentro das rotas da agenda, depois do login: /api/eventos/:id/presenca. */
const rotas = Router();

rotas.put('/:id/presenca', validar({ params: paramsComId }), controller.confirmar);
rotas.delete('/:id/presenca', validar({ params: paramsComId }), controller.cancelar);
rotas.get('/:id/presencas', validar({ params: paramsComId }), controller.listar);

export default rotas;
