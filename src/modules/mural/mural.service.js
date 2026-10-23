import { transacao } from '../../config/database.js';
import { identificarImagem } from '../../core/arquivos.js';
import { assinar, assinaturaValida } from '../../core/assinatura.js';
import { erros } from '../../core/erros.js';
import { PAPEIS, podeGerenciar } from '../../core/permissoes.js';
import { garantirExiste as garantirIgrejaExiste } from '../igrejas/igrejas.service.js';
import * as repositorio from './mural.repository.js';

const comPermissoes = (usuario, mensagem) => ({
  ...mensagem,
  pode_excluir: podeGerenciar(usuario, { autorId: mensagem.autor_id, igrejaId: mensagem.igreja_id }),
});

const recursoDaFoto = (id) => `foto-mural:${id}`;

/** Endereço assinado da foto: abre em <img> sem o login no cabeçalho, mas não fica aberto para a internet. */
function enderecoDaFoto(id) {
  const { expira, assinatura } = assinar(recursoDaFoto(id));
  return `/api/mural/fotos/${id}?expira=${expira}&assinatura=${assinatura}`;
}

async function comFotosEPermissoes(usuario, mensagens) {
  const fotos = await repositorio.listarFotos(mensagens.map((mensagem) => mensagem.id));
  const porMensagem = new Map();
  for (const foto of fotos) {
    if (!porMensagem.has(foto.mensagem_id)) porMensagem.set(foto.mensagem_id, []);
    porMensagem.get(foto.mensagem_id).push({ id: foto.id, url: enderecoDaFoto(foto.id) });
  }
  return mensagens.map((mensagem) => ({ ...comPermissoes(usuario, mensagem), fotos: porMensagem.get(mensagem.id) ?? [] }));
}

export async function listar(usuario, filtros) {
  return comFotosEPermissoes(usuario, await repositorio.listar(filtros));
}

export async function criar(usuario, dados, arquivos = []) {
  if (dados.tipo === 'aviso' && usuario.papel === PAPEIS.MISSIONARIO) {
    throw erros.semPermissao('Apenas líderes e administradores podem publicar avisos.');
  }
  if (!dados.conteudo && !arquivos.length) throw erros.requisicaoInvalida('Escreva uma mensagem ou adicione uma foto.');
  if (dados.igreja_id) await garantirIgrejaExiste(dados.igreja_id);

  // O tipo de cada foto é conferido pelo conteúdo, e não pelo nome do arquivo.
  const fotos = arquivos.map((arquivo) => {
    const tipo = identificarImagem(arquivo.buffer);
    if (!tipo) throw erros.requisicaoInvalida('As fotos precisam ser imagens JPG, PNG ou WebP.');
    return { tipo_mime: tipo.mime, conteudo: arquivo.buffer };
  });

  // Mensagem e fotos entram juntas: se uma foto falhar, a mensagem também não é publicada.
  const id = await transacao(async (executar) => {
    const novoId = await repositorio.criar(dados, usuario.id, executar);
    for (const [ordem, foto] of fotos.entries()) await repositorio.adicionarFoto(novoId, ordem, foto, executar);
    return novoId;
  });

  const [criada] = await comFotosEPermissoes(usuario, [await repositorio.buscarPorId(id)]);
  return criada;
}

export async function abrirFoto(id, { expira, assinatura }) {
  if (!assinaturaValida(recursoDaFoto(id), expira, assinatura)) {
    throw erros.semPermissao('O link desta foto venceu. Atualize o mural para ver a foto.');
  }
  const foto = await repositorio.buscarFoto(id);
  if (!foto) throw erros.naoEncontrado('Foto não encontrada.');
  return foto;
}

export async function excluir(usuario, id) {
  const mensagem = await repositorio.buscarPorId(id);
  if (!mensagem) throw erros.naoEncontrado('Mensagem não encontrada.');
  if (!comPermissoes(usuario, mensagem).pode_excluir) throw erros.semPermissao('Você não pode excluir esta mensagem.');
  await repositorio.excluir(id);
}
