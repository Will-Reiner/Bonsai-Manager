import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { ehErroDeRede, ehNaoEncontrado } from './api';

const resposta = (status: number) => ({ status, data: {}, statusText: '', headers: {}, config: {} }) as AxiosResponse;

describe('ehErroDeRede', () => {
  it('erro do axios sem resposta é de rede', () => {
    expect(ehErroDeRede(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true);
  });

  it('erro com resposta do servidor (404, 500) não é de rede', () => {
    expect(ehErroDeRede(new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, resposta(404)))).toBe(false);
    expect(ehErroDeRede(new AxiosError('x', 'ERR_BAD_RESPONSE', undefined, undefined, resposta(500)))).toBe(false);
  });

  it('outros erros e vazio não são de rede', () => {
    expect(ehErroDeRede(new Error('boom'))).toBe(false);
    expect(ehErroDeRede(undefined)).toBe(false);
  });
});


describe('ehNaoEncontrado', () => {
  it('só resposta 404', () => {
    expect(ehNaoEncontrado(new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, resposta(404)))).toBe(true);
    expect(ehNaoEncontrado(new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, resposta(400)))).toBe(false);
    expect(ehNaoEncontrado(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(false);
    expect(ehNaoEncontrado(new Error('x'))).toBe(false);
  });
});
