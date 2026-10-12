import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cuidadoNoDia,
  cuidadosDaPlanta,
  formTexto,
  indiceDoCuidado,
  textoExcluirCuidado,
  textosAlterados,
  vizinhoAposExcluir,
} from './cuidadoDoDia';
import type { Agenda } from '@/types';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 12, 12));
});
afterEach(() => vi.useRealTimers());

const em = (dia: number) => new Date(2026, 9, dia, 10).toISOString();
const feita = (id: string, dia: number, extra: Partial<Agenda> = {}): Agenda => ({
  id,
  plantaId: 'p1',
  atividadeId: id,
  atividade: { id, nome: id },
  dataAgendada: em(dia),
  dataConcluida: em(dia),
  status: 'CONCLUIDO',
  ...extra,
});

describe('cuidadosDaPlanta', () => {
  it('um cuidado por dia, do mais antigo ao mais novo, só concluídas da planta', () => {
    const agendas = [
      feita('b', 5),
      feita('a', 2),
      feita('c', 5),
      feita('x', 3, { plantaId: 'p2' }),
      feita('pend', 20, { status: 'PENDENTE', dataConcluida: null }),
    ];
    const cuidados = cuidadosDaPlanta(agendas, 'p1');
    expect(cuidados.map((c) => c.agendas.map((a) => a.id))).toEqual([['a'], ['b', 'c']]);
    expect(indiceDoCuidado(cuidados, 'c')).toBe(1);
    expect(indiceDoCuidado(cuidados, 'nada')).toBe(-1);
  });
});

describe('vizinhoAposExcluir', () => {
  it('prefere o anterior, senão o seguinte, senão nenhum', () => {
    const cuidados = cuidadosDaPlanta([feita('a', 1), feita('b', 2), feita('c', 3)], 'p1');
    expect(vizinhoAposExcluir(cuidados, 1)).toBe('a');
    expect(vizinhoAposExcluir(cuidados, 0)).toBe('b');
    expect(vizinhoAposExcluir(cuidados.slice(0, 1), 0)).toBeNull();
  });
});

describe('formTexto / textosAlterados', () => {
  it('textos iguais (ou vazios) → campo único; diferentes → por tarefa', () => {
    const iguais = [feita('a', 1, { detalhes: 'x' }), feita('b', 1, { detalhes: ' x ' })];
    expect(formTexto(iguais, 'detalhes')).toMatchObject({ unico: true, valor: 'x' });
    const vazios = [feita('a', 1), feita('b', 1)];
    expect(formTexto(vazios, 'detalhes')).toMatchObject({ unico: true, valor: '' });
    const diferentes = [feita('a', 1, { detalhes: 'x' }), feita('b', 1)];
    expect(formTexto(diferentes, 'detalhes')).toMatchObject({ unico: false, porTarefa: { a: 'x', b: '' } });
  });

  it('manda só o que mudou, só das tarefas que ficam; vazio vira null', () => {
    const a = feita('a', 1, { detalhes: 'x', observacaoFutura: 'o' });
    const b = feita('b', 1, { detalhes: 'y' });
    const forms = {
      detalhes: { unico: false, valor: '', porTarefa: { a: 'x', b: 'y2' } },
      observacaoFutura: { unico: true, valor: '', porTarefa: {} },
    };
    expect(textosAlterados([a, b], forms)).toEqual([
      { agendaId: 'a', observacaoFutura: null },
      { agendaId: 'b', detalhes: 'y2' },
    ]);
    // b tirada do card: nada dela é enviado
    expect(textosAlterados([a], forms)).toEqual([{ agendaId: 'a', observacaoFutura: null }]);
  });
});

describe('cuidadoNoDia', () => {
  it('acha outro cuidado da planta na data escolhida', () => {
    const cuidados = cuidadosDaPlanta([feita('a', 1), feita('b', 5)], 'p1');
    expect(cuidadoNoDia(cuidados, '2026-10-01', cuidados[1])?.agendas[0].id).toBe('a');
    expect(cuidadoNoDia(cuidados, '2026-10-05', cuidados[1])).toBeNull();
    expect(cuidadoNoDia(cuidados, '2026-10-09', cuidados[1])).toBeNull();
  });
});

describe('textoExcluirCuidado', () => {
  const recem = { grupo: 'RECEM_TRANSPLANTADA' as const, grupoAnterior: 'EM_CRESCIMENTO' as const, transplanteAgendaId: 't1' };
  it('avisa a volta de grupo só quando o Transplante de origem está no card', () => {
    expect(textoExcluirCuidado(2, recem, ['t1', 'x'])).toBe(
      'As 2 tarefas somem do histórico. As fotos continuam na galeria da planta. A planta volta para Em crescimento.',
    );
    expect(textoExcluirCuidado(1, recem, ['x'])).toBe('A tarefa some do histórico. As fotos continuam na galeria da planta.');
    expect(textoExcluirCuidado(1, { ...recem, grupoAnterior: null }, ['t1'])).toBe(
      'A tarefa some do histórico. As fotos continuam na galeria da planta. A planta sai de Recém transplantada.',
    );
  });
});
