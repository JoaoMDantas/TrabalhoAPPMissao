import authRotas from './auth/auth.routes.js';
import eventosRotas from './eventos/eventos.routes.js';
import igrejasRotas from './igrejas/igrejas.routes.js';
import localizacaoRotas from './localizacao/localizacao.routes.js';
import materiaisRotas from './materiais/materiais.routes.js';
import muralRotas from './mural/mural.routes.js';
import usuariosRotas from './usuarios/usuarios.routes.js';
import visitasRotas from './visitas/visitas.routes.js';

/** Para adicionar uma funcionalidade: crie a pasta do módulo e registre as rotas aqui. */
const modulos = [
  { prefixo: '/auth', rotas: authRotas },
  { prefixo: '/usuarios', rotas: usuariosRotas },
  { prefixo: '/igrejas', rotas: igrejasRotas },
  { prefixo: '/eventos', rotas: eventosRotas },
  { prefixo: '/mural', rotas: muralRotas },
  { prefixo: '/materiais', rotas: materiaisRotas },
  { prefixo: '/localizacao', rotas: localizacaoRotas },
  { prefixo: '/visitas', rotas: visitasRotas },
];

export function registrarModulos(roteador) {
  for (const { prefixo, rotas } of modulos) roteador.use(prefixo, rotas);
}
