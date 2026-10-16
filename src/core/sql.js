/** Prepara um termo de busca para LIKE, tratando %, _ e \ digitados pelo usuário como texto comum. */
export const termoLike = (texto) => `%${texto.replace(/[\\%_]/g, '\\$&')}%`;

/** Monta a cláusula WHERE a partir de uma lista de condições (vazia = sem filtro). */
export const montarWhere = (condicoes) => (condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '');
