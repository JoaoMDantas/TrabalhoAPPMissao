import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { baixarArquivo } from '../../core/download-seguro.js';
import { erros } from '../../core/erros.js';
import { podeGerenciar } from '../../core/permissoes.js';
import * as repositorio from './materiais.repository.js';

const PASTA_MATERIAIS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public/materiais');
const LIMITE_PDF = 25 * 1024 * 1024;
// A especificação do PDF permite alguns bytes antes do cabeçalho "%PDF-"; por isso a busca nos primeiros 1024.
const ehPdf = (inicio) => inicio.subarray(0, 1024).includes('%PDF-');

// Materiais da trilha inicial não têm autor (criado_por nulo): só o admin pode excluí-los.
const comPermissoes = (usuario, material) => ({
  ...material,
  pode_excluir: podeGerenciar(usuario, { autorId: material.criado_por }),
});

async function buscar(id) {
  const material = await repositorio.buscarPorId(id);
  if (!material) throw erros.naoEncontrado('Material não encontrado.');
  return material;
}

/** Links de visualização do Google Drive viram o link de download direto do arquivo. */
export function linkDeDownload(url) {
  const drive = /^https:\/\/drive\.google\.com\/(?:file\/d\/([\w-]+)|open\?id=([\w-]+))/.exec(url);
  return drive ? `https://drive.google.com/uc?export=download&id=${drive[1] ?? drive[2]}` : url;
}

/** Nome de arquivo seguro a partir do título: "Revista Evangelização 01" -> "revista-evangelizacao-01.pdf". */
export function nomeDoArquivo(titulo) {
  const base = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'material'}.pdf`;
}

export async function listar(usuario) {
  const materiais = await repositorio.listar();
  return materiais.map((material) => comPermissoes(usuario, material));
}

export async function obter(usuario, id) {
  return comPermissoes(usuario, await buscar(id));
}

export async function criar(usuario, dados) {
  const id = await repositorio.criar(dados, usuario.id);
  return comPermissoes(usuario, await repositorio.buscarPorId(id));
}

export async function excluir(usuario, id) {
  const material = await buscar(id);
  if (!comPermissoes(usuario, material).pode_excluir) throw erros.semPermissao('Você não pode excluir este material.');
  await repositorio.excluir(id);
}

/**
 * Abre o PDF de um material para leitura dentro do aplicativo: arquivo do próprio app ou baixado do site
 * de origem pelo servidor (o navegador não pode ler arquivos de outros sites diretamente).
 */
export async function abrirPdf(id) {
  const material = await buscar(id);
  if (material.tipo !== 'pdf') throw erros.requisicaoInvalida('Este material não é um PDF.');
  const nome = nomeDoArquivo(material.titulo);

  if (material.url.startsWith('/materiais/')) {
    const arquivo = path.basename(material.url);
    const info = /^\w[\w.-]*\.pdf$/i.test(arquivo) ? await stat(path.join(PASTA_MATERIAIS, arquivo)).catch(() => null) : null;
    if (!info?.isFile()) throw erros.naoEncontrado('Arquivo do material não encontrado.');
    return { fluxo: createReadStream(path.join(PASTA_MATERIAIS, arquivo)), tamanho: info.size, nome };
  }

  const { fluxo, tamanho } = await baixarArquivo(linkDeDownload(material.url), {
    limiteBytes: LIMITE_PDF,
    validarInicio: ehPdf,
  });
  return { fluxo, tamanho, nome };
}
