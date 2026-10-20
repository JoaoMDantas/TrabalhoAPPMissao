import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { api, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

describe('Usuários e perfis', () => {
  test('atualiza o próprio perfil', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider);
    const pessoa = await criarUsuario();

    const resposta = await api()
      .put('/api/usuarios/eu')
      .set(pessoa.auth)
      .send({ nome: 'Nome Atualizado', telefone: '', igreja_id: igreja.id, bairro_atuacao: 'Planalto Anil III', sobre: 'Olá!' })
      .expect(200);

    assert.equal(resposta.body.nome, 'Nome Atualizado');
    assert.equal(resposta.body.telefone, null);
    assert.equal(resposta.body.igreja_nome, igreja.nome);
    assert.equal(resposta.body.sobre, 'Olá!');
  });

  test('recusa igreja inexistente no perfil', async () => {
    const pessoa = await criarUsuario();
    await api().put('/api/usuarios/eu').set(pessoa.auth).send({ nome: 'Pessoa Teste', igreja_id: 999999 }).expect(400);
  });

  test('troca a senha conferindo a senha atual', async () => {
    const pessoa = await criarUsuario();

    await api()
      .put('/api/usuarios/eu/senha')
      .set(pessoa.auth)
      .send({ senha_atual: 'errada', nova_senha: 'NovaSenha456' })
      .expect(400);
    await api()
      .put('/api/usuarios/eu/senha')
      .set(pessoa.auth)
      .send({ senha_atual: pessoa.senha, nova_senha: 'NovaSenha456' })
      .expect(204);

    await api().post('/api/auth/login').send({ email: pessoa.usuario.email, senha: pessoa.senha }).expect(401);
    await api().post('/api/auth/login').send({ email: pessoa.usuario.email, senha: 'NovaSenha456' }).expect(200);
  });

  test('admin redefine a senha esquecida com uma senha temporária', async () => {
    const admin = await criarUsuario({ papel: 'admin' });
    const lider = await criarUsuario({ papel: 'lider' });
    const pessoa = await criarUsuario();
    const rota = `/api/usuarios/${pessoa.usuario.id}/redefinir-senha`;

    await api().post(rota).set(pessoa.auth).expect(403);
    await api().post(rota).set(lider.auth).expect(403);
    const resposta = await api().post(rota).set(admin.auth).expect(200);
    assert.match(resposta.body.senha_temporaria, /^[A-HJ-NP-Za-km-np-z2-9]{10}$/);

    await api().post('/api/auth/login').send({ email: pessoa.usuario.email, senha: pessoa.senha }).expect(401);
    await api()
      .post('/api/auth/login')
      .send({ email: pessoa.usuario.email, senha: resposta.body.senha_temporaria })
      .expect(200);
    await api().post('/api/usuarios/999999/redefinir-senha').set(admin.auth).expect(404);
  });

  test('lista pessoas por papel e busca', async () => {
    const nomeUnico = `Missionária Busca ${Date.now()}`;
    const missionaria = await criarUsuario({ nome: nomeUnico });

    const resposta = await api()
      .get('/api/usuarios')
      .query({ papel: 'missionario', busca: nomeUnico })
      .set(missionaria.auth)
      .expect(200);

    assert.equal(resposta.body.length, 1);
    assert.equal(resposta.body[0].id, missionaria.usuario.id);
    assert.equal(resposta.body[0].senha_hash, undefined);
  });

  test('busca trata % e _ como texto comum', async () => {
    const pessoa = await criarUsuario();
    const resposta = await api().get('/api/usuarios').query({ busca: '%' }).set(pessoa.auth).expect(200);
    assert.equal(resposta.body.length, 0);
  });

  test('perfil de outra pessoa e 404 para id inexistente', async () => {
    const pessoa = await criarUsuario();
    const outra = await criarUsuario();

    const resposta = await api().get(`/api/usuarios/${outra.usuario.id}`).set(pessoa.auth).expect(200);
    assert.equal(resposta.body.nome, outra.usuario.nome);
    await api().get('/api/usuarios/999999').set(pessoa.auth).expect(404);
  });
});
