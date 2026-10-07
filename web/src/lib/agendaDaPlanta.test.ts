import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { agendaDaPlanta, recortarAgenda, type ItemAgenda } from './agendaDaPlanta';
import type { Agenda } from '@/types';

// Hoje fixo: quarta, 7 de outubro de 2026 (meio-dia local)
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12));
});
afterEach(() => vi.useRealTimers());

const emDias = (d: number) => new Date(2026, 9, 7 + d, 12).toISOString();
/** "AAAA-MM-DD" daqui a d dias (o valor do input de data). */
const inputEm = (d: number) => {
  const x = new Date(2026, 9, 7 + d, 12);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

let seq = 0;
function ag(atividade: string, dias: number, extra: Partial<Agenda> = {}): Agenda {
  seq += 1;
  return {
    id: `a${seq}`,
    plantaId: 'p1',
    atividadeId: atividade,
    atividade: { id: atividade, nome: atividade },
    dataAgendada: emDias(dias),
    status: 'PENDENTE',
    ...extra,
  };
}

const nomes = (itens: ItemAgenda[]) => itens.map((i) => (i.tipo === 'nova' ? 'NOVA' : i.agenda.atividadeId));

describe('agendaDaPlanta', () => {
  it('lista só as pendentes da planta, em ordem de data, com a nova encaixada na posição dela', () => {
    const agendas = [
      ag('revisao', 29),
      ag('rega', 7),
      ag('transplante', 17),
      ag('poda', 3, { status: 'CONCLUIDO' }),
      ag('rega', 5, { plantaId: 'p2' }),
    ];
    const itens = agendaDaPlanta(agendas, { plantaId: 'p1', data: inputEm(14), atividadeIds: ['adubacao'] });
    expect(nomes(itens)).toEqual(['rega', 'NOVA', 'transplante', 'revisao']);
  });

  it('põe as atrasadas primeiro e marca como atrasadas', () => {
    const itens = agendaDaPlanta([ag('rega', 2), ag('poda', -4)], { plantaId: 'p1', data: inputEm(10), atividadeIds: ['x'] });
    expect(nomes(itens)).toEqual(['poda', 'rega', 'NOVA']);
    expect(itens[0]).toMatchObject({ tipo: 'existente', atrasada: true, dias: -4 });
    expect(itens[1]).toMatchObject({ tipo: 'existente', atrasada: false, dias: 2 });
  });

  it('no mesmo dia, as existentes vêm antes da nova', () => {
    const itens = agendaDaPlanta([ag('rega', 5)], { plantaId: 'p1', data: inputEm(5), atividadeIds: ['x'] });
    expect(nomes(itens)).toEqual(['rega', 'NOVA']);
  });

  it('calcula a distância de cada existente até a nova (negativo = antes)', () => {
    const itens = agendaDaPlanta([ag('rega', 7), ag('transplante', 17)], { plantaId: 'p1', data: inputEm(14), atividadeIds: ['x'] });
    expect(itens[0]).toMatchObject({ distancia: -7 });
    expect(itens[2]).toMatchObject({ distancia: 3 });
  });

  it('avisa duplicada quando o mesmo cuidado já está marcado, a qualquer distância', () => {
    const itens = agendaDaPlanta([ag('adubacao', 60), ag('rega', 40)], { plantaId: 'p1', data: inputEm(14), atividadeIds: ['adubacao'] });
    expect(itens.find((i) => i.tipo === 'existente' && i.agenda.atividadeId === 'adubacao')).toMatchObject({ aviso: 'duplicada' });
    expect(itens.find((i) => i.tipo === 'existente' && i.agenda.atividadeId === 'rega')).toMatchObject({ aviso: null });
  });

  it('avisa perto quando outra tarefa fica a até 3 dias da nova', () => {
    const itens = agendaDaPlanta([ag('transplante', 17), ag('rega', 11), ag('poda', 10)], {
      plantaId: 'p1',
      data: inputEm(14),
      atividadeIds: ['adubacao'],
    });
    const aviso = (id: string) => (itens.find((i) => i.tipo === 'existente' && i.agenda.atividadeId === id) as { aviso: string | null }).aviso;
    expect(aviso('transplante')).toBe('perto');
    expect(aviso('rega')).toBe('perto');
    expect(aviso('poda')).toBeNull();
  });

  it('ignora a própria tarefa ao reagendar', () => {
    const propria = ag('adubacao', 5);
    const itens = agendaDaPlanta([propria, ag('rega', 7)], {
      plantaId: 'p1',
      data: inputEm(20),
      atividadeIds: ['adubacao'],
      ignorarId: propria.id,
    });
    expect(nomes(itens)).toEqual(['rega', 'NOVA']);
  });

  it('sem data válida, devolve só as existentes (sem a nova)', () => {
    const itens = agendaDaPlanta([ag('rega', 7)], { plantaId: 'p1', data: '', atividadeIds: ['x'] });
    expect(nomes(itens)).toEqual(['rega']);
  });
});

describe('recortarAgenda', () => {
  const linha = (diasExistentes: number[], dataNova: number, atividadeIds = ['nova']) =>
    agendaDaPlanta(
      diasExistentes.map((d) => ag(`t${d}`, d)),
      { plantaId: 'p1', data: inputEm(dataNova), atividadeIds },
    );

  it('com poucas tarefas, mostra todas', () => {
    const r = recortarAgenda(linha([2, 5, 9], 4), { max: 5 });
    expect(nomes(r.visiveis)).toEqual(['t2', 'NOVA', 't5', 't9']);
    expect(r).toMatchObject({ antes: 0, depois: 0 });
  });

  it('mostra as mais próximas da nova e conta as escondidas antes e depois', () => {
    const r = recortarAgenda(linha([1, 2, 12, 20, 21, 22, 27, 80], 20), { max: 5 });
    expect(nomes(r.visiveis)).toEqual(['t12', 't20', 'NOVA', 't21', 't22', 't27']);
    expect(r).toMatchObject({ antes: 2, depois: 1 });
  });

  it('itens com aviso nunca ficam escondidos (e ocupam vaga do máximo)', () => {
    const itens = agendaDaPlanta(
      [ag('adubacao', 200), ag('a', 40), ag('b', 41), ag('c', 42), ag('d', 43), ag('e', 44), ag('f', 45)],
      { plantaId: 'p1', data: inputEm(12), atividadeIds: ['adubacao'] },
    );
    const r = recortarAgenda(itens, { max: 3 });
    expect(nomes(r.visiveis)).toEqual(['NOVA', 'a', 'b', 'adubacao']);
    expect(r).toMatchObject({ antes: 0, depois: 4 });
  });

  it('com janela, ignora o que está longe da nova (nem conta como escondido)', () => {
    const r = recortarAgenda(linha([-100, 5, 30, 200], 10), { max: 3, janela: 90 });
    expect(nomes(r.visiveis)).toEqual(['t5', 'NOVA', 't30']);
    expect(r).toMatchObject({ antes: 0, depois: 0 });
  });

  it('com janela e mais itens que o máximo, conta só os de dentro da janela', () => {
    const r = recortarAgenda(linha([5, 10, 20, 30, 40, 300], 26), { max: 3, janela: 90 });
    expect(nomes(r.visiveis)).toEqual(['t20', 'NOVA', 't30', 't40']);
    expect(r).toMatchObject({ antes: 2, depois: 0 });
  });
});

