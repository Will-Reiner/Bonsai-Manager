/**
 * Instrução do agendamento (`Agenda.detalhes` da pendente) ao concluir/registrar:
 * a Descrição já vem preenchida com ela; sem mudança, a tarefa mantém a instrução; editada, o texto substitui.
 */

const textos = (tarefas: { detalhes?: string | null }[]) => [
  ...new Set(tarefas.map((t) => t.detalhes?.trim()).filter((x): x is string => !!x)),
];

/** O que pré-preencher: uma instrução só (as demais sem) → geral; diferentes → por chave (tarefa ou planta) quando a chave tem uma só. */
export function preencherInstrucoes<T extends { detalhes?: string | null }>(
  tarefas: T[],
  chave: (t: T) => string,
): { geral: string; porChave: Record<string, string> } {
  const todos = textos(tarefas);
  if (todos.length <= 1) return { geral: todos[0] ?? '', porChave: {} };

  const grupos = new Map<string, T[]>();
  for (const t of tarefas) grupos.set(chave(t), [...(grupos.get(chave(t)) ?? []), t]);
  const porChave: Record<string, string> = {};
  for (const [k, ts] of grupos) {
    const doGrupo = textos(ts);
    if (doGrupo.length === 1) porChave[k] = doGrupo[0];
  }
  return { geral: '', porChave };
}

/** undefined = não mexeu (mantém a instrução); '' = apagou; texto = substitui. */
export function textoEditado(valor: string, preenchido: string): string | undefined {
  const v = valor.trim();
  return v === preenchido.trim() ? undefined : v;
}

export interface CampoDescricao {
  valor: string;
  preenchido: string;
}

/**
 * Descrição de uma tarefa/planta com ajuste próprio sobre o geral: o texto próprio editado vence;
 * o próprio pré-preenchido sem mudança mantém a instrução (`omitir` = não envia, `reenviar` = envia a própria
 * instrução, para o geral do servidor não sobrescrever); vazio ou apagado segue o geral.
 */
export function detalhesFinais(proprio: CampoDescricao, geral: CampoDescricao, manter: 'omitir' | 'reenviar'): string | undefined {
  const p = textoEditado(proprio.valor, proprio.preenchido);
  if (p) return p;
  if (p === undefined && proprio.preenchido.trim()) return manter === 'reenviar' ? proprio.preenchido.trim() : undefined;
  return textoEditado(geral.valor, geral.preenchido);
}

/** Dica do campo Descrição conforme o que veio pré-preenchido. */
export function dicaDescricao(instrucoes: { geral: string; porChave: Record<string, string> }) {
  if (instrucoes.geral) return 'Veio da observação do agendamento: deixe como está para manter ou escreva para substituir.';
  if (Object.keys(instrucoes.porChave).length) return 'Cada tarefa mantém a própria observação do agendamento; para mudar, use Ajustar plantas.';
  return undefined;
}
