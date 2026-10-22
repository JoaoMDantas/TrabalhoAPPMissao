import { conteudoPopupVisita, iconeVisita, itemVisita } from '../components/visita.js';
import { api } from '../core/api.js';
import { criarMapa, icone, temLocalizacao } from '../core/mapa.js';
import { SITUACOES_VISITA } from '../core/rotulos.js';
import { blocoErro, carregando, estadoVazio, html, render } from '../core/ui.js';

const popupIgreja = (igreja) => html`<strong>${igreja.nome}</strong><br><a href="#/igrejas/${igreja.id}">Ver igreja</a>`.toString();

function resumo(visitas) {
  const pessoas = visitas.reduce((soma, visita) => soma + (visita.pessoas_alcancadas ?? 0), 0);
  const retornos = visitas.filter((visita) => visita.situacao === 'retornar').length;
  return html`
    <div class="numeros-resumo">
      <div><strong>${visitas.length}</strong><span>${visitas.length === 1 ? 'visita' : 'visitas'}</span></div>
      <div><strong>${pessoas}</strong><span>pessoas alcançadas</span></div>
      <div><strong>${retornos}</strong><span>pediram retorno</span></div>
    </div>`;
}

export default async function paginaVisitas({ el, query, aoSair }) {
  let situacao = query.situacao ?? '';
  let modo = query.ver === 'lista' ? 'lista' : 'mapa';

  render(
    el,
    html`
      <section class="cartao">
        <h1 class="h5 fw-bold mb-1"><i class="bi bi-geo-alt" aria-hidden="true"></i> Mapa de visitas</h1>
        <p class="small text-body-secondary mb-3">
          Casas e ruas visitadas pelos missionários, para planejar os próximos passos e voltar onde pediram retorno.
        </p>
        <div data-resumo>${carregando()}</div>
      </section>
      <div class="filtros-chips mt-3" role="group" aria-label="Filtrar por situação">
        <button type="button" class="chip" data-situacao="">Todas</button>
        ${Object.entries(SITUACOES_VISITA).map(
          ([chave, { curto }]) => html`<button type="button" class="chip" data-situacao="${chave}">${curto}</button>`,
        )}
      </div>
      <div class="alternador mb-3" role="group" aria-label="Forma de exibição">
        <button type="button" class="alternador-opcao" data-modo="mapa"><i class="bi bi-map" aria-hidden="true"></i> Mapa</button>
        <button type="button" class="alternador-opcao" data-modo="lista"><i class="bi bi-list-ul" aria-hidden="true"></i> Lista</button>
      </div>
      <div data-area-mapa>
        <div class="mapa mapa-grande" data-mapa></div>
        <ul class="legenda-mapa" aria-label="Legenda">
          ${Object.entries(SITUACOES_VISITA).map(
            ([chave, { rotulo }]) => html`<li><span class="ponto-legenda fundo-${chave}"></span>${rotulo}</li>`,
          )}
          <li><span class="ponto-legenda fundo-igreja"></span>Igreja</li>
        </ul>
      </div>
      <div class="lista" data-lista hidden></div>
      <a class="botao-flutuante" href="#/visitas/nova" aria-label="Registrar visita"><i class="bi bi-plus-lg"></i></a>`,
  );

  const lista = el.querySelector('[data-lista]');
  const areaMapa = el.querySelector('[data-area-mapa]');
  let visitas = [];
  let igrejas = [];
  let mapaVisitas = null; // { L, mapa, camada }
  let ultimaConsulta = 0;

  function atualizarEndereco() {
    const parametros = new URLSearchParams();
    if (situacao) parametros.set('situacao', situacao);
    if (modo === 'lista') parametros.set('ver', 'lista');
    const texto = parametros.toString();
    window.history.replaceState(null, '', texto ? `#/visitas?${texto}` : '#/visitas');
  }

  async function desenharMapa() {
    if (!mapaVisitas) {
      const { L, mapa } = await criarMapa(el.querySelector('[data-mapa]'), { aoSair });
      mapaVisitas = { L, mapa, camada: L.layerGroup().addTo(mapa) };
    }
    const { L, mapa, camada } = mapaVisitas;
    mapa.invalidateSize();
    camada.clearLayers();

    const pontos = [];
    for (const igreja of igrejas.filter(temLocalizacao)) {
      pontos.push([igreja.latitude, igreja.longitude]);
      L.marker([igreja.latitude, igreja.longitude], { icon: icone(L, { simbolo: 'building', classe: 'marcador-igreja' }), title: igreja.nome })
        .bindPopup(popupIgreja(igreja))
        .addTo(camada);
    }
    for (const visita of visitas) {
      pontos.push([visita.latitude, visita.longitude]);
      L.marker([visita.latitude, visita.longitude], { icon: iconeVisita(L, visita) })
        .bindPopup(conteudoPopupVisita(visita))
        .addTo(camada);
    }
    if (pontos.length) mapa.fitBounds(L.latLngBounds(pontos), { padding: [48, 48], maxZoom: 16 });
  }

  function mostrar() {
    el.querySelectorAll('[data-modo]').forEach((botao) => botao.setAttribute('aria-pressed', String(botao.dataset.modo === modo)));
    el.querySelectorAll('[data-situacao]').forEach((chip) => chip.classList.toggle('ativo', chip.dataset.situacao === situacao));
    lista.hidden = modo !== 'lista';
    areaMapa.hidden = modo !== 'mapa';
    if (modo === 'mapa') desenharMapa().catch((erro) => render(el.querySelector('[data-mapa]'), blocoErro(erro)));
  }

  async function carregar() {
    const consulta = ++ultimaConsulta;
    try {
      const [resultado, todasIgrejas] = await Promise.all([api.get('/visitas', { situacao }), api.get('/igrejas')]);
      if (consulta !== ultimaConsulta) return;
      visitas = resultado;
      igrejas = todasIgrejas;
      render(el.querySelector('[data-resumo]'), resumo(visitas));
      render(
        lista,
        visitas.length
          ? visitas.map(itemVisita)
          : estadoVazio({
              icone: 'geo-alt',
              titulo: situacao ? 'Nenhuma visita com essa situação' : 'Nenhuma visita registrada ainda',
              texto: situacao ? '' : 'Depois de uma visita ou evangelismo, toque no + e marque o local no mapa.',
              acao: situacao ? null : { href: '#/visitas/nova', rotulo: 'Registrar visita' },
            }),
      );
      mostrar();
    } catch (erro) {
      if (consulta === ultimaConsulta) render(lista, blocoErro(erro));
    }
  }

  el.querySelectorAll('[data-situacao]').forEach((chip) =>
    chip.addEventListener('click', () => {
      situacao = chip.dataset.situacao;
      atualizarEndereco();
      carregar();
    }),
  );
  el.querySelectorAll('[data-modo]').forEach((botao) =>
    botao.addEventListener('click', () => {
      modo = botao.dataset.modo;
      atualizarEndereco();
      mostrar();
    }),
  );

  mostrar();
  await carregar();
}
