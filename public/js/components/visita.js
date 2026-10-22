import { dataCurta } from '../core/formatos.js';
import { icone } from '../core/mapa.js';
import { SITUACOES_VISITA, TIPOS_VISITA } from '../core/rotulos.js';
import { html } from '../core/ui.js';

export const tipoVisita = (tipo) => TIPOS_VISITA[tipo] ?? TIPOS_VISITA.outro;
export const situacaoVisita = (situacao) => SITUACOES_VISITA[situacao] ?? SITUACOES_VISITA.realizada;

export const seloSituacao = (situacao) => {
  const { rotulo, icone: simbolo } = situacaoVisita(situacao);
  return html`<span class="selo-tipo situacao-${situacao}"><i class="bi bi-${simbolo}" aria-hidden="true"></i> ${rotulo}</span>`;
};

export const seloTipoVisita = (tipo) => {
  const { rotulo, icone: simbolo } = tipoVisita(tipo);
  return html`<span class="selo-tipo tipo-visita-geral"><i class="bi bi-${simbolo}" aria-hidden="true"></i> ${rotulo}</span>`;
};

export const pessoasAlcancadas = (quantidade) =>
  `${quantidade} ${quantidade === 1 ? 'pessoa alcançada' : 'pessoas alcançadas'}`;

/** Alfinete da visita no mapa: o ícone mostra o tipo e a cor mostra a situação. */
export const iconeVisita = (L, visita) => icone(L, { simbolo: tipoVisita(visita.tipo).icone, classe: `marcador-${visita.situacao}` });

export const conteudoPopupVisita = (visita) =>
  html`<strong>${tipoVisita(visita.tipo).rotulo}</strong> · ${dataCurta(visita.data_visita)}<br>
    ${situacaoVisita(visita.situacao).rotulo}${visita.pessoas_alcancadas ? html`<br>${pessoasAlcancadas(visita.pessoas_alcancadas)}` : ''}<br>
    <a href="#/visitas/${visita.id}">Ver detalhes</a>${visita.pode_editar
      ? html` · <a href="#/visitas/${visita.id}/local">Ajustar local</a>`
      : ''}`.toString();

export const itemVisita = (visita) => html`
  <a class="item-lista" href="#/visitas/${visita.id}">
    <span class="icone-quadrado fundo-${visita.situacao}"><i class="bi bi-${tipoVisita(visita.tipo).icone}" aria-hidden="true"></i></span>
    <div class="flex-grow-1 min-w-0">
      <div class="item-lista-titulo">${tipoVisita(visita.tipo).rotulo} · ${dataCurta(visita.data_visita)}</div>
      <div class="item-lista-sub">
        ${visita.criado_por_nome}${visita.igreja_nome ? ` · ${visita.igreja_nome}` : ''}${visita.pessoas_alcancadas
          ? ` · ${pessoasAlcancadas(visita.pessoas_alcancadas)}`
          : ''}
      </div>
    </div>
    ${seloSituacao(visita.situacao)}
  </a>`;
