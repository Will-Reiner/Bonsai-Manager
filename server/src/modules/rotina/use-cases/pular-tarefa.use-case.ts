import { proximaDataRotina } from '../../agenda/dominio/rotina';
import { RotinaRepository } from '../rotina.types';

/** "Pular esta vez": cancela a pendente (pulada) e agenda a próxima a partir de hoje. */
export class PularTarefaUseCase {
  constructor(private repo: Pick<RotinaRepository, 'findPendenteComRotina' | 'pular'>) {}

  async execute(agendaId: string, usuarioId: string): Promise<{ proxima: boolean }> {
    const pendente = await this.repo.findPendenteComRotina(agendaId, usuarioId);
    if (!pendente) throw new Error('Acesso negado ou agendamento não encontrado.');
    const { rotina } = pendente;
    if (!rotina) throw new Error('Só tarefas de rotina podem ser puladas.');

    const data = rotina.pausada ? null : proximaDataRotina(rotina, new Date());
    await this.repo.pular(
      agendaId,
      data ? { rotinaId: rotina.id, plantaId: rotina.plantaId, atividadeId: rotina.atividadeId, dataAgendada: data } : null,
    );
    return { proxima: !!data };
  }
}
