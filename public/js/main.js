import { api } from './core/api.js';
import { registrarPwa } from './core/pwa.js';
import { iniciarRoteador } from './core/router.js';
import { sessao } from './core/sessao.js';

registrarPwa();
iniciarRoteador();

// Atualiza os dados guardados do usuário (papel, igreja) sem atrasar a abertura do app.
if (sessao.logado) {
  api
    .get('/auth/eu')
    .then((usuario) => sessao.atualizarUsuario(usuario))
    .catch(() => {});
}
