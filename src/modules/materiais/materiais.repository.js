import { consultar, consultarUm } from '../../config/database.js';

const SELECT_MATERIAL = `
  SELECT m.id, m.titulo, m.descricao, m.tipo, m.url, m.etapa, m.ordem,
         m.criado_por, u.nome AS criado_por_nome, m.criado_em
  FROM materiais m
  LEFT JOIN usuarios u ON u.id = m.criado_por`;

export async function listar() {
  return consultar(`${SELECT_MATERIAL} ORDER BY m.etapa, m.ordem, m.id`);
}

export async function buscarPorId(id) {
  return consultarUm(`${SELECT_MATERIAL} WHERE m.id = ?`, [id]);
}

export async function criar(dados, criadoPor) {
  const resultado = await consultar(
    'INSERT INTO materiais (titulo, descricao, tipo, url, etapa, ordem, criado_por) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [dados.titulo, dados.descricao, dados.tipo, dados.url, dados.etapa, dados.ordem, criadoPor],
  );
  return resultado.insertId;
}

export async function excluir(id) {
  await consultar('DELETE FROM materiais WHERE id = ?', [id]);
}
