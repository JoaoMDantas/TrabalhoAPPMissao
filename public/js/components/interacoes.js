import { api } from '../core/api.js';
import { tempoRelativo } from '../core/formatos.js';
import { PAPEIS } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import { acrescentar, avatar, avisar, blocoErro, carregando, confirmar, html, render } from '../core/ui.js';
import { textoComLinks } from './midia.js';

const LIMITE_COMENTARIO = 500;
// Acima disso, "Curtido por" mostra dois nomes e "mais N pessoas".
const NOMES_VISIVEIS = 3;

const palavra = (total, singular, plural) => (total === 1 ? singular : plural);

// O número aparece ao lado do botão; o texto escondido completa a leitura para quem usa leitor de tela.
const contagem = (total, singular, plural) =>
  total ? html`${total}<span class="visually-hidden"> ${palavra(total, singular, plural)}</span>` : '';

/**
 * Botões de curtir e comentar, com o painel de comentários logo abaixo (fechado até a pessoa tocar).
 * "alvo" é o caminho do item na API: "mural" (mensagens) ou "eventos" (agenda).
 */
export const barraInteracoes = (alvo, item) => html`
  <div class="interacoes" data-interacoes="${alvo}" data-id="${item.id}"
    data-curtidas="${item.total_curtidas ?? 0}" data-comentarios="${item.total_comentarios ?? 0}">
    <div class="barra-interacoes">
      <button type="button" class="botao-interacao" data-curtir aria-pressed="${item.curtiu ? 'true' : 'false'}">
        <i class="bi ${item.curtiu ? 'bi-heart-fill' : 'bi-heart'}" aria-hidden="true"></i> Curtir
        <span class="contagem">${contagem(item.total_curtidas, 'curtida', 'curtidas')}</span>
      </button>
      <button type="button" class="botao-interacao" data-comentar aria-expanded="false" aria-controls="comentarios-${alvo}-${item.id}">
        <i class="bi bi-chat" aria-hidden="true"></i> Comentar
        <span class="contagem">${contagem(item.total_comentarios, 'comentário', 'comentários')}</span>
      </button>
    </div>
    <div class="painel-comentarios" id="comentarios-${alvo}-${item.id}" data-painel hidden></div>
  </div>`;

/** Resumo para cartões que são links (ex.: evento na agenda), onde não cabem botões. */
export function totaisInteracoes(item) {
  if (!item.total_curtidas && !item.total_comentarios) return '';
  return html`
    <span class="totais-interacoes">
      ${item.total_curtidas
        ? html`<span><i class="bi bi-heart" aria-hidden="true"></i> ${contagem(item.total_curtidas, 'curtida', 'curtidas')}</span>`
        : ''}
      ${item.total_comentarios
        ? html`<span><i class="bi bi-chat" aria-hidden="true"></i> ${contagem(item.total_comentarios, 'comentário', 'comentários')}</span>`
        : ''}
    </span>`;
}

const itemComentario = (comentario) => html`
  <li class="comentario" data-comentario="${comentario.id}">
    <a href="#/missionarios/${comentario.autor_id}" class="text-reset" tabindex="-1" aria-hidden="true">
      ${avatar(comentario.autor_nome, 'sm')}
    </a>
    <div class="comentario-corpo">
      <div class="comentario-balao">
        <a href="#/missionarios/${comentario.autor_id}" class="comentario-autor">${comentario.autor_nome}</a>
        <p class="comentario-texto">${textoComLinks(comentario.conteudo)}</p>
      </div>
      <div class="comentario-meta">
        <span>${PAPEIS[comentario.autor_papel] ?? ''} · ${tempoRelativo(comentario.criado_em)}</span>
        ${comentario.pode_excluir
          ? html`<button type="button" class="botao-texto" data-excluir-comentario="${comentario.id}">Excluir</button>`
          : ''}
      </div>
    </div>
  </li>`;

const painelComentarios = (alvo, id, comentarios) => html`
  <p class="quem-curtiu" data-quem-curtiu></p>
  <p class="sem-comentarios" data-sem-comentarios ${comentarios.length ? 'hidden' : ''}>
    Nenhum comentário ainda. Seja o primeiro a comentar.
  </p>
  <ul class="lista-comentarios" data-lista-comentarios>${comentarios.map(itemComentario)}</ul>
  <form class="form-comentario" novalidate>
    <label class="visually-hidden" for="comentario-${alvo}-${id}">Escreva um comentário</label>
    <textarea class="form-control" id="comentario-${alvo}-${id}" name="conteudo" rows="1" maxlength="${LIMITE_COMENTARIO}"
      enterkeyhint="send" placeholder="Escreva um comentário..."></textarea>
    <button class="btn btn-primary btn-enviar-comentario" type="submit" aria-label="Enviar comentário">
      <i class="bi bi-send-fill" aria-hidden="true"></i>
    </button>
  </form>`;

