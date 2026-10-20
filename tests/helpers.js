import request from 'supertest';
import { criarApp } from '../src/app.js';
import { consultar } from '../src/config/database.js';

export { encerrarBanco } from '../src/config/database.js';

export const app = criarApp();
export const api = () => request(app);

let contador = 0;
const sufixoUnico = () => `${Date.now()}${process.pid}${++contador}`;

/**
 * Cria um usuário novo pela API e devolve { token, usuario, senha, auth }.
 * Os testes rodam em paralelo no mesmo banco, por isso cada usuário tem e-mail único.
 */
export async function criarUsuario({ papel = 'missionario', ...extras } = {}) {
  const dados = {
    nome: 'Pessoa de Teste',
    email: `teste${sufixoUnico()}@exemplo.com`,
    senha: 'SenhaForte123',
    papel: papel === 'admin' ? 'missionario' : papel,
    aceite: true,
    ...extras,
  };
  const resposta = await api().post('/api/auth/registrar').send(dados).expect(201);

  // O cadastro público nunca cria admin; nos testes ele é promovido direto no banco.
  if (papel === 'admin') {
    await consultar('UPDATE usuarios SET papel = ? WHERE id = ?', ['admin', resposta.body.usuario.id]);
  }

  return {
    ...resposta.body,
    senha: dados.senha,
    auth: { Authorization: `Bearer ${resposta.body.token}` },
  };
}

export async function criarIgreja(responsavel, extras = {}) {
  const resposta = await api()
    .post('/api/igrejas')
    .set(responsavel.auth)
    .send({ nome: 'Igreja de Teste', cidade: 'São Luís', bairro: 'Cohatrac', ...extras })
    .expect(201);
  return resposta.body;
}

export async function criarEvento(autor, extras = {}) {
  const resposta = await api()
    .post('/api/eventos')
    .set(autor.auth)
    .send({ titulo: 'Evento de teste', tipo: 'visita', data_inicio: '2030-05-10T15:00', ...extras })
    .expect(201);
  return resposta.body;
}
