import { Router } from 'express';
import { autenticar } from '../../core/middlewares/autenticar.js';
import { receberArquivos } from '../../core/middlewares/receberArquivos.js';
import { validar } from '../../core/middlewares/validar.js';
import { paramsComId } from '../../core/validacao.js';
import * as controller from './documentos.controller.js';
import { LIMITE_DOCUMENTO_MB, esquemaDocumento, filtrosDocumentos } from './documentos.schemas.js';

const rotas = Router();

rotas.use(autenticar);

rotas.get('/', validar({ query: filtrosDocumentos }), controller.listar);
rotas.post('/', receberArquivos('arquivo', { limiteMb: LIMITE_DOCUMENTO_MB }), validar({ body: esquemaDocumento }), controller.criar);
rotas.get('/:id', validar({ params: paramsComId }), controller.obter);
rotas.get('/:id/arquivo', validar({ params: paramsComId }), controller.arquivo);
rotas.delete('/:id', validar({ params: paramsComId }), controller.excluir);

export default rotas;