// --- Curtidas ---

function desenharCurtida(caixa, curtiu, total) {
  const botao = caixa.querySelector('[data-curtir]');
  const icone = botao.querySelector('.bi');
  const acabouDeCurtir = curtiu && botao.getAttribute('aria-pressed') !== 'true';
  caixa.dataset.curtidas = total;
  botao.setAttribute('aria-pressed', String(curtiu));
  icone.classList.toggle('bi-heart-fill', curtiu);
  icone.classList.toggle('bi-heart', !curtiu);
  if (acabouDeCurtir) {
    icone.classList.add('animar');
    icone.addEventListener('animationend', () => icone.classList.remove('animar'), { once: true });
  }
  render(botao.querySelector('.contagem'), contagem(total, 'curtida', 'curtidas'));
}

const listaDeNomes = (nomes) => (nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}` : nomes[0]);
const curtidasVistas = new WeakMap();

/** "Curtido por você, Ana e mais 3 pessoas"; com "todos", lista todos os nomes. */
function desenharQuemCurtiu(caixa, curtidas, { todos = false } = {}) {
  const destino = caixa.querySelector('[data-quem-curtiu]');
  if (!destino) return;
  curtidasVistas.set(caixa, curtidas);
  if (!curtidas.length) {
    render(destino, '');
    return;
  }
  const eu = sessao.usuario?.id;
  const nomes = [...curtidas]
    .sort((a, b) => (b.id === eu) - (a.id === eu))
    .map((pessoa) => (pessoa.id === eu ? 'você' : pessoa.nome));
  const visiveis = todos || nomes.length <= NOMES_VISIVEIS ? nomes : nomes.slice(0, NOMES_VISIVEIS - 1);
  const restantes = nomes.length - visiveis.length;

  render(
    destino,
    html`<i class="bi bi-heart-fill" aria-hidden="true"></i> Curtido por
      ${restantes
        ? html`${visiveis.join(', ')} e
            <button type="button" class="botao-texto" data-ver-curtidas>mais ${restantes} ${palavra(restantes, 'pessoa', 'pessoas')}</button>`
        : listaDeNomes(visiveis)}`,
  );
}

async function atualizarQuemCurtiu(caixa) {
  const { interacoes: alvo, id } = caixa.dataset;
  try {
    desenharQuemCurtiu(caixa, await api.get(`/${alvo}/${id}/curtidas`));
  } catch {
    // A lista de nomes é um complemento: se falhar, a curtida já foi registrada e o total está certo.
  }
}

async function alternarCurtida(caixa, botao) {
  if (botao.dataset.enviando) return;
  const { interacoes: alvo, id } = caixa.dataset;
  const curtir = botao.getAttribute('aria-pressed') !== 'true';
  const totalAntes = Number(caixa.dataset.curtidas);

  // Mostra o resultado na hora; se o servidor recusar, volta como estava.
  desenharCurtida(caixa, curtir, Math.max(0, totalAntes + (curtir ? 1 : -1)));
  botao.dataset.enviando = 'sim';
  try {
    const caminho = `/${alvo}/${id}/curtida`;
    const resultado = curtir ? await api.put(caminho) : await api.del(caminho);
    desenharCurtida(caixa, resultado.curtiu, resultado.total_curtidas);
    if (!caixa.querySelector('[data-painel]').hidden) atualizarQuemCurtiu(caixa);
  } catch (erro) {
    desenharCurtida(caixa, !curtir, totalAntes);
    avisar(erro.message, 'erro');
  } finally {
    delete botao.dataset.enviando;
  }
}

// --- Comentários ---

function mudarTotalComentarios(caixa, total) {
  caixa.dataset.comentarios = total;
  render(caixa.querySelector('[data-comentar] .contagem'), contagem(total, 'comentário', 'comentários'));
}

// O campo cresce com o texto (até o limite definido no CSS) e volta a uma linha depois do envio.
function ajustarAltura(campo) {
  campo.style.height = 'auto';
  campo.style.height = `${campo.scrollHeight + campo.offsetHeight - campo.clientHeight}px`;
}

function ativarPainel(caixa) {
  const { interacoes: alvo, id } = caixa.dataset;
  const form = caixa.querySelector('.form-comentario');
  const campo = form.elements.conteudo;
  const botaoEnviar = form.querySelector('[type="submit"]');
  const lista = caixa.querySelector('[data-lista-comentarios]');
  const semComentarios = caixa.querySelector('[data-sem-comentarios]');

  campo.addEventListener('input', () => ajustarAltura(campo));
  campo.addEventListener('keydown', (evento) => {
    // Enter envia; Shift+Enter quebra a linha.
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing) {
      evento.preventDefault();
      botaoEnviar.click();
    }
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!campo.value.trim()) {
      campo.focus();
      return;
    }
    botaoEnviar.disabled = true;
    try {
      const comentario = await api.post(`/${alvo}/${id}/comentarios`, { conteudo: campo.value });
      acrescentar(lista, itemComentario(comentario));
      semComentarios.hidden = true;
      campo.value = '';
      ajustarAltura(campo);
      mudarTotalComentarios(caixa, Number(caixa.dataset.comentarios) + 1);
    } catch (erro) {
      avisar(erro.message, 'erro');
    } finally {
      botaoEnviar.disabled = false;
    }
  });

  lista.addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-excluir-comentario]');
    if (!botao) return;
    const confirmado = await confirmar({ titulo: 'Excluir comentário', mensagem: 'Deseja excluir este comentário?', botao: 'Excluir' });
    if (!confirmado) return;

    try {
      await api.del(`/${alvo}/${id}/comentarios/${botao.dataset.excluirComentario}`);
      botao.closest('[data-comentario]').remove();
      semComentarios.hidden = lista.children.length > 0;
      mudarTotalComentarios(caixa, Math.max(0, Number(caixa.dataset.comentarios) - 1));
      avisar('Comentário excluído.');
    } catch (erro) {
      avisar(erro.message, 'erro');
    }
  });
}

/** Busca os comentários e quem curtiu; devolve false se não conseguir (a próxima abertura tenta de novo). */
async function carregarComentarios(caixa) {
  const { interacoes: alvo, id } = caixa.dataset;
  const painel = caixa.querySelector('[data-painel]');
  render(painel, carregando());
  try {
    const [comentarios, curtidas] = await Promise.all([api.get(`/${alvo}/${id}/comentarios`), api.get(`/${alvo}/${id}/curtidas`)]);
    render(painel, painelComentarios(alvo, id, comentarios));
    desenharQuemCurtiu(caixa, curtidas);
    // Outras pessoas podem ter comentado depois que a lista foi carregada.
    if (comentarios.length > Number(caixa.dataset.comentarios)) mudarTotalComentarios(caixa, comentarios.length);
    ativarPainel(caixa);
    return true;
  } catch (erro) {
    render(painel, blocoErro(erro));
    return false;
  }
}

const carregamentos = new WeakMap();

function carregarUmaVez(caixa) {
  if (!carregamentos.has(caixa)) {
    const carregamento = carregarComentarios(caixa).then((ok) => {
      if (!ok) carregamentos.delete(caixa);
      return ok;
    });
    carregamentos.set(caixa, carregamento);
  }
  return carregamentos.get(caixa);
}

/**
 * Abre os comentários de um item (carregando na primeira vez).
 * Com "focar", leva direto ao campo quando ainda não há comentários para ler.
 */
export async function abrirComentarios(caixa, { focar = false } = {}) {
  const painel = caixa.querySelector('[data-painel]');
  painel.hidden = false;
  caixa.querySelector('[data-comentar]').setAttribute('aria-expanded', 'true');
  const carregou = await carregarUmaVez(caixa);
  if (carregou && focar && !painel.hidden && !Number(caixa.dataset.comentarios)) painel.querySelector('textarea').focus();
}

function fecharComentarios(caixa) {
  caixa.querySelector('[data-painel]').hidden = true;
  caixa.querySelector('[data-comentar]').setAttribute('aria-expanded', 'false');
}

// Um único "ouvinte" para o app todo: vale no mural, na tela inicial, nos eventos ou onde a barra aparecer.
document.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-curtir], [data-comentar], [data-ver-curtidas]');
  const caixa = botao?.closest('[data-interacoes]');
  if (!caixa) return;

  if (botao.matches('[data-curtir]')) alternarCurtida(caixa, botao);
  else if (botao.matches('[data-ver-curtidas]')) desenharQuemCurtiu(caixa, curtidasVistas.get(caixa) ?? [], { todos: true });
  else if (caixa.querySelector('[data-painel]').hidden) abrirComentarios(caixa, { focar: true });
  else fecharComentarios(caixa);
});
