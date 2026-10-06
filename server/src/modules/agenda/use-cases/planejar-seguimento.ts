import { NovaPendente, NovaRotinaDePasso, Proximo } from '../agenda.types';

export interface Seguimento {
  criarPendentes: NovaPendente[];
  criarRotinas: NovaRotinaDePasso[];
}

/** Próximos passos informados, em cada planta: avulsos viram pendentes; com `repetir`, rotinas. */
export function planejarSeguimento(plantas: string[], proximos: Proximo[]): Seguimento {
  const criarPendentes = plantas.flatMap((plantaId) =>
    proximos
      .filter((p) => !p.repetir)
      .map((p) => ({ plantaId, atividadeId: p.atividadeId, dataAgendada: new Date(p.dataAgendada) })),
  );
  const criarRotinas = plantas.flatMap((plantaId) =>
    proximos.flatMap((p) =>
      p.repetir
        ? [
            {
              plantaId,
              atividadeId: p.atividadeId,
              intervaloDias: p.repetir.intervaloDias,
              dataFim: p.repetir.dataFim ? new Date(p.repetir.dataFim) : null,
              estacoes: p.repetir.estacoes ?? [],
              dataAgendada: new Date(p.dataAgendada),
            },
          ]
        : [],
    ),
  );
  return { criarPendentes, criarRotinas };
}
