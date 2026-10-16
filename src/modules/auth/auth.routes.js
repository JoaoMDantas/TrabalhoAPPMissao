import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { limitarTentativas } from '../../core/middlewares/limitarTentativas.js';
import { validar } from '../../core/middlewares/validar.js';
import * as controller from './auth.controller.js';
import { esquemaLogin, esquemaRegistro } from './auth.schemas.js';

const rotas = Router();

rotas.post('/registrar', limitarTentativas, validar({ body: esquemaRegistro }), controller.registrar);
rotas.post('/login', limitarTentativas, validar({ body: esquemaLogin }), controller.entrar);
rotas.get('/eu', autenticar, controller.usuarioAtual);

export default rotas;
