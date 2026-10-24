import { api } from './core/api.js';
import { estaInstalado, registrarPwa } from './core/pwa.js';
import { iniciarRoteador } from './core/router.js';
import { sessao } from './core/sessao.js';

// No iPhone, o ícone criado a partir do passo a passo abriria o tutorial; o app instalado começa no início.
if (estaInstalado() && window.location.hash.startsWith('#/instalar')) window.history.replaceState(null, '', '#/');

registrarPwa();
iniciarRoteador();

// Atualiza os dados guardados do usuário (papel, igreja) sem atrasar a abertura do app.
if (sessao.logado) {
  api
    .get('/auth/eu')
    .then((usuario) => sessao.atualizarUsuario(usuario))
    .catch(() => {});
}
