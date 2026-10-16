import { itemEvento } from '../components/evento.js';
import { api } from '../core/api.js';
import { chaveDia, chaveMes, dataPorExtenso, mesAno, paraData } from '../core/formatos.js';
import { TIPOS_EVENTO } from '../core/rotulos.js';
import { carregando, estadoVazio, html, render } from '../core/ui.js';

function linkAgenda(mes, tipo) {
  const parametros = new URLSearchParams();
  if (mes) parametros.set('mes', mes);
  if (tipo) parametros.set('tipo', tipo);
  const busca = parametros.toString();
  return `#/agenda${busca ? `?${busca}` : ''}`;
}

function agruparPorDia(eventos) {
  const grupos = new Map();
  for (const evento of eventos) {
    const dia = evento.data_inicio.slice(0, 10);
    if (!grupos.has(dia)) grupos.set(dia, []);
    grupos.get(dia).push(evento);
  }
  return grupos;
}

export default async function paginaAgenda({ el, query }) {
  const hoje = new Date();
  const mesAtual = chaveMes(hoje);
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.mes ?? '') ? query.mes : mesAtual;
  const tipo = Object.hasOwn(TIPOS_EVENTO, query.tipo ?? '') ? query.tipo : '';

  const [ano, numeroMes] = mes.split('-').map(Number);
  const primeiroDia = new Date(ano, numeroMes - 1, 1);
  const ultimoDia = new Date(ano, numeroMes, 0);
  const mesAnterior = chaveMes(new Date(ano, numeroMes - 2, 1));
  const proximoMes = chaveMes(new Date(ano, numeroMes, 1));

  render(
    el,
    html`
      <div class="cabecalho-mes">
        <a class="btn-icone" href="${linkAgenda(mesAnterior, tipo)}" aria-label="Mês anterior"><i class="bi bi-chevron-left"></i></a>
        <div class="text-center">
          <h2 class="h5 fw-bold mb-0">${mesAno(primeiroDia)}</h2>
          ${mes !== mesAtual ? html`<a class="small" href="${linkAgenda(null, tipo)}">Voltar para o mês atual</a>` : ''}
        </div>
        <a class="btn-icone" href="${linkAgenda(proximoMes, tipo)}" aria-label="Próximo mês"><i class="bi bi-chevron-right"></i></a>
      </div>

      <div class="filtros-chips" role="group" aria-label="Filtrar por tipo">
        <a class="chip ${tipo ? '' : 'ativo'}" href="${linkAgenda(mes, '')}">Todos</a>
        ${Object.entries(TIPOS_EVENTO).map(
          ([chave, { rotulo }]) =>
            html`<a class="chip ${tipo === chave ? 'ativo' : ''}" href="${linkAgenda(mes, chave)}">${rotulo}</a>`,
        )}
      </div>

      <div data-lista>${carregando()}</div>

      <a class="botao-flutuante" href="#/agenda/novo" aria-label="Novo evento"><i class="bi bi-plus-lg"></i></a>`,
  );

  const eventos = await api.get('/eventos', {
    de: chaveDia(primeiroDia),
    ate: chaveDia(ultimoDia),
    tipo,
    limite: 200,
  });

  if (!eventos.length) {
    render(
      el.querySelector('[data-lista]'),
      estadoVazio({
        icone: 'calendar-x',
        titulo: 'Nenhuma atividade neste mês',
        texto: tipo ? 'Tente remover o filtro de tipo.' : 'Que tal agendar a primeira?',
        acao: { href: '#/agenda/novo', rotulo: 'Agendar atividade' },
      }),
    );
    return;
  }

  const chaveHoje = chaveDia(hoje);
  render(
    el.querySelector('[data-lista]'),
    [...agruparPorDia(eventos)].map(
      ([dia, eventosDoDia]) => html`
        <h3 class="dia-agenda ${dia === chaveHoje ? 'hoje' : ''}">
          ${dia === chaveHoje ? 'Hoje · ' : ''}${dataPorExtenso(paraData(dia))}
        </h3>
        <div class="lista">${eventosDoDia.map((evento) => itemEvento(evento, { agrupadoPorDia: true }))}</div>`,
    ),
  );
}
