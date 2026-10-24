import { Router } from 'express';
import { validar } from '../../core/middlewares/validar.js';
import { paramsComId } from '../../core/validacao.js';
import { controladores } from './interacoes.controller.js';
import { esquemaComentario, paramsComentario } from './interacoes.schemas.js';

/**
 * Curtidas e comentários de um tipo de item ("mural" ou "eventos"). São montadas dentro das rotas
 * do próprio item, depois do login: /api/mural/:id/curtida, /api/eventos/:id/comentarios etc.
 */
export function rotasDeInteracoes(alvo) {
  const rotas = Router();
  const controller = controladores(alvo);

  rotas.put('/:id/curtida', validar({ params: paramsComId }), controller.curtir);
  rotas.delete('/:id/curtida', validar({ params: paramsComId }), controller.descurtir);
  rotas.get('/:id/curtidas', validar({ params: paramsComId }), controller.listarCurtidas);
  rotas.get('/:id/comentarios', validar({ params: paramsComId }), controller.listarComentarios);
  rotas.post('/:id/comentarios', validar({ params: paramsComId, body: esquemaComentario }), controller.comentar);
  rotas.delete('/:id/comentarios/:comentarioId', validar({ params: paramsComentario }), controller.excluirComentario);

  return rotas;
}
