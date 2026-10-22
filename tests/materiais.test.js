import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { linkDeDownload, nomeDoArquivo } from '../src/modules/materiais/materiais.service.js';
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

    assert.ok(resposta.body.length >= 14);
    assert.equal(resposta.body[0].titulo, 'Guia rápido do Projeto Missionário');
    // A trilha é focada em missões e evangelismo; as cartilhas de segurança digital saíram (migration 007).
    assert.equal(resposta.body.filter((m) => m.url.includes('cert.br')).length, 0);
    assert.ok(resposta.body.some((m) => m.etapa === '3. Campanha de Missões Nacionais 2026'));
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

// Lê o corpo binário da resposta (o PDF) como Buffer.
const comoBuffer = (resposta, pronto) => {
  const pedacos = [];
  resposta.on('data', (pedaco) => pedacos.push(pedaco));
  resposta.on('end', () => pronto(null, Buffer.concat(pedacos)));
};

describe('Leitura de PDF no aplicativo', () => {
  test('entrega o PDF do guia rápido para o leitor, exigindo login', async () => {
    const pessoa = await criarUsuario();
    const { body: materiais } = await api().get('/api/materiais').set(pessoa.auth).expect(200);
    const guia = materiais.find((m) => m.url === '/materiais/guia-rapido.pdf');

    const { body: detalhe } = await api().get(`/api/materiais/${guia.id}`).set(pessoa.auth).expect(200);
    assert.equal(detalhe.titulo, guia.titulo);

    await api().get(`/api/materiais/${guia.id}/arquivo`).expect(401);
    const resposta = await api()
      .get(`/api/materiais/${guia.id}/arquivo`)
      .set(pessoa.auth)
      .buffer(true)
      .parse(comoBuffer)
      .expect(200);

    assert.equal(resposta.headers['content-type'], 'application/pdf');
    assert.match(resposta.headers['content-disposition'], /filename="guia-rapido-do-projeto-missionario\.pdf"/);
    assert.match(resposta.headers['cache-control'], /max-age/);
    assert.equal(resposta.body.subarray(0, 5).toString(), '%PDF-');
  });

  test('recusa material inexistente ou que não é PDF', async () => {
    const pessoa = await criarUsuario();
    const { body: materiais } = await api().get('/api/materiais').set(pessoa.auth).expect(200);
    const video = materiais.find((m) => m.tipo === 'video');

    await api().get('/api/materiais/999999').set(pessoa.auth).expect(404);
    await api().get('/api/materiais/999999/arquivo').set(pessoa.auth).expect(404);
    const resposta = await api().get(`/api/materiais/${video.id}/arquivo`).set(pessoa.auth).expect(400);
    assert.equal(resposta.body.erro.mensagem, 'Este material não é um PDF.');
  });

  test('não busca arquivos na rede interna do servidor (proteção contra SSRF)', async () => {
    const lider = await criarUsuario({ papel: 'lider' });
    const enderecos = [
      'https://127.0.0.1/arquivo.pdf',
      'https://localhost/arquivo.pdf',
      'https://169.254.169.254/latest/meta-data.pdf',
      'https://[::1]/arquivo.pdf',
      'https://exemplo.com:8443/arquivo.pdf',
      'http://exemplo.com/arquivo.pdf',
    ];
    for (const url of enderecos) {
      const { body: criado } = await api().post('/api/materiais').set(lider.auth).send({ ...material, url }).expect(201);
      const resposta = await api().get(`/api/materiais/${criado.id}/arquivo`).set(lider.auth).expect(400);
      assert.match(resposta.body.erro.mensagem, /não é permitido|https/, url);
    }
  });

  test('converte links do Google Drive e gera nomes de arquivo seguros', () => {
    assert.equal(
      linkDeDownload('https://drive.google.com/file/d/1KdyJxkJlR_pSPbiE3QDbrwjiPWyIArr9/view'),
      'https://drive.google.com/uc?export=download&id=1KdyJxkJlR_pSPbiE3QDbrwjiPWyIArr9',
    );
    assert.equal(linkDeDownload('https://exemplo.com/a.pdf'), 'https://exemplo.com/a.pdf');
    assert.equal(nomeDoArquivo('Revista Evangelização 01: "A seleção"'), 'revista-evangelizacao-01-a-selecao.pdf');
    assert.equal(nomeDoArquivo('???'), 'material.pdf');
  });
});
