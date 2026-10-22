import { sessao } from './sessao.js';

export class ErroApi extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.detalhes = detalhes;
  }
}

async function requisitar(metodo, caminho, { corpo, parametros } = {}) {
  const url = new URL(`/api${caminho}`, window.location.origin);
  for (const [chave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(chave, valor);
  }

  const cabecalhos = { Accept: 'application/json' };
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (sessao.token) cabecalhos.Authorization = `Bearer ${sessao.token}`;

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi(0, 'Sem conexão com o servidor. Verifique sua internet e tente novamente.');
  }

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // Token vencido ou inválido: encerra a sessão e volta para o login.
    if (resposta.status === 401 && sessao.token) {
      sessao.encerrar();
      window.location.hash = '#/login';
    }
    throw new ErroApi(resposta.status, dados?.erro?.mensagem || 'Erro inesperado. Tente novamente.', dados?.erro?.detalhes);
  }

  return dados;
}

export const api = {
  get: (caminho, parametros) => requisitar('GET', caminho, { parametros }),
  post: (caminho, corpo = {}) => requisitar('POST', caminho, { corpo }),
  put: (caminho, corpo = {}) => requisitar('PUT', caminho, { corpo }),
  patch: (caminho, corpo = {}) => requisitar('PATCH', caminho, { corpo }),
  del: (caminho) => requisitar('DELETE', caminho),
};
