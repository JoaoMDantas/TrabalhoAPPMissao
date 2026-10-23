import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { api, criarIgreja, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

const PDF = Buffer.from('%PDF-1.4\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF\n');
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(60)]);

// Lê o corpo binário da resposta como Buffer.
const comoBuffer = (resposta, pronto) => {
  const pedacos = [];
  resposta.on('data', (pedaco) => pedacos.push(pedaco));
  resposta.on('end', () => pronto(null, Buffer.concat(pedacos)));
};

function enviar(pessoa, { arquivo = PDF, nome = 'Escala de louvor.pdf', titulo = 'Escala de louvor', campos = {} } = {}) {
  const requisicao = api().post('/api/documentos').set(pessoa.auth).field('titulo', titulo);
  for (const [campo, valor] of Object.entries(campos)) requisicao.field(campo, String(valor));
  return arquivo ? requisicao.attach('arquivo', arquivo, nome) : requisicao;
}

async function igrejaComMembros() {
  const lider = await criarUsuario({ papel: 'lider' });
  const igreja = await criarIgreja(lider);
  const membro = await criarUsuario({ igreja_id: igreja.id });
  return { lider, igreja, membro };
}

describe('Documentos da igreja', () => {
  test('liderança adiciona documento e só quem é da igreja vê', async () => {
    const { lider, igreja, membro } = await igrejaComMembros();
    const deFora = await criarUsuario();
    const outra = await igrejaComMembros();

    const { body: documento } = await enviar(lider, { nome: 'Calendário de missões.pdf', titulo: 'Calendário 2026' }).expect(201);
    assert.equal(documento.nome_arquivo, 'Calendário de missões.pdf');
    assert.equal(documento.tipo_mime, 'application/pdf');
    assert.equal(documento.grupo, 'pdf');
    assert.equal(documento.tamanho, PDF.length);
    assert.equal(documento.igreja_id, igreja.id);
    assert.equal(documento.pode_excluir, true);
    assert.equal(documento.conteudo, undefined, 'a listagem não carrega o arquivo');

    const { body: lista } = await api().get('/api/documentos').set(membro.auth).expect(200);
    assert.deepEqual(lista.map((d) => d.id), [documento.id]);
    assert.equal(lista[0].pode_excluir, false);

    const arquivo = await api()
      .get(`/api/documentos/${documento.id}/arquivo`)
      .set(membro.auth)
      .buffer(true)
      .parse(comoBuffer)
      .expect(200);
    assert.equal(arquivo.headers['content-type'], 'application/pdf');
    assert.match(arquivo.headers['content-disposition'], /^inline; filename="Calendario de missoes\.pdf"; filename\*=UTF-8''Calend%C3%A1rio/);
    assert.match(arquivo.headers['cache-control'], /no-store/);
    assert.ok(arquivo.body.equals(PDF));

    // Para quem não é da igreja, o documento não existe.
    const semIgreja = await api().get('/api/documentos').set(deFora.auth).expect(400);
    assert.match(semIgreja.body.erro.mensagem, /ainda não faz parte de uma igreja/);
    await api().get(`/api/documentos/${documento.id}`).set(deFora.auth).expect(404);
    await api().get(`/api/documentos/${documento.id}/arquivo`).set(outra.membro.auth).expect(404);
    const { body: listaOutra } = await api().get('/api/documentos').set(outra.membro.auth).expect(200);
    assert.equal(listaOutra.length, 0);
  });

  test('só a liderança envia, e só arquivos aceitos', async () => {
    const { lider, membro } = await igrejaComMembros();

    await enviar(membro).expect(403);
    const falso = await enviar(lider, { arquivo: Buffer.from('<html><script>alert(1)</script></html>'), nome: 'falso.pdf' }).expect(400);
    assert.match(falso.body.erro.mensagem, /Tipo de arquivo não aceito/);
    const semArquivo = await enviar(lider, { arquivo: null }).expect(400);
    assert.equal(semArquivo.body.erro.mensagem, 'Escolha o arquivo do documento.');
    const semTitulo = await enviar(lider, { titulo: '' }).expect(400);
    assert.equal(semTitulo.body.erro.detalhes[0].campo, 'titulo');

    const grande = Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]);
    const muitoGrande = await enviar(lider, { arquivo: grande }).expect(413);
    assert.equal(muitoGrande.body.erro.mensagem, 'Cada arquivo pode ter no máximo 10 MB.');

    const dois = await api()
      .post('/api/documentos')
      .set(lider.auth)
      .field('titulo', 'Dois arquivos')
      .attach('arquivo', PDF, 'a.pdf')
      .attach('arquivo', PDF, 'b.pdf')
      .expect(400);
    assert.equal(dois.body.erro.mensagem, 'Envie um arquivo por vez.');

    // Arquivos do Office são aceitos e sempre baixados (não abrem no navegador).
    const { body: ata } = await enviar(lider, { arquivo: DOCX, nome: 'Ata da reunião.docx', titulo: 'Ata' }).expect(201);
    assert.equal(ata.grupo, 'documento');
    const baixado = await api().get(`/api/documentos/${ata.id}/arquivo`).set(membro.auth).buffer(true).parse(comoBuffer).expect(200);
    assert.match(baixado.headers['content-disposition'], /^attachment;/);
  });

  test('liderança remove; membro não; admin vê documentos de qualquer igreja', async () => {
    const { lider, igreja, membro } = await igrejaComMembros();
    const admin = await criarUsuario({ papel: 'admin' });
    const { body: documento } = await enviar(lider).expect(201);

    const { body: doAdmin } = await api().get('/api/documentos').query({ igreja_id: igreja.id }).set(admin.auth).expect(200);
    assert.deepEqual(doAdmin.map((d) => d.id), [documento.id]);
    assert.equal(doAdmin[0].pode_excluir, true);

    await api().delete(`/api/documentos/${documento.id}`).set(membro.auth).expect(403);
    await api().delete(`/api/documentos/${documento.id}`).set(lider.auth).expect(204);
    await api().get(`/api/documentos/${documento.id}`).set(membro.auth).expect(404);
  });
});
