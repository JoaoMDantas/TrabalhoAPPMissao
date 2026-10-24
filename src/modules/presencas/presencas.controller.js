import * as servico from './presencas.service.js';

export async function confirmar(req, res) {
  res.json(await servico.marcar(req.usuario, req.valido.params.id, true));
}

export async function cancelar(req, res) {
  res.json(await servico.marcar(req.usuario, req.valido.params.id, false));
}

export async function listar(req, res) {
  res.json(await servico.listar(req.valido.params.id));
}
