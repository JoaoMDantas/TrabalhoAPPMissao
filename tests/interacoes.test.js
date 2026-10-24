import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { consultar } from '../src/config/database.js';
import { api, criarEvento, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

async function publicar(autor, extras = {}) {
  const resposta = await api().post('/api/mural').set(autor.auth).send({ conteudo: 'Mensagem de teste', ...extras }).expect(201);
  return resposta.body;
}

const comentar = (pessoa, caminho, conteudo) => api().post(`${caminho}/comentarios`).set(pessoa.auth).send({ conteudo });

describe('Curtidas', () => {
  test('curte e descurte uma mensagem; repetir o pedido não duplica', async () => {
    const autor = await criarUsuario();
    const ana = await criarUsuario({ nome: 'Ana Curtidora' });
    const bruno = await criarUsuario();
    const mensagem = await publicar(autor);
    const caminho = `/api/mural/${mensagem.id}/curtida`;

    assert.equal(mensagem.total_curtidas, 0);
    assert.equal(mensagem.curtiu, false);
    assert.equal(mensagem.total_comentarios, 0);

    assert.deepEqual((await api().put(caminho).set(ana.auth).expect(200)).body, { total_curtidas: 1, curtiu: true });
    assert.deepEqual((await api().put(caminho).set(ana.auth).expect(200)).body, { total_curtidas: 1, curtiu: true });
    assert.equal((await api().put(caminho).set(bruno.auth).expect(200)).body.total_curtidas, 2);

    // Cada pessoa vê o total e se ela mesma curtiu.
    const doMural = async (pessoa) =>
      (await api().get('/api/mural').set(pessoa.auth).expect(200)).body.find((m) => m.id === mensagem.id);
    assert.equal((await doMural(ana)).total_curtidas, 2);
    assert.equal((await doMural(ana)).curtiu, true);
    assert.equal((await doMural(autor)).curtiu, false);

    const { body: quem } = await api().get(`/api/mural/${mensagem.id}/curtidas`).set(autor.auth).expect(200);
    assert.deepEqual(quem.map((pessoa) => pessoa.id).sort(), [ana.usuario.id, bruno.usuario.id].sort());
    assert.ok(quem.some((pessoa) => pessoa.nome === 'Ana Curtidora'));

    assert.deepEqual((await api().delete(caminho).set(ana.auth).expect(200)).body, { total_curtidas: 1, curtiu: false });
    assert.deepEqual((await api().delete(caminho).set(ana.auth).expect(200)).body, { total_curtidas: 1, curtiu: false });
  });

  test('curte um evento e o total aparece na agenda e no detalhe', async () => {
    const autor = await criarUsuario();
    const pessoa = await criarUsuario();
    const evento = await criarEvento(autor, { titulo: 'Culto com curtidas', data_inicio: '2032-01-15T19:00' });

    assert.equal(evento.total_curtidas, 0);
    await api().put(`/api/eventos/${evento.id}/curtida`).set(pessoa.auth).expect(200);

    const { body: detalhe } = await api().get(`/api/eventos/${evento.id}`).set(pessoa.auth).expect(200);
    assert.equal(detalhe.total_curtidas, 1);
    assert.equal(detalhe.curtiu, true);

    const { body: agenda } = await api()
      .get('/api/eventos')
      .query({ de: '2032-01-15', ate: '2032-01-15', criado_por: autor.usuario.id })
      .set(autor.auth)
      .expect(200);
    assert.equal(agenda[0].total_curtidas, 1);
    assert.equal(agenda[0].curtiu, false);
  });

  test('responde 404 para mensagem ou evento que não existe e exige login', async () => {
    const pessoa = await criarUsuario();
    await api().put('/api/mural/999999/curtida').set(pessoa.auth).expect(404);
    await api().put('/api/eventos/999999/curtida').set(pessoa.auth).expect(404);
    await api().get('/api/mural/999999/comentarios').set(pessoa.auth).expect(404);
    await api().put('/api/mural/1/curtida').expect(401);
  });
});

describe('Comentários', () => {
  test('comenta, lista na ordem da conversa e atualiza o total', async () => {
    const autor = await criarUsuario();
    const pessoa = await criarUsuario({ nome: 'Carla Comentarista' });
    const mensagem = await publicar(autor);
    const caminho = `/api/mural/${mensagem.id}`;

    const { body: primeiro } = await comentar(pessoa, caminho, '  Amém! Estarei orando.  ').expect(201);
    assert.equal(primeiro.conteudo, 'Amém! Estarei orando.');
    assert.equal(primeiro.autor_nome, 'Carla Comentarista');
    assert.equal(primeiro.pode_excluir, true);
    await comentar(autor, caminho, 'Obrigado, irmã!').expect(201);

    const { body: lista } = await api().get(`${caminho}/comentarios`).set(pessoa.auth).expect(200);
    assert.deepEqual(
      lista.map((comentario) => comentario.conteudo),
      ['Amém! Estarei orando.', 'Obrigado, irmã!'],
    );
    // Para a Carla: pode apagar o próprio comentário, mas não o do autor da mensagem.
    assert.deepEqual(
      lista.map((comentario) => comentario.pode_excluir),
      [true, false],
    );

    const { body: mural } = await api().get('/api/mural').set(pessoa.auth).expect(200);
    assert.equal(mural.find((m) => m.id === mensagem.id).total_comentarios, 2);
  });

  test('recusa comentário vazio ou longo demais', async () => {
    const pessoa = await criarUsuario();
    const mensagem = await publicar(pessoa);
    const caminho = `/api/mural/${mensagem.id}`;

    const vazio = await comentar(pessoa, caminho, '   ').expect(400);
    assert.equal(vazio.body.erro.mensagem, 'Escreva o comentário.');
    const longo = await comentar(pessoa, caminho, 'a'.repeat(501)).expect(400);
    assert.equal(longo.body.erro.mensagem, 'O comentário pode ter no máximo 500 caracteres.');
    await api().post(`${caminho}/comentarios`).set(pessoa.auth).send({}).expect(400);
  });

  test('apagam o comentário: quem escreveu, o autor da mensagem, a liderança da igreja e o admin', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const igreja = await criarIgreja(lider);
    await consultar('UPDATE usuarios SET igreja_id = ? WHERE id = ?', [igreja.id, lider.usuario.id]);
    const autor = await criarUsuario();
    const quemComenta = await criarUsuario();
    const outro = await criarUsuario();
    const admin = await criarUsuario({ papel: 'admin' });
    const mensagem = await publicar(autor, { igreja_id: igreja.id });
    const caminho = `/api/mural/${mensagem.id}/comentarios`;

    const novoComentario = async () => (await comentar(quemComenta, `/api/mural/${mensagem.id}`, 'Comentário').expect(201)).body;

    const c1 = await novoComentario();
    await api().delete(`${caminho}/${c1.id}`).set(outro.auth).expect(403);
    await api().delete(`${caminho}/${c1.id}`).set(quemComenta.auth).expect(204);
    await api().delete(`${caminho}/${c1.id}`).set(quemComenta.auth).expect(404);

    for (const moderador of [autor, lider, admin]) {
      const comentario = await novoComentario();
      const { body: visto } = await api().get(caminho).set(moderador.auth).expect(200);
      assert.equal(visto.find((c) => c.id === comentario.id).pode_excluir, true);
      await api().delete(`${caminho}/${comentario.id}`).set(moderador.auth).expect(204);
    }
  });

  test('não apaga pelo endereço de outra mensagem', async () => {
    const pessoa = await criarUsuario();
    const mensagem = await publicar(pessoa);
    const outraMensagem = await publicar(pessoa);
    const { body: comentario } = await comentar(pessoa, `/api/mural/${mensagem.id}`, 'Comentário').expect(201);

    await api().delete(`/api/mural/${outraMensagem.id}/comentarios/${comentario.id}`).set(pessoa.auth).expect(404);
    await api().delete(`/api/eventos/${mensagem.id}/comentarios/${comentario.id}`).set(pessoa.auth).expect(404);
    await api().delete(`/api/mural/${mensagem.id}/comentarios/${comentario.id}`).set(pessoa.auth).expect(204);
  });

  test('comenta em evento; o organizador modera os comentários do evento', async () => {
    const organizador = await criarUsuario();
    const pessoa = await criarUsuario();
    const evento = await criarEvento(organizador);
    const caminho = `/api/eventos/${evento.id}`;

    const { body: comentario } = await comentar(pessoa, caminho, 'Posso levar o violão?').expect(201);
    const { body: detalhe } = await api().get(caminho).set(organizador.auth).expect(200);
    assert.equal(detalhe.total_comentarios, 1);

    await api().delete(`${caminho}/comentarios/${comentario.id}`).set(organizador.auth).expect(204);
    assert.deepEqual((await api().get(`${caminho}/comentarios`).set(pessoa.auth).expect(200)).body, []);
  });
});

describe('Exclusão do item', () => {
  test('excluir a mensagem ou o evento apaga as curtidas e os comentários deles', async () => {
    const autor = await criarUsuario();
    const pessoa = await criarUsuario();
    const mensagem = await publicar(autor);
    const evento = await criarEvento(autor);

    for (const caminho of [`/api/mural/${mensagem.id}`, `/api/eventos/${evento.id}`]) {
      await api().put(`${caminho}/curtida`).set(pessoa.auth).expect(200);
      await comentar(pessoa, caminho, 'Comentário que vai sumir').expect(201);
      await api().delete(caminho).set(autor.auth).expect(204);
    }

    const [{ total: restantes }] = await consultar(
      `SELECT (SELECT COUNT(*) FROM mensagens_curtidas WHERE mensagem_id = ?)
            + (SELECT COUNT(*) FROM mensagens_comentarios WHERE mensagem_id = ?)
            + (SELECT COUNT(*) FROM eventos_curtidas WHERE evento_id = ?)
            + (SELECT COUNT(*) FROM eventos_comentarios WHERE evento_id = ?) AS total`,
      [mensagem.id, mensagem.id, evento.id, evento.id],
    );
    assert.equal(Number(restantes), 0);
  });
});
