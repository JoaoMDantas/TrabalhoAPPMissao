import { itemIgreja } from '../components/igreja.js';
import { api } from '../core/api.js';
import { criarMapa, icone, temLocalizacao } from '../core/mapa.js';
import { sessao } from '../core/sessao.js';
import { atrasar, blocoErro, carregando, estadoVazio, html, render } from '../core/ui.js';

const conteudoPopup = (igreja) =>
  html`<strong>${igreja.nome}</strong><br>
    <span class="text-body-secondary">${igreja.bairro} · ${igreja.cidade}</span><br>
    <a href="#/igrejas/${igreja.id}">Ver igreja</a>${igreja.pode_editar
      ? html` · <a href="#/igrejas/${igreja.id}/local">Ajustar local</a>`
      : ''}`.toString();

export default async function paginaIgrejas({ el, query, aoSair }) {
  const podeCadastrar = sessao.usuario.papel !== 'missionario';
  let busca = query.busca ?? '';
  let modo = query.ver === 'mapa' ? 'mapa' : 'lista';

  render(
    el,
    html`
      <div class="campo-busca mb-3">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input type="search" class="form-control" placeholder="Buscar por nome, bairro ou cidade" aria-label="Buscar igrejas"
          value="${busca}" data-busca>
      </div>
      <div class="alternador mb-3" role="group" aria-label="Forma de exibição">
        <button type="button" class="alternador-opcao" data-modo="lista"><i class="bi bi-list-ul" aria-hidden="true"></i> Lista</button>
        <button type="button" class="alternador-opcao" data-modo="mapa"><i class="bi bi-map" aria-hidden="true"></i> Mapa</button>
      </div>
      <div class="lista" data-lista>${carregando()}</div>
      <div data-area-mapa hidden>
        <div class="mapa mapa-grande" data-mapa></div>
        <p class="small text-body-secondary mt-2 mb-0" data-sem-local></p>
      </div>
      ${podeCadastrar
        ? html`<a class="botao-flutuante" href="#/igrejas/nova" aria-label="Cadastrar igreja"><i class="bi bi-plus-lg"></i></a>`
        : ''}`,
  );

  const lista = el.querySelector('[data-lista]');
  const areaMapa = el.querySelector('[data-area-mapa]');
  let igrejas = [];
  let ultimaConsulta = 0;
  let mapaPronto = null; // promessa de { L, mapa, camada }, criada na primeira vez que a pessoa abre o mapa

  // Guarda busca e forma de exibição no endereço, para que continuem ao voltar de uma igreja.
  function atualizarEndereco() {
    const parametros = new URLSearchParams();
    if (busca) parametros.set('busca', busca);
    if (modo === 'mapa') parametros.set('ver', 'mapa');
    const texto = parametros.toString();
    window.history.replaceState(null, '', texto ? `#/igrejas?${texto}` : '#/igrejas');
  }

  async function desenharMapa() {
    // Guardar a promessa (e não o resultado) evita criar dois mapas se esta função for chamada de novo
    // enquanto a biblioteca do mapa ainda está carregando.
    mapaPronto ??= criarMapa(el.querySelector('[data-mapa]'), { aoSair }).then(({ L, mapa }) => ({
      L,
      mapa,
      camada: L.layerGroup().addTo(mapa),
    }));
    const { L, mapa, camada } = await mapaPronto;
    mapa.invalidateSize();
    camada.clearLayers();

    const noMapa = igrejas.filter(temLocalizacao);
    for (const igreja of noMapa) {
      L.marker([igreja.latitude, igreja.longitude], {
        icon: icone(L, { simbolo: 'building', classe: 'marcador-igreja' }),
        title: igreja.nome,
      })
        .bindPopup(conteudoPopup(igreja))
        .addTo(camada);
    }
    if (noMapa.length) {
      mapa.fitBounds(L.latLngBounds(noMapa.map((i) => [i.latitude, i.longitude])), { padding: [48, 48], maxZoom: 15 });
    }

    const semLocal = igrejas.length - noMapa.length;
    el.querySelector('[data-sem-local]').textContent = semLocal
      ? `${semLocal} ${semLocal === 1 ? 'igreja ainda não marcou' : 'igrejas ainda não marcaram'} a localização no mapa.`
      : '';
  }

  function mostrar() {
    el.querySelectorAll('[data-modo]').forEach((botao) => botao.setAttribute('aria-pressed', String(botao.dataset.modo === modo)));
    lista.hidden = modo !== 'lista';
    areaMapa.hidden = modo !== 'mapa';
    if (modo === 'mapa') desenharMapa().catch((erro) => render(el.querySelector('[data-mapa]'), blocoErro(erro)));
  }

  async function carregar() {
    const consulta = ++ultimaConsulta;
    try {
      const resultado = await api.get('/igrejas', { busca });
      if (consulta !== ultimaConsulta) return;
      igrejas = resultado;
      render(
        lista,
        igrejas.length
          ? igrejas.map(itemIgreja)
          : estadoVazio({
              icone: 'building',
              titulo: busca ? 'Nenhuma igreja encontrada' : 'Nenhuma igreja cadastrada',
              acao: podeCadastrar && !busca ? { href: '#/igrejas/nova', rotulo: 'Cadastrar igreja' } : null,
            }),
      );
      mostrar();
    } catch (erro) {
      if (consulta === ultimaConsulta) render(lista, blocoErro(erro));
    }
  }

  el.querySelector('[data-busca]').addEventListener(
    'input',
    atrasar((evento) => {
      busca = evento.target.value.trim();
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
