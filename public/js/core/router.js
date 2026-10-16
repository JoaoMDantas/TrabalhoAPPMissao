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
  const { caminho, query } = lerEndereco();

  if (caminho === '/') return navegar(sessao.logado ? '/inicio' : '/login', { substituir: true });

  const { rota, params } = encontrarRota(caminho);
  if (!rota.publica && !sessao.logado) return navegar('/login', { substituir: true });
  if (rota.publica && sessao.logado) return navegar('/inicio', { substituir: true });

  document.title = `${rota.titulo} · Projeto Missionário`;
  const el = prepararTela(rota, caminho);

  try {
    const modulo = await rota.pagina();
    if (id !== navegacaoAtual) return;
    await modulo.default({ el, params, query, navegar });
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
