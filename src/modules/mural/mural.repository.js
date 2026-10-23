import { consultar, consultarUm } from '../../config/database.js';
import { montarWhere } from '../../core/sql.js';

const SELECT_MENSAGEM = `
  SELECT m.id, m.conteudo, m.tipo, m.autor_id, u.nome AS autor_nome, u.papel AS autor_papel,
         m.igreja_id, i.nome AS igreja_nome, m.criado_em
  FROM mensagens m
  JOIN usuarios u ON u.id = m.autor_id
  LEFT JOIN igrejas i ON i.id = m.igreja_id`;

/**
 * Lista da mais nova para a mais antiga pela data de publicação (no empate, pelo id).
 * "antes_de" (id da última mensagem exibida) continua a lista na mesma ordem, sem repetir mensagens.
 */
export async function listar({ tipo, igreja_id: igrejaId, antes_de: antesDe, limite }) {
  const condicoes = [];
  const parametros = [];

  if (tipo) {
    condicoes.push('m.tipo = ?');
    parametros.push(tipo);
  }
  if (igrejaId) {
    condicoes.push('m.igreja_id = ?');
    parametros.push(igrejaId);
  }
  if (antesDe) {
    condicoes.push('(m.criado_em, m.id) < ((SELECT criado_em FROM mensagens WHERE id = ?), ?)');
    parametros.push(antesDe, antesDe);
  }

  parametros.push(limite);
  return consultar(
    `${SELECT_MENSAGEM} ${montarWhere(condicoes)} ORDER BY m.criado_em DESC, m.id DESC LIMIT ?`,
    parametros,
  );
}

export async function buscarPorId(id) {
  return consultarUm(`${SELECT_MENSAGEM} WHERE m.id = ?`, [id]);
}

// "executar" permite rodar dentro de uma transação (ver transacao() em config/database.js).
export async function criar(dados, autorId, executar = consultar) {
  const resultado = await executar('INSERT INTO mensagens (conteudo, tipo, autor_id, igreja_id) VALUES (?, ?, ?, ?)', [
    dados.conteudo ?? '',
    dados.tipo,
    autorId,
    dados.igreja_id,
  ]);
  return resultado.insertId;
}

export async function adicionarFoto(mensagemId, ordem, foto, executar = consultar) {
  await executar('INSERT INTO mensagens_fotos (mensagem_id, ordem, tipo_mime, tamanho, conteudo) VALUES (?, ?, ?, ?, ?)', [
    mensagemId,
    ordem,
    foto.tipo_mime,
    foto.conteudo.length,
    foto.conteudo,
  ]);
}

/** Fotos (só os ids, sem o conteúdo) das mensagens informadas, na ordem em que foram enviadas. */
export async function listarFotos(idsMensagens) {
  if (!idsMensagens.length) return [];
  return consultar('SELECT id, mensagem_id FROM mensagens_fotos WHERE mensagem_id IN (?) ORDER BY mensagem_id, ordem, id', [
    idsMensagens,
  ]);
}

export async function buscarFoto(id) {
  return consultarUm('SELECT id, tipo_mime, conteudo FROM mensagens_fotos WHERE id = ?', [id]);
}

export async function excluir(id) {
  await consultar('DELETE FROM mensagens WHERE id = ?', [id]);
}
