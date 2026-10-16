import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { api, criarEvento, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

describe('Agenda de eventos', () => {
  test('cria evento e normaliza a data do campo datetime-local', async () => {
    const autor = await criarUsuario();
    const evento = await criarEvento(autor, { data_inicio: '2030-05-10T19:30', local: 'Praça do Cohatrac' });

    assert.equal(evento.data_inicio, '2030-05-10 19:30:00');
    assert.equal(evento.criado_por, autor.usuario.id);
    assert.equal(evento.criado_por_nome, autor.usuario.nome);
    assert.equal(evento.pode_editar, true);
  });

  test('recusa data inexistente e término antes do início', async () => {
    const autor = await criarUsuario();
    const base = { titulo: 'Evento inválido', tipo: 'culto' };

    const dataInexistente = await api()
      .post('/api/eventos')
      .set(autor.auth)
      .send({ ...base, data_inicio: '2030-02-31T10:00' })
      .expect(400);
    assert.equal(dataInexistente.body.erro.detalhes[0].campo, 'data_inicio');

    const terminoAntes = await api()
      .post('/api/eventos')
      .set(autor.auth)
      .send({ ...base, data_inicio: '2030-05-10T10:00', data_fim: '2030-05-10T09:00' })
      .expect(400);
    assert.equal(terminoAntes.body.erro.detalhes[0].campo, 'data_fim');
  });

  test('recusa igreja inexistente', async () => {
    const autor = await criarUsuario();
    await api()
      .post('/api/eventos')
      .set(autor.auth)
      .send({ titulo: 'Evento', tipo: 'culto', data_inicio: '2030-05-10T10:00', igreja_id: 999999 })
      .expect(400);
  });

  test('filtra por período, incluindo o dia inteiro da data final', async () => {
    const autor = await criarUsuario();
    await criarEvento(autor, { titulo: 'Antes', data_inicio: '2031-03-31T23:00' });
    await criarEvento(autor, { titulo: 'Primeiro dia', data_inicio: '2031-04-01T08:00' });
    await criarEvento(autor, { titulo: 'Último dia à noite', data_inicio: '2031-04-30T22:00' });
    await criarEvento(autor, { titulo: 'Depois', data_inicio: '2031-05-01T00:00' });

    const resposta = await api()
      .get('/api/eventos')
      .query({ de: '2031-04-01', ate: '2031-04-30', criado_por: autor.usuario.id })
      .set(autor.auth)
      .expect(200);

    assert.deepEqual(
      resposta.body.map((e) => e.titulo),
      ['Primeiro dia', 'Último dia à noite'],
    );
  });

  test('só autor, líder da igreja do evento ou admin podem alterar', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider);
    const autor = await criarUsuario({ igreja_id: igreja.id });
    const outro = await criarUsuario();
    const admin = await criarUsuario({ papel: 'admin' });
    const evento = await criarEvento(autor, { igreja_id: igreja.id });
    const dados = { titulo: 'Título alterado', tipo: 'culto', data_inicio: '2030-06-01T19:00', igreja_id: igreja.id };

    const vistoPeloOutro = await api().get(`/api/eventos/${evento.id}`).set(outro.auth).expect(200);
    assert.equal(vistoPeloOutro.body.pode_editar, false);

    await api().put(`/api/eventos/${evento.id}`).set(outro.auth).send(dados).expect(403);
    await api().delete(`/api/eventos/${evento.id}`).set(outro.auth).expect(403);

    const alteradoPeloLider = await api().put(`/api/eventos/${evento.id}`).set(lider.auth).send(dados).expect(200);
    assert.equal(alteradoPeloLider.body.titulo, 'Título alterado');
    await api()
      .put(`/api/eventos/${evento.id}`)
      .set(admin.auth)
      .send({ ...dados, titulo: 'Alterado pelo admin' })
      .expect(200);

    await api().delete(`/api/eventos/${evento.id}`).set(autor.auth).expect(204);
    await api().get(`/api/eventos/${evento.id}`).set(autor.auth).expect(404);
  });
});
