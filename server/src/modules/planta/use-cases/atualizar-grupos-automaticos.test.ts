import { atualizarGruposAutomaticos } from './atualizar-grupos-automaticos';
import { PlantaRepository } from '../types/planta.types';

const DIA = 86_400_000;
const AGORA = new Date('2026-10-06T12:00:00.000Z');

describe('atualizarGruposAutomaticos', () => {
  let repo: jest.Mocked<PlantaRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findManyByUser: jest.fn(),
      findByIdAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByIdAndUser: jest.fn(),
      findUrlsDeMidia: jest.fn(),
      resolverGruposVencidos: jest.fn().mockResolvedValue(undefined),
      estadoPreTransplante: jest.fn().mockResolvedValue({ dias: 30, plantas: [], pendentes: [] }),
      aplicarMudancasPre: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('resolve a Recém transplantada vencida antes de calcular o Pré-transplante', async () => {
    await atualizarGruposAutomaticos(repo, 'user-1', AGORA);

    expect(repo.resolverGruposVencidos).toHaveBeenCalledWith('user-1', AGORA);
    expect(repo.estadoPreTransplante).toHaveBeenCalledWith('user-1');
    expect(repo.resolverGruposVencidos.mock.invocationCallOrder[0]).toBeLessThan(
      repo.estadoPreTransplante.mock.invocationCallOrder[0],
    );
  });

  it('grava as mudanças do Pré-transplante', async () => {
    repo.estadoPreTransplante.mockResolvedValue({
      dias: 30,
      plantas: [{ plantaId: 'p1', grupo: 'REFINAMENTO', grupoAnterior: null, preTransplanteAgendaId: null }],
      pendentes: [{ plantaId: 'p1', agendaId: 'ag-1', dataAgendada: new Date(AGORA.getTime() + 10 * DIA) }],
    });

    await atualizarGruposAutomaticos(repo, 'user-1', AGORA);

    expect(repo.aplicarMudancasPre).toHaveBeenCalledWith([
      { plantaId: 'p1', grupo: 'PRE_TRANSPLANTE', grupoAnterior: 'REFINAMENTO', preTransplanteAgendaId: 'ag-1' },
    ]);
  });

  it('sem mudanças, não grava nada', async () => {
    await atualizarGruposAutomaticos(repo, 'user-1', AGORA);

    expect(repo.aplicarMudancasPre).not.toHaveBeenCalled();
  });
});
