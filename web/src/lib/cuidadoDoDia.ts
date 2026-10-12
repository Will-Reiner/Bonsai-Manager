import { grupoLabel, toDateInput } from './format';
import { linhaDoTempo, type ItemLinha } from './linhaDoTempo';
import type { TextoDoCuidado } from './endpoints';
import type { Agenda, Planta } from '@/types';

/** Cuidado do dia: tarefas concluídas da planta num dia (o card do histórico). */
export type Cuidado = Extract<ItemLinha, { tipo: 'cuidado' }>;

/** Cuidados feitos da planta, do mais antigo ao mais novo (só os das tarefas, sem fotos avulsas). */
export function cuidadosDaPlanta(agendas: Agenda[], plantaId: string): Cuidado[] {
  return linhaDoTempo(agendas.filter((a) => a.plantaId === plantaId)).passado.filter(
    (i): i is Cuidado => i.tipo === 'cuidado',
  );
}

export const indiceDoCuidado = (cuidados: Cuidado[], agendaId: string) =>
  cuidados.findIndex((c) => c.agendas.some((a) => a.id === agendaId));

/** Depois de excluir o cuidado `indice`: o anterior, senão o seguinte (id da 1ª tarefa); null se não sobrar nenhum. */
export function vizinhoAposExcluir(cuidados: Cuidado[], indice: number): string | null {
  return (cuidados[indice - 1] ?? cuidados[indice + 1])?.agendas[0].id ?? null;
}

export type CampoTexto = 'detalhes' | 'observacaoFutura';

/** Formulário de um texto do card: um campo para todas (`unico`) ou um por tarefa. */
export interface FormTexto {
  unico: boolean;
  valor: string;
  porTarefa: Record<string, string>;
}

const textoDe = (a: Agenda, campo: CampoTexto) => (a[campo] ?? '').trim();

/** Textos iguais (ou todos vazios) → um campo só; diferentes → um por tarefa. */
export function formTexto(agendas: Agenda[], campo: CampoTexto): FormTexto {
  const textos = agendas.map((a) => textoDe(a, campo));
  return {
    unico: new Set(textos).size <= 1,
    valor: textos[0] ?? '',
    porTarefa: Object.fromEntries(agendas.map((a) => [a.id, textoDe(a, campo)])),
  };
}

/** `textos` do PUT: só tarefas que ficam e só campos que mudaram; texto vazio vira null (apaga). */
export function textosAlterados(ficam: Agenda[], forms: Record<CampoTexto, FormTexto>): TextoDoCuidado[] {
  return ficam.flatMap((a) => {
    const item: TextoDoCuidado = { agendaId: a.id };
    for (const campo of ['detalhes', 'observacaoFutura'] as const) {
      const f = forms[campo];
      const novo = (f.unico ? f.valor : (f.porTarefa[a.id] ?? '')).trim();
      if (novo !== textoDe(a, campo)) item[campo] = novo || null;
    }
    return Object.keys(item).length > 1 ? [item] : [];
  });
}

/** Outro cuidado da planta no dia `dataInput` (AAAA-MM-DD): mudar a data para lá junta os dois. */
export function cuidadoNoDia(cuidados: Cuidado[], dataInput: string, atual: Cuidado): Cuidado | null {
  return cuidados.find((c) => c !== atual && toDateInput(c.data) === dataInput) ?? null;
}

/** Texto da confirmação de excluir; avisa a volta de grupo quando o Transplante de origem está no card. */
export function textoExcluirCuidado(
  n: number,
  planta: Pick<Planta, 'grupo' | 'grupoAnterior' | 'transplanteAgendaId'> | undefined,
  ids: string[],
): string {
  const base = `${n === 1 ? 'A tarefa some' : `As ${n} tarefas somem`} do histórico. As fotos continuam na galeria da planta.`;
  const volta =
    planta?.grupo === 'RECEM_TRANSPLANTADA' && !!planta.transplanteAgendaId && ids.includes(planta.transplanteAgendaId);
  if (!volta) return base;
  return planta.grupoAnterior
    ? `${base} A planta volta para ${grupoLabel(planta.grupoAnterior)}.`
    : `${base} A planta sai de Recém transplantada.`;
}
