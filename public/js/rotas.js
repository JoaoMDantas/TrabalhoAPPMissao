/**
 * Tabela de telas do aplicativo. Para criar uma tela nova:
 * 1) crie o arquivo em js/pages/  2) adicione a rota aqui.
 * Rotas com "nav" aparecem no menu inferior (máximo de 5).
 */
const pagina = (nome) => () => import(`./pages/${nome}.js`);

export const rotas = [
  { caminho: '/login', titulo: 'Entrar', pagina: pagina('login'), publica: true },
  { caminho: '/cadastro', titulo: 'Criar conta', pagina: pagina('cadastro'), publica: true },
  // "livre": acessível com ou sem login.
  { caminho: '/privacidade', titulo: 'Aviso de privacidade', pagina: pagina('privacidade'), publica: true, livre: true },

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
  { caminho: '/igrejas/:id/local', titulo: 'Ajustar no mapa', pagina: pagina('local-igreja') },

  {
    caminho: '/missionarios',
    titulo: 'Missionários',
    pagina: pagina('missionarios'),
    nav: { icone: 'people', rotulo: 'Missionários' },
  },
  { caminho: '/missionarios/:id', titulo: 'Perfil', pagina: pagina('missionario-detalhe') },

  { caminho: '/visitas', titulo: 'Mapa de visitas', pagina: pagina('visitas') },
  { caminho: '/visitas/nova', titulo: 'Registrar visita', pagina: pagina('visita-form') },
  { caminho: '/visitas/:id', titulo: 'Visita', pagina: pagina('visita-detalhe') },
  { caminho: '/visitas/:id/editar', titulo: 'Editar visita', pagina: pagina('visita-form') },
  { caminho: '/visitas/:id/local', titulo: 'Ajustar no mapa', pagina: pagina('local-visita') },

  { caminho: '/capacitacao', titulo: 'Capacitação', pagina: pagina('capacitacao') },
  { caminho: '/capacitacao/novo', titulo: 'Novo material', pagina: pagina('material-form') },
  { caminho: '/capacitacao/:id/ler', titulo: 'Leitura', pagina: pagina('material-leitor') },

  { caminho: '/documentos', titulo: 'Documentos da igreja', pagina: pagina('documentos') },
  { caminho: '/documentos/novo', titulo: 'Novo documento', pagina: pagina('documento-form') },
  { caminho: '/documentos/:id/ler', titulo: 'Leitura', pagina: pagina('documento-leitor') },

  { caminho: '/perfil', titulo: 'Meu perfil', pagina: pagina('perfil') },
];

export const rotaNaoEncontrada = { caminho: null, titulo: 'Página não encontrada', pagina: pagina('nao-encontrada') };
