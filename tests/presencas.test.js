import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { consultar } from '../src/config/database.js';
import { api, criarEvento, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

const presenca = (evento) => `/api/eventos/${evento.id}/presenca`;

describe('Confirmação de presença', () => {
  test('confirma e cancela a presença; repetir o pedido não duplica', async () => {
    const autor = await criarUsuario();
    const ana = await criarUsuario();
    const bruno = await criarUsuario();
    const evento = await criarEvento(autor, { data_inicio: '2031-03-08T19:00' });

    assert.equal(evento.total_presencas, 0);
    assert.equal(evento.confirmou, false);
    assert.equal(evento.encerrado, false);

    assert.deepEqual((await api().put(presenca(evento)).set(ana.auth).expect(200)).body, { total_presencas: 1, confirmou: true });
    assert.deepEqual((await api().put(presenca(evento)).set(ana.auth).expect(200)).body, { total_presencas: 1, confirmou: true });
    assert.equal((await api().put(presenca(evento)).set(bruno.auth).expect(200)).body.total_presencas, 2);

    assert.deepEqual((await api().delete(presenca(evento)).set(bruno.auth).expect(200)).body, { total_presencas: 1, confirmou: false });
    assert.deepEqual((await api().delete(presenca(evento)).set(bruno.auth).expect(200)).body, { total_presencas: 1, confirmou: false });
  });

  test('cada pessoa vê o total e se confirmou, no detalhe e na agenda', async () => {
    const autor = await criarUsuario();
    const pessoa = await criarUsuario();
    const evento = await criarEvento(autor, { titulo: 'Culto com presenças', data_inicio: '2032-02-20T19:00' });
    await api().put(presenca(evento)).set(pessoa.auth).expect(200);

    const { body: detalhe } = await api().get(`/api/eventos/${evento.id}`).set(pessoa.auth).expect(200);
    assert.equal(detalhe.total_presencas, 1);
    assert.equal(detalhe.confirmou, true);

    const { body: agenda } = await api()
      .get('/api/eventos')
      .query({ de: '2032-02-20', ate: '2032-02-20', criado_por: autor.usuario.id })
      .set(autor.auth)
      .expect(200);
    assert.equal(agenda[0].total_presencas, 1);
    assert.equal(agenda[0].confirmou, false);
  });

  test('lista quem vai, na ordem das confirmações, com a igreja de cada pessoa', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider, { nome: 'Igreja das Presenças' });
    const primeira = await criarUsuario({ nome: 'Primeira Confirmada', igreja_id: igreja.id });
    const segunda = await criarUsuario({ nome: 'Segunda Confirmada' });
    const evento = await criarEvento(lider, { data_inicio: '2031-04-01T09:00' });

    await api().put(presenca(evento)).set(segunda.auth).expect(200);
    await api().put(presenca(evento)).set(primeira.auth).expect(200);
    // Datas distintas para conferir a ordem (no mesmo segundo, o desempate seria pelo número da pessoa).
    await consultar('UPDATE eventos_presencas SET criado_em = NOW() - INTERVAL 1 HOUR WHERE evento_id = ? AND usuario_id = ?', [
      evento.id,
      segunda.usuario.id,
    ]);

    const { body: quem } = await api().get(`/api/eventos/${evento.id}/presencas`).set(lider.auth).expect(200);
    assert.deepEqual(
      quem.map((pessoa) => pessoa.nome),
      ['Segunda Confirmada', 'Primeira Confirmada'],
    );
    assert.equal(quem[1].igreja_id, igreja.id);
    assert.equal(quem[1].igreja_nome, 'Igreja das Presenças');
    assert.equal(quem[0].igreja_nome, null);
    assert.equal(quem[0].papel, 'missionario');
    assert.equal('email' in quem[0], false);
  });

  test('depois que o evento termina, a lista fica fechada; durante o evento ainda dá para confirmar', async () => {
    const autor = await criarUsuario();
    const pessoa = await criarUsuario();
    const passado = await criarEvento(autor, { data_inicio: '2020-01-10T19:00' });
    assert.equal(passado.encerrado, true);

    // Presença registrada antes de o evento acontecer.
    await consultar('INSERT INTO eventos_presencas (evento_id, usuario_id) VALUES (?, ?)', [passado.id, pessoa.usuario.id]);

    const { body: recusa } = await api().put(presenca(passado)).set(pessoa.auth).expect(409);
    assert.match(recusa.erro.mensagem, /já terminou/);
    await api().delete(presenca(passado)).set(pessoa.auth).expect(409);

    const { body: quem } = await api().get(`/api/eventos/${passado.id}/presencas`).set(autor.auth).expect(200);
    assert.deepEqual(
      quem.map((p) => p.id),
      [pessoa.usuario.id],
    );

    // Começou, mas ainda não terminou: o término é que conta.
    const emAndamento = await criarEvento(autor, { data_inicio: '2020-01-10T08:00', data_fim: '2099-12-31T18:00' });
    assert.equal(emAndamento.encerrado, false);
    await api().put(presenca(emAndamento)).set(pessoa.auth).expect(200);
  });

  test('responde 404 para evento que não existe e exige login', async () => {
    const pessoa = await criarUsuario();
    await api().put('/api/eventos/999999/presenca').set(pessoa.auth).expect(404);
    await api().delete('/api/eventos/999999/presenca').set(pessoa.auth).expect(404);
    await api().get('/api/eventos/999999/presencas').set(pessoa.auth).expect(404);
    await api().put('/api/eventos/1/presenca').expect(401);
    await api().get('/api/eventos/1/presencas').expect(401);
  });

  test('ao excluir o evento, as presenças dele também são excluídas', async () => {
    const autor = await criarUsuario();
    const pessoa = await criarUsuario();
    const evento = await criarEvento(autor, { data_inicio: '2031-05-05T10:00' });
    await api().put(presenca(evento)).set(pessoa.auth).expect(200);

    await api().delete(`/api/eventos/${evento.id}`).set(autor.auth).expect(204);
    const [{ total }] = await consultar('SELECT COUNT(*) AS total FROM eventos_presencas WHERE evento_id = ?', [evento.id]);
    assert.equal(total, 0);
  });
});
