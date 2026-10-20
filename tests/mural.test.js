import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { consultar } from '../src/config/database.js';
import { api, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

const publicar = (pessoa, dados) => api().post('/api/mural').set(pessoa.auth).send(dados);

describe('Mural', () => {
  test('missionário publica mensagem e pode excluí-la', async () => {
    const missionario = await criarUsuario();
    const resposta = await publicar(missionario, { conteudo: '  Visitei três famílias hoje.  ' }).expect(201);

    assert.equal(resposta.body.conteudo, 'Visitei três famílias hoje.');
    assert.equal(resposta.body.tipo, 'mensagem');
    assert.equal(resposta.body.autor_nome, missionario.usuario.nome);
    assert.equal(resposta.body.pode_excluir, true);
  });

  test('apenas líderes e admins publicam avisos', async () => {
    const missionario = await criarUsuario();
    const lider = await criarUsuario({ papel: 'lider' });

    await publicar(missionario, { conteudo: 'Aviso importante', tipo: 'aviso' }).expect(403);
    const aviso = await publicar(lider, { conteudo: 'Aviso importante', tipo: 'aviso' }).expect(201);
    assert.equal(aviso.body.tipo, 'aviso');
  });

  test('recusa mensagem vazia ou longa demais', async () => {
    const missionario = await criarUsuario();
    await publicar(missionario, { conteudo: '   ' }).expect(400);
    await publicar(missionario, { conteudo: 'a'.repeat(1001) }).expect(400);
  });

  test('lista da mais nova para a mais antiga com paginação', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider);
    for (const conteudo of ['primeira', 'segunda', 'terceira']) {
      await publicar(lider, { conteudo, igreja_id: igreja.id }).expect(201);
    }

    const pagina1 = await api().get('/api/mural').query({ igreja_id: igreja.id, limite: 2 }).set(lider.auth).expect(200);
    assert.deepEqual(
      pagina1.body.map((m) => m.conteudo),
      ['terceira', 'segunda'],
    );

    const pagina2 = await api()
      .get('/api/mural')
      .query({ igreja_id: igreja.id, limite: 2, antes_de: pagina1.body.at(-1).id })
      .set(lider.auth)
      .expect(200);
    assert.deepEqual(
      pagina2.body.map((m) => m.conteudo),
      ['primeira'],
    );
  });

  test('ordena pela data de publicação, mesmo quando o cadastro no banco foi feito fora de ordem', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider);
    for (const conteudo of ['de hoje', 'de agora']) {
      await publicar(lider, { conteudo, igreja_id: igreja.id }).expect(201);
    }
    // Registrada por último, mas com data de dez dias atrás (ex.: inserida direto no banco).
    const { body: antiga } = await publicar(lider, { conteudo: 'de dez dias atrás', igreja_id: igreja.id }).expect(201);
    await consultar('UPDATE mensagens SET criado_em = NOW() - INTERVAL 10 DAY WHERE id = ?', [antiga.id]);

    const pagina1 = await api().get('/api/mural').query({ igreja_id: igreja.id, limite: 2 }).set(lider.auth).expect(200);
    assert.deepEqual(
      pagina1.body.map((m) => m.conteudo),
      ['de agora', 'de hoje'],
    );

    const pagina2 = await api()
      .get('/api/mural')
      .query({ igreja_id: igreja.id, limite: 2, antes_de: pagina1.body.at(-1).id })
      .set(lider.auth)
      .expect(200);
    assert.deepEqual(
      pagina2.body.map((m) => m.conteudo),
      ['de dez dias atrás'],
    );
  });

  test('outra pessoa não exclui mensagem alheia', async () => {
    const autor = await criarUsuario();
    const outro = await criarUsuario();
    const { body: mensagem } = await publicar(autor, { conteudo: 'Minha mensagem' }).expect(201);

    await api().delete(`/api/mural/${mensagem.id}`).set(outro.auth).expect(403);
    await api().delete(`/api/mural/${mensagem.id}`).set(autor.auth).expect(204);
    await api().delete(`/api/mural/${mensagem.id}`).set(autor.auth).expect(404);
  });
});
