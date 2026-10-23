import { ErroApi } from './api.js';
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

// Prefere o nome em UTF-8 (filename*), que preserva acentos; senão usa o filename simples.
function nomeNaResposta(resposta) {
  const cabecalho = resposta.headers.get('Content-Disposition') ?? '';
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecalho)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      // Nome malformado: cai no filename simples.
    }
  }
  return /filename="([^"]+)"/.exec(cabecalho)?.[1] ?? 'arquivo';
}

function encerrarSeSessaoVenceu(status) {
  if (status === 401) {
    sessao.encerrar();
    window.location.hash = '#/login';
  }
}

/**
 * Busca um arquivo da API com o login da pessoa, informando o andamento: aoProgredir(recebidos, total).
 * Devolve { blob, nome }.
 */
export async function buscarArquivo(endereco, { aoProgredir, sinal, semConexao = 'Sem conexão com a internet. Verifique e tente novamente.' } = {}) {
  let resposta;
  try {
    resposta = await fetch(endereco, { headers: { Authorization: `Bearer ${sessao.token}` }, signal: sinal });
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
    throw new Error(semConexao);
  }

  if (!resposta.ok) {
    encerrarSeSessaoVenceu(resposta.status);
    const dados = await resposta.json().catch(() => null);
    throw new Error(dados?.erro?.mensagem ?? 'Não foi possível abrir o arquivo.');
  }

  const nome = nomeNaResposta(resposta);
  const tipo = resposta.headers.get('Content-Type') ?? 'application/octet-stream';
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
  return { blob: new Blob(pedacos, { type: tipo }), nome };
}

/**
 * PDF de um material da trilha (o servidor traz o arquivo do site de origem quando preciso).
 * Depois da primeira vez, o aparelho guarda o arquivo e ele abre mesmo sem internet.
 */
export const buscarPdf = (id, opcoes = {}) =>
  buscarArquivo(`/api/materiais/${id}/arquivo`, {
    semConexao: 'Sem conexão com a internet. Abra este material uma vez com internet para que ele fique salvo no aparelho.',
    ...opcoes,
  });

/** Baixa um arquivo da API para o aparelho. */
export async function baixarArquivo(endereco) {
  const { blob, nome } = await buscarArquivo(endereco);
  salvarArquivo(blob, nome);
}

export const baixarPdf = (id) => baixarArquivo(`/api/materiais/${id}/arquivo`);

/**
 * Envia um formulário com arquivos (multipart) para a API, informando o andamento do envio:
 * aoProgredir(enviados, total). Devolve a resposta da API ou lança ErroApi, como o cliente da API.
 */
export function enviarFormulario(caminho, dados, { aoProgredir } = {}) {
  return new Promise((resolver, rejeitar) => {
    const requisicao = new XMLHttpRequest();
    requisicao.open('POST', `/api${caminho}`);
    requisicao.setRequestHeader('Authorization', `Bearer ${sessao.token}`);
    requisicao.responseType = 'json';
    requisicao.upload.onprogress = (evento) => evento.lengthComputable && aoProgredir?.(evento.loaded, evento.total);
    requisicao.onload = () => {
      if (requisicao.status >= 200 && requisicao.status < 300) {
        resolver(requisicao.response);
        return;
      }
      encerrarSeSessaoVenceu(requisicao.status);
      const erro = requisicao.response?.erro;
      rejeitar(new ErroApi(requisicao.status, erro?.mensagem ?? 'Não foi possível enviar. Tente novamente.', erro?.detalhes));
    };
    requisicao.onerror = () => rejeitar(new ErroApi(0, 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'));
    requisicao.send(dados);
  });
}
