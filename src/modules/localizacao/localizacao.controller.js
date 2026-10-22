import * as servico from './localizacao.service.js';

export async function buscar(req, res) {
  res.json(await servico.buscarEndereco(req.valido.query.q));
}
