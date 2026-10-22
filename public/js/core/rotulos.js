export const PAPEIS = Object.freeze({
  admin: 'Administrador',
  lider: 'Líder',
  missionario: 'Missionário',
});

export const TIPOS_EVENTO = Object.freeze({
  culto: { rotulo: 'Culto', icone: 'music-note-beamed' },
  visita: { rotulo: 'Visita', icone: 'house-heart' },
  acao_social: { rotulo: 'Ação social', icone: 'box2-heart' },
  reuniao: { rotulo: 'Reunião', icone: 'people' },
  outro: { rotulo: 'Outro', icone: 'calendar-event' },
});

export const TIPOS_VISITA = Object.freeze({
  evangelismo: { rotulo: 'Evangelismo', icone: 'megaphone' },
  acompanhamento: { rotulo: 'Acompanhamento', icone: 'people' },
  oracao: { rotulo: 'Oração', icone: 'heart' },
  acao_social: { rotulo: 'Ação social', icone: 'box2-heart' },
  outro: { rotulo: 'Outro', icone: 'geo-alt' },
});

// Situação da visita (não da fé dos moradores): orienta quem volta ao local depois.
export const SITUACOES_VISITA = Object.freeze({
  realizada: { rotulo: 'Visita realizada', curto: 'Realizadas', icone: 'check-circle' },
  retornar: { rotulo: 'Pediu retorno', curto: 'Pediram retorno', icone: 'arrow-repeat' },
  ausente: { rotulo: 'Ninguém em casa', curto: 'Ninguém em casa', icone: 'house-x' },
});

// "acao" e "iconeAcao": o botão principal de cada tipo de material na trilha de capacitação.
export const TIPOS_MATERIAL = Object.freeze({
  pdf: { rotulo: 'PDF', icone: 'file-earmark-pdf', acao: 'Ler no app', iconeAcao: 'book' },
  video: { rotulo: 'Vídeo', icone: 'play-btn', acao: 'Assistir', iconeAcao: 'play-fill' },
  link: { rotulo: 'Site', icone: 'box-arrow-up-right', acao: 'Abrir site', iconeAcao: 'box-arrow-up-right' },
});

export const BAIRROS_SUGERIDOS = Object.freeze(['Cohatrac', 'Planalto Anil III']);
