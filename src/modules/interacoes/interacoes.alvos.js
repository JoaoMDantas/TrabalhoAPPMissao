import * as eventos from '../eventos/eventos.repository.js';
import * as mural from '../mural/mural.repository.js';

/**
 * Itens que recebem curtidas e comentários, com as tabelas de cada um.
 * Os nomes de tabela e coluna vêm só daqui (nunca da requisição), por isso podem entrar no SQL;
 * os valores continuam indo como parâmetros (?).
 * "buscar" devolve o autor e a igreja do item, usados para decidir quem pode apagar comentários.
 */
export const ALVOS = {
  mural: {
    tabelaCurtidas: 'mensagens_curtidas',
    tabelaComentarios: 'mensagens_comentarios',
    coluna: 'mensagem_id',
    naoEncontrado: 'Mensagem não encontrada.',
    async buscar(id) {
      const mensagem = await mural.buscarPorId(id);
      return mensagem && { autorId: mensagem.autor_id, igrejaId: mensagem.igreja_id };
    },
  },
  eventos: {
    tabelaCurtidas: 'eventos_curtidas',
    tabelaComentarios: 'eventos_comentarios',
    coluna: 'evento_id',
    naoEncontrado: 'Evento não encontrado.',
    async buscar(id) {
      const evento = await eventos.buscarPorId(id);
      return evento && { autorId: evento.criado_por, igrejaId: evento.igreja_id };
    },
  },
};
