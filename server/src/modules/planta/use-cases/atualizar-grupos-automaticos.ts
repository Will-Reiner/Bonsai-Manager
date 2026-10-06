import { PlantaRepository } from '../types/planta.types';
import { planejarPreTransplante } from '../dominio/grupo';

/** Grupos automáticos, resolvidos na leitura: Recém transplantada vencida volta; Pré-transplante entra/sai pelos agendamentos. */
export async function atualizarGruposAutomaticos(repo: PlantaRepository, usuarioId: string, agora: Date): Promise<void> {
  await repo.resolverGruposVencidos(usuarioId, agora);
  const { dias, plantas, pendentes } = await repo.estadoPreTransplante(usuarioId);
  const mudancas = planejarPreTransplante(plantas, pendentes, agora, dias);
  if (mudancas.length) await repo.aplicarMudancasPre(mudancas);
}
