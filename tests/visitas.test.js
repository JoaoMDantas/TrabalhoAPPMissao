import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { api, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

const visita = {
  tipo: 'evangelismo',
  situacao: 'retornar',
  data_visita: '2026-10-15',
  latitude: '-2.538856',
  longitude: '-44.202113',
  pessoas_alcancadas: '4',
  observacoes: 'Família receptiva; pediram oração e uma nova visita no sábado.',
};

const registrar = (pessoa, dados = {}) => api().post('/api/visitas').set(pessoa.auth).send({ ...visita, ...dados });

describe('Mapa de visitas', () => {
  test('missionário registra uma visita no mapa, exigindo login', async () => {
    const missionario = await criarUsuario();

    await api().post('/api/visitas').send(visita).expect(401);
    const { body: criada } = await registrar(missionario).expect(201);

    assert.equal(criada.tipo, 'evangelismo');
    assert.equal(criada.situacao, 'retornar');
    assert.equal(criada.data_visita, '2026-10-15');
    assert.equal(criada.latitude, -2.538856);
    assert.equal(criada.longitude, -44.202113);
    assert.equal(criada.pessoas_alcancadas, 4);
    assert.equal(criada.criado_por_nome, missionario.usuario.nome);
    assert.equal(criada.pode_editar, true);

    const { body: lista } = await api().get('/api/visitas').set(missionario.auth).expect(200);
    assert.ok(lista.some((v) => v.id === criada.id));
  });

  test('exige o local no mapa e recusa data futura e números inválidos', async () => {
    const missionario = await criarUsuario();

    const semLocal = await registrar(missionario, { latitude: '', longitude: '' }).expect(400);
    assert.deepEqual(
      semLocal.body.erro.detalhes.map((d) => d.campo).sort(),
      ['latitude', 'longitude'],
    );
    assert.equal(semLocal.body.erro.mensagem, 'Marque o local no mapa.');

    const futura = await registrar(missionario, { data_visita: '2099-01-01' }).expect(400);
    assert.equal(futura.body.erro.mensagem, 'A data da visita não pode ser no futuro.');

    await registrar(missionario, { data_visita: '2026-02-30' }).expect(400);
    await registrar(missionario, { pessoas_alcancadas: '-1' }).expect(400);
    await registrar(missionario, { pessoas_alcancadas: '2.5' }).expect(400);
    await registrar(missionario, { situacao: 'aceitou' }).expect(400);
    await registrar(missionario, { igreja_id: 999999 }).expect(400);

    // Campos opcionais em branco viram nulos.
    const { body: simples } = await registrar(missionario, { pessoas_alcancadas: '', observacoes: '' }).expect(201);
    assert.equal(simples.pessoas_alcancadas, null);
    assert.equal(simples.observacoes, null);
  });

  test('filtra por situação, igreja e período', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider);
    await registrar(lider, { igreja_id: igreja.id, situacao: 'realizada', data_visita: '2026-09-01' }).expect(201);
    await registrar(lider, { igreja_id: igreja.id, situacao: 'retornar', data_visita: '2026-10-10' }).expect(201);
    await registrar(lider, { igreja_id: igreja.id, situacao: 'ausente', data_visita: '2026-10-12' }).expect(201);

    const consultar = (filtros) =>
      api().get('/api/visitas').query({ igreja_id: igreja.id, ...filtros }).set(lider.auth).expect(200);

    assert.equal((await consultar({})).body.length, 3);
    assert.deepEqual((await consultar({ situacao: 'retornar' })).body.map((v) => v.situacao), ['retornar']);
    // Mais recentes primeiro; o período inclui os dois dias informados.
    assert.deepEqual(
      (await consultar({ de: '2026-10-01', ate: '2026-10-12' })).body.map((v) => v.data_visita),
      ['2026-10-12', '2026-10-10'],
    );
    await api().get('/api/visitas').query({ situacao: 'qualquer' }).set(lider.auth).expect(400);
  });

  test('só quem registrou, a liderança da igreja ou o admin alteram a visita', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider);
    const autor = await criarUsuario();
    const outro = await criarUsuario();
    const admin = await criarUsuario({ papel: 'admin' });
    const { body: criada } = await registrar(autor, { igreja_id: igreja.id }).expect(201);

    const { body: vistaPorOutro } = await api().get(`/api/visitas/${criada.id}`).set(outro.auth).expect(200);
    assert.equal(vistaPorOutro.pode_editar, false);
    await api().put(`/api/visitas/${criada.id}`).set(outro.auth).send({ ...visita, situacao: 'realizada' }).expect(403);
    await api().delete(`/api/visitas/${criada.id}`).set(outro.auth).expect(403);

    const { body: editada } = await api()
      .put(`/api/visitas/${criada.id}`)
      .set(lider.auth)
      .send({ ...visita, igreja_id: igreja.id, situacao: 'realizada' })
      .expect(200);
    assert.equal(editada.situacao, 'realizada');

    await api().delete(`/api/visitas/${criada.id}`).set(admin.auth).expect(204);
    await api().get(`/api/visitas/${criada.id}`).set(autor.auth).expect(404);
  });

  test('atalho ajusta só o local da visita, que não pode ficar vazio', async () => {
    const autor = await criarUsuario();
    const outro = await criarUsuario();
    const { body: criada } = await registrar(autor).expect(201);
    const ajustar = (pessoa, dados) => api().patch(`/api/visitas/${criada.id}/localizacao`).set(pessoa.auth).send(dados);

    const { body: ajustada } = await ajustar(autor, { latitude: '-2.5401', longitude: '-44.2101' }).expect(200);
    assert.equal(ajustada.latitude, -2.5401);
    assert.equal(ajustada.situacao, 'retornar', 'os outros dados continuam iguais');

    await ajustar(outro, { latitude: -2.5, longitude: -44.2 }).expect(403);
    const vazio = await ajustar(autor, { latitude: '', longitude: '' }).expect(400);
    assert.equal(vazio.body.erro.mensagem, 'Marque o local no mapa.');
  });
});
