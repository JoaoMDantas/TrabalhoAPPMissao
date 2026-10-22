import { consultar, consultarUm } from '../../config/database.js';
import { montarWhere } from '../../core/sql.js';

const SELECT_VISITA = `
  SELECT v.id, v.tipo, v.situacao, v.data_visita, v.latitude, v.longitude, v.pessoas_alcancadas, v.observacoes,
         v.igreja_id, i.nome AS igreja_nome, v.criado_por, u.nome AS criado_por_nome, v.criado_em
  FROM visitas v
  JOIN usuarios u ON u.id = v.criado_por
  LEFT JOIN igrejas i ON i.id = v.igreja_id`;

export async function listar({ de, ate, tipo, situacao, igreja_id: igrejaId, criado_por: criadoPor }) {
  const condicoes = [];
  const parametros = [];
  const filtros = [
    ['v.data_visita >= ?', de],
    ['v.data_visita <= ?', ate],
    ['v.tipo = ?', tipo],
    ['v.situacao = ?', situacao],
    ['v.igreja_id = ?', igrejaId],
    ['v.criado_por = ?', criadoPor],
  ];
  for (const [condicao, valor] of filtros) {
    if (valor) {
      condicoes.push(condicao);
      parametros.push(valor);
    }
  }

  return consultar(`${SELECT_VISITA} ${montarWhere(condicoes)} ORDER BY v.data_visita DESC, v.id DESC LIMIT 500`, parametros);
}

export async function buscarPorId(id) {
  return consultarUm(`${SELECT_VISITA} WHERE v.id = ?`, [id]);
}

const CAMPOS = ['tipo', 'situacao', 'data_visita', 'latitude', 'longitude', 'pessoas_alcancadas', 'observacoes', 'igreja_id'];

export async function criar(dados, criadoPor) {
  const resultado = await consultar(
    `INSERT INTO visitas (${CAMPOS.join(', ')}, criado_por) VALUES (${CAMPOS.map(() => '?').join(', ')}, ?)`,
    [...CAMPOS.map((campo) => dados[campo]), criadoPor],
  );
  return resultado.insertId;
}

export async function atualizar(id, dados) {
  await consultar(`UPDATE visitas SET ${CAMPOS.map((campo) => `${campo} = ?`).join(', ')} WHERE id = ?`, [
    ...CAMPOS.map((campo) => dados[campo]),
    id,
  ]);
}

export async function excluir(id) {
  await consultar('DELETE FROM visitas WHERE id = ?', [id]);
}
