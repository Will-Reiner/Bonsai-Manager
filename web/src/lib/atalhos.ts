import { GRUPOS_PLANTA, type Agenda, type Atividade, type Especie, type GrupoPlanta, type Planta } from '@/types';
import { candidatasReconciliacao } from './cuidados';
import { especieNome } from './format';

/** Preferência `atalhos_bancada`: atalhos do Acesso rápido da Bancada, salvos como JSON. */
export const CHAVE_ATALHOS = 'atalhos_bancada';
/** O atalho conclui as pendentes atrasadas ou que vencem em até 7 dias (as mais distantes são o próximo ciclo). */
export const JANELA_ATALHO_DIAS = 7;

/** Atalho: registrar estas atividades nas plantas destes grupos e/ou espécies (lista vazia = sem filtro). */
export interface Atalho {
  id: string;
  atividadeIds: string[];
  grupos: GrupoPlanta[];
  especieIds: string[];
}

const GRUPOS = new Set<string>(GRUPOS_PLANTA.map((g) => g.value));
const textos = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Atalhos salvos; valor ausente ou quebrado → nenhum; itens sem id ou valores estranhos são descartados. */
export function lerAtalhos(texto: string | undefined): Atalho[] {
  let valor: unknown;
  try {
    valor = JSON.parse(texto || '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item): Atalho[] => {
    if (!item || typeof item !== 'object') return [];
    const o = item as Record<string, unknown>;
    if (typeof o.id !== 'string' || !o.id) return [];
    return [
      {
        id: o.id,
        atividadeIds: textos(o.atividadeIds),
        grupos: textos(o.grupos).filter((g): g is GrupoPlanta => GRUPOS.has(g)),
        especieIds: textos(o.especieIds),
      },
    ];
  });
}

/** Plantas do atalho agora: em algum dos grupos E de alguma das espécies (filtro vazio não filtra); por número. */
export function plantasDoAtalho(atalho: Atalho, plantas: Planta[]): Planta[] {
  return plantas
    .filter(
      (p) =>
        (!atalho.grupos.length || (!!p.grupo && atalho.grupos.includes(p.grupo))) &&
        (!atalho.especieIds.length || (!!p.especieId && atalho.especieIds.includes(p.especieId))),
    )
    .sort((a, b) => a.identificador - b.identificador);
}

/** Atividades do atalho que ainda existem, na ordem do atalho. Nenhuma → atalho inválido. */
export function atividadesValidas(atalho: Atalho, atividades: Atividade[]): Atividade[] {
  return atalho.atividadeIds.flatMap((id) => atividades.filter((a) => a.id === id));
}

/** "Todas" · "Pré-transplante + Recém transplantada" · "Pré-transplante · Azaleia + Pinheiro negro". */
export function rotuloAlvo(atalho: Atalho, nomeEspecie: (id: string) => string): string {
  const grupos = GRUPOS_PLANTA.filter((g) => atalho.grupos.includes(g.value))
    .map((g) => g.label)
    .join(' + ');
  const especies = atalho.especieIds.map(nomeEspecie).join(' + ');
  return [grupos, especies].filter(Boolean).join(' · ') || 'Todas';
}

/** Pendentes que o atalho conclui: plantas marcadas × atividades, atrasadas ou em até 7 dias. */
export function tarefasDoAtalho(agendas: Agenda[], plantaIds: string[], atividadeIds: string[]): Agenda[] {
  return candidatasReconciliacao(
    agendas,
    plantaIds.map((plantaId) => ({ plantaId, atividadeIds })),
    JANELA_ATALHO_DIAS,
  );
}

/** Nome da espécie pelo id: primeiro o que vem nas plantas, depois o catálogo. */
export function nomesDeEspecies(plantas: Planta[], especies: Especie[]): (id: string) => string {
  const mapa = new Map<string, string>();
  for (const e of especies) mapa.set(e.id, especieNome(e));
  for (const p of plantas) if (p.especieId && p.especie) mapa.set(p.especieId, especieNome(p.especie));
  return (id) => mapa.get(id) ?? especieNome(null);
}

/** Chips de espécie: as da coleção mais as já marcadas (para poder desmarcar), em ordem alfabética. */
export function opcoesEspecies(plantas: Planta[], selecionadas: string[], nomeEspecie: (id: string) => string) {
  const ids = new Set([...plantas.flatMap((p) => (p.especieId ? [p.especieId] : [])), ...selecionadas]);
  return [...ids].map((id) => ({ id, nome: nomeEspecie(id) })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** Atalho novo vai para o fim; existente é trocado no mesmo lugar. */
export const salvarAtalho = (lista: Atalho[], atalho: Atalho) =>
  lista.some((a) => a.id === atalho.id) ? lista.map((a) => (a.id === atalho.id ? atalho : a)) : [...lista, atalho];

export const apagarAtalho = (lista: Atalho[], id: string) => lista.filter((a) => a.id !== id);
