import { consultar, consultarUm } from '../../config/database.js';
import { montarWhere } from '../../core/sql.js';

// "encerrado": o evento já terminou pelo relógio do banco (sem horário de término, vale o de início).
const SELECT_EVENTO = `
  SELECT e.id, e.titulo, e.descricao, e.tipo, e.data_inicio, e.data_fim, e.local,
         e.igreja_id, i.nome AS igreja_nome, e.criado_por, u.nome AS criado_por_nome, e.criado_em,
         COALESCE(e.data_fim, e.data_inicio) < NOW() AS encerrado
  FROM eventos e
  JOIN usuarios u ON u.id = e.criado_por
  LEFT JOIN igrejas i ON i.id = e.igreja_id`;

const mapear = (linha) => linha && { ...linha, encerrado: Boolean(linha.encerrado) };

export async function listar({ de, ate, tipo, igreja_id: igrejaId, criado_por: criadoPor, limite }) {
  const condicoes = [];
  const parametros = [];

  if (de) {
    condicoes.push('e.data_inicio >= ?');
    parametros.push(de);
  }
  if (ate) {
    // Só a data ("2026-10-31") inclui o dia inteiro; com horário, o limite é exato.
    condicoes.push(ate.length === 10 ? 'e.data_inicio < DATE_ADD(?, INTERVAL 1 DAY)' : 'e.data_inicio <= ?');
    parametros.push(ate);
  }
  if (tipo) {
    condicoes.push('e.tipo = ?');
    parametros.push(tipo);
  }
  if (igrejaId) {
    condicoes.push('e.igreja_id = ?');
    parametros.push(igrejaId);
  }
  if (criadoPor) {
    condicoes.push('e.criado_por = ?');
    parametros.push(criadoPor);
  }

  parametros.push(limite);
  const linhas = await consultar(
    `${SELECT_EVENTO} ${montarWhere(condicoes)} ORDER BY e.data_inicio ASC, e.id ASC LIMIT ?`,
    parametros,
  );
  return linhas.map(mapear);
}

export async function buscarPorId(id) {
  return mapear(await consultarUm(`${SELECT_EVENTO} WHERE e.id = ?`, [id]));
}

export async function criar(dados, criadoPor) {
  const resultado = await consultar(
    `INSERT INTO eventos (titulo, descricao, tipo, data_inicio, data_fim, local, igreja_id, criado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [dados.titulo, dados.descricao, dados.tipo, dados.data_inicio, dados.data_fim, dados.local, dados.igreja_id, criadoPor],
  );
  return resultado.insertId;
}

export async function atualizar(id, dados) {
  await consultar(
    `UPDATE eventos
     SET titulo = ?, descricao = ?, tipo = ?, data_inicio = ?, data_fim = ?, local = ?, igreja_id = ?
     WHERE id = ?`,
    [dados.titulo, dados.descricao, dados.tipo, dados.data_inicio, dados.data_fim, dados.local, dados.igreja_id, id],
  );
}

export async function excluir(id) {
  await consultar('DELETE FROM eventos WHERE id = ?', [id]);
}
