import { rotaNaoEncontrada, rotas } from '../rotas.js';
import { prepararTela } from './layout.js';
import { sessao } from './sessao.js';
import { blocoErro, render } from './ui.js';

// "/agenda/:id" vira uma expressão regular; ":id" aceita apenas números.
const rotasCompiladas = rotas.map((rota) => ({
  ...rota,
  padrao: new RegExp(
    `^${rota.caminho.replace(/:(\w+)/g, (_, nome) => (nome === 'id' ? `(?<${nome}>\\d+)` : `(?<${nome}>[^/]+)`))}/?$`,
  ),
}));

let navegacaoAtual = 0;
// Tarefas de limpeza registradas pela tela atual (ex.: encerrar o leitor de PDF), executadas ao trocar de tela.
let limpezas = [];
// Só o endereço com que o app foi aberto (ex.: um link recebido no WhatsApp) é lembrado para depois do login.
let primeiraNavegacao = true;

function limparTelaAnterior() {
  for (const limpar of limpezas.splice(0)) {
    try {
      limpar();
    } catch (erro) {
      console.error(erro);
    }
  }
}

function lerEndereco() {
  const [caminho, busca = ''] = (window.location.hash.slice(1) || '/').split('?');
  return { caminho, query: Object.fromEntries(new URLSearchParams(busca)) };
}

function encontrarRota(caminho) {
  for (const rota of rotasCompiladas) {
    const resultado = caminho.match(rota.padrao);
    if (resultado) return { rota, params: { ...resultado.groups } };
  }
  return { rota: rotaNaoEncontrada, params: {} };
}

export function navegar(caminho, { substituir = false } = {}) {
  const hash = `#${caminho}`;
  if (substituir) {
    window.history.replaceState(null, '', hash);
    resolver();
  } else if (window.location.hash === hash) {
    resolver();
  } else {
    window.location.hash = hash;
  }
}

async function resolver() {
  const id = ++navegacaoAtual;
  const abriuOApp = primeiraNavegacao;
  primeiraNavegacao = false;
  limparTelaAnterior();
  const { caminho, query } = lerEndereco();

  if (caminho === '/') return navegar(sessao.logado ? '/inicio' : '/login', { substituir: true });

  const { rota, params } = encontrarRota(caminho);
  if (!rota.publica && !sessao.logado) {
    // Quem abre o link de uma tela sem estar logado (ex.: um evento compartilhado) volta para ela depois de entrar.
    if (abriuOApp && rota !== rotaNaoEncontrada) sessao.guardarDestino(window.location.hash.slice(1));
    return navegar('/login', { substituir: true });
  }
  if (rota.publica && !rota.livre && sessao.logado) return navegar('/inicio', { substituir: true });

  document.title = `${rota.titulo} · Projeto Missionário`;
  const el = prepararTela(rota, caminho);
  // A tela registra aqui o que deve ser encerrado quando a pessoa sair dela.
  const aoSair = (limpar) => (id === navegacaoAtual ? limpezas.push(limpar) : limpar());

  try {
    const modulo = await rota.pagina();
    if (id !== navegacaoAtual) return;
    await modulo.default({ el, params, query, navegar, aoSair });
  } catch (erro) {
    if (id !== navegacaoAtual) return;
    console.error(erro);
    render(el, blocoErro(erro));
  }
}

export function iniciarRoteador() {
  window.addEventListener('hashchange', resolver);
  resolver();
}
