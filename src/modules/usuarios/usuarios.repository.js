import { consultar, consultarUm } from '../../config/database.js';
import { montarWhere, termoLike } from '../../core/sql.js';

const SELECT_USUARIO = `
  SELECT u.id, u.nome, u.email, u.telefone, u.papel, u.igreja_id, i.nome AS igreja_nome,
         u.bairro_atuacao, u.sobre, u.ativo, u.criado_em
  FROM usuarios u
  LEFT JOIN igrejas i ON i.id = u.igreja_id`;

const mapear = (linha) => linha && { ...linha, ativo: Boolean(linha.ativo) };

export async function buscarPorId(id) {
  return mapear(await consultarUm(`${SELECT_USUARIO} WHERE u.id = ?`, [id]));
}

export async function emailEmUso(email) {
  return Boolean(await consultarUm('SELECT 1 FROM usuarios WHERE email = ?', [email]));
}

/** Único ponto que lê o hash da senha; nunca deve ser enviado ao cliente. */
export async function buscarCredenciais({ id, email }) {
  const campo = id ? 'id' : 'email';
  return consultarUm(`SELECT id, senha_hash, ativo FROM usuarios WHERE ${campo} = ?`, [id ?? email]);
}

export async function listar({ papel, igreja_id: igrejaId, busca }) {
  const condicoes = ['u.ativo = 1'];
  const parametros = [];

  if (papel) {
    condicoes.push('u.papel = ?');
    parametros.push(papel);
  }
  if (igrejaId) {
    condicoes.push('u.igreja_id = ?');
    parametros.push(igrejaId);
  }
  if (busca) {
    condicoes.push('(u.nome LIKE ? OR u.bairro_atuacao LIKE ? OR i.nome LIKE ?)');
    const termo = termoLike(busca);
    parametros.push(termo, termo, termo);
  }

  const linhas = await consultar(`${SELECT_USUARIO} ${montarWhere(condicoes)} ORDER BY u.nome LIMIT 200`, parametros);
  return linhas.map(mapear);
}

/** Usado no cadastro, que só acontece após o aceite do aviso de privacidade. */
export async function criar(dados) {
  const resultado = await consultar(
    `INSERT INTO usuarios (nome, email, senha_hash, telefone, papel, igreja_id, bairro_atuacao, aceitou_termos_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [dados.nome, dados.email, dados.senha_hash, dados.telefone, dados.papel, dados.igreja_id, dados.bairro_atuacao],
  );
  return resultado.insertId;
}

export async function atualizarPerfil(id, dados) {
  await consultar(
    'UPDATE usuarios SET nome = ?, telefone = ?, igreja_id = ?, bairro_atuacao = ?, sobre = ? WHERE id = ?',
    [dados.nome, dados.telefone, dados.igreja_id, dados.bairro_atuacao, dados.sobre, id],
  );
}

export async function atualizarSenha(id, senhaHash) {
  await consultar('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [senhaHash, id]);
}

export async function definirIgreja(id, igrejaId) {
  await consultar('UPDATE usuarios SET igreja_id = ? WHERE id = ?', [igrejaId, id]);
}
