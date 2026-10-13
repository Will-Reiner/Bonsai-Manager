import { describe, expect, it, vi } from 'vitest';
import { criarSincronizador } from './sincronizar';

/** Pedido que só termina quando o teste manda. */
function pendente<R>() {
  let resolver!: (r: R) => void;
  let rejeitar!: (e: unknown) => void;
  const promessa = new Promise<R>((res, rej) => {
    resolver = res;
    rejeitar = rej;
  });
  return { promessa, resolver, rejeitar };
}

describe('criarSincronizador', () => {
  it('um desejo: um pedido, devolve a resposta', async () => {
    const enviar = vi.fn(async (alvo: boolean) => ({ valor: alvo }));
    const s = criarSincronizador(false, enviar, (r) => r.valor);
    expect(await s.querer(true)).toEqual({ valor: true });
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(s.servidor).toBe(true);
  });

  it('desejo igual ao do servidor: nenhum pedido', async () => {
    const enviar = vi.fn(async (alvo: boolean) => ({ valor: alvo }));
    const s = criarSincronizador(true, enviar, (r) => r.valor);
    expect(await s.querer(true)).toBeUndefined();
    expect(enviar).not.toHaveBeenCalled();
  });

  it('dois toques rápidos: um pedido por vez e termina no último desejo', async () => {
    const primeiro = pendente<{ valor: boolean }>();
    const enviar = vi.fn((alvo: boolean) => (alvo ? primeiro.promessa : Promise.resolve({ valor: false })));
    const s = criarSincronizador(false, enviar, (r) => r.valor);

    const a = s.querer(true);
    const b = s.querer(false);
    expect(enviar).toHaveBeenCalledTimes(1); // o segundo espera o primeiro

    primeiro.resolver({ valor: true });
    expect(await b).toBeUndefined();
    expect(await a).toEqual({ valor: false });
    expect(enviar.mock.calls.map((c) => c[0])).toEqual([true, false]);
    expect(s.servidor).toBe(false);
  });

  it('vai e volta antes da resposta: não manda o pedido de volta à toa', async () => {
    const primeiro = pendente<{ valor: boolean }>();
    const enviar = vi.fn(() => primeiro.promessa);
    const s = criarSincronizador(false, enviar, (r) => r.valor);

    const a = s.querer(true);
    void s.querer(false);
    void s.querer(true);
    primeiro.resolver({ valor: true });

    expect(await a).toEqual({ valor: true });
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('erro: rejeita, mantém o valor do servidor e deixa tentar de novo', async () => {
    const enviar = vi.fn().mockRejectedValueOnce(new Error('rede')).mockResolvedValueOnce({ valor: true });
    const s = criarSincronizador(false, enviar, (r: { valor: boolean }) => r.valor);

    await expect(s.querer(true)).rejects.toThrow('rede');
    expect(s.servidor).toBe(false);
    expect(await s.querer(true)).toEqual({ valor: true });
  });
});
