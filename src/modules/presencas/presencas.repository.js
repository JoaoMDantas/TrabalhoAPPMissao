import { consultar, consultarUm } from '../../config/database.js';

/** Total de presenças confirmadas de vários eventos de uma vez, e se a pessoa confirmou em cada um. */
export async function totais(ids, usuarioId) {
  if (!ids.length) return [];
  return consultar(
    `SELECT evento_id AS id, COUNT(*) AS total, MAX(usuario_id = ?) AS confirmou
     FROM eventos_presencas WHERE evento_id IN (?) GROUP BY evento_id`,
    [usuarioId, ids],
  );
}

// Confirmar de novo não duplica: a presença (evento + pessoa) já existe e guarda a data da primeira confirmação.
export async function confirmar(eventoId, usuarioId) {
  await consultar(
    `INSERT INTO eventos_presencas (evento_id, usuario_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE usuario_id = usuario_id`,
    [eventoId, usuarioId],
  );
}

export async function cancelar(eventoId, usuarioId) {
  await consultar('DELETE FROM eventos_presencas WHERE evento_id = ? AND usuario_id = ?', [eventoId, usuarioId]);
}

export async function contar(eventoId) {
  const { total } = await consultarUm('SELECT COUNT(*) AS total FROM eventos_presencas WHERE evento_id = ?', [eventoId]);
  return total;
}

/** Quem confirmou, na ordem das confirmações, com a igreja de cada pessoa. */
export async function listar(eventoId) {
  return consultar(
    `SELECT u.id, u.nome, u.papel, u.igreja_id, i.nome AS igreja_nome, p.criado_em
     FROM eventos_presencas p
     JOIN usuarios u ON u.id = p.usuario_id
     LEFT JOIN igrejas i ON i.id = u.igreja_id
     WHERE p.evento_id = ?
     ORDER BY p.criado_em, u.id`,
    [eventoId],
  );
}
