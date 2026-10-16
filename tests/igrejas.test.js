import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { api, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

describe('Igrejas', () => {
  test('missionário não pode cadastrar igreja', async () => {
    const missionario = await criarUsuario();
    await api()
      .post('/api/igrejas')
      .set(missionario.auth)
      .send({ nome: 'Igreja Nova', cidade: 'São Luís', bairro: 'Cohatrac' })
      .expect(403);
  });

  test('líder cadastra igreja e passa a ser membro dela', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider, { telefone: '(98) 3222-1111', email: 'CONTATO@Igreja.com' });

    assert.equal(igreja.criado_por, lider.usuario.id);
    assert.equal(igreja.email, 'contato@igreja.com');
    assert.equal(igreja.total_membros, 1);
    assert.equal(igreja.pode_editar, true);

    const eu = await api().get('/api/auth/eu').set(lider.auth).expect(200);
    assert.equal(eu.body.igreja_id, igreja.id);
    assert.equal(eu.body.igreja_nome, igreja.nome);
  });

  test('lista de opções é pública (usada na tela de cadastro)', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider, { nome: 'Igreja Opção Pública' });

    const resposta = await api().get('/api/igrejas/opcoes').expect(200);
    const opcao = resposta.body.find((item) => item.id === igreja.id);
    assert.deepEqual(Object.keys(opcao).sort(), ['bairro', 'id', 'nome']);
  });

  test('a listagem completa exige login e aceita busca', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const nomeUnico = `Igreja Busca ${Date.now()}`;
    await criarIgreja(lider, { nome: nomeUnico });

    await api().get('/api/igrejas').expect(401);
    const resposta = await api().get('/api/igrejas').query({ busca: nomeUnico }).set(lider.auth).expect(200);
    assert.equal(resposta.body.length, 1);
    assert.equal(resposta.body[0].nome, nomeUnico);
  });

  test('só criador, líder da igreja ou admin podem editar', async () => {
    const criador = await criarUsuario({ papel: 'lider' });
    const outroLider = await criarUsuario({ papel: 'lider' });
    const admin = await criarUsuario({ papel: 'admin' });
    const igreja = await criarIgreja(criador);
    const dados = { nome: 'Igreja Renomeada', cidade: 'São Luís', bairro: 'Planalto Anil III' };

    const vistaPeloOutro = await api().get(`/api/igrejas/${igreja.id}`).set(outroLider.auth).expect(200);
    assert.equal(vistaPeloOutro.body.pode_editar, false);

    await api().put(`/api/igrejas/${igreja.id}`).set(outroLider.auth).send(dados).expect(403);
    const editada = await api().put(`/api/igrejas/${igreja.id}`).set(criador.auth).send(dados).expect(200);
    assert.equal(editada.body.bairro, 'Planalto Anil III');
    await api()
      .put(`/api/igrejas/${igreja.id}`)
      .set(admin.auth)
      .send({ ...dados, nome: 'Igreja Editada pelo Admin' })
      .expect(200);
  });

  test('exclusão: só criador ou admin', async () => {
    const criador = await criarUsuario({ papel: 'lider' });
    const outro = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(criador);

    await api().delete(`/api/igrejas/${igreja.id}`).set(outro.auth).expect(403);
    await api().delete(`/api/igrejas/${igreja.id}`).set(criador.auth).expect(204);
    await api().get(`/api/igrejas/${igreja.id}`).set(criador.auth).expect(404);

    // O líder continua existindo, apenas sem igreja.
    const eu = await api().get('/api/auth/eu').set(criador.auth).expect(200);
    assert.equal(eu.body.igreja_id, null);
  });

  test('valida id e campos obrigatórios', async () => {
    const lider = await criarUsuario({ papel: 'lider' });

    await api().get('/api/igrejas/abc').set(lider.auth).expect(400);
    const resposta = await api().post('/api/igrejas').set(lider.auth).send({ nome: 'Igreja' }).expect(400);
    const campos = resposta.body.erro.detalhes.map((d) => d.campo);
    assert.ok(campos.includes('cidade'));
    assert.ok(campos.includes('bairro'));
  });
});
