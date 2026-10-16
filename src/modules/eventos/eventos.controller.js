import * as servico from './eventos.service.js';

export async function listar(req, res) {
  res.json(await servico.listar(req.usuario, req.valido.query));
}

export async function obter(req, res) {
  res.json(await servico.obter(req.usuario, req.valido.params.id));
}

export async function criar(req, res) {
  res.status(201).json(await servico.criar(req.usuario, req.valido.body));
}

export async function atualizar(req, res) {
  res.json(await servico.atualizar(req.usuario, req.valido.params.id, req.valido.body));
}

export async function excluir(req, res) {
  await servico.excluir(req.usuario, req.valido.params.id);
  res.status(204).end();
}
