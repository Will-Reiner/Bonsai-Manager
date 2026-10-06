import { aplicarTransplante } from '../../planta/dominio/grupo';
import { AtualizacaoGrupo, ConclusaoRepository } from '../agenda.types';

/** Plantas com Transplante entre os cuidados vão para Recém transplantada (prazo da preferência). */
export async function planejarGruposDoTransplante(
  repo: Pick<ConclusaoRepository, 'transplanteDasPlantas'>,
  cuidados: { plantaId: string; atividadeIds: string[] }[],
  usuarioId: string,
  data: Date,
): Promise<AtualizacaoGrupo[]> {
  const { atividadeId, dias, plantas } = await repo.transplanteDasPlantas(
    cuidados.map((c) => c.plantaId),
    usuarioId,
  );
  if (!atividadeId) return [];
  const transplantadas = new Set(cuidados.filter((c) => c.atividadeIds.includes(atividadeId)).map((c) => c.plantaId));
  return plantas
    .filter((p) => transplantadas.has(p.plantaId))
    .map((p) => ({ plantaId: p.plantaId, ...aplicarTransplante(p, data, dias) }));
}
