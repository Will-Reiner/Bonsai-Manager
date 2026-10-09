import { describe, expect, it } from 'vitest';
import type { Agenda, Atividade, Especie, Planta } from '@/types';
import {
  apagarAtalho,
  atividadesValidas,
  lerAtalhos,
  nomesDeEspecies,
  opcoesEspecies,
  plantasDoAtalho,
  rotuloAlvo,
  salvarAtalho,
  tarefasDoAtalho,
  temEspecieSemPlanta,
  type Atalho,
} from './atalhos';

const planta = (id: string, identificador: number, extra: Partial<Planta> = {}) =>
  ({ id, identificador, grupo: null, especieId: null, especie: null, ...extra }) as Planta;
const atalho = (extra: Partial<Atalho> = {}): Atalho => ({ id: 'x', atividadeIds: ['adub'], grupos: [], especieIds: [], ...extra });
const diasDaqui = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const agenda = (id: string, plantaId: string, atividadeId: string, dias: number, status = 'PENDENTE') =>
  ({ id, plantaId, atividadeId, dataAgendada: diasDaqui(dias), status }) as Agenda;

const plantas = [
  planta('p3', 3, { grupo: 'PRE_TRANSPLANTE', especieId: 'azaleia' }),
  planta('p1', 1, { grupo: 'RECEM_TRANSPLANTADA', especieId: 'pinheiro' }),
  planta('p2', 2, { especieId: 'azaleia' }),
  planta('p4', 4),
];

describe('lerAtalhos', () => {
  it('lista salva como JSON', () => {
    const a = atalho({ grupos: ['DEBILITADA'], especieIds: ['e1'] });
    expect(lerAtalhos(JSON.stringify([a]))).toEqual([a]);
  });

  it('sem preferência ou JSON quebrado: nenhum', () => {
    expect(lerAtalhos(undefined)).toEqual([]);
    expect(lerAtalhos('{oops')).toEqual([]);
    expect(lerAtalhos('{"a":1}')).toEqual([]);
  });

  it('descarta item sem id, grupos inexistentes e valores que não são texto', () => {
    const texto = JSON.stringify([
      { atividadeIds: ['a'] },
      null,
      { id: 'ok', atividadeIds: ['a', 2], grupos: ['DEBILITADA', 'INVENTADO'], especieIds: 'e1' },
    ]);
    expect(lerAtalhos(texto)).toEqual([{ id: 'ok', atividadeIds: ['a'], grupos: ['DEBILITADA'], especieIds: [] }]);
  });
});

