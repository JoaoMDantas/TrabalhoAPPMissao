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

// "acao" e "iconeAcao": o botão principal de cada tipo de material na trilha de capacitação.
export const TIPOS_MATERIAL = Object.freeze({
  pdf: { rotulo: 'PDF', icone: 'file-earmark-pdf', acao: 'Ler no app', iconeAcao: 'book' },
  video: { rotulo: 'Vídeo', icone: 'play-btn', acao: 'Assistir', iconeAcao: 'play-fill' },
  link: { rotulo: 'Site', icone: 'box-arrow-up-right', acao: 'Abrir site', iconeAcao: 'box-arrow-up-right' },
});

export const BAIRROS_SUGERIDOS = Object.freeze(['Cohatrac', 'Planalto Anil III']);
