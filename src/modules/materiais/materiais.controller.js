import { pipeline } from 'node:stream/promises';
import * as servico from './materiais.service.js';

export async function listar(req, res) {
  res.json(await servico.listar(req.usuario));
}

export async function obter(req, res) {
  res.json(await servico.obter(req.usuario, req.valido.params.id));
}

export async function criar(req, res) {
  res.status(201).json(await servico.criar(req.usuario, req.valido.body));
}

export async function excluir(req, res) {
  await servico.excluir(req.usuario, req.valido.params.id);
  res.status(204).end();
}

export async function arquivo(req, res) {
  const { fluxo, tamanho, nome } = await servico.abrirPdf(req.valido.params.id);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${nome}"`,
    // O arquivo pode ficar guardado no aparelho: é o que permite ler sem internet depois.
    'Cache-Control': 'private, max-age=604800',
  });
  if (tamanho) res.set('Content-Length', String(tamanho));

  try {
    await pipeline(fluxo, res);
  } catch {
    // Conexão interrompida no meio do envio (pela pessoa ou pelo site de origem): não há mais como responder.
    res.destroy();
  }
}
