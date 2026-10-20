import * as servico from './usuarios.service.js';

export async function listar(req, res) {
  res.json(await servico.listar(req.valido.query));
}

export async function obter(req, res) {
  res.json(await servico.obter(req.valido.params.id));
}

export async function atualizarPerfil(req, res) {
  res.json(await servico.atualizarPerfil(req.usuario, req.valido.body));
}

export async function redefinirSenha(req, res) {
  res.json(await servico.redefinirSenha(req.valido.params.id));
}

export async function trocarSenha(req, res) {
  await servico.trocarSenha(req.usuario, req.valido.body);
  res.status(204).end();
}
