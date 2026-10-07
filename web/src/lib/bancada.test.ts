import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOM_NEUTRO, GRUPO_CORES } from './format';
import { montarBancada, pendentesDaBancada } from './bancada';
import type { Agenda, GrupoPlanta, Planta } from '@/types';

// Hoje fixo: quarta, 7 de outubro de 2026 (meio-dia local)
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12));
});
afterEach(() => vi.useRealTimers());

const emDias = (d: number) => new Date(2026, 9, 7 + d, 12).toISOString();

let seq = 0;
function ag(plantaId: string, atividade: string, dias: number, status: Agenda['status'] = 'PENDENTE'): Agenda {
  seq += 1;
  return {
    id: `a${seq}`,
    plantaId,
    atividadeId: atividade,
    atividade: { id: atividade, nome: atividade },
    dataAgendada: emDias(dias),
    status,
  };
}

function plantas(lista: { id: string; grupo?: GrupoPlanta | null; especieId?: string; especie?: string }[]) {
  return new Map<string, Planta>(
    lista.map((p) => [
      p.id,
      {
        id: p.id,
        grupo: p.grupo ?? null,
        especieId: p.especieId ?? null,
        especie: p.especie ? { nomeComum: p.especie } : undefined,
      } as unknown as Planta,
    ]),
  );
}

describe('pendentesDaBancada', () => {
  it('inclui atrasadas de qualquer idade e as que vencem dentro do período', () => {
    const atrasadaAntiga = ag('p1', 'Rega', -40);
    const hoje = ag('p1', 'Rega', 0);
    const emSeis = ag('p1', 'Poda', 6);
    const emOito = ag('p1', 'Poda', 8);
    expect(pendentesDaBancada([atrasadaAntiga, hoje, emSeis, emOito], 'semana')).toEqual([atrasadaAntiga, hoje, emSeis]);
  });

  it('ignora o que não está pendente', () => {
    const feita = ag('p1', 'Rega', -1, 'CONCLUIDO');
    const cancelada = ag('p1', 'Rega', 1, 'CANCELADO');
    expect(pendentesDaBancada([feita, cancelada], 'todas')).toEqual([]);
  });

  it('"todas" não tem limite', () => {
    const longe = ag('p1', 'Rega', 400);
    expect(pendentesDaBancada([longe], 'todas')).toEqual([longe]);
  });
});

describe('montarBancada por grupo', () => {
  it('sem tarefas, não monta blocos', () => {
    expect(montarBancada([], 'grupos', plantas([]))).toEqual([]);
  });

  it('grupo com atrasada vem antes de grupo de maior prioridade sem atrasada', () => {
    const mapa = plantas([
      { id: 'deb', grupo: 'DEBILITADA' },
      { id: 'cres', grupo: 'EM_CRESCIMENTO' },
    ]);
    const blocos = montarBancada([ag('deb', 'Rega', 2), ag('cres', 'Rega', -1)], 'grupos', mapa);
    expect(blocos.map((b) => b.chave)).toEqual(['EM_CRESCIMENTO', 'DEBILITADA']);
  });

  it('entre grupos com atrasadas, mantém a ordem de prioridade; sem grupo vai por último', () => {
    const mapa = plantas([
      { id: 'ref', grupo: 'REFINAMENTO' },
      { id: 'pre', grupo: 'PRE_TRANSPLANTE' },
      { id: 'sem' },
    ]);
    const blocos = montarBancada([ag('sem', 'Rega', 1), ag('ref', 'Rega', -2), ag('pre', 'Rega', -1)], 'grupos', mapa);
    expect(blocos.map((b) => b.chave)).toEqual(['PRE_TRANSPLANTE', 'REFINAMENTO', 'sem']);
    expect(blocos.map((b) => b.titulo)).toEqual(['Pré-transplante', 'Refinamento', 'Sem grupo']);
  });

  it('conta total e atrasadas e usa a cor do grupo (neutra sem grupo)', () => {
    const mapa = plantas([{ id: 'deb', grupo: 'DEBILITADA' }, { id: 'sem' }]);
    const [deb, sem] = montarBancada([ag('deb', 'Rega', -3), ag('deb', 'Poda', 2), ag('sem', 'Rega', 1)], 'grupos', mapa);
    expect(deb).toMatchObject({ total: 2, atrasadas: 1, tom: GRUPO_CORES.DEBILITADA });
    expect(sem).toMatchObject({ total: 1, atrasadas: 0, tom: TOM_NEUTRO });
  });

  it('dentro do grupo, tarefas pela data mais antiga e plantas atrasadas primeiro', () => {
    const mapa = plantas([
      { id: 'a', grupo: 'EM_CRESCIMENTO' },
      { id: 'b', grupo: 'EM_CRESCIMENTO' },
    ]);
    const [bloco] = montarBancada([ag('a', 'Poda', 3), ag('b', 'Rega', 4), ag('b', 'Poda', -1)], 'grupos', mapa);
    expect(bloco.grupos.map((g) => g.nome)).toEqual(['Poda', 'Rega']);
    expect(bloco.grupos[0].agendas.map((a) => a.plantaId)).toEqual(['b', 'a']);
  });
});

describe('montarBancada por tarefa', () => {
  it('um bloco por atividade, em faixa neutra, com atrasadas primeiro', () => {
    const mapa = plantas([{ id: 'a' }, { id: 'b' }]);
    const blocos = montarBancada([ag('a', 'Rega', 2), ag('b', 'Poda', 1), ag('a', 'Poda', 5), ag('b', 'Rega', -2)], 'tarefas', mapa);
    expect(blocos.map((b) => b.titulo)).toEqual(['Rega', 'Poda']);
    expect(blocos[0]).toMatchObject({ total: 2, atrasadas: 1, tom: TOM_NEUTRO });
    expect(blocos[0].grupos).toHaveLength(1);
    expect(blocos[0].grupos[0].agendas.map((a) => a.plantaId)).toEqual(['b', 'a']);
  });
});

describe('montarBancada por espécie', () => {
  it('espécies de A a Z, "Sem espécie" por último, com atrasadas antes', () => {
    const mapa = plantas([
      { id: 'j', especieId: 'e1', especie: 'Jabuticaba' },
      { id: 'f', especieId: 'e2', especie: 'Ficus' },
      { id: 'x' },
      { id: 'l', especieId: 'e3', especie: 'Ligustro' },
    ]);
    const blocos = montarBancada([ag('j', 'Rega', 1), ag('f', 'Rega', 2), ag('x', 'Rega', 1), ag('l', 'Rega', -1)], 'especies', mapa);
    expect(blocos.map((b) => b.titulo)).toEqual(['Ligustro', 'Ficus', 'Jabuticaba', 'Sem espécie']);
    expect(blocos.every((b) => b.tom === TOM_NEUTRO)).toBe(true);
  });
});
