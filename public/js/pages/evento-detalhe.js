import { seloTipoEvento } from '../components/evento.js';
import { abrirComentarios, barraInteracoes } from '../components/interacoes.js';
import { api } from '../core/api.js';
import { atualizarSeloAgenda } from '../core/layout.js';
import { dataCurta, dataPorExtenso, hora, mesmoDia } from '../core/formatos.js';
import { avisar, confirmar, html, render } from '../core/ui.js';

function descreverHorario(evento) {
  const inicio = hora(evento.data_inicio);
  if (!evento.data_fim) return inicio;
  if (mesmoDia(evento.data_inicio, evento.data_fim)) return `${inicio} às ${hora(evento.data_fim)}`;
  return `${inicio} até ${dataCurta(evento.data_fim)}, ${hora(evento.data_fim)}`;
}

function textoParaCompartilhar(evento) {
  return [
    `*${evento.titulo}*`,
    `${dataPorExtenso(evento.data_inicio)}, ${descreverHorario(evento)}`,
    evento.local && `Local: ${evento.local}`,
    evento.igreja_nome && `Igreja: ${evento.igreja_nome}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export default async function paginaEvento({ el, params, navegar }) {
  const evento = await api.get(`/eventos/${params.id}`);

  render(
    el,
    html`
      <article class="cartao">
        ${seloTipoEvento(evento.tipo)}
        <h1 class="h4 fw-bold mt-2 mb-3">${evento.titulo}</h1>
        <ul class="lista-info">
          <li>
            <i class="bi bi-calendar3" aria-hidden="true"></i>
            <div>
              <div class="fw-semibold">${dataPorExtenso(evento.data_inicio)}</div>
              <div class="small text-body-secondary">${descreverHorario(evento)}</div>
            </div>
          </li>
          ${evento.local ? html`<li><i class="bi bi-geo-alt" aria-hidden="true"></i><div>${evento.local}</div></li>` : ''}
          ${evento.igreja_id
            ? html`<li><i class="bi bi-building" aria-hidden="true"></i><a href="#/igrejas/${evento.igreja_id}">${evento.igreja_nome}</a></li>`
            : ''}
          <li>
            <i class="bi bi-person" aria-hidden="true"></i>
            <div>Organizado por <a href="#/missionarios/${evento.criado_por}">${evento.criado_por_nome}</a></div>
          </li>
        </ul>
        ${evento.descricao ? html`<h2 class="h6 fw-bold mt-3">Descrição</h2><p class="texto-livre mb-0">${evento.descricao}</p>` : ''}
      </article>

      <div class="d-grid gap-2 mt-3">
        <a class="btn btn-success" href="https://wa.me/?text=${encodeURIComponent(textoParaCompartilhar(evento))}"
          target="_blank" rel="noopener">
          <i class="bi bi-whatsapp" aria-hidden="true"></i> Compartilhar no WhatsApp
        </a>
        ${evento.pode_editar
          ? html`<div class="d-flex gap-2">
              <a class="btn btn-outline-primary flex-fill" href="#/agenda/${evento.id}/editar">
                <i class="bi bi-pencil" aria-hidden="true"></i> Editar
              </a>
              <button type="button" class="btn btn-outline-danger flex-fill" data-acao="excluir">
                <i class="bi bi-trash3" aria-hidden="true"></i> Excluir
              </button>
            </div>`
          : ''}
      </div>

      <section class="cartao mt-3" aria-label="Curtidas e comentários">${barraInteracoes('eventos', evento)}</section>`,
  );

  // Na página do evento, a conversa já aparece aberta.
  abrirComentarios(el.querySelector('[data-interacoes]'));

  el.querySelector('[data-acao="excluir"]')?.addEventListener('click', async () => {
    const confirmado = await confirmar({
      titulo: 'Excluir evento',
      mensagem: `Deseja excluir "${evento.titulo}"? Esta ação não pode ser desfeita.`,
      botao: 'Excluir',
    });
    if (!confirmado) return;

    try {
      await api.del(`/eventos/${evento.id}`);
      avisar('Evento excluído.');
      atualizarSeloAgenda();
      navegar('/agenda', { substituir: true });
    } catch (erro) {
      avisar(erro.message, 'erro');
    }
  });
}
