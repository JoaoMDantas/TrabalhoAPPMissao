import { AGENTE } from '../../core/download-seguro.js';
import { erros } from '../../core/erros.js';

/*
 * Busca de endereços no Nominatim (OpenStreetMap), gratuito e sem chave de acesso.
 * Regras de uso do serviço: identificar o aplicativo, no máximo 1 consulta por segundo e guardar os resultados.
 */
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
// Retângulo aproximado do Maranhão: os resultados daqui aparecem primeiro, sem excluir o resto do país.
const AREA_PREFERIDA = '-48.8,-1.0,-41.8,-10.3';
const INTERVALO_MS = 1000;
const VALIDADE_MS = 24 * 60 * 60 * 1000;
const MAX_GUARDADOS = 500;

const guardados = new Map();
let fila = Promise.resolve();
let ultimaConsulta = 0;

/** Executa as consultas uma de cada vez, com pelo menos 1 segundo entre elas. */
function naFila(tarefa) {
  const execucao = fila.then(async () => {
    const espera = ultimaConsulta + INTERVALO_MS - Date.now();
    if (espera > 0) await new Promise((resolver) => setTimeout(resolver, espera));
    ultimaConsulta = Date.now();
    return tarefa();
  });
  fila = execucao.catch(() => {});
  return execucao;
}

const arredondar = (valor) => Math.round(Number(valor) * 1e6) / 1e6;

async function consultarNominatim(termo) {
  const url = new URL(NOMINATIM);
  url.search = new URLSearchParams({
    q: termo,
    format: 'jsonv2',
    countrycodes: 'br',
    viewbox: AREA_PREFERIDA,
    limit: '5',
    'accept-language': 'pt-BR',
  });

  let resposta;
  try {
    resposta = await fetch(url, {
      headers: { 'User-Agent': AGENTE, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw erros.servicoExterno('O serviço de mapas não respondeu. Tente novamente em instantes.');
  }
  if (!resposta.ok) throw erros.servicoExterno('O serviço de mapas não respondeu. Tente novamente em instantes.');

  const itens = await resposta.json();
  return itens.map((item) => ({
    nome: item.display_name,
    latitude: arredondar(item.lat),
    longitude: arredondar(item.lon),
  }));
}

/** Procura um endereço e devolve até 5 lugares encontrados, com nome e coordenadas. */
export async function buscarEndereco(termo) {
  const chave = termo.toLocaleLowerCase('pt-BR');
  const guardado = guardados.get(chave);
  if (guardado && guardado.expira > Date.now()) return guardado.resultados;

  const resultados = await naFila(() => consultarNominatim(termo));
  guardados.set(chave, { resultados, expira: Date.now() + VALIDADE_MS });
  if (guardados.size > MAX_GUARDADOS) guardados.delete(guardados.keys().next().value);
  return resultados;
}
