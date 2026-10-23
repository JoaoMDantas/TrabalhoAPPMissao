import { disposicao } from '../../core/arquivos.js';
import * as servico from './documentos.service.js';

const EXIBE_NO_NAVEGADOR = new Set(['pdf', 'imagem']);

export async function listar(req, res) {
  res.json(await servico.listar(req.usuario, req.valido.query));
}

export async function obter(req, res) {
  res.json(await servico.obter(req.usuario, req.valido.params.id));
}

export async function criar(req, res) {
  res.status(201).json(await servico.criar(req.usuario, req.valido.body, req.files?.[0]));
}

export async function arquivo(req, res) {
  const { documento, conteudo } = await servico.abrirArquivo(req.usuario, req.valido.params.id);
  res.set({
    'Content-Type': documento.tipo_mime,
    'Content-Length': String(conteudo.length),
    'Content-Disposition': disposicao(documento.nome_arquivo, EXIBE_NO_NAVEGADOR.has(documento.grupo)),
    // Documento reservado: não fica guardado no aparelho (pode ser um celular compartilhado).
    'Cache-Control': 'private, no-store',
  });
  res.end(conteudo);
}

export async function excluir(req, res) {
  await servico.excluir(req.usuario, req.valido.params.id);
  res.status(204).end();
}
