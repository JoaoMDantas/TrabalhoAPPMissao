import * as servico from './auth.service.js';

export async function registrar(req, res) {
  res.status(201).json(await servico.registrar(req.valido.body));
}

export async function entrar(req, res) {
  res.json(await servico.entrar(req.valido.body));
}

export function usuarioAtual(req, res) {
  res.json(req.usuario);
}
