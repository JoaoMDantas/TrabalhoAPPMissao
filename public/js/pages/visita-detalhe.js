import { iconeVisita, pessoasAlcancadas, seloSituacao, seloTipoVisita, tipoVisita } from '../components/visita.js';
import { api } from '../core/api.js';
import { dataPorExtenso } from '../core/formatos.js';
import { criarMapa, linkComoChegar, linkWaze } from '../core/mapa.js';
import { avisar, confirmar, html, render } from '../core/ui.js';

export default async function paginaVisita({ el, params, navegar, aoSair }) {
  const visita = await api.get(`/visitas/${params.id}`);

  render(
    el,
    html`
      <section class="cartao cartao-mapa">
        <div class="mapa mapa-previa" data-mapa role="img" aria-label="Local da visita no mapa"></div>
        <div class="d-flex flex-wrap gap-2 p-3">
          <a class="btn btn-primary btn-sm" href="${linkComoChegar(visita)}" target="_blank" rel="noopener">
            <i class="bi bi-sign-turn-right" aria-hidden="true"></i> Como chegar
          </a>
          <a class="btn btn-outline-primary btn-sm" href="${linkWaze(visita)}" target="_blank" rel="noopener">
            <i class="bi bi-car-front" aria-hidden="true"></i> Abrir no Waze
          </a>
          ${visita.pode_editar
            ? html`<a class="btn btn-light btn-sm ms-auto" href="#/visitas/${visita.id}/local">
                <i class="bi bi-pin-map" aria-hidden="true"></i> Ajustar no mapa
              </a>`
            : ''}
        </div>
      </section>

      <section class="cartao mt-3">
        <div class="d-flex flex-wrap gap-2 mb-2">${seloTipoVisita(visita.tipo)} ${seloSituacao(visita.situacao)}</div>
        <h1 class="h5 fw-bold mb-3">${tipoVisita(visita.tipo).rotulo} · ${dataPorExtenso(visita.data_visita)}</h1>
        <ul class="lista-info">
          <li>
            <i class="bi bi-people" aria-hidden="true"></i>
            <span>${visita.pessoas_alcancadas !== null ? pessoasAlcancadas(visita.pessoas_alcancadas) : 'Número de pessoas não informado'}</span>
          </li>
          ${visita.igreja_id
            ? html`<li><i class="bi bi-building" aria-hidden="true"></i><a href="#/igrejas/${visita.igreja_id}">${visita.igreja_nome}</a></li>`
            : ''}
          <li>
            <i class="bi bi-person" aria-hidden="true"></i>
            <span>Registrada por <a href="#/missionarios/${visita.criado_por}">${visita.criado_por_nome}</a></span>
          </li>
        </ul>
        ${visita.observacoes
          ? html`<h2 class="h6 fw-bold mt-3 mb-1">Observações</h2><p class="texto-livre mb-0">${visita.observacoes}</p>`
          : ''}
      </section>

      ${visita.pode_editar
        ? html`<div class="d-flex gap-2 mt-3">
            <a class="btn btn-outline-primary flex-fill" href="#/visitas/${visita.id}/editar">
              <i class="bi bi-pencil" aria-hidden="true"></i> Editar
            </a>
            <button type="button" class="btn btn-outline-danger flex-fill" data-acao="excluir">
              <i class="bi bi-trash3" aria-hidden="true"></i> Excluir
            </button>
          </div>`
        : ''}`,
  );

  // Prévia fixa, como na página da igreja: não prende a rolagem da página no celular.
  const ponto = [visita.latitude, visita.longitude];
  criarMapa(el.querySelector('[data-mapa]'), {
    centro: ponto,
    zoom: 17,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    zoomControl: false,
    aoSair,
  })
    .then(({ L, mapa }) => {
      L.marker(ponto, { icon: iconeVisita(L, visita), interactive: false }).addTo(mapa);
    })
    .catch((erro) => console.error(erro));

  el.querySelector('[data-acao="excluir"]')?.addEventListener('click', async () => {
    const confirmado = await confirmar({ titulo: 'Excluir visita', mensagem: 'Deseja remover esta visita do mapa?', botao: 'Excluir' });
    if (!confirmado) return;
    try {
      await api.del(`/visitas/${visita.id}`);
      avisar('Visita removida.');
      navegar('/visitas', { substituir: true });
    } catch (erro) {
      avisar(erro.message, 'erro');
    }
  });
}
