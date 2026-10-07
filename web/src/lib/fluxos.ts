/** Etapas de um fluxo em sequência e quantas, do início, o estado atual já libera. */
export interface Fluxo<T extends string> {
  sequencia: T[];
  alcance: number;
}

/** `ajustar` é desvio (fora da sequência): entra por link e sai com voltar. */
export type EtapaRegistrar = 'inicio' | 'triagem' | 'feito' | 'tarefas' | 'final' | 'ajustar';
export type EtapaConcluir = 'procedimento' | 'final' | 'ajustar';
export type EtapaAgendar = 'plantas' | 'cuidados' | 'quando';

/**
 * Etapa a mostrar para a pedida na URL: sem pedido → primeira; desvio permitido ou etapa liberada → ela;
 * qualquer outra (recarga, link direto, etapa que sumiu) → a última liberada.
 */
export function etapaValida<T extends string>(fluxo: Fluxo<T>, desvios: readonly T[], pedida: string | null): T {
  const { sequencia, alcance } = fluxo;
  if (pedida === null) return sequencia[0];
  if (desvios.includes(pedida as T)) return pedida as T;
  const i = sequencia.indexOf(pedida as T);
  if (i >= 0 && i < alcance) return pedida as T;
  return sequencia[Math.max(0, Math.min(alcance, sequencia.length) - 1)];
}

/** Registrar: início (fotos) → triagem (com fotos, sem planta fixa) → feito → tarefas (com candidatas) → final. */
export function fluxoRegistrar(s: {
  temFotos: boolean;
  temPlantas: boolean;
  plantaFixa: boolean;
  temTipos: boolean;
  temCandidatas: boolean;
}): Fluxo<EtapaRegistrar> {
  const sequencia: EtapaRegistrar[] = ['inicio'];
  if (s.temFotos && !s.plantaFixa) sequencia.push('triagem');
  const ateTriagem = sequencia.length;
  sequencia.push('feito');
  if (s.temCandidatas) sequencia.push('tarefas');
  sequencia.push('final');
  const alcance =
    !s.temFotos && !s.temPlantas ? 1 : !s.temPlantas ? ateTriagem : !s.temTipos ? ateTriagem + 1 : sequencia.length;
  return { sequencia, alcance };
}

/** Concluir: procedimento → final (exige ao menos uma planta marcada). */
export function fluxoConcluir(s: { temMarcadas: boolean }): Fluxo<EtapaConcluir> {
  return { sequencia: ['procedimento', 'final'], alcance: s.temMarcadas ? 2 : 1 };
}

/** Agendar: plantas (omitida com planta fixa) → cuidados → quando. */
export function fluxoAgendar(s: { plantaFixa: boolean; temPlantas: boolean; temCuidados: boolean }): Fluxo<EtapaAgendar> {
  const sequencia: EtapaAgendar[] = s.plantaFixa ? ['cuidados', 'quando'] : ['plantas', 'cuidados', 'quando'];
  const alcance = !s.temPlantas ? 1 : !s.temCuidados ? sequencia.indexOf('cuidados') + 1 : sequencia.length;
  return { sequencia, alcance };
}

/** Resumo do "Mais opções" fechado: só o que está preenchido/ativo, separado por " · ". */
export const resumoMaisOpcoes = (itens: (string | false | null | undefined)[]) =>
  itens.filter((i): i is string => !!i).join(' · ');
