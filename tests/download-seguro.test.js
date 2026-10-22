import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ehEnderecoInterno } from '../src/core/download-seguro.js';

describe('Download seguro', () => {
  test('identifica endereços da rede interna, loopback e da nuvem', () => {
    for (const ip of ['127.0.0.1', '10.0.0.5', '172.16.8.1', '192.168.0.10', '169.254.169.254', '100.64.0.1', '0.0.0.0',
      '::1', '::', 'fd12:3456::1', 'fe80::1', '::ffff:10.0.0.1', '::ffff:127.0.0.1', 'nao-e-ip']) {
      assert.equal(ehEnderecoInterno(ip), true, ip);
    }
  });

  test('libera endereços públicos da internet', () => {
    for (const ip of ['8.8.8.8', '200.160.2.3', '2001:4860:4860::8888', '::ffff:8.8.8.8']) {
      assert.equal(ehEnderecoInterno(ip), false, ip);
    }
  });
});
