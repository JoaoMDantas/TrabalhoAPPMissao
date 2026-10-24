import { hora, mesCurto, paraData, rotuloDia } from '../core/formatos.js';
import { TIPOS_EVENTO } from '../core/rotulos.js';
import { html } from '../core/ui.js';
import { contagem } from './interacoes.js';

export const seloTipoEvento = (tipo) => {
  const { rotulo, icone } = TIPOS_EVENTO[tipo] ?? TIPOS_EVENTO.outro;
  return html`<span class="selo-tipo tipo-${tipo}"><i class="bi bi-${icone}" aria-hidden="true"></i> ${rotulo}</span>`;
};

/** Resumo no canto do cartão, que é um link inteiro (não cabem botões): presenças, curtidas e comentários. */
function totaisDoEvento(evento) {
  const totais = [
    ['person-check', evento.total_presencas, 'presença confirmada', 'presenças confirmadas'],
    ['heart', evento.total_curtidas, 'curtida', 'curtidas'],
    ['chat', evento.total_comentarios, 'comentário', 'comentários'],
  ].filter(([, total]) => total);
  if (!totais.length) return '';

  return html`
    <span class="totais-evento">
      ${totais.map(
        ([icone, total, singular, plural]) =>
          html`<span><i class="bi bi-${icone}" aria-hidden="true"></i> ${contagem(total, singular, plural)}</span>`,
      )}
    </span>`;
}

/**
 * Cartão de evento. Com "agrupadoPorDia" (usado na agenda), o bloco lateral mostra a hora,
 * pois a data já aparece no título do grupo.
 */
export function itemEvento(evento, { agrupadoPorDia = false } = {}) {
  const inicio = paraData(evento.data_inicio);
  const passado = (evento.data_fim ? paraData(evento.data_fim) : inicio) < new Date();

  const detalhes = [];
  if (!agrupadoPorDia) detalhes.push(html`<i class="bi bi-clock" aria-hidden="true"></i> ${rotuloDia(inicio)}, ${hora(inicio)}`);
  if (evento.local) detalhes.push(html`<i class="bi bi-geo-alt" aria-hidden="true"></i> ${evento.local}`);
  else if (evento.igreja_nome) detalhes.push(html`<i class="bi bi-building" aria-hidden="true"></i> ${evento.igreja_nome}`);

  return html`
    <a class="item-evento ${passado ? 'passado' : ''}" href="#/agenda/${evento.id}">
      <div class="item-evento-data">
        ${agrupadoPorDia
          ? html`<span class="hora">${hora(inicio)}</span>`
          : html`<span class="dia">${inicio.getDate()}</span><span class="mes">${mesCurto(inicio)}</span>`}
      </div>
      <div class="item-evento-corpo">
        ${seloTipoEvento(evento.tipo)}
        ${evento.confirmou && !passado
          ? html`<span class="selo-vou"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Você vai</span>`
          : ''}
        <h3 class="item-evento-titulo">${evento.titulo}</h3>
        <p class="item-evento-meta">${detalhes.map((detalhe, i) => html`${i ? ' · ' : ''}${detalhe}`)}</p>
      </div>
      ${totaisDoEvento(evento)}
      <i class="bi bi-chevron-right seta" aria-hidden="true"></i>
    </a>`;
}
