import { rotas } from '../rotas.js';
import { api } from './api.js';
import { agoraParaApi, chaveDia } from './formatos.js';
import { sessao } from './sessao.js';
import { avatar, html, render } from './ui.js';

const rotasDoMenu = rotas.filter((rota) => rota.nav);

let cascaMontada = false;
let telasVisitadas = 0;

function montarCasca(app) {
  render(
    app,
    html`
      <header class="barra-topo">
        <div class="barra-topo-interna">
          <button type="button" class="btn-icone" data-voltar hidden aria-label="Voltar">
            <i class="bi bi-arrow-left"></i>
          </button>
          <a class="marca" href="#/inicio" data-marca>
            <span class="marca-icone"><i class="bi bi-globe-americas"></i></span>
            <span>Projeto Missionário</span>
          </a>
          <h1 class="titulo-tela" data-titulo hidden></h1>
          <a class="btn-icone ms-auto" href="#/perfil" aria-label="Meu perfil" data-avatar></a>
        </div>
      </header>
      <main id="principal" class="conteudo" tabindex="-1"></main>
      <nav class="menu-inferior" aria-label="Menu principal">
        ${rotasDoMenu.map(
          (rota) => html`
            <a class="menu-item" href="#${rota.caminho}" data-secao="${rota.caminho}">
              <i class="bi bi-${rota.nav.icone}" aria-hidden="true"></i>
              <span>${rota.nav.rotulo}</span>
              ${rota.caminho === '/agenda' ? html`<span class="menu-selo" data-selo hidden></span>` : ''}
            </a>`,
        )}
      </nav>`,
  );

  app.querySelector('[data-voltar]').addEventListener('click', voltar);
  cascaMontada = true;
  atualizarSeloAgenda();
}

/** Volta pelo histórico; se a pessoa abriu o link direto, sobe um nível (/agenda/5 → /agenda). */
function voltar() {
  if (telasVisitadas > 1) {
    window.history.back();
    return;
  }
  const caminho = window.location.hash.slice(1).split('?')[0];
  const pai = caminho.split('/').slice(0, -1).join('/');
  window.location.hash = `#${pai || '/inicio'}`;
}

function atualizarCabecalho(rota) {
  const ehRaiz = Boolean(rota.nav);
  const titulo = document.querySelector('[data-titulo]');
  document.querySelector('[data-voltar]').hidden = ehRaiz;
  document.querySelector('[data-marca]').hidden = !ehRaiz;
  titulo.hidden = ehRaiz;
  titulo.textContent = rota.titulo;
  render(document.querySelector('[data-avatar]'), avatar(sessao.usuario?.nome ?? '', 'sm'));
}

function marcarSecaoAtiva(caminho) {
  const secao = `/${caminho.split('/')[1]}`;
  document.querySelectorAll('.menu-item').forEach((item) => {
    const ativo = item.dataset.secao === secao;
    item.classList.toggle('ativo', ativo);
    if (ativo) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

/** Prepara a tela para a rota e devolve um contêiner novo onde a página será desenhada. */
export function prepararTela(rota, caminho) {
  const app = document.getElementById('app');
  const container = document.createElement('div');
  container.className = 'pagina';

  if (rota.publica) {
    cascaMontada = false;
    telasVisitadas = 0;
    app.replaceChildren(container);
    return container;
  }

  if (!cascaMontada) montarCasca(app);
  telasVisitadas += 1;
  atualizarCabecalho(rota);
  marcarSecaoAtiva(caminho);
  document.getElementById('principal').replaceChildren(container);
  window.scrollTo(0, 0);
  return container;
}

/**
 * Notificação simples: mostra no ícone da Agenda quantas atividades ainda acontecem hoje.
 * Devolve essa quantidade, ou null se não foi possível consultar.
 */
export async function atualizarSeloAgenda() {
  let quantidade = null;
  try {
    const eventos = await api.get('/eventos', { de: agoraParaApi(), ate: chaveDia(new Date()), limite: 50 });
    quantidade = eventos.length;
  } catch {
    // O selo é apenas informativo; sem conexão ele simplesmente não aparece.
  }

  const selo = document.querySelector('[data-selo]');
  if (selo) {
    selo.textContent = quantidade ?? '';
    selo.hidden = !quantidade;
    selo.setAttribute('aria-label', `${quantidade} atividade(s) hoje`);
  }
  return quantidade;
}
