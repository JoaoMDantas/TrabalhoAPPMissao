import { identificarDocumento, nomeLimpo } from '../../core/arquivos.js';
import { erros } from '../../core/erros.js';
import { ehAdmin, ehLiderDaIgreja } from '../../core/permissoes.js';
import { garantirExiste as garantirIgrejaExiste } from '../igrejas/igrejas.service.js';
import * as repositorio from './documentos.repository.js';

/*
 * Documentos reservados: só quem faz parte da igreja (e o admin) vê. A liderança da igreja adiciona e remove.
 * Para quem não é da igreja, o documento simplesmente "não existe" (404), sem revelar que ele está lá.
 */
const podeVer = (usuario, documento) => ehAdmin(usuario) || usuario.igreja_id === documento.igreja_id;
const podeGerenciar = (usuario, igrejaId) => ehAdmin(usuario) || ehLiderDaIgreja(usuario, igrejaId);

const comPermissoes = (usuario, documento) => ({
  ...documento,
  pode_excluir: podeGerenciar(usuario, documento.igreja_id),
});

/** A igreja de quem pede; o admin pode escolher qualquer igreja. */
async function igrejaAlvo(usuario, igrejaIdPedida) {
  if (ehAdmin(usuario) && igrejaIdPedida) {
    await garantirIgrejaExiste(igrejaIdPedida);
    return igrejaIdPedida;
  }
  if (!usuario.igreja_id) {
    throw erros.requisicaoInvalida('Você ainda não faz parte de uma igreja. Escolha a sua igreja em "Meu perfil".');
  }
  return usuario.igreja_id;
}

async function buscarVisivel(usuario, id) {
  const documento = await repositorio.buscarPorId(id);
  if (!documento || !podeVer(usuario, documento)) throw erros.naoEncontrado('Documento não encontrado.');
  return documento;
}

export async function listar(usuario, filtros) {
  const igrejaId = await igrejaAlvo(usuario, filtros.igreja_id);
  const documentos = await repositorio.listar(igrejaId);
  return documentos.map((documento) => comPermissoes(usuario, documento));
}

export async function obter(usuario, id) {
  return comPermissoes(usuario, await buscarVisivel(usuario, id));
}

export async function criar(usuario, dados, arquivo) {
  const igrejaId = await igrejaAlvo(usuario, dados.igreja_id);
  if (!podeGerenciar(usuario, igrejaId)) throw erros.semPermissao('Apenas a liderança da igreja pode adicionar documentos.');
  if (!arquivo) throw erros.requisicaoInvalida('Escolha o arquivo do documento.');

  const tipo = identificarDocumento(arquivo.buffer, arquivo.originalname);
  if (!tipo) {
    throw erros.requisicaoInvalida('Tipo de arquivo não aceito. Envie PDF, Word, Excel, PowerPoint ou imagem (JPG, PNG ou WebP).');
  }

  const id = await repositorio.criar(
    {
      igreja_id: igrejaId,
      titulo: dados.titulo,
      descricao: dados.descricao,
      nome_arquivo: nomeLimpo(arquivo.originalname, tipo.extensao),
      tipo_mime: tipo.mime,
      grupo: tipo.grupo,
      conteudo: arquivo.buffer,
    },
    usuario.id,
  );
  return obter(usuario, id);
}

/** Conteúdo do arquivo para abrir ou baixar. */
export async function abrirArquivo(usuario, id) {
  const documento = await buscarVisivel(usuario, id);
  const { conteudo } = await repositorio.buscarConteudo(id);
  return { documento, conteudo };
}

export async function excluir(usuario, id) {
  const documento = await buscarVisivel(usuario, id);
  if (!podeGerenciar(usuario, documento.igreja_id)) throw erros.semPermissao('Apenas a liderança da igreja pode remover documentos.');
  await repositorio.excluir(id);
}
