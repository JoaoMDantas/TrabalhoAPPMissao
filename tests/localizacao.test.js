import './setup-env.js';
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { api, criarUsuario, encerrarBanco } from './helpers.js';

after(encerrarBanco);

// A consulta ao OpenStreetMap em si não roda nos testes automáticos (depende de internet); aqui ficam as regras da API.
describe('Busca de endereços para o mapa', () => {
  test('exige login e um termo com pelo menos 3 letras', async () => {
    const pessoa = await criarUsuario();

    await api().get('/api/localizacao/buscar').query({ q: 'Cohatrac' }).expect(401);
    const curta = await api().get('/api/localizacao/buscar').query({ q: 'ab' }).set(pessoa.auth).expect(400);
    assert.match(curta.body.erro.mensagem, /3 letras/);
    await api().get('/api/localizacao/buscar').set(pessoa.auth).expect(400);
  });
});
