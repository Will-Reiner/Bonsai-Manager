import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chaveDoAtual, chaveItem, linhaDoTempo, notasDoCuidado, tarefasDoDia, tituloCuidado } from './linhaDoTempo';
import type { Agenda, Foto } from '@/types';

// Hoje fixo: 8 de outubro de 2026, meio-dia local
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 8, 12));
});
afterEach(() => vi.useRealTimers());

const em = (dia: number, hora = 10, min = 0) => new Date(2026, 9, dia, hora, min).toISOString();

let seq = 0;
function feita(atividade: string, quando: string, extra: Partial<Agenda> = {}): Agenda {
  seq += 1;
  return {
    id: `a${seq}`,
    plantaId: 'p1',
    atividadeId: atividade,
    atividade: { id: atividade, nome: atividade },
    dataAgendada: quando,
    dataConcluida: quando,
    status: 'CONCLUIDO',
    ...extra,
  };
}
const pendente = (atividade: string, quando: string) =>
  feita(atividade, quando, { status: 'PENDENTE', dataConcluida: null });
const foto = (id: string, quando: string, extra: Partial<Foto> = {}): Foto => ({
  id,
  caminhoArquivo: `${id}.jpg`,
  createdAt: quando,
  dataCaptura: quando,
  usuarioId: 'u1',
  tipo: 'FOTO',
  plantaId: 'p1',
  ...extra,
});
const ids = (as: Agenda[]) => as.map((a) => a.id);

describe('linhaDoTempo — cuidados do dia', () => {
  it('junta as tarefas concluídas do mesmo dia num cuidado', () => {
    const a = feita('Adubação', em(7, 10));
    const b = feita('Desaramação', em(7, 10));
    const { passado } = linhaDoTempo([a, b]);
    expect(passado).toHaveLength(1);
    expect(passado[0]).toMatchObject({ tipo: 'cuidado', data: a.dataConcluida });
    expect(passado[0].tipo === 'cuidado' && ids(passado[0].agendas)).toEqual([a.id, b.id]);
  });

  it('separa dias diferentes, do mais antigo para o mais novo', () => {
    const novo = feita('Poda', em(7));
    const antigo = feita('Rega', em(5));
    const { passado } = linhaDoTempo([novo, antigo]);
    expect(passado.map((i) => i.tipo === 'cuidado' && ids(i.agendas))).toEqual([[antigo.id], [novo.id]]);
  });

  it('a virada do dia segue o fuso do aparelho', () => {
    const { passado } = linhaDoTempo([feita('Rega', em(7, 23, 50)), feita('Poda', em(8, 0, 10))]);
    expect(passado).toHaveLength(2);
  });

  it('ordena as tarefas do dia pela hora de conclusão', () => {
    const tarde = feita('Poda', em(7, 16));
    const manha = feita('Rega', em(7, 8));
    const { passado } = linhaDoTempo([tarde, manha]);
    expect(passado[0].tipo === 'cuidado' && ids(passado[0].agendas)).toEqual([manha.id, tarde.id]);
    expect(passado[0].data).toBe(manha.dataConcluida);
  });

  it('fotos das tarefas e fotos avulsas do dia entram no cuidado; dia sem cuidado fica como fotos', () => {
    const a = feita('Adubação', em(7), { fotos: [{ id: 'f1', caminhoArquivo: 'f1.jpg' }] });
    const fotos = [foto('f1', em(7), { agendaId: a.id }), foto('f2', em(7, 15)), foto('f3', em(6))];
    const { passado } = linhaDoTempo([a], fotos);
    expect(passado.map((i) => i.tipo)).toEqual(['fotos', 'cuidado']);
    expect(passado[1].tipo === 'cuidado' && passado[1].fotos.map((f) => f.id)).toEqual(['f1', 'f2']);
    expect(passado[0].tipo === 'fotos' && passado[0].fotos.map((f) => f.id)).toEqual(['f3']);
  });

  it('foto avulsa num dia com só tarefa pendente continua como fotos', () => {
    const { passado, pendentes } = linhaDoTempo([pendente('Poda', em(8, 9))], [foto('f9', em(8, 9))]);
    expect(passado.map((i) => i.tipo)).toEqual(['fotos']);
    expect(pendentes).toHaveLength(1);
  });

  it('pendentes continuam uma por tarefa, atrasadas antes das futuras', () => {
    const futura = pendente('Poda', em(10));
    const atrasada = pendente('Rega', em(3));
    const { pendentes } = linhaDoTempo([futura, atrasada, feita('Adubação', em(7))]);
    expect(pendentes.map((i) => i.tipo === 'tarefa' && [i.agenda.id, i.estado])).toEqual([
      [atrasada.id, 'atrasada'],
      [futura.id, 'futura'],
    ]);
  });

  it('chave do cuidado é o dia', () => {
    const { passado } = linhaDoTempo([feita('Rega', em(7))]);
    expect(chaveItem(passado[0])).toBe('c-2026-10-07');
  });
});

