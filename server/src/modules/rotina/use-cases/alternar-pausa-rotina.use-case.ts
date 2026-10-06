import { proximaDataRotina } from '../../agenda/dominio/rotina';
import { AjustePendente, RotinaRepository } from '../rotina.types';

/** Pausar cancela a pendente; retomar (ou "agendar próxima" de rotina sem pendente) gera a partir de hoje. */
export class AlternarPausaRotinaUseCase {
  constructor(private repo: RotinaRepository) {}

  async execute(id: string, pausada: boolean, usuarioId: string) {
    const rotina = await this.repo.findDoUsuario(id, usuarioId);
    if (!rotina) throw new Error('Rotina não encontrada.');

    let ajuste: AjustePendente = { tipo: 'manter' };
    if (pausada) {
      if (rotina.pendenteId) ajuste = { tipo: 'cancelar', agendaId: rotina.pendenteId };
    } else if (!rotina.pendenteId) {
      const data = proximaDataRotina(rotina, new Date());
      if (data) ajuste = { tipo: 'criar', data };
    }
    return this.repo.atualizar(id, { pausada }, ajuste);
  }
}
