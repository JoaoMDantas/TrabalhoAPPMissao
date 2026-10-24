import { api } from '../core/api.js';
import { palavra } from '../core/formatos.js';
import { PAPEIS } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import { avatar, avisar, html, render } from '../core/ui.js';

// Rostos empilhados no resumo; quem passar disso aparece como "+N".
const ROSTOS_VISIVEIS = 4;

/** Espaço do cartão de presença na página do evento; montarPresenca() desenha e controla o conteúdo. */
export const cartaoPresenca = () =>
  html`<section class="cartao cartao-presenca mt-3" data-presenca aria-labelledby="titulo-presenca"></section>`;

function situacao({ total, confirmou, encerrado }) {
  if (encerrado) {
    return {
      classe: 'encerrado',
      icone: 'clock-history',
      titulo: 'Evento encerrado',
      texto: total ? `${total} ${palavra(total, 'pessoa confirmou', 'pessoas confirmaram')} presença.` : 'Ninguém confirmou presença.',
    };
  }
  if (confirmou) {
    return {
      classe: 'confirmada',
      icone: 'check-circle-fill',
      titulo: 'Presença confirmada',
      texto: total > 1 ? `Você e mais ${total - 1} ${palavra(total - 1, 'pessoa', 'pessoas')} vão.` : 'Você é a primeira pessoa a confirmar.',
    };
  }
  return {
    classe: 'aberta',
    icone: 'calendar-check',
    titulo: 'Vai participar?',
    texto: total ? `${total} ${palavra(total, 'pessoa já confirmou', 'pessoas já confirmaram')} presença.` : 'Seja a primeira pessoa a confirmar.',
  };
}

const itemPessoa = (pessoa, eu) => html`
  <li class="pessoa-presenca">
    ${avatar(pessoa.nome, 'sm')}
    <div class="pessoa-presenca-texto">
      <a href="#/missionarios/${pessoa.id}">${pessoa.nome}</a>${pessoa.id === eu ? ' (você)' : ''}
      <div class="pessoa-presenca-sub">${PAPEIS[pessoa.papel] ?? ''}${pessoa.igreja_nome ? ` · ${pessoa.igreja_nome}` : ''}</div>
    </div>
  </li>`;

/** Rostos de quem vai, quantas igrejas estão representadas e a lista completa (aberta ao tocar). */
function quemVai(estado) {
  const pessoas = estado.pessoas ?? [];
  if (!pessoas.length) return '';
  const igrejas = new Set(pessoas.map((pessoa) => pessoa.igreja_id).filter(Boolean)).size;
  const restantes = pessoas.length - ROSTOS_VISIVEIS;

  return html`
    ${igrejas > 1 ? html`<p class="selo-igrejas"><i class="bi bi-building" aria-hidden="true"></i> Pessoas de ${igrejas} igrejas</p>` : ''}
    <button type="button" class="linha-quem-vai" data-ver-presencas aria-expanded="${estado.listaAberta ? 'true' : 'false'}" aria-controls="lista-presencas">
      <span class="pilha-avatares">${pessoas.slice(0, ROSTOS_VISIVEIS).map((pessoa) => avatar(pessoa.nome, 'sm'))}</span>
      ${restantes > 0 ? html`<span class="mais-rostos">+${restantes}</span>` : ''}
      <span class="linha-quem-vai-texto">${estado.encerrado ? 'Ver quem confirmou' : 'Ver quem vai'}</span>
      <i class="bi bi-chevron-down" aria-hidden="true"></i>
    </button>
    <ul class="lista-presencas" id="lista-presencas" data-lista-presencas ${estado.listaAberta ? '' : 'hidden'}>
      ${pessoas.map((pessoa) => itemPessoa(pessoa, sessao.usuario?.id))}
    </ul>`;
}

function botaoPresenca(estado) {
  if (estado.encerrado) return '';
  const classe = estado.confirmou ? 'btn-outline-secondary' : 'btn-primary';
  if (estado.enviando) {
    return html`<button type="button" class="btn ${classe} w-100" data-alternar-presenca disabled>
      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${estado.confirmou ? 'Cancelando...' : 'Confirmando...'}
    </button>`;
  }
  return estado.confirmou
    ? html`<button type="button" class="btn ${classe} w-100" data-alternar-presenca>
        <i class="bi bi-x-circle" aria-hidden="true"></i> Cancelar presença
      </button>`
    : html`<button type="button" class="btn ${classe} w-100" data-alternar-presenca>
        <i class="bi bi-check2-circle" aria-hidden="true"></i> Vou participar
      </button>`;
}

function conteudo(estado) {
  const { classe, icone, titulo, texto } = situacao(estado);
  return html`
    <div class="presenca-topo">
      <span class="presenca-icone ${classe}"><i class="bi bi-${icone}" aria-hidden="true"></i></span>
      <div>
        <h2 class="presenca-titulo" id="titulo-presenca">${titulo}</h2>
        <p class="presenca-texto">${texto}</p>
      </div>
    </div>
    ${quemVai(estado)}
    ${botaoPresenca(estado)}`;
}

/**
 * Confirmar ou cancelar a presença no evento e ver quem vai.
 * Depois que o evento termina, o cartão mostra só quem confirmou (o servidor não aceita mais mudanças).
 */
export function montarPresenca(caixa, evento) {
  const estado = {
    total: evento.total_presencas,
    confirmou: evento.confirmou,
    encerrado: evento.encerrado,
    pessoas: null,
    listaAberta: false,
    enviando: false,
  };
  // Cada busca da lista recebe um número; só a mais recente redesenha (uma resposta antiga não desfaz a nova).
  let ultimaBusca = 0;

  const desenhar = () => render(caixa, conteudo(estado));

  async function carregarPessoas() {
    const busca = ++ultimaBusca;
    let pessoas = null;
    try {
      pessoas = await api.get(`/eventos/${evento.id}/presencas`);
    } catch {
      // A lista é um complemento: sem ela, o total e o botão continuam funcionando.
    }
    if (busca !== ultimaBusca) return;
    if (pessoas) {
      estado.pessoas = pessoas;
      estado.total = pessoas.length;
    }
    desenhar();
  }

  async function alternar() {
    const confirmar = !estado.confirmou;
    estado.enviando = true;
    ultimaBusca += 1; // descarta uma lista que ainda esteja chegando
    desenhar();
    try {
      const caminho = `/eventos/${evento.id}/presenca`;
      const resultado = confirmar ? await api.put(caminho) : await api.del(caminho);
      estado.total = resultado.total_presencas;
      estado.confirmou = resultado.confirmou;
      avisar(confirmar ? 'Presença confirmada!' : 'Presença cancelada.');
    } catch (erro) {
      // 409: o evento terminou enquanto a página estava aberta.
      if (erro.status === 409) estado.encerrado = true;
      avisar(erro.message, 'erro');
    }
    estado.enviando = false;
    await carregarPessoas();
    caixa.querySelector('[data-alternar-presenca]')?.focus();
  }

  caixa.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-alternar-presenca]')) {
      alternar();
      return;
    }
    const linha = evento.target.closest('[data-ver-presencas]');
    if (!linha) return;
    estado.listaAberta = !estado.listaAberta;
    linha.setAttribute('aria-expanded', String(estado.listaAberta));
    caixa.querySelector('[data-lista-presencas]').hidden = !estado.listaAberta;
  });

  desenhar();
  carregarPessoas();
}
