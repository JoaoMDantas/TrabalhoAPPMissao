import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { consultar } from '../src/config/database.js';
import { api, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

const publicar = (pessoa, dados) => api().post('/api/mural').set(pessoa.auth).send(dados);

// Imagens mínimas: só o começo de um JPEG e de um PNG, o suficiente para identificar o tipo.
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(120, 7)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(120, 3)]);

// Lê o corpo binário da resposta como Buffer.
const comoBuffer = (resposta, pronto) => {
  const pedacos = [];
  resposta.on('data', (pedaco) => pedacos.push(pedaco));
  resposta.on('end', () => pronto(null, Buffer.concat(pedacos)));
};

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

  test('publica fotos com a mensagem e entrega cada foto por link assinado', async () => {
    const missionario = await criarUsuario();
    const { body: criada } = await api()
      .post('/api/mural')
      .set(missionario.auth)
      .field('conteudo', 'Fotos do mutirão de visitas')
      .attach('fotos', JPEG, 'foto1.jpg')
      .attach('fotos', PNG, 'foto2.png')
      .expect(201);

    assert.equal(criada.fotos.length, 2);
    assert.match(criada.fotos[0].url, /^\/api\/mural\/fotos\/\d+\?expira=\d+&assinatura=[\w-]+$/);

    // A foto abre sem o login no cabeçalho (como em <img>), desde que o link seja o assinado.
    const foto = await api().get(criada.fotos[0].url).buffer(true).parse(comoBuffer).expect(200);
    assert.equal(foto.headers['content-type'], 'image/jpeg');
    assert.ok(foto.body.equals(JPEG));
    assert.equal((await api().get(criada.fotos[1].url).expect(200)).headers['content-type'], 'image/png');

    const adulterado = criada.fotos[0].url.replace(/assinatura=[\w-]+/, 'assinatura=assinaturafalsa123');
    await api().get(adulterado).expect(403);
    const outraFoto = criada.fotos[0].url.replace(/fotos\/\d+/, `fotos/${criada.fotos[1].id}`);
    await api().get(outraFoto).expect(403);
    await api().get(`/api/mural/fotos/${criada.fotos[0].id}`).expect(400);

    const { body: lista } = await api().get('/api/mural').set(missionario.auth).expect(200);
    assert.equal(lista.find((m) => m.id === criada.id).fotos.length, 2);

    // Excluir a mensagem apaga as fotos.
    await api().delete(`/api/mural/${criada.id}`).set(missionario.auth).expect(204);
    await api().get(criada.fotos[0].url).expect(404);
  });

  test('aceita mensagem só com foto; recusa sem texto e sem foto, arquivo que não é imagem e mais de 4 fotos', async () => {
    const missionario = await criarUsuario();

    const { body: soFoto } = await api().post('/api/mural').set(missionario.auth).attach('fotos', JPEG, 'a.jpg').expect(201);
    assert.equal(soFoto.conteudo, '');
    assert.equal(soFoto.fotos.length, 1);

    const vazia = await api().post('/api/mural').set(missionario.auth).field('conteudo', '   ').expect(400);
    assert.equal(vazia.body.erro.mensagem, 'Escreva uma mensagem ou adicione uma foto.');

    const naoImagem = await api()
      .post('/api/mural')
      .set(missionario.auth)
      .field('conteudo', 'teste')
      .attach('fotos', Buffer.from('<svg onload="alert(1)"></svg>'), 'foto.jpg')
      .expect(400);
    assert.equal(naoImagem.body.erro.mensagem, 'As fotos precisam ser imagens JPG, PNG ou WebP.');

    const requisicao = api().post('/api/mural').set(missionario.auth).field('conteudo', 'muitas');
    for (let i = 0; i < 5; i += 1) requisicao.attach('fotos', JPEG, `f${i}.jpg`);
    const muitas = await requisicao.expect(400);
    assert.equal(muitas.body.erro.mensagem, 'Envie no máximo 4 fotos.');
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
