import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { validar } from '../../core/middlewares/validar.js';
import * as controller from './localizacao.controller.js';
import { filtrosBusca } from './localizacao.schemas.js';

const rotas = Router();

rotas.use(autenticar);

rotas.get('/buscar', validar({ query: filtrosBusca }), controller.buscar);

export default rotas;
