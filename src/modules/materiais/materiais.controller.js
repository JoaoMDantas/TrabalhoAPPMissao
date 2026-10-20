import * as servico from './materiais.service.js';

export async function listar(req, res) {
  res.json(await servico.listar(req.usuario));
}

export async function criar(req, res) {
  res.status(201).json(await servico.criar(req.usuario, req.valido.body));
}

export async function excluir(req, res) {
  await servico.excluir(req.usuario, req.valido.params.id);
  res.status(204).end();
}
