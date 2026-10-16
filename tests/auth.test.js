import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { api, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

describe('Autenticação', () => {
  test('cadastra um missionário e devolve token sem expor a senha', async () => {
    const { token, usuario } = await criarUsuario({ telefone: '(98) 99999-1234', bairro_atuacao: 'Cohatrac' });

    assert.ok(token);
    assert.equal(usuario.papel, 'missionario');
    assert.equal(usuario.bairro_atuacao, 'Cohatrac');
    assert.equal(usuario.senha_hash, undefined);
    assert.equal(usuario.senha, undefined);
  });

  test('guarda o e-mail em minúsculas e recusa e-mail repetido', async () => {
    const { usuario } = await criarUsuario();
    const resposta = await api()
      .post('/api/auth/registrar')
      .send({ nome: 'Outra Pessoa', email: usuario.email.toUpperCase(), senha: 'SenhaForte123' })
      .expect(409);

    assert.equal(resposta.body.erro.mensagem, 'Este e-mail já está cadastrado.');
  });

  test('valida os campos do cadastro', async () => {
    const resposta = await api()
      .post('/api/auth/registrar')
      .send({ nome: 'Jo', email: 'invalido', senha: '123' })
      .expect(400);

    const campos = resposta.body.erro.detalhes.map((d) => d.campo);
    assert.deepEqual(campos.sort(), ['email', 'nome', 'senha']);
  });

  test('não permite se cadastrar como administrador', async () => {
    await api()
      .post('/api/auth/registrar')
      .send({ nome: 'Pessoa Teste', email: `admin${Date.now()}@exemplo.com`, senha: 'SenhaForte123', papel: 'admin' })
      .expect(400);
  });

  test('recusa igreja inexistente no cadastro', async () => {
    const resposta = await api()
      .post('/api/auth/registrar')
      .send({ nome: 'Pessoa Teste', email: `igreja${Date.now()}@exemplo.com`, senha: 'SenhaForte123', igreja_id: 999999 })
      .expect(400);

    assert.equal(resposta.body.erro.mensagem, 'A igreja selecionada não existe.');
  });

  test('faz login com a senha correta', async () => {
    const { usuario, senha } = await criarUsuario();
    const resposta = await api().post('/api/auth/login').send({ email: usuario.email, senha }).expect(200);

    assert.ok(resposta.body.token);
    assert.equal(resposta.body.usuario.id, usuario.id);
  });

  test('responde a mesma mensagem para senha errada e e-mail inexistente', async () => {
    const { usuario } = await criarUsuario();
    const senhaErrada = await api().post('/api/auth/login').send({ email: usuario.email, senha: 'errada123' }).expect(401);
    const emailInexistente = await api()
      .post('/api/auth/login')
      .send({ email: 'ninguem@exemplo.com', senha: 'errada123' })
      .expect(401);

    assert.equal(senhaErrada.body.erro.mensagem, 'E-mail ou senha incorretos.');
    assert.equal(emailInexistente.body.erro.mensagem, senhaErrada.body.erro.mensagem);
  });

  test('/auth/eu exige token válido', async () => {
    const { usuario, auth } = await criarUsuario();

    await api().get('/api/auth/eu').expect(401);
    await api().get('/api/auth/eu').set('Authorization', 'Bearer token-invalido').expect(401);
    const resposta = await api().get('/api/auth/eu').set(auth).expect(200);

    assert.equal(resposta.body.email, usuario.email);
  });
});

describe('API em geral', () => {
  test('responde 404 em JSON para rota inexistente', async () => {
    const resposta = await api().get('/api/nao-existe').expect(404);
    assert.equal(resposta.body.erro.mensagem, 'Rota não encontrada.');
  });

  test('responde 400 para JSON malformado', async () => {
    await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":').expect(400);
  });

  test('verifica a saúde da API e do banco', async () => {
    const resposta = await api().get('/api/saude').expect(200);
    assert.equal(resposta.body.status, 'ok');
  });
});
