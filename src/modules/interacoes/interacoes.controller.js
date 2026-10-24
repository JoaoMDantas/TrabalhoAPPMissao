import * as servico from './interacoes.service.js';

/** Controladores das rotas de curtidas e comentários de um tipo de item ("mural" ou "eventos"). */
export const controladores = (alvo) => ({
  async curtir(req, res) {
    res.json(await servico.curtir(alvo, req.usuario, req.valido.params.id, true));
  },

  async descurtir(req, res) {
    res.json(await servico.curtir(alvo, req.usuario, req.valido.params.id, false));
  },

  async listarCurtidas(req, res) {
    res.json(await servico.listarCurtidas(alvo, req.valido.params.id));
  },

  async listarComentarios(req, res) {
    res.json(await servico.listarComentarios(alvo, req.usuario, req.valido.params.id));
  },

  async comentar(req, res) {
    res.status(201).json(await servico.comentar(alvo, req.usuario, req.valido.params.id, req.valido.body));
  },

  async excluirComentario(req, res) {
    const { id, comentarioId } = req.valido.params;
    await servico.excluirComentario(alvo, req.usuario, id, comentarioId);
    res.status(204).end();
  },
});
