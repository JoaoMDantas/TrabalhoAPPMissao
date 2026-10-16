import { consultar, consultarUm } from '../../config/database.js';
import { montarWhere } from '../../core/sql.js';

const SELECT_MENSAGEM = `
  SELECT m.id, m.conteudo, m.tipo, m.autor_id, u.nome AS autor_nome, u.papel AS autor_papel,
         m.igreja_id, i.nome AS igreja_nome, m.criado_em
  FROM mensagens m
  JOIN usuarios u ON u.id = m.autor_id
  LEFT JOIN igrejas i ON i.id = m.igreja_id`;

/** Lista da mais nova para a mais antiga. "antes_de" (id) pagina sem repetir mensagens. */
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
    condicoes.push('m.id < ?');
    parametros.push(antesDe);
  }

  parametros.push(limite);
  return consultar(`${SELECT_MENSAGEM} ${montarWhere(condicoes)} ORDER BY m.id DESC LIMIT ?`, parametros);
}

export async function buscarPorId(id) {
  return consultarUm(`${SELECT_MENSAGEM} WHERE m.id = ?`, [id]);
}

export async function criar(dados, autorId) {
  const resultado = await consultar('INSERT INTO mensagens (conteudo, tipo, autor_id, igreja_id) VALUES (?, ?, ?, ?)', [
    dados.conteudo,
    dados.tipo,
    autorId,
    dados.igreja_id,
  ]);
  return resultado.insertId;
}

export async function excluir(id) {
  await consultar('DELETE FROM mensagens WHERE id = ?', [id]);
}