describe('tituloCuidado', () => {
  it('une os nomes sem repetir', () => {
    expect(tituloCuidado([feita('Adubação', em(7)), feita('Adubação', em(7)), feita('Poda', em(7))])).toBe('Adubação + Poda');
  });

  it('sem atividade carregada vira Cuidado', () => {
    expect(tituloCuidado([feita('Rega', em(7), { atividade: undefined })])).toBe('Cuidado');
  });
});

describe('notasDoCuidado', () => {
  it('texto igual em todas as tarefas aparece uma vez, sem rótulo', () => {
    const notas = notasDoCuidado([
      feita('Adubação', em(7), { detalhes: 'Dia de sol ' }),
      feita('Desaramação', em(7), { detalhes: 'Dia de sol' }),
    ]);
    expect(notas).toEqual([{ tipo: 'detalhes', texto: 'Dia de sol', atividades: null }]);
  });

  it('texto de parte das tarefas leva o nome delas; descrições antes das obs.', () => {
    const notas = notasDoCuidado([
      feita('Adubação', em(7), { detalhes: 'Bioform 5 ml/L' }),
      feita('Desaramação', em(7), { detalhes: 'Galho marcou', observacaoFutura: 'Reaplicar em 2 meses' }),
    ]);
    expect(notas).toEqual([
      { tipo: 'detalhes', texto: 'Bioform 5 ml/L', atividades: ['Adubação'] },
      { tipo: 'detalhes', texto: 'Galho marcou', atividades: ['Desaramação'] },
      { tipo: 'obs', texto: 'Reaplicar em 2 meses', atividades: ['Desaramação'] },
    ]);
  });

  it('card de uma tarefa não tem rótulo', () => {
    expect(notasDoCuidado([feita('Poda', em(7), { observacaoFutura: 'Ver brotação' })])).toEqual([
      { tipo: 'obs', texto: 'Ver brotação', atividades: null },
    ]);
  });

  it('mesma atividade duas vezes com textos diferentes mantém os dois', () => {
    const notas = notasDoCuidado([
      feita('Rega', em(7, 8), { detalhes: 'Manhã' }),
      feita('Rega', em(7, 18), { detalhes: 'Tarde' }),
    ]);
    expect(notas).toEqual([
      { tipo: 'detalhes', texto: 'Manhã', atividades: ['Rega'] },
      { tipo: 'detalhes', texto: 'Tarde', atividades: ['Rega'] },
    ]);
  });

  it('ignora texto só com espaços', () => {
    expect(notasDoCuidado([feita('Rega', em(7), { detalhes: '   ', observacaoFutura: null })])).toEqual([]);
  });
});

describe('tarefasDoDia', () => {
  it('as concluídas da mesma planta no mesmo dia, em ordem de conclusão', () => {
    const b = feita('Poda', em(7, 16));
    const a = feita('Rega', em(7, 8));
    const outroDia = feita('Rega', em(6));
    const outraPlanta = feita('Rega', em(7), { plantaId: 'p2' });
    const pend = pendente('Adubação', em(7));
    expect(ids(tarefasDoDia([b, a, outroDia, outraPlanta, pend], b))).toEqual([a.id, b.id]);
  });

  it('tarefa não concluída volta sozinha', () => {
    const p = pendente('Poda', em(9));
    expect(tarefasDoDia([p, feita('Rega', em(9))], p)).toEqual([p]);
  });
});

describe('chaveDoAtual', () => {
  it('tarefas do mesmo dia têm o mesmo card atual (trocar entre elas não move a faixa)', () => {
    const a = feita('Adubação', em(7, 8));
    const b = feita('Poda', em(7, 16));
    const { passado, pendentes } = linhaDoTempo([a, b, feita('Rega', em(5))]);
    const itens = [...passado, ...pendentes];
    expect(chaveDoAtual(itens, a.id)).toBe('c-2026-10-07');
    expect(chaveDoAtual(itens, b.id)).toBe(chaveDoAtual(itens, a.id));
  });

  it('pendente é o próprio card; id fora da linha dá null', () => {
    const p = pendente('Poda', em(10));
    const { passado, pendentes } = linhaDoTempo([p]);
    expect(chaveDoAtual([...passado, ...pendentes], p.id)).toBe(`t-${p.id}`);
    expect(chaveDoAtual([...passado, ...pendentes], 'x')).toBeNull();
  });
});
