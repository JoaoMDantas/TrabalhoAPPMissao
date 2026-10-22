import { sessao } from './sessao.js';

/** Oferece um arquivo (Blob) para a pessoa salvar no aparelho. */
export function salvarArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const nomeNaResposta = (resposta) =>
  /filename="([^"]+)"/.exec(resposta.headers.get('Content-Disposition') ?? '')?.[1] ?? 'material.pdf';

/**
 * Busca o PDF de um material pelo servidor (que traz o arquivo do site de origem quando preciso).
 * Depois da primeira vez, o aparelho guarda o arquivo e ele abre mesmo sem internet.
 * "aoProgredir(recebidos, total)" informa o andamento do download. Devolve { blob, nome }.
 */
export async function buscarPdf(id, { aoProgredir, sinal } = {}) {
  let resposta;
  try {
    resposta = await fetch(`/api/materiais/${id}/arquivo`, {
      headers: { Authorization: `Bearer ${sessao.token}` },
      signal: sinal,
    });
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
    throw new Error('Sem conexão com a internet. Abra este material uma vez com internet para que ele fique salvo no aparelho.');
  }

  if (!resposta.ok) {
    if (resposta.status === 401) {
      sessao.encerrar();
      window.location.hash = '#/login';
    }
    const dados = await resposta.json().catch(() => null);
    throw new Error(dados?.erro?.mensagem ?? 'Não foi possível abrir o arquivo.');
  }

  const nome = nomeNaResposta(resposta);
  const total = Number(resposta.headers.get('Content-Length')) || 0;
  if (!resposta.body) return { blob: await resposta.blob(), nome };

  const leitor = resposta.body.getReader();
  const pedacos = [];
  let recebidos = 0;
  while (true) {
    const { done, value } = await leitor.read();
    if (done) break;
    pedacos.push(value);
    recebidos += value.length;
    aoProgredir?.(recebidos, total);
  }
  return { blob: new Blob(pedacos, { type: 'application/pdf' }), nome };
}

/** Baixa o PDF de um material para o aparelho. */
export async function baixarPdf(id) {
  const { blob, nome } = await buscarPdf(id);
  salvarArquivo(blob, nome);
}
