import { consultar, consultarUm } from '../../config/database.js';
import { montarWhere, termoLike } from '../../core/sql.js';

const SELECT_IGREJA = `
  SELECT i.id, i.nome, i.cidade, i.bairro, i.endereco, i.telefone, i.email, i.criado_por, i.criado_em,
         (SELECT COUNT(*) FROM usuarios u WHERE u.igreja_id = i.id AND u.ativo = 1) AS total_membros
  FROM igrejas i`;

export async function listar({ busca }) {
  const condicoes = [];
  const parametros = [];

  if (busca) {
    condicoes.push('(i.nome LIKE ? OR i.bairro LIKE ? OR i.cidade LIKE ?)');
    const termo = termoLike(busca);
    parametros.push(termo, termo, termo);
  }

  return consultar(`${SELECT_IGREJA} ${montarWhere(condicoes)} ORDER BY i.nome LIMIT 200`, parametros);
}

/** Lista resumida para campos de seleção (inclusive na tela pública de cadastro). */
export async function listarOpcoes() {
  return consultar('SELECT id, nome, bairro FROM igrejas ORDER BY nome');
}

export async function buscarPorId(id) {
  return consultarUm(`${SELECT_IGREJA} WHERE i.id = ?`, [id]);
}

export async function existe(id) {
  return Boolean(await consultarUm('SELECT 1 FROM igrejas WHERE id = ?', [id]));
}

export async function criar(dados, criadoPor) {
  const resultado = await consultar(
    `INSERT INTO igrejas (nome, cidade, bairro, endereco, telefone, email, criado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [dados.nome, dados.cidade, dados.bairro, dados.endereco, dados.telefone, dados.email, criadoPor],
  );
  return resultado.insertId;
}

export async function atualizar(id, dados) {
  await consultar(
    'UPDATE igrejas SET nome = ?, cidade = ?, bairro = ?, endereco = ?, telefone = ?, email = ? WHERE id = ?',
    [dados.nome, dados.cidade, dados.bairro, dados.endereco, dados.telefone, dados.email, id],
  );
}

export async function excluir(id) {
  await consultar('DELETE FROM igrejas WHERE id = ?', [id]);
}
