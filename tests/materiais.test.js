import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { api, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

const material = {
  titulo: 'Apostila de discipulado',
  descricao: 'Material de apoio para novos convertidos.',
  tipo: 'pdf',
  url: 'https://exemplo.com/apostila.pdf',
  etapa: '3. Missões e evangelismo',
};

describe('Trilha de capacitação', () => {
  test('lista a trilha inicial em ordem de etapa, exigindo login', async () => {
    const pessoa = await criarUsuario();

    await api().get('/api/materiais').expect(401);
    const resposta = await api().get('/api/materiais').set(pessoa.auth).expect(200);

    assert.ok(resposta.body.length >= 12);
    assert.equal(resposta.body[0].titulo, 'Guia rápido do Projeto Missionário');
    const etapas = resposta.body.map((m) => m.etapa);
    assert.deepEqual(etapas, [...etapas].sort());
    // Materiais da curadoria inicial não têm autor: missionário não pode excluir.
    assert.equal(resposta.body[0].pode_excluir, false);
  });

  test('apenas líderes e admins adicionam materiais', async () => {
    const missionario = await criarUsuario();
    const lider = await criarUsuario({ papel: 'lider' });

    await api().post('/api/materiais').set(missionario.auth).send(material).expect(403);
    const criado = await api().post('/api/materiais').set(lider.auth).send(material).expect(201);

    assert.equal(criado.body.titulo, material.titulo);
    assert.equal(criado.body.ordem, 99);
    assert.equal(criado.body.criado_por_nome, lider.usuario.nome);
    assert.equal(criado.body.pode_excluir, true);
  });

  test('recusa links perigosos ou incompletos', async () => {
    const lider = await criarUsuario({ papel: 'lider' });

    for (const url of ['javascript:alert(1)', 'www.exemplo.com', 'ftp://exemplo.com/a.pdf']) {
      const resposta = await api().post('/api/materiais').set(lider.auth).send({ ...material, url }).expect(400);
      assert.equal(resposta.body.erro.detalhes[0].campo, 'url');
    }
  });

  test('autor ou admin excluem; outros não', async () => {
    const autor = await criarUsuario({ papel: 'lider' });
    const outro = await criarUsuario({ papel: 'lider' });
    const admin = await criarUsuario({ papel: 'admin' });
    const { body: criado } = await api().post('/api/materiais').set(autor.auth).send(material).expect(201);

    await api().delete(`/api/materiais/${criado.id}`).set(outro.auth).expect(403);
    await api().delete(`/api/materiais/${criado.id}`).set(autor.auth).expect(204);

    const { body: outroCriado } = await api().post('/api/materiais').set(autor.auth).send(material).expect(201);
    await api().delete(`/api/materiais/${outroCriado.id}`).set(admin.auth).expect(204);
    await api().delete(`/api/materiais/${outroCriado.id}`).set(admin.auth).expect(404);
  });
});
