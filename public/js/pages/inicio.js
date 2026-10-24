import { itemEvento } from '../components/evento.js';
import { itemMensagem } from '../components/mensagem.js';
import { api } from '../core/api.js';
import { agoraParaApi, dataPorExtenso } from '../core/formatos.js';
import { atualizarSeloAgenda } from '../core/layout.js';
import { dicaDispensada, dispensarDica, estaInstalado, instalar, podeInstalar, sistemaDoCelular } from '../core/pwa.js';
import { PAPEIS } from '../core/rotulos.js';
import { sessao } from '../core/sessao.js';
import { avisar, carregando, estadoVazio, html, render } from '../core/ui.js';

const textoHoje = (quantidade) =>
  quantidade === 0
    ? 'Nenhuma atividade restante para hoje.'
    : `Você tem ${quantidade} ${quantidade === 1 ? 'atividade' : 'atividades'} hoje.`;

// A dica aparece no celular (ou quando o navegador oferece instalar) até a pessoa instalar o app ou fechar a dica.
const mostrarDicaInstalar = () => !estaInstalado() && !dicaDispensada() && (sistemaDoCelular() !== null || podeInstalar());

export default async function paginaInicio({ el }) {
  const usuario = sessao.usuario;
  const primeiroNome = usuario.nome.split(' ')[0];

  render(
    el,
    html`
      <section class="cartao-saudacao">
        <p class="data mb-1">${dataPorExtenso(new Date())}</p>
        <h1 class="h4 fw-bold mb-1">Olá, ${primeiroNome}!</h1>
        <p class="mb-2 opacity-75 small">${PAPEIS[usuario.papel]}${usuario.igreja_nome ? ` · ${usuario.igreja_nome}` : ''}</p>
        <p class="mb-0 fw-semibold" data-hoje>&nbsp;</p>
      </section>

      ${mostrarDicaInstalar()
        ? html`<div class="cartao cartao-dica mt-3" data-instalar>
            <i class="bi bi-phone" aria-hidden="true"></i>
            <div class="flex-grow-1 small"><strong>Instale o aplicativo</strong><br>Acesse mais rápido pela tela inicial do celular.</div>
            ${podeInstalar()
              ? html`<button type="button" class="btn btn-primary btn-sm text-nowrap" data-acao="instalar">Instalar</button>`
              : html`<a class="btn btn-primary btn-sm text-nowrap" href="#/instalar">Ver como</a>`}
            <button type="button" class="btn-close" data-acao="dispensar-dica" aria-label="Fechar a dica de instalação"></button>
          </div>`
        : ''}
      ${!usuario.igreja_id
        ? html`<a class="cartao cartao-dica mt-3" href="#/perfil">
            <i class="bi bi-info-circle" aria-hidden="true"></i>
            <span class="small">Complete seu perfil: informe sua igreja e o bairro onde você atua.</span>
          </a>`
        : ''}

      <nav class="atalhos" aria-label="Atalhos">
        <a class="atalho" href="#/agenda/novo"><i class="bi bi-calendar-plus" aria-hidden="true"></i>Novo evento</a>
        <a class="atalho" href="#/mural"><i class="bi bi-pencil-square" aria-hidden="true"></i>Escrever no mural</a>
        <a class="atalho" href="#/capacitacao"><i class="bi bi-mortarboard" aria-hidden="true"></i>Capacitação</a>
        <a class="atalho" href="#/visitas"><i class="bi bi-geo-alt" aria-hidden="true"></i>Mapa de visitas</a>
      </nav>

      <div class="secao-titulo">
        <h2>Próximas atividades</h2>
        <a href="#/agenda" class="small fw-semibold">Ver agenda</a>
      </div>
      <div class="lista" data-eventos>${carregando()}</div>

      <div class="secao-titulo">
        <h2>Avisos recentes</h2>
        <a href="#/mural" class="small fw-semibold">Ir para o mural</a>
      </div>
      <div class="lista" data-avisos>${carregando()}</div>`,
  );

  el.querySelector('[data-acao="instalar"]')?.addEventListener('click', async () => {
    if (await instalar()) avisar('Aplicativo instalado!');
    el.querySelector('[data-instalar]')?.remove();
  });
  el.querySelector('[data-acao="dispensar-dica"]')?.addEventListener('click', () => {
    dispensarDica();
    el.querySelector('[data-instalar]')?.remove();
  });

  const [eventos, avisos, quantidadeHoje] = await Promise.all([
    api.get('/eventos', { de: agoraParaApi(), limite: 5 }),
    api.get('/mural', { tipo: 'aviso', limite: 3 }),
    atualizarSeloAgenda(),
  ]);

  if (quantidadeHoje !== null) el.querySelector('[data-hoje]').textContent = textoHoje(quantidadeHoje);

  render(
    el.querySelector('[data-eventos]'),
    eventos.length
      ? eventos.map((evento) => itemEvento(evento))
      : estadoVazio({
          icone: 'calendar-x',
          titulo: 'Nenhuma atividade agendada',
          acao: { href: '#/agenda/novo', rotulo: 'Agendar atividade' },
        }),
  );

  render(
    el.querySelector('[data-avisos]'),
    avisos.length
      ? avisos.map((aviso) => itemMensagem(aviso, { permitirExcluir: false }))
      : estadoVazio({ icone: 'megaphone', titulo: 'Nenhum aviso por enquanto' }),
  );
}
