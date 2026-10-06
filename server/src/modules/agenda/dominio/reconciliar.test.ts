import { reconciliar } from './reconciliar';

const pendente = (id: string, plantaId: string, atividadeId: string, data: string) => ({
  id,
  plantaId,
  atividadeId,
  dataAgendada: new Date(data),
});

describe('reconciliar', () => {
  const cuidados = [
    { plantaId: 'p1', atividadeIds: ['adubo', 'poda'] },
    { plantaId: 'p2', atividadeIds: ['adubo'] },
  ];

  it('sem pendentes, não absorve nem cancela nada', () => {
    expect(reconciliar(cuidados, [])).toEqual({ absorver: [], cancelar: [] });
  });

  it('cada pendente compatível é absorvida pelo cuidado da sua planta', () => {
    const r = reconciliar(cuidados, [
      pendente('a1', 'p1', 'adubo', '2026-10-10T12:00:00.000Z'),
      pendente('a2', 'p2', 'adubo', '2026-10-01T12:00:00.000Z'),
      pendente('a3', 'p1', 'poda', '2026-12-01T12:00:00.000Z'),
    ]);

    expect(r.absorver).toEqual([
      { agendaId: 'a2', plantaId: 'p2', atividadeId: 'adubo' },
      { agendaId: 'a1', plantaId: 'p1', atividadeId: 'adubo' },
      { agendaId: 'a3', plantaId: 'p1', atividadeId: 'poda' },
    ]);
    expect(r.cancelar).toEqual([]);
  });

  it('com duas pendentes do mesmo cuidado na mesma planta, absorve a mais antiga e cancela a outra', () => {
    const r = reconciliar(cuidados, [
      pendente('tarde', 'p1', 'adubo', '2026-11-01T12:00:00.000Z'),
      pendente('cedo', 'p1', 'adubo', '2026-10-01T12:00:00.000Z'),
    ]);

    expect(r.absorver).toEqual([{ agendaId: 'cedo', plantaId: 'p1', atividadeId: 'adubo' }]);
    expect(r.cancelar).toEqual(['tarde']);
  });

  it('lança erro quando a pendente é de um cuidado não registrado na planta', () => {
    expect(() => reconciliar(cuidados, [pendente('a1', 'p2', 'poda', '2026-10-10T12:00:00.000Z')])).toThrow(
      'Tarefa não corresponde ao cuidado registrado.',
    );
  });

  it('lança erro quando a pendente é de uma planta fora do registro', () => {
    expect(() => reconciliar(cuidados, [pendente('a1', 'p9', 'adubo', '2026-10-10T12:00:00.000Z')])).toThrow(
      'Tarefa não corresponde ao cuidado registrado.',
    );
  });
});