describe('plantasDoAtalho', () => {
  it('sem filtros: todas, por número', () => {
    expect(plantasDoAtalho(atalho(), plantas).map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4']);
  });

  it('grupos: qualquer um dos escolhidos; sem grupo fica fora', () => {
    const a = atalho({ grupos: ['PRE_TRANSPLANTE', 'RECEM_TRANSPLANTADA'] });
    expect(plantasDoAtalho(a, plantas).map((p) => p.id)).toEqual(['p1', 'p3']);
  });

  it('espécies: qualquer uma das escolhidas; sem espécie fica fora', () => {
    expect(plantasDoAtalho(atalho({ especieIds: ['azaleia'] }), plantas).map((p) => p.id)).toEqual(['p2', 'p3']);
  });

  it('grupos e espécies juntos: precisa passar nos dois', () => {
    const a = atalho({ grupos: ['PRE_TRANSPLANTE', 'RECEM_TRANSPLANTADA'], especieIds: ['azaleia'] });
    expect(plantasDoAtalho(a, plantas).map((p) => p.id)).toEqual(['p3']);
  });

  it('só espécie que ninguém mais tem: nenhuma planta (não vira "todas")', () => {
    expect(plantasDoAtalho(atalho({ especieIds: ['sumiu'] }), plantas)).toEqual([]);
  });
});

describe('atividadesValidas', () => {
  const atividades = [{ id: 'adub', nome: 'Adubação' }, { id: 'rega', nome: 'Rega' }] as Atividade[];

  it('na ordem do atalho, ignorando as apagadas', () => {
    const a = atalho({ atividadeIds: ['rega', 'apagada', 'adub'] });
    expect(atividadesValidas(a, atividades).map((x) => x.id)).toEqual(['rega', 'adub']);
  });

  it('nenhuma válida: lista vazia', () => {
    expect(atividadesValidas(atalho({ atividadeIds: ['apagada'] }), atividades)).toEqual([]);
  });
});

describe('rotuloAlvo', () => {
  const nomes: Record<string, string> = { azaleia: 'Azaleia', pinheiro: 'Pinheiro negro' };
  const nome = (id: string) => nomes[id] ?? '?';

  it('sem filtros: Todas', () => {
    expect(rotuloAlvo(atalho(), nome)).toBe('Todas');
  });

  it('grupos na ordem fixa, unidos por +', () => {
    expect(rotuloAlvo(atalho({ grupos: ['RECEM_TRANSPLANTADA', 'PRE_TRANSPLANTE'] }), nome)).toBe(
      'Pré-transplante + Recém transplantada',
    );
  });

  it('grupos · espécies', () => {
    expect(rotuloAlvo(atalho({ grupos: ['PRE_TRANSPLANTE'], especieIds: ['azaleia', 'pinheiro'] }), nome)).toBe(
      'Pré-transplante · Azaleia + Pinheiro negro',
    );
  });
});

describe('tarefasDoAtalho', () => {
  const agendas = [
    agenda('atrasada', 'p1', 'adub', -30),
    agenda('em7', 'p1', 'adub', 7),
    agenda('em8', 'p1', 'adub', 8),
    agenda('outraAtividade', 'p1', 'rega', 0),
    agenda('outraPlanta', 'p2', 'adub', 0),
    agenda('feita', 'p1', 'adub', -1, 'CONCLUIDO'),
  ];

  it('pendentes das plantas e atividades, atrasadas ou em até 7 dias, mais antigas primeiro', () => {
    expect(tarefasDoAtalho(agendas, ['p1'], ['adub']).map((a) => a.id)).toEqual(['atrasada', 'em7']);
  });

  it('planta desmarcada não entra', () => {
    expect(tarefasDoAtalho(agendas, [], ['adub'])).toEqual([]);
  });
});

describe('espécies', () => {
  const especies = [{ id: 'pinheiro', nomeComum: 'Pinheiro negro', nomeCientifico: 'Pinus thunbergii' }] as Especie[];
  const comEspecie = [
    planta('a', 1, { especieId: 'azaleia', especie: { nomeComum: 'Azaleia', nomeCientifico: null } }),
    planta('b', 2, { especieId: 'pinheiro', especie: { nomeComum: 'Pinheiro negro', nomeCientifico: null } }),
    planta('c', 3),
  ];

  it('nome pela coleção, depois pelo catálogo, senão desconhecida', () => {
    const nome = nomesDeEspecies(comEspecie.slice(0, 1), especies);
    expect(nome('azaleia')).toBe('Azaleia');
    expect(nome('pinheiro')).toBe('Pinheiro negro');
    expect(nome('sumiu')).toBe('Espécie desconhecida');
  });

  it('opções: espécies da coleção + as já marcadas, em ordem alfabética', () => {
    const nome = nomesDeEspecies(comEspecie, especies);
    expect(opcoesEspecies(comEspecie, ['sumiu'], nome)).toEqual([
      { id: 'azaleia', nome: 'Azaleia' },
      { id: 'sumiu', nome: 'Espécie desconhecida' },
      { id: 'pinheiro', nome: 'Pinheiro negro' },
    ]);
  });
});

describe('temEspecieSemPlanta', () => {
  it('alguma espécie marcada que nenhuma planta tem: precisa do catálogo', () => {
    expect(temEspecieSemPlanta([atalho({ especieIds: ['azaleia', 'sumiu'] })], plantas)).toBe(true);
  });

  it('todas as marcadas estão na coleção, ou nenhum filtro de espécie: não precisa', () => {
    expect(temEspecieSemPlanta([atalho({ especieIds: ['azaleia', 'pinheiro'] }), atalho()], plantas)).toBe(false);
    expect(temEspecieSemPlanta([], plantas)).toBe(false);
  });
});

describe('salvarAtalho / apagarAtalho', () => {
  const a = atalho({ id: 'a' });
  const b = atalho({ id: 'b' });

  it('novo entra no fim; existente é trocado no lugar', () => {
    expect(salvarAtalho([a], b)).toEqual([a, b]);
    const a2 = atalho({ id: 'a', atividadeIds: ['rega'] });
    expect(salvarAtalho([a, b], a2)).toEqual([a2, b]);
  });

  it('apaga pelo id', () => {
    expect(apagarAtalho([a, b], 'a')).toEqual([b]);
  });
});
