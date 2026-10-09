import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adiarData, diasDeAdiamento, emLote, pendentesDaPlanta, textoResultadoLote, ultimoCuidado } from './tarefasDaPlanta';
import type { Agenda } from '@/types';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12));
});
afterEach(() => vi.useRealTimers());

const emDias = (d: number) => new Date(2026, 9, 7 + d, 12).toISOString();
let seq = 0;
function ag(atividade: string, dias: number, extra: Partial<Agenda> = {}): Agenda {
  seq += 1;
  return { id: `a${seq}`, plantaId: 'p1', atividadeId: atividade, atividade: { id: atividade, nome: atividade }, dataAgendada: emDias(dias), status: 'PENDENTE', ...extra };
}

describe('pendentesDaPlanta', () => {
  it('só as pendentes da planta, da mais antiga para a mais nova', () => {
    const agendas = [
      ag('poda', 5),
      ag('rega', -2),
      ag('adubo', 1, { status: 'CONCLUIDO' }),
      ag('transplante', 120),
      ag('rega', 0, { plantaId: 'p2' }),
    ];
    expect(pendentesDaPlanta(agendas, 'p1').map((a) => a.atividadeId)).toEqual(['rega', 'poda', 'transplante']);
  });
});

describe('ultimoCuidado', () => {
  it('a concluída mais recente da planta (pela data de conclusão)', () => {
    const agendas = [
      ag('poda', -10, { status: 'CONCLUIDO', dataConcluida: emDias(-3) }),
      ag('adubo', -5, { status: 'CONCLUIDO' }),
      ag('rega', -1, { status: 'CONCLUIDO', plantaId: 'p2' }),
      ag('rega', -1),
    ];
    expect(ultimoCuidado(agendas, 'p1')?.atividadeId).toBe('poda');
  });

  it('nenhuma concluída → undefined', () => {
    expect(ultimoCuidado([ag('poda', 1)], 'p1')).toBeUndefined();
  });
});

describe('adiarData', () => {
  it('soma dias mantendo o horário local, inclusive na virada do mês', () => {
    const r = new Date(adiarData(new Date(2026, 9, 28, 12).toISOString(), 7));
    expect([r.getFullYear(), r.getMonth(), r.getDate(), r.getHours()]).toEqual([2026, 10, 4, 12]);
  });
});

describe('diasDeAdiamento', () => {
  it('inteiro de 1 a 3650; o resto é null', () => {
    expect(diasDeAdiamento('7')).toBe(7);
    expect(diasDeAdiamento(' 30 ')).toBe(30);
    for (const t of ['', '0', '-3', '2.5', 'abc', '3651']) expect(diasDeAdiamento(t)).toBeNull();
  });
});

describe('emLote', () => {
  it('separa as que deram certo e guarda o primeiro erro', async () => {
    const erro = new Error('falhou');
    const r = await emLote([1, 2, 3], (n) => (n === 2 ? Promise.reject(erro) : Promise.resolve()));
    expect(r).toEqual({ feitos: [1, 3], total: 3, erro });
  });
});

describe('textoResultadoLote', () => {
  it('uma, várias e parcial', () => {
    expect(textoResultadoLote(1, 1, 'excluída')).toBe('Tarefa excluída');
    expect(textoResultadoLote(3, 3, 'reagendada')).toBe('3 tarefas reagendadas');
    expect(textoResultadoLote(2, 3, 'reagendada')).toBe('2 de 3 reagendadas');
  });
});
