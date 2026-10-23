import { consultar, consultarUm } from '../../config/database.js';

// O conteúdo do arquivo (conteudo) só é lido quando alguém abre ou baixa o documento.
const SELECT_DOCUMENTO = `
  SELECT d.id, d.igreja_id, i.nome AS igreja_nome, d.titulo, d.descricao, d.nome_arquivo, d.tipo_mime, d.grupo,
         d.tamanho, d.criado_por, u.nome AS criado_por_nome, d.criado_em
  FROM documentos_igreja d
  JOIN igrejas i ON i.id = d.igreja_id
  JOIN usuarios u ON u.id = d.criado_por`;

export async function listar(igrejaId) {
  return consultar(`${SELECT_DOCUMENTO} WHERE d.igreja_id = ? ORDER BY d.criado_em DESC, d.id DESC`, [igrejaId]);
}

export async function buscarPorId(id) {
  return consultarUm(`${SELECT_DOCUMENTO} WHERE d.id = ?`, [id]);
}

export async function buscarConteudo(id) {
  return consultarUm('SELECT conteudo FROM documentos_igreja WHERE id = ?', [id]);
}

export async function criar(dados, criadoPor) {
  const resultado = await consultar(
    `INSERT INTO documentos_igreja
       (igreja_id, titulo, descricao, nome_arquivo, tipo_mime, grupo, tamanho, conteudo, criado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dados.igreja_id,
      dados.titulo,
      dados.descricao,
      dados.nome_arquivo,
      dados.tipo_mime,
      dados.grupo,
      dados.conteudo.length,
      dados.conteudo,
      criadoPor,
    ],
  );
  return resultado.insertId;
}

export async function excluir(id) {
  await consultar('DELETE FROM documentos_igreja WHERE id = ?', [id]);
}
