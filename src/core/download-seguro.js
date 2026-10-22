import dns from 'node:dns';
import https from 'node:https';
import net from 'node:net';
import { Readable } from 'node:stream';
import { erros } from './erros.js';

/*
 * Download de arquivos de outros sites feito pelo servidor (ex.: PDFs da trilha de capacitação).
 * Como o endereço vem de dados cadastrados por usuários, há proteções contra SSRF: só https na porta padrão,
 * só endereços públicos da internet (nada de rede interna, loopback ou metadados da nuvem), poucos
 * redirecionamentos, tempo e tamanho limitados.
 */

const FAIXAS_BLOQUEADAS = new net.BlockList();
const FAIXAS_IPV4 = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];
const FAIXAS_IPV6 = [
  ['::', 127],
  ['64:ff9b::', 96],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
];
for (const [rede, prefixo] of FAIXAS_IPV4) FAIXAS_BLOQUEADAS.addSubnet(rede, prefixo, 'ipv4');
for (const [rede, prefixo] of FAIXAS_IPV6) FAIXAS_BLOQUEADAS.addSubnet(rede, prefixo, 'ipv6');

const MAX_REDIRECIONAMENTOS = 5;
const AGENTE = 'ProjetoMissionario/1.0 (+https://github.com/JoaoMDantas/TrabalhoAPPMissao)';

const enderecoBloqueado = () => erros.requisicaoInvalida('O endereço do arquivo não é permitido.');

/** Diz se o IP é de rede interna ou reservada (ou nem é um IP válido). */
export function ehEnderecoInterno(ip) {
  const ipv4Mapeado = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (ipv4Mapeado) return ehEnderecoInterno(ipv4Mapeado[1]);
  const versao = net.isIP(ip);
  if (versao === 0) return true;
  return FAIXAS_BLOQUEADAS.check(ip, versao === 4 ? 'ipv4' : 'ipv6');
}

// O IP é conferido na hora da conexão, depois do DNS: assim um domínio não consegue "apontar" para a rede interna.
function lookupSeguro(host, opcoes, callback) {
  dns.lookup(host, opcoes, (erro, endereco, familia) => {
    if (erro) return callback(erro);
    const enderecos = Array.isArray(endereco) ? endereco.map((item) => item.address) : [endereco];
    if (enderecos.some(ehEnderecoInterno)) return callback(enderecoBloqueado());
    return callback(null, endereco, familia);
  });
}

function conferirUrl(texto) {
  let url;
  try {
    url = new URL(texto);
  } catch {
    throw erros.requisicaoInvalida('O endereço do arquivo é inválido.');
  }
  if (url.protocol !== 'https:') throw erros.requisicaoInvalida('Só é possível abrir arquivos de endereços https.');
  if (url.port && url.port !== '443') throw enderecoBloqueado();
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) && ehEnderecoInterno(host)) throw enderecoBloqueado();
  return url;
}

function requisitar(url, tempoLimiteMs) {
  return new Promise((resolve, reject) => {
    const requisicao = https.get(
      url,
      { lookup: lookupSeguro, timeout: tempoLimiteMs, headers: { 'User-Agent': AGENTE, Accept: '*/*' } },
      resolve,
    );
    requisicao.on('timeout', () => requisicao.destroy(erros.servicoExterno('O site de origem demorou demais para responder.')));
    requisicao.on('error', (erro) => reject(erro.status ? erro : erros.servicoExterno('Não foi possível acessar o site de origem.')));
  });
}

/** Confere o começo do conteúdo e devolve um fluxo que interrompe o envio se passar do tamanho máximo. */
async function prepararConteudo(origem, { limiteBytes, validarInicio, bytesIniciais }) {
  const iterador = origem[Symbol.asyncIterator]();
  let inicio = Buffer.alloc(0);
  while (inicio.length < bytesIniciais) {
    const { value, done } = await iterador.next();
    if (done) break;
    inicio = Buffer.concat([inicio, value]);
  }
  if (!validarInicio(inicio)) {
    await iterador.return();
    throw erros.servicoExterno('O endereço não aponta para um arquivo válido.');
  }

  async function* repassar() {
    try {
      let total = inicio.length;
      yield inicio;
      while (true) {
        const { value, done } = await iterador.next();
        if (done) return;
        total += value.length;
        if (total > limiteBytes) throw erros.servicoExterno('O arquivo é grande demais.');
        yield value;
      }
    } finally {
      // Se o aplicativo desistir no meio (ex.: a pessoa fechou a tela), para de baixar do site de origem.
      await iterador.return();
    }
  }
  return Readable.from(repassar(), { objectMode: false });
}

/**
 * Baixa um arquivo de outro site e devolve { fluxo, tamanho } para repassar ao aplicativo.
 * "validarInicio" recebe os primeiros bytes (ex.: para conferir se é mesmo um PDF).
 */
export async function baixarArquivo(endereco, { limiteBytes, validarInicio, bytesIniciais = 1024, tempoLimiteMs = 20000 }) {
  let url = conferirUrl(endereco);
  for (let redirecionamentos = 0; ; redirecionamentos += 1) {
    const resposta = await requisitar(url, tempoLimiteMs);
    const { statusCode, headers } = resposta;

    if (statusCode >= 300 && statusCode < 400 && headers.location) {
      resposta.resume();
      if (redirecionamentos >= MAX_REDIRECIONAMENTOS) throw erros.servicoExterno('O site de origem redirecionou vezes demais.');
      url = conferirUrl(new URL(headers.location, url).toString());
      continue;
    }
    if (statusCode !== 200) {
      resposta.resume();
      throw erros.servicoExterno(`O site de origem não entregou o arquivo (HTTP ${statusCode}).`);
    }

    const tamanho = Number(headers['content-length']) || null;
    if (tamanho && tamanho > limiteBytes) {
      resposta.destroy();
      throw erros.servicoExterno('O arquivo é grande demais.');
    }
    return { fluxo: await prepararConteudo(resposta, { limiteBytes, validarInicio, bytesIniciais }), tamanho };
  }
}
