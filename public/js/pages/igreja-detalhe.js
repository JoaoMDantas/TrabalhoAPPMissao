import { botoesContato } from '../components/contato.js';
import { itemEvento } from '../components/evento.js';
import { itemPessoa } from '../components/pessoa.js';
import { api } from '../core/api.js';
import { agoraParaApi } from '../core/formatos.js';
import { criarMapa, icone, linkComoChegar, linkWaze, temLocalizacao } from '../core/mapa.js';
import { avisar, confirmar, estadoVazio, html, render } from '../core/ui.js';

function secaoMapa(igreja) {
  if (temLocalizacao(igreja)) {
    return html`
      <section class="cartao cartao-mapa mt-3">
        <div class="mapa mapa-previa" data-mapa role="img" aria-label="Localização da igreja no mapa"></div>
        <div class="d-flex flex-wrap gap-2 p-3">
          <a class="btn btn-primary btn-sm" href="${linkComoChegar(igreja)}" target="_blank" rel="noopener">
            <i class="bi bi-sign-turn-right" aria-hidden="true"></i> Como chegar
          </a>
          <a class="btn btn-outline-primary btn-sm" href="${linkWaze(igreja)}" target="_blank" rel="noopener">
            <i class="bi bi-car-front" aria-hidden="true"></i> Abrir no Waze
          </a>
          ${igreja.pode_editar
            ? html`<a class="btn btn-light btn-sm ms-auto" href="#/igrejas/${igreja.id}/local">
                <i class="bi bi-pin-map" aria-hidden="true"></i> Ajustar no mapa
              </a>`
            : ''}
        </div>
      </section>`;
  }
  if (!igreja.pode_editar) return '';
  return html`
    <a class="cartao cartao-dica mt-3" href="#/igrejas/${igreja.id}/local">
      <i class="bi bi-geo-alt" aria-hidden="true"></i>
      <span class="small">Marque a localização da igreja no mapa para facilitar as visitas.</span>
    </a>`;
}

export default async function paginaIgreja({ el, params, navegar, aoSair }) {
  const id = Number(params.id);
  const [igreja, membros, eventos] = await Promise.all([
    api.get(`/igrejas/${id}`),
    api.get('/usuarios', { igreja_id: id }),
    api.get('/eventos', { igreja_id: id, de: agoraParaApi(), limite: 5 }),
  ]);

  render(
    el,
    html`
      <section class="cartao text-center">
        <span class="icone-quadrado icone-grande"><i class="bi bi-building" aria-hidden="true"></i></span>
        <h1 class="h4 fw-bold mt-3 mb-1">${igreja.nome}</h1>
        <p class="text-body-secondary mb-1"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${igreja.bairro} · ${igreja.cidade}</p>
        ${igreja.endereco ? html`<p class="small mb-0">${igreja.endereco}</p>` : ''}
        <div class="mt-3">${botoesContato(igreja, 'justify-content-center')}</div>
      </section>

      ${secaoMapa(igreja)}

      ${igreja.pode_editar || igreja.pode_excluir
        ? html`<div class="d-flex gap-2 mt-3">
            ${igreja.pode_editar
              ? html`<a class="btn btn-outline-primary flex-fill" href="#/igrejas/${igreja.id}/editar">
                  <i class="bi bi-pencil" aria-hidden="true"></i> Editar
                </a>`
              : ''}
            ${igreja.pode_excluir
              ? html`<button type="button" class="btn btn-outline-danger flex-fill" data-acao="excluir">
                  <i class="bi bi-trash3" aria-hidden="true"></i> Excluir
                </button>`
              : ''}
          </div>`
        : ''}

      <div class="secao-titulo"><h2>Próximas atividades</h2></div>
      <div class="lista">
        ${eventos.length
          ? eventos.map((evento) => itemEvento(evento))
          : estadoVazio({ icone: 'calendar-x', titulo: 'Nenhuma atividade agendada' })}
      </div>

      <div class="secao-titulo"><h2>Pessoas vinculadas (${membros.length})</h2></div>
      <div class="lista">
        ${membros.length ? membros.map(itemPessoa) : estadoVazio({ icone: 'people', titulo: 'Ninguém vinculado ainda' })}
      </div>`,
  );

  if (temLocalizacao(igreja)) {
    // Prévia fixa: não "prende" a rolagem da página no celular; para navegar, há os botões de rota.
    const ponto = [igreja.latitude, igreja.longitude];
    criarMapa(el.querySelector('[data-mapa]'), {
      centro: ponto,
      zoom: 16,
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
        L.marker(ponto, { icon: icone(L, { simbolo: 'building', classe: 'marcador-igreja' }), interactive: false }).addTo(mapa);
      })
      .catch((erro) => console.error(erro));
  }

  el.querySelector('[data-acao="excluir"]')?.addEventListener('click', async () => {
    const confirmado = await confirmar({
      titulo: 'Excluir igreja',
      mensagem: `Deseja excluir "${igreja.nome}"? As pessoas, eventos e mensagens continuarão existindo, mas sem vínculo com a igreja.`,
      botao: 'Excluir',
    });
    if (!confirmado) return;

    try {
      await api.del(`/igrejas/${igreja.id}`);
      avisar('Igreja excluída.');
      navegar('/igrejas', { substituir: true });
    } catch (erro) {
      avisar(erro.message, 'erro');
    }
  });
}
