/**
 * Tabela de telas do aplicativo. Para criar uma tela nova:
 * 1) crie o arquivo em js/pages/  2) adicione a rota aqui.
 * Rotas com "nav" aparecem no menu inferior (máximo de 5).
 */
const pagina = (nome) => () => import(`./pages/${nome}.js`);

export const rotas = [
  { caminho: '/login', titulo: 'Entrar', pagina: pagina('login'), publica: true },
  { caminho: '/cadastro', titulo: 'Criar conta', pagina: pagina('cadastro'), publica: true },

  { caminho: '/inicio', titulo: 'Início', pagina: pagina('inicio'), nav: { icone: 'house-door', rotulo: 'Início' } },

  { caminho: '/agenda', titulo: 'Agenda', pagina: pagina('agenda'), nav: { icone: 'calendar3', rotulo: 'Agenda' } },
  { caminho: '/agenda/novo', titulo: 'Novo evento', pagina: pagina('evento-form') },
  { caminho: '/agenda/:id', titulo: 'Evento', pagina: pagina('evento-detalhe') },
  { caminho: '/agenda/:id/editar', titulo: 'Editar evento', pagina: pagina('evento-form') },

  { caminho: '/mural', titulo: 'Mural', pagina: pagina('mural'), nav: { icone: 'chat-square-text', rotulo: 'Mural' } },

  { caminho: '/igrejas', titulo: 'Igrejas', pagina: pagina('igrejas'), nav: { icone: 'building', rotulo: 'Igrejas' } },
  { caminho: '/igrejas/nova', titulo: 'Nova igreja', pagina: pagina('igreja-form') },
  { caminho: '/igrejas/:id', titulo: 'Igreja', pagina: pagina('igreja-detalhe') },
  { caminho: '/igrejas/:id/editar', titulo: 'Editar igreja', pagina: pagina('igreja-form') },

  {
    caminho: '/missionarios',
    titulo: 'Missionários',
    pagina: pagina('missionarios'),
    nav: { icone: 'people', rotulo: 'Missionários' },
  },
  { caminho: '/missionarios/:id', titulo: 'Perfil', pagina: pagina('missionario-detalhe') },

  { caminho: '/perfil', titulo: 'Meu perfil', pagina: pagina('perfil') },
];

export const rotaNaoEncontrada = { caminho: null, titulo: 'Página não encontrada', pagina: pagina('nao-encontrada') };
