import { consultar, consultarUm } from '../../config/database.js';

// "alvo" é uma das configurações de interacoes.alvos.js (tabelas da mensagem ou do evento).

/** Totais de curtidas e de comentários de vários itens de uma vez, e se a pessoa já curtiu cada um. */
export async function totais(alvo, ids, usuarioId) {
  if (!ids.length) return { curtidas: [], comentarios: [] };
  const [curtidas, comentarios] = await Promise.all([
    consultar(
      `SELECT ${alvo.coluna} AS id, COUNT(*) AS total, MAX(usuario_id = ?) AS curtiu
       FROM ${alvo.tabelaCurtidas} WHERE ${alvo.coluna} IN (?) GROUP BY ${alvo.coluna}`,
      [usuarioId, ids],
    ),
    consultar(
      `SELECT ${alvo.coluna} AS id, COUNT(*) AS total
       FROM ${alvo.tabelaComentarios} WHERE ${alvo.coluna} IN (?) GROUP BY ${alvo.coluna}`,
      [ids],
    ),
  ]);
  return { curtidas, comentarios };
}

// Curtir de novo não duplica: a curtida (item + pessoa) já existe e nada muda.
export async function curtir(alvo, id, usuarioId) {
  await consultar(
    `INSERT INTO ${alvo.tabelaCurtidas} (${alvo.coluna}, usuario_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE usuario_id = usuario_id`,
    [id, usuarioId],
  );
}

export async function descurtir(alvo, id, usuarioId) {
  await consultar(`DELETE FROM ${alvo.tabelaCurtidas} WHERE ${alvo.coluna} = ? AND usuario_id = ?`, [id, usuarioId]);
}

export async function contarCurtidas(alvo, id) {
  const { total } = await consultarUm(`SELECT COUNT(*) AS total FROM ${alvo.tabelaCurtidas} WHERE ${alvo.coluna} = ?`, [id]);
  return total;
}

/** Quem curtiu, da curtida mais recente para a mais antiga. */
export async function listarCurtidas(alvo, id) {
  return consultar(
    `SELECT u.id, u.nome
     FROM ${alvo.tabelaCurtidas} c
     JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.${alvo.coluna} = ?
     ORDER BY c.criado_em DESC, u.id DESC`,
    [id],
  );
}

const selectComentario = (alvo) => `
  SELECT c.id, c.conteudo, c.autor_id, u.nome AS autor_nome, u.papel AS autor_papel, c.criado_em
  FROM ${alvo.tabelaComentarios} c
  JOIN usuarios u ON u.id = c.autor_id`;

/** Os comentários mais recentes (até "limite"), exibidos na ordem da conversa: do mais antigo para o mais novo. */
export async function listarComentarios(alvo, id, limite) {
  return consultar(
    `SELECT * FROM (
       ${selectComentario(alvo)} WHERE c.${alvo.coluna} = ? ORDER BY c.criado_em DESC, c.id DESC LIMIT ?
     ) recentes
     ORDER BY criado_em, id`,
    [id, limite],
  );
}

/** Comentário de um item específico: o de outro item não é encontrado. */
export async function buscarComentario(alvo, id, comentarioId) {
  return consultarUm(`${selectComentario(alvo)} WHERE c.id = ? AND c.${alvo.coluna} = ?`, [comentarioId, id]);
}

export async function criarComentario(alvo, id, autorId, conteudo) {
  const resultado = await consultar(
    `INSERT INTO ${alvo.tabelaComentarios} (${alvo.coluna}, autor_id, conteudo) VALUES (?, ?, ?)`,
    [id, autorId, conteudo],
  );
  return resultado.insertId;
}

export async function excluirComentario(alvo, comentarioId) {
  await consultar(`DELETE FROM ${alvo.tabelaComentarios} WHERE id = ?`, [comentarioId]);
}
